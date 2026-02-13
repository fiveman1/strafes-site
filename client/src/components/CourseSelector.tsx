import React from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { Map, formatCourse } from "shared";

interface ICourseSelectorProps {
    map?: Map
    course: number
    setCourse: (course: number) => void;
}

function CourseSelector(props: ICourseSelectorProps) {
    const { map, course, setCourse } = props;

    const handleChangeCourse = (event: SelectChangeEvent<number>) => {
        const course = event.target.value;
        setCourse(course);
    };

    const courses = map ? map.modes : 1;
    const items: React.ReactElement[] = [];
    for (let i = 0; i < courses; ++i) {
        items.push(<MenuItem value={i}>{formatCourse(i)}</MenuItem>);
    }

    return (
        <Box padding={1} pb={0.5}>
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