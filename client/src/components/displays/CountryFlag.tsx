import { Box, Tooltip } from "@mui/material";
import ReactCountryFlag from "react-country-flag";
import { formatCountryCode } from "shared";

interface CountryFlagProps {
    countryCode: string
    marginLeft?: number
}

function CountryFlag(props: CountryFlagProps) {
    const { countryCode, marginLeft = 0 } = props;

    return (
        <Tooltip
            title={formatCountryCode(countryCode)}
            arrow
            enterDelay={120}
            leaveDelay={50}
            placement="top"
            slotProps={{
                tooltip: {
                    sx: {
                        px: 1.25,
                        py: 0.75,
                        fontWeight: 600,
                        backdropFilter: "blur(16px) saturate(160%)",
                        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.24), 0 0 18px rgba(255, 79, 154, 0.10)"
                    }
                }
            }}
        >
            <Box
                component="span"
                sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    ml: `${marginLeft}px`,
                    cursor: "default",
                    transformOrigin: "center",
                    transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), filter 220ms ease",

                    "&:hover": {
                        transform: "translateY(-2px) scale(1.16)",
                        filter: "drop-shadow(0 5px 8px rgba(255, 79, 154, 0.28))"
                    }
                }}>
                <ReactCountryFlag countryCode={countryCode} svg />
            </Box>
        </Tooltip>
    );
}

export default CountryFlag;
