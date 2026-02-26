import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { useCallback, useEffect, useRef, useState } from "react";
import { clamp, normalize } from "../../common/utils";

interface ProgressSliderProps {
    min: number
    max: number
    value: number
    onDragPlayback: (time: number) => void
    onSetPlayback: (time: number) => void
    isDragging: boolean
    setIsDragging: (drag: boolean) => void
}

function ProgressSlider(props: ProgressSliderProps) {
    const { min, max, value, onDragPlayback, onSetPlayback, isDragging, setIsDragging } = props;
    const theme = useTheme();
    const [ isHovering, setIsHovering ] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    const diff = max - min;
    const lerp = (value - min) / diff;
    const offset= `${lerp * 100}%`;

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (!ref.current || !isDragging) return;
            const rect = ref.current.getBoundingClientRect();
            const x = clamp(event.clientX, rect.left, rect.right);
            const newPlayback = normalize(x, rect.left, rect.right, min, max);
            onDragPlayback(newPlayback);
        };
        document.addEventListener("mousemove", handler)
        return () => {
            document.removeEventListener("mousemove", handler);
        }
    }, [isDragging, max, min, onDragPlayback]);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (!ref.current || !isDragging) return;
            const rect = ref.current.getBoundingClientRect();
            const x = clamp(event.clientX, rect.left, rect.right);
            const newPlayback = normalize(x, rect.left, rect.right, min, max);
            onSetPlayback(newPlayback);
            setIsDragging(false);
        };
        document.addEventListener("mouseup", handler)
        return () => {
            document.removeEventListener("mouseup", handler);
        }
    }, [isDragging, max, min, onSetPlayback, setIsDragging]);

    const onMouseDown = useCallback(() => {
        setIsDragging(true);
    }, [setIsDragging]);

    const onMouseOver = useCallback(() => {
        setIsHovering(true);
    }, []);

    const onMouseLeave = useCallback(() => {
        setIsHovering(false);
    }, []);

    return (
        <Box 
            component="span" 
            position="relative" 
            width="100%" 
            height="40px" 
            ref={ref} 
            onMouseDown={onMouseDown} 
            onMouseOver={onMouseOver} 
            onMouseLeave={onMouseLeave}
        >
            <Box 
                component="span" 
                position="absolute" 
                width="100%"
                height="6px"
                top="50%" 
                borderRadius="2px"
                bgcolor="white"
                sx={{
                    transform: "translateY(-50%)",
                    opacity: 0.3
                }}
            />
            <Box 
                component="span" 
                position="absolute" 
                width="100%"
                height="8px"
                top="50%" 
                left="0%"
                borderRadius="2px"
                style={{width: offset}}
                bgcolor={theme.palette.primary.main}
                sx={{
                    transform: "translateY(-50%)",
                    transition: "opacity .15s ease",
                    opacity: isDragging || isHovering ? 1 : 0.7
                }}
            />
            <Box 
                component="span" 
                position="absolute" 
                width="12px"
                height="12px"
                top="50%"
                left={offset}
                borderRadius="50%"
                bgcolor={theme.palette.primary.main}
                sx={{
                    transform: "translate(-50%, -50%)",
                    transition: "opacity .3s ease",
                    opacity: isHovering ? 1 : 0
                }}
            />
        </Box>
    );
}

export default ProgressSlider;