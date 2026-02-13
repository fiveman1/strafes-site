import React from "react";
import { Box, Card, CardActionArea, CardContent, Typography, useMediaQuery } from "@mui/material";

export interface IHomeCardProps {
    title: string
    icon: React.ReactElement
    description: string
    href: string
}

function HomeCard(props: IHomeCardProps) {
    const { title, icon, description, href } = props;

    const smallScreen = useMediaQuery("@media screen and (max-width: 520px)");
    const size = smallScreen ? "150px" : "200px";

    return (
    <Card sx={{width: size, height: size, ":hover": {boxShadow: 8}}} elevation={3}>
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