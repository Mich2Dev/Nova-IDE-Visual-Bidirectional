import { useEditor } from '@craftjs/core';
import { MousePointer2, SlidersHorizontal } from 'lucide-react';
import { ElementProperties } from './ElementProperties';

function resolveEventId(selected: Set<string> | string | null | undefined): string | null {
  if (!selected) return null;
  if (selected instanceof Set) return Array.from(selected)[0] ?? null;
  if (typeof selected === 'string') return selected;
  return null;
}

export const SettingsPanel = () => {
  const { selectedId, hoveredId } = useEditor((state) => ({
    selectedId: resolveEventId(state.events.selected),
    hoveredId: resolveEventId(state.events.hovered),
  }));

  const targetId = selectedId ?? hoveredId;
  const isHoverPreview = !selectedId && !!hoveredId;

  if (targetId) {
    return <ElementProperties key={targetId} nodeId={targetId} isHoverPreview={isHoverPreview} />;
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-white/[0.02]">
        <SlidersHorizontal className="h-6 w-6 text-gray-600" />
      </div>
      <p className="text-xs font-medium text-gray-300">Personalizar elemento</p>
      <p className="mt-2 max-w-[200px] text-[10px] leading-relaxed text-gray-500">
        Pasa el cursor sobre texto, botones o bloques del lienzo para ver sus propiedades.
      </p>
      <div className="mt-4 flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-[10px] text-blue-300/80">
        <MousePointer2 className="h-3.5 w-3.5 shrink-0" />
        Estilo Onlook — hover + clic
      </div>
    </div>
  );
};
