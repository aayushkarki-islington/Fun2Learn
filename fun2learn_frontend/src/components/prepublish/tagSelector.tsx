"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import type { Tag } from "@/models/types";

interface TagSelectorProps {
    allTags: Tag[];
    selectedTagIds: string[];
    onChange: (tagIds: string[]) => void;
}

const TagSelector = ({ allTags, selectedTagIds, onChange }: TagSelectorProps) => {
    const [search, setSearch] = useState("");

    const filteredTags = useMemo(() => {
        if (!search.trim()) return allTags;
        const q = search.toLowerCase();
        return allTags.filter((t) => t.name.toLowerCase().includes(q));
    }, [allTags, search]);

    const toggle = (tagId: string) => {
        if (selectedTagIds.includes(tagId)) {
            onChange(selectedTagIds.filter((id) => id !== tagId));
        } else {
            onChange([...selectedTagIds, tagId]);
        }
    };

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                    type="text"
                    placeholder="Search tags..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                />
            </div>

            {/* Selected count */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedTagIds.length} tag{selectedTagIds.length !== 1 ? "s" : ""} selected
            </p>

            {/* Tag chips grid */}
            <div className="flex flex-wrap gap-2 max-h-100 overflow-y-auto pr-1">
                {filteredTags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                        <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggle(tag.id)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer border-2 ${
                                isSelected
                                    ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-200/50 dark:shadow-blue-900/30 scale-105"
                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            }`}
                        >
                            {tag.name}
                        </button>
                    );
                })}

                {filteredTags.length === 0 && (
                    <p className="text-gray-400 dark:text-gray-500 text-sm py-4 w-full text-center">
                        No tags found
                    </p>
                )}
            </div>
        </div>
    );
};

export default TagSelector;
