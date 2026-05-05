import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowRight, ArrowLeft, FileText, Users, ClipboardList, Printer, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import LoadingOverlay from './LoadingOverlay';
import DashboardHome from './DashboardHome';

const STEP_LABELS = ['Clasificar Caso', 'Datos Generales', 'Datos Específicos', 'Generar Expediente'];

const FIELD_HINTS = {
  // Generales
  lugar: 'Ej: Salón 301, Patio central, Rectoría',
  sede: 'Ej: Sede Principal, Sede San José',
  grado: 'Ej: 6°, 7°A, 10°B, 11°',
  grupo: 'Ej: A, B, 01',
  estudiante: 'Nombre completo del estudiante como aparece en matrícula',
  documento_estudiante: 'Ej: T.I. 1234567890',
  acudiente: 'Nombre completo del padre, madre o acudiente',
  documento_acudiente: 'Ej: C.C. 12345678',
  parentesco: 'Ej: Madre, Padre, Abuelo/a, Tío/a',
  telefono_acudiente: 'Ej: 3101234567',
  correo_acudiente: 'Ej: acudiente@email.com',
  responsable: 'Nombre del docente, coordinador o directivo a cargo',
  cargo: 'Ej: Coordinador de Convivencia, Docente, Rector(a)',
  // Hechos
  descripcion_hechos: 'Relate objetivamente qué sucedió, cuándo, dónde y quiénes estuvieron involucrados. No incluya juicios de valor.',
  norma: 'Ej: Manual de Convivencia Art. 37, Ley 1620 de 2013',
  evidencias: 'Ej: Fotos, testimonios escritos, pantallazos, anotaciones en observador',
  actuaciones_previas: 'Ej: Llamado de atención verbal el 15/03, citación a acudiente el 20/03',
  // Versión estudiante
  version_estudiante: 'Transcriba textualmente lo que el estudiante declaró sobre los hechos',
  preguntas: 'Ej: ¿Qué pasó desde tu punto de vista? ¿Cómo te sentiste?',
  // Orientación
  orientacion: 'Ej: Se le explicó al estudiante la importancia del respeto y la convivencia...',
  compromisos_estudiante: 'Ej: Me comprometo a respetar a mis compañeros y seguir las normas',
  compromisos_acudiente: 'Ej: Me comprometo a acompañar el proceso formativo y asistir a seguimientos',
  compromisos_institucion: 'Ej: La institución se compromete a realizar seguimiento quincenal',
  // Remisión y protección
  remision: 'Ej: Se remite por posible acoso escolar que requiere valoración psicosocial',
  valoracion_orientacion: 'Concepto profesional del Docente Orientador sobre el caso',
  medidas_proteccion: 'Ej: Separación inmediata de las partes, notificación a autoridades',
  // Restaurativa
  acciones_restaurativas: 'Ej: Carta de disculpa, servicio comunitario, mediación entre las partes',
  acuerdos: 'Ej: Las partes acuerdan resolver conflictos mediante diálogo',
  seguimiento: 'Ej: Revisión de acuerdos en 15 días, reunión de seguimiento el 30/04',
  // Decisiones
  decision: 'Ej: Se aplica matrícula en observación por el resto del año escolar',
  notificacion: 'Ej: Se notifica personalmente al acudiente el día 05/05/2026 a las 10:00 am',
  recurso: 'Ej: Se informa que cuenta con 5 días hábiles para recurso de reposición',
  // Académicos
  area_asignatura: 'Ej: Matemáticas, Ciencias Naturales, Lengua Castellana',
  docente_area: 'Nombre del docente de la asignatura',
  periodo: 'Ej: Primer periodo, Segundo periodo',
  valoracion_reportada: 'Ej: 2.5 (Bajo), 3.0 (Básico)',
  motivos_inconformidad: 'Ej: No se tuvo en cuenta la entrega del taller, el examen tenía temas no vistos',
  pretension: 'Ej: Solicito la revisión y corrección de la nota del segundo periodo',
  solicitud: 'Ej: Solicito la revisión del caso ante el Comité de Evaluación',
  respuesta: 'Ej: La institución responde que se revisó el caso y se mantiene/modifica la decisión',
  // Plan mejoramiento
  competencias: 'Ej: Resolución de ecuaciones lineales, comprensión lectora argumentativa',
  actividades: 'Ej: Taller escrito de 10 ejercicios, exposición oral, sustentación',
  criterios_evaluacion: 'Ej: Entrega puntual 20%, desarrollo correcto 50%, sustentación 30%',
  // Especiales
  resultado: 'Ej: Aprobado, No aprobado, En seguimiento',
  constancia: 'Ej: Se deja constancia de que el estudiante fue informado de sus derechos',
  observaciones: 'Cualquier información adicional relevante para el expediente',
  explicacion_proceso: 'Explique cómo se garantizó el derecho a la defensa, presunción de inocencia y debido proceso',
};

const getHint = (key) => FIELD_HINTS[key] || '';

export default function CaseWizard({ currentCaseId, userProfile, addToast, onPdfsGenerated, casos, onCreateCase }) {
  const [step, setStep] = useState(0);
  const [rutas, setRutas] = useState([]);
  const [camposGenerales, setCamposGenerales] = useState([]);
  const [selectedRuta, setSelectedRuta] = useState(null);
  const [generalData, setGeneralData] = useState({});
  const [specificData, setSpecificData] = useState({});
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState(null);
  const [activeCategory, setActiveCategory] = useState('convivencia');

  // Autocompletado de estudiantes
  const [studentsDb, setStudentsDb] = useState({});
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const db = localStorage.getItem('smj_students_db');
    if (db) {
      try { setStudentsDb(JSON.parse(db)); } catch (e) {}
    }
  }, []);

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
        // Guardar estudiante en la base de datos local
        if (generalData.estudiante) {
          const newDb = { ...studentsDb };
          newDb[generalData.estudiante] = {
            documento_estudiante: generalData.documento_estudiante || '',
            grado: generalData.grado || '',
            jornada: generalData.jornada || ''
          };
          localStorage.setItem('smj_students_db', JSON.stringify(newDb));
          setStudentsDb(newDb);
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

  // --- Validación y Progreso ---
  const isFieldFilled = (key) => {
    if (generalData[key] && generalData[key].trim() !== '') return true;
    for (const fmtId in specificData) {
      if (specificData[fmtId] && specificData[fmtId][key] && specificData[fmtId][key].trim() !== '') return true;
    }
    return false;
  };

  const isFieldRequiredAndMissing = (key) => {
    let isRequired = false;
    if (camposGenerales.some(c => c.key === key) || sharedFields.some(c => c.key === key)) {
      isRequired = true;
    } else if (selectedRuta) {
      for (const fmt of selectedRuta.formatos) {
        if (getUniqueFieldsForFormat(fmt).some(c => c.key === key)) {
          isRequired = true;
          break;
        }
      }
    }
    if (!isRequired) return false;
    return !isFieldFilled(key);
  };

  const missingCriticalFields = ['estudiante', 'descripcion_hechos', 'fecha'].filter(isFieldRequiredAndMissing);
  const canGenerate = missingCriticalFields.length === 0;

  let totalFieldsCount = 0;
  let filledFieldsCount = 0;

  if (selectedRuta) {
    const allExpectedKeys = new Set([
      ...camposGenerales.map(c => c.key),
      ...sharedFields.map(c => c.key)
    ]);
    
    selectedRuta.formatos.forEach(fmt => {
      getUniqueFieldsForFormat(fmt).forEach(c => allExpectedKeys.add(c.key));
    });

    totalFieldsCount = allExpectedKeys.size;
    allExpectedKeys.forEach(key => {
      if (isFieldFilled(key)) filledFieldsCount++;
    });
  }
  const progressPercentage = totalFieldsCount > 0 ? Math.round((filledFieldsCount / totalFieldsCount) * 100) : 0;

  if (!currentCaseId) {
    return <DashboardHome casos={casos || []} rutas={rutas} onCreateCase={onCreateCase} addToast={addToast} />;
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 bg-opacity-70 dark:bg-opacity-90 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 overflow-hidden relative transition-colors duration-300">
      {generating && <LoadingOverlay title="Estructurando Expediente Legal" />}
      
      {/* ProgressBar (Top) */}
      {selectedRuta && step > 0 && step < 3 && (
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 absolute top-0 left-0 z-20">
          <div 
            className="bg-brand-secondary h-1.5 transition-all duration-500 ease-out shadow-[0_0_8px_var(--brand-secondary)]" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      )}
      
      {/* Stepper */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-primary/80 text-white px-4 py-3 border-b border-white/10 shadow-md relative z-10">
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                i < step ? 'bg-brand-secondary text-white shadow-lg' : i === step ? 'bg-white text-brand-primary ring-2 ring-brand-secondary ring-offset-2 ring-offset-brand-primary' : 'bg-white/10 text-white/50 border border-white/20'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] uppercase tracking-widest hidden lg:inline ${i === step ? 'text-white font-black' : i < step ? 'text-white/90' : 'text-white/40'}`}>{label}</span>
              {i < STEP_LABELS.length - 1 && <div className={`w-4 lg:w-8 h-0.5 mx-1 rounded-full ${i < step ? 'bg-brand-secondary' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {step === 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Catálogo de Procedimientos</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Seleccione la ruta legal o disciplinaria que mejor se adapte a los hechos.</p>
            
            {/* Category Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl mb-4 transition-colors border border-slate-200/50 dark:border-slate-700/50">
              <button
                onClick={() => setActiveCategory('convivencia')}
                className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeCategory === 'convivencia' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-amber-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                🛡️ Convivencia Escolar
              </button>
              <button
                onClick={() => setActiveCategory('academico')}
                className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeCategory === 'academico' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
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
                    selectedRuta?.id === ruta.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-500' : 'border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 dark:bg-slate-800/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200">{ruta.nombre}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${activeCategory === 'convivencia' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'}`}>{ruta.total_formatos} docs</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{ruta.descripcion}</p>
                  
                  {/* Badges/Etiquetas */}
                  {ruta.etiquetas && ruta.etiquetas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2 mt-1">
                      {ruta.etiquetas.map((etiqueta, idx) => (
                        <span key={idx} className={`text-[10px] px-2 py-0.5 rounded border ${activeCategory === 'convivencia' ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-800/50 text-orange-700 dark:text-orange-400' : 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400'}`}>
                          {etiqueta}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-1 uppercase tracking-wider">{ruta.articulos}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Datos Generales y Comunes del Caso</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Hemos agrupado la información repetitiva. Estos datos se compartirán automáticamente en los {selectedRuta?.total_formatos} formatos de la ruta <strong>{selectedRuta?.nombre}</strong>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...camposGenerales, ...sharedFields].map(campo => {
                const isCritical = ['estudiante', 'descripcion_hechos', 'fecha'].includes(campo.key);
                return (
                <div key={campo.key} className={campo.key.includes('descripcion') || campo.key.includes('norma') || campo.key.includes('hechos') || campo.key.includes('actuaciones') ? "md:col-span-2" : ""}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {campo.label} {isCritical && <span className="text-red-500">*</span>}
                  </label>
                  {campo.key.includes('descripcion') || campo.key.includes('norma') || campo.key.includes('hechos') || campo.key.includes('actuaciones') ? (
                    <textarea
                      value={generalData[campo.key] || ''}
                      onChange={(e) => handleGeneralChange(campo.key, e.target.value)}
                      className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y min-h-[60px]"
                      placeholder={getHint(campo.key) || campo.label}
                      rows={2}
                    />
                  ) : campo.key === 'jornada' ? (
                    <select
                      value={generalData[campo.key] || ''}
                      onChange={(e) => handleGeneralChange(campo.key, e.target.value)}
                      className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Seleccione jornada...</option>
                      <option value="Mañana">Mañana</option>
                      <option value="Tarde">Tarde</option>
                    </select>
                  ) : campo.key === 'estudiante' ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={generalData[campo.key] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleGeneralChange(campo.key, val);
                          if (val.length > 1) {
                            const matches = Object.keys(studentsDb).filter(name => name.toLowerCase().includes(val.toLowerCase()));
                            setStudentSuggestions(matches);
                            setShowSuggestions(matches.length > 0);
                          } else {
                            setShowSuggestions(false);
                          }
                        }}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={getHint(campo.key) || campo.label}
                      />
                      {showSuggestions && (
                        <div className="absolute z-30 w-full mt-1 bg-white border border-emerald-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                          {studentSuggestions.map(name => (
                            <button
                              key={name}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 text-gray-800 border-b border-gray-50 last:border-0"
                              onClick={() => {
                                const st = studentsDb[name];
                                setGeneralData(prev => ({
                                  ...prev,
                                  estudiante: name,
                                  documento_estudiante: st.documento_estudiante || prev.documento_estudiante || '',
                                  grado: st.grado || prev.grado || '',
                                  jornada: st.jornada || prev.jornada || ''
                                }));
                                setShowSuggestions(false);
                                if (addToast) addToast(`Datos de ${name} autocompletados.`, 'success');
                              }}
                            >
                              <div className="font-medium">{name}</div>
                              <div className="text-[10px] text-emerald-600">Grado: {studentsDb[name].grado} | Doc: {studentsDb[name].documento_estudiante}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type={campo.key.includes('fecha') ? 'date' : campo.key.includes('hora') ? 'time' : (campo.key.includes('documento') || campo.key.includes('telefono')) ? 'tel' : 'text'}
                      value={generalData[campo.key] || ''}
                      onChange={(e) => handleGeneralChange(campo.key, e.target.value)}
                      className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder={getHint(campo.key) || campo.label}
                    />
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && selectedRuta && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Datos Específicos por Formato</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Complete los campos particulares de cada documento.</p>
            <div className="space-y-4">
              {selectedRuta.formatos.map((fmt, idx) => (
                <details key={fmt.id} className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden" open={idx === 0}>
                  <summary className="px-4 py-3 bg-gray-50 dark:bg-slate-800 cursor-pointer flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-slate-700/80 transition-colors">
                    <FileText size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{idx + 1}. {fmt.titulo}</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto">{fmt.codigo}</span>
                  </summary>
                  <div className="p-4 grid grid-cols-1 gap-3 dark:bg-slate-900/50">
                    {(() => {
                      const uniqueFields = getUniqueFieldsForFormat(fmt);
                      if (uniqueFields.length === 0) {
                        return <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle2 size={16}/> Todos los campos requeridos para este formato ya fueron proporcionados en el paso anterior.</div>;
                      }
                      return uniqueFields.map(campo => {
                        const isCritical = ['estudiante', 'descripcion_hechos', 'fecha'].includes(campo.key);
                        return (
                        <div key={campo.key}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {campo.label} {isCritical && <span className="text-red-500">*</span>}
                          </label>
                          {campo.key.includes('fecha') || campo.key.includes('hora') || campo.key.includes('documento') || campo.key.includes('telefono') ? (
                            <input
                              type={campo.key.includes('fecha') ? 'date' : campo.key.includes('hora') ? 'time' : 'tel'}
                              value={specificData[fmt.id]?.[campo.key] || ''}
                              onChange={(e) => handleSpecificChange(fmt.id, campo.key, e.target.value)}
                              className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                              placeholder={getHint(campo.key) || campo.label}
                            />
                          ) : campo.key === 'jornada' ? (
                            <select
                              value={specificData[fmt.id]?.[campo.key] || ''}
                              onChange={(e) => handleSpecificChange(fmt.id, campo.key, e.target.value)}
                              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            >
                              <option value="">Seleccione jornada...</option>
                              <option value="Mañana">Mañana</option>
                              <option value="Tarde">Tarde</option>
                            </select>
                          ) : (
                            <textarea
                              value={specificData[fmt.id]?.[campo.key] || ''}
                              onChange={(e) => handleSpecificChange(fmt.id, campo.key, e.target.value)}
                              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-y min-h-[60px]"
                              placeholder={getHint(campo.key) || campo.label}
                              rows={2}
                            />
                          )}
                        </div>
                        );
                      });
                    })()}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Generar Expediente Completo</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Se generarán <strong>{selectedRuta?.total_formatos} documentos</strong> para la ruta <strong>{selectedRuta?.nombre}</strong>.
            </p>

            {!results && !generating && (
              <div className="text-center py-8">
                <Printer size={56} className="text-brand-primary mx-auto mb-4 opacity-50" />
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className={`${canGenerate ? 'bg-gradient-to-r from-brand-primary to-brand-primary/80 hover:brightness-110 text-white shadow-xl hover:shadow-2xl ring-2 ring-transparent hover:ring-brand-secondary/50' : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'} font-black px-10 py-4 rounded-2xl transition-all text-xl mb-2 uppercase tracking-tighter`}
                >
                  Generar Expediente Completo
                </button>
                {!canGenerate && (
                  <p className="text-sm text-amber-600 dark:text-amber-500 font-semibold">Faltan campos obligatorios: {missingCriticalFields.join(', ')}</p>
                )}
              </div>
            )}

            {generating && (
              <div className="text-center py-12">
                <Loader2 size={56} className="text-brand-secondary mx-auto mb-4 animate-spin drop-shadow-md" />
                <p className="text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest text-sm">Estructurando protocolos legales...</p>
              </div>
            )}

            {results && (
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border shadow-sm transition-all ${
                    r.status === 'success' ? 'border-brand-primary/20 bg-brand-primary/5' : 'border-brand-secondary/20 bg-brand-secondary/5'
                  }`}>
                    {r.status === 'success' ? (
                      <CheckCircle2 size={20} className="text-brand-primary shrink-0" />
                    ) : (
                      <AlertCircle size={20} className="text-brand-secondary shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{r.name || r.id}</p>
                      {r.status === 'error' && <p className="text-xs text-brand-secondary/80 font-medium">{r.message}</p>}
                    </div>
                    {r.status === 'success' && r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-brand-primary font-black hover:underline bg-white dark:bg-slate-900 px-3 py-2 rounded-lg shadow-sm border border-brand-primary/10">
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
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex justify-between z-10 relative">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft size={16} /> Anterior
        </button>
        {step < 3 && (
          <button
            onClick={() => setStep(s => Math.min(3, s + 1))}
            disabled={step === 0 && !selectedRuta}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-brand-primary text-white rounded-lg hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md ring-2 ring-transparent hover:ring-brand-secondary/30"
          >
            Siguiente <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
