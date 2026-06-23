import type { VisualAction } from '../context/types/context.types';

let actionCounter = 0;

export function createVisualAction(
  type: VisualAction['type'],
  nodeId: string,
  nodeType: string,
  payload: Record<string, unknown> = {},
  source: VisualAction['source'] = 'craft'
): VisualAction {
  return {
    id: `action_${++actionCounter}_${Date.now()}`,
    timestamp: Date.now(),
    type,
    nodeId,
    nodeType,
    payload,
    source,
  };
}

export function summarizeActions(actions: VisualAction[]): string {
  if (actions.length === 0) return 'Sin cambios visuales en esta sesión.';

  const recent = actions.slice(-8);
  const lines = recent.map((a) => {
    const time = new Date(a.timestamp).toLocaleTimeString();
    switch (a.type) {
      case 'style_change':
        return `- [${time}] ${a.nodeType} (${a.nodeId}): estilo ${JSON.stringify(a.payload)}`;
      case 'text_change':
        return `- [${time}] ${a.nodeType} (${a.nodeId}): texto actualizado`;
      case 'add_node':
        return `- [${time}] Añadido ${a.nodeType} (${a.nodeId})`;
      case 'delete_node':
        return `- [${time}] Eliminado ${a.nodeType} (${a.nodeId})`;
      case 'graph_change':
        return `- [${time}] Cambio en el lienzo`;
      default:
        return `- [${time}] ${a.type} en ${a.nodeType} (${a.nodeId})`;
    }
  });

  const prefix =
    actions.length > recent.length
      ? `(${actions.length} cambios totales, mostrando últimos ${recent.length}):\n`
      : `(${actions.length} cambio${actions.length === 1 ? '' : 's'}):\n`;

  return prefix + lines.join('\n');
}
