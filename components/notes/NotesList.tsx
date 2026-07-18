"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Camera, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { FileOpenButtons } from "@/components/notes/FileOpenButtons";
import type { NoteSummary } from "@/lib/types/client";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("nl-NL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function NotesList() {
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notes");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Laden mislukt");
      setNotes(data.notes ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Laden mislukt");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const removeNote = async (id: string, title: string) => {
    if (
      !confirm(
        `"${title}" verwijderen?\n\nFoto, PDF en Word van deze aantekening worden ook gewist.`,
      )
    ) {
      return;
    }
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Verwijderen mislukt");
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verwijderen mislukt");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Aantekeningen
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Foto opslaan, tekst typen of plakken, PDF/Word met foto + tekst.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="p-2 rounded-lg text-[var(--muted)] hover:bg-[var(--panel-2)]"
          aria-label="Vernieuwen"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <Link
        href="/notes/new"
        className="flex items-center justify-center gap-2 w-full rounded-xl bg-[var(--accent)] text-white py-3 font-medium hover:opacity-90"
      >
        <Camera className="w-5 h-5" />
        Nieuwe foto
      </Link>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading && notes.length === 0 && (
        <div className="flex items-center justify-center gap-2 py-12 text-[var(--muted)]">
          <Loader2 className="w-5 h-5 animate-spin" />
          Laden…
        </div>
      )}

      {!loading && !error && notes.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-10 text-center text-[var(--muted)] text-sm">
          Nog geen aantekeningen. Maak een foto van je handschrift.
        </div>
      )}

      <ul className="space-y-3">
        {notes.map((note) => (
          <li
            key={note.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
          >
            <div className="flex items-start gap-3">
              {note.hasPhoto && (
                <Link
                  href={`/notes/${note.id}`}
                  className="flex-shrink-0 block w-16 h-16 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--panel-2)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/notes/${note.id}/files/photo`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </Link>
              )}
              <div className="flex-1 min-w-0 flex items-start gap-2">
                <Link href={`/notes/${note.id}`} className="block group flex-1 min-w-0">
                  <h2 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] truncate">
                    {note.title}
                  </h2>
                  <p className="text-sm text-[var(--muted)] mt-1 line-clamp-2">
                    {note.preview === "Geen tekst"
                      ? "Nog geen tekst — tik om te bewerken"
                      : note.preview}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-2">
                    {formatDate(note.updatedAt)}
                  </p>
                </Link>
                <button
                  type="button"
                  disabled={deletingId === note.id}
                  onClick={() => void removeNote(note.id, note.title)}
                  className="flex-shrink-0 p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                  aria-label={`Verwijder ${note.title}`}
                  title="Verwijderen"
                >
                  {deletingId === note.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <FileOpenButtons
                noteId={note.id}
                hasPdf={note.hasPdf}
                hasDocx={note.hasDocx}
                compact
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
