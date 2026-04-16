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

  // Student identity from localStorage
  const [mySeatId, setMySeatId] = useState<number | null>(null);
  const [myStudentName, setMyStudentName] = useState<string | null>(null);

  // Load student identity from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        `${STORAGE_KEY_PREFIX}${lectureId}`
      );
      if (stored) {
        const { seatId, studentName } = JSON.parse(stored);
        // Verify seat still belongs to this student
        const seat = seats.find((s) => s.id === seatId);
        if (seat && seat.studentName === studentName) {
          setMySeatId(seatId);
          setMyStudentName(studentName);
        } else {
          // Stale data — clear
          localStorage.removeItem(`${STORAGE_KEY_PREFIX}${lectureId}`);
          setMySeatId(null);
          setMyStudentName(null);
        }
      }
    } catch {
      // ignore
    }
  }, [lectureId, seats]);

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
        // Clear any local student identity since seats were reset
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
      await deleteTask(taskId, instructorPassword);
      refetch();
    },
    [instructorPassword, refetch]
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

  // Unique row count for setup dialog
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRelease(mySeatId)}
            className="text-muted-foreground"
          >
            <LogOut className="size-3.5" />
            자리 비우기
          </Button>
        )}
      </div>

      {/* Main content: seating chart + task panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Seating chart — takes 3/5 */}
        <div className="lg:col-span-3">
          <div className="rounded-lg border bg-card p-3 sm:p-4">
            <SeatingChart
              seats={seats}
              tasks={tasks}
              completions={completions}
              mySeatId={mySeatId}
              myStudentName={myStudentName}
              isInstructorMode={isInstructorMode}
              onClaim={handleClaim}
              onRelease={handleRelease}
              onToggleHand={handleToggleHand}
              onClearHand={handleClearHand}
            />
          </div>
        </div>

        {/* Task panel — takes 2/5 */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-card p-3 sm:p-4">
            <TaskPanel
              tasks={tasks}
              completions={completions}
              seats={seats}
              mySeatId={mySeatId}
              isInstructorMode={isInstructorMode}
              onCreateTask={handleCreateTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onToggleCompletion={handleToggleCompletion}
            />
          </div>
        </div>
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
