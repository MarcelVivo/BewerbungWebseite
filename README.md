# Private Bewerbungs‑Webseite (React + Express + Vite)

Passwortgeschützte Bewerbungsseite für Marcel Spahr. Frontend als React‑SPA mit sanften Scroll‑Animationen, gebündelt via Vite. Backend: Express mit Login‑Sessions, Datei‑Upload und Projekt‑CRUD (JSON‑Datei).

## Schnellstart

1. Abhängigkeiten installieren:

   ```bash
   npm install
   ```

2. Umgebungsvariablen setzen:

   ```bash
   cp .env.example .env
   # ADMIN_*, VIEW_*, SESSION_SECRET in .env anpassen (siehe .env.example)
   ```

3. Client bauen (Vite → public/dist):

   ```bash
   npm run client:build
   ```

4. Server starten (lokal):

   ```bash
   npm start
   # http://localhost:5173
   ```

   Der Express‑Server liefert automatisch das Vite‑Bundle aus `public/dist` aus. Falls kein Build vorhanden ist, fällt er auf `public/index.html` (CDN‑React Fallback) zurück.

## Development (Hot Reload)

- Frontend: `npm run client:dev` (Vite)
  - Standard‑Port ist 5173 (Kollision mit Express). Optionen:
    - Express auf anderen Port starten: `PORT=3000 npm run dev`
    - Vite auf anderen Port starten: `npm run client:dev -- --port 5174`
- Server: `npm run dev`

Typische Dev‑Kombi:

```bash
PORT=3000 npm run dev         # Express
npm run client:dev -- --port 5174  # Vite Devserver
```

## Struktur

- `server.js` – Express‑Server, Login, APIs, statische Auslieferung
- `public/` – Frontend (Login + App)
- `public/dist/` – Vite‑Build‑Ausgabe (wird automatisch ausgeliefert)
- `public/static/` – Statische Styles/JS (Fallback, u. a. `app.css`)
- `public/assets/` – optionale Bilder/PDFs (Avatar, CV‑Fallback etc.)
- `src/` – React‑Quellcode (`App.jsx`, `main.jsx`)
- `uploads/` – hochgeladene Dateien (geschützt)
- `data/projects.json` – persistierte Einträge

## Inhalte auf der Startseite

- Lade im Admin‑Bereich „Projekte“ Einträge hoch. Für die Startseite relevant:
  - Foto → Typ `photo` (Avatar wird automatisch aus `/Bilder` erkannt, sonst Fallback)
  - CV (PDF) → Typ `cv` oder `pdf` (wird als „Lebenslauf (PDF)“ verlinkt)
  - Zertifikate → Typ `certificate`
  - Arbeitszeugnisse → Typ `reference` oder `zeugnis`
  - Diplome → Typ `diploma`
  - Sprachen → Typ `language`

## Sicherheit

- Login ist passwortgeschützt (Session‑Cookie).
- Setze `ADMIN_PASS`, `VIEW_PASS` und vor allem `SESSION_SECRET` unbedingt auf sichere, zufällige Werte.
- Aktiviere HTTPS im Hosting (Reverse‑Proxy/Load‑Balancer oder Hosting‑Panel). Falls du einen reinen Static‑Host nutzt, ist die Admin‑Funktion nicht verfügbar (Server erforderlich).

## Deployment

1) Node‑Hosting (empfohlen)
- `npm install`
- `npm run client:build`
- `npm start` (oder als Service/PM2/Docker)

2) Reverse‑Proxy
- Proxy `/` → Express (liefert `public/dist`)
- Belasse statische Pfade `/uploads`, `/assets`, `/dist` pass‑through

Hinweis: Ohne laufenden Node‑Server sind Login/Uploads/Admin nicht verfügbar.
