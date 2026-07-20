export type Lang = 'de' | 'en';

export const T = {
  de: {
    nav: {
      about: 'Dein Digitalpartner', services: 'Meine Umsetzung', portfolio: 'Meine Referenzen',
      process: 'Ablauf', book: 'Deine Lösung starten',
    },
    hero: {
      badge: 'Digitale Gesamtlösungen · Bern',
      tagline: 'Für Schweizer KMU und Start-ups – persönlich von der Analyse bis zum Go-live.',
      title: 'Deine digitale Gesamtlösung.',
      subtitle: 'Ich verbinde Websites, Portale, CRM/ERP, Daten und manuelle Prozesse zu einer skalierbaren Gesamtlösung. KI setze ich dort ein, wo sie im Alltag einen konkreten Nutzen schafft.',
      cta: 'Deine Lösung starten', more: 'Lösungen ansehen',
    },
    about: {
      label: 'Ansatz', heading: 'Eine Lösung, die wirklich hält',
      text: 'Ich baue digitale Lösungen nicht als einzelne Bausteine, sondern als durchdachtes Ganzes: Marke, Website, Daten, Prozesse, Automatisierung und KI-Unterstützung greifen sauber ineinander. Ziel ist nicht ein schönes Stück Oberfläche, sondern ein System, das im Alltag funktioniert, mitwächst und langfristig verlässlich bleibt.',
      facts: [
        { label: 'Alles aus einer Hand', value: 'Design, Website, CRM, ERP, KI, Datenbank' },
        { label: 'Erfahrung', value: '15 Jahre Technologie & Kundenprojekte' },
        { label: 'Arbeitsweise', value: 'Schritt für Schritt, transparent, professionell' },
        { label: 'Anspruch', value: 'Schön, stabil, sicher und langfristig wartbar' },
      ],
      linkedin: 'LinkedIn', email: 'E-Mail',
    },
    services: {
      label: 'Meine Umsetzung', heading: 'Was ich für dich baue', more: 'Ansehen',
      items: [
        { title: 'Corporate Design & Markenauftritt', desc: 'Ein klarer visueller Auftritt, der professionell wirkt und überall konsistent bleibt.' },
        { title: 'Moderne 2D- & 3D-Websites', desc: 'Schöne, schnelle Websites mit starken Animationen, sauberer UX und technischer Substanz.' },
        { title: 'CRM-Lösungen', desc: 'Kunden, Leads, Aufgaben, Dokumente und Kommunikation zentral an einem Ort.' },
        { title: 'ERP- & Geschäftsprozesse', desc: 'Abläufe digitalisieren: Projekte, Rechnungen, Verträge, Termine, Zeit und Daten.' },
        { title: 'Datenbanken & Schnittstellen', desc: 'Solide Datenmodelle, sichere Zugriffe und Verbindungen zu bestehenden Tools.' },
        { title: 'KI-Automation & KI-Unterstützung', desc: 'Die besten KI-Lösungen finden, sinnvoll integrieren und konkrete Arbeit automatisieren.' },
        { title: 'Analyse & Konzept', desc: 'Problem verstehen, Anforderungen klären und eine Lösung entwerfen, die wirklich passt.' },
        { title: 'Umsetzung bis Go-Live', desc: 'Design, Entwicklung, Testing, Deployment und Übergabe strukturiert aus einer Hand.' },
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
      label: 'Warum so', heading: 'Ein Ansprechpartner. Eine Lösung.', subheading: 'Kein Flickwerk aus Tools, KI-Hype, Plugins und halbfertigen Übergaben.',
      stats: [
        { value: '1', label: 'Ansprechpartner für Konzept, Design und Technik' },
        { value: '15+', label: 'Jahre Erfahrung mit digitalen Systemen' },
        { value: '360°', label: 'Von Marke bis KI-Automation gedacht' },
        { value: 'Ende', label: 'Umsetzung bis alles funktioniert' },
      ],
      usp: [
        { title: 'Alles aus einem Guss', desc: 'Design, Website, Datenbank, CRM und Prozesse werden zusammen geplant. Dadurch wirkt die Lösung professionell und funktioniert technisch sauber.' },
        { title: 'Problem zuerst, KI danach', desc: 'Ich starte nicht mit einem Hype-Tool, sondern mit deinem konkreten Problem. Danach wähle ich die KI- oder Systemlösung, die wirklich Nutzen bringt.' },
        { title: 'Überblick im KI-Dschungel', desc: 'KI-Tools, Agenten, Automationen und Plattformen verändern sich laufend. Ich ordne ein, was relevant ist, und baue daraus eine belastbare Lösung.' },
        { title: 'Langfristig belastbar', desc: 'Die Lösung soll nicht nur beim Launch gut aussehen, sondern im Alltag halten: wartbar, sicher, erweiterbar und verständlich.' },
      ],
    },
    process: {
      label: 'Ablauf', heading1: 'Vom Problem ', heading2: 'zur kompletten Lösung',
      subheading: 'Schritt für Schritt, transparent und so umgesetzt, dass alles zusammenpasst.',
      cta: 'Deine Lösung starten',
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
      send: 'Nachricht senden', sending: 'Wird gesendet…',
      success: 'Vielen Dank! Ich melde mich bald.',
      error: 'Fehler beim Senden. Bitte versuche es erneut.',
    },
    footer: { copy: '© 2026 Marcel Spahr', imprint: 'Impressum', privacy: 'Datenschutz' },
  },

  en: {
    nav: {
      about: 'Your Digital Partner', services: 'My Execution', portfolio: 'My Work',
      process: 'Process', book: 'Start your solution',
    },
    hero: {
      badge: 'Complete digital solutions · Bern',
      tagline: 'For Swiss SMEs and startups – personally guided from analysis through go-live.',
      title: 'Your complete digital solution.',
      subtitle: 'I connect websites, portals, CRM/ERP, data and manual processes into one scalable solution. I use AI where it creates concrete value in day-to-day operations.',
      cta: 'Start your solution', more: 'View solutions',
    },
    about: {
      label: 'Approach', heading: 'A solution that actually holds up',
      text: 'I do not build digital solutions as isolated pieces. I connect brand, website, data, processes, automation and AI support into one coherent system. The goal is not just a beautiful surface, but a setup that works in daily business, grows with you and stays reliable.',
      facts: [
        { label: 'One source', value: 'Design, website, CRM, ERP, AI, database' },
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
        { title: 'Build to go-live', desc: 'Design, development, testing, deployment and handover from one source.' },
        { title: 'Maintenance & evolution', desc: 'After launch, the solution stays stable, secure and ready for the next step.' },
      ],
    },
    portfolio: {
      label: 'My Work', heading: 'Experience that holds up', subheading: 'Technology, processes, design and execution from real projects.',
      viewProject: 'View project', expertiseLabel: 'View full expertise',
      items: [
        { tag: 'Software', title: 'National app infrastructure', desc: 'Architecture, specification and quality for digital systems with high requirements.' },
        { tag: 'Transformation', title: 'Digitalisation in enterprise context', desc: '15 years of experience with processes, clients, systems and professional delivery.' },
        { tag: 'Brand & Web', title: 'SME presence and marketing', desc: 'Brand identity, website, content and visibility as one coherent picture.' },
        { tag: 'Requirements', title: 'From problem to solution', desc: 'Clarifying, prioritising and translating requirements into reliable digital solutions.' },
      ],
    },
    why: {
      label: 'Why this way', heading: 'One partner. One solution.', subheading: 'No patchwork of tools, AI hype, plugins and unfinished handovers.',
      stats: [
        { value: '1', label: 'Partner for concept, design and technology' },
        { value: '15+', label: 'Years with digital systems' },
        { value: '360°', label: 'Brand to AI automation, thought through' },
        { value: 'End', label: 'Delivery until everything works' },
      ],
      usp: [
        { title: 'Built as one system', desc: 'Design, website, database, CRM and processes are planned together. The result feels professional and works technically.' },
        { title: 'Problem first, AI second', desc: 'I do not start with a hype tool. I start with your concrete problem, then choose the AI or system solution that creates real value.' },
        { title: 'Overview in the AI jungle', desc: 'AI tools, agents, automations and platforms change constantly. I sort out what matters and build it into a reliable solution.' },
        { title: 'Built for the long term', desc: 'The solution should not only look good at launch. It must work in daily use: maintainable, secure, expandable and clear.' },
      ],
    },
    process: {
      label: 'Process', heading1: 'From problem ', heading2: 'to complete solution',
      subheading: 'Step by step, transparent and implemented so everything fits together.',
      cta: 'Start your solution',
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
      send: 'Send message', sending: 'Sending…',
      success: "Thank you! I'll be in touch soon.",
      error: 'Failed to send. Please try again.',
    },
    footer: { copy: '© 2026 Marcel Spahr', imprint: 'Imprint', privacy: 'Privacy' },
  },
} as const;
