import React from "react";
import Button from '@mui/material/Button';
import Box from "@mui/material/Box";
import { Link, Typography } from "@mui/material";

function Home() {
    return <Box display="flex" flexDirection="column" padding={2} flexGrow={1}>
        <Typography variant="h3" padding={4}>
            Home
        </Typography>
        <Typography padding={4}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent hendrerit tempus ipsum. Nam tempus non ligula id lobortis. 
            Cras facilisis, nulla sit amet interdum accumsan, purus lorem suscipit tortor, at viverra ipsum eros ac turpis. Aliquam non laoreet magna. 
            Mauris interdum mattis nulla, sed bibendum erat tempor ac. Vestibulum ullamcorper nec urna at pretium. Nunc vel maximus sem, vitae lobortis nunc. 
            Nam at nisl tellus. Ut id consectetur nisl, id mollis mauris. Fusce a lorem vel eros laoreet pretium. Nulla in fringilla lacus, quis pellentesque magna. 
            Duis placerat faucibus lacus suscipit consequat. Pellentesque vehicula, lorem ac pellentesque sollicitudin, diam nisi ornare nisl, fermentum aliquet enim leo nec neque. 
            Morbi pretium porta leo sed elementum. Aenean pellentesque turpis justo, vel dapibus elit ultrices in. Morbi urna orci, tristique et nisi vel, feugiat laoreet arcu. 
            Sed et augue cursus, varius augue sed, pulvinar sapien. In nec risus nulla. Nam vestibulum nisi justo, convallis ultrices lectus varius ac. Nulla facilisi. 
            Nunc laoreet sed justo et finibus. Maecenas enim justo, ultrices a efficitur ac, feugiat ut ante. Maecenas sed gravida mauris. Suspendisse dictum quam nec sapien commodo viverra. 
            Maecenas massa ipsum, rutrum sit amet nisi nec, ultricies convallis purus. Aenean lobortis interdum dignissim. In rutrum tortor at tellus tincidunt eleifend. Morbi quis lacus nibh. 
            Sed malesuada rutrum finibus. Sed eget elementum sem, in tincidunt ipsum. Maecenas quis felis mollis quam lacinia vestibulum. Proin vel urna id nulla luctus gravida eget blandit felis.
        </Typography>
        <Link href={"/users"}>Go to users</Link>
        <Link href={"/maps"}>Go to maps</Link>
        <Button >This is a button!</Button>
    </Box>
}

export default Home;