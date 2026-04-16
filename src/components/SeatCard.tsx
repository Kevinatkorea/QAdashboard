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
import { Hand, Check, UserPlus, LogOut } from "lucide-react";

interface SeatCardProps {
  seat: Seat;
  tasks: Task[];
  completedTaskIds: number[];
  isMyself: boolean;
  hasClaimedSeat: boolean;
  isInstructorMode: boolean;
  onClaim: (seatId: number, name: string) => void;
  onRelease: (seatId: number) => void;
  onToggleHand: (seatId: number) => void;
  onClearHand: (seatId: number) => void;
}

export function SeatCard({
  seat,
  tasks,
  completedTaskIds,
  isMyself,
  hasClaimedSeat,
  isInstructorMode,
  onClaim,
  onRelease,
  onToggleHand,
  onClearHand,
}: SeatCardProps) {
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimName, setClaimName] = useState("");

  const isEmpty = !seat.studentName;
  const completedCount = completedTaskIds.length;
  const totalTasks = tasks.length;
  const allDone = totalTasks > 0 && completedCount >= totalTasks;
  const handRaised = seat.handRaised;

  function handleClaimSubmit() {
    if (!claimName.trim()) return;
    onClaim(seat.id, claimName.trim());
    setClaimOpen(false);
    setClaimName("");
  }

  // Determine background color
  let bgClass = "bg-muted/40 border-dashed"; // empty
  if (!isEmpty) {
    if (allDone) {
      bgClass = "bg-emerald-50 border-emerald-200";
    } else if (completedCount > 0) {
      bgClass = "bg-amber-50 border-amber-200";
    } else {
      bgClass = "bg-blue-50 border-blue-200";
    }
  }

  if (isMyself) {
    bgClass += " ring-2 ring-primary/50";
  }

  return (
    <>
      <button
        className={`relative flex flex-col items-center justify-center rounded-lg border p-1.5 transition-all min-w-[60px] w-[60px] h-[60px] sm:min-w-[72px] sm:w-[72px] sm:h-[72px] text-center hover:shadow-md ${bgClass}`}
        onClick={() => {
          if (isEmpty && !hasClaimedSeat && !isInstructorMode) {
            setClaimOpen(true);
          } else if (isMyself) {
            onToggleHand(seat.id);
          } else if (isInstructorMode && handRaised) {
            onClearHand(seat.id);
          }
        }}
        title={
          isEmpty
            ? "빈 자리"
            : `${seat.studentName} (${completedCount}/${totalTasks})`
        }
      >
        {/* Hand raised indicator */}
        {handRaised && (
          <span className="absolute -top-1 -right-1 z-10">
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
            <UserPlus className="size-4 text-muted-foreground/60" />
            <span className="text-[9px] text-muted-foreground mt-0.5">
              빈 자리
            </span>
          </>
        ) : (
          <>
            <span className="text-[10px] sm:text-xs font-medium truncate w-full leading-tight">
              {seat.studentName}
            </span>
            {totalTasks > 0 && (
              <div className="flex items-center gap-0.5 mt-0.5">
                {allDone ? (
                  <Check className="size-3 text-emerald-600" />
                ) : (
                  <span className="text-[9px] text-muted-foreground">
                    {completedCount}/{totalTasks}
                  </span>
                )}
              </div>
            )}
            {isMyself && (
              <span className="text-[8px] text-primary/70 mt-0.5">
                (나)
              </span>
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
              <Button type="submit" disabled={!claimName.trim()}>
                앉기
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
