"use server";

import { db } from "@/db";
import { seats, taskCompletions } from "@/db/schema";
import { verifyInstructorPassword } from "@/lib/auth";
import { eq, and, isNull } from "drizzle-orm";

type ActionResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

/**
 * Initialize (or reset) the seating layout for a lecture.
 * Each entry in `rows` specifies how many seats that row has.
 * Example: [8, 8, 7, 6] → 4 rows with decreasing seat counts.
 */
export async function initializeSeating(
  lectureId: number,
  rows: number[],
  instructorPassword: string
): Promise<ActionResult> {
  try {
    if (!verifyInstructorPassword(instructorPassword)) {
      return { success: false, error: "Invalid instructor password" };
    }

    if (!rows.length) {
      return { success: false, error: "At least one row is required" };
    }

    // Delete existing completions for seats in this lecture first
    const existingSeats = await db
      .select({ id: seats.id })
      .from(seats)
      .where(eq(seats.lectureId, lectureId));

    if (existingSeats.length > 0) {
      for (const seat of existingSeats) {
        await db
          .delete(taskCompletions)
          .where(eq(taskCompletions.seatId, seat.id));
      }
      await db.delete(seats).where(eq(seats.lectureId, lectureId));
    }

    // Create new seats
    const seatValues: {
      lectureId: number;
      row: number;
      col: number;
    }[] = [];

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const seatCount = Math.min(Math.max(rows[rowIdx], 1), 12);
      for (let col = 0; col < seatCount; col++) {
        seatValues.push({ lectureId, row: rowIdx, col });
      }
    }

    const created = await db.insert(seats).values(seatValues).returning();

    return { success: true, data: created };
  } catch (err) {
    console.error("initializeSeating error:", err);
    return { success: false, error: "Failed to initialize seating" };
  }
}

/**
 * Student claims an empty seat by entering their name.
 */
export async function claimSeat(
  seatId: number,
  studentName: string
): Promise<ActionResult> {
  try {
    if (!studentName.trim()) {
      return { success: false, error: "Student name is required" };
    }

    const [seat] = await db
      .select()
      .from(seats)
      .where(eq(seats.id, seatId))
      .limit(1);

    if (!seat) return { success: false, error: "Seat not found" };
    if (seat.studentName) {
      return { success: false, error: "이미 다른 학생이 앉아있습니다." };
    }

    const [updated] = await db
      .update(seats)
      .set({ studentName: studentName.trim(), updatedAt: new Date() })
      .where(and(eq(seats.id, seatId), isNull(seats.studentName)))
      .returning();

    if (!updated) {
      return { success: false, error: "이미 다른 학생이 앉아있습니다." };
    }

    return { success: true, data: updated };
  } catch (err) {
    console.error("claimSeat error:", err);
    return { success: false, error: "Failed to claim seat" };
  }
}

/**
 * Student releases their seat.
 */
export async function releaseSeat(
  seatId: number,
  studentName: string
): Promise<ActionResult> {
  try {
    const [seat] = await db
      .select()
      .from(seats)
      .where(eq(seats.id, seatId))
      .limit(1);

    if (!seat) return { success: false, error: "Seat not found" };
    if (seat.studentName !== studentName) {
      return { success: false, error: "본인의 자리만 비울 수 있습니다." };
    }

    // Remove task completions for this seat
    await db.delete(taskCompletions).where(eq(taskCompletions.seatId, seatId));

    const [updated] = await db
      .update(seats)
      .set({
        studentName: null,
        handRaised: false,
        updatedAt: new Date(),
      })
      .where(eq(seats.id, seatId))
      .returning();

    return { success: true, data: updated };
  } catch (err) {
    console.error("releaseSeat error:", err);
    return { success: false, error: "Failed to release seat" };
  }
}

/**
 * Student toggles their hand-raised status.
 */
export async function toggleHandRaise(
  seatId: number,
  studentName: string
): Promise<ActionResult> {
  try {
    const [seat] = await db
      .select()
      .from(seats)
      .where(eq(seats.id, seatId))
      .limit(1);

    if (!seat) return { success: false, error: "Seat not found" };
    if (seat.studentName !== studentName) {
      return { success: false, error: "본인의 자리만 조작할 수 있습니다." };
    }

    const [updated] = await db
      .update(seats)
      .set({ handRaised: !seat.handRaised, updatedAt: new Date() })
      .where(eq(seats.id, seatId))
      .returning();

    return { success: true, data: updated };
  } catch (err) {
    console.error("toggleHandRaise error:", err);
    return { success: false, error: "Failed to toggle hand raise" };
  }
}

/**
 * Instructor clears a student's raised hand.
 */
export async function clearHandRaise(
  seatId: number,
  instructorPassword: string
): Promise<ActionResult> {
  try {
    if (!verifyInstructorPassword(instructorPassword)) {
      return { success: false, error: "Invalid instructor password" };
    }

    const [updated] = await db
      .update(seats)
      .set({ handRaised: false, updatedAt: new Date() })
      .where(eq(seats.id, seatId))
      .returning();

    return { success: true, data: updated };
  } catch (err) {
    console.error("clearHandRaise error:", err);
    return { success: false, error: "Failed to clear hand raise" };
  }
}

/**
 * Instructor clears all raised hands for a lecture.
 */
export async function clearAllHands(
  lectureId: number,
  instructorPassword: string
): Promise<ActionResult> {
  try {
    if (!verifyInstructorPassword(instructorPassword)) {
      return { success: false, error: "Invalid instructor password" };
    }

    await db
      .update(seats)
      .set({ handRaised: false, updatedAt: new Date() })
      .where(and(eq(seats.lectureId, lectureId), eq(seats.handRaised, true)));

    return { success: true };
  } catch (err) {
    console.error("clearAllHands error:", err);
    return { success: false, error: "Failed to clear all hands" };
  }
}

/**
 * Get all seating data for a lecture (seats + task completions).
 */
export async function getSeatingData(lectureId: number): Promise<ActionResult> {
  try {
    const allSeats = await db
      .select()
      .from(seats)
      .where(eq(seats.lectureId, lectureId));

    const seatIds = allSeats.map((s) => s.id);

    let completions: { id: number; taskId: number; seatId: number; completedAt: Date | null }[] = [];
    if (seatIds.length > 0) {
      completions = await db
        .select()
        .from(taskCompletions);
      // Filter to only completions for seats in this lecture
      completions = completions.filter((c) => seatIds.includes(c.seatId));
    }

    return { success: true, data: { seats: allSeats, completions } };
  } catch (err) {
    console.error("getSeatingData error:", err);
    return { success: false, error: "Failed to get seating data" };
  }
}
