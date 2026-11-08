import { Request, Response, Router } from "express";
import vine, { errors } from "@vinejs/vine";
import {
    COMMENT_REPORT_REASONS,
    COMMENT_SORTS,
    CommentRole,
    DEFAULT_COMMENT_SORT,
    LoginUser,
    MAX_COMMENT_LENGTH,
    MAX_COMMENT_MODERATION_REASON_LENGTH,
    ReplayComment
} from "shared";
import { AuthClient } from "../auth.js";
import { GlobalsClient } from "../globals.js";
import { rateLimiterMiddleware } from "../middleware.js";
import { broadcastComment, broadcastCommentLikes, broadcastCommentRemoved } from "../replayStream.js";
import { getTimeById } from "../strafes_api/api.js";
import { currentRunOf } from "../replayRuns.js";
import { setUserInfoForList } from "../users.js";
import * as validators from "../validators.js";
import {
    CommentChange,
    CommentResult,
    deleteComment,
    getCommentsForReplay,
    getCommentState,
    getPublicComment,
    moderateComment,
    postComment,
    reportComment,
    setCommentHidden,
    setCommentLike
} from "./comments.js";
import { banUser, getModerationLog, getModerationQueue, listActiveBans, searchComments, unbanUser } from "./moderation.js";
import { logEntryUsers, modCommentUsers, setModUserInfo } from "./modUsers.js";
import { getCommentRole, grantModerator, hasRole, isConfigAdmin, listModerators, revokeModerator } from "./roles.js";

const SEARCH_PAGE_SIZE = 50;
const LOG_PAGE_SIZE = 100;

// Comment and time IDs stay strings, since they can be too big for a JS number
const idString = () => vine.string().regex(/^\d{1,20}$/);
const userId = () => vine.number().withoutDecimals().positive();
const moderationReason = () => vine.string().trim().maxLength(MAX_COMMENT_MODERATION_REASON_LENGTH);

const commentIdParamValidator = vine.create({ id: idString() });

const commentListValidator = vine.create({
    sort: vine.enum(COMMENT_SORTS).optional()
});
const userIdParamValidator = vine.create({ userId: userId() });

const postCommentValidator = vine.create({
    timeId: idString(),
    // Generous here, since the real limit is checked after the text is cleaned up
    body: vine.string().maxLength(MAX_COMMENT_LENGTH * 4),
    replaySeconds: vine.number().withoutDecimals().min(0).optional(),
    parentId: idString().optional()
});

const likeValidator = vine.create({
    commentId: idString(),
    active: vine.boolean()
});

const reportValidator = vine.create({
    commentId: idString(),
    reason: vine.enum(COMMENT_REPORT_REASONS),
    note: vine.string().maxLength(1000).optional()
});

const hideValidator = vine.create({
    commentId: idString(),
    hidden: vine.boolean(),
    reason: moderationReason().optional()
});

const resolveValidator = vine.create({
    commentId: idString(),
    action: vine.enum(["approve", "hide", "dismiss"] as const),
    reason: moderationReason().optional()
});

const searchValidator = vine.create({
    userId: userId().optional(),
    timeId: idString().optional(),
    status: vine.enum(["visible", "pending", "hidden", "deleted"] as const).optional(),
    page: vine.number().withoutDecimals().range([1, 10000]).optional()
});

const pageValidator = vine.create({
    page: vine.number().withoutDecimals().range([1, 10000]).optional()
});

const banValidator = vine.create({
    userId: userId(),
    reason: moderationReason().minLength(1),
    // Unset for a permanent ban
    days: vine.number().withoutDecimals().range([1, 3650]).optional()
});

const grantValidator = vine.create({
    userId: userId(),
    role: vine.enum(["moderator", "admin"] as const)
});

export function createCommentRouter(globalsClient: GlobalsClient, authClient: AuthClient) {
    const router = Router();

    // Helpers

    /** Validates, or sends a 400 and returns undefined. */
    async function validate<T>(validator: { tryValidate: (data: unknown) => Promise<[unknown, T | undefined]> }, data: unknown, res: Response): Promise<T | undefined> {
        const [error, result] = await validator.tryValidate(data);
        if (error || result === undefined) {
            res.status(400).json({ error: error instanceof errors.E_VALIDATION_ERROR ? error.messages : "Invalid input" });
            return undefined;
        }
        return result;
    }

    async function requireUser(req: Request, res: Response): Promise<LoginUser | undefined> {
        const user = await authClient.getAuthenticatedUser(req, res);
        if (!user) {
            res.status(401).json({ error: "You are not logged in" });
            return undefined;
        }
        return user;
    }

    async function requireModerator(req: Request, res: Response, needed: CommentRole = "moderator"): Promise<{ user: LoginUser, role: CommentRole } | undefined> {
        const user = await requireUser(req, res);
        if (!user) {
            return undefined;
        }
        const role = await getCommentRole(globalsClient, user.userId);
        if (!role || !hasRole(role, needed)) {
            res.status(403).json({ error: needed === "admin" ? "Only admins can do that" : "Only moderators can do that" });
            return undefined;
        }
        // So their name shows up in the moderation log
        if (user.username) {
            await globalsClient.upsertUser(user.userId, user.username);
        }
        return { user: user, role: role };
    }

    /** Sends the error, or returns the value. */
    function unwrap<T>(result: CommentResult<T>, res: Response): result is { ok: true, value: T } {
        if (!result.ok) {
            res.status(result.status).json({ error: result.error, bannedUntil: result.bannedUntil });
            return false;
        }
        return true;
    }

    async function withUserInfo(comments: ReplayComment[]) {
        const all = comments.flatMap((comment) => [comment, ...comment.replies]).filter((comment) => !comment.removed);
        await setUserInfoForList(authClient, all);
    }

    /** Tells everyone watching the replay about a comment that appeared or disappeared. */
    async function publishChange(change: CommentChange | undefined) {
        if (!change) {
            return;
        }
        const wasVisible = change.before === "visible";
        const isVisible = change.after === "visible";
        if (wasVisible && !isVisible) {
            broadcastCommentRemoved(change.timeId, change.commentId);
        }
        else if (!wasVisible && isVisible) {
            // Could be an old comment being approved or unhidden, so it still needs marking
            const time = await getTimeById(change.timeId);
            const comment = await getPublicComment(globalsClient, change.commentId, time ? currentRunOf(time) : undefined);
            if (comment) {
                await withUserInfo([comment]);
                broadcastComment(comment);
            }
        }
    }

    // Replay page

    router.get("/api/replays/times/:id/comments", rateLimiterMiddleware(0.5), async (req, res) => {
        const params = await validate(validators.idValidator, req.params, res);
        if (!params) return;
        const query = await validate(commentListValidator, req.query, res);
        if (!query) return;

        const timeId = req.params.id as string;
        // Not cached, since what's included depends on who's asking. The time can be the cached copy, the same one
        // the replay page gets, so comments are marked against the run the page is showing.
        const [user, time] = await Promise.all([authClient.getAuthenticatedUser(req, res), getTimeById(timeId)]);
        const viewer = user ? { userId: user.userId, role: await getCommentRole(globalsClient, user.userId) } : undefined;
        const currentRun = time ? currentRunOf(time) : undefined;
        const comments = await getCommentsForReplay(globalsClient, timeId, viewer, query.sort ?? DEFAULT_COMMENT_SORT, currentRun);
        await withUserInfo(comments.comments);

        res.status(200).json(comments);
    });

    router.post("/api/auth/comments", rateLimiterMiddleware(1), async (req, res) => {
        const input = await validate(postCommentValidator, req.body, res);
        if (!input) return;
        const user = await requireUser(req, res);
        if (!user) return;

        const result = await postComment(globalsClient, user, input);
        if (!unwrap(result, res)) return;

        const comment = result.value;
        await withUserInfo([comment]);
        if (comment.status === "visible") {
            broadcastComment({ ...comment, liked: false, reported: false });
        }
        res.status(200).json(comment);
    });

    router.delete("/api/auth/comments/:id", rateLimiterMiddleware(0.5), async (req, res) => {
        const params = await validate(commentIdParamValidator, req.params, res);
        if (!params) return;
        const user = await requireUser(req, res);
        if (!user) return;

        const result = await deleteComment(globalsClient, user, params.id);
        if (!unwrap(result, res)) return;

        await publishChange(result.value);
        res.status(200).json({ success: true });
    });

    router.post("/api/auth/comments/likes", rateLimiterMiddleware(0.2), async (req, res) => {
        const input = await validate(likeValidator, req.body, res);
        if (!input) return;
        const user = await requireUser(req, res);
        if (!user) return;

        const result = await setCommentLike(globalsClient, user, input.commentId, input.active);
        if (!unwrap(result, res)) return;

        broadcastCommentLikes(globalsClient, result.value.timeId, input.commentId);
        res.status(200).json({ commentId: input.commentId, likes: result.value.likes, liked: input.active });
    });

    router.post("/api/auth/comments/reports", rateLimiterMiddleware(0.5), async (req, res) => {
        const input = await validate(reportValidator, req.body, res);
        if (!input) return;
        const user = await requireUser(req, res);
        if (!user) return;

        const result = await reportComment(globalsClient, user, input.commentId, input.reason, input.note);
        if (!unwrap(result, res)) return;

        await publishChange(result.value);
        res.status(200).json({ success: true });
    });

    // For the runner on their own replay, and moderators anywhere
    router.post("/api/auth/comments/hide", rateLimiterMiddleware(0.5), async (req, res) => {
        const input = await validate(hideValidator, req.body, res);
        if (!input) return;
        const user = await requireUser(req, res);
        if (!user) return;

        const role = await getCommentRole(globalsClient, user.userId);
        if (role && user.username) {
            await globalsClient.upsertUser(user.userId, user.username);
        }
        const result = await setCommentHidden(globalsClient, { userId: user.userId, role: role }, input.commentId, input.hidden, input.reason);
        if (!unwrap(result, res)) return;

        await publishChange(result.value);
        res.status(200).json({ success: true });
    });

    // Moderation portal

    router.get("/api/mod/queue", rateLimiterMiddleware(0.5), async (req, res) => {
        if (!await requireModerator(req, res)) return;
        const comments = await getModerationQueue(globalsClient);
        await setModUserInfo(authClient, comments.flatMap(modCommentUsers));
        res.status(200).json({ comments: comments });
    });

    router.get("/api/mod/comments", rateLimiterMiddleware(0.5), async (req, res) => {
        const query = await validate(searchValidator, req.query, res);
        if (!query) return;
        if (!await requireModerator(req, res)) return;

        const result = await searchComments(globalsClient, query, query.page ?? 1, SEARCH_PAGE_SIZE);
        await setModUserInfo(authClient, result.comments.flatMap(modCommentUsers));
        res.status(200).json({ ...result, page: query.page ?? 1, pageSize: SEARCH_PAGE_SIZE });
    });

    router.post("/api/mod/comments/resolve", rateLimiterMiddleware(0.5), async (req, res) => {
        const input = await validate(resolveValidator, req.body, res);
        if (!input) return;
        const moderator = await requireModerator(req, res);
        if (!moderator) return;

        const comment = await getCommentState(globalsClient, input.commentId);
        if (!comment) {
            res.status(404).json({ error: "Comment not found" });
            return;
        }
        const result = await moderateComment(globalsClient, moderator.user.userId, comment, input.action, input.reason);
        if (!unwrap(result, res)) return;

        await publishChange(result.value);
        res.status(200).json({ success: true });
    });

    router.get("/api/mod/log", rateLimiterMiddleware(0.5), async (req, res) => {
        const query = await validate(pageValidator, req.query, res);
        if (!query) return;
        if (!await requireModerator(req, res)) return;

        const page = query.page ?? 1;
        const entries = await getModerationLog(globalsClient, page, LOG_PAGE_SIZE);
        await setModUserInfo(authClient, entries.flatMap(logEntryUsers));
        res.status(200).json({ entries: entries, page: page, pageSize: LOG_PAGE_SIZE });
    });

    router.get("/api/mod/bans", rateLimiterMiddleware(0.5), async (req, res) => {
        if (!await requireModerator(req, res)) return;
        const bans = await listActiveBans(globalsClient);
        await setModUserInfo(authClient, bans.flatMap((ban) => [ban.user, ban.bannedBy]));
        res.status(200).json({ bans: bans });
    });

    router.post("/api/mod/bans", rateLimiterMiddleware(0.5), async (req, res) => {
        const input = await validate(banValidator, req.body, res);
        if (!input) return;
        const moderator = await requireModerator(req, res);
        if (!moderator) return;

        if (input.userId === moderator.user.userId) {
            res.status(400).json({ error: "You can't ban yourself" });
            return;
        }
        const targetRole = await getCommentRole(globalsClient, input.userId);
        if (isConfigAdmin(input.userId) || (targetRole && moderator.role !== "admin")) {
            res.status(403).json({ error: "You can't ban this moderator" });
            return;
        }

        await banUser(globalsClient, moderator.user.userId, input.userId, input.reason, input.days);
        res.status(200).json({ success: true });
    });

    router.delete("/api/mod/bans/:userId", rateLimiterMiddleware(0.5), async (req, res) => {
        const params = await validate(userIdParamValidator, req.params, res);
        if (!params) return;
        const moderator = await requireModerator(req, res);
        if (!moderator) return;

        if (!await unbanUser(globalsClient, moderator.user.userId, params.userId)) {
            res.status(404).json({ error: "This user isn't banned" });
            return;
        }
        res.status(200).json({ success: true });
    });

    router.get("/api/mod/moderators", rateLimiterMiddleware(0.5), async (req, res) => {
        if (!await requireModerator(req, res)) return;
        const moderators = await listModerators(globalsClient);
        await setModUserInfo(authClient, moderators.map((moderator) => moderator.user));
        res.status(200).json({ moderators: moderators });
    });

    router.post("/api/mod/moderators", rateLimiterMiddleware(0.5), async (req, res) => {
        const input = await validate(grantValidator, req.body, res);
        if (!input) return;
        const admin = await requireModerator(req, res, "admin");
        if (!admin) return;

        if (isConfigAdmin(input.userId)) {
            res.status(400).json({ error: "This user is already an admin in the server config" });
            return;
        }
        await grantModerator(globalsClient, admin.user.userId, input.userId, input.role);
        res.status(200).json({ success: true });
    });

    router.delete("/api/mod/moderators/:userId", rateLimiterMiddleware(0.5), async (req, res) => {
        const params = await validate(userIdParamValidator, req.params, res);
        if (!params) return;
        const admin = await requireModerator(req, res, "admin");
        if (!admin) return;

        if (!await revokeModerator(globalsClient, admin.user.userId, params.userId)) {
            // Group staff and config admins can't be removed from here
            res.status(404).json({ error: "This user wasn't made a moderator on the site" });
            return;
        }
        res.status(200).json({ success: true });
    });

    return router;
}
