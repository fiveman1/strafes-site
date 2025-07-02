import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";

function Globals() {
    useEffect(() => {
        document.title = "strafes - globals"
    }, []);

    return (
    <Box padding={2} flexGrow={1}>
        <Typography variant="h2" padding={1}>
            Globals
        </Typography>
        <Typography variant="body1" padding={1}>
            Under construction
        </Typography>
    </Box>
    );
}

export default Globals;