# marcelspahr.ch — Next.js 14 Platform

Persönliche Webseite + privates Command Center von Marcel Spahr.

## Architektur – 3 Zonen

| Zone | Pfad | Auth |
|------|------|------|
| Public One-Pager | `/` | Öffentlich |
| Command Center (CRM) | `/dashboard/*` | Supabase Auth (Email + PW) |
| Recruiter Portfolio | `/recruiter/*` | Cookie-Passwort |

## Lokale Entwicklung

```bash
npm install
cp .env.example .env.local   # Credentials eintragen
npm run dev                   # → http://localhost:3000
```

## Vercel Deployment

### 1. Repository verbinden

```bash
npx vercel --prod
```

Oder: Vercel Dashboard → "Add New Project" → GitHub-Repo auswählen.

### 2. Pflicht-Umgebungsvariablen

Im Vercel Dashboard unter **Settings → Environment Variables** eintragen:

| Variable | Beschreibung |
|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Projekt-URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Public Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Secret Key ⚠️ |
| `RECRUITER_PASSWORD` | Passwort für /recruiter |
| `SESSION_SECRET` | Secret für HMAC-Auth (langer zufälliger String) |
| `NEXT_PUBLIC_SITE_URL` | `https://www.marcelspahr.ch` |
| `ADMIN_USER` | Benutzername für den geschützten Expertise-Lesezugang |
| `ADMIN_PASS` | Passwort für den geschützten Expertise-Lesezugang |

### 3. Optionale Variablen

| Variable | Beschreibung |
|----------|--------------|
| `RESEND_API_KEY` | E-Mail-Versand via Resend |
| `RESEND_FROM_EMAIL` | Absenderadresse |
| `ANTHROPIC_API_KEY` | Claude API für KI-Agenten |

### 4. Supabase Setup

1. SQL Editor im Supabase Dashboard → `supabase/migrations/001_init.sql` ausführen
2. Authentication → Users → User anlegen mit `kontakt@marcelspahr.ch`

### 5. Domain konfigurieren

Vercel Dashboard → Settings → Domains → `marcelspahr.ch` + `www.marcelspahr.ch`

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS v3
- **Datenbank:** Supabase (PostgreSQL + Auth + RLS)
- **Deployment:** Vercel (Region: Frankfurt fra1)
- **Animationen:** Framer Motion

## Struktur

```
app/
├── page.tsx              # Public One-Pager
├── dashboard/            # Command Center (CRM)
│   ├── kunden/           # Kundenverwaltung
│   ├── pipeline/         # Deal-Pipeline Kanban
│   ├── projekte/         # Projekte & Tasks
│   ├── rechnungen/       # Rechnungen + PDF
│   ├── zeiterfassung/    # Timer + Zeiteinträge
│   ├── kalender/         # Terminkalender
│   └── ki-agenten/       # KI-Agent Dashboard + Chat
├── recruiter/            # Recruiter Portfolio
│   └── login/            # Passwort-Login
└── api/
    ├── auth/             # Supabase-Callback + Recruiter-Auth
    ├── kontakt/          # Kontaktformular → Supabase
    └── ...               # Legacy-Routen
```
