import { useEffect } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { queries } from "../api/queries";
import { useLoginUser } from "../common/states";
import BansTab from "./moderation/BansTab";
import CommentsTab from "./moderation/CommentsTab";
import { Loading } from "./moderation/common";
import LogTab from "./moderation/LogTab";
import ModeratorsTab from "./moderation/ModeratorsTab";
import QueueTab from "./moderation/QueueTab";

const TABS = ["queue", "comments", "bans", "moderators", "log"] as const;
type ModTab = typeof TABS[number];

const TAB_LABELS: Record<ModTab, string> = {
    queue: "Queue",
    comments: "Comments",
    bans: "Bans",
    moderators: "Moderators",
    log: "Log"
};

function QueueLabel() {
    const queue = useQuery({ ...queries.mod.queue, refetchInterval: 60 * 1000 });
    const count = queue.data?.length ?? 0;
    return (
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
            {TAB_LABELS.queue}
            {count > 0 &&
            <Box
                component="span"
                sx={{
                    minWidth: 20,
                    height: 20,
                    px: 0.75,
                    borderRadius: "10px",
                    bgcolor: "warning.main",
                    color: "warning.contrastText",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    lineHeight: "20px",
                    textAlign: "center"
                }}>
                {count > 99 ? "99+" : count}
            </Box>}
        </Box>
    );
}

function TabContent(props: { tab: ModTab }) {
    switch (props.tab) {
        case "queue": return <QueueTab />;
        case "comments": return <CommentsTab />;
        case "bans": return <BansTab />;
        case "moderators": return <ModeratorsTab />;
        case "log": return <LogTab />;
    }
}

function Moderation() {
    const loginUserQuery = useLoginUser();
    const role = loginUserQuery.data?.commentRole;
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get("tab");
    const tab: ModTab = TABS.includes(tabParam as ModTab) ? tabParam as ModTab : "queue";

    useEffect(() => {
        document.title = "moderation - strafes";
    }, []);

    const setTab = (value: ModTab) => setSearchParams(value === "queue" ? {} : { tab: value }, { replace: true });

    return (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1, flexGrow: 1, pt: { xs: 0.5, sm: 2 } }}>
            <Paper elevation={0} sx={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "920px", p: { xs: 1, sm: 2.5 } }}>
                <Typography component="h1" variant="h5" sx={{ p: 1 }}>
                    Moderation
                </Typography>
                {loginUserQuery.isPending ? <Loading />
                : !role ?
                <Typography sx={{ color: "text.secondary", p: 1 }}>
                    Only comment moderators can see this page.
                </Typography>
                :
                <>
                    <Tabs
                        value={tab}
                        onChange={(_, value: ModTab) => setTab(value)}
                        variant="scrollable"
                        allowScrollButtonsMobile
                        sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                        {TABS.map((value) => (
                            <Tab key={value} value={value} label={value === "queue" ? <QueueLabel /> : TAB_LABELS[value]} />
                        ))}
                    </Tabs>
                    <TabContent tab={tab} />
                </>}
            </Paper>
        </Box>
    );
}

export default Moderation;
