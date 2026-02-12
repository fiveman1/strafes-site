import { ChangeEvent, useRef, useState } from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';

// Adapted from here https://github.com/mui/material-ui/issues/44284#issuecomment-2687922477

const validationRegex = /^\d*$/g; // positive digits

export type NumberFieldProps = TextFieldProps & {
    value: number
    onValueChange: (value: number) => number
    max?: number
};

export default function SimpleNumberField(allProps: NumberFieldProps) {
    const { value, onValueChange, max, sx: propsSx, ...props } = allProps;

    const [fieldValue, setFieldValue] = useState<string | number>(value || "");
    const inputRef = useRef<HTMLInputElement>(null);

    // Handle updating the input and real value
    const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, isBlur?: boolean) => {
        const { value: inputValue } = event.target;

        if (!inputValue.match(validationRegex)) return;

        let parsed = Number.parseInt(inputValue, 10);

        if (isNaN(parsed)) {
            setFieldValue(isBlur ? value : "");
            return;
        }

        if (max !== undefined && parsed > max) {
            parsed = max;
        }

        if (isBlur) {
            const newValue = onValueChange(parsed);
            setFieldValue(newValue);
        }
        else {
            setFieldValue(parsed);
        }
    };
    
    const handleBlur = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        handleChange(event, true);
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
            type="text"
            value={fieldValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onFocus={() => inputRef.current?.select()}
            inputRef={inputRef}
            slotProps={{
                input: {
                    inputMode: "numeric"
                },
                htmlInput: {
                    inputMode: "numeric",
                    pattern: "[0-9]*"
                }
            }}
            sx={propsSx}
        />
    );
}