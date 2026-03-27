import { useMemo } from "react";
import { Alert, Box, LinearProgress, Paper, Typography, useMediaQuery, useTheme } from "@mui/material";
import { lighten } from "@mui/material/styles";
import { grey } from "@mui/material/colors";
import { PieChart, PieSeriesType, PieValueType } from "@mui/x-charts";
import percentRound from "percent-round";
import { Time, User, formatStyleShort } from "shared";
import {
    CompareEntry,
    ENTRY_COLORS,
    TIE_COLOR,
    getWinSliceIndex,
    getTieSliceIndex,
    getExclusiveSliceIndex,
} from "./types";

interface IdToUser {
    [userId: string]: {
        user?: User
        loading: boolean
    } | undefined
}

interface ICompareChartProps {
    entries: CompareEntry[]
    idToUser: IdToUser
    entryTimes: (Time[] | undefined)[]
    isLoading: boolean
    selectedSlice?: number
    setSelectedSlice: (slice?: number) => void
    duplicateWarning?: string
}

function CompareChart(props: ICompareChartProps) {
    const { entries, idToUser, entryTimes, isLoading, selectedSlice, setSelectedSlice, duplicateWarning } = props;

    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");
    const theme = useTheme();

    const series: PieSeriesType<PieValueType>[] = useMemo(() => {
        if (entries.length < 2) return [];

        // Check all times are loaded
        for (const times of entryTimes) {
            if (times === undefined) return [];
        }

        const numEntries = entries.length;

        // Build map: mapId -> entryIndex -> Time
        const mapToEntryTimes = new Map<number, Map<number, Time>>();
        for (let i = 0; i < numEntries; i++) {
            const times = entryTimes[i]!;
            for (const time of times) {
                let entryMap = mapToEntryTimes.get(time.mapId);
                if (!entryMap) {
                    entryMap = new Map();
                    mapToEntryTimes.set(time.mapId, entryMap);
                }
                // Only keep the first (best) time per entry per map
                if (!entryMap.has(i)) {
                    entryMap.set(i, time);
                }
            }
        }

        // Count outcomes
        const wins = new Array(numEntries).fill(0);
        const exclusive = new Array(numEntries).fill(0);
        let ties = 0;

        mapToEntryTimes.forEach((entryMap) => {
            const presentEntries = Array.from(entryMap.entries());

            if (presentEntries.length === 1) {
                exclusive[presentEntries[0][0]]++;
                return;
            }

            // Find the best time
            let bestTime = Infinity;
            for (const [, time] of presentEntries) {
                if (time.time < bestTime) bestTime = time.time;
            }

            // Count how many entries have the best time
            const winners = presentEntries.filter(([, time]) => time.time === bestTime);
            if (winners.length > 1) {
                ties++;
            } else {
                wins[winners[0][0]]++;
            }
        });

        const totalMaps = mapToEntryTimes.size;
        const sliceValues = [...wins, ties, ...exclusive];
        let roundedPercents = sliceValues.map(() => "n/a");
        if (totalMaps > 0) {
            const percents = sliceValues.map(v => v / totalMaps);
            roundedPercents = percentRound(percents, 1).map((num) => num.toFixed(1));
        }

        // Build slice colors
        const sliceColors: string[] = [];
        // Win slices
        for (let i = 0; i < numEntries; i++) {
            sliceColors.push(ENTRY_COLORS[i % ENTRY_COLORS.length]);
        }
        // Tie slice
        sliceColors.push(TIE_COLOR);
        // Exclusive slices
        for (let i = 0; i < numEntries; i++) {
            sliceColors.push(lighten(ENTRY_COLORS[i % ENTRY_COLORS.length], 0.5));
        }

        // Gray out non-selected slices
        if (selectedSlice !== undefined) {
            for (let i = 0; i < sliceColors.length; i++) {
                if (i !== selectedSlice) {
                    sliceColors[i] = grey[500];
                }
            }
        }

        // Build labels
        const getEntryLabel = (i: number) => {
            const user = idToUser[entries[i].userId]?.user;
            const name = user?.username ?? "...";
            return numEntries > 2 ? `${name} (${formatStyleShort(entries[i].style)})` : name;
        };

        const data: PieValueType[] = [];
        for (let i = 0; i < numEntries; i++) {
            data.push({
                id: getWinSliceIndex(i),
                value: wins[i],
                label: `${getEntryLabel(i)} wins`,
                color: sliceColors[getWinSliceIndex(i)],
            });
        }
        data.push({
            id: getTieSliceIndex(numEntries),
            value: ties,
            label: "Ties",
            color: sliceColors[getTieSliceIndex(numEntries)],
        });
        for (let i = 0; i < numEntries; i++) {
            data.push({
                id: getExclusiveSliceIndex(i, numEntries),
                value: exclusive[i],
                label: `${getEntryLabel(i)} exclusive`,
                color: sliceColors[getExclusiveSliceIndex(i, numEntries)],
            });
        }

        return [{
            type: "pie",
            highlightScope: { fade: "global", highlight: "item" },
            faded: { innerRadius: 30, additionalRadius: -30 },
            id: "data",
            data,
            valueFormatter: (val) => `${val.value} (${roundedPercents[data.findIndex(d => d.id === val.id)] ?? "n/a"}%)`,
        }];
    }, [entries, entryTimes, idToUser, selectedSlice]);

    if (duplicateWarning || entries.length < 2) {
        const message = duplicateWarning ?? "Add at least 2 users to compare";
        return (
            <Paper elevation={2} sx={{ padding: 2, display: "flex", flexDirection: "column" }}>
                <Typography variant="caption">Compare</Typography>
                <Box display="flex" alignContent="center" justifyContent="center" padding={2}>
                    {duplicateWarning ? (
                        <Alert severity="warning" sx={{ width: "100%" }}>{message}</Alert>
                    ) : (
                        <Typography variant="body2" color="textSecondary">{message}</Typography>
                    )}
                </Box>
                {isLoading && <LinearProgress />}
            </Paper>
        );
    }

    return (
        <Paper elevation={2} sx={{ padding: 2, display: "flex", flexDirection: "column" }}>
            <Box display="flex" flexDirection="row">
                <Typography variant="caption">Compare</Typography>
                <Typography
                    flexGrow={1}
                    variant="caption"
                    fontStyle="italic"
                    color={theme.palette.text.secondary}
                    textAlign="right"
                >
                    Click on a slice to filter
                </Typography>
            </Box>
            <PieChart
                height={smallScreen ? 250 : 350}
                width={smallScreen ? 250 : 350}
                onItemClick={(_event, item) => {
                    if (item.dataIndex === selectedSlice) {
                        setSelectedSlice(undefined);
                    } else {
                        setSelectedSlice(item.dataIndex);
                    }
                }}
                slotProps={{
                    legend: {
                        direction: "horizontal",
                    },
                }}
                series={series}
            />
            {isLoading && <LinearProgress />}
        </Paper>
    );
}

export default CompareChart;
