import { create } from 'zustand';

const STORAGE_KEY = 'nova-panel-layout-v1';

interface PanelLayout {
  explorerWidth: number;
  chatWidth: number;
  toolboxWidth: number;
  settingsWidth: number;
  terminalHeight: number;
}

interface LayoutStore extends PanelLayout {
  setExplorerWidth: (w: number) => void;
  setChatWidth: (w: number) => void;
  setToolboxWidth: (w: number) => void;
  setSettingsWidth: (w: number) => void;
  setTerminalHeight: (h: number) => void;
  nudgeExplorer: (delta: number) => void;
  nudgeChat: (delta: number) => void;
  nudgeToolbox: (delta: number) => void;
  nudgeSettings: (delta: number) => void;
  nudgeTerminal: (delta: number) => void;
}

const defaults: PanelLayout = {
  explorerWidth: 280,
  chatWidth: 340,
  toolboxWidth: 220,
  settingsWidth: 280,
  terminalHeight: 220,
};

function loadLayout(): PanelLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

function persistLayout(layout: PanelLayout) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // ignore
  }
}

const initial = loadLayout();

export const useLayoutStore = create<LayoutStore>((set, get) => ({
  ...initial,

  setExplorerWidth: (w) => set((s) => { const next = { ...s, explorerWidth: w }; persistLayout(next); return next; }),
  setChatWidth: (w) => set((s) => { const next = { ...s, chatWidth: w }; persistLayout(next); return next; }),
  setToolboxWidth: (w) => set((s) => { const next = { ...s, toolboxWidth: w }; persistLayout(next); return next; }),
  setSettingsWidth: (w) => set((s) => { const next = { ...s, settingsWidth: w }; persistLayout(next); return next; }),
  setTerminalHeight: (h) => set((s) => { const next = { ...s, terminalHeight: h }; persistLayout(next); return next; }),

  nudgeExplorer: (delta) => {
    const w = Math.min(520, Math.max(160, get().explorerWidth + delta));
    get().setExplorerWidth(w);
  },
  nudgeChat: (delta) => {
    const w = Math.min(640, Math.max(240, get().chatWidth - delta));
    get().setChatWidth(w);
  },
  nudgeToolbox: (delta) => {
    const w = Math.min(420, Math.max(140, get().toolboxWidth + delta));
    get().setToolboxWidth(w);
  },
  nudgeSettings: (delta) => {
    const w = Math.min(480, Math.max(180, get().settingsWidth - delta));
    get().setSettingsWidth(w);
  },
  nudgeTerminal: (delta) => {
    const h = Math.min(480, Math.max(120, get().terminalHeight - delta));
    get().setTerminalHeight(h);
  },
}));
