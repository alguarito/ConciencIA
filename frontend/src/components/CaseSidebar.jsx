import React, { useState } from 'react';
import { Folder, Plus, ChevronRight, Search } from 'lucide-react';
import axios from 'axios';

export default function CaseSidebar({ casos, currentCaseId, onSelectCase, onCreateCase, addToast }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newCaseName, setNewCaseName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCaseName.trim()) return;
    
    try {
      const response = await axios.post('/api/casos', { nombre: newCaseName.trim() });
      onCreateCase(response.data);
      setNewCaseName('');
      setIsCreating(false);
    } catch (error) {
      console.error("Error creating case:", error);
      if (addToast) {
        addToast(`❌ Error al crear caso: ${error.response?.status || ''} ${error.message}`, 'error');
      }
    }
  };

  const filteredCasos = casos.filter(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 bg-opacity-70 dark:bg-opacity-90 backdrop-blur-md rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
      <div className="p-4 border-b border-slate-200/60 dark:border-slate-800 bg-brand-primary/5 dark:bg-brand-primary/10">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
          <Folder className="text-brand-primary dark:text-brand-accent" size={20} />
          Casos Activos
        </h2>
        
        {!isCreating ? (
          <button 
            onClick={() => setIsCreating(true)}
            className="w-full py-2 px-4 bg-gradient-to-r from-brand-primary to-brand-primary/80 hover:brightness-110 text-white rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow focus:ring-2 focus:ring-brand-secondary/50 text-sm font-semibold"
          >
            <Plus size={16} />
            Nuevo Caso
          </button>
        ) : (
          <form onSubmit={handleCreate} className="flex flex-col gap-2">
              <input 
              autoFocus
              type="text" 
              placeholder="Nombre del estudiante..." 
              value={newCaseName}
              onChange={(e) => setNewCaseName(e.target.value)}
              className="w-full text-sm rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/50 px-3 py-2 focus:ring-2 focus:ring-brand-primary outline-none dark:text-slate-200"
            />
            <div className="flex gap-2">
              <button 
                type="submit"
                className="flex-1 py-1.5 bg-brand-primary hover:brightness-110 text-white rounded-md text-sm font-medium transition-colors"
              >
                Crear
              </button>
              <button 
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input 
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-brand-primary dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {filteredCasos.length === 0 ? (
          <p className="text-center text-slate-400 dark:text-slate-500 text-sm mt-8">No hay casos registrados</p>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredCasos.map((caso) => (
              <button
                key={caso.id}
                onClick={() => onSelectCase(caso.id)}
                className={`text-left w-full px-3 py-2 rounded-lg text-sm flex items-center justify-between group transition-all ${
                  currentCaseId === caso.id 
                    ? 'bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary dark:text-brand-accent font-bold border-l-4 border-brand-secondary shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 border-l-4 border-transparent'
                }`}
              >
                <span className="truncate pr-2">{caso.nombre}</span>
                <ChevronRight size={14} className={`${currentCaseId === caso.id ? 'text-brand-secondary' : 'text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100'} transition-opacity`} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
