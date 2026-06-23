import React, { useState, useEffect } from 'react';
import { useNode } from '@craftjs/core';
import { NodeControls } from './NodeControls';

interface TextProps {
  text?: string;
  tag?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: string;
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
  fontFamily?: string;
  italic?: boolean;
  underline?: boolean;
  width?: string;
  height?: string;
  className?: string;
}

export const Text = ({
  text = 'Haz clic doble para editar',
  tag = 'p',
  fontSize = 16,
  fontWeight = '400',
  textAlign = 'left',
  color = '#1e293b',
  lineHeight = 1.5,
  letterSpacing = 0,
  fontFamily = 'inherit',
  italic = false,
  underline = false,
  width = 'auto',
  height = 'auto',
  className = '',
}: TextProps) => {
  const { isSelected, actions: { setProp } } = useNode((node) => ({
    isSelected: node.events.selected,
  }));

  const [editable, setEditable] = useState(false);

  useEffect(() => {
    if (!isSelected) setEditable(false);
  }, [isSelected]);

  const Tag = tag as React.ElementType;

  return (
    <NodeControls
      style={{
        width,
        height: height === 'auto' ? 'auto' : height,
        minHeight: height === 'auto' ? undefined : height,
        display: 'block',
        maxWidth: '100%',
      }}
    >
      <Tag
        className={className}
        onClick={() => { if (isSelected) setEditable(true); }}
        onBlur={(e: React.FocusEvent<HTMLElement>) => {
          setProp((props: Record<string, unknown>) => { props.text = e.currentTarget.innerText; });
          setEditable(false);
        }}
        contentEditable={editable}
        suppressContentEditableWarning
        style={{
          fontSize: `${fontSize}px`,
          fontWeight,
          textAlign: textAlign as React.CSSProperties['textAlign'],
          color,
          lineHeight,
          letterSpacing: `${letterSpacing}px`,
          fontFamily,
          fontStyle: italic ? 'italic' : 'normal',
          textDecoration: underline ? 'underline' : 'none',
          outline: editable ? '2px dashed #6366f1' : 'none',
          borderRadius: 2,
          padding: '2px 4px',
          margin: 0,
          cursor: editable ? 'text' : 'default',
          minWidth: 20,
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          display: 'block',
        }}
      >
        {text}
      </Tag>
    </NodeControls>
  );
};

export const TextSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({ props: node.data.props }));

  const label = (text: string) => (
    <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {text}
    </label>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0f172a', border: '1px solid #1e293b',
    color: '#e2e8f0', borderRadius: 6, padding: '5px 8px', fontSize: 12,
    outline: 'none', boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Content */}
      <div>
        {label('Contenido')}
        <textarea value={props.text} onChange={(e) => setProp((p: any) => p.text = e.target.value)}
          style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
      </div>

      {/* Tag */}
      <div>
        {label('Tipo')}
        <select value={props.tag || 'p'} onChange={(e) => setProp((p: any) => p.tag = e.target.value)} style={selectStyle}>
          <option value="h1">H1 — Título Principal</option>
          <option value="h2">H2 — Subtítulo</option>
          <option value="h3">H3 — Sección</option>
          <option value="h4">H4</option>
          <option value="p">Párrafo</option>
          <option value="span">Inline</option>
        </select>
      </div>

      {/* Color & Family */}
      <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 8, alignItems: 'end' }}>
        <div>
          {label('Color')}
          <input type="color" value={props.color || '#1e293b'} onChange={(e) => setProp((p: any) => p.color = e.target.value)}
            style={{ width: '100%', height: 28, borderRadius: 6, border: '1px solid #1e293b', cursor: 'pointer', padding: 2 }} />
        </div>
        <div>
          {label('Fuente')}
          <select value={props.fontFamily || 'inherit'} onChange={(e) => setProp((p: any) => p.fontFamily = e.target.value)} style={selectStyle}>
            <option value="inherit">Por defecto</option>
            <option value="'Inter', sans-serif">Inter</option>
            <option value="'Georgia', serif">Georgia</option>
            <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
            <option value="'Playfair Display', serif">Playfair Display</option>
          </select>
        </div>
      </div>

      {/* Size & Weight */}
      <div>
        {label(`Tamaño: ${props.fontSize ?? 16}px`)}
        <input type="range" min="8" max="120" value={props.fontSize ?? 16} onChange={(e) => setProp((p: any) => p.fontSize = +e.target.value)}
          style={{ width: '100%', accentColor: '#6366f1' }} />
      </div>

      <div>
        {label('Peso')}
        <select value={props.fontWeight || '400'} onChange={(e) => setProp((p: any) => p.fontWeight = e.target.value)} style={selectStyle}>
          <option value="300">300 — Light</option>
          <option value="400">400 — Regular</option>
          <option value="500">500 — Medium</option>
          <option value="600">600 — Semibold</option>
          <option value="700">700 — Bold</option>
          <option value="800">800 — Extrabold</option>
          <option value="900">900 — Black</option>
        </select>
      </div>

      {/* Alignment */}
      <div>
        {label('Alineación')}
        <div style={{ display: 'flex', gap: 4 }}>
          {['left', 'center', 'right', 'justify'].map((align) => (
            <button
              key={align}
              onClick={() => setProp((p: any) => p.textAlign = align)}
              style={{
                flex: 1, padding: '4px 2px', borderRadius: 5, fontSize: 10,
                border: '1px solid', cursor: 'pointer',
                borderColor: props.textAlign === align ? '#6366f1' : '#1e293b',
                background: props.textAlign === align ? '#6366f1' : '#0f172a',
                color: props.textAlign === align ? '#fff' : '#94a3b8',
              }}
            >
              {align === 'left' ? '⬅' : align === 'center' ? '↔' : align === 'right' ? '➡' : '☰'}
            </button>
          ))}
        </div>
      </div>

      {/* Line height & letter spacing */}
      <div>
        {label(`Altura de línea: ${props.lineHeight ?? 1.5}`)}
        <input type="range" min="0.8" max="3" step="0.05" value={props.lineHeight ?? 1.5} onChange={(e) => setProp((p: any) => p.lineHeight = +e.target.value)}
          style={{ width: '100%', accentColor: '#6366f1' }} />
      </div>

      <div>
        {label(`Espaciado letras: ${props.letterSpacing ?? 0}px`)}
        <input type="range" min="-2" max="20" step="0.5" value={props.letterSpacing ?? 0} onChange={(e) => setProp((p: any) => p.letterSpacing = +e.target.value)}
          style={{ width: '100%', accentColor: '#6366f1' }} />
      </div>

      {/* Style toggles */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setProp((p: any) => p.italic = !p.italic)}
          style={{ flex: 1, padding: '5px', borderRadius: 5, fontSize: 12, fontStyle: 'italic', cursor: 'pointer',
            border: '1px solid', borderColor: props.italic ? '#6366f1' : '#1e293b',
            background: props.italic ? '#6366f1' : '#0f172a', color: props.italic ? '#fff' : '#94a3b8' }}>
          I
        </button>
        <button onClick={() => setProp((p: any) => p.underline = !p.underline)}
          style={{ flex: 1, padding: '5px', borderRadius: 5, fontSize: 12, textDecoration: 'underline', cursor: 'pointer',
            border: '1px solid', borderColor: props.underline ? '#6366f1' : '#1e293b',
            background: props.underline ? '#6366f1' : '#0f172a', color: props.underline ? '#fff' : '#94a3b8' }}>
          U
        </button>
      </div>
    </div>
  );
};

Text.craft = {
  displayName: 'Texto',
  props: {
    text: 'Escribe algo aquí',
    tag: 'p',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'left',
    color: '#1e293b',
    lineHeight: 1.5,
    letterSpacing: 0,
    fontFamily: 'inherit',
    italic: false,
    underline: false,
    width: 'auto',
    height: 'auto',
  },
  rules: {
    canDrag: () => true,
    canDrop: () => false,
  },
  related: {
    settings: TextSettings,
  },
};
