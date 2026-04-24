import { getLectures } from "@/app/actions/lectures";
import { LectureList } from "@/components/LectureList";
import { db } from "@/db";
import { lectureAttachments } from "@/db/schema";
import { sql } from "drizzle-orm";
import type { Lecture } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const result = await getLectures();
  const lectures = (result.success ? (result.data as Lecture[]) : []) ?? [];

  const attachmentCountsRaw = await db
    .select({
      lectureId: lectureAttachments.lectureId,
      count: sql<number>`count(*)::int`,
    })
    .from(lectureAttachments)
    .groupBy(lectureAttachments.lectureId);
  const attachmentCounts: Record<number, number> = {};
  for (const row of attachmentCountsRaw) {
    attachmentCounts[row.lectureId] = row.count;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-6 md:py-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            강의 Q&A 보드
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            홍익대학교 대학원 Claude 강의 Q&A 칸반보드
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <section aria-label="강의 목록">
          <LectureList
            initialLectures={lectures}
            attachmentCounts={attachmentCounts}
          />
        </section>
      </main>
    </div>
  );
}
