"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Send,
  Loader2,
  ChevronLeft,
  Brain,
  MessageSquare,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Conversation {
  id: string;
  title: string;
  subject_name: string | null;
  topic_name: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface Message {
  id: string;
  sender_role: "user" | "assistant";
  content: string;
  created_at: string;
}

export default function TutorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/tutor/conversations");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const json = await res.json();
      setConversations(json.conversations);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conversationId: string) => {
    setActiveConversation(conversationId);
    setShowNewChat(false);

    try {
      const res = await fetch(`/api/tutor/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      const json = await res.json();
      setMessages(json.messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const startNewChat = async () => {
    if (!inputMessage.trim()) return;

    setSending(true);

    try {
      const res = await fetch("/api/tutor/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initialMessage: inputMessage,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        if (error.error === "Daily AI limit reached") {
          alert(`You've reached your daily AI limit of ${error.limit} questions. Upgrade your plan for more.`);
          return;
        }
        throw new Error("Failed to create conversation");
      }

      const json = await res.json();
      setActiveConversation(json.conversationId);
      setMessages([
        json.userMessage,
        json.assistantMessage,
      ]);
      setInputMessage("");
      setShowNewChat(false);
      fetchConversations();
    } catch (err: any) {
      console.error("Error creating conversation:", err);
      alert(err.message || "Failed to start new chat");
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeConversation || sending) return;

    setSending(true);
    const tempMessage = inputMessage;
    setInputMessage("");

    try {
      const res = await fetch(`/api/tutor/conversations/${activeConversation}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: tempMessage }),
      });

      if (!res.ok) {
        const error = await res.json();
        if (error.error === "Daily AI limit reached") {
          alert(`You've reached your daily AI limit of ${error.limit} questions. Upgrade your plan for more.`);
          setInputMessage(tempMessage);
          return;
        }
        throw new Error("Failed to send message");
      }

      const json = await res.json();
      setMessages([...messages, json.userMessage, json.assistantMessage]);
    } catch (err: any) {
      console.error("Error sending message:", err);
      alert(err.message || "Failed to send message");
      setInputMessage(tempMessage);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (showNewChat) {
        startNewChat();
      } else {
        sendMessage();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-surface-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-ink-secondary hover:text-ink-primary">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-brand-600" />
                <span className="font-semibold text-ink-primary">AI Tutor</span>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Conversations List */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink-primary">Conversations</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNewChat(true);
                  setActiveConversation(null);
                  setMessages([]);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {conversations.length === 0 ? (
                <p className="text-sm text-ink-muted text-center py-4">
                  No conversations yet
                </p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      activeConversation === conv.id
                        ? "bg-brand-50 border border-brand-600"
                        : "bg-surface border border-surface-border hover:border-surface-subtle"
                    }`}
                  >
                    <p className="font-medium text-ink-primary text-sm truncate">
                      {conv.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-ink-muted" />
                      <span className="text-xs text-ink-muted">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </span>
                      <MessageSquare className="h-3 w-3 text-ink-muted ml-auto" />
                      <span className="text-xs text-ink-muted">{conv.message_count}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-surface border border-surface-border rounded-lg h-[calc(100vh-12rem)] flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                {showNewChat ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <Brain className="h-16 w-16 text-ink-faint mb-4" />
                    <h3 className="text-xl font-semibold text-ink-primary mb-2">
                      Start a New Conversation
                    </h3>
                    <p className="text-ink-secondary max-w-md">
                      Ask questions about your subjects, get explanations for difficult concepts, or get help with homework.
                    </p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <MessageSquare className="h-16 w-16 text-ink-faint mb-4" />
                    <h3 className="text-xl font-semibold text-ink-primary mb-2">
                      Select a Conversation
                    </h3>
                    <p className="text-ink-secondary">
                      Choose a conversation from the sidebar or start a new one.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.sender_role === "user"
                              ? "bg-brand-600 text-white"
                              : "bg-surface-muted text-ink-primary"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-surface-border p-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Ask a question..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button
                    onClick={showNewChat ? startNewChat : sendMessage}
                    disabled={sending || !inputMessage.trim()}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-ink-muted mt-2">
                  AI responses are generated for learning purposes. Always verify important information with your textbooks or teachers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
