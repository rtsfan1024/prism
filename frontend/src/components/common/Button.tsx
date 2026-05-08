import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<string, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50",
  secondary:
    "bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400 disabled:opacity-50",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:opacity-50",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50",
};

const sizeClasses: Record<string, string> = {
  sm: "px-2 py-1 text-sm rounded",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-lg",
};

export default function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
