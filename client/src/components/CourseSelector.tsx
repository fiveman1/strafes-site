import React, { useEffect } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, useMediaQuery } from "@mui/material";
import { Map, formatCourse } from "shared";
import { useLocation, useNavigate } from "react-router";

interface ICourseSelectorProps {
    map?: Map
    course: number
    setCourse: (course: number) => void;
}

function CourseSelector(props: ICourseSelectorProps) {
    const { map, course, setCourse } = props;
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        let paramCourse = 0;
        const styleParam = queryParams.get("course");
        if (styleParam !== null && !isNaN(+styleParam) && +styleParam >= 0) {
            paramCourse = +styleParam;
        }
        setCourse(paramCourse);
    }, [location.search, setCourse]);

    const handleChangeCourse = (event: SelectChangeEvent<number>) => {
        const course = event.target.value;
        const queryParams = new URLSearchParams(location.search);
        queryParams.set("course", course.toString());
        navigate({ search: queryParams.toString() }, { replace: true });
    };

    const courses = map ? map.modes : 1;
    const items: React.ReactElement[] = [];
    for (let i = 0; i < courses; ++i) {
        items.push(<MenuItem value={i}>{formatCourse(i)}</MenuItem>);
    }

    return (
        <Box padding={smallScreen ? 1 : 1.5}>
            <FormControl sx={{ width: "150px" }}>
                <InputLabel>Course</InputLabel>
                <Select
                    value={course >= courses ? 0 : course}
                    label="Course"
                    onChange={handleChangeCourse}
                >
                    {items}
                </Select>
            </FormControl>
        </Box>
    );
}

export default CourseSelector;