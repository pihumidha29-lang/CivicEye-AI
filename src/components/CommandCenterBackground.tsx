import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "motion/react";
import { UserLocation } from "../types";

interface CommandCenterBackgroundProps {
  currentView?: string;
  userLocation?: UserLocation | null;
  isAiThinking?: boolean;
  issuesCount?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  angle: number;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  twinkleSpeed: number;
}

interface ConstellationStar {
  id: number;
  x: number;
  y: number;
  connectedTo: number[];
}

interface NeuralNode {
  id: number;
  x: number;
  y: number;
  size: number;
  pulseDelay: number;
}

export default function CommandCenterBackground({
  currentView = "dashboard",
  userLocation = null,
  isAiThinking = false,
  issuesCount = 0
}: CommandCenterBackgroundProps) {
  // --- Accessibility and Tab Visibility State ---
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isTabActive, setIsTabActive] = useState(true);

  // --- Theme and Weather states ---
  const [timeTheme, setTimeTheme] = useState<"sunrise" | "morning" | "afternoon" | "evening" | "night">("night");
  const [weatherTheme, setWeatherTheme] = useState<"clear" | "rain" | "thunderstorm" | "fog" | "wind">("clear");
  const [lightningFlash, setLightningFlash] = useState(false);

  // --- Interactive Mouse Coordinates (Smooth Springs) ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 40, stiffness: 120, mass: 0.6 };
  const glowX = useSpring(mouseX, springConfig);
  const glowY = useSpring(mouseY, springConfig);

  // --- Dynamic Particle Lists ---
  const [particles, setParticles] = useState<Particle[]>([]);
  const [stars, setStars] = useState<Star[]>([]);
  const [shootingStars, setShootingStars] = useState<{ id: number; x: number; y: number; active: boolean }[]>([]);
  const [constellation, setConstellation] = useState<ConstellationStar[]>([]);
  const [communityNodes, setCommunityNodes] = useState<NeuralNode[]>([]);

  // 1. Detect user accessibility settings
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // 2. Track tab activity (performance optimization)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // 3. Mouse spotlight movement tracker
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - 150); // offset half of spotlight width (300px)
      mouseY.set(e.clientY - 150);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // 4. Time-of-Day theme detector (Runs periodically)
  useEffect(() => {
    const detectTimeTheme = () => {
      const hours = new Date().getHours();
      // Theme brackets:
      // Sunrise: 5 AM – 8 AM
      // Morning: 8 AM – 12 PM
      // Afternoon: 12 PM – 5 PM
      // Evening: 5 PM – 7 PM
      // Night: 7 PM – 5 AM
      if (hours >= 5 && hours < 8) {
        setTimeTheme("sunrise");
      } else if (hours >= 8 && hours < 12) {
        setTimeTheme("morning");
      } else if (hours >= 12 && hours < 17) {
        setTimeTheme("afternoon");
      } else if (hours >= 17 && hours < 19) {
        setTimeTheme("evening");
      } else {
        setTimeTheme("night");
      }
    };

    detectTimeTheme();
    const interval = setInterval(detectTimeTheme, 60000); // Check once a minute
    return () => clearInterval(interval);
  }, []);

  // 5. Weather detector based on unified GPS User Location city parameters
  useEffect(() => {
    if (!userLocation) {
      setWeatherTheme("clear");
      return;
    }

    const city = userLocation.city || "";
    // Align mapping with DisasterForecasterView thresholds
    if (city === "Mumbai") {
      setWeatherTheme("thunderstorm");
    } else if (city === "New Delhi" || city === "San Francisco") {
      setWeatherTheme("fog");
    } else if (city === "Bengaluru") {
      setWeatherTheme("wind");
    } else {
      setWeatherTheme("clear");
    }
  }, [userLocation]);

  // 6. Generate static background elements (stars, constellation map, community nodes, standard particles)
  useEffect(() => {
    if (isReducedMotion) return;

    // Generate normal ambient particles
    const normalParticles = Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 1,
      speed: Math.random() * 0.4 + 0.15,
      opacity: Math.random() * 0.4 + 0.1,
      angle: Math.random() * 360
    }));
    setParticles(normalParticles);

    // Generate active space starfield (Night only)
    const starfield = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 80, // mostly upper region
      size: Math.random() * 1.5 + 0.5,
      twinkleSpeed: Math.random() * 2 + 1.5
    }));
    setStars(starfield);

    // Generate static nodes for community activity neural network
    const nodes = Array.from({ length: 7 }).map((_, i) => ({
      id: i,
      x: 15 + Math.random() * 70, // distributed in center
      y: 20 + Math.random() * 60,
      size: Math.random() * 4 + 3,
      pulseDelay: Math.random() * 2
    }));
    setCommunityNodes(nodes);

    // Constellations (linking stars)
    const constellationGrid = [
      { id: 0, x: 20, y: 25, connectedTo: [1, 2] },
      { id: 1, x: 35, y: 15, connectedTo: [0, 3] },
      { id: 2, x: 25, y: 40, connectedTo: [0, 4] },
      { id: 3, x: 50, y: 20, connectedTo: [1, 5] },
      { id: 4, x: 42, y: 45, connectedTo: [2, 5] },
      { id: 5, x: 60, y: 35, connectedTo: [3, 4, 6] },
      { id: 6, x: 75, y: 25, connectedTo: [5] }
    ];
    setConstellation(constellationGrid);

    // Dynamic shooting star loops
    const shootingStarPool = Array.from({ length: 2 }).map((_, i) => ({
      id: i,
      x: Math.random() * 70,
      y: Math.random() * 40,
      active: false
    }));
    setShootingStars(shootingStarPool);
  }, [isReducedMotion]);

  // 7. Thunderstorm lightning controller
  useEffect(() => {
    if (weatherTheme !== "thunderstorm" || isReducedMotion || !isTabActive) return;

    const triggerLightning = () => {
      setLightningFlash(true);
      setTimeout(() => setLightningFlash(false), 120);
      
      // Secondary minor flash
      setTimeout(() => {
        if (Math.random() > 0.4) {
          setLightningFlash(true);
          setTimeout(() => setLightningFlash(false), 80);
        }
      }, 250);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        triggerLightning();
      }
    }, 12000); // Check for lightning once in 12s

    return () => clearInterval(interval);
  }, [weatherTheme, isReducedMotion, isTabActive]);

  // 8. Shooting stars random triggers
  useEffect(() => {
    if (timeTheme !== "night" || isReducedMotion || !isTabActive) return;

    const triggerShootingStar = () => {
      setShootingStars(prev =>
        prev.map(star => {
          if (star.active) return star;
          if (Math.random() > 0.7) {
            return {
              ...star,
              x: Math.random() * 60,
              y: Math.random() * 30,
              active: true
            };
          }
          return star;
        })
      );
    };

    const interval = setInterval(triggerShootingStar, 8000);
    return () => clearInterval(interval);
  }, [timeTheme, isReducedMotion, isTabActive]);

  // Disable all animations if reduced motion is requested
  if (isReducedMotion) {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#04060b]">
        <div className="absolute inset-0 bg-space-grid opacity-[0.05]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent opacity-60" />
      </div>
    );
  }

  // --- Dynamic Color Styles mapping for Times & Weathers ---
  const getThemeBackgroundStyles = () => {
    // Determine overall vignette & gradients
    switch (timeTheme) {
      case "sunrise":
        return {
          gradient: "from-[#1a101d] via-[#2c1322] to-[#120b1c]",
          spotlightGlow: "from-[#ea580c]/15 via-[#ec4899]/10 to-transparent",
          aurora1: "bg-[#f97316]/10",
          aurora2: "bg-[#db2777]/8"
        };
      case "morning":
        return {
          gradient: "from-[#0a152d] via-[#0d1e3f] to-[#040914]",
          spotlightGlow: "from-cyan-400/12 via-blue-500/8 to-transparent",
          aurora1: "bg-cyan-500/10",
          aurora2: "bg-blue-600/8"
        };
      case "afternoon":
        return {
          gradient: "from-[#050e1f] via-[#08152e] to-[#03070f]",
          spotlightGlow: "from-[#0891b2]/8 via-[#2563eb]/5 to-transparent",
          aurora1: "bg-[#06b6d4]/6",
          aurora2: "bg-[#3b82f6]/4"
        };
      case "evening":
        return {
          gradient: "from-[#1e0f1d] via-[#1a0c24] to-[#090510]",
          spotlightGlow: "from-[#f97316]/15 via-[#7c3aed]/12 to-transparent",
          aurora1: "bg-[#ea580c]/8",
          aurora2: "bg-[#6b21a8]/12"
        };
      case "night":
      default:
        return {
          gradient: "from-[#04060c] via-[#060914] to-[#020306]",
          spotlightGlow: "from-neon-purple/15 via-neon-blue/8 to-neon-cyan/12",
          aurora1: "bg-[#4c1d95]/22",
          aurora2: "bg-[#06b6d4]/10"
        };
    }
  };

  const themeStyles = getThemeBackgroundStyles();

  // Determine standard motion speeds (Wind speeds everything up!)
  const motionSpeedMultiplier = weatherTheme === "wind" ? 2.5 : 1.0;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#04060c]">
      
      {/* ----------------- BASE CANVAS STAGE (2-3s CSS gradient crossfade) ----------------- */}
      <div className={`absolute inset-0 transition-all duration-[3000ms] ease-in-out bg-gradient-to-b ${themeStyles.gradient}`} />

      {/* ----------------- DISTANT WEATHER LIGHTNING LAYER ----------------- */}
      {weatherTheme === "thunderstorm" && (
        <div
          className={`absolute inset-0 bg-white/20 z-5 transition-opacity duration-75 mix-blend-screen ${
            lightningFlash ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* ----------------- DYNAMIC FLOATING WEATHER CLOUDS / AURORA MESHES ----------------- */}
      <div className="absolute inset-0 opacity-60 mix-blend-screen z-1">
        {/* Large flowing atmospheric nebula (Aurora-1) */}
        <div
          className={`absolute top-[-10%] -left-[15%] w-[65%] h-[90%] rounded-full filter blur-[120px] aurora-bg-1 transition-all duration-[3000ms] ${themeStyles.aurora1}`}
          style={{ animationDuration: `${25 / motionSpeedMultiplier}s` }}
        />
        {/* Secondary flowing atmospheric nebula (Aurora-2) */}
        <div
          className={`absolute bottom-[-15%] right-[-10%] w-[55%] h-[80%] rounded-full filter blur-[110px] aurora-bg-2 transition-all duration-[3000ms] ${themeStyles.aurora2}`}
          style={{ animationDuration: `${30 / motionSpeedMultiplier}s` }}
        />
      </div>

      {/* ----------------- INTERACTIVE SPOTLIGHT GLOW (Mouse linked) ----------------- */}
      {isTabActive && (
        <motion.div
          style={{
            x: glowX,
            y: glowY,
          }}
          className={`absolute w-[300px] h-[300px] rounded-full bg-gradient-to-r ${themeStyles.spotlightGlow} filter blur-[80px] mix-blend-screen opacity-80 z-2`}
        />
      )}

      {/* ----------------- GLOBAL FUTURISTIC SPACE GRID ----------------- */}
      <div className="absolute inset-0 bg-space-grid opacity-[0.06] z-0" />

      {/* ----------------- COMMUNITY ACTIVITY NODE NEURAL GRID ----------------- */}
      {issuesCount > 2 && (
        <div className="absolute inset-0 z-3 opacity-30">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Draw brief neural paths */}
            {communityNodes.map((node) => {
              // Connect some of them to subsequent nodes faintly
              const nextNode = communityNodes[(node.id + 1) % communityNodes.length];
              const bypassNode = communityNodes[(node.id + 3) % communityNodes.length];
              return (
                <g key={`neural-link-${node.id}`}>
                  <motion.line
                    x1={`${node.x}%`}
                    y1={`${node.y}%`}
                    x2={`${nextNode.x}%`}
                    y2={`${nextNode.y}%`}
                    stroke="rgba(6, 182, 212, 0.45)"
                    strokeWidth="1.2"
                    strokeDasharray="4,6"
                    animate={{ strokeDashoffset: [0, -20] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  />
                  {node.id % 2 === 0 && (
                    <motion.line
                      x1={`${node.x}%`}
                      y1={`${node.y}%`}
                      x2={`${bypassNode.x}%`}
                      y2={`${bypassNode.y}%`}
                      stroke="rgba(168, 85, 247, 0.3)"
                      strokeWidth="0.8"
                      strokeDasharray="3,3"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Faint pulsing active city map nodes */}
          {communityNodes.map((node) => (
            <div
              key={`comm-node-${node.id}`}
              className="absolute rounded-full flex items-center justify-center pointer-events-none"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                width: `${node.size}px`,
                height: `${node.size}px`
              }}
            >
              <span className="absolute inset-0 rounded-full bg-neon-cyan/80 animate-ping" style={{ animationDelay: `${node.pulseDelay}s`, animationDuration: "3s" }} />
              <span className="w-full h-full rounded-full bg-neon-cyan/50 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            </div>
          ))}
        </div>
      )}

      {/* ----------------- AI ACTIVE REACTIVE DARK OVERLAY ----------------- */}
      <AnimatePresence>
        {isAiThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0 }}
            className="absolute inset-0 bg-[#030206]/65 z-4 flex items-center justify-center"
          >
            {/* Dark grid texture enhancement */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0%,transparent_60%)]" />

            {/* AI thinking neural particle field flow */}
            <svg className="w-full h-full absolute inset-0 opacity-40">
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * Math.PI) / 4;
                const rStart = 140;
                const rEnd = 15;
                const cx = "50%";
                const cy = "50%";
                return (
                  <g key={`ai-pulse-ray-${i}`}>
                    <motion.circle
                      r="3"
                      fill="#a855f7"
                      filter="drop-shadow(0 0 6px #00f0ff)"
                      animate={{
                        cx: [`calc(50% + ${Math.cos(angle) * rStart}px)`, `calc(50% + ${Math.cos(angle) * rEnd}px)`],
                        cy: [`calc(50% + ${Math.sin(angle) * rStart}px)`, `calc(50% + ${Math.sin(angle) * rEnd}px)`],
                        opacity: [0, 0.9, 0]
                      }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        delay: i * 0.25,
                        ease: "easeOut"
                      }}
                    />
                  </g>
                );
              })}
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------- MISSION CONTROL OPERATING SYSTEM MODE ----------------- */}
      <AnimatePresence>
        {currentView === "dashboard" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8 }}
            className="absolute inset-0 z-3"
          >
            {/* Operating System HUD holographic vertical scan line */}
            <motion.div
              animate={{ top: ["-10%", "110%"] }}
              transition={{ repeat: Infinity, duration: 8.5, ease: "linear" }}
              className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-neon-cyan/45 to-transparent shadow-[0_0_12px_#00f0ff] pointer-events-none"
            />

            {/* Holographic grid network highlights */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.015)_1px,transparent_1px)] bg-[size:25px_25px] opacity-75" />

            {/* Subtle floating digital hexagons */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.08]">
              <svg className="w-full h-full text-neon-cyan animate-pulse" strokeWidth="0.5" fill="none" stroke="currentColor">
                <g transform="translate(150, 100) scale(0.6)">
                  <polygon points="50,0 100,28 100,85 50,113 0,85 0,28" />
                </g>
                <g transform="translate(850, 450) scale(0.8)">
                  <polygon points="50,0 100,28 100,85 50,113 0,85 0,28" />
                </g>
                <g transform="translate(300, 520) scale(0.4)">
                  <polygon points="50,0 100,28 100,85 50,113 0,85 0,28" />
                </g>
                <g transform="translate(700, 150) scale(0.5)">
                  <polygon points="50,0 100,28 100,85 50,113 0,85 0,28" />
                </g>
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------- DYNAMIC STARS & TWINKLING FIELD (Night Theme) ----------------- */}
      <AnimatePresence>
        {timeTheme === "night" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.0 }}
            className="absolute inset-0 z-1"
          >
            {/* Constellations lines layout */}
            <svg className="absolute inset-0 w-full h-full opacity-15">
              {constellation.map((cs) =>
                cs.connectedTo.map((targetId) => {
                  const target = constellation.find((c) => c.id === targetId);
                  if (!target) return null;
                  return (
                    <line
                      key={`const-${cs.id}-${targetId}`}
                      x1={`${cs.x}%`}
                      y1={`${cs.y}%`}
                      x2={`${target.x}%`}
                      y2={`${target.y}%`}
                      stroke="rgba(168, 85, 247, 0.4)"
                      strokeWidth="0.5"
                    />
                  );
                })
              )}
            </svg>

            {/* Twinkling points */}
            {stars.map((star) => (
              <motion.div
                key={`star-${star.id}`}
                className="absolute rounded-full bg-white shadow-[0_0_3px_white]"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`
                }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  repeat: Infinity,
                  duration: star.twinkleSpeed,
                  ease: "easeInOut",
                  delay: star.id * 0.1
                }}
              />
            ))}

            {/* Live Shooting Star effects */}
            {shootingStars.map((star) =>
              star.active ? (
                <motion.div
                  key={`shooting-${star.id}`}
                  initial={{ x: `${star.x}%`, y: `${star.y}%`, width: 0, opacity: 1 }}
                  animate={{
                    x: [`${star.x}%`, `${star.x + 18}%`],
                    y: [`${star.y}%`, `${star.y + 12}%`],
                    width: [0, 60, 0],
                    opacity: [0, 0.9, 0]
                  }}
                  transition={{
                    duration: 1.1,
                    ease: "easeOut"
                  }}
                  onAnimationComplete={() => {
                    setShootingStars(prev =>
                      prev.map(s => (s.id === star.id ? { ...s, active: false } : s))
                    );
                  }}
                  className="absolute h-[1px] bg-gradient-to-r from-transparent via-cyan-200 to-white shadow-[0_0_8px_#fff]"
                  style={{ transform: "rotate(-35deg)", transformOrigin: "left center" }}
                />
              ) : null
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------- WEATHER DYNAMIC PARTICLES EFFECT STACK ----------------- */}
      <div className="absolute inset-0 z-3 pointer-events-none">
        
        {/* FOG DRIFTS OVERLAY */}
        {weatherTheme === "fog" && (
          <div className="absolute inset-0">
            <div className="absolute top-0 bottom-0 left-0 right-0 bg-slate-900/10 mix-blend-color-burn" />
            <motion.div
              animate={{ x: ["-50%", "0%"] }}
              transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
              className="absolute w-[200%] h-full flex flex-col justify-around pointer-events-none"
            >
              <div className="w-[450px] h-[350px] rounded-full bg-slate-300/5 filter blur-[100px]" />
              <div className="w-[500px] h-[400px] rounded-full bg-slate-400/5 filter blur-[120px] self-end" />
            </motion.div>
          </div>
        )}

        {/* RAIN DROPLETS LAYERING */}
        {(weatherTheme === "rain" || weatherTheme === "thunderstorm") && (
          <div className="absolute inset-0">
            {/* Ambient dark storm shroud overlay */}
            <div className="absolute inset-0 bg-slate-950/20 mix-blend-multiply" />
            
            {/* Standard Rain Streams */}
            <svg className="w-full h-full opacity-20">
              {Array.from({ length: 28 }).map((_, i) => {
                const rx = Math.random() * 100;
                const ry = Math.random() * -30;
                const rd = Math.random() * 1.5 + 0.8; // Duration
                return (
                  <motion.line
                    key={`rain-${i}`}
                    x1={`${rx}%`}
                    y1={`${ry}%`}
                    x2={`${rx - 5}%`}
                    y2="100%"
                    stroke="rgba(156, 163, 175, 0.8)"
                    strokeWidth="1.0"
                    animate={{ y: ["-20%", "120%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: rd,
                      ease: "linear",
                      delay: i * 0.1
                    }}
                  />
                );
              })}
            </svg>

            {/* Ripple splashes at footer / base of screen */}
            {Array.from({ length: 6 }).map((_, i) => {
              const lx = 5 + Math.random() * 90;
              const ly = 75 + Math.random() * 20;
              return (
                <motion.div
                  key={`splash-${i}`}
                  className="absolute w-6 h-3 rounded-full border border-white/20"
                  style={{ left: `${lx}%`, top: `${ly}%` }}
                  animate={{ scale: [0.1, 1.4], opacity: [0.6, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.2,
                    delay: i * 0.3,
                    ease: "easeOut"
                  }}
                />
              );
            })}
          </div>
        )}

        {/* WIND GUST PARTICLES (Leaves/Streaks drifting diagonally) */}
        {weatherTheme === "wind" && (
          <div className="absolute inset-0">
            <svg className="w-full h-full opacity-15">
              {Array.from({ length: 15 }).map((_, i) => {
                const startX = Math.random() * 100;
                const startY = Math.random() * 60;
                const dur = Math.random() * 2 + 1.5;
                return (
                  <motion.path
                    key={`wind-streak-${i}`}
                    d="M 0,0 C 20,5 40,-5 60,0"
                    stroke="rgba(255, 255, 255, 0.45)"
                    strokeWidth="0.8"
                    fill="none"
                    initial={{ x: `${startX}%`, y: `${startY}%`, opacity: 0 }}
                    animate={{
                      x: [`${startX}%`, `${startX + 30}%`],
                      y: [`${startY}%`, `${startY + 15}%`],
                      opacity: [0, 0.8, 0]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: dur,
                      ease: "easeIn"
                    }}
                  />
                );
              })}
            </svg>
          </div>
        )}

      </div>

      {/* ----------------- BASE FLOATING AMBIENT PARTICLES (Stops in reduced motion) ----------------- */}
      {isTabActive && (
        <div className="absolute inset-0 z-2 opacity-50">
          {particles.map((p) => (
            <div
              key={`p-${p.id}`}
              className="absolute rounded-full bg-neon-cyan/25 floating-particle"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDelay: `${Math.random() * -12}s`,
                animationDuration: `${(15 + p.speed * 10) / motionSpeedMultiplier}s`
              }}
            />
          ))}
        </div>
      )}

      {/* ----------------- SHIELD COMPONENT VIGNETTE SHADOWS ----------------- */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#04060c] via-transparent to-[#04060c]/65 z-4 pointer-events-none" />

    </div>
  );
}
