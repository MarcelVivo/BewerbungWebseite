export type AilaServiceCategory =
  | "strategy"
  | "website"
  | "marketing"
  | "automation"
  | "software"
  | "data-ai";

export type AilaServiceDefinition = {
  id: string;
  name: string;
  category: AilaServiceCategory;
  description: string;
  solves: string[];
  suitableFor: string[];
  dependencies: string[];
  incompatibleWith: string[];
  priority: number;
};

export const AILA_SERVICE_LIBRARY: AilaServiceDefinition[] = [
  {
    id: "digital-analysis",
    name: "Digitale Standortbestimmung",
    category: "strategy",
    description:
      "Ordnet Ziele, Prozesse, Systeme und Engpässe, bevor eine Investition festgelegt wird.",
    solves: ["unklare Prioritäten", "zu viele Einzeltools", "fehlende Roadmap"],
    suitableFor: ["KMU", "Start-ups", "bestehende Unternehmen im Wandel"],
    dependencies: [],
    incompatibleWith: [],
    priority: 100,
  },
  {
    id: "system-architecture",
    name: "System- und Lösungsarchitektur",
    category: "strategy",
    description:
      "Entwirft eine tragfähige Zielarchitektur für Website, Prozesse, Daten und Integrationen.",
    solves: ["Medienbrüche", "unklare Systemgrenzen", "nicht skalierbare Insellösungen"],
    suitableFor: ["komplexere Vorhaben", "mehrere Systeme", "individuelle Plattformen"],
    dependencies: ["digital-analysis"],
    incompatibleWith: [],
    priority: 95,
  },
  {
    id: "business-website",
    name: "Business-Website",
    category: "website",
    description:
      "Eine schnelle, klare Website, die Angebot, Vertrauen und nächste Schritte verständlich verbindet.",
    solves: ["veraltete Website", "unklares Angebot", "zu wenige qualifizierte Anfragen"],
    suitableFor: ["KMU", "Dienstleister", "lokale Unternehmen", "Selbständige"],
    dependencies: ["klare Positionierung und Inhalte"],
    incompatibleWith: ["reines Redesign ohne geklärtes Ziel"],
    priority: 90,
  },
  {
    id: "landing-page",
    name: "Landingpage & Kampagnenstrecke",
    category: "website",
    description:
      "Fokussierte Einstiegsseiten für ein Angebot, eine Kampagne oder eine klar messbare Aktion.",
    solves: ["unpräzise Kampagnen", "schwache Conversion", "fehlende Messbarkeit"],
    suitableFor: ["konkrete Angebote", "Launches", "Lead-Kampagnen"],
    dependencies: ["definiertes Angebot", "Traffic-Quelle"],
    incompatibleWith: ["unbekannte Zielgruppe"],
    priority: 80,
  },
  {
    id: "customer-portal",
    name: "Kundenportal",
    category: "software",
    description:
      "Zentraler Zugang für Informationen, Dokumente, Status, Termine und wiederkehrende Abläufe.",
    solves: ["E-Mail-Pingpong", "fehlender Kundenstatus", "verteilte Dokumente"],
    suitableFor: ["wiederkehrende Kundenprozesse", "Serviceunternehmen", "Projektgeschäft"],
    dependencies: ["definierte Prozesse", "Datenbasis"],
    incompatibleWith: ["einmalige einfache Informationsseite"],
    priority: 72,
  },
  {
    id: "booking-system",
    name: "Termin- und Buchungssystem",
    category: "software",
    description:
      "Verbindet Verfügbarkeit, Buchung, Bestätigung und Nachbearbeitung ohne manuelle Doppelarbeit.",
    solves: ["manuelle Terminabstimmung", "No-Shows", "fehlende Bestätigungen"],
    suitableFor: ["Praxen", "Beauty", "Beratung", "Werkstätten", "Gastronomie"],
    dependencies: ["klare Leistungen und Verfügbarkeiten"],
    incompatibleWith: [],
    priority: 78,
  },
  {
    id: "local-search",
    name: "Lokale Sichtbarkeit",
    category: "marketing",
    description:
      "Verbessert Auffindbarkeit und Vertrauen bei regionalen Suchanfragen und Google-Profilen.",
    solves: ["zu wenig lokale Anfragen", "schwache Google-Präsenz", "uneinheitliche Firmendaten"],
    suitableFor: ["lokale Dienstleister", "Handwerk", "Gastronomie", "Praxen", "Detailhandel"],
    dependencies: ["saubere Unternehmensdaten", "glaubwürdiges Angebot"],
    incompatibleWith: [],
    priority: 82,
  },
  {
    id: "content-positioning",
    name: "Positionierung & Content-System",
    category: "marketing",
    description:
      "Übersetzt Expertise in klare Botschaften und wiederverwendbare Inhalte entlang der Customer Journey.",
    solves: ["austauschbare Kommunikation", "unregelmässige Inhalte", "unklare Expertise"],
    suitableFor: ["Dienstleister", "Experten", "B2B", "Creator"],
    dependencies: ["Zielgruppe und Angebot"],
    incompatibleWith: [],
    priority: 74,
  },
  {
    id: "conversion-tracking",
    name: "Conversion & Kampagnenmessung",
    category: "marketing",
    description:
      "Macht sichtbar, welche Kanäle, Inhalte und Kontaktpunkte tatsächlich zu Anfragen führen.",
    solves: ["unklare Marketingwirkung", "fehlende Attribution", "Streuverluste"],
    suitableFor: ["aktive Kampagnen", "mehrere Kanäle", "Wachstumsziele"],
    dependencies: ["definierte Ziele", "Datenschutzkonzept"],
    incompatibleWith: [],
    priority: 77,
  },
  {
    id: "crm-light",
    name: "CRM & Lead-Prozess",
    category: "software",
    description:
      "Ordnet Kontakte, Chancen, Aktivitäten und nächste Schritte in einem nachvollziehbaren Verkaufsprozess.",
    solves: ["liegengebliebene Anfragen", "Excel-Listen", "fehlender Vertriebsüberblick"],
    suitableFor: ["B2B", "Dienstleister", "wachsende Teams", "projektbasierter Verkauf"],
    dependencies: ["definierter Lead-Prozess"],
    incompatibleWith: ["unnötiger ERP-Ersatz bei reinem Lead-Problem"],
    priority: 92,
  },
  {
    id: "lead-automation",
    name: "Lead- und Follow-up-Automation",
    category: "automation",
    description:
      "Erfasst Anfragen strukturiert, weist sie zu und sichert zeitnahe, kontrollierte Folgeaktionen.",
    solves: ["langsame Reaktion", "vergessene Follow-ups", "unklare Zuständigkeit"],
    suitableFor: ["wiederkehrende Anfragen", "Vertriebsteams", "mehrere Eingangskanäle"],
    dependencies: ["crm-light oder klare Lead-Datenbasis"],
    incompatibleWith: ["vollautomatische Entscheidungen ohne menschliche Kontrolle"],
    priority: 88,
  },
  {
    id: "workflow-automation",
    name: "Prozessautomation",
    category: "automation",
    description:
      "Automatisiert wiederkehrende Übergaben, Benachrichtigungen, Dokumente und Statuswechsel.",
    solves: ["manuelle Routinearbeit", "Übertragungsfehler", "lange Durchlaufzeiten"],
    suitableFor: ["standardisierbare Abläufe", "Administration", "Projekt- und Serviceprozesse"],
    dependencies: ["stabiler, dokumentierter Prozess"],
    incompatibleWith: ["noch ungeklärte oder ständig wechselnde Abläufe"],
    priority: 84,
  },
  {
    id: "operations-dashboard",
    name: "Management-Dashboard",
    category: "data-ai",
    description:
      "Verdichtet operative Daten zu entscheidungsrelevanten Kennzahlen, Ausnahmen und nächsten Schritten.",
    solves: ["fehlende Übersicht", "manuelle Reports", "widersprüchliche Zahlen"],
    suitableFor: ["Management", "Vertrieb", "Projektgeschäft", "mehrere Datenquellen"],
    dependencies: ["verlässliche Datenbasis"],
    incompatibleWith: ["Kennzahlen ohne definierte Entscheidungsfrage"],
    priority: 76,
  },
  {
    id: "data-foundation",
    name: "Gemeinsame Datenbasis",
    category: "data-ai",
    description:
      "Verbindet strukturierte Daten, Dokumente und Ereignisse mit Rollen, Historie und Backups.",
    solves: ["Doppelerfassung", "widersprüchliche Daten", "fehlende Nachvollziehbarkeit"],
    suitableFor: ["mehrere Systeme", "Wachstum", "Reporting", "Automatisierung"],
    dependencies: ["Datenmodell und Verantwortlichkeiten"],
    incompatibleWith: [],
    priority: 89,
  },
  {
    id: "api-integration",
    name: "Schnittstellen & Integrationen",
    category: "software",
    description:
      "Verbindet bestehende Systeme kontrolliert über APIs, Webhooks und klare Datenflüsse.",
    solves: ["Medienbrüche", "manuelle Übertragung", "isolierte Werkzeuge"],
    suitableFor: ["bestehende Systemlandschaften", "CRM", "ERP", "Portale"],
    dependencies: ["zugängliche Schnittstellen", "Datenverantwortung"],
    incompatibleWith: [],
    priority: 86,
  },
  {
    id: "ai-assistant",
    name: "KI-Assistent für Mitarbeitende",
    category: "data-ai",
    description:
      "Unterstützt Recherche, Entwürfe und Entscheidungen auf Basis freigegebener Unternehmensinformationen.",
    solves: ["Suchaufwand", "wiederkehrende Wissensfragen", "inkonsistente Entwürfe"],
    suitableFor: ["wissensintensive Teams", "Service", "Administration", "Vertrieb"],
    dependencies: ["geprüfte Wissensbasis", "Berechtigungen", "menschliche Kontrolle"],
    incompatibleWith: ["autonome verbindliche Entscheidungen ohne Prüfung"],
    priority: 79,
  },
  {
    id: "ai-sales-agent",
    name: "KI Sales Agent",
    category: "data-ai",
    description:
      "Qualifiziert Bedürfnisse im Dialog, empfiehlt passende nächste Schritte und bereitet Übergaben vor.",
    solves: ["unqualifizierte Anfragen", "fehlende Voranalyse", "lange Erstreaktion"],
    suitableFor: ["erklärungsbedürftige Angebote", "B2B", "digitale Lead-Generierung"],
    dependencies: ["Service-Bibliothek", "Gesprächslogik", "Lead-Prozess"],
    incompatibleWith: ["aggressiver Abschluss ohne Bedarfsklärung"],
    priority: 83,
  },
  {
    id: "custom-business-software",
    name: "Individuelle Business-Software",
    category: "software",
    description:
      "Bildet einen unternehmensspezifischen Kernprozess als fokussierte, wartbare Anwendung ab.",
    solves: ["Standardsoftware passt nicht", "prozesskritische Excel-Lösungen", "komplexe Sonderabläufe"],
    suitableFor: ["klarer Wettbewerbsvorteil", "stabiler Kernprozess", "spezifische Anforderungen"],
    dependencies: ["digital-analysis", "system-architecture", "validierter Prozess"],
    incompatibleWith: ["unklare Anforderungen", "leicht lösbares Standardproblem"],
    priority: 70,
  },
];

export const AILA_SERVICE_IDS = AILA_SERVICE_LIBRARY.map(
  (service) => service.id,
);

export function getAilaService(serviceId: string) {
  return AILA_SERVICE_LIBRARY.find((service) => service.id === serviceId);
}

export function getAilaServiceCatalogForPrompt() {
  return AILA_SERVICE_LIBRARY.map((service) => ({
    id: service.id,
    name: service.name,
    category: service.category,
    description: service.description,
    solves: service.solves,
    suitableFor: service.suitableFor,
    dependencies: service.dependencies,
    incompatibleWith: service.incompatibleWith,
  }));
}
