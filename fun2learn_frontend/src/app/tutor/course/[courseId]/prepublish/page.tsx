"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import DashboardHeader from "@/components/ui/dashboardHeader";
import Button from "@/components/ui/button";
import StepIndicator from "@/components/prepublish/stepIndicator";
import TagSelector from "@/components/prepublish/tagSelector";
import BadgeCustomizer from "@/components/prepublish/badgeCustomizer";
import type { Tag, Badge, CourseDetail } from "@/models/types";
import {
    getCourseDetail,
    getTags,
    getCourseTags,
    saveCourseTags,
    getCourseBadge,
    createBadgeIcon,
    createBadgeImage,
    publishCourse,
} from "@/api/courseApi";

const STEPS = ["Select Tags", "Customize Badge"];

const PrepublishPage = () => {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;

    const [isLoading, setIsLoading] = useState(true);
    const [course, setCourse] = useState<CourseDetail | null>(null);

    // Step state
    const [currentStep, setCurrentStep] = useState(1);

    // Tag state
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

    // Badge state
    const [badgeName, setBadgeName] = useState("");
    const [badgeType, setBadgeType] = useState<"icon" | "image">("icon");
    const [selectedIconName, setSelectedIconName] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState("");

    // Publishing state
    const [isPublishing, setIsPublishing] = useState(false);

    const fetchInitialData = useCallback(async () => {
        try {
            const [courseResult, tagsResult, courseTagsResult, badgeResult] = await Promise.all([
                getCourseDetail(courseId),
                getTags(),
                getCourseTags(courseId),
                getCourseBadge(courseId),
            ]);

            if (!courseResult.success || !courseResult.course) {
                toast.error(courseResult.errorMessage || "Failed to load course");
                router.push("/tutor/dashboard");
                return;
            }

            if (courseResult.course.status === "published") {
                toast.error("This course is already published");
                router.push(`/tutor/course/${courseId}`);
                return;
            }

            setCourse(courseResult.course);

            if (tagsResult.success && tagsResult.tags) {
                setAllTags(tagsResult.tags);
            }

            if (courseTagsResult.success && courseTagsResult.tags) {
                setSelectedTagIds(courseTagsResult.tags.map((t: Tag) => t.id));
            }

            if (badgeResult.success && badgeResult.badge) {
                const badge = badgeResult.badge as Badge;
                setBadgeName(badge.name);
                setBadgeType(badge.badge_type);
                if (badge.badge_type === "icon" && badge.icon_name) {
                    setSelectedIconName(badge.icon_name);
                }
                if (badge.badge_type === "image" && badge.image_url) {
                    setImagePreviewUrl(badge.image_url);
                }
            }
        } catch {
            toast.error("Failed to load prepublish data");
            router.push("/tutor/dashboard");
        } finally {
            setIsLoading(false);
        }
    }, [courseId, router]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handlePublish = async () => {
        if (!badgeName.trim()) {
            toast.error("Please enter a badge name");
            return;
        }

        if (badgeType === "icon" && !selectedIconName) {
            toast.error("Please select an icon for the badge");
            return;
        }

        if (badgeType === "image" && !imageFile && !imagePreviewUrl) {
            toast.error("Please upload an image for the badge");
            return;
        }

        setIsPublishing(true);

        try {
            // 1. Save tags
            const tagsResult = await saveCourseTags(courseId, selectedTagIds);
            if (!tagsResult.success) {
                toast.error(tagsResult.errorMessage || "Failed to save tags");
                setIsPublishing(false);
                return;
            }

            // 2. Create badge
            if (badgeType === "icon") {
                const badgeResult = await createBadgeIcon(courseId, badgeName.trim(), selectedIconName);
                if (!badgeResult.success) {
                    toast.error(badgeResult.errorMessage || "Failed to create badge");
                    setIsPublishing(false);
                    return;
                }
            } else if (imageFile) {
                const badgeResult = await createBadgeImage(courseId, badgeName.trim(), imageFile);
                if (!badgeResult.success) {
                    toast.error(badgeResult.errorMessage || "Failed to create badge");
                    setIsPublishing(false);
                    return;
                }
            }

            // 3. Publish course
            const publishResult = await publishCourse(courseId);
            if (!publishResult.success) {
                toast.error(publishResult.errorMessage || "Failed to publish course");
                setIsPublishing(false);
                return;
            }

            toast.success("Course published successfully!");
            router.push("/tutor/dashboard");
        } catch {
            toast.error("An error occurred during publishing");
            setIsPublishing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
                <DashboardHeader userName="Tutor" userInitials="T" />
                <div className="flex items-center justify-center py-32">
                    <Loader2 size={48} className="animate-spin text-blue-500" />
                </div>
            </div>
        );
    }

    if (!course) return null;

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
            <DashboardHeader userName="Tutor" userInitials="T" />

            {/* Header Bar */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-18.25 z-40">
                <div className="max-w-3xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/tutor/course/${courseId}`)}
                                className="shadow-none text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1"
                            >
                                <ArrowLeft size={18} /> Back to Editor
                            </Button>
                            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                            <h1 className="font-lilita text-xl text-gray-800 dark:text-gray-100">
                                Publish: {course.name}
                            </h1>
                        </div>
                    </div>
                    <StepIndicator currentStep={currentStep} steps={STEPS} />
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-6 py-10">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                    {/* Step 1: Tag Selector */}
                    {currentStep === 1 && (
                        <div>
                            <h2 className="font-lilita text-2xl text-gray-800 dark:text-gray-100 mb-2">
                                Select Tags
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Choose tags that describe your course so learners can find it easily.
                            </p>
                            <TagSelector
                                allTags={allTags}
                                selectedTagIds={selectedTagIds}
                                onChange={setSelectedTagIds}
                            />
                        </div>
                    )}

                    {/* Step 2: Badge Customizer */}
                    {currentStep === 2 && (
                        <div>
                            <h2 className="font-lilita text-2xl text-gray-800 dark:text-gray-100 mb-2">
                                Customize Badge
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Create a badge that learners earn when they complete your course.
                            </p>
                            <BadgeCustomizer
                                badgeName={badgeName}
                                onBadgeNameChange={setBadgeName}
                                badgeType={badgeType}
                                onBadgeTypeChange={setBadgeType}
                                selectedIconName={selectedIconName}
                                onIconSelect={setSelectedIconName}
                                imageFile={imageFile}
                                imagePreviewUrl={imagePreviewUrl}
                                onImageSelect={(file, url) => {
                                    setImageFile(file);
                                    setImagePreviewUrl(url);
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => {
                            if (currentStep === 1) {
                                router.push(`/tutor/course/${courseId}`);
                            } else {
                                setCurrentStep(currentStep - 1);
                            }
                        }}
                    >
                        <span className="flex items-center gap-2">
                            <ArrowLeft size={18} />
                            {currentStep === 1 ? "Back to Editor" : "Back"}
                        </span>
                    </Button>

                    {currentStep < STEPS.length ? (
                        <Button
                            size="lg"
                            onClick={() => setCurrentStep(currentStep + 1)}
                        >
                            <span className="flex items-center gap-2">
                                Next <ArrowRight size={18} />
                            </span>
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            onClick={handlePublish}
                            isLoading={isPublishing}
                            loadingText="Publishing..."
                        >
                            <span className="flex items-center gap-2">
                                <Send size={18} /> Publish Course
                            </span>
                        </Button>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PrepublishPage;
