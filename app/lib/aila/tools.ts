export type AilaToolName =
  | "check_availability"
  | "create_lead"
  | "prepare_proposal";

export type AilaToolResult = {
  ok: boolean;
  status: "completed" | "unavailable" | "failed";
  message: string;
  data?: Record<string, unknown>;
};

export type AilaTool = {
  name: AilaToolName;
  description: string;
  available: boolean;
  execute: (input: Record<string, unknown>) => Promise<AilaToolResult>;
};

function unavailableTool(
  name: AilaToolName,
  description: string,
): AilaTool {
  return {
    name,
    description,
    available: false,
    async execute() {
      return {
        ok: false,
        status: "unavailable",
        message:
          "Diese Integration ist vorbereitet, aber noch nicht mit einem externen System verbunden.",
      };
    },
  };
}

export const AILA_TOOLS: Record<AilaToolName, AilaTool> = {
  check_availability: unavailableTool(
    "check_availability",
    "Liest später verfügbare Beratungstermine aus einem Kalender.",
  ),
  create_lead: unavailableTool(
    "create_lead",
    "Überträgt später einen bestätigten Lead in ein CRM.",
  ),
  prepare_proposal: unavailableTool(
    "prepare_proposal",
    "Erstellt später einen Projekt- oder Offertenentwurf zur menschlichen Prüfung.",
  ),
};

export function getAvailableAilaTools() {
  return Object.values(AILA_TOOLS).filter((tool) => tool.available);
}
