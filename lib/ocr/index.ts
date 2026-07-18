import "server-only";
import { enhanceChemistryText } from "@/lib/ocr/chemistry";
import { googleVisionProvider } from "@/lib/ocr/providers/google-vision";
import { manualProvider } from "@/lib/ocr/providers/manual";
import { mathpixProvider } from "@/lib/ocr/providers/mathpix";
import { tesseractProvider } from "@/lib/ocr/providers/tesseract";
import type { OcrProvider, OcrProviderName, OcrResult } from "@/lib/ocr/types";

const providers: Record<OcrProviderName, OcrProvider> = {
  tesseract: tesseractProvider,
  manual: manualProvider,
  mathpix: mathpixProvider,
  google: googleVisionProvider,
};

const VALID: OcrProviderName[] = ["tesseract", "manual", "mathpix", "google"];

export function resolveOcrProvider(name?: string | null): OcrProvider {
  const preferred = (
    name ||
    process.env.OCR_PROVIDER ||
    "tesseract"
  ).toLowerCase() as OcrProviderName;

  if (VALID.includes(preferred)) {
    const provider = providers[preferred];
    if (preferred !== "manual" && preferred !== "tesseract" && !provider.isConfigured()) {
      throw new Error(
        `OCR provider "${preferred}" is gekozen maar niet geconfigureerd. Zie docs/OCR.md`,
      );
    }
    return provider;
  }
  return tesseractProvider;
}

export function getAvailableOcrProviders(): Array<{
  name: OcrProviderName;
  configured: boolean;
  label: string;
}> {
  return [
    {
      name: "tesseract",
      configured: true,
      label: "Tesseract — gratis OCR (standaard)",
    },
    {
      name: "manual",
      configured: true,
      label: "Geen OCR — alleen zelf typen",
    },
    {
      name: "mathpix",
      configured: mathpixProvider.isConfigured(),
      label: "Mathpix (beste voor formules/chemie)",
    },
    {
      name: "google",
      configured: googleVisionProvider.isConfigured(),
      label: "Google Vision (goede algemene OCR)",
    },
  ];
}

export async function runOcr(
  imagePath: string,
  providerName?: string | null,
): Promise<OcrResult> {
  const provider = resolveOcrProvider(providerName);
  const result = await provider.recognize(imagePath);
  return {
    ...result,
    text: enhanceChemistryText(result.text),
  };
}

export type { OcrProviderName, OcrResult };
