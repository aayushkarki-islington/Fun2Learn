"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { Gem, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/button";

const SuccessContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const gems = searchParams.get("gems");

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 max-w-sm w-full text-center border border-gray-100 dark:border-gray-700">
                {/* Success icon */}
                <div className="flex items-center justify-center mb-5">
                    <div className="relative">
                        <Gem size={56} className="text-yellow-400 drop-shadow-[0_0_16px_rgba(250,204,21,0.6)]" fill="currentColor" />
                        <CheckCircle2
                            size={24}
                            className="absolute -bottom-1 -right-1 text-green-500 bg-white dark:bg-gray-800 rounded-full"
                            fill="currentColor"
                        />
                    </div>
                </div>

                <h1 className="font-lilita text-3xl text-gray-800 dark:text-gray-100 mb-2">
                    Payment Successful!
                </h1>

                {gems && (
                    <div className="flex items-center justify-center gap-2 my-4 px-4 py-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
                        <Gem size={18} className="text-yellow-500" fill="currentColor" />
                        <span className="font-bold text-yellow-600 dark:text-yellow-400 text-lg">
                            +{Number(gems).toLocaleString()} gems added
                        </span>
                    </div>
                )}

                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                    Your gems have been credited to your account.
                </p>

                <div className="space-y-2">
                    <Button variant="primary" size="md" className="w-full" onClick={() => router.push("/student/marketplace")}>
                        Back to Shop
                    </Button>
                    <Button variant="secondary" size="md" className="w-full" onClick={() => router.push("/student/mycourses")}>
                        Continue Learning
                    </Button>
                </div>
            </div>
        </div>
    );
};

const PaymentSuccessPage = () => (
    <Suspense>
        <SuccessContent />
    </Suspense>
);

export default PaymentSuccessPage;
