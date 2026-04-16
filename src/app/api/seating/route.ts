import { db } from "@/db";
import { seats, tasks, taskCompletions } from "@/db/schema";
import { eq, gt, and, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/seating?lecture_id=<id>&since=<ISO timestamp>
 *
 * Returns seats, tasks, and task completions for a lecture.
 * If `since` is provided, only returns seats updated after that timestamp.
 * Tasks and completions are always returned in full (small payload).
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

    // Fetch seats (incremental if since provided)
    let seatResult;
    if (sinceParam) {
      const sinceDate = new Date(sinceParam);
      if (isNaN(sinceDate.getTime())) {
        return NextResponse.json(
          { success: false, error: "since must be a valid ISO timestamp" },
          { status: 400, headers: CORS_HEADERS }
        );
      }
      seatResult = await db
        .select()
        .from(seats)
        .where(
          and(eq(seats.lectureId, lectureId), gt(seats.updatedAt, sinceDate))
        );
    } else {
      seatResult = await db
        .select()
        .from(seats)
        .where(eq(seats.lectureId, lectureId));
    }

    // Always fetch full tasks and completions (small payload)
    const taskResult = await db
      .select()
      .from(tasks)
      .where(eq(tasks.lectureId, lectureId))
      .orderBy(asc(tasks.sortOrder));

    // Get all seat IDs for this lecture to filter completions
    const allSeatIds = sinceParam
      ? (
          await db
            .select({ id: seats.id })
            .from(seats)
            .where(eq(seats.lectureId, lectureId))
        ).map((s) => s.id)
      : seatResult.map((s) => s.id);

    let completionResult: { id: number; taskId: number; seatId: number; completedAt: Date | null }[] = [];
    if (allSeatIds.length > 0) {
      const allCompletions = await db.select().from(taskCompletions);
      completionResult = allCompletions.filter((c) =>
        allSeatIds.includes(c.seatId)
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          seats: seatResult,
          tasks: taskResult,
          completions: completionResult,
        },
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("GET /api/seating error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch seating data" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
