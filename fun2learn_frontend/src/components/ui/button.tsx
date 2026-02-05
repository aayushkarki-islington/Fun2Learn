import type { ButtonHTMLAttributes } from "react";

interface ButtonProps {
    type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    children: React.ReactNode;
    isLoading?: boolean;
    loadingText?: string;
    disabled?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const variantClasses = {
    primary: 'bg-gradient text-white border-b-4 border-blue-800 hover:shadow-xl active:border-b-0 active:mt-1',
    secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600',
    danger: 'bg-red-500 text-white hover:bg-red-600 border-b-4 border-red-700 active:border-b-0 active:mt-1',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
};

const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
};

const Button = ({
    type = "button",
    variant = 'primary',
    size = 'md',
    className = "",
    children,
    isLoading = false,
    loadingText,
    disabled = false,
    onClick,
}: ButtonProps) => {
    const defaultLoadingText = loadingText || "Loading...";

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`
                rounded-lg font-semibold transition-all duration-150 shadow-lg
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                ${(isLoading || disabled) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-105'}
                ${className}
            `}
        >
            {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    {defaultLoadingText}
                </span>
            ) : children}
        </button>
    );
};

export default Button;
