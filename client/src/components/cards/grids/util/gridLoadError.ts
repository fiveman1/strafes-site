import { RefObject, useCallback, useMemo, useState } from "react";
import { GridApi, GridGetRowsError, GridUpdateRowError, NoRowsOverlayPropsOverrides } from "@mui/x-data-grid";
import NoRowsOrError from "./GridNoRowsOrError";

/**
 * For a grid with a data source whose getRows throws when a request fails. Spread gridProps onto the grid (merging
 * slotProps if it has its own), and call clearError when getRows starts.
 */
export function useGridLoadError(apiRef: RefObject<GridApi | null>, what: string) {
    const [error, setError] = useState<unknown>(undefined);

    const clearError = useCallback(() => setError(undefined), []);
    const onDataSourceError = useCallback((err: GridGetRowsError | GridUpdateRowError) => {
        setError(err.cause ?? err);
    }, []);
    const onRetry = useCallback(() => {
        setError(undefined);
        apiRef.current?.dataSource.fetchRows();
    }, [apiRef]);

    const noRowsOverlayProps: NoRowsOverlayPropsOverrides = useMemo(() => ({
        loadError: error,
        loadErrorWhat: what,
        onRetry: onRetry
    }), [error, onRetry, what]);

    return {
        clearError,
        gridProps: {
            onDataSourceError,
            slots: { noRowsOverlay: NoRowsOrError }
        },
        noRowsOverlayProps
    };
}
