"use client";

import { useState, useCallback, useEffect } from "react";
import type { Question, Insight } from "@/types";
import { usePolling } from "@/hooks/usePolling";
import { KanbanColumn } from "@/components/KanbanColumn";
import { QuestionCard } from "@/components/QuestionCard";
import { QuestionForm } from "@/components/QuestionForm";
import { InstructorToolbar } from "@/components/InstructorToolbar";
import { InsightsPanel } from "@/components/InsightsPanel";
import { Button } from "@/components/ui/button";
import { getInsights } from "@/app/actions/insights";
import { MessageCirclePlus } from "lucide-react";

interface KanbanBoardProps {
  lectureId: number;
  lectureTitle: string;
  initialQuestions: Question[];
  initialInsights: Insight[];
}

export function KanbanBoard({
  lectureId,
  lectureTitle,
  initialQuestions,
  initialInsights,
}: KanbanBoardProps) {
  const { questions, refetch, removeQuestion } = usePolling(
    lectureId,
    initialQuestions
  );
  const [questionFormOpen, setQuestionFormOpen] = useState(false);
  const [isInstructorMode, setIsInstructorMode] = useState(false);
  const [instructorPassword, setInstructorPassword] = useState("");
  const [insights, setInsights] = useState<Insight[]>(initialInsights);

  // Categorize questions: 3-column flow — 새 질문 → 답변(AI/강사) → 핵심 인사이트
  // The "답변" column shows anything with an AI answer; the instructor answer
  // renders as a supplementary section on the same card when present.
  const newQuestions = questions.filter((q) => q.status === "new");
  const answered = questions.filter(
    (q) => q.status === "ai_answered" || q.status === "instructor_answered"
  );

  const handleAuthenticate = useCallback(() => {
    // We just store the password — actual verification happens on server action calls
    setIsInstructorMode(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsInstructorMode(false);
    setInstructorPassword("");
  }, []);

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

  // Poll insights every 10s so auto-generated insights (from instructor
  // answers) appear without a manual refresh.
  useEffect(() => {
    const interval = setInterval(handleRefreshInsights, 10000);
    return () => clearInterval(interval);
  }, [handleRefreshInsights]);

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 py-3">
          <nav aria-label="상단 내비게이션" className="flex flex-col sm:flex-row sm:items-center sm:gap-3 mb-2 gap-1">
            <a
              href="/"
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              ← 강의 목록
            </a>
            <h1 className="text-base sm:text-lg md:text-xl font-semibold truncate">{lectureTitle}</h1>
          </nav>

          {/* Instructor Toolbar */}
          <InstructorToolbar
            lectureId={lectureId}
            instructorPassword={instructorPassword}
            isAuthenticated={isInstructorMode}
            onPasswordChange={setInstructorPassword}
            onAuthenticate={handleAuthenticate}
            onLogout={handleLogout}
            onRefetch={refetch}
          />
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <section aria-label="질문 칸반보드" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 h-full">
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

          {/* Column 2: 답변 (AI + 강사 답변이 같은 카드에 누적) */}
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

          {/* Column 3: 핵심 인사이트 (강사 답변 완료 시 자동 생성) */}
          <KanbanColumn
            title="핵심 인사이트"
            count={insights.length}
            colorTheme="amber"
          >
            <InsightsPanel insights={insights} />
          </KanbanColumn>
        </section>
      </main>

      {/* Floating question button */}
      <Button
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 h-12 sm:h-14 rounded-full px-4 sm:px-5 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
        size="lg"
        onClick={() => setQuestionFormOpen(true)}
        aria-label="질문하기"
      >
        <MessageCirclePlus className="size-5" />
        <span className="hidden xs:inline sm:inline">질문하기</span>
      </Button>

      {/* Question form modal */}
      <QuestionForm
        lectureId={lectureId}
        open={questionFormOpen}
        onOpenChange={setQuestionFormOpen}
        onSuccess={refetch}
      />
    </div>
  );
}
