import { useState, useCallback } from 'react';
import { Select, MenuItem, Popper, Paper, ClickAwayListener, MenuList, useTheme } from '@mui/material';

interface SelectOption<T extends string | number> {
    value: T
    label: string
}

interface PopperSelectProps<T extends string | number> {
    options: SelectOption<T>[]
    value: T
    setValue: (value: T) => void
    label: string
}

function PopperSelect<T extends string | number>(props: PopperSelectProps<T>) {
    const { options, value: selectedValue, setValue, label } = props;
    const theme = useTheme();
    const isLight = theme.palette.mode === "light";
    
    const [ anchorEl, setAnchorEl ] = useState<HTMLElement | null>(null);

    const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    return (
        <>
            <Select
                value={selectedValue}
                label={label}
                open={false}
                onClick={handleOpen}
                sx={{
                    "& .MuiSelect-icon": {
                        transform: anchorEl !== null ? "rotate(180deg)" : undefined
                    }
                }}
            >
                {options.map(({value, label}) => <MenuItem value={value}>{label}</MenuItem>)}
            </Select>

            <Popper open={anchorEl !== null} anchorEl={anchorEl} placement="bottom-start">
                <ClickAwayListener onClickAway={handleClose}>
                    <Paper sx={{ mt: "6px", borderRadius: "10px", boxShadow: isLight ? "0 18px 45px rgba(45, 25, 55, 0.14)" : "0 20px 52px rgba(0, 0, 0, 0.46), 0 0 28px rgba(255, 79, 154, 0.06)"}}>
                        <MenuList sx={{ p: "6px" }}>
                            {options.map(({value, label}) => <MenuItem selected={value === selectedValue} key={value} onClick={() => {setValue(value); handleClose();}} value={value}>{label}</MenuItem>)}
                        </MenuList>
                        
                    </Paper>
                </ClickAwayListener>
            </Popper>
        </>
    );
}

export default PopperSelect;