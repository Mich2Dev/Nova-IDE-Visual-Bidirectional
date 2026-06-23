import React, { useState } from 'react';
import { motion, useDragControls, useAnimation } from 'framer-motion';
import { GripHorizontal, Minus, Maximize2 } from 'lucide-react';

interface FloatingPanelProps {
    id: string;
    title: string;
    children: React.ReactNode;
    defaultX: number;
    defaultY: number;
    width?: number;
    height?: number;
    zIndex: number;
    onBringToFront: (id: string) => void;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({ 
    id, title, children, defaultX, defaultY, width = 320, height = 500, zIndex, onBringToFront 
}) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [dockState, setDockState] = useState<'none' | 'left' | 'right'>('none');
    const dragControls = useDragControls();
    const controls = useAnimation();

    const handleDragStart = () => {
        setDockState('none');
        onBringToFront(id);
    };

    const handleDragEnd = (_event: unknown, info: { point: { x: number } }) => {
        const dropX = info.point.x;
        const screenW = window.innerWidth;
        
        // Auto-ajustar (Dock) a los bordes si se suelta muy cerca de las esquinas
        if (dropX < 50) {
            setDockState('left');
            controls.start({ x: 0, y: 0 });
        } else if (dropX > screenW - 50) {
            setDockState('right');
            controls.start({ x: screenW - width, y: 0 });
        }
    };

    const isDocked = dockState !== 'none';
    const currentHeight = isMinimized ? 40 : (isDocked ? '100%' : height);
    const roundedClass = isDocked ? 'rounded-none border-y-0' : 'rounded-xl';

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragListener={false}
            dragControls={dragControls}
            initial={{ x: defaultX, y: defaultY }}
            animate={controls}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onMouseDown={() => onBringToFront(id)}
            style={{ zIndex, width, height: currentHeight }}
            className={`absolute flex flex-col overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-md transition-colors bg-[#111116]/80 ${roundedClass}`}
        >
            {/* Toolbar Handle */}
            <div 
                className="h-10 shrink-0 bg-black/40 hover:bg-black/60 transition-colors flex items-center px-3 gap-2 cursor-grab active:cursor-grabbing border-b border-white/5 select-none"
                onPointerDown={(e) => {
                    onBringToFront(id);
                    dragControls.start(e);
                }}
                style={{ WebkitAppRegion: 'no-drag', touchAction: 'none' } as any}
            >
                <div className="flex-1 flex items-center gap-2">
                    <GripHorizontal className="w-4 h-4 text-gray-500" />
                    <span className="text-[11px] font-bold tracking-widest uppercase text-gray-300">{title}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => setIsMinimized(!isMinimized)} 
                        className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                    >
                        {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* Content Body */}
            {!isMinimized && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                    {children}
                </div>
            )}
        </motion.div>
    );
};
