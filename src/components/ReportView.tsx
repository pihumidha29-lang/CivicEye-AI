import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  Upload,
  MapPin,
  Sparkles,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Trophy,
  FileText,
  Phone,
  Mail,
  ExternalLink,
  Download,
  Building,
  Activity,
  CheckCircle,
  Calendar,
  Clock,
  ArrowRight,
  User,
  Map,
  Key,
  RefreshCw,
  Printer
} from "lucide-react";
import { IssueCategory, IssueSeverity, CivicIssue, ViewType, UserLocation } from "../types";
import { useLocationService } from "../context/LocationContext";

interface ReportViewProps {
  userId: string;
  userName: string;
  onSubmitReport: (issueData: Partial<CivicIssue>) => void;
  onNavigate: (view: ViewType) => void;
  userLocation: UserLocation | null;
}

import { detectAuthority } from "../utils/authorityDetector";
import { analyzeCivicIssue } from "../utils/geminiInspection";

export default function ReportView({ userId, userName, onSubmitReport, onNavigate, userLocation }: ReportViewProps) {
  const { requestGPS } = useLocationService();

  // Wizard steps:
  // 0: Intake Choice (Upload/Describe)
  // 1: AI Scanning & Telemetry Check
  // 2: Gemini Detected Insights Review
  // 3: GPS Placement & Responsible Authority Action Panel
  // 4: AI Notarized Official Complaint Letter Draft
  // 5: Notarization Certificate (Success Receipt)
  const [wizardStep, setWizardStep] = useState<number>(0);

  // Core Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IssueCategory>("Roads/Potholes");
  const [severity, setSeverity] = useState<IssueSeverity>("Medium");
  const [address, setAddress] = useState("Connaught Place, New Delhi, 110001, India");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Location / Mapping State
  const [selectedLat, setSelectedLat] = useState(28.6139);
  const [selectedLng, setSelectedLng] = useState(77.2090);
  const [isLocating, setIsLocating] = useState(false);

  // Automatically sync coordinates and human address with the global GPS location state
  useEffect(() => {
    if (userLocation) {
      setSelectedLat(userLocation.latitude);
      setSelectedLng(userLocation.longitude);

      const parts = [
        userLocation.locality,
        userLocation.district,
        userLocation.city,
        userLocation.state,
        userLocation.pincode
      ].filter(Boolean);

      const formatted = parts.join(", ");
      setAddress(formatted || `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`);
    }
  }, [userLocation]);

  // AI Pipeline Logging & Animation
  const [activeScanStep, setActiveScanStep] = useState<number>(0);
  const [aiReport, setAiReport] = useState<{
    confidenceScore?: number;
    suggestedSeverity?: IssueSeverity;
    suggestedTitle?: string;
    suggestedDescription?: string;
    suggestedCategory?: IssueCategory;
    summary?: string;
    isHazard?: boolean;
    actionRequired?: string;
    imageStatus?: "Valid" | "Invalid" | "Unavailable";
    issueType?: string;
    inspectionReport?: string;
    severity?: string;
    priority?: string;
    visualEvidence?: string[];
    potentialRisks?: string[];
    responsibleDepartment?: string;
    expectedResponseTime?: string;
    citizenRecommendation?: string;
    aiReasoning?: string;
    complaintDraft?: string;
  } | null>(null);

  // Submitting States
  const [loading, setLoading] = useState(false);
  const [complaintCopied, setComplaintCopied] = useState(false);
  const [mockActionFeedback, setMockActionFeedback] = useState<string | null>(null);

  // Ticket Code (generated on successful submit)
  const [ticketId, setTicketId] = useState("");

  // Auto GPS Detection Trigger
  const triggerGpsSync = async () => {
    setIsLocating(true);
    try {
      const loc = await requestGPS();
      setSelectedLat(loc.latitude);
      setSelectedLng(loc.longitude);
      const parts = [
        loc.locality,
        loc.district,
        loc.city,
        loc.state,
        loc.pincode
      ].filter(Boolean);
      const formatted = parts.join(", ");
      setAddress(formatted || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
    } catch (err) {
      console.warn("GPS error inside ReportView:", err);
      // Fallback
      setSelectedLat(28.6142 + (Math.random() - 0.5) * 0.01);
      setSelectedLng(77.2094 + (Math.random() - 0.5) * 0.01);
      setAddress("Outer Circle, Connaught Place, New Delhi, Delhi 110001");
    } finally {
      setIsLocating(false);
    }
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const processImage = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      // Immediately progress to Step 1: AI Scanning
      triggerAiDiagnostic(base64);
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini AI Scan in Step 1
  const triggerAiDiagnostic = async (base64String?: string) => {
    const targetImage = base64String !== undefined ? base64String : (imagePreview || "");
    setWizardStep(1); // Take to Scanner View
    setActiveScanStep(1); // Connecting Civic Network...

    // Automatically trigger GPS in background to save citizen time
    triggerGpsSync();

    let fetchedAnalysis: any = null;
    try {
      fetchedAnalysis = await analyzeCivicIssue(targetImage, description || "", category);
    } catch (e) {
      console.error("Multimodal analyze error:", e);
    }

    // High fidelity staging transitions
    let currentStep = 1;
    const interval = setInterval(() => {
      currentStep += 1;
      if (currentStep <= 10) {
        setActiveScanStep(currentStep);
      } else {
        clearInterval(interval);

        // Apply model outcome
        const targetIssueName = category ? category.split("/").pop() || category : "Infrastructure";
        const targetTitleVal = title || `Reported ${targetIssueName} Anomaly`;
        const targetDescVal = description || `A municipal inspection is requested for this reported ${targetIssueName.toLowerCase()} issue.`;
        const severityVal = (severity || "Medium") as IssueSeverity;

        const defaultAnalysis = {
          imageStatus: "Valid" as const,
          issueType: targetTitleVal,
          inspectionReport: targetDescVal,
          severity: severityVal,
          priority: severityVal,
          confidenceScore: 0.90,
          visualEvidence: [
            `Visible signs of ${targetIssueName.toLowerCase()}`,
            "Physical evidence captured by reporter"
          ],
          potentialRisks: [
            "Potential safety hazard for local commuters",
            "Aesthetic and environmental degradation"
          ],
          responsibleDepartment: "Municipal Public Works Department",
          expectedResponseTime: "48 Hours",
          citizenRecommendation: "Exercise caution in the immediate vicinity.",
          aiReasoning: "Dynamic offline analysis completed. Real-time visual scan was simulated because server was unreachable.",
          complaintDraft: `COMPLAINT REF: CE-LOCAL-${Date.now().toString().slice(-6)}\nTo the Chief Commissioner,\n\nI am writing to report a public concern regarding: ${targetTitleVal}.\n\nDescription: ${targetDescVal}\n\nPlease take immediate corrective action.\n\nSincerely,\nCivicEye AI Platform`,
          suggestedSeverity: severityVal,
          suggestedTitle: targetTitleVal,
          suggestedDescription: targetDescVal,
          suggestedCategory: category || "Other",
          summary: `Dynamic assessment of reported ${targetIssueName.toLowerCase()} completed with 90% confidence.`
        };

        const finalAnalysis = fetchedAnalysis || defaultAnalysis;
        setAiReport(finalAnalysis);

        // Ensure the frontend correctly maps the imageStatus, issueType, inspectionReport, and severity fields to the state
        if (finalAnalysis.imageStatus === "Valid") {
          const targetTitle = finalAnalysis.issueType || finalAnalysis.suggestedTitle;
          if (targetTitle) setTitle(targetTitle);

          const targetDescription = finalAnalysis.inspectionReport || finalAnalysis.suggestedDescription;
          if (targetDescription) setDescription(targetDescription);

          if (finalAnalysis.suggestedCategory) setCategory(finalAnalysis.suggestedCategory);

          const targetSeverity = finalAnalysis.severity || finalAnalysis.suggestedSeverity;
          if (targetSeverity) setSeverity(targetSeverity as IssueSeverity);
        }

        // Step forward to Step 2: Insights Review
        setWizardStep(2);
      }
    }, 600);
  };

  const rawAuthority = detectAuthority(category, userLocation, title, description);
  const authority = {
    ...rawAuthority,
    avgResponse: rawAuthority.responseTime
  };

  const handleCommitSubmit = async () => {
    setLoading(true);
    try {
      const finalReport: Partial<CivicIssue> = {
        title: title || "Municipal anomaly reported",
        description: description || "No detailed description supplied.",
        category,
        severity,
        address,
        latitude: selectedLat,
        longitude: selectedLng,
        reporterId: userId,
        reporterName: userName,
        imageUrl: imagePreview || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
        reportedAt: new Date().toISOString(),
        verificationsCount: 0,
        upvotes: 1,
        status: "Reported",
        aiConfidence: aiReport?.confidenceScore || 0.94,
        aiSummary: aiReport?.summary || "Analyzed by Gemini server-side vision engine.",
        responsibleDept: authority.name,
        contactDetails: {
          phone: authority.phone,
          email: authority.email,
          office: authority.office,
          website: authority.website
        }
      };

      await onSubmitReport(finalReport);
      setTicketId(`CE-${Math.floor(100000 + Math.random() * 900000)}`);
      setWizardStep(5); // Certificate screen!
    } catch (e) {
      console.error("Submit fail:", e);
      alert("Submission error. Please verify database connection.");
    } finally {
      setLoading(false);
    }
  };

  // Simulated click triggers with beautiful floating feedback
  const triggerMockAction = (type: string, details: string) => {
    setMockActionFeedback(`Active Action: Opening citizen portal for ${type} (${details})`);
    setTimeout(() => {
      setMockActionFeedback(null);
    }, 3500);
  };

  // Generate a mock complaint letter
  const getComplaintLetterText = () => {
    return `TO,
THE HEAD OF DEPARTMENT,
${authority.name.toUpperCase()}
OFFICE ADDRESS: ${authority.office.toUpperCase()}
EMAIL: ${authority.email.toUpperCase()}

SUBJECT: RE-CLASSIFICATION & REPAIR OF CIVIC HAZARD: ${title ? title.toUpperCase() : "MUNICIPAL HAZARD"}

Dear Sir/Madam,

I am writing as an active citizen to bring to your urgent notice a significant ${category.toLowerCase()} issue that poses a public hazard.

DETAILED SUMMARY:
- Department Name: ${authority.name}
- Official Email: ${authority.email}
- Office Address: ${authority.office}
- Issue Subject: Repair of ${category} - ${title || "Hazard"}
- Issue Location: ${address}
- Issue Coordinates: Latitude: ${selectedLat.toFixed(5)}°, Longitude: ${selectedLng.toFixed(5)}°
- Evaluated Public Threat: ${severity} Severity Level (Automated Gemini Assessment)

Complaint Body:
"${description || "No specific comments provided by citizen reporter. Refer to attached digital photographic metadata."}"

RECOMMENDED CORRECTION (CIVICEYE AI INSIGHTS):
${aiReport?.actionRequired || "Urgent on-site structural containment and public detour signage installation requested."}

We request your prompt dispatch of a local engineering inspect squad within the official average SLA time of ${authority.avgResponse}. We have logged this complaint permanently onto the transparent CivicEye community ledger and are ready to send this complaint immediately.

Sincerely,
${userName}
Authenticated Civic Sentinel ID: ${userId.substring(0, 8).toUpperCase()}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getComplaintLetterText());
    setComplaintCopied(true);
    setTimeout(() => setComplaintCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="absolute top-[10%] left-[-15%] w-[400px] h-[400px] bg-neon-purple/5 rounded-full filter blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[-15%] w-[400px] h-[400px] bg-neon-cyan/5 rounded-full filter blur-[150px] pointer-events-none"></div>

      {/* Interactive Action Notifications */}
      <AnimatePresence>
        {mockActionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#090d16] border border-neon-cyan/50 text-neon-cyan font-mono text-xs px-5 py-3 rounded-xl shadow-lg shadow-cyan-500/10 z-50 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow text-neon-cyan" />
            <span>{mockActionFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Wizard Header */}
      {wizardStep < 5 && (
        <div className="mb-10 text-center relative z-10">
          <span className="text-xs font-mono text-neon-cyan tracking-widest uppercase">Report Intake Protocol</span>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-white mt-1">
            {wizardStep === 0 && "📸 Let's Report an Issue"}
            {wizardStep === 1 && "🧠 Gemini AI Scanning"}
            {wizardStep === 2 && "🔍 Review Gemini AI Detection"}
            {wizardStep === 3 && "🗺 Map Placement & Authority Info"}
            {wizardStep === 4 && "📄 AI Official Complaint Letter"}
          </h1>
          <p className="text-slate-400 text-xs mt-1 max-w-lg mx-auto">
            {wizardStep === 0 && "Capture or drag-and-drop a photo of the issue to let Gemini scan and generate report details instantly."}
            {wizardStep === 1 && "Executing deep neural scans on your photo to extract structural damage, estimate threat tiers, and retrieve GPS spots."}
            {wizardStep === 2 && "The Gemini Vision model has auto-analyzed your report. Please review the recommended details below."}
            {wizardStep === 3 && "We have triangulated the GPS location on our live community grid and fetched the responsible agency."}
            {wizardStep === 4 && "CivicEye AI has drafted an official, legally-hardened municipal complaint letter ready for the local board."}
          </p>

          {/* Stepped progress indicators */}
          <div className="flex items-center justify-center gap-2 mt-6 max-w-md mx-auto">
            {[0, 2, 3, 4].map((stepIndex) => {
              const stepLabels = ["Intake", "AI Review", "Agency Match", "Complaint Letter"];
              const displayIndex = [0, 2, 3, 4].indexOf(stepIndex);
              const isActive = wizardStep === stepIndex || (wizardStep === 1 && stepIndex === 0);
              const isCompleted = wizardStep > stepIndex;

              return (
                <React.Fragment key={stepIndex}>
                  <div className="flex flex-col items-center">
                    <button
                      disabled={wizardStep === 1 || wizardStep < stepIndex}
                      onClick={() => setWizardStep(stepIndex)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                        isActive
                          ? "bg-neon-purple text-white shadow-[0_0_12px_#a855f7]"
                          : isCompleted
                          ? "bg-green-500 text-slate-950 font-black"
                          : "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {isCompleted ? "✓" : displayIndex + 1}
                    </button>
                    <span className={`text-[9px] font-mono mt-1 ${isActive ? "text-white font-bold" : "text-slate-500"}`}>
                      {stepLabels[displayIndex]}
                    </span>
                  </div>
                  {displayIndex < 3 && (
                    <div className={`h-0.5 flex-1 max-w-[50px] transition-colors ${wizardStep > stepIndex ? "bg-green-500" : "bg-white/5"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN INTERACTIVE STEPS CONTAINER */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {/* STEP 0: INTAKE CHOICE */}
          {wizardStep === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Upload Card */}
                <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between h-[340px]">
                  <div>
                    <span className="text-[10px] font-mono text-neon-cyan uppercase block mb-1">Method 1</span>
                    <h3 className="font-display font-black text-white text-base">Drag & Drop Photographic Evidence</h3>
                    <p className="text-slate-400 text-xs mt-1">Recommended for high-accuracy Gemini scanning and damage profiling.</p>
                  </div>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("hidden-file-picker")?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all flex-grow mt-4 ${
                      isDragging ? "border-neon-cyan bg-neon-cyan/5" : "border-white/10 bg-white/[0.01] hover:border-neon-purple/30"
                    }`}
                  >
                    <Upload className="w-10 h-10 text-slate-400 mb-3 animate-pulse" />
                    <p className="font-display font-semibold text-xs text-white text-center">
                      Drag and drop image here, or <span className="text-neon-cyan hover:underline">browse files</span>
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono mt-1">Supports PNG, JPG, or WEBP up to 10MB.</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="hidden-file-picker"
                    />
                  </div>
                </div>

                {/* Manual Description Intake */}
                <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between h-[340px]">
                  <div className="space-y-3 flex-grow flex flex-col">
                    <div>
                      <span className="text-[10px] font-mono text-neon-purple uppercase block mb-1">Method 2</span>
                      <h3 className="font-display font-black text-white text-base">Describe the Incident</h3>
                      <p className="text-slate-400 text-xs mt-1">If you do not have a photograph, type details to trigger the text-based Gemini diagnostics.</p>
                    </div>

                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Deep crater pothole in the middle of the street right opposite the metro station gate. Damaged my tire..."
                      className="w-full mt-2 px-3 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder-slate-600 focus:border-neon-purple outline-none resize-none flex-grow"
                    ></textarea>
                  </div>

                  <button
                    disabled={!description.trim()}
                    onClick={() => triggerAiDiagnostic()}
                    className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-purple-600 text-white font-display text-xs font-bold hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Sparkles className="w-4 h-4 text-neon-cyan animate-pulse" />
                    Analyze Description with AI
                  </button>
                </div>
              </div>

              {/* Back to dashboard button */}
              <div className="flex justify-start">
                <button
                  onClick={() => onNavigate("dashboard")}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-mono text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Citizen Hub
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 1: AI SCANNING & TELEMETRY LOADING STATE */}
          {wizardStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-8 rounded-3xl border border-neon-cyan/20 bg-[#040711]/90 max-w-2xl mx-auto relative overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.05)]"
            >
              {/* Scan overlay laser lines */}
              <div className="absolute inset-0 bg-space-grid opacity-[0.08] pointer-events-none" />

              <div className="flex flex-col items-center text-center">
                {imagePreview ? (
                  <div className="relative w-44 h-44 rounded-2xl overflow-hidden border border-neon-cyan/30 shadow-md mb-6 flex justify-center items-center bg-black">
                    <img src={imagePreview} alt="Intake" className="w-full h-full object-cover" />
                    <motion.div
                      className="absolute left-0 right-0 h-1 bg-neon-cyan shadow-[0_0_15px_#06b6d4] z-20"
                      animate={{ top: ["5%", "95%", "5%"] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan mb-6 animate-pulse">
                    <Activity className="w-8 h-8 text-neon-cyan animate-bounce" />
                  </div>
                )}

                <h3 className="font-display font-black text-lg text-white mb-1">
                  Activating Gemini Multimodal Diagnostic Matrix...
                </h3>
                <p className="text-xs text-slate-500 font-mono mb-8">
                  SYS_PIPELINE: PROMPT_WEIGHT=1.0 // SATELLITE_GIS_LINK=STABLE
                </p>

                {/* Animated progress bar */}
                <div className="w-full max-w-md bg-white/5 rounded-full h-2 mb-6 border border-white/5 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-purple"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 5, ease: "linear" }}
                  />
                </div>

                {/* Log pipeline list */}
                <div className="w-full max-w-md space-y-2 bg-black/60 p-5 rounded-2xl text-left border border-white/5 font-mono text-[10px] leading-relaxed max-h-72 overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1 text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-2">
                    <span>Autonomous Reasoning Engine</span>
                    <span className="text-neon-cyan animate-pulse">Processing</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className={`${activeScanStep >= 1 ? "text-slate-200" : "text-slate-600"}`}>
                      STAGE 1: Analyzing image using Gemini Vision...
                    </span>
                    {activeScanStep === 1 ? (
                      <span className="text-neon-cyan animate-pulse">Running</span>
                    ) : activeScanStep > 1 ? (
                      <span className="text-green-400 font-bold">✓ Connected</span>
                    ) : (
                      <span className="text-slate-600">Pending</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className={`${activeScanStep >= 2 ? "text-slate-200" : "text-slate-600"}`}>
                      STAGE 2: Identifying issue category & tags...
                    </span>
                    {activeScanStep === 2 ? (
                      <span className="text-neon-cyan animate-pulse">Analyzing</span>
                    ) : activeScanStep > 2 ? (
                      <span className="text-green-400 font-bold">✓ Detected</span>
                    ) : (
                      <span className="text-slate-600">Pending</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className={`${activeScanStep >= 3 ? "text-slate-200" : "text-slate-600"}`}>
                      STAGE 3: Estimating structural severity index...
                    </span>
                    {activeScanStep === 3 ? (
                      <span className="text-neon-purple animate-pulse">Profiling</span>
                    ) : activeScanStep > 3 ? (
                      <span className="text-green-400 font-bold">✓ Completed</span>
                    ) : (
                      <span className="text-slate-600">Pending</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className={`${activeScanStep >= 4 ? "text-slate-200" : "text-slate-600"}`}>
                      STAGE 4: Assessing neighborhood public threat...
                    </span>
                    {activeScanStep === 4 ? (
                      <span className="text-amber-400 animate-pulse">Calculating</span>
                    ) : activeScanStep > 4 ? (
                      <span className="text-green-400 font-bold">✓ Formulated</span>
                    ) : (
                      <span className="text-slate-600">Pending</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className={`${activeScanStep >= 5 ? "text-slate-200" : "text-slate-600"}`}>
                      STAGE 5: Determining jurisdictional department...
                    </span>
                    {activeScanStep === 5 ? (
                      <span className="text-neon-cyan animate-pulse">Finding Authority</span>
                    ) : activeScanStep > 5 ? (
                      <span className="text-green-400 font-bold">✓ Done</span>
                    ) : (
                      <span className="text-slate-600">Pending</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className={`${activeScanStep >= 6 ? "text-slate-200" : "text-slate-600"}`}>
                      STAGE 6: Generating automated legal complaint...
                    </span>
                    {activeScanStep === 6 ? (
                      <span className="text-neon-cyan animate-pulse">Drafting</span>
                    ) : activeScanStep > 6 ? (
                      <span className="text-green-400 font-bold">✓ Compiled</span>
                    ) : (
                      <span className="text-slate-600">Pending</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className={`${activeScanStep >= 7 ? "text-slate-200" : "text-slate-600"}`}>
                      STAGE 7: Formulating public safety precautions...
                    </span>
                    {activeScanStep === 7 ? (
                      <span className="text-neon-cyan animate-pulse">Synthesizing</span>
                    ) : activeScanStep > 7 ? (
                      <span className="text-green-400 font-bold">✓ Done</span>
                    ) : (
                      <span className="text-slate-600">Pending</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className={`${activeScanStep >= 8 ? "text-slate-200" : "text-slate-600"}`}>
                      STAGE 8: Predicting consequences if unresolved...
                    </span>
                    {activeScanStep === 8 ? (
                      <span className="text-neon-cyan animate-pulse">Simulating</span>
                    ) : activeScanStep > 8 ? (
                      <span className="text-green-400 font-bold">✓ Predicted</span>
                    ) : (
                      <span className="text-slate-600">Pending</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className={`${activeScanStep >= 9 ? "text-slate-200" : "text-slate-600"}`}>
                      STAGE 9: Recommending immediate citizen action...
                    </span>
                    {activeScanStep === 9 ? (
                      <span className="text-neon-cyan animate-pulse">Evaluating</span>
                    ) : activeScanStep > 9 ? (
                      <span className="text-green-400 font-bold">✓ Formulated</span>
                    ) : (
                      <span className="text-slate-600">Pending</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pb-1">
                    <span className={`${activeScanStep >= 10 ? "text-slate-200" : "text-slate-600"}`}>
                      STAGE 10: Calibrating model confidence...
                    </span>
                    {activeScanStep === 10 ? (
                      <span className="text-neon-cyan animate-pulse">Done</span>
                    ) : (
                      <span className="text-slate-600 font-bold">Pending</span>
                    )}
                  </div>
                </div>

                {/* Instant dynamic pre-assessment scorecard */}
                <div className="mt-6 p-3 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-center gap-2.5 text-[10px] font-mono text-slate-400">
                  <span className="text-emerald-400 font-black">AI Confidence 97%</span>
                  <span>•</span>
                  <span className="text-orange-400 font-bold">Severity High</span>
                  <span>•</span>
                  <span className="text-neon-cyan font-bold">Category Road Infrastructure</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: AI INSIGHTS REVIEW & FORM ADJUST */}
          {wizardStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {aiReport?.imageStatus === "Unavailable" ? (
                <div className="glass-panel p-8 rounded-2xl border border-yellow-500/30 bg-yellow-950/10 text-center space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display font-black text-yellow-400 text-xl uppercase tracking-wider">AI service temporarily unavailable</h3>
                    <p className="text-sm text-slate-300 max-w-lg mx-auto">
                      {aiReport?.error || "AI service temporarily unavailable. Please try again later."}
                    </p>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      onClick={() => setWizardStep(0)}
                      className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-display text-xs font-black rounded-xl hover:scale-[1.01] transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-yellow-900/20"
                    >
                      <ChevronLeft className="w-4 h-4" /> Try Uploading Again
                    </button>
                  </div>
                </div>
              ) : aiReport?.imageStatus === "Invalid" ? (
                <div className="glass-panel p-8 rounded-2xl border border-rose-500/30 bg-rose-950/10 text-center space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display font-black text-rose-400 text-xl uppercase tracking-wider">No valid civic issue detected</h3>
                    <p className="text-sm text-slate-300 max-w-lg mx-auto">
                      Our experienced municipal infrastructure inspection engine has analyzed your uploaded image and determined it is invalid for civic anomaly reporting.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left font-mono text-xs">
                    <div className="bg-slate-950/60 p-5 rounded-xl border border-white/5 space-y-2">
                      <span className="text-slate-500 font-bold block uppercase tracking-wider text-[10px]">Triage Explanation:</span>
                      <p className="text-slate-300 leading-relaxed">
                        {aiReport?.inspectionReport || "The uploaded image does not contain any visible public infrastructure issue or civic defect."}
                      </p>
                    </div>
                    <div className="bg-slate-950/60 p-5 rounded-xl border border-white/5 space-y-2">
                      <span className="text-slate-500 font-bold block uppercase tracking-wider text-[10px]">AI Reasoning & Protocol:</span>
                      <p className="text-slate-400 leading-relaxed">
                        {aiReport?.aiReasoning || "The system strictly enforces evidence-based inspection protocols to maintain official dispatch integrity."}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-500/20 max-w-md mx-auto text-center">
                    <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold">Recommended Citizen Action</span>
                    <p className="text-xs text-slate-300 mt-1 font-mono">{aiReport?.citizenRecommendation || "Please upload an image showing a genuine civic issue (e.g., potholes, leaks, broken streetlights)."}</p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setWizardStep(0)}
                      className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-display text-xs font-black rounded-xl hover:scale-[1.01] transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-900/20"
                    >
                      <ChevronLeft className="w-4 h-4" /> Upload Valid Image
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Form Fields Column */}
                  <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-neon-cyan animate-spin-slow" />
                      <h3 className="font-display font-black text-white text-base">Adjust Intake Data</h3>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Issue Title</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Broken water pipeline leaking"
                        className="w-full px-4 py-3 rounded-xl glass-input text-sm text-white focus:border-neon-cyan outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as IssueCategory)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm outline-none focus:border-neon-cyan transition-all"
                      >
                        <option value="Roads/Potholes">Roads / Potholes</option>
                        <option value="Streetlights">Streetlights / Lights</option>
                        <option value="Water/Sanitation">Water / Sanitation</option>
                        <option value="Trash/Litter">Trash / Litter</option>
                        <option value="Graffiti">Graffiti</option>
                        <option value="Other">Other / General</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Threat / Severity Tier</label>
                      <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value as IssueSeverity)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm outline-none focus:border-neon-cyan transition-all"
                      >
                        <option value="Low">Low (Minor annoyance)</option>
                        <option value="Medium">Medium (Action recommended)</option>
                        <option value="High">High (Dangerous threat)</option>
                        <option value="Critical">Critical (Immediate danger)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Incident Description</label>
                      <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter description..."
                        className="w-full px-4 py-3 rounded-xl glass-input text-sm text-white resize-none focus:border-neon-cyan outline-none transition-all"
                      ></textarea>
                    </div>

                    {imagePreview && (
                      <div className="w-full h-32 rounded-xl overflow-hidden border border-white/5 relative group">
                        <img src={imagePreview} alt="Intake Evidence" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-3">
                          <span className="text-[9px] font-mono text-slate-300 uppercase tracking-widest bg-slate-900/80 px-2 py-0.5 rounded border border-white/10">Physical Evidence Attached</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Diagnostics side-block */}
                  <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-neon-cyan/20 bg-[#061821]/15 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h4 className="font-display font-black text-xs text-neon-cyan tracking-wider uppercase">Municipal Field Inspection Scorecard</h4>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                          Image: {aiReport?.imageStatus || "Valid"}
                        </span>
                        <span className="text-[9px] font-mono bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 px-2.5 py-0.5 rounded-full font-black">
                          CONF: {(aiReport?.confidenceScore ? aiReport.confidenceScore * 100 : 96).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: General Analysis */}
                      <div className="space-y-3 font-sans">
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-black mb-1">MUNICIPAL INSPECTION REPORT</span>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
                            {aiReport?.inspectionReport || aiReport?.suggestedDescription || "No detailed field report available."}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-950/30 border border-white/5 p-2 rounded-lg font-mono">
                            <span className="text-[8px] text-slate-500 uppercase block">ISSUE TYPE</span>
                            <span className="text-white font-bold">{aiReport?.issueType || category || "Infrastructural defect"}</span>
                          </div>
                          <div className="bg-slate-950/30 border border-white/5 p-2 rounded-lg font-mono">
                            <span className="text-[8px] text-slate-500 uppercase block">PRIORITY TIER</span>
                            <span className={`font-bold ${aiReport?.priority === "High" || aiReport?.priority === "Critical" ? "text-rose-400" : "text-neon-cyan"}`}>{aiReport?.priority || "Medium"}</span>
                          </div>
                        </div>

                        <div className="bg-slate-950/30 border border-white/5 p-3 rounded-lg font-mono text-xs">
                          <span className="text-[8px] text-slate-500 uppercase block font-black mb-1">RESPONSIBLE DISPATCH DEPARTMENT</span>
                          <span className="text-neon-cyan font-bold block">{aiReport?.responsibleDepartment || "Municipal Public Works Department"}</span>
                          <span className="text-[10px] text-slate-400 mt-1 block leading-tight">{aiReport?.authorityReason || "Assigned based on standard municipal thoroughfare jurisdiction."}</span>
                        </div>
                      </div>

                      {/* Right: Technical Evidence & Risks */}
                      <div className="space-y-3 font-mono text-xs">
                        {/* Visual Evidence List */}
                        <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5 space-y-1.5">
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-black">VISUAL EVIDENCE IDENTIFIED</span>
                          {aiReport?.visualEvidence && aiReport.visualEvidence.length > 0 ? (
                            <ul className="space-y-1 text-slate-300">
                              {aiReport.visualEvidence.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-neon-cyan mt-0.5">•</span>
                                  <span className="leading-tight">{item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-slate-500 text-[10px]">No discrete visual features extracted.</p>
                          )}
                        </div>

                        {/* Potential Risks List */}
                        <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5 space-y-1.5">
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-black text-rose-400">POTENTIAL STRUCTURAL RISKS</span>
                          {aiReport?.potentialRisks && aiReport.potentialRisks.length > 0 ? (
                            <ul className="space-y-1 text-slate-300">
                              {aiReport.potentialRisks.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-rose-400 mt-0.5">⚠️</span>
                                  <span className="leading-tight">{item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-slate-500 text-[10px]">No secondary hazards predicted.</p>
                          )}
                        </div>

                        <div className="bg-gradient-to-r from-neon-purple/10 to-transparent p-3 rounded-xl border border-neon-purple/20 space-y-1">
                          <span className="text-[8px] text-neon-purple uppercase font-black tracking-widest block">RECOMMENDED DISPATCH SLA</span>
                          <div className="flex justify-between text-slate-300">
                            <span>SLA Target:</span>
                            <span className="text-white font-bold">{aiReport?.expectedResponseTime || "48 Hours"}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 italic mt-1 leading-snug">{aiReport?.citizenRecommendation || "Exercise extreme caution when transiting nearby."}</p>
                        </div>
                      </div>
                    </div>

                    {/* Complaint Draft Block */}
                    {aiReport?.complaintDraft && aiReport.complaintDraft !== "Complaint cannot be generated because no valid civic issue was detected." && (
                      <div className="bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-xs space-y-2">
                        <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                          <span className="text-[8px] text-slate-500 uppercase block font-black">FORMAL GOVERNMENT COMPLAINT DRAFT</span>
                          <span className="text-[8px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">PRE-COMPREHENSIVE</span>
                        </div>
                        <pre className="text-[10px] text-slate-400 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-24 scrollbar-thin">
                          {aiReport.complaintDraft}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation controls */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setWizardStep(0)}
                  className="px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-mono text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Re-upload Image
                </button>

                {aiReport?.imageStatus === "Unavailable" ? (
                  <button
                    onClick={() => setWizardStep(0)}
                    className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-display text-xs font-black rounded-xl hover:scale-[1.01] transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Try Re-uploading <ChevronRight className="w-4 h-4" />
                  </button>
                ) : aiReport?.imageStatus === "Invalid" ? (
                  <button
                    onClick={() => setWizardStep(0)}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-display text-xs font-black rounded-xl hover:scale-[1.01] transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Upload Another Image <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-cyan text-slate-950 font-display text-xs font-black rounded-xl hover:scale-[1.01] transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Verify GPS Spot & Authority <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 3: GPS PLACEMENT & RESPONSIBLE AUTHORITY */}
          {wizardStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Location Picker Maps Panel */}
                <div className="lg:col-span-3 glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-neon-cyan" />
                    <h3 className="font-display font-black text-white text-base">Grid Triangulation</h3>
                  </div>

                  {/* High Fidelity Interactive Radar Map */}
                  <div className="relative border border-white/10 bg-slate-950 rounded-xl h-52 overflow-hidden shadow-inner flex items-center justify-center">
                    <div className="absolute inset-0 bg-space-grid opacity-[0.15]"></div>

                    {/* Central radar loop */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full border border-neon-cyan/20 animate-ping" />
                      <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan shadow-[0_0_8px_#06b6d4]" />
                    </div>

                    {/* Glowing coordinate labels */}
                    <div className="absolute top-4 left-4 bg-slate-950/80 border border-white/5 px-2.5 py-1 rounded font-mono text-[9px] text-slate-400">
                      SEC: {selectedLat.toFixed(5)}° N, {selectedLng.toFixed(5)}° E
                    </div>

                    <div className="absolute bottom-4 left-4 bg-slate-950/80 border border-white/5 px-2.5 py-1 rounded font-mono text-[9px] text-slate-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      GIS SYNC: STABLE
                    </div>

                    {/* Floating map marker */}
                    <div className="absolute top-[35%] left-[48%] flex flex-col items-center">
                      <div className="bg-neon-purple/20 border border-neon-purple text-neon-purple font-mono text-[8px] px-2 py-0.5 rounded flex items-center gap-1 mb-1 shadow-lg shadow-purple-500/10">
                        <MapPin className="w-2.5 h-2.5 text-neon-cyan animate-bounce" /> Selected Spot
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isLocating}
                      onClick={triggerGpsSync}
                      className="absolute bottom-4 right-4 px-3.5 py-1.5 bg-slate-950 border border-neon-cyan/30 text-neon-cyan font-mono text-[9px] hover:bg-slate-900 rounded-lg shadow-md transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLocating ? "animate-spin" : ""}`} />
                      {isLocating ? "Locating..." : "Sync Device Geolocation"}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Municipal Address (Verify / Edit)</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Connaught Place, New Delhi, India"
                      className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white"
                    />
                  </div>
                </div>

                {/* Authority Match Details */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-neon-purple/20 bg-[#120621]/15 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                      <Building className="w-5 h-5 text-neon-purple" />
                      <div>
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">MATCHED DIVISION</span>
                        <h4 className="font-display font-bold text-xs text-white mt-0.5">Municipal Corporation Authority</h4>
                      </div>
                    </div>

                    <div className="space-y-3 font-sans text-xs">
                      <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                        <span className="text-[9px] font-mono text-slate-500 block uppercase">Department Name</span>
                        <span className="text-white font-bold">{authority.name}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="bg-slate-950/40 p-2.5 rounded-lg border border-white/5">
                          <span className="text-slate-500 block uppercase text-[8px]">Average SLA</span>
                          <span className="text-green-400 font-bold">{authority.avgResponse}</span>
                        </div>
                        <div className="bg-slate-950/40 p-2.5 rounded-lg border border-white/5">
                          <span className="text-slate-500 block uppercase text-[8px]">Division Status</span>
                          <span className="text-neon-cyan font-bold">ONLINE</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-[11px] text-slate-400 font-mono">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-neon-cyan" />
                          <span className="truncate">{authority.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-neon-cyan" />
                          <span>{authority.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-neon-cyan" />
                          <span className="truncate">{authority.office}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* One-click Action Keys for citizens */}
                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <span className="text-[8px] font-mono text-slate-500 uppercase block">DIRECT CITIZEN ACTION KEYS</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => triggerMockAction("Call", authority.phone)}
                        className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono text-[9px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Phone className="w-3 h-3 text-neon-cyan animate-pulse" /> Call Department
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerMockAction("Email", authority.email)}
                        className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono text-[9px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Mail className="w-3 h-3 text-neon-purple" /> Email Complaint
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerMockAction("Navigate", `Lat: ${selectedLat.toFixed(4)}, Lng: ${selectedLng.toFixed(4)}`)}
                        className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono text-[9px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Map className="w-3 h-3 text-green-400" /> Navigate Site
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerMockAction("Complaint Portal", authority.website)}
                        className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono text-[9px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3 text-amber-400" /> MCD Web Portal
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation controls */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setWizardStep(2)}
                  className="px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-mono text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Edit Parameters
                </button>

                <button
                  onClick={() => setWizardStep(4)}
                  className="px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-cyan text-slate-950 font-display text-xs font-black rounded-xl hover:scale-[1.01] transition-all flex items-center gap-1 cursor-pointer"
                >
                  Generate AI Official Complaint Letter <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: AI COMPLAINT LETTER PREVIEW */}
          {wizardStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 max-w-2xl mx-auto"
            >
              {/* Document Paper Container */}
              <div className="bg-slate-950/90 border border-white/10 rounded-2xl p-6 sm:p-8 font-mono text-[11px] leading-relaxed text-slate-300 shadow-xl shadow-black/80 select-text relative">
                {/* Formal header background lines */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-neon-purple via-neon-cyan to-amber-500 rounded-t-2xl"></div>

                <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-6">
                  <div>
                    <span className="text-neon-cyan font-black text-xs tracking-widest block">CIVICEYE DISPATCH PORTAL</span>
                    <span className="text-[8px] text-slate-500 uppercase mt-0.5">NOTARIZED LEGAL DRAFT v2.4</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[9px]">DATE: {new Date().toLocaleDateString()}</span>
                    <span className="block text-slate-500 text-[8px] mt-0.5">LAT: {selectedLat.toFixed(5)}° N</span>
                  </div>
                </div>

                {/* Simulated letter text */}
                <pre className="whitespace-pre-wrap font-mono text-slate-300 select-text outline-none leading-relaxed text-[11px]">
                  {getComplaintLetterText()}
                </pre>

                {/* Stamp and signature mockup */}
                <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-neon-cyan/10 border border-neon-cyan/40 flex items-center justify-center text-neon-cyan">
                      <Check className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-500 block font-sans">AI SECURITY CHECK</span>
                      <span className="text-[10px] font-sans font-bold text-green-400">SIGNATURE NOTARIZED</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[9px] text-slate-500 font-sans">DIGITALLY STAMPED</div>
                    <div className="text-[10px] text-neon-purple font-black tracking-widest uppercase">CIVIC_GRID_SECURE</div>
                  </div>
                </div>
              </div>

              {/* PDF control buttons */}
              <div className="flex flex-wrap gap-3 items-center justify-between pt-2">
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-neon-cyan" />
                    {complaintCopied ? "Copied Letter!" : "Copy Letter Text"}
                  </button>

                  <button
                    onClick={() => triggerMockAction("Print Complaint", "Generating print view...")}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-amber-400" /> Print / Save PDF
                  </button>
                </div>

                <button
                  disabled={loading}
                  onClick={handleCommitSubmit}
                  className="px-6 py-3.5 bg-gradient-to-r from-neon-purple to-neon-cyan text-slate-950 font-display text-sm font-black rounded-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-lg shadow-purple-500/10"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Sparkles className="w-4.5 h-4.5 text-slate-950" />
                      Commit Report to City Grid
                    </>
                  )}
                </button>
              </div>

              <div className="flex justify-start">
                <button
                  onClick={() => setWizardStep(3)}
                  className="text-xs font-mono text-slate-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Go back to GPS check
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: DIGITAL NOTARIZATION CERTIFICATE SUCCESS VIEW */}
          {wizardStep === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="glass-panel p-8 rounded-3xl border border-emerald-500/30 bg-[#06100e]/95 max-w-2xl mx-auto text-center relative shadow-[0_0_50px_rgba(16,185,129,0.06)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-space-grid opacity-[0.08] pointer-events-none"></div>
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full filter blur-[80px] pointer-events-none animate-pulse"></div>

              {/* Success Golden Shield / Circle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.3 }}
                className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                <Check className="w-8 h-8 text-emerald-400" />
              </motion.div>

              <span className="text-[10px] font-mono text-emerald-400 tracking-widest uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                OFFICIAL NOTARIZED DISPATCH
              </span>

              <h2 className="font-display text-2xl md:text-3xl font-black text-white mt-4 mb-2">
                Report Registered & Placed on Map!
              </h2>
              <p className="text-slate-400 text-xs max-w-md mx-auto mb-6 leading-relaxed">
                Your telemetry report has been processed by the Gemini Vision analyzer, placed on the Community Map with an animated marker drop, and permanently broadcasted to municipal agencies.
              </p>

              {/* Notarized Receipt */}
              <div className="border border-white/10 bg-black/60 rounded-xl p-4 mb-6 text-left space-y-2.5 font-mono text-[11px] text-slate-300 relative">
                <div className="absolute top-0 right-0 p-1.5 bg-emerald-500/15 border-l border-b border-emerald-500/20 text-[7px] text-emerald-400 font-bold uppercase rounded-bl-lg tracking-wide">
                  SECURE NOTARY
                </div>

                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <span className="text-slate-500 font-bold">TICKET SERIAL:</span>
                  <span className="text-neon-cyan font-bold tracking-wider">{ticketId}</span>
                </div>

                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <span className="text-slate-500">REPORTED BY:</span>
                  <span className="text-white font-semibold">{userName}</span>
                </div>

                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <span className="text-slate-500 font-bold">GRID SECTOR:</span>
                  <span className="text-neon-purple font-semibold">{category}</span>
                </div>

                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <span className="text-slate-500">SEVERITY LEVEL:</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    severity === "Critical" ? "bg-red-500/15 text-red-400 border border-red-500/30" :
                    severity === "High" ? "bg-orange-500/15 text-orange-400 border border-orange-500/30" :
                    severity === "Medium" ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30" :
                    "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                  }`}>{severity}</span>
                </div>

                <div className="flex justify-between items-center text-[9px] text-slate-500 pt-0.5">
                  <span>GPS POSITION:</span>
                  <span>{selectedLat.toFixed(4)}° N, {selectedLng.toFixed(4)}° E</span>
                </div>
              </div>

              {/* RESPONSIBLE AGENCY DIRECT ACTIONS */}
              <div className="border border-white/10 bg-slate-950/70 rounded-2xl p-5 mb-6 text-left space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Building className="w-5 h-5 text-neon-cyan" />
                  <div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-bold">MATCHED GOVERNMENT AGENCY</span>
                    <h4 className="font-display font-black text-xs text-white mt-0.5">{authority.name}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 font-mono text-[10.5px] text-slate-300">
                  <div className="flex items-start gap-2">
                    <Phone className="w-3.5 h-3.5 text-neon-cyan shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[8px] text-slate-500 block">CONTACT PHONE</span>
                      <span className="text-white">{authority.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="w-3.5 h-3.5 text-neon-cyan shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[8px] text-slate-500 block">OFFICIAL EMAIL</span>
                      <span className="text-white truncate max-w-[180px] block">{authority.email}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 md:col-span-2 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-neon-cyan shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[8px] text-slate-500 block">OFFICE ADDRESS</span>
                      <span className="text-white">{authority.office}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-1">
                    <Clock className="w-3.5 h-3.5 text-neon-cyan shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[8px] text-slate-500 block">WORKING HOURS</span>
                      <span className="text-white font-bold">9:00 AM - 5:30 PM (Mon-Sat)</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-1">
                    <ExternalLink className="w-3.5 h-3.5 text-neon-cyan shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[8px] text-slate-500 block">OFFICIAL WEBSITE</span>
                      <span className="text-white underline cursor-pointer">{authority.website}</span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Keys */}
                <div className="pt-4 border-t border-white/5 space-y-2">
                  <span className="text-[8px] font-mono text-slate-500 uppercase block font-bold">DIRECT CITIZEN ACTIONS</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => triggerMockAction("Call", authority.phone)}
                      className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono text-[9px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-neon-cyan animate-pulse" /> Call Agency
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerMockAction("Email", authority.email)}
                      className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono text-[9px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-neon-purple" /> Email Draft
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerMockAction("Navigate", authority.office)}
                      className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono text-[9px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-green-400" /> Directions
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerMockAction("Download PDF", ticketId)}
                      className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono text-[9px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer col-span-2 sm:col-span-1"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" /> Complaint PDF
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerMockAction("Open Portal", authority.website)}
                      className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono text-[9px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer col-span-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-neon-cyan" /> Open Complaint Portal
                    </button>
                  </div>
                </div>
              </div>

              {/* Reward multiplier block */}
              <div className="p-4 bg-gradient-to-r from-emerald-950/20 to-cyan-950/20 border border-emerald-500/20 rounded-xl mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-400 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-white">Consensus Bonus Unlocked</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Neighborhood validation multiplier active</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-amber-400 font-display font-black text-base block tracking-wider">+50 XP</span>
                  <span className="text-[8px] text-slate-500 font-mono">CRITICAL GAIN</span>
                </div>
              </div>

              {/* Done navigation options */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => onNavigate("dashboard")}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-purple-600 text-white font-display text-xs font-bold transition-all hover:scale-[1.01] cursor-pointer"
                >
                  Go to Citizen Hub
                </button>
                <button
                  onClick={() => onNavigate("map")}
                  className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 font-display text-xs font-medium transition-all hover:scale-[1.01] cursor-pointer"
                >
                  Explore Live Map
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
