import type { BuildSnapshotInput, AIContextSnapshot } from './types/context.types';
import { collectFileContext, summarizeFileTree } from './collectors/FileContextCollector';
import { collectDraftContext } from './collectors/DraftContextCollector';
import { collectVisualContext } from './collectors/VisualContextCollector';
import { collectRuntimeContext } from './collectors/RuntimeContextCollector';
import { collectDesignProfile } from './collectors/DesignProfileCollector';
import { prioritizeContext } from './prioritizers/ContextPrioritizer';
import { estimateTokens } from './compressors/TokenBudget';
import { MemoryManager } from '../brain/MemoryManager';
import { useContextStore } from './useContextStore';
import { getIntentInstructions } from './prompts/intentInstructions';

export interface ContextBuildResult {
  snapshot: AIContextSnapshot;
  systemPrompt: string;
  screenshotBase64?: string;
}

export class NovaContextEngine {
  static async build(input: BuildSnapshotInput): Promise<ContextBuildResult> {
    const snapshot = await NovaContextEngine.buildSnapshot(input);
    const systemPrompt = snapshotToPrompt(snapshot, input.tokenBudget);

    const screenshot = snapshot.screenshot?.base64;
    snapshot.meta.tokenEstimate = estimateTokens(systemPrompt);

    return { snapshot, systemPrompt, screenshotBase64: screenshot };
  }

  static async buildSnapshot(input: BuildSnapshotInput): Promise<AIContextSnapshot> {
    const { activeFile, openFiles } = collectFileContext(input);
    const draftRaw = collectDraftContext(input);
    const selection = collectVisualContext();
    const runtime = collectRuntimeContext(input);
    const designProfile = await collectDesignProfile(input.projectPath);
    const memory = await NovaContextEngine.loadMemoryContext(input.projectPath);

    const screenshotState = useContextStore.getState().designScreenshot;
    const includeScreenshot =
      (input.intent === 'visual_edit' || input.intent === 'redesign') &&
      screenshotState &&
      Date.now() - screenshotState.capturedAt < 120_000;

    const projectName = input.projectPath
      ? input.projectPath.split(/[\\/]/).pop() ?? 'proyecto'
      : 'sin proyecto';

    const snapshot: AIContextSnapshot = {
      version: '1.1.0',
      generatedAt: Date.now(),
      intent: input.intent,
      project: {
        path: input.projectPath ?? '',
        name: projectName,
        fileTreeSummary: summarizeFileTree(input.fileTree) || 'Proyecto vacío o sin carpeta abierta.',
      },
      activeFile,
      openFiles,
      draft: {
        hasVisualDraft: draftRaw.hasVisualDraft,
        hasCodeDraft: draftRaw.hasCodeDraft,
        actionSummary: draftRaw.actionSummary,
        virtualCode: draftRaw.virtualCode,
        diff: draftRaw.diff,
      },
      selection,
      designProfile,
      runtime,
      memory,
      screenshot: includeScreenshot
        ? {
            base64: screenshotState!.base64,
            mimeType: screenshotState!.mimeType,
            caption: screenshotState!.caption,
          }
        : undefined,
      meta: {
        tokenEstimate: 0,
        omitted: [],
        priorityApplied: [],
      },
    };

    const prioritized = prioritizeContext(snapshot, input.intent, input.tokenBudget);
    snapshot.meta.priorityApplied = prioritized.priorityApplied;
    snapshot.meta.omitted = prioritized.omitted;

    return snapshot;
  }

  private static async loadMemoryContext(projectPath: string | null) {
    if (!projectPath) {
      return { relevantPatterns: [], recentDecisions: [] };
    }
    try {
      const mm = new MemoryManager(projectPath);
      const patterns = await mm.getPatterns();
      const episodes = await mm.getEpisodes();
      return {
        relevantPatterns: patterns
          .filter((p) => p.isApproved)
          .slice(-5)
          .map((p) => `Si ${p.triggerDesc} → ${p.responseDesc}`),
        recentDecisions: episodes
          .slice(-5)
          .map((e) => `${e.situation}: ${e.outcome}`),
      };
    } catch {
      return { relevantPatterns: [], recentDecisions: [] };
    }
  }
}

export function snapshotToPrompt(snapshot: AIContextSnapshot, tokenBudget: number): string {
  const prioritized = prioritizeContext(snapshot, snapshot.intent, tokenBudget);
  const projectName = snapshot.project.name;
  const intentBlock = getIntentInstructions(snapshot.intent);

  return `Eres Nova, un asistente de programación integrado en un IDE (estilo Cursor/Copilot).
Actúas como copiloto experto del proyecto "${projectName}": entiendes el contexto, propones soluciones y entregas código listo para aplicar.

INTENCIÓN DETECTADA: ${snapshot.intent}
${intentBlock ? `\n${intentBlock}\n` : ''}

ESTILO DE RESPUESTA (obligatorio):
1. Empieza explicando QUÉ vas a hacer y POR QUÉ, en lenguaje claro (2-4 frases o viñetas cortas).
2. Luego entrega el código en bloques ### ARCHIVO (el IDE los aplicará al aceptar).
3. Cierra con un resumen de qué archivos tocaste y qué puede hacer el usuario después.
4. NO digas "copia esto", "pega manualmente" ni "haz clic en aplicar" — el usuario solo Acepta o Rechaza.
5. Tono: profesional, directo y útil, como un desarrollador senior ayudando a un compañero.
6. Si falta algo (proyecto no abierto, archivo ambiguo), pregunta o indícalo antes de inventar rutas.

CAPACIDADES:
- Crear y editar archivos del proyecto.
- Formato para cada archivo:

### ARCHIVO: nombre_del_archivo.ext
\`\`\`lenguaje
[código completo del archivo]
\`\`\`

REGLAS DE CÓDIGO:
- Archivos COMPLETOS siempre, nunca fragmentos.
- HTML en .html, estilos en .css, lógica en .js (archivos separados).
- Si hay draft o selección visual activa, respétalos.
- Respeta el perfil de diseño del proyecto.

PROYECTO: ${projectName}
Pestañas abiertas: ${snapshot.openFiles.map((f) => `${f.name}${f.isDirty ? ' *' : ''}`).join(', ') || 'ninguna'}
${snapshot.screenshot ? `\nNOTA: Se adjunta captura del lienzo de diseño (${snapshot.screenshot.caption}).\n` : ''}

${prioritized.selection ? `## Selección visual\n${prioritized.selection}\n` : ''}
${prioritized.draft ? `## Draft\n${prioritized.draft}\n` : ''}
${prioritized.designProfile ? `## Perfil de diseño\n${prioritized.designProfile}\n` : ''}
${prioritized.activeFile ? `## Archivo activo\n${prioritized.activeFile}\n` : ''}
${prioritized.fileTree ? `## Árbol de archivos\n${prioritized.fileTree}\n` : ''}
${prioritized.runtime ? `## Runtime\n${prioritized.runtime}\n` : ''}
${prioritized.memory ? `## Memoria del proyecto\n${prioritized.memory}\n` : ''}

Meta: prioridades [${snapshot.meta.priorityApplied.join(', ')}]${snapshot.meta.omitted.length ? ` | omitido: [${snapshot.meta.omitted.join(', ')}]` : ''}`;
}

export function buildSystemPrompt(input: BuildSnapshotInput): Promise<ContextBuildResult> {
  return NovaContextEngine.build(input).then((result) => ({
    ...result,
    systemPrompt: `${result.systemPrompt}\n\nMENSAJE ACTUAL DEL USUARIO:\n${input.userMessage}`,
  }));
}

export function estimateSnapshotTokens(prompt: string): number {
  return estimateTokens(prompt);
}
