import { Box, Divider, List, ListItem, Paper, Typography, useTheme } from "@mui/material";
import { darken, lighten } from "@mui/material/styles";
import { green, red } from "@mui/material/colors";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import { formatDiff, formatStyleShort, formatTime } from "shared";
import UserAvatar from "../displays/UserAvatar";
import DateDisplay from "../displays/DateDisplay";
import { CompareTimeInfo, TIE_COLOR } from "./types";
import { getStyleColor } from "../../common/common";

interface ICompareMapCardProps {
    info: CompareTimeInfo
}

function CompareMapCard(props: ICompareMapCardProps) {
    const { info } = props;
    const theme = useTheme();
    const isLightMode = theme.palette.mode === "light";

    const times = info.times;
    const bestColor = times.length >= 2 && times[0].time === times[1].time
        ? TIE_COLOR
        : times[0]?.userColor ?? theme.palette.grey[500];

    return (
        <Paper
            elevation={1}
            sx={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                transition: "box-shadow .3s ease",
                "&:hover": {
                    boxShadow: 6,
                },
            }}
        >
            {/* Compact header: thumbnail + map name */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    padding: 1,
                    borderBottom: `2px solid ${bestColor}`,
                    backgroundColor: isLightMode ? lighten(bestColor, 0.95) : darken(bestColor, 0.8),
                }}
            >
                {info.mapThumb ? (
                    <Box
                        component="img"
                        src={info.mapThumb}
                        alt={info.map}
                        sx={{
                            width: 50,
                            height: 50,
                            borderRadius: 1,
                            objectFit: "cover",
                            flexShrink: 0,
                        }}
                    />
                ) : (
                    <Box
                        sx={{
                            width: 50,
                            height: 50,
                            borderRadius: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "action.hover",
                            flexShrink: 0,
                        }}
                    >
                        <QuestionMarkIcon />
                    </Box>
                )}
                <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {info.map}
                </Typography>
            </Box>

            {/* Time rows */}
            <List disablePadding dense>
                {times.map((time, i) => {
                    const diff = i === 0 ? 0 : +time.time - +times[0].time;
                    const isTie = i > 0 && time.time === times[0].time;
                    const styleColor = getStyleColor(time.style, theme);

                    return (
                        <Box key={time.id}>
                            {i > 0 && <Divider />}
                            <ListItem sx={{ px: 1.5, py: 0.75 }}>
                                <Box display="flex" width="100%" gap={1}>
                                    {/* Left: color indicator + avatar + username/style stacked */}
                                    <Box
                                        sx={{
                                            borderLeft: `3px solid ${time.userColor}`,
                                            paddingLeft: 0.75,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            maxWidth: "60%",
                                            minWidth: 0,
                                        }}
                                    >
                                        <UserAvatar
                                            sx={{ height: 28, width: 28 }}
                                            username={time.username}
                                            userThumb={time.userThumb}
                                        />
                                        <Box display="flex" flexDirection="column" minWidth={0}>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {time.username}
                                            </Typography>
                                            <Box>
                                                <Typography
                                                    lineHeight={1.0}
                                                    fontWeight="bold" 
                                                    variant="caption"
                                                    display="inline-flex"
                                                    sx={{
                                                        padding: 0.3,
                                                        backgroundColor: styleColor,
                                                        textAlign: "center",
                                                        color: "white",
                                                        textShadow: "black 1px 1px 1px",
                                                        borderRadius: "6px",
                                                        border: 1,
                                                        borderColor: styleColor,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap"
                                                    }}
                                                >
                                                    {formatStyleShort(time.style)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Right: Time/diff/date */}
                                    <Box display="flex" flexDirection="column" alignItems="flex-end" flexGrow={1} justifyContent="center" sx={{textAlign: "right"}}>
                                        <Typography
                                            variant="body2"
                                            fontWeight="bold"
                                            fontFamily="monospace"
                                        >
                                            {formatTime(time.time)}
                                        </Typography>
                                        {diff > 0 && !isTie ? (
                                                <Typography
                                                    variant="caption"
                                                    fontFamily="monospace"
                                                    color={red["A400"]}
                                                >
                                                    +{formatDiff(diff)}
                                                </Typography>
                                            ) : (
                                                <Typography
                                                    variant="caption"
                                                    fontFamily="monospace"
                                                    fontWeight="bold"
                                                    color={
                                                        isTie
                                                            ? TIE_COLOR
                                                            : theme.palette.mode === "dark"
                                                                ? green["A400"]
                                                                : darken(green["A400"], 0.15)
                                                    }
                                                >
                                                    {isTie ? "tie" : "best"}
                                                </Typography>
                                            )}
                                        <DateDisplay
                                            date={time.date}
                                            variant="caption"
                                            tooltipPlacement="top"
                                        />
                                    </Box>
                                </Box>
                            </ListItem>
                        </Box>
                    );
                })}
            </List>
        </Paper>
    );
}

export default CompareMapCard;
