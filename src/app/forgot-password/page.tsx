"use client";

import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full">
        <div className="mb-8">
          <Link href="/login" className="inline-flex items-center gap-2 text-ink-secondary hover:text-ink-primary mb-6">
            <ArrowLeft className="h-5 w-5" />
            Back to Login
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <BookOpen className="h-8 w-8 text-brand-600" />
            <span className="text-xl font-semibold text-ink-primary">Student Hub</span>
          </Link>
          <h1 className="text-2xl font-bold text-ink-primary mb-2">Reset Password</h1>
          <p className="text-ink-secondary">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="bg-surface border border-surface-border rounded-lg p-8">
          <Alert variant="info" className="mb-6">
            Password reset is not yet configured. Please contact support for assistance.
          </Alert>

          <div className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              disabled
            />

            <Button className="w-full" disabled>
              Send Reset Link
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-ink-secondary">
            Remember your password?{" "}
            <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
