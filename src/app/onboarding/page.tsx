"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

interface Curriculum {
  id: string;
  code: string;
  name_en: string;
  name_ur: string;
  country: string;
}

interface Board {
  id: string;
  curriculum_id: string;
  code: string;
  name_en: string;
  name_ur: string;
  jurisdiction: string;
}

interface AcademicLevel {
  id: string;
  code: string;
  name_en: string;
  name_ur: string;
  grade_order: number;
}

interface Subject {
  id: string;
  code: string;
  name_en: string;
  name_ur: string;
  icon_name: string;
  category: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [data, setData] = useState<{
    curricula: Curriculum[];
    boards: Board[];
    academicLevels: AcademicLevel[];
    subjects: Subject[];
  } | null>(null);

  const [preferences, setPreferences] = useState({
    curriculumId: "",
    boardId: "",
    academicLevelId: "",
    preferredLanguage: "en" as "en" | "ur",
    selectedSubjectIds: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/onboarding/preferences");
      if (!res.ok) throw new Error("Failed to fetch data");
      const json = await res.json();
      setData(json);

      // Auto-select Punjab Board and Class 9 as defaults
      const punjabCurriculum = json.curricula.find((c: Curriculum) => c.code === "PK-SNC");
      const punjabBoard = json.boards.find((b: Board) => b.code === "BISE-PB");
      const class9 = json.academicLevels.find((al: AcademicLevel) => al.code === "9");

      if (punjabCurriculum && punjabBoard && class9) {
        setPreferences({
          ...preferences,
          curriculumId: punjabCurriculum.id,
          boardId: punjabBoard.id,
          academicLevelId: class9.id,
        });
      }
    } catch (err) {
      setError("Failed to load onboarding data");
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setPreferences({
      ...preferences,
      selectedSubjectIds: preferences.selectedSubjectIds.includes(subjectId)
        ? preferences.selectedSubjectIds.filter((id) => id !== subjectId)
        : [...preferences.selectedSubjectIds, subjectId],
    });
  };

  const handleSubmit = async () => {
    if (preferences.selectedSubjectIds.length === 0) {
      setError("Please select at least one subject");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save preferences");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const filteredBoards = data?.boards.filter((b) => b.curriculum_id === preferences.curriculumId) || [];
  const scienceSubjects = data?.subjects.filter((s) => s.category === "science") || [];
  const compulsorySubjects = data?.subjects.filter((s) => s.category === "compulsory") || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-surface-border bg-surface">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-brand-600" />
            <span className="font-semibold text-ink-primary">Student Hub</span>
          </div>
          <div className="text-sm text-ink-muted">
            Step {step} of 3
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full ${
                  i <= step ? "bg-brand-600" : "bg-surface-subtle"
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="danger" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Step 1: Language and Curriculum */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-ink-primary mb-2">
                Choose Your Language
              </h1>
              <p className="text-ink-secondary">
                Select your preferred language for learning content
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "en", label: "English", desc: "Learn in English" },
                { value: "ur", label: "اردو", desc: "اردو میں سیکھیں" },
              ].map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setPreferences({ ...preferences, preferredLanguage: lang.value as any })}
                  className={`p-6 border-2 rounded-lg text-left transition-all ${
                    preferences.preferredLanguage === lang.value
                      ? "border-brand-600 bg-brand-50"
                      : "border-surface-border bg-surface hover:border-surface-subtle"
                  }`}
                >
                  <div className="font-semibold text-ink-primary mb-1">{lang.label}</div>
                  <div className="text-sm text-ink-secondary">{lang.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Academic Information */}
        {step === 2 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-ink-primary mb-2">
                Your Academic Information
              </h1>
              <p className="text-ink-secondary">
                Tell us about your curriculum and class
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-ink-primary mb-2">
                  Curriculum
                </label>
                <select
                  value={preferences.curriculumId}
                  onChange={(e) => setPreferences({ ...preferences, curriculumId: e.target.value, boardId: "" })}
                  className="w-full px-4 py-3 border border-surface-border rounded-lg bg-surface text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  <option value="">Select curriculum</option>
                  {data?.curricula.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_en}
                    </option>
                  ))}
                </select>
              </div>

              {filteredBoards.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-ink-primary mb-2">
                    Examination Board
                  </label>
                  <select
                    value={preferences.boardId}
                    onChange={(e) => setPreferences({ ...preferences, boardId: e.target.value })}
                    className="w-full px-4 py-3 border border-surface-border rounded-lg bg-surface text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-600"
                  >
                    <option value="">Select board</option>
                    {filteredBoards.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name_en}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-ink-primary mb-2">
                  Class
                </label>
                <select
                  value={preferences.academicLevelId}
                  onChange={(e) => setPreferences({ ...preferences, academicLevelId: e.target.value })}
                  className="w-full px-4 py-3 border border-surface-border rounded-lg bg-surface text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  <option value="">Select class</option>
                  {data?.academicLevels.map((al) => (
                    <option key={al.id} value={al.id}>
                      {al.name_en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!preferences.academicLevelId}>
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Select Subjects */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-ink-primary mb-2">
                Select Your Subjects
              </h1>
              <p className="text-ink-secondary">
                Choose the subjects you want to study
              </p>
            </div>

            <div className="space-y-6">
              {compulsorySubjects.length > 0 && (
                <div>
                  <h3 className="font-semibold text-ink-primary mb-3">Compulsory Subjects</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {compulsorySubjects.map((subject) => (
                      <button
                        key={subject.id}
                        onClick={() => toggleSubject(subject.id)}
                        className={`p-4 border-2 rounded-lg text-left transition-all flex items-center justify-between ${
                          preferences.selectedSubjectIds.includes(subject.id)
                            ? "border-brand-600 bg-brand-50"
                            : "border-surface-border bg-surface hover:border-surface-subtle"
                        }`}
                      >
                        <span className="font-medium text-ink-primary">{subject.name_en}</span>
                        {preferences.selectedSubjectIds.includes(subject.id) && (
                          <Check className="h-5 w-5 text-brand-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {scienceSubjects.length > 0 && (
                <div>
                  <h3 className="font-semibold text-ink-primary mb-3">Science Subjects</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {scienceSubjects.map((subject) => (
                      <button
                        key={subject.id}
                        onClick={() => toggleSubject(subject.id)}
                        className={`p-4 border-2 rounded-lg text-left transition-all flex items-center justify-between ${
                          preferences.selectedSubjectIds.includes(subject.id)
                            ? "border-brand-600 bg-brand-50"
                            : "border-surface-border bg-surface hover:border-surface-subtle"
                        }`}
                      >
                        <span className="font-medium text-ink-primary">{subject.name_en}</span>
                        {preferences.selectedSubjectIds.includes(subject.id) && (
                          <Check className="h-5 w-5 text-brand-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={submitting || preferences.selectedSubjectIds.length === 0}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
