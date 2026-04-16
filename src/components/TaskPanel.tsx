"use client";

import { useState } from "react";
import type { Task, TaskCompletion, Seat } from "@/types";
import { TaskItem } from "@/components/TaskItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, ClipboardList, Check } from "lucide-react";

interface TaskPanelProps {
  tasks: Task[];
  completions: TaskCompletion[];
  seats: Seat[];
  mySeatId: number | null;
  isInstructorMode: boolean;
  onCreateTask: (title: string) => void;
  onUpdateTask: (taskId: number, title: string) => void;
  onDeleteTask: (taskId: number) => void;
  onToggleCompletion: (taskId: number) => void;
}

export function TaskPanel({
  tasks,
  completions,
  seats,
  mySeatId,
  isInstructorMode,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onToggleCompletion,
}: TaskPanelProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // My completed task IDs
  const myCompletedTaskIds = new Set(
    completions
      .filter((c) => c.seatId === mySeatId)
      .map((c) => c.taskId)
  );

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onCreateTask(newTaskTitle.trim());
    setNewTaskTitle("");
    setShowAddForm(false);
  }

  // Completion summary for instructor
  const occupiedSeats = seats.filter((s) => s.studentName);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">수행 목록</span>
          <Badge variant="secondary" className="text-[10px] h-4">
            {tasks.length}개
          </Badge>
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

      {/* Add task form (instructor) */}
      {isInstructorMode && showAddForm && (
        <form onSubmit={handleAddTask} className="flex items-center gap-2 mb-2">
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

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <p className="text-xs">수행 목록이 없습니다.</p>
          {isInstructorMode && (
            <p className="text-[10px] mt-1">과제를 추가해 주세요.</p>
          )}
        </div>
      ) : (
        <div className="space-y-0.5">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isCompleted={myCompletedTaskIds.has(task.id)}
              isInstructorMode={isInstructorMode}
              canToggle={mySeatId !== null && !isInstructorMode}
              onToggle={onToggleCompletion}
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
            />
          ))}
        </div>
      )}

      {/* Student notice */}
      {!isInstructorMode && mySeatId === null && tasks.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          과제를 수행하려면 먼저 좌석을 선택해 주세요.
        </p>
      )}

      {/* Instructor: completion summary matrix */}
      {isInstructorMode && tasks.length > 0 && occupiedSeats.length > 0 && (
        <>
          <Separator className="my-3" />
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              수행 현황
            </span>
            <div className="overflow-x-auto">
              <table className="text-[10px] w-full">
                <thead>
                  <tr>
                    <th className="text-left py-1 pr-2 font-medium text-muted-foreground">
                      학생
                    </th>
                    {tasks.map((t) => (
                      <th
                        key={t.id}
                        className="px-1 py-1 font-medium text-muted-foreground text-center"
                        title={t.title}
                      >
                        <span className="truncate block max-w-[40px]">
                          {t.title}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {occupiedSeats.map((seat) => {
                    const seatCompletions = new Set(
                      completions
                        .filter((c) => c.seatId === seat.id)
                        .map((c) => c.taskId)
                    );
                    return (
                      <tr key={seat.id} className="border-t border-muted/30">
                        <td className="py-1 pr-2 font-medium truncate max-w-[60px]">
                          {seat.studentName}
                        </td>
                        {tasks.map((t) => (
                          <td key={t.id} className="text-center px-1 py-1">
                            {seatCompletions.has(t.id) ? (
                              <Check className="size-3 text-emerald-600 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground/40">
                                -
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
