import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, queryOne } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    // Ensure database is initialized
    const { ensureDbReady } = await import("@/lib/db");
    await ensureDbReady();

    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find user
    const user = await queryOne(
      `SELECT id, email, password_hash, full_name, email_verified, status
       FROM users
       WHERE email = $1 AND status = 'active'`,
      [email.toLowerCase()]
    );

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Get user roles
    const roleRows = await query(
      `SELECT r.name FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    const roles = roleRows.map((r: any) => r.name);

    // Get academic preferences
    const preferences = await queryOne(
      `SELECT preferred_language, onboarding_completed
       FROM student_academic_preferences
       WHERE user_id = $1`,
      [user.id]
    );

    // Create session
    await setSessionCookie({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      emailVerified: user.email_verified,
      roles: roles.length > 0 ? roles : ["student"],
      preferredLanguage: preferences?.preferred_language || "en",
      onboardingCompleted: Boolean(preferences?.onboarding_completed),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        emailVerified: user.email_verified,
        onboardingCompleted: Boolean(preferences?.onboarding_completed),
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
