"use client";

import { useEffect, useRef, useState } from "react";
import type { NewlyUnlockedAchievement, AchievementType } from "@/models/types";
import { BookOpen, Flame, Trophy, GraduationCap } from "lucide-react";

interface AchievementUnlockToastProps {
    queue: NewlyUnlockedAchievement[];
    onDismissFirst: () => void;
}

const DISPLAY_MS = 4000;
const SLIDE_MS = 380;

const TYPE_ICON: Record<AchievementType, React.ReactNode> = {
    lessons_completed: <BookOpen size={26} />,
    streak_days: <Flame size={26} />,
    courses_completed: <Trophy size={26} />,
    courses_enrolled: <GraduationCap size={26} />,
};

const TYPE_COLOR: Record<AchievementType, string> = {
    lessons_completed: "text-blue-400",
    streak_days: "text-orange-400",
    courses_completed: "text-yellow-400",
    courses_enrolled: "text-green-400",
};

const AchievementUnlockToast = ({ queue, onDismissFirst }: AchievementUnlockToastProps) => {
    const [visible, setVisible] = useState(false);
    const activeNameRef = useRef<string | null>(null);
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    const current = queue[0] ?? null;

    const clearTimers = () => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
    };

    useEffect(() => {
        if (!current) {
            setVisible(false);
            activeNameRef.current = null;
            clearTimers();
            return;
        }

        // Same achievement still showing — do nothing
        if (current.name === activeNameRef.current) return;

        activeNameRef.current = current.name;
        clearTimers();

        // Reset off-screen, then slide in
        setVisible(false);
        const t1 = setTimeout(() => setVisible(true), 50);
        // Begin slide-out slightly before full dismiss
        const t2 = setTimeout(() => setVisible(false), DISPLAY_MS - SLIDE_MS);
        // Remove from queue after full transition out
        const t3 = setTimeout(() => onDismissFirst(), DISPLAY_MS);

        timersRef.current = [t1, t2, t3];

        return clearTimers;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current?.name]);

    if (!current) return null;

    const icon = TYPE_ICON[current.achievement_type];
    const iconColor = TYPE_COLOR[current.achievement_type];

    return (
        <div
            style={{
                transition: `transform ${SLIDE_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
                transform: visible ? "translateX(0)" : "translateX(calc(100% + 24px))",
            }}
            className="fixed bottom-6 right-6 z-200 w-80 rounded-2xl overflow-hidden shadow-2xl"
        >
            {/* Dark card — always dark theme, like Steam */}
            <div className="bg-gray-900 border border-gray-700/60">
                {/* Header strip */}
                <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-gray-700/50">
                    <Trophy size={14} className="text-yellow-400" />
                    <span className="text-xs font-bold tracking-widest uppercase text-yellow-400">
                        Achievement Unlocked
                    </span>
                </div>

                {/* Body */}
                <div className="flex items-center gap-4 px-4 py-3">
                    {/* Icon box */}
                    <div className={`shrink-0 w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center ${iconColor}`}>
                        {icon}
                    </div>

                    {/* Text */}
                    <div className="min-w-0">
                        <p className="text-white font-bold text-sm leading-tight truncate">
                            {current.name}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5 leading-snug line-clamp-2">
                            {current.description}
                        </p>
                    </div>
                </div>

                {/* Timer bar — drains from full to empty over DISPLAY_MS */}
                <div className="h-0.5 bg-gray-800">
                    <div
                        key={current.name}
                        className="h-full bg-yellow-400 rounded-full"
                        style={{
                            animation: `achievementTimer ${DISPLAY_MS}ms linear forwards`,
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default AchievementUnlockToast;
