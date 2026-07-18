"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, Save, Trash2 } from "lucide-react";
import { ChemistryToolbar } from "@/components/notes/ChemistryToolbar";
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
      setSavedMsg("Opgeslagen — PDF en Word bijgewerkt (foto + tekst)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (
      !confirm(
        "Deze aantekening verwijderen?\n\nFoto, PDF en Word worden ook gewist.",
      )
    ) {
      return;
    }
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
        noteTitle={note.title}
        hasPdf={note.hasPdf}
        hasDocx={note.hasDocx}
      />

      {note.hasPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/notes/${note.id}/files/photo`}
          alt="Originele foto"
          className="w-full max-h-72 object-contain rounded-2xl border border-[var(--border)] bg-[var(--panel-2)]"
        />
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3 text-sm">
        <p className="font-medium text-[var(--foreground)]">
          Beter handschrift → tekst?
        </p>
        <p className="text-[var(--muted)] mt-1 text-xs leading-relaxed">
          Gebruik de gratis{" "}
          <a
            href="https://mathpix.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] inline-flex items-center gap-0.5 underline"
          >
            Mathpix Snip
            <ExternalLink className="w-3 h-3" />
          </a>{" "}
          app op je telefoon of pc, kopieer het resultaat en plak het hieronder.
        </p>
      </div>

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
        <span className="text-sm font-medium">Tekst</span>
        <ChemistryToolbar content={content} onChange={setContent} />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[var(--accent)]/40 font-mono mt-2"
          placeholder="Typ je aantekeningen, of plak tekst uit Mathpix Snip. Formules: H2SO4 → knop Subscripten."
        />
      </label>

      {dirty && (
        <p className="text-xs text-amber-700">Niet-opgeslagen wijzigingen</p>
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
    </div>
  );
}
