import fs from "fs/promises";
import type { OcrProvider, OcrResult } from "@/lib/ocr/types";

function mimeFromPath(imagePath: string): string {
  const lower = imagePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

export const mathpixProvider: OcrProvider = {
  name: "mathpix",
  isConfigured: () =>
    Boolean(process.env.MATHPIX_APP_ID && process.env.MATHPIX_APP_KEY),

  async recognize(imagePath: string): Promise<OcrResult> {
    const appId = process.env.MATHPIX_APP_ID;
    const appKey = process.env.MATHPIX_APP_KEY;
    if (!appId || !appKey) {
      throw new Error("Mathpix is niet geconfigureerd (MATHPIX_APP_ID / MATHPIX_APP_KEY)");
    }

    const bytes = await fs.readFile(imagePath);
    const src = `data:${mimeFromPath(imagePath)};base64,${bytes.toString("base64")}`;

    const res = await fetch("https://api.mathpix.com/v3/text", {
      method: "POST",
      headers: {
        app_id: appId,
        app_key: appKey,
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        src,
        formats: ["text"],
        data_options: {
          include_latex: true,
          include_smiles: true,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Mathpix fout (${res.status}): ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      text?: string;
      confidence?: number;
      error?: string;
    };

    if (data.error) {
      throw new Error(`Mathpix: ${data.error}`);
    }

    const text = (data.text ?? "").trim();
    return {
      provider: "mathpix",
      text,
      raw: JSON.stringify(data),
      confidence: data.confidence,
    };
  },
};
