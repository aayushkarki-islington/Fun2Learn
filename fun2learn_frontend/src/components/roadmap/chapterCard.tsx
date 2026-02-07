"use client";

import { Pencil, Trash2, BookOpen } from "lucide-react";
import Button from "@/components/ui/button";
import type { ChapterDetail } from "@/models/types";
import LessonCircle from "./lessonCircle";

const CHAPTER_COLORS = [
    { border: "border-blue-500", text: "text-blue-600", bg: "bg-blue-100", hover: "hover:bg-blue-200", addHoverBorder: "hover:border-blue-500", addHoverText: "hover:text-blue-500", addHoverBg: "hover:bg-blue-50" },
    { border: "border-purple-500", text: "text-purple-600", bg: "bg-purple-100", hover: "hover:bg-purple-200", addHoverBorder: "hover:border-purple-500", addHoverText: "hover:text-purple-500", addHoverBg: "hover:bg-purple-50" },
    { border: "border-orange-500", text: "text-orange-600", bg: "bg-orange-100", hover: "hover:bg-orange-200", addHoverBorder: "hover:border-orange-500", addHoverText: "hover:text-orange-500", addHoverBg: "hover:bg-orange-50" },
    { border: "border-green-500", text: "text-green-600", bg: "bg-green-100", hover: "hover:bg-green-200", addHoverBorder: "hover:border-green-500", addHoverText: "hover:text-green-500", addHoverBg: "hover:bg-green-50" },
];

interface ChapterCardProps {
    chapter: ChapterDetail;
    chapterIndex: number;
    onEditChapter: () => void;
    onDeleteChapter: () => void;
    onAddLesson: () => void;
    onEditLesson: (lessonId: string, lessonName: string) => void;
    onDeleteLesson: (lessonId: string) => void;
    onOpenQuestions: (lessonId: string, lessonName: string) => void;
    isLast: boolean;
}

const ChapterCard = ({
    chapter,
    chapterIndex,
    onEditChapter,
    onDeleteChapter,
    onAddLesson,
    onEditLesson,
    onDeleteLesson,
    onOpenQuestions,
    isLast
}: ChapterCardProps) => {
    const color = CHAPTER_COLORS[chapterIndex % CHAPTER_COLORS.length];

    return (
        <div className="relative mb-12">
            <div className={`chapter-card bg-white dark:bg-gray-800 rounded-2xl border-4 ${color.border} shadow-xl p-6 max-w-md mx-auto`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className={`${color.text} font-bold text-sm mb-1`}>CHAPTER {chapter.chapter_index}</div>
                        <h4 className="font-bold text-xl text-gray-800 dark:text-gray-100">{chapter.name}</h4>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onEditChapter}
                            className={`w-8 h-8 p-0 shadow-none ${color.bg} ${color.hover}`}
                        >
                            <Pencil size={14} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDeleteChapter}
                            className="w-8 h-8 p-0 shadow-none bg-red-100 hover:bg-red-200"
                        >
                            <Trash2 size={14} />
                        </Button>
                    </div>
                </div>

                {/* Lessons */}
                <div className="space-y-4 mt-6">
                    {chapter.lessons
                        .sort((a, b) => a.lesson_index - b.lesson_index)
                        .map((lesson, idx) => (
                        <div key={lesson.id}>
                            <LessonCircle
                                lesson={lesson}
                                onEdit={() => onEditLesson(lesson.id, lesson.name)}
                                onDelete={() => onDeleteLesson(lesson.id)}
                                onQuestions={() => onOpenQuestions(lesson.id, lesson.name)}
                            />
                            {idx < chapter.lessons.length - 1 && (
                                <div className="w-1 h-6 bg-gray-300 dark:bg-gray-600 ml-8 mt-4" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Add Lesson Button */}
                <Button
                    variant="ghost"
                    onClick={onAddLesson}
                    className={`w-full mt-6 py-3 shadow-none border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 ${color.addHoverBorder} ${color.addHoverText} ${color.addHoverBg}`}
                >
                    + Add Lesson
                </Button>
            </div>

            {/* Connecting line to next chapter */}
            {!isLast && (
                <div className="absolute left-1/2 bottom-0 w-1 h-12 bg-gray-300 dark:bg-gray-600 -translate-x-1/2 translate-y-full" />
            )}
        </div>
    );
};

export default ChapterCard;
