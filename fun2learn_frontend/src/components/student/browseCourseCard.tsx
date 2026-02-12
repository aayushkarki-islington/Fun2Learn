"use client";

import type { BrowseCourseSummary } from "@/models/types";
import Button from "@/components/ui/button";
import { GraduationCap, Users } from "lucide-react";

interface BrowseCourseCardProps {
    course: BrowseCourseSummary;
    onEnroll: (courseId: string) => void;
    isEnrolling?: boolean;
    isEnrolled?: boolean;
}

const BrowseCourseCard = ({ course, onEnroll, isEnrolling = false, isEnrolled = false }: BrowseCourseCardProps) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden">
            {/* Header */}
            <div className="bg-gradient h-32 flex items-center justify-center text-white">
                <GraduationCap size={64} strokeWidth={1.5} />
            </div>

            <div className="p-6">
                <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 line-clamp-1 mb-1">
                    {course.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    by {course.tutor_name}
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {course.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                        <div className="font-bold text-blue-600 dark:text-blue-400">{course.unit_count}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Units</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                        <div className="font-bold text-green-600 dark:text-green-400">{course.chapter_count}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Chapters</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2">
                        <div className="font-bold text-purple-600 dark:text-purple-400">{course.lesson_count}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Lessons</div>
                    </div>
                </div>

                {/* Tags */}
                {course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {course.tags.map(tag => (
                            <span key={tag.id} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                                {tag.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Enrollment count & action */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <Users size={14} />
                        <span>{course.enrollment_count} enrolled</span>
                    </div>
                    {isEnrolled ? (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                            Enrolled
                        </span>
                    ) : (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onEnroll(course.id)}
                            isLoading={isEnrolling}
                            loadingText="Enrolling..."
                        >
                            Enroll
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BrowseCourseCard;
