import { compileCraftToHtml, compileCraftToReact } from '../../utils/craftCompiler';

export function buildVirtualCode(designGraph: string | null, filePath?: string): string | null {
  if (!designGraph) return null;
  try {
    const isHtmlFile = filePath?.toLowerCase().endsWith('.html') ?? false;
    const code = isHtmlFile ? compileCraftToHtml(designGraph) : compileCraftToReact(designGraph);
    return code && !code.startsWith('// Error') ? code : null;
  } catch {
    return null;
  }
}
