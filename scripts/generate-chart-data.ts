import { evaluateRules, type StructuredInput } from "../src/lib/rules";
import { writeFileSync } from "fs";
import { join } from "path";

interface TestCase {
  name: string;
  description: string;
  input: StructuredInput;
}

const testCases: TestCase[] = [
  // --- UNACCEPTABLE (5) ---
  { name: "Government Social Credit System", description: "Social scoring system that rates citizens based on their social behaviour and compliance for government benefit eligibility", input: { ai_functions: ["scoring"], data_types: ["personal"], user_types: ["government"], geography: ["eu_countries"] } },
  { name: "Citizen Behaviour Tracker", description: "Social credit scoring platform monitoring citizen behaviour across public services", input: { ai_functions: ["scoring"], data_types: ["personal"], user_types: ["government"], geography: ["eu_countries"] } },
  { name: "Subliminal Ad Engine", description: "AI system using subliminal manipulation techniques in advertising to distort consumer behaviour causing financial harm", input: { ai_functions: ["recommending"], data_types: ["personal"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Street Surveillance Biometrics", description: "Real-time facial recognition biometric identification system deployed in public streets via CCTV for law enforcement", input: { ai_functions: ["detecting"], data_types: ["biometric"], user_types: ["government"], geography: ["eu_countries"] } },
  { name: "Public Space Face Scanner", description: "Realtime biometric facial recognition surveillance system for public spaces and streets", input: { ai_functions: ["detecting"], data_types: ["biometric"], user_types: ["government"], geography: ["eu_countries"] } },

  // --- HIGH RISK (35) ---
  { name: "Face ID Access Control", description: "Facial recognition system for employee building access control using biometric data", input: { ai_functions: ["detecting"], data_types: ["biometric"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Airport Biometric Gate", description: "Biometric passport verification and iris scanning system for airport security gates", input: { ai_functions: ["detecting"], data_types: ["biometric"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "HR Resume Screener", description: "AI-powered resume screening tool that filters job applications and ranks candidates for hiring managers", input: { ai_functions: ["screening"], data_types: ["personal"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Talent Acquisition AI", description: "Automated candidate screening and recruitment platform that evaluates job applicants based on CV analysis", input: { ai_functions: ["screening"], data_types: ["personal"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Hiring Pipeline Ranker", description: "AI tool that scores and ranks employment applicants during the hiring process", input: { ai_functions: ["scoring"], data_types: ["personal"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Bank Credit Scorer", description: "Credit scoring AI that evaluates creditworthiness of loan applicants using financial history", input: { ai_functions: ["scoring"], data_types: ["financial"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Mortgage Risk Model", description: "AI model for mortgage lending decisions, evaluating credit risk and loan eligibility", input: { ai_functions: ["scoring"], data_types: ["financial"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Loan Approval Engine", description: "Automated credit scoring system for personal loan and lending decisions at scale", input: { ai_functions: ["scoring"], data_types: ["financial"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Exam Grading AI", description: "Automated grading system that evaluates student exam submissions and assigns grades", input: { ai_functions: ["scoring"], data_types: ["personal"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "University Admissions AI", description: "AI system for admission decision making at universities, scoring student applications and learning outcomes", input: { ai_functions: ["scoring"], data_types: ["personal"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Student Assessment Tool", description: "Automated student assessment and academic evaluation platform for K-12 schools", input: { ai_functions: ["scoring"], data_types: ["personal"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Radiology AI Assistant", description: "AI medical device for radiology image analysis and cancer diagnosis from patient scans", input: { ai_functions: ["detecting"], data_types: ["health"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Clinical Decision Support", description: "AI-powered clinical decision support system for patient diagnosis and treatment recommendations", input: { ai_functions: ["recommending"], data_types: ["health"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Pathology Slide Analyzer", description: "AI system analyzing pathology slides for disease detection and medical diagnosis", input: { ai_functions: ["detecting"], data_types: ["health"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Mental Health Diagnostic", description: "AI diagnostic tool for mental health screening and patient risk assessment", input: { ai_functions: ["scoring"], data_types: ["health"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Drug Interaction Checker", description: "AI medical system checking drug interactions and patient health contraindications", input: { ai_functions: ["detecting"], data_types: ["health"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Predictive Policing Tool", description: "AI system for law enforcement predictive policing and criminal risk assessment", input: { ai_functions: ["scoring"], data_types: ["personal"], user_types: ["government"], geography: ["eu_countries"] } },
  { name: "Recidivism Predictor", description: "AI model predicting recidivism risk for parole and sentencing decisions in law enforcement", input: { ai_functions: ["scoring"], data_types: ["personal"], user_types: ["government"], geography: ["eu_countries"] } },
  { name: "Traffic Safety AI", description: "AI safety component for critical infrastructure traffic management systems in smart cities", input: { ai_functions: ["detecting"], data_types: ["public"], user_types: ["government"], geography: ["eu_countries"] } },
  { name: "Power Grid Controller", description: "AI safety system for critical infrastructure power grid management and load balancing", input: { ai_functions: ["recommending"], data_types: ["public"], user_types: ["government"], geography: ["eu_countries"] } },
  { name: "Visa Processing AI", description: "AI system for visa application assessment and immigration decision support", input: { ai_functions: ["scoring"], data_types: ["personal"], user_types: ["government"], geography: ["eu_countries"] } },
  { name: "Asylum Case Evaluator", description: "AI tool for asylum application evaluation and migration assessment", input: { ai_functions: ["scoring"], data_types: ["personal"], user_types: ["government"], geography: ["eu_countries"] } },
  { name: "Border Control Scanner", description: "AI-enhanced border control document verification and risk screening system", input: { ai_functions: ["screening"], data_types: ["personal"], user_types: ["government"], geography: ["eu_countries"] } },
  { name: "Health Insurance Pricer", description: "AI system for health insurance risk assessment and premium pricing using patient health data", input: { ai_functions: ["scoring"], data_types: ["health"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Life Insurance Underwriter", description: "AI underwriting system for life insurance risk assessment based on health records", input: { ai_functions: ["scoring"], data_types: ["health"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Fingerprint ID System", description: "Fingerprint identification and verification system for secure facility access", input: { ai_functions: ["detecting"], data_types: ["biometric"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Voice Biometric Auth", description: "Voice biometric authentication system for banking telephone services", input: { ai_functions: ["detecting"], data_types: ["biometric"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Employee Performance AI", description: "AI-driven employee performance scoring and hiring recommendation platform", input: { ai_functions: ["scoring"], data_types: ["personal"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Emotion Detection Cam", description: "Biometric emotion detection AI for workplace monitoring using camera feeds", input: { ai_functions: ["detecting"], data_types: ["biometric"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Medical Imaging Startup", description: "AI medical device startup analyzing X-ray and MRI images for early disease detection", input: { ai_functions: ["detecting"], data_types: ["health"], user_types: ["businesses"], geography: ["serving_eu_users"] } },
  { name: "Water Supply Monitor", description: "AI safety monitoring for critical infrastructure water supply treatment and distribution", input: { ai_functions: ["detecting"], data_types: ["public"], user_types: ["government"], geography: ["eu_countries"] } },
  { name: "Dental AI Diagnostics", description: "AI system for dental health diagnostics and patient treatment planning from oral scans", input: { ai_functions: ["detecting"], data_types: ["health"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Evidence Analyzer", description: "AI tool assessing evidence reliability for law enforcement investigations", input: { ai_functions: ["scoring"], data_types: ["personal"], user_types: ["government"], geography: ["eu_countries"] } },
  { name: "Immigration Risk Score", description: "Risk scoring system for immigration and migration assessment at EU borders", input: { ai_functions: ["scoring"], data_types: ["personal"], user_types: ["government"], geography: ["eu_countries"] } },
  { name: "Auto Insurance Health AI", description: "AI for life and health insurance underwriting and risk assessment using medical records", input: { ai_functions: ["scoring"], data_types: ["health"], user_types: ["businesses"], geography: ["eu_countries"] } },

  // --- LIMITED (15) ---
  { name: "Customer Support Bot", description: "AI chatbot for customer support that handles common queries and troubleshooting", input: { ai_functions: ["generating"], data_types: ["personal"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "E-commerce Assistant", description: "Virtual assistant chatbot for e-commerce helping customers find products and answer questions", input: { ai_functions: ["generating"], data_types: ["personal"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Banking Chatbot", description: "Conversational AI chatbot for banking customer service and account inquiries", input: { ai_functions: ["generating"], data_types: ["financial"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "HR Help Desk Bot", description: "Virtual assistant chatbot for internal HR support and employee policy questions", input: { ai_functions: ["generating"], data_types: ["personal"], user_types: ["internal"], geography: ["eu_countries"] } },
  { name: "Travel Booking Assistant", description: "AI chatbot assistant helping users search and book travel arrangements", input: { ai_functions: ["generating"], data_types: ["personal"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Video Deepfake Detector", description: "AI system that generates synthetic video deepfake content for entertainment", input: { ai_functions: ["generating"], data_types: ["public"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Voice Cloning Studio", description: "AI voice cloning and synthetic audio generation platform for content creators", input: { ai_functions: ["generating"], data_types: ["public"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "AI News Writer", description: "AI system that generates news articles and journalism content for public information", input: { ai_functions: ["generating"], data_types: ["public"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Synthetic Media Platform", description: "Platform for generating realistic synthetic video and image content of people", input: { ai_functions: ["generating"], data_types: ["public"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "AI Article Generator", description: "Automated AI content generation tool for news articles and public information blogs", input: { ai_functions: ["generating"], data_types: ["public"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Face Swap App", description: "Consumer face swap and deepfake generation app for social media fun", input: { ai_functions: ["generating"], data_types: ["personal"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Podcast Voice Clone", description: "AI voice cloning tool for podcast producers to generate synthetic audio narration", input: { ai_functions: ["generating"], data_types: ["public"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Real Estate Chatbot", description: "Conversational AI chatbot for real estate agencies answering property queries", input: { ai_functions: ["generating"], data_types: ["public"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "IT Support Virtual Agent", description: "AI virtual assistant chatbot for IT helpdesk support and ticket resolution", input: { ai_functions: ["generating"], data_types: ["personal"], user_types: ["internal"], geography: ["eu_countries"] } },
  { name: "Legal Q&A Bot", description: "AI chatbot providing general legal information and answering common questions", input: { ai_functions: ["generating"], data_types: ["personal"], user_types: ["consumers"], geography: ["eu_countries"] } },

  // --- MINIMAL (15) ---
  { name: "Email Spam Filter", description: "AI spam filter for email inbox that detects and blocks junk mail", input: { ai_functions: ["detecting"], data_types: ["personal"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Enterprise Spam Guard", description: "Enterprise spam detection and email filtering system for corporate inboxes", input: { ai_functions: ["detecting"], data_types: ["personal"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Mobile Game AI", description: "Video game AI controlling NPC behaviour and game character decision-making", input: { ai_functions: ["other"], data_types: ["public"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "RPG Game Engine", description: "Game AI engine for NPC pathfinding and game character interactions in RPGs", input: { ai_functions: ["other"], data_types: ["public"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Warehouse Optimizer", description: "AI-powered inventory management and warehouse optimization system for retail", input: { ai_functions: ["recommending"], data_types: ["public"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Supply Chain Inventory", description: "AI stock management and inventory management tool for supply chain logistics", input: { ai_functions: ["recommending"], data_types: ["public"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "E-commerce Search", description: "AI search ranking algorithm for e-commerce product search results", input: { ai_functions: ["recommending"], data_types: ["public"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Content Search Engine", description: "AI-powered search engine and search ranking system for content discovery", input: { ai_functions: ["recommending"], data_types: ["public"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Photo Filter App", description: "AI photo enhancement and filter application for social media posts", input: { ai_functions: ["generating"], data_types: ["personal"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Music Recommender", description: "AI music recommendation engine suggesting songs based on listening history", input: { ai_functions: ["recommending"], data_types: ["personal"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Weather Forecaster", description: "AI weather prediction and forecasting model for consumer weather apps", input: { ai_functions: ["other"], data_types: ["public"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Recipe Suggester", description: "AI recipe recommendation tool suggesting meals based on available ingredients", input: { ai_functions: ["recommending"], data_types: ["personal"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Fitness Tracker AI", description: "AI workout recommendation engine in fitness tracking wearable devices", input: { ai_functions: ["recommending"], data_types: ["personal"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Translation Tool", description: "AI language translation service for document and text translation", input: { ai_functions: ["generating"], data_types: ["public"], user_types: ["consumers"], geography: ["eu_countries"] } },
  { name: "Parking Finder", description: "AI-powered parking space detection and availability prediction app", input: { ai_functions: ["detecting"], data_types: ["public"], user_types: ["consumers"], geography: ["eu_countries"] } },

  // --- AMBIGUOUS / no rule match (5) ---
  { name: "Sentiment Analyzer", description: "AI tool analyzing customer feedback sentiment from product reviews", input: { ai_functions: ["detecting"], data_types: ["public"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Price Optimizer", description: "AI dynamic pricing optimization engine for airline ticket sales", input: { ai_functions: ["scoring"], data_types: ["public"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Fraud Detector", description: "AI fraud detection system for payment processing and transaction monitoring", input: { ai_functions: ["detecting"], data_types: ["financial"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Ad Targeting Engine", description: "AI advertising targeting and audience segmentation platform for digital marketing", input: { ai_functions: ["recommending"], data_types: ["personal"], user_types: ["businesses"], geography: ["eu_countries"] } },
  { name: "Document Classifier", description: "AI document classification and sorting tool for enterprise content management", input: { ai_functions: ["detecting"], data_types: ["public"], user_types: ["businesses"], geography: ["eu_countries"] } },
];

// Run all test cases
interface ResultEntry {
  name: string;
  risk_tier: string;
  confident: boolean;
  matched_rules: string[];
  reasoning: string;
}

const results: ResultEntry[] = testCases.map((tc) => {
  const result = evaluateRules(tc.description, tc.input);
  return {
    name: tc.name,
    risk_tier: result.risk_tier ?? "ambiguous",
    confident: result.confident,
    matched_rules: result.matched_rules,
    reasoning: result.reasoning,
  };
});

// Aggregate stats
const tierCounts: Record<string, number> = { unacceptable: 0, high: 0, limited: 0, minimal: 0, ambiguous: 0 };
const ruleCounts: Record<string, number> = {};
const tierSystems: Record<string, string[]> = { unacceptable: [], high: [], limited: [], minimal: [], ambiguous: [] };

for (const r of results) {
  tierCounts[r.risk_tier]++;
  tierSystems[r.risk_tier].push(r.name);
  for (const rule of r.matched_rules) {
    ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
  }
}

const ruleFrequency = Object.entries(ruleCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([rule, count]) => ({ rule, count }));

const chartData = {
  totalSystems: results.length,
  tierDistribution: tierCounts,
  tierSystems,
  ruleFrequency,
  results,
};

const outPath = join(import.meta.dirname!, "..", "src", "data", "classification-stats.json");
writeFileSync(outPath, JSON.stringify(chartData, null, 2), "utf-8");
console.log(`Wrote ${results.length} results to ${outPath}`);
console.log("Tier distribution:", tierCounts);
console.log("Top rules:", ruleFrequency.slice(0, 10));
