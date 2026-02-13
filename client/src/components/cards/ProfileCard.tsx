import React, { useEffect, useMemo, useState } from "react";
import { Box, IconButton, Link, Paper, Tooltip, Typography } from "@mui/material";
import { Game, ModerationStatus, Rank, Style, User, formatRank, formatSkill } from "shared";
import CircularProgress from '@mui/material/CircularProgress';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useOutletContext } from "react-router";
import { yellow } from "@mui/material/colors";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { getCompletionsForUser, getNumWRsForUser, getUserRank, WRCount } from "../../api/api";
import { ContextParams, RANK_HELP_TEXT, SKILL_HELP_TEXT } from "../../common/common";

export interface IProfileCardProps {
    userId?: string
    game: Game
    style: Style
    user?: User
    userLoading: boolean
    minHeight?: number
}

function ProfileCard(props: IProfileCardProps) {
    const { userId, game, style, user, userLoading, minHeight } = props;

    const [rank, setRank] = useState<Rank>();
    const [rankLoading, setRankLoading] = useState(false);
    const [comps, setComps] = useState<number>();
    const [compsLoading, setCompsLoading] = useState(false);
    const [wrs, setWrs] = useState<WRCount>();
    const [wrsLoading, setWrsLoading] = useState(false);

    const { mapCounts } = useOutletContext() as ContextParams;

    useEffect(() => {
        if (!userId || game === Game.all || style === Style.all) {
            setComps(undefined);
            setRank(undefined);
            return;
        }

        setCompsLoading(true);
        setRankLoading(true);
        getUserRank(userId, game, style).then((rankData) => {
            if (!rankData) {
                setRank(undefined);
                setRankLoading(false);
                return;
            }
            if (rankData.userId === userId) {
                setRankLoading(false);
                setRank(rankData);
            }
        });

        let compsActive = true;
        getCompletionsForUser(userId, game, style).then((completions) => {
            if (!compsActive) return;
            setComps(completions);
            setCompsLoading(false);
        });

        return () => {
            compsActive = false;
        }
    }, [userId, game, style]);

    useEffect(() => {
        if (!userId) {
            setWrs(undefined);
            return;
        }

        let wrsActive = true;
        setWrsLoading(true);

        getNumWRsForUser(userId, game, style).then((wrs) => {
            if (!wrsActive) return;
            setWrs(wrs);
            setWrsLoading(false);
        });

        return () => {
            wrsActive = false;
        }
    }, [userId, game, style]);

    const compsFormatted = useMemo(() => {
        let compsFormatted = "n/a";
        if (comps !== undefined) {
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

    const disableButton = !userId || game === Game.all || style === Style.all;

    return (
    <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column", width: "100%", minHeight: minHeight}}>
        <Box display="flex">
            <Typography variant="caption" flexGrow={1}>
                Profile
            </Typography>
            <IconButton 
                size="small" 
                disabled={disableButton}
                title={user ? `Compare @${user.username} to other users` : "Compare to other users"} 
                LinkComponent={Link} 
                href={disableButton ? "/compare" : `/compare?game=${game}&style=${style}&user1=${userId}`}>
                <CompareArrowsIcon fontSize="inherit" />
            </IconButton>
        </Box>
        <Box display="flex" flexWrap="wrap">
            <Box flex="1 0 20%" padding={1} minWidth={150}>
                <Box display="flex" flexDirection="column">
                    <Tooltip sx={{marginRight: "auto"}} arrow title={RANK_HELP_TEXT} placement="top-start">
                        <Typography variant="subtitle1">
                            Rank
                            <InfoOutlineIcon sx={{marginLeft: "4px"}} fontSize="inherit" color="secondary" />
                        </Typography>
                    </Tooltip>
                    {rankLoading ? <CircularProgress size="32px" /> : 
                    <Typography variant="h6">
                        {rankFormatted}
                    </Typography>}
                </Box>
            </Box>
            <Box flex="1 0 20%" padding={1} minWidth={150}>
                <Box display="flex" flexDirection="column">
                    <Tooltip sx={{marginRight: "auto"}} arrow title={SKILL_HELP_TEXT} placement="top-start">
                        <Typography variant="subtitle1">
                            Skill
                            <InfoOutlineIcon sx={{marginLeft: "4px"}} fontSize="inherit" color="secondary" />
                        </Typography>
                    </Tooltip>
                    {rankLoading ? <CircularProgress size="32px" /> : 
                    <Typography variant="h6">
                        {skillFormatted}
                    </Typography>}
                </Box>
            </Box>
            <Box flex="1 0 20%" padding={1} minWidth={150} >
                <Box display="flex" flexDirection="column">
                    <Typography variant="subtitle1">
                        Moderation status
                    </Typography>
                    {userLoading ? <CircularProgress size="32px" /> : 
                    tooltip ? 
                    <Tooltip 
                        title={tooltip} 
                        arrow 
                        placement="bottom-start" 
                        sx={{marginRight: "auto"}}>
                    {
                        <Typography variant="h6">
                            {formattedStatus}
                            <InfoOutlineIcon sx={{marginLeft: "6px"}} fontSize="inherit" color="secondary" />
                        </Typography>
                    }
                    </Tooltip> : 
                    <Typography variant="h6">{formattedStatus}</Typography>}
                </Box>
            </Box>
            <Box flex="1 0 20%" padding={1} minWidth={150}>
                <Box display="flex" flexDirection="column">
                    <Typography variant="subtitle1">
                        Completions
                    </Typography>
                    {compsLoading ? <CircularProgress size="32px" /> : 
                    <Typography variant="h6">
                        {compsFormatted}
                    </Typography>}
                </Box>
            </Box>
            <Box flex="1 0 20%" padding={1} minWidth={150}>
                <Box display="flex" flexDirection="column">
                    <Typography variant="subtitle1">
                        World Records
                    </Typography>
                    {wrsLoading ? <CircularProgress size="32px" /> : 
                    <Box display="flex" flexDirection="row" alignItems="center">
                        <Box display="flex" flexDirection="row">
                            <EmojiEventsIcon htmlColor={yellow[800]} sx={{fontSize: "24px"}} />
                        </Box>
                        {wrs === undefined ?
                        <Typography variant="h6" marginLeft={1}>
                            n/a
                        </Typography>
                        :
                        <>
                        <Typography variant="h6" marginLeft={1}>
                            {`${wrs.mainWrs + wrs.bonusWrs}`}
                        </Typography>
                        {wrs.mainWrs + wrs.bonusWrs <= 0 ? <></> :
                        <Box display="flex" flexDirection="column" marginTop={0.25} marginLeft={1.5}>
                            <Typography variant="caption">
                                {`${wrs.mainWrs} main`}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {`${wrs.bonusWrs} bonus`}
                            </Typography>
                        </Box>}
                        </>}
                    </Box>}
                </Box>
            </Box>
            {/* <Box flexGrow={1} padding={1}>
                <Box display="flex" flexDirection="column">
                    <Typography variant="subtitle1">
                        Chat muted?
                    </Typography>
                    {userLoading ? <CircularProgress size="32px" /> : 
                    <Typography variant="h6">
                        {user?.muted !== undefined ? (user.muted ? "Yes" : "No") : "n/a"}
                    </Typography>}
                </Box>
            </Box> */}
        </Box>
    </Paper>
    );
}

export default ProfileCard;