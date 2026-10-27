"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  HelpCircle,
  CalendarCheck,
  TrendingUp,
  Bookmark,
  UserCheck,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentSidebarProps {
  isUrdu?: boolean;
}

export function StudentSidebar({ isUrdu = false }: StudentSidebarProps) {
  const pathname = usePathname();

  const links = [
    {
      href: "/workspace/dashboard",
      icon: LayoutDashboard,
      labelEn: "Dashboard",
      labelUr: "ڈیش بورڈ",
    },
    {
      href: "/workspace/subjects",
      icon: BookOpen,
      labelEn: "My Subjects",
      labelUr: "میرے مضامین",
    },
    {
      href: "/workspace/ai-tutor",
      icon: Sparkles,
      labelEn: "AI Tutor",
      labelUr: "اے آئی ٹیوٹر",
    },
    {
      href: "/workspace/quizzes",
      icon: HelpCircle,
      labelEn: "Quiz Center",
      labelUr: "کوئز سینٹر",
    },
    {
      href: "/workspace/planner",
      icon: CalendarCheck,
      labelEn: "Study Planner",
      labelUr: "اسٹڈی پلانر",
    },
    {
      href: "/workspace/progress",
      icon: TrendingUp,
      labelEn: "Progress & History",
      labelUr: "کارکردگی و تاریخ",
    },
    {
      href: "/workspace/bookmarks",
      icon: Bookmark,
      labelEn: "Bookmarks",
      labelUr: "بُک مارکس",
    },
    {
      href: "/workspace/plan",
      icon: CreditCard,
      labelEn: "Plan & AI Quota",
      labelUr: "پلان اور کوٹہ",
    },
    {
      href: "/workspace/profile",
      icon: UserCheck,
      labelEn: "Academic Profile",
      labelUr: "تعلیمی پروفائل",
    },
  ];

  return (
    <aside
      dir={isUrdu ? "rtl" : "ltr"}
      className={cn(
        "hidden md:flex w-56 flex-col border-r border-[#E4E1DA] bg-white text-[#191816] shrink-0 min-h-[calc(100vh-3.5rem)]",
        isUrdu && "border-r-0 border-l font-urdu"
      )}
    >
      <div className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
          {isUrdu ? "تعلیمی شعبہ" : "Learning Space"}
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/workspace/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded px-3 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "bg-[#FFEDD5] text-[#9A3412] font-semibold"
                  : "text-[#57534E] hover:bg-[#F4F3EF] hover:text-[#191816]"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#C2410C]" : "text-[#78716C]")} />
              <span>{isUrdu ? link.labelUr : link.labelEn}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-3 border-t border-[#F4F3EF]">
        <div className="rounded border border-[#E4E1DA] bg-[#FAF8F5] p-2.5 text-[11px] text-[#57534E]">
          <div className="font-semibold text-[#191816]">
            {isUrdu ? "پنجاب بورڈ (جماعت نہم)" : "Punjab Board (Class 9)"}
          </div>
          <div className="text-[10px] text-[#78716C] mt-0.5">
            {isUrdu ? "سائنس گروپ تصدیق شدہ مواد" : "Science Group Verified Content"}
          </div>
        </div>
      </div>
    </aside>
  );
}
