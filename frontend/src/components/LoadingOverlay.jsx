import React, { useState, useEffect } from 'react';
import { ShieldAlert, BookOpen, Scale, Loader2 } from 'lucide-react';

const PHRASES = [
  { text: "Analizando datos y sustentos legales...", icon: <Scale size={28} /> },
  { text: "Garantizando el debido proceso escolar...", icon: <ShieldAlert size={28} /> },
  { text: "Estructurando formato institucional...", icon: <BookOpen size={28} /> },
  { text: "Educando con justicia y equidad...", icon: <Scale size={28} /> },
  { text: "Compilando expediente en alta calidad...", icon: <Loader2 size={28} className="animate-spin" /> },
];

export default function LoadingOverlay({ title = "Generando Documentos" }) {
  const [progress, setProgress] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    // Fake progress bar that reaches 95% over 12 seconds
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + (95 - prev) * 0.1;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Rotate phrases every 2.8 seconds
    const interval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % PHRASES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-secondary/10 rounded-full blur-3xl opacity-50"></div>

      <div className="relative flex flex-col items-center max-w-sm w-full p-8 text-center bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
        
        <div className="w-20 h-20 bg-gradient-to-br from-brand-primary/10 to-brand-primary/30 text-brand-primary rounded-2xl flex items-center justify-center mb-6 shadow-inner transform transition-all duration-700 hover:rotate-12">
          <div className="scale-125">{PHRASES[phraseIndex].icon}</div>
        </div>

        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 uppercase tracking-tighter">{title}</h3>
        
        <div className="h-10 flex items-center justify-center">
          <p className="text-sm font-bold text-brand-primary animate-in fade-in slide-in-from-bottom-2 duration-500">
            {PHRASES[phraseIndex].text}
          </p>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mt-6 mb-3 overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700">
          <div 
            className="bg-gradient-to-r from-brand-primary to-brand-accent h-full rounded-full transition-all duration-700 ease-out relative shadow-[0_0_10px_rgba(29,78,216,0.3)]" 
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute top-0 left-0 right-0 bottom-0 bg-white opacity-30 animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex justify-between w-full px-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Compilando...</span>
          <span className="text-xs font-black text-brand-primary">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}
