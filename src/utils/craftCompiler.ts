export const compileCraftToReact = (jsonString: string): string => {
  try {
    const data = JSON.parse(jsonString);
    const rootNode = data['ROOT'];
    if (!rootNode) return '';

    const renderNode = (nodeId: string, indent: string = '    '): string => {
      const node = data[nodeId];
      if (!node) return '';

      const type = node.type.resolvedName || node.type;
      const props = node.props || {};
      const childrenIds = node.nodes || [];

      // Convert props to JSX string
      let propsString = '';
      
      if (type === 'Container') {
        const bg = props.background !== 'transparent' ? `backgroundColor: '${props.background}'` : '';
        const pad = props.padding ? `padding: '${props.padding}px'` : '';
        const radius = props.radius ? `borderRadius: '${props.radius}px'` : '';
        
        const styleArray = [bg, pad, radius].filter(Boolean);
        if (styleArray.length > 0) {
          propsString = ` style={{ ${styleArray.join(', ')} }}`;
        }
      } else if (type === 'Text') {
        const color = props.color ? `color: '${props.color}'` : '';
        const fontSize = props.fontSize ? `fontSize: '${props.fontSize}px'` : '';
        
        const styleArray = [color, fontSize].filter(Boolean);
        if (styleArray.length > 0) {
          propsString = ` style={{ ${styleArray.join(', ')} }}`;
        }
      } else if (type === 'Button') {
        const bg = props.background ? `backgroundColor: '${props.background}'` : '';
        const color = props.color ? `color: '${props.color}'` : '';
        const padX = props.paddingX ? `paddingLeft: '${props.paddingX}px', paddingRight: '${props.paddingX}px'` : '';
        const padY = props.paddingY ? `paddingTop: '${props.paddingY}px', paddingBottom: '${props.paddingY}px'` : '';
        const radius = props.radius ? `borderRadius: '${props.radius}px'` : '';
        const border = props.variant === 'outline' ? `border: '1px solid ${props.color}'` : '';
        
        const styleArray = [bg, color, padX, padY, radius, border].filter(Boolean);
        if (styleArray.length > 0) {
          propsString = ` style={{ ${styleArray.join(', ')} }}`;
        }
      }

      // Handle self-closing or children
      const childrenJSX = childrenIds.map((id: string) => renderNode(id, indent + '  ')).join('\n');
      
      let tagName = 'div';
      let innerText = '';
      
      if (type === 'Container') tagName = 'div';
      if (type === 'Text') {
        tagName = 'span';
        innerText = props.text || '';
      }
      if (type === 'Button') {
        tagName = 'button';
        innerText = props.text || '';
      }
      if (type === 'Image') {
        return `${indent}<img src="${props.src || ''}" alt="image" style={{ width: '${props.width || '100%'}', height: '${props.height || 'auto'}', borderRadius: '${props.radius || 0}px' }} />`;
      }
      if (type === 'Divider') {
        return `${indent}<hr style={{ borderColor: '${props.color || '#333'}', margin: '${props.margin || 20}px 0', borderWidth: '${props.thickness || 1}px' }} />`;
      }

      if (childrenIds.length === 0 && !innerText) {
        return `${indent}<${tagName}${propsString} />`;
      }

      return `${indent}<${tagName}${propsString}>\n${innerText ? indent + '  ' + innerText + '\n' : ''}${childrenJSX ? childrenJSX + '\n' : ''}${indent}</${tagName}>`;
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
