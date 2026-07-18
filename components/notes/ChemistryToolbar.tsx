"use client";

import { enhanceChemistryText } from "@/lib/ocr/chemistry";

const QUICK_FORMULAS = [
  "H2O",
  "CO2",
  "H2SO4",
  "NaCl",
  "CH4",
  "C6H12O6",
  "NH3",
  "O2",
];

type Props = {
  content: string;
  onChange: (value: string) => void;
};

export function ChemistryToolbar({ content, onChange }: Props) {
  const applySubscripts = () => {
    onChange(enhanceChemistryText(content));
  };

  const insertFormula = (formula: string) => {
    const enhanced = enhanceChemistryText(formula);
    const sep = content.length && !content.endsWith("\n") ? " " : "";
    onChange(content + sep + enhanced);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={applySubscripts}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] hover:border-[var(--accent)]"
        >
          Subscripten toepassen
        </button>
        {QUICK_FORMULAS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => insertFormula(f)}
            className="text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] hover:border-[var(--accent)]"
          >
            {enhanceChemistryText(f)}
          </button>
        ))}
      </div>
    </div>
  );
}
