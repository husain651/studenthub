"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  Loader2,
  Brain,
  Target,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import LessonContent from "@/components/reader/lesson-content";

interface Topic {
  id: string;
  topic_number: string;
  title_en: string;
  title_ur: string;
  summary_en: string;
  summary_ur: string;
  chapter_id: string;
  chapter_number: number;
  chapter_title: string;
  subject_offering_id: string;
  subject_id: string;
  subject_name: string;
  icon_name: string;
  class_code: string;
  class_name: string;
}

interface Resource {
  id: string;
  version_id: string;
  version_number: number;
  title: string;
  content_markdown: string;
  key_takeaways: string[];
  formulas: any[];
  source_citation: string;
  author_type: string;
  language: string;
}

export default function TopicPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [data, setData] = useState<{
    topic: Topic;
    resource: Resource | null;
    navigation: {
      previous: { id: string; title_en: string } | null;
      next: { id: string; title_en: string } | null;
    };
    progress: any;
    hasQuiz: boolean;
    quizId: string | null;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/topics/${params.id}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch topic");
      const json = await res.json();
      setData(json);
      setIsBookmarked(json.isBookmarked);
      setIsCompleted(json.progress?.is_completed || false);
    } catch (err) {
      console.error("Error fetching topic:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async () => {
    try {
      const res = await fetch(`/api/topics/${params.id}/bookmark`, {
        method: "POST",
      });
      if (res.ok) {
        setIsBookmarked(!isBookmarked);
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    }
  };

  const markComplete = async () => {
    try {
      const res = await fetch(`/api/topics/${params.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_completed: !isCompleted }),
      });
      if (res.ok) {
        setIsCompleted(!isCompleted);
      }
    } catch (err) {
      console.error("Error updating progress:", err);
    }
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
          <p className="text-ink-secondary mb-4">Topic not found</p>
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const { topic, resource, navigation, hasQuiz, quizId } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-surface-border bg-surface sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/subjects/${topic.subject_offering_id}`} className="text-ink-secondary hover:text-ink-primary">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-brand-600" />
                <span className="text-sm text-ink-secondary">{topic.subject_name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleBookmark}
                className={isBookmarked ? "text-brand-600" : ""}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
                {isBookmarked ? "Bookmarked" : "Bookmark"}
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Topic Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{topic.class_name}</Badge>
            <Badge variant="outline">Chapter {topic.chapter_number}</Badge>
          </div>
          <h1 className="text-3xl font-bold text-ink-primary mb-2">{topic.title_en}</h1>
          <p className="text-ink-secondary">{topic.chapter_title}</p>
        </div>

        {/* No Content Warning */}
        {!resource && (
          <Alert variant="warning" className="mb-6">
            <p>
              This lesson content is not yet available. Check back later or explore other topics.
            </p>
          </Alert>
        )}

        {/* Lesson Content */}
        {resource && (
          <div className="mb-8">
            <LessonContent
              content={resource.content_markdown}
              language={resource.language as "en" | "ur"}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button
            onClick={markComplete}
            variant={isCompleted ? "default" : "outline"}
            className={isCompleted ? "bg-success hover:bg-success/90" : ""}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {isCompleted ? "Completed" : "Mark as Complete"}
          </Button>

          {hasQuiz && quizId && (
            <Link href={`/quizzes/${quizId}`}>
              <Button variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Practice Quiz
              </Button>
            </Link>
          )}

          <Link href="/tutor">
            <Button variant="outline">
              <Brain className="h-4 w-4 mr-2" />
              Ask AI Tutor
            </Button>
          </Link>
        </div>

        {/* Source Citation */}
        {resource?.source_citation && (
          <div className="text-sm text-ink-muted mb-8">
            <ExternalLink className="h-4 w-4 inline mr-1" />
            Source: {resource.source_citation}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-8 border-t border-surface-border">
          {navigation.previous ? (
            <Link
              href={`/topics/${navigation.previous.id}`}
              className="flex items-center gap-2 text-ink-secondary hover:text-ink-primary transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <div className="text-left">
                <p className="text-xs text-ink-muted">Previous</p>
                <p className="font-medium">{navigation.previous.title_en}</p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {navigation.next ? (
            <Link
              href={`/topics/${navigation.next.id}`}
              className="flex items-center gap-2 text-ink-secondary hover:text-ink-primary transition-colors"
            >
              <div className="text-right">
                <p className="text-xs text-ink-muted">Next</p>
                <p className="font-medium">{navigation.next.title_en}</p>
              </div>
              <ChevronRight className="h-5 w-5" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
