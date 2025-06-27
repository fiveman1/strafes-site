import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { Link } from "@mui/material";

export interface IHomeCardProps {
    title: string
    icon: React.ReactElement
    description: string
    href: string
}

function HomeCard(props: IHomeCardProps) {
    const { title, icon, description, href } = props;
    return (
    <Link href={href} underline="none">
        <Paper sx={{width: "200px", height: "200px", padding: 2, ":hover": {boxShadow: 20}}} elevation={3}>
            <Box display="flex" alignItems="center">
                {icon}
                <Typography marginLeft={0.75} variant="h6">
                    {title}
                </Typography>
            </Box>
            <Typography padding={0.5} variant="subtitle1">
                {description}
            </Typography>
        </Paper>
    </Link>
    );
}

export default HomeCard;