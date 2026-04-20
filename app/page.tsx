'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  SwitchCamera, 
  Terminal, 
  Activity, 
  Lock, 
  LogOut, 
  Quote,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { analyzeDecision } from '../lib/gemini';
import { checkUsage, logDecision, logAppEvent } from '../lib/tracking';
import { generateDecisionPDF } from '../lib/pdf-export';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Download, Copy, Check } from 'lucide-react';

// Types
interface AnalysisResult {
  input_type: string;
  verdict: 'Proceed' | 'Pause' | 'Kill';
  confidence: number;
  biggest_risk: string;
  what_breaks_this: string;
  relatable_perspective: string;
  reframe_precise: string;
  reframe_regular: string;
  secondary_nuances: Array<{
    reason: string;
    nuance: string;
    only_do_if: string;
  }>;
}

const CopyButton = ({ text, label }: { text: string; label: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    logAppEvent('text_copied', { field: label });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="p-1 hover:text-emerald-400 transition-colors opacity-40 hover:opacity-100"
      title={`Copy ${label}`}
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
};

export default function DecisionPage() {
  const [user, setUser] = useState<User | null>(null);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [usage, setUsage] = useState({ canProceed: true, count: 0, reason: '' });
  const [authLoading, setAuthLoading] = useState(true);
  const [vocabMode, setVocabMode] = useState<'precise' | 'regular'>('precise');
  const [isNuanceExpanded, setIsNuanceExpanded] = useState(false);

  // Quote logic
  const mainQuote = "The strongest decisions are forged in the fire of their own potential failure.";

  const refreshUsage = async () => {
    const status = await checkUsage();
    setUsage(status as any);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      refreshUsage();
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      logAppEvent('user_login');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    logAppEvent('user_logout');
    setResult(null);
    setInput('');
  };

  const handleAnalyze = async () => {
    if (!input.trim() || !usage.canProceed) return;

    const start = Date.now();
    setIsAnalyzing(true);
    setResult(null);
    
    try {
      logAppEvent('analysis_start', { inputLength: input.length });
      const rawResult = await analyzeDecision(input);
      const latency = Date.now() - start;
      
      const analysisData = {
        ...rawResult,
        decisionText: input,
        latencyMs: latency,
      };

      await logDecision(user?.uid || 'demo', analysisData);
      setResult(rawResult);
      refreshUsage();
      logAppEvent('analysis_success', { latency, verdict: rawResult.verdict });
    } catch (err: any) {
      console.error(err);
      logAppEvent('analysis_error', { error: err.message });
      throw err; // Caught by ErrorBoundary or handled below
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getVerdictStyles = (v: string) => {
    switch (v) {
      case 'Proceed': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500', text: 'text-emerald-400', icon: CheckCircle2 };
      case 'Pause': return { bg: 'bg-amber-500/10', border: 'border-amber-500', text: 'text-amber-400', icon: AlertTriangle };
      case 'Kill': return { bg: 'bg-rose-500/10', border: 'border-rose-500', text: 'text-rose-400', icon: XCircle };
      default: return { bg: 'bg-gray-500/10', border: 'border-gray-500', text: 'text-gray-400', icon: Info };
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E4E3E0] font-sans selection:bg-emerald-500 selection:text-black">
      {/* Decorative Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#E4E3E0 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Header / Nav */}
      <nav className="relative z-10 border-b border-[#222] px-6 py-4 flex justify-between items-center bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-emerald-500" />
          <h1 className="text-xs uppercase tracking-[0.2em] font-mono font-bold">
            Decision<span className="text-emerald-500">_Kill-Switch</span> 
            <span className="ml-2 px-1.5 py-0.5 border border-emerald-500/50 text-[10px] text-emerald-500/80 rounded tracking-widest">v2.4_Surgical</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          {!authLoading && (
            user ? (
              <div className="flex items-center gap-4">
                <div className="text-[10px] font-mono uppercase tracking-tighter text-gray-500">
                   QUOTA: <span className={usage.count >= 5 ? 'text-rose-500' : 'text-emerald-500'}>{usage.count}/5</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-1 hover:text-emerald-400 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="text-[10px] uppercase font-mono tracking-widest border border-white/20 px-3 py-1 hover:bg-white hover:text-black transition-all"
              >
                Sign In To Access Quota
              </button>
            )
          )}
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 lg:py-24">
        <ErrorBoundary>
          {/* Hero Section */}
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-4 text-emerald-500/60 font-mono text-[10px] uppercase tracking-widest">
              <Activity className="w-3 h-3 animate-pulse" />
              Logic Pipeline Active
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 lg:leading-tight">
              Validate your intent with <span className="italic text-gray-400 underline decoration-emerald-500/30 decoration-4 underline-offset-8">surgical precision</span>.
            </h2>
            <div className="max-w-2xl text-gray-400 text-sm leading-relaxed mb-8 font-mono">
              The Decision Kill-Switch uses high-order LLM logic to falsify assumptions and identify terminal risks before they manifest. One demo generation exists for all guests. Sign up to unlock up to 5 generations.
            </div>

            <div className="p-8 border border-[#222] bg-[#0F0F0F] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 font-mono text-[80px] select-none pointer-events-none group-hover:opacity-20 transition-opacity">
                LOGIC
              </div>
              
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
                [INPUT_BUFFER] Enter Verbatim Intent:
              </label>
              
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. Quitting my job to start a niche crypto-coffee shop chain in Berlin..."
                className="w-full h-32 bg-black/50 border border-[#222] p-4 text-sm font-mono focus:outline-none focus:border-emerald-500/50 resize-none transition-all placeholder:text-gray-700"
                disabled={isAnalyzing || !usage.canProceed}
              />

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-6 gap-4">
                <div className="flex items-center gap-3 text-[10px] uppercase font-mono tracking-tighter">
                  {usage.canProceed ? (
                    <span className="text-emerald-500/80 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" /> System Ready
                    </span>
                  ) : (
                    <span className="text-rose-500/80 flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> {usage.reason}
                    </span>
                  )}
                  {user && <span className="text-gray-700">|</span>}
                  {user && <span className="text-gray-500">UID: {user.uid.slice(0, 8)}...</span>}
                </div>

                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !usage.canProceed || !input.trim()}
                  className={`
                    w-full md:w-auto px-8 py-3 uppercase text-[11px] tracking-[0.2em] font-bold font-mono transition-all
                    ${isAnalyzing || !usage.canProceed || !input.trim() 
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-transparent' 
                      : 'bg-emerald-500 text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    }
                  `}
                >
                  {isAnalyzing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" /> RUNNING_EXTRACTION...
                    </span>
                  ) : 'EXECUTE_VERDICT'}
                </button>
              </div>
            </div>
          </section>

          {/* Result Section */}
          <AnimatePresence>
            {result && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
              >
                {/* Main Verdict Card */}
                <div className={`md:col-span-2 p-8 border ${getVerdictStyles(result.verdict).border} ${getVerdictStyles(result.verdict).bg} relative`}>
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-start gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-2">SYSTEM_VERDICT</div>
                        <h3 className={`text-5xl font-bold tracking-tight uppercase ${getVerdictStyles(result.verdict).text}`}>
                          {result.verdict}
                        </h3>
                      </div>
                      <button 
                        onClick={() => generateDecisionPDF(input, result)}
                        className="mt-2 p-2 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all rounded"
                        title="Download Surgical Report PDF"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                    {React.createElement(getVerdictStyles(result.verdict).icon, { className: `w-12 h-12 ${getVerdictStyles(result.verdict).text}` })}
                  </div>

                  <div className="grid grid-cols-2 gap-8 font-mono">
                    <div>
                      <div className="text-[10px] uppercase opacity-50 mb-1">CONFIDENCE_RATING</div>
                      <div className="text-xl font-bold">{result.confidence}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase opacity-50 mb-1">INPUT_CLASSIFICATION</div>
                      <div className="text-xl font-bold uppercase tracking-tighter">{result.input_type}</div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-emerald-500/20">
                    <div className="flex flex-col gap-6">
                      {/* Relatable Perspective Section */}
                      <div className="p-4 bg-black/40 border-l-2 border-emerald-500/50">
                        <div className="flex justify-between items-start mb-2 text-emerald-500/60">
                          <div className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                             <Quote className="w-3 h-3" /> Relatable_Perspective_Adaptive
                          </div>
                          <CopyButton text={result.relatable_perspective} label="Perspective" />
                        </div>
                        <p className="text-sm font-serif italic leading-relaxed text-gray-300">
                          {result.relatable_perspective}
                        </p>
                      </div>

                      {/* Reframe with Toggle */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-[10px] uppercase font-bold tracking-widest text-[#555]">Cognitive_Reframe_Buffer</div>
                            <CopyButton text={vocabMode === 'precise' ? result.reframe_precise : result.reframe_regular} label="Reframe" />
                          </div>
                          <div className="flex bg-[#111] p-0.5 rounded border border-[#222]">
                            <button 
                              onClick={() => setVocabMode('precise')}
                              className={`px-3 py-1 text-[9px] uppercase tracking-tighter transition-all ${vocabMode === 'precise' ? 'bg-emerald-500 text-black font-bold' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                              Precise
                            </button>
                            <button 
                              onClick={() => setVocabMode('regular')}
                              className={`px-3 py-1 text-[9px] uppercase tracking-tighter transition-all ${vocabMode === 'regular' ? 'bg-emerald-500 text-black font-bold' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                              Regular
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-mono leading-relaxed text-emerald-500/90 py-2 border-y border-white/5">
                          {vocabMode === 'precise' ? result.reframe_precise : result.reframe_regular}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk & Falsification */}
                <div className="flex flex-col gap-6">
                  <div className="p-6 border border-rose-500/30 bg-rose-500/5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-[10px] uppercase tracking-widest font-bold text-rose-400 flex items-center gap-2">
                        <ShieldAlert className="w-3 h-3" /> CRITICAL_RISK 
                      </div>
                      <CopyButton text={result.biggest_risk} label="Risk" />
                    </div>
                    <p className="text-xs font-mono leading-relaxed">
                      {result.biggest_risk}
                    </p>
                  </div>

                  <div className="p-6 border border-amber-500/30 bg-amber-500/5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-[10px] uppercase tracking-widest font-bold text-amber-400 flex items-center gap-2">
                        <SwitchCamera className="w-3 h-3" /> FALSIFICATION_CHECK
                      </div>
                      <CopyButton text={result.what_breaks_this} label="Falsification" />
                    </div>
                    <p className="text-xs font-mono leading-relaxed">
                      {result.what_breaks_this}
                    </p>
                  </div>

                  {/* Secondary Nuances Expandable Tab */}
                  <div className="mt-auto border border-[#222] bg-[#0F0F0F]">
                    <button 
                      onClick={() => setIsNuanceExpanded(!isNuanceExpanded)}
                      className="w-full flex justify-between items-center p-4 hover:bg-[#151515] transition-colors"
                    >
                      <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Secondary_Nuances
                      </div>
                      {isNuanceExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </button>
                    
                    <AnimatePresence>
                      {isNuanceExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden border-t border-[#222]"
                        >
                          <div className="p-4 space-y-4">
                            {result.secondary_nuances.map((nuance, idx) => (
                              <div key={idx} className="space-y-2 last:mb-0">
                                <div className="text-[9px] uppercase font-bold text-emerald-500/70 tracking-tighter">
                                  {idx + 1}. {nuance.reason}
                                </div>
                                <p className="text-[11px] leading-relaxed text-gray-400 font-mono">
                                  <span className="text-gray-600 italic">Nuance:</span> {nuance.nuance}
                                </p>
                                <div className="p-2 bg-emerald-500/5 border-l border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                                  <span className="uppercase font-bold text-[9px] mr-1">ONLY_DO_IF:</span> {nuance.only_do_if}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Footer Quote Area */}
          <footer className="border-t border-[#222] pt-12 flex flex-col items-center text-center">
            <Quote className="w-6 h-6 text-emerald-500 mb-6 opacity-40" />
            <p className="text-xl max-w-xl font-serif italic text-gray-500 mb-4 leading-relaxed">
              &quot;{mainQuote}&quot;
            </p>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-700">
              [SYSTEM_INTEGRITY_VERIFIED]
            </div>
            
            {/* Tag Markers of Backend Features */}
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <span className="text-[9px] px-2 py-1 border border-emerald-500/20 text-emerald-500/40 rounded flex items-center gap-1">
                <div className="w-1 h-1 bg-emerald-500 rounded-full" /> ANALYTICS_PIPELINE
              </span>
              <span className="text-[9px] px-2 py-1 border border-emerald-500/20 text-emerald-500/40 rounded flex items-center gap-1">
                <div className="w-1 h-1 bg-emerald-500 rounded-full" /> QUOTA_ENFORCER
              </span>
              <span className="text-[9px] px-2 py-1 border border-[#333] text-gray-700 rounded flex items-center gap-1">
                 PENDING: STRIPE_LIFELINE
              </span>
              <span className="text-[9px] px-2 py-1 border border-[#333] text-gray-700 rounded flex items-center gap-1">
                 PENDING: TEAM_AUTH_HANDOFF
              </span>
            </div>
          </footer>
        </ErrorBoundary>
      </main>
    </div>
  );
}
