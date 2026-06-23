import { useContextStore } from '../useContextStore';

export function collectVisualContext() {
  return useContextStore.getState().selection;
}
