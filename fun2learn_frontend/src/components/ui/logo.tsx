import Image from "next/image";
import { LogoSize } from "@/models/types";

interface LogoProps {
    size?: LogoSize;
    showText?: boolean;
}

type LogoConstraints = {width: number, height: number};

const getSize = (size: LogoSize): LogoConstraints => {
    switch (size) {
        case 'sm':
            return {width: 60, height: 60}
        case 'md':
            return {width: 100, height: 100}
        case 'lg':
            return {width: 200, height: 200}
        case 'xl':
            return {width: 300, height: 300}
        default:
            return {width: 60, height: 60}
    }
}

const getLogoFile = (showText: boolean, theme: string) => {
    if(!showText) return "logo/logo-default.svg"
}

export const Logo = ({
    size = "md",
    showText
}: LogoProps) => {
    const constraints = getSize(size)
    return(
        <Image
            src="logo/logo-default.svg"
            alt="Fun2Learn Logo"
            width={constraints?.width}
            height={constraints?.height}
        />
    )
}