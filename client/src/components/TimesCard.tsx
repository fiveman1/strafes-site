import React, { useEffect, useState } from "react";
import { Box, LinearProgress, Paper, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow, Tooltip, Typography } from "@mui/material";
import { Game, Map, Style, Time } from "../api/interfaces";
import { formatGame, formatStyle, formatTime } from "../util/format";
import { getTimeData } from "../api/api";

interface ITimeRowProps {
    time: Time
    index: number
    dateFormat: Intl.DateTimeFormat
    timeFormat: Intl.DateTimeFormat
    hideUser?: boolean
    hideMap?: boolean
}

function TimeRow(props: ITimeRowProps) {
    const { time, index, dateFormat, timeFormat, hideUser, hideMap } = props;
    const dateValue = new Date(time.date);
    return (
    <TableRow hover>
        <TableCell sx={{color: "GrayText", maxWidth: "48px"}} >{index}</TableCell>
        {!hideUser ? <TableCell>{time.username}</TableCell> : <></>}
        {!hideMap ? <TableCell>{time.map}</TableCell> : <></>}
        <TableCell>{formatTime(time.time)}</TableCell>
        <TableCell>
            <Tooltip placement="right" title={timeFormat.format(dateValue)}>
                <Box display="inline-block">
                    {dateFormat.format(dateValue)}
                </Box>
            </Tooltip>
        </TableCell>
        <TableCell>{formatGame(time.game)}</TableCell>
        <TableCell>{formatStyle(time.style)}</TableCell>
    </TableRow>
    );
}

const dateFormat = Intl.DateTimeFormat(undefined, {
    year: "numeric",
    day: "2-digit",
    month: "2-digit"
});

const timeFormat = Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
});

export interface ITimesCardProps {
    userId?: string
    map?: Map
    game?: Game
    style: Style
    onlyWRs?: boolean
    hideUser?: boolean
    hideMap?: boolean
}

function TimesCard(props: ITimesCardProps) {
    const { userId, map, game, style, onlyWRs, hideUser, hideMap } = props;
    const [times, setTimes] = useState<Time[]>([]);
    const [gridTimes, setGridTimes] = useState<Time[]>([]);
    const [page, setPage] = useState(0);
    const [numTimes, setNumTimes] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!userId && !map) {
            setTimes([]);
            setPage(0);
            setNumTimes(0);
            return;
        }
        setIsLoading(true);
        getTimeData(game, style, userId, map, onlyWRs).then((times) => {
            if (!times) {
                setTimes([]);
                setNumTimes(0);
            }
            else {
                setTimes(times.times);
                setNumTimes(times.pagination.totalItems);
            }
            setPage(0);
            setIsLoading(false);
        });
    }, [userId, map, game, style, onlyWRs]);

    useEffect(() => {
        const sliced = times.slice(page * rowsPerPage, (page * rowsPerPage) + rowsPerPage);
        setGridTimes(sliced);
    }, [times, page, rowsPerPage]);

    const handlePageChange = (event: React.MouseEvent<HTMLButtonElement> | null, page: number) => {
        setPage(page);
    };

    const handleRowsPerPageChange: React.ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement> = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    let numCols = 5;
    if (!hideUser) ++numCols;
    if (!hideMap) ++numCols;

    return (
    <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column"}}>
        <Box display="flex">
            <Typography variant="caption" marginBottom={1}>
                Times
            </Typography>
        </Box>
        <TableContainer elevation={1} component={Paper}>
            <Table size="small" stickyHeader>
                <colgroup>
                    <col width="48px"></col>
                    {!hideUser ? <col width="300px"></col> : <></>}
                    {!hideMap ? <col width="450px"></col> : <></>}
                    <col width="150px"></col>
                    <col width="170px"></col>
                    <col width="110px"></col>
                    <col width="210px"></col>
                </colgroup>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{color: "GrayText", maxWidth: "48px"}}>#</TableCell>
                        {!hideUser ? <TableCell>User</TableCell> : <></>}
                        {!hideMap ? <TableCell>Map</TableCell> : <></>}
                        <TableCell>Time</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Game</TableCell>
                        <TableCell>Style</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {gridTimes.map((time, index) => (
                        <TimeRow 
                            key={index} 
                            index={index + (page * rowsPerPage) + 1} 
                            time={time} 
                            dateFormat={dateFormat} 
                            timeFormat={timeFormat}
                            hideUser={hideUser}
                            hideMap={hideMap}
                        />
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            colSpan={numCols}
                            count={numTimes}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            showFirstButton
                            showLastButton
                            onPageChange={handlePageChange}
                            onRowsPerPageChange={handleRowsPerPageChange}
                        />
                    </TableRow>
                </TableFooter>
            </Table>
        </TableContainer>
        {loading ? <LinearProgress  /> : <></>}
    </Paper>
    );
}

export default TimesCard;