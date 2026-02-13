"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { BrowseCourseSummary } from "@/models/types";
import { getBrowseCourses, enrollInCourse, getMyEnrolledCourses } from "@/api/studentApi";
import Sidebar from "@/components/ui/sidebar";
import BrowseCourseCard from "@/components/student/browseCourseCard";
import Button from "@/components/ui/button";
import { Search, BookOpen } from "lucide-react";
import { useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";

const BrowsePage = () => {
    const { user } = useUser();
    const router = useRouter();
    const [courses, setCourses] = useState<BrowseCourseSummary[]>([]);
    const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState<string | null>(null);

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
        </div>
    );
};

export default BrowsePage;
