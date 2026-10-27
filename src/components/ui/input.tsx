import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, hint, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#57534E] uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            "flex h-9 w-full rounded border border-[#E4E1DA] bg-white px-3 py-1.5 text-sm text-[#191816] placeholder:text-[#A8A29E]",
            "transition-colors focus:border-[#C2410C] focus:outline-none focus:ring-1 focus:ring-[#C2410C]",
            "disabled:cursor-not-allowed disabled:bg-[#F4F3EF] disabled:text-[#A8A29E]",
            error && "border-[#B91C1C] focus:border-[#B91C1C] focus:ring-[#B91C1C]",
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-[#78716C]">{hint}</p>}
        {error && <p className="text-xs text-[#B91C1C] font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
