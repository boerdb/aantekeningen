"use client";

import { useState } from "react";
import { FileDown, FileText } from "lucide-react";
import {
  FileViewerModal,
  type FileViewKind,
} from "@/components/notes/FileViewerModal";

type Props = {
  noteId: string;
  noteTitle?: string;
  hasPdf: boolean;
  hasDocx: boolean;
  compact?: boolean;
};

export function FileOpenButtons({
  noteId,
  noteTitle,
  hasPdf,
  hasDocx,
  compact = false,
}: Props) {
  const [viewKind, setViewKind] = useState<FileViewKind | null>(null);

  const btn =
    "inline-flex items-center gap-1.5 rounded-lg font-medium transition-opacity hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none";
  const size = compact
    ? "text-xs px-2.5 py-1.5"
    : "text-sm px-3 py-2";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!hasPdf}
          onClick={() => setViewKind("pdf")}
          className={`${btn} ${size} bg-[var(--accent)] text-white`}
        >
          <FileText className="w-4 h-4" />
          Open PDF
        </button>
        <button
          type="button"
          disabled={!hasDocx}
          onClick={() => setViewKind("docx")}
          className={`${btn} ${size} bg-[var(--panel-2)] text-[var(--foreground)] border border-[var(--border)]`}
        >
          <FileDown className="w-4 h-4" />
          Open Word
        </button>
      </div>

      {viewKind && (
        <FileViewerModal
          noteId={noteId}
          kind={viewKind}
          title={noteTitle}
          onClose={() => setViewKind(null)}
        />
      )}
    </>
  );
}
