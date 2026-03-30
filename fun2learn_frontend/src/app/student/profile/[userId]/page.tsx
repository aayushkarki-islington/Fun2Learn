"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Sidebar from "@/components/ui/sidebar";
import Button from "@/components/ui/button";
import type { UserProfile, UserSummary, Badge } from "@/models/types";
import { ICON_MAP } from "@/components/prepublish/iconMap";
import {
    getUserProfile, followUser, unfollowUser,
    getFollowers, getFollowing
} from "@/api/profileApi";
import {
    Flame, Zap, Trophy, BookOpen, GraduationCap,
    Shield, Star, Medal, Award, Sparkles, Crown, Gem,
    UserPlus, UserCheck, Users, ArrowLeft
} from "lucide-react";

// ─── Rank config (same as own profile) ───────────────────
const RANK_CONFIG: Record<string, { label: string; color: string; border: string; bg: string; icon: React.ReactNode }> = {
    bronze:    { label: "Bronze",    color: "text-amber-600",   border: "border-amber-500",   bg: "bg-amber-50 dark:bg-amber-900/20",   icon: <Shield size={14} /> },
    silver:    { label: "Silver",    color: "text-slate-500",   border: "border-slate-400",   bg: "bg-slate-50 dark:bg-slate-800/30",   icon: <Shield size={14} /> },
    gold:      { label: "Gold",      color: "text-yellow-500",  border: "border-yellow-400",  bg: "bg-yellow-50 dark:bg-yellow-900/20", icon: <Star size={14} /> },
    platinum:  { label: "Platinum",  color: "text-cyan-500",    border: "border-cyan-400",    bg: "bg-cyan-50 dark:bg-cyan-900/20",     icon: <Medal size={14} /> },
    ruby:      { label: "Ruby",      color: "text-rose-500",    border: "border-rose-400",    bg: "bg-rose-50 dark:bg-rose-900/20",     icon: <Award size={14} /> },
    pearl:     { label: "Pearl",     color: "text-purple-500",  border: "border-purple-400",  bg: "bg-purple-50 dark:bg-purple-900/20", icon: <Sparkles size={14} /> },
    diamond:   { label: "Diamond",   color: "text-blue-400",    border: "border-blue-300",    bg: "bg-blue-50 dark:bg-blue-900/20",     icon: <Gem size={14} /> },
    champions: { label: "Champions", color: "text-orange-400",  border: "border-orange-300",  bg: "bg-orange-50 dark:bg-orange-900/20", icon: <Crown size={14} /> },
};

function getRankConfig(rank: string) {
    return RANK_CONFIG[rank?.toLowerCase()] ?? RANK_CONFIG["bronze"];
}

function Avatar({ imagePath, fullName, rank }: { imagePath?: string | null; fullName: string; rank: string }) {
    const cfg = getRankConfig(rank);
    const initials = fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return (
        <div className={`relative w-28 h-28 rounded-full border-4 ${cfg.border} overflow-hidden flex-shrink-0`}>
            {imagePath ? (
                <img src={imagePath} alt={fullName} className="w-full h-full object-cover" />
            ) : (
                <div className={`w-full h-full flex items-center justify-center font-bold text-4xl ${cfg.bg} ${cfg.color}`}>
                    {initials}
                </div>
            )}
        </div>
    );
}

function RankBadge({ rank }: { rank: string }) {
    const cfg = getRankConfig(rank);
    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${cfg.border} ${cfg.bg} ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
        </span>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
    return (
        <div className="flex flex-col items-center gap-1 p-4 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 min-w-[90px]">
            <span className={color}>{icon}</span>
            <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{value}</span>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">{label}</span>
        </div>
    );
}

function BadgeDisplay({ badge }: { badge: Badge }) {
    const IconComponent = badge.icon_name ? ICON_MAP[badge.icon_name] : null;
    return (
        <div className="flex flex-col items-center gap-2 group">
            <div className="relative w-16 h-16 rounded-full border-4 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 flex items-center justify-center shadow-md shadow-yellow-200/50 dark:shadow-yellow-900/30 transition-transform group-hover:scale-110">
                {badge.badge_type === "icon" && IconComponent ? (
                    <IconComponent size={28} className="text-yellow-600 dark:text-yellow-400" />
                ) : badge.badge_type === "image" && badge.image_url ? (
                    <img src={badge.image_url} alt={badge.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                    <Trophy size={28} className="text-yellow-600 dark:text-yellow-400" />
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm text-xs">
                    ⭐
                </div>
            </div>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 text-center max-w-[72px] truncate">{badge.name}</span>
        </div>
    );
}

function UserCard({ user, onFollow, onUnfollow, onViewProfile }: {
    user: UserSummary;
    onFollow: (id: string) => void;
    onUnfollow: (id: string) => void;
    onViewProfile: (id: string) => void;
}) {
    const cfg = getRankConfig(user.current_rank ?? "bronze");
    const initials = user.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return (
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 transition-all">
            <div onClick={() => onViewProfile(user.user_id)} className={`relative w-10 h-10 rounded-full border-2 ${cfg.border} overflow-hidden flex-shrink-0 cursor-pointer`}>
                {user.image_path ? (
                    <img src={user.image_path} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center font-bold text-sm ${cfg.bg} ${cfg.color}`}>{initials}</div>
                )}
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onViewProfile(user.user_id)}>
                <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate hover:text-blue-500 dark:hover:text-blue-400 transition-colors">{user.full_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.username ? `@${user.username}` : ""}</p>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${cfg.color} hidden sm:block`}>{cfg.label}</span>
                {user.is_following ? (
                    <button onClick={() => onUnfollow(user.user_id)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all border-2 border-transparent cursor-pointer">
                        <UserCheck size={12} />Following
                    </button>
                ) : (
                    <button onClick={() => onFollow(user.user_id)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all cursor-pointer">
                        <UserPlus size={12} />Follow
                    </button>
                )}
            </div>
        </div>
    );
}

type TabType = "stats" | "followers" | "following";

const PublicProfilePage = () => {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("stats");
    const [followers, setFollowers] = useState<UserSummary[]>([]);
    const [following, setFollowing] = useState<UserSummary[]>([]);
    const [loadingList, setLoadingList] = useState(false);

    useEffect(() => { loadProfile(); }, [userId]);

    const loadProfile = async () => {
        setIsLoading(true);
        const result = await getUserProfile(userId);
        if (result.success && result.profile) {
            if (result.profile.is_own_profile) {
                router.replace("/student/profile");
                return;
            }
            setProfile(result.profile);
        } else {
            toast.error("User not found");
            router.push("/student/profile");
        }
        setIsLoading(false);
    };

    const loadFollowers = async () => {
        // For public profile we just show counts from profile data (no separate endpoint for other users)
        // Re-use the profile followers_count for display
        setLoadingList(false);
    };

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        if (tab === "followers") loadFollowers();
    };

    const handleFollow = async () => {
        if (!profile) return;
        setIsFollowLoading(true);
        const result = await followUser(profile.user_id);
        if (result.success) {
            setProfile(prev => prev ? {
                ...prev,
                is_following: true,
                followers_count: prev.followers_count + 1
            } : prev);
        } else {
            toast.error(result.errorMessage || "Failed to follow");
        }
        setIsFollowLoading(false);
    };

    const handleUnfollow = async () => {
        if (!profile) return;
        setIsFollowLoading(true);
        const result = await unfollowUser(profile.user_id);
        if (result.success) {
            setProfile(prev => prev ? {
                ...prev,
                is_following: false,
                followers_count: Math.max(0, prev.followers_count - 1)
            } : prev);
        } else {
            toast.error(result.errorMessage || "Failed to unfollow");
        }
        setIsFollowLoading(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar />
                <main className="sidebar-layout max-w-3xl mx-auto px-6 py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="flex gap-6 items-center">
                            <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-gray-700" />
                            <div className="space-y-3 flex-1">
                                <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-xl w-48" />
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-xl w-32" />
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!profile) return null;

    const rankCfg = getRankConfig(profile.current_rank);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />

            <main className="sidebar-layout max-w-3xl mx-auto px-6 py-8">

                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-5 cursor-pointer"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                {/* ── Profile Header ── */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-6 mb-5">
                    <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                        <Avatar imagePath={profile.image_path} fullName={profile.full_name} rank={profile.current_rank} />

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="font-lilita text-2xl text-gray-800 dark:text-gray-100 truncate">{profile.full_name}</h1>
                                <RankBadge rank={profile.current_rank} />
                            </div>
                            {profile.username && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">@{profile.username}</p>
                            )}
                            <div className="flex gap-4 mb-4">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-black text-gray-900 dark:text-white">{profile.followers_count}</span> followers
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-black text-gray-900 dark:text-white">{profile.following_count}</span> following
                                </span>
                            </div>

                            {profile.is_following ? (
                                <button
                                    onClick={handleUnfollow}
                                    disabled={isFollowLoading}
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-red-300 hover:text-red-500 dark:hover:border-red-600 dark:hover:text-red-400 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    <UserCheck size={14} />
                                    {isFollowLoading ? "..." : "Following"}
                                </button>
                            ) : (
                                <Button
                                    className="text-sm flex items-center gap-2"
                                    onClick={handleFollow}
                                    isLoading={isFollowLoading}
                                    loadingText="Following..."
                                >
                                    <UserPlus size={14} />
                                    Follow
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex gap-1 p-1 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 mb-5">
                    {(["stats"] as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all cursor-pointer ${
                                activeTab === tab
                                    ? "bg-blue-500 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                        >
                            Stats
                        </button>
                    ))}
                </div>

                {/* ── Stats ── */}
                <div className="space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatCard icon={<Flame size={24} fill="currentColor" />} label="Day Streak" value={profile.daily_streak} color="text-orange-500" />
                        <StatCard icon={<Zap size={24} fill="currentColor" />} label="Total XP" value={profile.experience_points.toLocaleString()} color="text-blue-500" />
                        <StatCard icon={<Trophy size={24} fill="currentColor" />} label="Achievements" value={profile.total_achievements} color="text-yellow-400" />
                        <StatCard icon={<BookOpen size={24} />} label="Lessons" value={profile.lessons_completed} color="text-green-500" />
                    </div>

                    {/* Badges */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-5">
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                            <Trophy size={18} className="text-yellow-500" />
                            Badges
                            <span className="ml-auto text-xs font-bold text-gray-400 dark:text-gray-500">
                                {profile.earned_badges.length} earned
                            </span>
                        </h3>
                        {profile.earned_badges.length === 0 ? (
                            <p className="text-center text-gray-400 dark:text-gray-500 py-6 text-sm">No badges yet.</p>
                        ) : (
                            <div className="flex flex-wrap gap-5">
                                {profile.earned_badges.map(badge => (
                                    <BadgeDisplay key={badge.id} badge={badge} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-5">
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                            <Flame size={18} className="text-orange-500" />
                            Streak
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                                <p className="text-3xl font-black text-orange-500">{profile.daily_streak}</p>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">Current Streak</p>
                            </div>
                            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                <p className="text-3xl font-black text-red-500">{profile.longest_streak}</p>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">Longest Streak</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-5">
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                            <GraduationCap size={18} className="text-blue-500" />
                            Learning
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Courses Enrolled</span>
                                <span className="text-sm font-black text-gray-800 dark:text-gray-100">{profile.courses_enrolled}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Lessons Completed</span>
                                <span className="text-sm font-black text-gray-800 dark:text-gray-100">{profile.lessons_completed}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Achievements Unlocked</span>
                                <span className="text-sm font-black text-gray-800 dark:text-gray-100">{profile.total_achievements}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`bg-white dark:bg-gray-800 rounded-2xl border-2 ${rankCfg.border} p-5`}>
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                            <Shield size={18} className={rankCfg.color} />
                            Leaderboard Rank
                        </h3>
                        <div className={`flex items-center p-4 rounded-xl ${rankCfg.bg}`}>
                            <span className={`text-2xl ${rankCfg.color} mr-3`}>{rankCfg.icon}</span>
                            <div>
                                <p className={`text-lg font-black ${rankCfg.color}`}>{rankCfg.label}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Current League</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PublicProfilePage;
