import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  MapPin, 
  Compass, 
  Locate, 
  ArrowRight, 
  User, 
  Check, 
  ShieldCheck, 
  Camera, 
  Brain, 
  Building, 
  FileText, 
  Map, 
  Bell 
} from "lucide-react";
import { UserLocation } from "../types";
import { useLocationService } from "../context/LocationContext";
import CivicEyeLogo from "./CivicEyeLogo";
import ManualLocationSelector from "./ManualLocationSelector";

interface OnboardingViewProps {
  onComplete: (displayName: string, location: UserLocation) => void;
}

export default function OnboardingView({ onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const [locationState, setLocationState] = useState<UserLocation | null>(null);
  const [showManualSelection, setShowManualSelection] = useState(false);

  const {
    location,
    isLoading: detectingLocation,
    error: locationError,
    requestGPS,
    selectManualLocation,
    updateLocation
  } = useLocationService();

  const handleManualLocationSelected = (loc: UserLocation) => {
    updateLocation(loc);
    setLocationState(loc);
    setTimeout(() => {
      setStep(4);
    }, 400);
  };

  const handleNextStep = () => {
    if (step === 2 && !userName.trim()) {
      setError("Please let us know what we can call you.");
      return;
    }
    setError(null);
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setError(null);
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleRequestGPS = async () => {
    setError(null);
    try {
      const loc = await requestGPS();
      setLocationState(loc);
      setTimeout(() => {
        setStep(4);
      }, 600);
    } catch (err: any) {
      console.warn("GPS error during onboarding:", err);
      // Fallback is already handled by LocationContext, we capture the classified error message
      setShowManualSelection(true);
    }
  };

  const handleManualSelect = (cityKey: string) => {
    selectManualLocation(cityKey);
    const defaults: Record<string, UserLocation> = {
      jaipur: { latitude: 26.9124, longitude: 75.7873, city: "Jaipur", state: "Rajasthan", locality: "Malviya Nagar", district: "Jaipur District", pincode: "302017", country: "India", source: "manual" },
      mumbai: { latitude: 19.0760, longitude: 72.8777, city: "Mumbai", state: "Maharashtra", locality: "Bandra West", district: "Mumbai Suburban", pincode: "400050", country: "India", source: "manual" },
      delhi: { latitude: 28.6139, longitude: 77.2090, city: "New Delhi", state: "Delhi", locality: "Connaught Place", district: "New Delhi District", pincode: "110001", country: "India", source: "manual" },
      bengaluru: { latitude: 12.9716, longitude: 77.5946, city: "Bengaluru", state: "Karnataka", locality: "Indiranagar", district: "Bengaluru Urban", pincode: "560038", country: "India", source: "manual" },
      sf: { latitude: 37.7749, longitude: -122.4194, city: "San Francisco", state: "California", locality: "Mission District", district: "San Francisco County", pincode: "94110", country: "United States", source: "manual" }
    };
    
    const loc = defaults[cityKey] || defaults.jaipur;
    setLocationState(loc);
    // Auto transition
    setTimeout(() => {
      setStep(4);
    }, 400);
  };

  const handleFinishOnboarding = () => {
    const finalLocation = locationState || {
      latitude: 26.9124,
      longitude: 75.7873,
      city: "Jaipur",
      state: "Rajasthan",
      locality: "Malviya Nagar",
      district: "Jaipur District",
      pincode: "302017",
      country: "India",
      source: "manual" as const
    };
    onComplete(userName, finalLocation);
  };

  return (
    <div className="relative min-h-screen text-white overflow-hidden flex flex-col items-center justify-center px-4 py-12 select-none">
      
      {/* Premium Aurora background glows */}
      <div className="absolute top-[15%] left-[20%] w-[400px] h-[400px] bg-[#a855f7]/10 rounded-full filter blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[15%] w-[450px] h-[450px] bg-[#06b6d4]/10 rounded-full filter blur-[150px] pointer-events-none" />

      {/* Outer Floating Card with Soft Glassmorphism */}
      <div className="w-full max-w-xl glass-panel p-8 sm:p-10 rounded-3xl border border-white/10 bg-slate-950/80 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl relative z-10 overflow-hidden flex flex-col justify-between min-h-[580px]">
        
        {/* Step Indicator */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <CivicEyeLogo size="sm" showText={false} animate={true} />
            <span className="font-display font-black text-sm tracking-wider uppercase">
              Civic<span className="text-neon-cyan">Eye</span>
            </span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === i 
                    ? "w-6 bg-gradient-to-r from-neon-cyan to-neon-purple" 
                    : i < step 
                      ? "w-2.5 bg-neon-cyan/40" 
                      : "w-1.5 bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Dynamic Multi-Step Contents */}
        <div className="flex-grow flex flex-col justify-center py-4">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="text-center space-y-6"
              >
                {/* Brand Illustration & Holographic Icon */}
                <div className="relative inline-block mx-auto">
                  <div className="absolute inset-0 bg-neon-cyan/20 rounded-full filter blur-xl animate-pulse"></div>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="relative w-28 h-28 rounded-3xl bg-gradient-to-tr from-neon-purple via-purple-600 to-neon-cyan p-[1px] flex items-center justify-center shadow-2xl"
                  >
                    <div className="w-full h-full rounded-3xl bg-slate-950 flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-neon-cyan animate-pulse" />
                    </div>
                  </motion.div>
                </div>

                <div className="space-y-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-neon-purple/10 border border-neon-purple/20 text-[#d8b4fe] tracking-widest uppercase font-semibold">
                    CITIZEN POWERED PLATFORM
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
                    Welcome to CivicEye
                  </h1>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                    We help local citizens automatically improve their communities, solve infrastructure breakdowns, and contact authorities using advanced AI.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 text-center"
              >
                <div className="space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center mx-auto text-neon-purple">
                    <User className="w-6 h-6" />
                  </div>
                  <h2 className="font-display text-2xl font-black text-white">
                    What should we call you?
                  </h2>
                  <p className="text-xs text-slate-400">
                    We'll personalize your local sentinel profile and badges.
                  </p>
                </div>

                <div className="max-w-xs mx-auto relative group">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter your name"
                    autoFocus
                    maxLength={24}
                    className="w-full px-5 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-neon-cyan/60 text-white placeholder-slate-500 font-display font-medium text-center focus:outline-none focus:ring-1 focus:ring-neon-cyan/30 transition-all text-sm"
                  />
                  <div className="absolute inset-0 -z-10 rounded-xl bg-neon-cyan/5 filter blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
                </div>

                {error && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-rose-400 font-mono"
                  >
                    ⚠️ {error}
                  </motion.p>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 text-center"
              >
                <div className="space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mx-auto text-neon-cyan">
                    <MapPin className="w-6 h-6 animate-pulse" />
                  </div>
                  <h2 className="font-display text-2xl font-black text-white">
                    Set Your Active Zone
                  </h2>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    We use your location to automatically detect nearby civic issues, AQI levels, local emergency contacts, and generate geo-aware AI reports.
                  </p>
                </div>

                {!showManualSelection ? (
                  <div className="space-y-3.5 max-w-xs mx-auto pt-2">
                    <button
                      onClick={handleRequestGPS}
                      disabled={detectingLocation}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-neon-cyan to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 active:scale-98 shadow-lg shadow-cyan-950/40 cursor-pointer disabled:opacity-50"
                    >
                      {detectingLocation ? (
                        <>
                          <Compass className="w-4 h-4 animate-spin" />
                          Detecting Location...
                        </>
                      ) : (
                        <>
                          <Locate className="w-4 h-4" />
                          Allow Location Access
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setShowManualSelection(true)}
                      className="w-full py-3 px-4 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] hover:border-white/15 text-slate-300 font-display font-bold text-xs uppercase tracking-wider transition-all duration-200 active:scale-98 cursor-pointer"
                    >
                      Choose Manually
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-md mx-auto pt-2">
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider text-center">Enter your country, state/province, and city below</p>
                    
                    <ManualLocationSelector 
                      onLocationSelected={handleManualLocationSelected}
                      initialLocation={locationState}
                    />
                    
                    <div className="text-center pt-2">
                      <button
                        onClick={() => setShowManualSelection(false)}
                        className="text-xs font-mono text-neon-cyan hover:underline"
                      >
                        ← Back to automatic detection
                      </button>
                    </div>
                  </div>
                )}

                {locationState && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs max-w-xs mx-auto flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Zone Set: <strong>{locationState.city}, {locationState.state}</strong></span>
                  </motion.div>
                )}

                {(error || locationError) && (
                  <p className="text-xs text-rose-400 font-mono max-w-xs mx-auto">⚠️ {error || locationError}</p>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-mono text-neon-cyan uppercase font-black tracking-wider">HOW IT WORKS</span>
                  <h2 className="font-display text-2xl font-black text-white">Your Civic Tools</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1 select-none">
                  {[
                    { icon: <Camera className="w-5 h-5 text-rose-400" />, title: "Report an Issue", desc: "Instantly capture problems on the fly." },
                    { icon: <Brain className="w-5 h-5 text-neon-purple animate-pulse" />, title: "AI Diagnostic Engine", desc: "Gemini detects categories and measures severity." },
                    { icon: <Building className="w-5 h-5 text-neon-cyan" />, title: "Find Authority", desc: "Locates the correct municipal department." },
                    { icon: <FileText className="w-5 h-5 text-blue-400" />, title: "Generate Complaints", desc: "Writes ready-to-send formal notifications." },
                    { icon: <Map className="w-5 h-5 text-emerald-400" />, title: "Community Map", desc: "Pings issue onto the shared citizen matrix." },
                    { icon: <Bell className="w-5 h-5 text-amber-400 animate-bounce" />, title: "Nearby Risk Forecasts", desc: "Flags storm drainage and infrastructure warnings." }
                  ].map((feat, i) => (
                    <div 
                      key={i}
                      className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl flex items-start gap-3 hover:bg-white/[0.03] transition-all"
                    >
                      <div className="p-2 bg-white/[0.03] border border-white/5 rounded-xl shrink-0 mt-0.5">
                        {feat.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-display font-bold text-white">{feat.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex justify-between items-center border-t border-white/5 pt-6 mt-4">
          {step > 1 ? (
            <button
              onClick={handlePrevStep}
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-display font-semibold text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={handleNextStep}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 hover:scale-103 active:scale-97 shadow-lg shadow-purple-950/30 cursor-pointer"
            >
              Next
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinishOnboarding}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-display font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl shadow-emerald-950/40 cursor-pointer"
            >
              Start Using CivicEye
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
