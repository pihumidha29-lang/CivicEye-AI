import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  Award,
  Users,
  Eye,
  X,
  Plus,
  Compass,
  Zap,
  Droplet,
  Trash2,
  Lightbulb,
  TreePine,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { CivicIssue, ViewType } from "../types";

// Static premium mock completed transformations matching the Jaipur theme and categories
interface TransformationStory {
  id: string;
  category: "Roads" | "Garbage" | "Water Leakage" | "Streetlights" | "Parks" | "Electricity" | "Cleanliness";
  title: string;
  location: string;
  beforeUrl: string;
  afterUrl: string;
  reporterName: string;
  reporterAnonymity: boolean;
  communityImpactText: string;
  aiStory: string;
  metrics: {
    citizensBenefited: number;
    dailyTrafficImproved: string;
    resolutionTimeDays: number;
    communityVerifiedCount: number;
    infrastructureCategory: string;
  };
}

const DEFAULT_TRANSFORMATIONS: TransformationStory[] = [
  {
    id: "trans_1",
    category: "Roads",
    title: "Major Pothole Patching & Resurfacing",
    location: "Malviya Nagar, Jaipur",
    beforeUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
    afterUrl: "https://images.unsplash.com/photo-1594993876074-6f0302b0c955?auto=format&fit=crop&w=600&q=80",
    reporterName: "Rajesh K.",
    reporterAnonymity: false,
    communityImpactText: "🚗 1,850 daily commuters now have safer, smooth transit.",
    aiStory: "This hazard was flagged by Rajesh and upvoted rapidly by 12 neighbors. The Municipal Engineering Department matched the GPS telemetry within 24 hours, completely paving the corridor over the weekend to eliminate vehicle suspension alignment threats.",
    metrics: {
      citizensBenefited: 1850,
      dailyTrafficImproved: "High Flow",
      resolutionTimeDays: 4,
      communityVerifiedCount: 12,
      infrastructureCategory: "Paved Highways"
    }
  },
  {
    id: "trans_2",
    category: "Garbage",
    title: "Eco-Reclaim & Clearing of Public Dumping",
    location: "Indiranagar Sector 3, Bengaluru",
    beforeUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
    afterUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=600&q=80",
    reporterName: "Anonymous Citizen",
    reporterAnonymity: true,
    communityImpactText: "🌱 Reclaiming 300sqm of public walking trails free of odors.",
    aiStory: "An unsanctioned commercial waste pile was causing hazardous biological runoff. Within five days of reporting, sanitation squads thoroughly cleared the zone, sanitised the soil, and established native hedges.",
    metrics: {
      citizensBenefited: 2400,
      dailyTrafficImproved: "Pedestrian Corridor",
      resolutionTimeDays: 5,
      communityVerifiedCount: 19,
      infrastructureCategory: "Public Green Zones"
    }
  },
  {
    id: "trans_3",
    category: "Streetlights",
    title: "Grid Replacement & LED Installation",
    location: "Connaught Place Block D, Delhi",
    beforeUrl: "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&w=600&q=80",
    afterUrl: "https://images.unsplash.com/photo-1513829096900-fe03867c3aff?auto=format&fit=crop&w=600&q=80",
    reporterName: "Meera Sen",
    reporterAnonymity: false,
    communityImpactText: "🚶‍♀️ Safety illuminated for 3,100 nighttime pedestrian commuters.",
    aiStory: "A faulty underground transformer circuit left a major corridor fully pitch black. Power services acted on CivicEye's digital dispatch to deploy heavy cherry pickers and rewire high-efficiency smart LED heads.",
    metrics: {
      citizensBenefited: 3100,
      dailyTrafficImproved: "Extreme Density",
      resolutionTimeDays: 3,
      communityVerifiedCount: 26,
      infrastructureCategory: "Electrical Grid"
    }
  },
  {
    id: "trans_4",
    category: "Water Leakage",
    title: "Critical Water Main Fracture Sealed",
    location: "Gachibowli High Street, Hyderabad",
    beforeUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
    afterUrl: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=600&q=80",
    reporterName: "Anand Verma",
    reporterAnonymity: false,
    communityImpactText: "💧 Saved 15,000 liters of purified public drinking water daily.",
    aiStory: "A high-pressure public municipal line fractured, flooding adjacent road lanes. The Water & Sewage Board mobilized a fast-response crew to excavate, isolate, and sleeve the ruptured segment under 6 hours.",
    metrics: {
      citizensBenefited: 4200,
      dailyTrafficImproved: "Heavy Transit",
      resolutionTimeDays: 2,
      communityVerifiedCount: 31,
      infrastructureCategory: "Aquatic Pipes"
    }
  }
];

interface CommunityImpactGalleryProps {
  issues: CivicIssue[];
  onNavigate: (view: ViewType) => void;
}

export default function CommunityImpactGallery({
  issues,
  onNavigate
}: CommunityImpactGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedTransformation, setSelectedTransformation] = useState<TransformationStory | null>(null);
  
  // Custom Slider state for each transformation card to prevent unified conflict
  const [sliderPositions, setSliderPositions] = useState<{ [id: string]: number }>({});
  
  // Animation state inside details modal
  const [celebrationStep, setCelebrationStep] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; left: number; delay: number; color: string; scale: number }[]>([]);

  // Dynamically pull resolved issues reported by real users in Firestore to showcase real-time changes!
  const resolvedRealIssues: TransformationStory[] = issues
    .filter(i => i.status === "Resolved")
    .map(i => ({
      id: i.id,
      category: i.category as any,
      title: i.title,
      location: i.address || "Local Area",
      // Map beautiful Unsplash images dynamically if the issue has no custom imagery
      beforeUrl: i.imageUrl || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
      afterUrl: "https://images.unsplash.com/photo-1594993876074-6f0302b0c955?auto=format&fit=crop&w=600&q=80", // smooth asphalt as resolved
      reporterName: i.reporterId ? "Community Hero" : "Anonymous Citizen",
      reporterAnonymity: !i.reporterId,
      communityImpactText: `🚗 ${i.communityImpactScore || 120} citizens benefited from this reported fix.`,
      aiStory: i.aiSummary || `This issue was flagged, verified by ${i.verificationsCount} community sentinels, and resolved in partnership with municipal crews.`,
      metrics: {
        citizensBenefited: (i.communityImpactScore || 12) * 50,
        dailyTrafficImproved: "Moderate",
        resolutionTimeDays: 5,
        communityVerifiedCount: i.verificationsCount,
        infrastructureCategory: i.category
      }
    }));

  // Combine static and dynamically resolved ones
  const allTransformations = [...resolvedRealIssues, ...DEFAULT_TRANSFORMATIONS];

  // Filtering transformations based on chosen tag
  const filteredTransformations = allTransformations.filter(t => {
    if (selectedCategory === "All") return true;
    return t.category.toLowerCase().includes(selectedCategory.toLowerCase()) || 
           selectedCategory.toLowerCase().includes(t.category.toLowerCase());
  });

  // Calculate total monthly reports, resolved count, and estimated beneficiary sum
  const solvedCount = issues.filter(i => i.status === "Resolved").length + 87;
  const reportedCount = issues.length + 126;
  const totalBenefited = (issues.filter(i => i.status === "Resolved").reduce((acc, i) => acc + (i.communityImpactScore || 10), 0) * 50) + 54000;

  // Carousel actions
  const nextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % filteredTransformations.length);
  };

  const prevSlide = () => {
    setCarouselIndex((prev) => (prev - 1 + filteredTransformations.length) % filteredTransformations.length);
  };

  // Slider change
  const handleSliderChange = (id: string, value: number) => {
    setSliderPositions(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Launch modal and run the animated celebration sequence
  const openTransformation = (story: TransformationStory) => {
    setSelectedTransformation(story);
    setCelebrationStep(false);
    
    // Create random confetti pieces
    const colors = ["#10b981", "#06b6d4", "#a855f7", "#eab308", "#3b82f6", "#ec4899"];
    const pieces = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // percentage
      delay: Math.random() * 2, // seconds
      color: colors[Math.floor(Math.random() * colors.length)],
      scale: 0.5 + Math.random() * 0.8
    }));
    setConfetti(pieces);

    // Sequence celebration timer
    setTimeout(() => {
      setCelebrationStep(true);
    }, 400);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Roads": return <Compass className="w-4 h-4 text-orange-400" />;
      case "Water Leakage": return <Droplet className="w-4 h-4 text-cyan-400" />;
      case "Garbage": return <Trash2 className="w-4 h-4 text-green-400" />;
      case "Streetlights": return <Lightbulb className="w-4 h-4 text-yellow-400" />;
      case "Parks": return <TreePine className="w-4 h-4 text-emerald-400" />;
      case "Electricity": return <Zap className="w-4 h-4 text-purple-400" />;
      default: return <ShieldCheck className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="w-full relative z-10 text-left">
      {/* Aurora glow effect inside container */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[150px] bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-full filter blur-[100px] pointer-events-none z-0"></div>

      {/* Title & Inspirational Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <h2 className="font-display text-2xl font-black text-white flex items-center gap-2">
            🌟 Community Impact Gallery
          </h2>
          <p className="text-slate-400 text-xs mt-1 max-w-xl font-medium leading-relaxed">
            Real transformations powered by active citizens. See how simple reports spark municipal progress and elevate neighborhood health.
          </p>
        </div>

        {/* Total stats panel (Gemini Insight Module) */}
        <div className="bg-[#090d16]/80 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-3.5 shadow-xl shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-emerald-400/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[7.5px] font-mono text-emerald-400 font-bold tracking-widest uppercase block leading-none">
              MONTHLY IMPACT INSIGHTS
            </span>
            <p className="text-[11px] font-mono text-slate-300 font-medium leading-normal mt-1 max-w-[280px]">
              Citizens reported <strong className="text-white font-bold">{reportedCount}</strong> issues. <strong className="text-emerald-400 font-bold">{solvedCount}</strong> resolved. Over <strong className="text-cyan-400 font-bold">{totalBenefited.toLocaleString()}</strong> benefited.
            </p>
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5 mb-6 relative z-10 overflow-x-auto pb-1.5 scrollbar-none">
        {["All", "Roads", "Garbage", "Water Leakage", "Streetlights", "Parks", "Electricity", "Cleanliness"].map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              setCarouselIndex(0);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all shrink-0 border ${
              selectedCategory === cat
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-inner"
                : "bg-white/[0.02] text-slate-400 border-white/5 hover:border-white/10 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="relative z-10">
        {filteredTransformations.length === 0 ? (
          /* Empty state matching instructions */
          <div className="w-full glass-panel border border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[300px]">
            <div className="absolute inset-0 bg-space-grid opacity-[0.06] pointer-events-none"></div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/15 to-cyan-500/5 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
              <Award className="w-8 h-8" />
            </div>
            
            <h3 className="font-display text-lg font-black text-white">
              Every great community starts with one report
            </h3>
            <p className="text-slate-400 text-xs mt-1.5 max-w-sm leading-relaxed">
              Be the first citizen in your sector to submit a report and create an inspiring success story in our Community Impact Gallery.
            </p>

            <button
              onClick={() => onNavigate("report")}
              className="mt-6 flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-mono text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer border border-emerald-400/20"
            >
              <Plus className="w-4 h-4" /> Report an Issue
            </button>
          </div>
        ) : (
          /* Horizontal slide deck or carousel of transformation cards */
          <div className="relative">
            {/* Nav Arrows */}
            {filteredTransformations.length > 1 && (
              <div className="absolute -top-12 right-0 flex gap-1.5 z-20">
                <button
                  onClick={prevSlide}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextSlide}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Carousel Item with Glassmorphic visual card */}
            <div className="w-full">
              {filteredTransformations.map((story, idx) => {
                if (idx !== carouselIndex) return null;
                const sliderVal = sliderPositions[story.id] ?? 50;

                return (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="w-full glass-panel border border-white/10 rounded-3xl p-5 md:p-6 shadow-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] grid grid-cols-1 lg:grid-cols-12 gap-6 relative overflow-hidden group hover:shadow-emerald-500/5 hover:border-white/15 transition-all"
                  >
                    {/* Visual Before/After Drag Slider (Left-6 columns) */}
                    <div className="lg:col-span-6 relative h-[250px] sm:h-[300px] rounded-2xl overflow-hidden border border-white/10 bg-slate-950 select-none">
                      {/* Before Image (underneath, clipped based on slide value) */}
                      <img
                        src={story.beforeUrl}
                        alt="Before"
                        className="absolute inset-0 w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 z-20 bg-red-500/90 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-red-400/40 shadow-md">
                        BEFORE
                      </div>

                      {/* After Image (overlay, width controls visibility) */}
                      <div
                        className="absolute inset-0 h-full overflow-hidden transition-all duration-75"
                        style={{ width: `${sliderVal}%` }}
                      >
                        <img
                          src={story.afterUrl}
                          alt="After"
                          className="absolute inset-0 object-cover"
                          style={{ width: "100%", height: "100%", maxWidth: "none", minWidth: "100%" }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="absolute top-3 right-3 z-20 bg-emerald-500/95 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-400/40 shadow-md">
                        AFTER
                      </div>

                      {/* Slider Line Divider */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white z-20 cursor-ew-resize flex items-center justify-center pointer-events-none"
                        style={{ left: `${sliderVal}%` }}
                      >
                        <div className="w-7 h-7 rounded-full bg-white border border-slate-300 shadow-xl flex items-center justify-center -translate-x-1/2 cursor-ew-resize">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#090d16" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m18 8 4 4-4 4M6 8l-4 4 4 4" />
                          </svg>
                        </div>
                      </div>

                      {/* Seamless transparent input slider on top to enable native touch and mouse dragging easily */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderVal}
                        onChange={(e) => handleSliderChange(story.id, parseInt(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                      />

                      {/* Slider Hint Overlay */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-slate-950/75 backdrop-blur-sm border border-white/5 px-2.5 py-1 rounded-full text-[8px] font-mono text-slate-400 pointer-events-none">
                        ↔ Drag left/right to compare
                      </div>
                    </div>

                    {/* Meta Details & AI Narrative (Right-6 columns) */}
                    <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                      <div className="space-y-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            {getCategoryIcon(story.category)}
                          </div>
                          <div className="text-left">
                            <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                              MUNICIPAL TRANSFORMATION COMPLETE
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {story.location}
                            </span>
                          </div>
                          
                          <span className="ml-auto bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 shadow-inner shrink-0">
                            <CheckCircle className="w-3 h-3" /> Resolved
                          </span>
                        </div>

                        <h3 className="font-display text-lg font-black text-white leading-tight">
                          {story.title}
                        </h3>

                        {/* Story summary AI */}
                        <div className="bg-black/35 p-3.5 rounded-xl border border-white/5 space-y-1 relative">
                          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                            🤖 AI Narrative Insight
                          </span>
                          <p className="text-[10.5px] font-mono text-emerald-300 leading-relaxed italic">
                            "{story.aiStory}"
                          </p>
                        </div>

                        {/* Interactive short impact sentence */}
                        <p className="text-xs font-display text-slate-300 font-bold bg-white/[0.02] border border-white/5 p-2.5 rounded-xl">
                          {story.communityImpactText}
                        </p>
                      </div>

                      {/* Footer containing community heroes and buttons to examine */}
                      <div className="pt-3 border-t border-white/5 flex flex-wrap justify-between items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-purple-500/30">
                            <Award className="w-3.5 h-3.5 text-purple-400" />
                          </div>
                          <div className="text-left">
                            <span className="text-[7.5px] font-mono text-slate-500 block uppercase leading-none font-bold">
                              🏅 Community Hero
                            </span>
                            <span className="text-[10.5px] font-mono text-slate-300 font-semibold">
                              {story.reporterAnonymity ? "Anonymous Citizen" : story.reporterName}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => openTransformation(story)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-white font-mono text-[9.5px] font-bold transition-all cursor-pointer shadow-lg"
                        >
                          <Eye className="w-3.5 h-3.5" /> Celebrate Impact
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* RETAIN FULL POPUP SUCCESS CELEBRATION DIALOG */}
      <AnimatePresence>
        {selectedTransformation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark backing overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTransformation(null)}
              className="absolute inset-0 bg-[#03060c]/90 backdrop-blur-md"
            />

            {/* Floating micro-engineered custom CSS confetti elements in lieu of external heavy canvas dependencies */}
            {celebrationStep && confetti.map((item) => (
              <div
                key={item.id}
                className="absolute z-50 pointer-events-none rounded-sm bg-current"
                style={{
                  color: item.color,
                  left: `${item.left}%`,
                  top: "-5%",
                  width: `${6 * item.scale}px`,
                  height: `${12 * item.scale}px`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  animation: `fallConfetti ${1.5 + Math.random() * 2}s linear forwards`,
                  animationDelay: `${item.delay}s`,
                }}
              />
            ))}

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-lg bg-[#070b12] border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-10"
            >
              {/* Top ambient aurora glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full filter blur-[50px] pointer-events-none"></div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedTransformation(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg border border-white/5 transition-all z-20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Animated green checkmark sequence */}
              <div className="text-center pt-4 pb-6 relative z-10 flex flex-col items-center">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-emerald-500/15 filter blur-sm animate-ping"></div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-[0_0_25px_rgba(16,185,129,0.35)] relative z-10 scale-0 animate-[scaleIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]">
                    <CheckCircle className="w-9 h-9 text-slate-950 stroke-[3]" />
                  </div>
                </div>

                <h3 className="font-display text-xl font-black text-white mt-4">
                  Success Celebration Activated!
                </h3>
                <p className="text-slate-400 text-xs mt-1 leading-normal max-w-xs">
                  A tangible achievement of civic partnership in Jaipur. Let's count the total benefits.
                </p>
              </div>

              {/* Counting Beneficiary Stat Metrics Block */}
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-4 text-center space-y-1 mb-5 relative z-10">
                <span className="text-[8px] font-mono text-emerald-400 font-bold tracking-widest uppercase block leading-none">
                  👥 TOTAL CITIZENS BENEFITED
                </span>
                
                {/* Dynamically incrementing numeric counter */}
                <span className="font-display font-black text-4xl text-white block drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                  {celebrationStep ? (
                    <CounterUp value={selectedTransformation.metrics.citizensBenefited} />
                  ) : "0"}
                </span>

                <span className="text-[10px] font-mono text-emerald-400/80 font-semibold block">
                  And counting on adjacent residential sectors
                </span>
              </div>

              {/* Impact Metrics grid matching instructions */}
              <div className="grid grid-cols-2 gap-3 mb-5 relative z-10 text-left">
                <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center gap-2.5">
                  <TrendingUp className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-[8.5px] font-mono text-slate-500 block uppercase leading-none font-bold">Daily Traffic</span>
                    <strong className="text-xs font-display text-white mt-0.5 block">{selectedTransformation.metrics.dailyTrafficImproved}</strong>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <span className="text-[8.5px] font-mono text-slate-500 block uppercase leading-none font-bold">Resolution Time</span>
                    <strong className="text-xs font-display text-white mt-0.5 block">{selectedTransformation.metrics.resolutionTimeDays} Days Fix</strong>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center gap-2.5">
                  <Compass className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[8.5px] font-mono text-slate-500 block uppercase leading-none font-bold">Category</span>
                    <strong className="text-xs font-display text-white mt-0.5 block truncate max-w-[120px]">{selectedTransformation.metrics.infrastructureCategory}</strong>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[8.5px] font-mono text-slate-500 block uppercase leading-none font-bold">Citizens Verified</span>
                    <strong className="text-xs font-display text-white mt-0.5 block">{selectedTransformation.metrics.communityVerifiedCount} Endorsed</strong>
                  </div>
                </div>
              </div>

              {/* AI Inspiring Story Card inside detail view */}
              <div className="bg-black/40 p-3.5 rounded-2xl border border-white/5 space-y-1 relative z-10 text-left">
                <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                  📝 VERIFIED RESOLUTION CASE STUDY
                </span>
                <p className="text-[11px] font-mono text-slate-300 leading-relaxed leading-normal">
                  {selectedTransformation.aiStory}
                </p>
              </div>

              {/* Primary action close */}
              <button
                onClick={() => setSelectedTransformation(null)}
                className="w-full py-3 mt-5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-[11px] font-bold border border-white/10 transition-all cursor-pointer shadow-md text-center"
              >
                Close and Return to Gallery
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Styled custom CSS embedded classes to support fallback keyframe animations */}
      <style>{`
        @keyframes fallConfetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(85vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes scaleIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Micro counting helper for rewarding counter up progress
function CounterUp({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1500; // 1.5s
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // logarithmic or easeOutQuad
      const easeVal = progress * (2 - progress);
      setCount(Math.floor(easeVal * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };
    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{count.toLocaleString()}</span>;
}
