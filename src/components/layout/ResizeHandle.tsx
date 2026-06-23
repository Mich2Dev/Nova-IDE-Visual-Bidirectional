import React from 'react';

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  className?: string;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  direction,
  onResize,
  className = '',
}) => {
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let last = direction === 'horizontal' ? e.clientX : e.clientY;

    const onMove = (ev: PointerEvent) => {
      const current = direction === 'horizontal' ? ev.clientX : ev.clientY;
      const delta = current - last;
      last = current;
      if (delta !== 0) onResize(delta);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      role="separator"
      aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'}
      onPointerDown={onPointerDown}
      className={
        direction === 'horizontal'
          ? `w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-indigo-500/40 active:bg-indigo-500/60 transition-colors ${className}`
          : `h-1 shrink-0 cursor-row-resize bg-transparent hover:bg-indigo-500/40 active:bg-indigo-500/60 transition-colors ${className}`
      }
    />
  );
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export { clamp };
