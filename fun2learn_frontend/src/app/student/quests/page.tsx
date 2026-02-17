"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserAchievementDetail, AchievementType } from "@/models/types";
import { getAchievements } from "@/api/studentApi";
import Sidebar from "@/components/ui/sidebar";
import AchievementCard from "@/components/student/achievementCard";
import { BookOpen, Flame, Trophy, GraduationCap } from "lucide-react";

const CATEGORY_META: Record<AchievementType, { label: string; icon: React.ReactNode; color: string }> = {
    lessons_completed: {
        label: "Lessons",
        icon: <BookOpen size={16} />,
        color: "text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
    },
    streak_days: {
        label: "Streaks",
        icon: <Flame size={16} />,
        color: "text-orange-500 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800",
    },
    courses_completed: {
        label: "Course Completions",
        icon: <Trophy size={16} />,
        color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800",
    },
    courses_enrolled: {
        label: "Enrollments",
        icon: <GraduationCap size={16} />,
        color: "text-green-500 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800",
    },
};

const CATEGORY_ORDER: AchievementType[] = [
    "lessons_completed",
    "streak_days",
    "courses_completed",
    "courses_enrolled",
];

const QuestsPage = () => {
    const [achievements, setAchievements] = useState<UserAchievementDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadAchievements();
    }, []);

    const loadAchievements = async () => {
        setIsLoading(true);
        const result = await getAchievements();
        if (result.success && result.achievements) {
            setAchievements(result.achievements);
        } else {
            toast.error(result.errorMessage || "Failed to load achievements");
        }
        setIsLoading(false);
    };

    const totalAchieved = achievements.filter(a => a.achieved).length;
    const totalAchievements = achievements.length;

    const grouped = CATEGORY_ORDER.reduce<Record<AchievementType, UserAchievementDetail[]>>(
        (acc, type) => {
            acc[type] = achievements.filter(a => a.achievement_type === type);
            return acc;
        },
        {} as Record<AchievementType, UserAchievementDetail[]>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />

            <main className="sidebar-layout max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="font-lilita text-4xl text-gray-800 dark:text-gray-100">
                        Achievements
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Track your milestones and unlock rewards as you learn.
                    </p>

                    {/* Overall progress */}
                    {!isLoading && totalAchievements > 0 && (
                        <div className="mt-4 flex items-center gap-4">
                            <div className="flex-1 max-w-xs">
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mb-1">
                                    <span className="font-medium">Overall Progress</span>
                                    <span className="font-bold">{totalAchieved} / {totalAchievements}</span>
                                </div>
                                <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                                        style={{ width: `${totalAchievements > 0 ? (totalAchieved / totalAchievements) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                                {totalAchievements > 0 ? Math.round((totalAchieved / totalAchievements) * 100) : 0}% complete
                            </span>
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-52 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-10">
                        {CATEGORY_ORDER.map((type) => {
                            const items = grouped[type];
                            if (!items || items.length === 0) return null;
                            const meta = CATEGORY_META[type];
                            const earned = items.filter(a => a.achieved).length;

                            return (
                                <section key={type}>
                                    {/* Category header */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold ${meta.color}`}>
                                            {meta.icon}
                                            <span>{meta.label}</span>
                                        </div>
                                        <span className="text-sm text-gray-400 dark:text-gray-600 font-medium">
                                            {earned}/{items.length} earned
                                        </span>
                                    </div>

                                    {/* Cards grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {items.map((achievement) => (
                                            <AchievementCard
                                                key={achievement.achievement_id}
                                                achievement={achievement}
                                            />
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default QuestsPage;
