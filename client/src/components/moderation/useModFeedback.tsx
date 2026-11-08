import { useCallback, useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import { useQueryClient } from "@tanstack/react-query";
import { queries } from "../../api/queries";

/** Shows what went wrong with an action, and refetches everything on the page after one. */
function useModFeedback() {
    const queryClient = useQueryClient();
    const [message, setMessage] = useState("");
    const [open, setOpen] = useState(false);

    const notify = useCallback((text: string) => {
        setMessage(text);
        setOpen(true);
    }, []);

    const refresh = useCallback(() => queryClient.invalidateQueries({ queryKey: queries.mod._def }), [queryClient]);

    const snackbar = (
        <Snackbar
            open={open}
            message={message}
            autoHideDuration={5000}
            onClose={() => setOpen(false)}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
    );

    return { notify, refresh, snackbar };
}

export default useModFeedback;
