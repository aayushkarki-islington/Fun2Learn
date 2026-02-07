"use client";

import { Pencil, Trash2 } from "lucide-react";
import Button from "@/components/ui/button";
import type { UnitDetail } from "@/models/types";

interface UnitHeaderProps {
    unit: UnitDetail;
    onEdit: () => void;
    onDelete: () => void;
}

const UnitHeader = ({ unit, onEdit, onDelete }: UnitHeaderProps) => {
    const chapterCount = unit.chapters.length;
    const lessonCount = unit.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);
    const questionCount = unit.chapters.reduce(
        (acc, ch) => acc + ch.lessons.reduce((a, l) => a + l.question_count, 0), 0
    );

    return (
        <div className="bg-gradient rounded-3xl p-8 text-white shadow-2xl mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24" />
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h2 className="font-lilita text-4xl mb-2">UNIT {unit.unit_index}</h2>
                        <h3 className="text-2xl font-bold mb-2">{unit.name}</h3>
                        {unit.description && (
                            <p className="text-blue-100 text-sm">{unit.description}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onEdit}
                            className="shadow-none bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm flex items-center gap-1"
                        >
                            <Pencil size={16} /> Edit
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDelete}
                            className="shadow-none bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>
                </div>
                <div className="flex gap-4 mt-6">
                    <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                        <span className="font-bold">{chapterCount}</span> Chapters
                    </div>
                    <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                        <span className="font-bold">{lessonCount}</span> Lessons
                    </div>
                    <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                        <span className="font-bold">{questionCount}</span> Questions
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnitHeader;
