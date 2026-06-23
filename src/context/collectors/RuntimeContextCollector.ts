import type { BuildSnapshotInput, RuntimeContext } from '../types/context.types';
import { useContextStore } from '../useContextStore';
import { parseBuildErrorsFromLines } from '../../lib/parseBuildErrors';

export function collectRuntimeContext(input: BuildSnapshotInput): RuntimeContext {
  const ctx = useContextStore.getState();
  const viewportWidth = input.viewportSize === 0 ? 1440 : input.viewportSize;

  const terminalErrors = parseBuildErrorsFromLines(input.terminalOutput);
  const mergedErrors = [...ctx.buildErrors, ...terminalErrors].slice(-10);

  return {
    buildErrors: mergedErrors,
    consoleErrors: ctx.consoleErrors.slice(-5),
    terminalTail: input.terminalOutput.slice(-12),
    previewUrl: input.previewServerUrl,
    viewport: { width: viewportWidth, height: 900 },
  };
}
