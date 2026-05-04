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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-95 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-50"></div>

      <div className="relative flex flex-col items-center max-w-sm w-full p-8 text-center bg-white rounded-2xl shadow-sm border border-gray-100">
        
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner transform transition-transform duration-500 hover:scale-105">
          {PHRASES[phraseIndex].icon}
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        
        <p className="text-sm font-semibold text-indigo-600 h-10 flex items-center justify-center transition-all duration-300">
          {PHRASES[phraseIndex].text}
        </p>

        <div className="w-full bg-gray-100 rounded-full h-3 mt-6 mb-3 overflow-hidden shadow-inner border border-gray-200">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out relative" 
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute top-0 left-0 right-0 bottom-0 bg-white opacity-20 animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex justify-between w-full px-1">
          <span className="text-xs text-gray-400 font-medium">Por favor espera...</span>
          <span className="text-xs font-bold text-indigo-600">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}
