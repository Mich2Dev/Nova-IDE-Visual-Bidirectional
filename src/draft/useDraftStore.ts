import { create } from 'zustand';
import type { DraftSession, VisualAction } from '../context/types/context.types';
import { buildVirtualCode } from '../context/builders/VirtualCodeBuilder';
import { createVisualAction } from './visualActionLog';
import { htmlToCraft } from '../utils/htmlToCraft';

function normalizeCraftGraph(json: string): string {
  try {
    const data = JSON.parse(json) as Record<string, Record<string, unknown>>;
    const sortedKeys = Object.keys(data).sort();
    const normalized: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      const node = data[key];
      if (!node) continue;
      normalized[key] = {
        ...node,
        nodes: Array.isArray(node.nodes) ? [...node.nodes].sort() : node.nodes,
      };
    }
    return JSON.stringify(normalized);
  } catch {
    return json;
  }
}

function hashContent(content: string): string {
  let h = 0;
  for (let i = 0; i < content.length; i++) {
    h = (Math.imul(31, h) + content.charCodeAt(i)) | 0;
  }
  return `rev_${h}`;
}

interface DraftStore {
  sessions: Record<string, DraftSession>;
  getSession: (filePath: string) => DraftSession | null;
  ensureSession: (filePath: string, persistedContent: string) => DraftSession;
  updateDesignGraph: (
    filePath: string,
    designGraph: string,
    action?: Partial<Pick<VisualAction, 'type' | 'nodeId' | 'nodeType' | 'payload' | 'source'>>
  ) => void;
  setCodeDraft: (filePath: string, code: string) => void;
  syncCodeFromVisual: (filePath: string, code: string) => void;
  rebootstrapDesignFromCode: (filePath: string, code: string) => void;
  captureCraftBaseline: (filePath: string, designGraph: string) => void;
  markUserTouchedVisual: (filePath: string) => void;
  commitSession: (filePath: string) => void;
  discardSession: (filePath: string) => void;
  removeSession: (filePath: string) => void;
  isFileDirty: (filePath: string) => boolean;
  getContentToSave: (filePath: string, persistedContent: string) => string | null;
}

export const useDraftStore = create<DraftStore>((set, get) => ({
  sessions: {},

  getSession: (filePath) => get().sessions[filePath] ?? null,

  ensureSession: (filePath, persistedContent) => {
    const existing = get().sessions[filePath];
    if (existing) return existing;

    let designGraph: string | null = null;
    let bootstrapSource: DraftSession['bootstrapSource'] = 'empty';

    if (persistedContent.trim()) {
      const inferred = htmlToCraft(persistedContent);
      if (inferred) {
        designGraph = inferred;
        bootstrapSource = 'inferred';
      }
    }

    const session: DraftSession = {
      filePath,
      baseRevision: hashContent(persistedContent),
      designGraph,
      baselineDesignGraph: null,
      virtualCode: designGraph ? buildVirtualCode(designGraph, filePath) : null,
      actions: [],
      codeDraft: null,
      dirty: { visual: false, code: false },
      userTouchedVisual: false,
      bootstrapSource,
      startedAt: Date.now(),
      lastTouchedAt: Date.now(),
    };

    set((state) => ({ sessions: { ...state.sessions, [filePath]: session } }));
    return session;
  },

  updateDesignGraph: (filePath, designGraph, action) => {
    set((state) => {
      const session = state.sessions[filePath];
      if (!session) return state;

      const isFirstBaseline = session.baselineDesignGraph === null;
      const baselineDesignGraph = isFirstBaseline ? designGraph : session.baselineDesignGraph;
      const dirtyVisual =
        session.userTouchedVisual &&
        !isFirstBaseline &&
        normalizeCraftGraph(designGraph) !== normalizeCraftGraph(session.baselineDesignGraph ?? '');

      const visualAction = action?.nodeId
        ? createVisualAction(
            action.type ?? 'graph_change',
            action.nodeId,
            action.nodeType ?? 'Unknown',
            action.payload ?? {},
            action.source ?? 'craft'
          )
        : createVisualAction('graph_change', 'ROOT', 'Canvas', {}, 'craft');

      const virtualCode = buildVirtualCode(designGraph, filePath);
      const updated: DraftSession = {
        ...session,
        designGraph,
        baselineDesignGraph,
        virtualCode,
        codeDraft: dirtyVisual && virtualCode ? virtualCode : session.codeDraft,
        actions: dirtyVisual ? [...session.actions, visualAction] : session.actions,
        dirty: {
          visual: dirtyVisual,
          code: dirtyVisual ? true : session.dirty.code,
        },
        lastTouchedAt: Date.now(),
      };

      return { sessions: { ...state.sessions, [filePath]: updated } };
    });
  },

  setCodeDraft: (filePath, code) => {
    set((state) => {
      const session = state.sessions[filePath];
      if (!session) return state;
      return {
        sessions: {
          ...state.sessions,
          [filePath]: {
            ...session,
            codeDraft: code,
            dirty: { ...session.dirty, code: true },
            lastTouchedAt: Date.now(),
          },
        },
      };
    });
  },

  captureCraftBaseline: (filePath, designGraph) => {
    set((state) => {
      const session = state.sessions[filePath];
      if (!session) return state;
      const virtualCode = buildVirtualCode(designGraph, filePath);
      return {
        sessions: {
          ...state.sessions,
          [filePath]: {
            ...session,
            designGraph,
            baselineDesignGraph: designGraph,
            virtualCode,
            dirty: { visual: false, code: session.dirty.code },
            userTouchedVisual: false,
            lastTouchedAt: Date.now(),
          },
        },
      };
    });
  },

  markUserTouchedVisual: (filePath) => {
    set((state) => {
      const session = state.sessions[filePath];
      if (!session || session.userTouchedVisual) return state;
      return {
        sessions: {
          ...state.sessions,
          [filePath]: { ...session, userTouchedVisual: true, lastTouchedAt: Date.now() },
        },
      };
    });
  },

  syncCodeFromVisual: (filePath, code) => {
    set((state) => {
      const session = state.sessions[filePath];
      if (!session) return state;
      return {
        sessions: {
          ...state.sessions,
          [filePath]: {
            ...session,
            codeDraft: code,
            virtualCode: code,
            dirty: { visual: true, code: true },
            lastTouchedAt: Date.now(),
          },
        },
      };
    });
  },

  rebootstrapDesignFromCode: (filePath, code) => {
    set((state) => {
      const session = state.sessions[filePath];
      if (!session || session.dirty.visual) return state;

      const inferred = htmlToCraft(code);
      if (!inferred) return state;

      const virtualCode = buildVirtualCode(inferred, filePath);
      return {
        sessions: {
          ...state.sessions,
          [filePath]: {
            ...session,
            designGraph: inferred,
            baselineDesignGraph: null,
            virtualCode,
            codeDraft: session.dirty.code ? code : session.codeDraft,
            dirty: { visual: false, code: session.dirty.code },
            userTouchedVisual: false,
            lastTouchedAt: Date.now(),
          },
        },
      };
    });
  },

  commitSession: (filePath) => {
    set((state) => {
      const session = state.sessions[filePath];
      if (!session) return state;
      const cleared: DraftSession = {
        ...session,
        baselineDesignGraph: session.designGraph,
        codeDraft: null,
        actions: [],
        dirty: { visual: false, code: false },
        userTouchedVisual: false,
        lastTouchedAt: Date.now(),
      };
      return { sessions: { ...state.sessions, [filePath]: cleared } };
    });
  },

  discardSession: (filePath) => {
    set((state) => {
      const { [filePath]: _, ...rest } = state.sessions;
      return { sessions: rest };
    });
  },

  removeSession: (filePath) => {
    set((state) => {
      const { [filePath]: _, ...rest } = state.sessions;
      return { sessions: rest };
    });
  },

  isFileDirty: (filePath) => {
    const session = get().sessions[filePath];
    return !!(session?.dirty.visual || session?.dirty.code);
  },

  getContentToSave: (filePath, _persistedContent) => {
    const session = get().sessions[filePath];
    if (!session) return null;
    if (session.dirty.code && session.codeDraft !== null) return session.codeDraft;
    if (session.dirty.visual && session.virtualCode) return session.virtualCode;
    return null;
  },
}));
