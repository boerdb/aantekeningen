# Aantekeningen deployen (Next + PM2 + MySQL)

Zelfde architectuur als MedTracker / dash-next-app.

## Architectuur

- **Next.js** op server **NEXT** (`192.168.1.32`) → `/var/www/aantekeningen` → poort **3008**
- **MySQL** op server **DB-server** (`192.168.1.14`) → database `aantekeningen`
- **PM2** procesnaam: `aantekeningen`
- GitHub: `git@github.com:boerdb/aantekeningen.git` (branch `main`)

```
Telefoon/LAN → http://192.168.1.32:3008 → Next.js → MySQL op 192.168.1.14
```

Optioneel later: Cloudflare Tunnel → `http://127.0.0.1:3008`.

## 1. MySQL (op DB-server)

Voer `sql/schema.sql` uit en maak app-user (niet root), met toegang vanaf de Next-host:

```sql
CREATE USER IF NOT EXISTS 'aantekeningen'@'192.168.1.32' IDENTIFIED BY 'STERK_WACHTWOORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON aantekeningen.* TO 'aantekeningen'@'192.168.1.32';
FLUSH PRIVILEGES;
```

Of vanaf je PC (met SSH-toegang): `python scripts/deploy_db.py`

## 2. Eerste installatie op NEXT

Aanbevolen: **git clone** + PM2 (blijft synchroon met GitHub).

```bash
cd /var/www
git clone git@github.com:boerdb/aantekeningen.git aantekeningen
cd aantekeningen
cp .env.example .env.local
nano .env.local   # DATABASE_URL naar 192.168.1.14
npm ci
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

Of vanaf je PC (upload + build + PM2):

```bash
python scripts/deploy_remote.py
```

## 3. Updates (methode A — aanbevolen)

```bash
cd /var/www/aantekeningen
git pull
npm ci
npm run build
pm2 restart aantekeningen --update-env
```

Vanaf PC: `python scripts/deploy_pull.py`

## 4. Omgevingsvariabelen

`/var/www/aantekeningen/.env.local` (niet in git):

```env
DATABASE_URL=mysql://aantekeningen:STERK_WACHTWOORD@192.168.1.14:3306/aantekeningen
OCR_PROVIDER=manual
NODE_ENV=production
```

## 5. Controle

```bash
pm2 list | grep aantekeningen
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3008/
curl -s http://127.0.0.1:3008/api/notes
```

Uploads (foto/PDF/Word) staan in `/var/www/aantekeningen/data/uploads/` — zorg dat die map schrijfbaar blijft.
