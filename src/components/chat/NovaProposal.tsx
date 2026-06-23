import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { ChatMessage as ChatMessageType, ProposalStatus } from '../../store/useStore';
import {
  applyAllCodeBlocks,
  inferBlockFilename,
  resolveBlockPath,
  type NovaCodeBlock,
} from '../../lib/applyNovaChanges';
import { Check, X, FileCode, Loader2, ChevronDown, ChevronUp, Copy } from 'lucide-react';

// ─── Change Proposal (Aceptar / Rechazar estilo Cursor) ─────────────────────
const ChangeProposal: React.FC<{
  msg: ChatMessageType;
  blocks: NovaCodeBlock[];
}> = ({ msg, blocks }) => {
  const { projectPath, activeTabId, tabs, setProposalStatus } = useStore();
  const activeTab = tabs.find((t) => t.path === activeTabId);
  const [applying, setApplying] = useState(false);

  const status: ProposalStatus | undefined =
    msg.proposalStatus ?? (msg.applied ? 'accepted' : 'pending');

  const fileList = blocks.map((block, i) => {
    const name = inferBlockFilename(block, i, blocks, activeTab?.name) || `archivo ${i + 1}`;
    const path = resolveBlockPath(block, i, blocks, projectPath, activeTabId, activeTab?.name);
    const exists = path ? tabs.some((t) => t.path === path) : false;
    return { name, exists, path };
  });

  const accept = async () => {
    setApplying(true);
    const { applied, errors } = await applyAllCodeBlocks(blocks);
    setApplying(false);

    if (applied.length > 0) {
      setProposalStatus(msg.id, 'accepted');
      if (errors.length > 0) {
        useStore.getState().addMessage({
          role: 'system',
          content: `✓ Aplicados: ${applied.join(', ')}. Errores: ${errors.join('; ')}`,
        });
      }
    } else {
      useStore.getState().addMessage({
        role: 'system',
        content: `No se pudieron aplicar los cambios: ${errors.join('; ')}`,
      });
    }
  };

  const reject = () => {
    setProposalStatus(msg.id, 'rejected');
  };

  if (status === 'accepted') {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
        <span className="text-[11px] text-emerald-300 font-medium">
          Cambios aplicados · {fileList.map((f) => f.name).join(', ')}
        </span>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <X className="h-4 w-4 text-gray-500 shrink-0" />
        <span className="text-[11px] text-gray-500">Cambios rechazados</span>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-indigo-500/40 bg-indigo-500/10 overflow-hidden">
      <div className="px-3 py-2.5 border-b border-indigo-500/20">
        <p className="text-[11px] font-semibold text-indigo-200 mb-1.5">
          Nova propone {blocks.length} cambio{blocks.length > 1 ? 's' : ''}
        </p>
        <ul className="space-y-1">
          {fileList.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-[10px] text-gray-400">
              <FileCode className="h-3 w-3 text-indigo-400 shrink-0" />
              <span className="font-mono text-gray-300">{f.name}</span>
              <span className="text-gray-600">{f.exists ? '· modificar' : '· crear'}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex gap-2 px-3 py-2.5 bg-black/20">
        <button
          type="button"
          onClick={accept}
          disabled={applying}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-3 py-2 text-[11px] font-semibold text-white transition-colors"
        >
          {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {applying ? 'Aplicando…' : 'Aceptar cambios'}
        </button>
        <button
          type="button"
          onClick={reject}
          disabled={applying}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 hover:bg-white/5 px-3 py-2 text-[11px] text-gray-400 hover:text-gray-200 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Rechazar
        </button>
      </div>
    </div>
  );
};

// ─── Code preview (colapsable, sin botón aplicar individual) ────────────────
const CodePreview: React.FC<{ block: NovaCodeBlock; index: number }> = ({ block, index }) => {
  const [open, setOpen] = useState(index === 0);
  const [copied, setCopied] = useState(false);
  const label = block.filename || block.lang;

  const copy = () => {
    navigator.clipboard.writeText(block.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-[#0f172a] px-3 py-1.5 hover:bg-[#131d33] transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileCode className="h-3 w-3 text-indigo-400" />
          <span className="text-[10px] font-mono text-gray-300">{label}</span>
          <span className="text-[9px] text-gray-600 uppercase">{block.lang}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); copy(); }}
            onKeyDown={(e) => e.key === 'Enter' && copy()}
            className="text-gray-600 hover:text-gray-300 p-0.5"
            title="Copiar"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </span>
          {open ? <ChevronUp className="h-3 w-3 text-gray-600" /> : <ChevronDown className="h-3 w-3 text-gray-600" />}
        </div>
      </button>
      {open && (
        <pre className="bg-[#0D1117] p-3 overflow-x-auto text-[11px] leading-relaxed font-mono text-gray-300 max-h-48">
          <code>{block.code}</code>
        </pre>
      )}
    </div>
  );
};

export { ChangeProposal, CodePreview };
