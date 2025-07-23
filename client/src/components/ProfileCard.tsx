import React, { useEffect, useState } from "react";
import { Box, IconButton, Link, Paper, Tooltip, Typography } from "@mui/material";
import { Game, ModerationStatus, Rank, Style, User } from "../api/interfaces";
import { getUserRank } from "../api/api";
import CircularProgress from '@mui/material/CircularProgress';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import { formatRank, formatSkill } from "../util/format";
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

export interface IProfileCardProps {
    userId?: string
    game: Game
    style: Style
    user?: User
    userLoading: boolean
}

function ProfileCard(props: IProfileCardProps) {
    const { userId, game, style, user, userLoading } = props;

    const [rank, setRank] = useState<Rank>();
    const [rankLoading, setRankLoading] = useState(false);

    useEffect(() => {
        if (!userId || game === Game.all || style === Style.all) {
            setRank(undefined);
            return;
        }
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
    }, [userId, game, style])
    
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
    <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column"}}>
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
            <Box flexGrow={1} padding={1}>
                <Box display="flex" flexDirection="column">
                    <Tooltip sx={{marginRight: "auto"}} arrow title="Rank is based on the weighted sum of a user's times. Better placements are worth more." placement="top-start">
                        <Typography variant="subtitle1">
                            Rank
                            <InfoOutlineIcon sx={{marginLeft: "4px"}} fontSize="inherit" color="info" />
                        </Typography>
                    </Tooltip>
                    {rankLoading ? <CircularProgress size="32px" /> : 
                    <Typography variant="h6">
                        {rankFormatted}
                    </Typography>}
                </Box>
            </Box>
            <Box flexGrow={1} padding={1}>
                <Box display="flex" flexDirection="column">
                    <Tooltip sx={{marginRight: "auto"}} arrow title="Skill is based on the average percentile of a user's times. Maps with more completions have a higher weight." placement="top-start">
                        <Typography variant="subtitle1">
                            Skill
                            <InfoOutlineIcon sx={{marginLeft: "4px"}} fontSize="inherit" color="info" />
                        </Typography>
                    </Tooltip>
                    {rankLoading ? <CircularProgress size="32px" /> : 
                    <Typography variant="h6">
                        {skillFormatted}
                    </Typography>}
                </Box>
            </Box>
            <Box flexGrow={1} padding={1}>
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
                            <InfoOutlineIcon sx={{marginLeft: "6px"}} fontSize="inherit" color="info" />
                        </Typography>
                    }
                    </Tooltip> : 
                    <Typography variant="h6">{formattedStatus}</Typography>}
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