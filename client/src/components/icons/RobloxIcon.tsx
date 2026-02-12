import { IconProps } from "./types";

export default function RobloxIcon(props: IconProps) {
    const {size, color, ...svgProps} = props;

    return (
        <svg {...svgProps} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
            <path fill={color} d="M6,2L2,18l16,4l4-16L6,2z M13.635,14.724l-4.358-1.09l1.089-4.358l4.358,1.09L13.635,14.724z"></path>
        </svg>
    );
}