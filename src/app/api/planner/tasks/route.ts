import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { query, queryOne } from "@/lib/db";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  topicId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export async function GET(req: NextRequest) {
  try {
    const { ensureDbReady } = await import("@/lib/db");
    await ensureDbReady();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";

    let whereClause = "WHERE user_id = $1";
    const params: any[] = [user.id];

    if (filter === "today") {
      whereClause += " AND (due_date = CURRENT_DATE OR due_date IS NULL)";
    } else if (filter === "upcoming") {
      whereClause += " AND due_date > CURRENT_DATE AND due_date <= CURRENT_DATE + INTERVAL '7 days'";
    } else if (filter === "overdue") {
      whereClause += " AND due_date < CURRENT_DATE AND is_completed = FALSE";
    } else if (filter === "completed") {
      whereClause += " AND is_completed = TRUE";
    }

    const tasks = await query(
      `SELECT id, title, description, topic_id, due_date, priority, is_completed, completed_at, created_at
       FROM study_tasks
       ${whereClause}
       ORDER BY due_date ASC NULLS LAST, priority DESC, created_at ASC`,
      params
    );

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
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
    const validation = taskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { title, description, topicId, dueDate, priority } = validation.data;

    const taskId = `task-${user.id}-${Date.now()}`;

    await query(
      `INSERT INTO study_tasks (id, user_id, topic_id, title, description, due_date, priority, is_completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)`,
      [taskId, user.id, topicId || null, title, description || null, dueDate || null, priority]
    );

    const task = await queryOne(
      `SELECT * FROM study_tasks WHERE id = $1`,
      [taskId]
    );

    return NextResponse.json({ task, success: true });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
