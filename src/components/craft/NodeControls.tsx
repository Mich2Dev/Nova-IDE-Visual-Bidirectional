import React, { useCallback, useRef, useState } from 'react';
import { useNode } from '@craftjs/core';
import { useDraftStore } from '../../draft/useDraftStore';
import { useStore } from '../../store/useStore';

type ResizeDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const HANDLES: { dir: ResizeDir; cursor: string; style: React.CSSProperties }[] = [
  { dir: 'se', cursor: 'nwse-resize', style: { bottom: 2, right: 2 } },
  { dir: 'e', cursor: 'ew-resize', style: { top: '50%', right: 2, transform: 'translateY(-50%)' } },
  { dir: 's', cursor: 'ns-resize', style: { bottom: 2, left: '50%', transform: 'translateX(-50%)' } },
];

export interface NodeControlsProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  resizable?: boolean | { width?: boolean; height?: boolean };
  widthKey?: string;
  heightKey?: string;
}

export const NodeControls: React.FC<NodeControlsProps> = ({
  children,
  style,
  className = '',
  resizable = true,
  widthKey = 'width',
  heightKey = 'height',
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [liveSize, setLiveSize] = useState<{ w: number; h: number } | null>(null);

  const {
    connectors: { connect, drag },
    isSelected,
    isHovered,
    actions: { setProp },
    displayName,
  } = useNode((node) => ({
    isSelected: node.events.selected,
    isHovered: node.events.hovered,
    displayName: String(node.data.displayName ?? node.data.name ?? 'Elemento'),
  }));

  const canResizeW = resizable === true || (typeof resizable === 'object' && resizable.width !== false);
  const canResizeH = resizable === true || (typeof resizable === 'object' && resizable.height !== false);

  const markTouched = useCallback(() => {
    const activeTabId = useStore.getState().activeTabId;
    if (activeTabId) useDraftStore.getState().markUserTouchedVisual(activeTabId);
  }, []);

  const startResize = useCallback(
    (e: React.PointerEvent, dir: ResizeDir) => {
      e.stopPropagation();
      e.preventDefault();
      markTouched();
      const el = wrapperRef.current;
      if (!el) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = el.offsetWidth;
      const startH = el.offsetHeight;

      setLiveSize({ w: startW, h: startH });

      const onMove = (ev: PointerEvent) => {
        let w = startW;
        let h = startH;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        if (canResizeW && dir.includes('e')) w = startW + dx;
        if (canResizeH && dir.includes('s')) h = startH + dy;

        w = Math.max(24, Math.round(w));
        h = Math.max(24, Math.round(h));
        setLiveSize({ w, h });

        setProp((props: Record<string, unknown>) => {
          if (canResizeW) props[widthKey] = `${w}px`;
          if (canResizeH) props[heightKey] = `${h}px`;
        });
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        setTimeout(() => setLiveSize(null), 800);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [canResizeH, canResizeW, heightKey, markTouched, setProp, widthKey]
  );

  const visibleHandles = HANDLES.filter((h) => {
    if ((h.dir.includes('e') || h.dir.includes('w')) && !canResizeW) return false;
    if ((h.dir.includes('n') || h.dir.includes('s')) && !canResizeH) return false;
    return true;
  });

  return (
    <div
      ref={(ref) => {
        wrapperRef.current = ref;
        if (ref) connect(drag(ref));
      }}
      style={{
        position: 'relative',
        boxSizing: 'border-box',
        outline: isSelected
          ? '2px solid #6366f1'
          : isHovered
            ? '1px solid #60a5fa'
            : undefined,
        outlineOffset: isSelected ? 2 : 1,
        ...style,
      }}
      className={className}
      title={isHovered || isSelected ? displayName : undefined}
    >
      {isSelected && resizable !== false &&
        visibleHandles.map((h) => (
          <div
            key={h.dir}
            role="presentation"
            onPointerDown={(e) => startResize(e, h.dir)}
            className="absolute z-10 h-2 w-2 rounded-sm border border-white bg-indigo-500 shadow"
            style={{ ...h.style, cursor: h.cursor, pointerEvents: 'auto' }}
          />
        ))}

      {isSelected && liveSize && (
        <div className="pointer-events-none absolute bottom-1 right-1 z-10 rounded bg-gray-900/90 px-1 py-0.5 text-[9px] font-mono text-white">
          {liveSize.w} × {liveSize.h}
        </div>
      )}

      {children}
    </div>
  );
};
