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
  activeTaskId: number | null;
  onClaim: (seatId: number, name: string) => void;
  onRelease: (seatId: number) => void;
  onToggleHand: (seatId: number) => void;
  onClearHand: (seatId: number) => void;
  onToggleCompletion: (taskId: number) => void;
}

export function SeatingChart({
  seats,
  tasks,
  completions,
  mySeatId,
  isInstructorMode,
  activeTaskId,
  onClaim,
  onRelease,
  onToggleHand,
  onClearHand,
  onToggleCompletion,
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

  // Count stats for legend
  const occupiedSeats = seats.filter((s) => s.studentName);
  const handRaisedCount = occupiedSeats.filter((s) => s.handRaised).length;

  let doneCount = 0;
  let notDoneCount = 0;
  if (activeTaskId !== null) {
    for (const s of occupiedSeats) {
      const set = completionMap.get(s.id);
      if (set?.has(activeTaskId)) doneCount++;
      else notDoneCount++;
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Front label */}
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center text-sm text-muted-foreground mb-1 py-1.5 px-4 bg-muted/50 rounded font-medium">
          칠판 (앞)
        </div>
      </div>

      {/* Seat rows */}
      <div className="flex flex-col items-center gap-1.5 sm:gap-2">
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
                  activeTaskId={activeTaskId}
                  onClaim={onClaim}
                  onRelease={onRelease}
                  onToggleHand={onToggleHand}
                  onClearHand={onClearHand}
                  onToggleCompletion={onToggleCompletion}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Back label */}
      <div className="text-center text-sm text-muted-foreground mt-1">뒤</div>

      {/* Legend */}
      {occupiedSeats.length > 0 && (
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap justify-center">
          {activeTaskId !== null ? (
            <>
              <div className="flex items-center gap-1">
                <span className="inline-block size-3 rounded-sm bg-emerald-300 border border-emerald-400" />
                완료 ({doneCount})
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block size-3 rounded-sm bg-slate-200 border border-slate-300" />
                미완료 ({notDoneCount})
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <span className="inline-block size-3 rounded-sm bg-emerald-200 border border-emerald-300" />
                전체 완료
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block size-3 rounded-sm bg-amber-200 border border-amber-300" />
                진행 중
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block size-3 rounded-sm bg-blue-200 border border-blue-300" />
                미시작
              </div>
            </>
          )}
          {handRaisedCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="inline-block size-3 rounded-sm bg-red-300 border border-red-400" />
              도움 요청 ({handRaisedCount})
            </div>
          )}
        </div>
      )}
    </div>
  );
}
