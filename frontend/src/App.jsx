import React, { useState, useEffect } from 'react';
import ChatPanel from './components/ChatPanel';
import ProcessChecklist from './components/ProcessChecklist';
import PdfViewer from './components/PdfViewer';
import CaseSidebar from './components/CaseSidebar';
import CaseWizard from './components/CaseWizard';
import axios from 'axios';
import { Shield, Settings, Key, Brain, ListOrdered, UserCircle } from 'lucide-react';

function App() {
  const [steps, setSteps] = useState([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [pdfs, setPdfs] = useState([]);
  const [activePdfIndex, setActivePdfIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState({ primary: '', fallback: '' });
  const [userProfile, setUserProfile] = useState({ nombre: '', cargo: '', sede: '' });
  const [mode, setMode] = useState('orden'); // 'conciencia' | 'orden'

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
        setActivePdfIndex(pdfs.length);
      }
    } catch (error) { console.error("Error calling generate-pdf API:", error); }
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
          <header className="flex items-center justify-between px-6 py-3 bg-white bg-opacity-70 backdrop-blur-md rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                <Shield size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">I.E. Sor María Juliana</h1>
                <p className="text-gray-400 text-xs font-medium">Sistema de Apoyo al Debido Proceso y SIEE — v2.0</p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => handleModeChange('conciencia')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'conciencia' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Brain size={16} />
                ConciencIA
              </button>
              <button
                onClick={() => handleModeChange('orden')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
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
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${showSettings ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Settings size={20} />
              <span className="text-sm font-medium hidden sm:inline">Config</span>
            </button>
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
        <main className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">
          {/* Far Left: Case Sidebar */}
          <div className="w-full lg:w-[15%] h-full min-h-0">
            <CaseSidebar 
              casos={casos}
              currentCaseId={currentCaseId}
              onSelectCase={handleSelectCase}
              onCreateCase={handleCreateCase}
            />
          </div>

          {mode === 'conciencia' ? (
            <>
              {/* Checklist */}
              <div className="w-full lg:w-[17%] h-full min-h-0">
                <ProcessChecklist steps={steps} activeStepIndex={activeStepIndex} />
              </div>
              {/* Chat */}
              <div className="w-full lg:w-[36%] h-full min-h-0">
                <ChatPanel 
                  apiKeys={apiKeys}
                  casoId={currentCaseId}
                  loadedMessages={loadedMessages}
                  onUpdateSteps={handleUpdateSteps} 
                  onGenerateFormat={handleGenerateFormat} 
                />
              </div>
              {/* PDF Viewer */}
              <div className="w-full lg:w-[32%] h-full min-h-0">
                <PdfViewer pdfs={pdfs} activePdfIndex={activePdfIndex} setActivePdfIndex={setActivePdfIndex} removePdf={removePdf} />
              </div>
            </>
          ) : (
            <>
              {/* Wizard */}
              <div className="w-full lg:w-[53%] h-full min-h-0">
                <CaseWizard currentCaseId={currentCaseId} userProfile={userProfile} />
              </div>
              {/* PDF Viewer */}
              <div className="w-full lg:w-[32%] h-full min-h-0">
                <PdfViewer pdfs={pdfs} activePdfIndex={activePdfIndex} setActivePdfIndex={setActivePdfIndex} removePdf={removePdf} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
