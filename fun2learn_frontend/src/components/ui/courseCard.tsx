"use client";

import { CourseSummary } from "@/models/types";
import { useRouter } from "next/navigation";
import Button from "./button";
import { GraduationCap, Trash2, Settings } from "lucide-react";

interface CourseCardProps {
    course: CourseSummary;
    onDelete?: (courseId: string) => void;
}

const statusColors = {
    published: 'bg-green-100 text-green-700',
    draft: 'bg-yellow-100 text-yellow-700'
};

const statusText = {
    published: 'Published',
    draft: 'Draft'
};

const CourseCard = ({ course, onDelete }: CourseCardProps) => {
    const router = useRouter();

    const handleEdit = () => {
        router.push(`/tutor/course/${course.id}`);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(course.id);
        }
    };

    return (
        <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group cursor-pointer"
            onClick={handleEdit}
        >
            {/* Course Icon/Header */}
            <div className="bg-gradient h-32 flex items-center justify-center text-white">
                <GraduationCap size={64} strokeWidth={1.5} />
            </div>

            {/* Course Content */}
            <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 line-clamp-1">
                        {course.name}
                    </h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[course.status]} whitespace-nowrap ml-2`}>
                        {statusText[course.status]}
                    </span>
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {course.description}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-2 mb-4 text-center">
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
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
                        <div className="font-bold text-orange-600 dark:text-orange-400">{course.question_count}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Questions</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <div className="flex-1">
                        <Button
                            onClick={handleEdit}
                            variant="primary"
                            size="md"
                            className="w-full text-sm"
                        >
                            Edit Course
                        </Button>
                    </div>
                    <Button
                        onClick={handleDelete}
                        variant="ghost"
                        size="md"
                        className="hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                    >
                        <Trash2 size={20} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Settings size={20} />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CourseCard;
