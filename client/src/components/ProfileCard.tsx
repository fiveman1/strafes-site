import React, { useEffect, useState } from "react";
import { Box, Paper, Tooltip, Typography } from "@mui/material";
import { Game, Rank, Style } from "../api/interfaces";
import { getUserRank } from "../api/api";
import CircularProgress from '@mui/material/CircularProgress';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import { formatRank, formatSkill } from "../util/format";

export interface IProfileCardProps {
    userId?: string
    game: Game
    style: Style
}

function ProfileCard(props: IProfileCardProps) {
    const { userId, game, style } = props;

    const [rank, setRank] = useState<Rank | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!userId) {
            setRank(undefined);
            return;
        }
        setLoading(true);
        getUserRank(userId, game, style).then((rankData) => {
            if (!rankData) {
                setRank(undefined);
                setLoading(false);
                return;
            }
            if (rankData.userId === userId) {
                setLoading(false);
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

    return (
    <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column"}}>
        <Typography variant="caption">
            Profile
        </Typography>
        <Box display="flex" padding={1}>
            <Box flexGrow={1}>
                <Box display="flex" flexDirection="column">
                    <Typography variant="subtitle1">
                        Rank
                        <Tooltip sx={{marginLeft: "4px"}} title="Rank is based on the weighted sum of a user's times. Better placements are worth more." placement="top-start">
                            <InfoOutlineIcon fontSize="inherit" color="info" />
                        </Tooltip>
                    </Typography>
                    {loading ? <CircularProgress size="32px" /> : 
                    <Typography variant="h6">
                        {rankFormatted}
                    </Typography>}
                </Box>
            </Box>
            <Box flexGrow={1}>
                <Box display="flex" flexDirection="column">
                    <Typography variant="subtitle1">
                        Skill
                        <Tooltip sx={{marginLeft: "4px"}} title="Skill is based on the average percentile of a user's times. Maps with more completions have a higher weight." placement="top-start">
                            <InfoOutlineIcon fontSize="inherit" color="info" />
                        </Tooltip>
                    </Typography>
                    {loading ? <CircularProgress size="32px" /> : 
                    <Typography variant="h6">
                        {skillFormatted}
                    </Typography>}
                </Box>
            </Box>
        </Box>
    </Paper>
    );
}

export default ProfileCard;