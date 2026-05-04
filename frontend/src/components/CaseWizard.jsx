import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowRight, ArrowLeft, FileText, Users, ClipboardList, Printer, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import LoadingOverlay from './LoadingOverlay';

const STEP_LABELS = ['Clasificar Caso', 'Datos Generales', 'Datos Específicos', 'Generar Expediente'];

export default function CaseWizard({ currentCaseId, userProfile, addToast, onPdfsGenerated }) {
  const [step, setStep] = useState(0);
  const [rutas, setRutas] = useState([]);
  const [camposGenerales, setCamposGenerales] = useState([]);
  const [selectedRuta, setSelectedRuta] = useState(null);
  const [generalData, setGeneralData] = useState({});
  const [specificData, setSpecificData] = useState({});
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState(null);
  const [activeCategory, setActiveCategory] = useState('convivencia');

  // Auto-cargar borradores
  useEffect(() => {
    if (currentCaseId) {
      const savedState = localStorage.getItem(`draft_${currentCaseId}`);
      if (savedState) {
        try {
          const { gData, sData, sRuta } = JSON.parse(savedState);
          if (gData) setGeneralData(gData);
          if (sData) setSpecificData(sData);
          if (sRuta && !selectedRuta) {
            setSelectedRuta(sRuta);
            setStep(1); // Saltar al paso 1 si hay borrador
          }
        } catch (e) {
          console.error("Error loading draft", e);
        }
      } else {
        // Reset para casos sin borrador
        setGeneralData({});
        setSpecificData({});
        setSelectedRuta(null);
        setStep(0);
        setResults(null);
      }
    }
  }, [currentCaseId]);

  // Auto-guardar borradores
  useEffect(() => {
    if (currentCaseId && selectedRuta && !results) {
      localStorage.setItem(`draft_${currentCaseId}`, JSON.stringify({
        gData: generalData,
        sData: specificData,
        sRuta: selectedRuta
      }));
    }
  }, [generalData, specificData, selectedRuta, currentCaseId, results]);

  const sharedFields = React.useMemo(() => {
    if (!selectedRuta) return [];
    const counts = {};
    const details = {};
    selectedRuta.formatos.forEach(fmt => {
      fmt.campos_especificos.forEach(campo => {
        counts[campo.key] = (counts[campo.key] || 0) + 1;
        if (!details[campo.key]) details[campo.key] = campo;
      });
    });
    return Object.keys(counts)
      .filter(key => counts[key] > 1)
      .map(key => details[key]);
  }, [selectedRuta]);

  const getUniqueFieldsForFormat = (fmt) => {
    return fmt.campos_especificos.filter(campo => !sharedFields.find(sf => sf.key === campo.key));
  };

  useEffect(() => {
    axios.get('/api/rutas').then(res => {
      setRutas(res.data.rutas || []);
      setCamposGenerales(res.data.campos_generales || []);
    }).catch(err => console.error("Error loading rutas:", err));
  }, []);

  // Reset when case changes
  useEffect(() => {
    setStep(0);
    setSelectedRuta(null);
    setGeneralData({});
    setSpecificData({});
    setResults(null);
  }, [currentCaseId]);

  const handleGeneralChange = (key, value) => {
    setGeneralData(prev => ({ ...prev, [key]: value }));
  };

  const handleSpecificChange = (formatId, key, value) => {
    setSpecificData(prev => ({
      ...prev,
      [formatId]: { ...(prev[formatId] || {}), [key]: value }
    }));
  };

  const handleGenerate = async () => {
    if (!currentCaseId || !selectedRuta) return;
    setGenerating(true);
    try {
      // Merge general + specific data
      const mergedData = { ...generalData };
      for (const [fmtId, fields] of Object.entries(specificData)) {
        mergedData[fmtId] = fields;
      }

      const response = await axios.post('/api/generate-batch', {
        caso_id: currentCaseId,
        ruta: selectedRuta.id,
        datos: mergedData
      });
      setResults(response.data.results);
      
      const successResults = response.data.results.filter(r => r.status === 'success');
      if (successResults.length > 0) {
        if (addToast) addToast(`✅ Expediente generado: ${successResults.length} documentos listos.`);
        if (onPdfsGenerated) {
          const newPdfs = successResults.map(r => ({ name: r.name, url: r.url }));
          onPdfsGenerated(newPdfs);
        }
      }
      
      const errorResults = response.data.results.filter(r => r.status === 'error');
      if (errorResults.length > 0 && addToast) {
        addToast(`⚠️ Hubo errores al generar ${errorResults.length} documentos.`, 'error');
      }
      
    } catch (err) {
      console.error("Error generating batch:", err);
      if (addToast) addToast("Error al conectar con el servidor.", "error");
    } finally {
      setGenerating(false);
      localStorage.removeItem(`draft_${currentCaseId}`); // Limpiar borrador al terminar
    }
  };

  if (!currentCaseId) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white bg-opacity-70 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 p-8 text-center">
        <ClipboardList size={48} className="text-emerald-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Modo Orden</h2>
        <p className="text-gray-400 text-sm max-w-xs">Selecciona o crea un caso en la pestaña de <strong>Casos</strong> para iniciar el proceso guiado.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white bg-opacity-70 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 overflow-hidden relative">
      {generating && <LoadingOverlay title="Estructurando Expediente Legal" />}
      
      {/* Stepper */}
      <div className="bg-emerald-900 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                i < step ? 'bg-emerald-400 text-emerald-900' : i === step ? 'bg-white text-emerald-900' : 'bg-emerald-700 text-emerald-300'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs hidden lg:inline ${i === step ? 'text-white font-semibold' : 'text-emerald-300'}`}>{label}</span>
              {i < STEP_LABELS.length - 1 && <div className="w-4 lg:w-8 h-px bg-emerald-600 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {step === 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">¿Qué tipo de caso desea documentar?</h3>
            <p className="text-sm text-gray-500 mb-4">Seleccione el ámbito y luego la ruta legal correspondiente.</p>
            
            {/* Category Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
              <button
                onClick={() => setActiveCategory('convivencia')}
                className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeCategory === 'convivencia' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🛡️ Convivencia Escolar
              </button>
              <button
                onClick={() => setActiveCategory('academico')}
                className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeCategory === 'academico' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📚 Procesos Académicos
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {rutas.filter(r => r.categoria === activeCategory).map(ruta => (
                <button
                  key={ruta.id}
                  onClick={() => { 
                    setSelectedRuta(ruta); 
                    
                    let normaAplicable = ruta.articulos ? `Manual de Convivencia - ${ruta.articulos}` : '';
                    if (ruta.id.includes('tipo-i') && !ruta.id.includes('ii')) normaAplicable = "Ley 1620 de 2013 y Manual de Convivencia, " + ruta.articulos;
                    else if (ruta.id.includes('tipo-ii') && !ruta.id.includes('iii')) normaAplicable = "Ley 1620 de 2013 y Manual de Convivencia, " + ruta.articulos;
                    else if (ruta.id.includes('tipo-iii')) normaAplicable = "Ley 1620 de 2013, Código de Infancia y Adolescencia, y Manual de Convivencia, " + ruta.articulos;
                    else if (ruta.id.includes('falta')) normaAplicable = "Manual de Convivencia Institucional, " + ruta.articulos;
                    else if (ruta.id.includes('academica') || ruta.id.includes('promocion')) normaAplicable = "Sistema Institucional de Evaluación de Estudiantes (SIEE), " + ruta.articulos;
                    else if (ruta.id.includes('justicia')) normaAplicable = "Justicia Restaurativa Escolar y Manual de Convivencia, " + ruta.articulos;

                    setGeneralData(prev => ({
                      ...prev,
                      responsable: userProfile?.nombre || prev.responsable || '',
                      cargo: userProfile?.cargo || prev.cargo || '',
                      sede: userProfile?.sede || prev.sede || '',
                      norma: normaAplicable
                    }));
                    setStep(1); 
                  }}
                  className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                    selectedRuta?.id === ruta.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-800">{ruta.nombre}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${activeCategory === 'convivencia' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{ruta.total_formatos} docs</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{ruta.descripcion}</p>
                  
                  {/* Badges/Etiquetas */}
                  {ruta.etiquetas && ruta.etiquetas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2 mt-1">
                      {ruta.etiquetas.map((etiqueta, idx) => (
                        <span key={idx} className={`text-[10px] px-2 py-0.5 rounded border ${activeCategory === 'convivencia' ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                          {etiqueta}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">{ruta.articulos}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Datos Generales y Comunes del Caso</h3>
            <p className="text-sm text-gray-500 mb-4">
              Hemos agrupado la información repetitiva. Estos datos se compartirán automáticamente en los {selectedRuta?.total_formatos} formatos de la ruta <strong>{selectedRuta?.nombre}</strong>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...camposGenerales, ...sharedFields].map(campo => (
                <div key={campo.key} className={campo.key.includes('descripcion') || campo.key.includes('norma') || campo.key.includes('hechos') || campo.key.includes('actuaciones') ? "md:col-span-2" : ""}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{campo.label}</label>
                  {campo.key.includes('descripcion') || campo.key.includes('norma') || campo.key.includes('hechos') || campo.key.includes('actuaciones') ? (
                    <textarea
                      value={generalData[campo.key] || ''}
                      onChange={(e) => handleGeneralChange(campo.key, e.target.value)}
                      className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y min-h-[60px]"
                      placeholder={campo.label}
                      rows={2}
                    />
                  ) : (
                    <input
                      type="text"
                      value={generalData[campo.key] || ''}
                      onChange={(e) => handleGeneralChange(campo.key, e.target.value)}
                      className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder={campo.label}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && selectedRuta && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Datos Específicos por Formato</h3>
            <p className="text-sm text-gray-500 mb-4">Complete los campos particulares de cada documento.</p>
            <div className="space-y-4">
              {selectedRuta.formatos.map((fmt, idx) => (
                <details key={fmt.id} className="border border-gray-200 rounded-xl overflow-hidden" open={idx === 0}>
                  <summary className="px-4 py-3 bg-gray-50 cursor-pointer flex items-center gap-3 hover:bg-gray-100 transition-colors">
                    <FileText size={16} className="text-emerald-600" />
                    <span className="font-semibold text-sm text-gray-800">{idx + 1}. {fmt.titulo}</span>
                    <span className="text-xs text-gray-400 ml-auto">{fmt.codigo}</span>
                  </summary>
                  <div className="p-4 grid grid-cols-1 gap-3">
                    {(() => {
                      const uniqueFields = getUniqueFieldsForFormat(fmt);
                      if (uniqueFields.length === 0) {
                        return <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle2 size={16}/> Todos los campos requeridos para este formato ya fueron proporcionados en el paso anterior.</div>;
                      }
                      return uniqueFields.map(campo => (
                        <div key={campo.key}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">{campo.label}</label>
                          <textarea
                            value={specificData[fmt.id]?.[campo.key] || ''}
                            onChange={(e) => handleSpecificChange(fmt.id, campo.key, e.target.value)}
                            className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y min-h-[60px]"
                            placeholder={campo.label}
                            rows={2}
                          />
                        </div>
                      ));
                    })()}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Generar Expediente Completo</h3>
            <p className="text-sm text-gray-500 mb-4">
              Se generarán <strong>{selectedRuta?.total_formatos} documentos</strong> para la ruta <strong>{selectedRuta?.nombre}</strong>.
            </p>

            {!results && !generating && (
              <div className="text-center py-8">
                <Printer size={48} className="text-emerald-300 mx-auto mb-4" />
                <button
                  onClick={handleGenerate}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition-all text-lg"
                >
                  Generar Todos los Documentos
                </button>
              </div>
            )}

            {generating && (
              <div className="text-center py-8">
                <Loader2 size={48} className="text-emerald-500 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500 font-medium">Compilando documentos...</p>
              </div>
            )}

            {results && (
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
                    r.status === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
                  }`}>
                    {r.status === 'success' ? (
                      <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle size={20} className="text-red-500 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{r.name || r.id}</p>
                      {r.status === 'error' && <p className="text-xs text-red-500">{r.message}</p>}
                    </div>
                    {r.status === 'success' && r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-700 font-medium hover:underline">
                        Ver PDF
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="p-4 border-t border-gray-100 bg-white flex justify-between">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft size={16} /> Anterior
        </button>
        {step < 3 && (
          <button
            onClick={() => setStep(s => Math.min(3, s + 1))}
            disabled={step === 0 && !selectedRuta}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
