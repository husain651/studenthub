import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { query, queryOne } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { ensureDbReady } = await import("@/lib/db");
    await ensureDbReady();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user details from database
    const userDetails = await queryOne(
      `SELECT id, email, full_name, email_verified, created_at, status
       FROM users
       WHERE id = $1`,
      [user.id]
    );

    // Get academic preferences
    const preferences = await queryOne(
      `SELECT curriculum_id, board_id, academic_level_id, preferred_language,
              selected_subject_ids, onboarding_completed
       FROM student_academic_preferences
       WHERE user_id = $1`,
      [user.id]
    );

    // Get stats
    const stats = {
      totalTopicsCompleted: 0,
      totalQuizzesTaken: 0,
      studyStreak: 0,
      totalStudyTime: 0,
    };

    const topicsCompleted = await queryOne(
      `SELECT COUNT(*) as count
       FROM topic_progress
       WHERE user_id = $1 AND is_completed = TRUE`,
      [user.id]
    );
    stats.totalTopicsCompleted = Number(topicsCompleted?.count || 0);

    const quizzesTaken = await queryOne(
      `SELECT COUNT(*) as count
       FROM quiz_attempts
       WHERE user_id = $1`,
      [user.id]
    );
    stats.totalQuizzesTaken = Number(quizzesTaken?.count || 0);

    return NextResponse.json({
      ...userDetails,
      preferred_language: preferences?.preferred_language || "en",
      onboarding_completed: preferences?.onboarding_completed || false,
      roles: user.roles,
      stats,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { ensureDbReady } = await import("@/lib/db");
    await ensureDbReady();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { full_name } = body;

    if (!full_name || full_name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    await query(
      `UPDATE users SET full_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [full_name.trim(), user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
