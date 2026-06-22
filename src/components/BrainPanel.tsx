import React, { useEffect, useState } from 'react';
import { MemoryManager } from '../brain/MemoryManager';
import type { Pattern, Principle, KnowledgeGap } from '../brain/types';
import { Brain, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface BrainPanelProps {
    memoryManager: MemoryManager | null;
}

export const BrainPanel: React.FC<BrainPanelProps> = ({ memoryManager }) => {
    const [patterns, setPatterns] = useState<Pattern[]>([]);
    const [principles, setPrinciples] = useState<Principle[]>([]);
    const [gaps, setGaps] = useState<KnowledgeGap[]>([]);
    const [activeTab, setActiveTab] = useState<'patterns' | 'principles' | 'gaps'>('patterns');

    const loadBrainData = async () => {
        if (!memoryManager) return;
        setPatterns(await memoryManager.getPatterns());
        setPrinciples(await memoryManager.getPrinciples());
        // For now gaps are empty as we haven't implemented gap detection yet
        setGaps([]);
    };

    useEffect(() => {
        loadBrainData();
        const interval = setInterval(loadBrainData, 5000); // Poll every 5s for updates
        return () => clearInterval(interval);
    }, [memoryManager]);

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
                <button onClick={loadBrainData} className="text-gray-500 hover:text-white transition-colors" title="Refrescar">
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex border-b border-white/5 bg-panel shrink-0">
                <button onClick={() => setActiveTab('patterns')} className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors ${activeTab === 'patterns' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:bg-white/5'}`}>Patrones</button>
                <button onClick={() => setActiveTab('principles')} className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors ${activeTab === 'principles' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:bg-white/5'}`}>Principios</button>
                <button onClick={() => setActiveTab('gaps')} className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors ${activeTab === 'gaps' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:bg-white/5'}`}>Gaps</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'patterns' && (
                    <div className="flex flex-col gap-3">
                        {patterns.length === 0 ? <p className="text-xs text-gray-500 text-center mt-10">No se han detectado patrones aún. Programa un poco más.</p> : null}
                        {patterns.map((p, i) => (
                            <div key={i} className="bg-surface border border-white/10 rounded-lg p-3 shadow-md relative group">
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button className="text-emerald-500/50 hover:text-emerald-400 p-1 bg-black/20 rounded" title="Aprobar"><CheckCircle className="w-3.5 h-3.5" /></button>
                                    <button className="text-red-500/50 hover:text-red-400 p-1 bg-black/20 rounded" title="Rechazar"><XCircle className="w-3.5 h-3.5" /></button>
                                </div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                    Patrón Detectado {p.isApproved ? <span className="text-emerald-400">Aprobado</span> : <span className="text-amber-400">Pendiente</span>}
                                </div>
                                <div className="text-xs text-gray-300 mb-2 leading-relaxed"><span className="text-indigo-400 font-semibold">Si:</span> {p.triggerDesc}</div>
                                <div className="text-xs text-gray-300 leading-relaxed"><span className="text-emerald-400 font-semibold">Entonces:</span> {p.responseDesc}</div>
                                <div className="mt-3 flex justify-between items-center text-[10px] text-gray-600 font-mono">
                                    <span>Confianza: {(p.confidenceScore * 100).toFixed(0)}%</span>
                                    <span>Basado en {p.episodeCount} episodios</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'principles' && (
                    <div className="flex flex-col gap-3">
                        {principles.length === 0 ? <p className="text-xs text-gray-500 text-center mt-10">Los principios se cristalizan tras detectar múltiples patrones consistentes.</p> : null}
                        {principles.map((p, i) => (
                            <div key={i} className="bg-primary/5 border border-primary/20 rounded-lg p-4 shadow-lg text-center">
                                <Brain className="w-6 h-6 text-primary mx-auto mb-2 opacity-50" />
                                <div className="text-sm text-gray-200 font-medium leading-relaxed">"{p.description}"</div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'gaps' && (
                    <div className="flex flex-col gap-3">
                        {gaps.length === 0 ? <p className="text-xs text-gray-500 text-center mt-10">No hay brechas de conocimiento críticas detectadas.</p> : null}
                        {gaps.map((g, i) => (
                            <div key={i} className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 shadow-md flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-xs font-semibold text-gray-200 mb-1">{g.topic}</div>
                                    <div className="text-[10px] text-gray-500">Falló {g.occurrenceCount} veces intentando resolver esto.</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
