"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Loader2, Plus, BookOpen, Send } from "lucide-react";
import { toast } from "sonner";
import DashboardHeader from "@/components/ui/dashboardHeader";
import Button from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirmDialog";
import UnitHeader from "@/components/roadmap/unitHeader";
import ChapterCard from "@/components/roadmap/chapterCard";
import UnitForm from "@/components/roadmap/unitForm";
import ChapterForm from "@/components/roadmap/chapterForm";
import LessonForm from "@/components/roadmap/lessonForm";
import QuestionList from "@/components/roadmap/questionList";
import type { CourseDetail, QuestionDetail } from "@/models/types";
import {
    getCourseDetail,
    addUnit, editUnit, deleteUnit,
    addChapter, editChapter, deleteChapter,
    addLesson, editLesson, deleteLesson,
    getLessonQuestions,
} from "@/api/courseApi";

const CourseEditorPage = () => {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Unit form state
    const [showUnitForm, setShowUnitForm] = useState(false);
    const [editingUnit, setEditingUnit] = useState<{ id: string; name: string; description: string } | null>(null);

    // Chapter form state
    const [showChapterForm, setShowChapterForm] = useState(false);
    const [chapterTargetUnitId, setChapterTargetUnitId] = useState<string>("");
    const [editingChapter, setEditingChapter] = useState<{ id: string; name: string } | null>(null);

    // Lesson form state
    const [showLessonForm, setShowLessonForm] = useState(false);
    const [lessonTargetChapterId, setLessonTargetChapterId] = useState<string>("");
    const [editingLesson, setEditingLesson] = useState<{ id: string; name: string } | null>(null);

    // Question list state
    const [showQuestionList, setShowQuestionList] = useState(false);
    const [questionLessonId, setQuestionLessonId] = useState<string>("");
    const [questionLessonName, setQuestionLessonName] = useState<string>("");
    const [lessonQuestions, setLessonQuestions] = useState<QuestionDetail[]>([]);

    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState<{
        type: "unit" | "chapter" | "lesson";
        id: string;
        name: string;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCourse = useCallback(async () => {
        const result = await getCourseDetail(courseId);
        if (result.success && result.course) {
            setCourse(result.course);
        } else {
            toast.error(result.errorMessage || "Failed to load course");
            router.push("/tutor/dashboard");
        }
        setIsLoading(false);
    }, [courseId, router]);

    useEffect(() => {
        fetchCourse();
    }, [fetchCourse]);

    // Fetch questions for a specific lesson
    const fetchLessonQuestions = async (lessonId: string) => {
        const result = await getLessonQuestions(lessonId);
        if (result.success && result.questions) {
            setLessonQuestions(result.questions);
        } else {
            setLessonQuestions([]);
        }
    };

    // ─── Publish ─────────────────────────────────────────────

    const handlePublish = () => {
        router.push(`/tutor/course/${courseId}/prepublish`);
    };

    // ─── Unit Handlers ───────────────────────────────────────

    const handleAddUnit = async (name: string, description: string) => {
        const result = await addUnit(courseId, name, description);
        if (result.success) {
            toast.success("Unit added successfully");
            fetchCourse();
        } else {
            toast.error(result.errorMessage || "Failed to add unit");
            throw new Error(result.errorMessage);
        }
    };

    const handleEditUnit = async (name: string, description: string) => {
        if (!editingUnit) return;
        const result = await editUnit(editingUnit.id, name, description);
        if (result.success) {
            toast.success("Unit updated successfully");
            setEditingUnit(null);
            fetchCourse();
        } else {
            toast.error(result.errorMessage || "Failed to edit unit");
            throw new Error(result.errorMessage);
        }
    };

    const handleDeleteUnit = async () => {
        if (!deleteConfirm || deleteConfirm.type !== "unit") return;
        setIsDeleting(true);
        const result = await deleteUnit(deleteConfirm.id);
        if (result.success) {
            toast.success("Unit deleted successfully");
            fetchCourse();
        } else {
            toast.error(result.errorMessage || "Failed to delete unit");
        }
        setIsDeleting(false);
        setDeleteConfirm(null);
    };

    // ─── Chapter Handlers ────────────────────────────────────

    const handleAddChapter = async (name: string) => {
        const result = await addChapter(chapterTargetUnitId, name);
        if (result.success) {
            toast.success("Chapter added successfully");
            fetchCourse();
        } else {
            toast.error(result.errorMessage || "Failed to add chapter");
            throw new Error(result.errorMessage);
        }
    };

    const handleEditChapter = async (name: string) => {
        if (!editingChapter) return;
        const result = await editChapter(editingChapter.id, name);
        if (result.success) {
            toast.success("Chapter updated successfully");
            setEditingChapter(null);
            fetchCourse();
        } else {
            toast.error(result.errorMessage || "Failed to edit chapter");
            throw new Error(result.errorMessage);
        }
    };

    const handleDeleteChapter = async () => {
        if (!deleteConfirm || deleteConfirm.type !== "chapter") return;
        setIsDeleting(true);
        const result = await deleteChapter(deleteConfirm.id);
        if (result.success) {
            toast.success("Chapter deleted successfully");
            fetchCourse();
        } else {
            toast.error(result.errorMessage || "Failed to delete chapter");
        }
        setIsDeleting(false);
        setDeleteConfirm(null);
    };

    // ─── Lesson Handlers ─────────────────────────────────────

    const handleAddLesson = async (name: string) => {
        const result = await addLesson(lessonTargetChapterId, name);
        if (result.success) {
            toast.success("Lesson added successfully");
            fetchCourse();
        } else {
            toast.error(result.errorMessage || "Failed to add lesson");
            throw new Error(result.errorMessage);
        }
    };

    const handleEditLesson = async (name: string) => {
        if (!editingLesson) return;
        const result = await editLesson(editingLesson.id, name);
        if (result.success) {
            toast.success("Lesson updated successfully");
            setEditingLesson(null);
            fetchCourse();
        } else {
            toast.error(result.errorMessage || "Failed to edit lesson");
            throw new Error(result.errorMessage);
        }
    };

    const handleDeleteLesson = async () => {
        if (!deleteConfirm || deleteConfirm.type !== "lesson") return;
        setIsDeleting(true);
        const result = await deleteLesson(deleteConfirm.id);
        if (result.success) {
            toast.success("Lesson deleted successfully");
            fetchCourse();
        } else {
            toast.error(result.errorMessage || "Failed to delete lesson");
        }
        setIsDeleting(false);
        setDeleteConfirm(null);
    };

    // ─── Question Handlers ───────────────────────────────────

    const openQuestions = (lessonId: string, lessonName: string) => {
        setQuestionLessonId(lessonId);
        setQuestionLessonName(lessonName);
        fetchLessonQuestions(lessonId);
        setShowQuestionList(true);
    };

    // ─── Delete handler dispatch ─────────────────────────────

    const handleDeleteConfirm = () => {
        if (!deleteConfirm) return;
        if (deleteConfirm.type === "unit") handleDeleteUnit();
        else if (deleteConfirm.type === "chapter") handleDeleteChapter();
        else if (deleteConfirm.type === "lesson") handleDeleteLesson();
    };

    // ─── Loading State ───────────────────────────────────────

    if (isLoading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
                <DashboardHeader userName="Tutor" userInitials="T" />
                <div className="flex items-center justify-center py-32">
                    <Loader2 size={48} className="animate-spin text-blue-500" />
                </div>
            </div>
        );
    }

    if (!course) return null;

    // ─── Render ──────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
            <DashboardHeader userName="Tutor" userInitials="T" />

            {/* Course Header Bar */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-18.25 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push("/tutor/dashboard")}
                                className="shadow-none text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1"
                            >
                                <ArrowLeft size={18} /> Back to Dashboard
                            </Button>
                            <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
                            <div>
                                <h1 className="font-lilita text-2xl text-gray-800 dark:text-gray-100">{course.name}</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{course.description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                course.status === "published"
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                            }`}>
                                {course.status === "published" ? "Published" : "Draft"}
                            </span>
                            {course.status === "draft" && (
                                <Button
                                    onClick={handlePublish}
                                >
                                    <span className="flex items-center gap-1"><Send size={16} /> Publish Course</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Roadmap Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Units */}
                {course.units
                    .sort((a, b) => a.unit_index - b.unit_index)
                    .map((unit) => (
                    <div key={unit.id} className="mb-16">
                        {/* Unit Header */}
                        <UnitHeader
                            unit={unit}
                            onEdit={() => setEditingUnit({ id: unit.id, name: unit.name, description: unit.description || "" })}
                            onDelete={() => setDeleteConfirm({ type: "unit", id: unit.id, name: unit.name })}
                        />

                        {/* Chapters path */}
                        <div className="relative">
                            {unit.chapters.length > 0 && (
                                <div className="absolute left-1/2 top-0 w-1 h-8 bg-gray-300 dark:bg-gray-600 -translate-x-1/2" />
                            )}

                            {unit.chapters
                                .sort((a, b) => a.chapter_index - b.chapter_index)
                                .map((chapter, chIdx) => (
                                <ChapterCard
                                    key={chapter.id}
                                    chapter={chapter}
                                    chapterIndex={chIdx}
                                    onEditChapter={() => setEditingChapter({ id: chapter.id, name: chapter.name })}
                                    onDeleteChapter={() => setDeleteConfirm({ type: "chapter", id: chapter.id, name: chapter.name })}
                                    onAddLesson={() => {
                                        setLessonTargetChapterId(chapter.id);
                                        setShowLessonForm(true);
                                    }}
                                    onEditLesson={(lessonId, lessonName) => setEditingLesson({ id: lessonId, name: lessonName })}
                                    onDeleteLesson={(lessonId) => {
                                        const lesson = chapter.lessons.find(l => l.id === lessonId);
                                        setDeleteConfirm({ type: "lesson", id: lessonId, name: lesson?.name || "Lesson" });
                                    }}
                                    onOpenQuestions={(lessonId, lessonName) => openQuestions(lessonId, lessonName)}
                                    isLast={chIdx === unit.chapters.length - 1}
                                />
                            ))}

                            {/* Add Chapter Button */}
                            <div className="max-w-md mx-auto mt-8">
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    onClick={() => {
                                        setChapterTargetUnitId(unit.id);
                                        setShowChapterForm(true);
                                    }}
                                    className="w-full shadow-none border-2 border-dashed border-blue-400 dark:border-blue-600 rounded-2xl text-blue-600 dark:text-blue-400 hover:border-blue-600 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold flex items-center justify-center gap-2"
                                >
                                    <Plus size={20} /> Add New Chapter
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty state */}
                {course.units.length === 0 && (
                    <div className="text-center py-20">
                        <BookOpen size={64} className="text-gray-300 dark:text-gray-600 mx-auto mb-6" />
                        <h3 className="font-bold text-2xl text-gray-800 dark:text-gray-200 mb-2">No Units Yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">Start building your course by adding the first unit</p>
                    </div>
                )}

                {/* Add Unit Button */}
                <div className="text-center mb-12">
                    <Button
                        size="lg"
                        onClick={() => setShowUnitForm(true)}
                        className="px-12 py-6 rounded-2xl font-lilita text-2xl shadow-2xl hover:shadow-3xl border-b-8 border-blue-900 active:border-b-0 flex items-center gap-3 mx-auto"
                    >
                        <Plus size={28} /> Add New Unit
                    </Button>
                </div>
            </main>

            {/* ─── Side Panels & Modals ──────────────────────── */}

            {/* Add Unit */}
            <UnitForm
                isOpen={showUnitForm}
                onClose={() => setShowUnitForm(false)}
                onSubmit={handleAddUnit}
            />

            {/* Edit Unit */}
            {editingUnit && (
                <UnitForm
                    isOpen={true}
                    onClose={() => setEditingUnit(null)}
                    onSubmit={handleEditUnit}
                    initialName={editingUnit.name}
                    initialDescription={editingUnit.description}
                    isEdit
                />
            )}

            {/* Add Chapter */}
            <ChapterForm
                isOpen={showChapterForm}
                onClose={() => { setShowChapterForm(false); setChapterTargetUnitId(""); }}
                onSubmit={handleAddChapter}
            />

            {/* Edit Chapter */}
            {editingChapter && (
                <ChapterForm
                    isOpen={true}
                    onClose={() => setEditingChapter(null)}
                    onSubmit={handleEditChapter}
                    initialName={editingChapter.name}
                    isEdit
                />
            )}

            {/* Add Lesson */}
            <LessonForm
                isOpen={showLessonForm}
                onClose={() => { setShowLessonForm(false); setLessonTargetChapterId(""); }}
                onSubmit={handleAddLesson}
            />

            {/* Edit Lesson */}
            {editingLesson && (
                <LessonForm
                    isOpen={true}
                    onClose={() => setEditingLesson(null)}
                    onSubmit={handleEditLesson}
                    initialName={editingLesson.name}
                    isEdit
                />
            )}

            {/* Question List */}
            <QuestionList
                isOpen={showQuestionList}
                onClose={() => {
                    setShowQuestionList(false);
                    setQuestionLessonId("");
                    setQuestionLessonName("");
                    setLessonQuestions([]);
                }}
                lessonId={questionLessonId}
                lessonName={questionLessonName}
                questions={lessonQuestions}
                onQuestionsChanged={() => {
                    fetchLessonQuestions(questionLessonId);
                    fetchCourse();
                }}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={deleteConfirm !== null}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDeleteConfirm}
                title={`Delete ${deleteConfirm?.type || ""}?`}
                message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone and all related content will be permanently removed.`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default CourseEditorPage;
