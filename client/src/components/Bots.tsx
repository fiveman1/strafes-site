import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import init, { CompleteBot, CompleteMap, Graphics, PlaybackHead, setup_graphics } from "../bot_player/strafesnet_roblox_bot_player_wasm_module";

const FRAME_TIME = (1 / 120) * 1000;

function Bots() {
    const [botData, setBotData] = useState<CompleteBot>();
    const [graphics, setGraphics] = useState<Graphics>();
    const [playback, setPlayback] = useState<PlaybackHead>();
    const [curTimer, setCurTimer] = useState(0);
    const [timer, setTimer] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useLayoutEffect(() => {
        let timerId: number;
        const animate = (time: number) => {
            const diff = time - timer;
            timerId = requestAnimationFrame(animate);
            if (diff > FRAME_TIME) {
                if (playback && botData && graphics) {
                    playback.advance_time(botData, time / 1000);
                    graphics.render(botData, playback, time / 1000);
                }
                setTimer(time);
            }
            setCurTimer(time);
        }

        timerId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(timerId);
    }, [botData, graphics, playback, timer, curTimer])


    useEffect(() => {
        document.title = "bots - strafes"
    }, []);

    useEffect(() => {
        const promise = async () => {
            await init();
            const canvas = canvasRef.current;
            if (!canvas) return;

            const playback = new PlaybackHead(0);
            const graphics = await setup_graphics(canvas);
            const fov_y = playback.get_fov_slope_y();
            const fov_x = (fov_y * canvas.clientWidth) / canvas.clientHeight;
            graphics.resize(canvas.clientWidth, canvas.clientHeight, fov_x, fov_y);

            const mapPromise = fetch("/maps/5692093612.snfm");
            const botPromise = fetch("/bhop_marble_7cf33a64-7120-4514-b9fa-4fe29d9523d.qbot");
            const mapRes = await mapPromise;
            const botRes = await botPromise;

            const map = new CompleteMap(new Uint8Array(await mapRes.arrayBuffer()));
            const bot = new CompleteBot(new Uint8Array(await botRes.arrayBuffer()));

            playback.advance_time(bot, 0);
            graphics.change_map(map);

            setPlayback(playback);
            setGraphics(graphics);
            setBotData(bot);
        };
        promise();
    }, []);

    return (
        <Box display="flex" flexDirection="column" flexGrow={1}>
            <Breadcrumbs separator={<NavigateNextIcon />} sx={{ p: 1 }}>
                <Link underline="hover" color="inherit" href="/">
                    Home
                </Link>
                <Typography color="textPrimary">
                    Bots
                </Typography>
            </Breadcrumbs>
            <Box padding={1} flexGrow={1} display="flex" flexDirection="column" alignItems="center">
                <canvas style={{ aspectRatio: 16 / 9, height: "100%" }} ref={canvasRef} />
            </Box>
        </Box>
    );
}

export default Bots;