import { useCallback, useEffect, useState } from "react";
import { Box, Button, Link, Paper, Typography } from "@mui/material";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";

const CONSENT_COOKIE = "strafes_policy_consent";
const CONSENT_VALUE = "accepted-v2";
const ONE_YEAR = 60 * 60 * 24 * 365;

function hasAcceptedPolicies() {
    return document.cookie
        .split(";")
        .map((cookie) => cookie.trim())
        .some((cookie) => cookie === `${CONSENT_COOKIE}=${CONSENT_VALUE}`);
}

function ConsentDialog() {
    const [state, setState] = useState<"open" | "closing" | "closed">(() => hasAcceptedPolicies() ? "closed" : "open");

    useEffect(() => {
        if (state !== "closing") return;

        const timeoutId = window.setTimeout(() => setState("closed"), 580);
        return () => window.clearTimeout(timeoutId);
    }, [state]);

    const acceptPolicies = useCallback(() => {
        const secure = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `${CONSENT_COOKIE}=${CONSENT_VALUE}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${secure}`;
        setState("closing");
    }, []);

    if (state === "closed") return null;

    return (
        <Paper
            role="dialog"
            aria-labelledby="policy-consent-title"
            aria-describedby="policy-consent-description"
            elevation={0}
            sx={{
                position: "fixed",
                right: { xs: "32px", sm: "40px" },
                bottom: { xs: "32px", sm: "40px" },
                zIndex: (theme) => theme.zIndex.snackbar,
                width: "calc(100% - 64px)",
                maxWidth: 350,
                p: { xs: 2, sm: 2.25 },
                borderRadius: "18px",
                overflow: "hidden",
                backgroundImage: (theme) => theme.palette.mode === "light"
                    ? "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(250,245,251,0.92))"
                    : "linear-gradient(145deg, rgba(25,26,40,0.96), rgba(13,14,24,0.94))",
                border: "1px solid",
                borderColor: "divider",
                backdropFilter: "blur(26px) saturate(165%)",
                boxShadow: "0 22px 70px rgba(0, 0, 0, 0.4), 0 0 40px rgba(255, 79, 154, 0.1)",
                pointerEvents: state === "closing" ? "none" : "auto",
                animation: state === "closing"
                    ? "consentPopupConfirm 560ms cubic-bezier(0.22, 1, 0.36, 1) both"
                    : "consentPopupIn 620ms cubic-bezier(0.16, 1, 0.3, 1) both",
                "&::after": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    pointerEvents: "none",
                    opacity: 0,
                    boxShadow: "inset 0 0 0 1px rgba(255, 134, 186, 0.9), inset 0 0 34px rgba(255, 79, 154, 0.22), 0 0 36px rgba(93, 217, 255, 0.18)",
                    animation: state === "closing" ? "consentConfirmGlow 560ms ease-out both" : "none"
                },
                "@keyframes consentPopupIn": {
                    from: { opacity: 0, transform: "translate3d(28px, 24px, 0) scale(0.94)" },
                    to: { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }
                },
                "@keyframes consentPopupConfirm": {
                    "0%": { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)", filter: "blur(0)" },
                    "22%": { opacity: 1, transform: "translate3d(0, 2px, 0) scale(0.975)", filter: "blur(0)" },
                    "52%": { opacity: 1, transform: "translate3d(0, -6px, 0) scale(1.018)", filter: "blur(0)" },
                    "100%": { opacity: 0, transform: "translate3d(18px, -12px, 0) scale(0.96)", filter: "blur(5px)" }
                },
                "@keyframes consentConfirmGlow": {
                    "0%": { opacity: 0 },
                    "35%": { opacity: 1 },
                    "100%": { opacity: 0 }
                },
                "@media (prefers-reduced-motion: reduce)": {
                    animationDuration: "0.01ms"
                }
            }}
        >
            <Box display="flex" alignItems="flex-start" gap={1.4}>
                <Box
                    display="flex"
                    flexShrink={0}
                    alignItems="center"
                    justifyContent="center"
                    width={42}
                    height={42}
                    borderRadius="13px"
                    sx={{
                        color: "primary.light",
                        background: "linear-gradient(135deg, rgba(255, 79, 154, 0.22), rgba(93, 217, 255, 0.13))",
                        border: "1px solid rgba(255, 79, 154, 0.28)",
                        boxShadow: "0 10px 30px rgba(255, 79, 154, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.12)"
                    }}
                >
                    <GppGoodRoundedIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box minWidth={0}>
                    <Typography id="policy-consent-title" component="h2" mb={0.35} fontSize="1rem" fontWeight={700}>
                        Privacy and terms
                    </Typography>
                    <Typography id="policy-consent-description" color="text.secondary" fontSize="0.8rem" lineHeight={1.55}>
                        By continuing, you accept our <Link href="/terms" fontWeight={600}>Terms</Link> and <Link href="/privacy" fontWeight={600}>Privacy Policy</Link>.
                    </Typography>
                </Box>
            </Box>
            <Button
                fullWidth
                variant="contained"
                onClick={acceptPolicies}
                sx={{
                    mt: 1.75,
                    minHeight: 40,
                    borderRadius: "11px",
                    background: "linear-gradient(110deg, #ff4f9a, #e83882)",
                    boxShadow: "0 10px 26px rgba(255, 79, 154, 0.26)",
                    animation: state === "closing" ? "consentButtonConfirm 560ms ease-out both" : "none",
                    "@keyframes consentButtonConfirm": {
                        "0%": { filter: "brightness(1)" },
                        "35%": { filter: "brightness(1.25)", boxShadow: "0 0 28px rgba(255, 79, 154, 0.55)" },
                        "100%": { filter: "brightness(1)" }
                    },
                    "&:hover": {
                        background: "linear-gradient(110deg, #ff68a9, #ed438c)",
                        boxShadow: "0 13px 32px rgba(255, 79, 154, 0.36)",
                        transform: "translateY(-1px)"
                    }
                }}
            >
                {state === "closing" ? "Accepted" : "Accept"}
            </Button>
        </Paper>
    );
}

export default ConsentDialog;
