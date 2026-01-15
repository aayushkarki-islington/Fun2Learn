"use client";

import Image from "next/image";
import { LogoSize } from "@/models/types";
import { useTheme } from "@/context/theme-context";
import { Theme } from "@/models/types";

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

const getLogoFile = (showText: boolean, theme: Theme) => {
    if(!showText) return "logo/logo-default.svg";

    return `logo/logo-text-${theme}.svg`;
}

export const Logo = ({
    size = "md",
    showText = false
}: LogoProps) => {
    const { theme } = useTheme();
    const constraints = getSize(size);
    const logoFile = getLogoFile(showText, theme);
    return(
        <Image
            src={logoFile}
            alt="Fun2Learn Logo"
            width={constraints?.width}
            height={constraints?.height}
        />
    )
}