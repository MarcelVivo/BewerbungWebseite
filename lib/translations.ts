export type Lang = 'de' | 'en';

export const T = {
  de: {
    nav: {
      about: 'Dein Digitalpartner', services: 'Meine Umsetzung', portfolio: 'Meine Referenzen',
      process: 'Ablauf', book: 'Projekt besprechen',
    },
    hero: {
      badge: 'Digitale Lösungen. Bern.',
      tagline: 'Ich begleite Schweizer KMU persönlich von der Analyse bis zur Einführung.',
      title: 'Ich baue deine digitale Lösung.',
      subtitle: 'Ich entwickle Websites, Portale, CRM, ERP und Automationen. Dabei verbinde ich Daten und Arbeitsabläufe so, dass sie im Alltag einfach funktionieren.',
      cta: 'Projekt besprechen', more: 'Lösungen ansehen',
    },
    about: {
      label: 'Meine Arbeitsweise', heading: 'Ich plane zuerst und baue danach.',
      text: 'Ich schaue mir zuerst deine Ziele, Daten und Arbeitsabläufe an. Danach entwickle ich Marke, Website, Systeme und Automationen so, dass sie zusammenpassen und dein Team sie im Alltag wirklich nutzen kann.',
      facts: [
        { label: 'Du arbeitest direkt mit mir.', value: 'Ich übernehme Design, Website, CRM, ERP, KI und Datenbank.' },
        { label: 'Erfahrung', value: '15 Jahre Technologie & Kundenprojekte' },
        { label: 'Arbeitsweise', value: 'Schritt für Schritt, transparent, professionell' },
        { label: 'Anspruch', value: 'Schön, stabil, sicher und langfristig wartbar' },
      ],
      linkedin: 'LinkedIn', email: 'E-Mail',
    },
    services: {
      label: 'Meine Umsetzung', heading: 'Was ich für dich baue', more: 'Ansehen',
      items: [
        { title: 'Corporate Design und Markenauftritt', desc: 'Ich entwickle einen klaren visuellen Auftritt, der überall wiedererkennbar bleibt.' },
        { title: 'Moderne 2D- und 3D-Websites', desc: 'Ich entwickle Websites, die gut aussehen, schnell laden und einfach zu bedienen sind.' },
        { title: 'CRM-Lösungen', desc: 'Kunden, Leads, Aufgaben, Dokumente und Kommunikation zentral an einem Ort.' },
        { title: 'ERP und Geschäftsprozesse', desc: 'Ich digitalisiere Projekte, Rechnungen, Verträge, Termine, Zeiten und Daten.' },
        { title: 'Datenbanken & Schnittstellen', desc: 'Solide Datenmodelle, sichere Zugriffe und Verbindungen zu bestehenden Tools.' },
        { title: 'KI Automation und KI Unterstützung', desc: 'Ich prüfe den konkreten Nutzen und automatisiere passende Arbeitsschritte.' },
        { title: 'Analyse & Konzept', desc: 'Problem verstehen, Anforderungen klären und eine Lösung entwerfen, die wirklich passt.' },
        { title: 'Umsetzung bis zur Einführung', desc: 'Ich übernehme Design, Entwicklung, Tests, Veröffentlichung und Übergabe.' },
        { title: 'Wartung & Weiterentwicklung', desc: 'Nach dem Launch bleibt die Lösung stabil, sicher und bereit für die nächsten Schritte.' },
      ],
    },
    portfolio: {
      label: 'Meine Referenzen', heading: 'Erfahrung, die trägt', subheading: 'Technologie, Prozesse, Design und Umsetzung aus realen Projekten.',
      viewProject: 'Projekt ansehen', expertiseLabel: 'Vollständige Expertise einsehen',
      items: [
        { tag: 'Software', title: 'Nationale App-Infrastruktur', desc: 'Architektur, Spezifikation und Qualität für digitale Systeme mit hohen Anforderungen.' },
        { tag: 'Transformation', title: 'Digitalisierung im Konzernumfeld', desc: '15 Jahre Erfahrung mit Prozessen, Kunden, Systemen und professioneller Umsetzung.' },
        { tag: 'Brand & Web', title: 'KMU-Auftritt und Marketing', desc: 'Markenidentität, Website, Inhalte und digitale Sichtbarkeit als stimmiges Gesamtbild.' },
        { tag: 'Requirements', title: 'Vom Problem zur Lösung', desc: 'Anforderungen sauber klären, priorisieren und in belastbare digitale Lösungen übersetzen.' },
      ],
    },
    why: {
      label: 'Warum direkt', heading: 'Du hast einen Ansprechpartner.', subheading: 'Ich bleibe von der ersten Besprechung bis zur Übergabe verantwortlich.',
      stats: [
        { value: '1', label: 'Ansprechpartner für Konzept, Design und Technik' },
        { value: '15+', label: 'Jahre Erfahrung mit digitalen Systemen' },
        { value: '360°', label: 'Von Marke bis KI-Automation gedacht' },
        { value: 'Ende', label: 'Umsetzung bis alles funktioniert' },
      ],
      usp: [
        { title: 'Ich plane die Bereiche gemeinsam.', desc: 'Ich stimme Design, Website, Datenbank, CRM und Prozesse direkt aufeinander ab.' },
        { title: 'Ich beginne mit dem Problem.', desc: 'Ich kläre zuerst deine konkrete Aufgabe. Danach wähle ich die KI oder Systemlösung, die nachweisbar helfen kann.' },
        { title: 'Ich prüfe KI Werkzeuge sachlich.', desc: 'Ich vergleiche Nutzen, Sicherheit und Aufwand und empfehle nur, was im Alltag hilft.' },
        { title: 'Langfristig belastbar', desc: 'Die Lösung soll nicht nur beim Launch gut aussehen, sondern im Alltag halten: wartbar, sicher, erweiterbar und verständlich.' },
      ],
    },
    process: {
      label: 'Ablauf', heading1: 'Vom Problem ', heading2: 'zur kompletten Lösung',
      subheading: 'Schritt für Schritt, transparent und so umgesetzt, dass alles zusammenpasst.',
      cta: 'Projekt besprechen',
      steps: [
        { num: '01', title: 'Problem verstehen', badge: 'Start', tagline: 'Ziele, Alltag und Engpässe klären', desc: 'Wir besprechen, was heute nicht funktioniert, was besser werden soll und welche Lösung für dein Unternehmen wirklich Sinn ergibt.' },
        { num: '02', title: 'Lösung planen', badge: 'Konzept', tagline: 'Design, Daten und Prozesse verbinden', desc: 'Ich entwerfe den roten Faden: Struktur, Funktionen, Datenmodell, Designrichtung und sinnvolle Etappen.' },
        { num: '03', title: 'System bauen', badge: 'Umsetzung', tagline: 'Website, CRM, ERP oder KI-Automation', desc: 'Die Lösung wird professionell umgesetzt: klar gestaltet, technisch sauber, sicher und auf deinen Alltag ausgerichtet.' },
        { num: '04', title: 'Testen & übergeben', badge: 'Go-Live', tagline: 'Prüfen, erklären, stabil starten', desc: 'Vor dem Launch wird getestet, bereinigt und verständlich übergeben. Du bekommst kein Rätsel, sondern ein nutzbares System.' },
        { num: '05', title: 'Weiterentwickeln', badge: 'Langfristig', tagline: 'Ausbauen, verbessern, betreiben', desc: 'Nach dem Start kann die Lösung wachsen: neue Funktionen, Automationen, Daten, Auswertungen oder Anpassungen.' },
      ],
    },
    form: {
      name: 'Name', email: 'E-Mail', message: 'Nachricht',
      send: 'Nachricht senden', sending: 'Ich sende deine Nachricht.',
      success: 'Vielen Dank! Ich melde mich bald.',
      error: 'Fehler beim Senden. Bitte versuche es erneut.',
    },
    footer: { copy: '© 2026 Marcel Spahr', imprint: 'Impressum', privacy: 'Datenschutz' },
  },

  en: {
    nav: {
      about: 'Your Digital Partner', services: 'My Execution', portfolio: 'My Work',
      process: 'Process', book: 'Discuss your project',
    },
    hero: {
      badge: 'Digital solutions. Bern.',
      tagline: 'I personally support Swiss SMEs from the first review through introduction.',
      title: 'I build your digital solution.',
      subtitle: 'I develop websites, portals, CRM, ERP and automation. I connect data and work processes so that they function simply in daily use.',
      cta: 'Discuss your project', more: 'View solutions',
    },
    about: {
      label: 'How I work', heading: 'I plan first and build afterwards.',
      text: 'I first look at your goals, data and work processes. I then develop the brand, website, systems and automation so that they fit together and your team can use them in daily work.',
      facts: [
        { label: 'You work directly with me.', value: 'I handle design, website, CRM, ERP, AI and database.' },
        { label: 'Experience', value: '15 years in technology and client projects' },
        { label: 'Method', value: 'Step by step, transparent, professional' },
        { label: 'Standard', value: 'Beautiful, stable, secure and maintainable' },
      ],
      linkedin: 'LinkedIn', email: 'Email',
    },
    services: {
      label: 'My Execution', heading: 'What I build for you', more: 'View',
      items: [
        { title: 'Corporate design & brand presence', desc: 'A clear visual identity that feels professional and stays consistent everywhere.' },
        { title: 'Modern 2D & 3D websites', desc: 'Beautiful, fast websites with strong motion, clear UX and technical substance.' },
        { title: 'CRM solutions', desc: 'Customers, leads, tasks, documents and communication in one central place.' },
        { title: 'ERP & business processes', desc: 'Digitise operations: projects, invoices, contracts, appointments, time and data.' },
        { title: 'Databases & integrations', desc: 'Solid data models, secure access and connections to existing tools.' },
        { title: 'AI automation & AI support', desc: 'Find the right AI solutions, integrate them sensibly and automate concrete work.' },
        { title: 'Analysis & concept', desc: 'Understand the problem, clarify requirements and design the right solution.' },
        { title: 'Implementation through introduction', desc: 'I handle design, development, testing, publication and handover.' },
        { title: 'Maintenance & evolution', desc: 'After launch, the solution stays stable, secure and ready for the next step.' },
      ],
    },
    portfolio: {
      label: 'My Work', heading: 'Experience that holds up', subheading: 'Technology, processes, design and execution from real projects.',
      viewProject: 'View project', expertiseLabel: 'View full expertise',
      items: [
        { tag: 'Software', title: 'National app infrastructure', desc: 'Architecture, specification and quality for digital systems with high requirements.' },
        { tag: 'Transformation', title: 'Digitalisation in enterprise context', desc: '15 years of experience with processes, clients, systems and professional delivery.' },
        { tag: 'Brand and web', title: 'SME presence and marketing', desc: 'I connect brand, website, content and visibility in one clear appearance.' },
        { tag: 'Requirements', title: 'From problem to solution', desc: 'Clarifying, prioritising and translating requirements into reliable digital solutions.' },
      ],
    },
    why: {
      label: 'Why direct', heading: 'You have one contact person.', subheading: 'I remain responsible from the first discussion through handover.',
      stats: [
        { value: '1', label: 'Partner for concept, design and technology' },
        { value: '15+', label: 'Years with digital systems' },
        { value: '360°', label: 'Brand to AI automation, thought through' },
        { value: 'End', label: 'Delivery until everything works' },
      ],
      usp: [
        { title: 'Built as one system', desc: 'Design, website, database, CRM and processes are planned together. The result feels professional and works technically.' },
        { title: 'I start with the problem.', desc: 'I first clarify your specific task. I then choose the AI or system solution that can provide a measurable benefit.' },
        { title: 'I assess AI tools carefully.', desc: 'I compare benefit, security and effort and only recommend what helps in daily work.' },
        { title: 'Built for the long term', desc: 'The solution should not only look good at launch. It must work in daily use: maintainable, secure, expandable and clear.' },
      ],
    },
    process: {
      label: 'Process', heading1: 'From problem ', heading2: 'to complete solution',
      subheading: 'Step by step, transparent and implemented so everything fits together.',
      cta: 'Discuss your project',
      steps: [
        { num: '01', title: 'Understand the problem', badge: 'Start', tagline: 'Goals, daily work and bottlenecks', desc: 'We clarify what does not work today, what should improve and what kind of solution makes sense for your business.' },
        { num: '02', title: 'Plan the solution', badge: 'Concept', tagline: 'Connect design, data and processes', desc: 'I define the thread: structure, functions, data model, design direction and meaningful delivery stages.' },
        { num: '03', title: 'Build the system', badge: 'Build', tagline: 'Website, CRM, ERP or AI automation', desc: 'The solution is implemented professionally: clearly designed, technically clean, secure and aligned with your daily work.' },
        { num: '04', title: 'Test & hand over', badge: 'Go-live', tagline: 'Check, explain, launch stable', desc: 'Before launch, everything is tested, cleaned up and handed over clearly. You get a usable system, not a puzzle.' },
        { num: '05', title: 'Evolve further', badge: 'Long term', tagline: 'Extend, improve, operate', desc: 'After launch, the solution can grow: new features, automations, data, reports or adjustments.' },
      ],
    },
    form: {
      name: 'Name', email: 'Email', message: 'Message',
      send: 'Send message', sending: 'I am sending your message.',
      success: "Thank you! I'll be in touch soon.",
      error: 'Failed to send. Please try again.',
    },
    footer: { copy: '© 2026 Marcel Spahr', imprint: 'Imprint', privacy: 'Privacy' },
  },
} as const;
