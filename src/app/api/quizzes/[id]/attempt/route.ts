import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { query, queryOne } from "@/lib/db";

const attemptSchema = z.object({
  answers: z.record(z.string()), // question_id -> option_id
  timeSpentSeconds: z.number(),
});

export async function POST(
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

    const body = await req.json();
    const validation = attemptSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { answers, timeSpentSeconds } = validation.data;
    const quizId = params.id;

    // Get quiz details
    const quiz = await queryOne(
      `SELECT id, title_en, passing_percentage
       FROM quizzes
       WHERE id = $1 AND is_published = TRUE`,
      [quizId]
    );

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Get all questions with correct answers
    const questions = await query(
      `SELECT qq.id, qq.question_text_en, qq.question_text_ur,
              qq.explanation_en, qq.explanation_ur, qq.points
       FROM quiz_questions qq
       WHERE qq.quiz_id = $1
       ORDER BY qq.question_number`,
      [quizId]
    );

    // Get correct options for each question
    const questionsWithCorrect = await Promise.all(
      questions.map(async (question: any) => {
        const options = await query(
          `SELECT id, option_key, option_text_en, option_text_ur, is_correct
           FROM question_options
           WHERE question_id = $1
           ORDER BY option_key`,
          [question.id]
        );

        const correctOption = options.find((o: any) => o.is_correct);

        return {
          ...question,
          options,
          correctOption,
        };
      })
    );

    // Calculate score
    let correctCount = 0;
    const responses: any[] = [];

    for (const question of questionsWithCorrect) {
      const selectedOptionId = answers[question.id];
      const selectedOption = question.options.find((o: any) => o.id === selectedOptionId);
      const isCorrect = selectedOption?.is_correct || false;

      if (isCorrect) {
        correctCount++;
      }

      responses.push({
        question_id: question.id,
        question_text: question.question_text_en,
        selected_option_id: selectedOptionId || null,
        selected_option_key: selectedOption?.option_key || null,
        is_correct: isCorrect,
        correct_option_key: question.correctOption?.option_key,
        explanation: question.explanation_en,
      });
    }

    const totalQuestions = questions.length;
    const scorePercentage = totalQuestions > 0
      ? (correctCount / totalQuestions) * 100
      : 0;
    const passed = scorePercentage >= quiz.passing_percentage;

    // Create quiz attempt record
    const attemptId = `attempt-${user.id}-${quizId}-${Date.now()}`;
    const now = new Date();

    await query(
      `INSERT INTO quiz_attempts
       (id, quiz_id, user_id, total_questions, correct_count, score_percentage,
        passed, time_spent_seconds, snapshot_quiz_title, started_at, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        attemptId,
        quizId,
        user.id,
        totalQuestions,
        correctCount,
        scorePercentage,
        passed,
        timeSpentSeconds,
        quiz.title_en,
        new Date(now.getTime() - timeSpentSeconds * 1000),
        now,
      ]
    );

    // Save responses
    for (const response of responses) {
      await query(
        `INSERT INTO quiz_responses
         (id, attempt_id, question_id, question_text, selected_option_id,
          selected_option_key, is_correct, correct_option_key, explanation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          `resp-${attemptId}-${response.question_id}`,
          attemptId,
          response.question_id,
          response.question_text,
          response.selected_option_id,
          response.selected_option_key,
          response.is_correct,
          response.correct_option_key,
          response.explanation,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      attemptId,
      score: {
        total: totalQuestions,
        correct: correctCount,
        percentage: scorePercentage,
        passed,
      },
      responses,
    });
  } catch (error) {
    console.error("Error submitting quiz attempt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
