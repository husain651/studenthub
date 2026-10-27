"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";

interface Quiz {
  id: string;
  title_en: string;
  title_ur: string;
  description_en: string;
  description_ur: string;
  time_limit_seconds: number;
  passing_percentage: number;
  topic_id: string;
  topic_title: string;
}

interface Question {
  id: string;
  question_number: number;
  question_text_en: string;
  question_text_ur: string;
  points: number;
  difficulty: string;
  options: {
    id: string;
    option_key: string;
    option_text_en: string;
    option_text_ur: string;
  }[];
}

interface QuizResponse {
  question_id: string;
  question_text: string;
  selected_option_id: string | null;
  selected_option_key: string | null;
  is_correct: boolean;
  correct_option_key: string;
  explanation: string;
}

export default function QuizPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const [data, setData] = useState<{
    quiz: Quiz;
    questions: Question[];
    previousAttempts: any[];
  } | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{
    attemptId: string;
    score: {
      total: number;
      correct: number;
      percentage: number;
      passed: boolean;
    };
    responses: QuizResponse[];
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  // Timer effect
  useEffect(() => {
    if (!started || showResults || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, showResults, timeLeft]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/quizzes/${params.id}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch quiz");
      const json = await res.json();
      setData(json);
      setTimeLeft(json.quiz.time_limit_seconds);
    } catch (err) {
      console.error("Error fetching quiz:", err);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    setStarted(true);
  };

  const selectAnswer = (questionId: string, optionId: string) => {
    setAnswers({ ...answers, [questionId]: optionId });
  };

  const handleSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);

    const timeSpent = data!.quiz.time_limit_seconds - timeLeft;

    try {
      const res = await fetch(`/api/quizzes/${params.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          timeSpentSeconds: timeSpent,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit quiz");

      const json = await res.json();
      setResults(json);
      setShowResults(true);
    } catch (err) {
      console.error("Error submitting quiz:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
          <p className="text-ink-secondary mb-4">Quiz not found</p>
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const { quiz, questions, previousAttempts } = data;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  if (!started) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-surface-border bg-surface">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/dashboard" className="text-ink-secondary hover:text-ink-primary">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-brand-600" />
              <span className="font-semibold text-ink-primary">Student Hub</span>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-surface border border-surface-border rounded-lg p-8">
            <div className="mb-6">
              <Badge variant="outline" className="mb-4">{quiz.topic_title}</Badge>
              <h1 className="text-2xl font-bold text-ink-primary mb-2">{quiz.title_en}</h1>
              {quiz.description_en && (
                <p className="text-ink-secondary">{quiz.description_en}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-ink-muted" />
                <div>
                  <p className="text-sm text-ink-muted">Questions</p>
                  <p className="font-semibold text-ink-primary">{questions.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-ink-muted" />
                <div>
                  <p className="text-sm text-ink-muted">Time Limit</p>
                  <p className="font-semibold text-ink-primary">{formatTime(quiz.time_limit_seconds)}</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-muted/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-ink-secondary">
                <strong>Passing Score:</strong> {quiz.passing_percentage}%
              </p>
            </div>

            {previousAttempts.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-ink-primary mb-2">Previous Attempts</p>
                <div className="space-y-2">
                  {previousAttempts.map((attempt: any) => (
                    <div key={attempt.id} className="flex items-center justify-between text-sm p-2 bg-surface-muted/30 rounded">
                      <span className="text-ink-secondary">
                        {new Date(attempt.completed_at).toLocaleDateString()}
                      </span>
                      <Badge variant={attempt.passed ? "success" : "warning"}>
                        {attempt.score_percentage.toFixed(0)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={startQuiz} className="w-full" size="lg">
              Start Quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-surface-border bg-surface">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/dashboard" className="text-ink-secondary hover:text-ink-primary">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-brand-600" />
              <span className="font-semibold text-ink-primary">Student Hub</span>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Score Summary */}
          <div className="bg-surface border border-surface-border rounded-lg p-8 mb-8 text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              results.score.passed ? "bg-success-bg" : "bg-warning-bg"
            }`}>
              {results.score.passed ? (
                <CheckCircle2 className="h-10 w-10 text-success" />
              ) : (
                <XCircle className="h-10 w-10 text-warning" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-ink-primary mb-2">
              {results.score.passed ? "Quiz Passed!" : "Keep Practicing"}
            </h1>
            <p className="text-5xl font-bold text-ink-primary mb-4">
              {results.score.percentage.toFixed(0)}%
            </p>
            <p className="text-ink-secondary mb-6">
              {results.score.correct} of {results.score.total} questions correct
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Button onClick={() => {
                setStarted(false);
                setShowResults(false);
                setAnswers({});
                setTimeLeft(quiz.time_limit_seconds);
              }}>
                Retake Quiz
              </Button>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-ink-primary mb-4">Question Review</h2>
            {results.responses.map((response, idx) => (
              <div
                key={response.question_id}
                className={`bg-surface border rounded-lg p-6 ${
                  response.is_correct ? "border-success/30" : "border-warning/30"
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  {response.is_correct ? (
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-ink-primary mb-2">
                      Q{idx + 1}. {response.question_text}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-ink-muted">Your answer:</span>
                        <Badge variant={response.is_correct ? "success" : "danger"}>
                          {response.selected_option_key || "Not answered"}
                        </Badge>
                      </div>
                      {!response.is_correct && (
                        <div className="flex items-center gap-2">
                          <span className="text-ink-muted">Correct answer:</span>
                          <Badge variant="success">{response.correct_option_key}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {response.explanation && (
                  <div className="bg-surface-muted/30 rounded p-4 mt-4">
                    <p className="text-sm text-ink-secondary">
                      <strong>Explanation:</strong> {response.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Quiz in progress
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-surface-border bg-surface sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-ink-secondary hover:text-ink-primary">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-semibold text-ink-primary">{quiz.title_en}</h1>
              <p className="text-sm text-ink-secondary">
                {answeredCount} of {questions.length} answered
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-ink-muted" />
            <span className={`font-mono font-semibold ${timeLeft < 60 ? "text-danger" : "text-ink-primary"}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {questions.map((question, idx) => (
            <div
              key={question.id}
              className="bg-surface border border-surface-border rounded-lg p-6"
            >
              <div className="mb-4">
                <span className="text-sm text-ink-muted mb-2 block">
                  Question {idx + 1} • {question.points} points
                </span>
                <p className="text-lg font-medium text-ink-primary">{question.question_text_en}</p>
              </div>

              <div className="space-y-3">
                {question.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => selectAnswer(question.id, option.id)}
                    className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                      answers[question.id] === option.id
                        ? "border-brand-600 bg-brand-50"
                        : "border-surface-border bg-surface hover:border-surface-subtle"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        answers[question.id] === option.id
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-surface-border"
                      }`}>
                        {answers[question.id] === option.id && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="font-medium text-ink-primary">{option.option_key}.</span>
                      <span className="text-ink-primary">{option.option_text_en}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-between">
          <div />
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Quiz"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
