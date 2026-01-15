import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface DropdownProps {
    value: string;
    options: string[];
    onChange: (value: string) => void;
    icon?: React.ComponentType<{ className?: string; size?: number; [key: string]: any }>;
    placeholder?: string;
    className?: string;
}

const Dropdown = ({
    value,
    options,
    onChange,
    icon: Icon,
    placeholder = "Select an option",
    className = ""
}: DropdownProps) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleOptionSelect = (selectedValue: string) => {
        onChange(selectedValue);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className={`relative inline-block rounded-md border border-custom-gray ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-primary rounded-lg transition-colors min-w-full"
            >
                {Icon && (
                    <Icon 
                        size={20} 
                        className="shrink-0"
                    />
                )}
                <span className="capitalize flex-1 text-left">
                    {value || placeholder}
                </span>
                <ChevronDown 
                    size={16} 
                    className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-gray-100 dark:bg-indigo-900 rounded-lg shadow-lg overflow-hidden z-10">
                    {options.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => handleOptionSelect(option)}
                            className={`flex items-center gap-3 px-4 py-2 w-full hover:bg-gray-200 dark:hover:bg-indigo-800 transition-colors ${
                                value === option ? 'bg-gray-300 dark:bg-indigo-800' : ''
                            }`}
                        >
                            {Icon && (
                                <Icon 
                                    size={20} 
                                    className="shrink-0"
                                />
                            )}
                            <span className="capitalize">{option}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dropdown;