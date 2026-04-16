"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { submitQuestion } from "@/app/actions/questions";
import { Send, CheckCircle } from "lucide-react";

const MAX_CONTENT = 1000;

interface QuestionFormProps {
  lectureId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  isPreLecture?: boolean;
}

export function QuestionForm({
  lectureId,
  open,
  onOpenChange,
  onSuccess,
  isPreLecture = false,
}: QuestionFormProps) {
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function resetForm() {
    setAuthorName("");
    setContent("");
    setPassword("");
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!authorName.trim() || !content.trim() || !password.trim()) {
      setError("모든 항목을 입력해 주세요.");
      return;
    }

    if (content.length > MAX_CONTENT) {
      setError(`질문 내용은 ${MAX_CONTENT}자 이하여야 합니다.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("author_name", authorName.trim());
      formData.set("content", content.trim());
      formData.set("password", password);
      formData.set("lecture_id", String(lectureId));
      if (isPreLecture) formData.set("is_pre_lecture", "true");

      const result = await submitQuestion(formData);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
          resetForm();
          onSuccess?.();
        }, 1200);
      } else {
        setError(result.error || "질문 등록에 실패했습니다.");
      }
    } catch {
      setError("질문 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isPreLecture ? "사전질문 등록" : "질문하기"}</DialogTitle>
          <DialogDescription>
            {isPreLecture
              ? "수업 전 궁금한 내용을 미리 질문해 주세요. 강사님이 직접 답변합니다."
              : "궁금한 내용을 질문해 주세요. AI가 먼저 답변하고, 강사님이 직접 답변을 추가할 수 있습니다."}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <CheckCircle className="size-12 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-700">
              {isPreLecture ? "사전질문이 등록되었습니다!" : "질문이 등록되었습니다!"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isPreLecture
                ? "강사님이 답변할 예정입니다."
                : "AI가 답변을 생성 중입니다..."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="author_name" className="text-sm font-medium">
                작성자
              </label>
              <Input
                id="author_name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="이름을 입력하세요"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="content" className="text-sm font-medium">
                질문 내용
              </label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="질문 내용을 입력하세요"
                className="min-h-28"
                maxLength={MAX_CONTENT}
                disabled={isSubmitting}
                required
              />
              <p
                className={`text-xs text-right ${
                  content.length > MAX_CONTENT
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {content.length} / {MAX_CONTENT}자
              </p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="수정/삭제 시 필요합니다"
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-muted-foreground">
                질문 수정 및 삭제 시 비밀번호가 필요합니다.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                취소
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                <Send className="size-3.5" />
                {isSubmitting ? "등록 중..." : isPreLecture ? "사전질문 등록" : "질문 등록"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
