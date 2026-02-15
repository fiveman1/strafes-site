import { Box, Checkbox, FormControlLabel, FormGroup, FormHelperText } from "@mui/material";

interface IIncludeCheckboxParams {
    includeBonuses: boolean
    setIncludeBonuses: (val: boolean) => void
}

function IncludeBonusCheckbox(params: IIncludeCheckboxParams) {
    const {includeBonuses, setIncludeBonuses} = params;

    const handleChangeIncludeBonuses = (checked: boolean) => {
        setIncludeBonuses(checked);
    };
    
    return (
    <Box padding={1} pt={0.25} pb={0.25}>
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