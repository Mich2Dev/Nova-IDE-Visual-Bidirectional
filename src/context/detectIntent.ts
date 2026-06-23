import type { ContextIntent } from './types/context.types';

const VISUAL_KEYWORDS = [
  'más grande', 'más pequeño', 'color', 'botón', 'boton', 'diseño', 'diseno',
  'visual', 'mover', 'alinear', 'padding', 'margin', 'fuente', 'tamaño', 'tamano',
  'centrar', 'borde', 'sombra', 'layout', 'ui', 'interfaz', 'componente',
];

const DEBUG_KEYWORDS = [
  'error', 'bug', 'falla', 'no funciona', 'arregla', 'debug', 'consola', 'build',
];

const REDESIGN_KEYWORDS = [
  'rediseña', 'redisenar', 'rebrand', 'estilo', 'look', 'moderniza', 'paleta',
];

const CREATE_KEYWORDS = [
  'crea', 'crear', 'genera', 'nuevo archivo', 'scaffold', 'añade archivo',
  'hazme', 'haz un', 'haz una', 'página', 'pagina', 'landing', 'sitio', 'website',
  'completa', 'completo', 'profesional', 'estructurad', 'diseña', 'disena',
];

export function detectIntent(userMessage: string, viewMode: string): ContextIntent {
  const msg = userMessage.toLowerCase();

  if (DEBUG_KEYWORDS.some((k) => msg.includes(k))) return 'debug';
  if (viewMode === 'visual' && VISUAL_KEYWORDS.some((k) => msg.includes(k))) return 'visual_edit';
  if (VISUAL_KEYWORDS.some((k) => msg.includes(k))) return 'visual_edit';
  if (REDESIGN_KEYWORDS.some((k) => msg.includes(k))) return 'redesign';
  if (CREATE_KEYWORDS.some((k) => msg.includes(k))) return 'create_file';
  if (msg.includes('explica') || msg.includes('qué hace') || msg.includes('que hace')) return 'explain';
  return 'general';
}
