import React, { useEffect } from 'react';
import { Box, Save, Terminal, Settings, Brain, Sparkle } from 'lucide-react';
import { useStore } from './store/useStore';
import { FileExplorer } from './components/layout/FileExplorer';
import { CentralArea } from './components/editor/CentralArea';
import { ChatPanel } from './components/chat/ChatPanel';
import { TerminalPanel } from './components/terminal/TerminalPanel';
import { BrainPanel } from './components/BrainPanel';
import { MemoryManager } from './brain/MemoryManager';

const nova = (window as any).novaAPI;

function App() {
  const {
    tabs, activeTabId, markTabClean,
    projectPath,
    toggleTerminal, terminalVisible,
    ollamaModel, setOllamaModel,
  } = useStore();

  const activeTab = tabs.find(t => t.path === activeTabId);

  const [rightTab, setRightTab] = React.useState<'chat' | 'brain'>('chat');
  const [memoryManager, setMemoryManager] = React.useState<MemoryManager | null>(null);

  // Initialize MemoryManager when project opens
  useEffect(() => {
    if (projectPath) {
      // Use a lightweight wrapper that works with path-based approach
      setMemoryManager(null); // Reset; MemoryManager needs refactor for IPC paths
    }
  }, [projectPath]);

  // Save file with Ctrl+S
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!activeTab) return;
        const result = await nova?.writeFile(activeTab.path, activeTab.content);
        if (result?.success) markTabClean(activeTab.path);
      }
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        toggleTerminal();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTab) {
          useStore.getState().closeTab(activeTab.path);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab]);

  const handleSave = async () => {
    if (!activeTab) return;
    await nova?.writeFile(activeTab.path, activeTab.content);
    markTabClean(activeTab.path);
  };

  const handleScaffold = async () => {
    if (!projectPath) {
      alert("Por favor, abre una carpeta de destino primero (Explorador -> Abrir Carpeta)");
      return;
    }
    const type = prompt("¿Qué proyecto deseas crear?\n1. React + Vite + TS\n2. Vanilla JS\nEscribe 1 o 2:");
    if (!type) return;

    if (!terminalVisible) toggleTerminal();
    
    if (type === '1') {
      window.novaAPI.spawnCommand('npx', ['-y', 'create-vite@latest', '.', '--template', 'react-ts'], projectPath);
    } else if (type === '2') {
      window.novaAPI.spawnCommand('npx', ['-y', 'create-vite@latest', '.', '--template', 'vanilla'], projectPath);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0D0D11] text-gray-300 overflow-hidden select-none font-sans">

      {/* ── TITLE BAR ─────────────────────────────────────────────────────── */}
      <div
        className="h-9 w-full bg-[#0A0A0E] border-b border-white/5 flex items-center shrink-0 z-50"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 shrink-0">
          <Box className="w-4 h-4 text-primary" />
          <span className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">Nova</span>
        </div>

        {/* Menu items (decorative + future) */}
        <div
          className="flex items-center h-full text-[11px] text-gray-500"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {['File', 'Edit', 'View', 'Run', 'Git'].map(menu => (
            <div key={menu} className="px-3 h-full flex items-center hover:bg-white/5 cursor-pointer transition-colors hover:text-gray-300">
              {menu}
            </div>
          ))}
        </div>

        {/* Center: file name */}
        <div className="flex-1 flex justify-center pointer-events-none">
          <span className="text-[11px] text-gray-600 font-mono">
            {activeTab
              ? `${projectPath?.split(/[\\/]/).pop() || ''} / ${activeTab.name}${activeTab.isDirty ? ' ●' : ''}`
              : 'Nova IDE'}
          </span>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-2 pr-[150px]"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={handleScaffold}
            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md transition-all bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <Sparkle className="w-3.5 h-3.5 text-indigo-400" />
            Nuevo Proyecto
          </button>
          <button
            onClick={handleSave}
            disabled={!activeTab?.isDirty}
            className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md transition-all
              ${activeTab?.isDirty
                ? 'bg-primary text-white hover:bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'bg-white/5 text-gray-600 cursor-not-allowed'}`}
          >
            <Save className="w-3.5 h-3.5" />
            Guardar
          </button>
          <button
            onClick={toggleTerminal}
            className={`flex items-center gap-1 text-[11px] px-2 py-1.5 rounded-md transition-all
              ${terminalVisible ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-600 hover:text-gray-300 hover:bg-white/5'}`}
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── MAIN BODY ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-[#0F0F15]">
        
        {/* LEFT: File Explorer */}
        <aside className="w-[280px] shrink-0 bg-[#0F0F15] flex flex-col overflow-hidden">
          <FileExplorer />
        </aside>

        {/* CENTER: Preview + Editor */}
        <main className="flex-1 min-w-0 flex flex-col bg-[#0A0A10] overflow-hidden border-x border-[#1A1A24] shadow-2xl relative z-10">
          <CentralArea />
          <TerminalPanel />
        </main>

        {/* RIGHT: Chat / Brain */}
        <aside className="w-[340px] shrink-0 bg-[#0D0D13] flex flex-col overflow-hidden">
          {/* Tab switcher */}
          <div className="flex bg-black/20 border-b border-white/5 shrink-0">
            <button
              onClick={() => setRightTab('chat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-all
                ${rightTab === 'chat' ? 'text-primary border-b-2 border-primary' : 'text-gray-600 hover:text-gray-400 hover:bg-white/3'}`}
            >
              <Box className="w-3 h-3" /> Nova
            </button>
            <button
              onClick={() => setRightTab('brain')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-all
                ${rightTab === 'brain' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-gray-600 hover:text-gray-400 hover:bg-white/3'}`}
            >
              <Brain className="w-3 h-3" /> Cerebro
            </button>
          </div>

          <div className="flex-1 overflow-hidden min-h-0">
            {rightTab === 'chat' ? <ChatPanel /> : <BrainPanel memoryManager={memoryManager} />}
          </div>

          {/* Model selector */}
          <div className="px-3 py-2 border-t border-white/5 bg-black/20 shrink-0 flex items-center gap-2">
            <Settings className="w-3 h-3 text-gray-600 shrink-0" />
            <input
              type="text"
              value={ollamaModel}
              onChange={e => setOllamaModel(e.target.value)}
              className="flex-1 bg-transparent text-[10px] text-gray-500 outline-none font-mono hover:text-gray-300 transition-colors"
              placeholder="Modelo Ollama (ej: llama3)"
              title="Modelo Ollama"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
