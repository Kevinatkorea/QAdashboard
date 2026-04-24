"use client";

import { useEffect, useState } from "react";

interface LocalDateProps {
  date: Date | string | null;
  options?: Intl.DateTimeFormatOptions;
  locale?: string;
  className?: string;
  as?: "span" | "time";
}

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

export function LocalDate({
  date,
  options = DEFAULT_OPTIONS,
  locale = "ko-KR",
  className,
  as = "span",
}: LocalDateProps) {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    if (!date) {
      setFormatted("");
      return;
    }
    setFormatted(new Date(date).toLocaleDateString(locale, options));
  }, [date, locale, options]);

  if (as === "time") {
    const isoDate = date ? new Date(date).toISOString() : undefined;
    return (
      <time
        className={className}
        dateTime={isoDate}
        suppressHydrationWarning
      >
        {formatted}
      </time>
    );
  }

  return (
    <span className={className} suppressHydrationWarning>
      {formatted}
    </span>
  );
}
