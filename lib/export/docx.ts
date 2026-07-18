import "server-only";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import fs from "fs/promises";

function paragraphsFromText(text: string): Paragraph[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  if (lines.length === 0 || (lines.length === 1 && !lines[0])) {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: "(Geen tekst — voeg inhoud toe in de app.)",
            italics: true,
            color: "666666",
          }),
        ],
      }),
    ];
  }

  return lines.map(
    (line) =>
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: line.length ? line : " ",
            font: "Calibri",
            size: 22, // 11pt
          }),
        ],
      }),
  );
}

export async function writeDocxFile(options: {
  title: string;
  contentText: string;
  outputPath: string;
}): Promise<void> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
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
          ...paragraphsFromText(options.contentText),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(options.outputPath, buffer);
}
