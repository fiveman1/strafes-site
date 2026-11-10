import { useQuery } from "@tanstack/react-query";
import Typography from "@mui/material/Typography";
import { queries } from "../../api/queries";
import { LoadFailed, Loading } from "./common";
import ModCommentList from "./ModCommentList";

function QueueTab() {
    const queue = useQuery({ ...queries.mod.queue, refetchInterval: 60 * 1000 });

    if (queue.isPending) return <Loading />;
    if (!queue.data) return <LoadFailed what="the queue" query={queue} />;

    return (
        <>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
                Comments held back by the filter or with open reports.
            </Typography>
            <ModCommentList comments={queue.data} emptyText="Nothing to review" />
        </>
    );
}

export default QueueTab;
