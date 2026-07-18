# Scheikunde Aantekeningen (PWA)

Lokaal gehoste Next.js-app: foto van handschrift → bewerkbare tekst → **altijd** PDF én Word openen vanaf het overzicht of de detailpagina.

Zelfde database-aanpak als `med-track-pwa` / `dash-next-app`: **MySQL op 192.168.1.14** via `mysql2` + `DATABASE_URL`.

## Features

- PWA (installeerbaar, service worker)
- Foto via camera of galerij
- OCR: handmatig / Mathpix / Google Vision (zie [docs/OCR.md](docs/OCR.md))
- Lichte scheikunde-postprocessing (bijv. `H2SO4` → `H₂SO₄`)
- Bij elke opslag: PDF + DOCX opnieuw wegschrijven onder `data/uploads/<id>/`
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
OCR_PROVIDER=tesseract
```

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
