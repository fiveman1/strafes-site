// import { Box, FormControl,  MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { Box, FormControl, InputLabel } from "@mui/material";
import { bhop_styles, Style, formatStyle, getAllowedStyles, Game } from "shared";
import PopperSelect from "./PopperSelect";

interface IStyleSelectorProps {
    game: Game
    style: Style
    setStyle: (style: Style) => void
    allowSelectAll?: boolean
    label?: string
}

function StyleSelector(props: IStyleSelectorProps) {
    const { game, style, setStyle, allowSelectAll, label } = props;

    // const handleChangeStyle = (event: SelectChangeEvent<Style>) => {
    //     const style = event.target.value;
    //     setStyle(style);
    // };

    let styles = game === undefined ? [...bhop_styles] : [...getAllowedStyles(game)];
    if (styles.length === 0) {
        styles = [...bhop_styles];
    }

    if (allowSelectAll) {
        styles.push(Style.all);
    }

    const realStyle = styles.includes(style) ? style : styles[0];
    const inputLabel = label ?? "Style";

    const values = styles.map((style) => {return {value: style, label: formatStyle(style)}});
    return (
        <Box
            sx={{
                padding: 1,
                pb: 0.5
            }}>
            <FormControl sx={{ width: "150px" }}>
                <InputLabel>{inputLabel}</InputLabel>
                <PopperSelect
                    value={realStyle}
                    label={inputLabel}
                    setValue={setStyle}
                    options={values}
                />
                {/* <Select
                    value={realStyle}
                    label={inputLabel}
                    onChange={handleChangeStyle}
                    MenuProps={{
                        disablePortal: true
                    }}
                >
                    {styles.map((style) => <MenuItem value={style}>{formatStyle(style)}</MenuItem>)}
                </Select> */}
            </FormControl>
        </Box>
    );
}

export default StyleSelector;