"use server";

import { db } from "@/db";
import { lectureAttachments } from "@/db/schema";
import { verifyInstructorPassword } from "@/lib/auth";
import { del } from "@vercel/blob";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

/**
 * Delete an attachment. Requires the instructor password.
 */
export async function deleteAttachment(
  attachmentId: number,
  instructorPassword: string
): Promise<ActionResult> {
  try {
    if (!verifyInstructorPassword(instructorPassword)) {
      return { success: false, error: "강사 비밀번호가 올바르지 않습니다." };
    }

    const [attachment] = await db
      .select()
      .from(lectureAttachments)
      .where(eq(lectureAttachments.id, attachmentId))
      .limit(1);
    if (!attachment) {
      return { success: false, error: "첨부파일을 찾을 수 없습니다." };
    }

    try {
      await del(attachment.fileUrl);
    } catch (err) {
      console.warn("Blob delete failed (continuing):", err);
    }

    await db
      .delete(lectureAttachments)
      .where(eq(lectureAttachments.id, attachmentId));

    revalidatePath(`/board/${attachment.lectureId}`);
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("deleteAttachment error:", err);
    return { success: false, error: "첨부파일 삭제에 실패했습니다." };
  }
}

/**
 * List all attachments for a lecture, oldest first.
 */
export async function listAttachments(
  lectureId: number
): Promise<ActionResult> {
  try {
    const rows = await db
      .select()
      .from(lectureAttachments)
      .where(eq(lectureAttachments.lectureId, lectureId))
      .orderBy(asc(lectureAttachments.createdAt));
    return { success: true, data: rows };
  } catch (err) {
    console.error("listAttachments error:", err);
    return { success: false, error: "첨부파일 목록을 불러오지 못했습니다." };
  }
}
