import React, { useState, useEffect } from 'react';
import ChatPanel from './components/ChatPanel';
import ProcessChecklist from './components/ProcessChecklist';
import PdfViewer from './components/PdfViewer';
import CaseSidebar from './components/CaseSidebar';
import CaseWizard from './components/CaseWizard';
import axios from 'axios';
import { Shield, Settings, Key, Brain, ListOrdered, UserCircle, Folder, LayoutDashboard, FileText, CheckCircle, AlertCircle } from 'lucide-react';

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
  }, []);

  useEffect(() => { fetchCasos(); }, []);

  const fetchCasos = async () => {
    try {
      const response = await axios.get('/api/casos');
      setCasos(response.data.casos || []);
    } catch (error) { console.error("Error loading cases:", error); }
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
    }
  };

  const removePdf = (indexToRemove) => {
    setPdfs(prev => prev.filter((_, index) => index !== indexToRemove));
    if (activePdfIndex >= indexToRemove && activePdfIndex > 0) {
      setActivePdfIndex(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 font-sans text-gray-800 flex flex-col">
      <div className="max-w-[1800px] w-full mx-auto h-[calc(100vh-2rem)] flex flex-col gap-3">
        
        {/* Header */}
        <div className="flex flex-col gap-2 shrink-0">
          <header className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 bg-white bg-opacity-70 backdrop-blur-md rounded-xl shadow-sm border border-gray-100 gap-3">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm">
                  <Shield size={20} />
                </div>
                <div>
                  <h1 className="text-[1.1rem] sm:text-xl font-bold text-gray-900 tracking-tight leading-tight">I.E. Sor María Juliana</h1>
                  <p className="hidden sm:block text-gray-400 text-xs font-medium mt-0.5">Sistema de Apoyo al Debido Proceso y SIEE — v2.0</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`sm:hidden p-2 rounded-lg transition-colors flex items-center justify-center ${showSettings ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <Settings size={20} />
              </button>
            </div>

            <div className="flex items-center justify-between w-full sm:w-auto gap-2">
              {/* Mode Toggle */}
              <div className="flex items-center justify-center gap-1 bg-gray-100 rounded-xl p-1 flex-1 sm:flex-initial">
                <button
                  onClick={() => handleModeChange('conciencia')}
                  className={`flex-1 sm:flex-initial flex justify-center items-center gap-1.5 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    mode === 'conciencia' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Brain size={16} />
                  <span className="hidden sm:inline">ConciencIA</span>
                  <span className="sm:hidden">IA</span>
                </button>
                <button
                  onClick={() => handleModeChange('orden')}
                  className={`flex-1 sm:flex-initial flex justify-center items-center gap-1.5 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    mode === 'orden' 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ListOrdered size={16} />
                  Orden
                </button>
              </div>

              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`hidden sm:flex p-2 rounded-lg transition-colors items-center gap-2 ${showSettings ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <Settings size={20} />
                <span className="text-sm font-medium">Config</span>
              </button>
            </div>
          </header>

          {/* Settings */}
          {showSettings && (
            <div className="bg-white bg-opacity-95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-5 mt-1 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* User Profile Card */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100 relative overflow-hidden shadow-inner">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-200 rounded-full opacity-40 pointer-events-none"></div>
                  
                  <div className="flex items-center gap-3 mb-4 text-emerald-800 relative z-10 border-b border-emerald-200 pb-3">
                    <UserCircle size={24} className="text-emerald-600" />
                    <div>
                      <h3 className="font-bold text-sm leading-tight">Credencial del Docente</h3>
                      <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">Autocompletado Activo</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 relative z-10">
                    <div>
                      <label className="block text-xs font-semibold text-emerald-800 mb-1.5 ml-1">Nombre Completo</label>
                      <input type="text" value={userProfile.nombre} onChange={(e) => handleProfileChange('nombre', e.target.value)}
                        placeholder="Ej. María Fernanda López" 
                        className="w-full text-sm rounded-lg border-emerald-200 bg-white/80 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all placeholder:text-emerald-300" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-emerald-800 mb-1.5 ml-1">Cargo</label>
                        <input type="text" value={userProfile.cargo} onChange={(e) => handleProfileChange('cargo', e.target.value)}
                          placeholder="Ej. Coordinador" 
                          className="w-full text-sm rounded-lg border-emerald-200 bg-white/80 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all placeholder:text-emerald-300" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-emerald-800 mb-1.5 ml-1">Sede</label>
                        <input type="text" value={userProfile.sede} onChange={(e) => handleProfileChange('sede', e.target.value)}
                          placeholder="Ej. Principal" 
                          className="w-full text-sm rounded-lg border-emerald-200 bg-white/80 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all placeholder:text-emerald-300" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* API Keys Card */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100 shadow-inner">
                  <div className="flex items-center gap-3 mb-4 text-indigo-800 border-b border-indigo-200 pb-3">
                    <Key size={24} className="text-indigo-600" />
                    <div>
                      <h3 className="font-bold text-sm leading-tight">Motor de ConciencIA</h3>
                      <p className="text-[10px] uppercase tracking-wider text-indigo-600 font-semibold">Conexión Segura</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-indigo-800 mb-1.5 ml-1">Clave API Principal (Gemini)</label>
                      <input type="password" value={apiKeys.primary} onChange={(e) => handleKeyChange('primary', e.target.value)}
                        placeholder="AIzaSy..." 
                        className="w-full text-sm rounded-lg border-indigo-200 bg-white/80 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all placeholder:text-indigo-300" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-indigo-800 mb-1.5 ml-1">Clave API Respaldo</label>
                      <input type="password" value={apiKeys.fallback} onChange={(e) => handleKeyChange('fallback', e.target.value)}
                        placeholder="AIzaSy..." 
                        className="w-full text-sm rounded-lg border-indigo-200 bg-white/80 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all placeholder:text-indigo-300" />
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
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around p-2 pb-safe z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <button 
              onClick={() => setMobileTab('casos')}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${mobileTab === 'casos' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Folder size={20} />
              <span className="text-[10px] font-bold mt-1">Casos</span>
            </button>
            <button 
              onClick={() => setMobileTab('trabajo')}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${mobileTab === 'trabajo' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutDashboard size={20} />
              <span className="text-[10px] font-bold mt-1">Área de Trabajo</span>
            </button>
            <button 
              onClick={() => setMobileTab('documentos')}
              className={`flex flex-col items-center p-2 relative rounded-lg transition-colors ${mobileTab === 'documentos' ? 'text-purple-600 bg-purple-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FileText size={20} />
              <span className="text-[10px] font-bold mt-1">PDFs</span>
              {pdfs.length > 0 && (
                <span className="absolute top-1 right-2 w-3 h-3 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>
          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-24 lg:bottom-6 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
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
