"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import Button from "@/components/ui/button";

interface StreakModalProps {
    isOpen: boolean;
    onClose: () => void;
    streakCount: number;
}

const StreakModal = ({ isOpen, onClose, streakCount }: StreakModalProps) => {
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnimating(true);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center ${animating ? "animate-streak-pop" : ""}`}>
                {/* Fire icon with glow */}
                <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-orange-400/30 rounded-full blur-2xl scale-150" />
                    <div className={`relative ${animating ? "animate-streak-flame" : ""}`}>
                        <Flame
                            size={80}
                            className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]"
                            fill="currentColor"
                        />
                    </div>
                </div>

                {/* Streak count */}
                <div className="mb-2">
                    <span className="font-lilita text-6xl text-orange-500">
                        {streakCount}
                    </span>
                </div>

                <h2 className="font-lilita text-2xl text-gray-800 dark:text-gray-100 mb-1">
                    {streakCount === 1 ? "Streak started!" : "Day streak!"}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                    {streakCount === 1
                        ? "Complete a lesson every day to build your streak!"
                        : `You've been learning for ${streakCount} days in a row!`
                    }
                </p>

                <Button
                    variant="primary"
                    size="lg"
                    onClick={onClose}
                    className="w-full font-bold"
                >
                    Continue
                </Button>
            </div>
        </div>
    );
};

export default StreakModal;
