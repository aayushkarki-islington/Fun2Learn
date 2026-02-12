"use client";

interface ProgressBarProps {
    percent: number;
    size?: 'sm' | 'md';
    showLabel?: boolean;
    className?: string;
}

const ProgressBar = ({ percent, size = 'md', showLabel = true, className = '' }: ProgressBarProps) => {
    const height = size === 'sm' ? 'h-2' : 'h-3';
    const clamped = Math.min(100, Math.max(0, percent));

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className={`flex-1 bg-gray-200 dark:bg-gray-700 rounded-full ${height}`}>
                <div
                    className={`bg-gradient ${height} rounded-full transition-all duration-500`}
                    style={{ width: `${clamped}%` }}
                />
            </div>
            {showLabel && (
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 min-w-12 text-right">
                    {Math.round(clamped)}%
                </span>
            )}
        </div>
    );
};

export default ProgressBar;
