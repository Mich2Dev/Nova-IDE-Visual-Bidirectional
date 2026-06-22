import { create } from 'zustand';

export type FileNode = {
  name: string;
  kind: 'file' | 'directory';
  path: string;
  children?: FileNode[];
  isOpen?: boolean;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'nova' | 'system';
  content: string;
  timestamp: number;
  codeBlocks?: { lang: string; code: string; filename?: string }[];
  applied?: boolean;
};

export type ViewMode = 'preview' | 'split' | 'code' | 'visual';
export type ViewportSize = 375 | 768 | 1440 | 0; // 0 = libre

export type TabNode = {
  path: string;
  name: string;
  content: string;
  language: 'html' | 'css' | 'js' | 'ts' | 'json' | 'text';
  isDirty: boolean;
};

interface NovaStore {
  // Project
  projectPath: string | null;
  fileTree: FileNode[];
  setProject: (path: string, tree: FileNode[]) => void;
  setFileTree: (tree: FileNode[]) => void;

  // Tabs
  tabs: TabNode[];
  activeTabId: string | null;
  openTab: (path: string, name: string, content: string) => void;
  closeTab: (path: string) => void;
  setActiveTab: (path: string) => void;
  setTabContent: (path: string, content: string) => void;
  markTabClean: (path: string) => void;

  // Preview
  previewServerUrl: string | null;
  setPreviewServerUrl: (url: string | null) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  viewportSize: ViewportSize;
  setViewportSize: (size: ViewportSize) => void;

  // Chat
  messages: ChatMessage[];
  isTyping: boolean;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setIsTyping: (v: boolean) => void;
  markCodeApplied: (msgId: string) => void;

  // Visual Editor State
  visualState: string | null;
  setVisualState: (state: string) => void;

  // Terminal
  terminalOutput: string[];
  terminalVisible: boolean;
  addTerminalLine: (line: string) => void;
  clearTerminal: () => void;
  toggleTerminal: () => void;

  // Ollama model
  ollamaModel: string;
  setOllamaModel: (model: string) => void;
}

const getLanguage = (filename: string): TabNode['language'] => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'html') return 'html';
  if (ext === 'css') return 'css';
  if (ext === 'js' || ext === 'jsx') return 'js';
  if (ext === 'ts' || ext === 'tsx') return 'ts';
  if (ext === 'json') return 'json';
  return 'text';
};

export const useStore = create<NovaStore>((set, get) => ({
  // Project
  projectPath: null,
  fileTree: [],
  setProject: (path, tree) => set({ projectPath: path, fileTree: tree }),
  setFileTree: (tree) => set({ fileTree: tree }),

  // Tabs
  tabs: [],
  activeTabId: null,
  openTab: (path, name, content) => set(state => {
    const existing = state.tabs.find(t => t.path === path);
    if (existing) {
      return { activeTabId: path };
    }
    return {
      tabs: [...state.tabs, {
        path,
        name,
        content,
        language: getLanguage(name),
        isDirty: false
      }],
      activeTabId: path
    };
  }),
  closeTab: (path) => set(state => {
    const newTabs = state.tabs.filter(t => t.path !== path);
    return {
      tabs: newTabs,
      activeTabId: state.activeTabId === path ? (newTabs[newTabs.length - 1]?.path || null) : state.activeTabId
    };
  }),
  setActiveTab: (path) => set({ activeTabId: path }),
  setTabContent: (path, content) => set(state => ({
    tabs: state.tabs.map(t => t.path === path ? { ...t, content, isDirty: true } : t)
  })),
  markTabClean: (path) => set(state => ({
    tabs: state.tabs.map(t => t.path === path ? { ...t, isDirty: false } : t)
  })),

  // Preview
  previewServerUrl: null,
  setPreviewServerUrl: (url) => set({ previewServerUrl: url }),
  viewMode: 'split',
  setViewMode: (mode) => set({ viewMode: mode }),
  viewportSize: 0,
  setViewportSize: (size) => set({ viewportSize: size }),

  // Chat
  messages: [
    {
      id: '0',
      role: 'nova',
      content: '👋 Hola. Soy Nova. Abre una carpeta de proyecto para comenzar. Puedes pedirme que cree, edite o explique cualquier archivo.',
      timestamp: Date.now(),
    }
  ],
  isTyping: false,
  addMessage: (msg) => set(state => ({
    messages: [...state.messages, { ...msg, id: Date.now().toString(), timestamp: Date.now() }]
  })),
  setIsTyping: (v) => set({ isTyping: v }),
  markCodeApplied: (msgId) => set(state => ({
    messages: state.messages.map(m => m.id === msgId ? { ...m, applied: true } : m)
  })),

  // Visual Editor State
  visualState: null,
  setVisualState: (state) => set({ visualState: state }),

  // Terminal
  terminalOutput: [],
  terminalVisible: false,
  addTerminalLine: (line) => set(state => ({
    terminalOutput: [...state.terminalOutput.slice(-500), line]
  })),
  clearTerminal: () => set({ terminalOutput: [] }),
  toggleTerminal: () => set(state => ({ terminalVisible: !state.terminalVisible })),

  // Ollama
  ollamaModel: (() => {
    const saved = localStorage.getItem('nova_ollama_model');
    return (saved && saved !== 'llama3') ? saved : 'llama3.2:3b';
  })(),
  setOllamaModel: (model) => {
    localStorage.setItem('nova_ollama_model', model);
    set({ ollamaModel: model });
  },
}));
