import { SVGAttributes } from "react"

export interface IconProps extends SVGAttributes<SVGGElement> {
    size: number
    color: string
}