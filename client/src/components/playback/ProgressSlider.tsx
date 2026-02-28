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
    const offset = `${lerp * 100}%`;

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (!ref.current || !isDragging) return;
            const rect = ref.current.getBoundingClientRect();
            const x = clamp(event.clientX, rect.left, rect.right);
            const newPlayback = normalize(x, rect.left, rect.right, min, max);
            onDragPlayback(newPlayback);
        };
        document.addEventListener("mousemove", handler);
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
        document.addEventListener("mouseup", handler);
        return () => {
            document.removeEventListener("mouseup", handler);
        }
    }, [isDragging, max, min, onSetPlayback, setIsDragging]);

    useEffect(() => {
        const handler = (event: TouchEvent) => {
            if (!ref.current || !isDragging || event.touches.length !== 1 || event.targetTouches.length !== 1) return;
            event.preventDefault();
            const rect = ref.current.getBoundingClientRect();
            const x = clamp(event.targetTouches[0].clientX, rect.left, rect.right);
            const newPlayback = normalize(x, rect.left, rect.right, min, max);
            onDragPlayback(newPlayback);
        };
        document.addEventListener("touchmove", handler, { passive: false });
        return () => {
            document.removeEventListener("touchmove", handler);
        }
    }, [isDragging, max, min, onDragPlayback]);

    useEffect(() => {
        const handler = (event: TouchEvent) => {
            if (!ref.current || !isDragging || event.changedTouches.length !== 1) return;
            event.preventDefault();
            setIsDragging(false);
            const rect = ref.current.getBoundingClientRect();
            const x = clamp(event.changedTouches[0].clientX, rect.left, rect.right);
            const newPlayback = normalize(x, rect.left, rect.right, min, max);
            onSetPlayback(newPlayback);
        };
        document.addEventListener("touchend", handler, { passive: false });
        return () => {
            document.removeEventListener("touchend", handler);
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
            sx={{ cursor: "pointer" }}
            ref={ref}
            onMouseDown={onMouseDown}
            onTouchStart={onMouseDown}
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
                bgcolor={theme.palette.primary.main}
                style={{
                    width: offset
                }}
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
                borderRadius="50%"
                bgcolor={theme.palette.primary.main}
                style={{
                    left: offset
                }}
                sx={{
                    transform: isDragging || isHovering ? "translate(-50%, -50%) scale(1.25)" : "translate(-50%, -50%)",
                    transition: "transform .15s ease"
                }}
            />
        </Box>
    );
}

export default ProgressSlider;