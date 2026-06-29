import React from "react";
import { Sparkles, LayoutDashboard, MapPin, AlertTriangle, User, Menu, X, ShieldAlert, Building, MessageSquare } from "lucide-react";
import { ViewType, UserProfile } from "../types";
import { motion } from "motion/react";
import CivicEyeLogo from "./CivicEyeLogo";

interface NavigationProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  userProfile: UserProfile | null;
}

export default function Navigation({ currentView, onNavigate, userProfile }: NavigationProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { id: "dashboard", label: "Home", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "map", label: "Community Map", icon: <MapPin className="w-4 h-4" /> },
    { id: "report", label: "Report Issue", icon: <AlertTriangle className="w-4 h-4" /> },
    { id: "forecaster", label: "Transparency Hub", icon: <ShieldAlert className="w-4 h-4 text-neon-cyan animate-pulse" /> },
    { id: "civic_connect", label: "Contact Authorities", icon: <Building className="w-4 h-4 text-neon-cyan" /> },
    { id: "ask_civiceye", label: "Ask CivicEye", icon: <MessageSquare className="w-4 h-4 text-neon-cyan" /> },
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> }
  ];

  // If we are currently in onboarding, do not render the global navigation bar at all
  if (currentView === "onboarding") {
    return null;
  }

  return (
    <nav className="sticky top-4 z-50 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pointer-events-none">
      <div className="glass-panel border border-white/10 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.5)] px-6 py-3 relative z-50 pointer-events-auto hover:border-neon-purple/30 transition-colors">
        {/* Glow edge highlight */}
        <div className="absolute inset-x-12 top-0 h-[1px] bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent"></div>
        <div className="absolute inset-x-12 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-neon-purple/40 to-transparent"></div>

        <div className="flex items-center justify-between h-12">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => onNavigate("dashboard")}>
            <motion.div 
              layoutId="app-logo-container" 
              className="flex items-center gap-2"
              transition={{ type: "spring", stiffness: 100, damping: 18 }}
            >
              <CivicEyeLogo size="sm" showText={false} animate={true} />
              <span className="font-display font-black text-xl tracking-wider text-white">
                CivicEye <span className="gradient-title-premium font-extrabold">AI</span>
              </span>
            </motion.div>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-1.5">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id as ViewType)}
                  className={`relative px-4 py-2.5 rounded-xl text-xs font-display font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? "text-white bg-white/5 border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_15px_rgba(168,85,247,0.2)]"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {/* Glowing active bar indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 bg-neon-purple/10 rounded-xl border border-neon-purple/30 z-[-1]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className={`${isActive ? "text-neon-cyan" : "text-inherit"}`}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* User Profile Summary */}
          <div className="hidden md:flex items-center gap-4">
            {userProfile ? (
              <div 
                onClick={() => onNavigate("profile")}
                className="flex items-center gap-3 bg-white/5 border border-white/10 p-1 pr-3.5 rounded-xl hover:border-neon-cyan/40 hover:bg-white/10 transition-all cursor-pointer"
              >
                <img
                  src={userProfile.photoURL}
                  alt="User"
                  className="w-7 h-7 rounded-lg object-cover bg-slate-900 border border-white/10"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left leading-none">
                  <span className="block text-[10px] font-display font-black text-white truncate max-w-[100px]">
                    {userProfile.displayName}
                  </span>
                  <span className="text-[8px] font-mono text-neon-cyan font-bold uppercase tracking-wider">
                    Level {userProfile.citizenLevel} Sentinel
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[10px] font-mono text-slate-500">Sentinel Mode</div>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-400 hover:text-white cursor-pointer focus:outline-none p-1 hover:bg-white/5 rounded-lg transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden mt-2 glass-panel border border-white/10 rounded-2xl p-4 space-y-2 pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-200">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id as ViewType);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 rounded-xl text-xs font-display font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                  isActive
                    ? "bg-neon-purple/10 border border-neon-purple/30 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className={`${isActive ? "text-neon-cyan" : "text-inherit"}`}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}

          {userProfile && (
            <div 
              onClick={() => {
                onNavigate("profile");
                setIsOpen(false);
              }}
              className="border-t border-white/10 pt-4 mt-2 flex items-center gap-3 cursor-pointer p-1 rounded-xl hover:bg-white/5"
            >
              <img
                src={userProfile.photoURL}
                alt="User"
                className="w-8 h-8 rounded-lg object-cover bg-slate-900 border border-white/10"
                referrerPolicy="no-referrer"
              />
              <div className="text-left">
                <div className="text-xs font-black text-white leading-none">{userProfile.displayName}</div>
                <div className="text-[9px] font-mono text-neon-cyan mt-1 uppercase font-bold tracking-wider">
                  Level {userProfile.citizenLevel} Sentinel
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
