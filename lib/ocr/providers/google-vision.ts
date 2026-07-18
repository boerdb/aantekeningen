import fs from "fs/promises";
import type { OcrProvider, OcrResult } from "@/lib/ocr/types";

/**
 * Google Cloud Vision — DOCUMENT_TEXT_DETECTION via REST + API key.
 * Zet GOOGLE_VISION_API_KEY in .env.local
 */
export const googleVisionProvider: OcrProvider = {
  name: "google",
  isConfigured: () => Boolean(process.env.GOOGLE_VISION_API_KEY),

  async recognize(imagePath: string): Promise<OcrResult> {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      throw new Error("Google Vision is niet geconfigureerd (GOOGLE_VISION_API_KEY)");
    }

    const bytes = await fs.readFile(imagePath);
    const content = bytes.toString("base64");

    const url = `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Google Vision fout (${res.status}): ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      responses?: Array<{
        fullTextAnnotation?: { text?: string };
        error?: { message?: string };
      }>;
    };

    const response = data.responses?.[0];
    if (response?.error?.message) {
      throw new Error(`Google Vision: ${response.error.message}`);
    }

    const text = (response?.fullTextAnnotation?.text ?? "").trim();
    return {
      provider: "google",
      text,
      raw: JSON.stringify(data),
    };
  },
};
