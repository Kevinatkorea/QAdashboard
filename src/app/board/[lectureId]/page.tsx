import { db } from "@/db";
import { questions, lectures, insights, seats, tasks, taskCompletions } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BoardContainer } from "@/components/BoardContainer";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lectureId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lectureId } = await params;
  const id = parseInt(lectureId, 10);
  if (isNaN(id)) return { title: "강의를 찾을 수 없습니다" };

  const [lecture] = await db
    .select()
    .from(lectures)
    .where(eq(lectures.id, id))
    .limit(1);

  if (!lecture) return { title: "강의를 찾을 수 없습니다" };

  return {
    title: `${lecture.title} - Q&A 보드`,
    description: `${lecture.title} 강의 Q&A 칸반보드`,
  };
}

export default async function BoardPage({ params }: Props) {
  const { lectureId } = await params;
  const id = parseInt(lectureId, 10);

  if (isNaN(id)) {
    notFound();
  }

  const [lecture] = await db
    .select()
    .from(lectures)
    .where(eq(lectures.id, id))
    .limit(1);

  if (!lecture) {
    notFound();
  }

  // Fetch all data in parallel
  const [initialQuestions, initialInsights, initialSeats, initialTasks] =
    await Promise.all([
      db.select().from(questions).where(eq(questions.lectureId, id)),
      db
        .select()
        .from(insights)
        .where(eq(insights.lectureId, id))
        .orderBy(desc(insights.createdAt)),
      db.select().from(seats).where(eq(seats.lectureId, id)),
      db
        .select()
        .from(tasks)
        .where(eq(tasks.lectureId, id))
        .orderBy(asc(tasks.sortOrder)),
    ]);

  // Fetch task completions for the seats in this lecture
  const seatIds = initialSeats.map((s) => s.id);
  let initialCompletions: {
    id: number;
    taskId: number;
    seatId: number;
    completedAt: Date | null;
  }[] = [];
  if (seatIds.length > 0) {
    const allCompletions = await db.select().from(taskCompletions);
    initialCompletions = allCompletions.filter((c) =>
      seatIds.includes(c.seatId)
    );
  }

  return (
    <BoardContainer
      lectureId={id}
      lectureTitle={lecture.title}
      initialQuestions={initialQuestions}
      initialInsights={initialInsights}
      initialSeatingData={{
        seats: initialSeats,
        tasks: initialTasks,
        completions: initialCompletions,
      }}
    />
  );
}
