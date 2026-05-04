import React, { useState } from 'react';
import { Folder, Plus, ChevronRight, Search } from 'lucide-react';
import axios from 'axios';

export default function CaseSidebar({ casos, currentCaseId, onSelectCase, onCreateCase }) {
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
    }
  };

  const filteredCasos = casos.filter(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 bg-opacity-70 dark:bg-opacity-90 backdrop-blur-md rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
      <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-900/20">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4">
          <Folder className="text-indigo-600 dark:text-indigo-400" size={20} />
          Casos Activos
        </h2>
        
        {!isCreating ? (
          <button 
            onClick={() => setIsCreating(true)}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Nuevo Caso
          </button>
        ) : (
          <form onSubmit={handleCreate} className="flex flex-col gap-2">
            <input 
              autoFocus
              type="text" 
              placeholder="Nombre del estudiante o caso..." 
              value={newCaseName}
              onChange={(e) => setNewCaseName(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950/50 px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-gray-200"
            />
            <div className="flex gap-2">
              <button 
                type="submit"
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Crear
              </button>
              <button 
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 py-1.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-md text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input 
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 dark:text-gray-200"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {filteredCasos.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-slate-500 text-sm mt-8">No hay casos registrados</p>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredCasos.map((caso) => (
              <button
                key={caso.id}
                onClick={() => onSelectCase(caso.id)}
                className={`text-left w-full px-3 py-2 rounded-lg text-sm flex items-center justify-between group transition-colors ${
                  currentCaseId === caso.id 
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <span className="truncate pr-2">{caso.nombre}</span>
                <ChevronRight size={14} className={`${currentCaseId === caso.id ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-300 dark:text-slate-600 opacity-0 group-hover:opacity-100'} transition-opacity`} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
