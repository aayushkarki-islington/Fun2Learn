"use client";

import Logo from "./logo";

interface DashboardHeaderProps {
    userName?: string;
    userInitials?: string;
    imageUrl?: string | null;
}

const DashboardHeader = ({ userName = "User", userInitials = "U", imageUrl }: DashboardHeaderProps) => {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Logo size="md" />
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                        Welcome, <strong className="text-gray-800 dark:text-gray-100">{userName}</strong>
                    </span>
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={userName}
                            className="w-10 h-10 rounded-full object-cover shadow-lg"
                        />
                    ) : (
                        <div className="w-10 h-10 bg-gradient rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                            {userInitials}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
