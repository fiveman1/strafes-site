import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import Box from '@mui/material/Box';
import { Map as StrafesMap } from 'shared';
import { UNRELEASED_MAP_COLOR } from '../../common/colors';
import { SxProps, Theme, useTheme } from '@mui/material';
import { useState } from 'react';
import { thumbHashToDataURL } from 'thumbhash';

interface MapThumbProps {
    size: number
    map: StrafesMap | undefined
    disableUnreleasedColor?: boolean
    className?: string
    useLargeThumb?: boolean
    sx?: SxProps<Theme>
}

// Decoding is cheap but the same maps render in many places, so only do it once per hash
const placeholderCache = new Map<string, string>();

function getPlaceholderUrl(thumbHash: string) {
    let url = placeholderCache.get(thumbHash);
    if (url === undefined) {
        try {
            url = thumbHashToDataURL(Uint8Array.from(atob(thumbHash), (c) => c.charCodeAt(0)));
        }
        catch {
            url = "";
        }
        placeholderCache.set(thumbHash, url);
    }
    return url;
}

function MapThumb(props: MapThumbProps) {
    const { size, map, disableUnreleasedColor, className, useLargeThumb, sx } = props;
    const theme = useTheme();
    const [loadedSrc, setLoadedSrc] = useState<string>();

    let thumb = "";
    let name = "";
    let isUnreleased = false;
    if (map) {
        thumb = (useLargeThumb ? map.largeThumb : map.smallThumb) ?? "";
        name = map.name;
        isUnreleased = !disableUnreleasedColor && new Date() < new Date(map.date);
    }

    if (!thumb) {
        return <QuestionMarkIcon className={className} htmlColor={isUnreleased ? UNRELEASED_MAP_COLOR : theme.palette.text.primary} sx={{ ...sx, fontSize: size }} />;
    }

    // Show a blurry placeholder behind the image until it loads. It's removed afterwards in case the thumbnail has transparency.
    const placeholder = loadedSrc !== thumb && map?.thumbHash ? getPlaceholderUrl(map.thumbHash) : "";

    return (
        <Box
            component="img"
            className={className}
            src={thumb}
            alt={name}
            onLoad={() => setLoadedSrc(thumb)}
            sx={{
                height: size,
                width: size,
                outline: "1px solid",
                outlineOffset: -1,
                outlineColor: isUnreleased ? UNRELEASED_MAP_COLOR : (theme.palette.mode === "light" ? "oklch(0 0 0 / 0.1)" : "oklch(1 0 0 / 0.1)"),
                borderRadius: `${Math.min(10, Math.round(size / 12))}px`,
                ...(placeholder && {
                    backgroundImage: `url(${placeholder})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat"
                }),
                ...sx,

                // Makes sure browser reserves the right amount of space while image still loading
                aspectRatio: 1
            }} />
    );
}

export default MapThumb;