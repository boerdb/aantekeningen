import "server-only";
import fs from "fs/promises";
import path from "path";

const ROOT = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "data",
  "uploads",
);

export function noteDir(noteId: string): string {
  return path.join(ROOT, noteId);
}

export function noteFilePath(
  noteId: string,
  kind: "photo" | "pdf" | "docx",
  ext?: string,
): string {
  const name =
    kind === "photo"
      ? `photo${ext ?? ".jpg"}`
      : kind === "pdf"
        ? "note.pdf"
        : "note.docx";
  return path.join(noteDir(noteId), name);
}

export async function ensureNoteDir(noteId: string): Promise<string> {
  const dir = noteDir(noteId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function removeNoteDir(noteId: string): Promise<void> {
  await fs.rm(noteDir(noteId), { recursive: true, force: true });
}

export function relativeFromCwd(absolutePath: string): string {
  return path.relative(process.cwd(), absolutePath).replace(/\\/g, "/");
}

export function absoluteFromRelative(relativePath: string): string {
  return path.join(/* turbopackIgnore: true */ process.cwd(), relativePath);
}
