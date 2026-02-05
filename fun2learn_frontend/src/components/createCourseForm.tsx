"use client";

import { useState } from "react";
import Button from "./ui/button";

interface CreateCourseFormProps {
    onSubmit: (name: string, description: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const CreateCourseForm = ({ onSubmit, onCancel, isLoading = false }: CreateCourseFormProps) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && description.trim()) {
            onSubmit(name.trim(), description.trim());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Name */}
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Course Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Mathematics 101"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    required
                    disabled={isLoading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Choose a clear, descriptive name
                </p>
            </div>

            {/* Course Description */}
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Description <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe what students will learn in this course..."
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    required
                    disabled={isLoading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Add context for students about what they'll learn
                </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
                <div className="flex-1">
                    <Button
                        type="button"
                        onClick={onCancel}
                        variant="secondary"
                        size="lg"
                        disabled={isLoading}
                        className="w-full"
                    >
                        Cancel
                    </Button>
                </div>
                <div className="flex-1">
                    <Button
                        type="submit"
                        isLoading={isLoading}
                        loadingText="Creating..."
                        className="w-full h-full"
                        disabled={!name.trim() || !description.trim() || isLoading}
                    >
                        Create Course
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default CreateCourseForm;
