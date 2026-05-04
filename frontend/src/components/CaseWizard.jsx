import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowRight, ArrowLeft, FileText, Users, ClipboardList, Printer, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const STEP_LABELS = ['Clasificar Caso', 'Datos Generales', 'Datos Específicos', 'Generar Expediente'];

export default function CaseWizard({ currentCaseId, userProfile }) {
  const [step, setStep] = useState(0);
  const [rutas, setRutas] = useState([]);
  const [camposGenerales, setCamposGenerales] = useState([]);
  const [selectedRuta, setSelectedRuta] = useState(null);
  const [generalData, setGeneralData] = useState({});
  const [specificData, setSpecificData] = useState({});
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState(null);

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
    } catch (err) {
      console.error("Error generating batch:", err);
    } finally {
      setGenerating(false);
    }
  };

  if (!currentCaseId) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white bg-opacity-70 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 p-8 text-center">
        <ClipboardList size={48} className="text-emerald-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Modo Orden</h2>
        <p className="text-gray-400 text-sm max-w-xs">Selecciona o crea un caso en el panel izquierdo para iniciar el proceso guiado.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white bg-opacity-70 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 overflow-hidden">
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
            <p className="text-sm text-gray-500 mb-4">Seleccione la ruta que corresponde según el Manual de Convivencia o SIEE.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rutas.map(ruta => (
                <button
                  key={ruta.id}
                  onClick={() => { 
                    setSelectedRuta(ruta); 
                    setGeneralData(prev => ({
                      ...prev,
                      responsable: userProfile?.nombre || prev.responsable || '',
                      cargo: userProfile?.cargo || prev.cargo || '',
                      sede: userProfile?.sede || prev.sede || ''
                    }));
                    setStep(1); 
                  }}
                  className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                    selectedRuta?.id === ruta.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-800">{ruta.nombre}</h4>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{ruta.total_formatos} docs</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{ruta.descripcion}</p>
                  <p className="text-xs text-indigo-600 font-medium">{ruta.articulos}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Datos Generales del Caso</h3>
            <p className="text-sm text-gray-500 mb-4">Estos datos se compartirán en todos los formatos de la ruta <strong>{selectedRuta?.nombre}</strong>.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {camposGenerales.map(campo => (
                <div key={campo.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{campo.label}</label>
                  <input
                    type="text"
                    value={generalData[campo.key] || ''}
                    onChange={(e) => handleGeneralChange(campo.key, e.target.value)}
                    className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder={campo.label}
                  />
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
                    {fmt.campos_especificos.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Este formato solo utiliza los datos generales.</p>
                    ) : (
                      fmt.campos_especificos.map(campo => (
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
                      ))
                    )}
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
