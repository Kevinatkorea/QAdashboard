import { db } from "@/db";
import { questions, lectures, insights } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { KanbanBoard } from "@/components/KanbanBoard";
import type { Metadata } from "next";

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

  const initialQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.lectureId, id));

  const initialInsights = await db
    .select()
    .from(insights)
    .where(eq(insights.lectureId, id))
    .orderBy(desc(insights.createdAt));

  return (
    <KanbanBoard
      lectureId={id}
      lectureTitle={lecture.title}
      initialQuestions={initialQuestions}
      initialInsights={initialInsights}
    />
  );
}
