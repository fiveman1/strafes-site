import React, { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { Game, RankData, Style } from "../api/interfaces";
import { getRankData } from "../api/api";
import CircularProgress from '@mui/material/CircularProgress';

export interface IProfileCardProps {
    userId?: string
    game: Game
    style: Style
}

function ProfileCard(props: IProfileCardProps) {
    const { userId, game, style } = props;

    const [rank, setRank] = useState<RankData | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!userId) {
            setRank(undefined);
            return;
        }
        setLoading(true);
        getRankData(userId, game, style).then((rankData) => {
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
        const ranks = ["New","Newb","Bad","Okay","Not Bad","Decent","Getting There","Advanced","Good","Great","Superb","Amazing","Sick","Master","Insane","Majestic","Baby Jesus","Jesus","Half God","God"];
        rankFormatted = `${ranks[rank.rank - 1]} (${rank.rank})`;
        skillFormatted = `${(rank.skill * 100).toFixed(3)}%`;
    }

    return (
    <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column"}}>
        <Typography variant="caption">
            Profile
        </Typography>
        <Box display="flex" padding={1}>
            <Box flexGrow={1}>
                <Box display="flex" flexDirection="column">
                    <Typography>
                        Rank
                    </Typography>
                    {loading ? <CircularProgress size="32px" /> : 
                    <Typography variant="h6">
                        {rankFormatted}
                    </Typography>}
                </Box>
            </Box>
            <Box flexGrow={1}>
                <Box display="flex" flexDirection="column">
                    <Typography>
                        Skill
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