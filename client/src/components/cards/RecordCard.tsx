import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { queries } from "../../api/queries";
import { formatCourse, formatPlacement, formatStyle, formatTime, Game, MAIN_COURSE, Style } from "shared";
import DiffDisplay from "../displays/DiffDisplay";
import DateDisplay from "../displays/DateDisplay";
import { CircularProgress, Stack, useMediaQuery, useTheme } from "@mui/material";
import { useOutletContext } from "react-router";
import { ContextParams } from "../../common/common";
import AccountBoxIcon from '@mui/icons-material/AccountBox';

interface RecordCardProps {
    mapId: number,
    course: number,
    userId: number,
    game: Game,
    style: Style
}

function RecordCard(props: RecordCardProps) {
    const { mapId, userId, course, game, style } = props;
    const { maps } = useOutletContext() as ContextParams;
    const theme = useTheme();
    const smallScreen = useMediaQuery("(max-width: 480px)");
    const { data: records, isLoading } = useQuery(queries.times.records(mapId, userId));

    const record = records ? records.find((time) => time.course === course && time.game === game && time.style === style) : undefined;
    const selectedMap = maps[mapId];

    return (
        <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column"}}>
            <Box display="flex" alignItems="center">
                <Typography variant="caption">
                    Your Time
                </Typography>
                <Box display="flex" title="You">
                    <AccountBoxIcon sx={{marginLeft: 0.75, mt: -0.5, fontSize: 20}} htmlColor={theme.palette.secondary.main} /> 
                </Box>
            </Box>
            <Box display="flex" flexDirection="column" mt={1} gap={1} minHeight="20px">
                {record ? 
                <>
                <Stack direction="row" useFlexGap divider={<Typography variant="body2" mx={1}>-</Typography>}>
                    <Typography 
                        variant="body2"
                        display="inline-block" 
                        fontFamily="monospace"
                        color="textPrimary"
                    >
                        {formatPlacement(record.placement)}
                    </Typography>
                    <Box display="flex" gap={0.75}>
                        <Typography 
                            variant="body2"
                            display="inline-block"
                            color="textPrimary"
                        >
                            {formatTime(record.time)}
                        </Typography>
                        <Typography variant="body2">
                            <DiffDisplay ms={record.time} diff={record.wrDiff} />
                        </Typography>
                    </Box>
                    {!smallScreen && <DateDisplay date={record.date} useDateTime color={theme.palette.text.secondary} variant="body2" />}
                </Stack>
                {smallScreen && <DateDisplay date={record.date} useDateTime color={theme.palette.text.secondary} variant="body2" />}
                </>
                :
                isLoading ?
                <CircularProgress size={20} />
                :
                <Typography variant="body2" color="textSecondary">
                    {`You haven't completed ${selectedMap?.name ?? "n/a"}${course !== MAIN_COURSE ? ` (${formatCourse(course)})` : ""} in ${formatStyle(style)}.`}
                </Typography>}
            </Box>
        </Paper>
    );
}

export default RecordCard;