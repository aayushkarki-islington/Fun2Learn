"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { DailyQuest } from "@/models/types";
import { getDailyQuests } from "@/api/studentApi";
import Sidebar from "@/components/ui/sidebar";
import { BookOpen, Zap, Flame, Gem, CheckCircle2, RefreshCw } from "lucide-react";

const QUEST_ICONS: Record<string, React.ReactNode> = {
    "book-open": <BookOpen size={22} />,
    "zap": <Zap size={22} />,
    "flame": <Flame size={22} />,
};

const QUEST_COLORS: Record<string, { icon: string; ring: string; bg: string; bar: string; border: string }> = {
    "book-open": {
        icon: "text-blue-500",
        ring: "ring-blue-200 dark:ring-blue-800",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        bar: "bg-blue-500",
        border: "border-blue-100 dark:border-blue-900/50",
    },
    "zap": {
        icon: "text-purple-500",
        ring: "ring-purple-200 dark:ring-purple-800",
        bg: "bg-purple-50 dark:bg-purple-900/20",
        bar: "bg-purple-500",
        border: "border-purple-100 dark:border-purple-900/50",
    },
    "flame": {
        icon: "text-orange-500",
        ring: "ring-orange-200 dark:ring-orange-800",
        bg: "bg-orange-50 dark:bg-orange-900/20",
        bar: "bg-orange-500",
        border: "border-orange-100 dark:border-orange-900/50",
    },
};

const QuestCard = ({ quest }: { quest: DailyQuest }) => {
    const colors = QUEST_COLORS[quest.icon] ?? QUEST_COLORS["book-open"];
    const clampedProgress = Math.min(quest.progress, quest.goal);
    const percent = quest.goal > 0 ? Math.round((clampedProgress / quest.goal) * 100) : 0;

    return (
        <div className={`
            relative bg-white dark:bg-gray-800 rounded-2xl p-5 border-2 shadow-sm transition-all duration-200
            ${quest.completed
                ? "border-green-200 dark:border-green-800"
                : `${colors.border}`
            }
        `}>
            {quest.completed && (
                <div className="absolute top-4 right-4">
                    <CheckCircle2 size={22} className="text-green-500" fill="currentColor" />
                </div>
            )}

            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ring-2 shrink-0 ${
                    quest.completed
                        ? "bg-green-50 dark:bg-green-900/20 ring-green-200 dark:ring-green-800 text-green-500"
                        : `${colors.bg} ${colors.ring} ${colors.icon}`
                }`}>
                    {QUEST_ICONS[quest.icon] ?? <BookOpen size={22} />}
                </div>

                <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className={`font-bold text-base ${quest.completed ? "text-gray-700 dark:text-gray-300" : "text-gray-800 dark:text-gray-100"}`}>
                            {quest.title}
                        </h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {quest.description}
                    </p>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 dark:text-gray-500 font-medium">
                                {clampedProgress} / {quest.goal}
                            </span>
                            <span className={`font-bold ${quest.completed ? "text-green-500" : "text-gray-400 dark:text-gray-600"}`}>
                                {quest.completed ? "Done!" : `${percent}%`}
                            </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${quest.completed ? "bg-green-500" : colors.bar}`}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Gems reward */}
            <div className={`mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg w-fit ${
                quest.completed
                    ? "bg-green-50 dark:bg-green-900/20"
                    : "bg-yellow-50 dark:bg-yellow-900/10"
            }`}>
                <Gem
                    size={14}
                    className={quest.completed ? "text-green-500" : "text-yellow-500"}
                    fill="currentColor"
                />
                <span className={`text-xs font-bold ${quest.completed ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                    {quest.completed ? `+${quest.gems} earned` : `${quest.gems} gems`}
                </span>
            </div>
        </div>
    );
};

const QuestsPage = () => {
    const [quests, setQuests] = useState<DailyQuest[]>([]);
    const [totalGems, setTotalGems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadQuests();
    }, []);

    const loadQuests = async () => {
        setIsLoading(true);
        const result = await getDailyQuests();
        if (result.success && result.quests) {
            setQuests(result.quests);
            setTotalGems(result.totalGems ?? 0);
        } else {
            toast.error(result.errorMessage || "Failed to load quests");
        }
        setIsLoading(false);
    };

    const completedCount = quests.filter(q => q.completed).length;
    const gemsEarnedToday = quests.filter(q => q.completed).reduce((sum, q) => sum + q.gems, 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />

            <main className="sidebar-layout max-w-3xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="font-lilita text-4xl text-gray-800 dark:text-gray-100">
                                Daily Quests
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Complete quests to earn gems. Resets every day.
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
                            <Gem size={18} className="text-yellow-500" fill="currentColor" />
                            <span className="font-bold text-yellow-600 dark:text-yellow-400 text-sm">
                                {totalGems.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Summary bar */}
                    {!isLoading && quests.length > 0 && (
                        <div className="mt-5 flex items-center gap-4">
                            <div className="flex-1">
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mb-1.5">
                                    <span className="font-medium">Today&apos;s progress</span>
                                    <span className="font-bold">{completedCount}/{quests.length} quests</span>
                                </div>
                                <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-linear-to-r from-yellow-400 to-orange-500 transition-all duration-700"
                                        style={{ width: `${quests.length > 0 ? (completedCount / quests.length) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                            {gemsEarnedToday > 0 && (
                                <div className="flex items-center gap-1 shrink-0">
                                    <Gem size={14} className="text-yellow-500" fill="currentColor" />
                                    <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                                        +{gemsEarnedToday} today
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Reset notice */}
                <div className="flex items-center gap-2 mb-6 text-xs text-gray-400 dark:text-gray-600">
                    <RefreshCw size={12} />
                    <span>Quests reset daily at midnight</span>
                </div>

                {/* Quest cards */}
                {isLoading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-36 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {quests.map((quest) => (
                            <QuestCard key={quest.key} quest={quest} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default QuestsPage;
