import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
}

export function Alert({ className, variant = "info", title, children, ...props }: AlertProps) {
  const icons = {
    info: <Info className="h-4 w-4 text-[#0369A1] flex-shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4 w-4 text-[#15803D] flex-shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-[#B45309] flex-shrink-0 mt-0.5" />,
    danger: <AlertCircle className="h-4 w-4 text-[#B91C1C] flex-shrink-0 mt-0.5" />,
  };

  const variants = {
    info: "bg-[#F0F9FF] border-[#BAE6FD] text-[#0369A1]",
    success: "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]",
    warning: "bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]",
    danger: "bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]",
  };

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded border p-3.5 text-sm",
        variants[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-semibold leading-none">{title}</h5>}
        <div className="text-xs leading-relaxed text-inherit opacity-90">{children}</div>
      </div>
    </div>
  );
}
