import type { ButtonHTMLAttributes } from "react";

interface ButtonProps {
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  className?: string;
  text: string;
  onClick?: () => void;
}

const BlockButton = ({
  type = "button",
  className = "",
  text,
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
          bg-gradient
          px-4 py-3 text-white
          transition-transform duration-150
          border-b-8 border-[#292D65]
          active:border-b-0
          active:mt-2
          cursor-pointer
          ${className}
        `}
      >
        {text}
      </button>
    </div>
  );
};

export default BlockButton;