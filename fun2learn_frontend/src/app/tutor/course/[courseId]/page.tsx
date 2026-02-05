"use client";

import { useParams, useRouter } from "next/navigation";
import DashboardHeader from "@/components/ui/dashboardHeader";
import Button from "@/components/ui/button";
import { Construction } from "lucide-react";

const CourseEditorPage = () => {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
            <DashboardHeader userName="Tutor" userInitials="T" />

            <main className="max-w-7xl mx-auto px-6 py-8">
                <Button
                    onClick={() => router.push('/tutor/dashboard')}
                    variant="ghost"
                    size="md"
                    className="mb-6"
                >
                    ← Back to Dashboard
                </Button>

                <div className="text-center py-20">
                    <div className="mb-6 flex justify-center">
                        <Construction size={96} className="text-yellow-500" strokeWidth={1.5} />
                    </div>
                    <h1 className="font-lilita text-4xl text-gray-800 dark:text-gray-100 mb-4">
                        Course Editor
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Course ID: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{courseId}</code>
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Roadmap editor coming soon!
                    </p>
                    <div className="max-w-xs mx-auto">
                        <Button
                            onClick={() => router.push('/tutor/dashboard')}
                            className="font-lilita text-lg w-full"
                        >
                            Back To Dashboard
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CourseEditorPage;
