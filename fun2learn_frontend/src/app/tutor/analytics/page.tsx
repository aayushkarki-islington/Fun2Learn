"use client";

import { useState, useEffect, useCallback } from "react";
import { Gem, Users, BookOpen, Star, TrendingUp, ChevronDown, Loader2 } from "lucide-react";
import { getAnalyticsOverview, getCourseAnalytics } from "@/api/analyticsApi";
import { getCourses } from "@/api/courseApi";
import type { AnalyticsOverview, CourseAnalytics, CourseSummary } from "@/models/types";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ─── Date range helpers ───────────────────────────────────────────

type Preset = "7D" | "30D" | "3M" | "6M" | "1Y" | "ALL";

function getPresetDates(preset: Preset): { startDate: string; endDate: string } {
    const end = new Date();
    const start = new Date();
    if (preset === "7D") start.setDate(end.getDate() - 7);
    else if (preset === "30D") start.setDate(end.getDate() - 30);
    else if (preset === "3M") start.setMonth(end.getMonth() - 3);
    else if (preset === "6M") start.setMonth(end.getMonth() - 6);
    else if (preset === "1Y") start.setFullYear(end.getFullYear() - 1);
    else return { startDate: "", endDate: "" }; // ALL — no filter
    return {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
    };
}

// ─── Shared components ────────────────────────────────────────────

function KpiCard({ icon, label, value, sub }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    sub?: string;
}) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex gap-4 items-start">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">{value}</p>
                {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="font-bold text-gray-700 dark:text-gray-300 mb-3">{children}</h2>;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-4">{title}</p>
            {children}
        </div>
    );
}

const CHART_COLORS = ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"];
const RATING_COLORS: Record<string, string> = {
    "5": "#22c55e", "4": "#84cc16", "3": "#eab308", "2": "#f97316", "1": "#ef4444",
};

// ─── Date filter bar ──────────────────────────────────────────────

function DateFilterBar({ onApply }: {
    onApply: (start: string, end: string) => void;
}) {
    const [active, setActive] = useState<Preset>("6M");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const presets: Preset[] = ["7D", "30D", "3M", "6M", "1Y", "ALL"];

    function applyPreset(p: Preset) {
        setActive(p);
        const { startDate, endDate } = getPresetDates(p);
        onApply(startDate, endDate);
    }

    function applyCustom() {
        if (customStart && customEnd) {
            setActive("ALL"); // deselect preset highlight
            onApply(customStart, customEnd);
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-2 mb-6">
            {presets.map((p) => (
                <button
                    key={p}
                    onClick={() => applyPreset(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        active === p
                            ? "bg-blue-500 text-white"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400"
                    }`}
                >
                    {p === "ALL" ? "All Time" : p}
                </button>
            ))}
            <div className="flex items-center gap-1 ml-2">
                <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                />
                <span className="text-gray-400 text-sm">→</span>
                <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                />
                <button
                    onClick={applyCustom}
                    disabled={!customStart || !customEnd}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500 text-white disabled:opacity-40"
                >
                    Apply
                </button>
            </div>
        </div>
    );
}

// ─── Overview section ─────────────────────────────────────────────

function OverviewSection({ data }: { data: AnalyticsOverview }) {
    const ratingData = Object.entries(data.rating_distribution).map(([star, count]) => ({
        star: `${star}★`, count, fill: RATING_COLORS[star] ?? "#60a5fa",
    }));

    const topCoursesData = data.top_courses.slice(0, 5).map((c) => ({
        name: c.name.length > 20 ? c.name.slice(0, 20) + "…" : c.name,
        enrollments: c.enrollments,
    }));

    return (
        <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={<Users size={18} />} label="Total Students" value={data.total_students} />
                <KpiCard icon={<BookOpen size={18} />} label="Total Enrollments" value={data.total_enrollments} />
                <KpiCard
                    icon={<Star size={18} />}
                    label="Avg Rating"
                    value={data.avg_rating != null ? data.avg_rating.toFixed(1) : "—"}
                    sub="across all courses"
                />
                <KpiCard
                    icon={<Gem size={18} />}
                    label="Gems Earned"
                    value={data.total_gems_earned.toLocaleString()}
                    sub={`≈ Rs. ${(data.total_gems_earned * 0.8).toLocaleString()}`}
                />
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Enrollment Trend">
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={data.enrollment_trend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="Enrollments" />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Gem Revenue Trend">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data.revenue_trend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="gems" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Gems" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Rating Distribution">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={ratingData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="star" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Reviews">
                                {ratingData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Top Courses by Enrollment">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                            layout="vertical"
                            data={topCoursesData}
                            margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                            <Tooltip />
                            <Bar dataKey="enrollments" radius={[0, 4, 4, 0]} name="Enrollments">
                                {topCoursesData.map((_, i) => (
                                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}

// ─── Per-course section ───────────────────────────────────────────

function CourseSection({ courseId, startDate, endDate }: {
    courseId: string;
    startDate: string;
    endDate: string;
}) {
    const [data, setData] = useState<CourseAnalytics | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!courseId) return;
        setLoading(true);
        getCourseAnalytics(courseId, startDate || undefined, endDate || undefined).then((res) => {
            if (res.success && res.data) setData(res.data);
            setLoading(false);
        });
    }, [courseId, startDate, endDate]);

    if (loading) return (
        <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-blue-500" size={28} />
        </div>
    );
    if (!data) return null;

    const ratingData = Object.entries(data.rating_breakdown).map(([star, count]) => ({
        star: `${star}★`, count, fill: RATING_COLORS[star] ?? "#60a5fa",
    }));

    const funnelData = data.lesson_funnel.map((l, i) => ({
        name: l.lesson_name.length > 18 ? l.lesson_name.slice(0, 18) + "…" : l.lesson_name,
        completions: l.completions,
        index: i,
    }));

    return (
        <div className="space-y-6 mt-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <KpiCard icon={<Users size={18} />} label="Enrolled" value={data.total_enrolled} />
                <KpiCard
                    icon={<TrendingUp size={18} />}
                    label="Completion Rate"
                    value={`${data.completion_rate}%`}
                    sub={`${data.completed_count} completed`}
                />
                <KpiCard
                    icon={<Star size={18} />}
                    label="Avg Rating"
                    value={data.avg_rating != null ? data.avg_rating.toFixed(1) : "—"}
                    sub={`${data.total_reviews} reviews`}
                />
                <KpiCard
                    icon={<Gem size={18} />}
                    label="Gems Earned"
                    value={data.gems_earned.toLocaleString()}
                    sub={`≈ Rs. ${(data.gems_earned * 0.8).toLocaleString()}`}
                />
                <KpiCard icon={<BookOpen size={18} />} label="Total Lessons" value={data.lesson_funnel.length} />
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Enrollment Trend">
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={data.enrollment_trend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="Enrollments" />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Rating Breakdown">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={ratingData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="star" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Reviews">
                                {ratingData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Lesson funnel */}
            {funnelData.length > 0 && (
                <ChartCard title="Lesson Completion Funnel">
                    <ResponsiveContainer width="100%" height={Math.max(200, funnelData.length * 28)}>
                        <BarChart
                            layout="vertical"
                            data={funnelData}
                            margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
                            <Tooltip />
                            <Bar dataKey="completions" radius={[0, 4, 4, 0]} name="Completions">
                                {funnelData.map((entry, i) => (
                                    <Cell
                                        key={i}
                                        fill={`hsl(${258 - (i / Math.max(funnelData.length - 1, 1)) * 60}, 70%, ${55 + (i / Math.max(funnelData.length - 1, 1)) * 20}%)`}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            )}

            {/* Progress distribution */}
            <ChartCard title="Student Progress Distribution">
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.progress_distribution} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                            {data.progress_distribution.map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Recent feedback */}
            {data.recent_feedback.length > 0 && (
                <div>
                    <SectionTitle>Recent Feedback</SectionTitle>
                    <div className="space-y-3">
                        {data.recent_feedback.map((f, i) => (
                            <div
                                key={i}
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{f.user_name}</span>
                                    <span className="text-yellow-500 text-sm">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span>
                                </div>
                                {f.comment && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{f.comment}</p>
                                )}
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {new Date(f.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────

export default function TutorAnalyticsPage() {
    const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
    const [overviewLoading, setOverviewLoading] = useState(true);
    const [courses, setCourses] = useState<CourseSummary[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchOverview = useCallback(async (start: string, end: string) => {
        setOverviewLoading(true);
        const res = await getAnalyticsOverview(start || undefined, end || undefined);
        if (res.success && res.data) setOverview(res.data);
        setOverviewLoading(false);
    }, []);

    useEffect(() => {
        const { startDate: s, endDate: e } = getPresetDates("6M");
        setStartDate(s);
        setEndDate(e);
        fetchOverview(s, e);
        getCourses().then((res) => {
            if (res.success && res.courses) {
                const published = res.courses.filter((c) => c.status === "published");
                setCourses(published);
                if (published.length > 0) setSelectedCourseId(published[0].id);
            }
        });
    }, [fetchOverview]);

    function handleDateApply(start: string, end: string) {
        setStartDate(start);
        setEndDate(end);
        fetchOverview(start, end);
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <main className="sidebar-layout p-6 lg:p-8">
                <h1 className="font-lilita text-4xl text-gray-800 dark:text-gray-100 mb-1">Analytics</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Track your courses' performance and student engagement.
                </p>

                <DateFilterBar onApply={handleDateApply} />

                {/* ── Overview ── */}
                <SectionTitle>Overview</SectionTitle>
                {overviewLoading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="animate-spin text-blue-500" size={28} />
                    </div>
                ) : overview ? (
                    <OverviewSection data={overview} />
                ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500">Failed to load analytics.</p>
                )}

                {/* ── Per-course ── */}
                {courses.length > 0 && (
                    <div className="mt-10">
                        <div className="flex items-center justify-between mb-4">
                            <SectionTitle>Course Analytics</SectionTitle>
                            <div className="relative">
                                <select
                                    value={selectedCourseId}
                                    onChange={(e) => setSelectedCourseId(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {courses.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        {selectedCourseId && (
                            <CourseSection
                                courseId={selectedCourseId}
                                startDate={startDate}
                                endDate={endDate}
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
