import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { FileNode } from '../../store/useStore';
import { useContextStore } from '../../context/useContextStore';
import { hasProjectContent, findEntryFile } from '../../lib/projectEntry';
import {
  FolderOpen, FilePlus, ChevronRight, ChevronDown,
  Trash2, RefreshCw
} from 'lucide-react';

const nova = (window as any).novaAPI;

const FILE_ICONS: Record<string, string> = {
  html: '🌐',
  css: '🎨',
  js: '⚡',
  ts: '🔷',
  json: '📋',
  md: '📝',
  svg: '🖼️',
  png: '🖼️',
  jpg: '🖼️',
  jpeg: '🖼️',
};

const getIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return FILE_ICONS[ext] || '📄';
};

const IGNORED = new Set(['node_modules', '.git', '.nova', 'dist', '.next', '.cache']);
const ALLOWED_EXTENSIONS = new Set(['html', 'css', 'js', 'ts', 'tsx', 'jsx', 'json', 'md', 'svg', 'txt', 'env']);

const FileTreeItem: React.FC<{
  node: FileNode;
  level?: number;
  onRefresh: () => void;
}> = ({ node, level = 0, onRefresh }) => {
  const { activeTabId, openTab } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<FileNode[]>([]);
  const isActive = activeTabId === node.path;

  const handleClick = async () => {
    if (node.kind === 'directory') {
      if (!isOpen) {
        const entries = await nova.readDir(node.path);
        const filtered = entries
          .filter((e: FileNode) => !IGNORED.has(e.name))
          .filter((e: FileNode) => e.kind === 'directory' || ALLOWED_EXTENSIONS.has(e.name.split('.').pop() || ''))
          .sort((a: FileNode, b: FileNode) => {
            if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
            return a.name.localeCompare(b.name);
          });
        setChildren(filtered);
      }
      setIsOpen(!isOpen);
    } else {
      const content = await nova.readFile(node.path);
      if (content !== null) {
        openTab(node.path, node.name, content);
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`¿Eliminar "${node.name}"?`)) return;
    await nova.deleteEntry(node.path);
    onRefresh();
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 py-1 text-[12px] cursor-pointer transition-colors select-none rounded-md mx-1
          ${isActive ? 'bg-primary/15 text-primary' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
        style={{ paddingLeft: `${level * 14 + 8}px`, paddingRight: 8 }}
        onClick={handleClick}
      >
        {node.kind === 'directory' ? (
          <>
            <span className="text-gray-500 w-3.5 flex justify-center shrink-0">
              {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </span>
            <span className="shrink-0">{isOpen ? '📂' : '📁'}</span>
          </>
        ) : (
          <>
            <span className="w-3.5 shrink-0" />
            <span className="shrink-0">{getIcon(node.name)}</span>
          </>
        )}
        <span className="flex-1 truncate">{node.name}</span>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 text-gray-600 hover:text-red-400 rounded transition-all shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {isOpen && children.map((child, i) => (
        <FileTreeItem key={i} node={child} level={level + 1} onRefresh={onRefresh} />
      ))}
    </div>
  );
};

export const FileExplorer: React.FC = () => {
  const { projectPath, setProject } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [rootNodes, setRootNodes] = useState<FileNode[]>([]);

  const openFolder = async () => {
    const folderPath = await nova.openFolderDialog();
    if (!folderPath) return;
    await loadFolder(folderPath);
  };

  const loadFolder = async (folderPath: string) => {
    const entries = await nova.readDir(folderPath);
    const filtered = entries
      .filter((e: FileNode) => !IGNORED.has(e.name))
      .filter((e: FileNode) => e.kind === 'directory' || ALLOWED_EXTENSIONS.has(e.name.split('.').pop() || ''))
      .sort((a: FileNode, b: FileNode) => {
        if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    const serverUrl = await nova.startPreviewServer(folderPath);
    useStore.getState().setPreviewServerUrl(serverUrl);

    const prevPath = useStore.getState().projectPath;
    if (prevPath !== folderPath) {
      useStore.getState().clearTabs();
    }

    setProject(folderPath, filtered);
    setRootNodes(filtered);

    if (hasProjectContent(filtered)) {
      const entry = findEntryFile(filtered);
      if (entry) {
        const content = await nova.readFile(entry.path);
        if (content !== null) {
          useStore.getState().openTab(entry.path, entry.name, content);
        }
      }
    }

    try {
      const { refreshDesignProfile } = await import('../../context/collectors/DesignProfileCollector');
      await refreshDesignProfile(folderPath);
      useContextStore.getState().bumpDesignProfileVersion();
    } catch (e) {
      console.warn('Design profile extraction skipped:', e);
    }
  };

  const refresh = async () => {
    if (projectPath) await loadFolder(projectPath);
  };

  React.useEffect(() => {
    const handleRefresh = () => refresh();
    const handleOpenFolder = () => openFolder();
    window.addEventListener('nova-refresh-file-tree', handleRefresh);
    window.addEventListener('nova-open-folder', handleOpenFolder);
    return () => {
      window.removeEventListener('nova-refresh-file-tree', handleRefresh);
      window.removeEventListener('nova-open-folder', handleOpenFolder);
    };
  }, [projectPath]);

  const handleCreateFile = async () => {
    if (!newFileName.trim() || !projectPath) return;
    await nova.createFile(projectPath, newFileName.trim());
    setIsCreating(false);
    setNewFileName('');
    await refresh();
  };

  const projectName = projectPath ? projectPath.split(/[\\/]/).pop() : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/20">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Explorador</span>
        <div className="flex gap-1">
          {projectPath && (
            <>
              <button onClick={refresh} title="Actualizar" className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-white/5 transition-colors">
                <RefreshCw className="w-3 h-3" />
              </button>
              <button onClick={() => setIsCreating(true)} title="Nuevo archivo" className="text-emerald-500 hover:text-emerald-300 p-1 rounded hover:bg-emerald-500/10 transition-colors">
                <FilePlus className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button onClick={openFolder} title="Abrir carpeta" className="text-primary hover:text-indigo-400 p-1 rounded hover:bg-primary/10 transition-colors">
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
        {!projectPath ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-4">
            <div className="text-4xl opacity-20">📁</div>
            <p className="text-[11px] text-gray-600 leading-relaxed">Ninguna carpeta abierta</p>
            <button
              onClick={openFolder}
              className="text-[11px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-2 rounded-lg w-full transition-colors"
            >
              Abrir carpeta
            </button>
          </div>
        ) : (
          <div>
            {/* Root label */}
            <div className="px-3 py-1 text-[10px] font-semibold text-gray-600 uppercase tracking-widest flex items-center gap-1.5">
              <span>📂</span>
              <span className="truncate">{projectName}</span>
            </div>
            {rootNodes.map((node, i) => (
              <FileTreeItem key={i} node={node} level={0} onRefresh={refresh} />
            ))}
          </div>
        )}
      </div>

      {/* New file input */}
      {isCreating && (
        <div className="border-t border-white/5 p-2 shrink-0 bg-black/20">
          <input
            autoFocus
            type="text"
            value={newFileName}
            onChange={e => setNewFileName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreateFile();
              if (e.key === 'Escape') { setIsCreating(false); setNewFileName(''); }
            }}
            placeholder="nombre.html"
            className="w-full bg-[#0D0D13] border border-primary/30 rounded-md px-2 py-1.5 text-[12px] text-gray-200 outline-none focus:border-primary"
          />
          <div className="flex gap-2 mt-1.5">
            <button onClick={handleCreateFile} className="flex-1 text-[10px] bg-primary/20 hover:bg-primary/30 text-primary rounded py-1 transition-colors">Crear</button>
            <button onClick={() => { setIsCreating(false); setNewFileName(''); }} className="flex-1 text-[10px] bg-white/5 hover:bg-white/10 text-gray-400 rounded py-1 transition-colors">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};
