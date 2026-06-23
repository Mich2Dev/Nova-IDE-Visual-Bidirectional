type CraftData = Record<string, {
  type: { resolvedName?: string } | string;
  props?: Record<string, unknown>;
  nodes?: string[];
}>;

function parseCraft(jsonString: string): CraftData | null {
  try {
    const data = JSON.parse(jsonString) as CraftData;
    if (!data['ROOT']) return null;
    return data;
  } catch {
    return null;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cssStyle(props: Record<string, string | number | undefined>): string {
  return Object.entries(props)
    .filter(([, v]) => v !== undefined && v !== '' && v !== 'none')
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${v}`)
    .join(';');
}

export const compileCraftToReact = (jsonString: string): string => {
  try {
    const data = parseCraft(jsonString);
    if (!data) return '';

    const renderNode = (nodeId: string, indent: string = '    '): string => {
      const node = data[nodeId];
      if (!node) return '';

      const type = (node.type as { resolvedName?: string })?.resolvedName || node.type;
      const props = node.props || {};
      const childrenIds = node.nodes || [];

      let propsString = '';

      if (type === 'Container') {
        const bg = props.background !== 'transparent' ? `backgroundColor: '${props.background}'` : '';
        const pad = props.padding ? `padding: '${props.padding}px'` : '';
        const radius = props.radius ? `borderRadius: '${props.radius}px'` : '';
        const width = props.width ? `width: '${props.width}'` : '';
        const height = props.height && props.height !== 'auto' ? `height: '${props.height}'` : '';
        const styleArray = [bg, pad, radius, width, height].filter(Boolean);
        if (styleArray.length > 0) propsString = ` style={{ ${styleArray.join(', ')} }}`;
      } else if (type === 'Text') {
        const color = props.color ? `color: '${props.color}'` : '';
        const fontSize = props.fontSize ? `fontSize: '${props.fontSize}px'` : '';
        const width = props.width && props.width !== 'auto' ? `width: '${props.width}'` : '';
        const height = props.height && props.height !== 'auto' ? `height: '${props.height}'` : '';
        const styleArray = [color, fontSize, width, height].filter(Boolean);
        if (styleArray.length > 0) propsString = ` style={{ ${styleArray.join(', ')} }}`;
      } else if (type === 'Button') {
        const bg = props.background ? `backgroundColor: '${props.background}'` : '';
        const color = props.color ? `color: '${props.color}'` : '';
        const padX = props.paddingX ? `paddingLeft: '${props.paddingX}px', paddingRight: '${props.paddingX}px'` : '';
        const padY = props.paddingY ? `paddingTop: '${props.paddingY}px', paddingBottom: '${props.paddingY}px'` : '';
        const radius = props.radius ? `borderRadius: '${props.radius}px'` : '';
        const border = props.variant === 'outline' ? `border: '1px solid ${props.color}'` : '';
        const width = props.full ? `width: '100%'` : props.width && props.width !== 'auto' ? `width: '${props.width}'` : '';
        const height = props.height && props.height !== 'auto' ? `height: '${props.height}'` : '';
        const styleArray = [bg, color, padX, padY, radius, border, width, height].filter(Boolean);
        if (styleArray.length > 0) propsString = ` style={{ ${styleArray.join(', ')} }}`;
      }

      const childrenJSX = childrenIds.map((id: string) => renderNode(id, indent + '  ')).join('\n');

      let tagName = 'div';
      let innerText = '';

      if (type === 'Text') {
        tagName = 'span';
        innerText = String(props.text || '');
      }
      if (type === 'Button') {
        tagName = 'button';
        innerText = String(props.text || '');
      }
      if (type === 'Image') {
        return `${indent}<img src="${props.src || ''}" alt="image" style={{ width: '${props.width || '100%'}', height: '${props.height || 'auto'}', borderRadius: '${props.radius || 0}px' }} />`;
      }
      if (type === 'Divider') {
        return `${indent}<hr style={{ borderColor: '${props.color || '#333'}', margin: '${props.marginY || 20}px 0', borderWidth: '${props.thickness || 1}px' }} />`;
      }

      if (childrenIds.length === 0 && !innerText) {
        return `${indent}<${tagName}${propsString} />`;
      }

      return `${indent}<${tagName}${propsString}>\n${innerText ? `${indent}  ${innerText}\n` : ''}${childrenJSX ? `${childrenJSX}\n` : ''}${indent}</${tagName}>`;
    };

    const innerContent = renderNode('ROOT');

    return `import React from 'react';

export default function GeneratedComponent() {
  return (
${innerContent}
  );
}
`;
  } catch (err) {
    console.error('Failed to compile Craft JSON', err);
    return '// Error compilando el diseño visual';
  }
};

export const compileCraftToHtml = (jsonString: string): string => {
  const data = parseCraft(jsonString);
  if (!data) return '<!DOCTYPE html><html><body></body></html>';

  const renderNode = (nodeId: string, indent: string = '    '): string => {
    const node = data[nodeId];
    if (!node) return '';

    const type = (node.type as { resolvedName?: string })?.resolvedName || node.type;
    const props = node.props || {};
    const childrenIds = node.nodes || [];
    const childrenHtml = childrenIds.map((id) => renderNode(id, indent + '  ')).join('\n');

    if (type === 'Container') {
      const style = cssStyle({
        background: String(props.background ?? '#ffffff'),
        padding: props.padding != null ? `${props.padding}px` : undefined,
        borderRadius: props.radius != null ? `${props.radius}px` : undefined,
        width: props.width ? String(props.width) : '100%',
        minHeight: props.height === 'auto' ? '60px' : props.height ? String(props.height) : undefined,
        height: props.height && props.height !== 'auto' ? String(props.height) : undefined,
        display: String(props.display ?? 'flex'),
        flexDirection: String(props.flexDir ?? 'column'),
        alignItems: String(props.alignItems ?? 'flex-start'),
        justifyContent: String(props.justifyContent ?? 'flex-start'),
        gap: props.gap != null ? `${props.gap}px` : undefined,
        boxShadow: props.shadow && props.shadow !== 'none' ? String(props.shadow) : undefined,
        border: props.border && props.border !== '0' ? `${props.border}px solid ${props.borderColor ?? '#e2e8f0'}` : undefined,
        boxSizing: 'border-box',
      });
      const cls = props.className ? ` class="${String(props.className).replace(/"/g, '')}"` : '';
      return `${indent}<div${cls} style="${style}">\n${childrenHtml}\n${indent}</div>`;
    }

    if (type === 'Text') {
      const tag = String(props.tag ?? 'p');
      const style = cssStyle({
        fontSize: props.fontSize != null ? `${props.fontSize}px` : undefined,
        fontWeight: props.fontWeight ? String(props.fontWeight) : undefined,
        textAlign: props.textAlign ? String(props.textAlign) : undefined,
        color: props.color ? String(props.color) : undefined,
        lineHeight: props.lineHeight != null ? String(props.lineHeight) : undefined,
        letterSpacing: props.letterSpacing != null ? `${props.letterSpacing}px` : undefined,
        fontFamily: props.fontFamily ? String(props.fontFamily) : undefined,
        fontStyle: props.italic ? 'italic' : undefined,
        textDecoration: props.underline ? 'underline' : undefined,
        width: props.width && props.width !== 'auto' ? String(props.width) : undefined,
        margin: '0',
      });
      const cls = props.className ? ` class="${String(props.className).replace(/"/g, '')}"` : '';
      return `${indent}<${tag}${cls} style="${style}">${escapeHtml(String(props.text ?? ''))}</${tag}>`;
    }

    if (type === 'Button') {
      const variant = String(props.variant ?? 'solid');
      const bg = String(props.background ?? '#6366f1');
      const style = cssStyle({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${props.paddingY ?? 12}px ${props.paddingX ?? 24}px`,
        background: variant === 'ghost' ? 'transparent' : variant === 'outline' ? 'transparent' : bg,
        color: variant === 'outline' || variant === 'ghost' ? bg : String(props.color ?? '#ffffff'),
        fontSize: props.fontSize != null ? `${props.fontSize}px` : '14px',
        fontWeight: props.fontWeight ? String(props.fontWeight) : '600',
        borderRadius: props.radius != null ? `${props.radius}px` : '8px',
        boxShadow: variant === 'solid' && props.shadow ? String(props.shadow) : undefined,
        border: variant === 'outline' ? `2px solid ${bg}` : props.border && props.border !== '0' ? `${props.border}px solid ${props.borderColor ?? 'transparent'}` : 'none',
        width: props.full ? '100%' : props.width && props.width !== 'auto' ? String(props.width) : undefined,
        height: props.height && props.height !== 'auto' ? String(props.height) : undefined,
        cursor: 'pointer',
        fontFamily: 'inherit',
      });
      return `${indent}<button type="button" style="${style}">${escapeHtml(String(props.text ?? ''))}</button>`;
    }

    if (type === 'Image') {
      const wrapStyle = cssStyle({
        width: props.width ? String(props.width) : '100%',
        height: props.height ? String(props.height) : '300px',
        borderRadius: props.radius != null ? `${props.radius}px` : undefined,
        overflow: 'hidden',
        boxShadow: props.shadow && props.shadow !== 'none' ? String(props.shadow) : undefined,
        display: 'block',
      });
      const imgStyle = cssStyle({
        width: '100%',
        height: '100%',
        objectFit: props.objectFit ? String(props.objectFit) : 'cover',
        display: 'block',
      });
      return `${indent}<div style="${wrapStyle}"><img src="${escapeHtml(String(props.src ?? ''))}" alt="${escapeHtml(String(props.alt ?? ''))}" style="${imgStyle}" /></div>`;
    }

    if (type === 'Divider') {
      const wrapStyle = cssStyle({
        margin: `${props.marginY ?? 16}px 0`,
        width: props.width ? String(props.width) : '100%',
      });
      const hrStyle = cssStyle({
        border: 'none',
        borderTop: `${props.thickness ?? 1}px ${props.style ?? 'solid'} ${props.color ?? '#e2e8f0'}`,
        margin: '0',
      });
      return `${indent}<div style="${wrapStyle}"><hr style="${hrStyle}" /></div>`;
    }

    return childrenHtml;
  };

  const body = renderNode('ROOT');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nova Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
};
