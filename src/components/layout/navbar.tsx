"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LogOut, Menu, X, User, ShieldAlert } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";

interface NavbarProps {
  user?: {
    id: string;
    fullName: string;
    email: string;
    roles: string[];
    preferredLanguage?: "en" | "ur";
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isUrdu = user?.preferredLanguage === "ur";

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const navLinks = [
    { href: "/features", labelEn: "Features", labelUr: "خصوصیات" },
    { href: "/curriculum", labelEn: "Curriculum (Class 9)", labelUr: "نصاب (نہم)" },
    { href: "/pricing", labelEn: "Plans", labelUr: "پلانز" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E4E1DA] bg-white/95 backdrop-blur-none">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-[#191816] focus-visible:ring-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#C2410C] text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-sm leading-tight text-[#191816]">
                Student Hub
              </span>
              <span className="text-[10px] text-[#78716C] tracking-wide">
                Punjab Board • Class 9
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-[#57534E]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:text-[#191816] ${
                  pathname === link.href ? "text-[#C2410C] font-semibold" : ""
                }`}
              >
                {isUrdu ? link.labelUr : link.labelEn}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Section: Language switcher & Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher currentLanguage={user?.preferredLanguage || "en"} />

          {user ? (
            <div className="flex items-center gap-2 border-l border-[#E4E1DA] pl-3">
              {user.roles.includes("admin") && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 rounded bg-[#FEF2F2] px-2.5 py-1 text-xs font-medium text-[#B91C1C] hover:bg-[#FEE2E2]"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Admin
                </Link>
              )}
              <Link
                href="/workspace/dashboard"
                className="inline-flex items-center gap-1 rounded bg-[#FFEDD5] px-2.5 py-1 text-xs font-medium text-[#9A3412] hover:bg-[#FED7AA]"
              >
                <User className="h-3.5 w-3.5" />
                {user.fullName.split(" ")[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 text-[#78716C] hover:text-[#191816] rounded hover:bg-[#F4F3EF]"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded px-3 py-1.5 text-xs font-medium text-[#191816] hover:bg-[#F4F3EF]"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="rounded bg-[#C2410C] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#9A3412]"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <LanguageSwitcher currentLanguage={user?.preferredLanguage || "en"} />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded p-1.5 text-[#57534E] hover:bg-[#F4F3EF]"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-[#E4E1DA] bg-white px-4 py-3 md:hidden space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded px-2.5 py-1.5 text-xs font-medium text-[#57534E] hover:bg-[#F4F3EF] hover:text-[#191816]"
            >
              {isUrdu ? link.labelUr : link.labelEn}
            </Link>
          ))}
          <div className="border-t border-[#E4E1DA] pt-2">
            {user ? (
              <div className="space-y-1">
                <Link
                  href="/workspace/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded bg-[#FFEDD5] px-2.5 py-1.5 text-xs font-medium text-[#9A3412]"
                >
                  Student Workspace
                </Link>
                {user.roles.includes("admin") && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded px-2.5 py-1.5 text-xs font-medium text-[#B91C1C]"
                  >
                    Admin Console
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left rounded px-2.5 py-1.5 text-xs text-[#78716C] hover:bg-[#F4F3EF]"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center rounded border border-[#E4E1DA] py-1.5 text-xs font-medium text-[#191816]"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center rounded bg-[#C2410C] py-1.5 text-xs font-medium text-white"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
