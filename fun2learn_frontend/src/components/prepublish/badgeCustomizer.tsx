"use client";

import { useState, useRef } from "react";
import { Upload, ImageIcon, Shapes } from "lucide-react";
import { BADGE_ICONS, ICON_CATEGORIES } from "./iconMap";
import BadgePreview from "./badgePreview";

interface BadgeCustomizerProps {
    badgeName: string;
    onBadgeNameChange: (name: string) => void;
    badgeType: "icon" | "image";
    onBadgeTypeChange: (type: "icon" | "image") => void;
    selectedIconName: string;
    onIconSelect: (iconName: string) => void;
    imageFile: File | null;
    imagePreviewUrl: string;
    onImageSelect: (file: File, previewUrl: string) => void;
}

const BadgeCustomizer = ({
    badgeName,
    onBadgeNameChange,
    badgeType,
    onBadgeTypeChange,
    selectedIconName,
    onIconSelect,
    imageFile,
    imagePreviewUrl,
    onImageSelect,
}: BadgeCustomizerProps) => {
    const [activeCategory, setActiveCategory] = useState(ICON_CATEGORIES[0]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        onImageSelect(file, url);
    };

    const filteredIcons = BADGE_ICONS.filter((e) => e.category === activeCategory);

    return (
        <div className="space-y-6">
            {/* Badge Preview */}
            <div className="flex justify-center py-4">
                <BadgePreview
                    name={badgeName}
                    badgeType={badgeType}
                    iconName={badgeType === "icon" ? selectedIconName : undefined}
                    imageUrl={badgeType === "image" ? imagePreviewUrl : undefined}
                />
            </div>

            {/* Badge Name */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Badge Name
                </label>
                <input
                    type="text"
                    placeholder="e.g. Python Master"
                    value={badgeName}
                    onChange={(e) => onBadgeNameChange(e.target.value)}
                    maxLength={50}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                />
            </div>

            {/* Toggle: Icon vs Image */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => onBadgeTypeChange("icon")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer border-2 ${
                        badgeType === "icon"
                            ? "bg-blue-500 text-white border-blue-500 shadow-md"
                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300"
                    }`}
                >
                    <Shapes size={18} /> Choose Icon
                </button>
                <button
                    type="button"
                    onClick={() => onBadgeTypeChange("image")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer border-2 ${
                        badgeType === "image"
                            ? "bg-blue-500 text-white border-blue-500 shadow-md"
                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300"
                    }`}
                >
                    <ImageIcon size={18} /> Upload Image
                </button>
            </div>

            {/* Icon Picker */}
            {badgeType === "icon" && (
                <div className="space-y-3">
                    {/* Category tabs */}
                    <div className="flex flex-wrap gap-1.5">
                        {ICON_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setActiveCategory(cat)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                    activeCategory === cat
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Icon grid */}
                    <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto pr-1">
                        {filteredIcons.map((entry) => {
                            const Icon = entry.icon;
                            const isSelected = selectedIconName === entry.name;
                            return (
                                <button
                                    key={entry.name}
                                    type="button"
                                    onClick={() => onIconSelect(entry.name)}
                                    title={entry.name}
                                    className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all cursor-pointer border-2 ${
                                        isSelected
                                            ? "bg-blue-500 text-white border-blue-500 shadow-md scale-110"
                                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    }`}
                                >
                                    <Icon size={24} />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Image Upload */}
            {badgeType === "image" && (
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-8 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50 dark:bg-gray-800/50 transition-colors cursor-pointer flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-500"
                    >
                        <Upload size={32} />
                        <span className="text-sm font-semibold">
                            {imageFile ? imageFile.name : "Click to upload an image"}
                        </span>
                        <span className="text-xs text-gray-400">
                            PNG, JPG, SVG, or WebP
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default BadgeCustomizer;
