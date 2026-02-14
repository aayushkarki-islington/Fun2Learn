"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import Logo from "./logo";
import { useUser } from "@/context/user-context";
import { getStreak } from "@/api/studentApi";
import {
    Search,
    GraduationCap,
    Trophy,
    Swords,
    UserRound,
    LogOut,
    LayoutDashboard,
    BarChart3,
    Menu,
    X,
    Flame,
} from "lucide-react";
import ThemeToggle from "./themeToggle";

interface NavItem {
    label: string;
    icon: React.ReactNode;
    href: string;
    matchPaths?: string[];
}

const studentNavItems: NavItem[] = [
    {
        label: "Learn",
        icon: <GraduationCap size={24} />,
        href: "/student/mycourses",
        matchPaths: ["/student/mycourses", "/student/course"],
    },
    {
        label: "Browse",
        icon: <Search size={24} />,
        href: "/student/browse",
        matchPaths: ["/student/browse"],
    },
    {
        label: "Leaderboards",
        icon: <Trophy size={24} />,
        href: "/student/leaderboards",
        matchPaths: ["/student/leaderboards"],
    },
    {
        label: "Quests",
        icon: <Swords size={24} />,
        href: "/student/quests",
        matchPaths: ["/student/quests"],
    },
    {
        label: "Profile",
        icon: <UserRound size={24} />,
        href: "/student/profile",
        matchPaths: ["/student/profile"],
    },
];

const tutorNavItems: NavItem[] = [
    {
        label: "Dashboard",
        icon: <LayoutDashboard size={24} />,
        href: "/tutor/dashboard",
        matchPaths: ["/tutor/dashboard", "/tutor/course"],
    },
    {
        label: "Analytics",
        icon: <BarChart3 size={24} />,
        href: "/tutor/analytics",
        matchPaths: ["/tutor/analytics"],
    },
];

const Sidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useUser();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [streakCount, setStreakCount] = useState(0);
    const [streakActiveToday, setStreakActiveToday] = useState(false);

    const isTutor = user?.role === "tutor";
    const navItems = isTutor ? tutorNavItems : studentNavItems;

    // Fetch streak data for students
    useEffect(() => {
        if (user && !isTutor) {
            getStreak().then((result) => {
                if (result.success) {
                    setStreakCount(result.dailyStreak ?? 0);
                    setStreakActiveToday(result.streakActiveToday ?? false);
                }
            });
        }
    }, [user, isTutor]);

    const isActive = (item: NavItem) => {
        if (!item.matchPaths) return pathname === item.href;
        return item.matchPaths.some((path) => pathname.startsWith(path));
    };

    const handleLogout = () => {
        Cookies.remove("accessToken");
        router.push("/login");
    };

    const handleNav = (href: string) => {
        router.push(href);
        setMobileOpen(false);
    };

    const navContent = (
        <>
            {/* Logo */}
            <div className="px-4 pt-6 pb-4">
                <Logo size="md" />
            </div>

            {/* Streak indicator (students only) */}
            {!isTutor && (
                <div className="px-3 mb-2">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <Flame
                            size={22}
                            className={
                                streakActiveToday
                                    ? "text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]"
                                    : "text-gray-400 dark:text-gray-600"
                            }
                            fill={streakActiveToday ? "currentColor" : "none"}
                        />
                        <span className={`text-sm font-bold ${
                            streakActiveToday
                                ? "text-orange-500"
                                : "text-gray-400 dark:text-gray-600"
                        }`}>
                            {streakCount} day streak
                        </span>
                    </div>
                </div>
            )}

            {/* Navigation Items */}
            <nav className="flex-1 px-3 py-2">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const active = isActive(item);
                        return (
                            <li key={item.label}>
                                <button
                                    onClick={() => handleNav(item.href)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-bold
                                        transition-all duration-150 cursor-pointer
                                        ${active
                                            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-2 border-blue-300 dark:border-blue-700"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-transparent"
                                        }
                                    `}
                                >
                                    <span className={active ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-500"}>
                                        {item.icon}
                                    </span>
                                    <span className="uppercase tracking-wide">{item.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Theme Toggle */}
            <div className="px-3 pb-3">
                <ThemeToggle />
            </div>

            {/* Logout */}
            <div className="px-3 pb-6">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-150 cursor-pointer border-2 border-transparent"
                >
                    <LogOut size={24} />
                    <span className="uppercase tracking-wide">Logout</span>
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile toggle button */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="fixed top-4 left-4 z-60 lg:hidden bg-white dark:bg-gray-800 rounded-xl p-2 shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
            >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 h-full z-50 w-55
                    bg-white dark:bg-gray-900
                    border-r-2 border-gray-200 dark:border-gray-800
                    flex flex-col
                    transition-transform duration-300 ease-in-out
                    lg:translate-x-0
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                {navContent}
            </aside>
        </>
    );
};

export default Sidebar;
