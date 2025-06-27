import React, { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { RankData } from "../api/interfaces";
import { getRankData } from "../api/api";

export interface IProfileCardProps {
    userId?: string
}

function ProfileCard(props: IProfileCardProps) {
    const ranks = ["New","Newb","Bad","Okay","Not Bad","Decent","Getting There","Advanced","Good","Great","Superb","Amazing","Sick","Master","Insane","Majestic","Baby Jesus","Jesus","Half God","God"];
    const [rank, setRank] = useState<RankData | undefined>(undefined);
    
    const { userId } = props;

    useEffect(() => {
        if (!userId) {
            setRank(undefined);
            return;
        }
        getRankData(userId).then((rankData) => {
            if (!rankData) {
                setRank(undefined);
                return;
            }
            if (rankData.userId === userId) {
                setRank(rankData);
            }
        });
    }, [userId])

    console.log(rank);
    if (!rank) {
        return <Box>
            {userId ? "the user ID is: " + userId : "NO USER ID"}
        </Box>;
    }
    
    const rankFormatted = ranks[rank.rank - 1];

    return (
    <Paper elevation={2} sx={{padding: 3, display: "flex"}}>
        <Box width="50%">
            <Typography>
                Rank
            </Typography>
            <Typography variant="h6">
                {`${rankFormatted} (${rank.rank})`}
            </Typography>
        </Box>
        <Box width="50%">
            <Typography>
                Skill
            </Typography>
            <Typography variant="h6">
                {`${(rank.skill * 100).toFixed(3)}%`}
            </Typography>
        </Box>
    </Paper>
    );
}

export default ProfileCard;