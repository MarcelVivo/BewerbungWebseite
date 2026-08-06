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
  { title: 'Wir klären das Problem.', desc: 'Wir besprechen gemeinsam das Ziel, den Rahmen und die Stellen, die im Alltag wirklich Zeit kosten.' },
  { title: 'Ich plane die Lösung.', desc: 'Ich lege Struktur, Funktionen, Daten, Gestaltung und sinnvolle Etappen fest.' },
  { title: 'Ich setze sie um und teste sie.', desc: 'Ich entwickle die Lösung, prüfe alle wichtigen Abläufe und dokumentiere sie verständlich.' },
  { title: 'Wir führen sie ein.', desc: 'Ich begleite die Einführung und sorge dafür, dass das System sicher gepflegt und erweitert werden kann.' },
];

const sharedProcessEn = [
  { title: 'We clarify the problem.', desc: 'We discuss the goal, the scope and the parts of daily work that genuinely take time.' },
  { title: 'I plan the solution.', desc: 'I define the structure, functions, data, design and practical stages.' },
  { title: 'I build and test it.', desc: 'I develop the solution, check every important process and document it clearly.' },
  { title: 'We introduce it.', desc: 'I support the introduction and make sure the system can be maintained and extended safely.' },
];

export const SERVICES: ServiceData[] = [
  {
    slug: 'corporate-design', iconKey: 'Lightbulb', color: '#c89a3d', colorMuted: '#c89a3d15',
    de: {
      title: 'Corporate Design und Markenauftritt', subtitle: 'Ich gebe deinem Unternehmen einen klaren und passenden Auftritt.',
      intro: 'Ich entwickle Logo, Farben, Typografie, Bilder und digitale Anwendungen gemeinsam. So entsteht ein Auftritt, der zu deinem Unternehmen passt und auf der Website, in Dokumenten und in deinen Systemen gleich erkennbar bleibt.',
      process: sharedProcessDe,
      deliverables: [
        { emoji: '🎨', text: 'Ich entwickle Logo und Stilrichtung.' },
        { emoji: '🧭', text: 'Ich definiere Farben, Schriften und Gestaltungsregeln.' },
        { emoji: '📄', text: 'Du erhältst Vorlagen für deine digitale Kommunikation.' },
        { emoji: '🌐', text: 'Ich übertrage den Auftritt auf Website und Systeme.' },
      ],
      exampleTitle: 'Typisches Ergebnis',
      exampleText: 'Aus unterschiedlichen Logos, Farben und Dokumenten wird ein gemeinsamer Auftritt. Kunden erkennen dein Unternehmen wieder und verstehen schneller, was du anbietest.',
      metaDesc: 'Ich entwickle Corporate Design und Markenauftritte für KMU, von Logo und Gestaltung bis zur Anwendung auf Website und Dokumenten.',
    },
    en: {
      title: 'Corporate design and brand presence', subtitle: 'I give your business a clear and suitable appearance.',
      intro: 'I develop the logo, colours, typography, images and digital applications together. The result fits your business and remains recognisable across the website, documents and systems.',
      process: sharedProcessEn,
      deliverables: [
        { emoji: '🎨', text: 'I develop the logo and visual direction.' },
        { emoji: '🧭', text: 'I define colours, typography and design rules.' },
        { emoji: '📄', text: 'You receive templates for digital communication.' },
        { emoji: '🌐', text: 'I apply the design to the website and systems.' },
      ],
      exampleTitle: 'Typical result',
      exampleText: 'Different logos, colours and documents become one consistent appearance. Customers recognise your business and understand your offer more quickly.',
      metaDesc: 'I develop corporate design and brand identities for SMEs, from the logo and visual style to the website and documents.',
    },
  },
  {
    slug: '2d-3d-websites', iconKey: 'Globe', color: '#4d7fbf', colorMuted: '#4d7fbf15',
    de: {
      title: 'Moderne 2D- und 3D-Websites', subtitle: 'Ich entwickle eine Website, die gut aussieht und zuverlässig funktioniert.',
      intro: 'Ich gestalte und entwickle Websites passend zum Unternehmen. Inhalte, Bedienung, Animationen und Technik plane ich gemeinsam, damit Besucher sich schnell zurechtfinden und die Seite auf jedem Gerät gut funktioniert.',
      process: sharedProcessDe,
      deliverables: [
        { emoji: '🧱', text: 'Ich plane Struktur und Bedienung.' },
        { emoji: '✨', text: 'Ich gestalte 2D- und 3D-Elemente und Animationen.' },
        { emoji: '⚡', text: 'Ich optimiere Ladezeit und Darstellung auf allen Geräten.' },
        { emoji: '🔎', text: 'Ich richte die Grundlagen für Suchmaschinen und Auswertung ein.' },
      ],
      exampleTitle: 'Typisches Ergebnis',
      exampleText: 'Besucher erkennen auf Anhieb, was das Unternehmen anbietet und wie sie Kontakt aufnehmen können. Die Website sieht eigenständig aus, lädt schnell und bleibt einfach zu bedienen.',
      metaDesc: 'Ich entwickle individuelle 2D- und 3D-Websites für KMU, mit klarer Bedienung, guten Ladezeiten und passender Gestaltung.',
    },
    en: {
      title: 'Modern 2D and 3D websites', subtitle: 'I develop a website that looks good and works reliably.',
      intro: 'I design and develop websites to suit the business. I plan the content, controls, animation and technology together so that visitors quickly find their way and the site works well on every device.',
      process: sharedProcessEn,
      deliverables: [
        { emoji: '🧱', text: 'I plan the structure and controls.' },
        { emoji: '✨', text: 'I design 2D and 3D elements and animation.' },
        { emoji: '⚡', text: 'I improve loading times and the layout on every device.' },
        { emoji: '🔎', text: 'I set up the foundations for search engines and analytics.' },
      ],
      exampleTitle: 'Typical result',
      exampleText: 'Visitors immediately understand what the business offers and how to get in touch. The website looks distinctive, loads quickly and remains easy to use.',
      metaDesc: 'I develop custom 2D and 3D websites for SMEs, with clear controls, good loading times and a design that suits the business.',
    },
  },
  {
    slug: 'crm-loesungen', iconKey: 'BarChart3', color: '#a6425c', colorMuted: '#a6425c15',
    de: {
      title: 'CRM-Lösungen', subtitle: 'Ich ordne Kunden, Anfragen und Aufgaben an einem Ort.',
      intro: 'Ich baue ein CRM, das zu deinem Arbeitsablauf passt. Kontakte, Anfragen, Aufgaben, Dokumente, Erinnerungen und Nachrichten sind an einem Ort und dein Team findet schnell, was als Nächstes zu tun ist.',
      process: sharedProcessDe,
      deliverables: [
        { emoji: '👥', text: 'Ich ordne Kontakte und Kunden.' },
        { emoji: '📌', text: 'Ich richte Aufgaben, Schritte und Erinnerungen ein.' },
        { emoji: '📁', text: 'Dokumente und Notizen bleiben beim richtigen Kunden.' },
        { emoji: '🔐', text: 'Ich vergebe Rollen und sichere Zugriffsrechte.' },
      ],
      exampleTitle: 'Typisches Ergebnis',
      exampleText: 'Anfragen, Kundenstände und nächste Schritte liegen nicht mehr verteilt in E-Mails und Listen. Das Team sieht an einem Ort, was offen ist, und wichtige Aufgaben gehen nicht verloren.',
      metaDesc: 'Ich entwickle CRM-Lösungen für KMU, damit Kunden, Anfragen, Aufgaben, Dokumente und Zugriffe verständlich geordnet sind.',
    },
    en: {
      title: 'CRM solutions', subtitle: 'I organise customers, enquiries and tasks in one place.',
      intro: 'I build a CRM that fits your way of working. Contacts, enquiries, tasks, documents, reminders and messages are kept in one place, and your team can quickly see what needs to happen next.',
      process: sharedProcessEn,
      deliverables: [
        { emoji: '👥', text: 'I organise contacts and customers.' },
        { emoji: '📌', text: 'I set up tasks, stages and reminders.' },
        { emoji: '📁', text: 'Documents and notes stay with the right customer.' },
        { emoji: '🔐', text: 'I assign roles and secure access rights.' },
      ],
      exampleTitle: 'Typical result',
      exampleText: 'Enquiries, customer status and next steps are no longer spread across emails and lists. The team sees what is open in one place, and important tasks are not missed.',
      metaDesc: 'I develop CRM solutions for SMEs so that customers, enquiries, tasks, documents and access rights are clearly organised.',
    },
  },
  {
    slug: 'erp-prozesse', iconKey: 'Workflow', color: '#6a263b', colorMuted: '#6a263b15',
    de: {
      title: 'ERP und Geschäftsprozesse', subtitle: 'Ich verbinde deine täglichen Abläufe in einem System.',
      intro: 'Ich entwickle Systeme für Projekte, Offerten, Rechnungen, Verträge, Termine, Zeiterfassung, Lager und interne Freigaben. Daten werden nur einmal erfasst und stehen danach an der richtigen Stelle wieder zur Verfügung.',
      process: sharedProcessDe,
      deliverables: [
        { emoji: '🗂️', text: 'Ich ordne Abläufe und Daten.' },
        { emoji: '🧾', text: 'Ich entwickle die benötigten Arbeitsbereiche.' },
        { emoji: '🔄', text: 'Ich automatisiere passende Schritte und Statuswechsel.' },
        { emoji: '📊', text: 'Du erhältst verständliche Übersichten und Auswertungen.' },
      ],
      exampleTitle: 'Typisches Ergebnis',
      exampleText: 'Ein Ablauf mit Excel, E-Mail und wiederholtem Abtippen wird in einem System abgebildet. Informationen werden einmal erfasst und bei jedem weiteren Schritt wiederverwendet.',
      metaDesc: 'Ich entwickle ERP- und Prozesslösungen für KMU und digitalisiere Projekte, Rechnungen, Verträge, Termine und interne Abläufe.',
    },
    en: {
      title: 'ERP and business processes', subtitle: 'I connect your daily processes in one system.',
      intro: 'I develop systems for projects, quotes, invoices, contracts, appointments, time tracking, stock and internal approvals. Data is entered once and is then available again in the right place.',
      process: sharedProcessEn,
      deliverables: [
        { emoji: '🗂️', text: 'I organise processes and data.' },
        { emoji: '🧾', text: 'I develop the required work areas.' },
        { emoji: '🔄', text: 'I automate suitable steps and status changes.' },
        { emoji: '📊', text: 'You receive clear overviews and reports.' },
      ],
      exampleTitle: 'Typical result',
      exampleText: 'A process built around Excel, email and repeated typing is moved into one system. Information is entered once and reused at every later step.',
      metaDesc: 'I develop ERP and process solutions for SMEs and digitise projects, invoices, contracts, appointments and internal work.',
    },
  },
  {
    slug: 'datenbanken-schnittstellen', iconKey: 'FolderKanban', color: '#4d7fbf', colorMuted: '#4d7fbf15',
    de: {
      title: 'Datenbanken und Schnittstellen', subtitle: 'Ich speichere und verbinde deine Daten verlässlich.',
      intro: 'Ich plane Datenbanken mit verständlichen Strukturen, sicheren Zugriffen, passenden Rollen und regelmässigen Sicherungen. Bestehende Programme verbinde ich so, dass Informationen nicht mehrfach gepflegt werden müssen.',
      process: sharedProcessDe,
      deliverables: [
        { emoji: '🧬', text: 'Ich strukturiere Daten und Tabellen.' },
        { emoji: '🔌', text: 'Ich verbinde vorhandene Programme.' },
        { emoji: '🛡️', text: 'Ich richte Rechte, Sicherheit und Sicherungen ein.' },
        { emoji: '📈', text: 'Ich schaffe die Grundlage für Auswertungen und Automationen.' },
      ],
      exampleTitle: 'Typisches Ergebnis',
      exampleText: 'Kunden, Projekte, Dokumente und Bearbeitungsstände werden verständlich gespeichert. Website, CRM und interne Abläufe greifen auf die gleichen aktuellen Daten zu.',
      metaDesc: 'Ich entwickle Datenbanken und Schnittstellen für Websites, CRM und ERP, mit klaren Strukturen, sicheren Zugriffen und verlässlichen Sicherungen.',
    },
    en: {
      title: 'Databases and integrations', subtitle: 'I store and connect your data reliably.',
      intro: 'I plan databases with clear structures, secure access, suitable roles and regular backups. I connect existing programs so that information does not have to be maintained several times.',
      process: sharedProcessEn,
      deliverables: [
        { emoji: '🧬', text: 'I structure data and tables.' },
        { emoji: '🔌', text: 'I connect existing programs.' },
        { emoji: '🛡️', text: 'I set up rights, security and backups.' },
        { emoji: '📈', text: 'I create the basis for reports and automation.' },
      ],
      exampleTitle: 'Typical result',
      exampleText: 'Customers, projects, documents and work stages are stored clearly. The website, CRM and internal processes use the same current data.',
      metaDesc: 'I develop databases and integrations for websites, CRM and ERP, with clear structures, secure access and reliable backups.',
    },
  },
  {
    slug: 'automatisierung-ki-agenten', iconKey: 'Bot', color: '#8ebef2', colorMuted: '#8ebef215',
    de: {
      title: 'KI Automation und KI Unterstützung', subtitle: 'Ich prüfe, wo KI dir tatsächlich Arbeit abnimmt.',
      intro: 'Nicht jede Aufgabe braucht KI. Ich schaue mir deine Arbeitsschritte an, vergleiche passende Werkzeuge und setze nur das um, was Zeit spart oder Fehler reduziert. Die Lösung bleibt verständlich und die wichtigen Entscheidungen bleiben bei deinem Team.',
      process: [
        { title: 'Wir prüfen den Nutzen.', desc: 'Wir klären, wo KI Zeit sparen, Fehler reduzieren oder vorhandenes Wissen leichter zugänglich machen kann.' },
        { title: 'Ich wähle die passende Lösung.', desc: 'Ich vergleiche Werkzeuge und Automationen nach Nutzen, Sicherheit und ihrer Eignung für den täglichen Einsatz.' },
        { title: 'Ich verbinde die Abläufe.', desc: 'Ich binde die KI an Website, CRM, Datenbank, E-Mail, Dokumente oder vorhandene Arbeitsschritte an.' },
        { title: 'Wir führen die Lösung ein.', desc: 'Ich teste und erkläre die Lösung, dokumentiere die Bedienung und verbessere sie anhand der tatsächlichen Nutzung.' },
      ],
      deliverables: [
        { emoji: '🧭', text: 'Du erhältst eine ehrliche Einschätzung und eine klare Empfehlung.' },
        { emoji: '🤖', text: 'Ich entwickle KI Assistenten und automatisierte Abläufe.' },
        { emoji: '📬', text: 'Ich verbinde E-Mail, Formulare, Dokumente und Daten.' },
        { emoji: '🔐', text: 'Ich integriere die Lösung sicher in bestehende Abläufe.' },
      ],
      exampleTitle: 'Typisches Ergebnis',
      exampleText: 'Ein KMU verbringt jeden Tag viel Zeit mit E-Mails, Dokumenten und Dateneingaben. Die Lösung ordnet neue Anfragen, bereitet Antworten vor, speichert Angaben im CRM und erstellt Folgeaufgaben. Das Team prüft das Ergebnis und entscheidet selbst.',
      metaDesc: 'Ich entwickle KI Automationen für KMU, prüfe den konkreten Nutzen und binde die passende Lösung sicher in bestehende Abläufe ein.',
    },
    en: {
      title: 'AI automation and AI support', subtitle: 'I check where AI can genuinely reduce your workload.',
      intro: 'Not every task needs AI. I review your work, compare suitable tools and only implement what saves time or reduces mistakes. The solution remains understandable and your team keeps control of important decisions.',
      process: [
        { title: 'We check the benefit.', desc: 'We clarify where AI can save time, reduce mistakes or make existing knowledge easier to use.' },
        { title: 'I choose the right solution.', desc: 'I compare tools and automation according to benefit, security and suitability for daily use.' },
        { title: 'I connect the processes.', desc: 'I connect the AI to the website, CRM, database, email, documents or existing work.' },
        { title: 'We introduce the solution.', desc: 'I test and explain the solution, document its use and improve it based on actual experience.' },
      ],
      deliverables: [
        { emoji: '🧭', text: 'You receive an honest assessment and a clear recommendation.' },
        { emoji: '🤖', text: 'I develop AI assistants and automated processes.' },
        { emoji: '📬', text: 'I connect email, forms, documents and data.' },
        { emoji: '🔐', text: 'I integrate the solution safely into existing work.' },
      ],
      exampleTitle: 'Typical result',
      exampleText: 'An SME spends a lot of time each day on emails, documents and data entry. The solution sorts new enquiries, prepares replies, stores details in the CRM and creates follow-up tasks. The team checks the result and makes the decision.',
      metaDesc: 'I develop AI automation for SMEs, assess the practical benefit and connect the right solution safely to existing processes.',
    },
  },
  {
    slug: 'analyse-konzept', iconKey: 'BarChart3', color: '#a6425c', colorMuted: '#a6425c15',
    de: {
      title: 'Analyse und Konzept', subtitle: 'Ich verstehe zuerst das Problem und plane danach die Lösung.',
      intro: 'Bevor ich Code schreibe oder ein Werkzeug auswähle, schaue ich mir die Ausgangslage genau an. Danach erhältst du einen verständlichen Plan mit Prioritäten, Etappen, offenen Fragen und einer realistischen Einschätzung.',
      process: sharedProcessDe,
      deliverables: [
        { emoji: '🔍', text: 'Wir halten Problem und Ziel verständlich fest.' },
        { emoji: '🧭', text: 'Ich erstelle einen Plan für die Lösung.' },
        { emoji: '📌', text: 'Wir ordnen die Anforderungen nach Wichtigkeit.' },
        { emoji: '🧪', text: 'Ich prüfe Machbarkeit und Risiken.' },
      ],
      exampleTitle: 'Typisches Ergebnis',
      exampleText: 'Aus einer ersten Idee wird ein Plan, den alle Beteiligten verstehen. Er zeigt, was gebaut wird, weshalb es gebraucht wird, was zuerst kommt und woran wir ein gutes Ergebnis erkennen.',
      metaDesc: 'Ich analysiere digitale Vorhaben und erstelle verständliche Konzepte mit Anforderungen, Prioritäten, Etappen und einer Einschätzung der Machbarkeit.',
    },
    en: {
      title: 'Analysis and concept', subtitle: 'I understand the problem first and then plan the solution.',
      intro: 'Before I write code or choose a tool, I take a close look at the starting point. You then receive a clear plan with priorities, stages, open questions and a realistic assessment.',
      process: sharedProcessEn,
      deliverables: [
        { emoji: '🔍', text: 'We describe the problem and the goal clearly.' },
        { emoji: '🧭', text: 'I create a plan for the solution.' },
        { emoji: '📌', text: 'We order the requirements by importance.' },
        { emoji: '🧪', text: 'I assess feasibility and risks.' },
      ],
      exampleTitle: 'Typical result',
      exampleText: 'An initial idea becomes a plan that everyone involved can understand. It shows what will be built, why it is needed, what comes first and how we will recognise a good result.',
      metaDesc: 'I analyse digital projects and create clear concepts with requirements, priorities, stages and an assessment of feasibility.',
    },
  },
  {
    slug: 'go-live-umsetzung', iconKey: 'FolderKanban', color: '#c89a3d', colorMuted: '#c89a3d15',
    de: {
      title: 'Umsetzung bis zur Einführung', subtitle: 'Ich entwickle, prüfe und übergebe eine fertige Lösung.',
      intro: 'Ich kümmere mich um Gestaltung, Entwicklung, Inhalte, Tests, Veröffentlichung, Übergabe und Dokumentation. Am Ende erhältst du kein unfertiges Versuchssystem, sondern eine Lösung, mit der dein Team arbeiten kann.',
      process: sharedProcessDe,
      deliverables: [
        { emoji: '🛠️', text: 'Ich entwickle die Website oder das System.' },
        { emoji: '✅', text: 'Ich teste Funktionen und wichtige Abläufe.' },
        { emoji: '🚀', text: 'Ich veröffentliche die fertige Lösung.' },
        { emoji: '📚', text: 'Du erhältst eine verständliche Übergabe und Dokumentation.' },
      ],
      exampleTitle: 'Typisches Ergebnis',
      exampleText: 'Das fertige System ist veröffentlicht, die wichtigen Funktionen sind geprüft und dein Team weiss, wie es damit arbeitet. Ich halte fest, was eingerichtet wurde und wie es gepflegt wird.',
      metaDesc: 'Ich setze digitale Lösungen bis zur Einführung um und übernehme Gestaltung, Entwicklung, Tests, Veröffentlichung und Übergabe persönlich.',
    },
    en: {
      title: 'Implementation through introduction', subtitle: 'I develop, test and hand over a finished solution.',
      intro: 'I take care of design, development, content, testing, publication, handover and documentation. You do not receive an unfinished trial system. You receive a solution that your team can use.',
      process: sharedProcessEn,
      deliverables: [
        { emoji: '🛠️', text: 'I develop the website or system.' },
        { emoji: '✅', text: 'I test functions and important processes.' },
        { emoji: '🚀', text: 'I publish the finished solution.' },
        { emoji: '📚', text: 'You receive a clear handover and documentation.' },
      ],
      exampleTitle: 'Typical result',
      exampleText: 'The finished system is published, the important functions have been tested and your team knows how to use it. I record what was set up and how it should be maintained.',
      metaDesc: 'I implement digital solutions through introduction and personally handle design, development, testing, publication and handover.',
    },
  },
  {
    slug: 'wartung-weiterentwicklung', iconKey: 'GraduationCap', color: '#4d7fbf', colorMuted: '#4d7fbf15',
    de: {
      title: 'Wartung und Weiterentwicklung', subtitle: 'Ich halte deine Lösung aktuell und entwickle sie weiter.',
      intro: 'Nach der Veröffentlichung kümmere ich mich bei Bedarf um Betrieb, Aktualisierungen, Sicherheit und neue Funktionen. Änderungen werden geplant und passend in das bestehende System eingebaut.',
      process: sharedProcessDe,
      deliverables: [
        { emoji: '🔐', text: 'Ich kümmere mich um Aktualisierungen, Sicherheit und Pflege.' },
        { emoji: '📈', text: 'Ich verbessere die Lösung anhand von Nutzung und Rückmeldungen.' },
        { emoji: '➕', text: 'Ich ergänze neue Funktionen.' },
        { emoji: '🤝', text: 'Ich bleibe dein technischer Ansprechpartner.' },
      ],
      exampleTitle: 'Typisches Ergebnis',
      exampleText: 'Die Lösung bleibt sicher und aktuell. Wenn neue Anforderungen entstehen, prüfe ich zuerst die Auswirkungen und baue die Erweiterung danach in das vorhandene System ein.',
      metaDesc: 'Ich warte und entwickle Websites, CRM und ERP weiter und kümmere mich um Aktualisierungen, Sicherheit und neue Funktionen.',
    },
    en: {
      title: 'Maintenance and further development', subtitle: 'I keep your solution current and continue to improve it.',
      intro: 'After publication, I can take care of operation, updates, security and new functions. Changes are planned and added to the existing system in a suitable way.',
      process: sharedProcessEn,
      deliverables: [
        { emoji: '🔐', text: 'I take care of updates, security and maintenance.' },
        { emoji: '📈', text: 'I improve the solution based on use and feedback.' },
        { emoji: '➕', text: 'I add new functions.' },
        { emoji: '🤝', text: 'I remain your technical contact.' },
      ],
      exampleTitle: 'Typical result',
      exampleText: 'The solution remains secure and current. When new requirements arise, I first check their impact and then add the change to the existing system.',
      metaDesc: 'I maintain and develop websites, CRM and ERP and take care of updates, security and new functions.',
    },
  },
];

export function getService(slug: string): ServiceData | undefined {
  return SERVICES.find(s => s.slug === slug);
}

export function getServiceTranslation(s: ServiceData, lang: Lang): ServiceTranslation {
  return lang === 'en' ? s.en : s.de;
}
