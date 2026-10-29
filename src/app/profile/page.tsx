"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, User, Mail, Calendar, Trophy, Clock, LogOut, Settings, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  email_verified: boolean;
  created_at: string;
  preferred_language: string;
  onboarding_completed: boolean;
  roles: string[];
  stats: {
    totalTopicsCompleted: number;
    totalQuizzesTaken: number;
    studyStreak: number;
    totalStudyTime: number;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ full_name: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setUser(data);
      setFormData({ full_name: data.full_name });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: formData.full_name }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      setSuccess("Profile updated successfully!");
      setEditMode(false);
      fetchProfile();
    } catch (err) {
      setError("Failed to update profile");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-ink-secondary mb-4">Please log in to view your profile</p>
          <Button onClick={() => router.push("/login")}>Log In</Button>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-2">
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-surface border border-surface-border rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 bg-brand-50 rounded-full flex items-center justify-center text-brand-600">
                <User className="h-10 w-10" />
              </div>
              <div>
                {editMode ? (
                  <form onSubmit={handleUpdateProfile} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="text-2xl font-bold text-ink-primary bg-surface-muted border border-surface-border rounded px-2 py-1"
                    />
                    <Button type="submit" size="sm">Save</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditMode(false)}>Cancel</Button>
                  </form>
                ) : (
                  <h1 className="text-2xl font-bold text-ink-primary">{user.full_name}</h1>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={user.email_verified ? "default" : "outline"}>
                    {user.email_verified ? "Verified" : "Unverified"}
                  </Badge>
                  {user.roles.map((role) => (
                    <Badge key={role} variant="secondary" className="capitalize">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            {!editMode && (
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                Edit Profile
              </Button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-ink-secondary">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-ink-secondary">
              <Calendar className="h-4 w-4" />
              <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
        {success && <Alert variant="success" className="mb-4">{success}</Alert>}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface border border-surface-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-brand-600" />
              <span className="text-sm text-ink-secondary">Topics Completed</span>
            </div>
            <p className="text-2xl font-bold text-ink-primary">{user.stats.totalTopicsCompleted}</p>
          </div>
          <div className="bg-surface border border-surface-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-brand-600" />
              <span className="text-sm text-ink-secondary">Quizzes Taken</span>
            </div>
            <p className="text-2xl font-bold text-ink-primary">{user.stats.totalQuizzesTaken}</p>
          </div>
          <div className="bg-surface border border-surface-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-brand-600" />
              <span className="text-sm text-ink-secondary">Study Streak</span>
            </div>
            <p className="text-2xl font-bold text-ink-primary">{user.stats.studyStreak} days</p>
          </div>
          <div className="bg-surface border border-surface-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-brand-600" />
              <span className="text-sm text-ink-secondary">Study Time</span>
            </div>
            <p className="text-2xl font-bold text-ink-primary">{Math.round(user.stats.totalStudyTime / 60)}h</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-surface border border-surface-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-ink-primary mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/subjects">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Subjects
              </Button>
            </Link>
            <Link href="/planner">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Study Planner
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
