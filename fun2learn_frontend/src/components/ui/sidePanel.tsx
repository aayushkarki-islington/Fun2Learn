"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/button";

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    width?: string;
}

const SidePanel = ({ isOpen, onClose, title, subtitle, children, footer, width = "w-[500px]" }: SidePanelProps) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) onClose();
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`relative ${width} max-w-full h-full bg-white dark:bg-gray-800 shadow-2xl flex flex-col animate-slide-in`}>
                {/* Header */}
                <div className="bg-gradient text-white p-6 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="font-lilita text-2xl">{title}</h2>
                        {subtitle && <p className="text-blue-100 text-sm mt-1">{subtitle}</p>}
                    </div>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-10 h-10 p-0 shadow-none bg-white/20 hover:bg-white/30 text-white"
                    >
                        <X size={20} />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 flex gap-3 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SidePanel;
