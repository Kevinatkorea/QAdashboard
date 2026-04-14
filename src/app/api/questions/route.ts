import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq, gt, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * Handle CORS preflight requests.
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/questions?lecture_id=<id>&since=<ISO timestamp>
 *
 * Returns questions for a lecture. If `since` is provided, only returns
 * questions updated after that timestamp (for polling).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const lectureIdParam = searchParams.get("lecture_id");
    const sinceParam = searchParams.get("since");

    if (!lectureIdParam) {
      return NextResponse.json(
        { success: false, error: "lecture_id query parameter is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const lectureId = parseInt(lectureIdParam, 10);
    if (isNaN(lectureId)) {
      return NextResponse.json(
        { success: false, error: "lecture_id must be a valid number" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    let result;

    if (sinceParam) {
      const sinceDate = new Date(sinceParam);
      if (isNaN(sinceDate.getTime())) {
        return NextResponse.json(
          { success: false, error: "since must be a valid ISO timestamp" },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      result = await db
        .select()
        .from(questions)
        .where(
          and(
            eq(questions.lectureId, lectureId),
            gt(questions.updatedAt, sinceDate)
          )
        );
    } else {
      result = await db
        .select()
        .from(questions)
        .where(eq(questions.lectureId, lectureId));
    }

    return NextResponse.json(
      { success: true, data: result },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("GET /api/questions error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch questions" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
