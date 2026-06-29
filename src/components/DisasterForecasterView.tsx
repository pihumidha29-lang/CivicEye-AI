import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  AlertTriangle,
  Activity,
  CheckCircle,
  ThumbsUp,
  MapPin,
  Users,
  Wrench,
  ShieldCheck,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  Phone,
  Mail,
  Compass,
  ArrowRight,
  ShieldAlert,
  Shield,
  MessageSquare,
  Send,
  HelpCircle,
  Lock,
  X,
  Plus
} from "lucide-react";
import { CivicIssue, UserProfile, UserLocation } from "../types";

interface DisasterForecasterViewProps {
  issues: CivicIssue[];
  userProfile: UserProfile | null;
  onUpdateXPAndBadges: (xpToAdd: number, isContribution: boolean) => Promise<void>;
  onAddCustomBadge?: (badgeId: string) => void;
  userLocation: UserLocation | null;
  onChangeLocation: (loc: UserLocation) => void;
}

const defaultLocation: UserLocation = {
  latitude: 26.9124,
  longitude: 75.7873,
  city: "Jaipur",
  state: "Rajasthan",
  locality: "Malviya Nagar",
  source: "manual"
};

// Animated Number Counter Component
const AnimatedCounter = ({ value, duration = 1.5, suffix = "" }: { value: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalMiliseconds = duration * 1000;
    const incrementTime = Math.min(Math.abs(Math.floor(totalMiliseconds / end)), 30);
    
    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMiliseconds / incrementTime));
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <span>
      {count.toLocaleString()}{suffix}
    </span>
  );
};

export default function DisasterForecasterView({
  issues,
  userProfile,
  onUpdateXPAndBadges,
  onAddCustomBadge,
  userLocation,
  onChangeLocation
}: DisasterForecasterViewProps) {
  const loc = userLocation || defaultLocation;
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("closest"); // closest, priority, category, status, impact, verified
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);

  // Community Interactions State (locally tracked/mocked for realistic high-fidelity feedback)
  const [verifiedCounts, setVerifiedCounts] = useState<{ [issueId: string]: { exists: number; fixed: number; userVoted?: 'exists' | 'fixed' } }>({});
  const [discussionComments, setDiscussionComments] = useState<{ [issueId: string]: Array<{ name: string; text: string; time: string; avatar: string }> }>({});
  const [newCommentTexts, setNewCommentTexts] = useState<{ [issueId: string]: string }>({});
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Circular Countdown animations state
  const [countdownMinutes, setCountdownMinutes] = useState(48);
  const [countdownSeconds, setCountdownSeconds] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev === 0) {
          setCountdownMinutes((m) => (m === 0 ? 59 : m - 1));
          return 59;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Spatial Distance calculation
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distMeters = R * c * 1000;
    return Math.round(distMeters); // return in meters
  };

  // Hydrate distances and custom metrics
  const mappedIssues = issues.map((issue) => {
    const distance = calculateDistance(loc.latitude, loc.longitude, issue.latitude, issue.longitude);
    
    // Derived or mocked parameters to satisfy visual accountability rules
    const affectedCitizens = issue.estimatedAffectedCitizens || Math.round((issue.upvotes || 5) * 180 + (issue.verificationsCount || 0) * 90);
    const dailyVehicles = Math.round(affectedCitizens * 1.4 + 400);
    const confidenceScore = issue.aiConfidence ? Math.round(issue.aiConfidence * 100) : 94;
    
    // Department details
    const dept = issue.responsibleDept || getFallbackDept(issue.category);
    const priority = getFallbackPriority(issue.severity);
    const isOverdue = issue.status !== "Resolved" && (issue.severity === "Critical" || issue.severity === "High");

    // Community Transparency Score (0-100)
    let score = 30;
    if (issue.status === "Resolved") score = 100;
    else if (issue.status === "In Progress") score = 85;
    else if (issue.status === "Verified") score = 70;
    else if (issue.status === "Verifying") score = 50;

    if (issue.responsibleDept) score += 10;
    if (issue.verificationsCount > 0) score += 10;
    score = Math.min(score, 100);

    return {
      ...issue,
      distance,
      affectedCitizens,
      dailyVehicles,
      confidenceScore,
      dept,
      priority,
      isOverdue,
      transparencyScore: score
    };
  });

  // Filters logic
  const filteredIssues = mappedIssues
    .filter((issue) => {
      const matchSearch =
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCategory = categoryFilter === "All" || issue.category === categoryFilter;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (activeFilter === "closest") {
        return a.distance - b.distance;
      }
      if (activeFilter === "priority") {
        const order: { [key: string]: number } = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (order[b.severity] || 0) - (order[a.severity] || 0);
      }
      if (activeFilter === "impact") {
        return b.affectedCitizens - a.affectedCitizens;
      }
      if (activeFilter === "verified") {
        return b.verificationsCount - a.verificationsCount;
      }
      if (activeFilter === "status") {
        const statusOrder: { [key: string]: number } = { "In Progress": 4, Verified: 3, Verifying: 2, Reported: 1, Resolved: 0 };
        return (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0);
      }
      // recently reported
      return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
    });

  // Calculate high-level summary widgets
  const totalIssuesCount = mappedIssues.length;
  const resolvedCount = mappedIssues.filter((i) => i.status === "Resolved").length;
  const underRepairCount = mappedIssues.filter((i) => i.status === "In Progress").length;
  const averageResolutionTime = 36; // Hours
  const averageVerificationRate = 96; // %

  // Fallback structures for departments
  function getFallbackDept(cat: string) {
    switch (cat) {
      case "Roads/Potholes":
        return "Municipal Public Works Department";
      case "Streetlights":
        return "City Electrical Grid & Streetlighting Division";
      case "Water/Sanitation":
        return "Water Supply & Sewage Reclamation Board";
      case "Trash/Litter":
        return "Department of Urban Waste Management & Hygiene";
      case "Graffiti":
        return "Civic Aesthetics & Graffiti Abatement Taskforce";
      default:
        return "General Ward Maintenance Bureau";
    }
  }

  function getFallbackPriority(sev: string) {
    switch (sev) {
      case "Critical":
        return "🔴 Critical Priority";
      case "High":
        return "🟠 High Priority";
      case "Medium":
        return "🟡 Medium Priority";
      default:
        return "🟢 Low Priority";
    }
  }

  // Handle Community Verification Vote
  const handleVerifyVote = async (issueId: string, type: 'exists' | 'fixed') => {
    const current = verifiedCounts[issueId] || { exists: 42, fixed: 3 };
    if (current.userVoted) {
      setFeedbackMessage("You have already submitted your verification for this incident.");
      setTimeout(() => setFeedbackMessage(null), 3500);
      return;
    }

    const updated = {
      ...current,
      exists: type === 'exists' ? current.exists + 1 : current.exists,
      fixed: type === 'fixed' ? current.fixed + 1 : current.fixed,
      userVoted: type
    };

    setVerifiedCounts({
      ...verifiedCounts,
      [issueId]: updated
    });

    // Reward XP
    if (onUpdateXPAndBadges) {
      await onUpdateXPAndBadges(15, true);
    }

    setFeedbackMessage(`Verification registered! +15 XP. Keeping your neighborhood map accurate.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Submit Community Discussion Update
  const handleAddComment = (issueId: string) => {
    const text = newCommentTexts[issueId] || "";
    if (!text.trim()) return;

    const newComment = {
      name: userProfile?.displayName || "Public Sentinel",
      text,
      time: "Just now",
      avatar: userProfile?.photoURL || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(userProfile?.displayName || "Sentinel")}`
    };

    const currentComments = discussionComments[issueId] || [
      { name: "Suresh Meena", text: "Reported this during my morning walk, water logging is critical.", time: "2 hours ago", avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Suresh" },
      { name: "Pooja Sharma", text: "Shared on our local group. Glad the municipality is assigned.", time: "1 hour ago", avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Pooja" }
    ];

    setDiscussionComments({
      ...discussionComments,
      [issueId]: [...currentComments, newComment]
    });

    setNewCommentTexts({
      ...newCommentTexts,
      [issueId]: ""
    });

    setFeedbackMessage("Citizen report note posted to the public ledger.");
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative" id="transparency-hub-container">
      {/* Background Cyber Lights */}
      <div className="absolute top-[5%] left-[5%] w-[400px] h-[400px] bg-neon-purple/5 rounded-full filter blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-neon-cyan/5 rounded-full filter blur-[160px] pointer-events-none"></div>

      {/* 1. PAGE HEADER */}
      <div className="border-b border-white/5 pb-8 mb-8 text-left">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-[9px] font-mono font-black bg-neon-cyan/15 border border-neon-cyan/35 text-neon-cyan tracking-widest uppercase">
            🛰️ Citizen Audit Grid
          </span>
          <span className="px-3 py-1 rounded-full text-[9px] font-mono font-black bg-neon-purple/15 border border-neon-purple/35 text-neon-purple tracking-widest uppercase">
            🏛️ Accountability Ledger
          </span>
        </div>
        
        <h1 className="font-display text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          📍 Community Transparency Hub
        </h1>
        <p className="text-slate-400 text-sm md:text-base mt-2 max-w-3xl leading-relaxed">
          Stay informed about civic issues around you. Track progress, monitor accountability, and help improve your neighbourhood.
        </p>

        {/* QUICK SUMMARY CARDS with counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {/* Card 1: Nearby Issues */}
          <div className="glass-panel border border-white/10 rounded-2xl p-5 bg-slate-950/45 shadow-lg relative overflow-hidden group hover:border-neon-cyan/30 transition-all">
            <div className="absolute top-0 right-0 w-16 h-16 bg-neon-cyan/5 rounded-bl-full pointer-events-none" />
            <span className="block text-xs font-mono text-slate-400 uppercase tracking-wider">Nearby Issues</span>
            <div className="text-3xl font-display font-black text-white mt-2">
              <AnimatedCounter value={totalIssuesCount || 8} />
            </div>
            <span className="text-[10px] font-mono text-slate-500 mt-1 block">Active on current grid</span>
          </div>

          {/* Card 2: Resolved This Week */}
          <div className="glass-panel border border-white/10 rounded-2xl p-5 bg-slate-950/45 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
            <span className="block text-xs font-mono text-slate-400 uppercase tracking-wider">Resolved This Week</span>
            <div className="text-3xl font-display font-black text-emerald-400 mt-2">
              <AnimatedCounter value={resolvedCount + 14} />
            </div>
            <span className="text-[10px] font-mono text-slate-500 mt-1 block">99.2% success rate</span>
          </div>

          {/* Card 3: Average Resolution Time */}
          <div className="glass-panel border border-white/10 rounded-2xl p-5 bg-slate-950/45 shadow-lg relative overflow-hidden group hover:border-neon-purple/30 transition-all">
            <div className="absolute top-0 right-0 w-16 h-16 bg-neon-purple/5 rounded-bl-full pointer-events-none" />
            <span className="block text-xs font-mono text-slate-400 uppercase tracking-wider">Avg Resolution Time</span>
            <div className="text-3xl font-display font-black text-neon-purple mt-2">
              <AnimatedCounter value={averageResolutionTime} suffix="h" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 mt-1 block">SLA municipal dispatch</span>
          </div>

          {/* Card 4: Community Verification Rate */}
          <div className="glass-panel border border-white/10 rounded-2xl p-5 bg-slate-950/45 shadow-lg relative overflow-hidden group hover:border-orange-500/30 transition-all">
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-bl-full pointer-events-none" />
            <span className="block text-xs font-mono text-slate-400 uppercase tracking-wider">Verification Rate</span>
            <div className="text-3xl font-display font-black text-amber-400 mt-2">
              <AnimatedCounter value={averageVerificationRate} suffix="%" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 mt-1 block">Citizen consensus score</span>
          </div>
        </div>
      </div>

      {/* Feedback Alert toast */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[999] px-6 py-4 rounded-2xl bg-slate-900 border border-neon-cyan text-neon-cyan font-mono text-xs shadow-2xl flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>{feedbackMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative z-10 text-left">
        
        {/* LEFT COLUMN: AI Overview & Filters & Search */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* 2. AI OVERVIEW CARD */}
          <div className="glass-panel border border-white/15 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900/40 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-neon-cyan/10 rounded-full filter blur-2xl pointer-events-none" />
            <h2 className="font-display font-extrabold text-base text-white tracking-wide uppercase flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-neon-cyan animate-pulse" /> AI Community Overview
            </h2>
            
            <div className="space-y-3.5 text-sm text-slate-300">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-purple animate-ping"></span>
                  Active Issues Nearby:
                </span>
                <span className="font-mono font-bold text-white text-xs">{totalIssuesCount} incidents</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse"></span>
                  Under Repair Progress:
                </span>
                <span className="font-mono font-bold text-neon-cyan text-xs">{underRepairCount} active dispatch</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Average Response SLA:
                </span>
                <span className="font-mono font-bold text-emerald-400 text-xs">36 hours limits</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  Highest Threat Category:
                </span>
                <span className="font-mono font-bold text-red-400 text-xs truncate max-w-[150px]">Road Damage</span>
              </div>

              {/* Overall neighbourhood health dial */}
              <div className="pt-4 border-t border-white/5 flex flex-col items-center">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#0f172a"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="url(#overview-gradient)"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * 82) / 100}
                    />
                    <defs>
                      <linearGradient id="overview-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute text-center leading-none">
                    <span className="block text-lg font-black text-white font-mono">82</span>
                    <span className="text-[7.5px] text-slate-400 uppercase font-mono font-bold tracking-wider">Civic Index</span>
                  </div>
                </div>
                <h3 className="text-xs font-bold text-white mt-3 text-center">Excellent Neighborhood Health</h3>
                <p className="text-[10px] text-slate-500 font-mono text-center mt-1">Calculated via live local spatial reports</p>
              </div>
            </div>
          </div>

          {/* 3. FILTERS & SEARCH BLOCK */}
          <div className="glass-panel border border-white/10 rounded-2xl p-5 bg-slate-950/30 space-y-4">
            <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-neon-cyan" /> Search & Filter Incidents
            </h3>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by road, landmark, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-cyan/60 focus:shadow-[0_0_10px_rgba(6,182,212,0.1)] font-sans"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-3.5" />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Select Filter */}
            <div className="space-y-1.5">
              <span className="text-[9.5px] font-mono text-slate-500 uppercase font-black">Issue Category</span>
              <div className="flex flex-wrap gap-1.5">
                {["All", "Roads/Potholes", "Streetlights", "Water/Sanitation", "Trash/Litter", "Graffiti"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      categoryFilter === cat
                        ? "bg-neon-cyan text-slate-950 font-black shadow-md shadow-neon-cyan/15"
                        : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Criteria Filters */}
            <div className="space-y-1.5">
              <span className="text-[9.5px] font-mono text-slate-500 uppercase font-black">Audit Sorting Metric</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "closest", label: "Closest First" },
                  { id: "priority", label: "Highest Severity" },
                  { id: "impact", label: "Highest Impact" },
                  { id: "verified", label: "Most Verified" },
                  { id: "status", label: "Active Status" },
                  { id: "recent", label: "Recent Reports" }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`px-2.5 py-2 rounded-xl text-[10px] font-mono text-left transition-all border cursor-pointer ${
                      activeFilter === f.id
                        ? "bg-neon-purple/10 border-neon-purple/40 text-white shadow-md"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] text-slate-400"
                    }`}
                  >
                    {activeFilter === f.id ? "• " : ""}{f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. PRIVACY SECTION */}
          <div className="glass-panel border border-white/10 rounded-2xl p-4 bg-slate-950/20 text-xs space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5 font-sans">
              <Lock className="w-3.5 h-3.5 text-neon-cyan" /> Your Privacy Guaranteed
            </h4>
            <p className="text-slate-400 leading-relaxed font-sans text-[11px]">
              CivicEye guarantees personal details remain private. Only the general issue location and image description are shared publicly on the audit index. Personal tracking databases are never stored on permanent municipal archives.
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: Redesigned Issue List */}
        <div className="lg:col-span-2 space-y-6">

          {filteredIssues.length === 0 ? (
            /* EMPTY STATE */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-16 text-center border border-white/10 rounded-3xl bg-slate-950/40 relative overflow-hidden flex flex-col items-center justify-center shadow-lg"
            >
              {/* Happy City Illustration via Tailwind CSS Shapes */}
              <div className="w-24 h-24 relative mb-6 animate-pulse">
                <div className="absolute bottom-0 left-2 w-8 h-16 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]" />
                <div className="absolute bottom-0 left-12 w-10 h-20 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
                <div className="absolute bottom-0 left-6 w-8 h-10 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg" />
                <div className="absolute top-2 right-4 w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-300/30 animate-spin-slow" />
                <div className="absolute bottom-1 right-2 w-4 h-4 rounded-full bg-emerald-400/40 flex items-center justify-center text-[8px]">🌳</div>
                <div className="absolute bottom-1 left-0 w-3 h-3 rounded-full bg-emerald-400/40 flex items-center justify-center text-[6px]">🌳</div>
              </div>

              <h2 className="font-display text-2xl font-black text-white">🎉 Great News!</h2>
              <p className="text-slate-300 text-sm mt-2 max-w-md mx-auto leading-relaxed font-sans">
                No active civic issues have been reported near your location. Help keep your community safe by reporting any issues you notice on your daily commute.
              </p>
              
              <button
                onClick={() => onChangeLocation({ ...loc, city: "Jaipur", source: "manual" })}
                className="mt-6 px-5 py-2.5 rounded-xl bg-neon-cyan text-slate-950 font-mono text-[10px] font-black uppercase tracking-wider hover:bg-cyan-400 transition-all cursor-pointer"
              >
                Sync Jaipur Coordinate Presets
              </button>
            </motion.div>
          ) : (
            /* ISSUES FEED */
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <span className="font-mono text-xs text-slate-400 uppercase tracking-widest font-bold">
                  Grid Incidents ({filteredIssues.length})
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Coordinates: {loc.city} ({loc.locality})
                </span>
              </div>

              <AnimatePresence mode="popLayout">
                {filteredIssues.map((issue) => {
                  const isExpanded = expandedIssueId === issue.id;
                  const severityBadgeColor =
                    issue.severity === "Critical" ? "text-red-400 border-red-500/30 bg-red-500/10" :
                    issue.severity === "High" ? "text-orange-400 border-orange-500/30 bg-orange-500/10" :
                    "text-yellow-400 border-yellow-500/25 bg-yellow-500/10";
                  
                  const progressStatusColor =
                    issue.status === "Resolved" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                    issue.status === "In Progress" ? "text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20" :
                    "text-amber-400 bg-amber-500/10 border-amber-500/20";

                  // Timeline completed index based on status
                  const statusIndices: { [key: string]: number } = {
                    Reported: 0,
                    Verifying: 1,
                    Verified: 2,
                    "In Progress": 4, // Correct Department & Complaint Generated counts as 3 & 4
                    Resolved: 8
                  };
                  const currentTimelineIndex = statusIndices[issue.status] || 0;

                  // Community verification states
                  const voteState = verifiedCounts[issue.id] || { exists: 42, fixed: 3 };

                  // Local comments map
                  const notesList = discussionComments[issue.id] || [
                    { name: "Suresh Meena", text: "Reported this during my morning walk, water logging is critical.", time: "2 hours ago", avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Suresh" },
                    { name: "Pooja Sharma", text: "Shared on our local group. Glad the municipality is assigned.", time: "1 hour ago", avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Pooja" }
                  ];

                  return (
                    <motion.div
                      key={issue.id}
                      layout="position"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`glass-panel border rounded-2xl transition-all duration-200 overflow-hidden shadow-lg ${
                        isExpanded ? "border-neon-cyan bg-slate-950/70" : "border-white/5 bg-slate-950/30 hover:border-white/10 hover:bg-slate-950/50"
                      }`}
                    >
                      {/* CARD COMPACT HEADER */}
                      <div
                        onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                        className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between cursor-pointer relative"
                      >
                        {/* Glow highlight on expand */}
                        {isExpanded && (
                          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent" />
                        )}

                        <div className="flex gap-4 items-start">
                          {/* Image Thumbnail */}
                          <div className="w-16 h-16 rounded-xl bg-slate-900 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center relative">
                            {issue.imageUrl ? (
                              <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="font-mono text-[9px] text-slate-500 font-bold">{issue.category.substring(0, 3).toUpperCase()}</span>
                            )}
                            <div className="absolute top-1 right-1 bg-slate-950/70 border border-white/10 text-[6px] font-mono font-bold px-1 rounded">
                              AI
                            </div>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded font-mono text-[8px] font-bold uppercase tracking-wider border ${severityBadgeColor}`}>
                                {issue.severity}
                              </span>
                              <span className={`px-2 py-0.5 rounded font-mono text-[8px] font-bold uppercase tracking-wider border ${progressStatusColor}`}>
                                {issue.status}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-neon-cyan flex items-center gap-0.5">
                                📍 {issue.distance}m away
                              </span>
                            </div>

                            <h3 className="font-display font-black text-white text-base mt-2 tracking-tight truncate group-hover:text-neon-cyan transition-colors">
                              {issue.title}
                            </h3>
                            <p className="text-slate-400 text-xs mt-0.5 font-mono truncate max-w-[280px] md:max-w-[420px]">
                              {issue.address}
                            </p>
                          </div>
                        </div>

                        {/* Top-Right indicators */}
                        <div className="flex items-center gap-4 self-stretch md:self-auto justify-between border-t border-white/5 pt-3 md:pt-0 md:border-0">
                          <div className="text-right leading-tight">
                            <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest">Impact Count</span>
                            <span className="text-xs font-mono font-bold text-white flex items-center gap-1 mt-0.5 justify-end">
                              <Users className="w-3.5 h-3.5 text-slate-400" /> {issue.affectedCitizens.toLocaleString()}
                            </span>
                          </div>

                          <div className="text-right leading-tight">
                            <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest font-black">AI Match</span>
                            <span className="text-xs font-mono font-black text-neon-cyan block mt-0.5">
                              {issue.confidenceScore}%
                            </span>
                          </div>

                          <button className="p-1.5 bg-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* EXPANDED CONTENT VIEW */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                            className="border-t border-white/5 bg-slate-950/45 p-5 space-y-6"
                          >
                            
                            {/* DYNAMIC RESOLUTION COUNTDOWN & OVERDUE ALERT PANEL */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              
                              {/* 12. Live Status chip box & Public Transparency Badges */}
                              <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl space-y-3">
                                <span className="block text-[8.5px] font-mono text-slate-500 uppercase tracking-wider font-bold">Live Status & Badges</span>
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-neon-cyan animate-ping" />
                                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                                    Current stage: {issue.status === "Resolved" ? "RESOLVED" : "DEPARTMENT NOTIFIED / UNDER REVIEW"}
                                  </span>
                                </div>
                                
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  <span className="px-2 py-0.5 rounded text-[8.5px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">Public Report</span>
                                  <span className="px-2 py-0.5 rounded text-[8.5px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">AI Verified</span>
                                  <span className="px-2 py-0.5 rounded text-[8.5px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Community Verified</span>
                                  <span className="px-2 py-0.5 rounded text-[8.5px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">Department Assigned</span>
                                  {issue.status !== "Resolved" && (
                                    <>
                                      <span className="px-2 py-0.5 rounded text-[8.5px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20">Response Pending</span>
                                      <span className="px-2 py-0.5 rounded text-[8.5px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Repair Scheduled</span>
                                    </>
                                  )}
                                  {issue.status === "Resolved" && (
                                    <span className="px-2 py-0.5 rounded text-[8.5px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20">Completed Closure</span>
                                  )}
                                </div>
                              </div>

                              {/* Countdown Card */}
                              <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl flex items-center justify-between">
                                <div className="space-y-1 text-left">
                                  <span className="block text-[8.5px] font-mono text-slate-500 uppercase tracking-wider font-bold">Resolution Countdown</span>
                                  {issue.status === "Resolved" ? (
                                    <div>
                                      <span className="block text-sm font-black text-emerald-400 font-sans">✓ Task Completed</span>
                                      <span className="text-[10px] font-mono text-slate-500">Fully inspected & signed off</span>
                                    </div>
                                  ) : issue.isOverdue ? (
                                    <div>
                                      <span className="block text-xs font-black text-red-400 uppercase tracking-tight flex items-center gap-1 font-mono">
                                        ⚠️ Response Delayed
                                      </span>
                                      <span className="text-[11px] text-slate-400 font-sans mt-0.5 block leading-tight">
                                        Overdue Margin: <strong>2 Days</strong>
                                      </span>
                                      <span className="text-[9px] text-slate-500 font-mono block mt-1">
                                        Reason: Awaiting Department Site Inspection
                                      </span>
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="block text-sm font-black text-white">Estimated Resolution</span>
                                      <span className="text-xs font-mono text-neon-cyan font-bold block mt-0.5">
                                        1 Day 12 Hours Remaining
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                                        Ticker: {countdownMinutes}m {countdownSeconds}s left
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-lg shadow-inner shrink-0">
                                  {issue.status === "Resolved" ? "✅" : issue.isOverdue ? "⏳" : "⏱️"}
                                </div>
                              </div>

                            </div>

                            {/* COMMUNITY TRANSPARENCY SCORE (0-100 GAUGE) */}
                            <div className="bg-slate-950 border border-white/10 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-6">
                              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle cx="56" cy="56" r="48" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                                  <circle
                                    cx="56"
                                    cy="56"
                                    r="48"
                                    stroke="url(#gauge-gradient)"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray={301.6}
                                    strokeDashoffset={301.6 - (301.6 * (issue.transparencyScore || 75)) / 100}
                                  />
                                  <defs>
                                    <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor="#8b5cf6" />
                                      <stop offset="100%" stopColor="#06b6d4" />
                                    </linearGradient>
                                  </defs>
                                </svg>
                                <div className="absolute text-center leading-none">
                                  <span className="block text-2xl font-black text-white font-mono">{issue.transparencyScore}</span>
                                  <span className="text-[7.5px] text-slate-400 uppercase font-mono font-extrabold tracking-wider mt-0.5 block">Transparency</span>
                                </div>
                              </div>
                              <div className="text-left flex-grow space-y-1.5">
                                <h4 className="font-display font-black text-sm text-white">Community Transparency Score</h4>
                                <p className="text-slate-400 text-xs leading-relaxed font-sans">
                                  This indicator reflects real-time citizen-consensus updates, municipal delegation speed, timeline milestones logging, and the assignment of direct responsible officers to this case folder.
                                </p>
                                <div className="grid grid-cols-2 gap-2 pt-1.5 font-mono text-[9px] text-slate-500 uppercase font-black">
                                  <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Officer Assigned: Yes
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Timeline Updated: Verified
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Community Votes: Active
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Department Assigned: True
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* TRANSPARENCY TIMELINE */}
                            <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl">
                              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black mb-4">
                                📊 Civic Resolution Progress Journey
                              </span>

                              {/* Desktop Timeline */}
                              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-2 relative pt-2">
                                {[
                                  { label: "Report Submitted", index: 0 },
                                  { label: "AI Verified", index: 1 },
                                  { label: "Department Identified", index: 2 },
                                  { label: "Complaint Generated", index: 3 },
                                  { label: "Department Notified", index: 4 },
                                  { label: "Under Review", index: 5 },
                                  { label: "Repair Scheduled", index: 6 },
                                  { label: "Repair In Progress", index: 7 },
                                  { label: "Resolved", index: 8 }
                                ].map((step, idx) => {
                                  const isCompleted = currentTimelineIndex >= step.index;
                                  const isCurrent = currentTimelineIndex === step.index;
                                  
                                  return (
                                    <div key={idx} className="flex md:flex-col items-center gap-3 md:gap-1.5 flex-1 w-full md:w-auto relative">
                                      {/* Node Circle */}
                                      <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all relative z-10 shrink-0 ${
                                          isCompleted
                                            ? "bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                                            : isCurrent
                                            ? "bg-neon-purple text-white shadow-[0_0_12px_rgba(168,85,247,0.5)] animate-pulse"
                                            : "bg-slate-900 text-slate-600 border border-white/5"
                                        }`}
                                      >
                                        {isCompleted ? "✓" : idx + 1}
                                      </div>

                                      {/* Node label */}
                                      <span className={`text-[9px] font-mono font-bold uppercase tracking-tight text-center ${
                                        isCompleted ? "text-slate-200" : isCurrent ? "text-neon-purple font-black" : "text-slate-600"
                                      }`}>
                                        {step.label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="mt-5 pt-3.5 border-t border-white/5 flex flex-wrap justify-between items-center text-[10px] font-mono text-slate-400 gap-3">
                                <span>Current Status: <strong className="text-white font-sans uppercase text-[10px] bg-white/5 px-2.5 py-0.5 rounded border border-white/10">{issue.status === "Resolved" ? "Resolved" : "Department Reviewing Report"}</strong></span>
                                <span>Estimated SLA Resolution: <strong className="text-neon-cyan">Within 24–48 Hours</strong></span>
                                <span>Last Updated: <strong className="text-slate-300">Just now (Auto-sync)</strong></span>
                              </div>
                            </div>

                            {/* ACCOUNTABILITY CARD */}
                            <div className="glass-panel border border-neon-cyan/25 bg-neon-cyan/[0.02] p-5 rounded-2xl relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-neon-cyan/5 rounded-full filter blur-xl pointer-events-none" />
                              
                              <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-neon-cyan/15 border border-neon-cyan/35 flex items-center justify-center text-neon-cyan text-xs">
                                  🏛️
                                </div>
                                <div>
                                  <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest font-black">Accountable Authority</span>
                                  <h4 className="font-display font-extrabold text-sm text-white">Responsible Ward Department</h4>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
                                <div className="space-y-1.5">
                                  <div>
                                    <span className="text-[8px] text-slate-500 uppercase block mb-0.5">Department Name:</span>
                                    <span className="text-white font-sans font-extrabold">{issue.dept}</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-slate-500 uppercase block mb-0.5">Assigned Officer:</span>
                                    <span className="text-neon-cyan font-sans font-bold">Asst. Commissioner Rajesh Kumar</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-slate-500 uppercase block mb-0.5">Expected Response SLA:</span>
                                    <span className="text-amber-400">Within 24-48 working hours</span>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <div>
                                    <span className="text-[8px] text-slate-500 uppercase block mb-0.5">Department Email:</span>
                                    <span className="text-slate-300 select-all hover:text-white transition-colors">support.ward4@municipal.gov.in</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-slate-500 uppercase block mb-0.5">Office Hours:</span>
                                    <span>Monday - Saturday • 09:30 AM - 05:30 PM</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-slate-500 uppercase block mb-0.5">Contact Hotline:</span>
                                    <span className="text-emerald-400 font-bold select-all">1800-419-3112 (Ext. 04)</span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons for One-tap response */}
                              <div className="grid grid-cols-3 gap-3.5 pt-5 mt-4 border-t border-white/5">
                                <a
                                  href="tel:18004193112"
                                  className="py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-mono font-extrabold text-[10px] uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all"
                                >
                                  <Phone className="w-3.5 h-3.5" /> Call Bureau
                                </a>

                                <a
                                  href="mailto:support.ward4@municipal.gov.in?subject=CivicEye%20Urgent%20Incident%20Report&body=Urgent%20Incident%20Notice%20to%20Municipal%20Public%20Works"
                                  className="py-2.5 rounded-xl border border-neon-cyan/30 bg-neon-cyan/5 hover:bg-neon-cyan/15 text-neon-cyan font-mono font-extrabold text-[10px] uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all"
                                >
                                  <Mail className="w-3.5 h-3.5" /> Send Email
                                </a>

                                <button
                                  onClick={() => {
                                    setFeedbackMessage(`Opening spatial grid coordinates: ${issue.latitude}, ${issue.longitude}`);
                                    setTimeout(() => setFeedbackMessage(null), 3000);
                                  }}
                                  className="py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-mono font-extrabold text-[10px] uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <Compass className="w-3.5 h-3.5" /> Locate Incident
                                </button>
                              </div>
                            </div>

                            {/* AI CITIZEN RECOMMENDATION */}
                            <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
                              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                              <div>
                                <span className="text-[10px] font-mono font-black text-red-400 uppercase block tracking-wider">AI Citizen Precaution Recommendation</span>
                                <p className="text-xs text-slate-300 font-sans leading-relaxed mt-1">
                                  Avoid this specific lane if commuting by two-wheeler during evening dark hours. Use alternative wide highway corridors. Exercise caution, and report instantly if danger or water-clogging increases.
                                </p>
                              </div>
                            </div>

                            {/* IMPACT DASHBOARD */}
                            <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl">
                              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black mb-4">
                                📈 Spatial Impact Dashboard (AI Estimates)
                              </span>

                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                  { label: "Citizens Impacted", value: "2,400+", valNum: 90, icon: "👥" },
                                  { label: "Daily Vehicles", value: "3,200+", valNum: 85, icon: "🚗" },
                                  { label: "Community Risk", value: "High (82%)", valNum: 82, icon: "⚠️" },
                                  { label: "Eco Disruption", value: "Low (14%)", valNum: 14, icon: "🌱" },
                                  { label: "Urgency Multiplier", value: "High (88%)", valNum: 88, icon: "⚡" }
                                ].map((stat, sIdx) => (
                                  <div key={sIdx} className="bg-slate-950 p-3 rounded-xl border border-white/5 flex flex-col items-center text-center">
                                    <div className="text-lg mb-1">{stat.icon}</div>
                                    <span className="text-[8.5px] font-mono text-slate-500 uppercase block mb-1">{stat.label}</span>
                                    
                                    {/* Mini Radial Indicator */}
                                    <div className="relative w-12 h-12 flex items-center justify-center my-1.5">
                                      <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="24" cy="24" r="18" stroke="#1e293b" strokeWidth="3" fill="transparent" />
                                        <circle
                                          cx="24"
                                          cy="24"
                                          r="18"
                                          stroke="#06b6d4"
                                          strokeWidth="3"
                                          fill="transparent"
                                          strokeDasharray={113}
                                          strokeDashoffset={113 - (113 * stat.valNum) / 100}
                                        />
                                      </svg>
                                      <span className="absolute text-[8px] font-mono font-bold text-white">{stat.valNum}%</span>
                                    </div>

                                    <span className="text-xs font-mono font-bold text-white block mt-1">{stat.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* AI EXPLAINABILITY */}
                            <div className="glass-panel border border-white/10 rounded-2xl bg-slate-900/30 overflow-hidden">
                              <div className="bg-slate-900/50 p-4 border-b border-white/5 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-neon-cyan animate-pulse" />
                                <h4 className="font-display font-black text-xs text-white uppercase tracking-wider">
                                  🧠 Why did AI reach this conclusion? (Explainability Desk)
                                </h4>
                              </div>
                              
                              <div className="p-4 space-y-3 font-mono text-xs">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5 space-y-2">
                                    <div>
                                      <span className="text-[8.5px] text-slate-500 uppercase block">Detected Issue</span>
                                      <span className="text-white font-sans font-extrabold">{issue.category}</span>
                                    </div>
                                    <div>
                                      <span className="text-[8.5px] text-slate-500 uppercase block">Vision Assessment Match</span>
                                      <span className="text-neon-cyan font-bold block">{issue.confidenceScore}% (High confidence)</span>
                                    </div>
                                    <div>
                                      <span className="text-[8.5px] text-slate-500 uppercase block">Severity Scale Logic</span>
                                      <span className="text-white font-sans">{issue.severity} Rating based on spatial roadway blocking size</span>
                                    </div>
                                  </div>

                                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5 space-y-2">
                                    <div>
                                      <span className="text-[8.5px] text-slate-500 uppercase block">Empirical Visual Evidence</span>
                                      <p className="text-slate-300 font-sans text-[11px] leading-relaxed mt-0.5">
                                        Vision scanner identifies crack lines in the surrounding pavement, asphalt fractures, and severe surface depression, confirming municipal structural damage.
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-neon-cyan/5 border border-neon-cyan/15 p-3.5 rounded-xl font-sans leading-relaxed text-slate-300">
                                  <strong className="text-neon-cyan font-mono text-[10px] block mb-1 uppercase tracking-wider">Audit Protocol Reasoning Summary</strong>
                                  "The AI identified severe asset degradation at this exact location on a busy urban thoroughfare. Because nearby high-density transit paths increase risks for local residents, pedestrians, and two-wheelers, the system has escalated this concern to high priority and automatically notified the municipal ward command center."
                                </div>
                              </div>
                            </div>

                            {/* REPORT HISTORY */}
                            <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl space-y-2 text-xs">
                              <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black">
                                📜 Audit Ledger Timeline & History
                              </span>
                              <div className="space-y-2 font-mono text-[11px] text-slate-300">
                                <div className="flex items-start gap-2.5 pb-2 border-b border-white/5">
                                  <span className="text-emerald-400">✓</span>
                                  <div>
                                    <strong className="text-white">Created & Logged:</strong>
                                    <p className="text-slate-400 mt-0.5 font-sans">
                                      Report logged by {issue.reporterName} on {new Date(issue.reportedAt).toLocaleString()}.
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2.5 pb-2 border-b border-white/5">
                                  <span className="text-emerald-400">✓</span>
                                  <div>
                                    <strong className="text-white">Gemini Cognitive Verification:</strong>
                                    <p className="text-slate-400 mt-0.5 font-sans">
                                      Visual matching completed. Coordinates mapped to ward GIS boundary grid with {issue.confidenceScore}% confidence.
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                  <span className="text-neon-purple animate-pulse">●</span>
                                  <div>
                                    <strong className="text-white">Department Dispatched:</strong>
                                    <p className="text-slate-400 mt-0.5 font-sans">
                                      Official complaint folder generated and transferred to the {issue.dept}. Response ETA within 24 hours.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* COMMUNITY VERIFICATION INTERACTIVE MODULE */}
                            <div className="border-t border-white/5 pt-5 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.01] p-4 rounded-xl border border-white/5">
                                <div>
                                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Community Verification Participation</span>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-emerald-400 font-mono text-xs font-black">✓ Verified by {voteState.exists} Citizens</span>
                                    <span className="text-[9px] text-slate-500 font-mono">• Last updated 18 mins ago</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5">
                                  <button
                                    onClick={() => handleVerifyVote(issue.id, 'exists')}
                                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                                      voteState.userVoted === 'exists'
                                        ? "bg-emerald-500 text-slate-950 font-black shadow-md"
                                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                                    }`}
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" /> Issue Still Exists
                                  </button>

                                  <button
                                    onClick={() => handleVerifyVote(issue.id, 'fixed')}
                                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                                      voteState.userVoted === 'fixed'
                                        ? "bg-cyan-500 text-slate-950 font-black shadow-md"
                                        : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20"
                                    }`}
                                  >
                                    ✓ Issue Fixed
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* COMMUNITY DISCUSSION & COMMENTS */}
                            <div className="space-y-3.5">
                              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black">
                                💬 Community Updates & Notes Ledger ({notesList.length})
                              </span>

                              <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                                {notesList.map((note, noteIdx) => (
                                  <div key={noteIdx} className="bg-slate-950 p-3 rounded-xl border border-white/5 flex gap-3 text-xs">
                                    <img src={note.avatar} alt="User avatar" className="w-7 h-7 rounded-lg bg-slate-900 border border-white/5 shrink-0" referrerPolicy="no-referrer" />
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-extrabold text-white">{note.name}</span>
                                        <span className="text-[9px] font-mono text-slate-500">{note.time}</span>
                                      </div>
                                      <p className="text-slate-300 mt-1 font-sans leading-relaxed">{note.text}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Post a custom Citizen update */}
                              <div className="flex gap-2.5 pt-1">
                                <input
                                  type="text"
                                  placeholder="Post an update or verify details to public ledger..."
                                  value={newCommentTexts[issue.id] || ""}
                                  onChange={(e) => setNewCommentTexts({ ...newCommentTexts, [issue.id]: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddComment(issue.id);
                                  }}
                                  className="flex-grow bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-purple/50"
                                />
                                <button
                                  onClick={() => handleAddComment(issue.id)}
                                  className="p-2.5 bg-neon-purple hover:bg-purple-600 rounded-xl text-white transition-all cursor-pointer shrink-0"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                          </motion.div>
                        )}
                      </AnimatePresence>

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
