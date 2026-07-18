import "server-only";
import fs from "fs";
import fsp from "fs/promises";
import PDFDocument from "pdfkit";
import { pdfSafeText } from "@/lib/export/text";

export async function writePdfFile(options: {
  title: string;
  contentText: string;
  outputPath: string;
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

    const body = pdfSafeText(options.contentText.trim());
    if (body) {
      doc.moveDown(0.8);
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
