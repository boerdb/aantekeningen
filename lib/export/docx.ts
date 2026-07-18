import "server-only";
import fs from "fs/promises";
import path from "path";
import {
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { imageTypeFromPath } from "@/lib/export/pdf";

function paragraphsFromText(text: string): Paragraph[] {
  const trimmed = text.replace(/\r\n/g, "\n").trim();
  if (!trimmed) return [];

  return trimmed.split("\n").map(
    (line) =>
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: line.length ? line : " ",
            font: "Calibri",
            size: 22,
          }),
        ],
      }),
  );
}

async function photoParagraph(photoPath: string): Promise<Paragraph | null> {
  try {
    const data = await fs.readFile(photoPath);
    const type = imageTypeFromPath(photoPath);
    return new Paragraph({
      spacing: { after: 240 },
      children: [
        new ImageRun({
          data,
          type,
          transformation: { width: 480, height: 360 },
        }),
      ],
    });
  } catch {
    return new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: "(Foto kon niet worden ingevoegd)",
          italics: true,
          color: "666666",
        }),
      ],
    });
  }
}

export async function writeDocxFile(options: {
  title: string;
  contentText: string;
  outputPath: string;
  photoPath?: string | null;
}): Promise<void> {
  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: options.title,
          bold: true,
        }),
      ],
    }),
  ];

  if (options.photoPath) {
    const photo = await photoParagraph(options.photoPath);
    if (photo) children.push(photo);
  }

  const body = paragraphsFromText(options.contentText);
  if (body.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [
          new TextRun({
            text: "Tekst",
            bold: true,
            size: 24,
          }),
        ],
      }),
    );
    children.push(...body);
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(options.outputPath, buffer);
}
