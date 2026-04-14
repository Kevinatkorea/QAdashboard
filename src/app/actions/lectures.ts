"use server";

import { db } from "@/db";
import { lectures } from "@/db/schema";
import { verifyInstructorPassword } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

type ActionResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

/**
 * Create a new lecture. Requires the instructor password.
 */
export async function createLecture(
  title: string,
  instructorPassword: string
): Promise<ActionResult> {
  try {
    if (!verifyInstructorPassword(instructorPassword)) {
      return { success: false, error: "Invalid instructor password" };
    }

    if (!title || title.trim().length === 0) {
      return { success: false, error: "Title is required" };
    }

    const [created] = await db
      .insert(lectures)
      .values({ title: title.trim() })
      .returning();

    return { success: true, data: created };
  } catch (err) {
    console.error("createLecture error:", err);
    return { success: false, error: "Failed to create lecture" };
  }
}

/**
 * Update a lecture's transcript. Requires the instructor password.
 */
export async function updateTranscript(
  lectureId: number,
  transcript: string,
  instructorPassword: string
): Promise<ActionResult> {
  try {
    if (!verifyInstructorPassword(instructorPassword)) {
      return { success: false, error: "Invalid instructor password" };
    }

    const [lecture] = await db
      .select()
      .from(lectures)
      .where(eq(lectures.id, lectureId))
      .limit(1);

    if (!lecture) {
      return { success: false, error: "Lecture not found" };
    }

    await db
      .update(lectures)
      .set({ transcript })
      .where(eq(lectures.id, lectureId));

    return { success: true };
  } catch (err) {
    console.error("updateTranscript error:", err);
    return { success: false, error: "Failed to update transcript" };
  }
}

/**
 * Get all lectures ordered by created_at descending.
 */
export async function getLectures(): Promise<ActionResult> {
  try {
    const allLectures = await db
      .select()
      .from(lectures)
      .orderBy(desc(lectures.createdAt));

    return { success: true, data: allLectures };
  } catch (err) {
    console.error("getLectures error:", err);
    return { success: false, error: "Failed to fetch lectures" };
  }
}
