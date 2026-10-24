import Fade from "@mui/material/Fade";
import LinearProgress from "@mui/material/LinearProgress";
import { useNavigation } from "react-router";

// Shown while a lazy route's chunk downloads. The delay keeps it from flashing on fast loads.
function NavigationProgress() {
    const navigation = useNavigation();
    const loading = navigation.state === "loading";

    return (
        <Fade in={loading} style={{ transitionDelay: loading ? "150ms" : "0ms" }} unmountOnExit>
            <LinearProgress
                aria-label="Loading page"
                sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: (theme) => theme.zIndex.appBar + 1 }}
            />
        </Fade>
    );
}

export default NavigationProgress;
