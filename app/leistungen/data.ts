export type ProcessStep = { title: string; desc: string };
export type Deliverable  = { emoji: string; text: string };

export type ServiceData = {
  slug:         string;
  iconKey:      string;
  color:        string;
  colorMuted:   string;
  title:        string;
  subtitle:     string;
  intro:        string;
  process:      ProcessStep[];
  deliverables: Deliverable[];
  exampleTitle: string;
  exampleText:  string;
  metaDesc:     string;
};

export const SERVICES: ServiceData[] = [
  {
    slug:       'ki-agenten',
    iconKey:    'Bot',
    color:      '#6366f1',
    colorMuted: '#6366f115',
    title:      'KI-Agenten & Automatisierung',
    subtitle:   'Dein digitales Team, das nie schläft',
    intro:      'KI-Agenten sind Software-Programme, die selbstständig Aufgaben erledigen – ohne dass ein Mensch bei jedem Schritt eingreifen muss. Ich analysiere deine wiederkehrenden Prozesse und baue massgeschneiderte Agenten, die für dich arbeiten: 24 Stunden, 7 Tage die Woche. Das Ergebnis: dein Team fokussiert sich auf das Wesentliche, der Rest läuft automatisch.',
    process: [
      { title: 'Potenzialanalyse',  desc: 'Welche Aufgaben kosten dein Team täglich am meisten Zeit? Gemeinsam identifizieren wir die 3 grössten Automatisierungs-Potenziale.' },
      { title: 'Agenten-Konzept',   desc: 'Ich entwerfe den Workflow: Wer macht was, wann, und wie kommunizieren die Komponenten miteinander? Klares Blueprint vor dem ersten Code.' },
      { title: 'Aufbau & Test',     desc: 'Aufbau des Agenten mit modernsten Tools (GPT-4o, Make, Zapier oder Custom-Code). Ausgiebige Tests mit echten Daten aus deinem Betrieb.' },
      { title: 'Übergabe & Support', desc: 'Du erhältst einen laufenden Agenten, vollständige Dokumentation, eine Einführungsschulung für dein Team und 30 Tage Support.' },
    ],
    deliverables: [
      { emoji: '🤖', text: 'Fertiger, laufender KI-Agent' },
      { emoji: '📋', text: 'Workflow-Dokumentation' },
      { emoji: '🎓', text: 'Einführungsschulung für dein Team' },
      { emoji: '💬', text: '30 Tage Support via Chat' },
      { emoji: '📊', text: 'Monitoring-Dashboard' },
      { emoji: '🔄', text: 'Optimierungs-Session nach 30 Tagen' },
    ],
    exampleTitle: 'Beispiel: Automatisches Postfach-Management',
    exampleText:  'Ein KMU erhält täglich 80+ E-Mails. Der KI-Agent liest jede E-Mail, kategorisiert sie (Bestellung, Reklamation, Info-Anfrage), beantwortet Standard-Anfragen automatisch auf Deutsch oder Englisch, und leitet komplexe Fälle mit Zusammenfassung an den richtigen Mitarbeiter weiter. Zeitersparnis: ~3 Stunden pro Tag.',
    metaDesc:     'KI-Agenten & Automatisierung für Schweizer KMU – Marcel Spahr baut massgeschneiderte KI-Agenten die für dich arbeiten. Zeitersparnis, 24/7 Betrieb, keine Programmierkenntnisse nötig.',
  },
  {
    slug:       'business-analyse',
    iconKey:    'BarChart3',
    color:      '#06b6d4',
    colorMuted: '#06b6d415',
    title:      'Business Analyse & Requirements',
    subtitle:   'Die richtige Lösung für das richtige Problem',
    intro:      'Bevor eine Lösung gebaut wird, muss klar sein: Was ist das eigentliche Problem? Ich überbrücke die Lücke zwischen Geschäftszielen und technischer Umsetzung – durch strukturierte Analyse, Stakeholder-Interviews und präzise Requirements. So wird von Anfang an das Richtige gebaut – nicht zweimal.',
    process: [
      { title: 'Stakeholder-Interviews', desc: 'Ich spreche mit allen Beteiligten: Geschäftsleitung, Mitarbeitende, IT. Jeder hat andere Bedürfnisse – ich höre zu und strukturiere.' },
      { title: 'Ist-Zustand modellieren', desc: 'Wie läuft es heute? Prozesse, Datenflüsse und Systemlandschaft werden sichtbar gemacht – oft zum ersten Mal überhaupt.' },
      { title: 'User Stories & Anforderungen', desc: 'Anforderungen werden aus Nutzersicht formuliert: klar, testbar, priorisiert. Kein Fachchinesisch – verständlich für alle.' },
      { title: 'Review & Abnahme', desc: 'Gemeinsame Validierung mit allen Stakeholdern. Erst wenn alle Einverständnis haben, startet die Umsetzung.' },
    ],
    deliverables: [
      { emoji: '📄', text: 'Requirements-Dokument' },
      { emoji: '📌', text: 'Priorisierter Anforderungskatalog' },
      { emoji: '👥', text: 'Stakeholder-Map' },
      { emoji: '🗺️', text: 'Prozessdiagramme (BPMN/Swimlane)' },
      { emoji: '📝', text: 'User Stories (Agile-Format)' },
      { emoji: '✅', text: 'Abnahme-Protokoll' },
    ],
    exampleTitle: 'Beispiel: ERP-Einführung bei einem Produktionsbetrieb',
    exampleText:  'Ein Hersteller will ein neues ERP-System einführen. Das IT-Team spricht über APIs und Datenbankschemas, die Geschäftsleitung über Umsatzzahlen und Liefertreue. Ich übersetze: in 4 Workshops mit 8 Stakeholdern entsteht ein klares Requirements-Dokument mit 47 priorisierten Anforderungen. Das Projekt startet ohne Missverständnisse.',
    metaDesc:     'Business Analyse & Requirements Engineering – Marcel Spahr überbrückt die Lücke zwischen Business und IT. Stakeholder-Interviews, User Stories, BPMN-Prozessmodellierung für Schweizer KMU.',
  },
  {
    slug:       'prozessoptimierung',
    iconKey:    'Workflow',
    color:      '#22c55e',
    colorMuted: '#22c55e15',
    title:      'Prozessoptimierung (BPMN)',
    subtitle:   'Manuelle Abläufe digitalisieren und automatisieren',
    intro:      'Viele Unternehmen verlieren täglich Stunden durch ineffiziente, manuelle Abläufe – oft ohne es zu wissen. Ich mache diese Prozesse sichtbar, verstehe sie und digitalisiere sie. Mit BPMN (Business Process Model and Notation) – dem internationalen Standard für Prozessmodellierung – dokumentiere ich präzise und verständlich.',
    process: [
      { title: 'Prozessaufnahme',  desc: 'Ich begleite euer Team und dokumentiere: Wer macht was, in welcher Reihenfolge, mit welchen Tools? Shadow-Sessions und Interviews.' },
      { title: 'Schwachstellen-Analyse', desc: 'Wo sind Medienbrüche? Wo wird doppelt gearbeitet? Wo entstehen Fehler oder Wartezeiten? Wir quantifizieren den Zeitverlust.' },
      { title: 'Soll-Prozess entwerfen', desc: 'Neugestaltung des Prozesses: schlanker, digitaler, teilautomatisiert. Mit deinem Team validiert, bevor umgesetzt wird.' },
      { title: 'Einführung begleiten', desc: 'Begleitung bei der Implementierung, Schulung der Mitarbeitenden und Erfolgsmessung nach 4 Wochen.' },
    ],
    deliverables: [
      { emoji: '🗂️', text: 'BPMN-Diagramme (Ist & Soll)' },
      { emoji: '📊', text: 'Optimierungsbericht mit Zeitersparnis-Kalkulation' },
      { emoji: '🛣️', text: 'Implementierungsplan' },
      { emoji: '📚', text: 'Schulungsunterlagen für Mitarbeitende' },
      { emoji: '📏', text: 'KPI-Messung: vorher/nachher' },
      { emoji: '🔍', text: 'Follow-up Review nach 30 Tagen' },
    ],
    exampleTitle: 'Beispiel: Rechnungsstellung von 4h auf 15min pro Woche',
    exampleText:  'Ein 10-Personen-KMU stellte Rechnungen manuell aus: Excel-Liste prüfen, PDF erstellen, per E-Mail senden, in Buchhaltungssoftware nachtragen, Zahlungseingang manuell überwachen. 4 Stunden pro Woche für einen Prozess, der vollständig automatisierbar ist. Nach der Optimierung: Template wählen, auf "Senden" klicken – der Rest läuft automatisch. Noch 15 Minuten pro Woche.',
    metaDesc:     'Prozessoptimierung mit BPMN – Marcel Spahr digitalisiert und automatisiert manuelle Abläufe in Schweizer KMU. Zeitersparnis messbar, Prozesse sichtbar, Umsetzung begleitet.',
  },
  {
    slug:       'digital-marketing',
    iconKey:    'Megaphone',
    color:      '#f59e0b',
    colorMuted: '#f59e0b15',
    title:      'Digital Marketing & Social Media',
    subtitle:   'Sichtbarkeit, die Kunden bringt',
    intro:      'In einer digitalen Welt entscheidet deine Online-Präsenz über Sichtbarkeit, Vertrauen und Umsatz. Ich entwickle Strategien, die wirklich funktionieren – datenbasiert, KI-unterstützt und praxiserprobt. Von der LinkedIn-Strategie bis zum vollständigen Content-Plan, der von KI-Tools unterstützt aber von echten Ideen getragen wird.',
    process: [
      { title: 'Kanal-Audit',      desc: 'Wo stehst du heute? Analyse bestehender Kanäle, Zielgruppen, Wettbewerber und aktuellem Content. Zahlen statt Bauchgefühl.' },
      { title: 'Strategie-Entwicklung', desc: 'Welche Kanäle, welche Inhaltstypen, welche Frequenz? Ein klarer, realistischer Plan für 3 bis 6 Monate.' },
      { title: 'Content & KI',     desc: 'Erstellung und Optimierung von Inhalten – mit KI-Unterstützung für Effizienz, aber mit deiner authentischen Stimme und Expertise.' },
      { title: 'Messen & Optimieren', desc: 'KPIs definieren, Analytics-Setup, monatliche Auswertung. Was funktioniert, wird verstärkt – was nicht, wird geändert.' },
    ],
    deliverables: [
      { emoji: '🎯', text: 'Kanal-Strategie (3–6 Monate)' },
      { emoji: '📅', text: 'Content-Kalender mit Themen & Formaten' },
      { emoji: '💼', text: 'LinkedIn-Profil-Optimierung' },
      { emoji: '✍️', text: '10 fertige Content-Pieces zum Start' },
      { emoji: '📈', text: 'Analytics-Dashboard (GA4 / LinkedIn)' },
      { emoji: '🖼️', text: 'Design-Templates für Posts' },
    ],
    exampleTitle: 'Beispiel: LinkedIn-Aufbau für eine selbstständige Beraterin',
    exampleText:  'Ausgangslage: 80 LinkedIn-Follower, kein regelmässiger Content, keine Anfragen. Nach 6 Monaten mit strukturierter Strategie: 1.400 Follower, 3 monatliche Content-Beiträge, durchschnittlich 2 neue Beratungsanfragen pro Monat direkt über LinkedIn. Kein bezahltes Advertising – nur organisch.',
    metaDesc:     'Digital Marketing & Social Media für Schweizer KMU – Marcel Spahr entwickelt LinkedIn-Strategien und Content-Pläne mit KI-Unterstützung. Mehr Sichtbarkeit, mehr Leads, messbar.',
  },
  {
    slug:       'video-produktion',
    iconKey:    'Video',
    color:      '#ef4444',
    colorMuted: '#ef444415',
    title:      'Video-Produktion',
    subtitle:   'Deine Botschaft. Unvergesslich.',
    intro:      'Video ist das Format mit der höchsten Aufmerksamkeit und stärksten Vertrauensbildung. Ob Erklärvideo für dein Produkt, Imagefilm für dein Unternehmen oder Social-Content für deinen Feed – ich begleite dich vom ersten Konzept bis zum fertigen, veröffentlichbaren Video.',
    process: [
      { title: 'Konzept & Script',  desc: 'Was soll das Video erreichen? Für wen? Was ist die Kernbotschaft? Ich schreibe ein verständliches Script und ein Storyboard.' },
      { title: 'Vorbereitung',      desc: 'Drehplan, Location-Briefing, Technik-Setup, Zeitplan. Alles ist geklärt, bevor die Kamera läuft.' },
      { title: 'Produktion',        desc: 'Dreh, Screen-Recording oder Animation – je nach Bedarf. Professionelle Technik, entspannte Atmosphäre.' },
      { title: 'Postproduktion',    desc: 'Schnitt, Farbkorrektur, Musik, Untertitel, Formatierung für verschiedene Plattformen. Du erhältst alle benötigten Versionen.' },
    ],
    deliverables: [
      { emoji: '🎬', text: 'Fertiges Video (MP4, alle Formate)' },
      { emoji: '📱', text: 'Social-Media-Versionen (9:16, 1:1)' },
      { emoji: '📝', text: 'Script & Storyboard' },
      { emoji: '🎵', text: 'Lizenzfreie Musik inklusive' },
      { emoji: '🔤', text: 'Untertitel-Datei (.srt)' },
      { emoji: '🖼️', text: 'Thumbnail / Cover-Bild' },
    ],
    exampleTitle: 'Beispiel: Erklärvideo für eine Software-Lösung',
    exampleText:  'Ein SaaS-Anbieter hatte ein komplexes Produkt, das Verkaufsgespräche unnötig verlängerte. Ein 90-sekündiges Erklärvideo – animiert, mit Voice-Over – erklärt das Produkt klar und einprägsam. Ergebnis: Das Video wurde auf der Website eingebettet, die Abschlussrate in Demos stieg um 35%, Supportanfragen zu Grundfunktionen sanken um 50%.',
    metaDesc:     'Video-Produktion in Bern – Erklärvideos, Unternehmensfilme und Social-Content von Marcel Spahr. Vom Konzept bis zum fertigen Video für Schweizer KMU.',
  },
  {
    slug:       'projektmanagement',
    iconKey:    'FolderKanban',
    color:      '#8b5cf6',
    colorMuted: '#8b5cf615',
    title:      'Projektmanagement',
    subtitle:   'Von der Idee bis zum Go-Live – strukturiert und agil',
    intro:      'Ein gutes Projekt braucht nicht nur ein gutes Team – es braucht Struktur, Transparenz und jemanden, der das grosse Bild im Blick behält und gleichzeitig die Details nicht vergisst. Ich plane, koordiniere und steuere dein Projekt nach modernen agilen Methoden (Scrum/SAFe-zertifiziert) – termingerecht und budgetschonend.',
    process: [
      { title: 'Initialisierung',   desc: 'Ziele, Scope, Budget, Timeline und Stakeholder werden definiert. Was gehört zum Projekt – und was nicht? Klare Grenzen von Anfang an.' },
      { title: 'Sprint-Planung',    desc: 'Aufgaben werden in 2-Wochen-Sprints eingeteilt – übersichtlich, priorisiert und realistisch. Backlog mit klaren Prioritäten.' },
      { title: 'Steuerung',         desc: 'Wöchentliche Standups, Fortschritts-Tracking, Risiko-Radar, Stakeholder-Updates. Keine Überraschungen am Ende.' },
      { title: 'Go-Live & Abschluss', desc: 'Release-Planung, Testing, Übergabe, Retrospektive. Was können wir beim nächsten Projekt besser machen?' },
    ],
    deliverables: [
      { emoji: '📅', text: 'Projektplan mit Timeline & Meilensteinen' },
      { emoji: '🗂️', text: 'Sprint-Backlogs (Jira oder Notion)' },
      { emoji: '📊', text: 'Status-Reports (wöchentlich)' },
      { emoji: '⚠️', text: 'Risiko-Register' },
      { emoji: '📋', text: 'Abschlussbericht' },
      { emoji: '🔍', text: 'Retrospektive-Dokumentation' },
    ],
    exampleTitle: 'Beispiel: Website-Relaunch in 8 Wochen',
    exampleText:  'Ein Beratungsunternehmen wollte seine Website komplett neu aufbauen. Stakeholder: Geschäftsleitung, Marketing, IT-Dienstleister. Mit strukturiertem Projektplan, 4 zweiwöchigen Sprints und klarer Kommunikation: Website live nach exakt 8 Wochen, innerhalb des Budgets. Alle 3 Stakeholder-Gruppen zu jeder Zeit informiert und eingebunden.',
    metaDesc:     'Projektmanagement für Schweizer KMU – Marcel Spahr leitet Projekte agil und strukturiert. SAFe & Scrum zertifiziert. Von der Idee bis zum Go-Live, termingerecht.',
  },
  {
    slug:       'workshops',
    iconKey:    'GraduationCap',
    color:      '#10b981',
    colorMuted: '#10b98115',
    title:      'Workshops & Schulungen',
    subtitle:   'KI praktisch lernen – direkt anwendbar',
    intro:      'KI verändert die Arbeitswelt schneller als je zuvor. Die Frage ist nicht ob, sondern wie dein Team davon profitiert. Ich bringe dein Team auf den neuesten Stand – praxisnah, verständlich und direkt anwendbar. Keine Theorie-Vorlesungen, sondern echtes Arbeiten mit KI-Tools an euren eigenen Aufgaben.',
    process: [
      { title: 'Bedarfsanalyse',    desc: 'Was braucht dein Team wirklich? Welche Tools, welches Vorkenntnisse-Niveau, welche konkreten Anwendungsfälle aus eurem Alltag?' },
      { title: 'Massgeschneiderter Inhalt', desc: 'Kein Standard-Workshop von der Stange. Die Inhalte werden auf eure Branche, eure Tools und eure typischen Aufgaben zugeschnitten.' },
      { title: 'Interaktiver Workshop', desc: 'Remote oder vor Ort, max. 12 Personen für optimales Lernen. Übungen direkt mit eigenen Aufgaben, keine theoretischen Beispiele.' },
      { title: '30-Tage-Nachbetreuung', desc: 'Fragen nach dem Workshop via Chat beantwortet. So wird Gelerntes wirklich angewendet und nicht vergessen.' },
    ],
    deliverables: [
      { emoji: '📖', text: 'Workshop-Unterlagen (PDF, 20–40 Seiten)' },
      { emoji: '💡', text: 'Prompt-Bibliothek für euren Alltag' },
      { emoji: '✅', text: 'Checklisten für häufige KI-Aufgaben' },
      { emoji: '🎥', text: 'Aufzeichnung (auf Wunsch)' },
      { emoji: '💬', text: '30 Tage Support via Chat' },
      { emoji: '🏆', text: 'Teilnahme-Zertifikat (optional)' },
    ],
    exampleTitle: 'Beispiel: ChatGPT-Workshop für ein Versicherungsbüro',
    exampleText:  'Ein 8-köpfiges Team im Kundendienst verbrachte täglich 2+ Stunden mit E-Mail-Antworten. In einem halbtägigen Workshop lernten alle, wie sie ChatGPT als Schreib-Assistenten nutzen. Ergebnis nach 4 Wochen: durchschnittlich 45 Minuten Einsparung pro Person pro Tag. Das Team war begeistert, weil der Workshop mit echten Kundenanfragen aus ihrem Alltag arbeitete.',
    metaDesc:     'KI-Workshops & Schulungen für Teams – Marcel Spahr schult dein Team in ChatGPT, Copilot und KI-Automatisierung. Praxisnah, massgeschneidert, direkt anwendbar.',
  },
  {
    slug:       'website-optimierung',
    iconKey:    'Globe',
    color:      '#0ea5e9',
    colorMuted: '#0ea5e915',
    title:      'Website-Optimierung',
    subtitle:   'Schneller gefunden. Mehr Kunden. Messbar.',
    intro:      'Eine langsame, schlecht gefundene Website kostet täglich Kunden – und die meisten Unternehmen wissen es nicht. Ich analysiere deine Website nach modernen Standards: Ladegeschwindigkeit (Core Web Vitals), Suchmaschinen-Optimierung (SEO) und Conversion-Rate. Danach optimiere ich gezielt, mit messbarem Ergebnis.',
    process: [
      { title: 'Technisches Audit', desc: 'Core Web Vitals, Ladezeit, Mobile-Erlebnis, Lighthouse-Score. Wo verliert deine Website Punkte – und warum?' },
      { title: 'SEO-Analyse',       desc: 'Keyword-Recherche, Meta-Tags, strukturierte Daten, interne Verlinkung, Backlink-Profil. Wie wirst du in Google wirklich gefunden?' },
      { title: 'Optimierung',       desc: 'Technische Fixes, Content-Verbesserungen, Meta-Beschreibungen, Bildoptimierung, Core Web Vitals verbessern.' },
      { title: 'Analytics & Reporting', desc: 'GA4-Setup, Conversion-Tracking, monatliches Reporting. Du siehst genau, wie viele Besucher kommen und was sie tun.' },
    ],
    deliverables: [
      { emoji: '🔍', text: 'Vollständiger Audit-Report' },
      { emoji: '🛣️', text: 'Priorisierter Optimierungsplan' },
      { emoji: '⚡', text: 'Performance-Optimierung (Core Web Vitals)' },
      { emoji: '🔎', text: 'SEO-Optimierung (On-Page)' },
      { emoji: '📊', text: 'Analytics-Setup (GA4 + Events)' },
      { emoji: '📅', text: 'Monatliches Reporting (3 Monate)' },
    ],
    exampleTitle: 'Beispiel: E-Commerce-Site von 8s auf 1.2s',
    exampleText:  'Ein Online-Shop hatte eine Ladezeit von 8 Sekunden auf Mobile – 60% der Besucher verliessen die Seite, bevor sie geladen hatte. Nach Bild-Optimierung, Caching, Code-Bereinigung und CDN-Einrichtung: Ladezeit 1.2 Sekunden. Ergebnis nach 60 Tagen: Absprungrate -45%, organischer Traffic +28%, Umsatz +22%. Alles messbar im Analytics-Dashboard.',
    metaDesc:     'Website-Optimierung für Schweizer KMU – Marcel Spahr verbessert Performance, SEO und Conversion. Core Web Vitals, Google Analytics 4, messbare Ergebnisse.',
  },
  {
    slug:       'ki-beratung-kmu',
    iconKey:    'Lightbulb',
    color:      '#f97316',
    colorMuted: '#f9731615',
    title:      'KI-Beratung für KMU',
    subtitle:   'Deine persönliche KI-Roadmap',
    intro:      'KI ist kein Zukunftsthema mehr – sie verändert jetzt, wie Unternehmen arbeiten. Aber welche KI-Lösungen passen wirklich zu deinem KMU? Ich analysiere deinen Betrieb, identifiziere konkrete Potenziale und erstelle eine realistische KI-Roadmap – ohne Buzzwords, ohne Überforderung, mit echtem, messbarem Nutzen.',
    process: [
      { title: 'KI-Readiness-Assessment', desc: 'Wo steht dein Unternehmen heute? Welche Prozesse, welche Daten, welche bestehenden Tools? Ehrliche Standortbestimmung.' },
      { title: 'Potenzialanalyse', desc: 'Wo kann KI konkret helfen? Quick Wins (sofort umsetzbar) vs. strategische Projekte (mittelfristig). Mit Aufwand-Nutzen-Einschätzung.' },
      { title: 'KI-Roadmap',       desc: 'Priorisierter 12-Monats-Plan: Was wann, mit welchem Budget und welchem erwarteten ROI? Realistisch und umsetzbar.' },
      { title: 'Pilotprojekt',     desc: 'Start mit einem überschaubaren KI-Projekt für schnelle, sichtbare Ergebnisse. Beweis, dass KI in deinem Unternehmen funktioniert.' },
    ],
    deliverables: [
      { emoji: '📊', text: 'KI-Readiness-Report' },
      { emoji: '🎯', text: 'Potenzialanalyse (Top 5 Use Cases)' },
      { emoji: '🗺️', text: 'KI-Roadmap (12 Monate)' },
      { emoji: '💰', text: 'ROI-Kalkulation pro Use Case' },
      { emoji: '🏗️', text: 'Pilotprojekt-Konzept' },
      { emoji: '🔗', text: 'Anbieter-Empfehlungen (Tools & Partner)' },
    ],
    exampleTitle: 'Beispiel: KI-Quick-Wins für einen Malerbetrieb',
    exampleText:  'Ein Malerbetrieb mit 15 Mitarbeitern dachte, KI sei nur für Tech-Unternehmen. Das KI-Assessment ergab 3 sofortige Quick Wins: Offert-Erstellung mit KI-Unterstützung (von 2h auf 20min), automatische Termin-Erinnerungen an Kunden, und KI-generierte Nachher-Fotos für Marketing. Gesamterspärnis: 38 Stunden pro Monat. Investition: 1 Tag Beratung.',
    metaDesc:     'KI-Beratung für Schweizer KMU – Marcel Spahr erstellt individuelle KI-Roadmaps, KI-Readiness-Assessments und begleitet Pilotprojekte. Praxisnah, ohne Buzzwords.',
  },
];

export function getService(slug: string): ServiceData | undefined {
  return SERVICES.find(s => s.slug === slug);
}
