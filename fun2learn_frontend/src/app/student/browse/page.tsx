"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { BrowseCourseSummary } from "@/models/types";
import { getBrowseCourses, enrollInCourse, getMyEnrolledCourses, getStreak } from "@/api/studentApi";
import Sidebar from "@/components/ui/sidebar";
import BrowseCourseCard from "@/components/student/browseCourseCard";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import { Search, Gem } from "lucide-react";
import { useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";

const BrowsePage = () => {
    const { user } = useUser();
    const router = useRouter();
    const [courses, setCourses] = useState<BrowseCourseSummary[]>([]);
    const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState<string | null>(null);
    const [pendingEnrollCourse, setPendingEnrollCourse] = useState<BrowseCourseSummary | null>(null);
    const [studentGems, setStudentGems] = useState<number>(0);

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
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="font-lilita text-4xl text-gray-800 dark:text-gray-100">
                            Browse Courses
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Discover and enroll in courses
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push('/student/mycourses')}
                        variant="secondary"
                        size="md"
                    >
                        My Courses
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading courses...</p>
                        </div>
                    </div>
                ) : courses.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="mb-6 flex justify-center">
                            <Search size={96} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                        </div>
                        <h3 className="font-bold text-2xl text-gray-800 dark:text-gray-100 mb-2">
                            No Courses Available
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Check back later for new courses
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map(course => (
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
                const effectivePrice = hasDiscount
                    ? Math.round(pendingEnrollCourse.price_gems! * (1 - pendingEnrollCourse.discount_percent! / 100))
                    : pendingEnrollCourse.price_gems!;
                const canAfford = studentGems >= effectivePrice;
                return (
                    <Modal
                        isOpen={true}
                        onClose={() => setPendingEnrollCourse(null)}
                        title="Confirm Enrollment"
                    >
                        <div className="space-y-4">
                            <p className="text-gray-700 dark:text-gray-200 font-semibold text-lg">
                                {pendingEnrollCourse.name}
                            </p>

                            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 space-y-2">
                                {hasDiscount && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Original price</span>
                                        <span className="line-through text-gray-400 flex items-center gap-1">
                                            <Gem size={12} fill="currentColor" />
                                            {pendingEnrollCourse.price_gems!.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                                {hasDiscount && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Discount</span>
                                        <span className="text-red-500 font-semibold">-{pendingEnrollCourse.discount_percent}%</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-base border-t border-yellow-200 dark:border-yellow-800 pt-2">
                                    <span className="text-gray-700 dark:text-gray-200">You pay</span>
                                    <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                        <Gem size={14} fill="currentColor" />
                                        {effectivePrice.toLocaleString()} gems
                                    </span>
                                </div>
                            </div>

                            <div className={`rounded-xl p-3 flex justify-between items-center text-sm ${canAfford ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                <span className="text-gray-600 dark:text-gray-400">Your balance</span>
                                <span className={`font-semibold flex items-center gap-1 ${canAfford ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
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
                                <Button
                                    variant="secondary"
                                    size="md"
                                    className="flex-1"
                                    onClick={() => setPendingEnrollCourse(null)}
                                >
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
        </div>
    );
};

export default BrowsePage;
