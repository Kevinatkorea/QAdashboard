"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { updateTranscript } from "@/app/actions/lectures";
import { FileText, Upload } from "lucide-react";

const MAX_CHARS = 50000;

interface TranscriptUploadProps {
  lectureId: number;
  instructorPassword: string;
}

export function TranscriptUpload({
  lectureId,
  instructorPassword,
}: TranscriptUploadProps) {
  const [transcript, setTranscript] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit() {
    if (!transcript.trim()) return;
    if (transcript.length > MAX_CHARS) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateTranscript(
        lectureId,
        transcript.trim(),
        instructorPassword
      );
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setTranscript("");
          setSuccess(false);
        }, 1500);
      } else {
        setError(result.error || "녹취록 등록에 실패했습니다.");
      }
    } catch {
      setError("녹취록 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" />
        }
      >
        <FileText className="size-3.5" />
        녹취록 등록
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>강의 녹취록 등록</DialogTitle>
          <DialogDescription>
            강의 녹취록을 붙여넣기 해주세요. AI 답변 생성에 활용됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="강의 녹취록을 여기에 붙여넣기 하세요..."
            className="min-h-60 text-sm"
            maxLength={MAX_CHARS}
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {transcript.length > MAX_CHARS && (
                <span className="text-destructive">글자 수 초과! </span>
              )}
            </span>
            <span
              className={
                transcript.length > MAX_CHARS
                  ? "text-destructive font-medium"
                  : ""
              }
            >
              {transcript.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}자
            </span>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          {success && (
            <p className="text-xs text-emerald-600 font-medium">
              녹취록이 등록되었습니다!
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" />}
          >
            취소
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !transcript.trim() ||
              transcript.length > MAX_CHARS
            }
          >
            <Upload className="size-3.5" />
            {isSubmitting ? "등록 중..." : "등록하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
