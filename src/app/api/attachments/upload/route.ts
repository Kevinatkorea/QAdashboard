import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { lectureAttachments, lectures } from "@/db/schema";
import { verifyInstructorPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

type ClientPayload = {
  lectureId: number;
  instructorPassword: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        if (!clientPayload) {
          throw new Error("Missing client payload");
        }
        const payload = JSON.parse(clientPayload) as ClientPayload;

        if (!verifyInstructorPassword(payload.instructorPassword)) {
          throw new Error("강사 비밀번호가 올바르지 않습니다.");
        }

        if (!Number.isInteger(payload.lectureId) || payload.lectureId <= 0) {
          throw new Error("Invalid lecture id");
        }

        if (payload.fileSize > MAX_FILE_SIZE) {
          throw new Error("파일 크기는 20MB 이하여야 합니다.");
        }

        const [lecture] = await db
          .select()
          .from(lectures)
          .where(eq(lectures.id, payload.lectureId))
          .limit(1);
        if (!lecture) {
          throw new Error("Lecture not found");
        }

        return {
          allowedContentTypes: undefined,
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({
            lectureId: payload.lectureId,
            fileName: payload.fileName,
            fileSize: payload.fileSize,
            mimeType: payload.mimeType,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) return;
        const meta = JSON.parse(tokenPayload) as {
          lectureId: number;
          fileName: string;
          fileSize: number;
          mimeType: string;
        };

        await db.insert(lectureAttachments).values({
          lectureId: meta.lectureId,
          fileName: meta.fileName,
          fileUrl: blob.url,
          blobPathname: blob.pathname,
          fileSize: meta.fileSize,
          mimeType: meta.mimeType || null,
        });

        revalidatePath(`/board/${meta.lectureId}`);
        revalidatePath("/");
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Upload failed";
    console.error("attachments upload error:", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
