import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { useDraftStore } from '../../draft/useDraftStore';
import { buildProjectPreviewSrcDoc, buildSingleFilePreviewSrcDoc } from '../../lib/projectPreview';
import { RefreshCw, Zap, Radio } from 'lucide-react';

export const LivePreview: React.FC = () => {
  const { previewServerUrl, viewportSize, activeTabId, tabs, projectPath } = useStore();
  const activeTab = tabs.find((t) => t.path === activeTabId);
  const sessions = useDraftStore((s) => s.sessions);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [srcDoc, setSrcDoc] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'live' | 'server'>('live');
  const [loading, setLoading] = useState(false);

  const hasAnyDraft = activeTabId
    ? !!(sessions[activeTabId]?.dirty.code || sessions[activeTabId]?.dirty.visual)
    : false;

  const draftFingerprint = tabs
    .map((t) => {
      const s = sessions[t.path];
      return `${t.path}:${s?.codeDraft?.length ?? 0}:${s?.dirty.code}:${s?.virtualCode?.length ?? 0}:${s?.dirty.visual}:${t.content.length}`;
    })
    .join('|');

  const getDraft = useCallback((path: string) => {
    const s = useDraftStore.getState().getSession(path);
    if (!s) return null;
    return {
      codeDraft: s.codeDraft,
      virtualCode: s.virtualCode,
      dirtyCode: s.dirty.code,
      dirtyVisual: s.dirty.visual,
    };
  }, []);

  const rebuildPreview = useCallback(async () => {
    if (!activeTab) {
      setSrcDoc(null);
      return;
    }

    setLoading(true);
    try {
      const assembled = await buildProjectPreviewSrcDoc({
        projectPath,
        tabs,
        activeTabId,
        getDraft,
      });

      if (assembled) {
        setSrcDoc(assembled);
        setPreviewMode('live');
        return;
      }

      const session = activeTabId ? useDraftStore.getState().getSession(activeTabId) : null;
      const content =
        session?.dirty.code && session.codeDraft !== null
          ? session.codeDraft
          : session?.dirty.visual && session.virtualCode
            ? session.virtualCode
            : activeTab.content;

      const single = buildSingleFilePreviewSrcDoc(
        content,
        activeTab.name,
        session?.dirty.visual ? session.virtualCode : null
      );

      setSrcDoc(single);
      setPreviewMode(single ? 'live' : 'server');
    } finally {
      setLoading(false);
    }
  }, [activeTab, activeTabId, projectPath, tabs, getDraft]);

  useEffect(() => {
    const timer = setTimeout(() => { rebuildPreview(); }, 250);
    return () => clearTimeout(timer);
  }, [rebuildPreview, draftFingerprint, activeTabId, activeTab?.content]);

  useEffect(() => {
    const handler = () => { rebuildPreview(); };
    window.addEventListener('nova-reload-preview', handler);
    window.addEventListener('nova-preview-content-changed', handler);
    return () => {
      window.removeEventListener('nova-reload-preview', handler);
      window.removeEventListener('nova-preview-content-changed', handler);
    };
  }, [rebuildPreview]);

  const reloadServer = () => {
    if (iframeRef.current && previewServerUrl) {
      iframeRef.current.src = `${previewServerUrl}/index.html?t=${Date.now()}`;
    }
  };

  const iframeWidth = viewportSize === 0 ? '100%' : `${viewportSize}px`;
  const useSrcDoc = previewMode === 'live' && !!srcDoc;

  if (!previewServerUrl && !srcDoc && !activeTab) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A10] text-gray-600 gap-3">
        <div className="text-5xl">📄</div>
        <p className="text-sm text-gray-500">Abre un proyecto para ver el preview</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A10] overflow-hidden min-h-0">
      <div className="h-8 bg-[#111118] border-b border-white/5 flex items-center px-3 gap-2 shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] ${
            useSrcDoc ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-white/5 text-gray-500'
          }`}>
            <Radio className="w-3 h-3" /> En vivo
          </span>
          {hasAnyDraft && (
            <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
              incluye cambios sin guardar
            </span>
          )}
          {loading && <span className="text-[9px] text-gray-600">actualizando…</span>}
        </div>

        <div className="flex-1 flex justify-center">
          <span className="bg-black/40 border border-white/5 text-gray-500 text-[10px] px-3 py-0.5 rounded font-mono flex items-center gap-2">
            <Zap className="w-3 h-3 text-yellow-500/70" />
            {useSrcDoc ? 'live://editor-preview' : `${previewServerUrl}/index.html`}
          </span>
        </div>

        {!useSrcDoc && previewServerUrl && (
          <button onClick={reloadServer} title="Recargar preview del servidor" className="text-gray-600 hover:text-gray-300 transition-colors p-1 bg-white/5 rounded">
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto flex justify-center bg-[#0A0A10] min-h-0">
        {useSrcDoc ? (
          <iframe
            key={srcDoc.slice(0, 120) + srcDoc.length}
            srcDoc={srcDoc}
            title="Nova Live Preview"
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
        ) : previewServerUrl ? (
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
        ) : (
          <div className="flex items-center justify-center text-gray-600 text-sm">Sin contenido para previsualizar</div>
        )}
      </div>
    </div>
  );
};
