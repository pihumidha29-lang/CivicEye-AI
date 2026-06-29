import { IssueSeverity } from "../types";

export interface GeminiAnalysisResult {
  imageStatus: "Valid" | "Invalid" | "Unavailable";
  issueType: string;
  inspectionReport: string;
  severity: IssueSeverity;
  priority: string;
  confidenceScore: number;
  visualEvidence: string[];
  potentialRisks: string[];
  responsibleDepartment: string;
  expectedResponseTime: string;
  citizenRecommendation: string;
  aiReasoning: string;
  complaintDraft: string;
  error?: string;

  // Backwards compatibility/legacy fields
  suggestedSeverity?: IssueSeverity;
  suggestedTitle?: string;
  suggestedDescription?: string;
  suggestedCategory?: string;
  summary?: string;
  isHazard?: boolean;
  actionRequired?: string;
  responsibleDept?: string;
  authorityReason?: string;
  estimatedUrgency?: string;
  estimatedImpactRadius?: string;
  estimatedAffectedCitizens?: number;
  priorityScore?: number;
  priorityReason?: string;
}

/**
 * Sends the image and metadata payload to the backend,
 * prints the raw response text before parsing, and returns the analysis.
 */
export async function analyzeCivicIssue(
  imageBase64: string,
  description: string,
  category: string
): Promise<GeminiAnalysisResult> {
  try {
    const response = await fetch("/api/analyze-issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        imageBase64,
        category,
      }),
    });

    // 1. Get raw text to log before parsing
    const rawText = await response.text();
    console.log("=== FRONTEND RAW GEMINI RESPONSE ===");
    console.log(rawText);
    console.log("====================================");

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error("Failed to parse raw text response:", e);
      return {
        imageStatus: "Unavailable",
        error: "Gemini service temporarily unavailable.",
        issueType: "",
        inspectionReport: "",
        severity: "Medium",
        priority: "Medium",
        confidenceScore: 0,
        visualEvidence: [],
        potentialRisks: [],
        responsibleDepartment: "",
        expectedResponseTime: "",
        citizenRecommendation: "AI service temporarily unavailable.",
        aiReasoning: "",
        complaintDraft: ""
      };
    }

    if (data.imageStatus === "Unavailable") {
      return data as GeminiAnalysisResult;
    }

    if (data.success && data.analysis) {
      if (data.analysis.imageStatus === "Unavailable") {
        return data.analysis as GeminiAnalysisResult;
      }
      return data.analysis as GeminiAnalysisResult;
    }

    // If we have a returned object with imageStatus, return it
    if (data.imageStatus) {
      return data as GeminiAnalysisResult;
    }

    throw new Error("API call was not marked as successful or analysis is missing.");
  } catch (error) {
    console.error("Error in analyzeCivicIssue utility:", error);
    return {
      imageStatus: "Unavailable",
      error: "Gemini service temporarily unavailable.",
      issueType: "",
      inspectionReport: "",
      severity: "Medium",
      priority: "Medium",
      confidenceScore: 0,
      visualEvidence: [],
      potentialRisks: [],
      responsibleDepartment: "",
      expectedResponseTime: "",
      citizenRecommendation: "AI service temporarily unavailable.",
      aiReasoning: "",
      complaintDraft: ""
    };
  }
}
