"use server";

import { db } from "@/db";
import { insights, questions } from "@/db/schema";
import { generateInsights } from "@/lib/ai";
import { verifyInstructorPassword } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

type ActionResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

/**
 * Generate AI-powered insights for a lecture based on its questions.
 * Requires the instructor password.
 */
export async function generateLectureInsights(
  lectureId: number,
  instructorPassword: string
): Promise<ActionResult> {
  try {
    if (!verifyInstructorPassword(instructorPassword)) {
      return { success: false, error: "Invalid instructor password" };
    }

    const lectureQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.lectureId, lectureId));

    if (lectureQuestions.length === 0) {
      return { success: false, error: "No questions found for this lecture" };
    }

    const mappedQuestions = lectureQuestions.map((q) => ({
      content: q.content,
      ai_answer: q.aiAnswer,
      instructor_answer: q.instructorAnswer,
    }));

    const insightContent = await generateInsights(mappedQuestions);

    const sourceQuestionIds = lectureQuestions.map((q) => q.id).join(",");

    const [created] = await db
      .insert(insights)
      .values({
        lectureId,
        content: insightContent,
        sourceQuestionIds,
      })
      .returning();

    return { success: true, data: created };
  } catch (err) {
    console.error("generateLectureInsights error:", err);
    return { success: false, error: "Failed to generate insights" };
  }
}

/**
 * Get all insights for a given lecture, ordered by most recent first.
 */
export async function getInsights(lectureId: number): Promise<ActionResult> {
  try {
    const lectureInsights = await db
      .select()
      .from(insights)
      .where(eq(insights.lectureId, lectureId))
      .orderBy(desc(insights.createdAt));

    return { success: true, data: lectureInsights };
  } catch (err) {
    console.error("getInsights error:", err);
    return { success: false, error: "Failed to fetch insights" };
  }
}
