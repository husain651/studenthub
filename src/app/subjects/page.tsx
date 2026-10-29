"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calculator,
  FlaskConical,
  Dna,
  Laptop,
  Languages,
  Flag,
  Moon,
  Zap,
  Loader2,
  CheckCircle2,
  Circle,
  User,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

interface Subject {
  id: string;
  subject_id: string;
  code: string;
  name_en: string;
  name_ur: string;
  icon_name: string;
  category: string;
  class_code: string;
  class_name: string;
  curriculum_name: string;
  board_name: string;
  syllabus_year: string;
  description_en: string;
  description_ur: string;
  is_selected: boolean;
  progress: {
    total: number;
    completed: number;
  };
}

const iconMap: Record<string, any> = {
  Calculator,
  Zap,
  FlaskConical,
  Dna,
  Laptop,
  BookOpen,
  Languages,
  Flag,
  Moon,
};

export default function SubjectsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/subjects");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch subjects");
      const data = await res.json();
      setSubjects(data);
    } catch (err) {
      console.error("Error fetching subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const groupedSubjects = subjects.reduce((acc, subject) => {
    if (!acc[subject.category]) {
      acc[subject.category] = [];
    }
    acc[subject.category].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-surface-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-brand-600" />
              <span className="text-xl font-semibold text-ink-primary">Student Hub</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink-primary mb-2">Subjects</h1>
          <p className="text-ink-secondary">
            Browse and access your curriculum subjects
          </p>
        </div>

        {/* Subjects by Category */}
        {Object.entries(groupedSubjects).map(([category, categorySubjects]) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold text-ink-primary mb-4 capitalize">
              {category}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorySubjects.map((subject) => {
                const Icon = iconMap[subject.icon_name] || BookOpen;
                const progressPercentage =
                  subject.progress.total > 0
                    ? Math.round((subject.progress.completed / subject.progress.total) * 100)
                    : 0;

                return (
                  <Link
                    key={subject.id}
                    href={`/subjects/${subject.id}`}
                    className="bg-surface border border-surface-border rounded-lg p-6 hover:border-brand-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-brand-50 rounded-lg text-brand-600">
                        <Icon className="h-6 w-6" />
                      </div>
                      {subject.is_selected && (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      )}
                    </div>

                    <h3 className="font-semibold text-ink-primary mb-1">
                      {subject.name_en}
                    </h3>
                    <p className="text-sm text-ink-secondary mb-3">
                      {subject.name_ur}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {subject.class_name}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {subject.code}
                      </Badge>
                    </div>

                    {subject.description_en && (
                      <p className="text-sm text-ink-secondary mb-4 line-clamp-2">
                        {subject.description_en}
                      </p>
                    )}

                    {/* Progress Bar */}
                    {subject.progress.total > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-ink-secondary">
                            Progress
                          </span>
                          <span className="text-xs text-ink-secondary">
                            {subject.progress.completed}/{subject.progress.total} topics
                          </span>
                        </div>
                        <div className="h-1.5 bg-surface-subtle rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-600 transition-all"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {subjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-ink-secondary mb-4">
              No subjects available for your current settings.
            </p>
            <Link href="/onboarding">
              <Button>Update Preferences</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
