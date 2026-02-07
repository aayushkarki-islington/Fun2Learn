"use client";

import { useState } from "react";
import SidePanel from "@/components/ui/sidePanel";
import Button from "@/components/ui/button";

interface UnitFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, description: string) => Promise<void>;
    initialName?: string;
    initialDescription?: string;
    isEdit?: boolean;
}

const UnitForm = ({ isOpen, onClose, onSubmit, initialName = "", initialDescription = "", isEdit = false }: UnitFormProps) => {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            await onSubmit(name.trim(), description.trim());
            if (!isEdit) {
                setName("");
                setDescription("");
            }
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    // Reset form when panel opens with new values
    const handleClose = () => {
        if (!isEdit) {
            setName("");
            setDescription("");
        }
        onClose();
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={handleClose}
            title={isEdit ? "Edit Unit" : "Add New Unit"}
            subtitle={isEdit ? "Update unit details" : "Create a new unit for your course"}
            footer={
                <>
                    <Button variant="secondary" onClick={handleClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        isLoading={isLoading}
                        loadingText={isEdit ? "Saving..." : "Creating..."}
                        disabled={!name.trim()}
                        className="flex-1"
                    >
                        {isEdit ? "Save Changes" : "Create Unit"}
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Unit Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Introduction to Algebra"
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose a clear, descriptive name</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Description
                    </label>
                    <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what students will learn in this unit..."
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optional: Add context for students</p>
                </div>
            </div>
        </SidePanel>
    );
};

export default UnitForm;
