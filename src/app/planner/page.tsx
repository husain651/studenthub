"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

interface StudyTask {
  id: string;
  title: string;
  description: string | null;
  topic_id: string | null;
  due_date: string | null;
  priority: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export default function PlannerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium" as "low" | "medium" | "high",
  });

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/planner/tasks?filter=${filter}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const json = await res.json();
      setTasks(json.tasks);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/planner/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (!res.ok) throw new Error("Failed to create task");

      setShowAddModal(false);
      setNewTask({ title: "", description: "", dueDate: "", priority: "medium" });
      fetchTasks();
    } catch (err) {
      console.error("Error creating task:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleComplete = async (taskId: string, isCompleted: boolean) => {
    try {
      const res = await fetch(`/api/planner/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !isCompleted }),
      });

      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`/api/planner/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-danger-bg text-danger border-danger";
      case "medium": return "bg-warning-bg text-warning border-warning";
      case "low": return "bg-success-bg text-success border-success";
      default: return "bg-surface-muted text-ink-secondary border-surface-border";
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const isToday = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate).toDateString() === new Date().toDateString();
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-ink-secondary hover:text-ink-primary">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-brand-600" />
                <span className="font-semibold text-ink-primary">Student Hub</span>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-ink-primary mb-2">Study Planner</h1>
            <p className="text-ink-secondary">Organize your study tasks and deadlines</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: "all", label: "All Tasks" },
            { value: "today", label: "Today" },
            { value: "upcoming", label: "Upcoming" },
            { value: "overdue", label: "Overdue" },
            { value: "completed", label: "Completed" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.value
                  ? "bg-brand-600 text-white"
                  : "bg-surface border border-surface-border text-ink-secondary hover:border-surface-subtle"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <div className="bg-surface border border-surface-border rounded-lg p-12 text-center">
            <Calendar className="h-12 w-12 text-ink-faint mx-auto mb-4" />
            <h3 className="font-medium text-ink-primary mb-2">No tasks found</h3>
            <p className="text-sm text-ink-secondary mb-4">
              {filter === "all" ? "Create your first study task to get started" : "No tasks match this filter"}
            </p>
            {filter === "all" && (
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-surface border rounded-lg p-4 transition-all ${
                  task.is_completed ? "border-surface-border opacity-60" : "border-surface-border"
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleComplete(task.id, task.is_completed)}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {task.is_completed ? (
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    ) : (
                      <Circle className="h-6 w-6 text-ink-faint" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className={`font-medium text-ink-primary ${task.is_completed ? "line-through" : ""}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-ink-secondary mt-1">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1 text-ink-muted hover:text-danger transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-ink-secondary">
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span className={isOverdue(task.due_date) ? "text-danger font-medium" : ""}>
                            {new Date(task.due_date).toLocaleDateString()}
                            {isToday(task.due_date) && " (Today)"}
                            {isOverdue(task.due_date) && " (Overdue)"}
                          </span>
                        </div>
                      )}
                      {task.completed_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Completed {new Date(task.completed_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <div className="bg-surface rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-ink-primary mb-4">Add Study Task</h2>

            <form onSubmit={handleAddTask} className="space-y-4">
              <Input
                label="Task Title"
                placeholder="e.g., Complete Chapter 1 exercises"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-ink-primary mb-2">
                  Description (optional)
                </label>
                <textarea
                  placeholder="Add details about this task..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-3 border border-surface-border rounded-lg bg-surface text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-600 min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-primary mb-2">
                  Due Date (optional)
                </label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full px-4 py-3 border border-surface-border rounded-lg bg-surface text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-primary mb-2">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                  className="w-full px-4 py-3 border border-surface-border rounded-lg bg-surface text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? "Adding..." : "Add Task"}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
