import type { BuildSnapshotInput } from '../types/context.types';
import { useDraftStore } from '../../draft/useDraftStore';
import { summarizeActions } from '../../draft/visualActionLog';
import { buildUnifiedDiff } from '../builders/DiffBuilder';

export function collectDraftContext(input: BuildSnapshotInput) {
  const activePath = input.activeTabId;
  if (!activePath) {
    return {
      hasVisualDraft: false,
      hasCodeDraft: false,
      actionSummary: '',
      virtualCode: undefined as string | undefined,
      diff: undefined as string | undefined,
    };
  }

  const session = useDraftStore.getState().getSession(activePath);
  const activeTab = input.tabs.find((t) => t.path === activePath);
  if (!session || !activeTab) {
    return {
      hasVisualDraft: false,
      hasCodeDraft: false,
      actionSummary: '',
      virtualCode: undefined,
      diff: undefined,
    };
  }

  const virtualCode = session.dirty.visual ? session.virtualCode ?? undefined : undefined;
  const codeDraft = session.dirty.code ? session.codeDraft ?? undefined : undefined;

  let diff: string | undefined;
  if (session.dirty.visual && virtualCode) {
    diff = buildUnifiedDiff(activeTab.content, virtualCode, activeTab.name);
  } else if (session.dirty.code && codeDraft) {
    diff = buildUnifiedDiff(activeTab.content, codeDraft, activeTab.name);
  }

  return {
    hasVisualDraft: session.dirty.visual,
    hasCodeDraft: session.dirty.code,
    actionSummary: summarizeActions(session.actions),
    virtualCode,
    diff,
    codeDraft,
  };
}
