"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Minus } from "lucide-react";

interface SeatingSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rows: number[]) => void;
  currentRowCount?: number;
}

export function SeatingSetupDialog({
  open,
  onOpenChange,
  onSubmit,
  currentRowCount = 0,
}: SeatingSetupDialogProps) {
  const [rows, setRows] = useState<number[]>(
    currentRowCount > 0
      ? Array(currentRowCount).fill(6)
      : [8, 7, 6]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addRow() {
    if (rows.length >= 10) return;
    setRows([...rows, 6]);
  }

  function removeRow(idx: number) {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== idx));
  }

  function updateRow(idx: number, value: number) {
    const clamped = Math.min(Math.max(value, 1), 12);
    const newRows = [...rows];
    newRows[idx] = clamped;
    setRows(newRows);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      onSubmit(rows);
    } finally {
      setIsSubmitting(false);
    }
  }

  const totalSeats = rows.reduce((sum, r) => sum + r, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>좌석 배치 설정</DialogTitle>
          <DialogDescription>
            각 행의 좌석 수를 설정하세요. (1행 = 앞줄)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {rows.map((seatCount, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-12 shrink-0">
                {idx + 1}행
              </span>
              <Input
                type="number"
                min={1}
                max={12}
                value={seatCount}
                onChange={(e) => updateRow(idx, parseInt(e.target.value) || 1)}
                className="h-8 w-20 text-center"
              />
              <span className="text-xs text-muted-foreground">석</span>
              <Button
                variant="ghost"
                size="xs"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeRow(idx)}
                disabled={rows.length <= 1}
              >
                <Minus className="size-3" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={addRow}
            disabled={rows.length >= 10}
          >
            <Plus className="size-3" />
            행 추가
          </Button>
          <span className="text-xs text-muted-foreground">
            총 {totalSeats}석
          </span>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>취소</DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "설정 중..." : "좌석 배치 적용"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
