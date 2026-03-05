"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import type { LeaderboardMember, LeaderboardRank } from "@/models/types";
import { getLeaderboard } from "@/api/studentApi";
import Sidebar from "@/components/ui/sidebar";
import { Trophy, Star, ChevronUp, ChevronDown, Minus, Crown, Zap } from "lucide-react";

// ─── Rank config ────────────────────────────────────────

const RANK_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
    bronze: {
        label: "Bronze",
        color: "text-amber-700 dark:text-amber-500",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        border: "border-amber-300 dark:border-amber-700",
        icon: "🥉",
    },
    silver: {
        label: "Silver",
        color: "text-slate-500 dark:text-slate-400",
        bg: "bg-slate-50 dark:bg-slate-800/50",
        border: "border-slate-300 dark:border-slate-600",
        icon: "🥈",
    },
    gold: {
        label: "Gold",
        color: "text-yellow-600 dark:text-yellow-400",
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        border: "border-yellow-300 dark:border-yellow-600",
        icon: "🥇",
    },
    platinum: {
        label: "Platinum",
        color: "text-teal-600 dark:text-teal-400",
        bg: "bg-teal-50 dark:bg-teal-900/20",
        border: "border-teal-300 dark:border-teal-600",
        icon: "🏅",
    },
    ruby: {
        label: "Ruby",
        color: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-50 dark:bg-rose-900/20",
        border: "border-rose-300 dark:border-rose-600",
        icon: "💎",
    },
    pearl: {
        label: "Pearl",
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-50 dark:bg-purple-900/20",
        border: "border-purple-300 dark:border-purple-600",
        icon: "🔮",
    },
    diamond: {
        label: "Diamond",
        color: "text-blue-500 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-300 dark:border-blue-600",
        icon: "💠",
    },
    champions: {
        label: "Champions",
        color: "text-orange-500 dark:text-orange-400",
        bg: "bg-orange-50 dark:bg-orange-900/20",
        border: "border-orange-300 dark:border-orange-600",
        icon: "👑",
    },
};

const RANK_FALLBACK = {
    label: "Bronze",
    color: "text-amber-700 dark:text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-300 dark:border-amber-700",
    icon: "🥉",
};

// ─── Helpers ─────────────────────────────────────────────

function getPositionIcon(position: number): React.ReactNode {
    if (position === 1) return <Crown size={18} className="text-yellow-500" fill="currentColor" />;
    if (position === 2) return <Trophy size={18} className="text-slate-400" fill="currentColor" />;
    if (position === 3) return <Trophy size={18} className="text-amber-700" fill="currentColor" />;
    return <span className="text-sm font-bold text-gray-400 dark:text-gray-500 w-[18px] text-center">{position}</span>;
}

function getTimeUntilReset(weekEnd: string): string {
    const now = new Date();
    const end = new Date(weekEnd);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Resetting...";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h until reset`;
    if (hours > 0) return `${hours}h ${minutes}m until reset`;
    return `${minutes}m until reset`;
}

// ─── Zone label ──────────────────────────────────────────

function ZoneDivider({ label, color }: { label: string; color: string }) {
    return (
        <div className={`flex items-center gap-2 py-1 px-3 my-1 rounded-lg ${color}`}>
            <div className="flex-1 h-px bg-current opacity-30" />
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</span>
            <div className="flex-1 h-px bg-current opacity-30" />
        </div>
    );
}

// ─── Member row ──────────────────────────────────────────

function MemberRow({
    member,
    isMe,
    zone,
}: {
    member: LeaderboardMember;
    isMe: boolean;
    zone: "promotion" | "neutral" | "relegation";
}) {
    const zoneStyles = {
        promotion: "bg-green-50 dark:bg-green-900/15 border-green-200 dark:border-green-800",
        neutral: "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700",
        relegation: "bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800",
    };

    const meStyles = isMe
        ? "ring-2 ring-blue-400 dark:ring-blue-500 ring-offset-1"
        : "";

    const ZoneIcon = () => {
        if (zone === "promotion") return <ChevronUp size={14} className="text-green-500 shrink-0" />;
        if (zone === "relegation") return <ChevronDown size={14} className="text-red-500 shrink-0" />;
        return <Minus size={14} className="text-gray-400 shrink-0" />;
    };

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${zoneStyles[zone]} ${meStyles}`}>
            {/* Position */}
            <div className="w-6 flex items-center justify-center shrink-0">
                {getPositionIcon(member.rank_position)}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
                <span className={`font-bold text-sm truncate block ${
                    isMe
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-800 dark:text-gray-100"
                }`}>
                    {member.full_name}
                    {isMe && <span className="ml-1.5 text-xs font-semibold text-blue-400 dark:text-blue-500">(you)</span>}
                </span>
            </div>

            {/* XP */}
            <div className="flex items-center gap-1 shrink-0">
                <Zap size={13} className="text-yellow-500" fill="currentColor" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {member.xp_earned.toLocaleString()}
                </span>
            </div>

            {/* Zone icon */}
            <ZoneIcon />
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────

const LeaderboardsPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [leaderboardId, setLeaderboardId] = useState<string | null>(null);
    const [rank, setRank] = useState<string>("bronze");
    const [weekEnd, setWeekEnd] = useState<string>("");
    const [members, setMembers] = useState<LeaderboardMember[]>([]);
    const [myPosition, setMyPosition] = useState(0);
    const [myXp, setMyXp] = useState(0);
    const [promotionZone, setPromotionZone] = useState(3);
    const [relegationZone, setRelegationZone] = useState(2);
    const [totalMembers, setTotalMembers] = useState(0);
    const [myUserId, setMyUserId] = useState<string | null>(null);
    const [timeLabel, setTimeLabel] = useState("");
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        loadLeaderboard();
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    useEffect(() => {
        if (!weekEnd) return;
        setTimeLabel(getTimeUntilReset(weekEnd));
        timerRef.current = setInterval(() => {
            setTimeLabel(getTimeUntilReset(weekEnd));
        }, 60000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [weekEnd]);

    const loadLeaderboard = async () => {
        setIsLoading(true);
        const result = await getLeaderboard();
        if (result.success && result.members) {
            setLeaderboardId(result.leaderboardId ?? null);
            setRank(result.rank ?? "bronze");
            setWeekEnd(result.weekEnd ?? "");
            setMembers(result.members);
            setMyPosition(result.myPosition ?? 0);
            setMyXp(result.myXp ?? 0);
            setPromotionZone(result.promotionZone ?? 3);
            setRelegationZone(result.relegationZone ?? 0);
            setTotalMembers(result.totalMembers ?? 0);

            // Find my user_id by matching position
            const myEntry = result.members.find(m => m.rank_position === result.myPosition);
            if (myEntry) setMyUserId(myEntry.user_id);
        } else {
            toast.error(result.errorMessage || "Failed to load leaderboard");
        }
        setIsLoading(false);
    };

    const rankCfg = RANK_CONFIG[rank] ?? RANK_FALLBACK;

    // Compute which zone each member is in
    const getZone = (pos: number): "promotion" | "neutral" | "relegation" => {
        if (pos <= promotionZone) return "promotion";
        if (relegationZone > 0 && pos > totalMembers - relegationZone) return "relegation";
        return "neutral";
    };

    // Build member rows with dividers
    const renderMembers = () => {
        const rows: React.ReactNode[] = [];
        let prevZone: "promotion" | "neutral" | "relegation" | null = null;

        for (const member of members) {
            const zone = getZone(member.rank_position);

            if (prevZone !== null && prevZone !== zone) {
                if (prevZone === "promotion" && zone === "neutral") {
                    rows.push(
                        <ZoneDivider
                            key="div-promo-neutral"
                            label="Safe zone"
                            color="text-gray-400 dark:text-gray-600"
                        />
                    );
                } else if (prevZone === "neutral" && zone === "relegation") {
                    rows.push(
                        <ZoneDivider
                            key="div-neutral-relegate"
                            label="Danger zone"
                            color="text-red-400 dark:text-red-600"
                        />
                    );
                }
            }

            rows.push(
                <MemberRow
                    key={member.user_id}
                    member={member}
                    isMe={member.user_id === myUserId}
                    zone={zone}
                />
            );
            prevZone = zone;
        }

        return rows;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />

            <main className="sidebar-layout max-w-2xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="font-lilita text-4xl text-gray-800 dark:text-gray-100">
                        Leaderboards
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Compete to climb the ranks each week.
                    </p>
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        <div className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                        <div className="h-96 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    </div>
                ) : (
                    <>
                        {/* Rank badge + timer */}
                        <div className={`flex items-center justify-between p-5 rounded-2xl border-2 mb-6 ${rankCfg.bg} ${rankCfg.border}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{rankCfg.icon}</span>
                                <div>
                                    <p className={`font-lilita text-xl ${rankCfg.color}`}>
                                        {rankCfg.label} League
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {totalMembers} / 12 members
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {timeLabel}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                                    Top 3 promoted · Bottom 2 relegated
                                </p>
                            </div>
                        </div>

                        {/* My stats */}
                        <div className="flex gap-3 mb-6">
                            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                                <p className="text-2xl font-lilita text-blue-600 dark:text-blue-400">
                                    #{myPosition}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Your rank</p>
                            </div>
                            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                                <p className="text-2xl font-lilita text-yellow-500">
                                    {myXp.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">XP this week</p>
                            </div>
                        </div>

                        {/* Zone legend */}
                        <div className="flex gap-2 mb-4 text-xs">
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                                <ChevronUp size={12} />
                                <span className="font-semibold">Top {promotionZone} promoted</span>
                            </div>
                            {relegationZone > 0 && (
                                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                                    <ChevronDown size={12} />
                                    <span className="font-semibold">Bottom {relegationZone} relegated</span>
                                </div>
                            )}
                        </div>

                        {/* Member list */}
                        <div className="space-y-2">
                            {members.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                                    <Star size={40} className="mx-auto mb-3 opacity-40" />
                                    <p className="font-semibold">No members yet</p>
                                </div>
                            ) : (
                                renderMembers()
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default LeaderboardsPage;
