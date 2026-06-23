import { useStore } from '../store/useStore';
import { useDraftStore } from '../draft/useDraftStore';
import { MemoryManager } from '../brain/MemoryManager';

const nova = (window as any).novaAPI;

export async function saveActiveFile(): Promise<{ success: boolean; error?: string }> {
  const { activeTabId, tabs, setPersistedContent, projectPath } = useStore.getState();
  if (!activeTabId) return { success: false, error: 'No hay archivo activo' };

  const activeTab = tabs.find((t) => t.path === activeTabId);
  if (!activeTab) return { success: false, error: 'Tab no encontrado' };

  const draftStore = useDraftStore.getState();
  const session = draftStore.getSession(activeTabId);
  const hadVisualDraft = session?.dirty.visual ?? false;
  const hadCodeDraft = session?.dirty.code ?? false;

  const contentToSave =
    draftStore.getContentToSave(activeTabId, activeTab.content) ?? activeTab.content;

  const result = await nova?.writeFile(activeTabId, contentToSave);
  if (!result?.success) {
    return { success: false, error: result?.error ?? 'Error al escribir archivo' };
  }

  setPersistedContent(activeTabId, contentToSave);
  draftStore.commitSession(activeTabId);

  if (projectPath) {
    try {
      const mm = new MemoryManager(projectPath);
      const actionCount = session?.actions.length ?? 0;
      await mm.addEpisode({
        id: `ep_${Date.now()}`,
        sessionId: `save_${activeTabId}`,
        situation: hadVisualDraft
          ? `Edición visual en ${activeTab.name} (${actionCount} acciones)`
          : hadCodeDraft
            ? `Edición de código en ${activeTab.name}`
            : `Guardado de ${activeTab.name}`,
        strategy: hadVisualDraft ? 'draft visual → disco' : 'editor código → disco',
        outcome: 'Archivo guardado correctamente',
        sessionArc: 'resolved',
        qualityScore: 0.8,
        temporalWeight: 1,
        createdAt: Date.now(),
      });
    } catch {
      // non-blocking
    }
  }

  return { success: true };
}
