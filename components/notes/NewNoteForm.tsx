"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2 } from "lucide-react";

type ProviderInfo = {
  name: string;
  configured: boolean;
  label: string;
};

export function NewNoteForm() {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("manual");
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ocr/providers")
      .then((r) => r.json())
      .then((data) => {
        setProviders(data.providers ?? []);
        if (data.active) setProvider(data.active);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onPick = (f: File | null) => {
    if (!f) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  };

  const submit = async () => {
    if (!file) {
      setError("Kies of maak eerst een foto");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("title", title || "Nieuwe aantekening");
      form.set("provider", provider);
      form.set("photo", file);
      const res = await fetch("/api/notes", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload mislukt");
      router.push(`/notes/${data.note.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload mislukt");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nieuwe foto</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Maak een scherpe foto van je aantekeningen. Daarna kun je de tekst
          corrigeren; PDF en Word worden automatisch bijgehouden.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Titel</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bijv. Organische chemie — alkanen"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">OCR-provider</span>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
        >
          {(providers.length
            ? providers
            : [{ name: "manual", configured: true, label: "Handmatig (gratis)" }]
          ).map((p) => (
            <option key={p.name} value={p.name} disabled={!p.configured}>
              {p.label}
              {!p.configured ? " — niet geconfigureerd" : ""}
            </option>
          ))}
        </select>
        <p className="text-xs text-[var(--muted)]">
          Zie docs/OCR.md voor kosten. Zonder API-keys werkt &ldquo;Handmatig&rdquo;.
        </p>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--panel)] py-6 hover:border-[var(--accent)]"
        >
          <Camera className="w-7 h-7 text-[var(--accent)]" />
          <span className="text-sm font-medium">Camera</span>
        </button>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--panel)] py-6 hover:border-[var(--accent)]"
        >
          <ImagePlus className="w-7 h-7 text-[var(--accent)]" />
          <span className="text-sm font-medium">Galerij</span>
        </button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Voorbeeld"
          className="w-full max-h-80 object-contain rounded-2xl border border-[var(--border)] bg-[var(--panel-2)]"
        />
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={busy || !file}
        onClick={() => void submit()}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-white py-3 font-medium disabled:opacity-50"
      >
        {busy ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Verwerken…
          </>
        ) : (
          "Opslaan & omzetten"
        )}
      </button>
    </div>
  );
}
