import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { isDatabaseConfigured } from "@/lib/db/mysql";
import { getNoteRow } from "@/lib/db/notes";
import { absoluteFromRelative } from "@/lib/storage/paths";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; kind: string }> };

const KINDS = new Set(["photo", "pdf", "docx"]);

export async function GET(req: NextRequest, { params }: Params) {
  if (!isDatabaseConfigured()) {
    return jsonError("DATABASE_URL is niet geconfigureerd", 503);
  }

  const { id, kind } = await params;
  if (!KINDS.has(kind)) return jsonError("Ongeldig bestandstype", 400);

  try {
    const row = await getNoteRow(id);
    if (!row) return jsonError("Niet gevonden", 404);

    const relative =
      kind === "photo"
        ? row.photo_path
        : kind === "pdf"
          ? row.pdf_path
          : row.docx_path;

    if (!relative) {
      return jsonError(`Geen ${kind}-bestand voor deze notitie`, 404);
    }

    const abs = absoluteFromRelative(relative);
    const data = await fs.readFile(abs);
    const download = req.nextUrl.searchParams.get("download") === "1";
    const filename = safeFilename(row.title, kind);

    const contentType =
      kind === "photo"
        ? mimeFromPath(relative)
        : kind === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bestand niet leesbaar";
    return jsonError(message, 500);
  }
}

function mimeFromPath(p: string): string {
  const lower = p.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

function safeFilename(title: string, kind: string): string {
  const base =
    title
      .replace(/[^\w\s\-àáâãäåæçèéêëìíîïñòóôõöùúûüýÿ]/gi, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "aantekening";
  if (kind === "pdf") return `${base}.pdf`;
  if (kind === "docx") return `${base}.docx`;
  return `${base}-foto.jpg`;
}
