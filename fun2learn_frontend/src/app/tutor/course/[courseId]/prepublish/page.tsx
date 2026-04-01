"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight, Loader2, Send, Save, Gem, Info } from "lucide-react";
import { toast } from "sonner";
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
    setCoursePrice,
    setCourseDiscount,
} from "@/api/courseApi";

const GEM_TO_RS = 0.8;
const APP_COMMISSION = 0.10;
const STEPS = ["Select Tags", "Set Pricing", "Customize Badge"];

const PrepublishPage = () => {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;

    const [isLoading, setIsLoading] = useState(true);
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [isAlreadyPublished, setIsAlreadyPublished] = useState(false);

    // Step state
    const [currentStep, setCurrentStep] = useState(1);

    // Tag state
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

    // Pricing state
    const [isFree, setIsFree] = useState(true);
    const [priceRs, setPriceRs] = useState("");
    const [discountPercent, setDiscountPercent] = useState("");

    // Badge state
    const [badgeName, setBadgeName] = useState("");
    const [badgeType, setBadgeType] = useState<"icon" | "image">("icon");
    const [selectedIconName, setSelectedIconName] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState("");

    const [isSaving, setIsSaving] = useState(false);

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

            const loadedCourse = courseResult.course;
            setCourse(loadedCourse);
            setIsAlreadyPublished(loadedCourse.status === "published");

            // Restore existing pricing
            if (loadedCourse.price_gems && loadedCourse.price_gems > 0) {
                setIsFree(false);
                setPriceRs(Math.round(loadedCourse.price_gems * GEM_TO_RS).toString());
                if (loadedCourse.discount_percent) {
                    setDiscountPercent(loadedCourse.discount_percent.toString());
                }
            }

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

    // Pricing calculations
    const priceRsNum = parseFloat(priceRs) || 0;
    const priceGems = isFree ? null : Math.round(priceRsNum / GEM_TO_RS);
    const discountNum = parseInt(discountPercent) || 0;
    const effectiveGems = priceGems && discountNum > 0
        ? Math.round(priceGems * (1 - discountNum / 100))
        : priceGems;
    const effectiveRs = effectiveGems ? Math.round(effectiveGems * GEM_TO_RS) : 0;
    const tutorEarnsGems = effectiveGems ? Math.round(effectiveGems * (1 - APP_COMMISSION)) : 0;
    const tutorEarnsRs = Math.round(tutorEarnsGems * GEM_TO_RS);
    const commissionRs = Math.round(effectiveRs * APP_COMMISSION);

    const handleSave = async () => {
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

        if (!isFree) {
            if (!priceRs || priceRsNum <= 0) {
                toast.error("Please enter a valid price");
                return;
            }
        }

        setIsSaving(true);

        try {
            // 1. Save tags
            const tagsResult = await saveCourseTags(courseId, selectedTagIds);
            if (!tagsResult.success) {
                toast.error(tagsResult.errorMessage || "Failed to save tags");
                setIsSaving(false);
                return;
            }

            // 2. Save price
            const priceResult = await setCoursePrice(courseId, priceGems);
            if (!priceResult.success) {
                toast.error(priceResult.errorMessage || "Failed to save pricing");
                setIsSaving(false);
                return;
            }

            // 2b. Save discount (only meaningful for paid courses)
            if (!isFree) {
                const parsedDiscount = parseInt(discountPercent) || 0;
                const discountResult = await setCourseDiscount(courseId, parsedDiscount > 0 ? parsedDiscount : null);
                if (!discountResult.success) {
                    toast.error(discountResult.errorMessage || "Failed to save discount");
                    setIsSaving(false);
                    return;
                }
            } else {
                // Clearing price also clears discount implicitly, but be explicit
                await setCourseDiscount(courseId, null);
            }

            // 3. Create/update badge
            if (badgeType === "icon") {
                const badgeResult = await createBadgeIcon(courseId, badgeName.trim(), selectedIconName);
                if (!badgeResult.success) {
                    toast.error(badgeResult.errorMessage || "Failed to create badge");
                    setIsSaving(false);
                    return;
                }
            } else if (imageFile) {
                const badgeResult = await createBadgeImage(courseId, badgeName.trim(), imageFile);
                if (!badgeResult.success) {
                    toast.error(badgeResult.errorMessage || "Failed to create badge");
                    setIsSaving(false);
                    return;
                }
            }

            // 4. Publish if not already published
            if (!isAlreadyPublished) {
                const publishResult = await publishCourse(courseId);
                if (!publishResult.success) {
                    toast.error(publishResult.errorMessage || "Failed to publish course");
                    setIsSaving(false);
                    return;
                }
                toast.success("Course published successfully!");
            } else {
                toast.success("Course settings updated successfully!");
            }

            router.push("/tutor/dashboard");
        } catch {
            toast.error("An error occurred");
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
                <div className="sidebar-layout flex items-center justify-center py-32">
                    <Loader2 size={48} className="animate-spin text-blue-500" />
                </div>
            </div>
        );
    }

    if (!course) return null;

    const headerTitle = isAlreadyPublished ? `Edit: ${course.name}` : `Publish: ${course.name}`;

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
            {/* Header Bar */}
            <div className="sidebar-layout bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
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
                                {headerTitle}
                            </h1>
                        </div>
                    </div>
                    <StepIndicator currentStep={currentStep} steps={STEPS} />
                </div>
            </div>

            {/* Main Content */}
            <main className="sidebar-layout max-w-2xl mx-auto px-6 py-10">
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

                    {/* Step 2: Pricing */}
                    {currentStep === 2 && (
                        <div>
                            <h2 className="font-lilita text-2xl text-gray-800 dark:text-gray-100 mb-2">
                                Set Pricing
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Choose whether this course is free or paid. Students pay in gems.
                            </p>

                            {/* Free / Paid Toggle */}
                            <div className="flex gap-3 mb-6">
                                <button
                                    onClick={() => setIsFree(true)}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                                        isFree
                                            ? "bg-green-50 dark:bg-green-900/30 border-green-400 text-green-700 dark:text-green-400"
                                            : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                                    }`}
                                >
                                    Free
                                </button>
                                <button
                                    onClick={() => setIsFree(false)}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                                        !isFree
                                            ? "bg-blue-50 dark:bg-blue-900/30 border-blue-400 text-blue-700 dark:text-blue-400"
                                            : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                                    }`}
                                >
                                    Paid
                                </button>
                            </div>

                            {isFree && (
                                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                    <p className="text-green-700 dark:text-green-400 text-sm font-medium">
                                        This course will be available for free. Students can enroll without spending any gems.
                                    </p>
                                </div>
                            )}

                            {!isFree && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                            Your Asking Price (Rs.)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={priceRs}
                                            onChange={(e) => setPriceRs(e.target.value)}
                                            placeholder="e.g. 3000"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-lg font-bold focus:outline-none focus:border-blue-400"
                                        />
                                    </div>

                                    {/* Discount */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                            Discount (%) <span className="font-normal text-gray-400">— optional, can change anytime</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="99"
                                                value={discountPercent}
                                                onChange={(e) => setDiscountPercent(e.target.value)}
                                                placeholder="e.g. 20"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-lg font-bold focus:outline-none focus:border-red-400 pr-12"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">%</span>
                                        </div>
                                    </div>

                                    {priceRsNum > 0 && (
                                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Info size={16} className="text-blue-500" />
                                                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">Price Breakdown</span>
                                            </div>
                                            <div className="space-y-1.5 text-sm">
                                                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                                    <span>Base price</span>
                                                    <span className="font-bold flex items-center gap-1">
                                                        <Gem size={14} className="text-yellow-500" fill="currentColor" />
                                                        {priceGems?.toLocaleString()} gems
                                                    </span>
                                                </div>
                                                {discountNum > 0 && (
                                                    <div className="flex justify-between text-red-500 dark:text-red-400">
                                                        <span>Discount ({discountNum}%)</span>
                                                        <span className="font-medium">− {(priceGems! - effectiveGems!).toLocaleString()} gems</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                                    <span>Student pays</span>
                                                    <span className="font-bold flex items-center gap-1">
                                                        <Gem size={14} className="text-yellow-500" fill="currentColor" />
                                                        {effectiveGems?.toLocaleString()} gems
                                                        <span className="text-gray-400 font-normal">≈ Rs. {effectiveRs}</span>
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                                    <span>App commission (10%)</span>
                                                    <span className="font-medium text-red-500">− Rs. {commissionRs}</span>
                                                </div>
                                                <div className="pt-2 border-t border-blue-200 dark:border-blue-700 flex justify-between font-bold text-gray-800 dark:text-gray-100">
                                                    <span>You receive</span>
                                                    <span className="text-green-600 dark:text-green-400">
                                                        {tutorEarnsGems.toLocaleString()} gems ≈ Rs. {tutorEarnsRs}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <Info size={13} className="mt-0.5 shrink-0" />
                                        <span>Gem conversion rate: 1 gem = Rs. {GEM_TO_RS}. Your earned gems can be redeemed from the Redeem page.</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Badge Customizer */}
                    {currentStep === 3 && (
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
                            onClick={handleSave}
                            isLoading={isSaving}
                            loadingText={isAlreadyPublished ? "Saving..." : "Publishing..."}
                        >
                            <span className="flex items-center gap-2">
                                {isAlreadyPublished ? (
                                    <><Save size={18} /> Save Changes</>
                                ) : (
                                    <><Send size={18} /> Publish Course</>
                                )}
                            </span>
                        </Button>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PrepublishPage;
