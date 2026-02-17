"use client";

import type { UserAchievementDetail, AchievementType } from "@/models/types";
import { BookOpen, Flame, Trophy, GraduationCap, CheckCircle2, Lock } from "lucide-react";

interface AchievementCardProps {
    achievement: UserAchievementDetail;
}

const ACHIEVEMENT_ICONS: Record<AchievementType, React.ReactNode> = {
    lessons_completed: <BookOpen size={28} />,
    streak_days: <Flame size={28} />,
    courses_completed: <Trophy size={28} />,
    courses_enrolled: <GraduationCap size={28} />,
};

const ACHIEVEMENT_COLORS: Record<AchievementType, { icon: string; ring: string; bg: string; bar: string }> = {
    lessons_completed: {
        icon: "text-blue-500",
        ring: "ring-blue-200 dark:ring-blue-800",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        bar: "bg-blue-500",
    },
    streak_days: {
        icon: "text-orange-500",
        ring: "ring-orange-200 dark:ring-orange-800",
        bg: "bg-orange-50 dark:bg-orange-900/20",
        bar: "bg-orange-500",
    },
    courses_completed: {
        icon: "text-yellow-500",
        ring: "ring-yellow-200 dark:ring-yellow-800",
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        bar: "bg-yellow-500",
    },
    courses_enrolled: {
        icon: "text-green-500",
        ring: "ring-green-200 dark:ring-green-800",
        bg: "bg-green-50 dark:bg-green-900/20",
        bar: "bg-green-500",
    },
};

const AchievementCard = ({ achievement }: AchievementCardProps) => {
    const { name, description, achievement_type, goal, progress, achieved } = achievement;
    const colors = ACHIEVEMENT_COLORS[achievement_type];
    const icon = ACHIEVEMENT_ICONS[achievement_type];
    const clampedProgress = Math.min(progress, goal);
    const percent = goal > 0 ? Math.round((clampedProgress / goal) * 100) : 0;

    return (
        <div className={`
            relative rounded-2xl p-5 border-2 transition-all duration-200
            ${achieved
                ? "border-transparent bg-white dark:bg-gray-800 shadow-md"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 opacity-80"
            }
        `}>
            {/* Achieved badge */}
            {achieved && (
                <div className="absolute top-3 right-3">
                    <CheckCircle2 size={20} className="text-green-500" fill="currentColor" />
                </div>
            )}
            {!achieved && (
                <div className="absolute top-3 right-3">
                    <Lock size={16} className="text-gray-400 dark:text-gray-600" />
                </div>
            )}

            {/* Icon */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ring-2 ${colors.ring} ${colors.bg} ${colors.icon}`}>
                {icon}
            </div>

            {/* Name & description */}
            <h3 className={`font-bold text-base mb-1 pr-6 ${achieved ? "text-gray-800 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"}`}>
                {name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4 leading-relaxed">
                {description}
            </p>

            {/* Progress bar */}
            <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-500 font-medium">
                        {clampedProgress} / {goal}
                    </span>
                    <span className={`font-bold ${achieved ? "text-green-500" : "text-gray-400 dark:text-gray-600"}`}>
                        {achieved ? "Completed!" : `${percent}%`}
                    </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${achieved ? "bg-green-500" : colors.bar}`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default AchievementCard;
