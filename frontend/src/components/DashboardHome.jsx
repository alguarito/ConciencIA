import React, { useState } from 'react';
import { LayoutDashboard, AlertTriangle, ShieldAlert, BookOpen, Clock, FileText, ChevronRight, Loader2, BarChart3, Folder } from 'lucide-react';
import axios from 'axios';

export default function DashboardHome({ casos, rutas, onCreateCase }) {
  const [loadingRoute, setLoadingRoute] = useState(null);

  const stats = {
    total: casos.length,
    convivencia: casos.length > 0 ? Math.floor(casos.length * 0.7) : 0, // Fake stats for visual demo, ideally we'd parse cases
    academico: casos.length > 0 ? Math.ceil(casos.length * 0.3) : 0
  };

  const handleQuickStart = async (routeId, prefixName) => {
    setLoadingRoute(routeId);
    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateString = now.toLocaleDateString();
      const caseName = `${prefixName} - ${dateString} ${timeString}`;
      
      const response = await axios.post('/api/casos', { nombre: caseName });
      const newCase = response.data;
      
      // Encontrar la ruta completa en el catálogo
      const rutaCompleta = rutas.find(r => r.id === routeId);
      
      if (rutaCompleta) {
        // Guardar como borrador inicial para que CaseWizard salte directo al Paso 1
        localStorage.setItem(`draft_${newCase.id}`, JSON.stringify({
          gData: {},
          sData: {},
          sRuta: rutaCompleta
        }));
      }
      
      // Notificar a App.jsx para que seleccione este nuevo caso
      onCreateCase(newCase);
      
    } catch (err) {
      console.error("Error creating quick case:", err);
    } finally {
      setLoadingRoute(null);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar dark:bg-slate-900 transition-colors duration-300 relative">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <LayoutDashboard size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Panel de Control</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Selecciona un acceso rápido o abre un caso existente</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 relative z-10">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Casos</p>
            <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{stats.total}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Folder size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Convivencia</p>
            <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">~{stats.convivencia}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Académicos</p>
            <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">~{stats.academico}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <BookOpen size={24} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-emerald-500" />
          Accesos Rápidos
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button 
            onClick={() => handleQuickStart('falta-leve', 'Falta Leve')}
          disabled={loadingRoute !== null}
          className="text-left bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-800 hover:shadow-md border border-orange-100 dark:border-slate-700 p-5 rounded-2xl transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-200 dark:bg-orange-500/10 rounded-full blur-2xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-slate-700 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              {loadingRoute === 'falta-leve' ? <Loader2 size={20} className="animate-spin" /> : <AlertTriangle size={20} />}
            </div>
            <ChevronRight size={20} className="text-orange-300 dark:text-slate-500 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors" />
          </div>
          <h4 className="font-bold text-gray-800 dark:text-gray-100 text-lg relative z-10">Atender Falta Leve</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 relative z-10">Llegadas tarde, uniformes, desorden.</p>
        </button>

        <button 
          onClick={() => handleQuickStart('situacion-tipo-ii', 'Tipo II')}
          disabled={loadingRoute !== null}
          className="text-left bg-gradient-to-br from-rose-50 to-red-50 dark:from-slate-800 dark:to-slate-800 hover:shadow-md border border-rose-100 dark:border-slate-700 p-5 rounded-2xl transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-200 dark:bg-rose-500/10 rounded-full blur-2xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-slate-700 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              {loadingRoute === 'situacion-tipo-ii' ? <Loader2 size={20} className="animate-spin" /> : <ShieldAlert size={20} />}
            </div>
            <ChevronRight size={20} className="text-rose-300 dark:text-slate-500 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors" />
          </div>
          <h4 className="font-bold text-gray-800 dark:text-gray-100 text-lg relative z-10">Protocolo Tipo II</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 relative z-10">Acoso escolar, agresión, ciberacoso.</p>
        </button>

        <button 
          onClick={() => handleQuickStart('reclamacion-academica', 'Reclamación')}
          disabled={loadingRoute !== null}
          className="text-left bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 hover:shadow-md border border-indigo-100 dark:border-slate-700 p-5 rounded-2xl transition-all group relative overflow-hidden md:col-span-2"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200 dark:bg-indigo-500/10 rounded-full blur-3xl opacity-40 -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              {loadingRoute === 'reclamacion-academica' ? <Loader2 size={24} className="animate-spin" /> : <BookOpen size={24} />}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Reclamación Académica</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Iniciar proceso por inconformidad con notas.</p>
            </div>
            <ChevronRight size={24} className="text-indigo-300 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
          </div>
        </button>
      </div>
      </div>
      
    </div>
  );
}
