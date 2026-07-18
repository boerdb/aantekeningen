import "server-only";
import { updateNote } from "@/lib/db/notes";
import { writeDocxFile } from "@/lib/export/docx";
import { writePdfFile } from "@/lib/export/pdf";
import {
  ensureNoteDir,
  noteFilePath,
  relativeFromCwd,
} from "@/lib/storage/paths";

export async function regenerateExports(options: {
  noteId: string;
  title: string;
  contentText: string;
}): Promise<{ pdfPath: string; docxPath: string }> {
  await ensureNoteDir(options.noteId);
  const pdfAbs = noteFilePath(options.noteId, "pdf");
  const docxAbs = noteFilePath(options.noteId, "docx");

  await Promise.all([
    writePdfFile({
      title: options.title,
      contentText: options.contentText,
      outputPath: pdfAbs,
    }),
    writeDocxFile({
      title: options.title,
      contentText: options.contentText,
      outputPath: docxAbs,
    }),
  ]);

  const pdfPath = relativeFromCwd(pdfAbs);
  const docxPath = relativeFromCwd(docxAbs);

  await updateNote(options.noteId, { pdfPath, docxPath });

  return { pdfPath, docxPath };
}
