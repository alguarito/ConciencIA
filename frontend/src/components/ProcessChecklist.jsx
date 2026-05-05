import React from 'react';
import { CheckCircle, Circle, FileText } from 'lucide-react';

export default function ProcessChecklist({ steps, activeStepIndex }) {
  if (!steps || steps.length === 0) {
    return (
      <div className="h-full bg-white dark:bg-slate-900 bg-opacity-70 dark:bg-opacity-90 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 transition-colors duration-300">
        <FileText size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
        <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">Plan de Acción</h2>
        <p className="text-sm">Inicia una consulta en el chat para que el asesor identifique los pasos del debido proceso.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-slate-900 bg-opacity-70 dark:bg-opacity-90 backdrop-blur-md rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 p-6 overflow-y-auto transition-colors duration-300 custom-scrollbar">
      <h2 className="text-xl font-bold mb-6 text-brand-primary dark:text-brand-accent border-b-2 border-brand-primary/10 pb-3 flex items-center gap-2">
        <FileText size={22} className="text-brand-secondary" />
        Plan de Acción
      </h2>
      
      <div className="space-y-6 relative">
        {/* Step Line Connector */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800 z-0"></div>
        
        {steps.map((step, index) => {
          const isCompleted = index < activeStepIndex || step.completed;
          const isActive = index === activeStepIndex;
          
          return (
            <div key={index} className={`flex items-start gap-4 relative z-10 transition-all ${isCompleted ? 'opacity-60' : isActive ? 'scale-[1.02]' : ''}`}>
              <div className="mt-0.5 bg-white dark:bg-slate-900 rounded-full">
                {isCompleted ? (
                  <CheckCircle className="text-brand-primary" size={24} />
                ) : isActive ? (
                  <Circle className="text-brand-secondary fill-brand-secondary/20 animate-pulse" size={24} />
                ) : (
                  <Circle className="text-slate-300 dark:text-slate-700" size={24} />
                )}
              </div>
              <div className={`flex-1 p-3 rounded-xl transition-all ${isActive ? 'bg-brand-primary/5 border border-brand-primary/10 shadow-sm' : ''}`}>
                <h3 className={`font-bold text-sm ${isCompleted ? 'line-through text-slate-500' : isActive ? 'text-brand-primary dark:text-brand-accent' : 'text-slate-700 dark:text-slate-200'}`}>
                  {step.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
