"use client";

import { useEffect, useState } from "react";
import { FileDown, X } from "lucide-react";
import { WordDocumentPreview } from "@/components/notes/WordDocumentPreview";

export type FileViewKind = "pdf" | "docx";

type Props = {
  noteId: string;
  kind: FileViewKind;
  title?: string;
  onClose: () => void;
};

export function FileViewerModal({ noteId, kind, title, onClose }: Props) {
  const [downloading, setDownloading] = useState(false);
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

  const downloadDocx = async () => {
    if (
      !confirm(
        "Het .docx-bestand opent buiten de app (bijv. WPS of Word).\n\nWil je toch downloaden?",
      )
    ) {
      return;
    }

    setDownloading(true);
    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error("Download mislukt");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title?.trim() || "aantekening"}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Download mislukt. Probeer het later opnieuw.");
    } finally {
      setDownloading(false);
    }
  };

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
          <p className="text-xs text-[var(--muted)]">
            {kind === "pdf" ? "PDF-voorbeeld" : "Word-voorbeeld in de app"}
          </p>
        </div>
        {kind === "pdf" ? (
          <a
            href={downloadUrl}
            download
            className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-2 text-xs font-medium shrink-0"
          >
            <FileDown className="w-3.5 h-3.5" />
            Download
          </a>
        ) : (
          <button
            type="button"
            onClick={downloadDocx}
            disabled={downloading}
            className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-2 text-xs font-medium shrink-0 disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" />
            {downloading ? "…" : ".docx"}
          </button>
        )}
      </header>

      {kind === "pdf" ? (
        <iframe
          src={fileUrl}
          title={title ? `${title} PDF` : "PDF"}
          className="flex-1 w-full border-0 bg-white"
        />
      ) : (
        <WordDocumentPreview noteId={noteId} />
      )}
    </div>
  );
}
