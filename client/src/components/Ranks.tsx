import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";

function Ranks() {
    useEffect(() => {
        document.title = "strafes - ranks"
    }, []);
    
    return (
    <Box padding={2} flexGrow={1}>
        <Typography variant="h4" padding={1}>
            Ranks
        </Typography>
        <Typography variant="body1" padding={1}>
            Under construction
        </Typography>
    </Box>
    );
}

export default Ranks;