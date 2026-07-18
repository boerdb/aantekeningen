"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { NoteDetail } from "@/lib/types/client";

type Props = { noteId: string };

export function WordDocumentPreview({ noteId }: Props) {
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/notes/${noteId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Laden mislukt");
        if (!cancelled) setNote(data.note);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Laden mislukt");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-200">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-red-600 bg-neutral-200">
        {error || "Notitie niet gevonden"}
      </div>
    );
  }

  const hasText = note.contentText.trim().length > 0;

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-200">
      <article className="mx-auto max-w-2xl bg-white shadow-sm px-6 py-8 sm:px-10 sm:py-10 my-4 sm:my-6 min-h-[calc(100%-2rem)]">
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">{note.title}</h1>

        {note.hasPhoto && (
          <img
            src={`/api/notes/${noteId}/files/photo`}
            alt=""
            className="max-w-full h-auto rounded-sm mb-6 border border-neutral-200"
          />
        )}

        {hasText && (
          <>
            <h2 className="text-lg font-semibold text-neutral-900 mb-3">Tekst</h2>
            <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-800 font-[Calibri,'Segoe_UI',system-ui,sans-serif]">
              {note.contentText}
            </div>
          </>
        )}

        {!note.hasPhoto && !hasText && (
          <p className="text-neutral-500 italic">Leeg document</p>
        )}
      </article>
    </div>
  );
}
