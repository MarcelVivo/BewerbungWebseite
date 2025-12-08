# Private Bewerbungs‑Webseite (Next.js auf Vercel)

Passwortgeschützte One‑Page‑Bewerbungsseite für Marcel Spahr. React via Next.js (App Router), gehostet auf Vercel. Login per Benutzername/Passwort (Admin/Viewer), Auth‑Schutz über Next Middleware. Inhalte (Dokumente, Zertifikate, Zeugnisse) werden als statische Dateien im Repo gepflegt und per Download‑Button angeboten.

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

3. Start im Development:

   ```bash
   npm run dev
   # http://localhost:3000
   ```

## Entwicklung

- Next.js Dev‑Server: `npm run dev`
- Build: `npm run build`, Start: `npm start`

## Struktur

- `app/` – Next.js App Router
  - `page.jsx` – One‑Page‑UI (Scroll‑Animationen, Downloads)
  - `login/page.jsx` – Login‑Seite
  - `api/login` / `api/logout` – Login/Logout (setzt/entfernt Cookie)
- `middleware.js` – schützt alle Pfade per Cookie‑Prüfung (Login erforderlich)
- `public/assets/` – Bilder/PDFs (z. B. `portrait.jpg`, Zertifikate, Zeugnisse)
- `public/assets/projects.json` – Liste der anzuzeigenden Dokumente
- `public/static/app.css` – Styles inkl. Reveal/Sticky

## Inhalte pflegen (VS Code, ohne Online‑Upload)

- Lege deine Dateien in `public/assets/` ab (z. B. `ArbeitszeugnisMarcelSpahr2025.pdf`).
- Trage sie in `public/assets/projects.json` ein, z. B.:

  ```json
  [
    { "title": "Lebenslauf", "type": "cv", "url": "/assets/CV.pdf" },
    { "title": "SCRUM Zertifikat", "type": "certificate", "url": "/assets/SCRUMZertifikat.pdf" }
  ]
  ```

- Avatar‑Bild optional als `public/assets/portrait.jpg`.

## Sicherheit

- Login ist passwortgeschützt; Cookie wird signiert und per Middleware geprüft.
- Setze `ADMIN_PASS`, `VIEW_PASS` und vor allem `SESSION_SECRET` auf sichere, zufällige Werte (Vercel Projekt‑Einstellungen → Environment Variables).
- Ohne gültigen Login sind auch Dateien unter `/assets` nicht erreichbar (Middleware).

## Deployment (Vercel)

1. Repo mit Vercel verbinden (oder `vercel` CLI).
2. Environment Variables setzen: `ADMIN_USER`, `ADMIN_PASS`, `VIEW_USER`, `VIEW_PASS`, `SESSION_SECRET`.
3. Build & Deploy läuft automatisch (`next build`).
4. Domain in Vercel hinzufügen und DNS bei Hostpoint setzen: A `@` → `76.76.21.21`, CNAME `www` → `cname.vercel-dns.com`.

Inhalte aktualisieren, indem du Dateien/JSON im Repo änderst und pushst – kein Online‑Upload nötig.
