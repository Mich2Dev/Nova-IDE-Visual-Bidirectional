import { useStore } from '../store/useStore';
import { useDraftStore } from '../draft/useDraftStore';

const nova = (window as any).novaAPI;

export interface NovaCodeBlock {
  lang: string;
  code: string;
  filename?: string;
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/\/+/g, '/');
}

export function inferBlockFilename(
  block: NovaCodeBlock,
  index: number,
  blocks: NovaCodeBlock[],
  activeTabName?: string
): string | undefined {
  if (block.filename) return block.filename;

  const lang = block.lang.toLowerCase();
  const htmlCount = blocks.filter((b) => b.lang.toLowerCase() === 'html').length;
  const cssCount = blocks.filter((b) => b.lang.toLowerCase() === 'css').length;

  if (lang === 'html') return htmlCount > 1 ? `page-${index + 1}.html` : 'index.html';
  if (lang === 'css') return cssCount > 1 ? `styles-${index + 1}.css` : 'styles.css';
  if (lang === 'javascript' || lang === 'js') return 'script.js';
  if (lang === 'typescript' || lang === 'ts' || lang === 'tsx') {
    return activeTabName?.endsWith('.tsx') ? activeTabName : 'App.tsx';
  }

  if (blocks.length === 1 && activeTabName) return activeTabName;
  return `archivo_${index + 1}.txt`;
}

export function resolveBlockPath(
  block: NovaCodeBlock,
  index: number,
  blocks: NovaCodeBlock[],
  projectPath: string | null,
  activeTabId: string | null,
  activeTabName?: string
): string | null {
  const filename = inferBlockFilename(block, index, blocks, activeTabName);

  if (filename && projectPath) {
    return normalizePath(`${projectPath}/${filename}`);
  }

  if (blocks.length === 1 && activeTabId) return activeTabId;
  if (projectPath && filename) return normalizePath(`${projectPath}/${filename}`);

  return null;
}

export async function applyCodeBlock(
  block: NovaCodeBlock,
  targetPath: string
): Promise<{ success: boolean; error?: string }> {
  const result = await nova?.writeFile?.(targetPath, block.code);
  if (!result?.success) {
    return { success: false, error: result?.error ?? 'Error al escribir archivo' };
  }

  const store = useStore.getState();
  const tabExists = store.tabs.some((t) => t.path === targetPath);
  const name = targetPath.split(/[/\\]/).pop() || 'archivo';

  if (!tabExists) {
    store.openTab(targetPath, name, block.code);
    useDraftStore.getState().commitSession(targetPath);
  } else {
    store.setPersistedContent(targetPath, block.code);
  }

  const lang = block.lang.toLowerCase();
  if (
    lang === 'html' ||
    lang === 'tsx' ||
    lang === 'jsx' ||
    targetPath.endsWith('.html') ||
    targetPath.endsWith('.tsx')
  ) {
    const { htmlToCraft } = await import('../utils/htmlToCraft');
    const parsedVisualState = htmlToCraft(block.code);
    if (parsedVisualState) {
      const draft = useDraftStore.getState();
      draft.removeSession(targetPath);
      draft.ensureSession(targetPath, block.code);
      draft.updateDesignGraph(targetPath, parsedVisualState, {
        type: 'graph_change',
        nodeId: 'ROOT',
        nodeType: 'Canvas',
      });
      draft.commitSession(targetPath);
    }
  }

  return { success: true };
}

export async function applyAllCodeBlocks(
  blocks: NovaCodeBlock[]
): Promise<{ applied: string[]; errors: string[] }> {
  const { projectPath, activeTabId, tabs } = useStore.getState();
  const activeTab = tabs.find((t) => t.path === activeTabId);
  const applied: string[] = [];
  const errors: string[] = [];

  if (!projectPath && !activeTabId) {
    return { applied: [], errors: ['Abre una carpeta de proyecto o un archivo primero.'] };
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const targetPath = resolveBlockPath(
      block,
      i,
      blocks,
      projectPath,
      activeTabId,
      activeTab?.name
    );

    if (!targetPath) {
      errors.push(`No se pudo determinar ruta para bloque ${i + 1}`);
      continue;
    }

    const result = await applyCodeBlock(block, targetPath);
    if (result.success) {
      applied.push(targetPath.split(/[/\\]/).pop() || targetPath);
    } else {
      errors.push(`${targetPath}: ${result.error}`);
    }
  }

  if (applied.length > 0) {
    window.dispatchEvent(new Event('nova-refresh-file-tree'));
    window.dispatchEvent(new Event('nova-reload-preview'));
    const firstPath = resolveBlockPath(blocks[0], 0, blocks, projectPath, activeTabId, activeTab?.name);
    if (firstPath) useStore.getState().setActiveTab(firstPath);
  }

  return { applied, errors };
}
