import type { SelectedElementContext } from '../context/types/context.types';

type CraftNode = {
  data?: {
    type?: { resolvedName?: string } | string;
    displayName?: string;
    parent?: string;
  };
};

export function buildNodeHierarchy(
  nodes: Record<string, CraftNode>,
  startId: string
): SelectedElementContext['hierarchy'] {
  const hierarchy: SelectedElementContext['hierarchy'] = [];
  let currentId: string | null = startId;

  while (currentId) {
    const entry: CraftNode | undefined = nodes[currentId];
    if (!entry) break;

    const type =
      typeof entry.data?.type === 'object' && entry.data.type !== null
        ? entry.data.type.resolvedName ?? 'Node'
        : String(entry.data?.displayName ?? entry.data?.type ?? 'Node');

    hierarchy.unshift({ id: currentId, type });
    currentId = entry.data?.parent ?? null;
  }

  return hierarchy;
}
