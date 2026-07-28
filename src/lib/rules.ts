import type { RiskTier } from "@/lib/knowledge-base";

export interface StructuredInput {
  ai_functions: string[];
  data_types: string[];
  user_types: string[];
  geography: string[];
}

export interface RuleResult {
  confident: boolean;
  risk_tier: RiskTier | null;
  matched_rules: string[];
  reasoning: string;
}

interface Rule {
  name: string;
  tier: RiskTier;
  reasoning: string;
  match: (desc: string, input: StructuredInput) => boolean;
}

const descContains = (desc: string, keywords: string[]): boolean => {
  const lower = desc.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
};

const rules: Rule[] = [
  // --- UNACCEPTABLE ---
  {
    name: "social_scoring",
    tier: "unacceptable",
    reasoning: "Social scoring by or on behalf of public authorities is a prohibited practice under Article 5.",
    match: (desc, input) =>
      descContains(desc, ["social scor", "citizen scor", "social credit"]) ||
      (input.ai_functions.includes("scoring") &&
        input.user_types.includes("government") &&
        descContains(desc, ["social", "citizen", "behavior", "behaviour"])),
  },
  {
    name: "subliminal_manipulation",
    tier: "unacceptable",
    reasoning: "AI systems that deploy subliminal techniques to materially distort behaviour causing harm are prohibited under Article 5.",
    match: (desc) =>
      descContains(desc, ["subliminal", "manipulat"]) &&
      descContains(desc, ["harm", "distort", "behaviour", "behavior"]),
  },
  {
    name: "realtime_biometric_public",
    tier: "unacceptable",
    reasoning: "Real-time remote biometric identification in publicly accessible spaces for law enforcement is prohibited under Article 5 (with narrow exceptions).",
    match: (desc) =>
      descContains(desc, ["real-time", "realtime", "real time"]) &&
      descContains(desc, ["biometric", "facial recognition"]) &&
      descContains(desc, ["public", "street", "cctv", "surveillance"]),
  },

  // --- HIGH RISK ---
  {
    name: "biometric_identification",
    tier: "high",
    reasoning: "Biometric identification and categorisation systems are classified as high-risk under Annex III, Category 1.",
    match: (desc, input) =>
      input.data_types.includes("biometric") ||
      descContains(desc, [
        "facial recognition",
        "biometric",
        "fingerprint identification",
        "iris scan",
        "face detection",
      ]),
  },
  {
    name: "resume_screening",
    tier: "high",
    reasoning: "AI systems used for screening/filtering job applications or evaluating candidates are high-risk under Annex III, Category 4 (Employment).",
    match: (desc, input) =>
      (input.ai_functions.includes("screening") ||
        input.ai_functions.includes("scoring")) &&
      descContains(desc, [
        "resume",
        "cv",
        "job applic",
        "candidate",
        "recruit",
        "hiring",
        "applicant",
        "employment",
      ]),
  },
  {
    name: "credit_scoring",
    tier: "high",
    reasoning: "AI systems evaluating creditworthiness are high-risk under Annex III, Category 5 (Access to essential services).",
    match: (desc, input) =>
      (input.ai_functions.includes("scoring") &&
        input.data_types.includes("financial") &&
        descContains(desc, ["credit", "loan", "lending", "mortgage"])) ||
      descContains(desc, ["creditworth", "credit scor"]),
  },
  {
    name: "education_grading",
    tier: "high",
    reasoning: "AI systems determining access to education or evaluating learning outcomes are high-risk under Annex III, Category 3.",
    match: (desc) =>
      descContains(desc, [
        "grade student",
        "grading",
        "exam evaluation",
        "admission decision",
        "student assessment",
        "learning outcome",
        "academic evaluation",
      ]),
  },
  {
    name: "medical_device",
    tier: "high",
    reasoning: "AI used as a medical device or for health diagnostics is high-risk. Medical AI systems fall under EU product safety legislation referenced in Annex I.",
    match: (desc, input) =>
      input.data_types.includes("health") &&
      descContains(desc, [
        "diagnos",
        "medical",
        "clinical",
        "patient",
        "health",
        "disease",
        "cancer",
        "treatment",
        "radiology",
        "pathology",
      ]),
  },
  {
    name: "law_enforcement",
    tier: "high",
    reasoning: "AI systems used in law enforcement are high-risk under Annex III, Category 6.",
    match: (desc) =>
      descContains(desc, [
        "law enforcement",
        "policing",
        "criminal risk",
        "recidivism",
        "polygraph",
        "evidence reliability",
      ]),
  },
  {
    name: "critical_infrastructure",
    tier: "high",
    reasoning: "AI used as safety components of critical infrastructure management is high-risk under Annex III, Category 2.",
    match: (desc) =>
      descContains(desc, ["traffic management", "power grid", "water supply"]) &&
      descContains(desc, ["safety", "critical", "infrastructure"]),
  },
  {
    name: "migration_border",
    tier: "high",
    reasoning: "AI systems used in migration, asylum, and border control are high-risk under Annex III, Category 7.",
    match: (desc) =>
      descContains(desc, [
        "asylum",
        "visa application",
        "border control",
        "immigration",
        "migration assessment",
      ]),
  },
  {
    name: "insurance_risk",
    tier: "high",
    reasoning: "AI for risk assessment and pricing in life and health insurance is high-risk under Annex III, Category 5.",
    match: (desc, input) =>
      input.data_types.includes("health") &&
      descContains(desc, ["insurance", "underwriting", "risk assessment", "premium"]),
  },

  // --- LIMITED ---
  {
    name: "chatbot",
    tier: "limited",
    reasoning: "AI systems that interact with people (chatbots, virtual assistants) have transparency obligations under Article 50.",
    match: (desc, input) =>
      descContains(desc, [
        "chatbot",
        "virtual assistant",
        "conversational ai",
        "customer support ai",
        "chat support",
      ]) ||
      (input.ai_functions.includes("generating") &&
        input.user_types.includes("consumers") &&
        descContains(desc, [
          "support",
          "assist",
          "answer",
          "help",
          "chat",
          "convers",
        ])),
  },
  {
    name: "deepfake_generation",
    tier: "limited",
    reasoning: "AI-generated or manipulated image, audio, or video content (deepfakes) must be labelled under Article 50.",
    match: (desc) =>
      descContains(desc, [
        "deepfake",
        "synthetic video",
        "synthetic audio",
        "face swap",
        "voice clon",
      ]) ||
      (descContains(desc, ["generat"]) &&
        descContains(desc, ["video", "image", "audio", "face", "voice"]) &&
        descContains(desc, ["synthetic", "fake", "realistic", "people", "person"])),
  },
  {
    name: "content_generation",
    tier: "limited",
    reasoning: "AI-generated text published for public information must be labelled as AI-generated under Article 50.",
    match: (desc) =>
      descContains(desc, ["generat"]) &&
      descContains(desc, ["news", "article", "public information", "journalism"]),
  },

  // --- MINIMAL ---
  {
    name: "spam_filter",
    tier: "minimal",
    reasoning: "Spam filtering is a minimal-risk AI application with no specific requirements under the EU AI Act.",
    match: (desc) =>
      descContains(desc, ["spam filter", "spam detect", "email filter", "junk mail"]),
  },
  {
    name: "game_ai",
    tier: "minimal",
    reasoning: "AI in video games is a minimal-risk application with no specific requirements under the EU AI Act.",
    match: (desc) =>
      descContains(desc, ["video game", "game ai", "npc", "game character"]),
  },
  {
    name: "inventory_management",
    tier: "minimal",
    reasoning: "AI-powered inventory management is a minimal-risk application with no specific requirements.",
    match: (desc) =>
      descContains(desc, ["inventory manage", "stock manage", "warehouse optim"]),
  },
  {
    name: "search_ranking",
    tier: "minimal",
    reasoning: "Search ranking and recommendation systems (that are not in high-risk domains) are minimal-risk.",
    match: (desc) =>
      descContains(desc, ["search rank", "search engine", "search result"]) &&
      !descContains(desc, ["job", "hiring", "employment", "credit", "medical"]),
  },
];

export function evaluateRules(
  productDesc: string,
  input: StructuredInput
): RuleResult {
  if (input.geography.includes("no_eu_exposure")) {
    return {
      confident: true,
      risk_tier: "minimal",
      matched_rules: ["no_eu_exposure"],
      reasoning:
        "Product has no EU exposure — outside EU scope. EU AI Act does not apply. Classified as minimal risk (no action required).",
    };
  }

  const tierPriority: RiskTier[] = [
    "unacceptable",
    "high",
    "limited",
    "minimal",
  ];

  for (const tier of tierPriority) {
    const matched = rules.filter(
      (rule) => rule.tier === tier && rule.match(productDesc, input)
    );
    if (matched.length > 0) {
      return {
        confident: true,
        risk_tier: tier,
        matched_rules: matched.map((r) => r.name),
        reasoning: matched.map((r) => r.reasoning).join(" "),
      };
    }
  }

  return {
    confident: false,
    risk_tier: null,
    matched_rules: [],
    reasoning:
      "No deterministic rules matched. Requires LLM classification for ambiguous case.",
  };
}
