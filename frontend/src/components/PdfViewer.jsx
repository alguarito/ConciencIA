import React, { useState } from 'react';
import { FileText, X, Loader2, DownloadCloud } from 'lucide-react';

export default function PdfViewer({ pdfs, activePdfIndex, setActivePdfIndex, removePdf }) {
  const [loading, setLoading] = useState(true);

  if (!pdfs || pdfs.length === 0) {
    return (
      <div className="h-full bg-white dark:bg-slate-900 bg-opacity-70 dark:bg-opacity-90 backdrop-blur-md rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 transition-colors duration-300">
        <FileText size={56} className="mb-4 text-slate-300 dark:text-slate-700 opacity-30" />
        <h2 className="text-xl font-bold mb-2 text-slate-700 dark:text-slate-200">Visor de Documentos</h2>
        <p className="text-sm max-w-xs">Los formatos PDF generados automáticamente aparecerán aquí para su revisión y descarga.</p>
      </div>
    );
  }

  const activePdf = pdfs[activePdfIndex];

  return (
    <div className="h-full bg-white dark:bg-slate-900 bg-opacity-70 dark:bg-opacity-90 backdrop-blur-md rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden transition-colors duration-300">
      {/* Actions Bar */}
      <div className="bg-brand-primary/5 dark:bg-brand-primary/10 border-b border-brand-primary/10 p-2 flex justify-between items-center backdrop-blur-md">
        <span className="text-xs font-bold text-brand-primary dark:text-brand-accent ml-2 uppercase tracking-tight">Expediente Digital ({pdfs.length} docs)</span>
        <a 
          href={`/api/casos/${pdfs[0]?.url.split('/')[2]}/descargar-zip`} 
          download 
          className="flex items-center gap-2 bg-brand-primary hover:brightness-110 text-white text-[10px] font-black uppercase py-1.5 px-4 rounded-lg shadow-sm transition-all active:scale-95"
        >
          <DownloadCloud size={14} />
          Descargar Completo
        </a>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 custom-scrollbar">
        {pdfs.map((pdf, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 px-4 py-3 cursor-pointer border-r border-slate-200 dark:border-slate-700 min-w-max transition-all ${
              activePdfIndex === index
                ? 'bg-white dark:bg-slate-900 text-brand-primary dark:text-brand-accent border-b-4 border-b-brand-secondary font-bold shadow-inner'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            onClick={() => setActivePdfIndex(index)}
          >
            <FileText size={16} />
            <span className="text-sm truncate max-w-[150px]">{pdf.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removePdf(index);
              }}
              className="ml-2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Viewer */}
      <div className="flex-1 relative bg-slate-100 dark:bg-slate-950">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 z-10 backdrop-blur-sm">
            <Loader2 className="animate-spin text-brand-primary" size={32} />
          </div>
        )}
        <iframe
          src={`${activePdf.url}#toolbar=1&view=FitH`}
          className="w-full h-full border-none"
          title="PDF Viewer"
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
}
