"use client";

import { useEffect } from "react";
import { FileDown, FileText, X } from "lucide-react";

export type FileViewKind = "pdf" | "docx";

type Props = {
  noteId: string;
  kind: FileViewKind;
  title?: string;
  onClose: () => void;
};

export function FileViewerModal({ noteId, kind, title, onClose }: Props) {
  const fileUrl = `/api/notes/${noteId}/files/${kind === "pdf" ? "pdf" : "docx"}`;
  const downloadUrl = `${fileUrl}?download=1`;
  const label = kind === "pdf" ? "PDF" : "Word";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[var(--background)]"
      role="dialog"
      aria-modal="true"
      aria-label={`${label} bekijken`}
    >
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--panel)] safe-top">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] text-white px-3 py-2 text-sm font-medium shrink-0"
        >
          <X className="w-4 h-4" />
          Sluiten
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{title || label}</p>
          <p className="text-xs text-[var(--muted)]">{label}-voorbeeld</p>
        </div>
        <a
          href={downloadUrl}
          download
          className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-2 text-xs font-medium shrink-0"
        >
          <FileDown className="w-3.5 h-3.5" />
          Download
        </a>
      </header>

      {kind === "pdf" ? (
        <iframe
          src={fileUrl}
          title={title ? `${title} PDF` : "PDF"}
          className="flex-1 w-full border-0 bg-white"
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <FileText className="w-12 h-12 text-[var(--accent)] opacity-80" />
          <div className="space-y-2 max-w-sm">
            <p className="font-medium">Word-bestand</p>
            <p className="text-sm text-[var(--muted)]">
              Word opent niet betrouwbaar in de browser. Download het bestand
              om het in Word te openen, of tik op Sluiten om terug te gaan.
            </p>
          </div>
          <a
            href={downloadUrl}
            download
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] text-white px-4 py-3 text-sm font-medium"
          >
            <FileDown className="w-4 h-4" />
            Open / download Word
          </a>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--muted)] underline"
          >
            Terug naar notitie
          </button>
        </div>
      )}
    </div>
  );
}
