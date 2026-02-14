"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/theme-context";

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="flex items-center min-w-40 justify-between px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
                {theme === "dark" ? (
                    <Moon size={18} className="text-blue-400" />
                ) : (
                    <Sun size={18} className="text-yellow-500" />
                )}
                <span className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    {theme === "dark" ? "Dark" : "Light"}
                </span>
            </div>
            <button
                onClick={toggleTheme}
                className={`
                    relative w-11 h-6 rounded-full border-2 transition-all duration-300 cursor-pointer
                    ${theme === "dark"
                        ? "bg-blue-600 border-blue-500"
                        : "bg-gray-200 border-gray-300"
                    }
                `}
                aria-label="Toggle theme"
            >
                <span
                    className={`
                        absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300
                        ${theme === "dark" ? "left-[calc(100%-1.25rem)]" : "left-0.5"}
                    `}
                />
            </button>
        </div>
    );
};

export default ThemeToggle;
