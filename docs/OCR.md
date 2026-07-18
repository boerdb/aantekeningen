# OCR-providers: uitleg en kosten

De app ondersteunt meerdere OCR-backends. Je kiest er één via `OCR_PROVIDER` in `.env.local`, of per foto in de UI.

## Overzicht

| Provider | Kosten (indicatief) | Handschrift | Formules / chemie | Privacy |
|----------|---------------------|-------------|-------------------|---------|
| **tesseract** | Gratis (lokaal) | Matig | Zwak | Alles blijft op je server |
| **manual** | Gratis | — (geen OCR) | — | Alles blijft lokaal |
| **Mathpix** | ~$0,002 / foto (+ eenmalig setup) | Zeer goed | Beste keuze (LaTeX + SMILES) | Foto naar Mathpix |
| **Google Vision** | Eerste 1000/maand gratis, daarna ~$1,50 / 1000 | Goed | Matig (geen echte molecuul-OCR) | Foto naar Google |

> Prijzen wijzigen; check altijd de officiële pagina’s.

---

## 1. Tesseract (`tesseract`) — standaard

- Gratis, draait op de Next-server (geen API-key).
- Leest wél tekst uit de foto (kan 10–30 seconden duren).
- Handschrift en chemische formules zijn vaak rommelig → altijd nakijken in de editor.
- Voor serieuze scheikunde later: Mathpix.

```env
OCR_PROVIDER=tesseract
```

---

## 2. Geen OCR (`manual`)

- Doet expres **geen** tekstherkenning.
- Alleen foto opslaan; jij typt zelf.
- Gebruik dit niet als je OCR verwacht.

---

## 3. Mathpix Convert API — aanbevolen voor scheikunde

**Waarom:** gemaakt voor STEM: handschrift, wiskunde/chemie, formules als LaTeX, moleculen optioneel als SMILES.

**Kosten (pay-as-you-go, indicatief):**
- Eenmalige setupfee ~$19,99
- Nieuwe accounts krijgen vaak ~$29 testkrediet
- Image OCR: ongeveer **$0,002 per afbeelding** (eerste 1M/maand)
- Voorbeeld: 100 pagina’s aantekeningen ≈ **$0,20**

**Keys:** [Mathpix Console](https://console.mathpix.com/) → `MATHPIX_APP_ID` + `MATHPIX_APP_KEY`

```env
OCR_PROVIDER=mathpix
MATHPIX_APP_ID=...
MATHPIX_APP_KEY=...
```

---

## 4. Google Cloud Vision

**Waarom:** goedkoop om te beginnen, sterke document-OCR, minder gespecialiseerd in chemische structuren.

**Kosten (indicatief):**
- Eerste **1000 units/maand gratis** (Text / Document Text Detection)
- Daarna ongeveer **$1,50 per 1000 afbeeldingen**
- Voorbeeld: 50 foto’s/maand → vaak **gratis**; 2000 foto’s → ~$1,50

**Key:** Google Cloud Console → Vision API inschakelen → API-key → `GOOGLE_VISION_API_KEY`

```env
OCR_PROVIDER=google
GOOGLE_VISION_API_KEY=...
```

---

## Advies voor jouw studie-gebruik

1. Begin met **tesseract** (gratis, schrijft wél tekst; corrigeer altijd).
2. Voor echte handschrift→formules: zet **Mathpix** aan — bij studie-volume blijven de kosten laag (centen tot enkele euro’s per maand).
3. Google Vision is een goedkoop alternatief als je vooral lopende tekst wilt, niet complexe structuurformules.

Structuurformules (ketens/ringen) blijven moeilijk; controleer altijd in de editor. Na opslaan worden PDF en Word opnieuw gegenereerd.
