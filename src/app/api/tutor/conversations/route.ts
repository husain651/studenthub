import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { query, queryOne } from "@/lib/db";
import { getAIProvider, AIContext } from "@/lib/ai/provider";

const createConversationSchema = z.object({
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  initialMessage: z.string().min(1, "Message is required"),
});

export async function GET(req: NextRequest) {
  try {
    const { ensureDbReady } = await import("@/lib/db");
    await ensureDbReady();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get recent conversations
    const conversations = await query(
      `SELECT ac.id, ac.title, ac.context_subject_id, ac.context_topic_id,
              s.name_en as subject_name, t.title_en as topic_name,
              ac.created_at, ac.updated_at,
              (SELECT COUNT(*) FROM ai_messages WHERE conversation_id = ac.id) as message_count
       FROM ai_conversations ac
       LEFT JOIN subjects s ON s.id = ac.context_subject_id
       LEFT JOIN topics t ON t.id = ac.context_topic_id
       WHERE ac.user_id = $1
       ORDER BY ac.updated_at DESC
       LIMIT 20`,
      [user.id]
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
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

    // Check AI usage limit
    const plan = await queryOne(
      `SELECT p.daily_ai_limit
       FROM user_plan_assignments upa
       JOIN plans p ON p.id = upa.plan_id
       WHERE upa.user_id = $1 AND upa.is_active = TRUE`,
      [user.id]
    );

    if (!plan) {
      return NextResponse.json({ error: "No active plan found" }, { status: 403 });
    }

    // Check today's usage
    const todayUsage = await queryOne(
      `SELECT COALESCE(SUM(query_tokens + response_tokens), 0) as total_tokens
       FROM ai_usage_events
       WHERE user_id = $1
       AND DATE(created_at) = CURRENT_DATE`,
      [user.id]
    );

    // For simplicity, we'll count requests instead of tokens for the limit
    const todayRequestCount = await queryOne(
      `SELECT COUNT(*) as count
       FROM ai_usage_events
       WHERE user_id = $1
       AND DATE(created_at) = CURRENT_DATE`,
      [user.id]
    );

    if (Number(todayRequestCount?.count || 0) >= plan.daily_ai_limit) {
      return NextResponse.json(
        { error: "Daily AI limit reached", limit: plan.daily_ai_limit },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = createConversationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { subjectId, topicId, initialMessage } = validation.data;

    // Get context information
    let contextTitle = "General Question";
    let subjectName = null;
    let topicTitle = null;

    if (subjectId) {
      const subject = await queryOne(
        "SELECT name_en FROM subjects WHERE id = $1",
        [subjectId]
      );
      if (subject) {
        subjectName = subject.name_en;
        contextTitle = subject.name_en;
      }
    }

    if (topicId) {
      const topic = await queryOne(
        `SELECT t.title_en, s.name_en as subject_name
         FROM topics t
         JOIN chapters ch ON ch.id = t.chapter_id
         JOIN subject_offerings so ON so.id = ch.subject_offering_id
         JOIN subjects s ON s.id = so.subject_id
         WHERE t.id = $1`,
        [topicId]
      );
      if (topic) {
        topicTitle = topic.title_en;
        contextTitle = topic.title_en;
        if (!subjectName) subjectName = topic.subject_name;
      }
    }

    // Create conversation
    const conversationId = `conv-${user.id}-${Date.now()}`;

    await query(
      `INSERT INTO ai_conversations (id, user_id, title, context_subject_id, context_topic_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [conversationId, user.id, contextTitle, subjectId || null, topicId || null]
    );

    // Save user message
    const userMessageId = `msg-${conversationId}-user-1`;
    await query(
      `INSERT INTO ai_messages (id, conversation_id, sender_role, content)
       VALUES ($1, $2, 'user', $3)`,
      [userMessageId, conversationId, initialMessage]
    );

    // Generate AI response
    const aiProvider = getAIProvider();
    const aiContext: AIContext = {
      subject: subjectName || undefined,
      topic: topicTitle || undefined,
      language: user.preferredLanguage || "en",
    };

    const aiResponse = await aiProvider.generateResponse(initialMessage, aiContext);

    // Save AI message
    const assistantMessageId = `msg-${conversationId}-assistant-1`;
    await query(
      `INSERT INTO ai_messages (id, conversation_id, sender_role, content)
       VALUES ($1, $2, 'assistant', $3)`,
      [assistantMessageId, conversationId, aiResponse]
    );

    // Log usage event
    await query(
      `INSERT INTO ai_usage_events (id, user_id, conversation_id, query_tokens, response_tokens)
       VALUES ($1, $2, $3, 0, 0)`,
      [`usage-${conversationId}-${Date.now()}`, user.id, conversationId]
    );

    return NextResponse.json({
      conversationId,
      userMessage: { id: userMessageId, role: "user", content: initialMessage },
      assistantMessage: { id: assistantMessageId, role: "assistant", content: aiResponse },
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
