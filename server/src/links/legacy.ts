import { Router } from "express";
import { LinksClient } from "./db.js";
import { Permission } from "./keys.js";
import { apiRateLimit, legacyResponse, loadApiKey, parseDiscordId, parseRobloxId, requirePermission, sendApiError, setApiFormat } from "./middleware.js";

// rbhopdog-verify's lookups, so their callers keep working after api.fiveman1.net moves here. nginx sends
// api.fiveman1.net/v1/* to /public-api/legacy/v1/*. Same paths, response format and fields as the old Flask app (and
// keys from either header); the messages are whatever reads well. Linking through the old API (/v1/verify/*) is gone.

// The old API sent Discord IDs as JSON numbers, which a JS number can't hold exactly. rawJSON writes the digits as is.
const rawJSON = (JSON as unknown as { rawJSON: (text: string) => unknown }).rawJSON;

export function createLegacyRouter(links: LinksClient) {
    const router = Router();
    router.use(setApiFormat("legacy"), loadApiKey(links), apiRateLimit);

    router.get("/v1/users/:discordId", async (req, res) => {
        const discordId = parseDiscordId(req.params.discordId);
        const link = discordId ? await links.getLink(discordId) : undefined;
        if (!link) {
            sendApiError(res, 404, "not_found", "That Discord account isn't linked.");
            return;
        }
        legacyResponse(res, 200, undefined, { robloxId: link.robloxId });
    });

    router.get("/v1/users/from_roblox/:robloxId", requirePermission(Permission.LOOKUP), async (req, res) => {
        const robloxId = parseRobloxId(req.params.robloxId);
        const discordIds = robloxId ? await links.getDiscordIdsForRoblox(robloxId) : [];
        if (discordIds.length === 0) {
            sendApiError(res, 404, "not_found", "No Discord accounts are linked to that Roblox account.");
            return;
        }
        legacyResponse(res, 200, undefined, { discordIds: discordIds.map((id) => rawJSON(id)) });
    });

    router.all("/v1/verify/{*rest}", (req, res) => {
        sendApiError(res, 410, "gone", "Linking through this API has been replaced. See https://strafes.fiveman1.net/public-api/docs");
    });

    router.use((req, res) => {
        sendApiError(res, 404, "not_found", "There's no endpoint here. See https://strafes.fiveman1.net/public-api/docs");
    });

    return router;
}
