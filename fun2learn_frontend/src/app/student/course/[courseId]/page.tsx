"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { StudentCourseDetail } from "@/models/types";
import { getStudentCourseDetail } from "@/api/studentApi";
import DashboardHeader from "@/components/ui/dashboardHeader";
import StudentUnitHeader from "@/components/student/studentUnitHeader";
import StudentChapterCard from "@/components/student/studentChapterCard";
import ProgressBar from "@/components/student/progressBar";
import Button from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useUser } from "@/context/user-context";

const StudentCoursePage = () => {
    const params = useParams();
    const router = useRouter();
    const { user } = useUser();
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<StudentCourseDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const getInitials = (name: string) => {
        return name.split(" ").map(part => part[0]).join("").toUpperCase().slice(0, 2);
    };

    useEffect(() => {
        loadCourse();
    }, [courseId]);

    const loadCourse = async () => {
        setIsLoading(true);
        const result = await getStudentCourseDetail(courseId);

        if (result.success && result.course) {
            setCourse(result.course);
        } else {
            toast.error(result.errorMessage || "Failed to load course");
        }

        setIsLoading(false);
    };

    const handleStartLesson = (lessonId: string) => {
        router.push(`/student/course/${courseId}/lesson/${lessonId}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <DashboardHeader
                    userName={user?.full_name ?? "Learner"}
                    userInitials={user ? getInitials(user.full_name) : "L"}
                    imageUrl={user?.image_path}
                />
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading course...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <DashboardHeader
                    userName={user?.full_name ?? "Learner"}
                    userInitials={user ? getInitials(user.full_name) : "L"}
                    imageUrl={user?.image_path}
                />
                <div className="text-center py-20">
                    <p className="text-gray-600 dark:text-gray-400">Course not found</p>
                    <Button onClick={() => router.push('/student/mycourses')} variant="primary" className="mt-4">
                        Back to My Courses
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <DashboardHeader
                userName={user?.full_name ?? "Learner"}
                userInitials={user ? getInitials(user.full_name) : "L"}
                imageUrl={user?.image_path}
            />

            {/* Course header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/student/mycourses')}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                            <ArrowLeft size={18} />
                            My Courses
                        </button>
                        <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
                        <div className="flex-1">
                            <h1 className="font-lilita text-2xl text-gray-800 dark:text-gray-100">{course.name}</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-gray-500 dark:text-gray-400">by {course.tutor_name}</span>
                                <ProgressBar percent={course.progress_percent} size="sm" className="flex-1 max-w-xs" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Roadmap */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                {course.units
                    .sort((a, b) => a.unit_index - b.unit_index)
                    .map(unit => (
                        <div key={unit.id} className="mb-16">
                            <StudentUnitHeader unit={unit} />

                            <div className="relative">
                                {unit.chapters
                                    .sort((a, b) => a.chapter_index - b.chapter_index)
                                    .map((chapter, idx) => (
                                        <StudentChapterCard
                                            key={chapter.id}
                                            chapter={chapter}
                                            courseId={courseId}
                                            onStartLesson={handleStartLesson}
                                            isLast={idx === unit.chapters.length - 1}
                                        />
                                    ))}
                            </div>
                        </div>
                    ))}
            </main>
        </div>
    );
};

export default StudentCoursePage;
