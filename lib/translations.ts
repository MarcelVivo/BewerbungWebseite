export type Lang = 'de' | 'en';

export const T = {
  de: {
    nav: {
      about: 'Über mich', services: 'Leistungen', portfolio: 'Portfolio',
      process: 'Ablauf', contact: 'Kontakt', book: 'Termin buchen',
    },
    hero: {
      badge: 'KI-Unternehmensberater · 15 Jahre Praxiserfahrung · Bern',
      tagline: 'KI ist das Instrument — der Mensch der Dirigent.',
      title: 'Menschliche Erfahrung. KI-Präzision.',
      subtitle: 'KI automatisiert – aber Kreativität, Empathie und strategisches Denken im grossen Ganzen bleiben menschlich. Mit 15 Jahren Swisscom-Erfahrung und modernsten KI-Werkzeugen optimiere ich dein KMU bis ins kleinste Detail: Prozesse, Automatisierung, Marketing, Website. Wirklich zu Ende gedacht – ohne Stolpersteine.',
      cta: 'Termin buchen', more: 'Mehr erfahren',
    },
    about: {
      label: 'About', heading: 'Über mich',
      text: 'Ich bin Marcel Spahr – Wirtschaftsinformatiker, Kreativdenker und KI-Experte. 15 Jahre Praxiserfahrung in einem der grössten Schweizer Technologieunternehmen haben mir eines gezeigt: KI allein reicht nicht. Erst die Kombination aus menschlicher Empathie, strategischem Big-Picture-Denken und den richtigen KI-Werkzeugen erzielt Ergebnisse, die wirklich halten. Ich denke jede Lösung bis zum Ende – ohne Lücken, ohne Stolpersteine.',
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
      label: 'Portfolio', heading: 'Ausgewählte Projekte', subheading: 'Einblicke in meine Arbeit – von Enterprise-Projekten bis zu KMU-Mandaten.',
      viewProject: 'Projekt ansehen', expertiseLabel: 'Vollständige Expertise einsehen',
      items: [
        { tag: 'Software Engineering', title: 'Swiss COVID Certificate App', desc: 'Softwarearchitektur und technische Spezifikation für eine nationale Infrastruktur mit Millionen von Nutzern.' },
        { tag: 'Prozessoptimierung', title: 'Digitalisierung @ Swisscom', desc: '15 Jahre Mitgestaltung der digitalen Transformation bei einem der grössten Schweizer Technologiekonzerne.' },
        { tag: 'Digital Marketing', title: "Olivia's Olivenpaste", desc: 'Vollständige Digital-Marketing-Strategie für ein Schweizer KMU: Markenidentität, Social-Media und Content-Plan.' },
        { tag: 'Requirements Engineering', title: 'Software & Requirements Engineering', desc: 'Professionelle Anforderungsanalyse für ein reales IT-Projekt – vollständig nach Industriestandard.' },
      ],
    },
    why: {
      label: 'Referenzen', heading: 'Warum Marcel?', subheading: 'KI ist mächtig. Aber erst der Mensch dahinter macht den Unterschied.',
      stats: [
        { value: '15+', label: 'Jahre Berufserfahrung' },
        { value: '50+', label: 'Projekte umgesetzt' },
        { value: '2', label: 'EFZ Abschlüsse' },
        { value: '2026', label: 'HF Wirtschaftsinformatik' },
      ],
      usp: [
        { title: 'KI als Werkzeug – ich als Dirigent', desc: 'KI automatisiert und skaliert. Aber wissen, wo KI wirklich hilft und wo nicht – das braucht Erfahrung, Urteilsvermögen und strategisches Denken. Genau das bringe ich mit.' },
        { title: 'Empathie & Menschlichkeit', desc: 'Was kein Algorithmus kann: echtes Zuhören, Vertrauen aufbauen, Probleme erspüren bevor sie entstehen. 15 Jahre direkte Kundennähe – das ist mein menschlicher Vorteil.' },
        { title: 'Big Picture – zu Ende gedacht', desc: 'Ich sehe das Gesamtbild und denke jede Lösung konsequent bis zum Schluss durch. Keine Lücken, keine Überraschungen – nur Ergebnisse, die wirklich funktionieren.' },
        { title: 'Immer am Puls der Zeit', desc: 'KI entwickelt sich täglich weiter. Ich auch: HF Wirtschaftsinformatik, SAFe, Scrum, KI-Zertifikate – damit du immer die aktuellsten Lösungen erhältst.' },
      ],
    },
    process: {
      label: 'Ablauf', heading1: 'So arbeiten ', heading2: 'wir zusammen',
      subheading: 'Mensch und KI Hand in Hand – strukturiert, transparent und wirklich zu Ende gedacht.',
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
        { q: 'Was macht ein kreativer KI-Unternehmensberater?', a: 'Ein kreativer KI-Unternehmensberater verbindet KI-Technologie mit menschlicher Empathie, Kreativität und jahrelanger Praxiserfahrung. KI ist ein mächtiges Instrument – aber ohne die richtige menschliche Führung bleibt sie wirkungslos. Ich erkenne, wo KI wirklich hilft, denke Lösungen bis zum Ende und sorge dafür, dass die Ergebnisse nicht nur funktionieren, sondern nachhaltig wirken.' },
        { q: 'Kann KI allein mein KMU optimieren?', a: 'Nein – und das ist der entscheidende Punkt. KI kann automatisieren, analysieren und skalieren. Aber das strategische Gespür für das grosse Ganze, Empathie für Kunden und Mitarbeitende und die Erfahrung, Lösungen wirklich zu Ende zu denken – das bleibt menschlich. Erst die Fusion aus Mensch und KI liefert Ergebnisse, die wirklich halten und dein Unternehmen zukunftssicher machen.' },
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
      badge: 'AI Business Consultant · 15 Years of Experience · Bern',
      tagline: 'AI is the instrument — the human the conductor.',
      title: 'Human Experience. AI Precision.',
      subtitle: 'AI automates – but creativity, empathy, and strategic big-picture thinking remain human. With 15 years at Swisscom and the latest AI tools, I optimise your SME down to the last detail: processes, automation, marketing, website. Truly thought through to the end – no stumbling blocks.',
      cta: 'Book a Call', more: 'Learn more',
    },
    about: {
      label: 'About', heading: 'About Me',
      text: "I'm Marcel Spahr – business informatics specialist, creative thinker, and AI expert. 15 years of hands-on experience at one of Switzerland's largest tech companies taught me one thing above all: AI alone is not enough. Only the fusion of human empathy, strategic big-picture thinking, and the right AI tools produces results that truly last. I think every solution through to the very end – no gaps, no stumbling blocks.",
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
      label: 'Portfolio', heading: 'Selected Projects', subheading: 'Insights into my work – from enterprise projects to SME mandates.',
      viewProject: 'View project', expertiseLabel: 'View full expertise',
      items: [
        { tag: 'Software Engineering', title: 'Swiss COVID Certificate App', desc: 'Software architecture and technical specification for a national infrastructure serving millions of users.' },
        { tag: 'Process Optimization', title: 'Digitalization @ Swisscom', desc: '15 years co-shaping digital transformation at one of Switzerland\'s largest technology groups.' },
        { tag: 'Digital Marketing', title: "Olivia's Olive Paste", desc: 'Complete digital marketing strategy for a Swiss SME: brand identity, social media, and content plan.' },
        { tag: 'Requirements Engineering', title: 'Software & Requirements Engineering', desc: 'Professional requirements analysis for a real IT project – fully to industry standard.' },
      ],
    },
    why: {
      label: 'References', heading: 'Why Marcel?', subheading: 'AI is powerful. But the human behind it makes all the difference.',
      stats: [
        { value: '15+', label: 'Years of Experience' },
        { value: '50+', label: 'Projects Delivered' },
        { value: '2', label: 'EFZ Qualifications' },
        { value: '2026', label: 'HF Business Informatics' },
      ],
      usp: [
        { title: 'AI as Tool – Me as Conductor', desc: 'AI automates and scales. But knowing where AI truly helps and where it doesn\'t – that requires experience, judgement, and strategic thinking. That\'s exactly what I bring.' },
        { title: 'Empathy & Human Touch', desc: 'What no algorithm can do: truly listening, building trust, sensing problems before they arise. 15 years of direct client contact – that\'s my human advantage.' },
        { title: 'Big Picture – Thought Through', desc: 'I see the whole picture and think every solution consistently through to the end. No gaps, no surprises – only results that truly work.' },
        { title: 'Always at the Cutting Edge', desc: 'AI evolves daily. So do I: HF Business Informatics, SAFe, Scrum, AI certificates – so you always get the most current solutions.' },
      ],
    },
    process: {
      label: 'Process', heading1: 'How we work ', heading2: 'together',
      subheading: 'Human and AI hand in hand – structured, transparent, and truly thought through to the end.',
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
        { q: 'What does a creative AI business consultant do?', a: 'A creative AI business consultant fuses AI technology with human empathy, creativity, and years of practical experience. AI is a powerful instrument – but without the right human guidance, it remains ineffective. I identify where AI truly helps, think solutions through to the very end, and ensure results don\'t just work – they last.' },
        { q: 'Can AI alone optimise my business?', a: 'No – and that\'s the crucial point. AI can automate, analyse, and scale. But the strategic sense for the big picture, empathy for customers and employees, and the experience to truly think solutions through to the end – that remains human. Only the fusion of human and AI delivers results that truly hold up and make your business future-proof.' },
        { q: 'What does AI consulting with Marcel Spahr cost?', a: "The initial consultation is free and non-binding. Concrete projects are individually priced based on scope and effort. Contact me for a no-obligation quote – I'll respond within 2 business days." },
        { q: 'How long does a typical AI project take?', a: 'A first quick win – for example a simple AI agent or an optimized process – is often implemented within 2 to 4 weeks. Larger projects such as a complete AI roadmap take 2 to 3 months. I work with clear milestones and regular status updates.' },
        { q: 'Does Marcel Spahr work remotely or only in Bern?', a: 'Most projects run hybrid: kickoff and important workshops in person in Bern or at your location, the rest efficiently remote. I work with clients across German-speaking Switzerland and beyond.' },
      ],
    },
    footer: { copy: '© 2026 Marcel Spahr', imprint: 'Imprint', privacy: 'Privacy' },
  },
} as const;
