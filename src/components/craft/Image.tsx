import React from 'react';
import { useNode } from '@craftjs/core';
import { NodeControls } from './NodeControls';

interface ImageProps {
  src?: string;
  alt?: string;
  width?: string;
  height?: string;
  radius?: number;
  objectFit?: string;
  shadow?: string;
}

export const Image = ({
  src = 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80',
  alt = 'Imagen',
  width = '100%',
  height = '300px',
  radius = 8,
  objectFit = 'cover',
  shadow = 'none',
}: ImageProps) => {
  return (
    <NodeControls
      style={{
        width,
        height,
        borderRadius: `${radius}px`,
        overflow: 'hidden',
        boxShadow: shadow,
        display: 'block',
        flexShrink: 0,
      }}
    >
      <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: objectFit as React.CSSProperties['objectFit'], display: 'block' }} />
    </NodeControls>
  );
};

export const ImageSettings = () => {
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
        {label('URL de la imagen')}
        <input type="text" value={props.src || ''} onChange={(e) => setProp((p: any) => p.src = e.target.value)} style={inputStyle} placeholder="https://..." />
      </div>
      <div>
        {label('Texto alternativo')}
        <input type="text" value={props.alt || ''} onChange={(e) => setProp((p: any) => p.alt = e.target.value)} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>{label('Ancho')}<input type="text" value={props.width || '100%'} onChange={(e) => setProp((p: any) => p.width = e.target.value)} style={inputStyle} /></div>
        <div>{label('Alto')}<input type="text" value={props.height || '300px'} onChange={(e) => setProp((p: any) => p.height = e.target.value)} style={inputStyle} /></div>
      </div>
      <div>
        {label(`Radio: ${props.radius ?? 8}px`)}
        <input type="range" min="0" max="100" value={props.radius ?? 8} onChange={(e) => setProp((p: any) => p.radius = +e.target.value)} style={{ width: '100%', accentColor: '#6366f1' }} />
      </div>
      <div>
        {label('Ajuste de imagen')}
        <select value={props.objectFit || 'cover'} onChange={(e) => setProp((p: any) => p.objectFit = e.target.value)} style={inputStyle}>
          <option value="cover">Cover (rellena)</option>
          <option value="contain">Contain (completa)</option>
          <option value="fill">Fill (estira)</option>
          <option value="none">None (original)</option>
        </select>
      </div>
      <div>
        {label('Sombra')}
        <select value={props.shadow || 'none'} onChange={(e) => setProp((p: any) => p.shadow = e.target.value)} style={inputStyle}>
          <option value="none">Ninguna</option>
          <option value="0 4px 12px rgba(0,0,0,0.15)">Mediana</option>
          <option value="0 10px 40px rgba(0,0,0,0.25)">Grande</option>
        </select>
      </div>
    </div>
  );
};

Image.craft = {
  displayName: 'Imagen',
  props: {
    src: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80',
    alt: 'Imagen',
    width: '100%',
    height: '300px',
    radius: 8,
    objectFit: 'cover',
    shadow: 'none',
  },
  related: { settings: ImageSettings },
  rules: {
    canDrag: () => true,
    canDrop: () => false,
  },
};
