import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';

export interface MenuAction {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
  action?: () => void | Promise<void>;
}

interface MenuBarProps {
  onOpenFolder: () => void;
  onNewProject: () => void;
  onSave: () => void;
  canSave: boolean;
}

const MenuDropdown: React.FC<{
  label: string;
  items: MenuAction[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}> = ({ label, items, open, onToggle, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative h-full">
      <button
        onClick={onToggle}
        className={`px-2.5 h-full text-[11px] transition-colors ${
          open ? 'bg-white/10 text-gray-200' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
        }`}
      >
        {label}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-px min-w-[220px] bg-[#1a1a22] border border-white/10 rounded-md shadow-2xl py-1 z-[200]">
          {items.map((item) =>
            item.separator ? (
              <div key={item.id} className="my-1 border-t border-white/5" />
            ) : (
              <button
                key={item.id}
                disabled={item.disabled}
                onClick={async () => {
                  onClose();
                  await item.action?.();
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] text-gray-300 hover:bg-primary/20 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
              >
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="text-[10px] text-gray-600 ml-4 font-mono">{item.shortcut}</span>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export const MenuBar: React.FC<MenuBarProps> = ({ onOpenFolder, onNewProject, onSave, canSave }) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const {
    projectPath, activeTabId, tabs, closeTab, openTab,
    setViewMode, viewMode, toggleTerminal, terminalVisible,
    setViewportSize,
  } = useStore();

  const activeTab = tabs.find((t) => t.path === activeTabId);
  const nova = (window as any).novaAPI;

  const runInTerminal = async (cmd: string) => {
    if (!projectPath) {
      alert('Abre una carpeta primero.');
      return;
    }
    if (!terminalVisible) toggleTerminal();
    useStore.getState().addTerminalLine(`$ ${cmd}\n`);
    const result = await nova?.execCommand(cmd, projectPath);
    if (result?.stdout) useStore.getState().addTerminalLine(result.stdout);
    if (result?.stderr) useStore.getState().addTerminalLine(result.stderr);
    if (result?.error) useStore.getState().addTerminalLine(`Error: ${result.error}\n`);
  };

  const fileMenu: MenuAction[] = [
    {
      id: 'new-file',
      label: 'Nuevo Archivo...',
      shortcut: 'Ctrl+N',
      action: async () => {
        if (!projectPath) { alert('Abre una carpeta primero.'); return; }
        const name = prompt('Nombre del archivo:', 'index.html');
        if (!name) return;
        await nova?.createFile(projectPath, name);
        const content = await nova?.readFile(`${projectPath}/${name}`.replace(/\\/g, '/'));
        if (content !== null) openTab(`${projectPath}/${name}`.replace(/\\/g, '/'), name, content);
        window.dispatchEvent(new Event('nova-refresh-file-tree'));
      },
    },
    { id: 'sep1', label: '', separator: true },
    {
      id: 'open-folder',
      label: 'Abrir Carpeta...',
      shortcut: 'Ctrl+K Ctrl+O',
      action: onOpenFolder,
    },
    {
      id: 'new-project',
      label: 'Nuevo Proyecto...',
      action: onNewProject,
    },
    { id: 'sep2', label: '', separator: true },
    {
      id: 'save',
      label: 'Guardar',
      shortcut: 'Ctrl+S',
      disabled: !canSave,
      action: onSave,
    },
    {
      id: 'save-as',
      label: 'Guardar Como...',
      disabled: !activeTab,
      action: async () => {
        if (!activeTab || !projectPath) return;
        const name = prompt('Guardar como:', activeTab.name);
        if (!name) return;
        const path = `${projectPath}/${name}`.replace(/\\/g, '/');
        await nova?.writeFile(path, activeTab.content);
        openTab(path, name, activeTab.content);
      },
    },
    { id: 'sep3', label: '', separator: true },
    {
      id: 'close',
      label: 'Cerrar Editor',
      shortcut: 'Ctrl+W',
      disabled: !activeTabId,
      action: () => activeTabId && closeTab(activeTabId),
    },
    {
      id: 'exit',
      label: 'Salir',
      shortcut: 'Alt+F4',
      action: () => window.close(),
    },
  ];

  const editMenu: MenuAction[] = [
    {
      id: 'undo',
      label: 'Deshacer',
      shortcut: 'Ctrl+Z',
      action: () => { document.execCommand('undo'); },
    },
    {
      id: 'redo',
      label: 'Rehacer',
      shortcut: 'Ctrl+Y',
      action: () => { document.execCommand('redo'); },
    },
    { id: 'sep-e1', label: '', separator: true },
    {
      id: 'cut',
      label: 'Cortar',
      shortcut: 'Ctrl+X',
      action: () => { document.execCommand('cut'); },
    },
    {
      id: 'copy',
      label: 'Copiar',
      shortcut: 'Ctrl+C',
      action: () => { document.execCommand('copy'); },
    },
    {
      id: 'paste',
      label: 'Pegar',
      shortcut: 'Ctrl+V',
      action: () => { document.execCommand('paste'); },
    },
    { id: 'sep-e2', label: '', separator: true },
    {
      id: 'select-all',
      label: 'Seleccionar Todo',
      shortcut: 'Ctrl+A',
      action: () => { document.execCommand('selectAll'); },
    },
  ];

  const viewMenu: MenuAction[] = [
    {
      id: 'explorer',
      label: 'Explorador',
      shortcut: 'Ctrl+Shift+E',
      action: () => document.querySelector<HTMLElement>('[data-panel="explorer"]')?.focus(),
    },
    {
      id: 'terminal',
      label: terminalVisible ? 'Ocultar Terminal' : 'Mostrar Terminal',
      shortcut: 'Ctrl+`',
      action: () => { toggleTerminal(); },
    },
    { id: 'sep-v1', label: '', separator: true },
    {
      id: 'visual',
      label: 'Diseño',
      action: () => setViewMode('visual'),
      disabled: viewMode === 'visual',
    },
    {
      id: 'preview',
      label: 'Preview',
      action: () => setViewMode('preview'),
      disabled: viewMode === 'preview',
    },
    {
      id: 'split',
      label: 'Split',
      action: () => setViewMode('split'),
      disabled: viewMode === 'split',
    },
    {
      id: 'code',
      label: 'Código',
      action: () => setViewMode('code'),
      disabled: viewMode === 'code',
    },
    { id: 'sep-v2', label: '', separator: true },
    {
      id: 'vp-mobile',
      label: 'Viewport 375px',
      action: () => setViewportSize(375),
    },
    {
      id: 'vp-tablet',
      label: 'Viewport 768px',
      action: () => setViewportSize(768),
    },
    {
      id: 'vp-desktop',
      label: 'Viewport 1440px',
      action: () => setViewportSize(1440),
    },
    {
      id: 'vp-auto',
      label: 'Viewport Auto',
      action: () => setViewportSize(0),
    },
  ];

  const runMenu: MenuAction[] = [
    {
      id: 'dev',
      label: 'Iniciar Dev Server (npm run dev)',
      action: () => runInTerminal('npm run dev'),
    },
    {
      id: 'build',
      label: 'Build (npm run build)',
      action: () => runInTerminal('npm run build'),
    },
    {
      id: 'preview-reload',
      label: 'Recargar Preview',
      action: () => { window.dispatchEvent(new Event('nova-reload-preview')); },
    },
    {
      id: 'install',
      label: 'Instalar Dependencias (npm install)',
      action: () => runInTerminal('npm install'),
    },
  ];

  const gitMenu: MenuAction[] = [
    {
      id: 'init',
      label: 'Inicializar Repositorio',
      action: () => runInTerminal('git init'),
    },
    {
      id: 'status',
      label: 'Estado (git status)',
      action: () => runInTerminal('git status'),
    },
    {
      id: 'commit',
      label: 'Commit...',
      action: async () => {
        const msg = prompt('Mensaje del commit:');
        if (!msg) return;
        await runInTerminal(`git add -A && git commit -m "${msg.replace(/"/g, '\\"')}"`);
      },
    },
    {
      id: 'push',
      label: 'Push',
      action: () => runInTerminal('git push'),
    },
    {
      id: 'pull',
      label: 'Pull',
      action: () => runInTerminal('git pull'),
    },
  ];

  const menus = [
    { id: 'file', label: 'File', items: fileMenu },
    { id: 'edit', label: 'Edit', items: editMenu },
    { id: 'view', label: 'View', items: viewMenu },
    { id: 'run', label: 'Run', items: runMenu },
    { id: 'git', label: 'Git', items: gitMenu },
  ];

  return (
    <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
      {menus.map((m) => (
        <MenuDropdown
          key={m.id}
          label={m.label}
          items={m.items}
          open={openMenu === m.id}
          onToggle={() => setOpenMenu(openMenu === m.id ? null : m.id)}
          onClose={() => setOpenMenu(null)}
        />
      ))}
    </div>
  );
};
