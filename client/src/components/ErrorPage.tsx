import { ArrowBackRounded, HomeRounded, RefreshRounded } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { isRouteErrorResponse, useRouteError } from "react-router";

interface ErrorScreenProps {
    error?: unknown
    notFound?: boolean
}

function ErrorScreen({ error, notFound = false }: ErrorScreenProps) {
    const routeStatus = isRouteErrorResponse(error) ? error.status : undefined;
    const status = notFound ? 404 : routeStatus;
    const isMissing = status === 404;
    const isForbidden = status === 401 || status === 403;
    const isServerError = status !== undefined && status >= 500;
    const isChunkError = error instanceof Error && /module script|dynamically imported module|failed to fetch/i.test(error.message);
    const title = isMissing
        ? "Page not found"
        : isForbidden
            ? "Access denied"
            : isServerError
                ? "Server error"
                : isChunkError
                    ? "Update ready"
                    : "Something went wrong";
    const message = isMissing
        ? "That page doesn't exist, or it may have moved."
        : isForbidden
            ? "You don't have permission to view this page."
            : isServerError
                ? "The server couldn't complete this request. Please try again in a moment."
        : isChunkError
            ? "The site was updated while this page was open. Refresh to load the latest version."
            : "We couldn't load this page. You can try again or head back home.";
    const isLight = localStorage.getItem("theme") === "light";
    const background = isLight ? "#f7f7f8" : "#0b0b0c";
    const text = isLight ? "#17171a" : "#ededee";
    const secondaryText = isLight ? "#66666f" : "#9a9aa2";
    const border = isLight ? "rgba(0, 0, 0, 0.22)" : "rgba(255, 255, 255, 0.2)";
    const primary = isLight ? "#cf2572" : "#ee4b93";
    const buttonSx = { borderRadius: "8px", textTransform: "none", fontWeight: 500, boxShadow: "none" };

    return (
        <Box
            sx={{
                minHeight: notFound ? "60vh" : "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                px: 2,
                textAlign: "center",
                color: text,
                backgroundColor: notFound ? undefined : background,
                "& .MuiTypography-root, & .MuiButton-root": {
                    fontFamily: '"Geist", system-ui, -apple-system, "Segoe UI", sans-serif'
                }
            }}>
            <Typography
                component="div"
                sx={{
                    mb: 1,
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: secondaryText
                }}
            >
                {status ?? "Error"}
            </Typography>
            <Typography component="h1" sx={{ mb: 1, fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
                {title}
            </Typography>
            <Typography sx={{ mb: 3, maxWidth: 420, color: secondaryText }}>
                {message}
            </Typography>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: 1
                }}>
                {!isMissing && (
                    <Button variant="contained" startIcon={<RefreshRounded />} onClick={() => window.location.reload()} sx={{ ...buttonSx, bgcolor: primary, "&:hover": { bgcolor: primary, boxShadow: "none", opacity: 0.9 } }}>
                        Refresh page
                    </Button>
                )}
                <Button
                    variant={isMissing ? "contained" : "outlined"}
                    color="inherit"
                    href="/"
                    startIcon={<HomeRounded />}
                    sx={{
                        ...buttonSx,
                        color: isMissing ? "#ffffff" : text,
                        bgcolor: isMissing ? primary : "transparent",
                        borderColor: border,
                        "&:hover": { bgcolor: isMissing ? primary : "transparent", borderColor: secondaryText, boxShadow: "none", opacity: isMissing ? 0.9 : 1 }
                    }}>
                    Go home
                </Button>
                {window.history.length > 1 && (
                    <Button color="inherit" startIcon={<ArrowBackRounded />} onClick={() => window.history.back()} sx={buttonSx}>
                        Go back
                    </Button>
                )}
            </Box>
        </Box>
    );
}

export function RouteErrorPage() {
    return <ErrorScreen error={useRouteError()} />;
}

export function NotFoundPage() {
    return <ErrorScreen notFound />;
}
