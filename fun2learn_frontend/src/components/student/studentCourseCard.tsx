"use client";

import type { EnrolledCourseSummary } from "@/models/types";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import ProgressBar from "./progressBar";
import { GraduationCap, Play } from "lucide-react";

interface StudentCourseCardProps {
    course: EnrolledCourseSummary;
}

const StudentCourseCard = ({ course }: StudentCourseCardProps) => {
    const router = useRouter();

    const handleContinue = () => {
        router.push(`/student/course/${course.id}`);
    };

    const isCompleted = course.completed_lessons === course.total_lessons && course.total_lessons > 0;

    return (
        <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden cursor-pointer"
            onClick={handleContinue}
        >
            {/* Header */}
            <div className="bg-gradient h-28 flex items-center justify-center text-white relative">
                <GraduationCap size={56} strokeWidth={1.5} />
                {isCompleted && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Completed
                    </div>
                )}
            </div>

            <div className="p-6">
                <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 line-clamp-1 mb-1">
                    {course.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    by {course.tutor_name}
                </p>

                {/* Progress */}
                <ProgressBar percent={course.progress_percent} className="mb-3" />

                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <span>{course.completed_lessons} / {course.total_lessons} lessons</span>
                    {course.current_lesson_name && !isCompleted && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 line-clamp-1 max-w-[50%] text-right">
                            Next: {course.current_lesson_name}
                        </span>
                    )}
                </div>

                <Button
                    variant="primary"
                    size="md"
                    onClick={handleContinue}
                    className="w-full text-sm flex items-center justify-center gap-2"
                >
                    <Play size={16} />
                    {isCompleted ? "Review Course" : "Continue"}
                </Button>
            </div>
        </div>
    );
};

export default StudentCourseCard;
