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
        >
            <Box
                component="span"
                sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    ml: `${marginLeft}px`,
                    cursor: "default"
                }}>
                <ReactCountryFlag countryCode={countryCode} svg />
            </Box>
        </Tooltip>
    );
}

export default CountryFlag;
