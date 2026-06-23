import React, { useEffect, useState } from 'react';
import { MemoryManager } from '../brain/MemoryManager';
import type { Pattern, Principle, KnowledgeGap } from '../brain/types';
import type { ProjectDesignProfile } from '../context/types/context.types';
import { DesignProfileManager } from '../design/DesignProfileManager';
import { useContextStore } from '../context/useContextStore';
import { Brain, CheckCircle, XCircle, AlertCircle, RefreshCw, Palette } from 'lucide-react';

interface BrainPanelProps {
    memoryManager: MemoryManager | null;
    projectPath: string | null;
}

export const BrainPanel: React.FC<BrainPanelProps> = ({ memoryManager, projectPath }) => {
    const [patterns, setPatterns] = useState<Pattern[]>([]);
    const [principles, setPrinciples] = useState<Principle[]>([]);
    const [gaps, setGaps] = useState<KnowledgeGap[]>([]);
    const [designProfile, setDesignProfile] = useState<ProjectDesignProfile | null>(null);
    const [activeTab, setActiveTab] = useState<'patterns' | 'principles' | 'gaps' | 'design'>('patterns');
    const designProfileVersion = useContextStore((s) => s.designProfileVersion);

    const loadBrainData = async () => {
        if (!memoryManager) return;
        setPatterns(await memoryManager.getPatterns());
        setPrinciples(await memoryManager.getPrinciples());
        setGaps([]);
    };

    const loadDesignProfile = async () => {
        if (!projectPath) return;
        const manager = new DesignProfileManager(projectPath);
        setDesignProfile(await manager.load());
    };

    useEffect(() => {
        loadBrainData();
        loadDesignProfile();
        const interval = setInterval(loadBrainData, 5000);
        return () => clearInterval(interval);
    }, [memoryManager, projectPath, designProfileVersion]);

    const handleApprove = async (id: string) => {
        if (!memoryManager) return;
        await memoryManager.approvePattern(id);
        await loadBrainData();
    };

    const handleReject = async (id: string) => {
        if (!memoryManager) return;
        await memoryManager.rejectPattern(id);
        await loadBrainData();
    };

    const handleRefreshDesign = async () => {
        if (!projectPath) return;
        const manager = new DesignProfileManager(projectPath);
        const profile = await manager.extractAndMerge();
        setDesignProfile(profile);
        useContextStore.getState().bumpDesignProfileVersion();
    };

    if (!memoryManager) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
                <Brain className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">El Motor Cognitivo está inactivo. Abre una carpeta de proyecto para inicializar la memoria.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0D0D11] text-gray-300">
            <div className="p-4 border-b border-white/5 shrink-0 flex justify-between items-center bg-black/20">
                <div className="flex items-center gap-2 text-primary font-bold tracking-wider text-xs uppercase">
                    <Brain className="w-4 h-4" /> Cognitive Engine
                </div>
                <button onClick={() => { loadBrainData(); loadDesignProfile(); }} className="text-gray-500 hover:text-white transition-colors" title="Refrescar">
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex border-b border-white/5 bg-panel shrink-0">
                {(['patterns', 'principles', 'gaps', 'design'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 text-[9px] uppercase font-bold tracking-widest transition-colors ${
                            activeTab === tab ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:bg-white/5'
                        }`}
                    >
                        {tab === 'design' ? 'Diseño' : tab === 'patterns' ? 'Patrones' : tab === 'principles' ? 'Principios' : 'Gaps'}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'patterns' && (
                    <div className="flex flex-col gap-3">
                        {patterns.length === 0 ? <p className="text-xs text-gray-500 text-center mt-10">No se han detectado patrones aún.</p> : null}
                        {patterns.map((p) => (
                            <div key={p.id} className="bg-surface border border-white/10 rounded-lg p-3 shadow-md relative group">
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    {!p.isApproved && (
                                        <button onClick={() => handleApprove(p.id)} className="text-emerald-500/50 hover:text-emerald-400 p-1 bg-black/20 rounded" title="Aprobar">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <button onClick={() => handleReject(p.id)} className="text-red-500/50 hover:text-red-400 p-1 bg-black/20 rounded" title="Rechazar">
                                        <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                    Patrón {p.isApproved ? <span className="text-emerald-400">Aprobado</span> : <span className="text-amber-400">Pendiente</span>}
                                </div>
                                <div className="text-xs text-gray-300 mb-2 leading-relaxed"><span className="text-indigo-400 font-semibold">Si:</span> {p.triggerDesc}</div>
                                <div className="text-xs text-gray-300 leading-relaxed"><span className="text-emerald-400 font-semibold">Entonces:</span> {p.responseDesc}</div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'principles' && (
                    <div className="flex flex-col gap-3">
                        {principles.length === 0 ? <p className="text-xs text-gray-500 text-center mt-10">Los principios se cristalizan tras detectar múltiples patrones consistentes.</p> : null}
                        {principles.map((p) => (
                            <div key={p.id} className="bg-primary/5 border border-primary/20 rounded-lg p-4 shadow-lg text-center">
                                <Brain className="w-6 h-6 text-primary mx-auto mb-2 opacity-50" />
                                <div className="text-sm text-gray-200 font-medium leading-relaxed">&ldquo;{p.description}&rdquo;</div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'gaps' && (
                    <div className="flex flex-col gap-3">
                        {gaps.length === 0 ? <p className="text-xs text-gray-500 text-center mt-10">No hay brechas de conocimiento críticas detectadas.</p> : null}
                        {gaps.map((g) => (
                            <div key={g.id} className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 shadow-md flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-xs font-semibold text-gray-200 mb-1">{g.topic}</div>
                                    <div className="text-[10px] text-gray-500">Falló {g.occurrenceCount} veces.</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'design' && (
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleRefreshDesign}
                            className="flex items-center justify-center gap-2 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg py-2 transition-colors"
                        >
                            <Palette className="w-3.5 h-3.5" />
                            Extraer tokens del proyecto
                        </button>
                        {designProfile ? (
                            <div className="bg-surface border border-white/10 rounded-lg p-4 space-y-3 text-xs">
                                <div><span className="text-gray-500">Tono:</span> <span className="text-gray-200">{designProfile.tone}</span></div>
                                <div>
                                    <span className="text-gray-500">Paleta:</span>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {designProfile.colors.palette.map((c) => (
                                            <span key={c} className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded">
                                                <span className="w-3 h-3 rounded-full border border-white/20" style={{ background: c }} />
                                                <span className="font-mono text-[10px]">{c}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div><span className="text-gray-500">Fuentes:</span> <span className="text-gray-200">{designProfile.typography.fontFamilies.join(', ')}</span></div>
                                <div>
                                    <span className="text-gray-500">Permitido:</span>
                                    <ul className="mt-1 text-gray-400 list-disc pl-4">{designProfile.rules.allowed.map((r) => <li key={r}>{r}</li>)}</ul>
                                </div>
                                <div>
                                    <span className="text-gray-500">Prohibido:</span>
                                    <ul className="mt-1 text-gray-400 list-disc pl-4">{designProfile.rules.forbidden.map((r) => <li key={r}>{r}</li>)}</ul>
                                </div>
                                {designProfile.extractedFrom?.length ? (
                                    <div className="text-[10px] text-gray-600">Extraído de: {designProfile.extractedFrom.join(', ')}</div>
                                ) : null}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 text-center">Sin perfil de diseño. Pulsa extraer tokens.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
