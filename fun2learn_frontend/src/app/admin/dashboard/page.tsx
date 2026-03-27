"use client";

import { useState, useEffect } from "react";
import { Gem, Users, BookOpen, GraduationCap, Clock, CircleCheck, XCircle, Loader2, LogOut, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useUser } from "@/context/user-context";
import Button from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import ThemeToggle from "@/components/ui/themeToggle";
import { getAdminRedeemRequests, updateRedeemStatus, getAdminStats } from "@/api/adminApi";
import type { RedeemRequest, AdminStats } from "@/models/types";

const GEM_TO_RS = 0.8;

type Filter = "all" | "pending" | "paid" | "rejected";

const AdminDashboard = () => {
    const router = useRouter();
    const { user, loading } = useUser();

    const [stats, setStats] = useState<AdminStats | null>(null);
    const [requests, setRequests] = useState<RedeemRequest[]>([]);
    const [filter, setFilter] = useState<Filter>("pending");
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [notesInput, setNotesInput] = useState<Record<string, string>>({});
    const [showNotes, setShowNotes] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace("/login");
            return;
        }
        if (user.role !== "admin") {
            router.replace("/home");
        }
    }, [user, loading, router]);

    const fetchData = async () => {
        setIsLoading(true);
        const [reqResult, statsResult] = await Promise.all([
            getAdminRedeemRequests(),
            getAdminStats(),
        ]);

        if (reqResult.success) {
            setRequests(reqResult.requests ?? []);
        } else {
            toast.error(reqResult.errorMessage || "Failed to load requests");
        }

        if (statsResult.success) {
            setStats({
                total_users: statsResult.totalUsers ?? 0,
                total_courses: statsResult.totalCourses ?? 0,
                total_enrollments: statsResult.totalEnrollments ?? 0,
                pending_redeem_requests: statsResult.pendingRedeemRequests ?? 0,
            });
        }

        setIsLoading(false);
    };

    useEffect(() => {
        if (user?.role === "admin") {
            fetchData();
        }
    }, [user]);

    const handleUpdateStatus = async (requestId: string, newStatus: 'paid' | 'rejected') => {
        setProcessingId(requestId);
        const notes = notesInput[requestId] || undefined;
        const result = await updateRedeemStatus(requestId, newStatus, notes);
        if (result.success) {
            toast.success(`Request ${newStatus} successfully`);
            fetchData();
        } else {
            toast.error(result.errorMessage || "Failed to update request");
        }
        setProcessingId(null);
    };

    const handleLogout = () => {
        Cookies.remove("accessToken");
        router.push("/login");
    };

    const filteredRequests = requests.filter((r) =>
        filter === "all" ? true : r.status === filter
    );

    if (loading || isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader2 size={48} className="animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Top Bar */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Logo size="md" />
                        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                        <h1 className="font-lilita text-xl text-gray-800 dark:text-gray-100">Admin Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Button variant="secondary" size="sm" onClick={handleLogout}>
                            <span className="flex items-center gap-2"><LogOut size={16} /> Logout</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

                {/* Stats Row */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total Users", value: stats.total_users, icon: <Users size={22} className="text-blue-500" /> },
                            { label: "Total Courses", value: stats.total_courses, icon: <BookOpen size={22} className="text-purple-500" /> },
                            { label: "Enrollments", value: stats.total_enrollments, icon: <GraduationCap size={22} className="text-green-500" /> },
                            { label: "Pending Redeems", value: stats.pending_redeem_requests, icon: <Clock size={22} className="text-yellow-500" /> },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-xl">{stat.icon}</div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                                    <p className="text-2xl font-lilita text-gray-800 dark:text-gray-100">{stat.value.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Redeem Requests */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="font-lilita text-xl text-gray-800 dark:text-gray-100 mb-4">Gem Redeem Requests</h2>

                        {/* Filter tabs */}
                        <div className="flex gap-2">
                            {(["pending", "all", "paid", "rejected"] as Filter[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${
                                        filter === f
                                            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredRequests.length === 0 ? (
                            <p className="text-center text-gray-400 dark:text-gray-500 py-12 text-sm">No requests found.</p>
                        ) : (
                            filteredRequests.map((req) => (
                                <div key={req.id} className="p-6 space-y-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-gray-100">{req.tutor_name}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                                                    <Gem size={14} className="text-yellow-500" fill="currentColor" />
                                                    {req.gems_requested.toLocaleString()} gems
                                                </span>
                                                <span className="text-gray-400">→</span>
                                                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                                    Rs. {req.amount_rs.toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Requested: {new Date(req.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                                {req.processed_at && ` · Processed: ${new Date(req.processed_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`}
                                            </p>
                                            {req.notes && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">Note: {req.notes}</p>
                                            )}
                                        </div>
                                        <span className={`shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                            req.status === "pending"
                                                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                                                : req.status === "paid"
                                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                        }`}>
                                            {req.status === "pending" ? <Clock size={12} /> : req.status === "paid" ? <CircleCheck size={12} /> : <XCircle size={12} />}
                                            {req.status}
                                        </span>
                                    </div>

                                    {req.status === "pending" && (
                                        <div className="space-y-2">
                                            {showNotes[req.id] && (
                                                <input
                                                    type="text"
                                                    placeholder="Add note (optional)"
                                                    value={notesInput[req.id] || ""}
                                                    onChange={(e) => setNotesInput({ ...notesInput, [req.id]: e.target.value })}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
                                                />
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleUpdateStatus(req.id, "paid")}
                                                    isLoading={processingId === req.id}
                                                    loadingText="Processing..."
                                                >
                                                    <span className="flex items-center gap-1"><CircleCheck size={14} /> Mark Paid</span>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => handleUpdateStatus(req.id, "rejected")}
                                                    isLoading={processingId === req.id}
                                                    loadingText="Processing..."
                                                >
                                                    <span className="flex items-center gap-1"><XCircle size={14} /> Reject</span>
                                                </Button>
                                                <button
                                                    onClick={() => setShowNotes({ ...showNotes, [req.id]: !showNotes[req.id] })}
                                                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                >
                                                    <MessageSquare size={13} />
                                                    {showNotes[req.id] ? "Hide note" : "Add note"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
