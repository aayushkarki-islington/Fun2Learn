import type { ButtonHTMLAttributes } from "react";

interface ButtonProps {
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  className?: string;
  text: string;
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  onClick?: () => void;
}

const BlockButton = ({
  type = "button",
  className = "",
  text,
  isLoading = false,
  loadingText,
  disabled = false,
  onClick,
}: ButtonProps) => {
  return (
    <div className="relative w-full">

      {/* Main button */}
      <button
        type={type}
        onClick={onClick}
        className={`
          relative z-10 w-full rounded-xl
          ${(isLoading || disabled) ?
            "cursor-not-allowed bg-gray-500 opacity-60" : 
            "cursor-pointer bg-gradient border-b-8 border-[#292D65] active:mt-2"
          }
          px-4 py-3 text-white
          transition-transform duration-150
          active:border-b-0
          ${(!isLoading && !disabled) && ""}
          ${className}
        `}
        disabled={disabled || isLoading}
      >
        {(isLoading && loadingText) ? loadingText : text}
      </button>
    </div>
  );
};

export default BlockButton;