import "server-only";
import { createWorker } from "tesseract.js";
import type { OcrProvider, OcrResult } from "@/lib/ocr/types";

/**
 * Gratis lokale OCR (geen API-key).
 * Redelijk voor gedrukt/duidelijk schrift; handschrift is matig — corrigeer altijd.
 */
export const tesseractProvider: OcrProvider = {
  name: "tesseract",
  isConfigured: () => true,

  async recognize(imagePath: string): Promise<OcrResult> {
    const langs = process.env.TESSERACT_LANGS || "nld+eng";
    const worker = await createWorker(langs);
    try {
      const {
        data: { text, confidence },
      } = await worker.recognize(imagePath);
      const cleaned = (text ?? "").replace(/\r\n/g, "\n").trim();
      return {
        provider: "tesseract",
        text: cleaned,
        raw: cleaned,
        confidence: typeof confidence === "number" ? confidence / 100 : undefined,
      };
    } finally {
      await worker.terminate();
    }
  },
};
