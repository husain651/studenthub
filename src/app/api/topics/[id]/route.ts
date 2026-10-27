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

    const topicId = params.id;

    // Get topic details
    const topic = await queryOne(
      `SELECT t.id, t.topic_number, t.title_en, t.title_ur, t.summary_en, t.summary_ur,
              ch.id as chapter_id, ch.chapter_number, ch.title_en as chapter_title,
              ch.subject_offering_id,
              s.id as subject_id, s.name_en as subject_name, s.icon_name,
              al.code as class_code, al.name_en as class_name
       FROM topics t
       JOIN chapters ch ON ch.id = t.chapter_id
       JOIN subject_offerings so ON so.id = ch.subject_offering_id
       JOIN subjects s ON s.id = so.subject_id
       JOIN academic_levels al ON al.id = so.academic_level_id
       WHERE t.id = $1 AND t.is_active = TRUE`,
      [topicId]
    );

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Get published resource for this topic
    const preferredLanguage = user?.preferredLanguage || "en";

    const publication = await queryOne(
      `SELECT rp.language, rp.published_version_id,
              rv.id as version_id, rv.version_number, rv.title, rv.content_markdown,
              rv.key_takeaways, rv.formulas, rv.source_citation, rv.author_type
       FROM resource_publications rp
       JOIN resource_versions rv ON rv.id = rp.published_version_id
       JOIN learning_resources lr ON lr.id = rp.resource_id
       WHERE lr.topic_id = $1
       AND rp.language = $2
       AND rp.is_active = TRUE
       AND rv.review_status = 'approved'
       LIMIT 1`,
      [topicId, preferredLanguage]
    );

    // If no resource in preferred language, try English as fallback
    let resource = publication;
    if (!resource && preferredLanguage !== "en") {
      resource = await queryOne(
        `SELECT rp.language, rp.published_version_id,
                rv.id as version_id, rv.version_number, rv.title, rv.content_markdown,
                rv.key_takeaways, rv.formulas, rv.source_citation, rv.author_type
         FROM resource_publications rp
         JOIN resource_versions rv ON rv.id = rp.published_version_id
         JOIN learning_resources lr ON lr.id = rp.resource_id
         WHERE lr.topic_id = $1
         AND rp.language = 'en'
         AND rp.is_active = TRUE
         AND rv.review_status = 'approved'
         LIMIT 1`,
        [topicId]
      );
    }

    // Get navigation (previous and next topics)
    const navigation = await query(
      `SELECT t.id, t.title_en, t.order_index
       FROM topics t
       WHERE t.chapter_id = $1
       AND t.is_active = TRUE
       ORDER BY t.order_index`,
      [topic.chapter_id]
    );

    const currentIndex = navigation.findIndex((t: any) => t.id === topicId);
    const previousTopic = currentIndex > 0 ? navigation[currentIndex - 1] : null;
    const nextTopic = currentIndex < navigation.length - 1 ? navigation[currentIndex + 1] : null;

    // Get user's progress and bookmark status
    let progress = null;
    let isBookmarked = false;

    if (user) {
      progress = await queryOne(
        `SELECT is_completed, last_accessed_at, view_count
         FROM topic_progress
         WHERE user_id = $1 AND topic_id = $2`,
        [user.id, topicId]
      );

      const bookmark = await queryOne(
        `SELECT id FROM bookmarks WHERE user_id = $1 AND topic_id = $2`,
        [user.id, topicId]
      );
      isBookmarked = !!bookmark;

      // Update last accessed
      if (progress) {
        await query(
          `UPDATE topic_progress
           SET last_accessed_at = CURRENT_TIMESTAMP, view_count = view_count + 1
           WHERE user_id = $1 AND topic_id = $2`,
          [user.id, topicId]
        );
      } else {
        await query(
          `INSERT INTO topic_progress (id, user_id, topic_id, last_accessed_at, view_count)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 1)`,
          [`prog-${user.id}-${topicId}`, user.id, topicId]
        );
      }
    }

    // Check if quiz exists for this topic
    const quiz = await queryOne(
      `SELECT id, title_en, time_limit_seconds
       FROM quizzes
       WHERE topic_id = $1 AND is_published = TRUE`,
      [topicId]
    );

    return NextResponse.json({
      topic,
      resource: resource ? {
        ...resource,
        key_takeaways: resource.key_takeaways || [],
        formulas: resource.formulas || [],
      } : null,
      navigation: {
        previous: previousTopic,
        next: nextTopic,
      },
      progress,
      isBookmarked,
      hasQuiz: !!quiz,
      quizId: quiz?.id,
    });
  } catch (error) {
    console.error("Error fetching topic:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
