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

    const quizId = params.id;

    // Get quiz details
    const quiz = await queryOne(
      `SELECT q.id, q.title_en, q.title_ur, q.description_en, q.description_ur,
              q.time_limit_seconds, q.passing_percentage,
              t.id as topic_id, t.title_en as topic_title
       FROM quizzes q
       JOIN topics t ON t.id = q.topic_id
       WHERE q.id = $1 AND q.is_published = TRUE`,
      [quizId]
    );

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Get questions with options (but NOT the correct answers)
    const questions = await query(
      `SELECT qq.id, qq.question_number, qq.question_text_en, qq.question_text_ur,
              qq.points, qq.difficulty
       FROM quiz_questions qq
       WHERE qq.quiz_id = $1
       ORDER BY qq.question_number`,
      [quizId]
    );

    // Get options for each question
    const questionsWithOptions = await Promise.all(
      questions.map(async (question: any) => {
        const options = await query(
          `SELECT id, option_key, option_text_en, option_text_ur
           FROM question_options
           WHERE question_id = $1
           ORDER BY option_key`,
          [question.id]
        );

        return {
          ...question,
          options,
        };
      })
    );

    // Get previous attempts for this user
    const previousAttempts = await query(
      `SELECT id, score_percentage, passed, completed_at
       FROM quiz_attempts
       WHERE quiz_id = $1 AND user_id = $2
       ORDER BY completed_at DESC
       LIMIT 5`,
      [quizId, user.id]
    );

    return NextResponse.json({
      quiz,
      questions: questionsWithOptions,
      previousAttempts,
    });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
