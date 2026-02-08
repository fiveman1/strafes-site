import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { InputAdornment, useMediaQuery } from '@mui/material';
import ReactCountryFlag from 'react-country-flag';
import { CODE_TO_COUNTRY, COUNTRIES } from 'shared';

// Adapted from the Country select example here https://mui.com/material-ui/react-autocomplete/

interface ICountrySelectProps {
    country: string | undefined
    setCountry: (val: string | undefined) => void
}

export default function CountrySelect(props: ICountrySelectProps) {
    const { country, setCountry } = props;
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");

    const countryValue = CODE_TO_COUNTRY.get(country ?? "") ?? null;

    return (
        <Autocomplete
            id="country-select"
            sx={{ width: 300, padding: smallScreen ? 1 : 1.5 }}
            options={COUNTRIES}
            autoHighlight
            value={countryValue}
            onChange={(e, val) => setCountry(val?.code ?? undefined)}
            getOptionLabel={(option) => option.label}
            renderOption={({key, ...props}, option) => (
                <Box
                    component="li"
                    sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                    key={key}
                    {...props}
                >
                    <ReactCountryFlag countryCode={option.code} svg />
                    {option.label}
                </Box>
            )}
            renderInput={(params) => (
                <TextField {...params}
                    label="Country"
                    slotProps={{
                        htmlInput: {
                            ...params.inputProps,
                            autoComplete: "one-time-code", // disable autocomplete and autofill
                        }, 
                        input: {
                            ...params.InputProps,
                            startAdornment: (
                                country ?
                                <InputAdornment position="start" sx={{display: "flex", justifyContent: "center", margin: "auto", width: "32px"}}>
                                    <ReactCountryFlag countryCode={country} svg />
                                </InputAdornment> : undefined
                            )
                        }
                    }}
                />
            )}
        />
    );
}