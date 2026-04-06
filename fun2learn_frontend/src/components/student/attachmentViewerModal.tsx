"use client";

import { useState, useEffect, ComponentType } from "react";
import { X, FileText, File } from "lucide-react";
import type { LessonAttachment } from "@/models/types";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "svg", "webp"]);
const VIDEO_EXTS = new Set(["mp4", "mov", "avi", "webm"]);
const AUDIO_EXTS = new Set(["mp3", "wav", "ogg"]);
const DOC_EXTS = new Set(["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "csv", "txt"]);

function getExtension(filename: string): string {
    return filename.split(".").pop()?.toLowerCase() ?? "";
}

function TextPreview({ url }: { url: string }) {
    const [content, setContent] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch(url)
            .then((r) => r.text())
            .then(setContent)
            .catch(() => setError(true));
    }, [url]);

    if (error) return <p className="text-red-500 text-sm">Failed to load file.</p>;
    if (content === null) return <p className="text-gray-500 text-sm">Loading...</p>;
    return (
        <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-full">
            {content}
        </pre>
    );
}

function CsvPreview({ url }: { url: string }) {
    const [rows, setRows] = useState<string[][] | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch(url)
            .then((r) => r.text())
            .then((text) => {
                const parsed = text
                    .trim()
                    .split("\n")
                    .map((line) => line.split(",").map((cell) => cell.trim()));
                setRows(parsed);
            })
            .catch(() => setError(true));
    }, [url]);

    if (error) return <p className="text-red-500 text-sm">Failed to load file.</p>;
    if (rows === null) return <p className="text-gray-500 text-sm">Loading...</p>;

    const headers = rows[0] ?? [];
    const data = rows.slice(1);

    return (
        <div className="overflow-auto max-h-full">
            <table className="text-sm border-collapse w-full">
                <thead>
                    <tr>
                        {headers.map((h, i) => (
                            <th
                                key={i}
                                className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-left text-gray-800 dark:text-gray-200 font-semibold"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, ri) => (
                        <tr key={ri} className="even:bg-gray-50 dark:even:bg-gray-800">
                            {row.map((cell, ci) => (
                                <td
                                    key={ci}
                                    className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300"
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function DocViewer({ url, fileName }: { url: string; fileName: string }) {
    // Dynamically import @cyntler/react-doc-viewer to avoid SSR issues
    const [DocViewerComponent, setDocViewerComponent] = useState<React.ComponentType<{
        documents: { uri: string; fileName?: string }[];
        pluginRenderers: unknown[];
        style?: React.CSSProperties;
        config?: { header: { disableHeader: boolean } };
    }> | null>(null);
    const [renderers, setRenderers] = useState<unknown[]>([]);
    const [importError, setImportError] = useState(false);

    useEffect(() => {
        import("@cyntler/react-doc-viewer")
            .then((mod) => {
                setDocViewerComponent(mod.default as unknown as ComponentType<any>);
                setRenderers(mod.DocViewerRenderers ?? []);
            })
            .catch(() => setImportError(true));
    }, []);

    if (importError) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <File size={48} className="text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Document preview unavailable.
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">
                    Run{" "}
                    <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                        npm install @cyntler/react-doc-viewer --legacy-peer-deps
                    </code>{" "}
                    to enable office document previews.
                </p>
            </div>
        );
    }

    if (!DocViewerComponent) {
        return <p className="text-gray-500 text-sm">Loading document viewer...</p>;
    }

    return (
        <DocViewerComponent
            documents={[{ uri: url, fileName }]}
            pluginRenderers={renderers}
            style={{ height: "100%", width: "100%" }}
            config={{ header: { disableHeader: true } }}
        />
    );
}

function AttachmentContent({ attachment }: { attachment: LessonAttachment }) {
    const ext = getExtension(attachment.file_name);
    const url = attachment.s3_url;

    if (IMAGE_EXTS.has(ext)) {
        return (
            <div className="flex items-center justify-center h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={url}
                    alt={attachment.file_name}
                    className="max-w-full max-h-full object-contain rounded-lg"
                />
            </div>
        );
    }

    if (VIDEO_EXTS.has(ext)) {
        return (
            <div className="flex items-center justify-center h-full">
                <video
                    controls
                    controlsList="nodownload"
                    className="max-w-full max-h-full rounded-lg"
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <source src={url} />
                    Your browser does not support video playback.
                </video>
            </div>
        );
    }

    if (AUDIO_EXTS.has(ext)) {
        return (
            <div className="flex items-center justify-center h-full">
                <audio controls controlsList="nodownload" className="w-full max-w-lg">
                    <source src={url} />
                    Your browser does not support audio playback.
                </audio>
            </div>
        );
    }

    if (ext === "pdf") {
        return (
            <iframe
                src={`${url}#toolbar=0&navpanes=0`}
                className="w-full h-full rounded-lg border-0"
                title={attachment.file_name}
            />
        );
    }

    if (ext === "txt") {
        return <TextPreview url={url} />;
    }

    if (ext === "csv") {
        return <CsvPreview url={url} />;
    }

    if (DOC_EXTS.has(ext)) {
        return <DocViewer url={url} fileName={attachment.file_name} />;
    }

    return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <FileText size={48} className="text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">
                Preview not available for <strong>.{ext}</strong> files.
            </p>
        </div>
    );
}

interface Props {
    attachment: LessonAttachment | null;
    onClose: () => void;
}

const AttachmentViewerModal = ({ attachment, onClose }: Props) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    useEffect(() => {
        if (attachment) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [attachment]);

    if (!attachment) return null;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/90">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-700 shrink-0">
                <span className="text-white font-medium text-sm truncate max-w-[80%]">
                    {attachment.file_name}
                </span>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors ml-4 shrink-0"
                    aria-label="Close viewer"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-auto p-4">
                <AttachmentContent attachment={attachment} />
            </div>
        </div>
    );
};

export default AttachmentViewerModal;
