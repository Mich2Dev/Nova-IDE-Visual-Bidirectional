import React from 'react';
import { useNode } from '@craftjs/core';
import { NodeControls } from './NodeControls';

interface DividerProps {
  color?: string;
  thickness?: number;
  style?: string;
  marginY?: number;
  width?: string;
}

export const Divider = ({
  color = '#e2e8f0',
  thickness = 1,
  style: lineStyle = 'solid',
  marginY = 16,
  width = '100%',
}: DividerProps) => {
  return (
    <NodeControls style={{ margin: `${marginY}px 0`, width }} resizable={{ width: true, height: false }}>
      <hr style={{
        border: 'none',
        borderTop: `${thickness}px ${lineStyle} ${color}`,
        margin: 0,
        width: '100%',
      }} />
    </NodeControls>
  );
};

export const DividerSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({ props: node.data.props }));

  const label = (t: string) => (
    <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t}</label>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0f172a', border: '1px solid #1e293b',
    color: '#e2e8f0', borderRadius: 6, padding: '5px 8px', fontSize: 12, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        {label('Color')}
        <input type="color" value={props.color || '#e2e8f0'} onChange={(e) => setProp((p: any) => p.color = e.target.value)}
          style={{ width: '100%', height: 32, borderRadius: 6, border: '1px solid #1e293b', cursor: 'pointer', padding: 2 }} />
      </div>
      <div>
        {label(`Grosor: ${props.thickness ?? 1}px`)}
        <input type="range" min="1" max="10" value={props.thickness ?? 1} onChange={(e) => setProp((p: any) => p.thickness = +e.target.value)} style={{ width: '100%', accentColor: '#6366f1' }} />
      </div>
      <div>
        {label('Estilo')}
        <select value={props.style || 'solid'} onChange={(e) => setProp((p: any) => p.style = e.target.value)} style={inputStyle}>
          <option value="solid">Sólido</option>
          <option value="dashed">Guiones</option>
          <option value="dotted">Puntos</option>
        </select>
      </div>
      <div>
        {label(`Margen vertical: ${props.marginY ?? 16}px`)}
        <input type="range" min="0" max="80" value={props.marginY ?? 16} onChange={(e) => setProp((p: any) => p.marginY = +e.target.value)} style={{ width: '100%', accentColor: '#6366f1' }} />
      </div>
    </div>
  );
};

Divider.craft = {
  displayName: 'Separador',
  props: { color: '#e2e8f0', thickness: 1, style: 'solid', marginY: 16, width: '100%' },
  related: { settings: DividerSettings },
  rules: {
    canDrag: () => true,
    canDrop: () => false,
  },
};
