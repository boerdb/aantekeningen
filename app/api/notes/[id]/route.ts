import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { isDatabaseConfigured } from "@/lib/db/mysql";
import { deleteNote, getNote, getNoteRow, updateNote } from "@/lib/db/notes";
import { regenerateExports } from "@/lib/export/regenerate";
import { removeNoteDir } from "@/lib/storage/paths";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  if (!isDatabaseConfigured()) {
    return jsonError("DATABASE_URL is niet geconfigureerd", 503);
  }
  const { id } = await params;
  try {
    const note = await getNote(id);
    if (!note) return jsonError("Niet gevonden", 404);
    return jsonOk({ note });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Databasefout";
    return jsonError(message, 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!isDatabaseConfigured()) {
    return jsonError("DATABASE_URL is niet geconfigureerd", 503);
  }
  const { id } = await params;

  try {
    const body = (await req.json()) as {
      title?: string;
      contentText?: string;
    };

    const existing = await getNote(id);
    if (!existing) return jsonError("Niet gevonden", 404);

    const row = await getNoteRow(id);
    const title = body.title?.trim() || existing.title;
    const contentText =
      body.contentText !== undefined ? body.contentText : existing.contentText;

    await updateNote(id, { title, contentText, status: "ready", errorMessage: null });
    await regenerateExports({
      noteId: id,
      title,
      contentText,
      photoPath: row?.photo_path ?? null,
    });

    const note = await getNote(id);
    return jsonOk({ note });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Opslaan mislukt";
    return jsonError(message, 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!isDatabaseConfigured()) {
    return jsonError("DATABASE_URL is niet geconfigureerd", 503);
  }
  const { id } = await params;
  try {
    const ok = await deleteNote(id);
    if (!ok) return jsonError("Niet gevonden", 404);
    await removeNoteDir(id);
    return jsonOk({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verwijderen mislukt";
    return jsonError(message, 500);
  }
}
