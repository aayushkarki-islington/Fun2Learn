"use client";

import { useState } from "react";
import { useTheme } from "@/context/theme-context";
import Logo from "@/components/ui/logo";
import { LoginForm } from "@/components/login-form";
import { toast } from "sonner";
import { isValidEmail } from "../utils/validationUtils";
import { login } from "@/api/authApi";
import { LoginRequest } from "@/models/requestModels";
import { useRouter } from "next/navigation";

const LoginPage = () => {
    const {theme, toggleTheme} = useTheme();
    const router = useRouter();
    const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

    const processLogin = async (email: string, password: string) => {
        let toastId: string | number = "";
        try{
            setIsLoggingIn(true);
            // Validation checks
            if(!email || !password){
                toast.error("Please fill all the fields");
                return;
            }

            if(!isValidEmail(email)){
                toast.error("Please provide a valid email");
                return;
            }

            toastId = toast.loading("Logging in");

            // Call the login API
            const loginPayload : LoginRequest = {
                email: email,
                password: password
            }
            const loginResponse = await login(loginPayload);

            if(loginResponse.success){
                toast.success("Login successful", {id: toastId, duration: 3000});
                router.replace("/home");
            }
            else {
                const message = loginResponse.errorMessage;
                toast.error(message || "An error occurred during login", {id: toastId, duration: 3000});
            }
        }
        catch (e) {
            console.error("An error occurred during login", e);
            toast.error("An error occurred during login", {id: toastId, duration: 3000})
        } 
        finally {
            setIsLoggingIn(false);
        }
    }

    return (
        <div className="bg-primary w-full min-h-screen flex items-center justify-center">
            <button className="fixed top-20 right-20 hover:text-(--primary)" onClick={toggleTheme}>Toggle theme</button>
            <div className="flex flex-col gap-8">
                <Logo size="xl" showText={true} />
                <LoginForm
                    isLoggingIn={isLoggingIn}
                    onLogin={processLogin}
                />
            </div>
        </div>
    )
}

export default LoginPage;