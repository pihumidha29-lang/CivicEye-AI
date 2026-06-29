import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building,
  Phone,
  Mail,
  Globe,
  Clock,
  MapPin,
  Copy,
  Check,
  Send,
  Download,
  AlertTriangle,
  Sparkles,
  FileText,
  Users,
  ThumbsUp,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Calendar,
  ChevronRight,
  RefreshCw,
  Scale,
  ExternalLink,
  Flame,
  Zap,
  Droplets,
  Activity
} from "lucide-react";
import { jsPDF } from "jspdf";
import { CivicIssue, UserProfile, UserLocation } from "../types";
import { getEmergencyContacts, getDistanceKm } from "../utils/authorityDetector";

interface CivicConnectHubProps {
  issues: CivicIssue[];
  userProfile: UserProfile | null;
  onNavigate: (view: string) => void;
  userLocation: UserLocation | null;
}

export default function CivicConnectHub({ issues, userProfile, onNavigate, userLocation }: CivicConnectHubProps) {
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [supportedCount, setSupportedCount] = useState<Record<string, number>>({});
  const [supportedByUser, setSupportedByUser] = useState<Record<string, boolean>>({});
  const [showEmergency, setShowEmergency] = useState(true);

  // Calculate dynamic GPS-aware emergency contacts
  const getAuthorities = () => {
    const rawContacts = getEmergencyContacts(userLocation);
    const lat = userLocation?.latitude ?? 26.9124;
    const lng = userLocation?.longitude ?? 75.7873;
    
    return rawContacts.map(contact => {
      const distance = getDistanceKm(lat, lng, contact.latitude, contact.longitude);
      const travelTime = Math.max(2, Math.round(distance * 2.5 + 2)); 
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${contact.latitude},${contact.longitude}`;
      
      let icon = ShieldCheck;
      let typeStr = "Nearest Police Station";
      let description = "Emergency services, public protection, crime reports and public safety dispatch.";
      
      switch (contact.category) {
        case "Police":
          icon = ShieldCheck;
          typeStr = "👮 Police Station";
          description = "Emergency law enforcement, active incident dispatch, crime prevention.";
          break;
        case "Medical":
          icon = Activity;
          typeStr = "🚑 Hospital Emergency";
          description = "24/7 Trauma care, emergency medical services, and critical ambulance dispatch.";
          break;
        case "Fire":
          icon = Flame;
          typeStr = "🚒 Fire Station";
          description = "Fire rescue, hazardous material containment, and building collapse response.";
          break;
        case "Civic":
          icon = Building;
          typeStr = "🏛️ Municipal Corporation";
          description = "Local urban development, public waste, roads, and municipal administrative files.";
          break;
        case "Electricity":
          icon = Zap;
          typeStr = "⚡ Electricity Emergency";
          description = "Power outages, live downed lines response, electrical hazards, grid control.";
          break;
        case "Water":
          icon = Droplets;
          typeStr = "💧 Water Supply Emergency";
          description = "Water main bursts, drainage overflows, sewage failures, water contamination.";
          break;
      }

      return {
        ...contact,
        icon,
        type: typeStr,
        description,
        distanceVal: distance,
        distance: `${distance.toFixed(1)} km`,
        travelTime: `${travelTime} mins`,
        directionsUrl
      };
    });
  };

  const authorities = getAuthorities();
  
  // Active sub-tab inside the draft container
  const [activeTab, setActiveTab] = useState<"complaint" | "escalations" | "rti" | "advisor">("complaint");
  const [activeEscalationDay, setActiveEscalationDay] = useState<"day7" | "day15" | "day30">("day7");

  // Gemini & local fallback generated data
  const [connectData, setConnectData] = useState<{
    authority: {
      name: string;
      contact: string;
      email: string;
      website: string;
      officeHours: string;
      officeLocation: string;
    };
    draft: {
      title: string;
      summary: string;
      detailedComplaint: string;
      priorityLevel: string;
    };
    escalations: {
      day7: string;
      day15: string;
      day30: string;
    };
    escalationScore: string;
    escalationAdvice: string;
    rtiDraft: string;
    impactAnalysis: {
      citizensAffected: number;
      safetyImpact: string;
      trafficImpact: string;
      environmentalImpact: string;
    };
  } | null>(null);

  // Auto-select first issue if available when loaded
  useEffect(() => {
    if (issues.length > 0 && !selectedIssue) {
      setSelectedIssue(issues[0]);
    }
  }, [issues, selectedIssue]);

  // Fetch connection data when issue changes
  useEffect(() => {
    if (!selectedIssue) return;

    const fetchConnectData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/generate-connect-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issueId: selectedIssue.id,
            title: selectedIssue.title,
            description: selectedIssue.description,
            category: selectedIssue.category,
            severity: selectedIssue.severity,
            area: selectedIssue.address || "San Francisco"
          })
        });

        const data = await response.json();
        if (data.success) {
          setConnectData(data);
        }
      } catch (err) {
        console.error("Error retrieving civic connect data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConnectData();
  }, [selectedIssue]);

  // Handle support trigger
  const handleSupportComplaint = (issueId: string) => {
    if (supportedByUser[issueId]) {
      // Toggle off
      setSupportedByUser(prev => ({ ...prev, [issueId]: false }));
      setSupportedCount(prev => ({ ...prev, [issueId]: (prev[issueId] || 0) - 1 }));
    } else {
      // Toggle on
      setSupportedByUser(prev => ({ ...prev, [issueId]: true }));
      setSupportedCount(prev => ({ ...prev, [issueId]: (prev[issueId] || 0) + 1 }));
    }
  };

  // Copy text to clipboard
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Generate and Download PDF using jsPDF
  const handleDownloadPDF = () => {
    if (!selectedIssue || !connectData) return;

    try {
      const doc = new jsPDF();
      const margin = 14;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Draw professional slate background card top accent line
      doc.setDrawColor(34, 211, 238); // Neon Cyan
      doc.setLineWidth(2);
      doc.line(margin, margin, pageWidth - margin, margin);

      // Main Title Headers
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("CIVICEYE OFFICIAL ADVOCACY DRAFT", margin, margin + 12);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("GENERATED VIA CIVICCONNECT INTELLIGENCE HUB • VERIFIED CITIZEN REPORT", margin, margin + 18);
      doc.text(`ISSUE REFERENCE COMPLAINT: #${selectedIssue.id.toUpperCase()}`, margin, margin + 23);
      doc.text(`FILING STAMP DATE: ${new Date(selectedIssue.reportedAt || Date.now()).toLocaleDateString()} ${new Date(selectedIssue.reportedAt || Date.now()).toLocaleTimeString()}`, margin, margin + 28);

      doc.setDrawColor(226, 232, 240); // border-slate-200
      doc.setLineWidth(0.5);
      doc.line(margin, margin + 32, pageWidth - margin, margin + 32);

      let y = margin + 40;

      // Section 1: Core Issue Details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(13, 148, 136); // teal-600
      doc.text("I. NEIGHBORHOOD HAZARD PROFILE", margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85); // slate-700

      const keyDetails = [
        ["Hazard Category:", selectedIssue.category],
        ["Reported Title:", selectedIssue.title],
        ["Target Location:", selectedIssue.address],
        ["GPS Coordinates:", `${selectedIssue.latitude.toFixed(6)}, ${selectedIssue.longitude.toFixed(6)}`],
        ["Initial Severity:", selectedIssue.severity],
        ["Validation Status:", `${selectedIssue.verificationsCount || 0} Citizens Verified • ${selectedIssue.upvotes || 0} Endorsements`]
      ];

      keyDetails.forEach(([lbl, val]) => {
        doc.setFont("helvetica", "bold");
        doc.text(lbl, margin + 4, y);
        doc.setFont("helvetica", "normal");
        const wrapVal = doc.splitTextToSize(String(val), pageWidth - margin * 2 - 45);
        doc.text(wrapVal, margin + 42, y);
        y += 5.5 * wrapVal.length;
      });

      y += 4;

      // Section 2: Responsible Department
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(13, 148, 136);
      doc.text("II. TARGETED RESOLUTION AUTHORITY", margin, y);
      y += 6;

      const deptDetails = [
        ["Department Name:", connectData.authority.name],
        ["Official Email:", connectData.authority.email],
        ["Contact Line:", connectData.authority.contact],
        ["Portal Website:", connectData.authority.website],
        ["Operational Hours:", connectData.authority.officeHours],
        ["Office Location:", connectData.authority.officeLocation]
      ];

      deptDetails.forEach(([lbl, val]) => {
        doc.setFont("helvetica", "bold");
        doc.text(lbl, margin + 4, y);
        doc.setFont("helvetica", "normal");
        const wrapVal = doc.splitTextToSize(String(val), pageWidth - margin * 2 - 45);
        doc.text(wrapVal, margin + 42, y);
        y += 5.5 * wrapVal.length;
      });

      y += 6;

      // Section 3: Complaint Title & Summary
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(13, 148, 136);
      doc.text("III. COMPLAINT SUMMARY STATEMENT", margin, y);
      y += 6;

      doc.setFont("helvetica", "bold");
      doc.text("Draft Subject:", margin + 4, y);
      doc.setFont("helvetica", "normal");
      const wrapSubject = doc.splitTextToSize(connectData.draft.title, pageWidth - margin * 2 - 32);
      doc.text(wrapSubject, margin + 30, y);
      y += 5.5 * wrapSubject.length + 1;

      doc.setFont("helvetica", "bold");
      doc.text("AI Summary:", margin + 4, y);
      doc.setFont("helvetica", "normal");
      const wrapSummary = doc.splitTextToSize(connectData.draft.summary, pageWidth - margin * 2 - 32);
      doc.text(wrapSummary, margin + 30, y);
      y += 5.5 * wrapSummary.length + 5;

      // Section 4: Detailed Complaint Letter (Wraps page if necessary)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(13, 148, 136);
      doc.text("IV. FORMAL COMPLAINT DETAIL & INITIATION LETTER", margin, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42); // slate-900

      const wrapBody = doc.splitTextToSize(connectData.draft.detailedComplaint, pageWidth - margin * 2 - 8);
      wrapBody.forEach((line: string) => {
        if (y > pageHeight - 22) {
          doc.addPage();
          // Draw header accent line on page 2
          doc.setDrawColor(34, 211, 238);
          doc.setLineWidth(2);
          doc.line(margin, margin, pageWidth - margin, margin);
          y = margin + 15;
        }
        doc.text(line, margin + 4, y);
        y += 5;
      });

      y += 8;

      // Section 5: Impact & Community Endorsement
      if (y > pageHeight - 55) {
        doc.addPage();
        doc.setDrawColor(34, 211, 238);
        doc.setLineWidth(2);
        doc.line(margin, margin, pageWidth - margin, margin);
        y = margin + 15;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(13, 148, 136);
      doc.text("V. ADVOCACY IMPACT AND COMMUNITY STATUS MATRIX", margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);

      const impactDetails = [
        ["Est. Community Footprint:", `${connectData.impactAnalysis.citizensAffected + (supportedCount[selectedIssue.id] || 0) * 10} neighborhood residents impacted`],
        ["Public Safety Assessment:", connectData.impactAnalysis.safetyImpact],
        ["Local Mobility Slowdowns:", connectData.impactAnalysis.trafficImpact],
        ["Environmental Index Impact:", connectData.impactAnalysis.environmentalImpact],
        ["Current Verified Backing:", `${selectedIssue.verificationsCount} physical grid reports, ${selectedIssue.upvotes + (supportedCount[selectedIssue.id] || 0)} community endorsements.`]
      ];

      impactDetails.forEach(([lbl, val]) => {
        doc.setFont("helvetica", "bold");
        doc.text(lbl, margin + 4, y);
        doc.setFont("helvetica", "normal");
        const wrapVal = doc.splitTextToSize(String(val), pageWidth - margin * 2 - 50);
        doc.text(wrapVal, margin + 48, y);
        y += 5.5 * wrapVal.length;
      });

      y += 12;

      // Professional Footer Signatures
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("ISSUED AND ADVOCTED BY THE CIVICEYE CITIZENS UNION COUNCIL", margin + 4, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text("Authenticity secured by Decentralized Community Proof & AI-Audit Signatures.", margin + 4, y + 4.5);

      doc.save(`CivicEye_Advocacy_Complaint_${selectedIssue.id.substring(0, 8)}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF document", err);
    }
  };

  return (
    <div id="civic-connect-hub-root" className="min-h-screen bg-[#070b12] text-white pt-6 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-purple-500/5 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/5 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Government Grade Council Emblem / Certification Seal */}
        <div className="mb-6 flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-transparent flex items-center justify-center text-amber-400 font-serif text-sm font-bold shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse">
              🏛️
            </div>
            <div>
              <span className="text-[9px] font-mono font-black tracking-widest text-amber-400 block uppercase">DEPARTMENT OF DIGITAL DEMOCRACY</span>
              <span className="text-[10px] font-sans text-slate-400 font-bold block">INTELLIGENT CITIZEN CORPS RESOLUTION REGISTRY</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/25 px-2.5 py-1 rounded-full text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> SECURE ADVOCACY DOCK
          </div>
        </div>

        {/* Banner Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/30 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold tracking-wider uppercase">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              🔒 Secure Citizen Resolution Suite
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3.5xl text-white tracking-tight flex items-center gap-2.5">
              <Building className="w-8 h-8 text-cyan-400 animate-pulse" />
              Civic Connect <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Hub</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Bridge the gap between neighborhood hazards and city departments. Gemini automatically compiles legal complaints, maps contact authorities, drafts follow-up timelines, and builds community support.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => onNavigate("report")}
              className="px-5 py-3 rounded-xl font-display font-bold text-xs bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-cyan-400 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              File New Issue
            </button>
            <button
              onClick={() => onNavigate("dashboard")}
              className="px-5 py-3 rounded-xl font-display font-bold text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* 🚨 EMERGENCY HELP CENTER */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              <h2 className="font-display font-black text-lg tracking-tight text-white uppercase">
                🚨 Emergency Help Center & Active Urban Dispatch
              </h2>
            </div>
            <button
              onClick={() => setShowEmergency(!showEmergency)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer text-slate-300"
            >
              {showEmergency ? "Hide Panel" : "Expand Panel"}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showEmergency && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                  {authorities.map((auth, index) => {
                    const IconComponent = auth.icon;
                    const colorMap: Record<string, { border: string, bg: string, text: string, btn: string, glow: string }> = {
                      Police: { border: "border-red-500/25", bg: "bg-red-950/5 hover:bg-red-950/10", text: "text-red-400", btn: "bg-red-600/15 hover:bg-red-600/30 border-red-500/30 text-red-300", glow: "bg-red-500/10" },
                      Medical: { border: "border-rose-500/25", bg: "bg-rose-950/5 hover:bg-rose-950/10", text: "text-rose-400", btn: "bg-rose-600/15 hover:bg-rose-600/30 border-rose-500/30 text-rose-300", glow: "bg-rose-500/10" },
                      Fire: { border: "border-amber-500/25", bg: "bg-amber-950/5 hover:bg-amber-950/10", text: "text-amber-400", btn: "bg-amber-600/15 hover:bg-amber-600/30 border-amber-500/30 text-amber-300", glow: "bg-amber-500/10" },
                      Civic: { border: "border-cyan-500/25", bg: "bg-cyan-950/5 hover:bg-cyan-950/10", text: "text-cyan-400", btn: "bg-cyan-600/15 hover:bg-cyan-600/30 border-cyan-500/30 text-cyan-300", glow: "bg-cyan-500/10" },
                      Electricity: { border: "border-yellow-500/25", bg: "bg-yellow-950/5 hover:bg-yellow-950/10", text: "text-yellow-400", btn: "bg-yellow-600/15 hover:bg-yellow-600/30 border-yellow-500/30 text-yellow-300", glow: "bg-yellow-500/10" },
                      Water: { border: "border-blue-500/25", bg: "bg-blue-950/5 hover:bg-blue-950/10", text: "text-blue-400", btn: "bg-blue-600/15 hover:bg-blue-600/30 border-blue-500/30 text-blue-300", glow: "bg-blue-500/10" },
                    };
                    const design = colorMap[auth.category] || colorMap.Civic;

                    return (
                      <div key={index} className={`glass-panel p-5 rounded-2xl border ${design.border} ${design.bg} transition-all duration-300 relative overflow-hidden group shadow-[0_0_20px_rgba(255,255,255,0.01)] flex flex-col justify-between`}>
                        <div>
                          <div className={`absolute -top-10 -right-10 w-24 h-24 ${design.glow} rounded-full filter blur-xl pointer-events-none`} />
                          
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${design.text}`}>
                              <IconComponent className="w-5 h-5 animate-pulse" />
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-white/5 border border-white/10 text-slate-300 uppercase block mb-1">
                                {auth.type}
                              </span>
                              <span className={`text-[10px] font-mono font-semibold ${design.text} block`}>
                                📍 {auth.distance} • ⏱️ {auth.travelTime}
                              </span>
                            </div>
                          </div>

                          <h3 className="font-display font-black text-sm text-white mb-1.5 truncate">
                            {auth.name}
                          </h3>
                          <p className="text-[11px] text-slate-400 leading-relaxed mb-4 min-h-[32px] line-clamp-2">
                            {auth.description}
                          </p>

                          {/* 📋 Local Authority Meta Details */}
                          <div className="space-y-1.5 mb-5 text-[10px] text-slate-300 font-mono border-t border-white/5 pt-3">
                            <div className="flex items-center gap-1.5 truncate">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">🕒 Hrs: {auth.hours}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate" title={auth.office}>🏢 Address: {auth.office}</span>
                            </div>
                            {auth.email && (
                              <div className="flex items-center gap-1.5 truncate">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">📧 Email: {auth.email}</span>
                              </div>
                            )}
                            {auth.website && (
                              <div className="flex items-center gap-1.5 truncate">
                                <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">🌐 Web: {auth.website}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <a
                              href={`tel:${auth.phone}`}
                              className="flex-1 py-2 px-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-display font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                            >
                              <Phone className="w-3.5 h-3.5" /> Call
                            </a>
                            <a
                              href={`mailto:${auth.email}`}
                              className="flex-1 py-2 px-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-display font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                            >
                              <Mail className="w-3.5 h-3.5" /> Email
                            </a>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={auth.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2 px-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-display font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                            >
                              <Globe className="w-3.5 h-3.5" /> Website
                            </a>
                            <a
                              href={auth.directionsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex-1 py-2 px-1 rounded-xl ${design.btn} font-display font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]`}
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Directions
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Issue Selector Dropdown & Overview */}
        <div className="mb-8 p-5 bg-slate-950/40 border border-white/5 rounded-2xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="w-full md:max-w-md">
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">Select Active Neighborhood Hazard to Address:</label>
              <select
                value={selectedIssue?.id || ""}
                onChange={(e) => {
                  const found = issues.find(i => i.id === e.target.value);
                  if (found) setSelectedIssue(found);
                }}
                className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl font-display text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {issues.length === 0 ? (
                  <option value="" disabled>No active reports to connect</option>
                ) : (
                  issues.map(i => (
                    <option key={i.id} value={i.id}>
                      [{i.category}] {i.title.length > 50 ? i.title.substring(0, 50) + "..." : i.title} (Ref: #{i.id.substring(0, 6)})
                    </option>
                  ))
                )}
              </select>
            </div>

            {selectedIssue && (
              <div className="flex flex-wrap items-center gap-3 md:self-end mt-2 md:mt-0">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border ${
                  selectedIssue.severity === "Critical"
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : selectedIssue.severity === "High"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                }`}>
                  🚨 {selectedIssue.severity} Severity
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-slate-900 text-slate-300 border border-white/5 uppercase">
                  📍 {selectedIssue.address || "Main Corridor"}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-slate-900 text-slate-300 border border-white/5 uppercase">
                  🔒 {selectedIssue.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {selectedIssue ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Hand Column (Connect Details, Actions & Impact Analysis) - Width 5 */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* Civic Connect Authority Card */}
              <div className="bg-slate-950/60 border border-white/5 hover:border-cyan-500/20 transition-all rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full filter blur-xl pointer-events-none"></div>
                <div className="flex items-center gap-3.5 mb-5 border-b border-white/5 pb-4">
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Building className="w-5.5 h-5.5 text-cyan-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">🚨 Target Responsible Authority</span>
                    <h3 className="text-white font-display font-black text-lg group-hover:text-cyan-300 transition-colors">Smart Authority Finder</h3>
                  </div>
                </div>

                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    <span className="text-slate-400 font-mono text-xs animate-pulse">Scanning City Departments...</span>
                  </div>
                ) : connectData ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                      <span className="text-[9px] font-mono text-slate-400 uppercase">Assigned City Department</span>
                      <h4 className="text-white font-display font-extrabold text-sm leading-snug">{connectData.authority.name}</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 min-w-0">
                        <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-[8px] font-mono text-slate-500 uppercase">Contact Line</span>
                          <span className="text-xs text-white font-semibold block truncate">{connectData.authority.contact}</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 min-w-0">
                        <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-[8px] font-mono text-slate-500 uppercase">Email Dispatch</span>
                          <span className="text-xs text-white font-semibold block truncate">{connectData.authority.email}</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 min-w-0">
                        <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-[8px] font-mono text-slate-500 uppercase">Filing Portal</span>
                          <span className="text-xs text-white font-semibold block truncate">{connectData.authority.website.replace("https://", "")}</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 min-w-0">
                        <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-[8px] font-mono text-slate-500 uppercase">Office Hours</span>
                          <span className="text-xs text-white font-semibold block truncate">{connectData.authority.officeHours}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[8px] font-mono text-slate-500 uppercase">Headquarters Office Location</span>
                        <p className="text-xs text-white leading-relaxed font-semibold mt-0.5">{connectData.authority.officeLocation}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 font-mono text-xs">No connect data retrieved.</div>
                )}
              </div>

              {/* Action Toolbar Panel */}
              <div className="bg-slate-950/60 border border-white/5 hover:border-purple-500/20 transition-all rounded-3xl p-6 backdrop-blur-xl">
                <h3 className="text-white font-display font-extrabold text-sm uppercase tracking-wider mb-4 text-slate-300">⚡ One-Click Citizen Interventions</h3>
                
                {connectData ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href={`tel:${connectData.authority.contact.split(" ")[0]}`}
                        className="p-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 flex flex-col items-center gap-1.5 transition-all text-cyan-300"
                      >
                        <Phone className="w-4 h-4" />
                        <span className="text-[10px] font-mono font-bold uppercase">Call Hotline</span>
                      </a>

                      <a
                        href={`mailto:${connectData.authority.email}?subject=${encodeURIComponent(connectData.draft.title)}&body=${encodeURIComponent(connectData.draft.detailedComplaint)}`}
                        className="p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 flex flex-col items-center gap-1.5 transition-all text-purple-300"
                      >
                        <Mail className="w-4 h-4" />
                        <span className="text-[10px] font-mono font-bold uppercase">Send Dispatch</span>
                      </a>
                    </div>

                    <button
                      onClick={handleDownloadPDF}
                      className="w-full p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs font-mono font-bold uppercase text-white"
                    >
                      <Download className="w-4.5 h-4.5 text-emerald-400" />
                      Download Complaint PDF
                    </button>

                    <button
                      onClick={() => handleCopyText(
                        activeTab === "complaint" ? connectData.draft.detailedComplaint :
                        activeTab === "escalations" ? (activeEscalationDay === "day7" ? connectData.escalations.day7 : activeEscalationDay === "day15" ? connectData.escalations.day15 : connectData.escalations.day30) :
                        activeTab === "rti" ? connectData.rtiDraft : connectData.escalationAdvice
                      )}
                      className="w-full p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs font-mono font-bold uppercase text-white relative"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-4.5 h-4.5 text-cyan-400 animate-scale" />
                          <span className="text-cyan-400">Copied Draft to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4.5 h-4.5 text-slate-400" />
                          <span>Copy Active Draft Text</span>
                        </>
                      )}
                    </button>

                    <a
                      href={connectData.authority.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full p-3.5 rounded-xl bg-cyan-950/20 hover:bg-cyan-900/30 border border-cyan-500/10 flex items-center justify-center gap-2 transition-all text-xs font-mono font-bold uppercase text-cyan-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Official Complaint Portal
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-600 font-mono text-xs">Waiting for connection matrix...</div>
                )}
              </div>

              {/* AI Impact Analysis Widget */}
              <div className="bg-slate-950/60 border border-white/5 hover:border-emerald-500/20 transition-all rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden">
                <div className="flex items-center gap-3.5 mb-5 border-b border-white/5 pb-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Users className="w-5.5 h-5.5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">📊 AI Impact Projection</span>
                    <h3 className="text-white font-display font-black text-lg">Impact Analysis Matrix</h3>
                  </div>
                </div>

                {loading ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                    <span className="text-slate-500 font-mono text-xs animate-pulse">Calculating safety coefficients...</span>
                  </div>
                ) : connectData ? (
                  <div className="space-y-5">
                    {/* Citizens Affected Bento Display */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/20 to-transparent border border-emerald-500/15 flex items-center justify-between gap-4">
                      <div>
                        <span className="block text-[9px] font-mono text-emerald-400 uppercase">Estimated Citizens Affected</span>
                        <div className="text-2xl font-mono font-black text-white mt-1">
                          {connectData.impactAnalysis.citizensAffected + (supportedCount[selectedIssue.id] || 0) * 10} <span className="text-xs text-slate-400 font-sans font-normal">local residents</span>
                        </div>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold">
                        +{((supportedCount[selectedIssue.id] || 0) * 10)} supported impact
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400 uppercase">🛡 Public Safety Impact Index</span>
                          <span className="text-emerald-400 font-bold">High Threat</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5 font-sans">
                          {connectData.impactAnalysis.safetyImpact}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400 uppercase">🚗 Commuter Mobility / Traffic Index</span>
                          <span className="text-amber-400 font-bold">Moderate Slowdown</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5 font-sans">
                          {connectData.impactAnalysis.trafficImpact}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400 uppercase">🌿 Environmental Footprint Index</span>
                          <span className="text-cyan-400 font-bold">Active</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5 font-sans">
                          {connectData.impactAnalysis.environmentalImpact}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-600 font-mono text-xs">Waiting for projection model...</div>
                )}
              </div>

            </div>

            {/* Right Hand Column (Draft Drawer, Escalation Timeline, Community Backing) - Width 7 */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Core Drafting Suite panel */}
              <div className="bg-slate-950/60 border border-white/5 hover:border-cyan-500/25 transition-all rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden flex flex-col min-h-[580px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full filter blur-2xl pointer-events-none"></div>
                
                {/* Panel Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                      <FileText className="w-5.5 h-5.5 text-purple-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider block">🔮 Automated Gemini Intel</span>
                      <h3 className="text-white font-display font-black text-lg">AI Resolution Draft Drawer</h3>
                    </div>
                  </div>

                  {connectData && (
                    <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono font-bold uppercase flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                      {connectData.draft.priorityLevel} Priority
                    </div>
                  )}
                </div>

                {/* Navigation Tab list */}
                <div className="flex overflow-x-auto gap-2 border-b border-white/5 pb-3 mb-6 scrollbar-thin">
                  <button
                    onClick={() => setActiveTab("complaint")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase shrink-0 transition-all ${
                      activeTab === "complaint"
                        ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    📝 Legal Complaint Draft
                  </button>

                  <button
                    onClick={() => setActiveTab("escalations")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase shrink-0 transition-all ${
                      activeTab === "escalations"
                        ? "bg-purple-500/10 text-purple-300 border border-purple-500/30"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    ⏰ Escalation Timeline
                  </button>

                  <button
                    onClick={() => setActiveTab("advisor")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase shrink-0 transition-all ${
                      activeTab === "advisor"
                        ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    🛡 AI Escalation Advisor
                  </button>

                  <button
                    onClick={() => setActiveTab("rti")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase shrink-0 transition-all ${
                      activeTab === "rti"
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    🏛 RTI Transparency Draft
                  </button>
                </div>

                {/* Tab content area */}
                <div className="flex-grow flex flex-col">
                  {loading ? (
                    <div className="flex-grow flex flex-col items-center justify-center gap-4 py-16">
                      <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
                      <div className="text-center space-y-1">
                        <p className="font-mono text-sm text-white font-bold animate-pulse">Running Gemini Auto Drafting Engine...</p>
                        <p className="text-xs text-slate-500">Compiling departments, contact guidelines, and public litigation laws...</p>
                      </div>
                    </div>
                  ) : connectData ? (
                    <AnimatePresence mode="wait">
                      
                      {/* Sub-tab 1: Complaint draft */}
                      {activeTab === "complaint" && (
                        <motion.div
                          key="tab-complaint"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-4 flex-grow flex flex-col"
                        >
                          <div className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl">
                            <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest">Recommended Subject Line</span>
                            <p className="text-sm text-cyan-300 font-semibold font-display mt-1">{connectData.draft.title}</p>
                          </div>

                          <div className="flex-grow flex flex-col relative">
                            <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Official Advocacy Letter Draft</span>
                            <textarea
                              readOnly
                              value={connectData.draft.detailedComplaint}
                              className="w-full flex-grow min-h-[300px] p-4 bg-slate-900/40 border border-white/5 rounded-2xl text-slate-300 font-mono text-xs leading-relaxed focus:outline-none focus:border-cyan-400/40 resize-none select-text"
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Sub-tab 2: Escalations */}
                      {activeTab === "escalations" && (
                        <motion.div
                          key="tab-escalations"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-6 flex-grow flex flex-col"
                        >
                          {/* Escalation days selector */}
                          <div className="grid grid-cols-3 gap-2.5">
                            <button
                              onClick={() => setActiveEscalationDay("day7")}
                              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                activeEscalationDay === "day7"
                                  ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                                  : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              <span className="block text-[9px] font-mono uppercase text-slate-500">Day 7</span>
                              <span className="text-xs font-semibold block mt-1">Reminder Alert</span>
                            </button>

                            <button
                              onClick={() => setActiveEscalationDay("day15")}
                              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                activeEscalationDay === "day15"
                                  ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                                  : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              <span className="block text-[9px] font-mono uppercase text-slate-500">Day 15</span>
                              <span className="text-xs font-semibold block mt-1">Urgent Complaint</span>
                            </button>

                            <button
                              onClick={() => setActiveEscalationDay("day30")}
                              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                activeEscalationDay === "day30"
                                  ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                                  : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              <span className="block text-[9px] font-mono uppercase text-slate-500">Day 30</span>
                              <span className="text-xs font-semibold block mt-1">Senior Escalation</span>
                            </button>
                          </div>

                          <div className="p-4 bg-slate-900/30 border border-white/5 rounded-2xl flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-mono font-bold text-slate-200 uppercase">
                                {activeEscalationDay === "day7" && "Day 7: Moderate Unresolved Intervention"}
                                {activeEscalationDay === "day15" && "Day 15: Critical Departmental Escalation"}
                                {activeEscalationDay === "day30" && "Day 30: Senior Commissioner Advisory"}
                              </h4>
                              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                                {activeEscalationDay === "day7" && "If no department dispatcher or physical repairs are scheduled 7 days post filing, send this friendly automated reminder."}
                                {activeEscalationDay === "day15" && "If the hazard remains unchecked 15 days post filing, escalate this warning highlighting growing public risk factors."}
                                {activeEscalationDay === "day30" && "After 30 days of unresolved safety threat, file this formal non-performance report to senior municipal leadership."}
                              </p>
                            </div>
                          </div>

                          <div className="flex-grow flex flex-col">
                            <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Generated Escalation Draft Text</span>
                            <textarea
                              readOnly
                              value={
                                activeEscalationDay === "day7" ? connectData.escalations.day7 :
                                activeEscalationDay === "day15" ? connectData.escalations.day15 :
                                connectData.escalations.day30
                              }
                              className="w-full flex-grow min-h-[180px] p-4 bg-slate-900/40 border border-white/5 rounded-2xl text-slate-300 font-mono text-xs leading-relaxed focus:outline-none resize-none select-text"
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Sub-tab 3: Advisor */}
                      {activeTab === "advisor" && (
                        <motion.div
                          key="tab-advisor"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-5 flex-grow"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl">
                              <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest">Escalation Threat Score</span>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`h-3 w-3 rounded-full animate-pulse ${
                                  connectData.escalationScore === "Critical" ? "bg-red-500" :
                                  connectData.escalationScore === "High" ? "bg-amber-500" : "bg-cyan-500"
                                }`}></span>
                                <span className="font-mono text-lg font-black text-white">{connectData.escalationScore} Priority</span>
                              </div>
                            </div>

                            <div className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl flex items-center gap-3">
                              <Scale className="w-7 h-7 text-amber-400 shrink-0" />
                              <div>
                                <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest">Target Service SLA</span>
                                <span className="block text-xs font-bold text-white mt-0.5">3-5 Business Days Resolve</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-5 bg-gradient-to-r from-amber-950/20 to-transparent border border-amber-500/10 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase">
                              <Sparkles className="w-4 h-4 animate-spin-slow" /> AI Escalation Instructions
                            </div>
                            <p className="text-slate-300 text-xs leading-relaxed font-sans">
                              {connectData.escalationAdvice}
                            </p>
                          </div>

                          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                            <h4 className="text-xs font-mono font-bold text-slate-200 uppercase mb-2">💡 Citizen Advisory Guild Checklist:</h4>
                            <ul className="text-xs text-slate-400 space-y-2 font-sans list-disc list-inside">
                              <li>Share this connecting file to local neighborhood group chats.</li>
                              <li>Gather 5 verified endorsement signatures using the Support button below.</li>
                              <li>Submit reports to local community board representatives at the listed address.</li>
                            </ul>
                          </div>
                        </motion.div>
                      )}

                      {/* Sub-tab 4: RTI */}
                      {activeTab === "rti" && (
                        <motion.div
                          key="tab-rti"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-4 flex-grow flex flex-col"
                        >
                          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                            <Scale className="w-5.5 h-5.5 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase">Premium Transparency Assist</h4>
                              <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                                If a safety hazard remains ignored with zero departmental response, citizens can legally request municipal action files, budget allocation, and inspection history logs. 
                              </p>
                            </div>
                          </div>

                          <div className="flex-grow flex flex-col">
                            <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Official RTI Transparency Inquiry Application</span>
                            <textarea
                              readOnly
                              value={connectData.rtiDraft}
                              className="w-full flex-grow min-h-[250px] p-4 bg-slate-900/40 border border-white/5 rounded-2xl text-slate-300 font-mono text-xs leading-relaxed focus:outline-none resize-none select-text"
                            />
                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  ) : (
                    <div className="text-center py-12 text-slate-600 font-mono text-xs">Waiting for drafting parameters...</div>
                  )}
                </div>
              </div>

              {/* Community Support Counter Section */}
              <div className="bg-slate-950/60 border border-white/5 hover:border-cyan-500/20 transition-all rounded-3xl p-6 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1.5 text-center sm:text-left">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">🤝 Community Backing Coalition</span>
                  <h4 className="text-white font-display font-black text-lg">Harness Local Advocacy Power</h4>
                  <p className="text-slate-400 text-xs">
                    Rally your neighbors to back this complaint draft. The higher the support level, the faster city departments expedite resolutions.
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                  <div className="text-center shrink-0">
                    <span className="block text-[8px] font-mono text-slate-500 uppercase">Support Count</span>
                    <span className="text-lg font-mono font-bold text-white">
                      {selectedIssue.upvotes + (supportedCount[selectedIssue.id] || 0)}
                    </span>
                  </div>

                  <div className="h-8 w-[1px] bg-white/10"></div>

                  <button
                    onClick={() => handleSupportComplaint(selectedIssue.id)}
                    className={`px-4 py-2.5 rounded-xl font-display font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                      supportedByUser[selectedIssue.id]
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "bg-cyan-500 hover:bg-cyan-600 text-black hover:scale-[1.02]"
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${supportedByUser[selectedIssue.id] ? "fill-white animate-bounce" : ""}`} />
                    {supportedByUser[selectedIssue.id] ? "Supporting!" : "Support Complaint"}
                  </button>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="text-center py-20 bg-slate-950/40 border border-white/5 rounded-3xl backdrop-blur-md">
            <Building className="w-12 h-12 text-slate-500 mx-auto mb-4 animate-bounce" />
            <h3 className="font-display font-bold text-lg text-white">No Active Neighborhood Reports Found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
              File a civic hazard report first to generate automated legal drafts, mapping coordinates, and responsible authorities.
            </p>
            <button
              onClick={() => onNavigate("report")}
              className="mt-6 px-5 py-2.5 rounded-xl font-display font-bold text-xs bg-cyan-500 hover:bg-cyan-600 text-black cursor-pointer transition-all"
            >
              Report First Civic Issue
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
