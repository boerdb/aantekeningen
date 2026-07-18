/**
 * Lichte post-processing voor scheikundige formules in platte tekst.
 * Vervangt digit-subscripten (H2O → H₂O) en normaliseert veelvoorkomende notatie.
 */

const SUBSCRIPT_DIGITS: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
};

const ELEMENT =
  "(?:Ac|Al|Am|Sb|Ar|As|At|Ba|Bk|Be|Bi|Bh|B|Br|Cd|Ca|Cf|C|Ce|Cs|Cl|Cr|Co|Cn|Cu|Cm|Ds|Db|Dy|Es|Er|Eu|Fm|Fl|F|Fr|Gd|Ga|Ge|Au|Hf|Hs|He|Ho|H|In|I|Ir|Fe|Kr|La|Lr|Pb|Li|Lv|Lu|Mg|Mn|Mt|Md|Hg|Mo|Mc|Nd|Ne|Np|Ni|Nh|Nb|N|No|Og|Os|O|Pd|P|Pt|Pu|Po|K|Pr|Pm|Pa|Ra|Rn|Re|Rh|Rg|Rb|Ru|Rf|Sm|Sc|Sg|Se|Si|Ag|Na|Sr|S|Ta|Tc|Te|Ts|Tb|Tl|Th|Tm|Sn|Ti|W|U|V|Xe|Yb|Y|Zn|Zr)";

/** Match eenvoudige molecuulformules zoals H2SO4, C6H12O6, Fe2O3 */
const FORMULA_RE = new RegExp(
  `\\b((?:${ELEMENT}\\d*){1,12}(?:\\([^)]+\\)\\d*)?)\\b`,
  "g",
);

function toSubscripts(digits: string): string {
  return digits
    .split("")
    .map((d) => SUBSCRIPT_DIGITS[d] ?? d)
    .join("");
}

function formulaWithSubscripts(formula: string): string {
  return formula.replace(/(\d+)/g, (_, digits: string) => toSubscripts(digits));
}

function looksLikeFormula(token: string): boolean {
  if (token.length < 2 || token.length > 40) return false;
  if (!/\d/.test(token)) return false;
  // Minstens één element + cijfer, geen alleen letters
  return new RegExp(`^(?:${ELEMENT}\\d*)+$`).test(token);
}

export function enhanceChemistryText(text: string): string {
  if (!text.trim()) return text;

  return text.replace(FORMULA_RE, (match) => {
    if (!looksLikeFormula(match)) return match;
    return formulaWithSubscripts(match);
  });
}

/** Haal kandidaten uit tekst voor weergave/highlights in de UI */
export function extractFormulaCandidates(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(FORMULA_RE)) {
    const raw = match[1];
    if (raw && looksLikeFormula(raw)) {
      found.add(formulaWithSubscripts(raw));
    }
  }
  return [...found];
}
