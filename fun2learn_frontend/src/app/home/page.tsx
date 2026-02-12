"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/user-context";

const HomePage = () => {
    const router = useRouter();
    const { user, loading } = useUser();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        if (user.role === "tutor") {
            router.replace("/tutor/dashboard");
        } else {
            router.replace("/student/mycourses");
        }
    }, [user, loading, router]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
    );
};

export default HomePage;
