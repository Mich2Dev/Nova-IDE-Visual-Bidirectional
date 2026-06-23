import type { FileNode } from '../../store/useStore';
import type { BuildSnapshotInput, FileContext } from '../types/context.types';
import { useDraftStore } from '../../draft/useDraftStore';

export function collectFileContext(input: BuildSnapshotInput): {
  activeFile: FileContext | null;
  openFiles: Array<{ path: string; name: string; isDirty: boolean }>;
} {
  const draftStore = useDraftStore.getState();

  const openFiles = input.tabs.map((t) => ({
    path: t.path,
    name: t.name,
    isDirty: t.isDirty || draftStore.isFileDirty(t.path),
  }));

  const activeTab = input.tabs.find((t) => t.path === input.activeTabId);
  if (!activeTab) {
    return { activeFile: null, openFiles };
  }

  const session = draftStore.getSession(activeTab.path);

  return {
    openFiles,
    activeFile: {
      path: activeTab.path,
      name: activeTab.name,
      language: activeTab.language,
      persistedContent: activeTab.content,
      draftContent: session?.codeDraft ?? undefined,
      isDirty: activeTab.isDirty || draftStore.isFileDirty(activeTab.path),
    },
  };
}

export function summarizeFileTree(nodes: FileNode[], depth = 0, maxDepth = 2): string {
  if (!nodes.length) return '';
  let result = '';
  for (const node of nodes) {
    if (depth > maxDepth) continue;
    const indent = '  '.repeat(depth);
    if (node.kind === 'directory') {
      result += `${indent}📁 ${node.name}/\n`;
      if (node.children && depth < maxDepth) {
        result += summarizeFileTree(node.children, depth + 1, maxDepth);
      }
    } else {
      result += `${indent}📄 ${node.name}\n`;
    }
  }
  return result;
}
