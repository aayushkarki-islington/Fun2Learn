"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import type { BrowseCourseSummary, Tag } from "@/models/types";
import { getBrowseCourses, enrollInCourse, getMyEnrolledCourses, getStreak } from "@/api/studentApi";
import Sidebar from "@/components/ui/sidebar";
import BrowseCourseCard from "@/components/student/browseCourseCard";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import { Search, Gem, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";

type PriceFilter = "all" | "free" | "paid";
type SortOption = "default" | "enrolled_desc" | "price_asc" | "price_desc";

const SORT_LABELS: Record<SortOption, string> = {
    default: "Default",
    enrolled_desc: "Most Enrolled",
    price_asc: "Price: Low to High",
    price_desc: "Price: High to Low",
};

const BrowsePage = () => {
    const { user } = useUser();
    const router = useRouter();
    const [courses, setCourses] = useState<BrowseCourseSummary[]>([]);
    const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState<string | null>(null);
    const [pendingEnrollCourse, setPendingEnrollCourse] = useState<BrowseCourseSummary | null>(null);
    const [studentGems, setStudentGems] = useState<number>(0);

    // Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
    const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
    const [discountOnly, setDiscountOnly] = useState(false);
    const [priceMin, setPriceMin] = useState("");
    const [priceMax, setPriceMax] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("default");
    const [showFilters, setShowFilters] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [browseResult, enrolledResult] = await Promise.all([
            getBrowseCourses(),
            getMyEnrolledCourses()
        ]);
        if (browseResult.success && browseResult.courses) {
            setCourses(browseResult.courses);
        } else {
            toast.error(browseResult.errorMessage || "Failed to load courses");
        }
        if (enrolledResult.success && enrolledResult.courses) {
            setEnrolledIds(new Set(enrolledResult.courses.map(c => c.id)));
        }
        setIsLoading(false);
    };

    // Collect all unique tags across courses
    const allTags = useMemo(() => {
        const map = new Map<string, Tag>();
        courses.forEach(c => c.tags.forEach(t => map.set(t.id, t)));
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [courses]);

    const effectivePrice = (c: BrowseCourseSummary) => {
        if (!c.price_gems) return 0;
        if (c.discount_percent && c.discount_percent > 0) {
            return Math.round(c.price_gems * (1 - c.discount_percent / 100));
        }
        return c.price_gems;
    };

    const filteredCourses = useMemo(() => {
        let result = [...courses];
        const q = searchQuery.trim().toLowerCase();

        if (q) {
            result = result.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q) ||
                c.tutor_name.toLowerCase().includes(q)
            );
        }

        if (priceFilter === "free") {
            result = result.filter(c => !c.price_gems || c.price_gems === 0);
        } else if (priceFilter === "paid") {
            result = result.filter(c => c.price_gems && c.price_gems > 0);
        }

        if (selectedTagIds.size > 0) {
            result = result.filter(c => c.tags.some(t => selectedTagIds.has(t.id)));
        }

        if (discountOnly) {
            result = result.filter(c => c.discount_percent && c.discount_percent > 0);
        }

        const minVal = parseInt(priceMin) || null;
        const maxVal = parseInt(priceMax) || null;
        if (minVal !== null || maxVal !== null) {
            result = result.filter(c => {
                const ep = effectivePrice(c);
                if (minVal !== null && ep < minVal) return false;
                if (maxVal !== null && ep > maxVal) return false;
                return true;
            });
        }

        if (sortBy === "enrolled_desc") {
            result.sort((a, b) => b.enrollment_count - a.enrollment_count);
        } else if (sortBy === "price_asc") {
            result.sort((a, b) => effectivePrice(a) - effectivePrice(b));
        } else if (sortBy === "price_desc") {
            result.sort((a, b) => effectivePrice(b) - effectivePrice(a));
        }

        return result;
    }, [courses, searchQuery, priceFilter, selectedTagIds, discountOnly, priceMin, priceMax, sortBy]);

    const toggleTag = (id: string) => {
        setSelectedTagIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const clearFilters = () => {
        setSearchQuery("");
        setPriceFilter("all");
        setSelectedTagIds(new Set());
        setDiscountOnly(false);
        setPriceMin("");
        setPriceMax("");
        setSortBy("default");
    };

    const hasActiveFilters = searchQuery || priceFilter !== "all" || selectedTagIds.size > 0 ||
        discountOnly || priceMin || priceMax || sortBy !== "default";

    const handleEnroll = async (courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        if (!course) return;
        if (course.price_gems && course.price_gems > 0) {
            const streakResult = await getStreak();
            if (streakResult.success) setStudentGems(streakResult.gems ?? 0);
            setPendingEnrollCourse(course);
            return;
        }
        await doEnroll(courseId);
    };

    const doEnroll = async (courseId: string) => {
        setEnrollingId(courseId);
        const result = await enrollInCourse(courseId);
        if (result.success) {
            toast.success("Enrolled successfully!");
            setEnrolledIds(prev => new Set(prev).add(courseId));
            router.push(`/student/course/${courseId}`);
        } else {
            toast.error(result.errorMessage || "Failed to enroll");
        }
        setEnrollingId(null);
    };

    const handleConfirmEnroll = async () => {
        if (!pendingEnrollCourse) return;
        const courseId = pendingEnrollCourse.id;
        setPendingEnrollCourse(null);
        await doEnroll(courseId);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />

            <main className="sidebar-layout max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="font-lilita text-4xl text-gray-800 dark:text-gray-100">Browse Courses</h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Discover and enroll in courses</p>
                    </div>
                    <Button onClick={() => router.push('/student/mycourses')} variant="secondary" size="md">
                        My Courses
                    </Button>
                </div>

                {/* Search + Filter Bar */}
                <div className="mb-6 space-y-3">
                    <div className="flex gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by name, description, or tutor..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-400 dark:focus:border-blue-500"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Filter toggle */}
                        <Button
                            variant={showFilters ? "primary" : "secondary"}
                            size="md"
                            onClick={() => setShowFilters(v => !v)}
                            className="flex items-center gap-2 whitespace-nowrap"
                        >
                            <SlidersHorizontal size={16} />
                            Filters
                            {hasActiveFilters && (
                                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                            )}
                        </Button>

                        {/* Sort dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setSortOpen(v => !v)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 hover:border-blue-400 transition-colors whitespace-nowrap"
                            >
                                {SORT_LABELS[sortBy]}
                                <ChevronDown size={15} />
                            </button>
                            {sortOpen && (
                                <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden min-w-[180px]">
                                    {(Object.keys(SORT_LABELS) as SortOption[]).map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => { setSortBy(opt); setSortOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${sortBy === opt ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"}`}
                                        >
                                            {SORT_LABELS[opt]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Expanded filter panel */}
                    {showFilters && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-5">
                            {/* Price type */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Price</p>
                                <div className="flex gap-2">
                                    {(["all", "free", "paid"] as PriceFilter[]).map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setPriceFilter(opt)}
                                            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors capitalize ${priceFilter === opt
                                                ? "bg-blue-600 border-blue-600 text-white"
                                                : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400"}`}
                                        >
                                            {opt === "all" ? "All" : opt === "free" ? "Free" : "Paid"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price range (only when paid or all) */}
                            {priceFilter !== "free" && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Price Range <span className="normal-case font-normal">(gems)</span>
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <Gem size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500" fill="currentColor" />
                                            <input
                                                type="number"
                                                min="0"
                                                value={priceMin}
                                                onChange={e => setPriceMin(e.target.value)}
                                                placeholder="Min"
                                                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
                                            />
                                        </div>
                                        <span className="text-gray-400">—</span>
                                        <div className="relative flex-1">
                                            <Gem size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500" fill="currentColor" />
                                            <input
                                                type="number"
                                                min="0"
                                                value={priceMax}
                                                onChange={e => setPriceMax(e.target.value)}
                                                placeholder="Max"
                                                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Discount only */}
                            {priceFilter !== "free" && (
                                <div>
                                    <label className="flex items-center gap-3 cursor-pointer w-fit">
                                        <div
                                            onClick={() => setDiscountOnly(v => !v)}
                                            className={`w-10 h-5 rounded-full transition-colors relative ${discountOnly ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
                                        >
                                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${discountOnly ? "translate-x-5" : "translate-x-0.5"}`} />
                                        </div>
                                        <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">Discounted courses only</span>
                                    </label>
                                </div>
                            )}

                            {/* Tags */}
                            {allTags.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Tags</p>
                                    <div className="flex flex-wrap gap-2">
                                        {allTags.map(tag => (
                                            <button
                                                key={tag.id}
                                                onClick={() => toggleTag(tag.id)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${selectedTagIds.has(tag.id)
                                                    ? "bg-purple-600 border-purple-600 text-white"
                                                    : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-purple-400"}`}
                                            >
                                                {tag.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Clear filters */}
                            {hasActiveFilters && (
                                <div className="pt-1">
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                                    >
                                        <X size={14} /> Clear all filters
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Result count */}
                    {!isLoading && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {filteredCourses.length} {filteredCourses.length === 1 ? "course" : "courses"} found
                            {hasActiveFilters && <span> · <button onClick={clearFilters} className="text-blue-500 hover:underline">Clear filters</button></span>}
                        </p>
                    )}
                </div>

                {/* Course grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading courses...</p>
                        </div>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="mb-6 flex justify-center">
                            <Search size={96} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                        </div>
                        <h3 className="font-bold text-2xl text-gray-800 dark:text-gray-100 mb-2">
                            {courses.length === 0 ? "No Courses Available" : "No Courses Match"}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {courses.length === 0 ? "Check back later for new courses" : "Try adjusting your search or filters"}
                        </p>
                        {hasActiveFilters && (
                            <Button variant="secondary" size="md" className="mt-4" onClick={clearFilters}>
                                Clear Filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map(course => (
                            <BrowseCourseCard
                                key={course.id}
                                course={course}
                                onEnroll={handleEnroll}
                                isEnrolling={enrollingId === course.id}
                                isEnrolled={enrolledIds.has(course.id)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Enrollment confirmation modal for paid courses */}
            {pendingEnrollCourse && (() => {
                const hasDiscount = pendingEnrollCourse.discount_percent && pendingEnrollCourse.discount_percent > 0;
                const ep = hasDiscount
                    ? Math.round(pendingEnrollCourse.price_gems! * (1 - pendingEnrollCourse.discount_percent! / 100))
                    : pendingEnrollCourse.price_gems!;
                const canAfford = studentGems >= ep;
                return (
                    <Modal isOpen={true} onClose={() => setPendingEnrollCourse(null)} title="Confirm Enrollment">
                        <div className="space-y-4">
                            <p className="text-gray-700 dark:text-gray-200 font-semibold text-lg">
                                {pendingEnrollCourse.name}
                            </p>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 space-y-2">
                                {hasDiscount && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Original price</span>
                                            <span className="line-through text-gray-400 flex items-center gap-1">
                                                <Gem size={12} fill="currentColor" />
                                                {pendingEnrollCourse.price_gems!.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Discount</span>
                                            <span className="text-red-500 font-semibold">-{pendingEnrollCourse.discount_percent}%</span>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between font-bold text-base border-t border-yellow-200 dark:border-yellow-800 pt-2">
                                    <span className="text-gray-700 dark:text-gray-200">You pay</span>
                                    <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                        <Gem size={14} fill="currentColor" />
                                        {ep.toLocaleString()} gems
                                    </span>
                                </div>
                            </div>
                            <div className={`rounded-xl p-3 flex justify-between items-center text-sm ${canAfford ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                                <span className="text-gray-600 dark:text-gray-400">Your balance</span>
                                <span className={`font-semibold flex items-center gap-1 ${canAfford ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                                    <Gem size={13} fill="currentColor" />
                                    {studentGems.toLocaleString()} gems
                                </span>
                            </div>
                            {!canAfford && (
                                <p className="text-sm text-red-500 text-center">
                                    You don't have enough gems to enroll in this course.
                                </p>
                            )}
                            <div className="flex gap-3 pt-2">
                                <Button variant="secondary" size="md" className="flex-1" onClick={() => setPendingEnrollCourse(null)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    size="md"
                                    className="flex-1"
                                    onClick={handleConfirmEnroll}
                                    disabled={!canAfford}
                                    isLoading={enrollingId === pendingEnrollCourse.id}
                                    loadingText="Enrolling..."
                                >
                                    Confirm Enrollment
                                </Button>
                            </div>
                        </div>
                    </Modal>
                );
            })()}

            {/* Close sort dropdown on outside click */}
            {sortOpen && <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />}
        </div>
    );
};

export default BrowsePage;
