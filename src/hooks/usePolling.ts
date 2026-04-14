"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Question } from "@/types";

const POLL_INTERVAL = 5000;

export function usePolling(lectureId: number, initialQuestions: Question[]) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [isPolling, setIsPolling] = useState(false);
  const lastUpdatedRef = useRef<string | null>(null);

  // Initialize the lastUpdated timestamp from initial questions
  useEffect(() => {
    if (initialQuestions.length > 0) {
      const maxUpdated = initialQuestions.reduce((max, q) => {
        const qDate = q.updatedAt
          ? new Date(q.updatedAt).toISOString()
          : "";
        return qDate > max ? qDate : max;
      }, "");
      if (maxUpdated) {
        lastUpdatedRef.current = maxUpdated;
      }
    }
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  const fetchUpdates = useCallback(async () => {
    try {
      setIsPolling(true);
      const params = new URLSearchParams({
        lecture_id: String(lectureId),
      });
      if (lastUpdatedRef.current) {
        params.set("since", lastUpdatedRef.current);
      }

      const res = await fetch(`/api/questions?${params.toString()}`);
      if (!res.ok) return;

      const json = await res.json();
      if (!json.success || !json.data) return;

      const updatedQuestions: Question[] = json.data;

      if (updatedQuestions.length > 0) {
        setQuestions((prev) => {
          const map = new Map(prev.map((q) => [q.id, q]));
          for (const uq of updatedQuestions) {
            map.set(uq.id, uq);
          }
          return Array.from(map.values()).sort((a, b) => {
            const aDate = a.createdAt
              ? new Date(a.createdAt).getTime()
              : 0;
            const bDate = b.createdAt
              ? new Date(b.createdAt).getTime()
              : 0;
            return aDate - bDate;
          });
        });

        // Update the lastUpdated timestamp
        const maxUpdated = updatedQuestions.reduce((max, q) => {
          const qDate = q.updatedAt
            ? new Date(q.updatedAt).toISOString()
            : "";
          return qDate > max ? qDate : max;
        }, lastUpdatedRef.current || "");
        if (maxUpdated) {
          lastUpdatedRef.current = maxUpdated;
        }
      }
    } catch (error) {
      console.error("Polling error:", error);
    } finally {
      setIsPolling(false);
    }
  }, [lectureId]);

  useEffect(() => {
    const interval = setInterval(fetchUpdates, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchUpdates]);

  const refetch = useCallback(async () => {
    // Full refetch (no since param)
    try {
      const res = await fetch(
        `/api/questions?lecture_id=${lectureId}`
      );
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success || !json.data) return;
      const allQuestions: Question[] = json.data;
      setQuestions(
        allQuestions.sort((a, b) => {
          const aDate = a.createdAt
            ? new Date(a.createdAt).getTime()
            : 0;
          const bDate = b.createdAt
            ? new Date(b.createdAt).getTime()
            : 0;
          return aDate - bDate;
        })
      );
      if (allQuestions.length > 0) {
        const maxUpdated = allQuestions.reduce((max, q) => {
          const qDate = q.updatedAt
            ? new Date(q.updatedAt).toISOString()
            : "";
          return qDate > max ? qDate : max;
        }, "");
        if (maxUpdated) {
          lastUpdatedRef.current = maxUpdated;
        }
      }
    } catch (error) {
      console.error("Refetch error:", error);
    }
  }, [lectureId]);

  // Remove a question from local state (after delete)
  const removeQuestion = useCallback((id: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }, []);

  return { questions, isPolling, refetch, removeQuestion };
}
