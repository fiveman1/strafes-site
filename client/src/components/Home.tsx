import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import { Grid, Typography, useMediaQuery } from "@mui/material";
import HomeCard from "./HomeCard";
import PersonIcon from '@mui/icons-material/Person';
import LayersIcon from '@mui/icons-material/Layers';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

function Home() {
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");
    
    useEffect(() => {
        document.title = "strafes - home"
    }, []);

    return (
    <Box padding={2} display="flex" flexGrow={1} flexDirection="column" alignItems="center" justifyContent="center">
        <Typography padding={2} variant="h3">Go to...</Typography>
        <Grid container spacing={smallScreen ? 2 : 3} justifyContent="center">
            <Grid>
                <HomeCard href="/users" title="Users" icon={<PersonIcon />} description="Search user profiles and times" />
            </Grid>
             <Grid>
                <HomeCard href="/globals" title="Globals" icon={<EmojiEventsIcon />} description="View the latest world records" />
            </Grid>
            <Grid>
                <HomeCard href="/maps" title="Maps" icon={<LayersIcon />} description="Browse maps and view the top times" />
            </Grid>
            <Grid>
                <HomeCard href="/ranks" title="Ranks" icon={<StarIcon />} description="Explore the rank leaderboards" />
            </Grid>
            <Grid>
                <HomeCard href="/compare" title="Compare" icon={<CompareArrowsIcon />} description="Compare users head-to-head" />
            </Grid>
        </Grid>
    </Box>
    );
}

export default Home;