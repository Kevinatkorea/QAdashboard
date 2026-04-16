"use client";

import { useState, useCallback, useEffect } from "react";
import type { Question, Insight } from "@/types";
import { usePolling } from "@/hooks/usePolling";
import { KanbanColumn } from "@/components/KanbanColumn";
import { QuestionCard } from "@/components/QuestionCard";
import { QuestionForm } from "@/components/QuestionForm";
import { InsightsPanel } from "@/components/InsightsPanel";
import { Button } from "@/components/ui/button";
import { getInsights } from "@/app/actions/insights";
import { MessageCirclePlus, BookOpen } from "lucide-react";

interface KanbanBoardProps {
  lectureId: number;
  lectureTitle: string;
  initialQuestions: Question[];
  initialInsights: Insight[];
  isInstructorMode: boolean;
  instructorPassword: string;
}

export function KanbanBoard({
  lectureId,
  lectureTitle,
  initialQuestions,
  initialInsights,
  isInstructorMode,
  instructorPassword,
}: KanbanBoardProps) {
  const { questions, refetch, removeQuestion } = usePolling(
    lectureId,
    initialQuestions
  );
  const [questionFormOpen, setQuestionFormOpen] = useState(false);
  const [preQuestionFormOpen, setPreQuestionFormOpen] = useState(false);
  const [insights, setInsights] = useState<Insight[]>(initialInsights);

  // Categorize questions: 4-column flow — 사전질문 → 새 질문 → 답변(AI/강사) → 핵심 인사이트
  const preLectureQuestions = questions.filter((q) => q.status === "pre_lecture");
  const newQuestions = questions.filter((q) => q.status === "new");
  const answered = questions
    .filter((q) => q.status === "ai_answered" || q.status === "instructor_answered")
    .sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });

  const handleRefreshInsights = useCallback(async () => {
    try {
      const result = await getInsights(lectureId);
      if (result.success && result.data) {
        setInsights(result.data as Insight[]);
      }
    } catch {
      // silently fail
    }
  }, [lectureId]);

  // Poll insights every 10s
  useEffect(() => {
    const interval = setInterval(handleRefreshInsights, 10000);
    return () => clearInterval(interval);
  }, [handleRefreshInsights]);

  return (
    <>
      {/* Board */}
      <main className="py-3 sm:py-4">
        <section aria-label="질문 칸반보드" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 h-full">
          {/* Column 0: 사전질문 */}
          <KanbanColumn
            title="사전질문"
            count={preLectureQuestions.length}
            colorTheme="green"
          >
            {preLectureQuestions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                isInstructorMode={isInstructorMode}
                instructorPassword={instructorPassword}
                onRefetch={refetch}
                onDelete={removeQuestion}
              />
            ))}
          </KanbanColumn>

          {/* Column 1: 새 질문 */}
          <KanbanColumn
            title="새 질문"
            count={newQuestions.length}
            colorTheme="blue"
          >
            {newQuestions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                isInstructorMode={isInstructorMode}
                instructorPassword={instructorPassword}
                onRefetch={refetch}
                onDelete={removeQuestion}
              />
            ))}
          </KanbanColumn>

          {/* Column 2: 답변 */}
          <KanbanColumn
            title="답변"
            count={answered.length}
            colorTheme="purple"
          >
            {answered.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                isInstructorMode={isInstructorMode}
                instructorPassword={instructorPassword}
                onRefetch={refetch}
                onDelete={removeQuestion}
              />
            ))}
          </KanbanColumn>

          {/* Column 3: 핵심 인사이트 */}
          <KanbanColumn
            title="핵심 인사이트"
            count={insights.length}
            colorTheme="amber"
          >
            <InsightsPanel insights={insights} />
          </KanbanColumn>
        </section>
      </main>

      {/* Floating question buttons */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col gap-2">
        <Button
          className="h-10 sm:h-12 rounded-full px-3 sm:px-4 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/25 transition-all bg-emerald-600 hover:bg-emerald-700"
          size="lg"
          onClick={() => setPreQuestionFormOpen(true)}
          aria-label="사전질문"
        >
          <BookOpen className="size-4" />
          <span className="hidden xs:inline sm:inline">사전질문</span>
        </Button>
        <Button
          className="h-10 sm:h-12 rounded-full px-3 sm:px-4 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
          size="lg"
          onClick={() => setQuestionFormOpen(true)}
          aria-label="질문하기"
        >
          <MessageCirclePlus className="size-4" />
          <span className="hidden xs:inline sm:inline">질문하기</span>
        </Button>
      </div>

      {/* Question form modals */}
      <QuestionForm
        lectureId={lectureId}
        open={preQuestionFormOpen}
        onOpenChange={setPreQuestionFormOpen}
        onSuccess={refetch}
        isPreLecture
      />
      <QuestionForm
        lectureId={lectureId}
        open={questionFormOpen}
        onOpenChange={setQuestionFormOpen}
        onSuccess={refetch}
      />
    </>
  );
}
