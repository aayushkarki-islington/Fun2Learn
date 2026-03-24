"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Logo from "@/components/ui/logo";
import Button from "@/components/ui/button";
import ThemeToggle from "@/components/ui/themeToggle";
import { forgotPassword, resetPassword } from "@/api/authApi";
import { isValidEmail, isValidPassword } from "../utils/validationUtils";

type Step = "email" | "reset";

const ForgotPasswordPage = () => {
    const router = useRouter();

    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValidEmail(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        let toastId: string | number = "";
        try {
            setIsLoading(true);
            toastId = toast.loading("Sending reset code...");
            const result = await forgotPassword({ email });
            if (result.success) {
                toast.success("Reset code sent! Check your inbox.", { id: toastId });
                setStep("reset");
            } else {
                toast.error(result.errorMessage || "Failed to send reset code", { id: toastId });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code.trim()) {
            toast.error("Please enter the verification code");
            return;
        }
        if (!isValidPassword(newPassword)) {
            toast.error("Password must be 6–25 characters with at least one letter, number, and symbol");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        let toastId: string | number = "";
        try {
            setIsLoading(true);
            toastId = toast.loading("Resetting password...");
            const result = await resetPassword({
                email,
                verification_code: code.trim(),
                new_password: newPassword
            });

            if (result.success) {
                toast.success("Password reset successfully!", { id: toastId });
                router.replace("/login");
            } else {
                toast.error(result.errorMessage || "Invalid or expired code", { id: toastId });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-primary w-full min-h-screen flex items-center justify-center">
            <div className="fixed top-6 right-6">
                <ThemeToggle />
            </div>

            <div className="flex flex-col gap-8 w-full max-w-sm px-4">
                <Logo size="xl" showText={true} />

                {step === "email" ? (
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col gap-1">
                            <h1 className="font-lilita text-4xl self-center">Forgot Password</h1>
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                Enter your email and we'll send you a reset code
                            </p>
                        </div>

                        <form onSubmit={handleSendCode} className="flex flex-col gap-4">
                            <div className="flex flex-col">
                                <label className="mb-2">Email</label>
                                <input
                                    type="text"
                                    className="h-12 rounded-md border border-gray-400 dark:border-gray-200 px-2"
                                    value={email}
                                    placeholder="Enter your email"
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <Button
                                className="font-lilita text-lg"
                                type="submit"
                                isLoading={isLoading}
                                loadingText="Sending..."
                            >
                                Send Reset Code
                            </Button>

                            <p className="text-center text-sm">
                                Remember your password?{" "}
                                <Link href="/login">
                                    <span className="cursor-pointer hover:text-(--primary)">Log in</span>
                                </Link>
                            </p>
                        </form>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col gap-1">
                            <h1 className="font-lilita text-4xl self-center">Reset Password</h1>
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                Enter the code sent to <strong>{email}</strong>
                            </p>
                        </div>

                        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                            <div className="flex flex-col">
                                <label className="mb-2">Verification Code</label>
                                <input
                                    type="text"
                                    className="h-12 rounded-md border border-gray-400 dark:border-gray-200 px-2 tracking-widest text-center text-lg font-semibold"
                                    value={code}
                                    placeholder="000000"
                                    maxLength={6}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="mb-2">New Password</label>
                                <input
                                    type="password"
                                    className="h-12 rounded-md border border-gray-400 dark:border-gray-200 px-2"
                                    value={newPassword}
                                    placeholder="Enter new password"
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col mb-2">
                                <label className="mb-2">Confirm Password</label>
                                <input
                                    type="password"
                                    className="h-12 rounded-md border border-gray-400 dark:border-gray-200 px-2"
                                    value={confirmPassword}
                                    placeholder="Confirm new password"
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <Button
                                className="font-lilita text-lg"
                                type="submit"
                                isLoading={isLoading}
                                loadingText="Resetting..."
                            >
                                Reset Password
                            </Button>

                            <p className="text-center text-sm">
                                Didn't receive the code?{" "}
                                <span
                                    className="cursor-pointer hover:text-(--primary)"
                                    onClick={() => setStep("email")}
                                >
                                    Resend
                                </span>
                            </p>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
