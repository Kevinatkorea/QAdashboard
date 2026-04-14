"use server";

import { db } from "@/db";
import { questions, lectures, insights } from "@/db/schema";
import { generateAutoAnswer, generateQuestionInsight } from "@/lib/ai";
import {
  hashPassword,
  verifyPassword,
  verifyInstructorPassword,
} from "@/lib/auth";
import { eq } from "drizzle-orm";
import { after } from "next/server";

type ActionResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

/**
 * Submit a new question. Hashes the student password and inserts the question
 * with status 'new'. AI answer generation is triggered asynchronously via
 * `after()` so the student gets an immediate response.
 */
export async function submitQuestion(formData: FormData): Promise<ActionResult> {
  try {
    const authorName = formData.get("author_name") as string | null;
    const content = formData.get("content") as string | null;
    const password = formData.get("password") as string | null;
    const lectureIdRaw = formData.get("lecture_id") as string | null;

    if (!authorName || !content || !password) {
      return { success: false, error: "author_name, content, and password are required" };
    }

    const lectureId = lectureIdRaw ? parseInt(lectureIdRaw, 10) : null;
    if (lectureIdRaw && (isNaN(lectureId!) || lectureId === null)) {
      return { success: false, error: "Invalid lecture_id" };
    }

    const passwordHash = await hashPassword(password);

    const [created] = await db
      .insert(questions)
      .values({
        lectureId: lectureId!,
        authorName,
        content,
        passwordHash,
        status: "new",
      })
      .returning();

    // Trigger AI answer generation after the response is sent
    after(async () => {
      try {
        let transcript: string | null = null;
        if (lectureId) {
          const [lecture] = await db
            .select({ transcript: lectures.transcript })
            .from(lectures)
            .where(eq(lectures.id, lectureId))
            .limit(1);
          transcript = lecture?.transcript ?? null;
        }

        const aiAnswer = await generateAutoAnswer(content, transcript);

        await db
          .update(questions)
          .set({
            aiAnswer,
            status: "ai_answered",
            updatedAt: new Date(),
          })
          .where(eq(questions.id, created.id));
      } catch (err) {
        console.error("Failed to generate AI answer:", err);
      }
    });

    return { success: true, data: created };
  } catch (err) {
    console.error("submitQuestion error:", err);
    return { success: false, error: "Failed to submit question" };
  }
}

/**
 * Update a question's content. Requires the original password for verification.
 */
export async function updateQuestion(
  id: number,
  formData: FormData
): Promise<ActionResult> {
  try {
    const content = formData.get("content") as string | null;
    const password = formData.get("password") as string | null;

    if (!content || !password) {
      return { success: false, error: "content and password are required" };
    }

    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id))
      .limit(1);

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    const passwordValid = await verifyPassword(password, question.passwordHash);
    if (!passwordValid) {
      return { success: false, error: "Invalid password" };
    }

    const [updated] = await db
      .update(questions)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, id))
      .returning();

    return { success: true, data: updated };
  } catch (err) {
    console.error("updateQuestion error:", err);
    return { success: false, error: "Failed to update question" };
  }
}

/**
 * Delete a question. Requires the original password for verification.
 */
export async function deleteQuestion(
  id: number,
  password: string
): Promise<ActionResult> {
  try {
    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id))
      .limit(1);

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    const passwordValid = await verifyPassword(password, question.passwordHash);
    if (!passwordValid) {
      return { success: false, error: "Invalid password" };
    }

    await db.delete(questions).where(eq(questions.id, id));

    return { success: true };
  } catch (err) {
    console.error("deleteQuestion error:", err);
    return { success: false, error: "Failed to delete question" };
  }
}

/**
 * Add an instructor answer to a question. Requires the instructor password.
 */
export async function addInstructorAnswer(
  id: number,
  answer: string,
  instructorPassword: string
): Promise<ActionResult> {
  try {
    if (!verifyInstructorPassword(instructorPassword)) {
      return { success: false, error: "Invalid instructor password" };
    }

    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id))
      .limit(1);

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    const [updated] = await db
      .update(questions)
      .set({
        instructorAnswer: answer,
        status: "instructor_answered",
        updatedAt: new Date(),
      })
      .where(eq(questions.id, id))
      .returning();

    // Auto-generate a per-question insight in the background when both AI and
    // instructor answers exist. Returns immediately so the instructor UI feels
    // snappy; the insight lands in the "핵심 인사이트" column once ready.
    if (updated.aiAnswer && updated.instructorAnswer) {
      after(async () => {
        try {
          const insightContent = await generateQuestionInsight(
            updated.content,
            updated.aiAnswer!,
            updated.instructorAnswer!
          );

          await db.insert(insights).values({
            lectureId: updated.lectureId,
            content: insightContent,
            sourceQuestionIds: String(updated.id),
          });
        } catch (err) {
          console.error("Failed to auto-generate question insight:", err);
        }
      });
    }

    return { success: true, data: updated };
  } catch (err) {
    console.error("addInstructorAnswer error:", err);
    return { success: false, error: "Failed to add instructor answer" };
  }
}

/**
 * Toggle the is_important flag on a question. Requires the instructor password.
 */
export async function toggleImportant(
  id: number,
  instructorPassword: string
): Promise<ActionResult> {
  try {
    if (!verifyInstructorPassword(instructorPassword)) {
      return { success: false, error: "Invalid instructor password" };
    }

    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id))
      .limit(1);

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    const [updated] = await db
      .update(questions)
      .set({
        isImportant: !question.isImportant,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, id))
      .returning();

    return { success: true, data: updated };
  } catch (err) {
    console.error("toggleImportant error:", err);
    return { success: false, error: "Failed to toggle important status" };
  }
}
