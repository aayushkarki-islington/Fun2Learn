"use client";

import { useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import Button from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";
import { initiatePayment } from "@/api/studentApi";
import { Gem, X, ShoppingBag, Zap, Tag } from "lucide-react";

interface GemPackage {
    id: string;
    gems: number;
    priceRs: number;
    originalPriceRs: number;
    label: string;
    popular?: boolean;
    bestValue?: boolean;
}

const GEM_PACKAGES: GemPackage[] = [
    {
        id: "200",
        gems: 200,
        priceRs: 200,
        originalPriceRs: 200,
        label: "Starter",
    },
    {
        id: "500",
        gems: 500,
        priceRs: 480,
        originalPriceRs: 500,
        label: "Popular",
        popular: true,
    },
    {
        id: "1000",
        gems: 1000,
        priceRs: 920,
        originalPriceRs: 1000,
        label: "Value",
    },
    {
        id: "5000",
        gems: 5000,
        priceRs: 4200,
        originalPriceRs: 5000,
        label: "Pro",
        bestValue: true,
    },
    {
        id: "10000",
        gems: 10000,
        priceRs: 9000,
        originalPriceRs: 10000,
        label: "Ultimate",
    },
];

function discountPercent(pkg: GemPackage) {
    if (pkg.priceRs === pkg.originalPriceRs) return 0;
    return Math.round(((pkg.originalPriceRs - pkg.priceRs) / pkg.originalPriceRs) * 100);
}

function submitEsewaForm(data: {
    amount: string;
    tax_amount: string;
    total_amount: string;
    transaction_uuid: string;
    product_code: string;
    product_service_charge: string;
    product_delivery_charge: string;
    success_url: string;
    failure_url: string;
    signed_field_names: string;
    signature: string;
    epay_url: string;
}) {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = data.epay_url;

    const fields: Record<string, string> = {
        amount: data.amount,
        tax_amount: data.tax_amount,
        total_amount: data.total_amount,
        transaction_uuid: data.transaction_uuid,
        product_code: data.product_code,
        product_service_charge: data.product_service_charge,
        product_delivery_charge: data.product_delivery_charge,
        success_url: data.success_url,
        failure_url: data.failure_url,
        signed_field_names: data.signed_field_names,
        signature: data.signature,
    };

    for (const [key, value] of Object.entries(fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
}

/* ── Payment Modal ── */
interface PaymentModalProps {
    pkg: GemPackage;
    onClose: () => void;
}

const PaymentModal = ({ pkg, onClose }: PaymentModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const discount = discountPercent(pkg);

    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
    };

    const handleEsewaPay = async () => {
        setIsLoading(true);
        const result = await initiatePayment(pkg.id);
        console.log("💳 Recieved payment information:", result);
        sessionStorage.setItem("esewa_debug", JSON.stringify(result));
        if (!result.success || !result.data) {
            toast.error(result.errorMessage || "Failed to initiate payment");
            setIsLoading(false);
            return;
        }
        // Hand off to eSewa — browser navigates away, no need to reset loading
        submitEsewaForm(result.data);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={handleBackdrop}
        >
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gradient text-white px-6 py-4 flex items-center justify-between">
                    <h2 className="font-lilita text-2xl">Checkout</h2>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Order summary */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                            <Gem size={28} className="text-yellow-500" fill="currentColor" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">
                                {pkg.gems.toLocaleString()} Gems
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {pkg.label} Pack
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">
                                Rs {pkg.priceRs.toLocaleString()}
                            </p>
                            {discount > 0 && (
                                <p className="text-xs text-gray-400 line-through">
                                    Rs {pkg.originalPriceRs.toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-700" />

                    {/* Payment method */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                            Payment Method
                        </p>

                        <button
                            onClick={handleEsewaPay}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl border-2 border-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-green-600 border-t-transparent" />
                            ) : (
                                <Image
                                    src="/images/esewa-logo.webp"
                                    alt="eSewa"
                                    width={32}
                                    height={32}
                                />
                            )}
                            <span className="font-bold text-green-700 dark:text-green-300 text-base">
                                {isLoading ? "Redirecting to eSewa..." : "Pay via eSewa"}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Gem Package Card ── */
const PackageCard = ({ pkg, onBuy }: { pkg: GemPackage; onBuy: (pkg: GemPackage) => void }) => {
    const discount = discountPercent(pkg);
    const isHighlighted = pkg.popular || pkg.bestValue;

    return (
        <div className={`
            relative bg-white dark:bg-gray-800 rounded-2xl p-5 border-2 shadow-sm
            transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
            ${isHighlighted
                ? "border-blue-400 dark:border-blue-600"
                : "border-gray-100 dark:border-gray-700"
            }
        `}>
            {/* Badge */}
            {(pkg.popular || pkg.bestValue) && (
                <div className={`
                    absolute -top-3 left-1/2 -translate-x-1/2
                    px-3 py-0.5 rounded-full text-xs font-bold text-white whitespace-nowrap
                    ${pkg.bestValue ? "bg-purple-500" : "bg-blue-500"}
                `}>
                    {pkg.bestValue ? "Best Value" : "Most Popular"}
                </div>
            )}

            {/* Gem display */}
            <div className="flex items-center justify-center mb-4 mt-1">
                <div className="relative">
                    <Gem
                        size={48}
                        className="text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                        fill="currentColor"
                    />
                    {pkg.gems >= 1000 && (
                        <Zap
                            size={16}
                            className="absolute -top-1 -right-1 text-orange-500"
                            fill="currentColor"
                        />
                    )}
                </div>
            </div>

            {/* Gem count */}
            <div className="text-center mb-1">
                <span className="font-lilita text-3xl text-gray-800 dark:text-gray-100">
                    {pkg.gems.toLocaleString()}
                </span>
                <span className="ml-1.5 text-sm font-bold text-gray-500 dark:text-gray-400">
                    gems
                </span>
            </div>

            {/* Pack label */}
            <p className="text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
                {pkg.label} Pack
            </p>

            {/* Discount badge */}
            {discount > 0 && (
                <div className="flex items-center justify-center gap-1.5 mb-3">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30">
                        <Tag size={11} className="text-green-600 dark:text-green-400" />
                        <span className="text-xs font-bold text-green-600 dark:text-green-400">
                            {discount}% off
                        </span>
                    </div>
                    <span className="text-xs text-gray-400 line-through">
                        Rs {pkg.originalPriceRs.toLocaleString()}
                    </span>
                </div>
            )}

            {/* Price + CTA */}
            <div className="space-y-2">
                <p className="text-center font-bold text-xl text-gray-800 dark:text-gray-100">
                    Rs {pkg.priceRs.toLocaleString()}
                </p>
                <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={() => onBuy(pkg)}
                >
                    Buy Now
                </Button>
            </div>
        </div>
    );
};

/* ── Marketplace Page ── */
const MarketplacePage = () => {
    const [selectedPkg, setSelectedPkg] = useState<GemPackage | null>(null);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />

            <main className="sidebar-layout max-w-4xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <ShoppingBag size={32} className="text-blue-500" />
                        <h2 className="font-lilita text-4xl text-gray-800 dark:text-gray-100">
                            Gem Shop
                        </h2>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                        Purchase gems to unlock power-ups and more. Bigger packs = better value!
                    </p>
                </div>

                {/* Info strip */}
                <div className="flex items-center gap-3 mb-8 px-5 py-3.5 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <Gem size={20} className="text-yellow-500 shrink-0" fill="currentColor" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                        Gems are the in-app currency for Fun2Learn — use them for upcoming power-ups, boosts, and exclusive content.
                    </p>
                </div>

                {/* Package grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mt-4">
                    {GEM_PACKAGES.map((pkg) => (
                        <PackageCard key={pkg.id} pkg={pkg} onBuy={setSelectedPkg} />
                    ))}
                </div>

                {/* Conversion note */}
                <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
                    Base rate: 1 gem = Rs 1 &bull; Bundle discounts applied at checkout
                </p>
            </main>

            {selectedPkg && (
                <PaymentModal pkg={selectedPkg} onClose={() => setSelectedPkg(null)} />
            )}
        </div>
    );
};

export default MarketplacePage;
