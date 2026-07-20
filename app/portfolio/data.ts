export type Lang = 'de' | 'en';

export type ProjectLang = {
  title: string;
  tag: string;
  tagline: string;
  role: string;
  status: string;
  cardStatus?: string;
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
      cardStatus: 'Website live · Portal Testphase',
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
      cardStatus: 'Website live · Portal testing',
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
      tag: 'FinTech · Plattformkonzept',
      tagline: 'Validiertes Detailkonzept für eine tokenisierte Vermittlungsplattform zwischen Emittenten und Investoren.',
      role: 'Erfinder, Eigentümer, Business Analyse, Requirements Engineering & Produktkonzeption',
      status: 'Öffentliche Pre-Launch-Seite mit Vorregistrierung live · Plattform noch nicht entwickelt',
      cardStatus: 'Pre-Launch live · Konzeptphase',
      metaDesc: 'Liquoda: validiertes Detailkonzept und Anforderungsanalyse für eine tokenisierte Vermittlungsplattform, entwickelt als Diplomarbeit in Wirtschaftsinformatik HF.',
      challenge: 'Tokenisierte Investitionen in reale Vermögenswerte sind erklärungsbedürftig und stark von Vertrauen abhängig. Für Liquoda musste deshalb geklärt werden, welche funktionalen und nicht-funktionalen Anforderungen eine Vermittlungsplattform erfüllen muss, damit Emittenten und Investoren sie verstehen, ihr vertrauen und sie aktiv nutzen würden – ohne Liquoda selbst als Finanzintermediär zu positionieren.',
      approach: 'Ich entwickelte Liquoda als eigenes Produktvorhaben und untersuchte es in meiner Diplomarbeit «Detailkonzept und Anforderungsanalyse der tokenisierten Vermittlungsplattform LIQUODA». Nach IREB-orientiertem Requirements Engineering führte und analysierte ich neun Experten- und Stakeholder-Interviews, strukturierte die Interessen beider Nutzergruppen, untersuchte Vertrauensbarrieren und leitete daraus priorisierte funktionale und nicht-funktionale Anforderungen ab.',
      result: 'Entstanden sind ein validiertes Detailkonzept, ein priorisierter Anforderungskatalog und eine daraus abgeleitete MVP-Definition als belastbare Grundlage für die geplante Entwicklung. Aktuell live ist ausschliesslich die öffentliche Pre-Launch-Seite mit Vorregistrierung; die eigentliche Plattform ist noch nicht entwickelt und es bestehen noch keine Vorregistrierungen, Testnutzer oder Partner.',
      points: [
        'Eigene Produktidee, Geschäftsmodell und strategische Positionierung',
        'Neun Experten- und Stakeholder-Interviews als empirische Grundlage',
        'Stakeholder-Analyse und Requirements Engineering nach IREB-Standard',
        'Funktionale und nicht-funktionale Anforderungen mit Priorisierung',
        'Analyse zentraler Vertrauensbarrieren für Emittenten und Investoren',
        'MVP-Definition, Detailkonzept und öffentliche Pre-Launch-Seite',
      ],
      facts: [
        { value: '01.2026', label: 'Projektstart' },
        { value: '9', label: 'Experten- und Stakeholder-Interviews' },
        { value: 'Live', label: 'Pre-Launch & Vorregistrierung' },
        { value: 'Konzeptphase', label: 'Entwicklungsstand der Plattform' },
      ],
      systemEyebrow: 'ANALYSE & PRODUKTKONZEPT',
      systemTitle: 'Von der Vertrauensfrage zum priorisierten MVP',
      systemIntro: 'Die geplante Plattform wurde nicht aus technischen Annahmen heraus entworfen, sondern aus den Bedürfnissen, Risiken und Entscheidungskriterien der relevanten Stakeholder abgeleitet.',
      systemLayers: [
        {
          title: 'Research & Stakeholder',
          description: 'Neun qualitative Gespräche machten Erwartungen, Vorbehalte und Vertrauensfaktoren sichtbar.',
          items: ['Emittenten- und Investorenperspektive', 'Experten- und Stakeholder-Interviews', 'Auswertung der Vertrauensbarrieren', 'Plattformökonomie und Tokenisierung'],
        },
        {
          title: 'Requirements Engineering',
          description: 'Die Erkenntnisse wurden methodisch in prüfbare Anforderungen und klare Prioritäten übersetzt.',
          items: ['IREB-orientiertes Vorgehen', 'Funktionale Anforderungen', 'Nicht-funktionale Anforderungen', 'Kategorisierung und Priorisierung'],
        },
        {
          title: 'Detailkonzept & MVP',
          description: 'Der priorisierte Anforderungskatalog bildet die Grundlage für eine realistische erste Produktversion.',
          items: ['MVP-Abgrenzung', 'Nutzer- und Informationswege', 'Vertrauensbildende Plattformmechanismen', 'Grundlage für die geplante Entwicklung'],
        },
      ],
      rolesTitle: 'Zwei Marktseiten, ein gemeinsames Vertrauensproblem',
      rolesIntro: 'Das Konzept berücksichtigt die unterschiedlichen Ziele und Informationsbedürfnisse beider Hauptgruppen sowie die fachlichen Rahmenbedingungen des Plattformbetriebs.',
      roles: ['Emittenten', 'Investoren', 'Fachexperten', 'Plattformbetrieb'],
    },
    en: {
      title: 'Liquoda',
      tag: 'FinTech · Platform concept',
      tagline: 'A validated detailed concept for a tokenized brokerage platform connecting issuers and investors.',
      role: 'Inventor, owner, business analysis, requirements engineering & product conception',
      status: 'Public pre-launch website with pre-registration live · Platform not yet developed',
      cardStatus: 'Pre-launch live · Concept phase',
      metaDesc: 'Liquoda: validated detailed concept and requirements analysis for a tokenized brokerage platform, developed as a Business Information Technology diploma thesis.',
      challenge: 'Tokenized investments in real-world assets require explanation and depend heavily on trust. Liquoda therefore needed to determine which functional and non-functional requirements a brokerage platform must meet for issuers and investors to understand, trust and actively use it, without positioning Liquoda itself as a financial intermediary.',
      approach: 'I developed Liquoda as my own product venture and examined it in my diploma thesis, “Detailed concept and requirements analysis of the tokenized brokerage platform LIQUODA”. Using IREB-oriented requirements engineering, I conducted and analyzed nine expert and stakeholder interviews, structured the interests of both user groups, examined trust barriers and derived prioritized functional and non-functional requirements.',
      result: 'The outcome is a validated detailed concept, a prioritized requirements catalogue and a derived MVP definition that provide a robust basis for planned development. Only the public pre-launch website with pre-registration is currently live; the actual platform has not yet been developed and there are no pre-registrations, test users or partners at this stage.',
      points: [
        'Original product idea, business model and strategic positioning',
        'Nine expert and stakeholder interviews as the empirical foundation',
        'Stakeholder analysis and requirements engineering based on IREB',
        'Prioritized functional and non-functional requirements',
        'Analysis of key trust barriers for issuers and investors',
        'MVP definition, detailed concept and public pre-launch website',
      ],
      facts: [
        { value: 'Jan 2026', label: 'Project start' },
        { value: '9', label: 'Expert and stakeholder interviews' },
        { value: 'Live', label: 'Pre-launch & pre-registration' },
        { value: 'Concept phase', label: 'Platform development status' },
      ],
      systemEyebrow: 'ANALYSIS & PRODUCT CONCEPT',
      systemTitle: 'From the trust question to a prioritized MVP',
      systemIntro: 'The planned platform was designed from stakeholder needs, risks and decision criteria rather than from technical assumptions.',
      systemLayers: [
        {
          title: 'Research & stakeholders',
          description: 'Nine qualitative interviews revealed expectations, reservations and the factors that influence trust.',
          items: ['Issuer and investor perspectives', 'Expert and stakeholder interviews', 'Analysis of trust barriers', 'Platform economics and tokenization'],
        },
        {
          title: 'Requirements engineering',
          description: 'The findings were translated methodically into verifiable requirements and clear priorities.',
          items: ['IREB-oriented methodology', 'Functional requirements', 'Non-functional requirements', 'Categorization and prioritization'],
        },
        {
          title: 'Detailed concept & MVP',
          description: 'The prioritized requirements catalogue provides the foundation for a realistic first product version.',
          items: ['MVP scope', 'User and information journeys', 'Trust-building platform mechanisms', 'Foundation for planned development'],
        },
      ],
      rolesTitle: 'Two market sides, one shared trust challenge',
      rolesIntro: 'The concept accounts for the different goals and information needs of both primary groups as well as the professional requirements of platform operations.',
      roles: ['Issuers', 'Investors', 'Subject-matter experts', 'Platform operations'],
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
      role: 'Einzelarbeit: Business Analyse, Businessplan & Prozesskonzeption',
      status: 'Feusi Wirtschaftsinformatik HF · Note 5.8 · Konzept noch nicht umgesetzt',
      cardStatus: 'Studienarbeit · Note 5.8',
      metaDesc: "Mit Note 5.8 bewertete Feusi-Studienarbeit für Olivia's Olivenpaste: Businessplan, Marktanalyse, Business Model Canvas und vollständige Prozesskonzeption.",
      challenge: 'Ausgangspunkt war eine reale Situation: Ein Freund hatte Olivenplantagen in Italien geerbt und wollte die Oliven in die Schweiz importieren, verarbeiten und als Olivenpaste verkaufen. Dafür fehlte ein durchgängiges Geschäftsmodell, das Produkt, Prozesse, Markt und Wirtschaftlichkeit zusammenführt.',
      approach: 'In den Modulen Business Plan und Prozessmanagement an der Feusi Wirtschaftsinformatik HF entwickelte ich einen vollständigen Businessplan. Ich analysierte Markt, Wettbewerb und Zielgruppen, erarbeitete Business Model Canvas und SWOT, strukturierte Import, Verarbeitung und Logistik und verband diese Grundlagen mit Positionierung, Branding, Vertrieb, Marketing und Finanzplanung.',
      result: 'Die mit der Note 5.8 bewertete Arbeit liefert einen vollständigen und nachvollziehbaren Bauplan für einen möglichen Markteintritt – von der italienischen Plantage bis zur Vermarktung in der Schweiz. Sie weist Chancen, Risiken, Prozessschritte und wirtschaftliche Voraussetzungen transparent aus. Das reale Produktvorhaben wurde bisher nicht umgesetzt.',
      points: [
        'Markt-, Wettbewerbs- und Zielgruppenanalyse für die Schweiz',
        'Geschäftsmodell, Business Canvas, SWOT und wirtschaftliche Machbarkeit',
        'Import-, Produktions-, Verarbeitungs- und Logistikprozesse',
        'Markenidee, Produktpositionierung und visuelles Grundkonzept',
        'Vertriebs-, Absatz-, Marketing- und Kommunikationsstrategie',
        'Vollständiger Businessplan auf Basis einer realen Ausgangssituation',
      ],
      facts: [
        { value: '5.8', label: 'Bewertung' },
        { value: '2023–2024', label: 'Bearbeitungszeitraum' },
        { value: 'Feusi HF', label: 'Wirtschaftsinformatik' },
        { value: 'Konzept', label: 'Noch nicht umgesetzt' },
      ],
      systemEyebrow: 'BUSINESSPLAN & PROZESSDESIGN',
      systemTitle: 'Ein Geschäftsmodell vom Ursprung bis zum Verkauf',
      systemIntro: 'Die Arbeit betrachtet das Vorhaben nicht nur als Produktidee, sondern als zusammenhängendes System aus Markt, Wertschöpfung, Marke, Vertrieb und Finanzierung.',
      systemLayers: [
        {
          title: 'Markt & Positionierung',
          description: 'Die Ausgangslage wurde in ein differenziertes Angebot für den Schweizer Markt übersetzt.',
          items: ['Markt- und Wettbewerbsanalyse', 'Zielgruppen und Bedürfnisse', 'SWOT-Analyse', 'Positionierung und Markenidee'],
        },
        {
          title: 'Geschäftsmodell & Finanzen',
          description: 'Das Konzept verbindet Kundennutzen, Ertragslogik, Ressourcen und wirtschaftliche Voraussetzungen.',
          items: ['Business Model Canvas', 'Produkt- und Preislogik', 'Vertriebs- und Marketingplanung', 'Finanzplanung und Machbarkeit'],
        },
        {
          title: 'Prozesse & Umsetzung',
          description: 'Die operative Kette wurde von der italienischen Plantage bis zum Schweizer Absatzmarkt modelliert.',
          items: ['Ernte und Beschaffung', 'Import und Logistik', 'Verarbeitung und Qualität', 'Vertrieb und Kommunikation'],
        },
      ],
      rolesTitle: 'Praxisnah entwickelt, transparent abgegrenzt',
      rolesIntro: 'Die Studienarbeit basiert auf einer realen unternehmerischen Ausgangslage und ist vollständig einsehbar. Sie bildet ein umsetzbares Konzept, wurde bislang jedoch nicht operativ realisiert.',
      roles: ['Business Plan', 'Prozessmanagement', 'Marktanalyse', 'Finanzplanung'],
    },
    en: {
      title: "Olivia's Olive Paste",
      tag: 'Business design · Study project',
      tagline: 'Turning inherited olive groves in Italy into a market-ready Swiss product concept.',
      role: 'Individual project: business analysis, business plan & process conception',
      status: 'Feusi Business Information Technology HF · Grade 5.8 · Concept not yet implemented',
      cardStatus: 'Study project · Grade 5.8',
      metaDesc: "Feusi study project graded 5.8 for Olivia's Olive Paste: business plan, market analysis, Business Model Canvas and complete process conception.",
      challenge: 'The project started from a real situation: a friend had inherited olive groves in Italy and wanted to import the olives into Switzerland, process them and sell them as olive paste. What was missing was an integrated business model connecting product, operations, market and viability.',
      approach: 'In the Business Plan and Process Management modules of the Feusi Business Information Technology HF program, I developed a complete business plan. I analyzed the market, competitors and target groups, created the Business Model Canvas and SWOT, structured import, processing and logistics, and connected these foundations with positioning, branding, distribution, marketing and financial planning.',
      result: 'The project, graded 5.8, provides a complete and traceable blueprint for a potential market entry, from the Italian groves through to marketing in Switzerland. It transparently identifies opportunities, risks, process steps and financial requirements. The real-world product venture has not yet been implemented.',
      points: [
        'Market, competitor and target-audience analysis for Switzerland',
        'Business model, Business Model Canvas, SWOT and financial viability',
        'Import, production, processing and logistics workflows',
        'Brand idea, product positioning and visual foundation',
        'Distribution, sales, marketing and communications strategy',
        'Complete business plan based on a real-world starting point',
      ],
      facts: [
        { value: '5.8', label: 'Grade' },
        { value: '2023–2024', label: 'Project period' },
        { value: 'Feusi HF', label: 'Business Information Technology' },
        { value: 'Concept', label: 'Not yet implemented' },
      ],
      systemEyebrow: 'BUSINESS PLAN & PROCESS DESIGN',
      systemTitle: 'A business model from origin to sale',
      systemIntro: 'The work treats the venture not only as a product idea, but as a connected system of market, value creation, brand, distribution and financing.',
      systemLayers: [
        {
          title: 'Market & positioning',
          description: 'The initial situation was translated into a differentiated proposition for the Swiss market.',
          items: ['Market and competitor analysis', 'Target groups and needs', 'SWOT analysis', 'Positioning and brand idea'],
        },
        {
          title: 'Business model & finance',
          description: 'The concept connects customer value, revenue logic, resources and financial requirements.',
          items: ['Business Model Canvas', 'Product and pricing logic', 'Distribution and marketing plan', 'Financial planning and viability'],
        },
        {
          title: 'Processes & implementation',
          description: 'The operating chain was modelled from the Italian groves to the Swiss market.',
          items: ['Harvest and sourcing', 'Import and logistics', 'Processing and quality', 'Distribution and communication'],
        },
      ],
      rolesTitle: 'Practice-based and clearly delimited',
      rolesIntro: 'The study project is based on a real entrepreneurial situation and is available in full. It provides an actionable concept but has not yet been operationally implemented.',
      roles: ['Business plan', 'Process management', 'Market analysis', 'Financial planning'],
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
      status: 'Öffentliche Testversion verfügbar · finale Abnahme und Livegang noch ausstehend',
      cardStatus: 'Öffentliche Testversion',
      metaDesc: 'GiGi Beauty: immersive 3D-Website für ein Kosmetikstudio in Bern – vollständig konzipiert, gestaltet und entwickelt von Marcel Spahr.',
      challenge: 'GiGi Beauty benötigte für sein breites Behandlungsangebot einen Webauftritt, der nicht wie eine austauschbare Studio-Website wirkt. Die Persönlichkeit der Marke, ihre hochwertige Positionierung und die unterschiedlichen Leistungen sollten emotional erlebbar werden, ohne Orientierung, Information und Terminbuchung aus dem Blick zu verlieren.',
      approach: 'Im Auftrag der Inhaberin und Geschäftsführerin Liliane Serrano entwickelte ich die Website vollständig von A bis Z. Markeninszenierung, Informationsarchitektur, Art Direction, UX/UI, Inhalte, 3D-Objekte und technische Umsetzung entstanden als ein zusammenhängendes Erlebnis. Eine scrollgesteuerte Three.js-Szene führt durch Produkte und Behandlungswelten; mehrsprachige Inhalte, strukturierte Leistungsseiten, lokale Suchmaschinenoptimierung und klare Buchungswege ergänzen die Inszenierung.',
      result: 'Eine eigenständige, öffentlich zugängliche 3D-Testversion, die das Angebot als räumliche Markenwelt vermittelt und gleichzeitig strukturiert zu Leistungen, Preisen, Studioinformationen und Buchung führt. Die vorgesehenen Inhalte und Funktionen sind umgesetzt; finale Kundenabnahme und produktiver Livegang stehen noch aus. Deshalb werden aktuell keine unbelegten Resultate oder Conversion-Kennzahlen ausgewiesen.',
      points: [
        'Vollständige Konzeption, Art Direction, Design und UX/UI aus einer Hand',
        'Individuelle 3D-Modelle und scrollgesteuerte Three.js-Inszenierung',
        'Partikel, Licht, Kameraführung und interaktive räumliche Markenwelt',
        'Strukturierte Leistungs-, Preis-, Studio- und Terminbereiche',
        'Mehrsprachige Nutzerführung und responsive Umsetzung',
        'Lokales SEO, strukturierte Daten, Social-Media-Metadaten und technische Optimierung',
      ],
      facts: [
        { value: 'Ende 06.2026', label: 'Projektstart' },
        { value: 'Öffentlich', label: 'Testversion verfügbar' },
        { value: 'A–Z', label: 'Meine Verantwortung' },
        { value: 'Ausstehend', label: 'Abnahme & Livegang' },
      ],
      systemEyebrow: '3D-ERLEBNIS & BUCHUNG',
      systemTitle: 'Markeninszenierung und Serviceprozess als Einheit',
      systemIntro: 'Die visuelle 3D-Welt, die redaktionellen Inhalte und die Terminbuchung wurden als durchgängige Kundenerfahrung konzipiert und technisch miteinander verbunden.',
      systemLayers: [
        {
          title: 'Immersive Markenwelt',
          description: 'Eine individuell entwickelte WebGL-Szene übersetzt Produkte und Behandlungen in ein räumliches Markenerlebnis.',
          items: ['Three.js und eigene 3D-Inszenierung', 'Scrollgesteuerte Kameraführung', 'Licht, Partikel und Shader-Effekte', 'Responsive Interaktion'],
        },
        {
          title: 'Website & Inhalte',
          description: 'Das Erlebnis bleibt mit klarer Information, mehrsprachiger Führung und lokaler Auffindbarkeit verbunden.',
          items: ['HTML, CSS und JavaScript', 'Leistungen, Preise und Studioinformationen', 'Mehrsprachige Inhalte', 'SEO und strukturierte Daten'],
        },
        {
          title: 'Terminbuchung & Verwaltung',
          description: 'Die ergänzende Webanwendung führt von der Verfügbarkeit über die Buchung bis zur internen Terminverwaltung.',
          items: ['Next.js, React und TypeScript', 'Tailwind CSS', 'Supabase-Datenbank und Authentifizierung', 'Buchungslogik und Adminbereich'],
        },
      ],
      rolesTitle: 'Vollständig aus einer Hand entwickelt',
      rolesIntro: 'Die Umsetzung verbindet strategische, gestalterische und technische Verantwortung, statt die Markenerfahrung auf voneinander getrennte Gewerke aufzuteilen.',
      roles: ['Konzeption', 'Art Direction', 'UX/UI', '3D & Animation', 'Frontend', 'Buchungssystem', 'Inhalte', 'SEO'],
    },
    en: {
      title: 'GiGi Beauty',
      tag: '3D website · Beauty',
      tagline: 'An immersive, scroll-driven brand world for a beauty studio in Bern.',
      role: 'A–Z: concept, design, 3D, UX/UI, development, content & SEO',
      status: 'Public test version available · final approval and production launch pending',
      cardStatus: 'Public test version',
      metaDesc: 'GiGi Beauty: immersive 3D website for a beauty studio in Bern, fully conceived, designed and developed by Marcel Spahr.',
      challenge: 'GiGi Beauty needed a digital presence for its broad treatment portfolio that would not feel like an interchangeable studio website. The personality and premium positioning of the brand had to become emotionally tangible while preserving clear orientation, service information and a direct path to booking.',
      approach: 'Commissioned by owner and managing director Liliane Serrano, I developed the website completely from A to Z. Brand staging, information architecture, art direction, UX/UI, content, 3D objects and technical implementation were conceived as one connected experience. A scroll-driven Three.js scene guides visitors through products and treatment worlds, supported by multilingual content, structured service pages, local SEO and clear booking paths.',
      result: 'A distinctive, publicly accessible 3D test version that presents the offer as a spatial brand world while providing structured access to treatments, pricing, studio information and booking. All planned content and functions are implemented; final client approval and production launch are still pending. No unverified outcomes or conversion metrics are therefore presented at this stage.',
      points: [
        'Complete concept, art direction, design and UX/UI from a single source',
        'Custom 3D models and scroll-driven Three.js staging',
        'Particles, lighting, camera direction and an interactive spatial brand world',
        'Structured service, pricing, studio and appointment sections',
        'Multilingual user journey and responsive implementation',
        'Local SEO, structured data, social metadata and technical optimization',
      ],
      facts: [
        { value: 'Late Jun 2026', label: 'Project start' },
        { value: 'Public', label: 'Test version available' },
        { value: 'End to end', label: 'My responsibility' },
        { value: 'Pending', label: 'Approval & production launch' },
      ],
      systemEyebrow: '3D EXPERIENCE & BOOKING',
      systemTitle: 'Brand staging and service workflow as one experience',
      systemIntro: 'The visual 3D world, editorial content and appointment booking were conceived as one coherent customer journey and connected technically.',
      systemLayers: [
        {
          title: 'Immersive brand world',
          description: 'A custom WebGL scene translates products and treatments into a spatial brand experience.',
          items: ['Three.js and custom 3D staging', 'Scroll-driven camera direction', 'Lighting, particles and shader effects', 'Responsive interaction'],
        },
        {
          title: 'Website & content',
          description: 'The experience remains connected to clear information, multilingual navigation and local discoverability.',
          items: ['HTML, CSS and JavaScript', 'Treatments, prices and studio information', 'Multilingual content', 'SEO and structured data'],
        },
        {
          title: 'Booking & administration',
          description: 'The complementary web application covers availability, customer booking and internal appointment management.',
          items: ['Next.js, React and TypeScript', 'Tailwind CSS', 'Supabase database and authentication', 'Booking logic and administration area'],
        },
      ],
      rolesTitle: 'Developed completely from one source',
      rolesIntro: 'The delivery combines strategic, creative and technical responsibility rather than splitting the brand experience across disconnected disciplines.',
      roles: ['Concept', 'Art direction', 'UX/UI', '3D & animation', 'Frontend', 'Booking system', 'Content', 'SEO'],
    },
  },
];

export function getProject(slug: string): Project | null {
  return PROJECTS.find((project) => project.slug === slug) ?? null;
}
