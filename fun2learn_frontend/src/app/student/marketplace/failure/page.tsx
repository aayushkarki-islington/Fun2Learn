"use client";

import { useRouter } from "next/navigation";
import { XCircle, Gem } from "lucide-react";
import Button from "@/components/ui/button";

const PaymentFailurePage = () => {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 max-w-sm w-full text-center border border-gray-100 dark:border-gray-700">
                {/* Failure icon */}
                <div className="flex items-center justify-center mb-5">
                    <XCircle size={56} className="text-red-400" />
                </div>

                <h1 className="font-lilita text-3xl text-gray-800 dark:text-gray-100 mb-2">
                    Payment Failed
                </h1>

                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                    Your payment was not completed. No gems have been deducted. Please try again.
                </p>

                <div className="space-y-2">
                    <Button
                        variant="primary"
                        size="md"
                        className="w-full"
                        onClick={() => router.push("/student/marketplace")}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Gem size={16} fill="currentColor" />
                            Try Again
                        </span>
                    </Button>
                    <Button
                        variant="secondary"
                        size="md"
                        className="w-full"
                        onClick={() => router.push("/student/mycourses")}
                    >
                        Back to Learning
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PaymentFailurePage;
