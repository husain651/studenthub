import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { query, queryOne } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { ensureDbReady } = await import("@/lib/db");
    await ensureDbReady();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subjectOfferingId = params.id;

    // Get subject offering details
    const offering = await queryOne(
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
       WHERE so.id = $1 AND so.is_published = TRUE`,
      [subjectOfferingId]
    );

    if (!offering) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Get chapters for this subject offering
    const chapters = await query(
      `SELECT id, chapter_number, title_en, title_ur, description_en, description_ur, order_index
       FROM chapters
       WHERE subject_offering_id = $1 AND is_active = TRUE
       ORDER BY order_index`,
      [subjectOfferingId]
    );

    // Get topics for each chapter
    const chaptersWithTopics = await Promise.all(
      chapters.map(async (chapter: any) => {
        const topics = await query(
          `SELECT id, topic_number, title_en, title_ur, summary_en, summary_ur, order_index
           FROM topics
           WHERE chapter_id = $1 AND is_active = TRUE
           ORDER BY order_index`,
          [chapter.id]
        );

        // Get progress for this user on these topics
        const progressMap = new Map();
        if (user) {
          const progress = await query(
            `SELECT topic_id, is_completed, last_accessed_at
             FROM topic_progress
             WHERE user_id = $1 AND topic_id = ANY($2)`,
            [user.id, topics.map((t: any) => t.id)]
          );
          progress.forEach((p: any) => {
            progressMap.set(p.topic_id, p);
          });
        }

        return {
          ...chapter,
          topics: topics.map((topic: any) => ({
            ...topic,
            progress: progressMap.get(topic.id) || null,
          })),
        };
      })
    );

    // Get overall progress for this subject
    const totalTopics = chaptersWithTopics.reduce(
      (sum: number, ch: any) => sum + ch.topics.length,
      0
    );

    const completedTopics = await queryOne(
      `SELECT COUNT(*) as count
       FROM topic_progress tp
       JOIN topics t ON t.id = tp.topic_id
       JOIN chapters ch ON ch.id = t.chapter_id
       WHERE tp.user_id = $1
       AND ch.subject_offering_id = $2
       AND tp.is_completed = TRUE`,
      [user.id, subjectOfferingId]
    );

    return NextResponse.json({
      offering,
      chapters: chaptersWithTopics,
      progress: {
        total: totalTopics,
        completed: Number(completedTopics?.count || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching subject:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
