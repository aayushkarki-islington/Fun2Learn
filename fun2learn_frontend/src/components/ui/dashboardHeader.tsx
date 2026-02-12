"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Logo from "./logo";
import { LogOut } from "lucide-react";

interface DashboardHeaderProps {
    userName?: string;
    userInitials?: string;
    imageUrl?: string | null;
}

const DashboardHeader = ({ userName = "User", userInitials = "U", imageUrl }: DashboardHeaderProps) => {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        Cookies.remove("accessToken");
        router.push("/login");
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Logo size="md" />
                </div>
                <div className="flex items-center gap-4 relative" ref={menuRef}>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                        Welcome, <strong className="text-gray-800 dark:text-gray-100">{userName}</strong>
                    </span>
                    <div className="relative">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={userName}
                                onClick={() => setMenuOpen(prev => !prev)}
                                className="w-10 h-10 rounded-full object-cover shadow-lg cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                            />
                        ) : (
                            <div
                                onClick={() => setMenuOpen(prev => !prev)}
                                className="w-10 h-10 bg-gradient rounded-full flex items-center justify-center text-white font-bold shadow-lg cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                            >
                                {userInitials}
                            </div>
                        )}

                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-700 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 py-2 z-50">
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
