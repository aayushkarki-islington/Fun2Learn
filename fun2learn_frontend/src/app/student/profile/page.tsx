"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/ui/sidebar";
import Button from "@/components/ui/button";
import type { UserProfile, UserSummary, Badge } from "@/models/types";
import {
    getMyProfile, updateProfile, uploadProfilePicture,
    followUser, unfollowUser, getFollowers, getFollowing, searchUsers
} from "@/api/profileApi";
import { useUser } from "@/context/user-context";
import { ICON_MAP } from "@/components/prepublish/iconMap";
import {
    Flame, Zap, Trophy, BookOpen, GraduationCap,
    Pencil, Camera, X, Search, UserPlus, UserCheck, Users,
    Crown, Shield, Medal, Star, Award, Sparkles, ChevronRight, Gem
} from "lucide-react";

// ─── Rank config ──────────────────────────────────────────
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

// ─── Avatar ───────────────────────────────────────────────
function Avatar({
    imagePath, fullName, rank, size = "lg", onClick
}: {
    imagePath?: string | null;
    fullName: string;
    rank: string;
    size?: "sm" | "md" | "lg";
    onClick?: () => void;
}) {
    const cfg = getRankConfig(rank);
    const sizeClasses = size === "lg" ? "w-28 h-28 text-4xl" : size === "md" ? "w-14 h-14 text-xl" : "w-10 h-10 text-sm";
    const borderClasses = size === "lg" ? "border-4" : "border-2";
    const initials = fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    return (
        <div
            className={`relative ${sizeClasses} rounded-full ${borderClasses} ${cfg.border} overflow-hidden flex-shrink-0 ${onClick ? "cursor-pointer group" : ""}`}
            onClick={onClick}
        >
            {imagePath ? (
                <img src={imagePath} alt={fullName} className="w-full h-full object-cover" />
            ) : (
                <div className={`w-full h-full flex items-center justify-center font-bold ${cfg.bg} ${cfg.color}`}>
                    {initials}
                </div>
            )}
            {onClick && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={size === "lg" ? 24 : 16} className="text-white" />
                </div>
            )}
        </div>
    );
}

// ─── Rank Badge ───────────────────────────────────────────
function RankBadge({ rank }: { rank: string }) {
    const cfg = getRankConfig(rank);
    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${cfg.border} ${cfg.bg} ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
        </span>
    );
}

// ─── Stat Card ────────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
    return (
        <div className="flex flex-col items-center gap-1 p-4 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 min-w-[90px]">
            <span className={color}>{icon}</span>
            <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{value}</span>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">{label}</span>
        </div>
    );
}

// ─── Badge Display ────────────────────────────────────────
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

// ─── User Card (followers/following/search) ────────────────
function UserCard({
    user, onFollow, onUnfollow, onViewProfile
}: {
    user: UserSummary;
    onFollow: (id: string) => void;
    onUnfollow: (id: string) => void;
    onViewProfile: (id: string) => void;
}) {
    const cfg = getRankConfig(user.current_rank ?? "bronze");
    return (
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 transition-all">
            <div onClick={() => onViewProfile(user.user_id)} className="cursor-pointer">
                <Avatar imagePath={user.image_path} fullName={user.full_name} rank={user.current_rank ?? "bronze"} size="sm" />
            </div>
            <div className="flex-1 min-w-0" onClick={() => onViewProfile(user.user_id)} role="button">
                <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                    {user.full_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.username ? `@${user.username}` : ""}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${cfg.color} hidden sm:block`}>{cfg.label}</span>
                {user.is_following ? (
                    <button
                        onClick={() => onUnfollow(user.user_id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all border-2 border-transparent"
                    >
                        <UserCheck size={12} />
                        Following
                    </button>
                ) : (
                    <button
                        onClick={() => onFollow(user.user_id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all"
                    >
                        <UserPlus size={12} />
                        Follow
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Edit Profile Modal ───────────────────────────────────
function EditProfileModal({
    profile,
    onClose,
    onSaved,
}: {
    profile: UserProfile;
    onClose: () => void;
    onSaved: (newName: string, newUsername: string) => void;
}) {
    const [fullName, setFullName] = useState(profile.full_name);
    const [username, setUsername] = useState(profile.username ?? "");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!fullName.trim()) { toast.error("Name cannot be empty"); return; }
        if (!username.trim()) { toast.error("Username cannot be empty"); return; }
        setIsSaving(true);
        const result = await updateProfile({ full_name: fullName, username });
        if (result.success) {
            toast.success("Profile updated!");
            onSaved(fullName, username);
        } else {
            toast.error(result.errorMessage || "Failed to update profile");
        }
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-100 dark:border-gray-800">
                    <h3 className="font-lilita text-xl text-gray-800 dark:text-gray-100">Edit Profile</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer">
                        <X size={20} />
                    </button>
                </div>
                <div className="px-6 py-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400">Display Name</label>
                        <input
                            className="h-11 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent px-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            placeholder="Your display name"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400">Username</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
                            <input
                                className="h-11 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent pl-7 pr-3 w-full text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
                                value={username}
                                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                                placeholder="username"
                            />
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Only lowercase letters, numbers, and underscores</p>
                    </div>
                </div>
                <div className="px-6 pb-5 flex gap-3">
                    <Button className="flex-1" onClick={handleSave} isLoading={isSaving} loadingText="Saving...">
                        Save Changes
                    </Button>
                    <button
                        onClick={onClose}
                        className="flex-1 h-11 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Search Users Modal ────────────────────────────────────
function SearchUsersModal({
    onClose,
    onFollowChange,
}: {
    onClose: () => void;
    onFollowChange: () => void;
}) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<UserSummary[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (q: string) => {
        setQuery(q);
        if (q.length < 2) { setResults([]); return; }
        setIsSearching(true);
        const result = await searchUsers(q);
        if (result.success) setResults(result.users ?? []);
        setIsSearching(false);
    };

    const handleFollow = async (userId: string) => {
        const result = await followUser(userId);
        if (result.success) {
            setResults(prev => prev.map(u => u.user_id === userId ? { ...u, is_following: true } : u));
            onFollowChange();
        } else {
            toast.error(result.errorMessage || "Failed to follow");
        }
    };

    const handleUnfollow = async (userId: string) => {
        const result = await unfollowUser(userId);
        if (result.success) {
            setResults(prev => prev.map(u => u.user_id === userId ? { ...u, is_following: false } : u));
            onFollowChange();
        } else {
            toast.error(result.errorMessage || "Failed to unfollow");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-100 dark:border-gray-800">
                    <h3 className="font-lilita text-xl text-gray-800 dark:text-gray-100">Find Friends</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer">
                        <X size={20} />
                    </button>
                </div>
                <div className="px-6 py-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            className="h-11 w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent pl-9 pr-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
                            placeholder="Search by name or username..."
                            value={query}
                            onChange={e => handleSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>
                <div className="px-6 pb-5 flex flex-col gap-2 max-h-80 overflow-y-auto">
                    {isSearching && (
                        <p className="text-center text-sm text-gray-400 py-4">Searching...</p>
                    )}
                    {!isSearching && query.length >= 2 && results.length === 0 && (
                        <p className="text-center text-sm text-gray-400 py-4">No users found</p>
                    )}
                    {!isSearching && query.length < 2 && (
                        <p className="text-center text-sm text-gray-400 py-4">Type at least 2 characters to search</p>
                    )}
                    {results.map(user => (
                        <UserCard
                            key={user.user_id}
                            user={user}
                            onFollow={handleFollow}
                            onUnfollow={handleUnfollow}
                            onViewProfile={(id) => { router.push(`/student/profile/${id}`); onClose(); }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Followers / Following Tab ────────────────────────────
type TabType = "stats" | "followers" | "following";

// ─── Main Profile Page ────────────────────────────────────
const ProfilePage = () => {
    const router = useRouter();
    const { refreshUser } = useUser();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("stats");
    const [followers, setFollowers] = useState<UserSummary[]>([]);
    const [following, setFollowing] = useState<UserSummary[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [isUploadingPic, setIsUploadingPic] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { loadProfile(); }, []);

    const loadProfile = async () => {
        setIsLoading(true);
        const result = await getMyProfile();
        if (result.success && result.profile) {
            setProfile(result.profile);
        } else {
            toast.error("Failed to load profile");
        }
        setIsLoading(false);
    };

    const loadFollowers = async () => {
        setLoadingList(true);
        const result = await getFollowers();
        if (result.success) setFollowers(result.users ?? []);
        setLoadingList(false);
    };

    const loadFollowing = async () => {
        setLoadingList(true);
        const result = await getFollowing();
        if (result.success) setFollowing(result.users ?? []);
        setLoadingList(false);
    };

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        if (tab === "followers" && followers.length === 0) loadFollowers();
        if (tab === "following" && following.length === 0) loadFollowing();
    };

    const handlePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingPic(true);
        const result = await uploadProfilePicture(file);
        if (result.success && result.imagePath) {
            setProfile(prev => prev ? { ...prev, image_path: result.imagePath! } : prev);
            await refreshUser();
            toast.success("Profile picture updated!");
        } else {
            toast.error(result.errorMessage || "Failed to upload picture");
        }
        setIsUploadingPic(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFollowFromList = async (userId: string) => {
        const result = await followUser(userId);
        if (result.success) {
            setFollowers(prev => prev.map(u => u.user_id === userId ? { ...u, is_following: true } : u));
            setFollowing(prev => prev.map(u => u.user_id === userId ? { ...u, is_following: true } : u));
            setProfile(prev => prev ? { ...prev, following_count: prev.following_count + 1 } : prev);
        } else {
            toast.error(result.errorMessage || "Failed to follow");
        }
    };

    const handleUnfollowFromList = async (userId: string) => {
        const result = await unfollowUser(userId);
        if (result.success) {
            setFollowers(prev => prev.map(u => u.user_id === userId ? { ...u, is_following: false } : u));
            setFollowing(prev => prev.filter(u => u.user_id !== userId));
            setProfile(prev => prev ? { ...prev, following_count: Math.max(0, prev.following_count - 1) } : prev);
        } else {
            toast.error(result.errorMessage || "Failed to unfollow");
        }
    };

    const handleProfileSaved = (newName: string, newUsername: string) => {
        setProfile(prev => prev ? { ...prev, full_name: newName, username: newUsername } : prev);
        refreshUser();
        setShowEditModal(false);
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
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
                            ))}
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

                {/* ── Profile Header ── */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-6 mb-5">
                    <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">

                        {/* Avatar with upload */}
                        <div className="relative">
                            {isUploadingPic ? (
                                <div className="w-28 h-28 rounded-full border-4 border-gray-200 dark:border-gray-600 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                    <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <Avatar
                                    imagePath={profile.image_path}
                                    fullName={profile.full_name}
                                    rank={profile.current_rank}
                                    size="lg"
                                    onClick={() => fileInputRef.current?.click()}
                                />
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handlePicUpload}
                            />
                        </div>

                        {/* Name + rank + actions */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="font-lilita text-2xl text-gray-800 dark:text-gray-100 truncate">
                                    {profile.full_name}
                                </h1>
                                <RankBadge rank={profile.current_rank} />
                            </div>
                            {profile.username && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">@{profile.username}</p>
                            )}

                            {/* Followers / Following counts */}
                            <div className="flex gap-4 mb-4">
                                <button
                                    onClick={() => handleTabChange("followers")}
                                    className="text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer"
                                >
                                    <span className="text-gray-900 dark:text-white">{profile.followers_count}</span>
                                    {" "}<span className="text-gray-500 dark:text-gray-400 font-normal">followers</span>
                                </button>
                                <button
                                    onClick={() => handleTabChange("following")}
                                    className="text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer"
                                >
                                    <span className="text-gray-900 dark:text-white">{profile.following_count}</span>
                                    {" "}<span className="text-gray-500 dark:text-gray-400 font-normal">following</span>
                                </button>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    className="text-sm flex items-center gap-1.5"
                                    onClick={() => setShowEditModal(true)}
                                >
                                    <Pencil size={14} />
                                    Edit Profile
                                </Button>
                                <button
                                    onClick={() => setShowSearchModal(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-blue-300 hover:text-blue-500 dark:hover:border-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer"
                                >
                                    <UserPlus size={14} />
                                    Add Friends
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex gap-1 p-1 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 mb-5">
                    {(["stats", "followers", "following"] as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all cursor-pointer ${
                                activeTab === tab
                                    ? "bg-blue-500 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                        >
                            {tab === "followers" ? `Followers (${profile.followers_count})` :
                             tab === "following" ? `Following (${profile.following_count})` :
                             "Stats"}
                        </button>
                    ))}
                </div>

                {/* ── Stats Tab ── */}
                {activeTab === "stats" && (
                    <div className="space-y-5">
                        {/* Core stats grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <StatCard
                                icon={<Flame size={24} fill="currentColor" />}
                                label="Day Streak"
                                value={profile.daily_streak}
                                color="text-orange-500"
                            />
                            <StatCard
                                icon={<Zap size={24} fill="currentColor" />}
                                label="Total XP"
                                value={profile.experience_points.toLocaleString()}
                                color="text-blue-500"
                            />
                            <StatCard
                                icon={<Trophy size={24} fill="currentColor" />}
                                label="Achievements"
                                value={profile.total_achievements}
                                color="text-yellow-400"
                            />
                            <StatCard
                                icon={<BookOpen size={24} />}
                                label="Lessons"
                                value={profile.lessons_completed}
                                color="text-green-500"
                            />
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
                                <p className="text-center text-gray-400 dark:text-gray-500 py-6 text-sm">
                                    Complete courses to earn badges!
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-5">
                                    {profile.earned_badges.map(badge => (
                                        <BadgeDisplay key={badge.id} badge={badge} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Streak info card */}
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

                        {/* Learning stats card */}
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

                        {/* Rank card */}
                        <div className={`bg-white dark:bg-gray-800 rounded-2xl border-2 ${rankCfg.border} p-5`}>
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                <Shield size={18} className={rankCfg.color} />
                                Leaderboard Rank
                            </h3>
                            <div className={`flex items-center justify-between p-4 rounded-xl ${rankCfg.bg}`}>
                                <div className="flex items-center gap-3">
                                    <span className={`text-2xl ${rankCfg.color}`}>{rankCfg.icon}</span>
                                    <div>
                                        <p className={`text-lg font-black ${rankCfg.color}`}>{rankCfg.label}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Current League</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push("/student/leaderboards")}
                                    className={`flex items-center gap-1 text-sm font-bold ${rankCfg.color} hover:opacity-70 transition-opacity cursor-pointer`}
                                >
                                    View <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Followers Tab ── */}
                {activeTab === "followers" && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Users size={18} className="text-blue-500" />
                            <h3 className="font-bold text-gray-700 dark:text-gray-300">
                                Followers ({profile.followers_count})
                            </h3>
                        </div>
                        {loadingList ? (
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : followers.length === 0 ? (
                            <p className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">No followers yet. Share your profile!</p>
                        ) : (
                            <div className="space-y-2">
                                {followers.map(user => (
                                    <UserCard
                                        key={user.user_id}
                                        user={user}
                                        onFollow={handleFollowFromList}
                                        onUnfollow={handleUnfollowFromList}
                                        onViewProfile={(id) => router.push(`/student/profile/${id}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Following Tab ── */}
                {activeTab === "following" && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Users size={18} className="text-blue-500" />
                            <h3 className="font-bold text-gray-700 dark:text-gray-300">
                                Following ({profile.following_count})
                            </h3>
                        </div>
                        {loadingList ? (
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : following.length === 0 ? (
                            <p className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">Not following anyone yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {following.map(user => (
                                    <UserCard
                                        key={user.user_id}
                                        user={user}
                                        onFollow={handleFollowFromList}
                                        onUnfollow={handleUnfollowFromList}
                                        onViewProfile={(id) => router.push(`/student/profile/${id}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* ── Modals ── */}
            {showEditModal && profile && (
                <EditProfileModal
                    profile={profile}
                    onClose={() => setShowEditModal(false)}
                    onSaved={handleProfileSaved}
                />
            )}
            {showSearchModal && (
                <SearchUsersModal
                    onClose={() => setShowSearchModal(false)}
                    onFollowChange={loadProfile}
                />
            )}
        </div>
    );
};

export default ProfilePage;
