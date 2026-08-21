# Sicherheitsprüfung marcelspahr.ch

Stand: 21. August 2026  
Umfang: Next.js-Anwendung, API-Routen, AILA, Authentifizierung, Uploads,
Supabase-RLS, öffentliche Dateien, HTTP-Header und Produktionsabhängigkeiten.

## Ergebnis

Die im Code gefundenen kritischen und hohen Schwachstellen wurden behoben.
Der Produktionsbuild und die TypeScript-Prüfung sind erfolgreich. Der aktuelle
`npm audit --omit=dev` meldet 0 bekannte Schwachstellen.

Keine Internetanwendung kann garantieren, niemals angegriffen oder überlastet
zu werden. Insbesondere volumetrische DDoS-Angriffe müssen zusätzlich am CDN-
und Hosting-Rand abgewehrt werden. Die Anwendung ist nach den umgesetzten
Änderungen deutlich widerstandsfähiger, benötigt aber noch die unter
„Betriebsmassnahmen“ genannten Einstellungen.

## Befunde und Behebungen

| Priorität | Befund | Massnahme | Status |
|---|---|---|---|
| Kritisch | Die Recruiter-Sitzung bestand aus einem statischen, selbst setzbaren Cookie-Wert. | Zeitlich begrenztes HMAC-Sitzungstoken, konstante Passwortprüfung, sichere Cookie-Attribute und serverseitige Signaturprüfung. | Behoben |
| Hoch | Lebenslauf, Arbeitszeugnisse und Zertifikate waren trotz geschützter Recruiter-Seite direkt öffentlich abrufbar und langfristig öffentlich cachebar. | Zugriffsschutz in der Edge-Middleware für sensible Dokumente; privates `no-store`; öffentliches Immutable-Caching für den gesamten Asset-Ordner entfernt. | Behoben |
| Hoch | Veraltete Next.js-, Sharp-, PostCSS- und Nanoid-Abhängigkeiten enthielten bekannte DoS-, SSRF- bzw. Speicherfehler. | Next.js aktualisiert, sichere Transitivversionen gepinnt und Lockfile erneuert. | Behoben; Audit 0 |
| Hoch | AILA-, Formular-, Analytics- und Auth-APIs konnten missbräuchlich bzw. kostenintensiv aufgerufen werden. | Same-Origin-Prüfung, Inhaltstyp- und Grössenlimits, Eingabekürzung, Zeitlimits und best-effort Rate Limits pro Client. | Im Code behoben; globales Edge-Limit zusätzlich empfohlen |
| Hoch | Supabase-RLS gewährte jedem authentifizierten Konto Vollzugriff auf Geschäftsdaten; öffentliche Schreib-Policies umgingen die validierten Serverrouten. | Admin-Rollenfunktion und Admin-only-Policies als Migration 004; öffentliche Direkt-Schreibrechte entfernt; neue Profile standardmässig nicht mehr Admin. | Migration erstellt; einmalig anwenden |
| Hoch | PDF-Uploads prüften weder Dateigrösse noch Dateisignatur ausreichend. | Nur PDF, maximal 10 MB, `%PDF-`-Signaturprüfung, sicherer Dateiname, gleiche Herkunft, Rate Limit und privates Ausliefern. | Behoben |
| Mittel | Nutzereingaben konnten ungefiltert in HTML-E-Mails gelangen. | Typ-/Längenprüfung, Bereinigung und HTML-Escaping bei Kontakt-, KI-Check-, RE- und AILA-Anfragen. | Behoben |
| Mittel | Security Header waren unvollständig; Produktion erlaubte `unsafe-eval`; sensible Antworten konnten gecacht/indexiert werden. | CSP gehärtet, `unsafe-eval` nur lokal, HSTS, COOP, CORP, NoSniff, Referrer-/Permissions-Policy sowie `no-store`/`noindex` für APIs und geschützte Bereiche. | Behoben |
| Mittel | Build- und Typfehler wurden in der Produktionskonfiguration ignoriert. | Ausnahmen entfernt, Next-15-Kompatibilität korrigiert, vollständiger Produktionsbuild erzwungen. | Behoben |
| Mittel | Dashboard-Zugang war nicht auf Marcels bekannte Adresse begrenzbar. | Optionaler `DASHBOARD_ADMIN_EMAIL`-Abgleich bei Login und in der Middleware ergänzt. | Code bereit; Variable setzen |
| Niedrig | Ein alter HMAC-Vergleich in der Edge-Middleware war nicht konstant. | Prüfung auf `crypto.subtle.verify` umgestellt. | Behoben |

## Verifikation

- `npx tsc --noEmit`: erfolgreich
- `npm run build`: erfolgreich; 62 Seiten und alle API-Routen gebaut
- `npm audit --omit=dev`: 0 bekannte Schwachstellen
- Secret-Scan von Arbeitsbaum und Git-Historie: keine hochwahrscheinlichen
  API-Schlüssel oder privaten Schlüssel gefunden
- Direkter Zugriff auf sensible PDF ohne Sitzung: Redirect zur Anmeldung
- Gefälschtes altes Recruiter-Cookie: abgewiesen
- Dashboard ohne Sitzung: Redirect zum Login
- AILA-Aufruf mit fremder Origin: HTTP 403
- Sicherheitsheader auf öffentlicher Seite: vorhanden

## Betriebsmassnahmen

Diese Schritte sind nicht vollständig durch einen Git-Push erledigt:

1. In Vercel `DASHBOARD_ADMIN_EMAIL` auf Marcels tatsächliche Login-Adresse
   setzen. `RECRUITER_SESSION_SECRET` und `SESSION_SECRET` müssen mindestens
   32 zufällige Zeichen haben.
2. Vor Ausführung der Supabase-Migration sicherstellen, dass Marcels Zeile in
   `profiles` die Rolle `admin` besitzt. Danach
   `supabase/migrations/004_security_hardening.sql` anwenden.
3. Öffentliche Registrierung in Supabase deaktiviert lassen, MFA für Supabase,
   Vercel, GitHub, OpenAI, Resend und E-Mail aktivieren.
4. In Vercel Firewall-/WAF-Regeln und Spend Alerts für `/api/aila/*`,
   `/api/auth/*` und die Formular-APIs aktivieren. Der In-Memory-Limiter im Code
   ist absichtlich nur eine erste Barriere und nicht global über alle
   Serverless-Instanzen verteilt.
5. OpenAI-, Supabase-Service-, Resend- und Session-Schlüssel regelmässig
   rotieren; niemals `NEXT_PUBLIC_` für geheime Schlüssel verwenden.
6. Supabase Point-in-Time-Recovery bzw. tägliche Backups aktivieren und eine
   Wiederherstellung mindestens quartalsweise testen.
7. Vercel- und Supabase-Logs sowie ungewöhnliche OpenAI-Kosten überwachen.
   Alarmierung für Fehlerraten, 401/403/429-Spitzen und Ausgaben einrichten.

## Restrisiken

- Volumetrische DDoS-Angriffe sind ein Infrastrukturthema. Sie können nicht
  allein mit Anwendungscode ausgeschlossen werden.
- Die CSP benötigt wegen der aktuellen Next.js-Hydration noch
  `script-src 'unsafe-inline'`. Ein späterer Nonce-basierter Umbau kann dies
  weiter reduzieren.
- Portfolio-Projektberichte, die bewusst öffentlich verlinkt sind, bleiben
  öffentlich. Ihre Inhalte sollten regelmässig auf personenbezogene oder
  vertrauliche Informationen geprüft werden.
- Die Wirksamkeit von Backup, MFA, WAF und Supabase-RLS hängt von den
  Einstellungen der externen Dienste ab und muss dort kontrolliert werden.

