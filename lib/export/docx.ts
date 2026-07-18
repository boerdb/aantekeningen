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
