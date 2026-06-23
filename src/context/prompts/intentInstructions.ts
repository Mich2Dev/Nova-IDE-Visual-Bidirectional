import type { ContextIntent } from '../types/context.types';

export function getIntentInstructions(intent: ContextIntent): string {
  switch (intent) {
    case 'create_file':
      return `
MODO: CREAR PÁGINA / ARCHIVOS COMPLETOS

Cuando el usuario pida una página, landing, sitio o UI:
1. Entrega un proyecto COMPLETO y profesional con archivos SEPARADOS (mínimo):
   - index.html  → HTML5 semántico completo (<!DOCTYPE html>, meta viewport, title)
   - styles.css  → hoja de estilos dedicada (NO todo inline en HTML)
   - script.js   → solo si hay interactividad (menú, formulario, animaciones)

2. Estructura obligatoria del HTML:
   - <header> con logo y navegación
   - <main> con secciones claras (hero, features/contenido, CTA)
   - <footer> con enlaces o copyright
   - Usa etiquetas semánticas: nav, section, article, aside

3. Calidad del CSS (styles.css):
   - Variables CSS en :root (--color-primary, --spacing, --font-main)
   - Layout moderno con flexbox y/o CSS grid
   - Diseño responsive (@media queries para móvil)
   - Tipografía legible, espaciado consistente, hover/focus states
   - Paleta de colores armoniosa (no diseño plano vacío)

4. En index.html enlaza los archivos así:
   <link rel="stylesheet" href="styles.css">
   <script src="script.js" defer></script>

5. PROHIBIDO:
   - Fragmentos incompletos o "añade esto a tu archivo"
   - Páginas de una sola línea o sin estructura
   - Solo texto sin diseño visual
   - Omitir styles.css cuando creas una página web

6. Cada bloque de código debe ser el archivo COMPLETO listo para guardar.
`.trim();

    case 'redesign':
      return `
MODO: REDISEÑO
- Mejora visual y estructural manteniendo la funcionalidad.
- Actualiza HTML y CSS de forma coherente entre archivos.
- Entrega archivos completos, no parches sueltos.
`.trim();

    case 'visual_edit':
      return `
MODO: EDICIÓN VISUAL
- Prioriza el nodo seleccionado y el draft visual activo.
- Cambios precisos y aplicables al lienzo de diseño.
`.trim();

    default:
      return '';
  }
}
