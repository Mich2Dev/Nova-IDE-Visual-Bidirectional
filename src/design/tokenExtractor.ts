const nova = (window as any).novaAPI;

export interface ExtractedTokens {
  colors: string[];
  fonts: string[];
  sources: string[];
}

const COLOR_REGEX = /#(?:[0-9a-fA-F]{3,8})\b|rgb\([^)]+\)|hsl\([^)]+\)/g;
const FONT_REGEX = /font-family:\s*([^;}"']+)/gi;
const TAILWIND_COLOR_REGEX = /['"](#[0-9a-fA-F]{3,8})['"]/g;

export async function extractDesignTokens(projectPath: string): Promise<ExtractedTokens> {
  const colors = new Set<string>();
  const fonts = new Set<string>();
  const sources: string[] = [];

  const candidates = [
    'tailwind.config.js',
    'tailwind.config.ts',
    'src/index.css',
    'src/App.css',
    'index.css',
  ];

  for (const rel of candidates) {
    const filePath = `${projectPath}/${rel}`.replace(/\\/g, '/');
    const content = await nova?.readFile?.(filePath);
    if (!content) continue;

    sources.push(rel);
    const colorMatches = content.match(COLOR_REGEX) ?? [];
    colorMatches.forEach((c: string) => colors.add(c));

    const tailwindColors = content.match(TAILWIND_COLOR_REGEX) ?? [];
    tailwindColors.forEach((m: string) => {
      const hex = m.replace(/['"]/g, '');
      colors.add(hex);
    });

    let fontMatch;
    const fontRegex = new RegExp(FONT_REGEX.source, FONT_REGEX.flags);
    while ((fontMatch = fontRegex.exec(content)) !== null) {
      fontMatch[1].split(',').forEach((f) => {
        const cleaned = f.trim().replace(/['"]/g, '');
        if (cleaned) fonts.add(cleaned);
      });
    }
  }

  return {
    colors: [...colors].slice(0, 20),
    fonts: [...fonts].slice(0, 6),
    sources,
  };
}
