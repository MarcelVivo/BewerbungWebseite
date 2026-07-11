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

const sharedProcessDe = [
  { title: 'Problem klären', desc: 'Wir definieren Ziel, Nutzen, Rahmen und die echten Engpässe im Alltag.' },
  { title: 'Lösung entwerfen', desc: 'Struktur, Funktionen, Daten, Design und Etappen werden sauber geplant.' },
  { title: 'Umsetzen & testen', desc: 'Die Lösung wird gebaut, geprüft und verständlich dokumentiert.' },
  { title: 'Starten & betreiben', desc: 'Nach dem Go-Live bleibt das System wartbar, sicher und erweiterbar.' },
];

const sharedProcessEn = [
  { title: 'Clarify the problem', desc: 'We define goals, value, scope and the real bottlenecks in daily work.' },
  { title: 'Design the solution', desc: 'Structure, features, data, design and stages are planned cleanly.' },
  { title: 'Build & test', desc: 'The solution is built, checked and documented in a clear way.' },
  { title: 'Launch & operate', desc: 'After go-live, the system stays maintainable, secure and expandable.' },
];

export const SERVICES: ServiceData[] = [
  {
    slug: 'corporate-design', iconKey: 'Lightbulb', color: '#c9a84c', colorMuted: '#c9a84c15',
    de: {
      title: 'Corporate Design & Markenauftritt', subtitle: 'Ein professioneller Auftritt aus einem Guss',
      intro: 'Ich entwickle einen klaren visuellen Rahmen für dein Unternehmen: Logo, Farben, Typografie, Bildsprache und digitale Anwendung. Ziel ist ein Auftritt, der seriös wirkt, wiedererkennbar bleibt und auf Website, Dokumenten und Systemen konsistent funktioniert.',
      process: sharedProcessDe,
      deliverables: [
        { emoji: '🎨', text: 'Logo- und Stilrichtung' },
        { emoji: '🧭', text: 'Farben, Schriften und Gestaltungsregeln' },
        { emoji: '📄', text: 'Vorlagen für digitale Kommunikation' },
        { emoji: '🌐', text: 'Übertragung auf Website und Systeme' },
      ],
      exampleTitle: 'Typisches Ergebnis',
      exampleText: 'Aus einer uneinheitlichen Aussendarstellung entsteht ein klarer Markenauftritt, der sofort professioneller wirkt und als Basis für Website, CRM, Dokumente und Kommunikation dient.',
      metaDesc: 'Corporate Design für KMU und Unternehmen – professioneller Markenauftritt, digitale Gestaltung und konsistente Weblösungen aus einer Hand.',
    },
    en: {
      title: 'Corporate design & brand presence', subtitle: 'A professional presence in one coherent style',
      intro: 'I create a clear visual foundation for your company: logo, colors, typography, imagery and digital usage. The goal is a professional, recognizable presence that works consistently across website, documents and systems.',
      process: sharedProcessEn,
      deliverables: [
        { emoji: '🎨', text: 'Logo and visual direction' },
        { emoji: '🧭', text: 'Colors, typography and design rules' },
        { emoji: '📄', text: 'Templates for digital communication' },
        { emoji: '🌐', text: 'Application across website and systems' },
      ],
      exampleTitle: 'Typical result',
      exampleText: 'An inconsistent external presence becomes a clear brand system that feels more professional and becomes the basis for website, CRM, documents and communication.',
      metaDesc: 'Corporate design for SMEs and companies – professional brand presence, digital design and consistent web solutions from one source.',
    },
  },
  {
    slug: '2d-3d-websites', iconKey: 'Globe', color: '#87a8c8', colorMuted: '#87a8c815',
    de: {
      title: 'Moderne 2D- & 3D-Websites', subtitle: 'Schön, schnell, klar und technisch sauber',
      intro: 'Ich baue moderne Websites, die nicht nach Vorlage aussehen: klare Inhalte, starke visuelle Führung, 2D-/3D-Elemente, saubere Performance und eine Struktur, die Besucher schnell zum Ziel führt.',
      process: sharedProcessDe,
      deliverables: [
        { emoji: '🧱', text: 'Struktur und UX-Konzept' },
        { emoji: '✨', text: '2D-/3D-Visuals und Animationen' },
        { emoji: '⚡', text: 'Performance und responsive Umsetzung' },
        { emoji: '🔎', text: 'SEO-Grundlagen und Tracking-Basis' },
      ],
      exampleTitle: 'Typisches Ergebnis',
      exampleText: 'Eine Website wird nicht nur schöner, sondern verständlicher: Besucher erkennen sofort Angebot, Nutzen und nächsten Schritt. Das Design wirkt eigenständig und bleibt technisch stabil.',
      metaDesc: 'Moderne 2D- und 3D-Websites für KMU und Unternehmen – individuelle Webentwicklung, UX, Performance und professionelles Design.',
    },
    en: {
      title: 'Modern 2D & 3D websites', subtitle: 'Beautiful, fast, clear and technically solid',
      intro: 'I build modern websites that do not look like templates: clear content, strong visual guidance, 2D/3D elements, clean performance and a structure that leads visitors to the right action.',
      process: sharedProcessEn,
      deliverables: [
        { emoji: '🧱', text: 'Structure and UX concept' },
        { emoji: '✨', text: '2D/3D visuals and animation' },
        { emoji: '⚡', text: 'Performance and responsive build' },
        { emoji: '🔎', text: 'SEO basics and tracking foundation' },
      ],
      exampleTitle: 'Typical result',
      exampleText: 'A website becomes not only more beautiful, but clearer: visitors understand the offer, value and next step immediately. The design feels distinctive and remains technically stable.',
      metaDesc: 'Modern 2D and 3D websites for SMEs and companies – custom web development, UX, performance and professional design.',
    },
  },
  {
    slug: 'crm-loesungen', iconKey: 'BarChart3', color: '#7aada8', colorMuted: '#7aada815',
    de: {
      title: 'CRM-Lösungen', subtitle: 'Kunden, Leads und Aufgaben zentral im Griff',
      intro: 'Ich baue CRM-Lösungen, die zu deinem Ablauf passen: Kontakte, Anfragen, Aufgaben, Dokumente, Pipeline, Erinnerungen und Kommunikation an einem Ort. Kein unnötiger Ballast, sondern ein System, das im Alltag wirklich genutzt wird.',
      process: sharedProcessDe,
      deliverables: [
        { emoji: '👥', text: 'Kontakt- und Kundenstruktur' },
        { emoji: '📌', text: 'Pipeline, Aufgaben und Erinnerungen' },
        { emoji: '📁', text: 'Dokumente und Notizen' },
        { emoji: '🔐', text: 'Rollen, Rechte und sichere Zugriffe' },
      ],
      exampleTitle: 'Typisches Ergebnis',
      exampleText: 'Anfragen, Kundenstatus und nächste Schritte liegen nicht mehr verteilt in E-Mails, Listen und Köpfen. Das Team sieht zentral, was zu tun ist und nichts geht verloren.',
      metaDesc: 'Massgeschneiderte CRM-Lösungen für KMU – Kundenverwaltung, Leads, Aufgaben, Dokumente und sichere Daten an einem Ort.',
    },
    en: {
      title: 'CRM solutions', subtitle: 'Customers, leads and tasks under control',
      intro: 'I build CRM solutions that match your workflow: contacts, requests, tasks, documents, pipeline, reminders and communication in one place. No unnecessary weight, but a system people actually use.',
      process: sharedProcessEn,
      deliverables: [
        { emoji: '👥', text: 'Contact and customer structure' },
        { emoji: '📌', text: 'Pipeline, tasks and reminders' },
        { emoji: '📁', text: 'Documents and notes' },
        { emoji: '🔐', text: 'Roles, permissions and secure access' },
      ],
      exampleTitle: 'Typical result',
      exampleText: 'Requests, customer status and next steps no longer live across emails, lists and heads. The team sees centrally what needs to happen and nothing gets lost.',
      metaDesc: 'Custom CRM solutions for SMEs – customer management, leads, tasks, documents and secure data in one place.',
    },
  },
  {
    slug: 'erp-prozesse', iconKey: 'Workflow', color: '#8fb58a', colorMuted: '#8fb58a15',
    de: {
      title: 'ERP- & Geschäftsprozesse', subtitle: 'Abläufe digitalisieren und sauber verbinden',
      intro: 'Ich entwickle digitale Systeme für operative Abläufe: Projekte, Offerten, Rechnungen, Verträge, Termine, Zeiterfassung, Lager oder interne Freigaben. Ziel ist ein schlanker Ablauf ohne doppelte Arbeit und Medienbrüche.',
      process: sharedProcessDe,
      deliverables: [
        { emoji: '🗂️', text: 'Prozess- und Datenmodell' },
        { emoji: '🧾', text: 'Module für operative Abläufe' },
        { emoji: '🔄', text: 'Automatisierte Schritte und Status' },
        { emoji: '📊', text: 'Auswertungen und Übersicht' },
      ],
      exampleTitle: 'Typisches Ergebnis',
      exampleText: 'Ein manueller Ablauf mit Excel, E-Mail und Nachtragen wird zu einem geführten digitalen Prozess. Daten entstehen einmal und werden dort weiterverwendet, wo sie gebraucht werden.',
      metaDesc: 'ERP- und Prozesslösungen für KMU – Projekte, Rechnungen, Verträge, Termine, Zeit, Daten und operative Abläufe digitalisieren.',
    },
    en: {
      title: 'ERP & business processes', subtitle: 'Digitise and connect operations cleanly',
      intro: 'I develop digital systems for operations: projects, quotes, invoices, contracts, appointments, time tracking, inventory or internal approvals. The goal is a lean flow without duplicate work and manual gaps.',
      process: sharedProcessEn,
      deliverables: [
        { emoji: '🗂️', text: 'Process and data model' },
        { emoji: '🧾', text: 'Modules for daily operations' },
        { emoji: '🔄', text: 'Automated steps and statuses' },
        { emoji: '📊', text: 'Reporting and overview' },
      ],
      exampleTitle: 'Typical result',
      exampleText: 'A manual workflow with Excel, email and retyping becomes a guided digital process. Data is created once and reused where it is needed.',
      metaDesc: 'ERP and process solutions for SMEs – digitise projects, invoices, contracts, appointments, time, data and operations.',
    },
  },
  {
    slug: 'datenbanken-schnittstellen', iconKey: 'FolderKanban', color: '#7a9bb5', colorMuted: '#7a9bb515',
    de: {
      title: 'Datenbanken & Schnittstellen', subtitle: 'Daten sauber speichern, verbinden und nutzen',
      intro: 'Ich plane und baue Datenbanken, die zur Lösung passen: klare Strukturen, sichere Zugriffe, Rollen, Backups und Verbindungen zu bestehenden Tools. Damit Informationen nicht verstreut liegen, sondern belastbar nutzbar werden.',
      process: sharedProcessDe,
      deliverables: [
        { emoji: '🧬', text: 'Datenmodell und Tabellenstruktur' },
        { emoji: '🔌', text: 'Schnittstellen und Integrationen' },
        { emoji: '🛡️', text: 'Sicherheit, Rechte und Backups' },
        { emoji: '📈', text: 'Grundlage für Reports und Automationen' },
      ],
      exampleTitle: 'Typisches Ergebnis',
      exampleText: 'Kunden, Projekte, Dokumente und Status werden strukturiert gespeichert. Website, CRM und interne Prozesse greifen auf dieselbe saubere Datenbasis zu.',
      metaDesc: 'Datenbanken und Schnittstellen für Weblösungen, CRM und ERP – sichere Datenmodelle, Integrationen und belastbare technische Grundlagen.',
    },
    en: {
      title: 'Databases & integrations', subtitle: 'Store, connect and use data cleanly',
      intro: 'I plan and build databases that match the solution: clear structures, secure access, roles, backups and connections to existing tools. Information stops being scattered and becomes reliably usable.',
      process: sharedProcessEn,
      deliverables: [
        { emoji: '🧬', text: 'Data model and table structure' },
        { emoji: '🔌', text: 'Interfaces and integrations' },
        { emoji: '🛡️', text: 'Security, permissions and backups' },
        { emoji: '📈', text: 'Foundation for reports and automation' },
      ],
      exampleTitle: 'Typical result',
      exampleText: 'Customers, projects, documents and statuses are stored in a structured way. Website, CRM and internal processes use the same clean data foundation.',
      metaDesc: 'Databases and integrations for web solutions, CRM and ERP – secure data models, integrations and reliable technical foundations.',
    },
  },
  {
    slug: 'automatisierung-ki-agenten', iconKey: 'Bot', color: '#a896c8', colorMuted: '#a896c815',
    de: {
      title: 'KI-Automation & KI-Unterstützung', subtitle: 'Die passende KI-Lösung finden, integrieren und produktiv nutzen',
      intro: 'Ohne KI geht es heute nicht mehr. Aber der Markt ist unübersichtlich: Tools, Agenten, Automationen, Plattformen und Versprechen ändern sich laufend. Ich behalte den Überblick im KI-Lösungsdschungel, prüfe dein konkretes Problem und baue die Optimierung, die wirklich Nutzen bringt – sicher, verständlich und passend zu deinem Alltag.',
      process: [
        { title: 'Potenzial erkennen', desc: 'Wir klären, wo KI im Unternehmen echten Nutzen bringt: Zeit sparen, Qualität erhöhen, Wissen nutzbar machen oder Prozesse beschleunigen.' },
        { title: 'KI-Lösung auswählen', desc: 'Ich vergleiche passende Tools, Agenten und Automationen und entscheide nicht nach Hype, sondern nach Nutzen, Sicherheit und Alltagstauglichkeit.' },
        { title: 'In Prozesse integrieren', desc: 'Die KI wird sauber mit Website, CRM, Datenbank, E-Mail, Dokumenten oder bestehenden Abläufen verbunden.' },
        { title: 'Einführen & verbessern', desc: 'Ich teste, erkläre, dokumentiere und optimiere weiter, damit die Lösung langfristig funktioniert.' },
      ],
      deliverables: [
        { emoji: '🧭', text: 'KI-Potenzialanalyse und klare Empfehlung' },
        { emoji: '🤖', text: 'KI-Agenten und automatisierte Workflows' },
        { emoji: '📬', text: 'E-Mail-, Formular-, Dokument- und Datenlogik' },
        { emoji: '🔐', text: 'Sichere Integration in bestehende Prozesse' },
      ],
      exampleTitle: 'Typisches Ergebnis',
      exampleText: 'Ein KMU verliert täglich Zeit mit E-Mails, Dokumenten und manueller Datenerfassung. Die KI-Lösung liest Anfragen vor, erkennt den Kontext, erstellt Entwürfe, speichert Daten im CRM und löst Folgeaufgaben aus. Das Team entscheidet weiterhin – aber mit deutlich weniger Reibung.',
      metaDesc: 'KI-Automation und KI-Unterstützung für KMU – passende KI-Lösungen finden, Agenten bauen, Workflows automatisieren und sicher in bestehende Prozesse integrieren.',
    },
    en: {
      title: 'AI automation & AI support', subtitle: 'Find, integrate and use the right AI solution productively',
      intro: 'AI is no longer optional. But the market is confusing: tools, agents, automations, platforms and promises change constantly. I keep track of the AI solution jungle, assess your concrete problem and build the optimization that creates real value – securely, clearly and aligned with daily work.',
      process: [
        { title: 'Identify potential', desc: 'We clarify where AI creates real value: saving time, improving quality, making knowledge usable or speeding up processes.' },
        { title: 'Choose the AI solution', desc: 'I compare suitable tools, agents and automations and decide by value, security and practical fit, not hype.' },
        { title: 'Integrate into processes', desc: 'The AI is cleanly connected with website, CRM, database, email, documents or existing workflows.' },
        { title: 'Launch & improve', desc: 'I test, explain, document and keep optimizing so the solution works long term.' },
      ],
      deliverables: [
        { emoji: '🧭', text: 'AI potential analysis and clear recommendation' },
        { emoji: '🤖', text: 'AI agents and automated workflows' },
        { emoji: '📬', text: 'Email, form, document and data logic' },
        { emoji: '🔐', text: 'Secure integration into existing processes' },
      ],
      exampleTitle: 'Typical result',
      exampleText: 'An SME loses time every day with emails, documents and manual data entry. The AI solution pre-reads requests, understands context, drafts replies, stores data in the CRM and triggers follow-up tasks. The team still decides – but with far less friction.',
      metaDesc: 'AI automation and AI support for SMEs – find suitable AI solutions, build agents, automate workflows and integrate them safely into existing processes.',
    },
  },
  {
    slug: 'analyse-konzept', iconKey: 'BarChart3', color: '#c4926a', colorMuted: '#c4926a15',
    de: {
      title: 'Analyse & Konzept', subtitle: 'Erst verstehen, dann richtig bauen',
      intro: 'Bevor Code, Design oder Tools entschieden werden, kläre ich das eigentliche Problem. Daraus entsteht ein verständliches Konzept mit Prioritäten, Etappen, Risiken und einem realistischen Weg zur Lösung.',
      process: sharedProcessDe,
      deliverables: [
        { emoji: '🔍', text: 'Problem- und Zielbild' },
        { emoji: '🧭', text: 'Lösungskonzept und Roadmap' },
        { emoji: '📌', text: 'Priorisierte Anforderungen' },
        { emoji: '🧪', text: 'Machbarkeits- und Risikoabschätzung' },
      ],
      exampleTitle: 'Typisches Ergebnis',
      exampleText: 'Aus einer vagen Idee wird ein klarer Plan: Was wird gebaut, warum, in welcher Reihenfolge und wie erkennt man, dass es funktioniert.',
      metaDesc: 'Analyse und Konzept für digitale Lösungen – Anforderungen, Roadmap, Prioritäten und technische Machbarkeit sauber klären.',
    },
    en: {
      title: 'Analysis & concept', subtitle: 'Understand first, then build correctly',
      intro: 'Before code, design or tools are decided, I clarify the actual problem. The result is a clear concept with priorities, stages, risks and a realistic path to the solution.',
      process: sharedProcessEn,
      deliverables: [
        { emoji: '🔍', text: 'Problem and target picture' },
        { emoji: '🧭', text: 'Solution concept and roadmap' },
        { emoji: '📌', text: 'Prioritized requirements' },
        { emoji: '🧪', text: 'Feasibility and risk assessment' },
      ],
      exampleTitle: 'Typical result',
      exampleText: 'A vague idea becomes a clear plan: what will be built, why, in which order and how success will be recognized.',
      metaDesc: 'Analysis and concept for digital solutions – clarify requirements, roadmap, priorities and technical feasibility.',
    },
  },
  {
    slug: 'go-live-umsetzung', iconKey: 'FolderKanban', color: '#c4897a', colorMuted: '#c4897a15',
    de: {
      title: 'Umsetzung bis Go-Live', subtitle: 'Professionell bauen, prüfen und übergeben',
      intro: 'Ich übernehme die Umsetzung strukturiert bis zum Start: Design, Entwicklung, Inhalte, Testing, Deployment, Übergabe und Dokumentation. Ziel ist nicht ein unfertiger Prototyp, sondern eine Lösung, die produktiv genutzt werden kann.',
      process: sharedProcessDe,
      deliverables: [
        { emoji: '🛠️', text: 'Umsetzung von Website oder System' },
        { emoji: '✅', text: 'Tests und Qualitätsprüfung' },
        { emoji: '🚀', text: 'Deployment und Go-Live' },
        { emoji: '📚', text: 'Übergabe und Dokumentation' },
      ],
      exampleTitle: 'Typisches Ergebnis',
      exampleText: 'Am Ende steht ein live geschaltetes System mit klarer Struktur, geprüften Funktionen und verständlicher Übergabe. Keine losen Enden, keine unklaren Zuständigkeiten.',
      metaDesc: 'Umsetzung digitaler Lösungen bis Go-Live – Design, Entwicklung, Testing, Deployment und Übergabe aus einer Hand.',
    },
    en: {
      title: 'Build to go-live', subtitle: 'Build, test and hand over professionally',
      intro: 'I handle implementation in a structured way until launch: design, development, content, testing, deployment, handover and documentation. The goal is not an unfinished prototype, but a solution ready for real use.',
      process: sharedProcessEn,
      deliverables: [
        { emoji: '🛠️', text: 'Build of website or system' },
        { emoji: '✅', text: 'Testing and quality checks' },
        { emoji: '🚀', text: 'Deployment and go-live' },
        { emoji: '📚', text: 'Handover and documentation' },
      ],
      exampleTitle: 'Typical result',
      exampleText: 'The result is a live system with clear structure, tested functionality and understandable handover. No loose ends and no unclear ownership.',
      metaDesc: 'Implementation of digital solutions until go-live – design, development, testing, deployment and handover from one source.',
    },
  },
  {
    slug: 'wartung-weiterentwicklung', iconKey: 'GraduationCap', color: '#a8b87a', colorMuted: '#a8b87a15',
    de: {
      title: 'Wartung & Weiterentwicklung', subtitle: 'Damit die Lösung langfristig trägt',
      intro: 'Nach dem Launch bleibt eine digitale Lösung lebendig. Ich unterstütze bei Betrieb, Updates, Sicherheit, Optimierung, neuen Funktionen und sinnvollen Erweiterungen – damit das System mit deinem Unternehmen wächst.',
      process: sharedProcessDe,
      deliverables: [
        { emoji: '🔐', text: 'Updates, Sicherheit und Pflege' },
        { emoji: '📈', text: 'Optimierung nach Nutzung und Feedback' },
        { emoji: '➕', text: 'Neue Funktionen und Erweiterungen' },
        { emoji: '🤝', text: 'Langfristige technische Begleitung' },
      ],
      exampleTitle: 'Typisches Ergebnis',
      exampleText: 'Die Lösung bleibt stabil, aktuell und ausbaufähig. Neue Anforderungen werden nicht improvisiert, sondern sauber in das bestehende System integriert.',
      metaDesc: 'Wartung und Weiterentwicklung für Websites, CRM und ERP – Updates, Sicherheit, Optimierung und langfristige technische Begleitung.',
    },
    en: {
      title: 'Maintenance & evolution', subtitle: 'So the solution lasts long term',
      intro: 'After launch, a digital solution keeps evolving. I support operation, updates, security, optimization, new features and useful extensions so the system grows with your company.',
      process: sharedProcessEn,
      deliverables: [
        { emoji: '🔐', text: 'Updates, security and care' },
        { emoji: '📈', text: 'Optimization based on use and feedback' },
        { emoji: '➕', text: 'New features and extensions' },
        { emoji: '🤝', text: 'Long-term technical support' },
      ],
      exampleTitle: 'Typical result',
      exampleText: 'The solution stays stable, current and expandable. New requirements are not improvised but cleanly integrated into the existing system.',
      metaDesc: 'Maintenance and evolution for websites, CRM and ERP – updates, security, optimization and long-term technical support.',
    },
  },
];

export function getService(slug: string): ServiceData | undefined {
  return SERVICES.find(s => s.slug === slug);
}

export function getServiceTranslation(s: ServiceData, lang: Lang): ServiceTranslation {
  return lang === 'en' ? s.en : s.de;
}
