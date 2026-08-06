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
      tag: 'Webplattform. CRM und ERP.',
      tagline: 'Für VeraHome habe ich die Marke, die Website und eine eigene Verwaltungsplattform entwickelt.',
      role: 'Ich verantworte Strategie, Marke, UX, Frontend, Backend, Datenbank, Tests und Einführung.',
      status: 'Die Website ist vollständig veröffentlicht. Das Verwaltungsportal befindet sich seit dem 1. Juli 2026 in der Testphase.',
      cardStatus: 'Die Website ist live. Das Portal wird getestet.',
      metaDesc: 'VeraHome: vollständige Immobilien-Website mit Branding, UX/UI, CRM-/ERP-Verwaltung, Kundenportal, Datenbank und digitalen Immobilienprozessen.',
      challenge: 'VeraHome wurde neu gegründet und hatte zu Beginn weder eine Marke noch eine Website oder interne Systeme. Neben dem öffentlichen Auftritt brauchte das Unternehmen deshalb eine verlässliche Lösung für Objekte, Inserate, Kontakte, Termine, Dokumente, Schäden, Rechnungen und die tägliche Verwaltung.',
      approach: 'Ich plante die Marke, die öffentliche Website und das Verwaltungsportal gemeinsam. Dadurch nutzen Website, Datenbank und interne Arbeitsbereiche die gleichen Strukturen. Ich entwickelte die Gestaltung, das Datenmodell, die Rollen, die Zugriffsrechte und alle vorgesehenen Funktionen selbst.',
      result: 'Die zweisprachige Website ist vollständig veröffentlicht. Das Verwaltungsportal mit seinen vorgesehenen Modulen ist ebenfalls umgesetzt und wird aktuell getestet. Das Projekt begann am 1. Juli 2026. Deshalb nenne ich noch keine Effizienzwerte, die sich zu diesem Zeitpunkt nicht zuverlässig belegen lassen.',
      points: [
        'Ich entwickelte Strategie, Marke, Corporate Design und UX.',
        'Ich baute eine zweisprachige Immobilien Website mit Leistungsseiten und Objektseiten.',
        'Ich entwickelte ein eigenes CRM und ERP mit PostgreSQL Datenbank, Rollen und Berechtigungen.',
        'Das Portal verwaltet Objekte, Einheiten, Inserate, Mietverhältnisse und Eigentümerschaften.',
        'Kontakte, Kalender, Dokumente, Rechnungen, Nachrichten und Rapporte sind zentral verfügbar.',
        'Schäden, Aufträge, Formulare und Serviceabläufe werden im gleichen System bearbeitet.',
        'Ein zentrales Protokoll macht wichtige Änderungen nachvollziehbar.',
      ],
      facts: [
        { value: '01.07.2026', label: 'Projektstart' },
        { value: '100 % live', label: 'Öffentliche Website' },
        { value: 'Testphase', label: 'Verwaltungsportal' },
        { value: 'Persönlich', label: 'Ich trage die Verantwortung.' },
      ],
      systemEyebrow: 'TECHNISCHE ARCHITEKTUR',
      systemTitle: 'Ein System statt getrennter Einzellösungen',
      systemIntro: 'VeraHome verbindet die öffentliche Website mit den täglichen Aufgaben der Immobilienverwaltung. Beide Bereiche greifen auf eine gemeinsame und geschützte Datenbasis zu.',
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
      rolesIntro: 'Jede Person sieht die Informationen und Funktionen, die sie für ihre Aufgabe braucht. Dadurch bleibt die Oberfläche verständlich und sensible Daten bleiben geschützt.',
      roles: ['Administration', 'Mitarbeitende', 'Eigentümer', 'Mieter', 'Hauswarte', 'Handwerker', 'Partner', 'Interessenten'],
    },
    en: {
      title: 'VeraHome',
      tag: 'Web platform. CRM and ERP.',
      tagline: 'I developed the brand, website and a dedicated administration platform for VeraHome.',
      role: 'I am responsible for strategy, brand, UX, frontend, backend, database, testing and introduction.',
      status: 'The website is fully live. The administration portal has been in testing since 1 July 2026.',
      cardStatus: 'The website is live. The portal is being tested.',
      metaDesc: 'VeraHome: complete real-estate website with branding, UX/UI, CRM/ERP administration, customer portal, database and digital property workflows.',
      challenge: 'VeraHome was a new business and started without a brand, website or internal systems. Alongside the public website, the company needed a dependable solution for properties, listings, contacts, appointments, documents, incidents, invoices and daily administration.',
      approach: 'I planned the brand, public website and administration portal together. The website, database and internal work areas therefore use the same structures. I developed the design, data model, roles, access rights and all planned functions myself.',
      result: 'The bilingual website is fully live. The administration portal and its planned modules have also been built and are currently being tested. The project began on 1 July 2026, so I do not state efficiency figures that cannot yet be supported reliably.',
      points: [
        'I developed the strategy, brand, corporate design and UX.',
        'I built a bilingual property website with service and property pages.',
        'I developed a custom CRM and ERP with a PostgreSQL database, roles and permissions.',
        'The portal manages properties, units, listings, tenancies and ownership relationships.',
        'Contacts, calendars, documents, invoices, messages and reports are available centrally.',
        'Incidents, assignments, forms and service processes are handled in the same system.',
        'A central log makes important changes traceable.',
      ],
      facts: [
        { value: '1 Jul 2026', label: 'Project start' },
        { value: '100% live', label: 'Public website' },
        { value: 'Testing', label: 'Administration portal' },
        { value: 'Personal', label: 'I carry the responsibility.' },
      ],
      systemEyebrow: 'TECHNICAL ARCHITECTURE',
      systemTitle: 'One system instead of disconnected tools',
      systemIntro: 'VeraHome connects the public website with the daily work of property management. Both areas use one shared and protected data source.',
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
      rolesIntro: 'Each person sees the information and functions needed for their work. This keeps the interface clear and protects sensitive data.',
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
      tag: 'FinTech. Plattformkonzept.',
      tagline: 'Für LIQUODA habe ich ein geprüftes Detailkonzept für die Vermittlung zwischen Emittenten und Investoren entwickelt.',
      role: 'Die Idee stammt von mir. Ich übernehme Business Analyse, Requirements Engineering und Produktkonzeption.',
      status: 'Die öffentliche Informationsseite ist live. Die eigentliche Plattform ist noch nicht entwickelt.',
      cardStatus: 'Die Informationsseite ist live. Die Plattform ist in der Konzeptphase.',
      metaDesc: 'Liquoda: validiertes Detailkonzept und Anforderungsanalyse für eine tokenisierte Vermittlungsplattform, entwickelt als Diplomarbeit in Wirtschaftsinformatik HF.',
      challenge: 'Tokenisierte Investitionen in reale Vermögenswerte müssen verständlich erklärt werden und setzen Vertrauen voraus. Ich wollte deshalb klären, welche Anforderungen eine Vermittlungsplattform erfüllen muss, damit Emittenten und Investoren sie verstehen und nutzen würden. LIQUODA selbst soll dabei nicht als Finanzintermediär auftreten.',
      approach: 'Ich entwickelte LIQUODA als eigenes Produkt und untersuchte die Idee in meiner Diplomarbeit. Dafür führte ich neun Interviews mit Experten und Stakeholdern. Ich ordnete die Interessen beider Nutzergruppen, untersuchte mögliche Vertrauensprobleme und leitete daraus priorisierte Anforderungen ab.',
      result: 'Das Ergebnis besteht aus einem geprüften Detailkonzept, einem priorisierten Anforderungskatalog und einer daraus abgeleiteten ersten Produktversion. Aktuell ist nur die öffentliche Informationsseite verfügbar. Die Plattform ist noch nicht entwickelt und es gibt noch keine Vorregistrierungen, Testnutzer oder Partner.',
      points: [
        'Die Produktidee, das Geschäftsmodell und die Positionierung stammen von mir.',
        'Neun Interviews mit Experten und Stakeholdern bilden die empirische Grundlage.',
        'Ich analysierte die Stakeholder und arbeitete nach dem IREB Standard.',
        'Ich erhob funktionale und nicht funktionale Anforderungen und setzte Prioritäten.',
        'Ich untersuchte, was Emittenten und Investoren vom Vertrauen in die Plattform abhalten könnte.',
        'Ich definierte eine erste Produktversion, erstellte das Detailkonzept und veröffentlichte die Informationsseite.',
      ],
      facts: [
        { value: '01.2026', label: 'Projektstart' },
        { value: '9', label: 'Experten- und Stakeholder-Interviews' },
        { value: 'Live', label: 'Die öffentliche Informationsseite ist veröffentlicht.' },
        { value: 'Konzeptphase', label: 'Entwicklungsstand der Plattform' },
      ],
      systemEyebrow: 'ANALYSE & PRODUKTKONZEPT',
      systemTitle: 'Von der Vertrauensfrage zum priorisierten MVP',
      systemIntro: 'Ich leitete das Konzept aus den Bedürfnissen, Risiken und Entscheidungskriterien der beteiligten Gruppen ab. Technische Annahmen standen nicht am Anfang.',
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
      tag: 'FinTech. Platform concept.',
      tagline: 'For LIQUODA, I developed a reviewed concept for connecting issuers and investors.',
      role: 'The idea is mine. I handle business analysis, requirements engineering and product planning.',
      status: 'The public information website is live. The platform itself has not yet been developed.',
      cardStatus: 'The information website is live. The platform is in the concept stage.',
      metaDesc: 'Liquoda: validated detailed concept and requirements analysis for a tokenized brokerage platform, developed as a Business Information Technology diploma thesis.',
      challenge: 'Tokenised investments in real assets need to be explained clearly and depend on trust. I therefore wanted to find out what a brokerage platform must provide for issuers and investors to understand and use it. LIQUODA itself should not act as a financial intermediary.',
      approach: 'I developed LIQUODA as my own product and examined the idea in my diploma thesis. I conducted nine interviews with experts and stakeholders, organised the interests of both user groups, studied possible trust concerns and derived prioritised requirements.',
      result: 'The result is a reviewed detailed concept, a prioritised requirements catalogue and a definition of the first product version. Only the public information website is currently available. The platform has not yet been developed and there are no registrations, test users or partners.',
      points: [
        'I created the product idea, business model and positioning.',
        'Nine interviews with experts and stakeholders provide the empirical foundation.',
        'I analysed the stakeholders and worked according to the IREB standard.',
        'I gathered functional and non functional requirements and set priorities.',
        'I examined what could prevent issuers and investors from trusting the platform.',
        'I defined the first product version, wrote the detailed concept and published the information website.',
      ],
      facts: [
        { value: 'Jan 2026', label: 'Project start' },
        { value: '9', label: 'Expert and stakeholder interviews' },
        { value: 'Live', label: 'The public information website is available.' },
        { value: 'Concept phase', label: 'Platform development status' },
      ],
      systemEyebrow: 'ANALYSIS & PRODUCT CONCEPT',
      systemTitle: 'From the trust question to a prioritized MVP',
      systemIntro: 'I derived the concept from the needs, risks and decision criteria of the people involved. Technical assumptions did not come first.',
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
      tag: 'Business Design. Studienarbeit.',
      tagline: 'Ich entwickelte aus geerbten Olivenplantagen in Italien ein mögliches Produktkonzept für den Schweizer Markt.',
      role: 'Ich erstellte die Business Analyse, den Businessplan und das Prozesskonzept selbst.',
      status: 'Die Feusi bewertete die Arbeit mit der Note 5.8. Das Konzept wurde noch nicht umgesetzt.',
      cardStatus: 'Die Studienarbeit wurde mit der Note 5.8 bewertet.',
      metaDesc: "Mit Note 5.8 bewertete Feusi-Studienarbeit für Olivia's Olivenpaste: Businessplan, Marktanalyse, Business Model Canvas und vollständige Prozesskonzeption.",
      challenge: 'Ein Freund hatte Olivenplantagen in Italien geerbt und wollte die Oliven in der Schweiz zu einer Paste verarbeiten und verkaufen. Dafür brauchte er ein Geschäftsmodell, das Produkt, Abläufe, Markt und Finanzierung zusammenbringt.',
      approach: 'Im Rahmen meines HF Studiums entwickelte ich einen vollständigen Businessplan. Ich untersuchte den Markt, den Wettbewerb und mögliche Zielgruppen. Danach plante ich Import, Verarbeitung und Logistik und verband diese Abläufe mit Marke, Verkauf, Marketing und Finanzierung.',
      result: 'Die Arbeit zeigt einen möglichen Weg von der italienischen Plantage bis zum Verkauf in der Schweiz. Sie hält Chancen, Risiken, Arbeitsschritte und finanzielle Voraussetzungen verständlich fest. Die Feusi bewertete sie mit der Note 5.8. Das Produkt wurde bisher nicht umgesetzt.',
      points: [
        'Ich untersuchte Markt, Wettbewerb und Zielgruppen in der Schweiz.',
        'Ich erstellte das Geschäftsmodell, den Business Model Canvas und die SWOT Analyse und prüfte die wirtschaftliche Machbarkeit.',
        'Ich plante Import, Produktion, Verarbeitung und Logistik.',
        'Ich entwickelte die Markenidee, die Positionierung und die visuelle Grundlage.',
        'Ich plante Verkauf, Marketing und Kommunikation.',
        'Ich fasste die Ergebnisse in einem vollständigen Businessplan zusammen.',
      ],
      facts: [
        { value: '5.8', label: 'Bewertung' },
        { value: '2023 bis 2024', label: 'In diesem Zeitraum entstand die Arbeit.' },
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
      tag: 'Business design. Study project.',
      tagline: 'I developed a possible product concept for the Swiss market from inherited olive groves in Italy.',
      role: 'I completed the business analysis, business plan and process concept myself.',
      status: 'Feusi awarded the project a grade of 5.8. The concept has not yet been implemented.',
      cardStatus: 'The study project received a grade of 5.8.',
      metaDesc: "Feusi study project graded 5.8 for Olivia's Olive Paste: business plan, market analysis, Business Model Canvas and complete process conception.",
      challenge: 'A friend had inherited olive groves in Italy and wanted to process the olives into a paste and sell it in Switzerland. He needed a business model that connected the product, processes, market and financing.',
      approach: 'As part of my HF studies, I developed a complete business plan. I examined the market, competitors and possible target groups. I then planned import, processing and logistics and connected these activities to the brand, sales, marketing and financing.',
      result: 'The project shows a possible route from the Italian grove to sales in Switzerland. It explains the opportunities, risks, work steps and financial requirements. Feusi awarded it a grade of 5.8. The product has not yet been launched.',
      points: [
        'I examined the market, competitors and target groups in Switzerland.',
        'I created the business model, Business Model Canvas and SWOT analysis and checked financial viability.',
        'I planned import, production, processing and logistics.',
        'I developed the brand idea, positioning and visual basis.',
        'I planned sales, marketing and communication.',
        'I brought the results together in a complete business plan.',
      ],
      facts: [
        { value: '5.8', label: 'Grade' },
        { value: '2023 to 2024', label: 'The project was completed during this period.' },
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
      tag: '3D Website. Beauty.',
      tagline: 'Für ein Kosmetikstudio in Bern habe ich eine scrollgesteuerte 3D Website entwickelt.',
      role: 'Ich übernahm Konzept, Design, 3D, UX, Entwicklung, Inhalte und Suchmaschinenoptimierung.',
      status: 'Die öffentliche Testversion ist verfügbar. Die finale Abnahme und Veröffentlichung stehen noch aus.',
      cardStatus: 'Öffentliche Testversion',
      metaDesc: 'Ich habe für GiGi Beauty in Bern eine 3D Website mit scrollgesteuerter Szene, Leistungsseiten, Buchungsweg und lokaler Suchmaschinenoptimierung entwickelt.',
      challenge: 'GiGi Beauty bietet viele unterschiedliche Behandlungen an. Die neue Website sollte die Persönlichkeit des Studios zeigen, ohne dass Besucher den Überblick über Leistungen, Preise und Buchung verlieren.',
      approach: 'Ich entwickelte die Website im Auftrag der Inhaberin Liliane Serrano. Dafür plante ich Marke, Informationsstruktur, Gestaltung, Inhalte, 3D Objekte und Technik gemeinsam. Eine scrollgesteuerte Three.js Szene führt durch Produkte und Behandlungen. Mehrsprachige Inhalte, Leistungsseiten, lokale Suchmaschinenoptimierung und klare Buchungswege ergänzen die 3D Darstellung.',
      result: 'Die öffentliche Testversion zeigt das Angebot in einer räumlichen 3D Umgebung und führt gleichzeitig zu Leistungen, Preisen, Informationen über das Studio und zur Buchung. Alle vorgesehenen Inhalte und Funktionen sind umgesetzt. Die Kundenabnahme und die endgültige Veröffentlichung stehen noch aus. Deshalb nenne ich noch keine Ergebnisse oder Kennzahlen, die sich nicht belegen lassen.',
      points: [
        'Ich übernahm Konzept, Art Direction, Design und UX selbst.',
        'Ich entwickelte eigene 3D Modelle und eine scrollgesteuerte Three.js Szene.',
        'Ich programmierte Partikel, Licht, Kameraführung und räumliche Interaktionen.',
        'Ich strukturierte Leistungen, Preise, Studioinformationen und Termine.',
        'Ich setzte die Inhalte mehrsprachig und für verschiedene Bildschirmgrössen um.',
        'Ich richtete lokale Suchmaschinenoptimierung, strukturierte Daten und technische Metadaten ein.',
      ],
      facts: [
        { value: 'Ende 06.2026', label: 'Projektstart' },
        { value: 'Öffentlich', label: 'Testversion verfügbar' },
        { value: 'Persönlich', label: 'Ich trage die Verantwortung.' },
        { value: 'Ausstehend', label: 'Abnahme und Veröffentlichung stehen noch aus.' },
      ],
      systemEyebrow: '3D WEBSITE UND BUCHUNG',
      systemTitle: 'Die 3D Darstellung führt direkt zu Information und Buchung.',
      systemIntro: 'Ich plante die 3D Darstellung, die Texte und die Terminbuchung gemeinsam und verband sie technisch.',
      systemLayers: [
        {
          title: 'Räumliche 3D Darstellung',
          description: 'Eine eigene WebGL Szene zeigt Produkte und Behandlungen in einer räumlichen Darstellung.',
          items: ['Three.js und eigene 3D-Inszenierung', 'Scrollgesteuerte Kameraführung', 'Licht, Partikel und Shader-Effekte', 'Responsive Interaktion'],
        },
        {
          title: 'Website und Inhalte',
          description: 'Klare Informationen, mehrere Sprachen und lokale Suchmaschinenoptimierung ergänzen die 3D Darstellung.',
          items: ['HTML, CSS und JavaScript', 'Leistungen, Preise und Studioinformationen', 'Mehrsprachige Inhalte', 'SEO und strukturierte Daten'],
        },
        {
          title: 'Terminbuchung und Verwaltung',
          description: 'Die ergänzende Webanwendung führt von der Verfügbarkeit über die Buchung bis zur internen Terminverwaltung.',
          items: ['Next.js, React und TypeScript', 'Tailwind CSS', 'Supabase-Datenbank und Authentifizierung', 'Buchungslogik und Adminbereich'],
        },
      ],
      rolesTitle: 'Ich entwickelte alle Bereiche selbst.',
      rolesIntro: 'Ich war für Strategie, Gestaltung und Technik verantwortlich. Dadurch konnte ich Entscheidungen direkt über alle Bereiche hinweg abstimmen.',
      roles: ['Konzeption', 'Art Direction', 'UX und UI', '3D und Animation', 'Frontend', 'Buchungssystem', 'Inhalte', 'SEO'],
    },
    en: {
      title: 'GiGi Beauty',
      tag: '3D website. Beauty.',
      tagline: 'I developed a scroll controlled 3D website for a beauty studio in Bern.',
      role: 'I handled the concept, design, 3D, UX, development, content and search engine optimisation.',
      status: 'The public test version is available. Final approval and publication are still pending.',
      cardStatus: 'Public test version',
      metaDesc: 'I developed a 3D website for GiGi Beauty in Bern, with a scroll controlled scene, service pages, booking route and local search optimisation.',
      challenge: 'GiGi Beauty offers many different treatments. The new website needed to show the personality of the studio without making it difficult for visitors to find services, prices and booking.',
      approach: 'I developed the website for its owner, Liliane Serrano. I planned the brand, information structure, design, content, 3D objects and technology together. A scroll controlled Three.js scene guides visitors through products and treatments. Multilingual content, service pages, local search optimisation and clear booking routes support the 3D presentation.',
      result: 'The public test version presents the offer in a spatial 3D setting and also guides visitors to services, prices, studio information and booking. All planned content and functions have been implemented. Client approval and final publication are still pending, so I do not state results or figures that cannot yet be supported.',
      points: [
        'I handled the concept, art direction, design and UX myself.',
        'I developed custom 3D models and a scroll controlled Three.js scene.',
        'I programmed particles, lighting, camera movement and spatial interactions.',
        'I structured services, prices, studio information and appointments.',
        'I implemented the content in several languages and for different screen sizes.',
        'I set up local search optimisation, structured data and technical metadata.',
      ],
      facts: [
        { value: 'Late Jun 2026', label: 'Project start' },
        { value: 'Public', label: 'Test version available' },
        { value: 'Personal', label: 'I carry the responsibility.' },
        { value: 'Pending', label: 'Approval and publication are still pending.' },
      ],
      systemEyebrow: '3D WEBSITE AND BOOKING',
      systemTitle: 'The 3D presentation leads directly to information and booking.',
      systemIntro: 'I planned the 3D presentation, written content and appointment booking together and connected them technically.',
      systemLayers: [
        {
          title: 'Spatial 3D presentation',
          description: 'A custom WebGL scene presents products and treatments in a spatial setting.',
          items: ['Three.js and custom 3D staging', 'Scroll-driven camera direction', 'Lighting, particles and shader effects', 'Responsive interaction'],
        },
        {
          title: 'Website and content',
          description: 'Clear information, several languages and local search optimisation support the 3D presentation.',
          items: ['HTML, CSS and JavaScript', 'Treatments, prices and studio information', 'Multilingual content', 'SEO and structured data'],
        },
        {
          title: 'Booking and administration',
          description: 'The complementary web application covers availability, customer booking and internal appointment management.',
          items: ['Next.js, React and TypeScript', 'Tailwind CSS', 'Supabase database and authentication', 'Booking logic and administration area'],
        },
      ],
      rolesTitle: 'I developed every part myself.',
      rolesIntro: 'I was responsible for strategy, design and technology. This allowed me to coordinate decisions directly across every area.',
      roles: ['Concept', 'Art direction', 'UX and UI', '3D and animation', 'Frontend', 'Booking system', 'Content', 'SEO'],
    },
  },
];

export function getProject(slug: string): Project | null {
  return PROJECTS.find((project) => project.slug === slug) ?? null;
}
