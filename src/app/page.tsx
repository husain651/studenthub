import Link from "next/link";
import { BookOpen, Brain, Target, CheckCircle2, ArrowRight, Zap, Award, Clock, Users, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-surface-border bg-surface/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-ink-primary">Student Hub</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/#features" className="text-sm font-medium text-ink-secondary hover:text-brand-600 transition-colors">
                Features
              </Link>
              <Link href="/#subjects" className="text-sm font-medium text-ink-secondary hover:text-brand-600 transition-colors">
                Subjects
              </Link>
              <Link href="/#how-it-works" className="text-sm font-medium text-ink-secondary hover:text-brand-600 transition-colors">
                How It Works
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-brand-600 hover:bg-brand-700">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-background to-surface-muted/30" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Punjab Board Class 9 Now Available
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-ink-primary mb-6 leading-tight">
            Master Your Subjects<br />
            <span className="text-brand-600">With Confidence</span>
          </h1>
          <p className="text-xl text-ink-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
            A complete learning platform for Classes 9-12 with verified curriculum content, 
            AI-powered tutoring, and personalized study tools designed for Pakistani students.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-brand-600 hover:bg-brand-700">
                Start Learning Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/subjects">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6">
                Browse Subjects
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-8 text-sm text-ink-secondary">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span>Verified Content</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span>Bilingual (English/Urdu)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span>100% Free to Start</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-surface border-y border-surface-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-brand-600 mb-2">5+</p>
              <p className="text-sm text-ink-secondary">Core Subjects</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-brand-600 mb-2">100+</p>
              <p className="text-sm text-ink-secondary">Verified Lessons</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-brand-600 mb-2">500+</p>
              <p className="text-sm text-ink-secondary">Practice Questions</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-brand-600 mb-2">24/7</p>
              <p className="text-sm text-ink-secondary">AI Tutor Access</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-ink-primary mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-lg text-ink-secondary max-w-2xl mx-auto">
              Comprehensive tools and resources designed specifically for Pakistani curriculum
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Verified Curriculum Content"
              description="Expert-reviewed lessons following PCTB syllabus with accurate examples, formulas, and explanations in both English and Urdu."
            />
            <FeatureCard
              icon={<Brain className="h-6 w-6" />}
              title="AI-Powered Tutor"
              description="Get instant answers to your questions with step-by-step explanations. Available 24/7 to help you understand difficult concepts."
            />
            <FeatureCard
              icon={<Target className="h-6 w-6" />}
              title="Practice Quizzes"
              description="Test your knowledge with MCQ quizzes for each topic. Get instant feedback and detailed explanations for every question."
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6" />}
              title="Study Planner"
              description="Organize your study schedule with our built-in planner. Set deadlines, track progress, and never miss important dates."
            />
            <FeatureCard
              icon={<Award className="h-6 w-6" />}
              title="Progress Tracking"
              description="Monitor your learning journey with detailed analytics. Track completed topics, quiz scores, and study streaks."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Bilingual Support"
              description="All content available in both English and Urdu. Learn in the language you're most comfortable with."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-ink-primary mb-4">
              How It Works
            </h2>
            <p className="text-lg text-ink-secondary">
              Get started in minutes, not hours
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-ink-primary mb-2">Create Account</h3>
              <p className="text-ink-secondary">Sign up for free in seconds. No credit card required.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-ink-primary mb-2">Choose Subjects</h3>
              <p className="text-ink-secondary">Select your subjects from the Punjab Board curriculum.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-ink-primary mb-2">Start Learning</h3>
              <p className="text-ink-secondary">Access lessons, take quizzes, and track your progress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-brand-600 to-brand-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Ace Your Exams?
          </h2>
          <p className="text-xl text-brand-100 mb-8">
            Join thousands of Pakistani students improving their grades with Student Hub.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-brand-600 hover:bg-brand-50 text-lg px-8 py-6">
              Start Learning Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-surface py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-bold text-ink-primary">Student Hub</span>
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
    <div className="bg-surface border border-surface-border rounded-xl p-6 hover:border-brand-600 hover:shadow-lg transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-brand-50 rounded-lg text-brand-600">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-ink-primary">{title}</h3>
      </div>
      <p className="text-ink-secondary leading-relaxed">{description}</p>
    </div>
  );
}
