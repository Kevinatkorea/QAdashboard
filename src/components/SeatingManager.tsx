"use client";

import { useState, useCallback, useEffect } from "react";
import type { Seat, Task, TaskCompletion } from "@/types";
import {
  useSeatingPolling,
  type SeatingData,
} from "@/hooks/useSeatingPolling";
import { SeatingChart } from "@/components/SeatingChart";
import { SeatingSetupDialog } from "@/components/SeatingSetupDialog";
import { TaskPanel } from "@/components/TaskPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  claimSeat,
  releaseSeat,
  toggleHandRaise,
  clearHandRaise,
  clearAllHands,
  initializeSeating,
} from "@/app/actions/seats";
import {
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
} from "@/app/actions/tasks";
import { Settings, HandMetal, LogOut } from "lucide-react";

interface SeatingManagerProps {
  lectureId: number;
  isInstructorMode: boolean;
  instructorPassword: string;
  initialData: SeatingData;
  enabled: boolean;
}

const STORAGE_KEY_PREFIX = "seating-";

export function SeatingManager({
  lectureId,
  isInstructorMode,
  instructorPassword,
  initialData,
  enabled,
}: SeatingManagerProps) {
  const { seats, tasks, completions, refetch } = useSeatingPolling(
    lectureId,
    initialData,
    enabled
  );

  const [setupOpen, setSetupOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  // Student identity from localStorage
  const [mySeatId, setMySeatId] = useState<number | null>(null);
  const [myStudentName, setMyStudentName] = useState<string | null>(null);

  // Restore identity from localStorage on mount.
  // Don't reconcile against `seats` here — initialData may be stale on remount
  // (e.g. after switching tabs), and clearing based on stale seats would wipe
  // out the user's valid claim before polling refreshes.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        `${STORAGE_KEY_PREFIX}${lectureId}`
      );
      if (stored) {
        const { seatId, studentName } = JSON.parse(stored);
        setMySeatId(seatId);
        setMyStudentName(studentName);
      }
    } catch {
      // ignore
    }
  }, [lectureId]);

  // Once seats data is fresh, clear identity only if someone else holds the
  // seat (different non-null name). Missing/null name is treated as "not yet
  // synced" rather than "evicted" to avoid flapping during polling gaps.
  useEffect(() => {
    if (mySeatId === null || myStudentName === null) return;
    const seat = seats.find((s) => s.id === mySeatId);
    if (
      seat &&
      seat.studentName !== null &&
      seat.studentName !== myStudentName
    ) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${lectureId}`);
      setMySeatId(null);
      setMyStudentName(null);
    }
  }, [seats, mySeatId, myStudentName, lectureId]);

  const handleClaim = useCallback(
    async (seatId: number, name: string) => {
      const result = await claimSeat(seatId, name);
      if (result.success) {
        setMySeatId(seatId);
        setMyStudentName(name);
        localStorage.setItem(
          `${STORAGE_KEY_PREFIX}${lectureId}`,
          JSON.stringify({ seatId, studentName: name })
        );
        refetch();
      }
    },
    [lectureId, refetch]
  );

  const handleRelease = useCallback(
    async (seatId: number) => {
      if (!myStudentName) return;
      const result = await releaseSeat(seatId, myStudentName);
      if (result.success) {
        setMySeatId(null);
        setMyStudentName(null);
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${lectureId}`);
        refetch();
      }
    },
    [lectureId, myStudentName, refetch]
  );

  const handleToggleHand = useCallback(
    async (seatId: number) => {
      if (!myStudentName) return;
      await toggleHandRaise(seatId, myStudentName);
      refetch();
    },
    [myStudentName, refetch]
  );

  const handleClearHand = useCallback(
    async (seatId: number) => {
      await clearHandRaise(seatId, instructorPassword);
      refetch();
    },
    [instructorPassword, refetch]
  );

  const handleClearAllHands = useCallback(async () => {
    await clearAllHands(lectureId, instructorPassword);
    refetch();
  }, [lectureId, instructorPassword, refetch]);

  const handleSetupSubmit = useCallback(
    async (rows: number[]) => {
      const result = await initializeSeating(
        lectureId,
        rows,
        instructorPassword
      );
      if (result.success) {
        setSetupOpen(false);
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${lectureId}`);
        setMySeatId(null);
        setMyStudentName(null);
        refetch();
      }
    },
    [lectureId, instructorPassword, refetch]
  );

  const handleCreateTask = useCallback(
    async (title: string) => {
      await createTask(lectureId, title, instructorPassword);
      refetch();
    },
    [lectureId, instructorPassword, refetch]
  );

  const handleUpdateTask = useCallback(
    async (taskId: number, title: string) => {
      await updateTask(taskId, title, instructorPassword);
      refetch();
    },
    [instructorPassword, refetch]
  );

  const handleDeleteTask = useCallback(
    async (taskId: number) => {
      if (activeTaskId === taskId) setActiveTaskId(null);
      await deleteTask(taskId, instructorPassword);
      refetch();
    },
    [activeTaskId, instructorPassword, refetch]
  );

  const handleToggleCompletion = useCallback(
    async (taskId: number) => {
      if (!mySeatId || !myStudentName) return;
      await toggleTaskCompletion(taskId, mySeatId, myStudentName);
      refetch();
    },
    [mySeatId, myStudentName, refetch]
  );

  const handRaisedCount = seats.filter((s) => s.handRaised).length;
  const rowSet = new Set(seats.map((s) => s.row));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {isInstructorMode && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSetupOpen(true)}
            >
              <Settings className="size-3.5" />
              좌석 설정
            </Button>
            {handRaisedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllHands}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <HandMetal className="size-3.5" />
                손 모두 내리기
                <Badge
                  variant="secondary"
                  className="text-[10px] h-4 bg-red-100 text-red-700 ml-1"
                >
                  {handRaisedCount}
                </Badge>
              </Button>
            )}
          </>
        )}
        {!isInstructorMode && mySeatId !== null && (
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
              {myStudentName}님 착석 중
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRelease(mySeatId)}
              className="text-muted-foreground"
            >
              <LogOut className="size-3.5" />
              자리 비우기
            </Button>
          </div>
        )}
        {!isInstructorMode && mySeatId === null && seats.length > 0 && (
          <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2">
            <p className="text-sm text-blue-700">
              빈 자리를 클릭하여 이름을 입력하세요. 착석 후 자기 자리를 클릭하면 수행 체크 및 손흔들기를 할 수 있습니다.
            </p>
          </div>
        )}
      </div>

      {/* Seating chart */}
      <div className="rounded-lg border bg-card p-3 sm:p-4">
        <SeatingChart
          seats={seats}
          tasks={tasks}
          completions={completions}
          mySeatId={mySeatId}
          myStudentName={myStudentName}
          isInstructorMode={isInstructorMode}
          activeTaskId={activeTaskId}
          onClaim={handleClaim}
          onRelease={handleRelease}
          onToggleHand={handleToggleHand}
          onClearHand={handleClearHand}
          onToggleCompletion={handleToggleCompletion}
        />
      </div>

      {/* Task panel — below the chart */}
      <div className="rounded-lg border bg-card p-3 sm:p-4">
        <TaskPanel
          tasks={tasks}
          completions={completions}
          seats={seats}
          isInstructorMode={isInstructorMode}
          activeTaskId={activeTaskId}
          onSelectTask={setActiveTaskId}
          onCreateTask={handleCreateTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
        />
      </div>

      {/* Setup dialog */}
      <SeatingSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onSubmit={handleSetupSubmit}
        currentRowCount={rowSet.size}
      />
    </div>
  );
}
