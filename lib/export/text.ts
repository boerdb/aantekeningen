const SUB_TO_ASCII: Record<string, string> = {
  "₀": "0",
  "₁": "1",
  "₂": "2",
  "₃": "3",
  "₄": "4",
  "₅": "5",
  "₆": "6",
  "₇": "7",
  "₈": "8",
  "₉": "9",
};

/** PDFKit/Helvetica mist veel Unicode — zet subscript-cijfers terug naar ASCII. */
export function pdfSafeText(text: string): string {
  return text.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (ch) => SUB_TO_ASCII[ch] ?? ch);
}
