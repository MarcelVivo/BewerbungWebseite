export type Lang = 'de' | 'en';

export type ProjectLang = {
  title: string;
  tag: string;
  tagline: string;
  role: string;
  status: string;
  challenge: string;
  approach: string;
  result: string;
  points: string[];
  metaDesc: string;
};

export type Project = {
  slug: string;
  color: string;
  colorRgb: string;
  image: string;
  externalUrl?: string;
  documentUrl?: string;
  gallery?: Array<{
    image: string;
    de: { title: string; description: string };
    en: { title: string; description: string };
  }>;
  de: ProjectLang;
  en: ProjectLang;
};

export const PROJECTS: Project[] = [
  {
    slug: 'verahome',
    color: '#d7b85b',
    colorRgb: '215,184,91',
    image: '/references/verahome.jpg',
    externalUrl: 'https://www.verahome.ch',
    gallery: [
      {
        image: '/references/verahome-portal/properties-anonymized.png',
        de: {
          title: 'Objektstruktur & Berechtigungen',
          description: 'Liegenschaften, Einheiten, Rollen, Dokumente und operative Schritte werden in einer gemeinsamen, nachvollziehbaren Struktur geführt.',
        },
        en: {
          title: 'Property structure & permissions',
          description: 'Properties, units, roles, documents and operational next steps are managed in one consistent, traceable structure.',
        },
      },
      {
        image: '/references/verahome-portal/contacts-anonymized.png',
        de: {
          title: 'Kontakte & Rollen',
          description: 'Mieter, Eigentümer, Partner, Handwerker und weitere Beteiligte lassen sich nach Rolle verwalten und gezielt in Abläufe einbinden.',
        },
        en: {
          title: 'Contacts & roles',
          description: 'Tenants, owners, partners, contractors and other stakeholders can be managed by role and connected to relevant workflows.',
        },
      },
      {
        image: '/references/verahome-portal/calendar-anonymized.png',
        de: {
          title: 'Kalender & Terminprozesse',
          description: 'Verfügbarkeiten, öffentliche Buchungen, interne Termine und Teilnehmer werden direkt im Portal koordiniert.',
        },
        en: {
          title: 'Calendar & appointment workflows',
          description: 'Availability, public bookings, internal appointments and participants are coordinated directly inside the portal.',
        },
      },
      {
        image: '/references/verahome-portal/documents-anonymized.png',
        de: {
          title: 'Dokumentenverwaltung',
          description: 'Ein eigener Dokumentenbereich verbindet Ordner, Vorschau, Zuweisung, Versand, Umbenennung und revisionssichere Archivierung.',
        },
        en: {
          title: 'Document management',
          description: 'A dedicated document workspace combines folders, previews, assignments, sharing, renaming and controlled archiving.',
        },
      },
      {
        image: '/references/verahome-portal/invoicing-anonymized.png',
        de: {
          title: 'Rechnungen & Buchhaltung',
          description: 'Rechnungspositionen, Empfänger, Auftragsbezug und Zahlungsinformationen werden in einem integrierten Ablauf zusammengeführt.',
        },
        en: {
          title: 'Invoicing & accounting',
          description: 'Invoice items, recipients, linked assignments and payment details come together in one integrated workflow.',
        },
      },
      {
        image: '/references/verahome-portal/audit-log-anonymized.png',
        de: {
          title: 'Protokoll & Nachvollziehbarkeit',
          description: 'Sensible Änderungen an Kontakten, Rollen, Objekten, Dokumenten und Einstellungen werden zentral protokolliert und exportierbar gemacht.',
        },
        en: {
          title: 'Audit trail & accountability',
          description: 'Sensitive changes to contacts, roles, properties, documents and settings are logged centrally and can be exported.',
        },
      },
    ],
    de: {
      title: 'VeraHome',
      tag: 'Webplattform · CRM/ERP',
      tagline: 'Immobilienmarke, Website und vollständige Verwaltungsplattform als verbundenes digitales System.',
      role: 'End-to-End: Strategie, Branding, UX/UI & Full-Stack-Entwicklung',
      status: 'Live · 2026',
      metaDesc: 'VeraHome: vollständige Immobilien-Website mit Branding, UX/UI, CRM-/ERP-Verwaltung, Kundenportal, Datenbank und digitalen Immobilienprozessen.',
      challenge: 'Für VeraHome sollte nicht nur ein hochwertiger Webauftritt entstehen. Das neue Immobilienunternehmen benötigte gleichzeitig eine verlässliche digitale Betriebsgrundlage für Objekte, Inserate, Termine, Dokumente, Schäden, Kunden und wiederkehrende Verwaltungsabläufe.',
      approach: 'Ich entwickelte das Projekt vollständig aus einer Hand: Strategie, Markenidentität, Design, UX, Frontend, Backend und Datenbank. Website, internes CRM-/ERP-System und geschütztes Portal wurden als ein zusammenhängendes Produkt geplant, damit öffentliche Kommunikation und tägliche Verwaltung auf derselben strukturierten Basis arbeiten.',
      result: 'Ein durchgängiges Immobiliensystem mit zweisprachiger Website, zentraler Verwaltung und digitalen Portalfunktionen für die Zusammenarbeit mit Mietern, Eigentümern und Interessenten. VeraHome kann Inhalte, Objekte und operative Abläufe in einer eigenen, erweiterbaren Plattform führen.',
      points: [
        'Strategie, Branding, Corporate Design und vollständige UX/UI-Konzeption',
        'Responsive, zweisprachige Immobilien-Website mit Leistungs- und Objektseiten',
        'Individuelles CRM-/ERP-System mit Datenbank, Rollen und Berechtigungen',
        'Objekterstellung, Inserataufschaltung und strukturierte Verwaltungsprozesse',
        'Kalender, Dokumente, Rechnungen, Nachrichten und digitales Portal',
        'Zentrales Änderungsprotokoll für Sicherheit und Nachvollziehbarkeit',
        'Schadensmeldungen, Formulare und weitere digitale Serviceabläufe',
      ],
    },
    en: {
      title: 'VeraHome',
      tag: 'Web platform · CRM/ERP',
      tagline: 'Real-estate brand, website and complete administration platform built as one connected digital system.',
      role: 'End to end: strategy, branding, UX/UI & full-stack development',
      status: 'Live · 2026',
      metaDesc: 'VeraHome: complete real-estate website with branding, UX/UI, CRM/ERP administration, customer portal, database and digital property workflows.',
      challenge: 'VeraHome needed more than a premium public website. The new real-estate company also required a dependable digital operating foundation for properties, listings, appointments, documents, incidents, customers and recurring administration workflows.',
      approach: 'I developed the project end to end: strategy, brand identity, design, UX, frontend, backend and database. The website, internal CRM/ERP system and protected portal were designed as one coherent product so public communication and daily administration share the same structured foundation.',
      result: 'An integrated real-estate system with a bilingual website, central administration and digital portal functions for collaborating with tenants, owners and prospects. VeraHome can manage content, properties and operational workflows in its own extensible platform.',
      points: [
        'Strategy, branding, corporate design and complete UX/UI conception',
        'Responsive bilingual real-estate website with service and property pages',
        'Custom CRM/ERP system with database, roles and permissions',
        'Property creation, listing publication and structured administration workflows',
        'Calendar, documents, invoices, messages and digital portal',
        'Central audit trail for security and accountability',
        'Incident reports, forms and additional digital service workflows',
      ],
    },
  },
  {
    slug: 'liquoda',
    color: '#8ebef2',
    colorRgb: '142,190,242',
    image: '/references/liquoda.jpg',
    externalUrl: 'https://www.liquoda.com',
    de: {
      title: 'Liquoda',
      tag: 'FinTech · Plattform',
      tagline: 'Eigenentwickelte Emittenten- und Investorenplattform für tokenisierte Investitionen in reale Projekte.',
      role: 'Erfinder, Eigentümer, Produktkonzeption & Full-Stack-Entwicklung',
      status: 'Eigenprodukt · Pre-Launch',
      metaDesc: 'Liquoda ist die von Marcel Spahr erfundene und entwickelte Schweizer Emittenten- und Investorenplattform für tokenisierte Investitionen in reale Projekte.',
      challenge: 'Kapitalsuchende Projekte und interessierte Investoren finden nur schwer einen direkten, verständlichen und digital strukturierten Zugang zueinander. Klassische Finanzierungswege sind oft langsam, während bestehende Investmentprodukte reale Projekte und technische Abläufe für Nutzer wenig greifbar machen.',
      approach: 'Als Erfinder und Eigentümer von Liquoda entwickelte ich Produktidee, Geschäftslogik, Marke, Nutzerführung und technische Plattform. Die zwei Perspektiven – Emittenten, die Projekte finanzieren möchten, und Investoren, die reale Vorhaben suchen – wurden in klar getrennte Rollen, Abläufe und Informationswege übersetzt.',
      result: 'Eine eigenständige Schweizer Plattformbasis, auf der reale Projekte digital vorgestellt und tokenisierte Beteiligungsprozesse strukturiert vorbereitet werden können. Liquoda befindet sich im Pre-Launch und öffnet aktuell die Vorregistrierung für Emittenten und Investoren.',
      points: [
        'Erfindung, Produktstrategie und vollständige Konzeption des Geschäftsmodells',
        'Branding, Informationsarchitektur und UX/UI für zwei Nutzergruppen',
        'Registrierungs- und Rollenlogik für Emittenten und Investoren',
        'Projekt-, Beteiligungs- und Informationsprozesse als digitale Plattform',
        'Mehrsprachige Webanwendung mit eigener technischen Architektur',
        'Pre-Launch-Kommunikation und Vorbereitung der Markteinführung',
      ],
    },
    en: {
      title: 'Liquoda',
      tag: 'FinTech · Platform',
      tagline: 'A proprietary issuer and investor platform for tokenized investments in real-world projects.',
      role: 'Inventor, owner, product conception & full-stack development',
      status: 'Own product · Pre-launch',
      metaDesc: 'Liquoda is the Swiss issuer and investor platform invented and developed by Marcel Spahr for tokenized investments in real-world projects.',
      challenge: 'Projects seeking capital and interested investors struggle to find a direct, understandable and digitally structured way to connect. Traditional financing routes are often slow, while existing investment products make real projects and technical processes difficult for users to grasp.',
      approach: 'As Liquoda’s inventor and owner, I developed the product idea, business logic, brand, user journey and technical platform. The two perspectives – issuers financing projects and investors looking for real opportunities – were translated into clearly separated roles, workflows and information paths.',
      result: 'An independent Swiss platform foundation where real projects can be presented digitally and tokenized participation processes can be prepared in a structured way. Liquoda is currently in pre-launch and accepting pre-registrations from issuers and investors.',
      points: [
        'Invention, product strategy and complete business-model conception',
        'Branding, information architecture and UX/UI for two user groups',
        'Registration and role logic for issuers and investors',
        'Project, participation and information workflows as a digital platform',
        'Multilingual web application with its own technical architecture',
        'Pre-launch communication and market-entry preparation',
      ],
    },
  },
  {
    slug: 'olivias-olivenpaste',
    color: '#b7b54e',
    colorRgb: '183,181,78',
    image: '/references/olivias-olivenpaste.jpg',
    documentUrl: '/assets/OliviasOlivenpaste_MarcelSpahr.pdf',
    de: {
      title: "Olivia's Olivenpaste",
      tag: 'Business Design · Studienarbeit',
      tagline: 'Von geerbten Olivenplantagen in Italien zum marktfähigen Schweizer Produktkonzept.',
      role: 'Business Design, Analyse & Prozesskonzeption',
      status: 'Praxisnahe Studienarbeit · 2023–2024',
      metaDesc: "Praxisnahe Studienarbeit für Olivia's Olivenpaste: Businessplan, Marktanalyse, Business Canvas sowie Import-, Verarbeitungs-, Vertriebs- und Marketingprozesse.",
      challenge: 'Ausgangspunkt war eine reale Situation: Ein Freund hatte Olivenplantagen in Italien geerbt und wollte die Oliven in die Schweiz importieren, verarbeiten und als Olivenpaste verkaufen. Dafür fehlte ein durchgängiges Geschäftsmodell, das Produkt, Prozesse, Markt und Wirtschaftlichkeit zusammenführt.',
      approach: 'Im Rahmen einer praxisnahen Studienarbeit entwickelte ich einen vollständigen Businessplan. Ich analysierte Markt und Zielgruppen, strukturierte Import und Verarbeitung, erarbeitete Business Canvas, SWOT, Positionierung, Markenidee, Vertriebswege, Marketing und die wirtschaftliche Machbarkeit.',
      result: 'Ein umfassender, nachvollziehbarer Bauplan für den möglichen Markteintritt: von der italienischen Plantage über Produktion und Logistik bis zur Positionierung und Vermarktung in der Schweiz. Die Arbeit macht Chancen, Risiken, benötigte Prozesse und nächste Umsetzungsschritte transparent.',
      points: [
        'Markt-, Wettbewerbs- und Zielgruppenanalyse für die Schweiz',
        'Geschäftsmodell, Business Canvas, SWOT und wirtschaftliche Machbarkeit',
        'Import-, Produktions-, Verarbeitungs- und Logistikprozesse',
        'Markenidee, Produktpositionierung und visuelles Grundkonzept',
        'Vertriebs-, Absatz-, Marketing- und Kommunikationsstrategie',
        'Vollständiger Businessplan auf Basis einer realen Ausgangssituation',
      ],
    },
    en: {
      title: "Olivia's Olive Paste",
      tag: 'Business design · Study project',
      tagline: 'Turning inherited olive groves in Italy into a market-ready Swiss product concept.',
      role: 'Business design, analysis & process conception',
      status: 'Practice-based study project · 2023–2024',
      metaDesc: "Practice-based study project for Olivia's Olive Paste: business plan, market analysis, Business Model Canvas and import, processing, sales and marketing workflows.",
      challenge: 'The project started from a real situation: a friend had inherited olive groves in Italy and wanted to import the olives into Switzerland, process them and sell them as olive paste. What was missing was an integrated business model connecting product, operations, market and viability.',
      approach: 'As part of a practice-based study project, I developed a complete business plan. I analyzed the market and target audiences, structured import and processing, and developed the Business Model Canvas, SWOT, positioning, brand idea, distribution, marketing and financial viability.',
      result: 'A comprehensive and traceable blueprint for a potential market entry: from the Italian groves through production and logistics to positioning and marketing in Switzerland. The work makes opportunities, risks, required processes and next implementation steps transparent.',
      points: [
        'Market, competitor and target-audience analysis for Switzerland',
        'Business model, Business Model Canvas, SWOT and financial viability',
        'Import, production, processing and logistics workflows',
        'Brand idea, product positioning and visual foundation',
        'Distribution, sales, marketing and communications strategy',
        'Complete business plan based on a real-world starting point',
      ],
    },
  },
];

export function getProject(slug: string): Project | null {
  return PROJECTS.find((project) => project.slug === slug) ?? null;
}
