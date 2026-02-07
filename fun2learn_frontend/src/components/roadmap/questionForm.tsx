"use client";

import { useState } from "react";
import { Trash2, Plus, ListChecks, Type } from "lucide-react";
import SidePanel from "@/components/ui/sidePanel";
import Button from "@/components/ui/button";

type QuestionType = "mcq" | "text" | null;

interface MCQOptionInput {
    option_text: string;
    is_correct: boolean;
}

interface QuestionFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmitMCQ: (questionText: string, options: MCQOptionInput[]) => Promise<void>;
    onSubmitText: (questionText: string, correctAnswer: string, casingMatters: boolean) => Promise<void>;
}

const QuestionForm = ({ isOpen, onClose, onSubmitMCQ, onSubmitText }: QuestionFormProps) => {
    const [questionType, setQuestionType] = useState<QuestionType>(null);
    const [questionText, setQuestionText] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // MCQ state
    const [options, setOptions] = useState<MCQOptionInput[]>([
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
    ]);

    // Text state
    const [correctAnswer, setCorrectAnswer] = useState("");
    const [casingMatters, setCasingMatters] = useState(false);

    const resetForm = () => {
        setQuestionType(null);
        setQuestionText("");
        setOptions([
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false },
        ]);
        setCorrectAnswer("");
        setCasingMatters(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const addOption = () => {
        setOptions([...options, { option_text: "", is_correct: false }]);
    };

    const removeOption = (index: number) => {
        if (options.length <= 2) return;
        setOptions(options.filter((_, i) => i !== index));
    };

    const updateOptionText = (index: number, text: string) => {
        const updated = [...options];
        updated[index].option_text = text;
        setOptions(updated);
    };

    const setCorrectOption = (index: number) => {
        const updated = options.map((opt, i) => ({ ...opt, is_correct: i === index }));
        setOptions(updated);
    };

    const handleSubmit = async () => {
        if (!questionText.trim()) return;
        setIsLoading(true);
        try {
            if (questionType === "mcq") {
                const validOptions = options.filter(o => o.option_text.trim());
                const hasCorrect = validOptions.some(o => o.is_correct);
                if (validOptions.length < 2 || !hasCorrect) return;
                await onSubmitMCQ(questionText.trim(), validOptions);
            } else if (questionType === "text") {
                if (!correctAnswer.trim()) return;
                await onSubmitText(questionText.trim(), correctAnswer.trim(), casingMatters);
            }
            resetForm();
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const canSubmit = () => {
        if (!questionText.trim()) return false;
        if (questionType === "mcq") {
            const validOptions = options.filter(o => o.option_text.trim());
            return validOptions.length >= 2 && validOptions.some(o => o.is_correct);
        }
        if (questionType === "text") {
            return correctAnswer.trim().length > 0;
        }
        return false;
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={handleClose}
            title={questionType === "mcq" ? "Add MCQ Question" : questionType === "text" ? "Add Text Question" : "Add Question"}
            subtitle={questionType ? "Fill in the question details" : "Choose a question type"}
            width="w-[600px]"
            footer={questionType ? (
                <>
                    <Button variant="secondary" onClick={handleClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        isLoading={isLoading}
                        loadingText="Adding..."
                        disabled={!canSubmit()}
                        className="flex-1"
                    >
                        Add Question
                    </Button>
                </>
            ) : undefined}
        >
            {/* Question Type Selector */}
            {!questionType && (
                <div className="space-y-6">
                    <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 text-center">Choose Question Type</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <Button
                            variant="ghost"
                            onClick={() => setQuestionType("mcq")}
                            className="group p-8 shadow-none border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-auto"
                        >
                            <span className="flex flex-col items-center">
                                <span className="flex justify-center mb-4">
                                    <ListChecks size={48} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                </span>
                                <span className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100">Multiple Choice</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400 font-normal">Students select from multiple options</span>
                            </span>
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setQuestionType("text")}
                            className="group p-8 shadow-none border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 h-auto"
                        >
                            <span className="flex flex-col items-center">
                                <span className="flex justify-center mb-4">
                                    <Type size={48} className="text-green-500 group-hover:scale-110 transition-transform" />
                                </span>
                                <span className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100">Text Answer</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400 font-normal">Students type in their answer</span>
                            </span>
                        </Button>
                    </div>
                </div>
            )}

            {/* MCQ Form */}
            {questionType === "mcq" && (
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Question <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            placeholder="Enter your question here..."
                            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                            Answer Options <span className="text-red-500">*</span>
                        </label>

                        {options.map((option, index) => (
                            <div key={index} className="flex gap-2 mb-3">
                                <input
                                    type="radio"
                                    name="correct"
                                    checked={option.is_correct}
                                    onChange={() => setCorrectOption(index)}
                                    className="mt-4 cursor-pointer"
                                />
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={option.option_text}
                                        onChange={(e) => updateOptionText(index, e.target.value)}
                                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 ${
                                            option.is_correct
                                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                                : "border-gray-300 dark:border-gray-600 focus:border-blue-500"
                                        }`}
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeOption(index)}
                                    disabled={options.length <= 2}
                                    className="w-10 h-10 p-0 mt-1 shadow-none bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50"
                                >
                                    <Trash2 size={16} className="text-red-600" />
                                </Button>
                            </div>
                        ))}

                        <Button
                            variant="ghost"
                            onClick={addOption}
                            className="w-full py-3 shadow-none border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Add Another Option
                        </Button>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Select the radio button next to the correct answer</p>
                    </div>
                </div>
            )}

            {/* Text Form */}
            {questionType === "text" && (
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Question <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            placeholder="Enter your question here..."
                            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Correct Answer <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={correctAnswer}
                            onChange={(e) => setCorrectAnswer(e.target.value)}
                            placeholder="Enter the correct answer..."
                            className="w-full px-4 py-3 border-2 border-green-500 rounded-lg focus:outline-none transition-colors bg-green-50 dark:bg-green-900/20 text-gray-800 dark:text-gray-100"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="casingMatters"
                            checked={casingMatters}
                            onChange={(e) => setCasingMatters(e.target.checked)}
                            className="rounded cursor-pointer"
                        />
                        <label htmlFor="casingMatters" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                            Case sensitive
                        </label>
                    </div>
                </div>
            )}
        </SidePanel>
    );
};

export default QuestionForm;
