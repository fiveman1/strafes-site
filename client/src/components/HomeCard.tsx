import React from "react";
import { Box, Card, CardActionArea, CardContent, Typography } from "@mui/material";

export interface IHomeCardProps {
    title: string
    icon: React.ReactElement
    description: string
    href: string
}

function HomeCard(props: IHomeCardProps) {
    const { title, icon, description, href } = props;
    return (
    <Card sx={{width: "200px", height: "200px", ":hover": {boxShadow: 20}}} elevation={3}>
        <CardActionArea href={href} sx={{height: "100%"}}>
            <CardContent sx={{height: "100%"}}>
                <Box display="flex" alignItems="center">
                    {icon}
                    <Typography marginLeft={0.75} variant="h6">
                        {title}
                    </Typography>
                </Box>
                <Typography padding={0.5} variant="subtitle1">
                    {description}
                </Typography>
            </CardContent>
        </CardActionArea>
    </Card>
    );
}

export default HomeCard;