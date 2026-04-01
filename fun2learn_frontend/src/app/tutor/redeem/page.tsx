"use client";

import { useState, useEffect } from "react";
import { Gem, Loader2, ArrowLeft, CircleCheck, Clock, XCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import { getTutorInventory, createRedeemRequest, getTutorRedeemRequests } from "@/api/tutorApi";
import type { RedeemRequest } from "@/models/types";

const GEM_TO_RS = 0.8;

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    pending: {
        label: "Pending",
        icon: <Clock size={14} />,
        className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    },
    paid: {
        label: "Paid",
        icon: <CircleCheck size={14} />,
        className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    },
    rejected: {
        label: "Rejected",
        icon: <XCircle size={14} />,
        className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    },
};

const RedeemPage = () => {
    const router = useRouter();
    const [currentGems, setCurrentGems] = useState(0);
    const [currentGemsValueRs, setCurrentGemsValueRs] = useState(0);
    const [requests, setRequests] = useState<RedeemRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [gemsInput, setGemsInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        const result = await getTutorRedeemRequests();
        if (result.success) {
            setRequests(result.requests ?? []);
            setCurrentGems(result.currentGems ?? 0);
            setCurrentGemsValueRs((result.currentGems ?? 0) * GEM_TO_RS);
        } else {
            toast.error(result.errorMessage || "Failed to load data");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const gemsToRedeem = parseInt(gemsInput) || 0;
    const rsValue = (gemsToRedeem * GEM_TO_RS).toFixed(2);

    const handleRedeem = async () => {
        if (gemsToRedeem <= 0) {
            toast.error("Please enter a valid number of gems");
            return;
        }
        if (gemsToRedeem < 100) {
            toast.error("Minimum redemption is 100 gems");
            return;
        }
        if (gemsToRedeem > currentGems) {
            toast.error(`You only have ${currentGems} gems available`);
            return;
        }

        setIsSubmitting(true);
        const result = await createRedeemRequest(gemsToRedeem);
        if (result.success) {
            toast.success(result.message || "Redeem request submitted!");
            setGemsInput("");
            fetchData();
        } else {
            toast.error(result.errorMessage || "Failed to submit request");
        }
        setIsSubmitting(false);
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

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
            <div className="sidebar-layout max-w-3xl mx-auto px-6 py-10 space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/tutor/dashboard")} className="shadow-none">
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="font-lilita text-3xl text-gray-800 dark:text-gray-100">Redeem Gems</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Convert your earned gems to Rs.</p>
                    </div>
                </div>

                {/* Current Balance */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Your Gem Balance</p>
                    <div className="flex items-end gap-4">
                        <div className="flex items-center gap-2">
                            <Gem size={36} className="text-yellow-500" fill="currentColor" />
                            <span className="text-4xl font-lilita text-gray-800 dark:text-gray-100">
                                {currentGems.toLocaleString()}
                            </span>
                            <span className="text-lg text-gray-500 dark:text-gray-400 mb-1">gems</span>
                        </div>
                        <span className="text-xl text-gray-400 mb-1">≈</span>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                            Rs. {currentGemsValueRs.toFixed(2)}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                        <Info size={12} /> Conversion rate: 1 gem = Rs. {GEM_TO_RS}. Gems are credited when students enroll in your paid courses (after 10% app commission).
                    </p>
                </div>

                {/* Redeem Form */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="font-lilita text-xl text-gray-800 dark:text-gray-100 mb-4">New Redeem Request</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Gems to Redeem
                            </label>
                            <input
                                type="number"
                                min="100"
                                max={currentGems}
                                value={gemsInput}
                                onChange={(e) => setGemsInput(e.target.value)}
                                placeholder="Minimum 100 gems"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-lg font-bold focus:outline-none focus:border-blue-400"
                            />
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Minimum: 100 gems (Rs. {(100 * GEM_TO_RS).toLocaleString()})</p>
                        </div>

                        {gemsToRedeem > 0 && (
                            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">You will receive</span>
                                    <span className="text-xl font-bold text-green-600 dark:text-green-400">Rs. {rsValue.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-gray-400">Gems to be deducted</span>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        {gemsToRedeem.toLocaleString()} gems
                                    </span>
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <Info size={12} /> Gems are held immediately on request. Admin will manually process payment. Rejected requests will refund your gems.
                        </p>

                        <Button
                            size="lg"
                            onClick={handleRedeem}
                            isLoading={isSubmitting}
                            loadingText="Submitting..."
                            className="w-full"
                        >
                            <span className="flex items-center gap-2">
                                <Gem size={18} /> Request Redemption
                            </span>
                        </Button>
                    </div>
                </div>

                {/* Past Requests */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="font-lilita text-xl text-gray-800 dark:text-gray-100 mb-4">Your Requests</h2>

                    {requests.length === 0 ? (
                        <p className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">No redeem requests yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {requests.map((req) => {
                                const cfg = statusConfig[req.status] ?? statusConfig.pending;
                                return (
                                    <div key={req.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <Gem size={14} className="text-yellow-500" fill="currentColor" />
                                                <span className="font-bold text-gray-800 dark:text-gray-100">
                                                    {req.gems_requested.toLocaleString()} gems
                                                </span>
                                                <span className="text-gray-400">→</span>
                                                <span className="font-bold text-green-600 dark:text-green-400">Rs. {req.amount_rs.toLocaleString()}</span>
                                            </div>
                                            <p className="text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString()}</p>
                                            {req.notes && <p className="text-xs text-gray-500 dark:text-gray-400 italic">{req.notes}</p>}
                                        </div>
                                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
                                            {cfg.icon} {cfg.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RedeemPage;
