export type Lang = 'de' | 'en';

export type ProjectLang = {
  title: string;
  tag: string;
  tagline: string;
  challenge: string;
  approach: string;
  result: string;
  points: string[];
  metaDesc: string;
};

export type Project = {
  slug: string;
  color: string;
  de: ProjectLang;
  en: ProjectLang;
};

export const PROJECTS: Project[] = [
  {
    slug: 'covid-certificate',
    color: '#4d7fbf',
    de: {
      title: 'Swiss COVID Certificate App',
      tag: 'Software Engineering',
      tagline: 'Softwarearchitektur für eine nationale Infrastruktur mit Millionen von Nutzern.',
      metaDesc: 'Softwarearchitektur-Dokumentation für die offizielle Swiss COVID Zertifikats-App – Systemkomponenten, Schnittstellen und Sicherheitsanforderungen.',
      challenge: 'Die Schweiz benötigte eine sichere, skalierbare App für die Verwaltung und Verifikation von COVID-Zertifikaten – mit höchsten Anforderungen an Datenschutz, Sicherheit und Verlässlichkeit bei gleichzeitig millionenfacher Nutzung.',
      approach: 'Ich erarbeitete die vollständige Softwarearchitektur-Dokumentation: Systemkomponenten, Schnittstellen, Sicherheitsanforderungen und Datenschutzkonzepte gemäss Schweizer DSG-Standards. Ziel war eine klare, wartbare Grundlage für alle beteiligten Entwicklungsteams.',
      result: 'Eine strukturierte, verständliche technische Spezifikation, die als Grundlage für die Entwicklung und die langfristige Wartung der App diente – vollständig dokumentiert und prüfbar.',
      points: [
        'Analyse und Dokumentation der Systemarchitektur',
        'Spezifikation von Schnittstellen und Datenflüssen',
        'Sicherheits- und Datenschutzanforderungen nach Schweizer DSG',
        'Technische Dokumentation für Entwicklungs- und Wartungsteams',
      ],
    },
    en: {
      title: 'Swiss COVID Certificate App',
      tag: 'Software Engineering',
      tagline: 'Software architecture for a national infrastructure serving millions of users.',
      metaDesc: 'Software architecture documentation for the official Swiss COVID certificate app – system components, interfaces, and security requirements.',
      challenge: "Switzerland needed a secure, scalable app for managing and verifying COVID certificates – with the highest demands on data privacy, security, and reliability while serving millions of users simultaneously.",
      approach: 'I developed the complete software architecture documentation: system components, interfaces, security requirements, and data protection concepts in accordance with Swiss DSG standards. The goal was a clear, maintainable foundation for all development teams involved.',
      result: 'A structured, clear technical specification that served as the foundation for developing and long-term maintaining the app – fully documented and auditable.',
      points: [
        'Analysis and documentation of system architecture',
        'Specification of interfaces and data flows',
        'Security and privacy requirements under Swiss DSG',
        'Technical documentation for development and maintenance teams',
      ],
    },
  },
  {
    slug: 'digitalisierung-swisscom',
    color: '#244d82',
    de: {
      title: 'Digitalisierung @ Swisscom',
      tag: 'Prozessoptimierung',
      tagline: '15 Jahre Mitgestaltung der digitalen Transformation bei einem der grössten Schweizer Technologiekonzerne.',
      metaDesc: '15 Jahre Praxiserfahrung in der digitalen Transformation bei Swisscom – Prozessautomatisierung, Requirements Engineering und Stakeholder-Management im SAFe-Umfeld.',
      challenge: 'Komplexe manuelle Prozesse, fehlende Datentransparenz und wachsender Digitalisierungsdruck in einem Grossunternehmen mit tausenden von Mitarbeitenden – und immer höhere Anforderungen an Agilität und Effizienz.',
      approach: 'Über 15 Jahre hinweg verantwortete ich Requirements Engineering für neue IT-Projekte, entwickelte automatisierte Reporting-Pipelines, optimierte interne Arbeitsprozesse und koordinierte Stakeholder im agilen SAFe-Framework – stets mit direktem Kundenkontakt.',
      result: 'Messbar effizientere Abläufe, automatisierte Reporting-Lösungen und die erfolgreiche Einführung neuer digitaler Tools – mit direktem Impact auf Produktivität und Qualität.',
      points: [
        'Requirements Engineering und User Stories für IT-Projekte',
        'Automatisierung von Reporting-Pipelines und Datenauswertungen',
        'Stakeholder-Koordination im SAFe-Agile-Framework',
        'Direkter Kundenkontakt und 15 Jahre gelebte Praxiserfahrung',
      ],
    },
    en: {
      title: 'Digitalization @ Swisscom',
      tag: 'Process Optimization',
      tagline: '15 years co-shaping digital transformation at one of Switzerland\'s largest technology groups.',
      metaDesc: '15 years of hands-on experience in digital transformation at Swisscom – process automation, requirements engineering, and stakeholder management in a SAFe environment.',
      challenge: 'Complex manual processes, lack of data transparency, and growing digitalization pressure in a large corporation with thousands of employees – combined with ever-increasing demands for agility and efficiency.',
      approach: 'Over 15 years, I handled requirements engineering for new IT projects, developed automated reporting pipelines, optimized internal work processes, and coordinated stakeholders in the agile SAFe framework – always with direct customer contact.',
      result: 'Measurably more efficient workflows, automated reporting solutions, and the successful rollout of new digital tools – with direct impact on productivity and quality.',
      points: [
        'Requirements engineering and user stories for IT projects',
        'Automation of reporting pipelines and data evaluations',
        'Stakeholder coordination in the SAFe agile framework',
        'Direct customer contact and 15 years of lived practical experience',
      ],
    },
  },
  {
    slug: 'olivias-olivenpaste',
    color: '#a6425c',
    de: {
      title: "Olivia's Olivenpaste",
      tag: 'Digital Marketing',
      tagline: 'Vollständige Digital-Marketing-Strategie für ein Schweizer KMU – von der Marke bis zum Content.',
      metaDesc: "Vollständige Marketingstrategie für Olivia's Olivenpaste: Markenidentität, Social-Media-Konzept und Absatzstrategie für einen Schweizer KMU-Markteintritt.",
      challenge: 'Ein Schweizer Start-up mit einem neuen Lebensmittelprodukt benötigte eine vollständige Markteintrittsstrategie: Markenidentität, digitale Präsenz, Content-Plan und Absatzkonzept – ohne grosses Budget, aber mit klarer Vision.',
      approach: 'Ich entwickelte die Markenidentität, ein Social-Media-Konzept, einen Content-Redaktionsplan sowie eine Absatzstrategie für den Markteintritt – vom ersten Brainstorming bis zur vollständig ausgearbeiteten Strategie, einsatzbereit für die Umsetzung.',
      result: 'Eine klare, konsistente Markenidentität, ein praxistauglicher Redaktionsplan und eine vollständige Marketing-Roadmap, die den Markteintritt strukturiert und von Anfang an skalierbar machte.',
      points: [
        'Markenentwicklung, Positionierung und visuelles Konzept',
        'Social-Media-Strategie für Instagram und LinkedIn',
        'Content-Plan und Redaktionskalender',
        'Absatz- und Vertriebskonzept für den Markteintritt',
      ],
    },
    en: {
      title: "Olivia's Olive Paste",
      tag: 'Digital Marketing',
      tagline: 'Complete digital marketing strategy for a Swiss SME – from brand to content.',
      metaDesc: "Complete marketing strategy for Olivia's Olive Paste: brand identity, social media concept, and sales strategy for a Swiss SME market entry.",
      challenge: 'A Swiss start-up with a new food product needed a complete market entry strategy: brand identity, digital presence, content plan, and sales concept – without a large budget, but with a clear vision.',
      approach: 'I developed the brand identity, a social media concept, a content editorial plan, and a sales strategy for market entry – from the first brainstorm to the fully worked-out strategy, ready for implementation.',
      result: 'A clear, consistent brand identity, a practical editorial plan, and a complete marketing roadmap that made the market entry structured and scalable from day one.',
      points: [
        'Brand development, positioning, and visual concept',
        'Social media strategy for Instagram and LinkedIn',
        'Content plan and editorial calendar',
        'Sales and distribution concept for market entry',
      ],
    },
  },
  {
    slug: 'requirements-engineering',
    color: '#8ebef2',
    de: {
      title: 'Software & Requirements Engineering',
      tag: 'Requirements Engineering',
      tagline: 'Professionelle Anforderungsanalyse für ein reales IT-Projekt – vollständig nach Industriestandard.',
      metaDesc: 'Vollständige Requirements-Engineering-Dokumentation mit User Stories, UML-Diagrammen, BPMN-Prozessen und Datenmodellen für ein reales IT-Projekt.',
      challenge: 'Ein reales IT-Vorhaben musste von Grund auf professionell dokumentiert werden: Anforderungen, Prozesse, Datenmodelle und Use Cases – nach anerkannten Standards und direkt einsetzbar in der Entwicklung.',
      approach: 'Ich erarbeitete vollständige Anforderungsspezifikationen mit User Stories und Akzeptanzkriterien, UML-Diagrammen, BPMN-Prozessmodellen und Entity-Relationship-Datenmodellen – strukturiert, klar und entwicklerfreundlich dokumentiert.',
      result: 'Eine umfassende, professionelle Spezifikation, die direkt als Grundlage für die Entwicklung dient und als Vorlage für zukünftige Requirements-Engineering-Projekte eingesetzt werden kann.',
      points: [
        'User Stories und Akzeptanzkriterien nach Agile-Standard',
        'UML-Diagramme (Use Case, Sequenz, Klassendiagramme)',
        'BPMN-Prozessmodellierung für komplexe Abläufe',
        'Datenmodellierung und Entity-Relationship-Diagramme',
      ],
    },
    en: {
      title: 'Software & Requirements Engineering',
      tag: 'Requirements Engineering',
      tagline: 'Professional requirements analysis for a real IT project – fully to industry standard.',
      metaDesc: 'Complete requirements engineering documentation with user stories, UML diagrams, BPMN processes, and data models for a real IT project.',
      challenge: 'A real IT project needed to be professionally documented from scratch: requirements, processes, data models, and use cases – to recognized standards and directly applicable in development.',
      approach: 'I developed complete requirements specifications with user stories and acceptance criteria, UML diagrams, BPMN process models, and entity-relationship data models – structured, clear, and developer-friendly.',
      result: 'A comprehensive, professional specification that serves directly as a development foundation and can be used as a template for future requirements engineering projects.',
      points: [
        'User stories and acceptance criteria to Agile standard',
        'UML diagrams (use case, sequence, class diagrams)',
        'BPMN process modelling for complex workflows',
        'Data modelling and entity-relationship diagrams',
      ],
    },
  },
];

export function getProject(slug: string): Project | null {
  return PROJECTS.find(p => p.slug === slug) ?? null;
}
