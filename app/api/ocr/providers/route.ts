import { jsonOk } from "@/lib/api/http";
import { getAvailableOcrProviders } from "@/lib/ocr";

export const runtime = "nodejs";

export async function GET() {
  return jsonOk({
    providers: getAvailableOcrProviders(),
    active: process.env.OCR_PROVIDER || "manual",
  });
}
