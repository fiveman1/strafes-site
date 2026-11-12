import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import LinkRounded from "@mui/icons-material/LinkRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import LinkOffRounded from "@mui/icons-material/LinkOffRounded";
import { LinkConfirmResult, LinkPageInfo, LoginUser } from "shared";
import { confirmLink, login, logout } from "../api/api";
import { queries } from "../api/queries";
import { useLoginUser } from "../common/states";
import DiscordIcon from "./icons/DiscordIcon";
import RobloxIcon from "./icons/RobloxIcon";
import { LoadFailed, Loading } from "./moderation/common";

// The page a Discord bot's link opens. The token in the URL is the link request; the user logs in with Roblox (the
// site's normal login, which comes back here), checks which accounts they're linking, and confirms.

function AccountRow(props: { label: string, icon: (size: number) => React.ReactNode, avatarUrl?: string, name?: string, detail?: string, children?: React.ReactNode }) {
    const { label, icon, avatarUrl, name, detail, children } = props;
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: 2, border: 1, borderColor: "divider", minWidth: 0 }}>
            <Avatar src={avatarUrl} alt="" sx={{ width: 44, height: 44, bgcolor: "action.hover" }}>
                {icon(22)}
            </Avatar>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5 }}>
                    {icon(14)}{label}
                </Typography>
                {name !== undefined &&
                <Typography sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {name}
                </Typography>}
                {detail !== undefined &&
                <Typography variant="body2" sx={{ color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {detail}
                </Typography>}
                {children}
            </Box>
        </Box>
    );
}

/** Where the page ends up: linked, or a link that doesn't work */
function LinkOutcome(props: { icon: React.ReactNode, title: string, children: React.ReactNode }) {
    const { icon, title, children } = props;
    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 1.5, pt: 2 }}>
            {icon}
            <Typography variant="h6">{title}</Typography>
            <Typography sx={{ color: "text.secondary" }}>{children}</Typography>
        </Box>
    );
}

function LinkForm(props: { token: string, info: LinkPageInfo, user: LoginUser | undefined }) {
    const { token, info, user } = props;
    const theme = useTheme();
    const queryClient = useQueryClient();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>();
    const [linked, setLinked] = useState<LinkConfirmResult>();

    const iconColor = theme.palette.text.secondary;
    const discordName = info.discordUsername ? `@${info.discordUsername}` : `Discord user ${info.discordId}`;
    const path = window.location.pathname.slice(1);

    // Roblox's login always lets them pick which account, so switching is logging out here and in again
    const onLogin = async (switchAccount: boolean) => {
        setBusy(true);
        if (switchAccount) {
            await logout();
            queryClient.removeQueries({ queryKey: queries.auth.user.queryKey });
        }
        const url = await login(path);
        if (url) {
            window.location.href = url; // Force external redirect
        }
        else {
            setBusy(false);
            setError("Couldn't start logging in, try again");
        }
    };

    const onConfirm = async () => {
        setBusy(true);
        setError(undefined);
        const result = await confirmLink(token);
        setBusy(false);
        if (result.ok) {
            setLinked(result.data);
        }
        else {
            setError(result.error);
            // If the link stopped working (it expired, or was used or replaced in the meantime), this swaps the form
            // for the page's expired message rather than leaving a button that can only fail
            queryClient.invalidateQueries({ queryKey: queries.link.request(token).queryKey });
        }
    };

    if (linked) {
        return (
            <LinkOutcome icon={<CheckCircleRounded color="success" sx={{ fontSize: 48 }} />} title="Linked">
                {discordName} is now linked to <b>{linked.robloxUsername}</b> on Roblox. You can close this page and go back
                to Discord.
            </LinkOutcome>
        );
    }

    const sameAccount = user !== undefined && info.currentRobloxId === user.userId;
    const replacing = user !== undefined && info.currentRobloxId !== undefined && !sameAccount;
    const currentName = info.currentRobloxUsername ?? `Roblox user ${info.currentRobloxId}`;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography sx={{ color: "text.secondary" }}>
                <b>{info.appName}</b> wants to link a Discord account to your Roblox account. Only continue if you asked
                for this link in Discord yourself, and the Discord account below is yours.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "stretch" }}>
                <AccountRow
                    label="Discord"
                    icon={(size) => <DiscordIcon size={size} color={iconColor} />}
                    avatarUrl={info.discordAvatarUrl}
                    name={discordName}
                    detail={info.discordUsername ? `ID ${info.discordId}` : undefined}
                />
                <Box sx={{ display: "flex", justifyContent: "center", color: "text.secondary" }}>
                    <LinkRounded />
                </Box>
                {user ?
                <AccountRow
                    label="Roblox"
                    icon={(size) => <RobloxIcon size={size} color={iconColor} />}
                    avatarUrl={user.thumbnailUrl}
                    name={user.displayName}
                    detail={`@${user.username}`}
                />
                :
                <AccountRow label="Roblox" icon={(size) => <RobloxIcon size={size} color={iconColor} />}>
                    <Button variant="outlined" size="small" sx={{ mt: 0.5 }} disabled={busy} onClick={() => onLogin(false)}>
                        Log in with Roblox
                    </Button>
                </AccountRow>}
            </Box>

            {replacing &&
            <Alert severity="warning">
                This Discord account is linked to <b>{currentName}</b> now. Linking it to {user.username} replaces that.
            </Alert>}
            {sameAccount &&
            <Alert severity="info">
                This Discord account is already linked to {user.username}. Linking again won't change anything.
            </Alert>}
            {error && <Alert severity="error">{error}</Alert>}

            {user &&
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", alignItems: "center" }}>
                <Button size="small" disabled={busy} onClick={() => onLogin(true)}>
                    Use a different Roblox account
                </Button>
                <Button variant="contained" disabled={busy} onClick={onConfirm}>
                    Link accounts
                </Button>
            </Box>}
        </Box>
    );
}

function LinkAccount() {
    const { token } = useParams();
    const loginUserQuery = useLoginUser();
    const requestQuery = useQuery({ ...queries.link.request(token ?? ""), enabled: token !== undefined });
    const info = requestQuery.data;

    useEffect(() => {
        document.title = "link account - strafes";
    }, []);

    let content: React.ReactNode;
    if (requestQuery.isPending || loginUserQuery.isPending) {
        content = <Loading />;
    }
    else if (requestQuery.isError) {
        content = <LoadFailed what="this link" query={requestQuery} />;
    }
    else if (!info) {
        content = (
            <LinkOutcome icon={<LinkOffRounded sx={{ fontSize: 48, color: "text.secondary" }} />} title="This link doesn't work anymore">
                It expired, was already used, or a newer link replaced it. Ask the bot for a new one.
            </LinkOutcome>
        );
    }
    else {
        content = <LinkForm token={token!} info={info} user={loginUserQuery.data ?? undefined} />;
    }

    return (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1, flexGrow: 1, pt: { xs: 0.5, sm: 4 } }}>
            <Paper elevation={0} sx={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "520px", alignSelf: "flex-start", p: { xs: 2, sm: 3 }, gap: 2 }}>
                <Typography component="h1" variant="h5">
                    Link your Discord account
                </Typography>
                {content}
            </Paper>
        </Box>
    );
}

export default LinkAccount;
