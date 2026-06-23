import type { AIContextSnapshot, ContextIntent } from '../types/context.types';
import { truncateToBudget } from '../compressors/TokenBudget';

interface PrioritizedBlocks {
  selection: string;
  draft: string;
  activeFile: string;
  fileTree: string;
  designProfile: string;
  runtime: string;
  memory: string;
  priorityApplied: string[];
  omitted: string[];
}

export function prioritizeContext(
  snapshot: AIContextSnapshot,
  intent: ContextIntent,
  tokenBudget: number
): PrioritizedBlocks {
  const priorityApplied: string[] = [];
  const omitted: string[] = [];

  let remaining = tokenBudget;

  const take = (label: string, content: string, priority: number): string => {
    if (!content.trim()) return '';
    const tokens = Math.ceil(content.length / 4);
    if (tokens > remaining) {
      const truncated = truncateToBudget(content, remaining);
      remaining = 0;
      priorityApplied.push(`${label}(${priority}, truncado)`);
      return truncated;
    }
    remaining -= tokens;
    priorityApplied.push(`${label}(${priority})`);
    return content;
  };

  // Priority order per intent
  const order: Record<ContextIntent, string[]> = {
    visual_edit: ['selection', 'draft', 'designProfile', 'activeFile', 'fileTree', 'memory', 'runtime'],
    debug: ['runtime', 'activeFile', 'draft', 'fileTree', 'selection', 'designProfile', 'memory'],
    redesign: ['designProfile', 'memory', 'draft', 'selection', 'activeFile', 'fileTree', 'runtime'],
    create_file: ['fileTree', 'designProfile', 'activeFile', 'memory', 'draft', 'selection', 'runtime'],
    explain: ['activeFile', 'fileTree', 'draft', 'selection', 'designProfile', 'runtime', 'memory'],
    general: ['activeFile', 'draft', 'selection', 'designProfile', 'fileTree', 'runtime', 'memory'],
  };

  const blocks: Record<string, string> = {
    selection: formatSelection(snapshot.selection),
    draft: formatDraft(snapshot.draft),
    activeFile: formatActiveFile(snapshot.activeFile, intent),
    fileTree: snapshot.project.fileTreeSummary,
    designProfile: formatDesignProfile(snapshot.designProfile, intent),
    runtime: formatRuntime(snapshot.runtime, intent),
    memory: formatMemory(snapshot.memory),
  };

  const result: PrioritizedBlocks = {
    selection: '',
    draft: '',
    activeFile: '',
    fileTree: '',
    designProfile: '',
    runtime: '',
    memory: '',
    priorityApplied,
    omitted,
  };

  const sequence = order[intent];
  let priority = 1;
  for (const key of sequence) {
    const content = blocks[key];
    if (!content) {
      omitted.push(key);
      continue;
    }
  }

  // Apply budget in priority order
  priority = 1;
  for (const key of sequence) {
    const content = blocks[key];
    if (!content) continue;
    const allocated = take(key, content, priority++);
    if (key === 'selection') result.selection = allocated;
    else if (key === 'draft') result.draft = allocated;
    else if (key === 'activeFile') result.activeFile = allocated;
    else if (key === 'fileTree') result.fileTree = allocated;
    else if (key === 'designProfile') result.designProfile = allocated;
    else if (key === 'runtime') result.runtime = allocated;
    else if (key === 'memory') result.memory = allocated;
    if (remaining <= 0) {
      const rest = sequence.slice(sequence.indexOf(key) + 1);
      omitted.push(...rest.filter((k) => blocks[k]));
      break;
    }
  }

  result.priorityApplied = priorityApplied;
  result.omitted = omitted;
  return result;
}

function formatSelection(selection: AIContextSnapshot['selection']): string {
  if (!selection) return '';
  return `NODO SELECCIONADO:
- ID: ${selection.nodeId}
- Tipo: ${selection.craftType}
- Nombre: ${selection.displayName}
- Props: ${JSON.stringify(selection.props, null, 2)}
- Jerarquía: ${selection.hierarchy.map((h) => h.type).join(' > ')}`;
}

function formatDraft(draft: AIContextSnapshot['draft']): string {
  if (!draft.hasVisualDraft && !draft.hasCodeDraft) return '';
  let text = `CAMBIOS NO GUARDADOS (DRAFT):\n${draft.actionSummary}`;
  if (draft.virtualCode) {
    text += `\n\nCódigo virtual (diseño):\n\`\`\`tsx\n${draft.virtualCode}\n\`\`\``;
  }
  if (draft.diff) {
    text += `\n\nDiff vs persistido:\n\`\`\`diff\n${draft.diff}\n\`\`\``;
  }
  return text;
}

function formatActiveFile(
  file: AIContextSnapshot['activeFile'],
  intent: ContextIntent
): string {
  if (!file) return '';
  const useDraft = file.draftContent && intent !== 'general';
  const content = useDraft ? file.draftContent! : file.persistedContent;
  const label = useDraft ? 'DRAFT (código Monaco)' : 'PERSISTIDO (disco)';
  return `ARCHIVO ACTIVO: ${file.name}
Estado: ${file.isDirty ? 'con cambios sin guardar' : 'limpio'}
Fuente mostrada: ${label}
\`\`\`${file.language}
${content}
\`\`\``;
}

function formatRuntime(runtime: AIContextSnapshot['runtime'], intent: ContextIntent): string {
  if (!runtime) return '';
  const isDebug = intent === 'debug';
  const isVisual = intent === 'visual_edit' || intent === 'redesign';
  if (!isDebug && !isVisual && runtime.consoleErrors.length === 0) return '';

  const parts: string[] = [];
  if (isDebug && runtime.buildErrors.length) {
    parts.push(
      `Errores de build:\n${runtime.buildErrors
        .map((e) => `- ${e.file}${e.line ? `:${e.line}` : ''}: ${e.message}`)
        .join('\n')}`
    );
  }
  if (runtime.terminalTail.length && isDebug) {
    parts.push(`Terminal (últimas líneas):\n${runtime.terminalTail.join('\n')}`);
  }
  if (runtime.consoleErrors.length) {
    parts.push(`Errores consola:\n${runtime.consoleErrors.join('\n')}`);
  }
  return parts.join('\n\n');
}

function formatDesignProfile(
  profile: AIContextSnapshot['designProfile'],
  intent: ContextIntent
): string {
  if (!profile) return '';
  if (intent !== 'visual_edit' && intent !== 'redesign' && intent !== 'create_file') return '';

  return `PERFIL DE DISEÑO DEL PROYECTO:
- Tono: ${profile.tone}
- Paleta: ${profile.colors.palette.join(', ')}
- Tipografías: ${profile.typography.fontFamilies.join(', ')}
- Reglas permitidas: ${profile.rules.allowed.join('; ')}
- Reglas prohibidas: ${profile.rules.forbidden.join('; ')}
${profile.extractedFrom?.length ? `- Extraído de: ${profile.extractedFrom.join(', ')}` : ''}`;
}

function formatMemory(memory: AIContextSnapshot['memory']): string {
  if (!memory.relevantPatterns.length && !memory.recentDecisions.length) return '';
  const parts: string[] = [];
  if (memory.relevantPatterns.length) {
    parts.push(`Patrones aprobados:\n${memory.relevantPatterns.map((p) => `- ${p}`).join('\n')}`);
  }
  if (memory.recentDecisions.length) {
    parts.push(`Decisiones recientes:\n${memory.recentDecisions.map((d) => `- ${d}`).join('\n')}`);
  }
  return parts.join('\n\n');
}
