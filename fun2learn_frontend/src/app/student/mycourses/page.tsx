"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { EnrolledCourseSummary } from "@/models/types";
import { getMyEnrolledCourses } from "@/api/studentApi";
import Sidebar from "@/components/ui/sidebar";
import StatCard from "@/components/ui/statCard";
import StudentCourseCard from "@/components/student/studentCourseCard";
import Button from "@/components/ui/button";
import { BookOpen, Search } from "lucide-react";
import { useUser } from "@/context/user-context";

const MyCoursesPage = () => {
    const router = useRouter();
    const { user } = useUser();
    const [courses, setCourses] = useState<EnrolledCourseSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        setIsLoading(true);
        const result = await getMyEnrolledCourses();

        if (result.success && result.courses) {
            setCourses(result.courses);
        } else {
            toast.error(result.errorMessage || "Failed to load courses");
        }

        setIsLoading(false);
    };

    const totalEnrolled = courses.length;
    const inProgress = courses.filter(c => c.progress_percent > 0 && c.progress_percent < 100).length;
    const completed = courses.filter(c => c.completed_lessons === c.total_lessons && c.total_lessons > 0).length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />

            <main className="sidebar-layout max-w-7xl mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="font-lilita text-4xl text-gray-800 dark:text-gray-100">
                            My Courses
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Continue learning where you left off
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push('/student/browse')}
                        variant="primary"
                        size="lg"
                        className="font-bold"
                    >
                        <div className="flex items-center">
                            <Search size={20} className="mr-2" />
                            Browse Courses
                        </div>
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard value={totalEnrolled} label="Enrolled" color="blue" />
                    <StatCard value={inProgress} label="In Progress" color="yellow" />
                    <StatCard value={completed} label="Completed" color="green" />
                </div>

                {/* Courses Grid */}
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
                            <BookOpen size={96} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                        </div>
                        <h3 className="font-bold text-2xl text-gray-800 dark:text-gray-100 mb-2">
                            No Courses Yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Browse available courses and start learning
                        </p>
                        <div className="max-w-xs mx-auto">
                            <Button
                                onClick={() => router.push('/student/browse')}
                                className="text-lg w-full"
                            >
                                Browse Courses
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map(course => (
                            <StudentCourseCard key={course.id} course={course} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyCoursesPage;
