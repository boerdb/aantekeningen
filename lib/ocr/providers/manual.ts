import type { OcrProvider, OcrResult } from "@/lib/ocr/types";

/** Geen externe API — gebruiker corrigeert/typt zelf na de foto. */
export const manualProvider: OcrProvider = {
  name: "manual",
  isConfigured: () => true,
  async recognize(_imagePath: string): Promise<OcrResult> {
    return {
      provider: "manual",
      text: "",
      raw: "",
      confidence: 0,
    };
  },
};
