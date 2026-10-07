import React, { useMemo } from "react";
import { Box, Skeleton, Tooltip, Typography } from "@mui/material";
import { Game, ModerationStatus, Style, User, formatRank, formatSkill } from "shared";
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { yellow } from "@mui/material/colors";
import { useOutletContext } from "react-router";
import { ContextParams, RANK_HELP_TEXT, SKILL_HELP_TEXT } from "../../common/common";
import { useQuery } from "@tanstack/react-query";
import { queries } from "../../api/queries";

export interface IProfileCardProps {
    userId?: string
    game: Game
    style: Style
    user?: User
    userLoading: boolean
}

function ProfileCard(props: IProfileCardProps) {
    const { userId, game, style, user, userLoading } = props;
    const { mapCounts } = useOutletContext() as ContextParams;

    const { data: rank, isLoading: rankLoading } = useQuery(queries.users.rank(userId ?? "", game, style));
    const { data: comps, isLoading: compsLoading  } = useQuery(queries.users.completions(userId ?? "", game, style));
    const { data: wrs, isLoading: wrsLoading } = useQuery(queries.users.wrCount(userId ?? "", game, style));

    const compsFormatted = useMemo(() => {
        let compsFormatted = "n/a";
        if (comps !== undefined && comps !== null) {
            let count = 0;
            switch (game) {
                case Game.bhop:
                    count = mapCounts.bhop;
                    break;
                case Game.surf:
                    count = mapCounts.surf;
                    break;
                case Game.fly_trials:
                    count = mapCounts.flyTrials;
                    break;
            }

            if (count === 0) {
                compsFormatted = `${comps} / ? (?%)`;
            }
            else {
                compsFormatted = `${comps} / ${count} (${((comps / count) * 100).toFixed(1)}%)`;
            }
        }
        return compsFormatted;
    }, [comps, game, mapCounts.bhop, mapCounts.flyTrials, mapCounts.surf]);
    
    let rankFormatted = "n/a";
    let skillFormatted = "n/a";
    if (rank) {
        rankFormatted = formatRank(rank.rank);
        skillFormatted = formatSkill(rank.skill);
    }

    const formattedStatus = user?.status !== undefined ? ModerationStatus[user.status]: "n/a";
    let tooltip = "";
    switch (user?.status) {
        case ModerationStatus.Blacklisted:
            tooltip = "This status means that a user's times will not appear on the in-game leaderboards.";
            break;
        case ModerationStatus.Default:
            tooltip = "This is the status that every user starts with. Users with this status can get times like normal, but if they get a world record, their status will be set to Pending to be reviewed by the in-game moderation team.";
            break;
        case ModerationStatus.Pending:
            tooltip = "This status means that the user is pending review from the in-game moderation team. This usually happens after getting a world record for the first time. A moderator will update the status when they are done reviewing.";
            break;
        case ModerationStatus.Whitelisted:
            tooltip = "This status means that the user was approved by the in-game moderation team, and is allowed to hold world records on the in-game leaderboards.";
            break;
    }

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                columnGap: 3,
                rowGap: 2,
                width: "100%"
            }}>
            <Stat label="Rank" help={RANK_HELP_TEXT} loading={rankLoading}>
                {rankFormatted}
            </Stat>
            <Stat label="Skill" help={SKILL_HELP_TEXT} loading={rankLoading}>
                {skillFormatted}
            </Stat>
            <Stat label="Moderation status" help={tooltip} loading={userLoading}>
                {formattedStatus}
            </Stat>
            <Stat label="Completions" loading={compsLoading}>
                {compsFormatted}
            </Stat>
            <Stat label="World records" loading={wrsLoading}>
                {!wrs ? "n/a" :
                <Box component="span" sx={{ display: "inline-flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 1, whiteSpace: "nowrap" }}>
                    <span>
                        <EmojiEventsIcon htmlColor={yellow[800]} sx={{ fontSize: 18, mr: 0.75, verticalAlign: "-3px" }} />
                        {wrs.mainWrs + wrs.bonusWrs}
                    </span>
                    {wrs.mainWrs + wrs.bonusWrs > 0 &&
                    <Typography component="span" variant="caption" sx={{ fontWeight: 400 }}>
                        {`${wrs.mainWrs} main`}
                        <Typography component="span" variant="inherit" color="textSecondary">
                            {` · ${wrs.bonusWrs} bonus`}
                        </Typography>
                    </Typography>}
                </Box>}
            </Stat>
        </Box>
    );
}

interface IStatProps {
    label: string
    help?: string
    loading: boolean
    children: React.ReactNode
}

function Stat(props: IStatProps) {
    const { label, help, loading, children } = props;
    return (
        <Box sx={{ minWidth: 0 }}>
            <Tooltip arrow title={help} placement="top-start">
                <Typography variant="caption" color="textSecondary" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                    {label}
                    {help && <InfoOutlineIcon fontSize="inherit" />}
                </Typography>
            </Tooltip>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
                {loading ? <Skeleton width={72} /> : children}
            </Typography>
        </Box>
    );
}

export default ProfileCard;
