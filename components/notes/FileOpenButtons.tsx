"use client";

import { FileDown, FileText } from "lucide-react";

type Props = {
  noteId: string;
  hasPdf: boolean;
  hasDocx: boolean;
  compact?: boolean;
};

export function FileOpenButtons({
  noteId,
  hasPdf,
  hasDocx,
  compact = false,
}: Props) {
  const btn =
    "inline-flex items-center gap-1.5 rounded-lg font-medium transition-opacity hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none";
  const size = compact
    ? "text-xs px-2.5 py-1.5"
    : "text-sm px-3 py-2";

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={hasPdf ? `/api/notes/${noteId}/files/pdf` : undefined}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btn} ${size} bg-[var(--accent)] text-white ${!hasPdf ? "pointer-events-none opacity-40" : ""}`}
        aria-disabled={!hasPdf}
      >
        <FileText className="w-4 h-4" />
        Open PDF
      </a>
      <a
        href={hasDocx ? `/api/notes/${noteId}/files/docx?download=1` : undefined}
        className={`${btn} ${size} bg-[var(--panel-2)] text-[var(--foreground)] border border-[var(--border)] ${!hasDocx ? "pointer-events-none opacity-40" : ""}`}
        aria-disabled={!hasDocx}
      >
        <FileDown className="w-4 h-4" />
        Open Word
      </a>
    </div>
  );
}
