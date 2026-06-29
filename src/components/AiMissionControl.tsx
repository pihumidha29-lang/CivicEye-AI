import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Wind,
  Construction,
  CloudRain,
  Zap,
  Droplets,
  Trash2,
  Car,
  Thermometer,
  Shield,
  Clock,
  Activity,
  Cpu,
  RefreshCw
} from "lucide-react";
import { UserLocation } from "../types";

interface MissionControlCard {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: string;
  confidence: number;
  riskLevel: "Normal" | "Moderate" | "Watch" | "Critical";
  lastUpdated: string;
}

interface AiMissionControlProps {
  userLocation: UserLocation | null;
}

export default function AiMissionControl({ userLocation }: AiMissionControlProps) {
  const [lastRefreshed, setLastRefreshed] = useState<string>("Just now");
  const [tick, setTick] = useState<number>(0);

  // Core monitoring feeds state
  const [feeds, setFeeds] = useState<MissionControlCard[]>([
    {
      id: "aqi",
      name: "AQI Monitoring",
      icon: <Wind className="w-5 h-5" />,
      status: "112 AQI - Moderate Particulate Load",
      confidence: 94,
      riskLevel: "Moderate",
      lastUpdated: "4s ago"
    },
    {
      id: "roads",
      name: "Road Infrastructure",
      icon: <Construction className="w-5 h-5" />,
      status: "3 Active Hazards Detected in Sector",
      confidence: 97,
      riskLevel: "Watch",
      lastUpdated: "12s ago"
    },
    {
      id: "flood",
      name: "Flood Risk",
      icon: <CloudRain className="w-5 h-5" />,
      status: "Low Hydrological Surge (12%)",
      confidence: 99,
      riskLevel: "Normal",
      lastUpdated: "1s ago"
    },
    {
      id: "electricity",
      name: "Electricity Status",
      icon: <Zap className="w-5 h-5" />,
      status: "Grid Unbalance Flagged in Sector-4",
      confidence: 91,
      riskLevel: "Watch",
      lastUpdated: "35s ago"
    },
    {
      id: "water",
      name: "Water Supply",
      icon: <Droplets className="w-5 h-5" />,
      status: "System Pressure Normal (4.2 Bar)",
      confidence: 98,
      riskLevel: "Normal",
      lastUpdated: "1m ago"
    },
    {
      id: "waste",
      name: "Waste Management",
      icon: <Trash2 className="w-5 h-5" />,
      status: "Bin Grid Overload (88% Cap) at Metro Station",
      confidence: 95,
      riskLevel: "Moderate",
      lastUpdated: "18s ago"
    },
    {
      id: "traffic",
      name: "Traffic Conditions",
      icon: <Car className="w-5 h-5" />,
      status: "Bottleneck Detected on West Bypass",
      confidence: 96,
      riskLevel: "Critical",
      lastUpdated: "2s ago"
    },
    {
      id: "weather",
      name: "Weather Conditions",
      icon: <Thermometer className="w-5 h-5" />,
      status: "31°C - Humidity 74% - High UV Index",
      confidence: 98,
      riskLevel: "Normal",
      lastUpdated: "5s ago"
    }
  ]);

  // Periodic simulated micro-updates to live dashboard values to emphasize an autonomous agentic system
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(prev => prev + 1);
      setFeeds(prevFeeds =>
        prevFeeds.map(feed => {
          // Add small drift to values
          let nextStatus = feed.status;
          let nextConfidence = feed.confidence + (Math.random() > 0.5 ? 1 : -1);
          nextConfidence = Math.max(88, Math.min(99, nextConfidence));

          if (feed.id === "aqi") {
            const currentAqi = parseInt(feed.status) || 112;
            const diff = Math.floor((Math.random() - 0.5) * 6);
            const nextAqi = Math.max(40, Math.min(220, currentAqi + diff));
            let risk: "Normal" | "Moderate" | "Watch" | "Critical" = "Moderate";
            if (nextAqi <= 50) risk = "Normal";
            else if (nextAqi <= 100) risk = "Moderate";
            else if (nextAqi <= 150) risk = "Watch";
            else risk = "Critical";
            nextStatus = `${nextAqi} AQI - ${nextAqi <= 100 ? "Satisfactory Air Index" : "Particulate Density Alert"}`;
            return { ...feed, status: nextStatus, confidence: nextConfidence, riskLevel: risk, lastUpdated: "Just now" };
          }

          if (feed.id === "traffic") {
            const delays = ["West Bypass Jam - 12m delay", "Heavy Bottleneck at Crossing", "Critical Congestion Core Lane"];
            const randDelay = delays[Math.floor(Math.random() * delays.length)];
            return { ...feed, status: randDelay, confidence: nextConfidence, lastUpdated: "Just now" };
          }

          if (feed.id === "waste") {
            const cap = Math.floor(75 + Math.random() * 20);
            return {
              ...feed,
              status: `Bin Grid Overload (${cap}% Cap) at Transit Hub`,
              confidence: nextConfidence,
              riskLevel: cap > 90 ? "Critical" : cap > 80 ? "Moderate" : "Normal",
              lastUpdated: "Just now"
            };
          }

          const seconds = Math.floor(Math.random() * 10) + 1;
          return { ...feed, confidence: nextConfidence, lastUpdated: `${seconds}s ago` };
        })
      );
      setLastRefreshed(new Date().toLocaleTimeString());
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  const getRiskStyles = (risk: "Normal" | "Moderate" | "Watch" | "Critical") => {
    switch (risk) {
      case "Normal":
        return {
          glow: "shadow-[0_0_15px_rgba(16,185,129,0.15)]",
          badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          text: "text-emerald-400",
          ping: "bg-emerald-400"
        };
      case "Moderate":
        return {
          glow: "shadow-[0_0_15px_rgba(234,179,8,0.15)]",
          badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
          text: "text-yellow-400",
          ping: "bg-yellow-400"
        };
      case "Watch":
        return {
          glow: "shadow-[0_0_15px_rgba(249,115,22,0.15)]",
          badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
          text: "text-orange-400",
          ping: "bg-orange-400"
        };
      case "Critical":
        return {
          glow: "shadow-[0_0_15px_rgba(239,68,68,0.15)]",
          badge: "bg-red-500/10 text-red-400 border-red-500/20",
          text: "text-red-400",
          ping: "bg-red-400"
        };
    }
  };

  const triggerManualRefresh = () => {
    setFeeds(prev =>
      prev.map(f => ({
        ...f,
        confidence: Math.min(99, Math.max(90, f.confidence + (Math.random() > 0.5 ? 1 : -1))),
        lastUpdated: "Just now"
      }))
    );
    setLastRefreshed(new Date().toLocaleTimeString());
  };

  return (
    <div id="ai-mission-control" className="relative group/control">
      {/* Outer futuristic background panel layout glow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-neon-cyan via-purple-600 to-cyan-500 opacity-20 blur-xl group-hover/control:opacity-30 transition-all duration-700 pointer-events-none" />

      <div className="relative glass-panel rounded-3xl border border-white/10 p-5 sm:p-7 bg-slate-950/75 backdrop-blur-2xl overflow-hidden">
        
        {/* Futuristic vector alignment decorations */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-neon-cyan/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Dashboard Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-neon-cyan to-blue-500 p-[1px] flex items-center justify-center">
              <div className="w-full h-full rounded-[15px] bg-slate-950 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-neon-cyan animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                  🛰 AI Mission Control
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan animate-pulse">
                  CONTINUOUS MONITORING
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Location Grid Index: <span className="text-neon-cyan font-bold uppercase">{userLocation?.locality || "Regional"}, {userLocation?.city || "Jaipur"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 border border-white/5 bg-white/[0.02] px-3 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-neon-cyan animate-pulse" />
              <span>Telemetry Sync: <span className="text-white font-bold">{lastRefreshed}</span></span>
            </div>
            <button
              onClick={triggerManualRefresh}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer text-slate-300"
              title="Manual Telemetry Force Pull"
            >
              <RefreshCw className="w-4 h-4 text-neon-cyan active:rotate-180 transition-transform" />
            </button>
          </div>
        </div>

        {/* 8 Live Monitoring Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {feeds.map((feed, idx) => {
            const styles = getRiskStyles(feed.riskLevel);
            return (
              <motion.div
                key={feed.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -3, scale: 1.01 }}
                className={`group/card relative rounded-2xl border border-white/5 bg-slate-900/40 p-4 hover:bg-slate-900/70 hover:border-white/15 transition-all ${styles.glow} duration-300 flex flex-col justify-between`}
              >
                {/* Micro tech grid line overlays */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${styles.ping}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${styles.ping}`} />
                  </span>
                </div>

                <div className="flex items-start gap-3 mb-2.5">
                  <div className={`p-2 rounded-xl bg-slate-950 border border-white/5 group-hover/card:border-neon-cyan/20 transition-colors ${styles.text}`}>
                    {feed.icon}
                  </div>
                  <div>
                    <h3 className="text-xs font-display font-black text-white uppercase tracking-wider">
                      {feed.name}
                    </h3>
                    <span className={`inline-block text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-1 border ${styles.badge}`}>
                      {feed.riskLevel}
                    </span>
                  </div>
                </div>

                {/* Status description */}
                <div className="my-1.5">
                  <p className="text-xs font-mono text-slate-200 leading-normal line-clamp-2">
                    {feed.status}
                  </p>
                </div>

                {/* Sub telemetry details */}
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-slate-500">
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-neon-cyan" />
                    <span>AI Conf: <span className="text-slate-300 font-bold">{feed.confidence}%</span></span>
                  </div>
                  <div>
                    <span>{feed.lastUpdated}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
