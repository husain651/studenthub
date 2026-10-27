"use client";

import React from "react";
import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";

interface LanguageSwitcherProps {
  currentLanguage?: "en" | "ur";
  onLanguageChange?: (lang: "en" | "ur") => void;
  className?: string;
}

export function LanguageSwitcher({
  currentLanguage = "en",
  onLanguageChange,
  className = "",
}: LanguageSwitcherProps) {
  const router = useRouter();

  const handleToggle = async (newLang: "en" | "ur") => {
    if (onLanguageChange) {
      onLanguageChange(newLang);
    } else {
      // Save in cookie & trigger preference update
      document.cookie = `student_hub_lang=${newLang}; path=/; max-age=31536000`;
      try {
        await fetch("/api/student/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferredLanguage: newLang }),
        });
      } catch (err) {
        // Fallback gracefully
      }
      router.refresh();
    }
  };

  return (
    <div className={`inline-flex items-center rounded border border-[#E4E1DA] bg-white p-0.5 text-xs ${className}`}>
      <button
        type="button"
        onClick={() => handleToggle("en")}
        className={`px-2 py-1 rounded transition-colors ${
          currentLanguage === "en"
            ? "bg-[#C2410C] text-white font-medium"
            : "text-[#57534E] hover:text-[#191816]"
        }`}
        aria-label="Switch to English"
      >
        English
      </button>
      <button
        type="button"
        onClick={() => handleToggle("ur")}
        className={`px-2.5 py-1 rounded font-urdu transition-colors ${
          currentLanguage === "ur"
            ? "bg-[#C2410C] text-white font-medium"
            : "text-[#57534E] hover:text-[#191816]"
        }`}
        aria-label="اردو میں تبدیل کریں"
      >
        اردو
      </button>
    </div>
  );
}
