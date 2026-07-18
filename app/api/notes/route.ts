import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { isDatabaseConfigured } from "@/lib/db/mysql";
import { createNote, listNotes } from "@/lib/db/notes";
import { regenerateExports } from "@/lib/export/regenerate";
import { runOcr } from "@/lib/ocr";
import {
  ensureNoteDir,
  noteFilePath,
  relativeFromCwd,
} from "@/lib/storage/paths";
import fs from "fs/promises";

export const runtime = "nodejs";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return jsonError("DATABASE_URL is niet geconfigureerd", 503);
  }
  try {
    const notes = await listNotes();
    return jsonOk({ notes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Databasefout";
    return jsonError(message, 500);
  }
}

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return jsonError("DATABASE_URL is niet geconfigureerd", 503);
  }

  try {
    const form = await req.formData();
    const title =
      String(form.get("title") ?? "").trim() || "Nieuwe aantekening";
    const provider = String(form.get("provider") ?? "").trim() || undefined;
    const file = form.get("photo");

    if (!(file instanceof File) || file.size === 0) {
      return jsonError("Foto is verplicht");
    }

    const id = randomUUID();
    await ensureNoteDir(id);

    const ext = extFromMime(file.type) || ".jpg";
    const photoAbs = noteFilePath(id, "photo", ext);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(photoAbs, buffer);
    const photoPath = relativeFromCwd(photoAbs);

    await createNote({
      id,
      title,
      contentText: "",
      photoPath,
      status: "processing",
    });

    let contentText = "";
    let ocrRaw: string | null = null;
    let ocrProvider: string | null = null;
    let status: "ready" | "error" = "ready";
    let errorMessage: string | null = null;

    try {
      const ocr = await runOcr(photoAbs, provider);
      contentText = ocr.text;
      ocrRaw = ocr.raw ?? ocr.text;
      ocrProvider = ocr.provider;
    } catch (err) {
      status = "error";
      errorMessage = err instanceof Error ? err.message : "OCR mislukt";
      ocrProvider = provider || process.env.OCR_PROVIDER || "manual";
    }

    const { updateNote } = await import("@/lib/db/notes");
    await updateNote(id, {
      contentText,
      ocrRaw,
      ocrProvider,
      status: status === "error" && !contentText ? "error" : "ready",
      errorMessage,
    });

    await regenerateExports({ noteId: id, title, contentText });

    const note = await import("@/lib/db/notes").then((m) => m.getNote(id));
    return jsonOk({ note }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload mislukt";
    return jsonError(message, 500);
  }
}

function extFromMime(mime: string): string | null {
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/jpeg" || mime === "image/jpg") return ".jpg";
  if (mime === "image/heic") return ".heic";
  return null;
}
