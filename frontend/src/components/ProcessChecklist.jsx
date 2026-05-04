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
    <div className="h-full bg-white dark:bg-slate-900 bg-opacity-70 dark:bg-opacity-90 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 p-6 overflow-y-auto transition-colors duration-300 custom-scrollbar">
      <h2 className="text-xl font-bold mb-6 text-indigo-900 dark:text-indigo-400 border-b border-gray-200 dark:border-slate-700 pb-2">Plan de Acción</h2>
      
      <div className="space-y-6">
        {steps.map((step, index) => {
          const isCompleted = index < activeStepIndex || step.completed;
          const isActive = index === activeStepIndex;
          
          return (
            <div key={index} className={`flex items-start gap-4 ${isCompleted ? 'opacity-70' : ''}`}>
              <div className="mt-1">
                {isCompleted ? (
                  <CheckCircle className="text-green-500" size={24} />
                ) : (
                  <Circle className={`text-gray-300 ${isActive ? 'text-indigo-500 fill-indigo-50' : ''}`} size={24} />
                )}
              </div>
              <div>
                <h3 className={`font-medium ${isCompleted ? 'line-through text-gray-500 dark:text-gray-500' : isActive ? 'text-indigo-800 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-200'}`}>
                  {step.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
