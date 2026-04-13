"use client";

import { useEffect, useState } from "react";
import { Flame, BookOpen, Zap, CheckCircle2, Gem, Star } from "lucide-react";
import Button from "@/components/ui/button";
import type { DailyQuest } from "@/models/types";

const QUEST_ICONS: Record<string, React.ReactNode> = {
    "book-open": <BookOpen size={16} />,
    "zap": <Zap size={16} />,
    "flame": <Flame size={16} />,
};

interface StreakModalProps {
    isOpen: boolean;
    onClose: () => void;
    streakCount: number;
    streakUpdated?: boolean;
    questProgress?: DailyQuest[];
    gemsEarned?: number;
}

const StreakModal = ({ isOpen, onClose, streakCount, streakUpdated = true, questProgress, gemsEarned }: StreakModalProps) => {
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnimating(true);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const completedQuests = questProgress?.filter(q => q.completed) ?? [];
    const totalQuests = questProgress?.length ?? 0;
    const hasQuestProgress = totalQuests > 0;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center ${animating ? "animate-streak-pop" : ""}`}>

                {/* Streak section */}
                {streakUpdated && (
                    <>
                        <div className="relative inline-block mb-4">
                            <div className="absolute inset-0 bg-orange-400/30 rounded-full blur-2xl scale-150" />
                            <div className={`relative ${animating ? "animate-streak-flame" : ""}`}>
                                <Flame
                                    size={72}
                                    className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]"
                                    fill="currentColor"
                                />
                            </div>
                        </div>
                        <div className="mb-1">
                            <span className="font-lilita text-5xl text-orange-500">{streakCount}</span>
                        </div>
                        <h2 className="font-lilita text-2xl text-gray-800 dark:text-gray-100 mb-1">
                            {streakCount === 1 ? "Streak started!" : "Day streak!"}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                            {streakCount === 1
                                ? "Complete a lesson every day to build your streak!"
                                : `You've been learning for ${streakCount} days in a row!`
                            }
                        </p>
                    </>
                )}

                {!streakUpdated && (
                    <>
                        <div className="relative inline-block mb-4">
                            <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-2xl scale-150" />
                            <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto">
                                <CheckCircle2 size={36} className="text-white" />
                            </div>
                        </div>
                        <h2 className="font-lilita text-2xl text-gray-800 dark:text-gray-100 mb-1">
                            Lesson Complete!
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                            Keep it up! You&apos;re making great progress.
                        </p>
                    </>
                )}

                {/* Gems earned banner */}
                {gemsEarned != null && gemsEarned > 0 && (
                    <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                        <Gem size={18} className="text-yellow-500" fill="currentColor" />
                        <span className="font-bold text-yellow-600 dark:text-yellow-400">
                            +{gemsEarned} gems earned!
                        </span>
                    </div>
                )}

                {/* Quest progress */}
                {hasQuestProgress && (
                    <div className="mb-5 text-left">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                Daily Quests
                            </p>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                {completedQuests.length}/{totalQuests} done
                            </span>
                        </div>
                        <div className="space-y-2">
                            {questProgress!.map((quest) => {
                                const clampedProgress = Math.min(quest.progress, quest.goal);
                                const percent = quest.goal > 0 ? Math.round((clampedProgress / quest.goal) * 100) : 0;

                                return (
                                    <div
                                        key={quest.key}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                            quest.completed
                                                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                                : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700"
                                        }`}
                                    >
                                        <span className={quest.completed ? "text-green-500" : "text-gray-400 dark:text-gray-500"}>
                                            {QUEST_ICONS[quest.icon] ?? <BookOpen size={16} />}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-xs font-bold truncate ${quest.completed ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}>
                                                    {quest.title}
                                                </span>
                                                <div className="flex items-center gap-2 ml-2 shrink-0">
                                                    <div className="flex items-center gap-0.5">
                                                        <Gem size={11} className="text-yellow-500" fill="currentColor" />
                                                        <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">{quest.gems}</span>
                                                    </div>
                                                    {(quest.xp ?? 0) > 0 && (
                                                        <div className="flex items-center gap-0.5">
                                                            <Star size={11} className="text-blue-500" fill="currentColor" />
                                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{quest.xp} XP</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${quest.completed ? "bg-green-500" : "bg-blue-500"}`}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                        {quest.completed && (
                                            <CheckCircle2 size={16} className="text-green-500 shrink-0" fill="currentColor" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <Button
                    variant="primary"
                    size="lg"
                    onClick={onClose}
                    className="w-full font-bold"
                >
                    Continue
                </Button>
            </div>
        </div>
    );
};

export default StreakModal;
