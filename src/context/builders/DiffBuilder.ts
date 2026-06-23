export function buildUnifiedDiff(
  persisted: string,
  draft: string,
  filePath: string
): string {
  if (persisted === draft) return '';

  const oldLines = persisted.split('\n');
  const newLines = draft.split('\n');
  const max = Math.max(oldLines.length, newLines.length);
  const hunks: string[] = [`--- ${filePath} (persistido)`, `+++ ${filePath} (draft)`];

  let changed = 0;
  const limit = 40;

  for (let i = 0; i < max && changed < limit; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    if (oldLine !== newLine) {
      changed++;
      if (oldLine !== undefined) hunks.push(`- ${oldLine}`);
      if (newLine !== undefined) hunks.push(`+ ${newLine}`);
    }
  }

  if (changed === 0) return '';
  if (changed >= limit) hunks.push('... (diff truncado)');
  return hunks.join('\n');
}
