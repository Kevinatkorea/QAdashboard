"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KanbanColumnProps {
  title: string;
  count: number;
  colorTheme: "blue" | "purple" | "green" | "amber";
  children: React.ReactNode;
}

const themeStyles = {
  blue: {
    header: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    bar: "bg-blue-500",
  },
  purple: {
    header: "bg-purple-50 border-purple-200",
    badge: "bg-purple-100 text-purple-700",
    bar: "bg-purple-500",
  },
  green: {
    header: "bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    bar: "bg-emerald-500",
  },
  amber: {
    header: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    bar: "bg-amber-500",
  },
};

export function KanbanColumn({
  title,
  count,
  colorTheme,
  children,
}: KanbanColumnProps) {
  const theme = themeStyles[colorTheme];

  return (
    <section className="flex flex-col h-full min-w-0" aria-label={title}>
      {/* Column header */}
      <header
        className={`flex items-center gap-2 px-3 py-2.5 rounded-t-lg border ${theme.header}`}
      >
        <span className={`h-2 w-2 rounded-full ${theme.bar}`} aria-hidden="true" />
        <h2 className="text-sm font-semibold">{title}</h2>
        <Badge
          variant="secondary"
          className={`ml-auto text-[10px] h-4 px-1.5 ${theme.badge}`}
        >
          {count}
        </Badge>
      </header>

      {/* Column body */}
      <div className="flex-1 min-h-0 border border-t-0 rounded-b-lg bg-muted/20">
        <ScrollArea className="h-full max-h-[60vh] md:max-h-[calc(100vh-240px)]">
          <div className="p-2 space-y-2">
            {count === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p className="text-xs">항목이 없습니다</p>
              </div>
            ) : (
              children
            )}
          </div>
        </ScrollArea>
      </div>
    </section>
  );
}
