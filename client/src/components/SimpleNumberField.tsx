import { ChangeEvent, useEffect, useRef, useState } from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';

// Adapted from here https://github.com/mui/material-ui/issues/44284#issuecomment-2687922477

const validationRegex = /^\d*$/g; // positive digits

export type NumberFieldProps = TextFieldProps & {
    value: number
    onValueChange: (value: number) => void;
};

export default function SimpleNumberField(allProps: NumberFieldProps) {
    const { value, onValueChange, sx: propsSx, ...props } = allProps;

    const [fieldValue, setFieldValue] = useState<string | number>(value || '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFieldValue(value || '');
    }, [value]);

    // Handle updating the input and real value
    const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, isBlur?: boolean) => {
        const { value: inputValue } = event.target;

        if (!inputValue.match(validationRegex)) return false;

        setFieldValue(inputValue);

        if (isBlur && inputValue) onValueChange(Number.parseInt(inputValue, 10));
    };

    // If valid, update value, otherwise reset input back to last valid value
    const handleBlur = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!handleChange(event, true)) {
            setFieldValue(value);
        }
    };

    // Blur focus when you press enter
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            inputRef.current?.blur();
        }
    }

    return (
        <TextField
            {...props}
            type="text" // if we use "number", we need to take care of formatting and handle onWheel, onTouchStart and onTouchMove events
            value={fieldValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onFocus={(e) => e.target.select()}
            inputRef={inputRef}
            slotProps={{
                input: {
                    inputMode: "numeric"
                }
            }}
            sx={propsSx}
        />
    );
}