import "server-only";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db/mysql";
import type { NoteDetail, NoteRow, NoteStatus, NoteSummary } from "@/lib/db/types";

type NotePacket = NoteRow & RowDataPacket;

function previewOf(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Geen tekst";
  return cleaned.length > 120 ? `${cleaned.slice(0, 117)}…` : cleaned;
}

function toSummary(row: NoteRow): NoteSummary {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    hasPhoto: Boolean(row.photo_path),
    hasPdf: Boolean(row.pdf_path),
    hasDocx: Boolean(row.docx_path),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    preview: previewOf(row.content_text),
  };
}

function toDetail(row: NoteRow): NoteDetail {
  return {
    ...toSummary(row),
    contentText: row.content_text,
    ocrRaw: row.ocr_raw,
    ocrProvider: row.ocr_provider,
    errorMessage: row.error_message,
  };
}

export async function listNotes(): Promise<NoteSummary[]> {
  const pool = getPool();
  const [rows] = await pool.query<NotePacket[]>(
    `SELECT * FROM notes ORDER BY updated_at DESC`,
  );
  return rows.map(toSummary);
}

export async function getNote(id: string): Promise<NoteDetail | null> {
  const pool = getPool();
  const [rows] = await pool.query<NotePacket[]>(
    `SELECT * FROM notes WHERE id = ? LIMIT 1`,
    [id],
  );
  const row = rows[0];
  return row ? toDetail(row) : null;
}

export async function getNoteRow(id: string): Promise<NoteRow | null> {
  const pool = getPool();
  const [rows] = await pool.query<NotePacket[]>(
    `SELECT * FROM notes WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function createNote(input: {
  id: string;
  title: string;
  contentText?: string;
  photoPath?: string | null;
  status?: NoteStatus;
}): Promise<NoteDetail> {
  const pool = getPool();
  await pool.query<ResultSetHeader>(
    `INSERT INTO notes (id, title, content_text, photo_path, status)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.id,
      input.title,
      input.contentText ?? "",
      input.photoPath ?? null,
      input.status ?? "draft",
    ],
  );
  const note = await getNote(input.id);
  if (!note) throw new Error("Note create failed");
  return note;
}

export async function updateNote(
  id: string,
  patch: Partial<{
    title: string;
    contentText: string;
    ocrRaw: string | null;
    ocrProvider: string | null;
    status: NoteStatus;
    errorMessage: string | null;
    photoPath: string | null;
    pdfPath: string | null;
    docxPath: string | null;
  }>,
): Promise<NoteDetail | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (patch.title !== undefined) {
    fields.push("title = ?");
    values.push(patch.title);
  }
  if (patch.contentText !== undefined) {
    fields.push("content_text = ?");
    values.push(patch.contentText);
  }
  if (patch.ocrRaw !== undefined) {
    fields.push("ocr_raw = ?");
    values.push(patch.ocrRaw);
  }
  if (patch.ocrProvider !== undefined) {
    fields.push("ocr_provider = ?");
    values.push(patch.ocrProvider);
  }
  if (patch.status !== undefined) {
    fields.push("status = ?");
    values.push(patch.status);
  }
  if (patch.errorMessage !== undefined) {
    fields.push("error_message = ?");
    values.push(patch.errorMessage);
  }
  if (patch.photoPath !== undefined) {
    fields.push("photo_path = ?");
    values.push(patch.photoPath);
  }
  if (patch.pdfPath !== undefined) {
    fields.push("pdf_path = ?");
    values.push(patch.pdfPath);
  }
  if (patch.docxPath !== undefined) {
    fields.push("docx_path = ?");
    values.push(patch.docxPath);
  }

  if (fields.length === 0) return getNote(id);

  const pool = getPool();
  values.push(id);
  await pool.query<ResultSetHeader>(
    `UPDATE notes SET ${fields.join(", ")} WHERE id = ?`,
    values,
  );
  return getNote(id);
}

export async function deleteNote(id: string): Promise<boolean> {
  const pool = getPool();
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM notes WHERE id = ?`,
    [id],
  );
  return result.affectedRows > 0;
}
