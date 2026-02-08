"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CourseSummary } from "@/models/types";
import { getCourses, createCourse, deleteCourse } from "@/api/courseApi";
import DashboardHeader from "@/components/ui/dashboardHeader";
import StatCard from "@/components/ui/statCard";
import CourseCard from "@/components/ui/courseCard";
import Modal from "@/components/ui/modal";
import CreateCourseForm from "@/components/createCourseForm";
import Button from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import { useUser } from "@/context/user-context";

const TutorDashboard = () => {
    const router = useRouter();
    const { user } = useUser();
    const [courses, setCourses] = useState<CourseSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const getInitials = (name: string) => {
        return name.split(" ").map(part => part[0]).join("").toUpperCase().slice(0, 2);
    };

    // Load courses on mount
    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        setIsLoading(true);
        const result = await getCourses();

        if (result.success && result.courses) {
            setCourses(result.courses);
        } else {
            toast.error(result.errorMessage || "Failed to load courses");
        }

        setIsLoading(false);
    };

    const handleCreateCourse = async (name: string, description: string) => {
        setIsCreating(true);

        const result = await createCourse(name, description);

        if (result.success && result.courseId) {
            toast.success("Course created successfully!");
            setIsCreateModalOpen(false);
            loadCourses();
            // Navigate to course editor
            router.push(`/tutor/course/${result.courseId}`);
        } else {
            toast.error(result.errorMessage || "Failed to create course");
        }

        setIsCreating(false);
    };

    const handleDeleteCourse = async (courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        if (!course) return;

        const confirmed = window.confirm(
            `Are you sure you want to delete "${course.name}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        const result = await deleteCourse(courseId);

        if (result.success) {
            toast.success("Course deleted successfully");
            loadCourses();
        } else {
            toast.error(result.errorMessage || "Failed to delete course");
        }
    };

    // Calculate stats
    const totalCourses = courses.length;
    const publishedCourses = courses.filter(c => c.status === 'published').length;
    const draftCourses = courses.filter(c => c.status === 'draft').length;
    const totalQuestions = courses.reduce((sum, c) => sum + c.question_count, 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <DashboardHeader
                userName={user?.full_name ?? "Tutor"}
                userInitials={user ? getInitials(user.full_name) : "T"}
                imageUrl={user?.image_path}
            />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Top Section */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="font-lilita text-4xl text-gray-800 dark:text-gray-100">
                            My Courses
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage and create your courses
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        variant="primary"
                        size="lg"
                        className="font-bold"
                    >
                        <div className="flex items-center">
                            <Plus size={20} className="mr-2" />
                            Create New Course
                        </div>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard value={totalCourses} label="Total Courses" color="blue" />
                    <StatCard value={publishedCourses} label="Published" color="green" />
                    <StatCard value={draftCourses} label="Drafts" color="yellow" />
                    <StatCard value={totalQuestions} label="Total Questions" color="purple" />
                </div>

                {/* Courses Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading courses...</p>
                        </div>
                    </div>
                ) : courses.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="mb-6 flex justify-center">
                            <BookOpen size={96} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                        </div>
                        <h3 className="font-bold text-2xl text-gray-800 dark:text-gray-100 mb-2">
                            No Courses Yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Get started by creating your first course
                        </p>
                        <div className="max-w-xs mx-auto">
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="text-lg w-full"
                            >
                                Create your first course
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                onDelete={handleDeleteCourse}
                            />
                        ))}

                        {/* Add Course Card */}
                        <div
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 group min-h-100"
                        >
                            <div className="text-center p-8">
                                <div className="mb-4 flex justify-center group-hover:scale-110 transition-transform">
                                    <Plus size={64} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                                </div>
                                <h3 className="font-bold text-xl text-gray-600 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400">
                                    Create New Course
                                </h3>
                                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                                    Start building your next course
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Create Course Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Course"
            >
                <CreateCourseForm
                    onSubmit={handleCreateCourse}
                    onCancel={() => setIsCreateModalOpen(false)}
                    isLoading={isCreating}
                />
            </Modal>
        </div>
    );
};

export default TutorDashboard;
