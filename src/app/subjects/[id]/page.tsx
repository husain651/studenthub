"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SubjectOffering {
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
}

interface Topic {
  id: string;
  topic_number: string;
  title_en: string;
  title_ur: string;
  summary_en: string;
  summary_ur: string;
  order_index: number;
  progress: {
    is_completed: boolean;
    last_accessed_at: string;
  } | null;
}

interface Chapter {
  id: string;
  chapter_number: number;
  title_en: string;
  title_ur: string;
  description_en: string;
  description_ur: string;
  order_index: number;
  topics: Topic[];
}

export default function SubjectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [data, setData] = useState<{
    offering: SubjectOffering;
    chapters: Chapter[];
    progress: { total: number; completed: number };
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/subjects/${params.id}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch subject");
      const json = await res.json();
      setData(json);

      // Expand first chapter by default
      if (json.chapters.length > 0) {
        setExpandedChapters(new Set([json.chapters[0].id]));
      }
    } catch (err) {
      console.error("Error fetching subject:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-ink-secondary mb-4">Subject not found</p>
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const { offering, chapters, progress } = data;
  const progressPercentage = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

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
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subject Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{offering.class_name}</Badge>
            <Badge variant="outline">{offering.curriculum_name}</Badge>
            {offering.board_name && <Badge variant="outline">{offering.board_name}</Badge>}
          </div>
          <h1 className="text-3xl font-bold text-ink-primary mb-2">{offering.name_en}</h1>
          {offering.description_en && (
            <p className="text-ink-secondary">{offering.description_en}</p>
          )}

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-ink-primary">
                Your Progress
              </span>
              <span className="text-sm text-ink-secondary">
                {progress.completed} of {progress.total} topics ({progressPercentage}%)
              </span>
            </div>
            <div className="h-2 bg-surface-subtle rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Chapters */}
        <div className="space-y-4">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              className="bg-surface border border-surface-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-brand-50 text-brand-600 rounded-full font-semibold text-sm">
                    {chapter.chapter_number}
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-ink-primary">{chapter.title_en}</h3>
                    <p className="text-sm text-ink-secondary">
                      {chapter.topics.length} topics
                    </p>
                  </div>
                </div>
                {expandedChapters.has(chapter.id) ? (
                  <ChevronUp className="h-5 w-5 text-ink-muted" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-ink-muted" />
                )}
              </button>

              {expandedChapters.has(chapter.id) && (
                <div className="border-t border-surface-border">
                  {chapter.topics.map((topic) => (
                    <Link
                      key={topic.id}
                      href={`/topics/${topic.id}`}
                      className="block px-6 py-4 hover:bg-surface-muted/30 transition-colors border-b border-surface-border last:border-b-0"
                    >
                      <div className="flex items-center gap-4">
                        {topic.progress?.is_completed ? (
                          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-ink-faint flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-ink-primary">{topic.title_en}</p>
                          {topic.summary_en && (
                            <p className="text-sm text-ink-secondary mt-1 line-clamp-2">
                              {topic.summary_en}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-ink-faint" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
