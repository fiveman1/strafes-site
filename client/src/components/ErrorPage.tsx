import { ArrowBackRounded, HomeRounded, RefreshRounded } from "@mui/icons-material";
import { Box, Button, Paper, Typography } from "@mui/material";
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
    const background = isLight ? "#f7f5fa" : "#080911";
    const surface = isLight ? "rgba(255, 255, 255, 0.78)" : "rgba(17, 18, 29, 0.76)";
    const text = isLight ? "#211d28" : "#f7f5fb";
    const secondaryText = isLight ? "#6d6676" : "#aaa7b8";
    const border = isLight ? "rgba(45, 32, 55, 0.12)" : "rgba(255, 255, 255, 0.12)";

    return (
        <Box
            minHeight="100vh"
            display="flex"
            alignItems="center"
            justifyContent="center"
            px={2}
            sx={{
                color: text,
                backgroundColor: background,
                backgroundImage: "radial-gradient(circle at 30% 10%, rgba(255, 79, 154, 0.22), transparent 34rem), radial-gradient(circle at 85% 80%, rgba(93, 217, 255, 0.12), transparent 30rem)"
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    width: "100%",
                    maxWidth: 560,
                    p: { xs: 3, sm: 5 },
                    textAlign: "center",
                    color: text,
                    background: surface,
                    border: `1px solid ${border}`,
                    borderRadius: "24px",
                    backdropFilter: "blur(26px) saturate(165%)",
                    boxShadow: isLight ? "0 24px 70px rgba(45, 25, 55, 0.12)" : "0 28px 80px rgba(0, 0, 0, 0.46), 0 0 44px rgba(255, 79, 154, 0.08)"
                }}
            >
                <Typography
                    component="div"
                    sx={{
                        mb: 1.5,
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        letterSpacing: "0.16em",
                        color: "#ff4f9a",
                        textTransform: "uppercase"
                    }}
                >
                    {status ?? "Error"}
                </Typography>
                <Typography component="h1" variant="h3" sx={{ mb: 1.5, fontWeight: 700, letterSpacing: "-0.04em" }}>
                    {title}
                </Typography>
                <Typography sx={{ mb: 4, color: secondaryText, fontSize: "1.05rem", lineHeight: 1.65 }}>
                    {message}
                </Typography>
                <Box display="flex" justifyContent="center" flexWrap="wrap" gap={1.25}>
                    {!isMissing && (
                        <Button variant="contained" startIcon={<RefreshRounded />} onClick={() => window.location.reload()} sx={{ borderRadius: "12px", textTransform: "none", bgcolor: "#ff4f9a", "&:hover": { bgcolor: "#ce246d" } }}>
                            Refresh page
                        </Button>
                    )}
                    <Button variant={isMissing ? "contained" : "outlined"} href="/" startIcon={<HomeRounded />} sx={{ borderRadius: "12px", textTransform: "none", color: isMissing ? "#ffffff" : "#ff86ba", bgcolor: isMissing ? "#ff4f9a" : "transparent", borderColor: "rgba(255, 79, 154, 0.5)", "&:hover": { bgcolor: isMissing ? "#ce246d" : "rgba(255, 79, 154, 0.08)", borderColor: "#ff4f9a" } }}>
                        Go home
                    </Button>
                    {window.history.length > 1 && (
                        <Button color="inherit" startIcon={<ArrowBackRounded />} onClick={() => window.history.back()} sx={{ borderRadius: "12px", textTransform: "none" }}>
                            Go back
                        </Button>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}

export function RouteErrorPage() {
    return <ErrorScreen error={useRouteError()} />;
}

export function NotFoundPage() {
    return <ErrorScreen notFound />;
}
