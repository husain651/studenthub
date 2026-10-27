import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded";
    
    const variants = {
      primary: "bg-[#C2410C] hover:bg-[#9A3412] text-white focus-visible:ring-[#C2410C]",
      secondary: "bg-[#ECEAE3] hover:bg-[#E4E1DA] text-[#191816] focus-visible:ring-[#78716C]",
      outline: "border border-[#E4E1DA] bg-white hover:bg-[#F4F3EF] text-[#191816] focus-visible:ring-[#C2410C]",
      ghost: "hover:bg-[#F4F3EF] text-[#191816] focus-visible:ring-[#C2410C]",
      danger: "bg-[#B91C1C] hover:bg-[#991B1B] text-white focus-visible:ring-[#B91C1C]",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-sm gap-2",
      lg: "h-11 px-6 text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
