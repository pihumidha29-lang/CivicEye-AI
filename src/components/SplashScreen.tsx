import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import CivicEyeLogo from "./CivicEyeLogo";
import { Sparkles, Radio, Database, RefreshCw, Cpu, Bot, CheckCircle } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
  key?: string;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [bootPhase, setBootPhase] = useState<"dark" | "glow" | "materialize" | "loading" | "complete">("dark");
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const loadingSteps = [
    { label: "Connecting Community Network...", icon: <Radio className="w-4 h-4 text-cyan-400" /> },
    { label: "Loading Infrastructure Data...", icon: <Database className="w-4 h-4 text-blue-400" /> },
    { label: "Syncing Live Reports...", icon: <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" /> },
    { label: "Initializing Disaster Forecast Engine...", icon: <Cpu className="w-4 h-4 text-red-400" /> },
    { label: "Connecting AI Community Agent...", icon: <Bot className="w-4 h-4 text-emerald-400" /> },
    { label: "System Online ✓", icon: <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse" /> }
  ];

  // Timing triggers for the intro sequence
  useEffect(() => {
    // 1. Black screen to Ambient Glow
    const glowTimer = setTimeout(() => {
      setBootPhase("glow");
    }, 800);

    // 2. Logo starts materializing
    const materializeTimer = setTimeout(() => {
      setBootPhase("materialize");
    }, 1800);

    // 3. System enters loading phase
    const loadingTimer = setTimeout(() => {
      setBootPhase("loading");
    }, 4200);

    return () => {
      clearTimeout(glowTimer);
      clearTimeout(materializeTimer);
      clearTimeout(loadingTimer);
    };
  }, []);

  // Incremental loader sequence mimicking systems boot
  useEffect(() => {
    if (bootPhase !== "loading") return;

    const interval = setInterval(() => {
      setLoadingStep((prevStep) => {
        const nextStep = prevStep + 1;
        if (nextStep < loadingSteps.length) {
          // Increment progress based on step
          setProgress(Math.round((nextStep / (loadingSteps.length - 1)) * 100));
          return nextStep;
        } else {
          clearInterval(interval);
          setBootPhase("complete");
          return prevStep;
        }
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [bootPhase]);

  // Handle final exit transition
  useEffect(() => {
    if (bootPhase === "complete") {
      const exitTimer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(exitTimer);
    }
  }, [bootPhase, onComplete]);

  return (
    <div className="fixed inset-0 bg-[#020204] z-[9999] flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      
      {/* 1. Subtle Animated Aurora Gradients Behind */}
      <AnimatePresence>
        {bootPhase !== "dark" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 pointer-events-none overflow-hidden z-0"
          >
            {/* Soft aurora circles */}
            <div className="absolute top-[15%] left-[20%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-cyan-500/10 to-transparent filter blur-[120px] aurora-bg-1" />
            <div className="absolute bottom-[10%] right-[15%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-500/10 to-transparent filter blur-[120px] aurora-bg-2" />
            <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-radial from-blue-500/5 to-transparent filter blur-[150px] aurora-bg-3" />
            
            {/* Space grid overlay */}
            <div className="absolute inset-0 bg-space-grid opacity-25" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Central Logo Container with Motion */}
      <div className="relative flex flex-col items-center justify-center z-10 w-full max-w-lg px-6">
        
        {/* Subtle Light Rays & Halo behind the logo */}
        <AnimatePresence>
          {bootPhase === "glow" || bootPhase === "materialize" || bootPhase === "loading" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              className="absolute w-[350px] h-[350px] pointer-events-none"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/10 via-blue-500/5 to-purple-500/10 blur-[45px] animate-pulse" />
              {/* Radial light lines */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_70%)]" />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* CivicEye AI Logo with high-tech glass effect */}
        <AnimatePresence>
          {(bootPhase === "materialize" || bootPhase === "loading" || bootPhase === "complete") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1.0, y: 0 }}
              transition={{ duration: 1.8, cubicBezier: [0.16, 1, 0.3, 1] }}
              className="relative"
              layoutId="app-logo-container"
            >
              <CivicEyeLogo size="xl" showText={false} animate={true} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text Area */}
        <div className="mt-8 text-center min-h-[160px] flex flex-col items-center justify-start w-full">
          <AnimatePresence>
            {(bootPhase === "materialize" || bootPhase === "loading" || bootPhase === "complete") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 1 }}
                className="space-y-3"
              >
                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-display font-black tracking-[0.25em] text-white uppercase">
                  CivicEye{" "}
                  <span className="gradient-title-premium font-extrabold px-3 py-1 rounded-xl border border-cyan-400/20 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                    AI
                  </span>
                </h1>

                {/* Subtitle / Tagline */}
                <p className="text-xs font-mono tracking-[0.4em] text-cyan-400 font-bold uppercase py-1">
                  "See it. Verify it. Fix it."
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Initialization details */}
          <AnimatePresence>
            {(bootPhase === "loading" || bootPhase === "complete") && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="w-full mt-6 space-y-4"
              >
                {/* Loader status */}
                <div className="text-center font-mono text-[10px] text-slate-400 tracking-wider">
                  <span className="text-cyan-400 animate-pulse">●</span> Initializing AI Civic Intelligence System...
                </div>

                {/* Advanced Cyber Progress Indicators */}
                <div className="w-full max-w-sm mx-auto space-y-2">
                  <div className="flex items-center justify-between font-mono text-[9px] text-slate-500 uppercase tracking-widest">
                    <span>Terminal Progress</span>
                    <span className="text-cyan-400 font-bold">{progress}%</span>
                  </div>
                  
                  {/* Glowing custom bar */}
                  <div className="h-[4px] w-full bg-slate-950 rounded-full border border-white/5 relative overflow-hidden">
                    <motion.div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"
                      initial={{ width: "0%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8 }}
                    />
                    <div className="absolute top-0 bottom-0 left-0 right-0 bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:4px_100%] pointer-events-none" />
                  </div>
                </div>

                {/* Sequence Logs List */}
                <div className="h-10 flex items-center justify-center font-mono text-[11px] text-slate-300">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={loadingStep}
                      initial={{ opacity: 0, y: 5, filter: "blur(2px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -5, filter: "blur(2px)" }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg shadow-lg"
                    >
                      {loadingSteps[loadingStep].icon}
                      <span className="tracking-wide">{loadingSteps[loadingStep].label}</span>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating particles background decorative */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-400/20 floating-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 80 + 10}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              animationDelay: `${Math.random() * -10}s`,
              animationDuration: `${Math.random() * 10 + 8}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
