import React from "react";
import { motion } from "motion/react";

interface CivicEyeLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  animate?: boolean;
}

export default function CivicEyeLogo({
  className = "",
  size = "md",
  showText = true,
  animate = true,
}: CivicEyeLogoProps) {
  // Determine dimensions based on size preset
  const dimensions = {
    sm: { width: 44, height: 44, textClass: "text-xs", badgeClass: "px-1 text-[8px]" },
    md: { width: 120, height: 120, textClass: "text-xl", badgeClass: "px-1.5 py-0.5 text-[10px]" },
    lg: { width: 220, height: 220, textClass: "text-3xl", badgeClass: "px-2 py-0.5 text-xs" },
    xl: { width: 340, height: 340, textClass: "text-4xl md:text-5xl", badgeClass: "px-2.5 py-1 text-sm" },
  }[size];

  // We only show full detailed metadata subtext below on lg and xl sizes
  const showFullSubtext = size === "lg" || size === "xl";

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Premium SVG Logo Wrapper */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full filter drop-shadow-[0_0_20px_rgba(6,182,212,0.25)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Cyber Eye main gradient */}
            <linearGradient id="cyberEyeGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#06b6d4" /> {/* Neon Cyan */}
              <stop offset="50%" stopColor="#3b82f6" /> {/* Neon Blue */}
              <stop offset="100%" stopColor="#a855f7" /> {/* Neon Purple */}
            </linearGradient>

            {/* Glowing Ring gradient */}
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
            </linearGradient>

            {/* Buildings Skyline inside Iris */}
            <linearGradient id="buildingIrisGrad" x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#0c0f1d" />
              <stop offset="50%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            {/* Decagon border gradient */}
            <linearGradient id="decagonBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
            </linearGradient>

            {/* Ambient Back Glow */}
            <radialGradient id="backGlowLogo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
              <stop offset="70%" stopColor="#a855f7" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#050508" stopOpacity="0" />
            </radialGradient>

            {/* Iris Glossy Spherical Highlight */}
            <radialGradient id="irisGlossLogo" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="70%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>

          {/* Ambient Background Glow behind logo */}
          <circle cx="200" cy="180" r="190" fill="url(#backGlowLogo)" />

          {/* === BACKGROUND DECAGONIC SHIELD === */}
          {size !== "sm" && (
            <g opacity="0.85">
              {/* Outer Decagon */}
              <polygon
                points="200,45 285,73 340,140 340,220 285,287 200,315 115,287 60,220 60,140 115,73"
                fill="#050814"
                fillOpacity="0.75"
                stroke="url(#decagonBorder)"
                strokeWidth="2"
                className="filter drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]"
              />

              {/* Sector Partition Lines radiating from the center (200, 180) */}
              <line x1="200" y1="180" x2="200" y2="45" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="200" y1="180" x2="285" y2="73" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="200" y1="180" x2="340" y2="140" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="200" y1="180" x2="340" y2="220" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="200" y1="180" x2="285" y2="287" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="200" y1="180" x2="200" y2="315" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="200" y1="180" x2="115" y2="287" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="200" y1="180" x2="60" y2="220" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="200" y1="180" x2="60" y2="140" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="200" y1="180" x2="115" y2="73" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

              {/* === HIGH-TECH CIVIC ICONS IN EACH SECTOR === */}
              {/* 1. Citizens / Community (Top center: 200, 45 to 285, 73 & 115, 73) */}
              <g transform="translate(182, 53) scale(0.9)" className="opacity-75 hover:opacity-100 transition-opacity duration-300">
                {/* Center person */}
                <circle cx="18" cy="12" r="4.5" fill="#38bdf8" />
                <path d="M 8,24 C 8,18 13,17 18,17 C 23,17 28,18 28,24" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                {/* Left person */}
                <circle cx="10" cy="14" r="3.5" fill="#0284c7" />
                <path d="M 3,24 C 3,20 6,19 10,19 C 12,19 14,19.5 15,20.5" fill="none" stroke="#0284c7" strokeWidth="1.2" strokeLinecap="round" />
                {/* Right person */}
                <circle cx="26" cy="14" r="3.5" fill="#0284c7" />
                <path d="M 33,24 C 33,20 30,19 26,19 C 24,19 22,19.5 21,20.5" fill="none" stroke="#0284c7" strokeWidth="1.2" strokeLinecap="round" />
              </g>

              {/* 2. Water / Utilities (Top Right sector: around 245, 75) */}
              <g transform="translate(232, 72) scale(0.75)" className="opacity-75">
                <path d="M 12,10 L 28,10 M 20,10 L 20,15 M 15,15 L 25,15 M 15,15 C 12,15 11,18 11,21 L 11,23" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M 11,23 C 11,25 13,27 15,27 C 17,27 19,25 19,23" fill="none" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" />
                {/* Falling Drop */}
                <path d="M 15,31 C 15,33 13.5,35 15,37 C 16.5,35 15,33 15,31" fill="#38bdf8" stroke="#38bdf8" strokeWidth="1" strokeLinejoin="round" />
              </g>

              {/* 3. Transportation / Roads (Right-top sector: around 295, 105) */}
              <g transform="translate(288, 105) scale(0.7)" className="opacity-75">
                <path d="M 15,40 L 25,5 L 35,5 L 45,40" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                <line x1="30" y1="35" x2="30" y2="30" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="30" y1="24" x2="30" y2="18" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="30" y1="12" x2="30" y2="8" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
              </g>

              {/* 4. Streetlights (Right-bottom sector: around 310, 165) */}
              <g transform="translate(305, 160) scale(0.7)" className="opacity-75">
                <path d="M 10,40 L 10,12 C 10,8 14,6 20,6 L 24,6" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                <ellipse cx="24" cy="8" rx="4" ry="2" fill="#eab308" />
                {/* Ray beam */}
                <polygon points="20,10 5,38 35,38" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.4" />
              </g>

              {/* 5. Environment / Greenery (Bottom-right sector: around 260, 245) */}
              <g transform="translate(250, 235) scale(0.75)" className="opacity-75">
                {/* Big tree */}
                <path d="M 20,38 L 20,28" fill="none" stroke="#10b981" strokeWidth="2" />
                <path d="M 20,28 C 14,28 12,22 15,17 C 12,12 18,8 20,10 C 22,8 28,12 25,17 C 28,22 26,28 20,28 Z" fill="none" stroke="#10b981" strokeWidth="1.8" />
                {/* Small tree */}
                <path d="M 32,38 L 32,32" fill="none" stroke="#059669" strokeWidth="1.5" />
                <circle cx="32" cy="27" r="5" fill="none" stroke="#059669" strokeWidth="1.5" />
              </g>

              {/* 6. Sanitation / Waste Management (Bottom-left sector: around 125, 245) */}
              <g transform="translate(122, 235) scale(0.7)" className="opacity-75">
                <rect x="10" y="14" width="20" height="24" rx="2" fill="none" stroke="#38bdf8" strokeWidth="2" />
                <line x1="8" y1="11" x2="32" y2="11" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                <path d="M 16,11 L 16,8 C 16,7 17,6 18,6 L 22,6 C 23,6 24,7 24,8 L 24,11" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                <line x1="15" y1="18" x2="15" y2="32" stroke="#38bdf8" strokeWidth="1.5" />
                <line x1="20" y1="18" x2="20" y2="32" stroke="#38bdf8" strokeWidth="1.5" />
                <line x1="25" y1="18" x2="25" y2="32" stroke="#38bdf8" strokeWidth="1.5" />
              </g>

              {/* 7. Bridges / Infrastructure (Left sector: around 70, 165) */}
              <g transform="translate(68, 155) scale(0.65)" className="opacity-75">
                <path d="M 5,30 Q 25,15 45,30" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                <line x1="5" y1="30" x2="45" y2="30" stroke="#38bdf8" strokeWidth="1.8" />
                {/* Vertical suspension cables */}
                <line x1="15" y1="24" x2="15" y2="30" stroke="#38bdf8" strokeWidth="1.2" />
                <line x1="25" y1="21" x2="25" y2="30" stroke="#38bdf8" strokeWidth="1.2" />
                <line x1="35" y1="24" x2="35" y2="30" stroke="#38bdf8" strokeWidth="1.2" />
                {/* Support towers */}
                <line x1="10" y1="15" x2="10" y2="38" stroke="#a855f7" strokeWidth="2" />
                <line x1="40" y1="15" x2="40" y2="38" stroke="#a855f7" strokeWidth="2" />
              </g>
            </g>
          )}

          {/* === CENTRAL EYE ELEMENT === */}
          <g>
            {/* Outer cyber eyelid sweep stroke (Cyan/Purple gradient) */}
            <path
              d="M 90 180 C 140 100, 260 100, 310 180 C 260 260, 140 260, 90 180 Z"
              fill="#060919"
              fillOpacity="0.8"
              stroke="url(#cyberEyeGrad)"
              strokeWidth="5"
              className="filter drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            />

            {/* Inner eyelids fine accents */}
            <path
              d="M 110 180 C 150 120, 250 120, 290 180"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.5"
              opacity="0.6"
            />
            <path
              d="M 110 180 C 150 240, 250 240, 290 180"
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.5"
              opacity="0.6"
            />

            {/* Concentric Telemetry Aperture Rings */}
            <circle
              cx="200"
              cy="180"
              r="56"
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="3"
              strokeDasharray="45 15 90 20"
              className="animate-[spin_40s_linear_infinite]"
              style={{ transformOrigin: "200px 180px" }}
            />
            <circle
              cx="200"
              cy="180"
              r="47"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1"
              strokeDasharray="5 5"
              opacity="0.5"
            />

            {/* == GLASS IRIS ORB == */}
            <circle
              cx="200"
              cy="180"
              r="40"
              fill="url(#irisGlossLogo)"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />

            {/* Skyscrapers / Civic Skyline inside Iris center */}
            <g transform="translate(178, 155) scale(0.22)" opacity="0.9">
              {/* Center Tower */}
              <rect x="35" y="20" width="30" height="100" fill="url(#buildingIrisGrad)" rx="2" />
              <polygon points="35,20 50,-5 65,20" fill="#38bdf8" />
              {/* Left Tower */}
              <rect x="5" y="45" width="24" height="75" fill="url(#buildingIrisGrad)" rx="1" />
              <polygon points="5,45 17,25 29,45" fill="#0284c7" />
              {/* Right Tower */}
              <rect x="71" y="45" width="24" height="75" fill="url(#buildingIrisGrad)" rx="1" />
              <polygon points="71,45 83,25 95,45" fill="#0284c7" />
            </g>

            {/* Glass Spherical Reflection Highlights */}
            <ellipse cx="200" cy="152" rx="22" ry="8" fill="#ffffff" fillOpacity="0.3" />
            <circle cx="182" cy="162" r="3" fill="#ffffff" fillOpacity="0.5" />
          </g>

          {/* === LEFT SIDE: PINK ALERT TRIANGLE & PARTICLES === */}
          {size !== "sm" && (
            <g>
              {/* Danger exclamation symbol container */}
              <polygon
                points="70,162 48,200 92,200"
                fill="#ec4899"
                fillOpacity="0.15"
                stroke="#ec4899"
                strokeWidth="2.5"
                strokeLinejoin="round"
                className="filter drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]"
              />
              {/* Exclamation point '!' */}
              <path d="M 70,173 L 70,187 M 70,193 L 70,195" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />

              {/* Floating digital packet squares */}
              <rect x="30" y="170" width="4" height="4" fill="#ec4899" opacity="0.6" className="animate-pulse" />
              <rect x="38" y="185" width="3" height="3" fill="#3b82f6" opacity="0.5" />
              <rect x="24" y="192" width="5" height="5" fill="#06b6d4" opacity="0.7" />
              <rect x="42" y="202" width="4" height="4" fill="#ec4899" opacity="0.8" />
            </g>
          )}

          {/* === RIGHT SIDE: NEURAL PCB NETWORK LEADS === */}
          {size !== "sm" && (
            <g strokeWidth="2.2" strokeLinecap="round" fill="none">
              {/* Lead 1: Center Horizontal */}
              <path d="M 310,180 L 350,180" stroke="#06b6d4" />
              <circle cx="350" cy="180" r="3.5" fill="#06b6d4" stroke="#06b6d4" strokeWidth="1" />

              {/* Lead 2: Upper diagonal */}
              <path d="M 292,150 L 318,150 L 338,165 L 362,165" stroke="#3b82f6" />
              <circle cx="362" cy="165" r="3.5" fill="#3b82f6" stroke="#3b82f6" strokeWidth="1" />

              {/* Lead 3: Lower diagonal */}
              <path d="M 292,210 L 318,210 L 334,195 L 358,195" stroke="#a855f7" strokeWidth="2" />
              <circle cx="358" cy="195" r="3" fill="#a855f7" stroke="#a855f7" strokeWidth="1" />

              {/* Lead 4: Extra outer branching cyber eyelash */}
              <path d="M 270,132 L 295,132 L 315,115 M 315,115 L 340,115" stroke="#06b6d4" strokeWidth="1.5" opacity="0.8" />
              <circle cx="340" cy="115" r="2.5" fill="#060919" stroke="#06b6d4" strokeWidth="1.5" opacity="0.8" />
            </g>
          )}
        </svg>

        {/* Dynamic laser scanning line */}
        {animate && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full flex items-center justify-center">
            <div
              className="absolute w-[180%] h-[3px] bg-gradient-to-r from-transparent via-cyan-400/85 to-transparent shadow-[0_0_12px_rgba(34,211,238,0.8)] animate-[scanLogo_5s_ease-in-out_infinite]"
              style={{
                transform: "translateY(-150%)",
                animationName: "scanLogo",
              }}
            />
          </div>
        )}
      </div>

      {/* Brand & Tagline typography block below the logo */}
      {showText && (
        <div className="mt-5 text-center select-none flex flex-col items-center">
          {/* Main Title "CIVICEYE AI" */}
          <h1 className={`${dimensions.textClass} font-display font-black tracking-[0.25em] text-white uppercase flex items-center justify-center gap-2`}>
            <span>CIVIC</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400 font-black">
              EYE
            </span>
            <span className={`font-mono font-bold uppercase rounded-lg border border-purple-500/30 bg-purple-950/35 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)] ${dimensions.badgeClass}`}>
              AI
            </span>
          </h1>

          {/* Interactive Core Mottos (ONLY on larger instances like Splash/Landing) */}
          {showFullSubtext && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-mono font-bold tracking-[0.15em] text-slate-300 bg-slate-950/50 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-md">
              <span className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors duration-200">
                <svg className="w-3.5 h-3.5 text-cyan-400 filter drop-shadow-[0_0_4px_rgba(34,211,238,0.4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                SEE IT.
              </span>
              <span className="text-slate-600 font-light">|</span>
              <span className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors duration-200">
                <svg className="w-3.5 h-3.5 text-cyan-400 filter drop-shadow-[0_0_4px_rgba(34,211,238,0.4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 11 2 2 4-4" />
                </svg>
                VERIFY IT.
              </span>
              <span className="text-slate-600 font-light">|</span>
              <span className="flex items-center gap-1.5 hover:text-pink-400 transition-colors duration-200">
                <svg className="w-3.5 h-3.5 text-pink-400 filter drop-shadow-[0_0_4px_rgba(244,114,182,0.4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                FIX IT.
              </span>
            </div>
          )}

          {/* High-End spaced marketing brand subtext at bottom */}
          {showFullSubtext && (
            <p className="mt-4 text-[9px] font-mono tracking-[0.45em] text-slate-500 uppercase font-medium">
              SMARTER COMMUNITY. STRONGER NATION.
            </p>
          )}
        </div>
      )}

      {/* Scanning styles */}
      <style>{`
        @keyframes scanLogo {
          0% { transform: translateY(-130px) rotate(-4deg); opacity: 0; }
          12% { opacity: 0.85; }
          45% { opacity: 1; }
          55% { opacity: 1; }
          88% { opacity: 0.85; }
          100% { transform: translateY(130px) rotate(4deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
