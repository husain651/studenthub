"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
}

interface RecentProgress {
  topic_id: string;
  title_en: string;
  title_ur: string;
  chapter_title: string;
  subject_offering_id: string;
  subject_name: string;
  icon_name: string;
  last_accessed_at: string;
  is_completed: boolean;
}

interface StudyTask {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  is_completed: boolean;
  topic_id: string | null;
}

interface QuizAttempt {
  id: string;
  snapshot_quiz_title: string;
  score_percentage: number;
  passed: boolean;
  completed_at: string;
  topic_title: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    user: any;
    preferences: any;
    subjectOfferings: SubjectOffering[];
    recentProgress: RecentProgress[];
    todayTasks: StudyTask[];
    upcomingTasks: StudyTask[];
    recentQuizzes: QuizAttempt[];
    progressStats: any;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/user/me");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch data");
      const json = await res.json();

      if (json.needsOnboarding) {
        router.push("/onboarding");
        return;
      }

      setData(json);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
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

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-ink-secondary mb-4">Failed to load dashboard</p>
          <Button onClick={fetchData}>Retry</Button>
        </div>
      </div>
    );
  }

  const { user, preferences, subjectOfferings, recentProgress, todayTasks, upcomingTasks, recentQuizzes, progressStats } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-surface-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-brand-600" />
              <span className="font-semibold text-ink-primary">Student Hub</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-ink-secondary">
                Welcome, {user.fullName}
              </span>
              <Button variant="outline" size="sm" onClick={() => router.push("/logout")}>
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ink-primary mb-2">
            Welcome back, {user.fullName.split(" ")[0]}!
          </h1>
          <p className="text-ink-secondary">
            Continue your learning journey
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Continue Studying */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-ink-primary">Continue Studying</h2>
                {recentProgress.length > 0 && (
                  <Link href="/subjects" className="text-sm text-brand-600 hover:text-brand-700 flex items-center">
                    View all subjects
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                )}
              </div>

              {recentProgress.length > 0 ? (
                <div className="space-y-3">
                  {recentProgress.map((progress) => (
                    <Link
                      key={progress.topic_id}
                      href={`/topics/${progress.topic_id}`}
                      className="block bg-surface border border-surface-border rounded-lg p-4 hover:border-surface-subtle transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {progress.subject_name}
                            </Badge>
                            {progress.is_completed && (
                              <Badge className="bg-success-bg text-success border-success">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-medium text-ink-primary mb-1">{progress.title_en}</h3>
                          <p className="text-sm text-ink-secondary">{progress.chapter_title}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-ink-faint" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-ink-faint mx-auto mb-4" />
                  <h3 className="font-medium text-ink-primary mb-2">Start Learning</h3>
                  <p className="text-sm text-ink-secondary mb-4">
                    Choose a subject to begin your studies
                  </p>
                  <Link href="/subjects">
                    <Button size="sm">
                      Browse Subjects
                    </Button>
                  </Link>
                </Card>
              )}
            </section>

            {/* My Subjects */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-ink-primary">My Subjects</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {subjectOfferings.map((subject) => (
                  <Link
                    key={subject.id}
                    href={`/subjects/${subject.id}`}
                    className="bg-surface border border-surface-border rounded-lg p-4 hover:border-surface-subtle transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-ink-primary">{subject.name_en}</h3>
                        <p className="text-sm text-ink-secondary">{subject.class_name}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Today's Tasks */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-ink-primary">Today's Tasks</h2>
                <Link href="/planner" className="text-sm text-brand-600 hover:text-brand-700">
                  Planner
                </Link>
              </div>

              <Card className="p-4">
                {todayTasks.length > 0 ? (
                  <div className="space-y-3">
                    {todayTasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3">
                        <button className="mt-0.5">
                          <div className="w-5 h-5 border-2 border-surface-border rounded bg-surface" />
                        </button>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ink-primary">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-ink-secondary mt-1">{task.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Calendar className="h-8 w-8 text-ink-faint mx-auto mb-2" />
                    <p className="text-sm text-ink-secondary">No tasks for today</p>
                    <Link href="/planner">
                      <Button variant="ghost" size="sm" className="mt-2">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Task
                      </Button>
                    </Link>
                  </div>
                )}
              </Card>
            </section>

            {/* Upcoming Tasks */}
            {upcomingTasks.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-ink-primary mb-4">Upcoming</h2>
                <Card className="p-4">
                  <div className="space-y-3">
                    {upcomingTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-ink-muted" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ink-primary">{task.title}</p>
                          <p className="text-xs text-ink-secondary">
                            {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>
            )}

            {/* Recent Quiz Results */}
            {recentQuizzes.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-ink-primary">Recent Quizzes</h2>
                  <Link href="/quizzes" className="text-sm text-brand-600 hover:text-brand-700">
                    View all
                  </Link>
                </div>

                <Card className="p-4">
                  <div className="space-y-3">
                    {recentQuizzes.slice(0, 3).map((quiz) => (
                      <div key={quiz.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ink-primary">{quiz.snapshot_quiz_title}</p>
                          <p className="text-xs text-ink-secondary">{quiz.topic_title}</p>
                        </div>
                        <Badge
                          variant={quiz.passed ? "success" : "warning"}
                          className="text-xs"
                        >
                          {quiz.score_percentage.toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>
            )}

            {/* Progress Overview */}
            <section>
              <h2 className="text-lg font-semibold text-ink-primary mb-4">Your Progress</h2>
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-50 rounded-lg text-brand-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-ink-primary">
                      {progressStats?.completed_count || 0}
                    </p>
                    <p className="text-sm text-ink-secondary">Topics completed</p>
                  </div>
                </div>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
