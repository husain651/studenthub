import Link from "next/link";
import { BookOpen, Brain, Target, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-surface-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-brand-600" />
              <span className="text-xl font-semibold text-ink-primary">Student Hub</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/features" className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">
                Features
              </Link>
              <Link href="/curriculum" className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">
                Curriculum
              </Link>
              <Link href="/pricing" className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">
                Pricing
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-surface-muted/50 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ink-primary mb-6">
            Learn Your Subjects with Confidence
          </h1>
          <p className="text-lg sm:text-xl text-ink-secondary mb-8 max-w-2xl mx-auto">
            A complete learning platform for Classes 9-12 with verified curriculum content, AI tutoring, and personalized study tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Learning Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/curriculum">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                View Curriculum
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink-muted">
            Punjab Board Class 9 Now Available • English & Urdu
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-ink-primary text-center mb-12">
            Everything You Need to Succeed
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Verified Lessons"
              description="Expert-reviewed lessons following your official curriculum with accurate examples and formulas."
            />
            <FeatureCard
              icon={<Brain className="h-6 w-6" />}
              title="AI Tutor"
              description="Ask questions, get step-by-step explanations, and understand difficult concepts anytime."
            />
            <FeatureCard
              icon={<Target className="h-6 w-6" />}
              title="Practice Quizzes"
              description="Test your knowledge with MCQ quizzes, instant feedback, and detailed explanations."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-ink-primary mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-lg text-ink-secondary mb-8">
            Join thousands of students improving their grades with Student Hub.
          </p>
          <Link href="/register">
            <Button size="lg">
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-surface py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-brand-600" />
              <span className="font-semibold text-ink-primary">Student Hub</span>
            </div>
            <p className="text-sm text-ink-muted">
              © 2026 Student Hub. Building better education for Pakistan.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-surface border border-surface-border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-ink-primary">{title}</h3>
      </div>
      <p className="text-ink-secondary">{description}</p>
    </div>
  );
}
