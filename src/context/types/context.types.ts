import type { FileNode, ViewMode, ViewportSize } from '../../store/useStore';

export type ContextIntent =
  | 'general'
  | 'visual_edit'
  | 'debug'
  | 'redesign'
  | 'create_file'
  | 'explain';

export interface VisualAction {
  id: string;
  timestamp: number;
  type:
    | 'move'
    | 'resize'
    | 'style_change'
    | 'text_change'
    | 'add_node'
    | 'delete_node'
    | 'reparent'
    | 'reorder'
    | 'graph_change';
  nodeId: string;
  nodeType: string;
  payload: Record<string, unknown>;
  source: 'craft' | 'settings_panel' | 'keyboard';
}

export interface DraftSession {
  filePath: string;
  baseRevision: string;
  designGraph: string | null;
  baselineDesignGraph: string | null;
  virtualCode: string | null;
  actions: VisualAction[];
  codeDraft: string | null;
  dirty: {
    visual: boolean;
    code: boolean;
  };
  userTouchedVisual: boolean;
  bootstrapSource: 'persisted' | 'inferred' | 'empty';
  startedAt: number;
  lastTouchedAt: number;
}

export interface SelectedElementContext {
  nodeId: string;
  craftType: string;
  displayName: string;
  props: Record<string, unknown>;
  hierarchy: Array<{ id: string; type: string }>;
}

export interface FileContext {
  path: string;
  name: string;
  language: string;
  persistedContent: string;
  draftContent?: string;
  isDirty: boolean;
}

export interface ProjectDesignProfile {
  version: number;
  tone: 'minimal' | 'bold' | 'luxury' | 'playful' | 'corporate' | 'custom';
  colors: { palette: string[]; primary?: string; secondary?: string };
  typography: { fontFamilies: string[]; scale?: Record<string, string> };
  spacing?: { unit: number; scale?: number[] };
  radii?: Record<string, string>;
  components?: Record<string, { defaultClasses?: string }>;
  rules: { allowed: string[]; forbidden: string[] };
  assets?: Array<{ name: string; path: string; type: string }>;
  extractedFrom?: string[];
  updatedAt: number;
}

export interface RuntimeContext {
  buildErrors: Array<{ file: string; line?: number; message: string }>;
  consoleErrors: string[];
  terminalTail: string[];
  previewUrl: string | null;
  viewport: { width: number; height: number };
}

export interface ChatContext {
  intent: ContextIntent;
  userMessage: string;
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  viewMode: ViewMode;
}

export interface AIContextSnapshot {
  version: string;
  generatedAt: number;
  intent: ContextIntent;
  project: {
    path: string;
    name: string;
    fileTreeSummary: string;
  };
  activeFile: FileContext | null;
  openFiles: Array<{ path: string; name: string; isDirty: boolean }>;
  draft: {
    hasVisualDraft: boolean;
    hasCodeDraft: boolean;
    actionSummary: string;
    virtualCode?: string;
    diff?: string;
  };
  selection: SelectedElementContext | null;
  designProfile: ProjectDesignProfile | null;
  runtime: RuntimeContext | null;
  memory: {
    relevantPatterns: string[];
    recentDecisions: string[];
  };
  screenshot?: {
    base64: string;
    mimeType: 'image/jpeg' | 'image/png';
    caption: string;
  };
  meta: {
    tokenEstimate: number;
    omitted: string[];
    priorityApplied: string[];
  };
}

export interface BuildSnapshotInput {
  intent: ContextIntent;
  userMessage: string;
  projectPath: string | null;
  fileTree: FileNode[];
  tabs: Array<{
    path: string;
    name: string;
    content: string;
    language: string;
    isDirty: boolean;
  }>;
  activeTabId: string | null;
  viewMode: ViewMode;
  viewportSize: ViewportSize;
  previewServerUrl: string | null;
  terminalOutput: string[];
  tokenBudget: number;
}
