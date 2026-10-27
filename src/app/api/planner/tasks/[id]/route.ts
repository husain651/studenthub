import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { query, queryOne } from "@/lib/db";

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  topicId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  isCompleted: z.boolean().optional(),
});

export async function PATCH(
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

    const taskId = params.id;

    // Verify ownership
    const task = await queryOne(
      `SELECT id FROM study_tasks WHERE id = $1 AND user_id = $2`,
      [taskId, user.id]
    );

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = updateTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { title, description, topicId, dueDate, priority, isCompleted } = validation.data;

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    if (topicId !== undefined) {
      updates.push(`topic_id = $${paramIndex++}`);
      params.push(topicId);
    }
    if (dueDate !== undefined) {
      updates.push(`due_date = $${paramIndex++}`);
      params.push(dueDate);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      params.push(priority);
    }
    if (isCompleted !== undefined) {
      updates.push(`is_completed = $${paramIndex++}`);
      params.push(isCompleted);
      if (isCompleted) {
        updates.push(`completed_at = CURRENT_TIMESTAMP`);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    params.push(taskId, user.id);

    await query(
      `UPDATE study_tasks
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}`,
      params
    );

    const updatedTask = await queryOne(
      `SELECT * FROM study_tasks WHERE id = $1`,
      [taskId]
    );

    return NextResponse.json({ task: updatedTask, success: true });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const taskId = params.id;

    // Verify ownership
    const task = await queryOne(
      `SELECT id FROM study_tasks WHERE id = $1 AND user_id = $2`,
      [taskId, user.id]
    );

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await query(
      `DELETE FROM study_tasks WHERE id = $1 AND user_id = $2`,
      [taskId, user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
