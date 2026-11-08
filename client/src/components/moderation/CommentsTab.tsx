import { FormEvent, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ReplayCommentStatus } from "shared";
import { ModCommentSearch } from "../../api/api";
import { queries } from "../../api/queries";
import { useUserSearch } from "../../common/states";
import UserSearch from "../search/UserSearch";
import { LoadFailed, Loading, PageControls } from "./common";
import ModCommentList from "./ModCommentList";

const STATUS_OPTIONS: { value: ReplayCommentStatus | "", label: string }[] = [
    { value: "", label: "Any" },
    { value: "visible", label: "Visible" },
    { value: "pending", label: "Waiting for review" },
    { value: "hidden", label: "Hidden" },
    { value: "deleted", label: "Deleted" }
];

function CommentsTab() {
    const userSearch = useUserSearch();
    const [timeId, setTimeId] = useState("");
    const [status, setStatus] = useState<ReplayCommentStatus | "">("");
    const [error, setError] = useState("");
    const [search, setSearch] = useState<ModCommentSearch>({ page: 1 });

    const results = useQuery({ ...queries.mod.comments(search), placeholderData: keepPreviousData });

    // Picking a user or a status searches right away; the time ID searches on enter
    const setUser = (id: string | undefined) => setSearch((old) => ({ ...old, userId: id !== undefined ? +id : undefined, page: 1 }));
    // Emptying the box doesn't pick anything, so it wouldn't clear the user otherwise
    const userSearchWithClear = {
        ...userSearch,
        setUserText: (text: string) => {
            userSearch.setUserText(text);
            if (text.trim() === "" && search.userId !== undefined) {
                userSearch.setSelectedUser({ username: "" });
                setUser(undefined);
            }
        }
    };
    const setStatusFilter = (value: ReplayCommentStatus | "") => {
        setStatus(value);
        setSearch((old) => ({ ...old, status: value === "" ? undefined : value, page: 1 }));
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        setError("");
        const id = timeId.trim();
        if (id !== "" && !/^\d+$/.test(id)) {
            setError("A time ID is a number, like the end of a replay's link");
            return;
        }
        setSearch((old) => ({ ...old, timeId: id === "" ? undefined : id, page: 1 }));
    };

    const data = results.data;
    const pageCount = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

    return (
        <>
            <Box component="form" onSubmit={submit} sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
                <Box sx={{ flex: "1 1 200px" }}>
                    <UserSearch setUserId={setUser} userSearch={userSearchWithClear} />
                </Box>
                <TextField value={timeId} onChange={(event) => setTimeId(event.target.value)} label="Time ID" size="small" sx={{ flex: "1 1 120px" }} />
                <TextField
                    select
                    value={status}
                    onChange={(event) => setStatusFilter(event.target.value as ReplayCommentStatus | "")}
                    label="Status"
                    size="small"
                    sx={{ flex: "1 1 160px" }}
                    // So "Any" shows instead of an empty box
                    slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}>
                    {STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                </TextField>
                <Button type="submit" variant="contained">Search</Button>
            </Box>
            {error !== "" &&
            <Typography variant="body2" role="alert" sx={{ color: "error.main", mb: 1 }}>{error}</Typography>}

            {results.isPending ? <Loading />
            : !data ? <LoadFailed />
            :
            <Box sx={{ opacity: results.isPlaceholderData ? 0.6 : 1, transition: "opacity .15s ease" }}>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
                    {data.total} comment{data.total === 1 ? "" : "s"}
                </Typography>
                <ModCommentList comments={data.comments} emptyText="No comments match" />
                <PageControls
                    page={search.page}
                    hasNext={search.page < pageCount}
                    onPage={(page) => setSearch({ ...search, page: page })}
                    label={`Page ${search.page} of ${pageCount}`}
                />
            </Box>}
        </>
    );
}

export default CommentsTab;
