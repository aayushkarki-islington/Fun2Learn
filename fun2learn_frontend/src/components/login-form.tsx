"use client";

import { useState } from "react";
import Button from "./ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface LoginFormProps {
    isLoggingIn: boolean;
    onLogin: (email: string, password: string) => void;
}

export const LoginForm = ({
    isLoggingIn,
    onLogin
}: LoginFormProps) => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const router = useRouter();

    return (
        <div className="flex flex-col gap-8">
            <h1 className="font-lilita text-4xl self-center">Login</h1>
            <form onSubmit={(e) => {e.preventDefault(); onLogin(email, password)}} className="flex flex-col gap-4">
                <div className="flex flex-col">
                    <label className="mb-2">Email</label>
                    <input 
                        type="text" 
                        className="h-12 rounded-md border border-gray-400 dark:border-gray-200 px-2"
                        value={email}
                        name="email" 
                        placeholder="Enter your email" 
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="flex flex-col mb-2">
                    <label className="mb-2">Password</label>
                    <input 
                        type="password" 
                        className="h-12 rounded-md border border-gray-400 dark:border-gray-200 px-2"
                        value={password} 
                        name="password" 
                        placeholder="Enter your password" 
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <Button
                    className="font-lilita text-lg"
                    type="submit"
                    isLoading={isLoggingIn}
                    loadingText="Logging In..."
                >
                    Login
                </Button>

                <p className="text-center">New to Fun2Learn?
                    <Link href={"/signup"}><span className="cursor-pointer hover:text-(--primary) ml-1">Sign Up</span></Link>
                </p>
            </form>
        </div>
    )
}