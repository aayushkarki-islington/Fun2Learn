"use client";

import { Check } from "lucide-react";

interface StepIndicatorProps {
    currentStep: number;
    steps: string[];
}

const StepIndicator = ({ currentStep, steps }: StepIndicatorProps) => {
    return (
        <div className="flex items-center justify-center gap-0 w-full max-w-md mx-auto">
            {steps.map((label, index) => {
                const stepNum = index + 1;
                const isCompleted = currentStep > stepNum;
                const isActive = currentStep === stepNum;

                return (
                    <div key={label} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                    isCompleted
                                        ? "bg-green-500 text-white"
                                        : isActive
                                        ? "bg-gradient text-white shadow-lg scale-110"
                                        : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                                }`}
                            >
                                {isCompleted ? <Check size={20} /> : stepNum}
                            </div>
                            <span
                                className={`mt-2 text-xs font-semibold whitespace-nowrap ${
                                    isActive
                                        ? "text-blue-600 dark:text-blue-400"
                                        : isCompleted
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-gray-400 dark:text-gray-500"
                                }`}
                            >
                                {label}
                            </span>
                        </div>

                        {index < steps.length - 1 && (
                            <div
                                className={`flex-1 h-1 mx-3 rounded-full transition-all duration-300 ${
                                    currentStep > stepNum
                                        ? "bg-green-500"
                                        : "bg-gray-200 dark:bg-gray-700"
                                }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default StepIndicator;
