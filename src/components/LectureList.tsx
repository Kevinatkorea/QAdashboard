"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lecture } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createLecture } from "@/app/actions/lectures";
import { LocalDate } from "@/components/LocalDate";
import {
  Plus,
  BookOpen,
  Calendar,
  ArrowRight,
  Paperclip,
} from "lucide-react";

interface LectureListProps {
  initialLectures: Lecture[];
  attachmentCounts?: Record<number, number>;
}

export function LectureList({
  initialLectures,
  attachmentCounts = {},
}: LectureListProps) {
  const [lectures, setLectures] = useState<Lecture[]>(initialLectures);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !password.trim()) {
      setError("모든 항목을 입력해 주세요.");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const result = await createLecture(title.trim(), password);
      if (result.success && result.data) {
        const newLecture = result.data as Lecture;
        setLectures((prev) => [newLecture, ...prev]);
        setDialogOpen(false);
        setTitle("");
        setPassword("");
      } else {
        setError(result.error || "강의 생성에 실패했습니다.");
      }
    } catch {
      setError("강의 생성 중 오류가 발생했습니다.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Create lecture button */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setTitle("");
            setPassword("");
            setError(null);
          }
        }}
      >
        <DialogTrigger
          render={<Button className="w-full h-12 text-base" />}
        >
          <Plus className="size-5" />
          새 강의 만들기
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>새 강의 만들기</DialogTitle>
            <DialogDescription>
              새로운 강의를 만들고 Q&A 보드를 시작하세요.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="lecture_title" className="text-sm font-medium">
                강의 제목
              </label>
              <Input
                id="lecture_title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: Claude API 실습 - 1주차"
                disabled={isCreating}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="instructor_password"
                className="text-sm font-medium"
              >
                강사 비밀번호
              </label>
              <Input
                id="instructor_password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="강사 비밀번호를 입력하세요"
                disabled={isCreating}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                취소
              </DialogClose>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "생성 중..." : "생성하기"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lecture list */}
      {lectures.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BookOpen className="size-12 opacity-30 mb-4" />
          <p className="text-sm">아직 등록된 강의가 없습니다.</p>
          <p className="text-xs mt-1">
            위 버튼을 눌러 첫 강의를 만들어 보세요.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 list-none p-0">
          {lectures.map((lecture) => (
            <li key={lecture.id}>
              <Link href={`/board/${lecture.id}`} className="block">
                <Card className="transition-all hover:shadow-md hover:ring-2 hover:ring-primary/10 cursor-pointer group h-full">
                  <CardContent>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                          {lecture.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3" />
                            <LocalDate
                              date={lecture.createdAt}
                              as="time"
                              className="text-xs"
                            />
                          </div>
                          {(attachmentCounts[lecture.id] ?? 0) > 0 && (
                            <div className="flex items-center gap-1" title="첨부파일">
                              <Paperclip className="size-3" />
                              <span className="text-xs">
                                {attachmentCounts[lecture.id]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
