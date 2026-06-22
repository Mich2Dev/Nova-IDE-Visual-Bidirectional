import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import type { ChatMessage as ChatMessageType } from '../../store/useStore';
import { Bot, Send, Loader2, Copy, Check, ChevronDown, Zap } from 'lucide-react';

const nova = (window as any).novaAPI;

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

// ─── Code Block Component ────────────────────────────────────────────────────
const CodeBlock: React.FC<{
  lang: string;
  code: string;
  filename?: string;
  msgId: string;
  applied?: boolean;
}> = ({ lang, code, filename, msgId, applied }) => {
  const { tabs, activeTabId, setTabContent, markCodeApplied, projectPath } = useStore();
  const [copied, setCopied] = useState(false);
  const activeTab = tabs.find(t => t.path === activeTabId);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const apply = async () => {
    let targetPath = activeTabId;
    let finalFilename = filename;

    if (!finalFilename) {
      if (projectPath) {
        // Sugerir extensión basada en el lenguaje
        const ext = lang === 'html' ? 'html' : lang === 'css' ? 'css' : lang === 'javascript' || lang === 'js' ? 'js' : 'txt';
        finalFilename = `codigo_${Date.now()}.${ext}`;
        alert(`Nova no especificó nombre. El archivo se auto-creará como: ${finalFilename}`);
        targetPath = `${projectPath}/${finalFilename}`.replace(/\\/g, '/').replace(/\/\//g, '/');
      } else if (!activeTabId) {
        alert('Abre un proyecto o archivo primero para poder aplicar código.');
        return;
      }
    } else if (projectPath) {
      targetPath = `${projectPath}/${finalFilename}`.replace(/\\/g, '/').replace(/\/\//g, '/');
    }

    if (!targetPath) return;

    const result = await nova.writeFile(targetPath, code);
    if (result?.success) {
      if (activeTabId === targetPath || tabs.some(t => t.path === targetPath)) {
         setTabContent(targetPath, code);
      }
      if (finalFilename && projectPath) window.dispatchEvent(new Event('nova-refresh-file-tree'));
      markCodeApplied(msgId);
    } else {
      alert(`Error al aplicar: ${result?.error}`);
    }
  };

  const displayName = filename || activeTab?.name || 'archivo';

  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
      {/* Code block header */}
      <div className="flex items-center justify-between bg-[#0f172a] px-3 py-1.5">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">{lang}</span>
          {filename && <span className="text-[9px] text-gray-500 font-mono">{filename}</span>}
        </div>
        <div className="flex gap-1.5">
          <button onClick={copy} className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors px-2 py-0.5 rounded hover:bg-white/5">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          <button
            onClick={apply}
            disabled={applied}
            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-all font-medium
              ${applied
                ? 'text-emerald-400 bg-emerald-500/10 cursor-default'
                : 'text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/40 cursor-pointer'}`}
          >
            {applied ? <Check className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
            {applied ? 'Aplicado' : `Crear/Aplicar a ${displayName}`}
          </button>
        </div>
      </div>
      {/* Code */}
      <pre className="bg-[#0D1117] p-3 overflow-x-auto text-[11px] leading-relaxed font-mono text-gray-300 max-h-64">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// ─── Chat Message ────────────────────────────────────────────────────────────
const ChatMessageItem: React.FC<{ msg: ChatMessageType }> = ({ msg }) => {
  const codeBlocks = parseCodeBlocks(msg.content);
  const textOnly = formatText(msg.content);

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
        {codeBlocks.map((block, i) => (
          <CodeBlock key={i} lang={block.lang} code={block.code} filename={block.filename} msgId={msg.id} applied={msg.applied} />
        ))}
      </div>
    </div>
  );
};

// ─── Build Ollama context ────────────────────────────────────────────────────
const formatFileTree = (nodes: any[], prefix = ''): string => {
  let result = '';
  for (const node of nodes) {
    if (node.kind === 'directory') {
      result += `${prefix}📁 ${node.name}/\n`;
      if (node.children) {
        result += formatFileTree(node.children, prefix + '  ');
      }
    } else {
      result += `${prefix}📄 ${node.name}\n`;
    }
  }
  return result;
};

const buildSystemPrompt = (
  tabs: any[],
  activeTabId: string | null,
  projectPath: string | null,
  fileTree: any[],
  visualState: string | null
) => {
  const projectName = projectPath ? projectPath.split(/[\\/]/).pop() : 'sin proyecto';
  const activeTab = tabs.find(t => t.path === activeTabId);
  const openTabsContext = tabs.map(t => `${t.name} (${t.path})`).join(', ') || 'ninguna';
  
  return `Eres Nova, una IA especializada en desarrollo web frontend y backend que actúa como copiloto de ${projectName}.

CAPACIDADES:
- Eres capaz de crear sistemas completos. Genera TODOS los archivos necesarios.
- IMPORTANTE: Para que yo pueda crear el archivo automáticamente, DEBES usar el siguiente formato estricto:

### ARCHIVO: nombre_del_archivo.ext
\`\`\`lenguaje
[código completo aquí]
\`\`\`

- REGLA: Siempre incluye la cabecera "### ARCHIVO: <nombre>" antes del bloque de código.
- Usa la ruta correcta si creas archivos dentro de subcarpetas (ej. src/utils.js).
- Cuando modificas algo, devuelve el archivo COMPLETO modificado, no fragmentos.
- Sé directo y no des explicaciones largas. Solo genera los archivos.

ESTADO ACTUAL DEL PROYECTO:
- Proyecto: ${projectName}
- Pestañas abiertas: ${openTabsContext}
- Archivo activo: ${activeTab ? activeTab.name : 'ninguno'}

ÁRBOL DE ARCHIVOS:
${formatFileTree(fileTree) || 'El proyecto está vacío o no hay carpeta abierta.'}

${visualState ? `
ESTADO DEL EDITOR VISUAL (DISEÑO):
El usuario está usando el editor visual drag & drop (Craft.js). Aquí está el árbol JSON actual de la interfaz:
\`\`\`json
${visualState.substring(0, 8000)}${visualState.length > 8000 ? '\n... (truncado)' : ''}
\`\`\`
¡Entiende esta estructura para sugerir cambios visuales o responder preguntas sobre la UI!
` : ''}

${activeTab ? `
CONTENIDO DEL ARCHIVO ACTIVO (${activeTab.name}):
\`\`\`${activeTab.language}
${activeTab.content.substring(0, 8000)}${activeTab.content.length > 8000 ? '\n... (truncado)' : ''}
\`\`\`` : ''}`;
};

// ─── Chat Panel ─────────────────────────────────────────────────────────────
export const ChatPanel: React.FC = () => {
  const {
    messages, addMessage, isTyping, setIsTyping,
    tabs, activeTabId, fileTree, projectPath, ollamaModel, visualState
  } = useStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');
    addMessage({ role: 'user', content: text });
    setIsTyping(true);

    try {
      const systemPrompt = buildSystemPrompt(tabs, activeTabId, projectPath, fileTree, visualState);

      let responseText = '';
      const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

      if (GEMINI_KEY) {
        // Usa Gemini si hay llave
        const contents = messages
          .filter(m => m.role !== 'system')
          .map(m => ({
            role: m.role === 'nova' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }));

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
        // Fallback a Ollama local
        const ollamaMessages = [
          { role: 'system', content: systemPrompt },
          ...messages
            .filter(m => m.role !== 'system')
            .map(m => ({ role: m.role === 'nova' ? 'assistant' : 'user', content: m.content })),
          { role: 'user', content: text },
        ];

        const res = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel,
            messages: ollamaMessages,
            stream: false,
          }),
        });
        if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
        const data = await res.json();
        responseText = data.message?.content || '(sin respuesta de ollama)';
      }

      addMessage({
        role: 'nova',
        content: responseText,
        codeBlocks: parseCodeBlocks(responseText),
      });
    } catch (err: any) {
      addMessage({
        role: 'system',
        content: `❌ Error conectando a Ollama: ${err.message}. ¿Está Ollama corriendo? Ejecuta: ollama run ${ollamaModel}`,
      });
    } finally {
      setIsTyping(false);
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
          <p className="text-[9px] text-gray-600 uppercase tracking-wider">{ollamaModel} · local</p>
        </div>
        <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]" title="Ollama conectado" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 custom-scrollbar min-h-0">
        {messages.map(msg => <ChatMessageItem key={msg.id} msg={msg} />)}
        {isTyping && (
          <div className="flex items-center gap-2 ml-1">
            <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Bot className="w-3 h-3 text-primary" />
            </div>
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:300ms]" />
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
        <p className="text-[9px] text-gray-700 mt-1.5 text-center">Enter para enviar · Nova edita archivos reales</p>
      </div>
    </div>
  );
};
