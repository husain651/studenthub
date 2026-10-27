import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, queryOne } from "@/lib/db";
import { hashPassword, generateSecureToken } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
});

export async function POST(req: NextRequest) {
  try {
    // Ensure database is initialized
    const { ensureDbReady } = await import("@/lib/db");
    await ensureDbReady();

    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, password, fullName } = validation.data;

    // Check if user already exists
    const existingUser = await queryOne(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Create user
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const passwordHash = await hashPassword(password);
    const emailVerificationToken = generateSecureToken();

    await query(
      `INSERT INTO users (id, email, password_hash, full_name, email_verification_token, email_verification_sent_at, status)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, 'active')`,
      [userId, email.toLowerCase(), passwordHash, fullName, emailVerificationToken]
    );

    // Assign student role
    await query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, 'role-student')`,
      [userId]
    );

    // Assign free plan
    await query(
      `INSERT INTO user_plan_assignments (id, user_id, plan_id) VALUES ($1, $2, 'free')`,
      [`plan-${userId}`, userId]
    );

    // TODO: Send verification email (requires email service configuration)
    // For now, we'll auto-verify in development
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      await query(
        `UPDATE users SET email_verified = TRUE WHERE id = $1`,
        [userId]
      );
    }

    // Create session
    const user = await queryOne(
      `SELECT id, email, full_name, email_verified, status FROM users WHERE id = $1`,
      [userId]
    );

    if (user) {
      await setSessionCookie({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        emailVerified: user.email_verified,
        roles: ["student"],
        onboardingCompleted: false,
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: email.toLowerCase(),
        fullName,
        emailVerified: isDev,
      },
      requiresVerification: !isDev,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
