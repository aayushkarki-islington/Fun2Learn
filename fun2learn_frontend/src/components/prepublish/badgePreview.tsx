"use client";

import { ICON_MAP } from "./iconMap";

interface BadgePreviewProps {
    name: string;
    badgeType: "icon" | "image";
    iconName?: string;
    imageUrl?: string;
}

const BadgePreview = ({ name, badgeType, iconName, imageUrl }: BadgePreviewProps) => {
    const IconComponent = iconName ? ICON_MAP[iconName] : null;
    const hasContent = (badgeType === "icon" && IconComponent) || (badgeType === "image" && imageUrl);

    return (
        <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Badge Preview
            </p>
            <div className="relative">
                <div
                    className={`w-28 h-28 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                        hasContent
                            ? "border-yellow-400 bg-linear-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 shadow-lg shadow-yellow-200/50 dark:shadow-yellow-900/30"
                            : "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800"
                    }`}
                >
                    {badgeType === "icon" && IconComponent ? (
                        <IconComponent size={48} className="text-yellow-600 dark:text-yellow-400" />
                    ) : badgeType === "image" && imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={name || "Badge"}
                            className="w-20 h-20 rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-xs text-center px-2">
                            Select an icon or image
                        </span>
                    )}
                </div>
                {hasContent && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-sm">&#11088;</span>
                    </div>
                )}
            </div>
            {name && (
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 text-center max-w-37.5 truncate">
                    {name}
                </p>
            )}
        </div>
    );
};

export default BadgePreview;
