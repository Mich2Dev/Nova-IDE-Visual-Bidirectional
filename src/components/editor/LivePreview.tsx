import React, { useRef } from 'react';
import { useStore } from '../../store/useStore';
import { RefreshCw, Zap } from 'lucide-react';

export const LivePreview: React.FC = () => {
  const { activeTabId, tabs, previewServerUrl, viewportSize } = useStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const activeTab = tabs.find(t => t.path === activeTabId);

  const reload = () => {
    if (iframeRef.current && previewServerUrl) {
      // Force iframe reload by appending a cache-busting param
      iframeRef.current.src = `${previewServerUrl}/index.html?t=${Date.now()}`;
    }
  };

  const iframeWidth = viewportSize === 0 ? '100%' : `${viewportSize}px`;

  if (!previewServerUrl) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A10] text-gray-600 gap-3">
        <div className="text-5xl">📄</div>
        <p className="text-sm text-gray-500">Abre un proyecto para iniciar el servidor de preview</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A10] overflow-hidden min-h-0">
      {/* Preview toolbar */}
      <div className="h-8 bg-[#111118] border-b border-white/5 flex items-center px-3 gap-2 shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60"></div>
        </div>
        <div className="flex-1 flex justify-center">
          <span className="bg-black/40 border border-white/5 text-gray-500 text-[10px] px-3 py-0.5 rounded font-mono flex items-center gap-2">
            <Zap className="w-3 h-3 text-yellow-500/70" />
            {previewServerUrl}/index.html
          </span>
        </div>
        <button onClick={reload} title="Recargar preview" className="text-gray-600 hover:text-gray-300 transition-colors p-1 bg-white/5 rounded">
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* iframe container - respects viewport width */}
      <div className="flex-1 overflow-auto flex justify-center bg-[#0A0A10] min-h-0">
        <iframe
          ref={iframeRef}
          src={`${previewServerUrl}/index.html`}
          title="Nova Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
          style={{
            width: iframeWidth,
            height: '100%',
            border: 'none',
            background: '#ffffff',
            transition: 'width 0.3s ease',
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  );
};
