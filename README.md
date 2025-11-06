# Private Bewerbungs‑Webseite (Vanilla JS + Express)

Eine schlanke, passwortgeschützte Bewerbungsseite für Marcel Spahr. Frontend als schlanke Vanilla‑JavaScript‑SPA (ohne React), Backend mit Express inkl. Login‑Session, Datei‑Uploads und Projektverwaltung (JSON‑Datei).

## Schnellstart

1. Abhängigkeiten installieren:

   ```bash
   npm install
   ```

2. Umgebungsvariablen setzen (optional):

   ```bash
   cp .env.example .env
   # Admin‑Zugang anpassen
   # ADMIN_USER=admin
   # ADMIN_PASS=mein-passwort
   # SESSION_SECRET=ein-langes-geheimnis
   ```

3. Server starten (lokal, optional):

   ```bash
   npm start
   # http://localhost:5173
   ```

4. Static‑Modus (für Hostpoint Standard/Smart):
   - In `public/index.html` ist `window.STATIC_MODE = true` bereits gesetzt.
   - Inhalte kommen aus `public/static/projects.json` und Dateien unter `public/assets/`.
   - Zum Deployen ins Web‑Root der Domain den gesamten Inhalt aus `public/` hochladen.
   - In Hostpoint TLS/SSL aktivieren; `public/.htaccess` erzwingt HTTPS.

## Struktur

- `server.js` – Express‑Server, Login, APIs, statische Auslieferung
- `public/` – Frontend (Login + App)
- `public/static/app.js` – SPA‑Logik (Vanilla JavaScript)
- `public/static/projects.json` – Inhalte für Static‑Modus
- `public/assets/` – Dateien (Bilder/PDFs) für Static‑Modus
- `uploads/` – hochgeladene Dateien (geschützt)
- `data/projects.json` – persistierte Einträge

## Inhalte auf der Startseite

- Lade unter „Projekte“ folgende Typen hoch, damit sie vorne angezeigt werden:
  - Foto → Typ `photo`
  - CV (Bild/PDF) → Typ `cv` oder `pdf`
  - Scrum‑Zertifikat → Typ `certificate`

## Sicherheitshinweise

- Zugang ist nur mit Benutzername/Passwort möglich (Session‑Cookie).
- Passe `ADMIN_PASS` und `SESSION_SECRET` an, bevor du die Seite extern nutzt.
- Für Hostpoint‑Webhosting HTTPS im Control‑Panel aktivieren. `.htaccess` erzwingt den Redirect.
