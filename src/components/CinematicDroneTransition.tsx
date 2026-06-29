import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Compass,
  Activity,
  Layers,
  Wifi,
  Globe,
  ShieldAlert,
  Sparkles,
  Zap,
  Target,
  Video,
  Crosshair,
  MapPin,
  ChevronRight
} from "lucide-react";
import { UserLocation } from "../types";

interface CinematicDroneTransitionProps {
  userLocation: UserLocation | null;
  onComplete: () => void;
}

// 🔊 Advanced HTML5 Web Audio Synthesizer for atmospheric futuristic sound effects
const playSynthSound = (type: "satellite" | "engine" | "radar" | "lock" | "marker" | "beep") => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "beep") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "satellite") {
      // Soft high pitch telemetry ping pings
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(2200, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === "engine") {
      // Sub-bass rumble swell
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(45, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(65, ctx.currentTime + 2.5);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(80, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 2.0);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.0);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.8);

      osc.start();
      osc.stop(ctx.currentTime + 2.8);
    } else if (type === "radar") {
      // Holographic sonar ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(680, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } else if (type === "lock") {
      // Dual-tone frequency confirmation
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1250, ctx.currentTime);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1256, ctx.currentTime);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 0.35);
    } else if (type === "marker") {
      // Swoosh drop + high energy digital landing
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.45);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch (error) {
    // Silence audio failure if user has strict browser autoplays blocked
    console.debug("WebAudio play prevented by browser autoplay policy");
  }
};

export default function CinematicDroneTransition({
  userLocation,
  onComplete
}: CinematicDroneTransitionProps) {
  // Check if map transition already occurred in current browser session
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [activeStage, setActiveStage] = useState<number>(1);
  const [currentAltitude, setCurrentAltitude] = useState<number>(385420);
  const [currentLat, setCurrentLat] = useState<number>(20.5937); // India center lat
  const [currentLng, setCurrentLng] = useState<number>(78.9629); // India center lng
  const [radarPulseCount, setRadarPulseCount] = useState<number>(0);
  const [isSkipped, setIsSkipped] = useState(false);

  // Setup refs for live animation loops
  const animationRef = useRef<number | null>(null);

  // Resolve target location coordinates
  const targetLat = userLocation?.latitude || 28.6139; // Delhi default
  const targetLng = userLocation?.longitude || 77.1025;
  const targetCity = userLocation?.city || "New Delhi";
  const targetState = userLocation?.state || "Delhi";

  useEffect(() => {
    // Check session state
    const hasPlayed = sessionStorage.getItem("civic_drone_played_v1");
    if (hasPlayed) {
      setIsQuickMode(true);
      setActiveStage(8); // Jump directly to lock and marker drop stage
    } else {
      sessionStorage.setItem("civic_drone_played_v1", "true");
    }
  }, []);

  // Main Orchestration Timers
  useEffect(() => {
    if (isQuickMode) {
      // 🚀 Quick Mode sequence (total under 1 second)
      playSynthSound("lock");
      setCurrentAltitude(150);
      setCurrentLat(targetLat);
      setCurrentLng(targetLng);
      
      const timer1 = setTimeout(() => {
        setActiveStage(9); // Reveal map
        playSynthSound("marker");
        const timer2 = setTimeout(() => {
          onComplete();
        }, 500);
        return () => clearTimeout(timer2);
      }, 500);

      return () => clearTimeout(timer1);
    }

    // 🛰 FULL Cinematic Mode sequence (total 3.8 seconds)
    playSynthSound("satellite");
    
    // Stage 1: System Activation (0ms -> 600ms)
    const s1Timer = setTimeout(() => {
      setActiveStage(2); // Drone Takeoff
      playSynthSound("engine");
      playSynthSound("beep");
    }, 650);

    // Stage 2: Takeoff and Flight (650ms -> 1300ms)
    const s2Timer = setTimeout(() => {
      setActiveStage(3); // Fly Towards India
      playSynthSound("satellite");
    }, 1300);

    // Stage 3: Space to country zoom (1300ms -> 2000ms)
    const s3Timer = setTimeout(() => {
      setActiveStage(4); // Zoom to State
      playSynthSound("beep");
    }, 2000);

    // Stage 4: Zoom to State (2000ms -> 2600ms)
    const s4Timer = setTimeout(() => {
      setActiveStage(5); // Zoom to City
      playSynthSound("radar");
    }, 2600);

    // Stage 5: Zoom to City & street mesh (2600ms -> 3200ms)
    const s5Timer = setTimeout(() => {
      setActiveStage(6); // AI Scan radar
      setRadarPulseCount(1);
    }, 3200);

    // Stage 6: AI Scan (3200ms -> 3700ms)
    const s6Timer = setTimeout(() => {
      setActiveStage(7); // Camera Settle Lock
      playSynthSound("lock");
    }, 3750);

    // Stage 7: Settle and deploy marker (3700ms -> 4100ms)
    const s7Timer = setTimeout(() => {
      setActiveStage(8); // Marker Drop
      playSynthSound("marker");
    }, 4200);

    // Stage 8: Finish & callback
    const s8Timer = setTimeout(() => {
      setActiveStage(9); // Fade transition reveal
      const finishTimer = setTimeout(() => {
        onComplete();
      }, 450);
      return () => clearTimeout(finishTimer);
    }, 4700);

    return () => {
      clearTimeout(s1Timer);
      clearTimeout(s2Timer);
      clearTimeout(s3Timer);
      clearTimeout(s4Timer);
      clearTimeout(s5Timer);
      clearTimeout(s6Timer);
      clearTimeout(s7Timer);
      clearTimeout(s8Timer);
    };
  }, [isQuickMode]);

  // Telemetry Interpolation loops for altitude and GPS coordinates
  useEffect(() => {
    if (isQuickMode) return;

    let startAltitude = 385420; // Space
    let startTime = Date.now();
    const duration = 4000;

    const updateTelemetry = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Custom easing curve: slow takeoff, rapid descent, slow settle
      const easedProgress = Math.pow(progress, 3); // Exponential descent

      // Altitude interpolation (Space -> 150m)
      const currentAlt = Math.max(150, Math.round(startAltitude - easedProgress * (startAltitude - 150)));
      setCurrentAltitude(currentAlt);

      // GPS Coordinates interpolation (India Center -> Exact Target)
      const currentL = currentLat + easedProgress * (targetLat - currentLat);
      const currentG = currentLng + easedProgress * (targetLng - currentLng);
      setCurrentLat(Number(currentL.toFixed(5)));
      setCurrentLng(Number(currentG.toFixed(5)));

      if (progress < 1 && activeStage < 9) {
        animationRef.current = requestAnimationFrame(updateTelemetry);
      }
    };

    animationRef.current = requestAnimationFrame(updateTelemetry);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [activeStage, isQuickMode, targetLat, targetLng]);

  // Quick skip button handler
  const handleSkip = () => {
    setIsSkipped(true);
    playSynthSound("lock");
    onComplete();
  };

  return (
    <AnimatePresence>
      <motion.div
        id="cinematic-drone-transition"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, filter: "blur(15px)" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="fixed inset-0 z-[9999] flex flex-col justify-between bg-[#04060c] text-white font-mono overflow-hidden select-none"
      >
        {/* Background Atmosphere Nebula Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_50%)] pointer-events-none animate-[pulse_6s_infinite]" />
        
        {/* Cinematic Vignette */}
        <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.95)] pointer-events-none z-10" />

        {/* Dynamic Space Starfield Layer */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMC41IiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjMiLz48Y2lyY2xlIGN4PSI4MCIgY3k9IjIwIiByPSIwLjgiIGZpbGw9IiNmZmYiIG9wYWNpdH09IjAuNSIvPjxjaXJjbGUgY3g9IjQwIiBjeT0iODAiIHI9IjAuNSIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC40Ii8+PGNpcmNsZSBjeD0iNjAiIGN5PSI2MCIgcj0iMS4yIiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjIiLz48L3N2Zz4=')] opacity-40 z-0 scale-110 pointer-events-none" />

        {/* ----------------- GRAPHICS ZOOM ENGINE STACK ----------------- */}
        <div className="absolute inset-0 flex items-center justify-center z-5">
          <AnimatePresence mode="popLayout">
            
            {/* STAGE 2: EARTH GLOBE (Space Zoom) */}
            {!isQuickMode && activeStage === 2 && (
              <motion.div
                key="space-globe"
                initial={{ scale: 0.8, opacity: 0, rotate: -20, filter: "blur(4px)" }}
                animate={{ scale: 2.2, opacity: 0.8, rotate: 10, filter: "blur(0px)" }}
                exit={{ scale: 4.5, opacity: 0, rotate: 25, filter: "blur(12px)" }}
                transition={{ duration: 1.0, ease: "easeIn" }}
                className="relative w-80 h-80 flex items-center justify-center pointer-events-none"
              >
                <div className="absolute w-full h-full rounded-full border border-neon-cyan/25 animate-spin-slow shadow-[0_0_50px_rgba(6,182,212,0.15)]" />
                <Globe className="w-48 h-48 text-cyan-400/60" strokeWidth={1} />
                <div className="absolute text-[8px] font-bold text-neon-cyan/60 animate-pulse uppercase tracking-widest mt-40">
                  ORBITAL APEX STABILIZED
                </div>
              </motion.div>
            )}

            {/* STAGE 3: FLY TOWARDS INDIA (Country Zoom) */}
            {!isQuickMode && activeStage === 3 && (
              <motion.div
                key="india-map"
                initial={{ scale: 0.4, opacity: 0, filter: "blur(8px)" }}
                animate={{ scale: 1.8, opacity: 0.9, filter: "blur(0px)" }}
                exit={{ scale: 3.8, opacity: 0, filter: "blur(14px)" }}
                transition={{ duration: 0.9, ease: "easeInOut" }}
                className="relative w-96 h-96 flex items-center justify-center pointer-events-none"
              >
                {/* Glowing Vector Outline Mockup of India subcontinent */}
                <svg className="w-80 h-80 text-neon-purple/40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8">
                  {/* Stylized geometric India diamond chassis */}
                  <polygon points="50,15 80,45 68,85 50,95 32,85 20,45" strokeDasharray="3,3" />
                  <path d="M50,15 L50,95 M20,45 L80,45 M32,85 L68,85" stroke="rgba(168,85,247,0.2)" strokeWidth="0.5" />
                  <circle cx="50" cy="50" r="30" stroke="rgba(6,182,212,0.15)" strokeDasharray="1,2" />
                </svg>
                <div className="absolute text-[9px] font-black text-neon-purple tracking-widest uppercase">
                  🚀 ACQUIRING SUB-CONTINENT CORRIDOR
                </div>
              </motion.div>
            )}

            {/* STAGE 4: STATE BOUNDARY (State Zoom) */}
            {!isQuickMode && activeStage === 4 && (
              <motion.div
                key="state-mesh"
                initial={{ scale: 0.5, opacity: 0, rotate: 15, filter: "blur(10px)" }}
                animate={{ scale: 1.6, opacity: 1, rotate: 0, filter: "blur(0px)" }}
                exit={{ scale: 3.5, opacity: 0, rotate: -15, filter: "blur(16px)" }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="relative w-[450px] h-[450px] flex items-center justify-center pointer-events-none"
              >
                <div className="absolute w-[300px] h-[300px] rounded-2xl border-2 border-dashed border-neon-cyan/20 animate-[spin_25s_linear_infinite]" />
                <div className="absolute w-[240px] h-[240px] rounded-full border border-neon-purple/30 animate-[pulse_1.5s_infinite]" />
                
                {/* State geometry wireframe */}
                <svg className="w-64 h-64 text-neon-cyan" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="45,30 65,35 75,55 55,80 35,70 25,45" className="animate-pulse" />
                  {/* State glow */}
                  <polygon points="45,30 65,35 75,55 55,80 35,70 25,45" fill="rgba(6,182,212,0.06)" />
                </svg>
                <div className="absolute bg-black/60 px-3 py-1.5 border border-neon-cyan/40 rounded-lg text-center backdrop-blur-md">
                  <span className="text-[8px] uppercase text-slate-400 block tracking-widest font-bold">STATE RECOGNIZED</span>
                  <strong className="text-[12px] text-white tracking-widest block font-black">{targetState}</strong>
                </div>
              </motion.div>
            )}

            {/* STAGE 5: CITY AERIAL (City Grid Zoom) */}
            {!isQuickMode && activeStage === 5 && (
              <motion.div
                key="city-grid"
                initial={{ scale: 0.6, opacity: 0, filter: "blur(10px)", rotateX: 30 }}
                animate={{ scale: 1.4, opacity: 1, filter: "blur(0px)", rotateX: 0 }}
                exit={{ scale: 2.5, opacity: 0, filter: "blur(14px)" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative w-full max-w-xl h-[400px] flex items-center justify-center pointer-events-none"
              >
                {/* Cybernetic city blueprint grid mesh */}
                <div className="absolute inset-0 bg-space-grid opacity-20 scale-125" />
                <div className="absolute w-[400px] h-[250px] border border-white/10 rounded-xl relative overflow-hidden bg-slate-900/40">
                  {/* Scanning vertical bar */}
                  <motion.div
                    initial={{ top: 0 }}
                    animate={{ top: "100%" }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_12px_#00f0ff]"
                  />
                  {/* Grid structures */}
                  <div className="absolute inset-5 border border-dashed border-white/5 flex items-center justify-center">
                    <div className="text-[9px] text-slate-500 text-center font-mono">
                      [ MUNICIPAL ASSET RENDER ]<br/>
                      CONSTRUCTING LOCAL GIS VECTOR GRID
                    </div>
                  </div>
                </div>
                <div className="absolute bg-black/80 px-4 py-2 border border-neon-purple/50 rounded-lg text-center backdrop-blur-md">
                  <span className="text-[8px] uppercase text-slate-400 block tracking-widest font-black">METROPOLITAN INDEX</span>
                  <strong className="text-sm text-neon-cyan tracking-widest block font-extrabold">{targetCity.toUpperCase()} SEC</strong>
                </div>
              </motion.div>
            )}

            {/* STAGE 6 & 7: ACTIVE AI RADAR SCAN */}
            {(activeStage === 6 || activeStage === 7) && (
              <motion.div
                key="radar-scan-node"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                className="relative w-full max-w-md h-[400px] flex flex-col items-center justify-center"
              >
                {/* Large expanding pulse rings */}
                <div className="absolute w-72 h-72 rounded-full border border-neon-cyan/20 animate-ping pointer-events-none" />
                <div className="absolute w-96 h-96 rounded-full border border-neon-purple/10 animate-[ping_3s_infinite] pointer-events-none" />
                
                {/* Rotating Crosshair Overlay */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  className="absolute w-64 h-64 border border-white/5 rounded-full flex items-center justify-center pointer-events-none"
                >
                  <div className="absolute w-full h-[1px] bg-white/5" />
                  <div className="absolute h-full w-[1px] bg-white/5" />
                  <div className="absolute top-0 w-3 h-3 border-t-2 border-l-2 border-neon-cyan/40" />
                  <div className="absolute bottom-0 w-3 h-3 border-b-2 border-r-2 border-neon-cyan/40" />
                </motion.div>

                {/* Radar Sweep Arc */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
                  className="absolute w-48 h-48 rounded-full border border-neon-cyan/30 bg-gradient-to-tr from-transparent via-transparent to-neon-cyan/10 pointer-events-none"
                />

                <Target className="w-12 h-12 text-neon-cyan animate-pulse relative z-10" />

                <div className="mt-6 bg-black/60 p-4 border border-white/10 rounded-2xl backdrop-blur-md max-w-xs text-center space-y-1.5 relative z-10">
                  <span className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest block">
                    {activeStage === 6 ? "🛰 SATELLITE SEARCH ACTIVE" : "🛡 CAMERA CHASSIS LOCK"}
                  </span>
                  <div className="text-[9px] text-slate-400 space-y-1">
                    <p className="flex items-center justify-between gap-4">
                      <span>SCAN STATUS:</span>
                      <span className="text-green-400 font-bold uppercase animate-pulse">Scanning</span>
                    </p>
                    <p className="flex items-center justify-between gap-4">
                      <span>CIVIC REPORTS:</span>
                      <span className="text-white font-bold">ACCUMULATING</span>
                    </p>
                    <p className="flex items-center justify-between gap-4">
                      <span>LOCAL GRID:</span>
                      <span className="text-neon-purple font-bold">ONLINE</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STAGE 8: MARKER DROP & BOUNCE */}
            {activeStage === 8 && (
              <motion.div
                key="marker-deploy-node"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative flex flex-col items-center justify-center"
              >
                {/* Falling and Bouncing Pin Animation */}
                <motion.div
                  initial={{ y: -300, scaleY: 1.5 }}
                  animate={{ 
                    y: [0, -40, 0, -15, 0], 
                    scaleY: [1.2, 0.9, 1.05, 0.97, 1] 
                  }}
                  transition={{ 
                    duration: 0.9, 
                    ease: "easeOut"
                  }}
                  className="relative flex flex-col items-center z-20"
                >
                  <div className="w-10 h-10 rounded-full bg-neon-cyan/20 border-2 border-neon-cyan flex items-center justify-center shadow-[0_0_20px_#00f0ff]">
                    <MapPin className="w-5 h-5 text-neon-cyan" />
                  </div>
                  {/* Point stem */}
                  <div className="w-1.5 h-4 bg-neon-cyan shadow-[0_0_10px_#00f0ff] -mt-1 rounded-b" />
                </motion.div>

                {/* Expanding pulse ripple rings after landing */}
                <motion.div
                  initial={{ scale: 0.1, opacity: 0 }}
                  animate={{ 
                    scale: [0.1, 1.8, 3.2], 
                    opacity: [0.6, 0.4, 0] 
                  }}
                  transition={{ 
                    delay: 0.45,
                    duration: 1.8, 
                    repeat: Infinity,
                    ease: "easeOut" 
                  }}
                  className="absolute w-24 h-24 rounded-full border-2 border-neon-cyan/40 pointer-events-none z-10"
                  style={{ top: "35%" }}
                />

                <motion.div
                  initial={{ scale: 0.1, opacity: 0 }}
                  animate={{ 
                    scale: [0.1, 1.5, 2.5], 
                    opacity: [0.8, 0.3, 0] 
                  }}
                  transition={{ 
                    delay: 0.95,
                    duration: 1.8, 
                    repeat: Infinity,
                    ease: "easeOut" 
                  }}
                  className="absolute w-24 h-24 rounded-full border border-neon-purple/50 pointer-events-none z-10"
                  style={{ top: "35%" }}
                />

                <div className="mt-8 bg-black/80 px-4 py-2.5 border border-emerald-500/30 rounded-2xl text-center backdrop-blur-md">
                  <span className="text-[9px] font-black uppercase text-emerald-400 block tracking-widest animate-pulse">
                    ⚡ TARGET CORRIDOR DEPLOYED
                  </span>
                  <div className="text-[11px] font-bold text-white mt-1">
                    {targetCity}, {targetState}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>


        {/* ----------------- TOP HUD BAR ----------------- */}
        <div className="p-5 flex items-center justify-between border-b border-white/5 bg-[#04060c]/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center bg-white/[0.02]">
              <Video className="w-4 h-4 text-neon-cyan animate-pulse" />
            </div>
            <div className="text-left">
              <span className="block text-[10px] font-black uppercase tracking-wider text-white">
                CivicEye Aerial Scan
              </span>
              <span className="text-[8px] text-slate-500 flex items-center gap-1 font-mono uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Live Feed • SAT_LINK_9
              </span>
            </div>
          </div>

          {/* Telemetry updates */}
          <div className="hidden sm:flex items-center gap-6 text-[10px] text-slate-400">
            <div>
              <span className="text-slate-600 block text-[8px] font-bold">ALTITUDE</span>
              <span className="font-mono text-neon-cyan font-bold tracking-wider">
                {currentAltitude.toLocaleString()} M
              </span>
            </div>
            <div>
              <span className="text-slate-600 block text-[8px] font-bold">COORDINATES</span>
              <span className="font-mono text-white tracking-widest">
                {currentLat}° N, {currentLng}° E
              </span>
            </div>
            <div>
              <span className="text-slate-600 block text-[8px] font-bold">GIS GRID</span>
              <span className="font-mono text-neon-purple font-bold">
                DL_SEC_{Math.floor(currentAltitude / 1250)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded border border-neon-cyan/20 bg-neon-cyan/5 text-[8px] text-neon-cyan font-black tracking-widest uppercase animate-pulse">
              {isQuickMode ? "QUICK REVEAL" : "PREMIUM LINK"}
            </span>

            {/* Skip Button */}
            {!isQuickMode && (
              <button
                onClick={handleSkip}
                className="px-3 py-1 text-[9px] font-bold tracking-wider border border-white/10 rounded-lg bg-white/5 hover:bg-white/15 hover:border-white/20 text-slate-300 uppercase transition-all flex items-center gap-1 cursor-pointer"
              >
                Skip System
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* ----------------- SUBTLE HUD SATELLITE TELEMETRY OVERLAYS ----------------- */}
        <div className="absolute inset-y-1/4 left-5 w-44 space-y-3 pointer-events-none z-10 hidden md:block opacity-65">
          <div className="border-l-2 border-neon-cyan/30 pl-3 space-y-1 text-left">
            <span className="text-[8px] font-black text-slate-500 block uppercase">SYSTEM CHASSIS</span>
            <div className="text-[9px] text-slate-300">
              FPV_DRONE_Z20<br/>
              GYRO_STABILIZER: 1.0<br/>
              PITCH: 34.21°<br/>
              ROLL: -2.18°<br/>
              YAW: 114.5°
            </div>
          </div>

          <div className="border-l-2 border-neon-purple/30 pl-3 space-y-1 text-left">
            <span className="text-[8px] font-black text-slate-500 block uppercase">MUNICIPAL RADAR</span>
            <div className="text-[9px] text-slate-300">
              ELEVATION: 182M<br/>
              DENSITY: CRITICAL<br/>
              GRID STATUS: LOCKED<br/>
              ATM_PRESSURE: 1012 hPa
            </div>
          </div>
        </div>

        <div className="absolute inset-y-1/4 right-5 w-44 space-y-3 pointer-events-none z-10 hidden md:block opacity-65 text-right">
          <div className="border-r-2 border-neon-cyan/30 pr-3 space-y-1">
            <span className="text-[8px] font-black text-slate-500 block uppercase">HUD OVERLAY</span>
            <div className="text-[9px] text-slate-300">
              RENDER_FPS: 60.0<br/>
              BLUR_RAD: 12px<br/>
              DOF_STRENGTH: 0.95<br/>
              SHAKE_AMP: SUBTLE
            </div>
          </div>

          <div className="border-r-2 border-neon-purple/30 pr-3 space-y-1">
            <span className="text-[8px] font-black text-slate-500 block uppercase">COMMUNITY INTEL</span>
            <div className="text-[9px] text-slate-300">
              AQI INDEX: ACTIVE<br/>
              STREET_NETWORK: MAP<br/>
              SENTINEL_DASH: SYNC<br/>
              THERMAL: STABLE
            </div>
          </div>
        </div>

        {/* ----------------- BOTTOM STATUS PANEL & SUB-READOUTS ----------------- */}
        <div className="p-5 border-t border-white/5 bg-[#04060c]/80 backdrop-blur-md z-20 space-y-3">
          
          {/* Timeline stage bar indicators */}
          {!isQuickMode && (
            <div className="grid grid-cols-7 gap-1.5 max-w-lg mx-auto">
              {[1, 2, 3, 4, 5, 6, 7].map((stageNum) => (
                <div key={stageNum} className="space-y-1 text-center">
                  <div
                    className={`h-1.5 rounded transition-all duration-350 ${
                      activeStage >= stageNum
                        ? stageNum === 7
                          ? "bg-green-400 shadow-[0_0_8px_#4ade80]"
                          : "bg-neon-cyan shadow-[0_0_8px_#00f0ff]"
                        : "bg-slate-800"
                    }`}
                  />
                  <span className={`text-[7px] block font-mono font-bold tracking-widest ${activeStage >= stageNum ? "text-slate-300" : "text-slate-600"}`}>
                    S{stageNum}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[10px] gap-2">
            <div className="flex items-center gap-1.5 uppercase tracking-wide font-bold">
              <Compass className="w-3.5 h-3.5 text-neon-cyan animate-spin-slow" />
              <span>
                {activeStage === 1 && "📡 Initializing CivicEye Satellite Network..."}
                {activeStage === 2 && "🛰 Loading Terrain Data & Space Matrix..."}
                {activeStage === 3 && "🛰 Acquiring sub-continent flight path..."}
                {activeStage === 4 && "🔍 Demarcating Regional State Borders..."}
                {activeStage === 5 && "🛣 Zooming to local municipal street network..."}
                {activeStage === 6 && "⚡ Executing active AI radar search sweep..."}
                {activeStage === 7 && "🛡 Anchoring FPV camera stabilization locks..."}
                {activeStage >= 8 && "🌟 Live telemetry synced successfully!"}
              </span>
            </div>

            <div className="font-mono text-[8px] text-slate-500 uppercase tracking-widest flex items-center gap-3">
              <span>LATENCY: 12ms</span>
              <span>BANDWIDTH: 4.8 GB/S</span>
            </div>
          </div>
        </div>

      </motion.div>
    </AnimatePresence>
  );
}
