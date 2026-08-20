# AILA Sales Agent

## Zielbild

AILA bleibt der bestehende animierte Charakter und das bestehende Chat-/Voice-Flyout. Die Erweiterung ergänzt eine serverseitige Beratungs- und Sales-Schicht, ohne einen zweiten Chat, einen zweiten Store oder eine parallele Navigation einzuführen.

AILA soll ein Unternehmen, Ziele und Probleme aus freier Sprache verstehen, gezielt weiterfragen, unnötigen Leistungen widersprechen, eine begründete Lösung zeigen und bei passendem Interesse eine vorbereitete Übergabe an Marcel auslösen.

## Bestehende Architektur, die erhalten bleibt

- `ScrollEntity.tsx`: Flugpfad, Partikel, 3D-/Video-Darstellung und AILA-Animationsvideos.
- `AilaGuide.tsx`: bestehendes Flyout, Textdialog, Quick Actions, Mikrofonaufnahme, Transkription und Sprachausgabe.
- `/api/aila/chat`: serverseitiger Zugriff auf die OpenAI Responses API.
- `/api/aila/transcribe`: Sprache-zu-Text.
- `/api/aila/speech`: Text-zu-Sprache.
- `/api/aila/lead`: sichere Übergabe an E-Mail, Kontaktanfragen, CRM-Kunden und Pipeline.
- `analytics.ts` und `/api/analytics`: datensparsames, DNT-/GPC-respektierendes Eventsystem.

## Neue Module

### `app/lib/aila/types.ts`

Definiert Sales-Stufen, Next-Best-Actions, den sitzungsbezogenen Gesprächskontext, Empfehlungen, UI-Aktionen, Animationszustände und das CRM-fähige Lead-Objekt.

### `app/lib/aila/services.ts`

Strukturierte Service-Bibliothek. Sie enthält nur reale Leistungsbausteine mit Problembezug, Eignung, Abhängigkeiten und bewussten Ausschlüssen. Das Modell darf Empfehlungen nur aus dieser Bibliothek bilden.

### `app/lib/aila/engine.ts`

Deterministische Sicherheits- und Entscheidungslogik:

- Eingaben kürzen und validieren
- neuen Kontext mit bekanntem Kontext zusammenführen
- bekannte Listen deduplizieren
- Sales-Stufe und Next-Best-Action plausibilisieren
- internen Lead-Status ableiten
- lokale Fallback-Fragen erzeugen
- Empfehlungen validieren
- Übergabeobjekt aufbauen

### `app/lib/aila/prompt.ts`

Trennt AILAs Rollen- und Gesprächsregeln von der Service-Bibliothek und vom aktuellen Website-Kontext. Der Prompt verbietet erfundene Preise, Fristen, Referenzen, Integrationen, Buchungen und Garantien.

### `app/lib/aila/responseSchema.ts`

Definiert ein striktes JSON-Schema für die Responses API und validiert die Antwort zusätzlich zur Laufzeit. Ungültige UI-Aktionen oder unbekannte Services werden verworfen.

### `app/lib/aila/tools.ts`

Bereitet Adapter für Kalender, CRM und Offertenentwurf vor. Alle Adapter sind derzeit ausdrücklich `available: false` und liefern einen transparenten `unavailable`-Status. Es werden keine Buchungen, CRM-Einträge oder Offerten simuliert.

### `AilaSolutionPreview.tsx`

Zeigt eine kompakte, responsive Lösungsskizze im bestehenden Schwarz-/Gold-Design. Sie enthält Kontext, Begründungen, Priorität und bewusst nicht priorisierte Leistungen.

### `AilaContactCapture.tsx`

Der kurze Abschluss verlangt Name, E-Mail und Telefonnummer, übernimmt optional das Unternehmen und verlangt eine ausdrückliche Datenschutz-Zustimmung. Gesprächszusammenfassung, Ziele, Probleme, Ausschlüsse, bestehende Systeme und Empfehlungen werden im Hintergrund mitgegeben; der Besucher muss sie nicht erneut eingeben.

## Gesprächsfluss

1. Beim ersten Öffnen begrüsst AILA den Besucher proaktiv und bietet unverbindliche Quick Replies an.
2. Text und Sprache laufen über dieselbe `ask`-Funktion und denselben Sales-Kontext.
3. Das Backend erhält die letzten Dialogbeiträge, den kompakten Gesprächskontext und den aktuellen Website-Abschnitt.
4. Das Modell extrahiert bereits genannte Fakten und liefert ein strikt strukturiertes Ergebnis.
5. Die Server-Engine validiert und vereinigt die Daten. Bereits bekannte Werte werden nicht gelöscht und Listen werden nicht doppelt geführt.
6. Die Next-Best-Action bestimmt, ob AILA weiter verstehen, diagnostizieren, qualifizieren, empfehlen oder übergeben soll.
7. Bei ausreichendem Kontext kann eine Solution Preview erscheinen. Lange Service-Listen im Chat werden vermieden.
8. Jeder gestartete Dialog bietet einen grossen persönlichen nächsten Schritt. Nach Zustimmung öffnet sich der kompakte AILA-Kontaktabschluss direkt im Flyout.
9. Beim Absenden entstehen eine Kontaktanfrage, ein Kunden-/Lead-Datensatz und ein Pipeline-Deal. Marcel erhält die strukturierte Übergabe per E-Mail; der Besucher erhält eine Bestätigung.

## Session Memory

Der Sales-Kontext lebt im bestehenden React-Flyout und bleibt beim Schliessen und erneuten Öffnen innerhalb derselben geladenen Seite erhalten. Es gibt absichtlich keine dauerhafte Speicherung in `localStorage` und keine versteckte Übertragung personenbezogener Daten.

Die kompakte `conversationSummary` wird vom Modell laufend aktualisiert. Das Backend muss dadurch nicht bei jeder Anfrage den gesamten historischen Dialog erhalten.

## UI- und Animationsaktionen

AILA nutzt den bestehenden Browser-Event-Bus:

- `aila:guide-state`: `idle`, `listening`, `thinking`, `speaking`, `presenting`, `success`
- `aila:ui-action`: Solution Preview, Empfehlung, Service-Hervorhebung oder Abschnittswechsel
- `aila:handover`: sitzungsinternes, CRM-fähiges Lead-Objekt

Die neuen Zustände werden auf die bestehenden Attention-, Thinking-, Speaking-, CTA- und Confirmation-Videos gemappt. Es wurde kein zusätzlicher Animationsloop eingeführt.

## Datenschutz und Analytics

AILA sendet keine Chattexte oder Kontaktangaben an Analytics. Gemessen werden nur technische Ereignisse und abstrakte Zustände, beispielsweise Eingabemodus, Sales-Stufe, Anzahl vorgeschlagener Services und ob eine Branche oder ein Problem erkannt wurde.

Tracking bleibt vollständig deaktiviert, wenn Global Privacy Control oder Do Not Track aktiv ist.

## Bereits funktionsfähig

- Freie Text- und Spracheingabe mit gemeinsamem Kontext
- strukturierte Kontext-Extraktion
- Sales-State und Next-Best-Action
- interne Lead-Temperatur
- kompakte Gesprächszusammenfassung
- semantische Empfehlungen aus der Service-Bibliothek
- begründete Solution Preview
- bestehende Text-to-Speech-Ausgabe
- bestehende AILA-Animationen plus neue Zustände
- bestehende Kontakt-/Projektformulare
- sitzungsinterne Lead-/Handover-Vorbereitung
- verbindlicher AILA-Kontaktabschluss mit Name, E-Mail, Telefon und Datenschutz-Zustimmung
- Speicherung im Kontakt-Dashboard, Kunden-CRM und in der Deal-Pipeline
- strukturierte E-Mail an Marcel und Eingangsbestätigung an den Besucher
- Entwicklungs-Debugansicht
- datensparsame AILA-Events
- lokale Fallback-Fragen bei ungültiger oder vorübergehend fehlender Modellantwort

## Nur vorbereitet, nicht extern verbunden

- Kalender-Verfügbarkeiten und Terminbuchung
- Offerten- oder Projektbrief-Erstellung in einem externen System
- Preis-, Auslastungs- oder verbindliche Laufzeitdaten

AILA muss bei diesen Punkten weiterhin transparent an Marcel übergeben.

## Benötigte Environment Variables

Pflicht für KI, Transkription und Sprache:

```text
OPENAI_API_KEY
```

Optional:

```text
OPENAI_AILA_MODEL=gpt-5.6-terra
OPENAI_AILA_TTS_MODEL=gpt-4o-mini-tts
OPENAI_AILA_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
```

Für CRM-Übergabe und bestehende Analytics-Speicherung:

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Für die E-Mail-Übergabe und Bestätigung:

```text
RESEND_API_KEY
```

API-Schlüssel bleiben ausschliesslich in Serverrouten.

## Testablauf

1. Website öffnen und AILA anklicken.
2. Prüfen, dass Begrüssung im Chat erscheint und gesprochen wird.
3. Beispiel eingeben: `Ich habe eine kleine Autogarage in Bern mit sechs Mitarbeitenden und unsere Website ist sehr alt.`
4. Prüfen, dass AILA nicht erneut nach Branche, Ort, Teamgrösse oder bestehender Website fragt.
5. Ziel ergänzen: `Wir brauchen mehr qualifizierte Neukunden.`
6. Aktuelle Situation erklären und prüfen, dass AILA zuerst diagnostiziert.
7. Prüfen, dass eine Lösung nur passende Services enthält und nicht automatisch ein ERP empfiehlt.
8. Solution Preview öffnen, auf Mobile und Desktop prüfen und wieder schliessen.
9. Denselben Flow per Mikrofon wiederholen.
10. Audio deaktivieren und prüfen, dass Text weiterhin funktioniert.
11. Den grossen Button `Kontakt mit Marcel aufnehmen` wählen und Name, E-Mail und Telefonnummer erfassen.
12. Nach dem Absenden die Bestätigung im Flyout, die E-Mail an Marcel, die Kontaktanfrage, den CRM-Kunden und den Pipeline-Deal prüfen.
13. Im Development-Build `AILA DEBUG` öffnen und Kontext, Stage, Lead und Next Action kontrollieren.

## Bekannte Einschränkungen

- Der Gesprächskontext wird beim Neuladen der Seite bewusst zurückgesetzt.
- AILA kann aktuell keine externen Verfügbarkeiten prüfen oder verbindliche Aktionen ausführen.
- Qualität der Branchen- und Problem-Erkennung hängt vom konfigurierten OpenAI-Modell ab.
- Der Production-Build validiert TypeScript separat über `npx tsc --noEmit`, da das bestehende Next-Setup die Typprüfung im Build überspringt.
- Ein echter End-to-End-Test gegen die OpenAI API erzeugt nutzungsabhängige API-Kosten und sollte bewusst im Staging oder auf der Live-Seite durchgeführt werden.
