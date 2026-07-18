"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { FileOpenButtons } from "@/components/notes/FileOpenButtons";
import type { NoteDetail } from "@/lib/types/client";

type Props = { noteId: string };

export function NoteEditor({ noteId }: Props) {
  const router = useRouter();
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const dirty = useMemo(() => {
    if (!note) return false;
    return title !== note.title || content !== note.contentText;
  }, [note, title, content]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/notes/${noteId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Laden mislukt");
        if (cancelled) return;
        setNote(data.note);
        setTitle(data.note.title);
        setContent(data.note.contentText);
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

  const save = async () => {
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, contentText: content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Opslaan mislukt");
      setNote(data.note);
      setTitle(data.note.title);
      setContent(data.note.contentText);
      setSavedMsg("Opgeslagen — PDF en Word bijgewerkt");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  };

  const rerunOcr = async () => {
    setOcrBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${noteId}/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OCR mislukt");
      setNote(data.note);
      setTitle(data.note.title);
      setContent(data.note.contentText);
      setSavedMsg("OCR opnieuw uitgevoerd — bestanden bijgewerkt");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR mislukt");
    } finally {
      setOcrBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Deze aantekening en bestanden verwijderen?")) return;
    const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    if (res.ok) router.push("/");
    else {
      const data = await res.json();
      setError(data.error || "Verwijderen mislukt");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[var(--muted)]">
        <Loader2 className="w-5 h-5 animate-spin" />
        Laden…
      </div>
    );
  }

  if (!note) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-700">{error || "Niet gevonden"}</p>
        <Link href="/" className="text-[var(--accent)] text-sm font-medium">
          Terug naar overzicht
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Overzicht
        </Link>
        <button
          type="button"
          onClick={() => void remove()}
          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
          aria-label="Verwijderen"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <FileOpenButtons
        noteId={note.id}
        hasPdf={note.hasPdf}
        hasDocx={note.hasDocx}
      />

      {note.hasPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/notes/${note.id}/files/photo`}
          alt="Originele foto"
          className="w-full max-h-56 object-contain rounded-2xl border border-[var(--border)] bg-[var(--panel-2)]"
        />
      )}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Titel</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Tekst (bewerkbaar)</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[var(--accent)]/40 font-mono"
          placeholder="Typ of corrigeer hier je aantekeningen. Formules zoals H2SO4 worden na OCR vaak als H₂SO₄ getoond."
        />
      </label>

      <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
        {note.ocrProvider && <span>OCR: {note.ocrProvider}</span>}
        {dirty && <span className="text-amber-700">Niet-opgeslagen wijzigingen</span>}
      </div>

      {note.errorMessage && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
          {note.errorMessage}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {savedMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-4 py-3 text-sm">
          {savedMsg}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={saving || !dirty}
          onClick={() => void save()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-white py-3 font-medium disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Opslaan & PDF/Word vernieuwen
        </button>
        <button
          type="button"
          disabled={ocrBusy || !note.hasPhoto}
          onClick={() => void rerunOcr()}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] py-3 text-sm font-medium disabled:opacity-50"
        >
          {ocrBusy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          OCR opnieuw uitvoeren
        </button>
      </div>
    </div>
  );
}
