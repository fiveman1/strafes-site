import React from "react";
import { Box, Card, CardActionArea, CardContent, Typography, alpha } from "@mui/material";

export interface IHomeCardProps {
    title: string
    icon: React.ReactElement
    description: string
    href: string
}

function HomeCard(props: IHomeCardProps) {
    const { title, icon, description, href } = props;

    return (
        <Card
            elevation={0}
            sx={{
                width: "100%",
                height: {xs: "146px", sm: "174px"},
                position: "relative",
                overflow: "hidden",
                animation: "cardEnter 520ms cubic-bezier(0.22, 1, 0.36, 1) both",
                transition: "transform 300ms cubic-bezier(0.22, 1, 0.36, 1), border-color 300ms ease, box-shadow 300ms ease, background-color 300ms ease",
                "&::before": {
                    content: '\"\"',
                    position: "absolute",
                    width: "150px",
                    height: "150px",
                    top: "-92px",
                    right: "-62px",
                    borderRadius: "50%",
                    background: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === "light" ? 0.13 : 0.18),
                    filter: "blur(24px)",
                    transition: "transform 320ms ease, opacity 320ms ease",
                    opacity: 0.72,
                    pointerEvents: "none"
                },
                "&::after": {
                    content: '\"\"',
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(112deg, transparent 18%, rgba(255, 255, 255, 0.075) 46%, transparent 64%)",
                    transform: "translateX(-120%)",
                    transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
                    pointerEvents: "none"
                },
                ":hover": {
                    transform: "translateY(-7px) scale(1.012)",
                    borderColor: "primary.main",
                    boxShadow: (theme) => theme.palette.mode === "light"
                        ? `0 18px 44px ${alpha(theme.palette.primary.main, 0.12)}`
                        : `0 20px 52px rgba(0, 0, 0, 0.34), 0 0 34px ${alpha(theme.palette.primary.main, 0.12)}`,
                    "&::before": {
                        transform: "translate3d(-12px, 12px, 0) scale(1.25)",
                        opacity: 1
                    },
                    "&::after": {
                        transform: "translateX(120%)"
                    }
                }
            }}
        >
            <CardActionArea href={href} sx={{height: "100%", borderRadius: "inherit"}}>
                <CardContent sx={{height: "100%", p: {xs: 2.25, sm: 2.75}, "&:last-child": {pb: {xs: 2.25, sm: 2.75}}}}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 1.5
                        }}>
                        <Box
                            sx={{
                                width: "44px",
                                height: "44px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "13px",
                                color: "primary.main",
                                bgcolor: "action.hover",
                                background: (theme) => `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.16)}, ${alpha(theme.palette.secondary.main, 0.06)})`,
                                boxShadow: (theme) => `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.18)}, 0 10px 28px ${alpha(theme.palette.primary.main, 0.13)}`,
                                transition: "transform 260ms cubic-bezier(0.22, 1, 0.36, 1), background-color 260ms ease",

                                ".MuiCard-root:hover &": {
                                    transform: "translateY(-2px) rotate(-5deg) scale(1.10)",
                                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
                                    boxShadow: (theme) => `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.28)}, 0 12px 30px ${alpha(theme.palette.primary.main, 0.22)}`
                                },

                                "& svg": {fontSize: 24}
                            }}>
                            {icon}
                        </Box>
                        <Typography variant="h6" sx={{
                            marginLeft: 1.25
                        }}>
                            {title}
                        </Typography>
                    </Box>
                    <Typography
                        variant="body2"
                        sx={{
                            color: "text.secondary",
                            lineHeight: 1.55
                        }}>
                        {description}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}

export default HomeCard;
