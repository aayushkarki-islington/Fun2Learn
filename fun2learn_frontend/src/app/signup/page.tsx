"use client";

import { useTheme } from "@/context/theme-context";
import { Logo } from "@/components/ui/logo";
import { SignUpForm } from "@/components/signup-form";

const SignUpPage = () => {
    const {theme, toggleTheme} = useTheme();

    const processLogin = (email: string, password: string) => {
        
    }

    return (
        <div className="bg-primary w-full min-h-screen flex items-center justify-center py-4">
            <button className="fixed top-20 right-20 hover:text-(--primary)" onClick={toggleTheme}>Toggle theme</button>
            <div className="flex flex-col gap-8">
                {/* <Logo size="xl" showText={true} /> */}
                <SignUpForm
                    onLogin={processLogin}
                />
            </div>
        </div>
    )
}

export default SignUpPage;