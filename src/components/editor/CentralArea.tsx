import React from 'react';
import { useStore } from '../../store/useStore';
import type { ViewMode, ViewportSize } from '../../store/useStore';
import { LivePreview } from './LivePreview';
import { CodeEditor } from './CodeEditor';
import { VisualEditor } from './VisualEditor';
import { TabBar } from './TabBar';
import { Monitor, Tablet, Smartphone, Columns, Code, Eye, LayoutGrid } from 'lucide-react';

const ViewportButton: React.FC<{
  size: ViewportSize;
  label: string;
  icon: React.ReactNode;
}> = ({ size, label, icon }) => {
  const { viewportSize, setViewportSize } = useStore();
  const active = viewportSize === size;
  return (
    <button
      onClick={() => setViewportSize(size)}
      title={label}
      className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${
        active
          ? 'bg-primary/20 text-primary border border-primary/30'
          : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

const ViewModeButton: React.FC<{
  mode: ViewMode;
  label: string;
  icon: React.ReactNode;
}> = ({ mode, label, icon }) => {
  const { viewMode, setViewMode } = useStore();
  const active = viewMode === mode;
  return (
    <button
      onClick={() => setViewMode(mode)}
      title={label}
      className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${
        active
          ? 'bg-white/10 text-white border border-white/20'
          : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
};

const WelcomeScreen: React.FC = () => {
  const { projectPath, openTab, setTabContent } = useStore();

  const handleCreateFile = async (filename: string, boilerplate: string) => {
    if (!projectPath) {
      alert("Por favor abre una carpeta de proyecto primero usando el Explorador.");
      return;
    }
    
    // Asumimos que window.novaAPI existe como en ChatPanel
    const targetPath = `${projectPath}/${filename}`.replace(/\\/g, '/').replace(/\/\//g, '/');
    const nova = (window as any).novaAPI;
    
    if (nova && nova.writeFile) {
      const result = await nova.writeFile(targetPath, boilerplate);
      if (result?.success) {
        openTab(targetPath, filename, boilerplate);
        window.dispatchEvent(new Event('nova-refresh-file-tree'));
      } else {
        alert(`Error creando archivo: ${result?.error}`);
      }
    } else {
      // Fallback si no está el puente nativo (solo por seguridad)
      openTab(targetPath, filename, boilerplate);
    }
  };

  const createHTML = () => handleCreateFile('index.html', '<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Mi Proyecto</title>\n  <!-- Tailwind CSS por defecto para maquetación rápida -->\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body class="bg-gray-100 min-h-screen">\n  \n</body>\n</html>');
  
  const createReact = () => handleCreateFile('App.tsx', 'import React from "react";\n\nexport default function App() {\n  return (\n    <div className="min-h-screen bg-gray-100">\n      \n    </div>\n  );\n}\n');

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A10] text-gray-400 p-8">
      <div className="max-w-md w-full bg-[#111116] border border-white/5 rounded-2xl p-8 text-center shadow-2xl">
        <h2 className="text-xl font-bold text-gray-200 mb-2">Nova IDE</h2>
        <p className="text-sm mb-8">Inicializar Proyecto</p>
        
        {!projectPath ? (
          <p className="text-xs text-amber-500 bg-amber-500/10 p-4 rounded-lg">
            Abre una carpeta de proyecto en el Explorador a la izquierda para comenzar.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <button 
              onClick={createHTML}
              className="w-full py-3 px-4 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-xl text-sm font-medium transition-colors border border-indigo-500/30 flex items-center justify-center gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              Crear index.html (Clásico / Tailwind)
            </button>
            <button 
              onClick={createReact}
              className="w-full py-3 px-4 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-xl text-sm font-medium transition-colors border border-blue-500/30 flex items-center justify-center gap-2"
            >
              <Code className="w-4 h-4" />
              Crear App.tsx (Componente React)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const CentralArea: React.FC = () => {
  const { viewMode, activeTabId, tabs } = useStore();
  const activeTab = tabs.find(t => t.path === activeTabId);

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-[#0A0A10]">
      <TabBar />
      {/* Toolbar */}
      <div className="h-9 bg-[#0D0D13] border-b border-white/5 flex items-center px-3 gap-3 shrink-0">
        {/* View mode switcher */}
        <div className="flex items-center gap-1 border border-white/5 rounded-md p-0.5 bg-black/20">
          <ViewModeButton mode="visual" label="Diseño" icon={<LayoutGrid className="w-3 h-3" />} />
          <ViewModeButton mode="preview" label="Preview" icon={<Eye className="w-3 h-3" />} />
          <ViewModeButton mode="split" label="Split" icon={<Columns className="w-3 h-3" />} />
          <ViewModeButton mode="code" label="Código" icon={<Code className="w-3 h-3" />} />
        </div>

        {/* Viewport controls */}
        <div className="flex items-center gap-1 border border-white/5 rounded-md p-0.5 bg-black/20">
          <ViewportButton size={0} label="Auto" icon={<Monitor className="w-3 h-3" />} />
          <ViewportButton size={1440} label="1440" icon={<Monitor className="w-3 h-3" />} />
          <ViewportButton size={768} label="768" icon={<Tablet className="w-3 h-3" />} />
          <ViewportButton size={375} label="375" icon={<Smartphone className="w-3 h-3" />} />
        </div>

        {/* File status */}
        <div className="flex-1 flex justify-center">
          {activeTab && (
            <span className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5">
              {activeTab.name}
              {activeTab.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" title="Sin guardar" />}
            </span>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {!activeTab ? (
          <WelcomeScreen />
        ) : (
          <>
            {viewMode === 'visual' && <VisualEditor />}
            {viewMode === 'preview' && <LivePreview />}
            {viewMode === 'code' && <CodeEditor />}
            {viewMode === 'split' && (
              <>
                <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden border-r border-white/5">
                  <LivePreview />
                </div>
                <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
                  <CodeEditor />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
