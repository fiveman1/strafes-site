import { Request, Response, Router } from "express";
import vine, { errors } from "@vinejs/vine";
import { LinkConfirmResult, LinkPageInfo } from "shared";
import { AuthClient } from "../auth.js";
import { rateLimiterMiddleware } from "../middleware.js";
import { tryGetCached } from "../requests.js";
import { UpstreamFailure } from "../upstream.js";
import { IS_DEV_MODE } from "../util.js";
import { LinksClient } from "./db.js";
import { Permission } from "./keys.js";
import { apiRateLimit, getApiKey, loadApiKey, parseDiscordId, parseRobloxId, requirePermission, sendApiError, setApiFormat } from "./middleware.js";
import { sendWebhook } from "./webhooks.js";

const createLinkRequestValidator = vine.create({
    // A string, since Discord IDs are too big for a JS number
    discordId: vine.string().regex(/^\d{1,20}$/),
    discordUsername: vine.string().trim().minLength(1).maxLength(64).optional(),
    discordAvatarUrl: vine.string().maxLength(255).regex(/^https:\/\/(cdn|media)\.discordapp\.(com|net)\//).optional()
});

const linkTokenValidator = vine.create({
    token: vine.string().regex(/^[A-Za-z0-9_-]{20,100}$/)
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function validationMessage(error: unknown) {
    if (error instanceof errors.E_VALIDATION_ERROR) {
        const messages = error.messages as { field: string, message: string }[];
        return messages.map((message) => message.message).join(" ");
    }
    return "Invalid input";
}

/** The Roblox username, or undefined if Roblox couldn't say */
async function getRobloxUsername(robloxId: number) {
    const res = await tryGetCached("Roblox", "https://users.roblox.com/v1/users/" + robloxId);
    if (!res || res instanceof UpstreamFailure) {
        return undefined;
    }
    return (res.data as { name?: string }).name;
}

/** The public API, under /public-api/v1. See server/openapi/openapi.yaml. */
export function createLinksApiRouter(links: LinksClient, baseURL: string) {
    const router = Router();
    router.use(setApiFormat("v1"), loadApiKey(links), apiRateLimit);

    router.get("/links/discord/:discordId", async (req, res) => {
        const discordId = parseDiscordId(req.params.discordId);
        if (!discordId) {
            sendApiError(res, 400, "bad_request", "discordId must be a Discord user ID.");
            return;
        }

        const link = await links.getLink(discordId);
        if (!link) {
            sendApiError(res, 404, "not_found", "That Discord account isn't linked.");
            return;
        }

        res.status(200).json({
            discordId: link.discordId,
            robloxId: link.robloxId,
            linkedAt: link.linkedAt?.toISOString() ?? null
        });
    });

    router.delete("/links/discord/:discordId", requirePermission(Permission.LINK), async (req, res) => {
        const discordId = parseDiscordId(req.params.discordId);
        if (!discordId) {
            sendApiError(res, 400, "bad_request", "discordId must be a Discord user ID.");
            return;
        }

        const robloxId = await links.deleteLink(discordId);
        if (robloxId === undefined) {
            sendApiError(res, 404, "not_found", "That Discord account isn't linked.");
            return;
        }

        res.status(200).json({ discordId: discordId, robloxId: robloxId });
    });

    router.get("/links/roblox/:robloxId", requirePermission(Permission.LOOKUP), async (req, res) => {
        const robloxId = parseRobloxId(req.params.robloxId);
        if (!robloxId) {
            sendApiError(res, 400, "bad_request", "robloxId must be a Roblox user ID.");
            return;
        }

        const discordIds = await links.getDiscordIdsForRoblox(robloxId);
        res.status(200).json({ robloxId: robloxId, discordIds: discordIds });
    });

    router.post("/link-requests", requirePermission(Permission.LINK), async (req, res) => {
        const [error, result] = await createLinkRequestValidator.tryValidate(req.body ?? {});
        if (error) {
            sendApiError(res, 400, "bad_request", validationMessage(error));
            return;
        }

        const discordId = parseDiscordId(result.discordId);
        if (!discordId) {
            sendApiError(res, 400, "bad_request", "discordId must be a Discord user ID.");
            return;
        }

        const apiKey = getApiKey(res)!;
        const { request, token } = await links.createLinkRequest(apiKey.id, discordId, result.discordUsername, result.discordAvatarUrl);
        // In dev, the page is on the Vite server
        const pageBase = IS_DEV_MODE ? "http://localhost:3000" : baseURL;
        res.status(201).json({ ...request, url: `${pageBase}/link/${token}` });
    });

    router.get("/link-requests/:id", requirePermission(Permission.LINK), async (req, res) => {
        const id = req.params.id as string;
        const request = UUID_REGEX.test(id) ? await links.getLinkRequest(id, getApiKey(res)!.id) : undefined;
        if (!request) {
            sendApiError(res, 404, "not_found", "There's no link request with that ID for this API key.");
            return;
        }
        res.status(200).json(request);
    });

    // Anything else under /public-api/v1, rather than falling through to the site's HTML
    router.use((req, res) => {
        sendApiError(res, 404, "not_found", "There's no endpoint here. See /public-api/docs.");
    });

    return router;
}

/** For the site's link page (/link/:token) */
export function createLinkPageRouter(links: LinksClient, authClient: AuthClient) {
    const router = Router();

    router.get("/api/link/:token", rateLimiterMiddleware(1), async (req: Request, res: Response) => {
        res.setHeader("Cache-Control", "no-store");
        const [error, result] = await linkTokenValidator.tryValidate(req.params);
        const request = error ? undefined : await links.getPendingLinkRequest(result.token);
        if (!request) {
            res.status(404).json({ error: "This link expired or was already used. Ask for a new one." });
            return;
        }

        const current = await links.getLink(request.discordId);
        const info: LinkPageInfo = {
            appName: request.appName,
            discordId: request.discordId,
            discordUsername: request.discordUsername,
            discordAvatarUrl: request.discordAvatarUrl,
            expiresAt: request.expiresAt.toISOString()
        };
        if (current) {
            info.currentRobloxId = current.robloxId;
            info.currentRobloxUsername = await getRobloxUsername(current.robloxId);
        }
        res.status(200).json(info);
    });

    router.post("/api/link/confirm", rateLimiterMiddleware(2), async (req: Request, res: Response) => {
        const [error, result] = await linkTokenValidator.tryValidate(req.body ?? {});
        if (error) {
            res.status(400).json({ error: "Invalid input" });
            return;
        }

        const user = await authClient.getAuthenticatedUser(req, res);
        if (!user) {
            res.status(401).json({ error: "You are not logged in" });
            return;
        }

        const completed = await links.completeLinkRequest(result.token, user.userId, user.username);
        if (!completed) {
            res.status(404).json({ error: "This link expired or was already used. Ask for a new one." });
            return;
        }

        const { request, apiKey } = completed;
        sendWebhook(apiKey, "link.completed", request);

        const confirmed: LinkConfirmResult = {
            discordId: request.discordId,
            robloxId: user.userId,
            robloxUsername: user.username
        };
        if (request.previousRobloxId !== undefined && request.previousRobloxId !== user.userId) {
            confirmed.previousRobloxId = request.previousRobloxId;
        }
        res.status(200).json(confirmed);
    });

    return router;
}
