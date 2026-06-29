import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  MapPin,
  Users,
  MessageSquare,
  Building,
  ShieldAlert,
  Sparkles,
  ShieldCheck,
  Award,
  Wind,
  Plus,
  Search,
  Bell,
  Heart,
  Zap,
  Phone,
  Flame,
  Droplet
} from "lucide-react";
import { CivicIssue, CommunityMission, ViewType, UserProfile, UserLocation } from "../types";
import AiMissionControl from "./AiMissionControl";

// Framer Motion orchestration
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    }
  }
};

const widgetVariants = {
  hidden: { 
    opacity: 0, 
    y: 18, 
    filter: "blur(6px)"
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { 
      type: "spring",
      stiffness: 90,
      damping: 14,
      mass: 0.8
    }
  }
};

// Smooth count helper
function AnimatedNumber({ value, duration = 1.2, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      // easeOutQuad
      const ease = progress * (2 - progress);
      setCount(Math.floor(ease * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

interface DashboardViewProps {
  issues: CivicIssue[];
  missions: CommunityMission[];
  userProfile: UserProfile | null;
  userLocation: UserLocation | null;
  onNavigate: (view: ViewType) => void;
  onSelectIssue: (issue: CivicIssue) => void;
}

export default function DashboardView({
  issues,
  missions,
  userProfile,
  userLocation,
  onNavigate,
  onSelectIssue
}: DashboardViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Stats calculations
  const totalReported = issues.length;
  const activeIssues = issues.filter(i => i.status !== "Resolved").length;
  const resolvedIssues = issues.filter(i => i.status === "Resolved").length;
  const myReports = issues.filter(i => i.reporterId === userProfile?.uid);

  // Time-based personal greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Searching logic
  const filteredIssues = searchQuery.trim() === "" 
    ? [] 
    : issues.filter(i => 
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.responsibleDept && i.responsibleDept.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  // Live Scrolling Events dataset (marquee)
  const LIVE_EVENTS = [
    "🛣️ Asphalt resurfacing complete in Malviya Nagar Sector 2 Jaipur.",
    "💧 Drinking water line pressure repaired on High Street.",
    "💡 Nighttime street illumination rewired at Block D Jaipur Central.",
    "🍃 Localized AQI index refreshed to Moderate (54) for regional health.",
    "🎨 Street art mural finalized replacing public graffiti walls.",
    "🚒 Emergency Municipal Fire Hydrant flow rate calibrated successfully.",
    "⚡ High voltage electrical transformers safely re-insulated."
  ];

  // Colors mapping
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-red-500/10 text-red-400 border-red-500/25";
      case "High": return "bg-orange-500/10 text-orange-400 border-orange-500/25";
      case "Medium": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/25";
      default: return "bg-blue-500/10 text-blue-400 border-blue-500/25";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
      case "In Progress": return "bg-amber-500/10 text-amber-400 border-amber-500/25";
      case "Verified": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
      case "Verifying": return "bg-purple-500/10 text-purple-400 border-purple-500/25";
      default: return "bg-yellow-500/10 text-yellow-400 border-yellow-500/25";
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-24 relative"
    >
      {/* Background aurora glows */}
      <div className="absolute top-[3%] right-[12%] w-[400px] h-[400px] bg-neon-cyan/5 rounded-full filter blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] left-[2%] w-[350px] h-[350px] bg-neon-purple/5 rounded-full filter blur-[130px] pointer-events-none"></div>

      {/* Floating Glassmorphic Search Bar */}
      <motion.div variants={widgetVariants} className="w-full max-w-2xl mx-auto mb-8 relative z-50">
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5.5 w-5.5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search locations, categories, departments, or municipal updates..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-full pl-12 pr-10 py-3.5 bg-slate-950/70 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-neon-cyan/40 focus:ring-1 focus:ring-neon-cyan/20 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setShowSearchResults(false);
              }}
              className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-white cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search Results Suggestion Box */}
        <AnimatePresence>
          {showSearchResults && searchQuery.trim() !== "" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 right-0 mt-2 bg-[#090d15]/95 border border-white/10 rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-50 max-h-[320px] overflow-y-auto"
            >
              <div className="p-3 border-b border-white/5 bg-white/[0.01]">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                  🔍 Search Results ({filteredIssues.length})
                </span>
              </div>

              {filteredIssues.length === 0 ? (
                <div className="p-6 text-center text-slate-400 font-mono text-xs">
                  No matching civic records found. Try "Roads", "Pothole", "Streetlights", or a location.
                </div>
              ) : (
                filteredIssues.map(issue => (
                  <button
                    key={issue.id}
                    onClick={() => {
                      onSelectIssue(issue);
                      setShowSearchResults(false);
                    }}
                    className="w-full p-3.5 text-left flex items-start gap-3 hover:bg-white/[0.04] border-b border-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-neon-purple/15 flex items-center justify-center text-neon-purple text-xs font-bold font-mono">
                      {issue.category.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-display font-bold text-white group-hover:text-neon-cyan transition-colors truncate">
                          {issue.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono border whitespace-nowrap shrink-0 ${getStatusColor(issue.status)}`}>
                          {issue.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                        📍 {issue.address} • Dept: {issue.responsibleDept || "Municipal Commission"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Greeting Header */}
      <motion.div variants={widgetVariants} className="mb-8 text-left">
        <span className="text-[10px] font-mono text-neon-cyan font-black tracking-widest uppercase bg-neon-cyan/10 px-2.5 py-1 rounded-full border border-neon-cyan/25">
          👋 {getGreeting()}, {userProfile?.displayName || "Sentinel Citizen"}
        </span>
        <h1 className="font-display text-3.5xl sm:text-4.5xl font-black text-white leading-none mt-3.5">
          Let's improve your community <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-purple-400 to-neon-cyan drop-shadow-[0_0_15px_rgba(168,85,247,0.15)]">together.</span>
        </h1>
        <p className="text-slate-400 text-xs mt-2 max-w-xl font-medium leading-relaxed">
          Your personal civic assistant is connected to Jaipur's municipal grid. Submit, verify, and escalate issues below.
        </p>
      </motion.div>

      {/* Hero Banner Area */}
      <motion.div variants={widgetVariants} className="mb-8">
        <div className="w-full relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#0a0d16] via-[#100b21] to-[#06080e] p-6 sm:p-8 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.65)]">
          <div className="absolute inset-0 bg-space-grid opacity-[0.06] pointer-events-none"></div>
          <div className="absolute -right-24 -top-24 w-80 h-80 bg-neon-cyan/5 rounded-full filter blur-[90px]"></div>
          <div className="absolute -left-24 -bottom-24 w-80 h-80 bg-neon-purple/5 rounded-full filter blur-[90px]"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-xl">
              <span className="text-[8.5px] font-mono text-neon-purple font-bold tracking-widest uppercase bg-neon-purple/15 px-3 py-1 rounded-full border border-neon-purple/25">
                👑 CivicEye Hero
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-white leading-tight">
                Helping Citizens Build Better Communities
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Empower your neighborhood. Instantly log local concerns, explore nearby verified incidents on the map, and contact the exact municipal wards to fast-track municipal action.
              </p>
            </div>

            {/* Quick Action Button Stack */}
            <div className="flex flex-wrap sm:flex-nowrap items-stretch sm:items-center gap-3 shrink-0">
              <button
                id="btn-hero-report"
                onClick={() => onNavigate("report")}
                className="px-5 py-3.5 rounded-2xl font-display font-black text-xs bg-gradient-to-r from-neon-purple to-neon-blue text-white cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2 border border-white/10"
              >
                📸 Report Issue
              </button>
              
              <button
                onClick={() => onNavigate("map")}
                className="px-5 py-3.5 rounded-2xl font-display font-black text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                🗺️ Community Map
              </button>

              {/* Quick Emergency button */}
              <button
                onClick={() => onNavigate("civic_connect")}
                className="px-5 py-3.5 rounded-2xl font-display font-black text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider"
              >
                🏛️ Emergency Help
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🤖 AI Insight of the Day Box */}
      <motion.div variants={widgetVariants} className="mb-8">
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-950/15 via-slate-900/40 to-cyan-950/10 border border-white/5 rounded-3xl backdrop-blur-xl relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 rounded-full filter blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full filter blur-xl"></div>
          
          <div className="flex items-start gap-4.5 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5.5 h-5.5 text-neon-cyan animate-pulse" />
            </div>
            <div>
              <span className="text-[8px] font-mono text-neon-cyan font-black tracking-widest uppercase block mb-1">
                🤖 AI Insight of the Day
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans font-medium">
                "Two potholes were reported nearby today. Regional localized Air Quality Index (AQI) is <strong className="text-neon-cyan font-bold">54 (Moderate)</strong>. Heavy rainfall is expected in Jaipur tomorrow which may cause temporary waterlogging in low-lying quadrants."
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Live community scrolling activity feed (marquee style) */}
      <motion.div variants={widgetVariants} className="mb-8 overflow-hidden relative glass-panel border border-white/5 py-3 rounded-2xl bg-slate-950/40 backdrop-blur-sm z-10 flex items-center gap-3">
        <div className="px-4 border-r border-white/10 flex items-center gap-1.5 shrink-0 select-none">
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
          </span>
          <span className="text-[9px] font-mono font-black uppercase text-red-400 tracking-wider">LIVE FEED</span>
        </div>
        
        {/* Infinite CSS horizontal sliding marquee list container */}
        <div className="marquee-outer overflow-hidden flex-1 relative whitespace-nowrap">
          <div className="marquee-inner flex items-center gap-12 text-[10px] font-mono text-slate-300">
            <span className="flex gap-12">
              {LIVE_EVENTS.map((evt, idx) => (
                <span key={idx} className="flex items-center gap-2">
                  <span className="text-[12px]">•</span> {evt}
                </span>
              ))}
            </span>
            {/* Duplicate for seamless infinite wrapping */}
            <span className="flex gap-12" aria-hidden="true">
              {LIVE_EVENTS.map((evt, idx) => (
                <span key={`dup-${idx}`} className="flex items-center gap-2">
                  <span className="text-[12px]">•</span> {evt}
                </span>
              ))}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ==================== 12. LIVE ACCOUNTABILITY DASHBOARD ==================== */}
      <motion.div variants={widgetVariants} className="mb-8 p-5 bg-gradient-to-b from-slate-900/60 to-slate-950/80 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-neon-purple/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-white/5 pb-3.5 mb-5 relative z-10">
          <div className="flex items-center gap-2">
            <Activity className="w-4.5 h-4.5 text-neon-cyan animate-pulse" />
            <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">
              📊 Live Accountability Dashboard • SLA Monitor
            </h3>
          </div>
          <span className="text-[8px] font-mono font-black text-neon-cyan bg-neon-cyan/15 border border-neon-cyan/25 px-2.5 py-1 rounded-full uppercase tracking-widest animate-pulse">
            ● Grid Synchronized Live
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
          
          {/* Box 1: Submitted Today */}
          <div className="glass-panel border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-white/15 hover:shadow-[0_0_12px_rgba(168,85,247,0.1)] transition-all h-[115px] bg-white/[0.01]">
            <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-wider block">Submitted Today</span>
            <div className="font-display font-black text-3xl text-white my-1">
              <AnimatedNumber value={Math.round(totalReported * 0.35) + 2} />
            </div>
            <p className="text-[9px] text-slate-500 font-mono">New civic payloads</p>
          </div>

          {/* Box 2: Awaiting Review */}
          <div className="glass-panel border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-white/15 hover:shadow-[0_0_12px_rgba(251,146,60,0.1)] transition-all h-[115px] bg-white/[0.01]">
            <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-wider block">Awaiting Review</span>
            <div className="font-display font-black text-3xl text-orange-400 my-1 drop-shadow-[0_0_8px_rgba(251,146,60,0.2)]">
              <AnimatedNumber value={issues.filter(i => i.status === "Reported" || i.status === "Verifying").length || 1} />
            </div>
            <p className="text-[9px] text-slate-500 font-mono">In processing queue</p>
          </div>

          {/* Box 3: In Progress */}
          <div className="glass-panel border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-white/15 hover:shadow-[0_0_12px_rgba(6,182,212,0.1)] transition-all h-[115px] bg-white/[0.01]">
            <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-wider block">In Progress</span>
            <div className="font-display font-black text-3xl text-neon-cyan my-1 drop-shadow-[0_0_8px_rgba(6,182,212,0.2)]">
              <AnimatedNumber value={issues.filter(i => i.status === "In Progress" || i.status === "Verified").length || 2} />
            </div>
            <p className="text-[9px] text-slate-500 font-mono">Assigned to wards</p>
          </div>

          {/* Box 4: Resolved */}
          <div className="glass-panel border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-white/15 hover:shadow-[0_0_12px_rgba(74,222,128,0.1)] transition-all h-[115px] bg-white/[0.01]">
            <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-wider block">Resolved</span>
            <div className="font-display font-black text-3xl text-green-400 my-1 drop-shadow-[0_0_8px_rgba(74,222,128,0.2)]">
              <AnimatedNumber value={resolvedIssues} />
            </div>
            <p className="text-[9px] text-slate-500 font-mono">Completed closures</p>
          </div>

          {/* Box 5: Avg Response Time */}
          <div className="glass-panel border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-white/15 hover:shadow-[0_0_12px_rgba(244,63,94,0.1)] transition-all h-[115px] bg-white/[0.01]">
            <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-wider block">Avg Response Time</span>
            <div className="font-display font-black text-3xl text-neon-purple my-1 drop-shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              <AnimatedNumber value={18} suffix="h" />
            </div>
            <p className="text-[9px] text-slate-500 font-mono">SLA performance index</p>
          </div>

          {/* Box 6: Community Verifications */}
          <div className="glass-panel border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-white/15 hover:shadow-[0_0_12px_rgba(56,189,248,0.1)] transition-all h-[115px] bg-white/[0.01]">
            <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-wider block">Vouched Opinions</span>
            <div className="font-display font-black text-3xl text-emerald-400 my-1 drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <AnimatedNumber value={issues.reduce((acc, i) => acc + (i.verificationsCount || 0), 0) + 1482} />
            </div>
            <p className="text-[9px] text-slate-500 font-mono">Citizen verifications</p>
          </div>

        </div>
      </motion.div>

      {/* 🛰 AI Mission Control Centerpiece */}
      <motion.div variants={widgetVariants} className="mb-8 relative z-10">
        <AiMissionControl userLocation={userLocation} />
      </motion.div>

      {/* Main Bottom Section: Left (Community updates and My reports), Right (User ranking progression) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
        
        {/* LEFT COLUMN: Feed lists */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Recent Community Updates list */}
          <motion.div variants={widgetVariants} className="glass-panel rounded-2xl border border-white/10 p-5 sm:p-6 bg-white/[0.02] backdrop-blur-xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-neon-purple animate-pulse" />
                <h2 className="font-display text-lg font-black text-white">Nearby Civic Incidents</h2>
              </div>
              <button
                onClick={() => onNavigate("map")}
                className="text-xs font-mono text-neon-cyan flex items-center gap-1 hover:underline cursor-pointer font-bold uppercase tracking-wider"
              >
                Open Map <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Empty State constraint */}
            {issues.length === 0 ? (
              <div className="py-12 px-6 text-center border border-white/5 rounded-2xl bg-white/[0.01] flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="font-display text-sm font-black text-white">No civic issues nearby</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                  That's great news! Our neighborhood is secure. If you notice something out of place, help your community by reporting it.
                </p>
                <button
                  onClick={() => onNavigate("report")}
                  className="mt-4 px-4 py-2 rounded-xl bg-neon-purple hover:bg-purple-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  📸 Report Issue
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {issues.slice(0, 4).map(issue => (
                  <div
                    key={issue.id}
                    onClick={() => onSelectIssue(issue)}
                    className="group bg-slate-950/40 hover:bg-slate-950/70 border border-white/5 hover:border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 cursor-pointer transition-all duration-200"
                  >
                    {/* Before Image Thumb */}
                    <div className="w-full sm:w-20 sm:h-20 h-28 rounded-xl bg-slate-950 shrink-0 overflow-hidden flex items-center justify-center border border-white/10 relative">
                      {issue.imageUrl ? (
                        <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="font-mono text-[10px] text-slate-500">{issue.category.substring(0, 3).toUpperCase()}</span>
                      )}
                      {issue.aiConfidence && (
                        <span className="absolute top-1 right-1 bg-neon-cyan text-slate-950 text-[7px] font-mono font-black px-1 rounded-sm uppercase tracking-tight shadow">
                          AI
                        </span>
                      )}
                    </div>

                    {/* Metadata thread */}
                    <div className="flex-grow min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-mono border ${getSeverityColor(issue.severity)}`}>
                            {issue.severity}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-mono border ${getStatusColor(issue.status)}`}>
                            {issue.status}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono ml-auto">
                            {new Date(issue.reportedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="font-display font-black text-xs sm:text-sm text-white group-hover:text-neon-cyan transition-colors truncate">
                          {issue.title}
                        </h4>
                        <p className="text-slate-400 text-xs mt-1 line-clamp-1 leading-normal">{issue.description}</p>
                      </div>

                      <div className="flex items-center gap-3.5 mt-3 text-[10.5px] text-slate-500 font-mono border-t border-white/5 pt-2">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-neon-purple" />
                          {issue.verificationsCount} verified sentinels
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-[150px] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400" /> {issue.address}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* My Submitted Reports */}
          <motion.div variants={widgetVariants} className="glass-panel rounded-2xl border border-white/10 p-5 sm:p-6 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-neon-cyan animate-pulse" />
              <h2 className="font-display text-lg font-black text-white">My Contribution Docket</h2>
            </div>

            <div className="space-y-3">
              {myReports.length === 0 ? (
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 text-center text-slate-500 font-mono text-xs flex flex-col items-center gap-2">
                  <p>You haven't filed any sentinel reports yet.</p>
                  <button
                    onClick={() => onNavigate("report")}
                    className="text-[10px] text-neon-cyan hover:underline font-black tracking-widest uppercase cursor-pointer"
                  >
                    + Log your first report
                  </button>
                </div>
              ) : (
                myReports.map(issue => (
                  <div
                    key={issue.id}
                    onClick={() => onSelectIssue(issue)}
                    className="bg-slate-950/30 border border-white/5 hover:border-white/10 rounded-xl p-3.5 flex justify-between items-center cursor-pointer hover:bg-slate-950/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-neon-purple/10 flex items-center justify-center text-neon-purple text-xs font-mono font-bold shrink-0">
                        {issue.category.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-display font-bold text-white truncate">{issue.title}</h4>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{issue.address}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono border shrink-0 ${getStatusColor(issue.status)}`}>
                      {issue.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>

        </div>

        {/* RIGHT COLUMN: Sentinel ranking progression */}
        <div className="lg:col-span-4 space-y-6">
          
          <motion.div variants={widgetVariants} className="glass-panel rounded-2xl border border-white/10 p-5 bg-white/[0.02] backdrop-blur-xl">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4.5 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-neon-purple to-neon-cyan flex items-center justify-center text-white font-display font-black text-lg shadow-[0_0_12px_rgba(168,85,247,0.35)]">
                {userProfile?.citizenLevel || 1}
              </div>
              <div className="text-left">
                <span className="text-[8px] font-mono text-neon-cyan font-black tracking-widest block uppercase">CITIZEN MONITOR RANK</span>
                <h4 className="font-display font-black text-sm text-white">Level {userProfile?.citizenLevel || 1} Sentinel</h4>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400 uppercase font-semibold">Reputation XP</span>
                <span className="text-neon-cyan font-black">{userProfile?.xp || 0} Points</span>
              </div>

              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-neon-purple to-neon-cyan h-2 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  style={{
                    width: `${Math.min(100, ((userProfile?.xp || 0) / (Math.pow(userProfile?.citizenLevel || 1, 2) * 500)) * 100)}%`
                  }}
                ></div>
              </div>

              <p className="text-[10.5px] text-slate-500 font-mono leading-relaxed mt-2.5">
                Increase your sentinel score by verifying neighbors' reports on the map (+25 XP) or reporting new public hazards (+50 XP).
              </p>
            </div>
          </motion.div>

          {/* Quick Contact Authority Emergency Center Shortcuts */}
          <motion.div variants={widgetVariants} className="glass-panel rounded-2xl border border-white/10 p-5 bg-white/[0.02]">
            <h3 className="text-white font-display font-black text-sm uppercase tracking-wide mb-4">🚨 Quick Hotline dispatch</h3>
            <div className="space-y-2">
              <a href="tel:100" className="p-3 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 rounded-xl flex items-center justify-between text-xs font-mono font-bold text-red-400 transition-colors">
                <span className="flex items-center gap-2">🚓 Police Control Room</span>
                <span>Dial 100 📞</span>
              </a>
              <a href="tel:108" className="p-3 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs font-mono font-bold text-amber-400 transition-colors">
                <span className="flex items-center gap-2">🚑 Medical Ambulance</span>
                <span>Dial 108 📞</span>
              </a>
              <a href="tel:101" className="p-3 bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/20 rounded-xl flex items-center justify-between text-xs font-mono font-bold text-orange-400 transition-colors">
                <span className="flex items-center gap-2">🚒 Fire Emergency Force</span>
                <span>Dial 101 📞</span>
              </a>
            </div>
          </motion.div>

        </div>

      </div>

      {/* Styled custom CSS marquee infinite slider animation */}
      <style>{`
        .marquee-outer {
          mask-image: linear-gradient(to right, transparent, white 20%, white 80%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, white 20%, white 80%, transparent);
        }
        .marquee-inner {
          display: inline-flex;
          animation: slideMarquee 45s linear infinite;
        }
        @keyframes slideMarquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .marquee-inner:hover {
          animation-play-state: paused;
        }
      `}</style>
    </motion.div>
  );
}
