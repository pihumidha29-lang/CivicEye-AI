import React from "react";
import { motion } from "motion/react";
import { Eye, ShieldCheck, Wrench, Trophy, Activity, ArrowRight, MapPin, Sparkles } from "lucide-react";
import { ViewType } from "../types";

interface LandingViewProps {
  onNavigate: (view: ViewType) => void;
  isAuthenticated: boolean;
  onGuestLogin?: () => void;
}

export default function LandingView({ onNavigate, isAuthenticated, onGuestLogin }: LandingViewProps) {
  // Helper to detect if browser is Safari or running on iOS (which restricts iframe third-party cookies)
  const isIOSOrSafari = () => {
    if (typeof window === "undefined" || !window.navigator) return false;
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isSafari = ua.includes("safari") && !ua.includes("chrome") && !ua.includes("chromium");
    return isIOS || isSafari;
  };
  // Motion fade/slide-up config for scroll triggers
  const scrollSectionVariants = {
    hidden: { opacity: 0, y: 50, filter: "blur(20px)" },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div className="relative min-h-screen text-white overflow-hidden pb-12">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30, filter: "blur(15px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative pt-36 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10"
      >
        {/* Futuristic Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1e1035]/60 border border-purple-500/20 text-[#c084fc] text-xs font-mono mb-8 tracking-wider"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#c084fc]" />
          CIVIC INTELLIGENCE INTERFACE v2.4
        </motion.div>

        {/* Catchy Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-display text-5xl md:text-8xl font-black tracking-tight leading-none max-w-5xl text-white"
        >
          See it. Verify it.<br />
          <span className="gradient-title-premium font-black tracking-tight">
            Fix it.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 text-slate-400 text-lg md:text-xl max-w-3xl font-sans leading-relaxed"
        >
          Empower your community with CivicEye AI. Report local infrastructure issues, verify reports in real-time, earn citizen rewards, and build a smarter city together.
        </motion.p>

        {/* iOS/Safari Cookie Policy Bypass Warning */}
        {isIOSOrSafari() && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-8 max-w-xl p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3.5 text-left shadow-[0_0_20px_rgba(245,158,11,0.06)]"
          >
            <span className="text-xl shrink-0 mt-0.5">📱</span>
            <div>
              <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">iOS / Safari Security Notice</p>
              <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">
                Safari and iOS iframe policies block cookie-based sign-ins. Use our <strong>Credentials-Free Guest Mode</strong> below to explore all features instantly without requiring authentication!
              </p>
            </div>
          </motion.div>
        )}

        {/* Hero CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          {onGuestLogin && (
            <button
              onClick={onGuestLogin}
              className="px-7 py-3.5 rounded-xl font-display font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] border border-emerald-500/30 transition-all duration-300 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 text-sm"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Continue as Guest (No Sign-In)
            </button>
          )}
          <button
            onClick={() => onNavigate(isAuthenticated ? "dashboard" : "auth")}
            className="group px-7 py-3.5 rounded-xl font-display font-semibold bg-[#a855f7] hover:bg-[#b55fe6] text-white shadow-[0_0_25px_rgba(168,85,247,0.45)] border border-purple-400/20 transition-all duration-300 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 text-sm"
          >
            Access Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => onNavigate("map")}
            className="px-7 py-3.5 rounded-xl font-display font-medium bg-[#0b0c10]/40 border border-white/10 text-white hover:bg-[#0b0c10]/70 transition-all duration-300 flex items-center gap-2 cursor-pointer hover:border-white/20 text-sm"
          >
            <MapPin className="w-4 h-4 text-cyan-400" />
            Explore Community Map
          </button>
        </motion.div>
      </motion.section>

      {/* Key Stats Counter Section with Scroll Animation */}
      <motion.section 
        variants={scrollSectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="relative max-w-7xl mx-auto px-6 py-14 border-t border-b border-white/10 bg-black/30 backdrop-blur-md rounded-3xl mb-24 shadow-2xl z-10"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "4,821+", label: "Issues Logged", color: "text-neon-purple", glow: "rgba(168,85,247,0.2)" },
            { value: "94.2%", label: "Resolution Rate", color: "text-neon-cyan", glow: "rgba(6,182,212,0.2)" },
            { value: "18,450+", label: "Active Sentinels", color: "text-neon-blue", glow: "rgba(59,130,246,0.2)" },
            { value: "125K+", label: "XP Distributed", color: "text-amber-400", glow: "rgba(245,158,11,0.2)" }
          ].map((stat, idx) => (
            <div key={idx} className="text-center group">
              <div 
                className={`font-display text-4xl md:text-6xl font-black ${stat.color} tracking-tight transition-transform duration-300 group-hover:scale-110`}
                style={{ textShadow: `0 0 20px ${stat.glow}` }}
              >
                {stat.value}
              </div>
              <div className="mt-3 text-xs md:text-sm text-slate-400 font-mono uppercase tracking-widest font-semibold">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Core AI Platform Capabilities */}
      <motion.section 
        variants={scrollSectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-7xl mx-auto px-6 py-12 z-10 relative"
      >
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-none">
            Advanced Community Intelligence Platform
          </h2>
          <p className="mt-5 text-slate-400 text-base md:text-lg">
            CivicEye AI fuses crowdsourced verification and next-generation AI analysis to accelerate local municipal resolutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <motion.div
            whileHover={{ y: -8 }}
            className="glass-panel glass-panel-interactive p-8 rounded-3xl flex flex-col justify-between shine-overlay relative group cursor-pointer"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center mb-6 group-hover:bg-neon-purple/20 transition-colors">
                <Eye className="w-7 h-7 text-neon-purple" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-3 text-white">AI-Powered Intake</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Report issues instantly. Gemini AI analyzes photo details, extracts description context, automatically estimates problem severity, and detects duplicates.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 font-mono text-xs text-neon-purple font-semibold tracking-wider">
              INTELLIGENT ANALYSIS
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            whileHover={{ y: -8 }}
            className="glass-panel glass-panel-interactive-purple p-8 rounded-3xl flex flex-col justify-between shine-overlay relative group cursor-pointer"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mb-6 group-hover:bg-neon-cyan/20 transition-colors">
                <ShieldCheck className="w-7 h-7 text-neon-cyan" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-3 text-white">Crowdsourced Verification</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Decentralized neighborhood verification avoids false reports. Local citizens verify issues in real-time to build community accuracy and trigger municipal action.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 font-mono text-xs text-neon-cyan font-semibold tracking-wider">
              TRUST MECHANISM
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            whileHover={{ y: -8 }}
            className="glass-panel glass-panel-interactive p-8 rounded-3xl flex flex-col justify-between shine-overlay relative group cursor-pointer"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                <Trophy className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-3 text-white">Gamified Civic XP</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Get rewarded for making your city better. Earn Citizen XP, level up, unlock achievement badges, and participate in collaborative city-wide missions.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 font-mono text-xs text-purple-400 font-semibold tracking-wider">
              REWARD LOOP
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Interactive Process Pipeline */}
      <motion.section 
        variants={scrollSectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="relative bg-gradient-to-b from-transparent to-purple-950/20 py-24 border-t border-white/10 rounded-t-[50px] z-10"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <span className="text-xs font-mono text-neon-cyan tracking-widest uppercase font-semibold">Resolution Pipeline</span>
              <h2 className="font-display text-3xl md:text-5xl font-black mt-2 mb-8 leading-none">
                From Detection to Resolution
              </h2>

              <div className="space-y-6">
                {[
                  { step: "01", title: "Instant Report", desc: "Citizen uploads a photo and description of a local defect on the mobile app." },
                  { step: "02", title: "AI Analysis & Categorization", desc: "Gemini server-side API auto-tags the category and extracts location metadata." },
                  { step: "03", title: "Community Consensus", desc: "Nearby neighbors verify the report, boosting its urgency score." },
                  { step: "04", title: "Civic Resolution", desc: "Direct integration feeds verified data to municipality services for immediate dispatch." }
                ].map((item, index) => (
                  <div key={index} className="flex gap-5 items-start group">
                    <div className="font-display text-lg font-bold text-neon-cyan bg-neon-cyan/5 border border-neon-cyan/20 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-neon-cyan/10 group-hover:border-neon-cyan/40 transition-all">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-lg text-white group-hover:text-neon-cyan transition-colors">{item.title}</h4>
                      <p className="text-slate-400 text-sm mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 w-full flex justify-center">
              {/* Stunning futuristic visual container representing maps interface */}
              <div className="relative w-full max-w-md glass-panel p-6 rounded-3xl border border-white/15 aspect-square flex flex-col justify-between overflow-hidden shadow-2xl">
                <div className="absolute top-[-20%] right-[-20%] w-[70%] h-[70%] bg-neon-cyan/20 rounded-full filter blur-[70px] pointer-events-none"></div>

                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-neon-cyan animate-pulse" />
                    <span className="font-mono text-[10px] text-slate-300 tracking-wider">GEO-PULSE ACTIVE DETECTOR</span>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-neon-cyan animate-ping"></div>
                </div>

                <div className="flex-1 my-6 relative border border-white/5 bg-slate-950/60 rounded-2xl overflow-hidden flex items-center justify-center">
                  {/* Radar radar-sweeping visual */}
                  <div className="absolute inset-0 bg-space-grid opacity-40"></div>
                  <div className="absolute w-48 h-48 rounded-full border border-neon-purple/20 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border border-neon-cyan/15 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-neon-cyan/5 border border-neon-cyan/30 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-neon-cyan"></div>
                      </div>
                    </div>
                  </div>

                  {/* Mock flashing ping dots */}
                  <span className="absolute top-[30%] left-[25%] flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-purple opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-neon-purple shadow-[0_0_10px_#a855f7]"></span>
                  </span>
                  <span className="absolute bottom-[40%] right-[30%] flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-neon-cyan shadow-[0_0_10px_#06b6d4]"></span>
                  </span>
                  <span className="absolute top-[60%] right-[20%] flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-purple-500 shadow-[0_0_10px_#a855f7]"></span>
                  </span>

                  <span className="absolute bottom-3 left-3 font-mono text-[10px] text-slate-500">37.7749° N, 122.4194° W</span>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex gap-4 items-center shadow-lg">
                  <div className="w-9 h-9 bg-neon-purple/20 rounded-xl flex items-center justify-center">
                    <Wrench className="w-4.5 h-4.5 text-neon-purple" />
                  </div>
                  <div>
                    <h5 className="font-display font-bold text-sm text-white">Pothole Verified</h5>
                    <p className="text-[10px] text-slate-400">Market St • 1.2km away • Verified by 4 residents</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Elegant Footer */}
      <footer className="py-12 border-t border-white/10 text-center font-mono text-xs text-slate-400 relative z-10 bg-black/25 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>© {new Date().getFullYear()} CivicEye AI. National Hackathon Edition. All rights reserved.</div>
          <div className="flex gap-6">
            <span className="hover:text-neon-cyan transition-colors cursor-pointer hover:underline">Security Protocol</span>
            <span className="hover:text-neon-cyan transition-colors cursor-pointer hover:underline">Citizen Charter</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
