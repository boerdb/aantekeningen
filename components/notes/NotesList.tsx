"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Camera, Loader2, RefreshCw } from "lucide-react";
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

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Aantekeningen
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Foto → tekst → altijd openbaar als PDF of Word
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
          <p className="mt-1 text-xs opacity-80">
            Controleer DATABASE_URL en of je schema.sql hebt gedraaid.
          </p>
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
            <Link href={`/notes/${note.id}`} className="block group">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">
                  {note.title}
                </h2>
                <StatusPill status={note.status} />
              </div>
              <p className="text-sm text-[var(--muted)] mt-1 line-clamp-2">
                {note.preview}
              </p>
              <p className="text-xs text-[var(--muted)] mt-2">
                {formatDate(note.updatedAt)}
              </p>
            </Link>
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

function StatusPill({ status }: { status: NoteSummary["status"] }) {
  const map = {
    ready: "bg-emerald-100 text-emerald-800",
    processing: "bg-amber-100 text-amber-800",
    draft: "bg-slate-100 text-slate-700",
    error: "bg-red-100 text-red-800",
  };
  const label = {
    ready: "Klaar",
    processing: "Bezig",
    draft: "Concept",
    error: "Fout",
  };
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${map[status]}`}
    >
      {label[status]}
    </span>
  );
}
