export type Lang = 'de' | 'en';

export const T = {
  de: {
    nav: {
      about: 'Über mich', services: 'Leistungen', portfolio: 'Portfolio',
      process: 'Ablauf', contact: 'Kontakt', book: 'Termin buchen',
    },
    hero: {
      badge: 'KI-Unternehmensberater · 15 Jahre Swisscom · Bern',
      tagline: 'KI ist das Instrument — der Mensch der Dirigent.',
      title: 'Menschliche Erfahrung. KI-Präzision.',
      subtitle: 'KI automatisiert – aber Kreativität, Empathie und strategisches Denken im grossen Ganzen bleiben menschlich. Mit 15 Jahren Swisscom-Erfahrung und modernsten KI-Werkzeugen optimiere ich dein KMU bis ins kleinste Detail: Prozesse, Automatisierung, Marketing, Website. Wirklich zu Ende gedacht – ohne Stolpersteine.',
      cta: 'Termin buchen', more: 'Mehr erfahren',
    },
    about: {
      label: 'About', heading: 'Über mich',
      text: 'Ich bin Marcel Spahr – der Wirtschaftsinformatiker, der denkt wie ein Kreativdirektor. Bei Swisscom habe ich 15 Jahre lang gelernt, wie grosse Unternehmen funktionieren. Heute bringe ich dieses Wissen zu Schweizer KMU – gepaart mit modernster KI, Prozessautomatisierung und einer Leidenschaft für Innovation.',
      facts: [
        { label: 'Ausbildung', value: 'HF Wirtschaftsinformatik 2026' },
        { label: 'Erfahrung', value: '15 Jahre Swisscom' },
        { label: 'Spezialisierung', value: 'KI-Berater seit 2022' },
        { label: 'Kreativ', value: 'Grafiker & Werbetechniker' },
      ],
      linkedin: 'LinkedIn', email: 'E-Mail',
    },
    services: {
      label: 'Services', heading: 'Leistungen', more: 'Mehr erfahren',
      items: [
        { title: 'KI-Agenten & Automatisierung', desc: 'Intelligente Agenten die für dich arbeiten – 24/7' },
        { title: 'Business Analyse & Requirements', desc: 'Prozesse verstehen, Lösungen definieren' },
        { title: 'Prozessoptimierung (BPMN)', desc: 'Manuelle Abläufe digitalisieren und automatisieren' },
        { title: 'Digital Marketing & Social Media', desc: 'LinkedIn, Content-Strategie, KI-unterstütztes Marketing' },
        { title: 'Video-Produktion', desc: 'Erklärvideos, Unternehmensfilme, Social-Content' },
        { title: 'Projektmanagement', desc: 'Von der Idee bis zum Go-Live – strukturiert und agil' },
        { title: 'Workshops & Schulungen', desc: 'KI-Schulungen für Teams (ChatGPT, Copilot, Automatisierung)' },
        { title: 'Website-Optimierung', desc: 'Performance, SEO, Conversion – für KMU optimiert' },
        { title: 'KI-Beratung für KMU', desc: 'Digitalisierungsanalyse und KI-Roadmap' },
      ],
    },
    portfolio: {
      label: 'Portfolio', heading: 'Portfolio', subheading: 'Ausgewählte Projekte & Arbeiten',
      viewDoc: 'Dokument ansehen', internal: 'Intern / auf Anfrage',
      items: [
        { tag: 'Software Engineering', title: 'Swiss COVID Certificate App', desc: 'Software-Architektur und technische Dokumentation der schweizweiten COVID-Zertifikats-App.' },
        { tag: 'Requirements Engineering', title: 'Software & Requirements Engineering', desc: 'Abschlussarbeit zu modernen Requirements-Engineering-Methoden: User Stories, BPMN und agile Anforderungserfassung.' },
        { tag: 'Digital Marketing', title: "Olivia's Olivenpaste", desc: 'Vollständige Digital-Marketing-Strategie für ein Schweizer KMU: Markenaufbau, Social-Media-Konzept und Content-Plan.' },
        { tag: 'Event & Marketing', title: '90s Love Mobile – Streetparade', desc: 'Konzeption und Vermarktung eines Love Mobiles an der Streetparade Zürich – von Sponsoring bis Social-Media-Kampagne.' },
        { tag: 'Leadership', title: 'Persönliches Führungshandbuch', desc: 'Reflexion eigener Führungsprinzipien und Entwicklung eines persönlichen Führungsansatzes basierend auf modernen Leadership-Theorien.' },
        { tag: 'Prozessoptimierung', title: 'Digitalisierung @ Swisscom', desc: '15 Jahre Mitgestaltung der digitalen Transformation: Prozessautomatisierung, Reporting-Pipelines und Stakeholder-Management.' },
      ],
    },
    why: {
      label: 'Referenzen', heading: 'Warum Marcel?', subheading: 'Was mich von anderen unterscheidet',
      stats: [
        { value: '15+', label: 'Jahre Berufserfahrung' },
        { value: '50+', label: 'Projekte umgesetzt' },
        { value: '2', label: 'EFZ Abschlüsse' },
        { value: '2026', label: 'HF Wirtschaftsinformatik' },
      ],
      usp: [
        { title: 'Technologie & Kreativität', desc: 'Ich verbinde technisches Know-how mit kreativem Denken – selten in einer Person vereint.' },
        { title: 'Kundennähe & Empathie', desc: '15 Jahre im direkten Kundenkontakt bei Swisscom haben mein Gespür für Menschen geschärft.' },
        { title: 'Ganzheitlicher Ansatz', desc: 'Von der Analyse über das Konzept bis zur Umsetzung – alles aus einer Hand.' },
        { title: 'Kontinuierliches Lernen', desc: 'HF Wirtschaftsinformatik, SAFe, Scrum, KI-Zertifikate – ich bilde mich laufend weiter.' },
      ],
    },
    process: {
      label: 'Ablauf', heading1: 'So arbeiten ', heading2: 'wir zusammen',
      subheading: 'Ein strukturierter, transparenter Prozess – damit du immer weisst, was als Nächstes kommt.',
      cta: 'Jetzt Erstgespräch buchen',
      steps: [
        { num: '01', title: 'Erstgespräch', badge: 'Kostenlos', tagline: 'Kennenlernen & Ziele verstehen', desc: 'Wir sprechen 30 Minuten über dein Unternehmen, deine aktuellen Herausforderungen und was du erreichen möchtest. Ohne Verpflichtung – ich höre zu, bevor ich etwas vorschlage.' },
        { num: '02', title: 'Analyse', badge: 'Woche 1–2', tagline: 'Verstehen, wo du stehst', desc: 'Ich analysiere deine Prozesse, Daten und Potenziale. Damit wir von Anfang an das Richtige angehen – und keine Zeit mit falschen Lösungen verlieren.' },
        { num: '03', title: 'Konzept & Strategie', badge: 'Woche 2–3', tagline: 'Den richtigen Weg definieren', desc: 'Ich entwickle einen massgeschneiderten Plan mit konkreten Massnahmen, Zeitplan und realistischen Ergebnissen – transparent und gemeinsam mit dir validiert.' },
        { num: '04', title: 'Umsetzung', badge: 'ab Woche 3', tagline: 'Konkret und zügig handeln', desc: 'Die definierten Massnahmen werden professionell umgesetzt – ob KI-Agent, Prozessoptimierung oder Marketing-Strategie. Du wirst dabei laufend informiert und einbezogen.' },
        { num: '05', title: 'Begleitung', badge: 'Dauerhaft', tagline: 'Langfristig an deiner Seite', desc: 'Ich bleibe dein Ansprechpartner. Ob Fragen, neue Ideen oder Anpassungen – ich bin für dich da und sorge dafür, dass die Ergebnisse nachhaltig wirken.' },
      ],
    },
    contact: { label: 'Contact', heading: 'Kontakt', location: 'Bern, Schweiz' },
    form: {
      name: 'Name', email: 'E-Mail', message: 'Nachricht',
      send: 'Nachricht senden', sending: 'Wird gesendet…',
      success: 'Vielen Dank! Ich melde mich bald.',
      error: 'Fehler beim Senden. Bitte versuche es erneut.',
    },
    faq: {
      label: 'FAQ', heading: 'Häufige Fragen',
      items: [
        { q: 'Was macht ein kreativer KI-Unternehmensberater?', a: 'Ein kreativer KI-Unternehmensberater verbindet technisches KI-Know-how mit strategischem Denken und kreativem Problemlösen. Ich analysiere dein Unternehmen, identifiziere konkrete KI-Potenziale und begleite die Umsetzung – von der Strategie über die Konzeption bis zum laufenden, automatisierten System.' },
        { q: 'Für welche Unternehmen ist KI-Beratung geeignet?', a: 'KI-Beratung eignet sich für jedes KMU, das wiederkehrende Prozesse hat, Zeit sparen möchte oder digital wachsen will – unabhängig von der Branche. Ob Handwerksbetrieb, Beratungsunternehmen oder Online-Shop: KI lässt sich fast überall sinnvoll einsetzen und bringt messbare Ergebnisse.' },
        { q: 'Was kostet eine KI-Beratung bei Marcel Spahr?', a: 'Die Erstberatung ist kostenlos und unverbindlich. Konkrete Projekte werden individuell nach Aufwand und Projektumfang berechnet. Kontaktiere mich für ein unverbindliches Angebot – ich melde mich innerhalb von 2 Arbeitstagen.' },
        { q: 'Wie lange dauert ein typisches KI-Projekt?', a: 'Ein erster Quick Win – zum Beispiel ein einfacher KI-Agent oder ein optimierter Prozess – ist oft innerhalb von 2 bis 4 Wochen umgesetzt. Grössere Projekte wie eine vollständige KI-Roadmap dauern 2 bis 3 Monate. Ich arbeite mit klaren Meilensteinen und regelmässigen Status-Updates.' },
        { q: 'Arbeitet Marcel Spahr auch remote oder nur in Bern?', a: 'Die meisten Projekte laufen hybrid: Kick-off und wichtige Workshops gerne persönlich in Bern oder direkt bei dir vor Ort, der Rest effizient remote. Ich arbeite mit Kunden in der gesamten Deutschschweiz zusammen.' },
      ],
    },
    footer: { copy: '© 2026 Marcel Spahr', imprint: 'Impressum', privacy: 'Datenschutz' },
  },

  en: {
    nav: {
      about: 'About Me', services: 'Services', portfolio: 'Portfolio',
      process: 'Process', contact: 'Contact', book: 'Book a Call',
    },
    hero: {
      badge: 'AI Business Consultant · 15 years Swisscom · Bern',
      tagline: 'AI is the instrument — the human the conductor.',
      title: 'Human Experience. AI Precision.',
      subtitle: 'AI automates – but creativity, empathy, and strategic big-picture thinking remain human. With 15 years at Swisscom and the latest AI tools, I optimise your SME down to the last detail: processes, automation, marketing, website. Truly thought through to the end – no stumbling blocks.',
      cta: 'Book a Call', more: 'Learn more',
    },
    about: {
      label: 'About', heading: 'About Me',
      text: "I'm Marcel Spahr – the business informatics specialist who thinks like a creative director. At Swisscom, I spent 15 years learning how large corporations operate. Today I bring this knowledge to Swiss SMEs – combined with state-of-the-art AI, process automation, and a passion for innovation.",
      facts: [
        { label: 'Education', value: 'HF Business Informatics 2026' },
        { label: 'Experience', value: '15 Years at Swisscom' },
        { label: 'Specialization', value: 'AI Consultant since 2022' },
        { label: 'Creative', value: 'Graphic & Sign Designer' },
      ],
      linkedin: 'LinkedIn', email: 'Email',
    },
    services: {
      label: 'Services', heading: 'Services', more: 'Learn more',
      items: [
        { title: 'AI Agents & Automation', desc: 'Intelligent agents working for you – 24/7' },
        { title: 'Business Analysis & Requirements', desc: 'Understanding processes, defining solutions' },
        { title: 'Process Optimization (BPMN)', desc: 'Digitalize and automate manual workflows' },
        { title: 'Digital Marketing & Social Media', desc: 'LinkedIn, content strategy, AI-powered marketing' },
        { title: 'Video Production', desc: 'Explainer videos, corporate films, social content' },
        { title: 'Project Management', desc: 'From idea to go-live – structured and agile' },
        { title: 'Workshops & Training', desc: 'AI training for teams (ChatGPT, Copilot, Automation)' },
        { title: 'Website Optimization', desc: 'Performance, SEO, Conversion – optimized for SMEs' },
        { title: 'AI Consulting for SMEs', desc: 'Digitalization analysis and AI roadmap' },
      ],
    },
    portfolio: {
      label: 'Portfolio', heading: 'Portfolio', subheading: 'Selected Projects & Work',
      viewDoc: 'View document', internal: 'Internal / on request',
      items: [
        { tag: 'Software Engineering', title: 'Swiss COVID Certificate App', desc: "Software architecture and technical documentation for Switzerland's nationwide COVID certificate app." },
        { tag: 'Requirements Engineering', title: 'Software & Requirements Engineering', desc: 'Final thesis on modern requirements engineering methods: user stories, BPMN, and agile requirements gathering.' },
        { tag: 'Digital Marketing', title: "Olivia's Olive Paste", desc: 'Complete digital marketing strategy for a Swiss SME: brand building, social media concept, and content plan.' },
        { tag: 'Event & Marketing', title: '90s Love Mobile – Street Parade', desc: 'Design and marketing of a Love Mobile at the Zurich Street Parade – from sponsoring to social media campaign.' },
        { tag: 'Leadership', title: 'Personal Leadership Handbook', desc: 'Reflection on personal leadership principles and development of a leadership approach based on modern leadership theories.' },
        { tag: 'Process Optimization', title: 'Digitalization @ Swisscom', desc: '15 years co-shaping digital transformation: process automation, reporting pipelines, and stakeholder management.' },
      ],
    },
    why: {
      label: 'References', heading: 'Why Marcel?', subheading: 'What sets me apart',
      stats: [
        { value: '15+', label: 'Years of Experience' },
        { value: '50+', label: 'Projects Delivered' },
        { value: '2', label: 'EFZ Qualifications' },
        { value: '2026', label: 'HF Business Informatics' },
      ],
      usp: [
        { title: 'Technology & Creativity', desc: 'I combine technical expertise with creative thinking – a rare combination in one person.' },
        { title: 'Client Focus & Empathy', desc: '15 years of direct client contact at Swisscom have sharpened my instinct for people.' },
        { title: 'Holistic Approach', desc: 'From analysis through concept to implementation – everything from one source.' },
        { title: 'Continuous Learning', desc: 'HF Business Informatics, SAFe, Scrum, AI certificates – I continuously develop my skills.' },
      ],
    },
    process: {
      label: 'Process', heading1: 'How we work ', heading2: 'together',
      subheading: 'A structured, transparent process – so you always know what comes next.',
      cta: 'Book your initial call now',
      steps: [
        { num: '01', title: 'Initial Call', badge: 'Free', tagline: 'Getting acquainted & understanding goals', desc: 'We talk for 30 minutes about your business, your current challenges, and what you want to achieve. No commitment – I listen before suggesting anything.' },
        { num: '02', title: 'Analysis', badge: 'Week 1–2', tagline: 'Understanding where you stand', desc: "I analyze your processes, data, and potential. So we tackle the right things from the start – and don't waste time on the wrong solutions." },
        { num: '03', title: 'Concept & Strategy', badge: 'Week 2–3', tagline: 'Defining the right path', desc: 'I develop a tailored plan with concrete measures, timelines, and realistic results – transparent and validated together with you.' },
        { num: '04', title: 'Implementation', badge: 'from Week 3', tagline: 'Acting concretely and swiftly', desc: "The defined measures are professionally implemented – whether AI agent, process optimization, or marketing strategy. You'll be continuously informed and involved." },
        { num: '05', title: 'Ongoing Support', badge: 'Ongoing', tagline: 'By your side long-term', desc: "I remain your point of contact. Whether questions, new ideas, or adjustments – I'm here for you and ensure results have lasting impact." },
      ],
    },
    contact: { label: 'Contact', heading: 'Contact', location: 'Bern, Switzerland' },
    form: {
      name: 'Name', email: 'Email', message: 'Message',
      send: 'Send message', sending: 'Sending…',
      success: "Thank you! I'll be in touch soon.",
      error: 'Failed to send. Please try again.',
    },
    faq: {
      label: 'FAQ', heading: 'Frequently Asked Questions',
      items: [
        { q: 'What does a creative AI business consultant do?', a: 'A creative AI business consultant combines technical AI expertise with strategic thinking and creative problem-solving. I analyze your business, identify concrete AI potentials, and guide implementation – from strategy through concept to the running, automated system.' },
        { q: 'Which companies benefit from AI consulting?', a: 'AI consulting is suitable for any SME with recurring processes, that wants to save time, or wants to grow digitally – regardless of industry. Whether a trade business, consulting firm, or online shop: AI can be meaningfully applied almost anywhere and delivers measurable results.' },
        { q: 'What does AI consulting with Marcel Spahr cost?', a: "The initial consultation is free and non-binding. Concrete projects are individually priced based on scope and effort. Contact me for a no-obligation quote – I'll respond within 2 business days." },
        { q: 'How long does a typical AI project take?', a: 'A first quick win – for example a simple AI agent or an optimized process – is often implemented within 2 to 4 weeks. Larger projects such as a complete AI roadmap take 2 to 3 months. I work with clear milestones and regular status updates.' },
        { q: 'Does Marcel Spahr work remotely or only in Bern?', a: 'Most projects run hybrid: kickoff and important workshops in person in Bern or at your location, the rest efficiently remote. I work with clients across German-speaking Switzerland and beyond.' },
      ],
    },
    footer: { copy: '© 2026 Marcel Spahr', imprint: 'Imprint', privacy: 'Privacy' },
  },
} as const;
