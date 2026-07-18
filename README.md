# Scheikunde Aantekeningen (PWA)

Lokaal gehoste Next.js-app: **foto opslaan → tekst typen of plakken** (bijv. uit Mathpix Snip) → PDF én Word met **foto + jouw tekst**.

Zelfde database-aanpak als `med-track-pwa` / `dash-next-app`: **MySQL op 192.168.1.14** via `mysql2` + `DATABASE_URL`.

## Features

- PWA (installeerbaar, service worker)
- Foto via camera of galerij — direct opslaan, geen wachten op OCR
- Editor: typ/plak tekst naast de foto; chemie-knoppen (H₂O, H₂SO₄, …)
- Tip voor Mathpix Snip (gratis app) om handschrift/formules om te zetten
- PDF + Word bevatten ingebedde foto + jouw tekst
- Knoppen **Open PDF** en **Open Word** op lijst én detail

## Setup

### 1. Database

Voer `sql/schema.sql` uit op de DB-server (phpMyAdmin), maak user `aantekeningen` met rechten op database `aantekeningen`.

### 2. Env

```bash
copy .env.example .env.local
```

Pas `DATABASE_URL` aan:

```env
DATABASE_URL=mysql://aantekeningen:JOUW_WW@192.168.1.14:3306/aantekeningen
```

(OCR-API’s zijn optioneel; zie [docs/OCR.md](docs/OCR.md) — standaardflow gebruikt geen auto-OCR.)

### 3. Install & run

```bash
npm install
npm run icons:generate
npm run dev
```

Open `http://localhost:3000` (of het LAN-IP van de machine).

### 4. Productie (Next-server + PM2)

Zie [docs/DEPLOY.md](docs/DEPLOY.md). Kort:

- Server: `192.168.1.32` → `/var/www/aantekeningen` → poort **3017**
- MySQL: `192.168.1.14` → database `aantekeningen`
- GitHub: `git@github.com:boerdb/aantekeningen.git` (`main`)

```bash
python scripts/deploy_db.py          # schema + grants op .14
python scripts/deploy_git_init.py    # clone + build + PM2 op .32
# updates later:
python scripts/deploy_pull.py
```

Bestanden (foto/PDF/Word) staan in `data/uploads/` op de Next-server — niet in MySQL.

## OCR-kosten (kort)

| Optie | Kosten |
|-------|--------|
| tesseract | Gratis (lokale OCR) |
| manual | Gratis (geen OCR) |
| Mathpix | ~$0,002/foto + setup |
| Google Vision | 1000/maand gratis, daarna ~$1,50/1000 |

Details: [docs/OCR.md](docs/OCR.md).
