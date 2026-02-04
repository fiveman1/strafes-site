import { Box, Checkbox, FormControlLabel, FormGroup, FormHelperText, useMediaQuery } from "@mui/material";
import { useLocation, useNavigate } from "react-router";

interface IIncludeCheckboxParams {
    includeBonuses: boolean
    setIncludeBonuses: (val: boolean) => void
}

function IncludeBonusCheckbox(params: IIncludeCheckboxParams) {
    const {includeBonuses, setIncludeBonuses} = params;

    const location = useLocation();
    const navigate = useNavigate();
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");

    const handleChangeIncludeBonuses = (checked: boolean) => {
        const queryParams = new URLSearchParams(location.search);
        queryParams.set("bonuses", checked ? "true" : "false");
        navigate({ search: queryParams.toString() }, { replace: true });
        setIncludeBonuses(checked);
    };
    
    return (
    <Box padding={smallScreen ? 1 : 1.5}>
        <FormGroup>
            <FormControlLabel label="Bonuses" control={
                <Checkbox checked={includeBonuses} onChange={(event, checked) => handleChangeIncludeBonuses(checked)} />}  
            />
        </FormGroup>
        <FormHelperText>{includeBonuses ? "Showing bonuses" : "Hiding bonuses"}</FormHelperText>
    </Box>
    );
}

export default IncludeBonusCheckbox;