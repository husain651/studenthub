import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger" | "verified";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-[#FFEDD5] text-[#9A3412] border-transparent font-medium",
    secondary: "bg-[#F4F3EF] text-[#57534E] border-transparent",
    outline: "border border-[#E4E1DA] text-[#57534E] bg-white",
    success: "bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7]",
    warning: "bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]",
    danger: "bg-[#FEF2F2] text-[#B91C1C] border-[#FEE2E2]",
    verified: "bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE] font-medium",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs border transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
