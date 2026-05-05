import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, Bot, User } from 'lucide-react';
import axios from 'axios';

const WELCOME_MSG = { role: 'assistant', content: '¡Hola! Soy tu asistente de Debido Proceso. Para comenzar rápidamente y ahorrarte tiempo, indícame por favor:\n\n1. Nombre y grado del estudiante involucrado.\n2. Qué sucedió exactamente (descripción de los hechos).\n3. Fecha y lugar del incidente.' };

export default function ChatPanel({ apiKeys, casoId, loadedMessages, onUpdateSteps, onGenerateFormat }) {
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSend(e);
      }
    }
  };

  // React to case changes
  useEffect(() => {
    if (loadedMessages === null) {
      // No case selected
      setMessages([WELCOME_MSG]);
    } else if (loadedMessages.length === 0) {
      // New case with no history
      setMessages([WELCOME_MSG]);
    } else {
      // Existing case with history
      setMessages(loadedMessages);
    }
    setInput('');
  }, [casoId, loadedMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const parseResponse = (text) => {
    let cleanText = text;
    
    // Parse Plan de Accion
    const planRegex = /<PLAN_ACCION>([\s\S]*?)<\/PLAN_ACCION>/;
    const planMatch = text.match(planRegex);
    if (planMatch) {
      cleanText = cleanText.replace(planRegex, '').trim();
      const planContent = planMatch[1];
      const steps = [];
      const lines = planContent.split('\n');
      for (const line of lines) {
        const stepMatch = line.match(/- \[(x| )\] (.*?): (.*)/);
        if (stepMatch) {
          steps.push({
            completed: stepMatch[1] === 'x',
            name: stepMatch[2].trim(),
            description: stepMatch[3].trim()
          });
        }
      }
      if (steps.length > 0) {
        onUpdateSteps(steps);
      }
    }

    // Parse Formatos
    const formatoRegex = /<GENERAR_FORMATO:\s*([^>]+)>([\s\S]*?)<\/GENERAR_FORMATO>/g;
    let formatMatch;
    while ((formatMatch = formatoRegex.exec(text)) !== null) {
      const formatoName = formatMatch[1].trim();
      const jsonContent = formatMatch[2].trim();
      let parsedData = {};
      
      if (jsonContent) {
        try {
          parsedData = JSON.parse(jsonContent);
        } catch (e) {
          console.error("Error parsing format JSON:", e, jsonContent);
        }
      }
      
      cleanText = cleanText.replace(formatMatch[0], '').trim();
      onGenerateFormat(formatoName, parsedData);
    }
    
    // Fallback original tag without closing tag (just in case model makes mistake)
    const fallbackRegex = /<GENERAR_FORMATO:\s*([^>]+)>(?!\s*\{)/g;
    let fallbackMatch;
    while ((fallbackMatch = fallbackRegex.exec(cleanText)) !== null) {
      const formatoName = fallbackMatch[1].trim();
      cleanText = cleanText.replace(fallbackMatch[0], '').trim();
      onGenerateFormat(formatoName, {});
    }

    return cleanText;
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        caso_id: casoId,
        messages: newMessages,
        api_key: apiKeys?.primary || undefined,
        api_key_fallback: apiKeys?.fallback || undefined
      });

      const rawContent = response.data.content;
      const cleanContent = parseResponse(rawContent);

      setMessages([...newMessages, { role: 'assistant', content: cleanContent }]);
    } catch (error) {
      console.error('Error in chat:', error);
      
      let errorMsg = 'Lo siento, ha ocurrido un error al comunicarme con el servidor. Verifica que el backend esté encendido y tengas una API Key configurada.';
      if (error.response && error.response.data && error.response.data.detail) {
        errorMsg = `Error del servidor: ${error.response.data.detail}`;
      }
      
      setMessages([...newMessages, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!casoId) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 bg-opacity-70 dark:bg-opacity-90 backdrop-blur-md rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 p-8 text-center transition-colors duration-300">
        <Bot size={56} className="text-brand-primary opacity-20 mb-4" />
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Asesor de Debido Proceso</h2>
        <p className="text-slate-400 dark:text-slate-500 text-sm max-w-xs">Selecciona un caso existente o crea uno nuevo en el panel izquierdo para comenzar la asesoría institucional.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 bg-opacity-70 dark:bg-opacity-90 backdrop-blur-md rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
      <div className="bg-brand-primary dark:bg-brand-primary/80 text-white p-4 flex items-center gap-3 border-b border-white/10 shadow-md relative z-10">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
          <Bot size={24} />
        </div>
        <div>
          <h2 className="font-bold text-lg tracking-tight">Asesor ConciencIA</h2>
          <p className="text-white/70 text-[10px] uppercase font-bold tracking-widest">Protocolos Institucionales</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-slate-200 dark:bg-slate-800 text-slate-700'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-brand-primary text-white rounded-tr-none shadow-md' : 'bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm border border-slate-200/50 dark:border-slate-700/50'}`}>
              <div className={`prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-semibold ${msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert'}`}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center flex-shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
              <Loader2 className="animate-spin text-gray-500 dark:text-gray-400" size={20} />
              <span className="text-gray-500 dark:text-gray-400 text-sm">Analizando caso...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-50/50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe aquí el caso o solicita un formato..."
            rows={1}
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white dark:focus:bg-slate-900 dark:text-white transition-all shadow-sm resize-none overflow-y-auto min-h-[48px] max-h-[160px]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-brand-primary text-white rounded-xl px-4 h-[48px] hover:brightness-110 active:scale-95 focus:ring-4 focus:ring-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center flex-shrink-0 shadow-md"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
