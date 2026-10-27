"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-none transition-opacity"
        onClick={onClose}
      />
      {/* Modal Container */}
      <div
        className={cn(
          "relative z-50 w-full max-w-lg rounded-md border border-[#E4E1DA] bg-white p-6 shadow-md transition-all",
          className
        )}
      >
        <div className="flex items-start justify-between border-b border-[#F4F3EF] pb-4">
          <div>
            {title && <h3 className="text-base font-semibold text-[#191816]">{title}</h3>}
            {description && <p className="mt-1 text-xs text-[#78716C]">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#78716C] hover:bg-[#F4F3EF] hover:text-[#191816]"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
}
