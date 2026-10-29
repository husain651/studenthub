import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { query, queryOne } from "@/lib/db";
import { getAIProvider, AIContext, describeAIError } from "@/lib/ai/provider";

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message is required"),
});

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

    const conversationId = params.id;

    // Verify ownership
    const conversation = await queryOne(
      `SELECT id FROM ai_conversations WHERE id = $1 AND user_id = $2`,
      [conversationId, user.id]
    );

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get messages
    const messages = await query(
      `SELECT id, sender_role, content, created_at
       FROM ai_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const conversationId = params.id;

    // Verify ownership
    const conversation = await queryOne(
      `SELECT id, context_subject_id, context_topic_id FROM ai_conversations WHERE id = $1 AND user_id = $2`,
      [conversationId, user.id]
    );

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
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
    const validation = sendMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { content } = validation.data;

    // Load recent turns so the tutor keeps the thread of the conversation
    const historyRows = await query<{ sender_role: "user" | "assistant"; content: string }>(
      `SELECT sender_role, content
       FROM ai_messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [conversationId]
    );

    // Get context for AI
    let subjectName = null;
    let topicTitle = null;

    if (conversation.context_subject_id) {
      const subject = await queryOne(
        "SELECT name_en FROM subjects WHERE id = $1",
        [conversation.context_subject_id]
      );
      if (subject) subjectName = subject.name_en;
    }

    if (conversation.context_topic_id) {
      const topic = await queryOne(
        `SELECT title_en FROM topics WHERE id = $1`,
        [conversation.context_topic_id]
      );
      if (topic) topicTitle = topic.title_en;
    }

    // Generate the reply before persisting, so a failed AI call leaves no orphaned
    // user message and the student can retry cleanly.
    const aiProvider = getAIProvider();
    const aiContext: AIContext = {
      subject: subjectName || undefined,
      topic: topicTitle || undefined,
      language: user.preferredLanguage || "en",
      conversationHistory: [...historyRows].reverse().map((row) => ({
        role: row.sender_role,
        content: row.content,
      })),
    };

    let aiReply;
    try {
      aiReply = await aiProvider.generateResponse(content, aiContext);
    } catch (error) {
      console.error("AI generation failed:", error);
      const { message, status } = describeAIError(error);
      return NextResponse.json({ error: message }, { status });
    }

    // Save user message
    const userMessageId = `msg-${crypto.randomUUID()}`;
    await query(
      `INSERT INTO ai_messages (id, conversation_id, sender_role, content)
       VALUES ($1, $2, 'user', $3)`,
      [userMessageId, conversationId, content]
    );

    // Update conversation timestamp
    await query(
      `UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [conversationId]
    );

    // Save AI message
    const assistantMessageId = `msg-${crypto.randomUUID()}`;
    await query(
      `INSERT INTO ai_messages (id, conversation_id, sender_role, content)
       VALUES ($1, $2, 'assistant', $3)`,
      [assistantMessageId, conversationId, aiReply.content]
    );

    // Log usage event
    await query(
      `INSERT INTO ai_usage_events (id, user_id, conversation_id, query_tokens, response_tokens)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        `usage-${crypto.randomUUID()}`,
        user.id,
        conversationId,
        aiReply.usage.queryTokens,
        aiReply.usage.responseTokens,
      ]
    );

    return NextResponse.json({
      userMessage: { id: userMessageId, role: "user", content },
      assistantMessage: {
        id: assistantMessageId,
        role: "assistant",
        content: aiReply.content,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
