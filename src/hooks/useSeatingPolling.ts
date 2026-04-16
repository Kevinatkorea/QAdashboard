"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Seat, Task, TaskCompletion } from "@/types";

const POLL_INTERVAL = 3000;

export interface SeatingData {
  seats: Seat[];
  tasks: Task[];
  completions: TaskCompletion[];
}

export function useSeatingPolling(
  lectureId: number,
  initialData: SeatingData,
  enabled: boolean = true
) {
  const [seats, setSeats] = useState<Seat[]>(initialData.seats);
  const [tasks, setTasks] = useState<Task[]>(initialData.tasks);
  const [completions, setCompletions] = useState<TaskCompletion[]>(
    initialData.completions
  );
  const lastUpdatedRef = useRef<string | null>(null);

  // Initialize from initial data
  useEffect(() => {
    setSeats(initialData.seats);
    setTasks(initialData.tasks);
    setCompletions(initialData.completions);

    if (initialData.seats.length > 0) {
      const maxUpdated = initialData.seats.reduce((max, s) => {
        const sDate = s.updatedAt
          ? new Date(s.updatedAt).toISOString()
          : "";
        return sDate > max ? sDate : max;
      }, "");
      if (maxUpdated) lastUpdatedRef.current = maxUpdated;
    }
  }, [initialData]);

  const fetchUpdates = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        lecture_id: String(lectureId),
      });
      if (lastUpdatedRef.current) {
        params.set("since", lastUpdatedRef.current);
      }

      const res = await fetch(`/api/seating?${params.toString()}`);
      if (!res.ok) return;

      const json = await res.json();
      if (!json.success || !json.data) return;

      const { seats: updatedSeats, tasks: updatedTasks, completions: updatedCompletions } = json.data as SeatingData;

      // Merge seat updates
      if (updatedSeats.length > 0) {
        setSeats((prev) => {
          const map = new Map(prev.map((s) => [s.id, s]));
          for (const us of updatedSeats) {
            map.set(us.id, us);
          }
          return Array.from(map.values()).sort(
            (a, b) => a.row * 100 + a.col - (b.row * 100 + b.col)
          );
        });

        const maxUpdated = updatedSeats.reduce((max, s) => {
          const sDate = s.updatedAt
            ? new Date(s.updatedAt).toISOString()
            : "";
          return sDate > max ? sDate : max;
        }, lastUpdatedRef.current || "");
        if (maxUpdated) lastUpdatedRef.current = maxUpdated;
      }

      // Replace tasks and completions fully (small payloads)
      setTasks(updatedTasks);
      setCompletions(updatedCompletions);
    } catch (error) {
      console.error("Seating polling error:", error);
    }
  }, [lectureId]);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(fetchUpdates, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchUpdates, enabled]);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/seating?lecture_id=${lectureId}`);
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success || !json.data) return;

      const data = json.data as SeatingData;
      setSeats(
        data.seats.sort(
          (a, b) => a.row * 100 + a.col - (b.row * 100 + b.col)
        )
      );
      setTasks(data.tasks);
      setCompletions(data.completions);

      if (data.seats.length > 0) {
        const maxUpdated = data.seats.reduce((max, s) => {
          const sDate = s.updatedAt
            ? new Date(s.updatedAt).toISOString()
            : "";
          return sDate > max ? sDate : max;
        }, "");
        if (maxUpdated) lastUpdatedRef.current = maxUpdated;
      }
    } catch (error) {
      console.error("Seating refetch error:", error);
    }
  }, [lectureId]);

  return { seats, tasks, completions, refetch };
}
