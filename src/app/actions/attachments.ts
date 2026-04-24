"use server";

import { db } from "@/db";
import { lectureAttachments, lectures } from "@/db/schema";
import { verifyInstructorPassword } from "@/lib/auth";
import { put, del } from "@vercel/blob";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Upload a file attachment to a lecture. Requires the instructor password.
 * File is uploaded to Vercel Blob, record is stored in the DB.
 */
export async function uploadAttachment(
  formData: FormData
): Promise<ActionResult> {
  try {
    const lectureIdRaw = formData.get("lectureId");
    const instructorPassword = formData.get("instructorPassword");
    const file = formData.get("file");

    if (typeof instructorPassword !== "string") {
      return { success: false, error: "Invalid request" };
    }
    if (!verifyInstructorPassword(instructorPassword)) {
      return { success: false, error: "강사 비밀번호가 올바르지 않습니다." };
    }

    const lectureId = Number(lectureIdRaw);
    if (!Number.isInteger(lectureId) || lectureId <= 0) {
      return { success: false, error: "Invalid lecture id" };
    }

    if (!(file instanceof File)) {
      return { success: false, error: "파일이 첨부되지 않았습니다." };
    }
    if (file.size === 0) {
      return { success: false, error: "빈 파일은 업로드할 수 없습니다." };
    }
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `파일 크기는 20MB 이하여야 합니다. (현재 ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
      };
    }

    const [lecture] = await db
      .select()
      .from(lectures)
      .where(eq(lectures.id, lectureId))
      .limit(1);
    if (!lecture) {
      return { success: false, error: "Lecture not found" };
    }

    const safeName = file.name.replace(/[^\w.\-가-힣 ()]/g, "_");
    const pathname = `lectures/${lectureId}/${Date.now()}-${safeName}`;

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || undefined,
    });

    const [created] = await db
      .insert(lectureAttachments)
      .values({
        lectureId,
        fileName: file.name,
        fileUrl: blob.url,
        blobPathname: blob.pathname,
        fileSize: file.size,
        mimeType: file.type || null,
      })
      .returning();

    revalidatePath(`/board/${lectureId}`);
    revalidatePath("/");
    return { success: true, data: created };
  } catch (err) {
    console.error("uploadAttachment error:", err);
    const message =
      err instanceof Error && err.message.includes("BLOB_READ_WRITE_TOKEN")
        ? "Vercel Blob 토큰이 설정되지 않았습니다. BLOB_READ_WRITE_TOKEN 환경변수를 확인하세요."
        : "파일 업로드에 실패했습니다.";
    return { success: false, error: message };
  }
}

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
