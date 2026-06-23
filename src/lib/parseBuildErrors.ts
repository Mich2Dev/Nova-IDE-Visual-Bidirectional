export interface ParsedBuildError {
  file: string;
  line?: number;
  message: string;
}

const TS_ERROR = /(.+?)\((\d+),\d+\):\s*error\s+TS\d+:\s*(.+)/i;
const VITE_ERROR = /error during build/i;

export function parseBuildErrorsFromLines(lines: string[]): ParsedBuildError[] {
  const errors: ParsedBuildError[] = [];
  const seen = new Set<string>();

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const tsMatch = line.match(TS_ERROR);
    if (tsMatch) {
      const key = `${tsMatch[1]}:${tsMatch[2]}:${tsMatch[3]}`;
      if (!seen.has(key)) {
        seen.add(key);
        errors.push({ file: tsMatch[1], line: Number(tsMatch[2]), message: tsMatch[3] });
      }
      continue;
    }

    if (VITE_ERROR.test(line)) {
      const key = `vite:${line}`;
      if (!seen.has(key)) {
        seen.add(key);
        errors.push({ file: 'build', message: line });
      }
      continue;
    }

    if (/error TS\d+/i.test(line) || line.includes('✘') || line.includes('ERR!')) {
      const key = line;
      if (!seen.has(key)) {
        seen.add(key);
        errors.push({ file: 'unknown', message: line });
      }
    }
  }

  return errors.slice(-10);
}
