import React from "react";
import Box from "@mui/material/Box";
import { Grid, Typography } from "@mui/material";
import HomeCard from "./HomeCard";
import PersonIcon from '@mui/icons-material/Person';
import LayersIcon from '@mui/icons-material/Layers';

function Home() {
    return (
        <>
    <Box display="flex" flexGrow={1} flexDirection="column" alignItems="center" justifyContent="center">
        <Typography marginBottom={2} variant="h3">Go to...</Typography>
        <Grid container spacing={3} maxWidth={650} justifyContent="center">
            <Grid>
                <HomeCard href="/users" title="Users" icon={<PersonIcon />} description="See user profiles and times" />
            </Grid>
            <Grid>
                <HomeCard href="/maps" title="Maps" icon={<LayersIcon />} description="Search maps and see the top times" />
            </Grid>
        </Grid>
    </Box>
    </>);
}

export default Home;