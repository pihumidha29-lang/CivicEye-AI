import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client (lazy initialization)
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. AI functions will run in demo/mock mode.");
    }
    aiClient = new GoogleGenAI({ apiKey: key || "MOCK_KEY" });
  }
  return aiClient;
}

// Robust wrapper with automatic exponential backoff retry for transient model errors (503 / 429 / high demand)
async function generateContentWithRetry(params: {
  model: string;
  contents: any;
  config?: any;
}, retries = 5, delay = 1000): Promise<any> {
  let lastError: any = null;

  // Pretty-print the request parameters (with truncated base64 image data)
  const debugParams = JSON.parse(JSON.stringify(params));
  if (debugParams.contents && typeof debugParams.contents === "object") {
    const parts = debugParams.contents.parts || debugParams.contents;
    if (Array.isArray(parts)) {
      parts.forEach((p: any) => {
        if (p.inlineData && p.inlineData.data) {
          p.inlineData.data = p.inlineData.data.substring(0, 50) + "... [TRUNCATED " + p.inlineData.data.length + " bytes]";
        }
      });
    }
  }
  console.log("=== GEMINI API REQUEST ===");
  console.log(JSON.stringify(debugParams, null, 2));
  console.log("==========================");

  for (let i = 0; i < retries; i++) {
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent(params);
      
      console.log("=== GEMINI API RESPONSE ===");
      console.log(JSON.stringify(response, null, 2));
      console.log("===========================");
      return response;
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.statusCode || error?.code || error?.response?.status;
      const errorMsg = String(error?.message || error || "").toLowerCase();
      
      // Extensive, precise diagnostic reporting per user request:
      console.error(`\n=== GEMINI API DIAGNOSTICS (Attempt ${i + 1}/${retries}) ===`);
      
      // 1. HTTP Status Code
      console.error(`1. HTTP Status Code: ${status || "UNKNOWN / NOT APPLICABLE"}`);

      // 2. Exact Gemini error message
      const exactMsg = error?.message || (typeof error === "string" ? error : "No explicit message");
      console.error(`2. Exact Gemini Error Message: ${exactMsg}`);

      // 3. Complete exception object
      console.error("3. Complete Exception Object:");
      console.dir(error, { depth: null });

      // 4. Raw response body if available
      const rawBody = error?.response?.body || error?.response?.data || error?.rawResponse || "No raw response body available";
      console.error(`4. Raw Response Body: ${typeof rawBody === "object" ? JSON.stringify(rawBody, null, 2) : rawBody}`);

      // 5. Did the request reach Gemini?
      const reachedGemini = (status !== undefined && status !== null && status !== "") || 
                            errorMsg.includes("status") || 
                            errorMsg.includes("http") || 
                            !!error?.response ||
                            (!errorMsg.includes("fetch failed") && !errorMsg.includes("dns") && !errorMsg.includes("network"));
      console.error(`5. Did Request Reach Gemini? ${reachedGemini ? "YES" : "NO"}`);

      // 6. Is the API key valid?
      const isApiKeyValid = !(status === 401 || status === 403 || errorMsg.includes("api key") || errorMsg.includes("unauthorized") || errorMsg.includes("invalid key") || errorMsg.includes("api_key"));
      console.error(`6. Is API Key Valid? ${isApiKeyValid ? "YES (or key is valid and hit a different error status)" : "NO (Authentication failure/Invalid API Key)"}`);

      // 7. Categorized rejection reason
      let rejectionReason = "UNKNOWN REASON";
      if (status === 401 || status === 403 || errorMsg.includes("api key") || errorMsg.includes("unauthorized") || errorMsg.includes("invalid key") || errorMsg.includes("api_key")) {
        rejectionReason = "AUTHENTICATION FAILURE (Invalid API Key)";
      } else if (status === 429 || errorMsg.includes("quota") || errorMsg.includes("exhausted") || errorMsg.includes("rate limit") || errorMsg.includes("limit")) {
        rejectionReason = "QUOTA / RATE LIMIT EXCEEDED";
      } else if (status === 404 || errorMsg.includes("model not found") || errorMsg.includes("not available") || errorMsg.includes("supported")) {
        rejectionReason = "MODEL AVAILABILITY ISSUE (Invalid model or not supported in this region)";
      } else if (status === 400 || errorMsg.includes("invalid argument") || errorMsg.includes("bad request") || errorMsg.includes("malformed") || errorMsg.includes("parts must not be empty")) {
        rejectionReason = "MALFORMED REQUEST (Invalid payload structure or arguments)";
      } else if (status === 503 || errorMsg.includes("503") || errorMsg.includes("temporary") || errorMsg.includes("service unavailable") || errorMsg.includes("overloaded") || errorMsg.includes("unavailable")) {
        rejectionReason = "TEMPORARY / SERVICE UNAVAILABLE (Gemini service overload)";
      } else if (status === 500 || status === 502 || status === 504) {
        rejectionReason = "INTERNAL SERVER ERROR / GATEWAY TIMEOUT";
      }
      console.error(`7. Rejection Reason: ${rejectionReason}`);
      console.error("==========================================\n");

      // If the error message indicates a daily quota or resource exhaustion, it is NOT transient (no point in retrying)
      const isPersistentQuotaExceeded = 
        errorMsg.includes("quota exceeded") || 
        errorMsg.includes("resource_exhausted") || 
        errorMsg.includes("limit:") || 
        errorMsg.includes("exceeded your current quota") ||
        errorMsg.includes("billing") ||
        errorMsg.includes("free_tier_requests");

      const isTransient = 
        !isPersistentQuotaExceeded && (
          status === 503 || 
          status === 429 || 
          status === 502 || 
          status === 504 || 
          errorMsg.includes("503") || 
          errorMsg.includes("429") || 
          errorMsg.includes("temporary") || 
          errorMsg.includes("demand") || 
          errorMsg.includes("unavailable") ||
          errorMsg.includes("overloaded") ||
          errorMsg.includes("limit")
        );
      
      if (isTransient && i < retries - 1) {
        console.warn(`Gemini API returned transient error (status: ${status || "unknown"}), retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Issue Analysis endpoint (for Gemini AI analysis of reports)
app.post("/api/analyze-issue", async (req, res) => {
  const { description, imageBase64, category } = req.body;

  const mockFallbackAnalysis = (cat: string, desc: string) => {
    // Determine if we should mock an invalid image based on typical test descriptions or cues
    const isMockInvalid = desc && (
      desc.toLowerCase().includes("cat") || 
      desc.toLowerCase().includes("dog") || 
      desc.toLowerCase().includes("selfie") || 
      desc.toLowerCase().includes("flower") ||
      desc.toLowerCase().includes("invalid") ||
      desc.toLowerCase().includes("no civic issue")
    );

    if (isMockInvalid) {
      return {
        imageStatus: "Invalid",
        issueType: "None",
        inspectionReport: "No valid civic issue detected in the uploaded image.",
        severity: "Low",
        priority: "Low",
        confidenceScore: parseFloat((0.10 + Math.random() * 0.1).toFixed(2)),
        visualEvidence: ["No visible public infrastructure failures"],
        potentialRisks: ["None identified"],
        responsibleDepartment: "",
        expectedResponseTime: "N/A",
        citizenRecommendation: "Please upload an image showing a genuine civic issue.",
        aiReasoning: "The image depicts a subject that does not align with city maintenance or public works oversight.",
        complaintDraft: "",
        
        // Legacy support
        suggestedSeverity: "Low",
        suggestedTitle: "No valid civic issue detected",
        suggestedDescription: "No civic issue detected. Please upload an image showing a genuine civic issue.",
        suggestedCategory: "Other",
        summary: "No civic issue detected.",
        isHazard: false,
        actionRequired: "Please upload an image showing a genuine civic issue.",
        responsibleDept: "",
        authorityReason: "No civic issue detected.",
        estimatedUrgency: "Low",
        estimatedImpactRadius: "0 meters",
        estimatedAffectedCitizens: 0,
        priorityScore: 0,
        priorityReason: "No infrastructure failure detected.",
        precautions: [],
        futureConsequences: [],
        nextCitizenAction: "Please upload an image showing a genuine civic issue."
      };
    }

    // Dynamic processing of categories and descriptions to avoid hardcoded templates
    const issueName = cat ? cat.split("/").pop() || cat : "Infrastructure";
    const title = desc && desc.length < 50 
      ? desc 
      : `Reported ${issueName} Anomaly`;

    const cleanDesc = desc || `A municipal inspection is requested for this reported ${issueName} issue.`;
    const severityVal = desc.toLowerCase().includes("critical") || desc.toLowerCase().includes("danger") ? "Critical" :
                       desc.toLowerCase().includes("severe") || desc.toLowerCase().includes("urgent") ? "High" : "Medium";
    
    const randomConf = parseFloat((0.85 + Math.random() * 0.14).toFixed(2));
    const randomScore = Math.floor(60 + Math.random() * 30);

    const dept = cat === "Roads/Potholes" ? "Municipal Roads Authority" :
                 cat === "Streetlights" ? "Delhi Electricity Board" :
                 cat === "Water/Sanitation" ? "Water and Sewage Authority" :
                 cat === "Trash/Litter" ? "Waste Management and Sanitation Department" :
                 "Municipal Public Works Department";

    return {
      imageStatus: "Valid",
      issueType: title,
      inspectionReport: cleanDesc,
      severity: severityVal,
      priority: severityVal,
      confidenceScore: randomConf,
      visualEvidence: [
        `Visible signs of ${issueName.toLowerCase()}`,
        "Physical evidence captured by reporter"
      ],
      potentialRisks: [
        "Potential safety hazard for commuters",
        "Aesthetic and environmental degradation"
      ],
      responsibleDepartment: dept,
      expectedResponseTime: "48 Hours",
      citizenRecommendation: "Exercise caution in the immediate vicinity.",
      aiReasoning: `Identified ${issueName.toLowerCase()} anomaly. Dispatch recommended to ${dept} to prevent potential secondary safety hazards.`,
      complaintDraft: `COMPLAINT REF: CE-DYN-${Date.now().toString().slice(-6)}\nTo the Chief Commissioner,\n\nI am writing to report a public concern regarding: ${title}.\n\nDescription: ${cleanDesc}\n\nPlease take immediate corrective action.\n\nSincerely,\nCivicEye AI Platform`,

      // Legacy support fields
      suggestedSeverity: severityVal as any,
      suggestedTitle: title,
      suggestedDescription: cleanDesc,
      suggestedCategory: (cat || "Other") as any,
      summary: `Dynamic assessment of reported ${issueName.toLowerCase()} completed with ${Math.round(randomConf * 100)}% confidence.`,
      isHazard: true,
      actionRequired: "Deploy maintenance team for corrective action.",
      publicImpact: `This issue impacts local transit and community access.`,
      responsibleDept: dept,
      complaintText: `Formal complaint created for ${title}`,
      precautions: ["Exercise caution in the area"],
      futureConsequences: ["Escalated repair costs if neglected"],
      nextCitizenAction: "Monitor local updates.",
      authorityReason: `Assigned based on municipal jurisdiction over ${issueName.toLowerCase()} assets.`,
      estimatedUrgency: severityVal === "Critical" ? "Critical Urgency" : "Medium Urgency",
      estimatedImpactRadius: "100 meters",
      estimatedAffectedCitizens: 50,
      priorityScore: randomScore,
      priorityReason: `Safety and accessibility hazard level: ${severityVal}.`
    };
  };

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.log("No GEMINI_API_KEY. Returning new error response format.");
      return res.json({
        success: false,
        imageStatus: "Unavailable",
        error: "Gemini API key is not configured. Please define GEMINI_API_KEY in your settings or environment variables."
      });
    }

    let prompt = `You are an experienced municipal engineer inspecting public infrastructure. You do NOT behave like a chatbot.
Do NOT generate template responses.
Do NOT repeat previous outputs.
Do NOT assume there is always a pothole or any civic issue.
Your analysis must depend ONLY on what is actually visible in the image.
Do NOT fabricate objects or invent evidence.
Accuracy is more important than confidence. Truthfulness is more important than completing every field.

IMPORTANT: Every image uploaded is a completely unique, live situation. Do NOT use standard templates or generic descriptions. Your inspection report, visual evidence list, and complaint draft MUST be uniquely customized to the specific visual elements visible in this image.

Perform these steps internally before producing your final JSON report:
Step 1: Inspect the image carefully and observe every visible object.
Step 2: Determine whether a genuine public infrastructure/civic issue exists in the image.
- If NO civic issue exists:
  Stop further analysis immediately.
  Set "imageStatus" to "Invalid".
  Set "issueType" to "None".
  Set "inspectionReport" to "No civic issue detected. The uploaded image does not contain any visible public infrastructure issue."
  Set "aiReasoning" to "The uploaded image does not contain any visible public infrastructure issue."
  Set "citizenRecommendation" to "Please upload an image showing a genuine civic issue."
  Set "complaintDraft" to ""
  Set "severity" to "Low"
  Set "priority" to "Low"
  Set "confidenceScore" to 0.15
  Set "visualEvidence" to ["No visible public infrastructure failures"]
  Set "potentialRisks" to ["None identified"]
  Set "responsibleDepartment" to ""
  Set "expectedResponseTime" to "N/A"
  Do not assign a department. Do not estimate severity. Do not hallucinate.

- If a civic issue IS detected, identify ONLY the visible issue.
Step 3: Assign "issueType" to one of these categories (or "Other" / "Unknown Civic Issue" if none match perfectly):
  "Road Damage", "Pothole", "Road Crack", "Garbage Dump", "Overflowing Dustbin", "Waterlogging", "Water Leakage", "Broken Streetlight", "Electric Pole Damage", "Traffic Signal Damage", "Open Manhole", "Footpath Damage", "Construction Debris", "Illegal Dumping", "Fallen Tree", "Sewage Overflow", "Flood Damage", "Public Property Damage", "Other"
Step 4: Estimate severity ("Low", "Medium", "High", "Critical") using ONLY visible evidence (size, depth, extent, pedestrian/vehicle danger). Do not guess hidden damage.
Step 5: Estimate confidenceScore (float between 0 and 1). Confidence must decrease if the image is blurry, poorly lit, partially hidden, or has low resolution.
Step 6: Generate a professional "inspectionReport". Describe ONLY what is visible. Do not mention AI, machine learning, cameras, scanning, visual anomalies, detected objects, or image recognition. Sound like a municipal field inspector writing a formal, objective, professional report.
Step 7: List "visualEvidence" (array of strings, e.g., ["Broken asphalt visible", "Surface depression visible"]). Only mention visible evidence.
Step 8: Identify the most appropriate "responsibleDepartment" (e.g. "Municipal Roads Authority", "Delhi Electricity Board", "Water and Sewage Authority", "Waste Management and Sanitation Department", "Municipal Public Works Department"). If uncertain, set to "Department could not be determined.".
Step 9: Generate a professional, formal "complaintDraft" addressed to the department commissioner demanding rapid repair, containing a ticket reference. Only generate this if a valid issue exists.
Step 10: Give a practical "citizenRecommendation" (e.g. "Avoid this road", "Exercise caution").

Your final output must be a single, flat JSON object matching this schema exactly. Do not wrap the JSON or add any markdown wrapper other than standard raw JSON.
{
  "imageStatus": "Valid" | "Invalid",
  "issueType": string,
  "inspectionReport": string,
  "severity": "Low" | "Medium" | "High" | "Critical",
  "priority": "Low" | "Medium" | "High" | "Critical",
  "confidenceScore": number,
  "visualEvidence": string[],
  "potentialRisks": string[],
  "responsibleDepartment": string,
  "expectedResponseTime": string,
  "citizenRecommendation": string,
  "aiReasoning": string,
  "complaintDraft": string,
  
  // Legacy fields to maintain absolute compatibility with existing UI components:
  "suggestedSeverity": "Low" | "Medium" | "High" | "Critical",
  "suggestedTitle": string,
  "suggestedDescription": string,
  "suggestedCategory": "Roads/Potholes" | "Streetlights" | "Water/Sanitation" | "Trash/Litter" | "Graffiti" | "Other",
  "summary": string,
  "isHazard": boolean,
  "actionRequired": string,
  "responsibleDept": string,
  "authorityReason": string,
  "estimatedUrgency": string,
  "estimatedImpactRadius": string,
  "estimatedAffectedCitizens": number,
  "priorityScore": number,
  "priorityReason": string,
  "precautions": string[],
  "futureConsequences": string[],
  "nextCitizenAction": string
}

Ensure the user's description hint: "${description || ""}" and category hint: "${category || ""}" are considered, but prioritize the physical visual evidence in the image first.`;

    let responseText = "";

    if (imageBase64) {
      let mimeType = "image/jpeg";
      const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z+.-]+);base64,/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }

      // Format payload strictly according to the modern @google/genai SDK (wrapping Parts in a Content object)
      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: imageBase64.split(",")[1] || imageBase64,
                mimeType: mimeType
              }
            }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });
      responseText = response.text || "{}";
    } else {
      // Use standard text prompt structure for the text-only path
      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      responseText = response.text || "{}";
    }

    // Print raw response before parsing as requested
    console.log("=== RAW GEMINI ANALYSIS RESPONSE ===");
    console.log(responseText);
    console.log("====================================");

    try {
      const parsed = JSON.parse(responseText);
      
      // Ensure expected fields exist
      if (!parsed.imageStatus) {
        parsed.imageStatus = parsed.isValid === false ? "Invalid" : "Valid";
      }

      // If invalid, clear complaint and department per instructions
      if (parsed.imageStatus === "Invalid") {
        parsed.responsibleDepartment = "";
        parsed.complaintDraft = "";
        parsed.suggestedTitle = "No valid civic issue detected";
        parsed.suggestedDescription = parsed.inspectionReport || "No valid civic issue detected.";
      } else {
        // Map clean back-compatible fields for UI
        if (!parsed.suggestedSeverity) parsed.suggestedSeverity = parsed.severity || "Medium";
        if (!parsed.suggestedTitle) parsed.suggestedTitle = parsed.issueType || "Civic Issue";
        if (!parsed.suggestedDescription) parsed.suggestedDescription = parsed.inspectionReport || "";
        if (!parsed.suggestedCategory) parsed.suggestedCategory = category || "Other";
        if (!parsed.summary) parsed.summary = parsed.inspectionReport || "";
        if (parsed.isHazard === undefined) parsed.isHazard = true;
        if (!parsed.actionRequired) parsed.actionRequired = "Deploy maintenance dispatch board.";
        if (!parsed.responsibleDept) parsed.responsibleDept = parsed.responsibleDepartment || "Municipal Public Works Department";
        if (!parsed.authorityReason) parsed.authorityReason = parsed.aiReasoning || "Standard infrastructure oversight.";
      }

      res.json({ success: true, analysis: parsed });
    } catch (e) {
      console.warn("JSON parse failed on raw Gemini response:", e);
      res.json({
        success: false,
        imageStatus: "Unavailable",
        error: "Gemini service temporarily unavailable."
      });
    }

  } catch (error: any) {
    console.error("Gemini AI analysis error:", error);
    res.json({
      success: false,
      imageStatus: "Unavailable",
      error: "Gemini service temporarily unavailable."
    });
  }
});

// AI Disaster Forecaster endpoint
app.post("/api/generate-forecast", async (req, res) => {
  const { issues } = req.body;

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      // Mock forecast data that corresponds to the initial issues of San Francisco
      return res.json({
        success: true,
        mock: true,
        forecasts: [
          {
            id: "fc_1",
            title: "🚨 Potential Flooding Risk",
            category: "Waterlogging Risk",
            riskLevel: "High",
            confidence: "Medium",
            area: "Haight & Clayton St Area",
            latitude: 37.7699,
            longitude: -122.4468,
            contributingReports: 3,
            reasoning: "Repeated pressurized leaks and water main anomalies indicate worsening subterranean moisture accumulation. Immediate inspection of drainage vaults and water main pressure levels is recommended to prevent localized blockages and street waterlogging.",
            recommendedAction: "Citizens should report active sidewalk wet spots. Secure basement entry points along the main street line.",
            estimatedImpact: 1450,
            recommendedIntervention: "Execute sonic leak-detection survey and verify storm-water intake capacity within 5 days."
          },
          {
            id: "fc_2",
            title: "⚠ Road Failure Warning",
            category: "Road Collapse Risk",
            riskLevel: "High",
            confidence: "High",
            area: "Market St Corridor",
            latitude: 37.7749,
            longitude: -122.4194,
            contributingReports: 8,
            reasoning: "A cluster of major deep pothole reports along heavy traffic lanes suggests serious base-course water damage and asphalt fatigue. Under continuous municipal bus loads, there is an elevated risk of minor road collapse or deep sinkholes.",
            recommendedAction: "Cyclists should bypass the center dual-lanes. Reduce driving speed during nighttime hours.",
            estimatedImpact: 3200,
            recommendedIntervention: "Mobilize heavy asphalt patching crew and perform subsurface ground-penetrating radar scan."
          },
          {
            id: "fc_3",
            title: "⚡ Electrical Safety Warning",
            category: "Electrical Hazard Risk",
            riskLevel: "Medium",
            confidence: "High",
            area: "Ellis St Intersection",
            latitude: 37.7833,
            longitude: -122.4167,
            contributingReports: 4,
            reasoning: "Multiple adjacent streetlight outages coupled with reports of exposed electrical conduits pose immediate pedestrian risks. Darkness in the crosswalk increases nighttime collision probability.",
            recommendedAction: "Pedestrians should wear reflective garments or use phone flashlights during crossing. Avoid touching metallic light posts.",
            estimatedImpact: 950,
            recommendedIntervention: "Replace broken photo-electric relays and secure the underground feed boxes within 48 hours."
          }
        ]
      });
    }

    const ai = getAiClient();
    const prompt = `You are "CivicEye Forecaster AI", an advanced predictive urban intelligence model running inside a smart municipal command center.
Your objective is to analyze historical/current reported civic issues and predict potential future disaster risks (geographic clustering, worsening patterns, time trends).

Active reports array:
${JSON.stringify(issues || [])}

Perform a spatial-temporal threat analysis and output exactly 3 to 4 predictive "DisasterForecast" risks.

Return a JSON array containing objects matching this schema:
{
  "id": "fc_string_id",
  "title": "A short warning title starting with emoji, e.g. '🚨 Potential Flooding Risk' or '⚠ Road Failure Warning' or '⚡ Electrical Safety Warning'",
  "category": "strictly one of: 'Flood Risk', 'Road Collapse Risk', 'Waterlogging Risk', 'Drainage Failure Risk', 'Infrastructure Failure Risk', 'Electrical Hazard Risk'",
  "riskLevel": "strictly one of: 'High', 'Medium', 'Low'",
  "confidence": "strictly one of: 'High', 'Medium', 'Low'",
  "area": "Descriptive district or street neighborhood name",
  "latitude": number (floating point latitude centered near related reports),
  "longitude": number (floating point longitude centered near related reports),
  "contributingReports": number (count of issues that led to this risk),
  "reasoning": "Detailed 2-3 sentence explanation of the potential future hazard based on combining reports, weather conditions, or civic decay patterns",
  "recommendedAction": "Actionable advice for the public or neighborhood watch",
  "estimatedImpact": number (integer estimate of citizen population impacted, e.g., 2300),
  "recommendedIntervention": "Actionable instructions for the city engineering services"
}

Ensure your response is valid JSON array containing ONLY objects following the structure above. No markdown formatting blocks around the array except for standard JSON output.`;

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: [prompt],
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "[]";
    const forecasts = JSON.parse(responseText);

    res.json({ success: true, forecasts });

  } catch (error: any) {
    console.warn("Disaster forecaster AI error, falling back to pre-seeded forecast patterns:", error);
    res.json({
      success: true,
      mock: true,
      forecasts: [
        {
          id: "fc_1",
          title: "🚨 Potential Flooding Risk",
          category: "Waterlogging Risk",
          riskLevel: "High",
          confidence: "Medium",
          area: "Haight & Clayton St Area",
          latitude: 37.7699,
          longitude: -122.4468,
          contributingReports: 3,
          reasoning: "Repeated pressurized leaks and water main anomalies indicate worsening subterranean moisture accumulation. Immediate inspection of drainage vaults and water main pressure levels is recommended to prevent localized blockages and street waterlogging.",
          recommendedAction: "Citizens should report active sidewalk wet spots. Secure basement entry points along the main street line.",
          estimatedImpact: 1450,
          recommendedIntervention: "Execute sonic leak-detection survey and verify storm-water intake capacity within 5 days."
        },
        {
          id: "fc_2",
          title: "⚠ Road Failure Warning",
          category: "Road Collapse Risk",
          riskLevel: "High",
          confidence: "High",
          area: "Market St Corridor",
          latitude: 37.7749,
          longitude: -122.4194,
          contributingReports: 8,
          reasoning: "A cluster of major deep pothole reports along heavy traffic lanes suggests serious base-course water damage and asphalt fatigue. Under continuous municipal bus loads, there is an elevated risk of minor road collapse or deep sinkholes.",
          recommendedAction: "Cyclists should bypass the center dual-lanes. Reduce driving speed during nighttime hours.",
          estimatedImpact: 3200,
          recommendedIntervention: "Mobilize heavy asphalt patching crew and perform subsurface ground-penetrating radar scan."
        },
        {
          id: "fc_3",
          title: "⚡ Electrical Safety Warning",
          category: "Electrical Hazard Risk",
          riskLevel: "Medium",
          confidence: "High",
          area: "Ellis St Intersection",
          latitude: 37.7833,
          longitude: -122.4167,
          contributingReports: 4,
          reasoning: "Multiple adjacent streetlight outages coupled with reports of exposed electrical conduits pose immediate pedestrian risks. Darkness in the crosswalk increases nighttime collision probability.",
          recommendedAction: "Pedestrians should wear reflective garments or use phone flashlights during crossing. Avoid touching metallic light posts.",
          estimatedImpact: 950,
          recommendedIntervention: "Replace broken photo-electric relays and secure the underground feed boxes within 48 hours."
        }
      ]
    });
  }
});

// AI Safety Briefing endpoint
app.post("/api/generate-safety-briefing", async (req, res) => {
  const { issues, location } = req.body;
  const city = location?.city || "Jaipur";
  const state = location?.state || "Rajasthan";
  const locality = location?.locality || "Malviya Nagar";
  const lat = location?.latitude || 26.9124;
  const lng = location?.longitude || 75.7873;

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      // Mock safety briefing based on location
      const mockBriefings: Record<string, string> = {
        "Jaipur": "Good day, citizen. The air quality in Jaipur is Moderate (AQI 112). A warm breeze is expected throughout Malviya Nagar this evening with a temperature around 34°C. Two road infrastructure anomalies have been reported within 1.5 km of your location on Tonk Road. Commuters should exercise caution near major junctions. No severe weather or emergency alerts at this time.",
        "Mumbai": "Good evening. The air quality in Mumbai is Moderate (AQI 125) with a humid climate. Heavy rainfall is expected later tonight, which may cause minor waterlogging in low-lying sectors of Bandra West. Three active potholes have been reported near the Highway lanes. Travel carefully on Western Express Highway. Sanitary departments are on active dispatch.",
        "New Delhi": "Good afternoon. Air quality in your Delhi sector is Poor (AQI 188). Limit intense outdoor exercises and wear a face mask when traveling through Connaught Place. Two broken streetlamps have been reported near the Outer Circle. Streetlights are scheduled for maintenance tonight. Travel safely.",
        "Bengaluru": "Good day. Air quality in Indiranagar is Good (AQI 54) with a pleasant temperature of 22°C. A broken storm drainage pipe has been flagged near Bellandur, causing minor sidewalk sludge. Pedestrians should use the eastern walk paths. Transit incident patrol is monitoring the lane.",
        "San Francisco": "Good morning. Air quality in the Bay Area is Excellent (AQI 32). Overcast conditions with light drizzle are expected along Market St. Road patching is active near Clayton St, expect minor delays of 5 minutes. No emergency conditions flagged."
      };
      const briefing = mockBriefings[city] || `Good day. Air quality in ${locality}, ${city} is currently Moderate (AQI 98). Light conditions expected with standard civic hazards. Reduce speed near known road construction zones. No major weather alerts are issued for ${state}. Stay safe!`;
      return res.json({ success: true, briefing });
    }

    const ai = getAiClient();
    const prompt = `You are "CivicEye safety assistant", a friendly and highly knowledgeable AI safety assistant.
Generate a professional, warm, concise daily neighborhood safety summary for a citizen based on their current location and nearby issues.

Location details:
City: "${city}"
State: "${state}"
Locality: "${locality}"
Coordinates: Lat ${lat}, Lng ${lng}

Nearby reported issues:
${JSON.stringify(issues || [])}

Instructions:
1. Greet the user in a warm, polite manner.
2. Tell them about the air quality and general weather/hazard predictions for their specific location. Feel free to creatively infer weather/AQI based on common characteristics of the city or nearby issues (e.g. higher AQI in New Delhi, rain probability in Mumbai, clean air in San Francisco).
3. Mention nearby reported issues (e.g. number of potholes, broken streetlights, or drainage failures reported nearby) and which roads to watch out for.
4. Provide a closing reassuring message.
5. Keep the response compact (3-5 sentences), easy to scan, and conversational. Do not use complex system files, container ports, or diagnostic logs.`;

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: [prompt],
    });

    res.json({ success: true, briefing: response.text || "Good day citizen! Your safety radar is fully operational." });

  } catch (error: any) {
    console.warn("Safety briefing AI error:", error);
    res.json({ success: true, briefing: `Good day citizen! Welcome to ${locality}, ${city}. Local air quality is Moderate with general seasonal patterns. Drive safely and report any street hazards you encounter!` });
  }
});

// Civic Connect Hub API endpoint
app.post("/api/generate-connect-data", async (req, res) => {
  const { title, description, category, severity, area, issueId } = req.body;

  // Rich Local Algorithmic Fallback Engine
  const getLocalConnectFallback = (
    cTitle: string,
    cDesc: string,
    cCat: string,
    cSev: string,
    cArea: string,
    cId: string
  ) => {
    const formattedId = cId || `ISS-${Math.floor(100000 + Math.random() * 900000)}`;
    const matchedCategory = (cCat || "Other").toLowerCase();
    const cleanArea = cArea || "Metro Area";

    let auth = {
      name: "Municipal General Administration Office",
      contact: "311 (General Inquiry) / 415-555-0100",
      email: "civic.resolutions@city.gov",
      website: "https://city.gov/citizen-access",
      officeHours: "Mon - Fri, 9:00 AM - 5:00 PM",
      officeLocation: "City Hall Room 104, 1 Dr Carlton B Goodlett Pl, San Francisco, CA"
    };

    let citizensAffected = 450;
    let safetyImpact = "Medium Risk of pedestrian falls or minor vehicle alignments issues.";
    let trafficImpact = "Low - Occasional minor lane slows.";
    let environmentalImpact = "Negligible.";

    if (matchedCategory.includes("road") || matchedCategory.includes("pothole") || matchedCategory.includes("infrastructure")) {
      auth = {
        name: "Road Maintenance & Highways Department",
        contact: "511 (Highways) / 415-555-0199",
        email: "road.repairs@city.gov",
        website: "https://city.gov/roads-and-highways",
        officeHours: "Mon - Fri, 8:00 AM - 5:00 PM (24/7 Dispatch)",
        officeLocation: "Sector 4 Civic Maintenance Depot, 1200 Harrison St, San Francisco, CA"
      };
      citizensAffected = 1850;
      safetyImpact = "High Risk - Potholes force heavy tires to swerve, risking collision with adjacent cyclists.";
      trafficImpact = "Medium - Commuters slowing down to avoid structural impact.";
      environmentalImpact = "Low - Excess asphalt particulate and minor runoff during heavy storm downpours.";
    } else if (matchedCategory.includes("water") || matchedCategory.includes("leak") || matchedCategory.includes("drain") || matchedCategory.includes("flood")) {
      auth = {
        name: "Water Supply & Storm Drainage Board",
        contact: "415-555-0144 (Emergency Line)",
        email: "drainage.engineering@citywater.gov",
        website: "https://citywater.gov/emergencies",
        officeHours: "24/7 Emergency Storm Team",
        officeLocation: "City Water Works Center, 1600 Mission St, San Francisco, CA"
      };
      citizensAffected = 2400;
      safetyImpact = "High Risk - Pooled water triggers slick surfaces, worsening braking times and flooding lower basements.";
      trafficImpact = "High - Lane submersions force vehicle rerouting and pedestrian detours.";
      environmentalImpact = "Significant - Untreated stormwater runoff carrying motor residues into municipal bays.";
    } else if (matchedCategory.includes("electricity") || matchedCategory.includes("light") || matchedCategory.includes("power") || matchedCategory.includes("hazard")) {
      auth = {
        name: "Electricity & Public Lighting Department",
        contact: "415-555-0188",
        email: "grid.safety@citylight.gov",
        website: "https://citylight.gov/outage-reporting",
        officeHours: "Mon - Sat, 7:30 AM - 6:00 PM",
        officeLocation: "Power Distribution Grid Headquarters, 901 Potrero Ave, San Francisco, CA"
      };
      citizensAffected = 1100;
      safetyImpact = "Critical Hazard - Exposed wiring triggers shock danger, and dark intersection paths increase collision risk.";
      trafficImpact = "Medium - Lower intersection speed during nighttime due to near-zero visibility.";
      environmentalImpact = "Medium - High carbon output from inefficient, outdated photoelectric systems.";
    } else if (matchedCategory.includes("garbage") || matchedCategory.includes("trash") || matchedCategory.includes("waste") || matchedCategory.includes("sanitation")) {
      auth = {
        name: "Municipal Waste & Sanitation Department",
        contact: "415-555-0133",
        email: "waste.clearance@citysanitation.gov",
        website: "https://citysanitation.gov/service",
        officeHours: "Mon - Sat, 6:00 AM - 4:00 PM",
        officeLocation: "Southeastern Waste Resource Hub, 2225 Jerrold Ave, San Francisco, CA"
      };
      citizensAffected = 850;
      safetyImpact = "Medium Risk - Accumulation poses biohazard risks, invites rodents, and blocks pathways.";
      trafficImpact = "Low - Narrowed alleyways block loading zones and service vehicles.";
      environmentalImpact = "Critical - Litter blowoff gets swept into storm pipes and local urban parks.";
    }

    const priorityLevel = cSev || "Medium";

    return {
      authority: auth,
      draft: {
        title: `Official Complaint: Urgent Attention Required for ${cCat || "Civic Hazard"} at ${cleanArea}`,
        summary: `This report registers a public safety issue concerning "${cTitle || "Unspecified hazard"}" reported at ${cleanArea}. Prompt resolution is requested.`,
        detailedComplaint: `Subject: Urgent Civic Remediation Request – ${cTitle || "Hazard Zone"} Near ${cleanArea}\n\nDear Department Director,\n\nI am writing to log an official civic complaint regarding an active issue (Reference ID: ${formattedId}) at the following location: ${cleanArea}.\n\nThe issue is described as: "${cDesc || "No description provided."}"\n\nThis matter is categorized as a "${cCat || "Other"}" hazard with a severity level of "${priorityLevel}". It currently compromises neighborhood usability, safety, and public infrastructure standards. We request that your engineering or response dispatch team inspect the coordinates and execute repairs as soon as possible.\n\nRespectfully submitted,\nCitizen of CivicEye Network\nReference ID: ${formattedId}`,
        priorityLevel
      },
      escalations: {
        day7: `Subject: Day 7 Reminder: Unresolved ${cCat || "Civic Issue"} (ID: ${formattedId}) at ${cleanArea}\n\nDear Department Representative,\n\nThis is a follow-up inquiry concerning report ID ${formattedId} ("${cTitle}"), originally logged 7 days ago. This issue continues to remain active, causing public inconvenience. Please verify if an inspection has been completed.`,
        day15: `Subject: Day 15 Urgent Follow-up: Unresolved Hazard (ID: ${formattedId}) at ${cleanArea}\n\nDear Assistant Director,\n\nThis issue was reported 15 days ago and remains unresolved. The persistent state of "${cTitle}" at ${cleanArea} compromises safety. We respectfully request immediate action to prevent further community deterioration.`,
        day30: `Subject: Day 30 Formal Escalation: Unresolved Public Liability (ID: ${formattedId}) at ${cleanArea}\n\nDear Director of General Municipal Administration,\n\nWe are formally escalating complaint ID ${formattedId} due to thirty days of non-resolution. This has evolved into an active public hazard. We request a written status report regarding the deployment delay of city engineering services.`
      },
      escalationScore: priorityLevel === "High" ? "High" : priorityLevel === "Critical" ? "Critical" : "Medium",
      escalationAdvice: `Since this issue represents a ${priorityLevel} priority level, the target response timeline is within 5 days. If unresolved by Day 7, trigger the follow-up reminder. For extended negligence, prepare the RTI Transparency Draft to request the departmental action logs.`,
      rtiDraft: `APPLICATION UNDER FREEDOM OF INFORMATION / RIGHT TO INFORMATION ACT\n\nTo: Public Information Officer\nDepartment: ${auth.name}\n\nSubject: RTI Inquiry regarding the status of unresolved Complaint Ref ID: ${formattedId}\n\nDear Sir/Madam,\n\nWith reference to Complaint Ref ID: ${formattedId} ("${cTitle}") logged at ${cleanArea}, please provide the following details under public disclosure laws:\n\n1. Provide copies of all files, site inspection notes, and work orders created by department officers in response to this report.\n2. Provide the names and designations of officers responsible for executing the repair, and the expected date of completion.\n3. Provide the details of funds sanctioned or contractors assigned for maintenance in this sector during the current quarter.`,
      impactAnalysis: {
        citizensAffected,
        safetyImpact,
        trafficImpact,
        environmentalImpact
      }
    };
  };

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      const fallback = getLocalConnectFallback(title, description, category, severity, area, issueId);
      return res.json({ success: true, fallback: true, ...fallback });
    }

    const ai = getAiClient();
    const prompt = `You are "CivicEye Connector AI", an expert civic liaison.
Analyze the following civic issue:
ID: "${issueId || "unknown"}"
Title: "${title || ""}"
Description: "${description || ""}"
Category: "${category || ""}"
Severity: "${severity || "Medium"}"
Area: "${area || ""}"

Create a highly detailed, professional civic response package including local government contact information, a formal complaint draft, a series of escalation reminder emails (Day 7, 15, and 30), an RTI (Right to Information) / FOIA style draft for long-unresolved complaints, and estimated community impact scores.

Respond with a JSON object strictly following this structure:
{
  "authority": {
    "name": "Responsible City Department/Agency Name",
    "contact": "Contact phone number (official format)",
    "email": "official-contact@department.gov",
    "website": "https://agency.gov/repairs",
    "officeHours": "Standard hours of operation, e.g. Mon-Fri 8:00 AM - 5:00 PM",
    "officeLocation": "Physical address of department offices"
  },
  "draft": {
    "title": "A highly professional official Subject line for the email/letter",
    "summary": "1-2 sentence quick summary of the hazard and its threat",
    "detailedComplaint": "A formal, professional, 2-3 paragraph complaint letter complete with placeholders and reference ID",
    "priorityLevel": "strictly one of: 'Low', 'Medium', 'High', 'Critical'"
  },
  "escalations": {
    "day7": "A formal, polite, persistent 1-paragraph email follow-up reminder for Day 7 of no action",
    "day15": "An urgent, professional follow-up email for Day 15 of no action stating growing public risk",
    "day30": "A highly formal, serious escalation letter for Day 30 addressed to senior municipal leadership"
  },
  "escalationScore": "strictly one of: 'Low', 'Medium', 'High', 'Critical'",
  "escalationAdvice": "Detailed, professional advice instructing the citizen how to escalate if the department delays action",
  "rtiDraft": "A fully drafted RTI (Right to Information) or FOIA (Freedom of Information Act) application requesting specific departmental files, inspection logs, work orders, and action history regarding this unresolved issue.",
  "impactAnalysis": {
    "citizensAffected": number (integer estimate of potential neighborhood citizens affected, e.g. 1500),
    "safetyImpact": "Professional brief assessment of the immediate safety threat",
    "trafficImpact": "Brief assessment of traffic/mobility slowdown impact",
    "environmentalImpact": "Brief assessment of environmental or pollution impact"
  }
}

Ensure your response is valid JSON only. Do not wrap in markdown tags except the standard JSON output rules.`;

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: [prompt],
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "{}";
    const data = JSON.parse(responseText);

    res.json({ success: true, ...data });

  } catch (error: any) {
    console.warn("Civic Connect Hub AI error, generating beautiful algorithmic fallbacks:", error);
    const fallback = getLocalConnectFallback(title, description, category, severity, area, issueId);
    res.json({ success: true, fallback: true, ...fallback });
  }
});

// Ask CivicEye conversational assistant endpoint
app.post("/api/ask-civiceye", async (req, res) => {
  const { question, history, userLocation } = req.body;
  try {
    const key = process.env.GEMINI_API_KEY;
    const q = (question || "").toLowerCase();

    // Check for unrelated questions (off-topic)
    const offTopicKeywords = [
      "code", "program", "javascript", "python", "html", "css", "typescript", "coding", "software",
      "movie", "film", "actor", "actress", "celebrity", "gossip", "joke", "jokes",
      "homework", "math", "history", "science", "politics", "president", "election",
      "song", "music", "lyrics", "sing", "game", "play", "sport", "football", "cricket"
    ];
    const isOffTopic = offTopicKeywords.some(kw => q.includes(kw));

    if (isOffTopic) {
      return res.json({
        success: true,
        answer: "I am CivicEye AI and specialize in civic issues, public infrastructure, complaint guidance, and municipal services. Please ask a civic-related question."
      });
    }

    if (!key) {
      // Mock conversational response based on common questions conforming to requested format
      let answer = `**Issue**
General civic help and reporting inquiry.

**Guidance**
To report any public infrastructure concern, such as a pothole, broken streetlight, garbage dump, or water leak, please use our 'Report Issue' panel. You can upload an image, select the location, and verify details before submission.

**Responsible Authority**
Municipal Help Desk & Civic Outreach

**Next Step**
Click 'Report Issue' in the navigation bar to submit your report or explore active complaints on the 'Community Map'.`;

      if (q.includes("garbage") || q.includes("trash") || q.includes("litter") || q.includes("waste")) {
        answer = `**Issue**
Garbage collection or waste management concern in ${userLocation?.city || "your city"}.

**Guidance**
Unattended trash or waste dumps can attract pests and create public health risks. Please capture a clear photo of the site, specify the address, and submit it under 'Trash/Litter'.

**Responsible Authority**
Municipal Sanitation Department

**Next Step**
Use the 'Report Issue' page to submit a new ticket or check the 'Community Map' for existing reports.`;
      } else if (q.includes("pothole") || q.includes("road") || q.includes("highway") || q.includes("street")) {
        answer = `**Issue**
Pothole or road infrastructure damage in ${userLocation?.city || "your city"}.

**Guidance**
Broken roads or potholes present severe traffic and pedestrian hazards. Please submit a report with GPS coordinates under the 'Roads/Potholes' category.

**Responsible Authority**
Roads & Highways Department

**Next Step**
Submit a ticket under 'Report Issue' or upvote/verify the pothole on our 'Community Map' to raise its urgency.`;
      } else if (q.includes("water") || q.includes("leak") || q.includes("drain") || q.includes("sewage")) {
        answer = `**Issue**
Water leakage, drainage blockage, or sewage overflow.

**Guidance**
Water leakage and clogged drains can cause flooding, water contamination, and road erosion. File a report under 'Water/Sanitation' immediately with clear visual evidence.

**Responsible Authority**
Water Supply Department

**Next Step**
Capture a photo of the leakage or overflow and file an official complaint via 'Report Issue'.`;
      } else if (q.includes("light") || q.includes("streetlight") || q.includes("lamp")) {
        answer = `**Issue**
Broken or malfunctioning streetlights causing dark corridors.

**Guidance**
Dark streets compromise public safety and security. Please report the exact pole number or nearest address under the 'Streetlights' category on our dashboard.

**Responsible Authority**
Electrical Maintenance Department

**Next Step**
Go to 'Report Issue', select 'Streetlights' category, and submit the dark spot location.`;
      } else if (q.includes("emergency") || q.includes("danger") || q.includes("hazard")) {
        answer = `**Issue**
Immediate public hazard or safety emergency.

**Guidance**
Please prioritize personal safety first! Do not attempt to take pictures or inspect the scene if it is hazardous. For life-threatening emergencies, immediately dial national emergency services.

**Responsible Authority**
Emergency Services & Local Police

**Next Step**
Call emergency services first, and only report on CivicEye AI once you are in a safe environment.`;
      } else if (q.includes("how to report") || q.includes("procedure") || q.includes("steps") || q.includes("complain")) {
        answer = `**Issue**
Civic complaint reporting procedure.

**Guidance**
Filing a complaint on CivicEye is fast and transparent:
1. Capture a clear image of the issue.
2. Enable GPS or manually select the location.
3. Upload the image.
4. Verify the AI-generated details.
5. Submit the complaint.
6. Track progress through the Transparency Timeline.

**Responsible Authority**
CivicEye AI Platform Support

**Next Step**
Navigate to the 'Report Issue' screen to start your submission.`;
      }
      return res.json({ success: true, answer });
    }

    const ai = getAiClient();
    const chatHistory = (history || []).map((h: any) => ({
      role: h.sender === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));

    let locationContext = "";
    if (userLocation) {
      locationContext = `
The user is currently at the following detected precise location:
- Latitude: ${userLocation.latitude}
- Longitude: ${userLocation.longitude}
- Locality: ${userLocation.locality || "Unknown"}
- District: ${userLocation.district || "Unknown"}
- City/Municipality: ${userLocation.city || "Unknown"}
- State: ${userLocation.state || "Unknown"}
- Country: ${userLocation.country || "Unknown"}
- Postal/Pincode: ${userLocation.pincode || "Unknown"}

Please tailor your response specifically based on this local context. For example, mention that they are in ${userLocation.city || "their local city"} and customize department names and locations accordingly so it feels incredibly personalized, helpful, and location-aware.
`;
    }

    const prompt = `User's question: "${question}"
${locationContext}`;

    const systemInstruction = `You are **CivicEye AI**, an intelligent civic governance assistant designed to help citizens report, understand, and resolve public infrastructure issues.

Your role is NOT to be a general chatbot. You are a professional municipal AI assistant.

## Your Responsibilities
* Help citizens report civic issues.
* Explain complaint procedures.
* Guide users to the correct government department.
* Explain issue severity and possible risks.
* Provide safety advice where applicable.
* Help users understand complaint status and timelines.
* Answer questions related to roads, potholes, garbage, drainage, water leakage, sewage, streetlights, traffic signals, public sanitation, parks, pollution, and other civic infrastructure.

## Communication Style
* Be professional yet friendly.
* Use simple English.
* Give concise and actionable answers.
* Never generate unnecessary long paragraphs.
* If the user asks for steps, answer in bullet points.
* Avoid generic AI phrases such as "As an AI language model..."
* Never mention prompts or internal reasoning.

## Knowledge Scope
You can answer questions regarding:
* Roads & potholes
* Garbage collection
* Waste management
* Water leakage
* Sewage
* Drainage
* Broken streetlights
* Public parks
* Traffic signals
* Civic complaint procedures
* Emergency contacts
* Government departments
* Environmental hazards
* Community reporting
* Complaint tracking
* Transparency & accountability
* Public safety

## If a user asks unrelated questions
If the question is outside civic governance (for example coding, movies, jokes, homework, politics, celebrity gossip, etc.), politely respond:
"I am CivicEye AI and specialize in civic issues, public infrastructure, complaint guidance, and municipal services. Please ask a civic-related question."

## If the user asks where to report an issue
Identify the issue category and recommend the appropriate authority.
Examples:
* Garbage → Municipal Sanitation Department
* Pothole → Roads & Highways Department
* Water Leakage → Water Supply Department
* Broken Streetlight → Electrical Maintenance Department
* Sewage Overflow → Sewerage Department

## If the user asks what to do in an emergency
Advise them to immediately contact emergency services and prioritize personal safety before reporting through CivicEye AI.

## Complaint Guidance
When users ask how to report a complaint:
1. Capture a clear image.
2. Enable GPS or manually select location.
3. Upload the image.
4. Verify AI-generated details.
5. Submit the complaint.
6. Track progress through the Transparency Timeline.

## Response Format
You MUST always answer in this exact markdown format (with exactly these section headers and newline structure):

**Issue**
A short summary of the user's issue/inquiry.

**Guidance**
Clear actionable advice.

**Responsible Authority**
Mention the relevant department if applicable.

**Next Step**
Explain what the citizen should do next.

Keep every response accurate, practical, and focused on helping citizens resolve civic issues efficiently.`;

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: [...chatHistory, { text: prompt }],
      config: {
        systemInstruction
      }
    });

    res.json({ success: true, answer: response.text || "I'm here to help you solve local neighborhood issues! Could you please ask that again?" });
  } catch (error: any) {
    console.warn("Ask CivicEye AI error:", error);
    res.json({ success: true, answer: "I'm sorry, I'm experiencing a brief connection error, but I am here to help you! You can report any issue like garbage, potholes, or water leakage via the 'Report Issue' button above." });
  }
});

// AI Community Pulse endpoint
app.post("/api/community-pulse", async (req, res) => {
  const { location, issues } = req.body;
  const city = location?.city || "Jaipur";
  const locality = location?.locality || "Malviya Nagar";
  const state = location?.state || "Rajasthan";
  const lat = location?.latitude || 26.9124;
  const lng = location?.longitude || 75.7873;

  // Calculate some simple local metrics to help anchor the AI
  const totalCount = issues?.length || 0;
  const resolvedCount = (issues || []).filter((i: any) => i.status === "Resolved" || i.status === "Completed").length;
  const activeCount = totalCount - resolvedCount;

  // Find most common issue category
  const categoriesMap: Record<string, number> = {};
  (issues || []).forEach((i: any) => {
    if (i.category) {
      categoriesMap[i.category] = (categoriesMap[i.category] || 0) + 1;
    }
  });
  let mostCommon = "None";
  let maxCount = 0;
  Object.entries(categoriesMap).forEach(([cat, cnt]) => {
    if (cnt > maxCount) {
      maxCount = cnt;
      mostCommon = cat;
    }
  });

  // Calculate dynamic Community Health Score: Base is 90, deduct 5 per active issue, capped at 10 to 100
  let communityHealthScore = Math.max(20, Math.min(100, 95 - (activeCount * 6) + (resolvedCount * 3)));

  // Air Quality index logic (Jaipur typically has moderate, SF excellent, Delhi poor, etc.)
  let defaultAqi = 54;
  let defaultWeather = "32°C, Sunny & Warm";
  if (city.toLowerCase().includes("delhi")) {
    defaultAqi = 168;
    defaultWeather = "38°C, Hazy & Hot";
  } else if (city.toLowerCase().includes("mumbai")) {
    defaultAqi = 75;
    defaultWeather = "28°C, Humid & Rainy";
  } else if (city.toLowerCase().includes("san francisco")) {
    defaultAqi = 24;
    defaultWeather = "16°C, Cool & Overcast";
  } else if (city.toLowerCase().includes("bengaluru") || city.toLowerCase().includes("bangalore")) {
    defaultAqi = 48;
    defaultWeather = "24°C, Pleasant Breeze";
  }

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      // High-quality mock response
      const mockBriefings: Record<string, string> = {
        "Jaipur": `Greetings, Jaipur sentinel! The community pulse in ${locality} remains steady. Local weather is warm and sunny at 32°C with a healthy air quality of 54 AQI. We detected ${activeCount} active civic reports in your close vicinity, with ${mostCommon !== "None" ? mostCommon : "road surface maintenance"} being the most prominent concern. Municipal response crews have resolved ${resolvedCount} issues recently. Enjoy a pleasant evening, but please stay vigilant of open repair works on critical road corridors.`,
        "Mumbai": `Hello, Mumbai sentinel! The air in ${locality} is humid with a moderate 75 AQI. Due to high precipitation, minor water accumulation has been flagged. There are ${activeCount} active reports nearby, mainly related to road potholes. On a positive note, ${resolvedCount} sanitation complaints have been successfully resolved today. Consider using western bypass roads to avoid current transit delays.`,
        "New Delhi": `Good day, Delhi sentinel! Air quality in your sector is currently Poor (AQI 168), so limit intense outdoor exertion this afternoon. Our database tracks ${activeCount} active reports in your neighborhood—most commonly street illumination issues. Public works teams are on active dispatch and have cleared ${resolvedCount} reports today. We recommend carrying a protective mask if commuting.`,
        "Bengaluru": `Greetings, Bengaluru sentinel! The weather in ${locality} is a pleasant 24°C with fresh air (AQI 48). Your neighborhood health index is high. We have ${activeCount} active reports pending—primarily sanitation and litter. Thanks to civic sentinels, ${resolvedCount} issues have been successfully cleared today. Have a beautiful walk around the community parks!`,
        "San Francisco": `Good morning, SF sentinel! The climate is crisp at 16°C with superb air quality (AQI 24). There is currently only ${activeCount} unresolved report in your sector. Local maintenance teams have successfully wrapped up ${resolvedCount} projects. Travel freely and enjoy the beautiful ocean breeze!`
      };

      const customBriefing = mockBriefings[city] || `Hello, sentinel! The community pulse in ${locality}, ${city} is active. Local weather is comfortable at 28°C with moderate air quality (AQI 60). Currently, there are ${activeCount} active reports in your neighborhood. Sentinels have helped resolve ${resolvedCount} issues today. Most reports involve ${mostCommon !== "None" ? mostCommon : "general civic infrastructure"}. Drive safely and keep up the great neighborhood vigilance!`;

      return res.json({
        success: true,
        briefingText: customBriefing,
        communityHealthScore: communityHealthScore,
        aqi: defaultAqi,
        weather: defaultWeather,
        mostCommonIssue: mostCommon !== "None" ? mostCommon : "Roads/Potholes",
        newReportsToday: activeCount > 0 ? activeCount : 2,
        resolvedIssuesToday: resolvedCount > 0 ? resolvedCount : 4,
        activeAlerts: [
          `Localized construction or repair active on main sectors in ${locality}.`,
          activeCount > 3 ? "Increased reports of road infrastructure anomalies nearby." : "Minor scheduled maintenance today."
        ],
        recommendations: [
          "Report any newly spotted hazards to earn civic XP and speed up dispatch.",
          "Check the Community Map to see if a nearby issue has already been reported."
        ],
        recentActivity: [
          "A civic sentinel upvoted a pothole fix nearby.",
          "A streetlamp restoration project was successfully finalized by the municipal department."
        ]
      });
    }

    const ai = getAiClient();
    const prompt = `Generate a modern, highly localized, beautiful AI Community Pulse JSON report for the resident of ${locality}, ${city}, ${state}.
Provide data based on their location and the active issues reported in their area.

User's Detected Location:
- Locality/Sector: ${locality}
- City/Municipality: ${city}
- State: ${state}
- Latitude: ${lat}, Longitude: ${lng}

Active Local Civic Issues:
${JSON.stringify(issues || [])}

Calculated Local Context:
- Total nearby reports: ${totalCount}
- Resolved reports: ${resolvedCount}
- Unresolved/Active reports: ${activeCount}
- Prevalent issue category: ${mostCommon}
- Suggested community health score: ${communityHealthScore}
- Default AQI: ${defaultAqi}
- Default Weather: ${defaultWeather}

Instructions:
1. Generate an incredibly personalized and natural-reading 'briefingText' paragraph (3-4 sentences). It should greet the resident warmly, mention their location (${locality}, ${city}), explain weather/AQI conditions, summarize what is happening with local issues and reports, and end with a positive community sentence.
2. Fill in realistic other fields. Ensure 'communityHealthScore' is a number between 10 and 100.
3. Keep AQI, weather, and issues realistic and matching the local context.
4. Return exactly a valid JSON object matching the requested schema. No extra text or markdown wrappers.`;

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: [prompt],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            briefingText: {
              type: Type.STRING,
              description: "A natural-reading, friendly, elegant daily briefing paragraph that includes local landmarks, weather, AQI, and local report statuses."
            },
            communityHealthScore: {
              type: Type.INTEGER,
              description: "Civic health score from 10 to 100 based on active vs resolved issues."
            },
            aqi: {
              type: Type.INTEGER,
              description: "Local AQI value."
            },
            weather: {
              type: Type.STRING,
              description: "Local weather condition with temperature (e.g. 31°C, Warm & Clear)."
            },
            mostCommonIssue: {
              type: Type.STRING,
              description: "The name of the most frequent issue category (e.g. Roads/Potholes)."
            },
            newReportsToday: {
              type: Type.INTEGER,
              description: "Number of active reports today."
            },
            resolvedIssuesToday: {
              type: Type.INTEGER,
              description: "Number of resolved issues today."
            },
            activeAlerts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "1-3 active warnings/alerts for this neighborhood."
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-3 dynamic actionable recommendation tips for the user."
            },
            recentActivity: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-3 entries of recent community activity (sentinel upvotes, verifications, resolves)."
            }
          },
          required: [
            "briefingText",
            "communityHealthScore",
            "aqi",
            "weather",
            "mostCommonIssue",
            "newReportsToday",
            "resolvedIssuesToday",
            "activeAlerts",
            "recommendations",
            "recentActivity"
          ]
        }
      }
    });

    if (response && response.text) {
      try {
        const result = JSON.parse(response.text.trim());
        return res.json({ success: true, ...result });
      } catch (err) {
        console.warn("Error parsing pulse JSON from Gemini, falling back:", err);
      }
    }

    // Secondary fallback
    return res.json({
      success: true,
      briefingText: `Hello, sentinel! The community pulse in ${locality}, ${city} is active. Air quality is ${defaultAqi} AQI and climate is ${defaultWeather}. There are ${activeCount} active reports in your neighborhood. Most reports involve ${mostCommon !== "None" ? mostCommon : "general civic infrastructure"}. Drive safely!`,
      communityHealthScore: communityHealthScore,
      aqi: defaultAqi,
      weather: defaultWeather,
      mostCommonIssue: mostCommon !== "None" ? mostCommon : "Roads/Potholes",
      newReportsToday: activeCount,
      resolvedIssuesToday: resolvedCount,
      activeAlerts: ["Local public works maintenance scheduled."],
      recommendations: ["Report any active hazards to alert local municipal engineers."],
      recentActivity: ["Residents recently upvoted an active report in the sector."]
    });

  } catch (error: any) {
    console.warn("AI Community Pulse endpoint error:", error);
    res.json({
      success: true,
      briefingText: `Hello, sentinel! The community pulse in ${locality}, ${city} is steady. Air quality is ${defaultAqi} AQI. Local weather is ${defaultWeather}. Drive safely and stay vigilant!`,
      communityHealthScore: communityHealthScore,
      aqi: defaultAqi,
      weather: defaultWeather,
      mostCommonIssue: mostCommon !== "None" ? mostCommon : "Roads/Potholes",
      newReportsToday: activeCount,
      resolvedIssuesToday: resolvedCount,
      activeAlerts: ["Local public works maintenance scheduled."],
      recommendations: ["Report any active hazards to alert local municipal engineers."],
      recentActivity: ["Residents recently upvoted an active report in the sector."]
    });
  }
});

// Setup Vite Dev Server / Static Asset Server
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CivicEye AI Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
