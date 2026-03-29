"use client";

import type { BrowseCourseSummary } from "@/models/types";
import { GraduationCap, Users, Gem, Star } from "lucide-react";
import { useRouter } from "next/navigation";

interface BrowseCourseCardProps {
    course: BrowseCourseSummary;
    isEnrolled?: boolean;
}

const BrowseCourseCard = ({ course, isEnrolled = false }: BrowseCourseCardProps) => {
    const router = useRouter();

    const hasDiscount = course.discount_percent && course.discount_percent > 0;
    const effectivePrice = hasDiscount
        ? Math.round(course.price_gems! * (1 - course.discount_percent! / 100))
        : course.price_gems;

    return (
        <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden cursor-pointer group"
            onClick={() => router.push(`/student/browse/${course.id}`)}
        >
            {/* Header */}
            <div className="bg-gradient h-32 flex items-center justify-center text-white relative">
                <GraduationCap size={64} strokeWidth={1.5} />
                {isEnrolled && (
                    <span className="absolute top-3 right-3 px-2 py-1 text-xs font-semibold rounded-full bg-green-500/90 text-white">
                        Enrolled
                    </span>
                )}
            </div>

            <div className="p-5">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 line-clamp-1 mb-0.5">
                    {course.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">by {course.tutor_name}</p>

                {/* Rating */}
                {course.avg_rating ? (
                    <div className="flex items-center gap-1.5 mb-3">
                        <div className="flex">
                            {[1,2,3,4,5].map(s => (
                                <Star
                                    key={s}
                                    size={13}
                                    className={s <= Math.round(course.avg_rating!) ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}
                                    fill={s <= Math.round(course.avg_rating!) ? "currentColor" : "none"}
                                />
                            ))}
                        </div>
                        <span className="text-xs font-semibold text-yellow-500">{course.avg_rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({course.review_count})</span>
                    </div>
                ) : (
                    <div className="mb-3 h-4" />
                )}

                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                    {course.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-1.5 mb-3 text-center">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1.5">
                        <div className="font-bold text-blue-600 dark:text-blue-400 text-sm">{course.unit_count}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Units</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-1.5">
                        <div className="font-bold text-green-600 dark:text-green-400 text-sm">{course.chapter_count}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Chapters</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-1.5">
                        <div className="font-bold text-purple-600 dark:text-purple-400 text-sm">{course.lesson_count}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Lessons</div>
                    </div>
                </div>

                {/* Tags */}
                {course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {course.tags.slice(0, 3).map(tag => (
                            <span key={tag.id} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                                {tag.name}
                            </span>
                        ))}
                        {course.tags.length > 3 && (
                            <span className="text-xs text-gray-400">+{course.tags.length - 3}</span>
                        )}
                    </div>
                )}

                {/* Price + enrollment count */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {course.price_gems ? (
                            <>
                                {hasDiscount && (
                                    <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                        -{course.discount_percent}%
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                                    <Gem size={11} fill="currentColor" />
                                    {effectivePrice!.toLocaleString()}
                                    {hasDiscount && (
                                        <span className="line-through text-yellow-400 dark:text-yellow-600 ml-0.5">
                                            {course.price_gems.toLocaleString()}
                                        </span>
                                    )}
                                </span>
                            </>
                        ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                Free
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Users size={12} />
                        {course.enrollment_count}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrowseCourseCard;
