import React, { useState, useEffect } from 'react';
import ChatPanel from './components/ChatPanel';
import ProcessChecklist from './components/ProcessChecklist';
import PdfViewer from './components/PdfViewer';
import CaseSidebar from './components/CaseSidebar';
import CaseWizard from './components/CaseWizard';
import LoadingOverlay from './components/LoadingOverlay';
import axios from 'axios';
import { Shield, Settings, Key, Brain, ListOrdered, UserCircle, Folder, LayoutDashboard, FileText, CheckCircle, AlertCircle, Moon, Sun } from 'lucide-react';

function App() {
  const [steps, setSteps] = useState([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [pdfs, setPdfs] = useState([]);
  const [activePdfIndex, setActivePdfIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState({ primary: '', fallback: '' });
  const [userProfile, setUserProfile] = useState({ nombre: '', cargo: '', sede: '' });
  const [mode, setMode] = useState('orden'); // 'conciencia' | 'orden'
  const [mobileTab, setMobileTab] = useState('trabajo'); // 'casos' | 'trabajo' | 'documentos'
  const [toasts, setToasts] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [generatingFormat, setGeneratingFormat] = useState(null);
  const [visualTheme, setVisualTheme] = useState('smj'); // 'original' | 'smj'
  const [serverOnline, setServerOnline] = useState(null); // null = checking, true = online, false = offline

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Case management state
  const [casos, setCasos] = useState([]);
  const [currentCaseId, setCurrentCaseId] = useState(null);
  const [loadedMessages, setLoadedMessages] = useState(null);

  useEffect(() => {
    const savedKeys = localStorage.getItem('smj_api_keys');
    if (savedKeys) {
      try { setApiKeys(JSON.parse(savedKeys)); } catch (e) {}
    }
    const savedProfile = localStorage.getItem('smj_user_profile');
    if (savedProfile) {
      try { setUserProfile(JSON.parse(savedProfile)); } catch (e) {}
    }
    const savedMode = localStorage.getItem('smj_mode');
    if (savedMode) setMode(savedMode);
    
    const savedThemeSelection = localStorage.getItem('smj_visual_theme');
    if (savedThemeSelection) {
      setVisualTheme(savedThemeSelection);
    }
  }, []);

  const toggleVisualTheme = (newTheme) => {
    setVisualTheme(newTheme);
    localStorage.setItem('smj_visual_theme', newTheme);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('smj_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('smj_theme', 'light');
    }
  };

  useEffect(() => { fetchCasos(); }, []);

  const fetchCasos = async () => {
    try {
      const response = await axios.get('/api/casos');
      setCasos(response.data.casos || []);
    } catch (error) { console.error("Error loading cases:", error); }
  };

  // Health check
  useEffect(() => {
    const checkHealth = () => {
      axios.get('/api/health', { timeout: 5000 })
        .then(() => setServerOnline(true))
        .catch(() => setServerOnline(false));
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteCase = (casoId) => {
    setCasos(prev => prev.filter(c => c.id !== casoId));
    if (currentCaseId === casoId) {
      setCurrentCaseId(null);
      setLoadedMessages(null);
      setSteps([]);
      setPdfs([]);
    }
  };

  const handleSelectCase = async (casoId) => {
    setCurrentCaseId(casoId);
    setSteps([]);
    setActiveStepIndex(0);
    setPdfs([]);
    setActivePdfIndex(0);
    try {
      const response = await axios.get(`/api/casos/${casoId}`);
      setLoadedMessages(response.data.messages || []);
      setPdfs(response.data.pdfs || []);
    } catch (error) {
      console.error("Error loading case:", error);
      setLoadedMessages([]);
    }
  };

  const handleCreateCase = (newCase) => {
    setCasos(prev => [newCase, ...prev]);
    setCurrentCaseId(newCase.id);
    setLoadedMessages([]);
    setSteps([]);
    setPdfs([]);
    setActivePdfIndex(0);
  };

  const handleKeyChange = (field, value) => {
    const cleanValue = value.trim();
    const newKeys = { ...apiKeys, [field]: cleanValue };
    setApiKeys(newKeys);
    localStorage.setItem('smj_api_keys', JSON.stringify(newKeys));
  };

  const handleProfileChange = (field, value) => {
    const newProfile = { ...userProfile, [field]: value };
    setUserProfile(newProfile);
    localStorage.setItem('smj_user_profile', JSON.stringify(newProfile));
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    localStorage.setItem('smj_mode', newMode);
  };

  const handleUpdateSteps = (newSteps) => {
    setSteps(newSteps);
    const firstIncomplete = newSteps.findIndex(s => !s.completed);
    setActiveStepIndex(firstIncomplete === -1 ? newSteps.length : firstIncomplete);
  };

  const handleGenerateFormat = async (formatoName, jsonData = {}) => {
    if (!currentCaseId) return;
    setGeneratingFormat(formatoName);
    try {
      const response = await axios.post('/api/generate-pdf', {
        caso_id: currentCaseId,
        tipo: formatoName,
        datos: jsonData
      });
      if (response.data.status === 'success') {
        const newPdf = { name: `${formatoName}.pdf`, url: response.data.pdf_url };
        setPdfs(prev => [...prev, newPdf]);
        setActivePdfIndex(pdfs.length); // will be pdfs.length - 1 after render
        addToast(`✅ Formato ${formatoName} generado con éxito.`);
      }
    } catch (error) { 
      console.error("Error calling generate-pdf API:", error); 
      addToast(`Error generando formato: ${error.message}`, 'error');
    } finally {
      setGeneratingFormat(null);
    }
  };

  const removePdf = (indexToRemove) => {
    setPdfs(prev => prev.filter((_, index) => index !== indexToRemove));
    if (activePdfIndex >= indexToRemove && activePdfIndex > 0) {
      setActivePdfIndex(prev => prev - 1);
    }
  };

  return (
    <div className={`min-h-screen bg-brand-bg dark:bg-slate-950 p-4 font-sans text-slate-800 dark:text-slate-200 flex flex-col transition-colors duration-300 relative ${visualTheme === 'smj' ? 'theme-smj' : visualTheme === 'vino' ? 'theme-vino' : ''}`}>
      {generatingFormat && <LoadingOverlay title={`Generando Expediente Legal...`} />}
      <div className="max-w-[1800px] w-full mx-auto h-[calc(100vh-2rem)] flex flex-col gap-3">
        
        {/* Header */}
        <div className="flex flex-col gap-2 shrink-0">
          <header className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 bg-white dark:bg-slate-900 bg-opacity-95 dark:bg-opacity-95 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 mb-4 z-20 relative transition-colors duration-300 gap-3">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm border border-brand-primary/10 dark:border-slate-700 bg-white flex items-center justify-center p-0.5">
                  <img src="/logo.png" alt="Escudo Sor María Juliana" className="w-full h-full object-contain drop-shadow-sm" />
                </div>
                <div>
                  <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-accent drop-shadow-sm tracking-tight">
                    ConciencIA
                  </h1>
                  <p className="hidden sm:block text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5 uppercase tracking-tighter flex items-center gap-1.5">
                    Due Process Advisor
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${serverOnline === true ? 'bg-emerald-400 shadow-[0_0_4px_theme(colors.emerald.400)]' : serverOnline === false ? 'bg-red-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} title={serverOnline === true ? 'Servidor en línea' : serverOnline === false ? 'Servidor desconectado' : 'Verificando conexión...'}></span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`sm:hidden p-2 rounded-lg transition-colors flex items-center justify-center ${showSettings ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Settings size={20} />
              </button>
            </div>
            <div className="flex items-center justify-between w-full sm:w-auto gap-2">
              {/* Mode Toggle */}
              <div className="flex items-center justify-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl p-1 flex-1 sm:flex-initial border border-slate-200/50 dark:border-slate-700/50">
                <button
                  onClick={() => handleModeChange('conciencia')}
                  className={`flex-1 sm:flex-initial flex justify-center items-center gap-1.5 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    mode === 'conciencia' 
                      ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-amber-500/20' 
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Brain size={16} className={mode === 'conciencia' ? 'text-amber-500' : ''} />
                  <span className="hidden sm:inline">ConciencIA</span>
                  <span className="sm:hidden">IA</span>
                </button>
                <button
                  onClick={() => handleModeChange('orden')}
                  className={`flex-1 sm:flex-initial flex justify-center items-center gap-1.5 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    mode === 'orden' 
                      ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/20' 
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <ListOrdered size={16} className={mode === 'orden' ? 'text-blue-600' : ''} />
                  <span className="hidden sm:inline">Modo Orden</span>
                  <span className="sm:hidden">Orden</span>
                </button>
              </div>
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-lg transition-colors items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                title="Cambiar tema"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`hidden sm:flex p-2 rounded-lg transition-colors items-center gap-2 ${showSettings ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
              >
                <Settings size={20} />
                <span className="text-sm font-medium">Config</span>
              </button>
            </div>
          </header>

          {/* Settings */}
          {showSettings && (
            <div className="bg-white dark:bg-slate-900 bg-opacity-95 dark:bg-opacity-95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-800 p-5 mt-1 animate-in fade-in slide-in-from-top-4 duration-200 transition-colors duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* User Profile Card */}
                <div className="bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/30 dark:to-slate-900/30 rounded-xl p-5 border border-blue-100 dark:border-blue-900/50 relative overflow-hidden shadow-inner">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-200 dark:bg-blue-900 rounded-full opacity-30 pointer-events-none"></div>
                  
                  <div className="flex items-center gap-3 mb-4 text-blue-900 dark:text-blue-400 relative z-10 border-b border-blue-200/50 dark:border-blue-800/50 pb-3">
                    <UserCircle size={24} className="text-blue-600 dark:text-blue-500" />
                    <div>
                      <h3 className="font-bold text-sm leading-tight">Credencial del Docente</h3>
                      <p className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-500 font-semibold">Autocompletado Activo</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 relative z-10">
                    <div>
                      <label className="block text-xs font-semibold text-brand-primary dark:text-brand-accent mb-1.5 ml-1 uppercase tracking-tight">Nombre Completo</label>
                      <input type="text" value={userProfile.nombre} onChange={(e) => handleProfileChange('nombre', e.target.value)}
                        placeholder="Ej. María Fernanda López" 
                        className="w-full text-sm rounded-lg border-brand-primary/20 dark:border-brand-primary/40 bg-white/80 dark:bg-slate-950/50 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-secondary shadow-sm transition-all dark:text-slate-200" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-brand-primary dark:text-brand-accent mb-1.5 ml-1 uppercase tracking-tight">Cargo</label>
                        <input type="text" value={userProfile.cargo} onChange={(e) => handleProfileChange('cargo', e.target.value)}
                          placeholder="Ej. Coordinador" 
                          className="w-full text-sm rounded-lg border-brand-primary/20 dark:border-brand-primary/40 bg-white/80 dark:bg-slate-950/50 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-secondary shadow-sm transition-all dark:text-slate-200" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-brand-primary dark:text-brand-accent mb-1.5 ml-1 uppercase tracking-tight">Sede</label>
                        <input type="text" value={userProfile.sede} onChange={(e) => handleProfileChange('sede', e.target.value)}
                          placeholder="Ej. Principal" 
                          className="w-full text-sm rounded-lg border-brand-primary/20 dark:border-brand-primary/40 bg-white/80 dark:bg-slate-950/50 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-secondary shadow-sm transition-all dark:text-slate-200" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* API Keys Card */}
                <div className="bg-gradient-to-br from-brand-secondary/10 to-brand-primary/10 dark:from-brand-secondary/20 dark:to-brand-primary/20 rounded-xl p-5 border border-brand-secondary/20 dark:border-brand-secondary/30 shadow-inner relative overflow-hidden">
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-secondary rounded-full opacity-10 pointer-events-none"></div>
                  
                  <div className="flex items-center gap-3 mb-4 text-brand-secondary dark:text-brand-secondary border-b border-brand-secondary/20 dark:border-brand-secondary/50 pb-3 relative z-10">
                    <Key size={24} className="text-brand-secondary" />
                    <div>
                      <h3 className="font-bold text-sm leading-tight">Motor de ConciencIA</h3>
                      <p className="text-[10px] uppercase tracking-wider text-brand-secondary font-semibold">Conexión Segura</p>
                    </div>
                  </div>
                  <div className="space-y-4 relative z-10">
                    <div>
                      <label className="block text-xs font-semibold text-brand-secondary dark:text-brand-secondary mb-1.5 ml-1">Clave API Principal (Gemini)</label>
                      <input type="password" value={apiKeys.primary} onChange={(e) => handleKeyChange('primary', e.target.value)}
                        placeholder="AIzaSy..." 
                        className="w-full text-sm rounded-lg border-brand-secondary/30 dark:border-brand-secondary/50 bg-white/80 dark:bg-slate-950/50 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary shadow-sm transition-all placeholder:text-brand-secondary/30 dark:placeholder:text-brand-secondary/30 dark:text-slate-200" />
                    </div>
                    
                    {/* Theme Selector inside settings */}
                    <div className="pt-2 border-t border-brand-secondary/20">
                      <label className="block text-xs font-semibold text-brand-secondary dark:text-brand-secondary mb-2 ml-1 uppercase tracking-tighter">Personalización Visual</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => toggleVisualTheme('original')}
                          className={`py-2 rounded-lg text-[9px] font-bold border transition-all ${visualTheme === 'original' ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                        >
                          ORIGINAL
                        </button>
                        <button 
                          onClick={() => toggleVisualTheme('smj')}
                          className={`py-2 rounded-lg text-[9px] font-bold border transition-all ${visualTheme === 'smj' ? 'bg-blue-700 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                        >
                          AZUL/ORO
                        </button>
                        <button 
                          onClick={() => toggleVisualTheme('vino')}
                          className={`py-2 rounded-lg text-[9px] font-bold border transition-all ${visualTheme === 'vino' ? 'bg-[#800020] text-white border-[#800020] shadow-md ring-2 ring-[#800020]/20' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                        >
                          AZUL/VINO
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 relative pb-16 lg:pb-0">
          {/* Far Left: Case Sidebar */}
          <div className={`w-full lg:w-[15%] h-full min-h-0 ${mobileTab === 'casos' ? 'block' : 'hidden lg:block'}`}>
            <CaseSidebar 
              casos={casos}
              currentCaseId={currentCaseId}
              onSelectCase={handleSelectCase}
              onCreateCase={handleCreateCase}
              onDeleteCase={handleDeleteCase}
              addToast={addToast}
            />
          </div>

          {mode === 'conciencia' ? (
            <>
              {/* Workspace Container para ConciencIA */}
              <div className={`w-full lg:w-[53%] h-full min-h-0 ${mobileTab === 'trabajo' ? 'flex' : 'hidden lg:flex'} flex-col lg:flex-row gap-3`}>
                {/* Checklist */}
                <div className="w-full lg:w-[32%] h-[200px] lg:h-full min-h-0 shrink-0 lg:shrink">
                  <ProcessChecklist steps={steps} activeStepIndex={activeStepIndex} />
                </div>
                {/* Chat */}
                <div className="w-full lg:w-[68%] h-full min-h-0">
                  <ChatPanel 
                    apiKeys={apiKeys}
                    casoId={currentCaseId}
                    loadedMessages={loadedMessages}
                    onUpdateSteps={handleUpdateSteps} 
                    onGenerateFormat={handleGenerateFormat}
                    addToast={addToast}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Wizard para Orden */}
              <div className={`w-full lg:w-[53%] h-full min-h-0 ${mobileTab === 'trabajo' ? 'block' : 'hidden lg:block'}`}>
                <CaseWizard 
                  currentCaseId={currentCaseId} 
                  userProfile={userProfile} 
                  onCreateCase={handleCreateCase}
                  addToast={addToast}
                  onPdfsGenerated={(newPdfs) => {
                    setPdfs(prev => [...prev, ...newPdfs]);
                    setActivePdfIndex(pdfs.length);
                    setMobileTab('documentos'); // Cambiar a pestaña de documentos en móvil
                  }}
                />
              </div>
            </>
          )}

          {/* PDF Viewer */}
          <div className={`w-full lg:w-[32%] h-full min-h-0 ${mobileTab === 'documentos' ? 'block' : 'hidden lg:block'}`}>
            <PdfViewer pdfs={pdfs} activePdfIndex={activePdfIndex} setActivePdfIndex={setActivePdfIndex} removePdf={removePdf} />
          </div>

          {/* Mobile Bottom Navigation Bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-around p-2 pb-safe z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] transition-colors duration-300">
            <button 
              onClick={() => setMobileTab('casos')}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${mobileTab === 'casos' ? 'text-blue-700 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <Folder size={20} />
              <span className="text-[10px] font-bold mt-1">Casos</span>
            </button>
            <button 
              onClick={() => setMobileTab('trabajo')}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${mobileTab === 'trabajo' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <LayoutDashboard size={20} />
              <span className="text-[10px] font-bold mt-1">Trabajo</span>
            </button>
            <button 
              onClick={() => setMobileTab('documentos')}
              className={`flex flex-col items-center p-2 relative rounded-lg transition-colors ${mobileTab === 'documentos' ? 'text-blue-700 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <FileText size={20} />
              <span className="text-[10px] font-bold mt-1">PDFs</span>
              {pdfs.length > 0 && (
                <span className="absolute top-1 right-2 w-3 h-3 bg-amber-500 rounded-full border border-white dark:border-slate-900"></span>
              )}
            </button>
          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-24 lg:bottom-6 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            toast.type === 'success' ? 'bg-blue-600 text-white' : 'bg-amber-500 text-slate-900'
          }`}>
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
