"use client";

import { useState } from "react";
import type { StudentQuestion } from "@/models/types";
import Button from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface QuestionCardProps {
    question: StudentQuestion;
    index: number;
    onSubmitAnswer: (questionId: string, answer: string) => Promise<{ isCorrect: boolean; correctAnswer?: string } | null>;
}

const QuestionCard = ({ question, index, onSubmitAnswer }: QuestionCardProps) => {
    const [selectedAnswer, setSelectedAnswer] = useState<string>("");
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedAnswer.trim()) return;
        setIsSubmitting(true);

        const result = await onSubmitAnswer(question.id, selectedAnswer);
        if (result) {
            setIsCorrect(result.isCorrect);
            setCorrectAnswer(result.correctAnswer || null);
            setSubmitted(true);
        }
        setIsSubmitting(false);
    };

    const borderColor = submitted
        ? isCorrect ? 'border-green-500' : 'border-red-500'
        : 'border-gray-200 dark:border-gray-700';

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md border-2 ${borderColor} p-6 transition-colors`}>
            {/* Question header */}
            <div className="flex items-start gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    submitted
                        ? isCorrect
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                    {submitted ? (isCorrect ? <Check size={16} /> : <X size={16} />) : index + 1}
                </div>
                <div className="flex-1">
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                        {question.question_type === 'mcq' ? 'Multiple Choice' : 'Text Answer'}
                    </span>
                    <p className="text-gray-800 dark:text-gray-100 font-semibold mt-1">{question.question_text}</p>
                </div>
            </div>

            {/* MCQ Options */}
            {question.question_type === 'mcq' && question.mcq_options && (
                <div className="space-y-2 mb-4">
                    {question.mcq_options.map(option => {
                        const isSelected = selectedAnswer === option.id;
                        let optionStyle = 'border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10';

                        if (isSelected && !submitted) {
                            optionStyle = 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
                        } else if (submitted && isSelected) {
                            optionStyle = isCorrect
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-red-500 bg-red-50 dark:bg-red-900/20';
                        }

                        return (
                            <button
                                key={option.id}
                                onClick={() => !submitted && setSelectedAnswer(option.id)}
                                disabled={submitted}
                                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${optionStyle} ${
                                    submitted ? 'cursor-default' : 'cursor-pointer'
                                }`}
                            >
                                <span className="text-gray-800 dark:text-gray-100">{option.option_text}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Text Input */}
            {question.question_type === 'text' && (
                <div className="mb-4">
                    <input
                        type="text"
                        value={selectedAnswer}
                        onChange={(e) => !submitted && setSelectedAnswer(e.target.value)}
                        disabled={submitted}
                        placeholder="Type your answer..."
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-60"
                    />
                </div>
            )}

            {/* Feedback */}
            {submitted && (
                <div className={`rounded-lg p-3 mb-4 ${
                    isCorrect
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                    <p className="font-semibold text-sm">
                        {isCorrect ? 'Correct!' : 'Incorrect'}
                    </p>
                    {!isCorrect && correctAnswer && (
                        <p className="text-sm mt-1">
                            Correct answer: <span className="font-bold">{correctAnswer}</span>
                        </p>
                    )}
                </div>
            )}

            {/* Submit button */}
            {!submitted && (
                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!selectedAnswer.trim()}
                    isLoading={isSubmitting}
                    loadingText="Checking..."
                >
                    Check Answer
                </Button>
            )}
        </div>
    );
};

export default QuestionCard;
