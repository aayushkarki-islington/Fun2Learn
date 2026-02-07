"use client";

import { useState } from "react";
import { useTheme } from "@/context/theme-context";
// import { Logo } from "@/components/ui/logo";
import { SignUpForm } from "@/components/signup-form";
import { SignUpRequest } from "@/models/requestModels";
import { toast } from "sonner";
import { isValidEmail, isValidPassword } from "../utils/validationUtils";
import { signup } from "@/api/authApi";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";

const SignUpPage = () => {
    const {theme, toggleTheme} = useTheme();
    const router = useRouter();
    const [isSigningUp, setIsSigningUp] = useState<boolean>(false);

    const processSignUp = async (data: SignUpRequest) => {
        let toastId: string | number = "";
        try {
            setIsSigningUp(true);

            // Validation checks
            if (!data.fullName || !data.email || !data.password || !data.birthday || !data.gender) {
                toast.error("Please fill all the fields");
                return;
            }

            if (!isValidEmail(data.email)) {
                toast.error("Please provide a valid email");
                return;
            }

            if (!isValidPassword(data.password)) {
                toast.error("Invalid Password", {description: "Password must contain at least one letter, one number, one symbol, and be 6-25 characters long"});
                return;
            }

            toastId = toast.loading("Creating account");

            // Call the signup API
            const signupResponse = await signup(data);

            if (signupResponse.success) {
                toast.success("Account created successfully! Please login to continue.", { id: toastId, duration: 3000 });
                router.push("/login");
            } else {
                const message = signupResponse.errorMessage;
                toast.error(message || "An error occurred during signup", { id: toastId, duration: 3000 });
            }
        } catch (e) {
            console.error("An error occurred during signup", e);
            toast.error("An error occurred during signup", { id: toastId, duration: 3000 });
        } finally {
            setIsSigningUp(false);
        }
    }

    return (
        <div className="bg-primary w-full min-h-screen flex items-center justify-center py-4">
            <Button variant="ghost" className="fixed top-20 right-20 hover:text-(--primary)" onClick={toggleTheme}>Toggle theme</Button>
            <div className="flex flex-col gap-8">
                {/* <Logo size="xl" showText={true} /> */}
                <SignUpForm
                    isSigningUp={isSigningUp}
                    onSignUp={processSignUp}
                />
            </div>
        </div>
    )
}

export default SignUpPage;