import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { isDatabaseConfigured } from "@/lib/db/mysql";
import { getNoteRow, updateNote } from "@/lib/db/notes";
import { regenerateExports } from "@/lib/export/regenerate";
import { runOcr } from "@/lib/ocr";
import { absoluteFromRelative } from "@/lib/storage/paths";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  if (!isDatabaseConfigured()) {
    return jsonError("DATABASE_URL is niet geconfigureerd", 503);
  }
  const { id } = await params;

  try {
    const body = (await req.json().catch(() => ({}))) as { provider?: string };
    const row = await getNoteRow(id);
    if (!row) return jsonError("Niet gevonden", 404);
    if (!row.photo_path) return jsonError("Geen foto voor deze notitie");

    await updateNote(id, { status: "processing", errorMessage: null });

    const imagePath = absoluteFromRelative(row.photo_path);
    const ocr = await runOcr(imagePath, body.provider);

    await updateNote(id, {
      contentText: ocr.text,
      ocrRaw: ocr.raw ?? ocr.text,
      ocrProvider: ocr.provider,
      status: "ready",
      errorMessage: null,
    });

    await regenerateExports({
      noteId: id,
      title: row.title,
      contentText: ocr.text,
    });

    const { getNote } = await import("@/lib/db/notes");
    const note = await getNote(id);
    return jsonOk({ note });
  } catch (err) {
    const message = err instanceof Error ? err.message : "OCR mislukt";
    await updateNote(id, { status: "error", errorMessage: message }).catch(
      () => null,
    );
    return jsonError(message, 500);
  }
}
