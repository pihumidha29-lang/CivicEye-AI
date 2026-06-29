import React from "react";
import { motion } from "motion/react";
import { Award, ShieldCheck, Trophy, Calendar, Zap, Flame, Compass, Activity, Eye } from "lucide-react";
import { UserProfile, Badge } from "../types";
import { GLOBAL_BADGES } from "../data";

interface ProfileViewProps {
  userProfile: UserProfile | null;
}

export default function ProfileView({ userProfile }: ProfileViewProps) {
  // Compute levels and badges
  const userBadgesSet = new Set(userProfile?.badges || []);

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case "Eye": return <Eye className="w-6 h-6 text-neon-purple" />;
      case "CheckCircle": return <ShieldCheck className="w-6 h-6 text-neon-cyan" />;
      case "Wrench": return <Award className="w-6 h-6 text-amber-400" />;
      case "ShieldAlert": return <Flame className="w-6 h-6 text-rose-400 animate-pulse" />;
      default: return <Compass className="w-6 h-6 text-slate-400" />;
    }
  };

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case "Legendary": return "border-amber-500/40 bg-amber-500/5 text-amber-400";
      case "Epic": return "border-purple-500/40 bg-purple-500/5 text-purple-400";
      case "Rare": return "border-blue-500/40 bg-blue-500/5 text-blue-400";
      default: return "border-slate-500/30 bg-slate-500/5 text-slate-300";
    }
  };

  // Next level calculations
  const currentLevel = userProfile?.citizenLevel || 1;
  const currentXP = userProfile?.xp || 0;
  const nextLevelXP = Math.pow(currentLevel, 2) * 500;
  const percentXP = Math.min(100, Math.floor((currentXP / nextLevelXP) * 100));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="absolute top-[10%] left-[-10%] w-[350px] h-[350px] bg-neon-purple/5 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
        {/* Left Card: Citizen ID Profile Summary */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 text-center relative overflow-hidden">
            {/* Holographic scanner effect */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-neon-cyan to-transparent animate-pulse"></div>

            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-neon-purple to-neon-cyan p-1 shadow-lg shadow-cyan-500/10 mx-auto">
                <img
                  src={userProfile?.photoURL || "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Citizen"}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-xl bg-slate-950"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-neon-cyan text-slate-950 font-mono text-[9px] font-black px-2 py-0.5 rounded-full">
                LEVEL {currentLevel}
              </span>
            </div>

            <h2 className="font-display text-xl font-bold text-white mt-4">{userProfile?.displayName || "Citizen Hero"}</h2>
            <p className="text-xs font-mono text-slate-500 mt-1 uppercase tracking-widest">{userProfile?.email}</p>

            <div className="flex gap-2 justify-center mt-4">
              <span className="text-[10px] font-mono bg-neon-purple/10 border border-neon-purple/20 text-neon-purple px-2 py-0.5 rounded">
                Rank: Neighborhood Sentinel
              </span>
            </div>

            <div className="border-t border-white/5 mt-6 pt-6 grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="block text-[10px] font-mono text-slate-500 uppercase">Impact Score</span>
                <span className="font-display font-black text-2xl text-amber-400">{userProfile?.impactScore || 0}</span>
              </div>
              <div>
                <span className="block text-[10px] font-mono text-slate-500 uppercase">Contributions</span>
                <span className="font-display font-black text-2xl text-neon-cyan">{userProfile?.contributionsCount || 0}</span>
              </div>
            </div>

            <div className="mt-6 p-3 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20 text-center">
              <p className="text-[10px] font-mono text-neon-cyan uppercase font-bold tracking-wider">
                🔒 LOCAL TERMINAL ENVIRONMENT
              </p>
              <p className="text-[9px] text-slate-400 mt-1 font-sans leading-relaxed">
                Profile and achievements are saved locally on your device. No sign-in or central account needed.
              </p>
            </div>
          </div>

          {/* Core XP Level Progression Block */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
              XP Diagnostic Loop
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Current Accumulated XP</span>
                <span>{currentXP} / {nextLevelXP} XP</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden p-[2px] border border-white/5">
                <div
                  className="bg-gradient-to-r from-neon-purple via-purple-500 to-neon-cyan h-2 rounded-full"
                  style={{ width: `${percentXP}%` }}
                ></div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-mono leading-relaxed mt-1">
              Earn an additional <span className="text-neon-cyan">{(nextLevelXP - currentXP)} XP</span> to elevate your terminal profile to level {currentLevel + 1} and unlock prestigious reward tiers.
            </p>
          </div>
        </div>

        {/* Right Side: Unlocked Badges Showcase & Mission Accomplishments */}
        <div className="flex-1 space-y-6">
          {/* Achievements / Badges section */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="font-display text-xl font-bold text-white">Citizen Achievement Badges</h2>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                UNLOCKED: {userProfile?.badges.length || 0} / {GLOBAL_BADGES.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {GLOBAL_BADGES.map(badge => {
                const isUnlocked = userBadgesSet.has(badge.id);

                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-xl border flex gap-3 items-center transition-all ${
                      isUnlocked
                        ? "bg-white/[0.02] border-white/10 hover:border-neon-cyan/35"
                        : "bg-black/40 border-white/5 opacity-50 grayscale"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border ${
                      isUnlocked ? getRarityStyle(badge.rarity) : "border-white/5 bg-slate-900/50"
                    }`}>
                      {getBadgeIcon(badge.icon)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-display font-bold text-xs text-white leading-none">{badge.title}</h4>
                        <span className={`text-[8px] font-mono px-1 py-0.2 rounded border ${getRarityStyle(badge.rarity)}`}>
                          {badge.rarity}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px] mt-1 leading-normal">{badge.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gamified Stat Card: Civic Contribution Ledger */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-neon-cyan" />
              <h2 className="font-display text-xl font-bold text-white">Civic Action Ledger</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "ISSUES REPORTED", value: userProfile?.contributionsCount ? Math.floor(userProfile.contributionsCount * 0.4) : 0, color: "text-neon-purple" },
                { label: "VERIFICATIONS SIGNED", value: userProfile?.contributionsCount ? Math.ceil(userProfile.contributionsCount * 0.6) : 0, color: "text-neon-cyan" },
                { label: "PEER AGREEMENT RATE", value: "98.4%", color: "text-green-400" },
                { label: "DIAGNOSTIC ACCURACY", value: "91.2%", color: "text-blue-400" },
                { label: "STREAK MULTIPLIER", value: "x1.5", color: "text-amber-400 animate-pulse" },
                { label: "COMMUNITY RANK", value: "#14 in Area", color: "text-purple-400" }
              ].map((stat, idx) => (
                <div key={idx} className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                  <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wide">{stat.label}</span>
                  <span className={`block font-display font-bold text-lg mt-1 ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
