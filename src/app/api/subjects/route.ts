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

    // Get user's academic preferences
    const preferences = await queryOne(
      `SELECT curriculum_id, board_id, academic_level_id, selected_subject_ids
       FROM student_academic_preferences
       WHERE user_id = $1`,
      [user.id]
    );

    const selectedSubjectIds = preferences?.selected_subject_ids
      ? Array.isArray(preferences.selected_subject_ids)
        ? preferences.selected_subject_ids
        : JSON.parse(preferences.selected_subject_ids as string)
      : [];

    // Get subject offerings based on user's preferences
    const subjects = await query(
      `SELECT so.id, so.syllabus_year, so.description_en, so.description_ur,
              s.id as subject_id, s.code, s.name_en, s.name_ur, s.icon_name, s.category,
              c.id as curriculum_id, c.name_en as curriculum_name,
              b.id as board_id, b.name_en as board_name,
              al.id as academic_level_id, al.code as class_code, al.name_en as class_name
       FROM subject_offerings so
       JOIN subjects s ON s.id = so.subject_id
       JOIN curricula c ON c.id = so.curriculum_id
       LEFT JOIN boards b ON b.id = so.board_id
       JOIN academic_levels al ON al.id = so.academic_level_id
       WHERE so.is_published = TRUE
       ${preferences?.academic_level_id ? `AND al.id = '${preferences.academic_level_id}'` : ''}
       ${preferences?.curriculum_id ? `AND c.id = '${preferences.curriculum_id}'` : ''}
       ${preferences?.board_id ? `AND b.id = '${preferences.board_id}'` : ''}
       ORDER BY s.category, al.grade_order, s.name_en`
    );

    // Get progress for each subject
    const subjectsWithProgress = await Promise.all(
      (subjects as any[]).map(async (subject) => {
        const totalTopics = await queryOne(
          `SELECT COUNT(*) as count
           FROM topics t
           JOIN chapters ch ON ch.id = t.chapter_id
           WHERE ch.subject_offering_id = $1 AND t.is_active = TRUE`,
          [subject.id]
        );

        const completedTopics = await queryOne(
          `SELECT COUNT(*) as count
           FROM topic_progress tp
           JOIN topics t ON t.id = tp.topic_id
           JOIN chapters ch ON ch.id = t.chapter_id
           WHERE tp.user_id = $1
           AND ch.subject_offering_id = $2
           AND tp.is_completed = TRUE`,
          [user.id, subject.id]
        );

        return {
          ...subject,
          is_selected: selectedSubjectIds.includes(subject.subject_id),
          progress: {
            total: Number(totalTopics?.count || 0),
            completed: Number(completedTopics?.count || 0),
          },
        };
      })
    );

    return NextResponse.json(subjectsWithProgress);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
