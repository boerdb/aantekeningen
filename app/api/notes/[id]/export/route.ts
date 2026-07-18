import { jsonError, jsonOk } from "@/lib/api/http";
import { isDatabaseConfigured } from "@/lib/db/mysql";
import { getNote, getNoteRow } from "@/lib/db/notes";
import { regenerateExports } from "@/lib/export/regenerate";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  if (!isDatabaseConfigured()) {
    return jsonError("DATABASE_URL is niet geconfigureerd", 503);
  }
  const { id } = await params;

  try {
    const note = await getNote(id);
    if (!note) return jsonError("Niet gevonden", 404);
    const row = await getNoteRow(id);

    await regenerateExports({
      noteId: id,
      title: note.title,
      contentText: note.contentText,
      photoPath: row?.photo_path ?? null,
    });

    const refreshed = await getNote(id);
    return jsonOk({ note: refreshed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export mislukt";
    return jsonError(message, 500);
  }
}
