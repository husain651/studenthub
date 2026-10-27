import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { query, queryOne } from "@/lib/db";

const preferencesSchema = z.object({
  curriculumId: z.string().optional(),
  boardId: z.string().optional(),
  academicLevelId: z.string().optional(),
  preferredLanguage: z.enum(["en", "ur"]),
  selectedSubjectIds: z.array(z.string()),
});

export async function GET(req: NextRequest) {
  try {
    const { ensureDbReady } = await import("@/lib/db");
    await ensureDbReady();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch available curricula
    const curricula = await query(
      `SELECT id, code, name_en, name_ur, country
       FROM curricula
       WHERE is_active = TRUE
       ORDER BY country, name_en`
    );

    // Fetch boards for active curricula
    const boards = await query(
      `SELECT id, curriculum_id, code, name_en, name_ur, jurisdiction
       FROM boards
       WHERE is_active = TRUE
       ORDER BY curriculum_id, name_en`
    );

    // Fetch academic levels
    const academicLevels = await query(
      `SELECT id, code, name_en, name_ur, grade_order
       FROM academic_levels
       WHERE is_active = TRUE
       ORDER BY grade_order`
    );

    // Fetch available subjects
    const subjects = await query(
      `SELECT id, code, name_en, name_ur, icon_name, category
       FROM subjects
       WHERE is_active = TRUE
       ORDER BY category, name_en`
    );

    return NextResponse.json({
      curricula,
      boards,
      academicLevels,
      subjects,
    });
  } catch (error) {
    console.error("Error fetching onboarding data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ensureDbReady } = await import("@/lib/db");
    await ensureDbReady();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = preferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { curriculumId, boardId, academicLevelId, preferredLanguage, selectedSubjectIds } = validation.data;

    // Check if preferences already exist
    const existing = await queryOne(
      `SELECT id FROM student_academic_preferences WHERE user_id = $1`,
      [user.id]
    );

    if (existing) {
      // Update existing preferences
      await query(
        `UPDATE student_academic_preferences
         SET curriculum_id = $1, board_id = $2, academic_level_id = $3,
             preferred_language = $4, selected_subject_ids = $5::jsonb,
             onboarding_completed = TRUE, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $6`,
        [curriculumId, boardId, academicLevelId, preferredLanguage, JSON.stringify(selectedSubjectIds), user.id]
      );
    } else {
      // Create new preferences
      const prefId = `pref-${user.id}`;
      await query(
        `INSERT INTO student_academic_preferences
         (id, user_id, curriculum_id, board_id, academic_level_id, preferred_language,
          selected_subject_ids, onboarding_completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, TRUE)`,
        [prefId, user.id, curriculumId, boardId, academicLevelId, preferredLanguage, JSON.stringify(selectedSubjectIds)]
      );
    }

    // Update session to reflect onboarding completion
    // Note: In production, you'd re-issue the session token here

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
