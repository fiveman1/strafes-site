import { GridNoRowsOverlay, GridOverlay, GridOverlayProps, NoRowsOverlayPropsOverrides } from "@mui/x-data-grid";
import LoadError from "../../../displays/LoadError";

declare module "@mui/x-data-grid" {
    interface NoRowsOverlayPropsOverrides {
        // Set when the last page failed to load, which clears the rows
        loadError?: unknown
        loadErrorWhat?: string
        onRetry?: () => void
    }
}

/** The usual "No rows", or why the rows couldn't be loaded. */
function NoRowsOrError(props: GridOverlayProps & NoRowsOverlayPropsOverrides) {
    const { loadError, loadErrorWhat, onRetry, ...other } = props;
    if (loadError === undefined) {
        return <GridNoRowsOverlay {...other} />;
    }
    return (
        <GridOverlay {...other}>
            <LoadError block what={loadErrorWhat ?? "this"} error={loadError} onRetry={onRetry} />
        </GridOverlay>
    );
}

export default NoRowsOrError;
