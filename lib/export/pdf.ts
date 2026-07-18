import "server-only";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import PDFDocument from "pdfkit";
import { pdfSafeText } from "@/lib/export/text";

export async function writePdfFile(options: {
  title: string;
  contentText: string;
  outputPath: string;
  photoPath?: string | null;
}): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      info: {
        Title: options.title,
        Author: "Scheikunde Aantekeningen",
      },
    });

    const stream = fs.createWriteStream(options.outputPath);
    doc.pipe(stream);

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(pdfSafeText(options.title), { align: "left" });

    if (options.photoPath && fs.existsSync(options.photoPath)) {
      doc.moveDown(0.6);
      try {
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        doc.image(options.photoPath, {
          fit: [pageWidth, 420],
          align: "center",
        });
      } catch {
        doc.moveDown(0.4);
        doc.fontSize(10).font("Helvetica").fillColor("#666666");
        doc.text("(Foto kon niet worden ingevoegd)");
        doc.fillColor("#000000");
      }
    }

    const body = pdfSafeText(options.contentText.trim());
    if (body) {
      doc.moveDown(0.8);
      doc.fontSize(11).font("Helvetica-Bold").text("Tekst");
      doc.moveDown(0.3);
      doc.fontSize(11).font("Helvetica");
      doc.text(body, {
        align: "left",
        lineGap: 4,
      });
    }

    doc.end();
    stream.on("finish", () => resolve());
    stream.on("error", reject);
    doc.on("error", reject);
  });

  await fsp.access(options.outputPath);
}

function imageTypeFromPath(photoPath: string): "png" | "jpg" | "gif" | "bmp" {
  const ext = path.extname(photoPath).toLowerCase();
  if (ext === ".png") return "png";
  if (ext === ".gif") return "gif";
  if (ext === ".bmp") return "bmp";
  return "jpg";
}

export { imageTypeFromPath };
