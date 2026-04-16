"use server";

import { db } from "@/db";
import { tasks, taskCompletions, seats } from "@/db/schema";
import { verifyInstructorPassword } from "@/lib/auth";
import { eq, and, asc } from "drizzle-orm";

type ActionResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

/**
 * Create a new task for a lecture. Instructor-only.
 */
export async function createTask(
  lectureId: number,
  title: string,
  instructorPassword: string
): Promise<ActionResult> {
  try {
    if (!verifyInstructorPassword(instructorPassword)) {
      return { success: false, error: "Invalid instructor password" };
    }

    if (!title.trim()) {
      return { success: false, error: "Task title is required" };
    }

    // Get current max sortOrder
    const existing = await db
      .select()
      .from(tasks)
      .where(eq(tasks.lectureId, lectureId))
      .orderBy(asc(tasks.sortOrder));

    const maxOrder = existing.length > 0
      ? Math.max(...existing.map((t) => t.sortOrder ?? 0))
      : -1;

    const [created] = await db
      .insert(tasks)
      .values({
        lectureId,
        title: title.trim(),
        sortOrder: maxOrder + 1,
      })
      .returning();

    return { success: true, data: created };
  } catch (err) {
    console.error("createTask error:", err);
    return { success: false, error: "Failed to create task" };
  }
}

/**
 * Update a task. Instructor-only.
 */
export async function updateTask(
  taskId: number,
  title: string,
  instructorPassword: string
): Promise<ActionResult> {
  try {
    if (!verifyInstructorPassword(instructorPassword)) {
      return { success: false, error: "Invalid instructor password" };
    }

    if (!title.trim()) {
      return { success: false, error: "Task title is required" };
    }

    const [updated] = await db
      .update(tasks)
      .set({ title: title.trim() })
      .where(eq(tasks.id, taskId))
      .returning();

    if (!updated) return { success: false, error: "Task not found" };

    return { success: true, data: updated };
  } catch (err) {
    console.error("updateTask error:", err);
    return { success: false, error: "Failed to update task" };
  }
}

/**
 * Delete a task. Instructor-only. Cascades to task completions via FK.
 */
export async function deleteTask(
  taskId: number,
  instructorPassword: string
): Promise<ActionResult> {
  try {
    if (!verifyInstructorPassword(instructorPassword)) {
      return { success: false, error: "Invalid instructor password" };
    }

    await db.delete(taskCompletions).where(eq(taskCompletions.taskId, taskId));
    await db.delete(tasks).where(eq(tasks.id, taskId));

    return { success: true };
  } catch (err) {
    console.error("deleteTask error:", err);
    return { success: false, error: "Failed to delete task" };
  }
}

/**
 * Student toggles task completion. Requires matching seat studentName.
 */
export async function toggleTaskCompletion(
  taskId: number,
  seatId: number,
  studentName: string
): Promise<ActionResult> {
  try {
    // Verify the student owns this seat
    const [seat] = await db
      .select()
      .from(seats)
      .where(eq(seats.id, seatId))
      .limit(1);

    if (!seat) return { success: false, error: "Seat not found" };
    if (seat.studentName !== studentName) {
      return { success: false, error: "본인의 자리에서만 수행할 수 있습니다." };
    }

    // Check if already completed
    const [existing] = await db
      .select()
      .from(taskCompletions)
      .where(
        and(
          eq(taskCompletions.taskId, taskId),
          eq(taskCompletions.seatId, seatId)
        )
      )
      .limit(1);

    if (existing) {
      // Toggle off — remove completion
      await db.delete(taskCompletions).where(eq(taskCompletions.id, existing.id));
      return { success: true, data: { completed: false } };
    } else {
      // Toggle on — add completion
      const [created] = await db
        .insert(taskCompletions)
        .values({ taskId, seatId })
        .returning();
      return { success: true, data: { completed: true, completion: created } };
    }
  } catch (err) {
    console.error("toggleTaskCompletion error:", err);
    return { success: false, error: "Failed to toggle task completion" };
  }
}

/**
 * Get all tasks for a lecture, ordered by sortOrder.
 */
export async function getTasks(lectureId: number): Promise<ActionResult> {
  try {
    const allTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.lectureId, lectureId))
      .orderBy(asc(tasks.sortOrder));

    return { success: true, data: allTasks };
  } catch (err) {
    console.error("getTasks error:", err);
    return { success: false, error: "Failed to get tasks" };
  }
}
