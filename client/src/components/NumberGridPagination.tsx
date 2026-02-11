import { JSX, useCallback } from "react";
import { Pagination, PaginationItem, PaginationRenderItemParams, TablePaginationActionsProps, useMediaQuery } from "@mui/material";
import { gridPageCountSelector, useGridApiContext } from "@mui/x-data-grid";
import { useGridSelector } from "@mui/x-data-grid/internals";
import { numDigits } from "../util/utils";
import SimpleNumberField from "./SimpleNumberField";

interface NumberGridPaginationProps extends TablePaginationActionsProps {
    rowCount: number
}

function NumberGridPagination(props: NumberGridPaginationProps) {
    const { page, onPageChange, className, rowsPerPage, rowCount } = props;

    const apiRef = useGridApiContext();
    const pageCount = useGridSelector(apiRef, gridPageCountSelector);
    const screen390px = useMediaQuery(`@media screen and (max-width: 390px)`);
    const screen410px = useMediaQuery(`@media screen and (max-width: 410px)`);
    const screen430px = useMediaQuery(`@media screen and (max-width: 430px)`);
    const smallScreen = useMediaQuery(`@media screen and (max-width: 530px)`);

    const rowDigits = numDigits(rowCount);
    let showPageInput = !screen390px;
    if (rowDigits > 5) showPageInput = !screen430px;
    else if (rowDigits > 4) showPageInput = !screen410px;

    const renderItem = useCallback((item: PaginationRenderItemParams): JSX.Element | null => {
        // There is always exactly 0 or 1 selected page, use that to render our page selector
        if (item.selected && showPageInput) {
            // Gets the largest number row shown on the current page
            const realRowNum = Math.max(1, Math.min((page + 1) * rowsPerPage, rowCount));

            // Padding on left/right is 14px * 2 = 28. Add 8 per digit that can be shown
            const width = numDigits(rowCount) * 8 + 28;
            return (
                <SimpleNumberField 
                    size="small" 
                    disabled={rowCount <= rowsPerPage}
                    sx={{
                        width: `${width}px`,
                        "& input": {
                            textAlign: "center",
                            height: "20px",
                            fontSize: "14px" 
                        }
                    }}
                    value={realRowNum}
                    onValueChange={(value) => {onPageChange(null, Math.floor((value - 1) / rowsPerPage))}} 
                />
            );
        }
        
        // Hide the page buttons and ellipses
        if (item.type === "page" || item.type === "start-ellipsis" || item.type === "end-ellipsis") {
            return null;
        }
        
        // Show arrows
        return <PaginationItem {...item} />;
    }, [onPageChange, page, rowCount, rowsPerPage, showPageInput]);

    return (
        <Pagination
            className={className}
            count={pageCount}
            page={page + 1}
            showFirstButton={!smallScreen}
            showLastButton={!smallScreen}
            siblingCount={0}
            boundaryCount={0}
            onChange={(event, newPage) => onPageChange(null, newPage - 1)}
            renderItem={renderItem}
        />
    );
}

export default NumberGridPagination;