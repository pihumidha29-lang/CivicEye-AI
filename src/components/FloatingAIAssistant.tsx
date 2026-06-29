import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Send,
  X,
  MessageSquare,
  AlertTriangle,
  Building,
  Compass,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Droplet
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface FloatingAIAssistantProps {
  onNavigate: (view: string) => void;
  currentAQI?: number;
  onThinkingChange?: (isThinking: boolean) => void;
}

export default function FloatingAIAssistant({ onNavigate, currentAQI = 54, onThinkingChange }: FloatingAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "👋 Hello! I am your AI Civic Assistant. How can I assist you with reporting issues or improving our neighborhood today?",
      sender: "ai",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    { text: "Where should I report this?", category: "report" },
    { text: "Nearby issues", category: "map" },
    { text: "Current AQI", category: "health" },
    { text: "Who should I contact?", category: "contact" },
    { text: "Help me write a complaint.", category: "draft" }
  ];

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
      // Create chat history slice
      const history = messages.slice(-4).map(m => ({
        text: m.text,
        sender: m.sender === "user" ? "user" : "ai"
      }));

      const res = await fetch("/api/ask-civiceye", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: textToSend, history })
      });

      const data = await res.json();
      setIsTyping(false);
      onThinkingChange?.(false);

      const aiMsg: Message = {
        id: "ai_" + Date.now(),
        text: data.answer || "I'm on it! I recommend creating a report using the official submission screen.",
        sender: "ai",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setIsTyping(false);
      onThinkingChange?.(false);
      
      // Fallback helpful mock response based on category matching
      let fallbackText = "I encountered a small hiccup connecting to the database, but let me assist! Please report garbage piles or road potholes immediately in our 'Report Issue' screen.";
      const lower = textToSend.toLowerCase();
      if (lower.includes("where")) {
        fallbackText = "📍 For water leakages and broken streetlights, you can submit reports directly to our Civic Platform under the Water or Electricity categories. Our automated dispatcher forwards it to the correct municipal ward within minutes.";
      } else if (lower.includes("aqi")) {
        fallbackText = `🍃 The current localized Air Quality Index (AQI) in Jaipur is ${currentAQI} (Moderate). It's safe for general outdoor activities, but light showers are expected tomorrow which will clear any trace pollutants.`;
      } else if (lower.includes("nearby") || lower.includes("map")) {
        fallbackText = "🗺️ There are several civic reports being tracked in your vicinity: 3 road potholes, 1 faulty streetlight, and a public dumping pile. Tap 'Community Map' in the menu to inspect them live.";
      } else if (lower.includes("contact") || lower.includes("who")) {
        fallbackText = "🏛️ For extreme hazards, visit the expanded Emergency Help Center in our 'Contact Authorities' tab. There you will find hotline dial buttons and emails for the Police, Ambulance, Water Board, and Power grid.";
      } else if (lower.includes("complaint") || lower.includes("write")) {
        fallbackText = "📝 Under the 'Contact Authorities' tab, select any reported issue to let Gemini auto-compile a formal legal complaint letter, complete with RTI drafts and escalations!";
      }

      const aiMsg: Message = {
        id: "ai_" + Date.now(),
        text: fallbackText,
        sender: "ai",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
      
      {/* Floating Conversational Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, y: 30, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 20, stiffness: 180 }}
            className="w-[340px] sm:w-[380px] h-[500px] bg-[#070b13]/95 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.8)] pointer-events-auto flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-b border-white/5 px-4.5 py-4.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <span className="absolute inset-0 rounded-full bg-cyan-400/25 animate-ping"></span>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white border border-white/10 relative z-10 shadow-[0_0_12px_rgba(147,51,234,0.3)]">
                    <Sparkles className="w-4.5 h-4.5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-display font-black text-xs text-white">Civic AI Sentinel</h3>
                  <span className="text-[9px] font-mono text-neon-cyan font-bold uppercase tracking-wider block">Always-On Guide</span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Thread */}
            <div className="flex-1 p-4.5 overflow-y-auto space-y-3 bg-space-grid/10">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed font-sans ${
                      msg.sender === "user"
                        ? "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-purple-500/5"
                        : "bg-white/[0.04] border border-white/5 text-slate-200 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <span className="block text-[7.5px] font-mono text-slate-500 text-right mt-1 font-semibold">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl rounded-bl-none px-3 py-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested prompts list inside dialog container */}
            {messages.length === 1 && (
              <div className="px-4.5 py-2.5 bg-white/[0.01] border-t border-white/5 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.text)}
                    className="px-3 py-1.5 rounded-full bg-[#0a0f19] border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 text-slate-300 hover:text-white font-mono text-[9px] font-bold tracking-tight transition-all cursor-pointer inline-block"
                  >
                    ✨ {p.text}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <div className="p-3 border-t border-white/5 bg-slate-950/80">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputText);
                }}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask any civic concern..."
                  className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg disabled:opacity-40 disabled:scale-100 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center shrink-0 border border-white/5"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Orb Activator Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400/40 flex items-center justify-center text-white cursor-pointer relative shadow-[0_0_30px_rgba(147,51,234,0.45)] pointer-events-auto group outline-none"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Breathing ambient ring overlays */}
        <span className="absolute inset-[-4px] rounded-full border border-purple-500/25 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]"></span>
        <span className="absolute inset-[-8px] rounded-full border border-cyan-500/10 animate-[ping_3.5s_cubic-bezier(0,0,0.2,1)_infinite]"></span>

        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6 text-white stroke-[2.5]" />
            </motion.div>
          ) : (
            <motion.div
              key="orb-icon"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center relative"
            >
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
              {/* Micro green online indicator badge */}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#090d16] rounded-full"></span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
