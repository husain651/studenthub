"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowLeft, User, Bell, Globe, Moon, Sun, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-surface-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-ink-secondary hover:text-ink-primary">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-brand-600" />
                <span className="font-semibold text-ink-primary">Student Hub</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-ink-primary mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Appearance */}
          <section className="bg-surface border border-surface-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-ink-primary mb-4 flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Appearance
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink-primary">Dark Mode</p>
                <p className="text-sm text-ink-secondary">Toggle between light and dark theme</p>
              </div>
              <ThemeToggle />
            </div>
          </section>

          {/* Account */}
          <section className="bg-surface border border-surface-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-ink-primary mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </h2>
            <div className="space-y-3">
              <Link href="/profile">
                <Button variant="outline" className="w-full justify-start">
                  Edit Profile
                </Button>
              </Link>
              <Link href="/forgot-password">
                <Button variant="outline" className="w-full justify-start">
                  Change Password
                </Button>
              </Link>
            </div>
          </section>

          {/* Preferences */}
          <section className="bg-surface border border-surface-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-ink-primary mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Preferences
            </h2>
            <div className="space-y-3">
              <Link href="/onboarding">
                <Button variant="outline" className="w-full justify-start">
                  Update Academic Preferences
                </Button>
              </Link>
            </div>
          </section>

          {/* Notifications */}
          <section className="bg-surface border border-surface-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-ink-primary mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </h2>
            <p className="text-sm text-ink-secondary mb-4">
              Manage your notification preferences (coming soon)
            </p>
            <div className="space-y-3 opacity-50">
              <div className="flex items-center justify-between">
                <span className="text-ink-primary">Email notifications</span>
                <div className="w-12 h-6 bg-surface-subtle rounded-full relative">
                  <div className="w-5 h-5 bg-surface border border-surface-border rounded-full absolute left-0.5 top-0.5" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-primary">Study reminders</span>
                <div className="w-12 h-6 bg-surface-subtle rounded-full relative">
                  <div className="w-5 h-5 bg-surface border border-surface-border rounded-full absolute left-0.5 top-0.5" />
                </div>
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="bg-surface border border-surface-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-ink-primary mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </h2>
            <p className="text-sm text-ink-secondary mb-4">
              Manage your account security settings
            </p>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start opacity-50">
                Two-Factor Authentication (Coming Soon)
              </Button>
              <Button variant="outline" className="w-full justify-start opacity-50">
                Login History (Coming Soon)
              </Button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-surface border border-danger rounded-lg p-6">
            <h2 className="text-lg font-semibold text-danger mb-4">Danger Zone</h2>
            <Button
              variant="outline"
              className="w-full justify-start text-danger border-danger hover:bg-danger-bg"
              onClick={handleLogout}
              disabled={loading}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
