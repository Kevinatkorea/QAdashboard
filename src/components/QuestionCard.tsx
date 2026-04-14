"use client";

import { useState } from "react";
import type { Question } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { InstructorAnswerForm } from "@/components/InstructorAnswerForm";
import {
  updateQuestion,
  deleteQuestion,
  toggleImportant,
} from "@/app/actions/questions";
import {
  ChevronDown,
  ChevronUp,
  Star,
  Pencil,
  Trash2,
  Bot,
  GraduationCap,
  Clock,
  User,
} from "lucide-react";

interface QuestionCardProps {
  question: Question;
  isInstructorMode: boolean;
  instructorPassword: string;
  onRefetch?: () => void;
  onDelete?: (id: number) => void;
}

function formatRelativeTime(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return d.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

export function QuestionCard({
  question,
  isInstructorMode,
  instructorPassword,
  onRefetch,
  onDelete,
}: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  const [editContent, setEditContent] = useState(question.content);
  const [editPassword, setEditPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const hasAiAnswer = !!question.aiAnswer;
  const hasInstructorAnswer = !!question.instructorAnswer;
  const isNew = question.status === "new";

  async function handleUpdate() {
    if (!editContent.trim() || !editPassword.trim()) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      const formData = new FormData();
      formData.set("content", editContent.trim());
      formData.set("password", editPassword);
      const result = await updateQuestion(question.id, formData);
      if (result.success) {
        setIsEditing(false);
        setEditPassword("");
        onRefetch?.();
      } else {
        setActionError(result.error || "수정에 실패했습니다.");
      }
    } catch {
      setActionError("수정 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDelete() {
    if (!deletePassword.trim()) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      const result = await deleteQuestion(question.id, deletePassword);
      if (result.success) {
        onDelete?.(question.id);
      } else {
        setActionError(result.error || "삭제에 실패했습니다.");
      }
    } catch {
      setActionError("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleToggleImportant() {
    if (!instructorPassword) return;
    try {
      await toggleImportant(question.id, instructorPassword);
      onRefetch?.();
    } catch {
      // silently fail
    }
  }

  const needsInstructorAnswer =
    isInstructorMode && hasAiAnswer && !hasInstructorAnswer;

  return (
    <Card
      className={`animate-in fade-in-0 slide-in-from-bottom-2 duration-300 cursor-pointer transition-shadow hover:shadow-md ${
        needsInstructorAnswer ? "ring-2 ring-amber-300/60 shadow-sm" : ""
      }`}
      size="sm"
    >
      <CardContent className="p-0 px-3">
        {/* Header */}
        <div
          className="flex items-start justify-between gap-2"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <User className="size-3 text-muted-foreground shrink-0" />
              <span className="text-xs font-medium truncate">
                {question.authorName}
              </span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="size-2.5" />
                <span className="text-[10px]">
                  {formatRelativeTime(question.createdAt)}
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed line-clamp-2">
              {question.content}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0 pt-0.5">
            {isNew && (
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
              </span>
            )}
            {question.isImportant && (
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
            )}
            {expanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-1.5 mt-2">
          {isNew && (
            <Badge
              variant="secondary"
              className="text-[10px] h-4 bg-blue-50 text-blue-700 border-blue-200"
            >
              AI 처리 중...
            </Badge>
          )}
          {hasAiAnswer && (
            <Badge
              variant="secondary"
              className="text-[10px] h-4 bg-purple-50 text-purple-700 border-purple-200"
            >
              <Bot className="size-2.5" />
              AI
            </Badge>
          )}
          {hasInstructorAnswer && (
            <Badge
              variant="secondary"
              className="text-[10px] h-4 bg-emerald-50 text-emerald-700 border-emerald-200"
            >
              <GraduationCap className="size-2.5" />
              강사
            </Badge>
          )}
          {isInstructorMode && hasAiAnswer && !hasInstructorAnswer && (
            <Badge
              variant="secondary"
              className="text-[10px] h-4 bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
            >
              강사 답변 필요
            </Badge>
          )}
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-3 space-y-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <Separator />

            {/* Full question content */}
            {!isEditing && (
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {question.content}
              </div>
            )}

            {/* Instructor Answer Form — placed ABOVE the AI answer so instructors
                 can respond without scrolling past a long AI reply. */}
            {isInstructorMode && !hasInstructorAnswer && (
              <div
                className="rounded-lg bg-emerald-50/40 border border-emerald-200 p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <GraduationCap className="size-3.5 text-emerald-600" />
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-4 bg-emerald-100 text-emerald-700"
                  >
                    강사 답변 작성
                  </Badge>
                </div>
                <InstructorAnswerForm
                  questionId={question.id}
                  instructorPassword={instructorPassword}
                  onSuccess={onRefetch}
                />
              </div>
            )}

            {/* AI Answer */}
            {hasAiAnswer && (
              <div className="rounded-lg bg-purple-50/50 border border-purple-100 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Bot className="size-3.5 text-purple-600" />
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-4 bg-purple-100 text-purple-700"
                  >
                    AI 답변
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-purple-900/80">
                  {question.aiAnswer}
                </p>
              </div>
            )}

            {/* Instructor Answer (with edit affordance in instructor mode) */}
            {hasInstructorAnswer && (
              <div
                className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <GraduationCap className="size-3.5 text-emerald-600" />
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-4 bg-emerald-100 text-emerald-700"
                  >
                    강사 답변
                  </Badge>
                  {isInstructorMode && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="ml-auto h-5 px-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100"
                      onClick={() => setIsEditingAnswer((v) => !v)}
                    >
                      <Pencil className="size-3" />
                      {isEditingAnswer ? "취소" : "수정"}
                    </Button>
                  )}
                </div>
                {isEditingAnswer ? (
                  <InstructorAnswerForm
                    questionId={question.id}
                    instructorPassword={instructorPassword}
                    initialValue={question.instructorAnswer ?? ""}
                    onSuccess={() => {
                      setIsEditingAnswer(false);
                      onRefetch?.();
                    }}
                  />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-emerald-900/80">
                    {question.instructorAnswer}
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              {isInstructorMode && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleImportant();
                  }}
                  className={
                    question.isImportant
                      ? "text-amber-500 hover:text-amber-600"
                      : "text-muted-foreground hover:text-amber-500"
                  }
                >
                  <Star
                    className={`size-3 ${
                      question.isImportant ? "fill-amber-400" : ""
                    }`}
                  />
                  {question.isImportant ? "중요 해제" : "중요 표시"}
                </Button>
              )}
              <Button
                variant="ghost"
                size="xs"
                className="text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(!isEditing);
                  setShowDeleteConfirm(false);
                  setActionError(null);
                }}
              >
                <Pencil className="size-3" />
                수정
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(!showDeleteConfirm);
                  setIsEditing(false);
                  setActionError(null);
                }}
              >
                <Trash2 className="size-3" />
                삭제
              </Button>
            </div>

            {/* Edit form */}
            {isEditing && (
              <div
                className="space-y-2 p-3 rounded-lg bg-muted/50 border"
                onClick={(e) => e.stopPropagation()}
              >
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-20 text-sm"
                  disabled={isProcessing}
                />
                <Input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  disabled={isProcessing}
                />
                {actionError && (
                  <p className="text-xs text-destructive">{actionError}</p>
                )}
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(question.content);
                      setEditPassword("");
                      setActionError(null);
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    size="xs"
                    onClick={handleUpdate}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "수정 중..." : "수정하기"}
                  </Button>
                </div>
              </div>
            )}

            {/* Delete confirmation */}
            {showDeleteConfirm && (
              <div
                className="space-y-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-xs text-destructive font-medium">
                  정말 이 질문을 삭제하시겠습니까?
                </p>
                <Input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  disabled={isProcessing}
                />
                {actionError && (
                  <p className="text-xs text-destructive">{actionError}</p>
                )}
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword("");
                      setActionError(null);
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={handleDelete}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "삭제 중..." : "삭제하기"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
