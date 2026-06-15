import type { Lang } from '@/app/LanguageContext';

export type ProcessStep  = { title: string; desc: string };
export type Deliverable  = { emoji: string; text: string };

export type ServiceTranslation = {
  title:        string;
  subtitle:     string;
  intro:        string;
  metaDesc:     string;
  exampleTitle: string;
  exampleText:  string;
  process:      ProcessStep[];
  deliverables: Deliverable[];
};

export type ServiceData = {
  slug:       string;
  iconKey:    string;
  color:      string;
  colorMuted: string;
  de:         ServiceTranslation;
  en:         ServiceTranslation;
};

export const SERVICES: ServiceData[] = [
  {
    slug: 'ki-agenten', iconKey: 'Bot', color: '#a896c8', colorMuted: '#a896c815',
    de: {
      title: 'KI-Agenten & Automatisierung', subtitle: 'Dein digitales Team, das nie schläft',
      intro: 'KI-Agenten sind Software-Programme, die selbstständig Aufgaben erledigen – ohne dass ein Mensch bei jedem Schritt eingreifen muss. Ich analysiere deine wiederkehrenden Prozesse und baue massgeschneiderte Agenten, die für dich arbeiten: 24 Stunden, 7 Tage die Woche. Das Ergebnis: dein Team fokussiert sich auf das Wesentliche, der Rest läuft automatisch.',
      process: [
        { title: 'Potenzialanalyse',   desc: 'Welche Aufgaben kosten dein Team täglich am meisten Zeit? Gemeinsam identifizieren wir die 3 grössten Automatisierungs-Potenziale.' },
        { title: 'Agenten-Konzept',    desc: 'Ich entwerfe den Workflow: Wer macht was, wann, und wie kommunizieren die Komponenten miteinander? Klares Blueprint vor dem ersten Code.' },
        { title: 'Aufbau & Test',      desc: 'Aufbau des Agenten mit modernsten Tools (GPT-4o, Make, Zapier oder Custom-Code). Ausgiebige Tests mit echten Daten aus deinem Betrieb.' },
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
      exampleText: 'Ein KMU erhält täglich 80+ E-Mails. Der KI-Agent liest jede E-Mail, kategorisiert sie (Bestellung, Reklamation, Info-Anfrage), beantwortet Standard-Anfragen automatisch auf Deutsch oder Englisch, und leitet komplexe Fälle mit Zusammenfassung an den richtigen Mitarbeiter weiter. Zeitersparnis: ~3 Stunden pro Tag.',
      metaDesc: 'KI-Agenten & Automatisierung für Schweizer KMU – Marcel Spahr baut massgeschneiderte KI-Agenten die für dich arbeiten. Zeitersparnis, 24/7 Betrieb, keine Programmierkenntnisse nötig.',
    },
    en: {
      title: 'AI Agents & Automation', subtitle: 'Your digital team that never sleeps',
      intro: 'AI agents are software programs that independently complete tasks – without a human needing to intervene at every step. I analyze your recurring processes and build tailored agents that work for you: 24 hours a day, 7 days a week. The result: your team focuses on what matters, the rest runs automatically.',
      process: [
        { title: 'Potential Analysis', desc: 'Which tasks cost your team the most time daily? Together we identify the 3 biggest automation potentials.' },
        { title: 'Agent Concept',      desc: 'I design the workflow: who does what, when, and how do the components communicate? Clear blueprint before the first line of code.' },
        { title: 'Build & Test',       desc: 'Building the agent with state-of-the-art tools (GPT-4o, Make, Zapier, or custom code). Extensive testing with real data from your business.' },
        { title: 'Handover & Support', desc: 'You receive a running agent, complete documentation, an introductory training for your team, and 30 days of support.' },
      ],
      deliverables: [
        { emoji: '🤖', text: 'Ready-to-run AI agent' },
        { emoji: '📋', text: 'Workflow documentation' },
        { emoji: '🎓', text: 'Introductory training for your team' },
        { emoji: '💬', text: '30 days support via chat' },
        { emoji: '📊', text: 'Monitoring dashboard' },
        { emoji: '🔄', text: 'Optimization session after 30 days' },
      ],
      exampleTitle: 'Example: Automated Inbox Management',
      exampleText: 'An SME receives 80+ emails daily. The AI agent reads every email, categorizes it (order, complaint, info request), automatically responds to standard inquiries in German or English, and forwards complex cases with a summary to the right employee. Time saved: ~3 hours per day.',
      metaDesc: 'AI agents & automation for Swiss SMEs – Marcel Spahr builds custom AI agents that work for you. Time savings, 24/7 operation, no programming knowledge required.',
    },
  },
  {
    slug: 'business-analyse', iconKey: 'BarChart3', color: '#7aada8', colorMuted: '#7aada815',
    de: {
      title: 'Business Analyse & Requirements', subtitle: 'Die richtige Lösung für das richtige Problem',
      intro: 'Bevor eine Lösung gebaut wird, muss klar sein: Was ist das eigentliche Problem? Ich überbrücke die Lücke zwischen Geschäftszielen und technischer Umsetzung – durch strukturierte Analyse, Stakeholder-Interviews und präzise Requirements. So wird von Anfang an das Richtige gebaut – nicht zweimal.',
      process: [
        { title: 'Stakeholder-Interviews',    desc: 'Ich spreche mit allen Beteiligten: Geschäftsleitung, Mitarbeitende, IT. Jeder hat andere Bedürfnisse – ich höre zu und strukturiere.' },
        { title: 'Ist-Zustand modellieren',   desc: 'Wie läuft es heute? Prozesse, Datenflüsse und Systemlandschaft werden sichtbar gemacht – oft zum ersten Mal überhaupt.' },
        { title: 'User Stories & Anforderungen', desc: 'Anforderungen werden aus Nutzersicht formuliert: klar, testbar, priorisiert. Kein Fachchinesisch – verständlich für alle.' },
        { title: 'Review & Abnahme',          desc: 'Gemeinsame Validierung mit allen Stakeholdern. Erst wenn alle Einverständnis haben, startet die Umsetzung.' },
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
      exampleText: 'Ein Hersteller will ein neues ERP-System einführen. Das IT-Team spricht über APIs und Datenbankschemas, die Geschäftsleitung über Umsatzzahlen und Liefertreue. Ich übersetze: in 4 Workshops mit 8 Stakeholdern entsteht ein klares Requirements-Dokument mit 47 priorisierten Anforderungen. Das Projekt startet ohne Missverständnisse.',
      metaDesc: 'Business Analyse & Requirements Engineering – Marcel Spahr überbrückt die Lücke zwischen Business und IT. Stakeholder-Interviews, User Stories, BPMN-Prozessmodellierung für Schweizer KMU.',
    },
    en: {
      title: 'Business Analysis & Requirements', subtitle: 'The right solution for the right problem',
      intro: 'Before a solution is built, one thing must be clear: what is the actual problem? I bridge the gap between business goals and technical implementation – through structured analysis, stakeholder interviews, and precise requirements. This way, the right thing is built from the start – not twice.',
      process: [
        { title: 'Stakeholder Interviews',   desc: 'I talk with everyone involved: management, employees, IT. Each has different needs – I listen and structure.' },
        { title: 'Mapping the current state', desc: 'How does it work today? Processes, data flows, and system landscape are made visible – often for the first time.' },
        { title: 'User Stories & Requirements', desc: "Requirements are formulated from the user's perspective: clear, testable, prioritized. No jargon – understandable for everyone." },
        { title: 'Review & Sign-off',        desc: 'Joint validation with all stakeholders. Only once everyone agrees does implementation begin.' },
      ],
      deliverables: [
        { emoji: '📄', text: 'Requirements document' },
        { emoji: '📌', text: 'Prioritized requirements catalog' },
        { emoji: '👥', text: 'Stakeholder map' },
        { emoji: '🗺️', text: 'Process diagrams (BPMN/swimlane)' },
        { emoji: '📝', text: 'User stories (agile format)' },
        { emoji: '✅', text: 'Sign-off protocol' },
      ],
      exampleTitle: 'Example: ERP rollout at a manufacturing company',
      exampleText: 'A manufacturer wanted to introduce a new ERP system. The IT team talked about APIs and database schemas; management about revenue and delivery performance. I translated: in 4 workshops with 8 stakeholders, a clear requirements document emerged with 47 prioritized requirements. The project started without misunderstandings.',
      metaDesc: 'Business analysis & requirements engineering – Marcel Spahr bridges the gap between business and IT. Stakeholder interviews, user stories, BPMN process modeling for Swiss SMEs.',
    },
  },
  {
    slug: 'prozessoptimierung', iconKey: 'Workflow', color: '#8fb58a', colorMuted: '#8fb58a15',
    de: {
      title: 'Prozessoptimierung (BPMN)', subtitle: 'Manuelle Abläufe digitalisieren und automatisieren',
      intro: 'Viele Unternehmen verlieren täglich Stunden durch ineffiziente, manuelle Abläufe – oft ohne es zu wissen. Ich mache diese Prozesse sichtbar, verstehe sie und digitalisiere sie. Mit BPMN (Business Process Model and Notation) – dem internationalen Standard für Prozessmodellierung – dokumentiere ich präzise und verständlich.',
      process: [
        { title: 'Prozessaufnahme',        desc: 'Ich begleite euer Team und dokumentiere: Wer macht was, in welcher Reihenfolge, mit welchen Tools? Shadow-Sessions und Interviews.' },
        { title: 'Schwachstellen-Analyse', desc: 'Wo sind Medienbrüche? Wo wird doppelt gearbeitet? Wo entstehen Fehler oder Wartezeiten? Wir quantifizieren den Zeitverlust.' },
        { title: 'Soll-Prozess entwerfen', desc: 'Neugestaltung des Prozesses: schlanker, digitaler, teilautomatisiert. Mit deinem Team validiert, bevor umgesetzt wird.' },
        { title: 'Einführung begleiten',   desc: 'Begleitung bei der Implementierung, Schulung der Mitarbeitenden und Erfolgsmessung nach 4 Wochen.' },
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
      exampleText: 'Ein 10-Personen-KMU stellte Rechnungen manuell aus: Excel-Liste prüfen, PDF erstellen, per E-Mail senden, in Buchhaltungssoftware nachtragen, Zahlungseingang manuell überwachen. 4 Stunden pro Woche für einen Prozess, der vollständig automatisierbar ist. Nach der Optimierung: Template wählen, auf "Senden" klicken – der Rest läuft automatisch. Noch 15 Minuten pro Woche.',
      metaDesc: 'Prozessoptimierung mit BPMN – Marcel Spahr digitalisiert und automatisiert manuelle Abläufe in Schweizer KMU. Zeitersparnis messbar, Prozesse sichtbar, Umsetzung begleitet.',
    },
    en: {
      title: 'Process Optimization (BPMN)', subtitle: 'Digitalize and automate manual workflows',
      intro: 'Many businesses lose hours every day through inefficient, manual processes – often without knowing it. I make these processes visible, understand them, and digitalize them. Using BPMN (Business Process Model and Notation) – the international standard for process modeling – I document precisely and comprehensibly.',
      process: [
        { title: 'Process Capture',        desc: 'I accompany your team and document: who does what, in which order, with which tools? Shadow sessions and interviews.' },
        { title: 'Weakness Analysis',      desc: 'Where are the media breaks? Where is work duplicated? Where do errors or wait times occur? We quantify the time lost.' },
        { title: 'Design the target process', desc: 'Redesign of the process: leaner, more digital, partly automated. Validated with your team before implementation.' },
        { title: 'Support implementation', desc: 'Support during implementation, training of employees, and success measurement after 4 weeks.' },
      ],
      deliverables: [
        { emoji: '🗂️', text: 'BPMN diagrams (as-is & to-be)' },
        { emoji: '📊', text: 'Optimization report with time-savings calculation' },
        { emoji: '🛣️', text: 'Implementation plan' },
        { emoji: '📚', text: 'Training materials for employees' },
        { emoji: '📏', text: 'KPI measurement: before/after' },
        { emoji: '🔍', text: 'Follow-up review after 30 days' },
      ],
      exampleTitle: 'Example: Invoicing from 4 hours to 15 minutes per week',
      exampleText: 'A 10-person SME was creating invoices manually: checking Excel list, creating PDF, sending by email, entering in accounting software, manually monitoring payment receipt. 4 hours per week for a fully automatable process. After optimization: choose template, click "Send" – the rest runs automatically. Just 15 minutes per week.',
      metaDesc: 'Process optimization with BPMN – Marcel Spahr digitalizes and automates manual workflows in Swiss SMEs. Time savings measurable, processes visible, implementation supported.',
    },
  },
  {
    slug: 'digital-marketing', iconKey: 'Megaphone', color: '#c4926a', colorMuted: '#c4926a15',
    de: {
      title: 'Digital Marketing & Social Media', subtitle: 'Sichtbarkeit, die Kunden bringt',
      intro: 'In einer digitalen Welt entscheidet deine Online-Präsenz über Sichtbarkeit, Vertrauen und Umsatz. Ich entwickle Strategien, die wirklich funktionieren – datenbasiert, KI-unterstützt und praxiserprobt. Von der LinkedIn-Strategie bis zum vollständigen Content-Plan, der von KI-Tools unterstützt aber von echten Ideen getragen wird.',
      process: [
        { title: 'Kanal-Audit',           desc: 'Wo stehst du heute? Analyse bestehender Kanäle, Zielgruppen, Wettbewerber und aktuellem Content. Zahlen statt Bauchgefühl.' },
        { title: 'Strategie-Entwicklung', desc: 'Welche Kanäle, welche Inhaltstypen, welche Frequenz? Ein klarer, realistischer Plan für 3 bis 6 Monate.' },
        { title: 'Content & KI',          desc: 'Erstellung und Optimierung von Inhalten – mit KI-Unterstützung für Effizienz, aber mit deiner authentischen Stimme und Expertise.' },
        { title: 'Messen & Optimieren',   desc: 'KPIs definieren, Analytics-Setup, monatliche Auswertung. Was funktioniert, wird verstärkt – was nicht, wird geändert.' },
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
      exampleText: 'Ausgangslage: 80 LinkedIn-Follower, kein regelmässiger Content, keine Anfragen. Nach 6 Monaten mit strukturierter Strategie: 1.400 Follower, 3 monatliche Content-Beiträge, durchschnittlich 2 neue Beratungsanfragen pro Monat direkt über LinkedIn. Kein bezahltes Advertising – nur organisch.',
      metaDesc: 'Digital Marketing & Social Media für Schweizer KMU – Marcel Spahr entwickelt LinkedIn-Strategien und Content-Pläne mit KI-Unterstützung. Mehr Sichtbarkeit, mehr Leads, messbar.',
    },
    en: {
      title: 'Digital Marketing & Social Media', subtitle: 'Visibility that brings customers',
      intro: "In a digital world, your online presence determines visibility, trust, and revenue. I develop strategies that genuinely work – data-driven, AI-supported, and field-tested. From LinkedIn strategy to complete content plans, supported by AI tools but driven by real ideas.",
      process: [
        { title: 'Channel Audit',         desc: 'Where do you stand today? Analysis of existing channels, target groups, competitors, and current content. Numbers over gut feeling.' },
        { title: 'Strategy Development',  desc: 'Which channels, which content types, which frequency? A clear, realistic plan for 3 to 6 months.' },
        { title: 'Content & AI',          desc: 'Creation and optimization of content – with AI support for efficiency, but with your authentic voice and expertise.' },
        { title: 'Measure & Optimize',    desc: "Define KPIs, analytics setup, monthly evaluation. What works gets amplified – what doesn't gets changed." },
      ],
      deliverables: [
        { emoji: '🎯', text: 'Channel strategy (3–6 months)' },
        { emoji: '📅', text: 'Content calendar with topics & formats' },
        { emoji: '💼', text: 'LinkedIn profile optimization' },
        { emoji: '✍️', text: '10 ready-to-publish content pieces' },
        { emoji: '📈', text: 'Analytics dashboard (GA4 / LinkedIn)' },
        { emoji: '🖼️', text: 'Design templates for posts' },
      ],
      exampleTitle: 'Example: LinkedIn growth for an independent consultant',
      exampleText: 'Starting point: 80 LinkedIn followers, no regular content, no inquiries. After 6 months with a structured strategy: 1,400 followers, 3 monthly content posts, an average of 2 new consulting inquiries per month directly via LinkedIn. No paid advertising – organic only.',
      metaDesc: 'Digital marketing & social media for Swiss SMEs – Marcel Spahr develops LinkedIn strategies and content plans with AI support. More visibility, more leads, measurable.',
    },
  },
  {
    slug: 'video-produktion', iconKey: 'Video', color: '#c4897a', colorMuted: '#c4897a15',
    de: {
      title: 'Video-Produktion', subtitle: 'Deine Botschaft. Unvergesslich.',
      intro: 'Video ist das Format mit der höchsten Aufmerksamkeit und stärksten Vertrauensbildung. Ob Erklärvideo für dein Produkt, Imagefilm für dein Unternehmen oder Social-Content für deinen Feed – ich begleite dich vom ersten Konzept bis zum fertigen, veröffentlichbaren Video.',
      process: [
        { title: 'Konzept & Script', desc: 'Was soll das Video erreichen? Für wen? Was ist die Kernbotschaft? Ich schreibe ein verständliches Script und ein Storyboard.' },
        { title: 'Vorbereitung',     desc: 'Drehplan, Location-Briefing, Technik-Setup, Zeitplan. Alles ist geklärt, bevor die Kamera läuft.' },
        { title: 'Produktion',       desc: 'Dreh, Screen-Recording oder Animation – je nach Bedarf. Professionelle Technik, entspannte Atmosphäre.' },
        { title: 'Postproduktion',   desc: 'Schnitt, Farbkorrektur, Musik, Untertitel, Formatierung für verschiedene Plattformen. Du erhältst alle benötigten Versionen.' },
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
      exampleText: 'Ein SaaS-Anbieter hatte ein komplexes Produkt, das Verkaufsgespräche unnötig verlängerte. Ein 90-sekündiges Erklärvideo – animiert, mit Voice-Over – erklärt das Produkt klar und einprägsam. Ergebnis: Das Video wurde auf der Website eingebettet, die Abschlussrate in Demos stieg um 35%, Supportanfragen zu Grundfunktionen sanken um 50%.',
      metaDesc: 'Video-Produktion in Bern – Erklärvideos, Unternehmensfilme und Social-Content von Marcel Spahr. Vom Konzept bis zum fertigen Video für Schweizer KMU.',
    },
    en: {
      title: 'Video Production', subtitle: 'Your message. Unforgettable.',
      intro: 'Video is the format with the highest attention and strongest trust-building. Whether an explainer video for your product, a corporate film for your company, or social content for your feed – I accompany you from the first concept to the finished, publishable video.',
      process: [
        { title: 'Concept & Script', desc: 'What should the video achieve? For whom? What is the core message? I write a clear script and a storyboard.' },
        { title: 'Preparation',      desc: 'Shooting schedule, location briefing, technical setup, timeline. Everything is clear before the camera rolls.' },
        { title: 'Production',       desc: 'Shooting, screen recording, or animation – as needed. Professional equipment, relaxed atmosphere.' },
        { title: 'Post-production',  desc: 'Edit, color grading, music, subtitles, formatting for different platforms. You receive all required versions.' },
      ],
      deliverables: [
        { emoji: '🎬', text: 'Finished video (MP4, all formats)' },
        { emoji: '📱', text: 'Social media versions (9:16, 1:1)' },
        { emoji: '📝', text: 'Script & storyboard' },
        { emoji: '🎵', text: 'Royalty-free music included' },
        { emoji: '🔤', text: 'Subtitle file (.srt)' },
        { emoji: '🖼️', text: 'Thumbnail / cover image' },
      ],
      exampleTitle: 'Example: Explainer video for a software solution',
      exampleText: 'A SaaS provider had a complex product that unnecessarily prolonged sales conversations. A 90-second explainer video – animated with voice-over – explained the product clearly and memorably. Result: the video was embedded on the website, the close rate in demos rose by 35%, and support requests about basic features fell by 50%.',
      metaDesc: 'Video production in Bern – explainer videos, corporate films, and social content by Marcel Spahr. From concept to finished video for Swiss SMEs.',
    },
  },
  {
    slug: 'projektmanagement', iconKey: 'FolderKanban', color: '#7a9bb5', colorMuted: '#7a9bb515',
    de: {
      title: 'Projektmanagement', subtitle: 'Von der Idee bis zum Go-Live – strukturiert und agil',
      intro: 'Ein gutes Projekt braucht nicht nur ein gutes Team – es braucht Struktur, Transparenz und jemanden, der das grosse Bild im Blick behält und gleichzeitig die Details nicht vergisst. Ich plane, koordiniere und steuere dein Projekt nach modernen agilen Methoden (Scrum/SAFe-zertifiziert) – termingerecht und budgetschonend.',
      process: [
        { title: 'Initialisierung',       desc: 'Ziele, Scope, Budget, Timeline und Stakeholder werden definiert. Was gehört zum Projekt – und was nicht? Klare Grenzen von Anfang an.' },
        { title: 'Sprint-Planung',        desc: 'Aufgaben werden in 2-Wochen-Sprints eingeteilt – übersichtlich, priorisiert und realistisch. Backlog mit klaren Prioritäten.' },
        { title: 'Steuerung',             desc: 'Wöchentliche Standups, Fortschritts-Tracking, Risiko-Radar, Stakeholder-Updates. Keine Überraschungen am Ende.' },
        { title: 'Go-Live & Abschluss',   desc: 'Release-Planung, Testing, Übergabe, Retrospektive. Was können wir beim nächsten Projekt besser machen?' },
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
      exampleText: 'Ein Beratungsunternehmen wollte seine Website komplett neu aufbauen. Stakeholder: Geschäftsleitung, Marketing, IT-Dienstleister. Mit strukturiertem Projektplan, 4 zweiwöchigen Sprints und klarer Kommunikation: Website live nach exakt 8 Wochen, innerhalb des Budgets. Alle 3 Stakeholder-Gruppen zu jeder Zeit informiert und eingebunden.',
      metaDesc: 'Projektmanagement für Schweizer KMU – Marcel Spahr leitet Projekte agil und strukturiert. SAFe & Scrum zertifiziert. Von der Idee bis zum Go-Live, termingerecht.',
    },
    en: {
      title: 'Project Management', subtitle: 'From idea to go-live – structured and agile',
      intro: "A good project needs not only a good team – it needs structure, transparency, and someone who keeps the big picture in mind while not losing sight of the details. I plan, coordinate, and manage your project using modern agile methods (SAFe & Scrum certified) – on time and within budget.",
      process: [
        { title: 'Initialization',     desc: "Goals, scope, budget, timeline, and stakeholders are defined. What belongs to the project – and what doesn't? Clear boundaries from the start." },
        { title: 'Sprint Planning',    desc: 'Tasks are divided into 2-week sprints – clear, prioritized, and realistic. Backlog with clear priorities.' },
        { title: 'Steering',           desc: 'Weekly standups, progress tracking, risk radar, stakeholder updates. No surprises at the end.' },
        { title: 'Go-live & Closure',  desc: 'Release planning, testing, handover, retrospective. What can we do better in the next project?' },
      ],
      deliverables: [
        { emoji: '📅', text: 'Project plan with timeline & milestones' },
        { emoji: '🗂️', text: 'Sprint backlogs (Jira or Notion)' },
        { emoji: '📊', text: 'Status reports (weekly)' },
        { emoji: '⚠️', text: 'Risk register' },
        { emoji: '📋', text: 'Final report' },
        { emoji: '🔍', text: 'Retrospective documentation' },
      ],
      exampleTitle: 'Example: Website relaunch in 8 weeks',
      exampleText: 'A consulting firm wanted to completely rebuild its website. Stakeholders: management, marketing, IT service provider. With a structured project plan, 4 two-week sprints, and clear communication: website live after exactly 8 weeks, within budget. All 3 stakeholder groups informed and involved at every stage.',
      metaDesc: 'Project management for Swiss SMEs – Marcel Spahr leads projects agile and structured. SAFe & Scrum certified. From idea to go-live, on schedule.',
    },
  },
  {
    slug: 'workshops', iconKey: 'GraduationCap', color: '#a8b87a', colorMuted: '#a8b87a15',
    de: {
      title: 'Workshops & Schulungen', subtitle: 'KI praktisch lernen – direkt anwendbar',
      intro: 'KI verändert die Arbeitswelt schneller als je zuvor. Die Frage ist nicht ob, sondern wie dein Team davon profitiert. Ich bringe dein Team auf den neuesten Stand – praxisnah, verständlich und direkt anwendbar. Keine Theorie-Vorlesungen, sondern echtes Arbeiten mit KI-Tools an euren eigenen Aufgaben.',
      process: [
        { title: 'Bedarfsanalyse',            desc: 'Was braucht dein Team wirklich? Welche Tools, welches Vorkenntnisse-Niveau, welche konkreten Anwendungsfälle aus eurem Alltag?' },
        { title: 'Massgeschneiderter Inhalt', desc: 'Kein Standard-Workshop von der Stange. Die Inhalte werden auf eure Branche, eure Tools und eure typischen Aufgaben zugeschnitten.' },
        { title: 'Interaktiver Workshop',     desc: 'Remote oder vor Ort, max. 12 Personen für optimales Lernen. Übungen direkt mit eigenen Aufgaben, keine theoretischen Beispiele.' },
        { title: '30-Tage-Nachbetreuung',     desc: 'Fragen nach dem Workshop via Chat beantwortet. So wird Gelerntes wirklich angewendet und nicht vergessen.' },
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
      exampleText: 'Ein 8-köpfiges Team im Kundendienst verbrachte täglich 2+ Stunden mit E-Mail-Antworten. In einem halbtägigen Workshop lernten alle, wie sie ChatGPT als Schreib-Assistenten nutzen. Ergebnis nach 4 Wochen: durchschnittlich 45 Minuten Einsparung pro Person pro Tag. Das Team war begeistert, weil der Workshop mit echten Kundenanfragen aus ihrem Alltag arbeitete.',
      metaDesc: 'KI-Workshops & Schulungen für Teams – Marcel Spahr schult dein Team in ChatGPT, Copilot und KI-Automatisierung. Praxisnah, massgeschneidert, direkt anwendbar.',
    },
    en: {
      title: 'Workshops & Training', subtitle: 'Learning AI practically – directly applicable',
      intro: 'AI is changing the working world faster than ever before. The question is not whether your team benefits, but how. I bring your team up to date – practically, comprehensibly, and directly applicable. No theory lectures, but real work with AI tools on your own tasks.',
      process: [
        { title: 'Needs Analysis',     desc: 'What does your team really need? Which tools, which skill level, which specific use cases from your daily work?' },
        { title: 'Tailored Content',   desc: "No off-the-shelf workshop. The content is tailored to your industry, your tools, and your typical tasks." },
        { title: 'Interactive Workshop', desc: 'Remote or on-site, max. 12 people for optimal learning. Exercises directly with your own tasks, no theoretical examples.' },
        { title: '30-Day Follow-up',   desc: 'Questions after the workshop answered via chat. So what was learned is actually applied and not forgotten.' },
      ],
      deliverables: [
        { emoji: '📖', text: 'Workshop materials (PDF, 20–40 pages)' },
        { emoji: '💡', text: 'Prompt library for your daily work' },
        { emoji: '✅', text: 'Checklists for common AI tasks' },
        { emoji: '🎥', text: 'Recording (on request)' },
        { emoji: '💬', text: '30 days support via chat' },
        { emoji: '🏆', text: 'Certificate of participation (optional)' },
      ],
      exampleTitle: 'Example: ChatGPT workshop for an insurance office',
      exampleText: 'An 8-person customer service team spent 2+ hours daily on email responses. In a half-day workshop, everyone learned to use ChatGPT as a writing assistant. Result after 4 weeks: an average of 45 minutes saved per person per day. The team was enthusiastic because the workshop used real customer inquiries from their daily work.',
      metaDesc: 'AI workshops & training for teams – Marcel Spahr trains your team in ChatGPT, Copilot, and AI automation. Practical, tailored, directly applicable.',
    },
  },
  {
    slug: 'website-optimierung', iconKey: 'Globe', color: '#87a8c8', colorMuted: '#87a8c815',
    de: {
      title: 'Website-Optimierung', subtitle: 'Schneller gefunden. Mehr Kunden. Messbar.',
      intro: 'Eine langsame, schlecht gefundene Website kostet täglich Kunden – und die meisten Unternehmen wissen es nicht. Ich analysiere deine Website nach modernen Standards: Ladegeschwindigkeit (Core Web Vitals), Suchmaschinen-Optimierung (SEO) und Conversion-Rate. Danach optimiere ich gezielt, mit messbarem Ergebnis.',
      process: [
        { title: 'Technisches Audit',    desc: 'Core Web Vitals, Ladezeit, Mobile-Erlebnis, Lighthouse-Score. Wo verliert deine Website Punkte – und warum?' },
        { title: 'SEO-Analyse',          desc: 'Keyword-Recherche, Meta-Tags, strukturierte Daten, interne Verlinkung, Backlink-Profil. Wie wirst du in Google wirklich gefunden?' },
        { title: 'Optimierung',          desc: 'Technische Fixes, Content-Verbesserungen, Meta-Beschreibungen, Bildoptimierung, Core Web Vitals verbessern.' },
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
      exampleText: 'Ein Online-Shop hatte eine Ladezeit von 8 Sekunden auf Mobile – 60% der Besucher verliessen die Seite, bevor sie geladen hatte. Nach Bild-Optimierung, Caching, Code-Bereinigung und CDN-Einrichtung: Ladezeit 1.2 Sekunden. Ergebnis nach 60 Tagen: Absprungrate -45%, organischer Traffic +28%, Umsatz +22%. Alles messbar im Analytics-Dashboard.',
      metaDesc: 'Website-Optimierung für Schweizer KMU – Marcel Spahr verbessert Performance, SEO und Conversion. Core Web Vitals, Google Analytics 4, messbare Ergebnisse.',
    },
    en: {
      title: 'Website Optimization', subtitle: 'Found faster. More customers. Measurable.',
      intro: "A slow, poorly-ranked website loses customers every day – and most businesses don't know it. I analyze your website to modern standards: loading speed (Core Web Vitals), search engine optimization (SEO), and conversion rate. Then I optimize precisely, with measurable results.",
      process: [
        { title: 'Technical Audit',    desc: 'Core Web Vitals, loading time, mobile experience, Lighthouse score. Where does your website lose points – and why?' },
        { title: 'SEO Analysis',       desc: 'Keyword research, meta tags, structured data, internal linking, backlink profile. How are you really found in Google?' },
        { title: 'Optimization',       desc: 'Technical fixes, content improvements, meta descriptions, image optimization, improving Core Web Vitals.' },
        { title: 'Analytics & Reporting', desc: 'GA4 setup, conversion tracking, monthly reporting. You see exactly how many visitors come and what they do.' },
      ],
      deliverables: [
        { emoji: '🔍', text: 'Complete audit report' },
        { emoji: '🛣️', text: 'Prioritized optimization plan' },
        { emoji: '⚡', text: 'Performance optimization (Core Web Vitals)' },
        { emoji: '🔎', text: 'SEO optimization (on-page)' },
        { emoji: '📊', text: 'Analytics setup (GA4 + events)' },
        { emoji: '📅', text: 'Monthly reporting (3 months)' },
      ],
      exampleTitle: 'Example: E-commerce site from 8s to 1.2s',
      exampleText: 'An online shop had a loading time of 8 seconds on mobile – 60% of visitors left before the page loaded. After image optimization, caching, code cleanup, and CDN setup: loading time 1.2 seconds. Result after 60 days: bounce rate -45%, organic traffic +28%, revenue +22%. All measurable in the analytics dashboard.',
      metaDesc: 'Website optimization for Swiss SMEs – Marcel Spahr improves performance, SEO, and conversion. Core Web Vitals, Google Analytics 4, measurable results.',
    },
  },
  {
    slug: 'ki-beratung-kmu', iconKey: 'Lightbulb', color: '#c9a84c', colorMuted: '#c9a84c15',
    de: {
      title: 'KI-Beratung für KMU', subtitle: 'Deine persönliche KI-Roadmap',
      intro: 'KI ist kein Zukunftsthema mehr – sie verändert jetzt, wie Unternehmen arbeiten. Aber welche KI-Lösungen passen wirklich zu deinem KMU? Ich analysiere deinen Betrieb, identifiziere konkrete Potenziale und erstelle eine realistische KI-Roadmap – ohne Buzzwords, ohne Überforderung, mit echtem, messbarem Nutzen.',
      process: [
        { title: 'KI-Readiness-Assessment', desc: 'Wo steht dein Unternehmen heute? Welche Prozesse, welche Daten, welche bestehenden Tools? Ehrliche Standortbestimmung.' },
        { title: 'Potenzialanalyse',        desc: 'Wo kann KI konkret helfen? Quick Wins (sofort umsetzbar) vs. strategische Projekte (mittelfristig). Mit Aufwand-Nutzen-Einschätzung.' },
        { title: 'KI-Roadmap',              desc: 'Priorisierter 12-Monats-Plan: Was wann, mit welchem Budget und welchem erwarteten ROI? Realistisch und umsetzbar.' },
        { title: 'Pilotprojekt',            desc: 'Start mit einem überschaubaren KI-Projekt für schnelle, sichtbare Ergebnisse. Beweis, dass KI in deinem Unternehmen funktioniert.' },
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
      exampleText: 'Ein Malerbetrieb mit 15 Mitarbeitern dachte, KI sei nur für Tech-Unternehmen. Das KI-Assessment ergab 3 sofortige Quick Wins: Offert-Erstellung mit KI-Unterstützung (von 2h auf 20min), automatische Termin-Erinnerungen an Kunden, und KI-generierte Nachher-Fotos für Marketing. Gesamterspärnis: 38 Stunden pro Monat. Investition: 1 Tag Beratung.',
      metaDesc: 'KI-Beratung für Schweizer KMU – Marcel Spahr erstellt individuelle KI-Roadmaps, KI-Readiness-Assessments und begleitet Pilotprojekte. Praxisnah, ohne Buzzwords.',
    },
    en: {
      title: 'AI Consulting for SMEs', subtitle: 'Your personal AI roadmap',
      intro: "AI is no longer a topic for the future – it's changing right now how businesses operate. But which AI solutions really fit your SME? I analyze your business, identify concrete potentials, and create a realistic AI roadmap – without buzzwords, without overwhelm, with real, measurable benefit.",
      process: [
        { title: 'AI Readiness Assessment', desc: 'Where does your company stand today? Which processes, which data, which existing tools? Honest positioning.' },
        { title: 'Potential Analysis',      desc: 'Where can AI specifically help? Quick wins (immediately implementable) vs. strategic projects (medium-term). With effort-benefit assessment.' },
        { title: 'AI Roadmap',              desc: 'Prioritized 12-month plan: what when, with which budget, and which expected ROI? Realistic and actionable.' },
        { title: 'Pilot Project',           desc: 'Start with a manageable AI project for quick, visible results. Proof that AI works in your company.' },
      ],
      deliverables: [
        { emoji: '📊', text: 'AI readiness report' },
        { emoji: '🎯', text: 'Potential analysis (top 5 use cases)' },
        { emoji: '🗺️', text: 'AI roadmap (12 months)' },
        { emoji: '💰', text: 'ROI calculation per use case' },
        { emoji: '🏗️', text: 'Pilot project concept' },
        { emoji: '🔗', text: 'Provider recommendations (tools & partners)' },
      ],
      exampleTitle: 'Example: AI quick wins for a painting contractor',
      exampleText: 'A painting contractor with 15 employees thought AI was only for tech companies. The AI assessment revealed 3 immediate quick wins: quote creation with AI support (from 2 hours to 20 minutes), automated appointment reminders to customers, and AI-generated after photos for marketing. Total savings: 38 hours per month. Investment: 1 day of consulting.',
      metaDesc: 'AI consulting for Swiss SMEs – Marcel Spahr creates individual AI roadmaps, AI readiness assessments, and accompanies pilot projects. Practical, without buzzwords.',
    },
  },
];

export function getService(slug: string): ServiceData | undefined {
  return SERVICES.find(s => s.slug === slug);
}

export function getServiceTranslation(s: ServiceData, lang: Lang): ServiceTranslation {
  return lang === 'en' ? s.en : s.de;
}
