import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, MessageSquare, ArrowRight, ShieldAlert, AlertTriangle, Building, Trash2, CheckCircle, Phone, Mail, MapPin, Globe, Compass } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserLocation, IssueCategory } from "../types";
import { detectAuthority } from "../utils/authorityDetector";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  contactDetails?: {
    name: string;
    phone: string;
    email: string;
    office: string;
    website: string;
    categoryName: string;
  };
}

interface AskCivicEyeViewProps {
  onNavigate?: (view: any) => void;
  userLocation: UserLocation | null;
  onThinkingChange?: (isThinking: boolean) => void;
}

export default function AskCivicEyeView({ onNavigate, userLocation, onThinkingChange }: AskCivicEyeViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "👋 Hi there! I'm Ask CivicEye, your friendly AI neighborhood assistant. How can I help you improve our community today?",
      sender: "ai",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    { text: "Where should I report garbage?", icon: <Trash2 className="w-4 h-4 text-emerald-400" /> },
    { text: "Is this pothole already reported?", icon: <AlertTriangle className="w-4 h-4 text-yellow-400" /> },
    { text: "Who handles water leakage?", icon: <Building className="w-4 h-4 text-cyan-400" /> }
  ];

  // Helper to resolve category from user message text
  const getCategoryFromText = (text: string): IssueCategory => {
    const t = text.toLowerCase();
    if (t.includes("pothole") || t.includes("road") || t.includes("street") || t.includes("highway") || t.includes("sidewalk")) {
      return "Roads/Potholes";
    }
    if (t.includes("light") || t.includes("lamp") || t.includes("bulb") || t.includes("dark")) {
      return "Streetlights";
    }
    if (t.includes("water") || t.includes("leak") || t.includes("drain") || t.includes("sewage") || t.includes("flood")) {
      return "Water/Sanitation";
    }
    if (t.includes("trash") || t.includes("garbage") || t.includes("litter") || t.includes("waste") || t.includes("dump")) {
      return "Trash/Litter";
    }
    if (t.includes("graffiti") || t.includes("paint") || t.includes("wall") || t.includes("vandalism")) {
      return "Graffiti";
    }
    return "Other";
  };

  // Check if query is about finding or contacting local departments
  const isContactQuery = (text: string) => {
    const t = text.toLowerCase();
    return (
      t.includes("contact") ||
      t.includes("call") ||
      t.includes("email") ||
      t.includes("who should i") ||
      t.includes("who handles") ||
      t.includes("department") ||
      t.includes("phone") ||
      t.includes("number") ||
      t.includes("address") ||
      t.includes("website") ||
      t.includes("complain to") ||
      t.includes("authority") ||
      t.includes("authorities")
    );
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: "msg_" + Date.now(),
      text: textToSend,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);
    onThinkingChange?.(true);

    try {
      // Build conversation history format
      const history = messages.slice(-6).map(m => ({
        text: m.text,
        sender: m.sender === "user" ? "user" : "ai"
      }));

      const res = await fetch("/api/ask-civiceye", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: textToSend,
          history,
          userLocation // Send user location to server
        })
      });

      const data = await res.json();
      
      setIsTyping(false);
      onThinkingChange?.(false);

      // Handle contact query details injection
      let attachedDetails = undefined;
      if (isContactQuery(textToSend)) {
        const resolvedCategory = getCategoryFromText(textToSend);
        const authInfo = detectAuthority(resolvedCategory, userLocation);
        attachedDetails = {
          name: authInfo.name,
          phone: authInfo.phone,
          email: authInfo.email,
          office: authInfo.office,
          website: authInfo.website,
          categoryName: resolvedCategory
        };
      }

      const aiMsg: Message = {
        id: "ai_" + Date.now(),
        text: data.answer || "I'm here to help! Feel free to ask another question about reporting local issues.",
        sender: "ai",
        timestamp: new Date(),
        contactDetails: attachedDetails
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setIsTyping(false);
      onThinkingChange?.(false);
      
      let attachedDetails = undefined;
      if (isContactQuery(textToSend)) {
        const resolvedCategory = getCategoryFromText(textToSend);
        const authInfo = detectAuthority(resolvedCategory, userLocation);
        attachedDetails = {
          name: authInfo.name,
          phone: authInfo.phone,
          email: authInfo.email,
          office: authInfo.office,
          website: authInfo.website,
          categoryName: resolvedCategory
        };
      }

      const errMsg: Message = {
        id: "err_" + Date.now(),
        text: `I'm experiencing a quick connection blip, but based on your local GPS location in ${(userLocation?.city || "Jaipur")}, the ${getCategoryFromText(textToSend)} department handles these requests. I have loaded their direct contacts for you below.`,
        sender: "ai",
        timestamp: new Date(),
        contactDetails: attachedDetails
      };
      setMessages(prev => [...prev, errMsg]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 relative">
      {/* Background visual elements */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-neon-purple/5 rounded-full filter blur-[100px] pointer-events-none"></div>

      {/* Header section */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-purple/10 border border-neon-purple/20 mb-3 text-xs font-mono text-neon-cyan uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          Always-On Civic Helper
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-white">
          Ask <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-cyan">CivicEye</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-lg mx-auto leading-relaxed">
          Your friendly conversational assistant. Ask questions about reporting issues, municipal duties, or active community problems.
        </p>
      </div>

      {/* Main interactive window */}
      <div className="glass-panel border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col h-[520px]">
        {/* Connection top bar */}
        <div className="bg-white/[0.02] border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-green-500 animate-pulse"></div>
            <div>
              <span className="block text-xs font-display font-black text-white">Civic Assistant Online</span>
              <span className="text-[10px] font-mono text-slate-400">Conversational AI Engine</span>
            </div>
          </div>
          <button
            onClick={() => onNavigate && onNavigate("report")}
            className="px-3.5 py-1.5 rounded-lg bg-neon-purple/15 hover:bg-neon-purple/25 border border-neon-purple/35 transition-all text-[11px] font-mono font-bold text-white flex items-center gap-1 cursor-pointer"
          >
            Create Official Report
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Chat area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-gradient-to-tr from-neon-purple to-purple-600 text-white rounded-br-none shadow-md shadow-purple-500/5"
                      : "bg-white/[0.04] border border-white/10 text-slate-200 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  {msg.contactDetails && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-neon-cyan shrink-0" />
                        <span className="font-display font-black text-xs text-white block">
                          {msg.contactDetails.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        <span className="font-semibold">Office Address: </span>{msg.contactDetails.office}
                      </p>
                      
                      {/* One-tap Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1.5">
                        <a
                          href={`tel:${msg.contactDetails.phone}`}
                          className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25 transition-all text-xs font-mono font-bold cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Call Official
                        </a>
                        <a
                          href={`mailto:${msg.contactDetails.email}`}
                          className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/25 transition-all text-xs font-mono font-bold cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Email Dept
                        </a>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(msg.contactDetails.office)}`}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/25 transition-all text-xs font-mono font-bold cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          Directions
                        </a>
                        <a
                          href={msg.contactDetails.website.startsWith("http") ? msg.contactDetails.website : `https://${msg.contactDetails.website}`}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/25 transition-all text-xs font-mono font-bold cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Website
                        </a>
                      </div>
                    </div>
                  )}
                  <span className="block text-[8px] font-mono text-slate-500 text-right mt-1.5">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Quick questions grid */}
        {messages.length === 1 && (
          <div className="px-6 pb-2 pt-1 border-t border-white/5 bg-white/[0.01]">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">💡 Try asking one of these:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-3">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q.text)}
                  className="p-3 text-left rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {q.icon}
                    <span className="text-[11px] font-display font-semibold text-white group-hover:text-neon-cyan transition-colors">
                      {q.text.split(" ")[0]} Inquire
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 group-hover:text-slate-200 transition-colors">
                    {q.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action input bar */}
        <div className="p-4 border-t border-white/5 bg-slate-950/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputText);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="How can I help today? (e.g. Where should I report garbage?)"
              className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-cyan/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-cyan text-white shadow-lg disabled:opacity-40 disabled:scale-100 hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
