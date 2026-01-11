"use client";

import { useTheme } from "@/context/theme-context";
import { Logo } from "@/components/ui/logo";

const LoginPage = () => {
    const {theme, updateTheme} = useTheme();

    return (
        <div className="bg-primary w-full h-full">
            <Logo size="xl"/>
        </div>
    )
}

export default LoginPage;