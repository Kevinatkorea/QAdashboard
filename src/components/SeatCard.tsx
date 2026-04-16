"use client";

import { useState } from "react";
import type { Seat, Task } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Hand, Check, UserPlus, X, CheckSquare, Square } from "lucide-react";

interface SeatCardProps {
  seat: Seat;
  tasks: Task[];
  completedTaskIds: number[];
  isMyself: boolean;
  hasClaimedSeat: boolean;
  isInstructorMode: boolean;
  activeTaskId: number | null;
  onClaim: (seatId: number, name: string) => void;
  onRelease: (seatId: number) => void;
  onToggleHand: (seatId: number) => void;
  onClearHand: (seatId: number) => void;
  onToggleCompletion: (taskId: number) => void;
}

export function SeatCard({
  seat,
  tasks,
  completedTaskIds,
  isMyself,
  hasClaimedSeat,
  isInstructorMode,
  activeTaskId,
  onClaim,
  onRelease,
  onToggleHand,
  onClearHand,
  onToggleCompletion,
}: SeatCardProps) {
  const [claimOpen, setClaimOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [claimName, setClaimName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmpty = !seat.studentName;
  const completedSet = new Set(completedTaskIds);
  const completedCount = completedTaskIds.length;
  const totalTasks = tasks.length;
  const allDone = totalTasks > 0 && completedCount >= totalTasks;
  const handRaised = seat.handRaised;

  // When a specific task is selected, check if THIS seat completed it
  const activeTaskDone = activeTaskId !== null ? completedSet.has(activeTaskId) : null;

  async function handleClaimSubmit() {
    if (!claimName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      onClaim(seat.id, claimName.trim());
      setClaimOpen(false);
      setClaimName("");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Determine background color
  let bgClass = "bg-muted/40 border-dashed border-muted-foreground/20"; // empty
  if (!isEmpty) {
    if (handRaised) {
      // Hand raised takes priority — red
      bgClass = "bg-red-50 border-red-300";
    } else if (activeTaskId !== null) {
      // Filtered by a specific task
      bgClass = activeTaskDone
        ? "bg-emerald-50 border-emerald-300"
        : "bg-slate-100 border-slate-300";
    } else {
      // Overview mode — overall progress
      if (allDone) {
        bgClass = "bg-emerald-50 border-emerald-200";
      } else if (completedCount > 0) {
        bgClass = "bg-amber-50 border-amber-200";
      } else {
        bgClass = "bg-blue-50 border-blue-200";
      }
    }
  }

  if (isMyself) {
    bgClass += " ring-2 ring-primary/50";
  }

  return (
    <>
      <button
        className={`relative flex flex-col items-center justify-center rounded-lg border p-1.5 transition-all min-w-[64px] w-[64px] h-[64px] sm:min-w-[76px] sm:w-[76px] sm:h-[76px] text-center hover:shadow-md ${bgClass}`}
        onClick={() => {
          if (isEmpty && !hasClaimedSeat && !isInstructorMode) {
            setClaimOpen(true);
          } else if (isMyself) {
            setActionOpen(true);
          } else if (isInstructorMode && handRaised) {
            onClearHand(seat.id);
          }
        }}
        title={
          isEmpty
            ? "빈 자리"
            : `${seat.studentName} (${completedCount}/${totalTasks})${handRaised ? " — 도움 요청" : ""}`
        }
      >
        {/* Hand raised indicator */}
        {handRaised && (
          <span className="absolute -top-1.5 -right-1.5 z-10">
            <span className="relative flex size-5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex items-center justify-center size-5 rounded-full bg-red-500 text-white">
                <Hand className="size-3" />
              </span>
            </span>
          </span>
        )}

        {isEmpty ? (
          <>
            <UserPlus className="size-4 text-muted-foreground/50" />
            <span className="text-[8px] text-muted-foreground/60 mt-0.5">
              빈 자리
            </span>
          </>
        ) : (
          <>
            <span className="text-[10px] sm:text-xs font-medium truncate w-full leading-tight">
              {seat.studentName}
            </span>

            {activeTaskId !== null ? (
              // Single task mode: show done/not done
              <div className="mt-0.5">
                {activeTaskDone ? (
                  <Check className="size-4 text-emerald-600" />
                ) : (
                  <X className="size-4 text-slate-400" />
                )}
              </div>
            ) : totalTasks > 0 ? (
              // Overview mode: show progress bar
              <div className="w-full px-1 mt-1">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${allDone ? "bg-emerald-500" : "bg-amber-400"}`}
                    style={{ width: `${totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[8px] text-muted-foreground mt-0.5 block">
                  {completedCount}/{totalTasks}
                </span>
              </div>
            ) : null}

            {isMyself && (
              <span className="text-[7px] text-primary/70">(나)</span>
            )}
          </>
        )}
      </button>

      {/* Claim seat dialog */}
      <Dialog open={claimOpen} onOpenChange={setClaimOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>자리 선택</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleClaimSubmit();
            }}
            className="space-y-3"
          >
            <Input
              placeholder="이름을 입력하세요"
              value={claimName}
              onChange={(e) => setClaimName(e.target.value)}
              autoFocus
            />
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                취소
              </DialogClose>
              <Button type="submit" disabled={!claimName.trim() || isSubmitting}>
                {isSubmitting ? "처리 중..." : "앉기"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Student action dialog — task checklist + hand raise */}
      {isMyself && (
        <Dialog open={actionOpen} onOpenChange={setActionOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{seat.studentName}님의 수행 현황</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              {/* Hand raise toggle */}
              <Button
                variant={handRaised ? "destructive" : "outline"}
                size="sm"
                className="w-full"
                onClick={() => {
                  onToggleHand(seat.id);
                }}
              >
                <Hand className="size-4" />
                {handRaised ? "손 내리기" : "손흔들기 (도움 요청)"}
              </Button>

              {/* Task checklist */}
              {tasks.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    수행 목록
                  </span>
                  {tasks.map((task) => {
                    const done = completedSet.has(task.id);
                    return (
                      <button
                        key={task.id}
                        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-muted/50 text-left"
                        onClick={() => onToggleCompletion(task.id)}
                      >
                        {done ? (
                          <CheckSquare className="size-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="size-4 text-muted-foreground shrink-0" />
                        )}
                        <span
                          className={`text-sm ${done ? "line-through text-muted-foreground" : ""}`}
                        >
                          {task.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Release seat */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => {
                  onRelease(seat.id);
                  setActionOpen(false);
                }}
              >
                자리 비우기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
