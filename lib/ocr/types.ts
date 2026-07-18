export type OcrProviderName = "manual" | "mathpix" | "google";

export type OcrResult = {
  provider: OcrProviderName;
  text: string;
  raw?: string;
  confidence?: number;
};

export type OcrProvider = {
  name: OcrProviderName;
  isConfigured: () => boolean;
  recognize: (imagePath: string) => Promise<OcrResult>;
};
