"use client";

import type { StudentChapterDetail } from "@/models/types";
import StudentLessonCircle from "./studentLessonCircle";
import { Check, Lock } from "lucide-react";
import ProgressBar from "./progressBar";

interface StudentChapterCardProps {
    chapter: StudentChapterDetail;
    courseId: string;
    onStartLesson: (lessonId: string) => void;
    isLast: boolean;
}

const statusStyles = {
    completed: {
        border: "border-green-500",
        label: "text-green-600 dark:text-green-400",
        labelText: "COMPLETED"
    },
    in_progress: {
        border: "border-blue-500",
        label: "text-blue-600 dark:text-blue-400",
        labelText: "IN PROGRESS"
    },
    locked: {
        border: "border-gray-300 dark:border-gray-600",
        label: "text-gray-500 dark:text-gray-500",
        labelText: "LOCKED"
    }
};

const StudentChapterCard = ({ chapter, courseId, onStartLesson, isLast }: StudentChapterCardProps) => {
    const style = statusStyles[chapter.status];
    const completedCount = chapter.lessons.filter(l => l.status === 'completed').length;
    const totalCount = chapter.lessons.length;
    const isLocked = chapter.status === 'locked';

    return (
        <div className="relative mb-12">
            <div className={`bg-white dark:bg-gray-800 rounded-2xl border-4 ${style.border} shadow-xl p-6 max-w-md mx-auto relative ${isLocked ? 'opacity-50 grayscale' : ''}`}>
                {/* Status badge */}
                {chapter.status === 'completed' && (
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white dark:border-gray-900">
                        <Check size={20} strokeWidth={3} />
                    </div>
                )}
                {isLocked && (
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white dark:border-gray-900">
                        <Lock size={18} />
                    </div>
                )}

                <div className="mb-4">
                    <div className={`${style.label} font-bold text-sm mb-1`}>
                        CHAPTER {chapter.chapter_index} &bull; {style.labelText}
                    </div>
                    <h4 className={`font-bold text-xl ${isLocked ? 'text-gray-500' : 'text-gray-800 dark:text-gray-100'}`}>
                        {chapter.name}
                    </h4>
                    {chapter.status === 'in_progress' && totalCount > 0 && (
                        <ProgressBar
                            percent={(completedCount / totalCount) * 100}
                            size="sm"
                            className="mt-3"
                        />
                    )}
                </div>

                {/* Lessons */}
                <div className="space-y-4 mt-6">
                    {chapter.lessons
                        .sort((a, b) => a.lesson_index - b.lesson_index)
                        .map((lesson, idx) => (
                            <div key={lesson.id}>
                                <StudentLessonCircle
                                    lesson={lesson}
                                    courseId={courseId}
                                    onStartLesson={onStartLesson}
                                />
                                {idx < chapter.lessons.length - 1 && (
                                    <div className={`w-1 h-6 ml-8 mt-4 ${
                                        lesson.status === 'completed' ? 'bg-green-300 dark:bg-green-700' : 'bg-gray-300 dark:bg-gray-600'
                                    }`} />
                                )}
                            </div>
                        ))}
                </div>

                {/* Chapter complete reward */}
                {chapter.status === 'completed' && (
                    <div className="mt-6 bg-gradient text-white rounded-lg p-4 flex items-center gap-3">
                        <Check size={24} />
                        <div>
                            <div className="font-bold">Chapter Complete!</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Connecting line to next chapter */}
            {!isLast && (
                <div className="absolute left-1/2 bottom-0 w-1 h-12 bg-gray-300 dark:bg-gray-600 -translate-x-1/2 translate-y-full" />
            )}
        </div>
    );
};

export default StudentChapterCard;
