import React, { useState } from 'react';
import { FileText, X, Loader2, DownloadCloud } from 'lucide-react';

export default function PdfViewer({ pdfs, activePdfIndex, setActivePdfIndex, removePdf }) {
  const [loading, setLoading] = useState(true);

  if (!pdfs || pdfs.length === 0) {
    return (
      <div className="h-full bg-white dark:bg-slate-900 bg-opacity-70 dark:bg-opacity-90 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 transition-colors duration-300">
        <FileText size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
        <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">Visor de Documentos</h2>
        <p className="text-sm">Los formatos PDF generados por el asesor aparecerán aquí.</p>
      </div>
    );
  }

  const activePdf = pdfs[activePdfIndex];

  return (
    <div className="h-full bg-white dark:bg-slate-900 bg-opacity-70 dark:bg-opacity-90 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden transition-colors duration-300">
      {/* Actions Bar */}
      <div className="bg-indigo-50 dark:bg-indigo-950/50 border-b border-indigo-100 dark:border-indigo-900/50 p-2 flex justify-between items-center">
        <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 ml-2">Expediente Actual ({pdfs.length} docs)</span>
        <a 
          href={`/api/casos/${pdfs[0]?.url.split('/')[2]}/descargar-zip`} 
          download 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow-sm transition-colors"
        >
          <DownloadCloud size={14} />
          Descargar ZIP
        </a>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 custom-scrollbar">
        {pdfs.map((pdf, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 px-4 py-3 cursor-pointer border-r border-gray-200 dark:border-slate-700 min-w-max transition-colors ${
              activePdfIndex === index
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 border-b-2 border-b-indigo-600 dark:border-b-indigo-500 font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
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
              className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Viewer */}
      <div className="flex-1 relative bg-gray-100">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
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
