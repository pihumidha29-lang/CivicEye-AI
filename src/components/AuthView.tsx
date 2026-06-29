import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { auth, googleProvider } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut, 
  updateProfile 
} from "firebase/auth";
import { Mail, Lock, User, LogIn, UserPlus, ShieldCheck, Sparkles } from "lucide-react";

interface AuthViewProps {
  onAuthSuccess: (user: any) => void;
  onNavigate: (view: any) => void;
  onGuestLogin?: () => void;
}

export default function AuthView({ onAuthSuccess, onNavigate, onGuestLogin }: AuthViewProps) {
  // Helper to detect if browser is Safari or running on iOS (which restricts iframe third-party cookies)
  const isIOSOrSafari = () => {
    if (typeof window === "undefined" || !window.navigator) return false;
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isSafari = ua.includes("safari") && !ua.includes("chrome") && !ua.includes("chromium");
    return isIOS || isSafari;
  };
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check for Google Sign-In Redirect Results on mount
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          localStorage.removeItem("civic_guest_user");
          onAuthSuccess(result.user);
        }
      } catch (err: any) {
        console.error("Google Redirect Auth error:", err);
        setError(err.message || "Failed to retrieve redirect sign-in result.");
      }
    };
    checkRedirectResult();
  }, [onAuthSuccess]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // Clear guest/demo session so that the authenticating real session can take over
    localStorage.removeItem("civic_guest_user");

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess(userCredential.user);
      } else {
        if (!name.trim()) {
          throw new Error("Display Name is required for Registration.");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name,
          photoURL: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(name)}`
        });
        onAuthSuccess(userCredential.user);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let errMsg = err.message || "An authentication error occurred.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        errMsg = "Invalid email or password combination.";
      } else if (err.code === "auth/email-already-in-use") {
        errMsg = "An account with this email address already exists.";
      } else if (err.code === "auth/invalid-credential") {
        errMsg = "Invalid credentials provided.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    // Clear guest/demo session so that the authenticating real session can take over
    localStorage.removeItem("civic_guest_user");

    try {
      if (isIOSOrSafari()) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        onAuthSuccess(result.user);
      }
    } catch (err: any) {
      console.error("Google Auth error:", err);
      // Fallback or explain iframe block gracefully if popup block occurs
      if (err.message?.includes("iframe") || err.code === "auth/popup-blocked") {
        setError("Sign-in popup blocked inside this sandbox frame. Try using Email/Password, demo sandboxes, or open this app in a new window/tab to complete Google Auth.");
      } else {
        setError(err.message || "Google Sign-in failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Demo Sandbox bypass login (Extremely useful for reviewing the app)
  const handleSandboxLogin = (role: "citizen" | "legend") => {
    setLoading(true);
    // Clear real session first to ensure clean state
    signOut(auth).catch(() => {});
    setTimeout(() => {
      const mockUser = {
        uid: role === "citizen" ? "demo_citizen_99" : "demo_legend_77",
        email: role === "citizen" ? "citizen@civiceye.ai" : "legend.hero@civiceye.ai",
        displayName: role === "citizen" ? "Jane Miller" : "Chief Arthur Pendelton",
        photoURL: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${role}`,
        isDemo: true
      };
      const guestProfile = {
        uid: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.displayName,
        photoURL: mockUser.photoURL,
        xp: role === "citizen" ? 350 : 2400,
        citizenLevel: role === "citizen" ? 2 : 5,
        badges: role === "citizen" ? ["badge_first_report"] : ["badge_first_report", "badge_active_verify", "badge_spotlight_reformed"],
        contributionsCount: role === "citizen" ? 3 : 24,
        impactScore: role === "citizen" ? 30 : 280,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("civic_guest_user", JSON.stringify({ user: mockUser, profile: guestProfile }));
      onAuthSuccess(mockUser);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-space-black bg-space-grid flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Decorative neon ambient blobs */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-neon-purple/10 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] bg-neon-cyan/10 rounded-full filter blur-[100px] pointer-events-none"></div>

      {/* App brand header */}
      <div className="mb-8 text-center relative z-10 cursor-pointer" onClick={() => onNavigate("landing")}>
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-neon-purple to-neon-cyan flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <span className="font-display font-bold text-2xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            CivicEye <span className="text-neon-cyan font-extrabold">AI</span>
          </span>
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1 tracking-widest uppercase">Decentralized Urban Verification</p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-8 relative z-10"
      >
        {/* Toggle between login and sign up */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 mb-8">
          <button
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`flex-1 py-2 text-sm font-display rounded-lg font-medium transition-all ${
              isLogin ? "bg-gradient-to-r from-neon-purple to-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`flex-1 py-2 text-sm font-display rounded-lg font-medium transition-all ${
              !isLogin ? "bg-gradient-to-r from-neon-purple to-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        <h2 className="font-display text-2xl font-bold mb-6 text-center">
          {isLogin ? "Welcome back, Citizen" : "Join the Civic Shield"}
        </h2>

        {/* Safari Warning inside Auth Card */}
        {isIOSOrSafari() && (
          <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left">
            <div className="flex gap-2 items-center">
              <span className="text-sm">⚠️</span>
              <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Safari/iOS Detected</p>
            </div>
            <p className="text-[11px] text-slate-300 font-sans mt-1.5 leading-relaxed">
              Google/Firebase cookie auth is blocked inside iframes by Safari's privacy settings. Please use the <strong>credentials-free Quick Guest login</strong> below to explore the app instantly!
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs leading-relaxed font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Display Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm font-sans"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="email"
                required
                placeholder="citizen@civiceye.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl font-display font-medium bg-gradient-to-r from-neon-purple to-purple-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : isLogin ? (
              <>
                <LogIn className="w-4.5 h-4.5" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-4.5 h-4.5" />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-x-0 h-px bg-white/5"></div>
          <span className="relative px-3 bg-[#0c0a1a] text-[10px] font-mono text-slate-400 uppercase tracking-wider">Or credentials-free</span>
        </div>

        {/* Quick sandbox logins */}
        <div className="space-y-2">
          {onGuestLogin && (
            <button
              onClick={onGuestLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.1)]"
            >
              <ShieldCheck className="w-4.5 h-4.5" />
              ⚡ QUICK ENTRY: CONTINUE AS GUEST
            </button>
          )}
          <button
            onClick={() => handleSandboxLogin("citizen")}
            disabled={loading}
            className="w-full py-2.5 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 hover:bg-neon-cyan/10 text-neon-cyan text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <User className="w-4 h-4" />
            Quick Demo: Citizen Sandbox (Jane)
          </button>
          <button
            onClick={() => handleSandboxLogin("legend")}
            disabled={loading}
            className="w-full py-2.5 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <User className="w-4 h-4" />
            Quick Demo: Leaderboard Legend (Arthur)
          </button>
        </div>

        {/* Traditional Google Auth */}
        <div className="mt-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.743-.08-1.3-.176-1.857H12.24z"
              />
            </svg>
            Sign in with Google Account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
