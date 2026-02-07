"use client";

import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, CheckCircle, ListChecks, Type, Plus, FileText, Paperclip, Upload, X as XIcon, Loader2 } from "lucide-react";
import SidePanel from "@/components/ui/sidePanel";
import Button from "@/components/ui/button";
import type { QuestionDetail, LessonAttachment } from "@/models/types";
import {
    addMCQQuestion, addTextQuestion, deleteQuestion,
    uploadLessonAttachment, getLessonAttachments, deleteLessonAttachment
} from "@/api/courseApi";
import { toast } from "sonner";

interface QuestionListProps {
    isOpen: boolean;
    onClose: () => void;
    lessonId: string;
    lessonName: string;
    questions: QuestionDetail[];
    onQuestionsChanged: () => void;
}

const QuestionList = ({ isOpen, onClose, lessonId, lessonName, questions, onQuestionsChanged }: QuestionListProps) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [questionType, setQuestionType] = useState<"mcq" | "text" | null>(null);
    const [questionText, setQuestionText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // MCQ state
    const [options, setOptions] = useState([
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
    ]);

    // Text state
    const [correctAnswer, setCorrectAnswer] = useState("");
    const [casingMatters, setCasingMatters] = useState(false);

    // Attachments state
    const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [isDeletingAttachment, setIsDeletingAttachment] = useState<string | null>(null);

    const fetchAttachments = useCallback(async () => {
        if (!lessonId) return;
        const result = await getLessonAttachments(lessonId);
        if (result.success && result.attachments) {
            setAttachments(result.attachments);
        }
    }, [lessonId]);

    useEffect(() => {
        if (isOpen && lessonId) {
            fetchAttachments();
        }
    }, [isOpen, lessonId, fetchAttachments]);

    const resetAddForm = () => {
        setShowAddForm(false);
        setQuestionType(null);
        setQuestionText("");
        setOptions([
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false },
        ]);
        setCorrectAnswer("");
        setCasingMatters(false);
    };

    const handleAddQuestion = async () => {
        if (!questionText.trim()) return;
        setIsSubmitting(true);
        try {
            if (questionType === "mcq") {
                const validOptions = options.filter(o => o.option_text.trim());
                if (validOptions.length < 2 || !validOptions.some(o => o.is_correct)) {
                    toast.error("Need at least 2 options and 1 correct answer");
                    return;
                }
                const result = await addMCQQuestion(lessonId, questionText.trim(), validOptions);
                if (result.success) {
                    toast.success("MCQ question added");
                    resetAddForm();
                    onQuestionsChanged();
                } else {
                    toast.error(result.errorMessage || "Failed to add question");
                }
            } else if (questionType === "text") {
                if (!correctAnswer.trim()) return;
                const result = await addTextQuestion(lessonId, questionText.trim(), correctAnswer.trim(), casingMatters);
                if (result.success) {
                    toast.success("Text question added");
                    resetAddForm();
                    onQuestionsChanged();
                } else {
                    toast.error(result.errorMessage || "Failed to add question");
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteQuestion = async (questionId: string) => {
        setDeletingId(questionId);
        const result = await deleteQuestion(questionId);
        if (result.success) {
            toast.success("Question deleted");
            onQuestionsChanged();
        } else {
            toast.error(result.errorMessage || "Failed to delete question");
        }
        setDeletingId(null);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (attachments.length >= 2) {
            toast.error("Maximum 2 attachments per lesson");
            return;
        }

        setIsUploadingFile(true);
        const result = await uploadLessonAttachment(lessonId, file);
        if (result.success) {
            toast.success("File uploaded successfully");
            fetchAttachments();
        } else {
            toast.error(result.errorMessage || "Failed to upload file");
        }
        setIsUploadingFile(false);
        e.target.value = "";
    };

    const handleDeleteAttachment = async (attachmentId: string) => {
        setIsDeletingAttachment(attachmentId);
        const result = await deleteLessonAttachment(attachmentId);
        if (result.success) {
            toast.success("Attachment deleted");
            fetchAttachments();
        } else {
            toast.error(result.errorMessage || "Failed to delete attachment");
        }
        setIsDeletingAttachment(null);
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={() => { resetAddForm(); onClose(); }}
            title={lessonName}
            subtitle={`${questions.length} questions`}
            width="w-[600px]"
            footer={
                <Button onClick={() => { resetAddForm(); onClose(); }} className="flex-1">
                    Done
                </Button>
            }
        >
            <div className="space-y-6">
                {/* Attachments Section */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Paperclip size={16} /> Attachments ({attachments.length}/2)
                        </h4>
                        {attachments.length < 2 && (
                            <label className="px-3 py-1 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600 cursor-pointer flex items-center gap-1">
                                {isUploadingFile ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                {isUploadingFile ? "Uploading..." : "Upload"}
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploadingFile}
                                />
                            </label>
                        )}
                    </div>
                    {attachments.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">No attachments yet. Upload files for this lesson.</p>
                    ) : (
                        <div className="space-y-2">
                            {attachments.map((att) => (
                                <div key={att.id} className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
                                    <FileText size={16} className="text-blue-500 shrink-0" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{att.file_name}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteAttachment(att.id)}
                                        disabled={isDeletingAttachment === att.id}
                                        className="shrink-0 w-6 h-6 p-0 shadow-none rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                                    >
                                        {isDeletingAttachment === att.id
                                            ? <Loader2 size={12} className="animate-spin text-red-500" />
                                            : <XIcon size={12} className="text-red-500" />
                                        }
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Questions Header */}
                <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-800 dark:text-gray-100">Questions</h4>
                    {!showAddForm && (
                        <Button size="sm" onClick={() => setShowAddForm(true)}>
                            <span className="flex items-center gap-1"><Plus size={14} /> Add Question</span>
                        </Button>
                    )}
                </div>

                {/* Add Question Form (inline) */}
                {showAddForm && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-2 border-dashed border-blue-300 dark:border-blue-700">
                        {!questionType ? (
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setQuestionType("mcq")}
                                    className="p-4 shadow-none border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:bg-white dark:hover:bg-gray-800 text-center h-auto"
                                >
                                    <span className="flex flex-col items-center">
                                        <ListChecks size={32} className="text-blue-500 mb-2" />
                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-100">Multiple Choice</span>
                                    </span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setQuestionType("text")}
                                    className="p-4 shadow-none border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-green-500 hover:bg-white dark:hover:bg-gray-800 text-center h-auto"
                                >
                                    <span className="flex flex-col items-center">
                                        <Type size={32} className="text-green-500 mb-2" />
                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-100">Text Answer</span>
                                    </span>
                                </Button>
                            </div>
                        ) : questionType === "mcq" ? (
                            <div className="space-y-4">
                                <textarea
                                    rows={2}
                                    value={questionText}
                                    onChange={(e) => setQuestionText(e.target.value)}
                                    placeholder="Enter your question..."
                                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 resize-none"
                                />
                                {options.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            type="radio"
                                            name="newCorrect"
                                            checked={opt.is_correct}
                                            onChange={() => {
                                                setOptions(options.map((o, i) => ({ ...o, is_correct: i === idx })));
                                            }}
                                            className="mt-3 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={opt.option_text}
                                            onChange={(e) => {
                                                const updated = [...options];
                                                updated[idx].option_text = e.target.value;
                                                setOptions(updated);
                                            }}
                                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                            className={`flex-1 px-3 py-2 border-2 rounded-lg focus:outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 ${
                                                opt.is_correct ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-gray-300 dark:border-gray-600"
                                            }`}
                                        />
                                        {options.length > 2 && (
                                            <Button variant="ghost" size="sm" onClick={() => setOptions(options.filter((_, i) => i !== idx))} className="p-0 shadow-none">
                                                <Trash2 size={14} className="text-red-500" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setOptions([...options, { option_text: "", is_correct: false }])}
                                    className="shadow-none text-blue-500 flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add Option
                                </Button>
                                <div className="flex gap-2 pt-2">
                                    <Button size="sm" variant="secondary" onClick={resetAddForm}>Cancel</Button>
                                    <Button
                                        size="sm"
                                        onClick={handleAddQuestion}
                                        isLoading={isSubmitting}
                                        disabled={!questionText.trim() || options.filter(o => o.option_text.trim()).length < 2 || !options.some(o => o.is_correct)}
                                    >
                                        Add MCQ
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <textarea
                                    rows={2}
                                    value={questionText}
                                    onChange={(e) => setQuestionText(e.target.value)}
                                    placeholder="Enter your question..."
                                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 resize-none"
                                />
                                <input
                                    type="text"
                                    value={correctAnswer}
                                    onChange={(e) => setCorrectAnswer(e.target.value)}
                                    placeholder="Correct answer..."
                                    className="w-full px-4 py-3 border-2 border-green-500 rounded-lg focus:outline-none bg-green-50 dark:bg-green-900/20 text-gray-800 dark:text-gray-100"
                                />
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={casingMatters}
                                        onChange={(e) => setCasingMatters(e.target.checked)}
                                        className="rounded"
                                    />
                                    Case sensitive
                                </label>
                                <div className="flex gap-2 pt-2">
                                    <Button size="sm" variant="secondary" onClick={resetAddForm}>Cancel</Button>
                                    <Button
                                        size="sm"
                                        onClick={handleAddQuestion}
                                        isLoading={isSubmitting}
                                        disabled={!questionText.trim() || !correctAnswer.trim()}
                                    >
                                        Add Text Question
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty state */}
                {questions.length === 0 && !showAddForm && (
                    <div className="text-center py-12">
                        <FileText size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2">No Questions Yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Start building your lesson by adding questions</p>
                        <Button onClick={() => setShowAddForm(true)}>
                            <span className="flex items-center gap-1"><Plus size={14} /> Add Your First Question</span>
                        </Button>
                    </div>
                )}

                {/* Question Cards */}
                <div className="space-y-4">
                    {questions.map((q, idx) => (
                        <div key={q.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border-2 border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3 flex-1">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                                            q.question_type === "mcq"
                                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                                                : "bg-green-100 dark:bg-green-900/30 text-green-600"
                                        }`}>
                                            Q{idx + 1}
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                                            q.question_type === "mcq"
                                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                                : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                        }`}>
                                            {q.question_type === "mcq" ? "MCQ" : "TEXT"}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800 dark:text-gray-100 mb-2">{q.question_text}</p>

                                        {/* MCQ Options */}
                                        {q.question_type === "mcq" && q.mcq_options && (
                                            <div className="space-y-1.5">
                                                {q.mcq_options.map((opt, optIdx) => (
                                                    <div
                                                        key={opt.id}
                                                        className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                                                            opt.is_correct
                                                                ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-500"
                                                                : "bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                                                        }`}
                                                    >
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                                                            opt.is_correct
                                                                ? "border-green-600 bg-green-500 text-white font-bold"
                                                                : "border-gray-400"
                                                        }`}>
                                                            {String.fromCharCode(65 + optIdx)}
                                                        </div>
                                                        <span className={opt.is_correct ? "font-semibold text-gray-800 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"}>
                                                            {opt.option_text}
                                                        </span>
                                                        {opt.is_correct && (
                                                            <CheckCircle size={14} className="ml-auto text-green-600" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Text Answer */}
                                        {q.question_type === "text" && q.text_answer && (
                                            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-green-700 dark:text-green-400 font-semibold text-xs">Correct Answer:</span>
                                                    <span className="px-2 py-0.5 bg-green-600 text-white rounded text-xs font-mono">
                                                        {q.text_answer.correct_answer}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                                    {q.text_answer.casing_matters ? "Case sensitive" : "Case insensitive"}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Delete button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    disabled={deletingId === q.id}
                                    className="w-8 h-8 p-0 shadow-none bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 ml-2 shrink-0"
                                >
                                    {deletingId === q.id
                                        ? <Loader2 size={14} className="animate-spin text-red-600" />
                                        : <Trash2 size={14} className="text-red-600" />
                                    }
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </SidePanel>
    );
};

export default QuestionList;
