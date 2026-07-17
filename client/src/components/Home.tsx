import { useEffect } from "react";
import Box from "@mui/material/Box";
import { Grid, Typography, useMediaQuery } from "@mui/material";
import HomeCard from "./cards/HomeCard";
import PersonIcon from '@mui/icons-material/Person';
import LayersIcon from '@mui/icons-material/Layers';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useOutletContext } from "react-router";
import { ContextParams } from "../common/common";

function Home() {
    const smallScreen = useMediaQuery("@media screen and (max-width: 520px)");
    const { loginUser } = useOutletContext() as ContextParams;

    useEffect(() => {
        document.title = "home - strafes"
    }, []);

    let userLink = "/users";
    if (loginUser) {
        userLink += `/${loginUser.userId}`
    }

    return (
    <Box
        padding={smallScreen ? "42px 4px" : "clamp(64px, 10vh, 112px) 12px"}
        display="flex"
        flexGrow={1}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
    >
        <Box mb={smallScreen ? 4 : 6} textAlign="center" position="relative">
            <Typography
                variant="h2"
                sx={{
                    fontSize: {xs: "3rem", sm: "4.25rem"},
                    lineHeight: 0.95,
                    color: "text.primary",
                    fontFamily: '"Goldman", sans-serif',
                    fontStyle: "normal",
                    letterSpacing: "-0.055em",
                    background: (theme) => theme.palette.mode === "light"
                        ? "linear-gradient(135deg, #211d28 25%, #ce246d 100%)"
                        : "linear-gradient(135deg, #ffffff 22%, #ffc1dc 72%, #7ce2ff 120%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 10px 28px rgba(255, 79, 154, 0.18))"
                }}
            >
                strafes
            </Typography>
            <Box
                width="54px"
                height="3px"
                borderRadius="3px"
                mx="auto"
                mt={2.25}
                sx={{
                    background: "linear-gradient(90deg, #ff4f9a, #ff86ba, #5dd9ff)",
                    boxShadow: "0 0 16px rgba(255, 79, 154, 0.72)",
                    animation: "glowPulse 3.2s ease-in-out infinite"
                }}
            />
        </Box>
        <Grid
            container
            spacing={smallScreen ? 1.25 : 2}
            justifyContent="center"
            width="100%"
            maxWidth="1050px"
            sx={{
                "& > :nth-of-type(1) .MuiCard-root": { animationDelay: "40ms" },
                "& > :nth-of-type(2) .MuiCard-root": { animationDelay: "90ms" },
                "& > :nth-of-type(3) .MuiCard-root": { animationDelay: "140ms" },
                "& > :nth-of-type(4) .MuiCard-root": { animationDelay: "190ms" },
                "& > :nth-of-type(5) .MuiCard-root": { animationDelay: "240ms" }
            }}
        >
            <Grid size={{xs: 12, sm: 6, md: 4}}>
                <HomeCard href={userLink} title="Users" icon={<PersonIcon />} description="Search user profiles and times" />
            </Grid>
             <Grid size={{xs: 12, sm: 6, md: 4}}>
                <HomeCard href="/globals" title="Globals" icon={<EmojiEventsIcon />} description="View the latest world records" />
            </Grid>
            <Grid size={{xs: 12, sm: 6, md: 4}}>
                <HomeCard href="/maps" title="Maps" icon={<LayersIcon />} description="Browse maps and view the top times" />
            </Grid>
            <Grid size={{xs: 12, sm: 6, md: 4}}>
                <HomeCard href="/ranks" title="Ranks" icon={<StarIcon />} description="Explore the leaderboards" />
            </Grid>
            <Grid size={{xs: 12, sm: 6, md: 4}}>
                <HomeCard href="/compare" title="Compare" icon={<CompareArrowsIcon />} description="Compare users head-to-head" />
            </Grid>
        </Grid>
    </Box>
    );
}

export default Home;
