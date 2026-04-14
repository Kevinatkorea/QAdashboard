"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TranscriptUpload } from "@/components/TranscriptUpload";
import {
  Lock,
  Unlock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

interface InstructorToolbarProps {
  lectureId: number;
  instructorPassword: string;
  isAuthenticated: boolean;
  onPasswordChange: (password: string) => void;
  onAuthenticate: () => void;
  onLogout: () => void;
  onRefetch: () => void;
}

export function InstructorToolbar({
  lectureId,
  instructorPassword,
  isAuthenticated,
  onPasswordChange,
  onAuthenticate,
  onLogout,
  onRefetch,
}: InstructorToolbarProps) {
  const [passwordInput, setPasswordInput] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
        <Lock className="size-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground shrink-0">
          강사 모드
        </span>
        <Input
          type="password"
          placeholder="강사 비밀번호"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onPasswordChange(passwordInput);
              onAuthenticate();
            }
          }}
          className="h-7 max-w-48 text-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onPasswordChange(passwordInput);
            onAuthenticate();
          }}
        >
          <Unlock className="size-3.5" />
          로그인
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border bg-muted/30 animate-in fade-in-0 duration-300">
      <div className="flex items-center flex-wrap gap-2">
        <Badge
          variant="secondary"
          className="bg-emerald-50 text-emerald-700 border-emerald-200"
        >
          <ShieldCheck className="size-3" />
          강사 모드
        </Badge>

        <Separator orientation="vertical" className="h-5 hidden sm:block" />

        <div className="flex items-center flex-wrap gap-2">
          <TranscriptUpload
            lectureId={lectureId}
            instructorPassword={instructorPassword}
          />

          <Button variant="outline" size="sm" onClick={onRefetch}>
            <RefreshCw className="size-3.5" />
            새로고침
          </Button>
        </div>

        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={onLogout}>
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  );
}
