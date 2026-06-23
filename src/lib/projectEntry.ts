import type { FileNode } from '../store/useStore';

const ENTRY_PRIORITY = [
  'index.html',
  'index.htm',
  'app.tsx',
  'App.tsx',
  'app.jsx',
  'main.html',
  'home.html',
];

const WEB_EXTENSIONS = new Set(['html', 'htm', 'css', 'js', 'ts', 'tsx', 'jsx', 'json']);

export function flattenFileNodes(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = [];
  for (const node of nodes) {
    if (node.kind === 'file') {
      result.push(node);
    }
    if (node.children?.length) {
      result.push(...flattenFileNodes(node.children));
    }
  }
  return result;
}

/** Carpeta vacía = sin archivos de proyecto visibles en el árbol raíz */
export function hasProjectContent(nodes: FileNode[]): boolean {
  return nodes.some((n) => n.kind === 'file');
}

export function findEntryFile(nodes: FileNode[]): FileNode | null {
  const files = nodes.filter((n) => n.kind === 'file');

  for (const name of ENTRY_PRIORITY) {
    const match = files.find((f) => f.name.toLowerCase() === name.toLowerCase());
    if (match) return match;
  }

  const html = files.find((f) => /\.html?$/i.test(f.name));
  if (html) return html;

  const web = files.find((f) => {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    return WEB_EXTENSIONS.has(ext);
  });
  return web ?? null;
}
