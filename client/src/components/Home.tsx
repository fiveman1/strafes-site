import { ReactNode, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import { Link, Paper, Skeleton, Typography } from "@mui/material";
import { useOutletContext } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ALL_COURSES, Game, RankSortBy, Style, TimeSortBy, formatGame, formatRank, formatSkill, formatStyle } from "shared";
import { ContextParams } from "../common/common";
import { queries } from "../api/queries";
import { useNow } from "../common/states";
import MapCard from "./cards/MapCard";
import MapLink from "./displays/MapLink";
import UserLink from "./displays/UserLink";
import TimeDisplay from "./displays/TimeDisplay";
import DateDisplay from "./displays/DateDisplay";

const WR_COUNT = 8;
const RANK_COUNT = 10;
const MAP_COUNT = 6;

interface ISectionProps {
    title: string
    href: string
    linkLabel: string
    children: ReactNode
}

function Section(props: ISectionProps) {
    const { title, href, linkLabel, children } = props;
    return (
        <Box component="section" sx={{ minWidth: 0 }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 2,
                    mb: 1.25
                }}>
                <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {title}
                </Typography>
                <Link href={href} underline="hover" color="textSecondary" variant="body2" sx={{ whiteSpace: "nowrap" }}>
                    {linkLabel}
                </Link>
            </Box>
            {children}
        </Box>
    );
}

const rowSx = {
    display: "grid",
    alignItems: "center",
    columnGap: 2,
    px: 2,
    fontSize: "0.875rem",
    borderBottom: 1,
    borderColor: "divider",
    "&:last-of-type": { borderBottom: 0 }
};

const mapRowSx = {
    display: "grid",
    gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))", lg: "repeat(6, minmax(0, 1fr))" },
    gap: 2,
    "& > :nth-of-type(n+5)": { display: { xs: "none", lg: "flex" } }
};

function SkeletonRows(props: { count: number, height: number }) {
    return Array.from({ length: props.count }, (_, i) => (
        <Box key={i} sx={{ ...rowSx, height: props.height }}>
            <Skeleton variant="text" width={`${40 + ((i * 17) % 35)}%`} />
        </Box>
    ));
}

function Home() {
    const { settings, sortedMaps } = useOutletContext() as ContextParams;
    const game = settings.defaultGame;
    const style = settings.defaultStyle;

    const { data: wrs, isLoading: wrsLoading } = useQuery(queries.times.times(0, WR_COUNT - 1, TimeSortBy.DateDesc, ALL_COURSES, Game.all, Style.all, undefined, undefined, true));
    const { data: ranks, isLoading: ranksLoading } = useQuery(queries.ranks.ranks(0, RANK_COUNT - 1, RankSortBy.RankAsc, game, style));

    const [ now ] = useNow();
    const { newMaps, popularMaps } = useMemo(() => {
        const released = sortedMaps.filter((map) => new Date(map.date).getTime() <= now);
        return {
            newMaps: [...released].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, MAP_COUNT),
            popularMaps: [...released].sort((a, b) => b.loadCount - a.loadCount).slice(0, MAP_COUNT)
        };
    }, [now, sortedMaps]);

    useEffect(() => {
        document.title = "home - strafes"
    }, []);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: { xs: 4, md: 5 },
                p: 1,
                pt: { xs: 2, md: 3 },
                pb: 4
            }}>
            <Box>
                <Typography component="h1" variant="h5">
                    Bhop and surf leaderboards
                </Typography>
                <Typography color="textSecondary" sx={{ mt: 0.5 }}>
                    Times, ranks, and world records from the StrafesNET Roblox games.
                </Typography>
            </Box>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 3fr) minmax(0, 2fr)" },
                    alignItems: "start",
                    gap: { xs: 4, lg: 3 }
                }}>
                <Section title="Latest world records" href="/globals" linkLabel="All records">
                    <Paper>
                        {wrsLoading ? <SkeletonRows count={WR_COUNT} height={64} /> :
                        !wrs?.times.length ?
                        <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
                            No records found
                        </Typography> :
                        wrs.times.map((time) => (
                            <Box
                                key={time.id}
                                sx={{
                                    ...rowSx,
                                    height: { xs: 96, sm: 64 },
                                    gridTemplateColumns: { xs: "minmax(0, 1fr) auto", sm: "minmax(0, 5fr) minmax(0, 4fr) 108px 112px" },
                                    rowGap: 0.5,
                                    alignContent: "center"
                                }}>
                                <Box sx={{ minWidth: 0 }}>
                                    <MapLink id={time.mapId} name={time.map} style={time.style} game={time.game} course={time.course} showGame showStyle />
                                </Box>
                                <Box sx={{ minWidth: 0, order: { xs: 3, sm: 0 } }}>
                                    <UserLink
                                        userId={time.userId}
                                        username={time.username}
                                        userRoles={time.userRoles}
                                        userCountry={time.userCountry}
                                        userThumb={time.userThumb}
                                        game={time.game}
                                        strafesStyle={time.style}
                                        underline="hover"
                                        sx={{ fontWeight: 500 }}
                                    />
                                </Box>
                                <Box sx={{ justifySelf: { xs: "end", sm: "start" } }}>
                                    <TimeDisplay time={time} hideDiff />
                                </Box>
                                <Box sx={{ justifySelf: "end", order: { xs: 4, sm: 0 }, color: "text.secondary", whiteSpace: "nowrap" }}>
                                    <DateDisplay date={time.date} tooltipPlacement="left" />
                                </Box>
                            </Box>
                        ))}
                    </Paper>
                </Section>
                <Section title={`Top ranked · ${formatGame(game)} ${formatStyle(style)}`} href={`/ranks?game=${game}&style=${style}`} linkLabel="All ranks">
                    <Paper>
                        {ranksLoading ? <SkeletonRows count={RANK_COUNT} height={48} /> :
                        !ranks?.length ?
                        <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
                            No ranks found
                        </Typography> :
                        ranks.map((rank, i) => (
                            <Box
                                key={rank.userId}
                                sx={{
                                    ...rowSx,
                                    height: 48,
                                    gridTemplateColumns: "20px minmax(0, 1fr) auto 76px"
                                }}>
                                <Typography variant="inherit" color="textSecondary" sx={{ textAlign: "right" }}>
                                    {rank.placement ?? i + 1}
                                </Typography>
                                <Box sx={{ minWidth: 0 }}>
                                    <UserLink
                                        userId={rank.userId}
                                        username={rank.username}
                                        userRoles={rank.userRoles}
                                        userCountry={rank.userCountry}
                                        userThumb={rank.userThumb}
                                        game={game}
                                        strafesStyle={style}
                                        underline="hover"
                                        sx={{ fontWeight: 500 }}
                                    />
                                </Box>
                                <Typography variant="inherit" color="textSecondary" noWrap sx={{ display: { xs: "none", sm: "block" } }}>
                                    {formatRank(rank.rank)}
                                </Typography>
                                <Typography variant="inherit" sx={{ textAlign: "right", gridColumnEnd: -1 }}>
                                    {formatSkill(rank.skill)}
                                </Typography>
                            </Box>
                        ))}
                    </Paper>
                </Section>
            </Box>
            <Section title="New maps" href="/maps?mapSort=dateDesc" linkLabel="All maps">
                <Box sx={mapRowSx}>
                    {newMaps.map((map) => <MapCard key={map.id} map={map} />)}
                </Box>
            </Section>
            <Section title="Most played maps" href="/maps?mapSort=countDesc" linkLabel="All maps">
                <Box sx={mapRowSx}>
                    {popularMaps.map((map) => <MapCard key={map.id} map={map} />)}
                </Box>
            </Section>
        </Box>
    );
}

export default Home;
