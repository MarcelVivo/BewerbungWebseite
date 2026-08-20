export const AILA_SALES_STAGES = [
  "welcome",
  "identify_user",
  "identify_business",
  "identify_goal",
  "identify_problem",
  "diagnosis",
  "solution_building",
  "qualification",
  "recommendation",
  "conversion",
  "handover",
] as const;

export type AilaSalesStage = (typeof AILA_SALES_STAGES)[number];

export const AILA_NEXT_BEST_ACTIONS = [
  "identify_user",
  "understand_business",
  "clarify_goal",
  "clarify_problem",
  "understand_current_state",
  "diagnose",
  "show_solution",
  "qualify_timing",
  "qualify_authority",
  "recommend_services",
  "offer_handover",
  "open_contact",
  "continue_conversation",
] as const;

export type AilaNextBestAction = (typeof AILA_NEXT_BEST_ACTIONS)[number];

export const AILA_LEAD_TEMPERATURES = [
  "unknown",
  "cold",
  "warm",
  "hot",
] as const;

export type AilaLeadTemperature =
  (typeof AILA_LEAD_TEMPERATURES)[number];

export type AilaAnimationState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "presenting"
  | "success";

export type AilaInputMode = "text" | "voice" | "quick_reply";

export type AilaContactData = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
};

export type AilaSalesContext = AilaContactData & {
  currentStage: AilaSalesStage;
  previousStage?: AilaSalesStage;
  userIntent?: string;
  businessType?: string;
  industry?: string;
  businessSize?: string;
  location?: string;
  primaryGoal?: string;
  primaryProblem?: string;
  secondaryProblems: string[];
  currentTools: string[];
  websiteStatus?: string;
  marketingStatus?: string;
  automationStatus?: string;
  budgetSignal?: string;
  timeframe?: string;
  decisionAuthority?: string;
  leadTemperature: AilaLeadTemperature;
  recommendedServices: string[];
  nextBestAction: AilaNextBestAction;
  conversationSummary: string;
  consentToContact?: boolean;
};

export type AilaRecommendationItem = {
  serviceId: string;
  name: string;
  reason: string;
  priority: "primary" | "supporting" | "later";
};

export type AilaRecommendation = {
  title: string;
  summary: string;
  services: AilaRecommendationItem[];
  notRecommended: string[];
};

export type AilaUiAction = {
  type:
    | "SCROLL_TO_SECTION"
    | "HIGHLIGHT_SERVICE"
    | "SHOW_RECOMMENDATION"
    | "SHOW_SOLUTION"
    | "OPEN_CONTACT"
    | "OPEN_PROJECT_FLOW";
  sectionId?: string;
  serviceId?: string;
  label?: string;
};

export type AilaSalesResponse = {
  message: string;
  context: AilaSalesContext;
  recommendation?: AilaRecommendation;
  uiActions: AilaUiAction[];
  animationState: AilaAnimationState;
  quickReplies: string[];
  shouldHandover: boolean;
};

export type AilaLeadObject = {
  source: "aila";
  createdAt: string;
  contact: AilaContactData;
  company?: string;
  industry?: string;
  goals: string[];
  problems: string[];
  existingSystems: string[];
  recommendedServices: string[];
  leadTemperature: AilaLeadTemperature;
  conversationSummary: string;
  nextBestAction: AilaNextBestAction;
};

export type AilaChatMessage = {
  role: "user" | "assistant";
  content: string;
};
