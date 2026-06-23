import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { useDraftStore } from '../../draft/useDraftStore';
import { buildDraftPreviewHtml } from '../../lib/draftPreviewHtml';
import { isHtmlDocument } from '../../lib/previewDocument';
import { Layers } from 'lucide-react';

export const DraftPreview: React.FC = () => {
  const { activeTabId } = useStore();
  const session = useDraftStore((s) => (activeTabId ? s.getSession(activeTabId) : null));
  const virtualCode = session?.virtualCode;
  const hasVisualDraft = session?.dirty.visual ?? false;

  const srcDoc = useMemo(() => {
    if (!virtualCode) return null;
    if (isHtmlDocument(virtualCode)) return virtualCode;
    return buildDraftPreviewHtml(virtualCode);
  }, [virtualCode]);

  if (!hasVisualDraft || !srcDoc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A10] text-gray-600 gap-3 p-6 text-center">
        <Layers className="w-10 h-10 opacity-30" />
        <p className="text-sm text-gray-500">No hay cambios visuales en draft</p>
        <p className="text-[11px] text-gray-600">Edita en la vista Diseño para ver el preview del draft aquí</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A10] overflow-hidden min-h-0">
      <div className="h-8 bg-amber-500/10 border-b border-amber-500/30 flex items-center px-3 gap-2 shrink-0">
        <Layers className="w-3 h-3 text-amber-400" />
        <span className="text-[10px] text-amber-300 font-medium">Preview Draft — no guardado en disco</span>
      </div>
      <div className="flex-1 overflow-auto flex justify-center bg-[#0A0A10] min-h-0">
        <iframe
          srcDoc={srcDoc}
          title="Nova Draft Preview"
          sandbox="allow-scripts allow-same-origin"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: '#ffffff',
          }}
        />
      </div>
    </div>
  );
};
