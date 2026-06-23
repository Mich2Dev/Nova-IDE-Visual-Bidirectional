import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import type { ChatMessage as ChatMessageType } from '../../store/useStore';
import { buildSystemPrompt } from '../../context/NovaContextEngine';
import { detectIntent } from '../../context/detectIntent';
import { getTokenBudgetForProvider } from '../../context/compressors/TokenBudget';
import { Bot, Send, Loader2 } from 'lucide-react';
import { checkOllamaHealth, chatWithOllama } from '../../lib/ollamaClient';
import { ChangeProposal, CodePreview } from './NovaProposal';

export const parseCodeBlocks = (text: string): { lang: string; code: string; filename?: string }[] => {
  const pattern = /```(\w+)?\n([\s\S]*?)```/gi;
  const blocks: { lang: string; code: string; filename?: string }[] = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const code = match[2].trim();
    const lang = match[1] || 'text';
    
    // Attempt 1: Check if there's a ### ARCHIVO: filename in the text before the block
    const textBefore = text.substring(0, match.index);
    const recentText = textBefore.slice(-150);
    const explicitMatch = recentText.match(/###\s*ARCHIVO:\s*([^\s]+)\s*$/i);
    
    // Attempt 2: Check for just a filename on the line immediately before the block (like "estilos.css")
    const looseMatch = recentText.match(/([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)\s*$/);
    
    // Attempt 3: Check first line of the code block for a comment (e.g. /* estilos.css */ or <!-- index.html -->)
    const firstLine = code.split('\n')[0];
    const commentMatch = firstLine.match(/^(?:\/\*|<!--|\/\/)\s*([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)\s*(?:\*\/|-->)?$/);

    const filename = (explicitMatch && explicitMatch[1]) 
      || (looseMatch && looseMatch[1]) 
      || (commentMatch && commentMatch[1]) 
      || undefined;

    blocks.push({
      filename,
      lang,
      code
    });
  }
  return blocks;
};

// Converts markdown **bold** and `code` to simple formatting
const formatText = (text: string) => {
  return text
    .replace(/(?:###\s*ARCHIVO:\s*[^\s]+\s*\n)?```[\s\S]*?```/gi, '') // remove code blocks
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:#1e293b;padding:1px 5px;border-radius:3px;font-size:11px;font-family:monospace">$1</code>')
    .trim();
};

// ─── Chat Message ────────────────────────────────────────────────────────────
const ChatMessageItem: React.FC<{ msg: ChatMessageType }> = ({ msg }) => {
  const blocks = msg.codeBlocks ?? parseCodeBlocks(msg.content);
  const textOnly = formatText(msg.content);
  const hasProposal = msg.role === 'nova' && blocks.length > 0;

  if (msg.role === 'system') {
    return (
      <div className="flex justify-center my-1">
        <span className="text-[10px] text-gray-600 italic bg-white/3 px-3 py-1 rounded-full">{msg.content}</span>
      </div>
    );
  }

  const isNova = msg.role === 'nova';

  return (
    <div className={`flex flex-col gap-1 ${isNova ? 'items-start' : 'items-end'}`}>
      {isNova && (
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Bot className="w-3 h-3 text-primary" />
          </div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Nova</span>
        </div>
      )}

      <div className={`max-w-full rounded-xl px-3 py-2.5 text-[12px] leading-relaxed
        ${isNova
          ? 'bg-[#1a1a24] border border-white/8 text-gray-200 mr-4'
          : 'bg-primary/20 border border-primary/25 text-gray-100 ml-4'}`
      }>
        {textOnly && (
          <p dangerouslySetInnerHTML={{ __html: textOnly }} />
        )}
        {hasProposal && <ChangeProposal msg={msg} blocks={blocks} />}
        {blocks.map((block, i) => (
          <CodePreview key={i} block={block} index={i} />
        ))}
      </div>
    </div>
  );
};

// ─── Chat Panel ─────────────────────────────────────────────────────────────
export const ChatPanel: React.FC = () => {
  const {
    messages, addMessage, isTyping, setIsTyping,
    tabs, activeTabId, fileTree, projectPath, ollamaModel,
    viewMode, viewportSize, previewServerUrl, terminalOutput,
  } = useStore();
  const [input, setInput] = useState('');
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [statusHint, setStatusHint] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ollamaUrl = import.meta.env.VITE_OLLAMA_URL || 'http://127.0.0.1:11434';

  useEffect(() => {
    const check = async () => {
      const health = await checkOllamaHealth(ollamaUrl);
      setOllamaStatus(health.ok ? 'online' : 'offline');
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [ollamaUrl, ollamaModel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');
    addMessage({ role: 'user', content: text });
    setIsTyping(true);
    setStatusHint('Preparando contexto...');

    const OLLAMA_URL = ollamaUrl;

    const historyForModel = [
      ...messages.filter((m) => m.role !== 'system'),
      { role: 'user' as const, content: text },
    ];

    try {
      const intent = detectIntent(text, viewMode);
      const contextPromise = buildSystemPrompt({
        intent,
        userMessage: text,
        projectPath,
        fileTree,
        tabs,
        activeTabId,
        viewMode,
        viewportSize,
        previewServerUrl,
        terminalOutput,
        tokenBudget: getTokenBudgetForProvider(),
      });
      const contextTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout preparando contexto (30s)')), 30000)
      );
      const { systemPrompt, screenshotBase64 } = await Promise.race([contextPromise, contextTimeout]);

      setStatusHint('Esperando respuesta de Nova...');
      let responseText = '';
      const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'auto';
      const useGemini = AI_PROVIDER === 'gemini' || (AI_PROVIDER === 'auto' && !!GEMINI_KEY);

      if (useGemini && GEMINI_KEY) {
        const contents = historyForModel.map((m, i) => {
          const isLastUser = m.role === 'user' && i === historyForModel.length - 1;
          const role = m.role === 'nova' ? 'model' : 'user';
          if (isLastUser && screenshotBase64 && (intent === 'visual_edit' || intent === 'redesign')) {
            const raw = screenshotBase64.replace(/^data:image\/\w+;base64,/, '');
            return {
              role,
              parts: [
                { text: m.content },
                { inlineData: { mimeType: 'image/jpeg', data: raw } },
              ],
            };
          }
          return { role, parts: [{ text: m.content }] };
        });

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        });
        if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
        const data = await res.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '(sin respuesta de gemini)';
      } else {
        const health = await checkOllamaHealth(OLLAMA_URL);
        if (!health.ok) throw new Error(health.error || 'Ollama no responde');
        if (health.models && !health.models.some((m) => m === ollamaModel || m.startsWith(`${ollamaModel}:`))) {
          throw new Error(`Modelo "${ollamaModel}" no encontrado. Instalado: ${health.models.slice(0, 5).join(', ') || 'ninguno'}`);
        }

        const ollamaMessages = [
          { role: 'system', content: systemPrompt },
          ...historyForModel.map((m, i) => {
            const isLastUser = m.role === 'user' && i === historyForModel.length - 1;
            if (isLastUser && screenshotBase64 && (intent === 'visual_edit' || intent === 'redesign')) {
              return {
                role: 'user',
                content: m.content,
                images: [screenshotBase64.replace(/^data:image\/\w+;base64,/, '')],
              };
            }
            return {
              role: m.role === 'nova' ? 'assistant' : 'user',
              content: m.content,
            };
          }),
        ];

        const result = await chatWithOllama({
          url: OLLAMA_URL,
          model: ollamaModel,
          messages: ollamaMessages,
        });
        if (!result.success) throw new Error(result.error || 'Error desconocido');
        responseText = result.content || '(sin respuesta de ollama)';
        setOllamaStatus('online');
      }

      if (!responseText.trim() || responseText === '(sin respuesta de ollama)') {
        throw new Error('Ollama devolvió respuesta vacía. Prueba un modelo más capaz o un mensaje más corto.');
      }

      const blocks = parseCodeBlocks(responseText);
      addMessage({
        role: 'nova',
        content: responseText,
        codeBlocks: blocks,
        proposalStatus: blocks.length > 0 ? 'pending' : undefined,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setOllamaStatus('offline');
      addMessage({
        role: 'system',
        content: `❌ Error con Ollama: ${msg}\n\nVerifica:\n1. Ollama está corriendo (ícono en bandeja)\n2. Modelo "${ollamaModel}" instalado → ollama pull ${ollamaModel}\n3. URL: ${OLLAMA_URL}`,
      });
    } finally {
      setIsTyping(false);
      setStatusHint('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0D0D13]">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2 shrink-0 bg-black/20">
        <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <p className="text-[12px] font-bold text-gray-200">Nova</p>
          <p className="text-[9px] text-gray-600 uppercase tracking-wider">{ollamaModel} · {ollamaStatus === 'online' ? 'conectado' : ollamaStatus === 'checking' ? 'verificando...' : 'desconectado'}</p>
        </div>
        <div className={`ml-auto w-2 h-2 rounded-full ${
          ollamaStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]' :
          ollamaStatus === 'checking' ? 'bg-amber-500 animate-pulse' :
          'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
        }`} title={ollamaStatus === 'online' ? 'Ollama conectado' : 'Ollama no responde'} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 custom-scrollbar min-h-0">
        {messages.map(msg => <ChatMessageItem key={msg.id} msg={msg} />)}
        {isTyping && (
          <div className="flex items-center gap-2 ml-1">
            <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Bot className="w-3 h-3 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
              {statusHint && <span className="text-[10px] text-gray-500">{statusHint}</span>}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/5 shrink-0 bg-black/20">
        <div className="flex items-center gap-2 bg-[#111118] border border-white/10 rounded-xl px-3 py-2 focus-within:border-primary/50 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Dile algo a Nova..."
            disabled={isTyping}
            className="flex-1 bg-transparent text-[12px] text-gray-200 placeholder-gray-600 outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={isTyping || !input.trim()}
            className={`p-1.5 rounded-lg transition-all ${
              !isTyping && input.trim()
                ? 'bg-primary text-white hover:bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                : 'text-gray-600 cursor-not-allowed'
            }`}
          >
            {isTyping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[9px] text-gray-700 mt-1.5 text-center">Enter para enviar · Acepta o rechaza los cambios propuestos</p>
      </div>
    </div>
  );
};
