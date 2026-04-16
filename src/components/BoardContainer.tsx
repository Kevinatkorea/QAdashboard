"use client";

import { useState, useCallback } from "react";
import type { Question, Insight } from "@/types";
import type { SeatingData } from "@/hooks/useSeatingPolling";
import { KanbanBoard } from "@/components/KanbanBoard";
import { SeatingManager } from "@/components/SeatingManager";
import { InstructorToolbar } from "@/components/InstructorToolbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface BoardContainerProps {
  lectureId: number;
  lectureTitle: string;
  initialQuestions: Question[];
  initialInsights: Insight[];
  initialSeatingData: SeatingData;
}

export function BoardContainer({
  lectureId,
  lectureTitle,
  initialQuestions,
  initialInsights,
  initialSeatingData,
}: BoardContainerProps) {
  const [isInstructorMode, setIsInstructorMode] = useState(false);
  const [instructorPassword, setInstructorPassword] = useState("");
  const [activeTab, setActiveTab] = useState<string | number | null>("qa");

  const handleAuthenticate = useCallback(() => {
    setIsInstructorMode(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsInstructorMode(false);
    setInstructorPassword("");
  }, []);

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 py-3">
          <nav
            aria-label="상단 내비게이션"
            className="flex flex-col sm:flex-row sm:items-center sm:gap-3 mb-2 gap-1"
          >
            <a
              href="/"
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              &larr; 강의 목록
            </a>
            <h1 className="text-base sm:text-lg md:text-xl font-semibold truncate">
              {lectureTitle}
            </h1>
          </nav>

          <InstructorToolbar
            lectureId={lectureId}
            instructorPassword={instructorPassword}
            isAuthenticated={isInstructorMode}
            onPasswordChange={setInstructorPassword}
            onAuthenticate={handleAuthenticate}
            onLogout={handleLogout}
            onRefetch={() => {}}
          />
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-screen-2xl mx-auto w-full px-3 sm:px-4 md:px-6 pt-3">
        <Tabs
          defaultValue="qa"
          onValueChange={(val) => setActiveTab(val)}
        >
          <TabsList>
            <TabsTrigger value="qa">Q&A 보드</TabsTrigger>
            <TabsTrigger value="seating">좌석배치 / 수행관리</TabsTrigger>
          </TabsList>

          <TabsContent value="qa">
            <KanbanBoard
              lectureId={lectureId}
              lectureTitle={lectureTitle}
              initialQuestions={initialQuestions}
              initialInsights={initialInsights}
              isInstructorMode={isInstructorMode}
              instructorPassword={instructorPassword}
            />
          </TabsContent>

          <TabsContent value="seating">
            <SeatingManager
              lectureId={lectureId}
              isInstructorMode={isInstructorMode}
              instructorPassword={instructorPassword}
              initialData={initialSeatingData}
              enabled={activeTab === "seating"}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
