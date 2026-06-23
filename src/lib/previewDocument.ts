import { buildDraftPreviewHtml } from './draftPreviewHtml';

export function isCraftReactOutput(content: string): boolean {
  return /GeneratedComponent|import\s+React\s+from/i.test(content);
}

export function isHtmlDocument(content: string): boolean {
  const t = content.trim().toLowerCase();
  return t.startsWith('<!doctype') || t.startsWith('<html');
}

/** Build iframe srcdoc for preview when content is craft/React output or raw HTML */
export function buildPreviewSrcDoc(content: string, virtualCode?: string | null): string | null {
  const source = virtualCode || content;
  if (!source?.trim()) return null;

  if (isHtmlDocument(source)) {
    return source;
  }

  if (isCraftReactOutput(source) || source.includes('export default function')) {
    return buildDraftPreviewHtml(source);
  }

  return null;
}
