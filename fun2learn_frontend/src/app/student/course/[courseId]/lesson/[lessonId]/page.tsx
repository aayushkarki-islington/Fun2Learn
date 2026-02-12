"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { StudentQuestion, LessonAttachment } from "@/models/types";
import { getStudentLesson, submitAnswer, completeLesson } from "@/api/studentApi";
import DashboardHeader from "@/components/ui/dashboardHeader";
import QuestionCard from "@/components/student/questionCard";
import Button from "@/components/ui/button";
import { ArrowLeft, Download, CheckCircle, ArrowRight, Trophy } from "lucide-react";
import { useUser } from "@/context/user-context";

const LessonPage = () => {
    const params = useParams();
    const router = useRouter();
    const { user } = useUser();
    const courseId = params.courseId as string;
    const lessonId = params.lessonId as string;

    const [lessonName, setLessonName] = useState("");
    const [questions, setQuestions] = useState<StudentQuestion[]>([]);
    const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [answeredCount, setAnsweredCount] = useState(0);
    const [isCompleting, setIsCompleting] = useState(false);
    const [lessonCompleted, setLessonCompleted] = useState(false);
    const [nextLessonId, setNextLessonId] = useState<string | null>(null);
    const [courseCompleted, setCourseCompleted] = useState(false);

    const getInitials = (name: string) => {
        return name.split(" ").map(part => part[0]).join("").toUpperCase().slice(0, 2);
    };

    useEffect(() => {
        loadLesson();
    }, [courseId, lessonId]);

    const loadLesson = async () => {
        setIsLoading(true);
        const result = await getStudentLesson(courseId, lessonId);

        if (result.success) {
            setLessonName(result.lessonName || "");
            setQuestions(result.questions || []);
            setAttachments(result.attachments || []);
        } else {
            toast.error(result.errorMessage || "Failed to load lesson");
        }

        setIsLoading(false);
    };

    const handleSubmitAnswer = async (questionId: string, answer: string) => {
        const result = await submitAnswer(questionId, answer);
        if (result.success) {
            setAnsweredCount(prev => prev + 1);
            return { isCorrect: result.isCorrect ?? false, correctAnswer: result.correctAnswer };
        }
        toast.error(result.errorMessage || "Failed to check answer");
        return null;
    };

    const handleCompleteLesson = async () => {
        setIsCompleting(true);
        const result = await completeLesson(lessonId, courseId);

        if (result.success) {
            setLessonCompleted(true);
            setNextLessonId(result.nextLessonId || null);
            setCourseCompleted(result.courseCompleted ?? false);
            toast.success(result.courseCompleted ? "Course completed!" : "Lesson completed!");
        } else {
            toast.error(result.errorMessage || "Failed to complete lesson");
        }

        setIsCompleting(false);
    };

    const allAnswered = answeredCount >= questions.length && questions.length > 0;

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
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading lesson...</p>
                    </div>
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

            {/* Lesson header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-3xl mx-auto px-6 py-4">
                    <button
                        onClick={() => router.push(`/student/course/${courseId}`)}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-semibold flex items-center gap-1 mb-2 cursor-pointer"
                    >
                        <ArrowLeft size={18} />
                        Back to Course
                    </button>
                    <h1 className="font-lilita text-3xl text-gray-800 dark:text-gray-100">{lessonName}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {questions.length} question{questions.length !== 1 ? 's' : ''} &bull; {answeredCount} answered
                    </p>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-6 py-8">
                {/* Attachments */}
                {attachments.length > 0 && (
                    <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3">Lesson Materials</h3>
                        <div className="space-y-2">
                            {attachments.map(att => (
                                <a
                                    key={att.id}
                                    href={att.s3_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <Download size={18} className="text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{att.file_name}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Questions */}
                <div className="space-y-6 mb-8">
                    {questions.map((question, idx) => (
                        <QuestionCard
                            key={question.id}
                            question={question}
                            index={idx}
                            onSubmitAnswer={handleSubmitAnswer}
                        />
                    ))}
                </div>

                {/* Complete / Navigation */}
                {!lessonCompleted ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 text-center">
                        {!allAnswered ? (
                            <p className="text-gray-500 dark:text-gray-400">
                                Answer all questions to complete this lesson
                            </p>
                        ) : (
                            <div>
                                <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
                                <p className="text-gray-800 dark:text-gray-100 font-bold text-lg mb-4">
                                    All questions answered!
                                </p>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={handleCompleteLesson}
                                    isLoading={isCompleting}
                                    loadingText="Completing..."
                                    className="font-bold"
                                >
                                    Complete Lesson
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 text-center">
                        {courseCompleted ? (
                            <div>
                                <Trophy size={64} className="mx-auto mb-4 text-yellow-500" />
                                <h3 className="font-lilita text-3xl text-gray-800 dark:text-gray-100 mb-2">
                                    Course Completed!
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    Congratulations! You have completed this entire course.
                                </p>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={() => router.push('/student/mycourses')}
                                >
                                    Back to My Courses
                                </Button>
                            </div>
                        ) : (
                            <div>
                                <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
                                <h3 className="font-lilita text-3xl text-gray-800 dark:text-gray-100 mb-2">
                                    Lesson Complete!
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    Great job! Ready for the next lesson?
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <Button
                                        variant="secondary"
                                        size="md"
                                        onClick={() => router.push(`/student/course/${courseId}`)}
                                    >
                                        Back to Roadmap
                                    </Button>
                                    {nextLessonId && (
                                        <Button
                                            variant="primary"
                                            size="md"
                                            onClick={() => router.push(`/student/course/${courseId}/lesson/${nextLessonId}`)}
                                            className="flex items-center gap-2"
                                        >
                                            Next Lesson <ArrowRight size={16} />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default LessonPage;
