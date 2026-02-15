import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import Box from '@mui/material/Box';
import { Map } from 'shared';
import { UNRELEASED_MAP_COLOR } from '../../common/colors';
import { SxProps, Theme, useTheme } from '@mui/material';

interface MapThumbProps {
    size: number
    map: Map | undefined
    useLargeThumb?: boolean
    sx?: SxProps<Theme>
}

function MapThumb(props: MapThumbProps) {
    const { size, map, useLargeThumb, sx } = props;
    const theme = useTheme();

    let thumb = "";
    let name = "";
    let isUnreleased = false;
    if (map) {
        thumb = (useLargeThumb ? map.largeThumb : map.smallThumb) ?? "";
        name = map.name;
        isUnreleased = new Date() < new Date(map.date);
    }

    if (!thumb) {
        return <QuestionMarkIcon htmlColor={isUnreleased ? UNRELEASED_MAP_COLOR : theme.palette.text.primary} sx={{ ...sx, fontSize: size }} />;
    }

    return (
        <Box
            component="img"
            height={size}
            width={size}
            src={thumb}
            alt={name}
            border={isUnreleased ? 1 : 0}
            borderColor={isUnreleased ? UNRELEASED_MAP_COLOR : undefined}
            borderRadius={`${Math.min(10, Math.round(size / 12))}px`}
            sx={{
                ...sx,
                aspectRatio: 1 // Makes sure browser reserves the right amount of space while image still loading
            }}
        />
    );
}

export default MapThumb;