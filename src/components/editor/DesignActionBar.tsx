import React, { useState } from 'react';
import { Check, RotateCcw, Sparkles } from 'lucide-react';
import { saveActiveFile } from '../../lib/saveActiveFile';
import { useDraftStore } from '../../draft/useDraftStore';
import { useStore } from '../../store/useStore';

interface DesignActionBarProps {
  filePath: string;
  fileName: string;
  hasVisualDraft: boolean;
  onDiscard: () => void;
  inline?: boolean;
}

export const DesignActionBar: React.FC<DesignActionBarProps> = ({
  filePath,
  fileName,
  hasVisualDraft,
  onDiscard,
  inline = false,
}) => {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!hasVisualDraft) return null;

  const handleApply = async () => {
    setSaving(true);
    setMessage(null);
    const result = await saveActiveFile();
    setSaving(false);
    if (result.success) {
      setMessage('Cambios aplicados');
      window.dispatchEvent(new Event('nova-reload-preview'));
      setTimeout(() => setMessage(null), 2500);
    } else {
      setMessage(result.error ?? 'Error al guardar');
    }
  };

  const handleDiscard = () => {
    if (!window.confirm('¿Descartar todos los cambios visuales sin guardar?')) return;
    useDraftStore.getState().discardSession(filePath);
    useStore.getState().markTabClean(filePath);
    onDiscard();
    setMessage('Cambios descartados');
    setTimeout(() => setMessage(null), 2000);
  };

  const content = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-400" />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-amber-200/90">Cambios sin aplicar</p>
          <p className="truncate text-[9px] text-gray-500">{fileName}</p>
        </div>
      </div>

      {message && <span className="text-[10px] text-emerald-400">{message}</span>}

      <button
        type="button"
        onClick={handleDiscard}
        className="flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1 text-[10px] text-gray-400 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-gray-200"
      >
        <RotateCcw className="h-3 w-3" />
        Descartar
      </button>

      <button
        type="button"
        onClick={handleApply}
        disabled={saving}
        className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
      >
        <Check className="h-3 w-3" />
        {saving ? 'Aplicando…' : 'Aplicar cambios'}
      </button>
    </>
  );

  if (inline) {
    return (
      <div className="shrink-0 border-b border-amber-500/20 bg-amber-500/[0.06]">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2">{content}</div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-xl flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#1a1a22]/95 px-4 py-2.5 shadow-2xl backdrop-blur-md">
        {content}
      </div>
    </div>
  );
};
