"use client";

import { Pencil, Trash2, HelpCircle, BookOpen, PenTool, Calculator, Target, Rocket, Lightbulb, FlaskConical, Ruler, Zap, Palette } from "lucide-react";
import Button from "@/components/ui/button";
import type { LessonDetail } from "@/models/types";

interface LessonCircleProps {
    lesson: LessonDetail;
    onEdit: () => void;
    onDelete: () => void;
    onQuestions: () => void;
}

const LESSON_ICONS = [BookOpen, PenTool, Calculator, Target, Rocket, Lightbulb, FlaskConical, Ruler, Zap, Palette];

const LessonCircle = ({ lesson, onEdit, onDelete, onQuestions }: LessonCircleProps) => {
    const hasQuestions = lesson.question_count > 0;
    const Icon = LESSON_ICONS[(lesson.lesson_index - 1) % LESSON_ICONS.length];

    const borderColor = hasQuestions ? "border-green-500" : "border-gray-400 dark:border-gray-500";
    const bgColor = hasQuestions ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-700";
    const iconColor = hasQuestions ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400";
    const badgeColor = hasQuestions ? "bg-purple-600" : "bg-gray-400";

    return (
        <div className="flex items-center gap-4">
            <div className="lesson-circle relative group cursor-pointer">
                <div
                    className={`w-16 h-16 rounded-full ${bgColor} border-4 ${borderColor} flex items-center justify-center shadow-lg`}
                    onClick={onQuestions}
                >
                    <Icon size={24} className={iconColor} />
                </div>
                <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full ${badgeColor} text-white text-xs flex items-center justify-center font-bold`}>
                    {lesson.question_count}
                </div>

                {/* Hover action menu */}
                <div className="hidden group-hover:flex absolute left-20 top-0 bg-white dark:bg-gray-700 rounded-lg shadow-xl p-2 gap-2 z-20 border-2 border-gray-200 dark:border-gray-600 whitespace-nowrap">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onEdit}
                        className="px-3 py-1 shadow-none bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center gap-1"
                    >
                        <Pencil size={12} /> Edit
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onQuestions}
                        className="px-3 py-1 shadow-none bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center gap-1"
                    >
                        <HelpCircle size={12} /> Questions
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={onDelete}
                        className="px-3 py-1 shadow-none text-xs border-none flex items-center gap-1"
                    >
                        <Trash2 size={12} /> Delete
                    </Button>
                </div>
            </div>
            <div className="flex-1">
                <div className="font-semibold text-gray-800 dark:text-gray-100">
                    Lesson {lesson.lesson_index}: {lesson.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {hasQuestions ? `${lesson.question_count} questions` : "No questions yet"}
                </div>
            </div>
        </div>
    );
};

export default LessonCircle;
