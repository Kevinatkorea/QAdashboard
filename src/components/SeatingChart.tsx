"use client";

import type { Seat, Task, TaskCompletion } from "@/types";
import { SeatCard } from "@/components/SeatCard";

interface SeatingChartProps {
  seats: Seat[];
  tasks: Task[];
  completions: TaskCompletion[];
  mySeatId: number | null;
  myStudentName: string | null;
  isInstructorMode: boolean;
  onClaim: (seatId: number, name: string) => void;
  onRelease: (seatId: number) => void;
  onToggleHand: (seatId: number) => void;
  onClearHand: (seatId: number) => void;
}

export function SeatingChart({
  seats,
  tasks,
  completions,
  mySeatId,
  myStudentName,
  isInstructorMode,
  onClaim,
  onRelease,
  onToggleHand,
  onClearHand,
}: SeatingChartProps) {
  if (seats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">좌석 배치가 설정되지 않았습니다.</p>
        {isInstructorMode && (
          <p className="text-xs mt-1">
            위의 &quot;좌석 설정&quot; 버튼으로 좌석을 구성해 주세요.
          </p>
        )}
      </div>
    );
  }

  // Group seats by row
  const rowMap = new Map<number, Seat[]>();
  for (const seat of seats) {
    const row = rowMap.get(seat.row) ?? [];
    row.push(seat);
    rowMap.set(seat.row, row);
  }
  const sortedRows = Array.from(rowMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([, rowSeats]) => rowSeats.sort((a, b) => a.col - b.col));

  // Build completion map: seatId -> Set of completed taskIds
  const completionMap = new Map<number, Set<number>>();
  for (const c of completions) {
    const set = completionMap.get(c.seatId) ?? new Set();
    set.add(c.taskId);
    completionMap.set(c.seatId, set);
  }

  const hasClaimedSeat = mySeatId !== null;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Front label */}
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center text-xs text-muted-foreground mb-2 py-1 px-4 bg-muted/50 rounded">
          칠판 (앞)
        </div>
      </div>

      {/* Seat rows */}
      <div className="flex flex-col items-center gap-2">
        {sortedRows.map((rowSeats, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-1.5 sm:gap-2 justify-center flex-wrap">
            {rowSeats.map((seat) => {
              const completedIds = completionMap.get(seat.id);
              const completedTaskIds = completedIds
                ? Array.from(completedIds)
                : [];
              return (
                <SeatCard
                  key={seat.id}
                  seat={seat}
                  tasks={tasks}
                  completedTaskIds={completedTaskIds}
                  isMyself={seat.id === mySeatId}
                  hasClaimedSeat={hasClaimedSeat}
                  isInstructorMode={isInstructorMode}
                  onClaim={onClaim}
                  onRelease={onRelease}
                  onToggleHand={onToggleHand}
                  onClearHand={onClearHand}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Back label */}
      <div className="text-center text-xs text-muted-foreground mt-1">뒤</div>
    </div>
  );
}
