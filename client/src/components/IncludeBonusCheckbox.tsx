import { Box, Checkbox, FormControlLabel, FormGroup, FormHelperText } from "@mui/material";
import { useLocation, useNavigate } from "react-router";

interface IIncludeCheckboxParams {
    includeBonuses: boolean
    setIncludeBonuses: (val: boolean) => void
}

function IncludeBonusCheckbox(params: IIncludeCheckboxParams) {
    const {includeBonuses, setIncludeBonuses} = params;

    const location = useLocation();
    const navigate = useNavigate();

    const handleChangeIncludeBonuses = (checked: boolean) => {
        const queryParams = new URLSearchParams(location.search);
        queryParams.set("bonuses", checked ? "true" : "false");
        navigate({ search: queryParams.toString() }, { replace: true });
        setIncludeBonuses(checked);
    };
    
    return (
    <Box padding={1}>
        <FormGroup>
            <FormControlLabel label="Bonuses" control={
                <Checkbox checked={includeBonuses} onChange={(event, checked) => handleChangeIncludeBonuses(checked)} />}  
            />
            <FormHelperText sx={{mt: -0.5}}>{includeBonuses ? "Showing bonuses" : "Hiding bonuses"}</FormHelperText>
        </FormGroup>
        
    </Box>
    );
}

export default IncludeBonusCheckbox;