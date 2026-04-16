"use client";

import { useState } from "react";
import type { Task, TaskCompletion, Seat } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ClipboardList,
  Check,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";

interface TaskPanelProps {
  tasks: Task[];
  completions: TaskCompletion[];
  seats: Seat[];
  isInstructorMode: boolean;
  activeTaskId: number | null;
  onSelectTask: (taskId: number | null) => void;
  onCreateTask: (title: string) => void;
  onUpdateTask: (taskId: number, title: string) => void;
  onDeleteTask: (taskId: number) => void;
}

export function TaskPanel({
  tasks,
  completions,
  seats,
  isInstructorMode,
  activeTaskId,
  onSelectTask,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: TaskPanelProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const occupiedSeats = seats.filter((s) => s.studentName);

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onCreateTask(newTaskTitle.trim());
    setNewTaskTitle("");
    setShowAddForm(false);
  }

  function handleSaveEdit(taskId: number) {
    if (!editTitle.trim()) return;
    onUpdateTask(taskId, editTitle.trim());
    setEditingId(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5 text-muted-foreground" />
          <span className="text-base font-medium">수행 목록</span>
          {activeTaskId !== null && (
            <Button
              variant="ghost"
              size="xs"
              className="text-xs h-5 text-muted-foreground"
              onClick={() => onSelectTask(null)}
            >
              전체 보기
            </Button>
          )}
        </div>
        {isInstructorMode && (
          <Button
            variant="outline"
            size="xs"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="size-3" />
            과제 추가
          </Button>
        )}
      </div>

      {/* Add task form */}
      {isInstructorMode && showAddForm && (
        <form onSubmit={handleAddTask} className="flex items-center gap-2 mb-3">
          <Input
            placeholder="과제 제목"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
          <Button size="xs" type="submit" disabled={!newTaskTitle.trim()}>
            추가
          </Button>
        </form>
      )}

      {/* Task cards as selectable pills */}
      {tasks.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">수행 목록이 없습니다.</p>
          {isInstructorMode && (
            <p className="text-xs mt-1">과제를 추가해 주세요.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tasks.map((task) => {
            const isActive = activeTaskId === task.id;
            // Count completions for this task
            const doneCount = occupiedSeats.filter((s) =>
              completions.some(
                (c) => c.taskId === task.id && c.seatId === s.id
              )
            ).length;
            const total = occupiedSeats.length;

            if (editingId === task.id) {
              return (
                <form
                  key={task.id}
                  className="flex items-center gap-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveEdit(task.id);
                  }}
                >
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-7 text-xs w-32"
                    autoFocus
                  />
                  <Button size="xs" type="submit" variant="ghost">
                    <Check className="size-3" />
                  </Button>
                </form>
              );
            }

            return (
              <div key={task.id} className="flex items-center gap-0.5 group">
                <button
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all border ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/50 text-foreground border-muted-foreground/20 hover:bg-muted hover:border-muted-foreground/40"
                  }`}
                  onClick={() =>
                    onSelectTask(isActive ? null : task.id)
                  }
                >
                  {isActive && <Eye className="size-3" />}
                  {task.title}
                  {total > 0 && (
                    <Badge
                      variant="secondary"
                      className={`text-[10px] h-4 ml-0.5 ${
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : doneCount === total
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {doneCount}/{total}
                    </Badge>
                  )}
                </button>
                {isInstructorMode && (
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-5 w-5 p-0"
                      onClick={() => {
                        setEditingId(task.id);
                        setEditTitle(task.title);
                      }}
                    >
                      <Pencil className="size-2.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-5 w-5 p-0 hover:text-destructive"
                      onClick={() => onDeleteTask(task.id)}
                    >
                      <Trash2 className="size-2.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
