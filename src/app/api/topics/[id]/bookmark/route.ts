import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { query, queryOne } from "@/lib/db";

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

    const topicId = params.id;

    // Check if already bookmarked
    const existing = await queryOne(
      `SELECT id FROM bookmarks WHERE user_id = $1 AND topic_id = $2`,
      [user.id, topicId]
    );

    if (existing) {
      // Remove bookmark
      await query(
        `DELETE FROM bookmarks WHERE user_id = $1 AND topic_id = $2`,
        [user.id, topicId]
      );
      return NextResponse.json({ bookmarked: false });
    } else {
      // Add bookmark
      const bookmarkId = `bk-${user.id}-${topicId}`;
      await query(
        `INSERT INTO bookmarks (id, user_id, topic_id) VALUES ($1, $2, $3)`,
        [bookmarkId, user.id, topicId]
      );
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
