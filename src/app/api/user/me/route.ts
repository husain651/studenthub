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

    // Get academic preferences
    const preferences = await queryOne(
      `SELECT curriculum_id, board_id, academic_level_id, preferred_language,
              selected_subject_ids, onboarding_completed
       FROM student_academic_preferences
       WHERE user_id = $1`,
      [user.id]
    );

    if (!preferences || !preferences.onboarding_completed) {
      return NextResponse.json({
        user,
        needsOnboarding: true,
      });
    }

    // Get subject offerings for user's selected subjects
    const subjectIds = preferences.selected_subject_ids as string[];
    const subjectOfferings = await query(
      `SELECT so.id, s.id as subject_id, s.code, s.name_en, s.name_ur, s.icon_name, s.category,
              al.code as class_code, al.name_en as class_name
       FROM subject_offerings so
       JOIN subjects s ON s.id = so.subject_id
       JOIN academic_levels al ON al.id = so.academic_level_id
       WHERE so.is_published = TRUE
       AND so.subject_id = ANY($1)
       AND so.academic_level_id = $2
       ORDER BY s.category, s.name_en`,
      [subjectIds, preferences.academic_level_id]
    );

    // Get recent progress (last 5 topics accessed)
    const recentProgress = await query(
      `SELECT tp.topic_id, t.title_en, t.title_ur, ch.title_en as chapter_title,
              ch.subject_offering_id, s.name_en as subject_name, s.icon_name,
              tp.last_accessed_at, tp.is_completed
       FROM topic_progress tp
       JOIN topics t ON t.id = tp.topic_id
       JOIN chapters ch ON ch.id = t.chapter_id
       JOIN subject_offerings so ON so.id = ch.subject_offering_id
       JOIN subjects s ON s.id = so.subject_id
       WHERE tp.user_id = $1
       AND so.subject_id = ANY($2)
       ORDER BY tp.last_accessed_at DESC
       LIMIT 5`,
      [user.id, subjectIds]
    );

    // Get today's study tasks
    const todayTasks = await query(
      `SELECT id, title, description, due_date, priority, is_completed, topic_id
       FROM study_tasks
       WHERE user_id = $1
       AND (due_date = CURRENT_DATE OR due_date IS NULL)
       AND is_completed = FALSE
       ORDER BY priority DESC, created_at ASC`,
      [user.id]
    );

    // Get upcoming tasks (next 7 days)
    const upcomingTasks = await query(
      `SELECT id, title, due_date, priority
       FROM study_tasks
       WHERE user_id = $1
       AND due_date > CURRENT_DATE
       AND due_date <= CURRENT_DATE + INTERVAL '7 days'
       AND is_completed = FALSE
       ORDER BY due_date ASC`,
      [user.id]
    );

    // Get recent quiz attempts
    const recentQuizzes = await query(
      `SELECT qa.id, qa.snapshot_quiz_title, qa.score_percentage, qa.passed,
              qa.completed_at, t.title_en as topic_title
       FROM quiz_attempts qa
       JOIN quizzes q ON q.id = qa.quiz_id
       JOIN topics t ON t.id = q.topic_id
       WHERE qa.user_id = $1
       ORDER BY qa.completed_at DESC
       LIMIT 5`,
      [user.id]
    );

    // Get overall progress stats
    const progressStats = await queryOne(
      `SELECT COUNT(DISTINCT tp.topic_id) as topics_completed,
              COUNT(DISTINCT CASE WHEN tp.is_completed THEN tp.topic_id END) as completed_count
       FROM topic_progress tp
       JOIN topics t ON t.id = tp.topic_id
       JOIN chapters ch ON ch.id = t.chapter_id
       JOIN subject_offerings so ON so.id = ch.subject_offering_id
       WHERE tp.user_id = $1
       AND so.subject_id = ANY($2)`,
      [user.id, subjectIds]
    );

    return NextResponse.json({
      user,
      preferences,
      subjectOfferings,
      recentProgress,
      todayTasks,
      upcomingTasks,
      recentQuizzes,
      progressStats,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
