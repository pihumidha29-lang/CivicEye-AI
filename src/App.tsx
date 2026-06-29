import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import {
  UserProfile,
  CivicIssue,
  Comment,
  ViewType,
  UserLocation
} from "./types";
import {
  GLOBAL_BADGES,
  COMMUNITY_MISSIONS,
  INITIAL_ISSUES
} from "./data";

// Components
import { motion, AnimatePresence } from "motion/react";
import SplashScreen from "./components/SplashScreen";
import Navigation from "./components/Navigation";
import OnboardingView from "./components/OnboardingView";
import DashboardView from "./components/DashboardView";
import ReportView from "./components/ReportView";
import MapView from "./components/MapView";
import ProfileView from "./components/ProfileView";
import CinematicDroneTransition from "./components/CinematicDroneTransition";
import DisasterForecasterView from "./components/DisasterForecasterView";
import CivicConnectHub from "./components/CivicConnectHub";
import AskCivicEyeView from "./components/AskCivicEyeView";
import CommandCenterBackground from "./components/CommandCenterBackground";
import FloatingAIAssistant from "./components/FloatingAIAssistant";
import { useLocationService } from "./context/LocationContext";
import ManualLocationSelector from "./components/ManualLocationSelector";

import { MapPin, Compass, Navigation as NavIcon, Locate, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    return localStorage.getItem("civiceye_onboarded") === "true" ? "dashboard" : "onboarding";
  });
  const [isSplashComplete, setIsSplashComplete] = useState(false);
  const [isDroneTransitionActive, setIsDroneTransitionActive] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  useEffect(() => {
    if (currentView === "map") {
      setIsDroneTransitionActive(true);
    } else {
      setIsDroneTransitionActive(false);
    }
  }, [currentView]);
  
  // Use unified Location Service
  const {
    location: userLocation,
    isLoading: isLocating,
    error: locationError,
    statusMessage: locationStatusMessage,
    requestGPS,
    selectManualLocation,
    updateLocation,
    retryLocation
  } = useLocationService();

  const [showLocationModal, setShowLocationModal] = useState(false);

  // Trigger permission prompt modal on launch
  useEffect(() => {
    if (isSplashComplete && !userLocation && currentView !== "onboarding") {
      setShowLocationModal(true);
    }
  }, [isSplashComplete, userLocation, currentView]);

  // Request GPS handler
  const handleRequestGPS = () => {
    requestGPS()
      .then(() => {
        setShowLocationModal(false);
      })
      .catch((err) => {
        console.warn("[App] Modal GPS request failed, switching to manual mode fallback", err);
      });
  };

  // Manual select handler
  const handleManualSelect = (loc: UserLocation) => {
    updateLocation(loc);
    setShowLocationModal(false);
  };


  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("civiceye_user_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Could not parse saved user profile", e);
      }
    }
    return null;
  });

  // Core issues and comments data lists
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [commentsMap, setCommentsMap] = useState<{ [issueId: string]: Comment[] }>({});
  const [missions, setMissions] = useState(COMMUNITY_MISSIONS);
  const [selectedIssueForMap, setSelectedIssueForMap] = useState<CivicIssue | null>(null);
  const [recentlySubmittedIssueId, setRecentlySubmittedIssueId] = useState<string | null>(null);

  // Complete onboarding workflow
  const handleOnboardingComplete = (name: string, location: UserLocation) => {
    const newProfile: UserProfile = {
      uid: "citizen_" + Math.random().toString(36).substring(2, 9),
      email: "citizen@civiceye.local",
      displayName: name,
      photoURL: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(name)}`,
      xp: 150,
      citizenLevel: 1,
      badges: ["badge_first_report"],
      contributionsCount: 1,
      impactScore: 10,
      createdAt: new Date().toISOString()
    };
    setUserProfile(newProfile);
    localStorage.setItem("civiceye_user_profile", JSON.stringify(newProfile));
    
    updateLocation(location);
    
    localStorage.setItem("civiceye_onboarded", "true");
    setCurrentView("dashboard");
  };

  // Hydrate Issues with Realtime Firestore Listener
  useEffect(() => {
    const issuesColRef = collection(db, "issues");
    
    const unsubscribe = onSnapshot(issuesColRef, async (snapshot) => {
      if (snapshot.empty) {
        try {
          for (const item of INITIAL_ISSUES) {
            await setDoc(doc(db, "issues", item.id), item);
          }
          await seedInitialComments();
        } catch (err) {
          console.error("Seeding initial issues failed: ", err);
        }
      } else {
        const list: CivicIssue[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as CivicIssue);
        });
        setIssues(list.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()));
      }
    }, (error) => {
      console.warn("Real-time listener failed, running fallback memory dataset:", error);
      setIssues(INITIAL_ISSUES);
    });

    // Fetch comments for all issues
    fetchAllComments();

    return () => unsubscribe();
  }, []);

  const seedInitialComments = async () => {
    const initialComments: Comment[] = [
      { id: "c_1", issueId: "issue_1", userId: "u_s_1", userName: "Arthur Doyle", text: "Confirmed! Replaced this spot this morning and it's heavily damaged.", createdAt: new Date().toISOString() },
      { id: "c_2", issueId: "issue_2", userId: "u_s_2", userName: "Sarah Parker", text: "Reported this to the city council last week but no progress yet. Hopefully, this flags it!", createdAt: new Date().toISOString() }
    ];

    for (const comment of initialComments) {
      const parentIssueDoc = doc(db, "issues", comment.issueId);
      const commentsColRef = collection(parentIssueDoc, "comments");
      try {
        await setDoc(doc(commentsColRef, comment.id), comment);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `issues/${comment.issueId}/comments/${comment.id}`);
      }
    }
  };

  const fetchAllComments = async () => {
    const updatedMap: { [issueId: string]: Comment[] } = {};

    try {
      for (const issue of INITIAL_ISSUES) {
        const commentsColRef = collection(db, "issues", issue.id, "comments");
        let commentsSnapshot;
        try {
          commentsSnapshot = await getDocs(commentsColRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `issues/${issue.id}/comments`);
        }
        const commentsList: Comment[] = [];
        commentsSnapshot.forEach((snap) => {
          commentsList.push(snap.data() as Comment);
        });
        updatedMap[issue.id] = commentsList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      setCommentsMap(updatedMap);
    } catch (e) {
      console.warn("Could not fetch database comments", e);
    }
  };

  // Gamification reward distributor helper
  const addXPAndCheckBadges = async (xpToAdd: number, isContribution: boolean = false) => {
    if (!userProfile) return;

    let updatedXP = userProfile.xp + xpToAdd;
    let updatedLevel = userProfile.citizenLevel;
    let updatedBadges = [...userProfile.badges];

    // Simple level progression: level = Math.floor(Math.sqrt(xp / 500)) + 1
    const nextLevelXP = Math.pow(updatedLevel, 2) * 500;
    if (updatedXP >= nextLevelXP) {
      updatedLevel += 1;
    }

    const contributions = userProfile.contributionsCount + (isContribution ? 1 : 0);

    // Dynamic gamification unlock requirements
    if (contributions >= 3 && !updatedBadges.includes("badge_three_verifications")) {
      updatedBadges.push("badge_three_verifications");
    }
    if (userProfile.impactScore + (isContribution ? 15 : 5) >= 50 && !updatedBadges.includes("badge_impact_50")) {
      updatedBadges.push("badge_impact_50");
    }

    const newProfile: UserProfile = {
      ...userProfile,
      xp: updatedXP,
      citizenLevel: updatedLevel,
      contributionsCount: contributions,
      badges: updatedBadges,
      impactScore: userProfile.impactScore + (isContribution ? 15 : 5)
    };

    setUserProfile(newProfile);

    try {
      // Save profile updates to cloud
      try {
        await setDoc(doc(db, "users", userProfile.uid), newProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userProfile.uid}`);
      }
    } catch (e) {
      console.warn("Could not save XP progress to database offline mode active");
    }
  };

  const handleAddCustomBadge = async (badgeId: string) => {
    if (!userProfile) return;
    if (userProfile.badges.includes(badgeId)) return;

    const updatedBadges = [...userProfile.badges, badgeId];
    const newProfile: UserProfile = {
      ...userProfile,
      badges: updatedBadges
    };
    setUserProfile(newProfile);

    try {
      try {
        await setDoc(doc(db, "users", userProfile.uid), newProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userProfile.uid}`);
      }
    } catch (e) {
      console.warn("Could not save custom badge to database");
    }
  };

  // Create issue report action
  const handleCreateReport = async (reportData: Partial<CivicIssue>) => {
    try {
      const issueId = "issue_" + Date.now();
      const completeIssue: CivicIssue = {
        ...(reportData as CivicIssue),
        id: issueId
      };

      // 1. Save to firestore
      try {
        await setDoc(doc(db, "issues", issueId), completeIssue);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `issues/${issueId}`);
      }

      // 2. Set recently submitted state for animation
      setRecentlySubmittedIssueId(issueId);

      // 3. Award Citizen points
      await addXPAndCheckBadges(50, true);

      // Increment mission progress
      setMissions(prev =>
        prev.map(m => {
          if (m.id === "mission_potholes" && completeIssue.category === "Roads/Potholes") {
            const nextCount = m.currentCount + 1;
            return {
              ...m,
              currentCount: nextCount,
              status: nextCount >= m.targetCount ? "Completed" : "Active"
            };
          }
          return m;
        })
      );
    } catch (e) {
      console.error("Firestore submit failure:", e);
      // Fallback
      const issueId = "issue_" + Date.now();
      const completeIssue: CivicIssue = {
        ...(reportData as CivicIssue),
        id: issueId
      };
      setIssues(prev => [completeIssue, ...prev]);
      setRecentlySubmittedIssueId(issueId);
    }
  };

  // Add positive Verification action
  const handleAddVerification = async (issueId: string, note?: string) => {
    if (!userProfile) return;

    try {
      // 1. Create verification item
      const verificationId = "ver_" + Date.now();
      const parentIssueDoc = doc(db, "issues", issueId);
      const verificationsColRef = collection(parentIssueDoc, "verifications");

      try {
        await setDoc(doc(verificationsColRef, verificationId), {
          id: verificationId,
          issueId,
          userId: userProfile.uid,
          userName: userProfile.displayName,
          verifiedAt: new Date().toISOString(),
          status: "Confirming",
          comment: note || ""
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `issues/${issueId}/verifications/${verificationId}`);
      }

      // 2. Update issue's verification count
      const updatedIssues = issues.map(issue => {
        if (issue.id === issueId) {
          const updatedIssue = {
            ...issue,
            verificationsCount: issue.verificationsCount + 1,
            status: issue.verificationsCount + 1 >= 5 ? "Verified" as const : issue.status
          };
          try {
            updateDoc(doc(db, "issues", issueId), {
              verificationsCount: updatedIssue.verificationsCount,
              status: updatedIssue.status
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `issues/${issueId}`);
          }
          return updatedIssue;
        }
        return issue;
      });

      setIssues(updatedIssues);

      // 3. Award points for searching out truth
      await addXPAndCheckBadges(25, true);

    } catch (e) {
      console.warn("Could not save verification", e);
    }
  };

  // Add comments action
  const handleAddComment = async (issueId: string, text: string) => {
    if (!userProfile) return;

    try {
      const commentId = "c_" + Date.now();
      const newComment: Comment = {
        id: commentId,
        issueId,
        userId: userProfile.uid,
        userName: userProfile.displayName,
        userPhotoUrl: userProfile.photoURL,
        text,
        createdAt: new Date().toISOString()
      };

      const parentIssueDoc = doc(db, "issues", issueId);
      const commentsColRef = collection(parentIssueDoc, "comments");
      try {
        await setDoc(doc(commentsColRef, commentId), newComment);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `issues/${issueId}/comments/${commentId}`);
      }

      setCommentsMap(prev => ({
        ...prev,
        [issueId]: [...(prev[issueId] || []), newComment]
      }));

    } catch (e) {
      console.warn("Could not submit comment to database", e);
    }
  };

  // Upvote issue action
  const handleUpvoteIssue = async (issueId: string) => {
    try {
      const updatedIssues = issues.map(issue => {
        if (issue.id === issueId) {
          const nextUpvotes = issue.upvotes + 1;
          try {
            updateDoc(doc(db, "issues", issueId), { upvotes: nextUpvotes });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `issues/${issueId}`);
          }
          return { ...issue, upvotes: nextUpvotes };
        }
        return issue;
      });
      setIssues(updatedIssues);
    } catch (e) {
      console.warn("Could not submit upvote", e);
    }
  };

  return (
    <div className="min-h-screen bg-space-black text-white flex flex-col font-sans relative overflow-x-hidden">
      <CommandCenterBackground
        currentView={currentView}
        userLocation={userLocation}
        isAiThinking={isAiThinking}
        issuesCount={issues.length}
      />
      <AnimatePresence mode="wait">
        {!isSplashComplete ? (
          <SplashScreen key="splash-screen" onComplete={() => setIsSplashComplete(true)} />
        ) : (
          <motion.div
            key="main-application"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 flex flex-col min-h-screen"
          >
            {currentView !== "onboarding" && (
              <div className="w-full bg-slate-950/80 border-b border-white/5 backdrop-blur-md px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-50">
                <div className="flex items-center gap-2">
                  <MapPin className={`w-4 h-4 ${isLocating ? "text-cyan-400 animate-bounce" : "text-neon-cyan"}`} />
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold">GRID STATUS:</span>
                  {isLocating ? (
                    <span className="text-slate-300 font-mono italic animate-pulse">
                      {locationStatusMessage || "Requesting location permission..."}
                    </span>
                  ) : locationError ? (
                    <span className="text-red-400 font-mono">
                      {locationError} (Unable to detect location. Please retry or choose manually.)
                    </span>
                  ) : userLocation ? (
                    <span className="text-white font-medium flex items-center gap-1.5 flex-wrap">
                      <span className="text-neon-cyan font-bold">{userLocation.locality || "Central"}</span>,{" "}
                      <span>{userLocation.city}</span>,{" "}
                      {userLocation.district && <span className="text-slate-400 text-[11px]">{userLocation.district}</span>}
                      {userLocation.state && <span className="text-slate-400 text-[11px]">{userLocation.state}</span>}
                      {userLocation.country && <span className="text-slate-500 text-[10px] uppercase">({userLocation.country})</span>}
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                        userLocation.source === "gps" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {userLocation.source === "gps" ? "⚡ GPS SYNCED" : "MANUAL PRESET"}
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400">Not set</span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={retryLocation}
                    disabled={isLocating}
                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/20 text-slate-300 font-mono font-bold tracking-wider text-[10px] uppercase transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <Compass className={`w-3 h-3 ${isLocating ? "animate-spin" : ""}`} />
                    Retry Location
                  </button>

                  <button
                    onClick={() => setShowLocationModal(true)}
                    className="px-3 py-1.5 rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 hover:bg-neon-cyan/10 hover:border-neon-cyan/40 text-neon-cyan font-mono font-bold tracking-wider text-[10px] uppercase transition-all cursor-pointer"
                  >
                    Change City
                  </button>
                </div>
              </div>
            )}

            <Navigation
              currentView={currentView}
              onNavigate={setCurrentView}
              userProfile={userProfile}
            />

            <main className="flex-grow relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -15, filter: "blur(6px)" }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full h-full"
                >
                  {currentView === "onboarding" && (
                    <OnboardingView onComplete={handleOnboardingComplete} />
                  )}

                  {currentView === "dashboard" && (
                    <DashboardView
                      issues={issues}
                      missions={missions}
                      userProfile={userProfile}
                      userLocation={userLocation}
                      onNavigate={setCurrentView}
                      onSelectIssue={(issue) => {
                        setSelectedIssueForMap(issue);
                        setCurrentView("map");
                      }}
                    />
                  )}

                  {currentView === "report" && (
                    <ReportView
                      userId={userProfile?.uid || "anonymous_id"}
                      userName={userProfile?.displayName || "Anonymous Citizen"}
                      onSubmitReport={handleCreateReport}
                      onNavigate={setCurrentView}
                      userLocation={userLocation}
                    />
                  )}

                   {currentView === "map" && (
                    <div className="relative w-full h-full">
                      <MapView
                        issues={issues}
                        commentsMap={commentsMap}
                        onAddComment={handleAddComment}
                        onAddVerification={handleAddVerification}
                        onUpvoteIssue={handleUpvoteIssue}
                        initialSelectedIssue={selectedIssueForMap}
                        clearInitialSelectedIssue={() => setSelectedIssueForMap(null)}
                        animateIssueId={recentlySubmittedIssueId}
                        clearAnimateIssueId={() => setRecentlySubmittedIssueId(null)}
                        userLocation={userLocation}
                      />
                      {isDroneTransitionActive && (
                        <CinematicDroneTransition
                          userLocation={userLocation}
                          onComplete={() => setIsDroneTransitionActive(false)}
                        />
                      )}
                    </div>
                  )}

                  {currentView === "profile" && (
                    <ProfileView
                      userProfile={userProfile}
                    />
                  )}

                  {currentView === "forecaster" && (
                    <DisasterForecasterView
                      issues={issues}
                      userProfile={userProfile}
                      onUpdateXPAndBadges={addXPAndCheckBadges}
                      onAddCustomBadge={handleAddCustomBadge}
                      userLocation={userLocation}
                      onChangeLocation={updateLocation}
                    />
                  )}

                  {currentView === "civic_connect" && (
                    <CivicConnectHub
                      issues={issues}
                      userProfile={userProfile}
                      onNavigate={setCurrentView}
                      userLocation={userLocation}
                    />
                  )}

                  {currentView === "ask_civiceye" && (
                    <AskCivicEyeView
                      onNavigate={setCurrentView}
                      userLocation={userLocation}
                      onThinkingChange={setIsAiThinking}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* 📍 GPS SYNCHRONIZATION MODAL */}
            <AnimatePresence>
              {showLocationModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 180 }}
                    className="w-full max-w-lg glass-panel p-8 rounded-3xl border border-neon-cyan/30 bg-slate-950/95 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden text-left"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-b from-neon-cyan/10 to-transparent rounded-full filter blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan">
                        <Compass className="w-6 h-6 animate-spin-slow" />
                      </div>
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan tracking-wider uppercase">
                          GPS Location Center
                        </span>
                        <h2 className="font-display text-xl font-extrabold text-white mt-1">
                          Enable Smart Safety Radar
                        </h2>
                      </div>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed mb-4">
                      CivicEye uses your location to show nearby civic issues, emergency contacts, AQI, and personalized alerts.
                    </p>

                    {/* STATUS MESSAGE & ERROR DISPLAY */}
                    {(isLocating || locationStatusMessage) && (
                      <div className="mb-4 p-3 bg-cyan-950/40 border border-neon-cyan/20 rounded-xl flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-ping" />
                        <span className="text-xs font-mono text-cyan-300 animate-pulse">
                          {locationStatusMessage || "Detecting GPS satellite link..."}
                        </span>
                      </div>
                    )}

                    {locationError && !isLocating && (
                      <div className="mb-4 p-3.5 bg-red-950/20 border border-red-500/30 rounded-xl text-left">
                        <div className="flex items-center gap-2 mb-1 text-red-400 font-bold text-xs">
                          <span className="text-sm">⚠️</span> GPS Sync Error
                        </div>
                        <p className="text-xs text-red-200/90 leading-normal font-mono">
                          {locationError}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3.5 mb-6">
                      <button
                        onClick={handleRequestGPS}
                        disabled={isLocating}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-neon-cyan to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-display font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-cyan-950/50 cursor-pointer"
                      >
                        <Locate className={`w-4 h-4 ${isLocating ? "animate-spin" : "animate-pulse"}`} />
                        {isLocating ? "Connecting GPS..." : locationError ? "Retry GPS Connection" : "Use Real-time GPS Location"}
                      </button>

                      {locationError && !isLocating && (
                        <div className="text-center">
                          <button
                            onClick={retryLocation}
                            className="px-4 py-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/40 text-red-400 font-mono font-bold tracking-wider text-[10px] uppercase transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            Retry GPS Setup
                          </button>
                        </div>
                      )}
                      
                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-white/5"></div>
                        <span className="flex-shrink mx-4 text-[10px] font-mono text-slate-500 uppercase font-black">Or Enter Location Manually</span>
                        <div className="flex-grow border-t border-white/5"></div>
                      </div>

                      <ManualLocationSelector 
                        onLocationSelected={handleManualSelect}
                        initialLocation={userLocation}
                      />
                    </div>

                    <div className="text-center font-mono text-[9px] text-slate-500">
                      🔒 Secured Encrypted Terminal • No personal location logs are stored.
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Global CivicEye Floating Action Widgets */}
            {userProfile && (
              <>
                {/* Floating Report Issue FAB */}
                {currentView !== "report" && (
                  <div className="fixed bottom-6 right-24 z-50 pointer-events-none flex items-center gap-2">
                    <motion.button
                      onClick={() => setCurrentView("report")}
                      className="h-14 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 border border-cyan-400/30 flex items-center justify-center text-white cursor-pointer shadow-[0_0_25px_rgba(6,182,212,0.4)] pointer-events-auto hover:border-cyan-400/60 active:scale-[0.95] outline-none group px-5 gap-2.5"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <span className="text-lg">📸</span>
                      <span className="max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-300 ease-out font-display font-black text-xs uppercase tracking-wider text-white whitespace-nowrap">
                        Report Issue
                      </span>
                    </motion.button>
                  </div>
                )}

                {/* Floating AI Assistant Orb */}
                <FloatingAIAssistant onNavigate={setCurrentView} onThinkingChange={setIsAiThinking} />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
