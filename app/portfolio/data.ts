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
  facts?: Array<{ value: string; label: string }>;
  systemEyebrow?: string;
  systemTitle?: string;
  systemIntro?: string;
  systemLayers?: Array<{ title: string; description: string; items: string[] }>;
  rolesTitle?: string;
  rolesIntro?: string;
  roles?: string[];
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
      tagline: 'Eine komplette Immobilienmarke mit live geschalteter Website und eigener digitaler Verwaltungsplattform.',
      role: 'Alleinverantwortlich von A–Z: Strategie, Branding, UX/UI, Frontend, Backend, Datenbank, Testing und Go-live',
      status: 'Website vollständig live · Verwaltungsportal in Testphase · seit 01.07.2026',
      metaDesc: 'VeraHome: vollständige Immobilien-Website mit Branding, UX/UI, CRM-/ERP-Verwaltung, Kundenportal, Datenbank und digitalen Immobilienprozessen.',
      challenge: 'VeraHome startete als komplette Neugründung – ohne bestehende Marke, Website oder interne Systemlandschaft. Neben einem professionellen Marktauftritt musste deshalb gleichzeitig eine verlässliche digitale Betriebsgrundlage für Objekte, Inserate, Kontakte, Termine, Dokumente, Schäden, Rechnungen und wiederkehrende Verwaltungsabläufe entstehen.',
      approach: 'Ich konzipierte VeraHome nicht als Website mit nachgelagerten Einzellösungen, sondern als ein verbundenes digitales Produkt. Markenidentität, Nutzerführung, öffentliche Website, Datenmodell, Rollen- und Berechtigungskonzept, CRM-/ERP-Funktionen sowie das geschützte Portal wurden gemeinsam geplant und von mir vollständig umgesetzt. Dadurch greifen öffentliche Kommunikation und interne Verwaltung auf eine konsistente Struktur zurück.',
      result: 'Die zweisprachige öffentliche Website ist vollständig live. Parallel steht eine umfangreiche, rollenbasierte Verwaltungsplattform mit sämtlichen vorgesehenen Modulen zur Verfügung und wird aktuell getestet. Da das Projekt erst am 1. Juli 2026 begonnen hat, werden noch keine nicht belegten Effizienzkennzahlen ausgewiesen; der Case zeigt stattdessen transparent den real umgesetzten Funktionsumfang und Entwicklungsstand.',
      points: [
        'Strategie, Branding, Corporate Design und vollständige UX/UI-Konzeption',
        'Responsive, zweisprachige Immobilien-Website mit Leistungs- und Objektseiten',
        'Individuelles CRM-/ERP-System mit PostgreSQL-Datenbank, Rollen und Berechtigungen',
        'Objekte, Einheiten, Inserate, Mietverhältnisse und Eigentümerschaften',
        'Kontakte, Kalender, Dokumente, Rechnungen, Nachrichten und Rapporte',
        'Schadensmeldungen, Aufträge, Archiv, Formulare und Serviceabläufe',
        'Zentrales Audit-Protokoll für Sicherheit und Nachvollziehbarkeit',
      ],
      facts: [
        { value: '01.07.2026', label: 'Projektstart' },
        { value: '100 % live', label: 'Öffentliche Website' },
        { value: 'Testphase', label: 'Verwaltungsportal' },
        { value: 'A–Z', label: 'Meine Verantwortung' },
      ],
      systemEyebrow: 'TECHNISCHE ARCHITEKTUR',
      systemTitle: 'Ein System statt getrennter Einzellösungen',
      systemIntro: 'VeraHome verbindet den öffentlichen Markenauftritt mit den operativen Immobilienprozessen und einer abgesicherten Datenbasis. Alle Ebenen wurden aufeinander abgestimmt und für die laufende Weiterentwicklung vorbereitet.',
      systemLayers: [
        {
          title: 'Marke & öffentliche Website',
          description: 'Der vollständig live geschaltete Auftritt macht Angebot, Objekte und Unternehmen zweisprachig zugänglich.',
          items: ['HTML, CSS und JavaScript', 'Three.js und GSAP', 'Responsive DE/EN-Nutzerführung', 'Leistungen, Objekte, Formulare und Downloads'],
        },
        {
          title: 'CRM-/ERP-Portal',
          description: 'Die interne Webanwendung bündelt Stammdaten, Immobilienverwaltung, Kommunikation und operative Abläufe.',
          items: ['Objekte, Einheiten und Inserate', 'Kontakte, Rollen und Mietverhältnisse', 'Kalender, Dokumente und Rechnungen', 'Schäden, Aufträge, Nachrichten und Audit-Protokoll'],
        },
        {
          title: 'Daten, Sicherheit & Dienste',
          description: 'Supabase bildet die technische Grundlage für Authentifizierung, Daten, Dateien und serverseitige Prozesse.',
          items: ['PostgreSQL-Datenmodell', 'Supabase Auth und rollenbasierte Zugriffe', 'Row Level Security und private Storage-Bereiche', 'Edge Functions, E-Mail-Prozesse und Capacitor-iOS-Testhülle'],
        },
      ],
      rolesTitle: 'Für reale Immobilienbeziehungen modelliert',
      rolesIntro: 'Rechte, Informationen und Abläufe werden passend zur jeweiligen Verantwortung gesteuert – nicht über eine gemeinsame, unübersichtliche Standardansicht.',
      roles: ['Administration', 'Mitarbeitende', 'Eigentümer', 'Mieter', 'Hauswarte', 'Handwerker', 'Partner', 'Interessenten'],
    },
    en: {
      title: 'VeraHome',
      tag: 'Web platform · CRM/ERP',
      tagline: 'A complete real-estate brand with a fully live website and its own digital administration platform.',
      role: 'Sole end-to-end responsibility: strategy, branding, UX/UI, frontend, backend, database, testing and go-live',
      status: 'Website fully live · Administration portal in testing · since 1 July 2026',
      metaDesc: 'VeraHome: complete real-estate website with branding, UX/UI, CRM/ERP administration, customer portal, database and digital property workflows.',
      challenge: 'VeraHome began as a complete new venture, without an existing brand, website or internal system landscape. Alongside a professional market presence, it needed a dependable digital operating foundation for properties, listings, contacts, appointments, documents, incidents, invoices and recurring administration workflows.',
      approach: 'I conceived VeraHome not as a website followed by disconnected tools, but as one connected digital product. Brand identity, user experience, public website, data model, roles and permissions, CRM/ERP functions and the protected portal were planned together and fully implemented by me. Public communication and internal administration therefore share one consistent structure.',
      result: 'The bilingual public website is fully live. In parallel, an extensive role-based administration platform containing all planned modules is available and currently being tested. Since the project only began on 1 July 2026, no unverified efficiency metrics are presented; the case instead shows the real implemented scope and current delivery status transparently.',
      points: [
        'Strategy, branding, corporate design and complete UX/UI conception',
        'Responsive bilingual real-estate website with service and property pages',
        'Custom CRM/ERP system with PostgreSQL database, roles and permissions',
        'Properties, units, listings, tenancies and ownership relationships',
        'Contacts, calendar, documents, invoices, messages and reports',
        'Incident reports, assignments, archive, forms and service workflows',
        'Central audit trail for security and accountability',
      ],
      facts: [
        { value: '1 Jul 2026', label: 'Project start' },
        { value: '100% live', label: 'Public website' },
        { value: 'Testing', label: 'Administration portal' },
        { value: 'End to end', label: 'My responsibility' },
      ],
      systemEyebrow: 'TECHNICAL ARCHITECTURE',
      systemTitle: 'One system instead of disconnected tools',
      systemIntro: 'VeraHome connects its public brand presence with operational real-estate workflows and a secured data foundation. Every layer was designed to work together and support continued development.',
      systemLayers: [
        {
          title: 'Brand & public website',
          description: 'The fully live public presence makes the company, its services and properties available in two languages.',
          items: ['HTML, CSS and JavaScript', 'Three.js and GSAP', 'Responsive DE/EN user journey', 'Services, properties, forms and downloads'],
        },
        {
          title: 'CRM/ERP portal',
          description: 'The internal web application brings master data, property management, communication and daily operations together.',
          items: ['Properties, units and listings', 'Contacts, roles and tenancies', 'Calendar, documents and invoices', 'Incidents, assignments, messages and audit trail'],
        },
        {
          title: 'Data, security & services',
          description: 'Supabase provides the technical foundation for authentication, structured data, files and server-side processes.',
          items: ['PostgreSQL data model', 'Supabase Auth and role-based access', 'Row Level Security and private storage areas', 'Edge Functions, email workflows and Capacitor iOS test wrapper'],
        },
      ],
      rolesTitle: 'Modelled around real property relationships',
      rolesIntro: 'Permissions, information and workflows are tailored to each responsibility instead of being forced into one shared, cluttered standard view.',
      roles: ['Administration', 'Employees', 'Owners', 'Tenants', 'Caretakers', 'Contractors', 'Partners', 'Prospects'],
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
  {
    slug: 'gigibeauty',
    color: '#e25566',
    colorRgb: '226,85,102',
    image: '/references/gigibeauty.png',
    externalUrl: 'https://marcelvivo.github.io/GigiBeauty/',
    de: {
      title: 'GiGi Beauty',
      tag: '3D-Website · Beauty',
      tagline: 'Eine immersive, scrollgesteuerte Markenwelt für ein Kosmetikstudio in Bern.',
      role: 'A–Z: Konzeption, Design, 3D, UX/UI, Entwicklung, Inhalte & SEO',
      status: 'Kundenprojekt · Testphase 2026',
      metaDesc: 'GiGi Beauty: immersive 3D-Website für ein Kosmetikstudio in Bern – vollständig konzipiert, gestaltet und entwickelt von Marcel Spahr.',
      challenge: 'GiGi Beauty benötigte für sein breites Behandlungsangebot einen Webauftritt, der nicht wie eine austauschbare Studio-Website wirkt. Die Persönlichkeit der Marke, ihre hochwertige Positionierung und die unterschiedlichen Leistungen sollten emotional erlebbar werden, ohne Orientierung, Information und Terminbuchung aus dem Blick zu verlieren.',
      approach: 'Im Auftrag der Inhaberin und Geschäftsführerin Liliane Serrano entwickelte ich die Website vollständig von A bis Z. Markeninszenierung, Informationsarchitektur, Art Direction, UX/UI, Inhalte, 3D-Objekte und technische Umsetzung entstanden als ein zusammenhängendes Erlebnis. Eine scrollgesteuerte Three.js-Szene führt durch Produkte und Behandlungswelten; mehrsprachige Inhalte, strukturierte Leistungsseiten, lokale Suchmaschinenoptimierung und klare Buchungswege ergänzen die Inszenierung.',
      result: 'Eine eigenständige 3D-Webpräsenz, die GiGi Beauty schon in der Testphase sichtbar von klassischen Beauty-Websites abhebt. Besucher entdecken das Angebot als räumliche Markenwelt und gelangen gleichzeitig strukturiert zu Leistungen, Preisen, Studioinformationen und Terminanfrage. Die öffentliche Testversion bildet die Grundlage für den finalen Livegang.',
      points: [
        'Vollständige Konzeption, Art Direction, Design und UX/UI aus einer Hand',
        'Individuelle 3D-Modelle und scrollgesteuerte Three.js-Inszenierung',
        'Partikel, Licht, Kameraführung und interaktive räumliche Markenwelt',
        'Strukturierte Leistungs-, Preis-, Studio- und Terminbereiche',
        'Mehrsprachige Nutzerführung und responsive Umsetzung',
        'Lokales SEO, strukturierte Daten, Social-Media-Metadaten und technische Optimierung',
      ],
    },
    en: {
      title: 'GiGi Beauty',
      tag: '3D website · Beauty',
      tagline: 'An immersive, scroll-driven brand world for a beauty studio in Bern.',
      role: 'A–Z: concept, design, 3D, UX/UI, development, content & SEO',
      status: 'Client project · Testing 2026',
      metaDesc: 'GiGi Beauty: immersive 3D website for a beauty studio in Bern, fully conceived, designed and developed by Marcel Spahr.',
      challenge: 'GiGi Beauty needed a digital presence for its broad treatment portfolio that would not feel like an interchangeable studio website. The personality and premium positioning of the brand had to become emotionally tangible while preserving clear orientation, service information and a direct path to booking.',
      approach: 'Commissioned by owner and managing director Liliane Serrano, I developed the website completely from A to Z. Brand staging, information architecture, art direction, UX/UI, content, 3D objects and technical implementation were conceived as one connected experience. A scroll-driven Three.js scene guides visitors through products and treatment worlds, supported by multilingual content, structured service pages, local SEO and clear booking paths.',
      result: 'A distinctive 3D web presence that already sets GiGi Beauty apart from conventional beauty websites during testing. Visitors explore the offer as a spatial brand world while retaining structured access to treatments, pricing, studio information and appointment requests. The public test version provides the foundation for the final launch.',
      points: [
        'Complete concept, art direction, design and UX/UI from a single source',
        'Custom 3D models and scroll-driven Three.js staging',
        'Particles, lighting, camera direction and an interactive spatial brand world',
        'Structured service, pricing, studio and appointment sections',
        'Multilingual user journey and responsive implementation',
        'Local SEO, structured data, social metadata and technical optimization',
      ],
    },
  },
];

export function getProject(slug: string): Project | null {
  return PROJECTS.find((project) => project.slug === slug) ?? null;
}
