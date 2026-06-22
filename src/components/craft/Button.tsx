import React from 'react';
import { useNode } from '@craftjs/core';

interface ButtonProps {
  text?: string;
  background?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  paddingX?: number;
  paddingY?: number;
  radius?: number;
  shadow?: string;
  border?: string;
  borderColor?: string;
  full?: boolean;
  variant?: string;
  href?: string;
}

export const Button = ({
  text = 'Haz clic aquí',
  background = '#6366f1',
  color = '#ffffff',
  fontSize = 14,
  fontWeight = '600',
  paddingX = 24,
  paddingY = 12,
  radius = 8,
  shadow = '0 4px 14px rgba(99,102,241,0.4)',
  border = '0',
  borderColor = 'transparent',
  full = false,
  variant = 'solid',
}: ButtonProps) => {
  const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
    isSelected: node.events.selected,
  }));

  const styles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${paddingY}px ${paddingX}px`,
    background: variant === 'ghost' ? 'transparent' : variant === 'outline' ? 'transparent' : background,
    color: variant === 'outline' ? background : variant === 'ghost' ? background : color,
    fontSize: `${fontSize}px`,
    fontWeight,
    borderRadius: `${radius}px`,
    boxShadow: variant === 'solid' ? shadow : 'none',
    border: variant === 'solid' ? (border !== '0' ? `${border}px solid ${borderColor}` : 'none') : `2px solid ${background}`,
    cursor: 'pointer',
    width: full ? '100%' : 'auto',
    outline: isSelected ? '2px solid #3b82f6' : '1px solid transparent',
    outlineOffset: 3,
    transition: 'all 0.2s',
    userSelect: 'none',
    fontFamily: 'inherit',
    letterSpacing: '0.01em',
  };

  return (
    <button
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={styles}
    >
      {text}
    </button>
  );
};

export const ButtonSettings = () => {
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
        {label('Texto')}
        <input type="text" value={props.text || ''} onChange={(e) => setProp((p: any) => p.text = e.target.value)} style={inputStyle} />
      </div>

      <div>
        {label('Variante')}
        <div style={{ display: 'flex', gap: 4 }}>
          {['solid', 'outline', 'ghost'].map((v) => (
            <button key={v} onClick={() => setProp((p: any) => p.variant = v)} style={{
              flex: 1, padding: '5px 2px', borderRadius: 5, fontSize: 10, cursor: 'pointer', border: '1px solid',
              borderColor: props.variant === v ? '#6366f1' : '#1e293b',
              background: props.variant === v ? '#6366f1' : '#0f172a',
              color: props.variant === v ? '#fff' : '#94a3b8', textTransform: 'capitalize',
            }}>{v}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 8, alignItems: 'end' }}>
        <div>
          {label('Fondo')}
          <input type="color" value={props.background || '#6366f1'} onChange={(e) => setProp((p: any) => p.background = e.target.value)}
            style={{ width: '100%', height: 28, borderRadius: 6, border: '1px solid #1e293b', cursor: 'pointer', padding: 2 }} />
        </div>
        <div>
          {label('Texto Color')}
          <input type="color" value={props.color || '#ffffff'} onChange={(e) => setProp((p: any) => p.color = e.target.value)}
            style={{ width: '100%', height: 28, borderRadius: 6, border: '1px solid #1e293b', cursor: 'pointer', padding: 2 }} />
        </div>
      </div>

      <div>
        {label(`Tamaño fuente: ${props.fontSize ?? 14}px`)}
        <input type="range" min="10" max="32" value={props.fontSize ?? 14} onChange={(e) => setProp((p: any) => p.fontSize = +e.target.value)} style={{ width: '100%', accentColor: '#6366f1' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          {label(`Pad H: ${props.paddingX ?? 24}px`)}
          <input type="range" min="0" max="80" value={props.paddingX ?? 24} onChange={(e) => setProp((p: any) => p.paddingX = +e.target.value)} style={{ width: '100%', accentColor: '#6366f1' }} />
        </div>
        <div>
          {label(`Pad V: ${props.paddingY ?? 12}px`)}
          <input type="range" min="0" max="40" value={props.paddingY ?? 12} onChange={(e) => setProp((p: any) => p.paddingY = +e.target.value)} style={{ width: '100%', accentColor: '#6366f1' }} />
        </div>
      </div>

      <div>
        {label(`Radio: ${props.radius ?? 8}px`)}
        <input type="range" min="0" max="50" value={props.radius ?? 8} onChange={(e) => setProp((p: any) => p.radius = +e.target.value)} style={{ width: '100%', accentColor: '#6366f1' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={props.full || false} onChange={(e) => setProp((p: any) => p.full = e.target.checked)} style={{ accentColor: '#6366f1', width: 14, height: 14 }} id="btn-full" />
        <label htmlFor="btn-full" style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }}>Ancho completo</label>
      </div>
    </div>
  );
};

Button.craft = {
  displayName: 'Botón',
  props: {
    text: 'Haz clic aquí',
    background: '#6366f1',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    paddingX: 24,
    paddingY: 12,
    radius: 8,
    shadow: '0 4px 14px rgba(99,102,241,0.4)',
    variant: 'solid',
    full: false,
  },
  related: { settings: ButtonSettings },
};
