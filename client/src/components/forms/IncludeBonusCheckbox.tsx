import { Box, Checkbox, FormControlLabel, FormGroup } from "@mui/material";

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
        <Box
            sx={{
                padding: 1,
                pt: 0.25,
                pb: 0.25
            }}>
            <FormGroup>
                <FormControlLabel label="Bonuses" control={
                    <Checkbox checked={includeBonuses} onChange={(event, checked) => handleChangeIncludeBonuses(checked)} />}  
                />
            </FormGroup>
        </Box>
    );
}

export default IncludeBonusCheckbox;