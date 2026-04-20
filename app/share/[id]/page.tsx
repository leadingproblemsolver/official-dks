'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  SwitchCamera, 
  Terminal, 
  Activity, 
  Quote,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from 'lucide-react';

export default function SharePage() {
  const { id } = useParams();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vocabMode, setVocabMode] = useState<'precise' | 'regular'>('precise');
  const [isNuanceExpanded, setIsNuanceExpanded] = useState(false);

  useEffect(() => {
    const fetchDecision = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('decisions')
          .select('*')
          .eq('id', id as string)
          .single();
        
        if (data) {
          setResult(data);
        } else {
          setError('Analysis report not found. The ID might be invalid or deleted.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load the analysis report.');
      } finally {
        setLoading(false);
      }
    };

    fetchDecision();
  }, [id]);

  const getVerdictStyles = (v: string) => {
    switch (v) {
      case 'Proceed': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500', text: 'text-emerald-400', icon: CheckCircle2 };
      case 'Pause': return { bg: 'bg-amber-500/10', border: 'border-amber-500', text: 'text-amber-400', icon: AlertTriangle };
      case 'Kill': return { bg: 'bg-rose-500/10', border: 'border-rose-500', text: 'text-rose-400', icon: XCircle };
      default: return { bg: 'bg-gray-500/10', border: 'border-gray-500', text: 'text-gray-400', icon: Info };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#E4E3E0] flex flex-col items-center justify-center font-mono">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <div className="uppercase tracking-[0.3em] text-xs">DECRYPTING_ANALYSIS...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#E4E3E0] flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="w-16 h-16 text-rose-500 mb-6" />
        <h1 className="text-2xl font-bold mb-4 uppercase tracking-tighter">Access Denied / Not Found</h1>
        <p className="text-gray-500 max-w-md mb-8">{error}</p>
        <Link href="/" className="px-8 py-3 border border-emerald-500/50 text-emerald-500 uppercase text-xs font-mono tracking-widest hover:bg-emerald-500 hover:text-black transition-all">
          Return To Logic Core
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E4E3E0] font-sans selection:bg-emerald-500 selection:text-black">
      <nav className="border-b border-[#222] px-6 py-4 flex justify-between items-center bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-emerald-500" />
          <h1 className="text-xs uppercase tracking-[0.2em] font-mono font-bold">
            Decision<span className="text-emerald-500">_Kill-Switch</span> 
            <span className="ml-2 px-1.5 py-0.5 border border-emerald-500/50 text-[10px] text-emerald-500/80 rounded tracking-widest">PUBLIC_REPORT</span>
          </h1>
        </div>
        <Link href="/" className="text-[10px] uppercase font-mono tracking-widest text-emerald-500 hover:underline flex items-center gap-2">
          <ArrowLeft className="w-3 h-3" /> New Analysis
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          <div className="border border-[#222] bg-[#0F0F0F] p-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 font-mono text-4xl select-none pointer-events-none">SHARED_DATA</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-4 font-mono">SHARED_INTENT_BUFFER</div>
            <p className="text-lg md:text-2xl font-serif italic text-gray-300 leading-relaxed">
              &quot;{result.decisionText}&quot;
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`md:col-span-2 p-8 border ${getVerdictStyles(result.verdict).border} ${getVerdictStyles(result.verdict).bg} relative`}>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-2">SYSTEM_VERDICT</div>
                  <h3 className={`text-5xl font-bold tracking-tight uppercase ${getVerdictStyles(result.verdict).text}`}>
                    {result.verdict}
                  </h3>
                </div>
                {React.createElement(getVerdictStyles(result.verdict).icon, { className: `w-12 h-12 ${getVerdictStyles(result.verdict).text}` })}
              </div>

              <div className="grid grid-cols-2 gap-8 font-mono mb-8">
                <div>
                  <div className="text-[10px] uppercase opacity-50 mb-1">CONFIDENCE</div>
                  <div className="text-xl font-bold">{result.confidence}%</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase opacity-50 mb-1">CLASSIFICATION</div>
                  <div className="text-xl font-bold uppercase tracking-tighter">{result.input_type}</div>
                </div>
              </div>

              <div className="space-y-6 pt-8 border-t border-emerald-500/20">
                <div className="p-4 bg-black/40 border-l-2 border-emerald-500/50">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-emerald-500/60 mb-2 flex items-center gap-2">
                     <Quote className="w-3 h-3" /> Relatable_Perspective_Adaptive
                  </div>
                  <p className="text-sm font-serif italic leading-relaxed text-gray-300">
                    {result.relatable_perspective}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-[#555]">Cognitive_Reframe</div>
                    <div className="flex bg-[#111] p-0.5 rounded border border-[#222]">
                      <button onClick={() => setVocabMode('precise')} className={`px-3 py-1 text-[9px] uppercase transition-all ${vocabMode === 'precise' ? 'bg-emerald-500 text-black font-bold' : 'text-gray-500 hover:text-gray-300'}`}>Precise</button>
                      <button onClick={() => setVocabMode('regular')} className={`px-3 py-1 text-[9px] uppercase transition-all ${vocabMode === 'regular' ? 'bg-emerald-500 text-black font-bold' : 'text-gray-500 hover:text-gray-300'}`}>Regular</button>
                    </div>
                  </div>
                  <p className="text-sm font-mono leading-relaxed text-emerald-500/90 py-2 border-y border-white/5">
                    {vocabMode === 'precise' ? result.reframe_precise : result.reframe_regular}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 border border-rose-500/30 bg-rose-500/5">
                <div className="text-[10px] uppercase tracking-widest font-bold text-rose-400 mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-3 h-3" /> CRITICAL_RISK 
                </div>
                <p className="text-xs font-mono leading-relaxed text-rose-200/80">{result.biggest_risk}</p>
              </div>

              <div className="p-6 border border-amber-500/30 bg-amber-500/5">
                <div className="text-[10px] uppercase tracking-widest font-bold text-amber-400 mb-3 flex items-center gap-2">
                  <SwitchCamera className="w-3 h-3" /> FALSIFICATION
                </div>
                <p className="text-xs font-mono leading-relaxed text-amber-200/80">{result.what_breaks_this}</p>
              </div>

              <div className="border border-[#222] bg-[#0F0F0F]">
                <button onClick={() => setIsNuanceExpanded(!isNuanceExpanded)} className="w-full flex justify-between items-center p-4 hover:bg-[#151515] transition-colors">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Nuances
                  </div>
                  {isNuanceExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                <AnimatePresence>
                  {isNuanceExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-[#222]"
                    >
                      <div className="p-4 space-y-4">
                        {result.secondary_nuances?.map((n: any, i: number) => (
                          <div key={i} className="space-y-1">
                            <div className="text-[9px] uppercase font-bold text-emerald-500/70 tracking-tighter">{i+1}. {n.reason}</div>
                            <p className="text-[10px] text-gray-500 font-mono leading-tight">Nuance: {n.nuance}</p>
                            <div className="text-[9px] font-mono text-emerald-400/80 p-1 bg-emerald-500/5 border-l border-emerald-500/20">ONLY_DO_IF: {n.only_do_if}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-12 border-t border-[#222]">
            <p className="text-[10px] font-mono uppercase tracking-[0.5em] text-gray-700">AUTHENTICATED_REPORT_VERIFIED // [SYSTEM_INTEGRITY_CHECK_PASS]</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
