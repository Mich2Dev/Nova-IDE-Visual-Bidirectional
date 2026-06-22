import React from 'react';
import { useNode } from '@craftjs/core';

interface ContainerProps {
  background?: string;
  padding?: number;
  radius?: number;
  width?: string;
  height?: string;
  display?: string;
  flexDir?: string;
  alignItems?: string;
  justifyContent?: string;
  gap?: number;
  shadow?: string;
  border?: string;
  borderColor?: string;
  children?: React.ReactNode;
  className?: string;
}

export const Container = ({
  background = '#ffffff',
  padding = 20,
  radius = 8,
  width = '100%',
  height = 'auto',
  display = 'flex',
  flexDir = 'column',
  alignItems = 'flex-start',
  justifyContent = 'flex-start',
  gap = 0,
  shadow = 'none',
  border = '0',
  borderColor = '#e2e8f0',
  children,
  className = '',
}: ContainerProps) => {
  const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
    isSelected: node.events.selected,
  }));

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        background,
        padding: `${padding}px`,
        borderRadius: `${radius}px`,
        width,
        minHeight: height === 'auto' ? '60px' : height,
        display,
        flexDirection: flexDir as any,
        alignItems,
        justifyContent,
        gap: `${gap}px`,
        boxShadow: shadow,
        border: border !== '0' ? `${border}px solid ${borderColor}` : undefined,
        position: 'relative',
        boxSizing: 'border-box',
        transition: 'outline 0.1s',
      }}
      className={`${isSelected ? 'outline outline-2 outline-blue-500' : 'outline outline-1 outline-transparent hover:outline-blue-300'} ${className}`}
    >
      {children}
      {!children && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'system-ui', fontStyle: 'italic' }}>
            Soltar componentes aquí
          </span>
        </div>
      )}
    </div>
  );
};

export const ContainerSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({ props: node.data.props }));

  const label = (text: string) => (
    <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {text}
    </label>
  );

  const row = (children: React.ReactNode) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{children}</div>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0f172a', border: '1px solid #1e293b',
    color: '#e2e8f0', borderRadius: 6, padding: '5px 8px', fontSize: 12,
    outline: 'none', boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '2px 0' }}>
      {/* Background */}
      <div>
        {label('Fondo')}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="color" value={props.background || '#ffffff'} onChange={(e) => setProp((p: any) => p.background = e.target.value)}
            style={{ width: 32, height: 28, borderRadius: 6, border: '1px solid #1e293b', cursor: 'pointer', background: 'none', padding: 2 }} />
          <input type="text" value={props.background || '#ffffff'} onChange={(e) => setProp((p: any) => p.background = e.target.value)}
            style={{ ...inputStyle, flex: 1 }} />
        </div>
      </div>

      {/* Size */}
      {row(<>
        <div>
          {label('Ancho')}
          <input type="text" value={props.width || '100%'} onChange={(e) => setProp((p: any) => p.width = e.target.value)} style={inputStyle} />
        </div>
        <div>
          {label('Alto')}
          <input type="text" value={props.height || 'auto'} onChange={(e) => setProp((p: any) => p.height = e.target.value)} style={inputStyle} />
        </div>
      </>)}

      {/* Padding & Radius */}
      {row(<>
        <div>
          {label('Padding')}
          <input type="number" value={props.padding ?? 20} onChange={(e) => setProp((p: any) => p.padding = +e.target.value)} style={inputStyle} />
        </div>
        <div>
          {label('Radio')}
          <input type="number" value={props.radius ?? 8} onChange={(e) => setProp((p: any) => p.radius = +e.target.value)} style={inputStyle} />
        </div>
      </>)}

      {/* Flex */}
      <div>
        {label('Dirección')}
        <select value={props.flexDir || 'column'} onChange={(e) => setProp((p: any) => p.flexDir = e.target.value)} style={selectStyle}>
          <option value="column">Columna (vertical)</option>
          <option value="row">Fila (horizontal)</option>
          <option value="row-reverse">Fila inversa</option>
          <option value="column-reverse">Columna inversa</option>
        </select>
      </div>

      {row(<>
        <div>
          {label('Alinear')}
          <select value={props.alignItems || 'flex-start'} onChange={(e) => setProp((p: any) => p.alignItems = e.target.value)} style={selectStyle}>
            <option value="flex-start">Inicio</option>
            <option value="center">Centro</option>
            <option value="flex-end">Fin</option>
            <option value="stretch">Expandir</option>
          </select>
        </div>
        <div>
          {label('Justificar')}
          <select value={props.justifyContent || 'flex-start'} onChange={(e) => setProp((p: any) => p.justifyContent = e.target.value)} style={selectStyle}>
            <option value="flex-start">Inicio</option>
            <option value="center">Centro</option>
            <option value="flex-end">Fin</option>
            <option value="space-between">Entre</option>
            <option value="space-around">Alrededor</option>
          </select>
        </div>
      </>)}

      {/* Gap */}
      <div>
        {label(`Espacio entre elementos: ${props.gap ?? 0}px`)}
        <input type="range" min="0" max="80" value={props.gap ?? 0} onChange={(e) => setProp((p: any) => p.gap = +e.target.value)}
          style={{ width: '100%', accentColor: '#6366f1' }} />
      </div>

      {/* Shadow */}
      <div>
        {label('Sombra')}
        <select value={props.shadow || 'none'} onChange={(e) => setProp((p: any) => p.shadow = e.target.value)} style={selectStyle}>
          <option value="none">Ninguna</option>
          <option value="0 1px 3px rgba(0,0,0,0.12)">Pequeña</option>
          <option value="0 4px 12px rgba(0,0,0,0.15)">Mediana</option>
          <option value="0 10px 40px rgba(0,0,0,0.2)">Grande</option>
          <option value="0 25px 60px rgba(0,0,0,0.35)">Enorme</option>
        </select>
      </div>

      {/* Border */}
      {row(<>
        <div>
          {label('Borde (px)')}
          <input type="number" value={props.border ?? 0} min={0} max={20} onChange={(e) => setProp((p: any) => p.border = e.target.value)} style={inputStyle} />
        </div>
        <div>
          {label('Color borde')}
          <input type="color" value={props.borderColor || '#e2e8f0'} onChange={(e) => setProp((p: any) => p.borderColor = e.target.value)}
            style={{ width: '100%', height: 28, borderRadius: 6, border: '1px solid #1e293b', cursor: 'pointer', padding: 2 }} />
        </div>
      </>)}
    </div>
  );
};

Container.craft = {
  displayName: 'Contenedor',
  props: {
    background: '#ffffff',
    padding: 20,
    radius: 8,
    width: '100%',
    height: 'auto',
    display: 'flex',
    flexDir: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: 0,
    shadow: 'none',
    border: '0',
    borderColor: '#e2e8f0',
  },
  rules: {
    canDrop: () => true,
    canDrag: () => true,
  },
  related: {
    settings: ContainerSettings,
  },
};
