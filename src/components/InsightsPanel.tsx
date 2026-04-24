"use client";

import type { Insight } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LocalDate } from "@/components/LocalDate";
import { Sparkles } from "lucide-react";

interface InsightsPanelProps {
  insights: Insight[];
}

const INSIGHT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Sparkles className="mb-3 size-8 opacity-40" />
        <p className="text-sm">아직 생성된 인사이트가 없습니다.</p>
        <p className="text-xs mt-1">강사 답변이 등록되면 자동 생성됩니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {insights.map((insight) => (
        <Card key={insight.id} className="animate-in fade-in-0 duration-300">
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-4 text-amber-500" />
              <LocalDate
                date={insight.createdAt}
                options={INSIGHT_DATE_OPTIONS}
                className="text-xs text-muted-foreground"
              />
            </div>
            <Separator className="mb-3" />
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {insight.content}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
