"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { BrowseCourseSummary, CourseFeedback } from "@/models/types";
import {
    getCoursePublicDetail, getCourseReviews, getMyCourseFeedback,
    submitCourseFeedback, enrollInCourse, getStreak
} from "@/api/studentApi";
import { getMyEnrolledCourses } from "@/api/studentApi";
import Sidebar from "@/components/ui/sidebar";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import Link from "next/link";
import {
    ArrowLeft, GraduationCap, Users, Star, Gem, BookOpen,
    Layers, FileText, Tag, Award, MessageSquare, Pencil, CheckCircle
} from "lucide-react";

// ── Star display helper ────────────────────────────────────────────────────────
const StarDisplay = ({ rating, size = 16 }: { rating: number; size?: number }) => (
    <div className="flex">
        {[1, 2, 3, 4, 5].map(s => {
            const filled = s <= Math.floor(rating);
            const half = !filled && s === Math.ceil(rating) && rating % 1 >= 0.4;
            return (
                <Star
                    key={s}
                    size={size}
                    className={filled || half ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}
                    fill={filled ? "currentColor" : "none"}
                />
            );
        })}
    </div>
);

// ── Interactive star picker ────────────────────────────────────────────────────
const StarPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(s => (
                <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => onChange(s)}
                    className="focus:outline-none"
                >
                    <Star
                        size={28}
                        className={s <= (hovered || value) ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}
                        fill={s <= (hovered || value) ? "currentColor" : "none"}
                    />
                </button>
            ))}
        </div>
    );
};

// ── Effective price helper ─────────────────────────────────────────────────────
const getEffectivePrice = (course: BrowseCourseSummary) => {
    if (!course.price_gems) return 0;
    if (course.discount_percent && course.discount_percent > 0) {
        return Math.round(course.price_gems * (1 - course.discount_percent / 100));
    }
    return course.price_gems;
};

// ─────────────────────────────────────────────────────────────────────────────

export default function CourseDetailPage() {
    const { courseId } = useParams<{ courseId: string }>();
    const router = useRouter();

    const [course, setCourse] = useState<BrowseCourseSummary | null>(null);
    const [reviews, setReviews] = useState<CourseFeedback[]>([]);
    const [avgRating, setAvgRating] = useState<number | null>(null);
    const [reviewCount, setReviewCount] = useState(0);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Enrollment modal
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [studentGems, setStudentGems] = useState(0);
    const [isEnrolling, setIsEnrolling] = useState(false);

    // Review form
    const [myRating, setMyRating] = useState(0);
    const [myComment, setMyComment] = useState("");
    const [hasFeedback, setHasFeedback] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);

    useEffect(() => {
        loadAll();
    }, [courseId]);

    const loadAll = async () => {
        setIsLoading(true);
        const [detailRes, reviewsRes, enrolledRes] = await Promise.all([
            getCoursePublicDetail(courseId),
            getCourseReviews(courseId),
            getMyEnrolledCourses(),
        ]);

        if (detailRes.success && detailRes.course) {
            setCourse(detailRes.course);
        } else {
            toast.error(detailRes.errorMessage || "Failed to load course");
            router.back();
            return;
        }

        if (reviewsRes.success) {
            setReviews(reviewsRes.reviews ?? []);
            setAvgRating(reviewsRes.avgRating ?? null);
            setReviewCount(reviewsRes.reviewCount ?? 0);
        }

        if (enrolledRes.success && enrolledRes.courses) {
            const enrolled = enrolledRes.courses.some(c => c.id === courseId);
            setIsEnrolled(enrolled);

            if (enrolled) {
                const fbRes = await getMyCourseFeedback(courseId);
                if (fbRes.success && fbRes.hasFeedback) {
                    setHasFeedback(true);
                    setMyRating(fbRes.rating ?? 0);
                    setMyComment(fbRes.comment ?? "");
                }
            }
        }

        setIsLoading(false);
    };

    const handleEnrollClick = async () => {
        if (!course) return;
        if (course.price_gems && course.price_gems > 0) {
            const streakRes = await getStreak();
            if (streakRes.success) setStudentGems(streakRes.gems ?? 0);
            setShowEnrollModal(true);
        } else {
            await doEnroll();
        }
    };

    const doEnroll = async () => {
        setIsEnrolling(true);
        const result = await enrollInCourse(courseId);
        if (result.success) {
            toast.success("Enrolled successfully!");
            setIsEnrolled(true);
            setShowEnrollModal(false);
            router.push(`/student/course/${courseId}`);
        } else {
            toast.error(result.errorMessage || "Failed to enroll");
        }
        setIsEnrolling(false);
    };

    const handleSubmitReview = async () => {
        if (myRating === 0) { toast.error("Please select a rating"); return; }
        setIsSubmittingReview(true);
        const res = await submitCourseFeedback(courseId, myRating, myComment || undefined);
        if (res.success) {
            toast.success(hasFeedback ? "Review updated!" : "Review submitted!");
            setHasFeedback(true);
            setShowReviewForm(false);
            // Refresh reviews
            const reviewsRes = await getCourseReviews(courseId);
            if (reviewsRes.success) {
                setReviews(reviewsRes.reviews ?? []);
                setAvgRating(reviewsRes.avgRating ?? null);
                setReviewCount(reviewsRes.reviewCount ?? 0);
            }
        } else {
            toast.error(res.errorMessage || "Failed to submit review");
        }
        setIsSubmittingReview(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar />
                <div className="sidebar-layout flex items-center justify-center py-32">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
                </div>
            </div>
        );
    }

    if (!course) return null;

    const effectivePrice = getEffectivePrice(course);
    const hasDiscount = course.discount_percent && course.discount_percent > 0;
    const canAfford = studentGems >= effectivePrice;

    const ratingBars = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
        pct: reviewCount > 0 ? (reviews.filter(r => r.rating === star).length / reviewCount) * 100 : 0,
    }));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />

            <main className="sidebar-layout max-w-7xl mx-auto px-6 py-8">
                {/* Back */}
                <button
                    onClick={() => router.push("/student/browse")}
                    className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Browse
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ── Left / Main ─────────────────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Hero */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-gradient h-40 flex items-center justify-center text-white">
                                <GraduationCap size={80} strokeWidth={1.2} />
                            </div>
                            <div className="p-6">
                                <h1 className="font-lilita text-3xl text-gray-800 dark:text-gray-100 mb-1">
                                    {course.name}
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                                    by&nbsp;
                                    <Link
                                        href={`/users/profile/${course.tutor_id}`}
                                    >
                                        {course.tutor_name}
                                    </Link>
                                </p>

                                {/* Rating summary inline */}
                                <div className="flex items-center gap-3 mb-4">
                                    {avgRating ? (
                                        <>
                                            <span className="text-2xl font-bold text-yellow-500">{avgRating.toFixed(1)}</span>
                                            <StarDisplay rating={avgRating} size={18} />
                                            <span className="text-sm text-gray-500 dark:text-gray-400">({reviewCount} {reviewCount === 1 ? "review" : "reviews"})</span>
                                        </>
                                    ) : (
                                        <span className="text-sm text-gray-400 italic">No reviews yet</span>
                                    )}
                                    <span className="text-gray-300 dark:text-gray-600">·</span>
                                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                        <Users size={14} /> {course.enrollment_count.toLocaleString()} enrolled
                                    </div>
                                </div>

                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {course.description}
                                </p>
                            </div>
                        </div>

                        {/* Tags */}
                        {course.tags.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                                <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <Tag size={16} /> Topics
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {course.tags.map(tag => (
                                        <span key={tag.id} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-full font-medium">
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Course contents */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                            <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <BookOpen size={16} /> Course Contents
                            </h2>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                    <Layers size={24} className="text-blue-500 mx-auto mb-1" />
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{course.unit_count}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Units</div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                                    <FileText size={24} className="text-green-500 mx-auto mb-1" />
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{course.chapter_count}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Chapters</div>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                                    <BookOpen size={24} className="text-purple-500 mx-auto mb-1" />
                                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{course.lesson_count}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Lessons</div>
                                </div>
                            </div>
                        </div>

                        {/* ── Reviews ──────────────────────────────────────── */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                            <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
                                <MessageSquare size={16} /> Reviews
                            </h2>

                            {reviewCount > 0 ? (
                                <div className="flex gap-8 mb-6 items-center">
                                    {/* Big rating number */}
                                    <div className="text-center shrink-0">
                                        <div className="text-6xl font-bold text-gray-800 dark:text-gray-100 leading-none">{avgRating?.toFixed(1)}</div>
                                        <StarDisplay rating={avgRating ?? 0} size={20} />
                                        <div className="text-sm text-gray-400 mt-1">{reviewCount} {reviewCount === 1 ? "review" : "reviews"}</div>
                                    </div>
                                    {/* Rating bars */}
                                    <div className="flex-1 space-y-1.5">
                                        {ratingBars.map(({ star, count, pct }) => (
                                            <div key={star} className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400 w-4">{star}</span>
                                                <Star size={13} className="text-yellow-400 shrink-0" fill="currentColor" />
                                                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="text-gray-400 w-6 text-right">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm italic mb-5">No reviews yet. Be the first to review!</p>
                            )}

                            {/* Write / Edit review (enrolled only) */}
                            {isEnrolled && (
                                <div className="mb-5">
                                    {!showReviewForm ? (
                                        <button
                                            onClick={() => setShowReviewForm(true)}
                                            className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            {hasFeedback ? <><Pencil size={14} /> Edit your review</> : <><Star size={14} /> Write a review</>}
                                        </button>
                                    ) : (
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                {hasFeedback ? "Update your review" : "Your review"}
                                            </p>
                                            <StarPicker value={myRating} onChange={setMyRating} />
                                            <textarea
                                                value={myComment}
                                                onChange={e => setMyComment(e.target.value)}
                                                placeholder="Share your experience (optional)"
                                                rows={3}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 resize-none focus:outline-none focus:border-blue-400"
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="secondary" size="sm" onClick={() => setShowReviewForm(false)}>Cancel</Button>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={handleSubmitReview}
                                                    isLoading={isSubmittingReview}
                                                    loadingText="Submitting..."
                                                >
                                                    {hasFeedback ? "Update" : "Submit"}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Review list */}
                            {reviews.length > 0 && (
                                <div className="space-y-4 divide-y divide-gray-100 dark:divide-gray-700">
                                    {reviews.map(review => (
                                        <div key={review.id} className="pt-4 first:pt-0">
                                            <div className="flex items-start justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient flex items-center justify-center text-white text-sm font-bold">
                                                        {review.user_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{review.user_name}</p>
                                                        <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                                                    </div>
                                                </div>
                                                <StarDisplay rating={review.rating} size={14} />
                                            </div>
                                            {review.comment && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 ml-10">{review.comment}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right / Sticky Card ──────────────────────────────── */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 lg:sticky lg:top-6 space-y-5">
                            {/* Price */}
                            <div>
                                {course.price_gems ? (
                                    <div className="space-y-1">
                                        {hasDiscount && (
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600">
                                                    -{course.discount_percent}% OFF
                                                </span>
                                                <span className="text-sm line-through text-gray-400 flex items-center gap-1">
                                                    <Gem size={12} fill="currentColor" /> {course.price_gems.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Gem size={28} className="text-yellow-500" fill="currentColor" />
                                            <span className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                                                {effectivePrice.toLocaleString()}
                                            </span>
                                            <span className="text-gray-500 dark:text-gray-400 text-sm">gems</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">Free</div>
                                )}
                            </div>

                            {/* CTA */}
                            {isEnrolled ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-semibold">
                                        <CheckCircle size={16} /> You're enrolled
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="w-full"
                                        onClick={() => router.push(`/student/course/${courseId}`)}
                                    >
                                        Continue Learning
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="primary"
                                    size="lg"
                                    className="w-full"
                                    onClick={handleEnrollClick}
                                    isLoading={isEnrolling}
                                    loadingText="Enrolling..."
                                >
                                    {course.price_gems ? (
                                        <span className="flex items-center gap-2 justify-center">
                                            <Gem size={16} fill="currentColor" /> Enroll Now
                                        </span>
                                    ) : "Enroll Free"}
                                </Button>
                            )}

                            <hr className="border-gray-100 dark:border-gray-700" />

                            {/* Stats */}
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-2"><Layers size={15} className="text-blue-500" /> {course.unit_count} Units</div>
                                <div className="flex items-center gap-2"><FileText size={15} className="text-green-500" /> {course.chapter_count} Chapters</div>
                                <div className="flex items-center gap-2"><BookOpen size={15} className="text-purple-500" /> {course.lesson_count} Lessons</div>
                                <div className="flex items-center gap-2"><Users size={15} className="text-orange-500" /> {course.enrollment_count.toLocaleString()} Enrolled</div>
                            </div>

                            {/* Badge */}
                            {course.badge && (
                                <>
                                    <hr className="border-gray-100 dark:border-gray-700" />
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient rounded-xl flex items-center justify-center text-white">
                                            <Award size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Certificate</p>
                                            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{course.badge.name}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Enrollment confirmation modal */}
            <Modal isOpen={showEnrollModal} onClose={() => setShowEnrollModal(false)} title="Confirm Enrollment">
                <div className="space-y-4">
                    <p className="text-gray-700 dark:text-gray-200 font-semibold text-lg">{course.name}</p>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 space-y-2">
                        {hasDiscount && (
                            <>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Original price</span>
                                    <span className="line-through text-gray-400 flex items-center gap-1">
                                        <Gem size={12} fill="currentColor" /> {course.price_gems!.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Discount</span>
                                    <span className="text-red-500 font-semibold">-{course.discount_percent}%</span>
                                </div>
                            </>
                        )}
                        <div className="flex justify-between font-bold text-base border-t border-yellow-200 dark:border-yellow-800 pt-2">
                            <span className="text-gray-700 dark:text-gray-200">You pay</span>
                            <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                <Gem size={14} fill="currentColor" /> {effectivePrice.toLocaleString()} gems
                            </span>
                        </div>
                    </div>
                    <div className={`rounded-xl p-3 flex justify-between items-center text-sm ${canAfford ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                        <span className="text-gray-600 dark:text-gray-400">Your balance</span>
                        <span className={`font-semibold flex items-center gap-1 ${canAfford ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                            <Gem size={13} fill="currentColor" /> {studentGems.toLocaleString()} gems
                        </span>
                    </div>
                    {!canAfford && <p className="text-sm text-red-500 text-center">You don't have enough gems to enroll.</p>}
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowEnrollModal(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            size="md"
                            className="flex-1"
                            onClick={doEnroll}
                            disabled={!canAfford}
                            isLoading={isEnrolling}
                            loadingText="Enrolling..."
                        >
                            Confirm
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
