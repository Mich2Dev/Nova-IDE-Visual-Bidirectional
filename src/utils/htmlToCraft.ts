export const htmlToCraft = (code: string): string => {
  try {
    let htmlContent = code;

    // Simple heuristic to extract JSX/HTML from a React file
    // Finds the first tag and the last tag
    const firstTagIndex = code.indexOf('<');
    const lastTagIndex = code.lastIndexOf('>');
    
    if (firstTagIndex !== -1 && lastTagIndex !== -1 && lastTagIndex > firstTagIndex) {
      htmlContent = code.substring(firstTagIndex, lastTagIndex + 1);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    const nodes: Record<string, any> = {};
    let idCounter = 1;

    const generateId = () => `node_${idCounter++}`;

    const parseNode = (domNode: Node, parentId: string | null): string | null => {
      // Ignorar comentarios y nodos de texto vacíos
      if (domNode.nodeType === Node.COMMENT_NODE) return null;
      if (domNode.nodeType === Node.TEXT_NODE) {
        const text = domNode.textContent?.trim();
        if (!text) return null;
        
        // Si es texto suelto, lo envolvemos en un componente Text
        const id = generateId();
        nodes[id] = {
          type: { resolvedName: 'Text' },
          isCanvas: false,
          props: { text },
          displayName: 'Text',
          custom: {},
          hidden: false,
          nodes: [],
          linkedNodes: {},
          parent: parentId
        };
        return id;
      }

      if (domNode.nodeType !== Node.ELEMENT_NODE) return null;

      const element = domNode as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      
      const id = parentId === null ? 'ROOT' : generateId();
      let resolvedName = 'Container';
      let props: any = { className: element.className || '' };
      let isCanvas = false;

      // Extract inline styles roughly
      if (element.style.backgroundColor) props.background = element.style.backgroundColor;
      if (element.style.padding) props.padding = parseInt(element.style.padding) || 0;
      if (element.style.color) props.color = element.style.color;

      // Map tags to Craft.js components
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'strong', 'em', 'label'].includes(tagName)) {
        resolvedName = 'Text';
        props.text = Array.from(element.childNodes)
          .filter(n => n.nodeType === Node.TEXT_NODE)
          .map(n => n.textContent)
          .join(' ')
          .trim() || element.textContent?.trim();
          
        if (tagName === 'h1') props.fontSize = 32;
        if (tagName === 'h2') props.fontSize = 24;
        if (tagName === 'p') props.fontSize = 16;
      } else if (tagName === 'button' || tagName === 'a') {
        resolvedName = 'Button';
        props.text = element.textContent?.trim();
      } else if (tagName === 'img') {
        resolvedName = 'Image';
        props.src = element.getAttribute('src') || '';
      } else if (tagName === 'hr') {
        resolvedName = 'Divider';
      } else {
        // div, section, header, footer, nav, ul, li, etc.
        resolvedName = 'Container';
        isCanvas = true; // Containers in Craft.js act as canvas for drops
      }

      nodes[id] = {
        type: { resolvedName },
        isCanvas,
        props,
        displayName: resolvedName,
        custom: {},
        hidden: false,
        nodes: [],
        linkedNodes: {},
        parent: parentId
      };

      // Procesar hijos recursivamente
      if (resolvedName === 'Container') {
        const childIds: string[] = [];
        Array.from(element.childNodes).forEach(child => {
          const childId = parseNode(child, id);
          if (childId) childIds.push(childId);
        });
        nodes[id].nodes = childIds;
      }

      return id;
    };

    // ROOT contenedor con todos los hijos del body (header, main, footer, etc.)
    nodes['ROOT'] = {
      type: { resolvedName: 'Container' },
      isCanvas: true,
      props: { padding: 0, width: '100%', background: '#ffffff' },
      displayName: 'Contenedor',
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
      parent: null,
    };

    Array.from(doc.body.childNodes).forEach((child) => {
      const childId = parseNode(child, 'ROOT');
      if (childId && childId !== 'ROOT') {
        nodes['ROOT'].nodes.push(childId);
      }
    });

    if (nodes['ROOT'].nodes.length === 0) {
      delete nodes['ROOT'];
      parseNode(doc.body, null);
    }

    if (!nodes['ROOT']) {
       nodes['ROOT'] = {
          type: { resolvedName: 'Container' },
          isCanvas: true,
          props: { padding: 20 },
          displayName: 'Container',
          custom: {},
          hidden: false,
          nodes: [],
          linkedNodes: {},
          parent: null
       };
    }

    return JSON.stringify(nodes);
  } catch (error) {
    console.error('Error parsing HTML to Craft.js state:', error);
    return '';
  }
};
