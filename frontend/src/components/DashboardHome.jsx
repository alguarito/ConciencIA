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
        <div className="w-12 h-12 rounded-xl bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary dark:text-brand-accent flex items-center justify-center shadow-sm border border-brand-primary/20 dark:border-brand-primary/40">
          <LayoutDashboard size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Panel de Control</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Selecciona un acceso rápido o abre un caso existente</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 relative z-10">
        <div className="bg-gradient-to-br from-brand-primary to-brand-primary/80 dark:from-slate-800 dark:to-slate-900 p-5 rounded-2xl shadow-md border border-brand-primary/20 dark:border-slate-700 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-white/70 dark:text-slate-400 mb-1">Total Casos</p>
            <h3 className="text-3xl font-black text-white">{stats.total}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 dark:bg-brand-primary/50 text-white dark:text-brand-accent flex items-center justify-center relative z-10 backdrop-blur-sm border border-white/30 dark:border-slate-700">
            <Folder size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:border-brand-secondary/30 dark:hover:border-brand-secondary/50 transition-colors">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Convivencia</p>
            <h3 className="text-3xl font-bold text-brand-secondary dark:text-brand-secondary/90">~{stats.convivencia}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-brand-secondary/10 dark:bg-brand-secondary/20 text-brand-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldAlert size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:border-brand-primary/20 dark:hover:border-brand-primary/50 transition-colors">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Académicos</p>
            <h3 className="text-3xl font-bold text-brand-primary dark:text-brand-accent">~{stats.academico}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary dark:text-brand-accent flex items-center justify-center group-hover:scale-110 transition-transform">
            <BookOpen size={24} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-brand-primary" />
          Accesos Rápidos
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button 
            onClick={() => handleQuickStart('falta-leve', 'Falta Leve')}
          disabled={loadingRoute !== null}
          className="text-left bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-slate-800 dark:to-slate-800 hover:shadow-md hover:ring-1 hover:ring-amber-400 border border-amber-200/60 dark:border-slate-700 p-5 rounded-2xl transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-300 dark:bg-amber-500/10 rounded-full blur-2xl opacity-40 -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-amber-200/50 dark:bg-slate-700 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-slate-600">
              {loadingRoute === 'falta-leve' ? <Loader2 size={20} className="animate-spin" /> : <AlertTriangle size={20} />}
            </div>
            <ChevronRight size={20} className="text-amber-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg relative z-10">Atender Falta Leve</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 relative z-10">Llegadas tarde, uniformes, desorden.</p>
        </button>

        <button 
          onClick={() => handleQuickStart('situacion-tipo-ii', 'Tipo II')}
          disabled={loadingRoute !== null}
          className="text-left bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-slate-800 dark:to-slate-800 hover:shadow-md hover:ring-1 hover:ring-blue-400 border border-blue-200/60 dark:border-slate-700 p-5 rounded-2xl transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-300 dark:bg-blue-500/10 rounded-full blur-2xl opacity-40 -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-blue-200/50 dark:bg-slate-700 text-blue-700 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-slate-600">
              {loadingRoute === 'situacion-tipo-ii' ? <Loader2 size={20} className="animate-spin" /> : <ShieldAlert size={20} />}
            </div>
            <ChevronRight size={20} className="text-blue-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg relative z-10">Protocolo Tipo II</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 relative z-10">Acoso escolar, agresión, ciberacoso.</p>
        </button>

        <button 
          onClick={() => handleQuickStart('reclamacion-academica', 'Reclamación')}
          disabled={loadingRoute !== null}
          className="text-left bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800 hover:shadow-md border border-slate-200/60 dark:border-slate-700 p-5 rounded-2xl transition-all group relative overflow-hidden md:col-span-2"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200 dark:bg-slate-500/10 rounded-full blur-3xl opacity-40 -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-400 flex items-center justify-center shrink-0 border border-slate-300/50 dark:border-slate-600">
              {loadingRoute === 'reclamacion-academica' ? <Loader2 size={24} className="animate-spin" /> : <BookOpen size={24} />}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Reclamación Académica</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Iniciar proceso por inconformidad con notas.</p>
            </div>
            <ChevronRight size={24} className="text-slate-300 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
          </div>
        </button>
      </div>
      </div>
      
    </div>
  );
}
