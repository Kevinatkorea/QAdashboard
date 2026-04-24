"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { LectureAttachment } from "@/types";
import {
  uploadAttachment,
  deleteAttachment,
  listAttachments,
} from "@/app/actions/attachments";
import {
  Paperclip,
  Download,
  Trash2,
  Upload,
  Loader2,
  FileIcon,
} from "lucide-react";

const MAX_FILE_SIZE_MB = 20;

interface AttachmentsSectionProps {
  lectureId: number;
  initialAttachments: LectureAttachment[];
  isInstructorMode: boolean;
  instructorPassword: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsSection({
  lectureId,
  initialAttachments,
  isInstructorMode,
  instructorPassword,
}: AttachmentsSectionProps) {
  const [attachments, setAttachments] =
    useState<LectureAttachment[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAttachments(initialAttachments);
  }, [initialAttachments]);

  async function refresh() {
    const result = await listAttachments(lectureId);
    if (result.success && Array.isArray(result.data)) {
      setAttachments(result.data as LectureAttachment[]);
    }
  }

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setUploading(true);

    try {
      for (const file of Array.from(fileList)) {
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          setError(
            `"${file.name}"이 20MB를 초과합니다. (${(file.size / 1024 / 1024).toFixed(1)}MB)`
          );
          continue;
        }
        const formData = new FormData();
        formData.append("lectureId", String(lectureId));
        formData.append("instructorPassword", instructorPassword);
        formData.append("file", file);

        const result = await uploadAttachment(formData);
        if (!result.success) {
          setError(result.error || `"${file.name}" 업로드 실패`);
          break;
        }
      }
      await refresh();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleDelete(id: number, name: string) {
    if (!confirm(`"${name}"을(를) 삭제할까요?`)) return;
    setDeletingId(id);
    setError(null);
    startTransition(async () => {
      const result = await deleteAttachment(id, instructorPassword);
      if (result.success) {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
      } else {
        setError(result.error || "삭제 실패");
      }
      setDeletingId(null);
    });
  }

  const hasAttachments = attachments.length > 0;

  if (!hasAttachments && !isInstructorMode) {
    return null;
  }

  return (
    <section
      aria-label="강의 첨부파일"
      className="border rounded-lg bg-muted/20 p-3 space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Paperclip className="size-3.5" />
          <span>첨부파일</span>
          {hasAttachments && (
            <span className="text-xs">({attachments.length})</span>
          )}
        </div>
        {isInstructorMode && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
              disabled={uploading}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              {uploading ? "업로드 중..." : "파일 추가"}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {hasAttachments ? (
        <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center gap-2 bg-background border rounded-md pl-2.5 pr-1 py-1 text-sm"
            >
              <FileIcon className="size-3.5 text-muted-foreground shrink-0" />
              <a
                href={att.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={att.fileName}
                className="hover:text-primary hover:underline max-w-[14rem] truncate"
                title={att.fileName}
              >
                {att.fileName}
              </a>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatBytes(att.fileSize)}
              </span>
              <a
                href={att.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={att.fileName}
                aria-label={`${att.fileName} 다운로드`}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <Download className="size-3.5" />
              </a>
              {isInstructorMode && (
                <button
                  type="button"
                  onClick={() => handleDelete(att.id, att.fileName)}
                  disabled={deletingId === att.id}
                  aria-label={`${att.fileName} 삭제`}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-40"
                >
                  {deletingId === att.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          첨부된 파일이 없습니다. 파일을 추가해 학생들이 다운로드할 수 있도록
          하세요. (최대 20MB)
        </p>
      )}
    </section>
  );
}
