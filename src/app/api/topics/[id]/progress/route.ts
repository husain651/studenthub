import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { query, queryOne } from "@/lib/db";

const progressSchema = z.object({
  is_completed: z.boolean(),
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
    const validation = progressSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { is_completed } = validation.data;
    const topicId = params.id;

    // Check if progress record exists
    const existing = await queryOne(
      `SELECT id FROM topic_progress WHERE user_id = $1 AND topic_id = $2`,
      [user.id, topicId]
    );

    if (existing) {
      await query(
        `UPDATE topic_progress
         SET is_completed = $1, completed_at = CASE WHEN $1 THEN CURRENT_TIMESTAMP ELSE NULL END
         WHERE user_id = $2 AND topic_id = $3`,
        [is_completed, user.id, topicId]
      );
    } else {
      const progressId = `prog-${user.id}-${topicId}`;
      await query(
        `INSERT INTO topic_progress (id, user_id, topic_id, is_completed, completed_at, last_accessed_at, view_count)
         VALUES ($1, $2, $3, $4, CASE WHEN $4 THEN CURRENT_TIMESTAMP ELSE NULL, CURRENT_TIMESTAMP, 1)`,
        [progressId, user.id, topicId, is_completed]
      );
    }

    return NextResponse.json({ success: true, is_completed });
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
