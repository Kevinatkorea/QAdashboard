"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addInstructorAnswer } from "@/app/actions/questions";
import { Send } from "lucide-react";

interface InstructorAnswerFormProps {
  questionId: number;
  instructorPassword: string;
  initialValue?: string;
  onSuccess?: () => void;
}

export function InstructorAnswerForm({
  questionId,
  instructorPassword,
  initialValue = "",
  onSuccess,
}: InstructorAnswerFormProps) {
  const [answer, setAnswer] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await addInstructorAnswer(
        questionId,
        answer.trim(),
        instructorPassword
      );
      if (result.success) {
        setAnswer("");
        onSuccess?.();
      } else {
        setError(result.error || "답변 등록에 실패했습니다.");
      }
    } catch {
      setError("답변 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="강사 답변을 입력하세요..."
        className="min-h-20 text-sm"
        disabled={isSubmitting}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !answer.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Send className="size-3.5" />
          {isSubmitting ? "등록 중..." : "답변 등록"}
        </Button>
      </div>
    </form>
  );
}
