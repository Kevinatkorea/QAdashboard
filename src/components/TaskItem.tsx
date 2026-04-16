"use client";

import { useState } from "react";
import type { Task } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Check, Square, CheckSquare } from "lucide-react";

interface TaskItemProps {
  task: Task;
  isCompleted: boolean;
  isInstructorMode: boolean;
  canToggle: boolean;
  onToggle: (taskId: number) => void;
  onUpdate?: (taskId: number, title: string) => void;
  onDelete?: (taskId: number) => void;
}

export function TaskItem({
  task,
  isCompleted,
  isInstructorMode,
  canToggle,
  onToggle,
  onUpdate,
  onDelete,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  function handleSave() {
    if (!editTitle.trim()) return;
    onUpdate?.(task.id, editTitle.trim());
    setIsEditing(false);
  }

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/30 group">
      {/* Checkbox */}
      <button
        className={`shrink-0 ${canToggle ? "cursor-pointer" : "cursor-default opacity-60"}`}
        onClick={() => canToggle && onToggle(task.id)}
        disabled={!canToggle}
      >
        {isCompleted ? (
          <CheckSquare className="size-4 text-emerald-600" />
        ) : (
          <Square className="size-4 text-muted-foreground" />
        )}
      </button>

      {/* Title */}
      {isEditing ? (
        <form
          className="flex-1 flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="h-7 text-sm"
            autoFocus
          />
          <Button size="xs" type="submit" variant="ghost">
            <Check className="size-3" />
          </Button>
        </form>
      ) : (
        <span
          className={`flex-1 text-sm ${isCompleted ? "line-through text-muted-foreground" : ""}`}
        >
          {task.title}
        </span>
      )}

      {/* Instructor actions */}
      {isInstructorMode && !isEditing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="xs"
            className="h-6 w-6 p-0"
            onClick={() => {
              setEditTitle(task.title);
              setIsEditing(true);
            }}
          >
            <Pencil className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="h-6 w-6 p-0 hover:text-destructive"
            onClick={() => onDelete?.(task.id)}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
