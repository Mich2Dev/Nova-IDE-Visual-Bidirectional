# Resumen de Arquitectura: Nova IDE (IDE Visual Bidireccional con IA)

¡Hola Gemini! Soy Antigravity. Aquí tienes el estado actual y la arquitectura detallada del proyecto que estamos construyendo junto con el usuario.

## 1. Concepto Central
**Nova IDE** es un entorno de desarrollo integrado que rompe la barrera unidireccional de la IA. Tiene un **Lienzo Visual Drag & Drop** (Diseño) y un **Editor de Código**.
La magia ("El Eslabón Perdido") es bidireccionalidad conceptual:
1. **Visual -> Código:** Al diseñar en el lienzo, un compilador interno genera el código React/Tailwind y lo inyecta al archivo físico.
2. **Visual -> IA:** El estado JSON del lienzo se inyecta en tiempo real en el `System Prompt` de Nova, dándole "ojos" a la IA para entender la interfaz gráfica que el usuario está diseñando.

## 2. Stack Tecnológico
- **Core:** React 18 + TypeScript + Vite.
- **Gestión de Estado:** `zustand` (Manejo global de pestañas, árbol de archivos, historial de chat y estado visual).
- **Estilos:** Tailwind CSS + `lucide-react` (Íconos).
- **Editor de Código:** `@monaco-editor/react` (Manejo con refs para evitar pérdida de foco).
- **Editor Visual (Drag & Drop):** `@craftjs/core`. Componentes personalizados (`Container`, `Text`, `Button`, `Image`, `Divider`).
- **Animaciones/Paneles:** `framer-motion` (usado en `FloatingPanel.tsx` para el Toolbox y Settings).
- **IA Base:** Ollama (Local) con soporte integrado para **Gemini API** (`gemini-1.5-flash`) a través de variables de entorno (`VITE_GEMINI_API_KEY`).

## 3. Estructura de Archivos Principales
```text
src/
├── App.tsx                     # Layout principal (Header, FileExplorer, CentralArea, ChatPanel)
├── store/
│   └── useStore.ts             # Estado de Zustand (Tabs, FileTree, Chat, ViewMode, VisualState)
├── utils/
│   └── craftCompiler.ts        # Traduce el JSON de Craft.js a código estático JSX/Tailwind.
├── components/
│   ├── layout/
│   │   └── FileExplorer.tsx    # Explorador de archivos (Lee de la API expuesta por preload/Electron).
│   ├── chat/
│   │   └── ChatPanel.tsx       # Panel lateral derecho. Construye el prompt inyectando el código actual y el JSON visual.
│   ├── editor/
│   │   ├── CentralArea.tsx     # Selector de vistas (Visual, Preview, Split, Código).
│   │   ├── CodeEditor.tsx      # Monaco Editor.
│   │   ├── LivePreview.tsx     # Iframe apuntando al puerto de desarrollo del proyecto abierto.
│   │   └── VisualEditor.tsx    # Contenedor de Craft.js. Posee el StateObserver para sincronizar JSON.
│   ├── craft/
│   │   ├── Toolbox.tsx         # Panel flotante con la galería de componentes para arrastrar.
│   │   ├── SettingsPanel.tsx   # Panel flotante con los ajustes (Padding, Flex, Colores) del elemento seleccionado.
│   │   └── [Componentes].tsx   # Container, Button, Text, etc., registrados en Craft.js.
│   └── FloatingPanel.tsx       # Componente Draggable base usando framer-motion.
```

## 4. Flujos Clave
- **El Compilador (`craftCompiler.ts`):** Cuando el usuario hace clic en *"Exportar a Código"*, toma el árbol JSON de Craft.js y genera un componente React válido, sobrescribiendo el archivo que el usuario tiene abierto (ej. `index.html` o `App.tsx`).
- **Prompt Dinámico (`ChatPanel.tsx`):** La función `buildSystemPrompt` ensambla dinámicamente el árbol de archivos, el contenido del archivo abierto y el árbol JSON del editor visual para enviarlo a la API de Gemini/Ollama.

## 5. Estado Actual y Próximos Pasos
El sistema principal funciona. El usuario ya puede:
- Abrir archivos y editar código sin latencia.
- Arrastrar elementos al lienzo visual (Toolbox Pro y Settings Pro habilitados).
- Generar código desde el lienzo hacia los archivos.
- Chatear con Nova (Gemini) la cual ya tiene conciencia contextual del lienzo.

*Cualquier recomendación arquitectónica que tengas para mejorar la robustez de los componentes de Craft.js o el parsing del compilador será bienvenida.*
