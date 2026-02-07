"use client";

import { useState } from "react";
import SidePanel from "@/components/ui/sidePanel";
import Button from "@/components/ui/button";

interface ChapterFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string) => Promise<void>;
    initialName?: string;
    isEdit?: boolean;
}

const ChapterForm = ({ isOpen, onClose, onSubmit, initialName = "", isEdit = false }: ChapterFormProps) => {
    const [name, setName] = useState(initialName);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            await onSubmit(name.trim());
            if (!isEdit) setName("");
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isEdit) setName("");
        onClose();
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={handleClose}
            title={isEdit ? "Edit Chapter" : "Add New Chapter"}
            subtitle={isEdit ? "Update chapter details" : "Create a new chapter"}
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
                        {isEdit ? "Save Changes" : "Create Chapter"}
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Chapter Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Basic Variables"
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose a clear, descriptive name for this chapter</p>
                </div>
            </div>
        </SidePanel>
    );
};

export default ChapterForm;
