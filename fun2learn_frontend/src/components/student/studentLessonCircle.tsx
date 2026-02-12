"use client";

import { Check, Lock, BookOpen, PenTool, Calculator, Target, Rocket, Lightbulb, FlaskConical, Ruler, Zap, Palette } from "lucide-react";
import type { StudentLessonDetail } from "@/models/types";

interface StudentLessonCircleProps {
    lesson: StudentLessonDetail;
    courseId: string;
    onStartLesson: (lessonId: string) => void;
}

const LESSON_ICONS = [BookOpen, PenTool, Calculator, Target, Rocket, Lightbulb, FlaskConical, Ruler, Zap, Palette];

const StudentLessonCircle = ({ lesson, courseId, onStartLesson }: StudentLessonCircleProps) => {
    const Icon = LESSON_ICONS[(lesson.lesson_index - 1) % LESSON_ICONS.length];

    const isClickable = lesson.status === 'current' || lesson.status === 'completed';

    const handleClick = () => {
        if (isClickable) {
            onStartLesson(lesson.id);
        }
    };

    const circleStyles = {
        completed: {
            bg: "bg-green-100 dark:bg-green-900/30",
            border: "border-green-500",
            icon: "text-green-600 dark:text-green-400",
            wrapper: "bg-green-50 dark:bg-green-900/20"
        },
        current: {
            bg: "bg-blue-100 dark:bg-blue-900/30",
            border: "border-blue-500",
            icon: "text-blue-600 dark:text-blue-400",
            wrapper: "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-500"
        },
        locked: {
            bg: "bg-gray-100 dark:bg-gray-700",
            border: "border-gray-300 dark:border-gray-600",
            icon: "text-gray-400 dark:text-gray-500",
            wrapper: "opacity-50"
        }
    };

    const style = circleStyles[lesson.status];

    return (
        <div
            className={`flex items-center gap-4 rounded-xl p-3 ${style.wrapper} ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={handleClick}
        >
            <div className={`relative ${lesson.status === 'current' ? 'animate-bounce-subtle' : ''}`}>
                <div className={`w-16 h-16 rounded-full ${style.bg} border-4 ${style.border} flex items-center justify-center shadow-lg`}>
                    {lesson.status === 'completed' ? (
                        <Check size={24} className={style.icon} strokeWidth={3} />
                    ) : lesson.status === 'locked' ? (
                        <Lock size={20} className={style.icon} />
                    ) : (
                        <Icon size={24} className={style.icon} />
                    )}
                </div>
                {lesson.status === 'completed' && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">
                        <Check size={12} strokeWidth={3} />
                    </div>
                )}
                {lesson.status === 'current' && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded font-bold whitespace-nowrap">
                        Start
                    </div>
                )}
            </div>
            <div className="flex-1">
                <div className={`font-semibold ${lesson.status === 'locked' ? 'text-gray-500 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'}`}>
                    Lesson {lesson.lesson_index}: {lesson.name}
                </div>
                <div className="text-xs mt-1">
                    {lesson.status === 'completed' && (
                        <span className="text-green-600 dark:text-green-400 font-bold">Completed</span>
                    )}
                    {lesson.status === 'current' && (
                        <span className="text-blue-600 dark:text-blue-400 font-bold">Ready to start</span>
                    )}
                    {lesson.status === 'locked' && (
                        <span className="text-gray-400 dark:text-gray-500">Locked</span>
                    )}
                    {lesson.question_count > 0 && (
                        <span className="text-gray-400 dark:text-gray-500 ml-2">{lesson.question_count} questions</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentLessonCircle;
