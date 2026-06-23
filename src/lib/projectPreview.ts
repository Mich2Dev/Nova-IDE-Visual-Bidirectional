import type { TabNode } from '../store/useStore';
import { buildDraftPreviewHtml } from './draftPreviewHtml';
import { isCraftReactOutput, isHtmlDocument } from './previewDocument';

const nova = (window as any).novaAPI;

export type DraftGetter = (path: string) => {
  codeDraft: string | null;
  virtualCode: string | null;
  dirtyCode: boolean;
  dirtyVisual: boolean;
} | null;

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/\/+/g, '/');
}

function pathsEqual(a: string, b: string): boolean {
  return normalizePath(a).toLowerCase() === normalizePath(b).toLowerCase();
}

function resolveRelative(baseFile: string, href: string): string {
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
    return href;
  }
  const baseDir = normalizePath(baseFile).replace(/\/[^/]+$/, '');
  const parts = [...baseDir.split('/'), ...href.split('/')];
  const stack: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
}

export async function readProjectFile(
  filePath: string,
  tabs: TabNode[],
  getDraft: DraftGetter
): Promise<string | null> {
  const tab = tabs.find((t) => pathsEqual(t.path, filePath));
  const isHtml = filePath.toLowerCase().endsWith('.html');

  if (tab) {
    const draft = getDraft(tab.path);
    if (isHtml) {
      if (draft?.dirtyCode && draft.codeDraft !== null) return draft.codeDraft;
      if (draft?.dirtyVisual && draft.virtualCode) return draft.virtualCode;
    } else {
      if (draft?.dirtyCode && draft.codeDraft !== null) return draft.codeDraft;
    }
    return tab.content;
  }

  try {
    const result = await nova?.readFile?.(filePath);
    if (typeof result === 'string') return result;
  } catch {
    // ignore
  }
  return null;
}

function extractStylesheetLinks(html: string): { tag: string; href: string }[] {
  const links: { tag: string; href: string }[] = [];
  const re = /<link\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    if (!/rel\s*=\s*["']stylesheet["']/i.test(tag)) continue;
    const hrefMatch = tag.match(/href\s*=\s*["']([^"']+)["']/i);
    if (hrefMatch) links.push({ tag, href: hrefMatch[1] });
  }
  return links;
}

function extractScriptSrcs(html: string): { tag: string; src: string }[] {
  const scripts: { tag: string; src: string }[] = [];
  const re = /<script\b[^>]*\bsrc\s*=\s*["'][^"']+["'][^>]*>\s*<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    const srcMatch = tag.match(/src\s*=\s*["']([^"']+)["']/i);
    if (srcMatch) scripts.push({ tag, src: srcMatch[1] });
  }
  return scripts;
}

async function inlineLinkedAssets(
  html: string,
  htmlPath: string,
  tabs: TabNode[],
  getDraft: DraftGetter
): Promise<string> {
  let output = html;

  for (const { tag, href } of extractStylesheetLinks(html)) {
    if (href.startsWith('http') || href.startsWith('//')) continue;
    const cssPath = resolveRelative(htmlPath, href);
    const css = await readProjectFile(cssPath, tabs, getDraft);
    if (css) {
      output = output.split(tag).join(`<style data-inlined-from="${href}">\n${css}\n</style>`);
    }
  }

  for (const { tag, src } of extractScriptSrcs(html)) {
    if (src.startsWith('http') || src.startsWith('//')) continue;
    const jsPath = resolveRelative(htmlPath, src);
    const js = await readProjectFile(jsPath, tabs, getDraft);
    if (js) {
      output = output.split(tag).join(`<script data-inlined-from="${src}">\n${js}\n</script>`);
    }
  }

  return output;
}

async function injectDefaultProjectCss(
  html: string,
  _htmlPath: string,
  projectPath: string | null,
  tabs: TabNode[],
  getDraft: DraftGetter
): Promise<string> {
  const hasProjectCss = /data-inlined-from="(?:styles|style)\.css"/i.test(html);
  if (hasProjectCss) return html;

  const candidates: string[] = [];
  if (projectPath) {
    candidates.push(normalizePath(`${projectPath}/styles.css`));
    candidates.push(normalizePath(`${projectPath}/style.css`));
    candidates.push(normalizePath(`${projectPath}/css/styles.css`));
  }

  for (const cssPath of candidates) {
    const css = await readProjectFile(cssPath, tabs, getDraft);
    if (!css?.trim()) continue;
    const name = cssPath.split('/').pop() || 'styles.css';
    const styleTag = `<style data-inlined-from="${name}">\n${css}\n</style>`;
    if (html.includes('</head>')) {
      return html.replace('</head>', `${styleTag}\n</head>`);
    }
    if (html.includes('<body')) {
      return html.replace(/<body/i, `${styleTag}\n<body`);
    }
    return `${styleTag}\n${html}`;
  }

  return html;
}

function findHtmlEntry(tabs: TabNode[], activeTabId: string | null, projectPath: string | null): string | null {
  const active = tabs.find((t) => t.path === activeTabId);
  if (active?.name.match(/\.html?$/i)) return active.path;

  const indexTab = tabs.find((t) => t.name.toLowerCase() === 'index.html');
  if (indexTab) return indexTab.path;

  if (projectPath) {
    return normalizePath(`${projectPath}/index.html`);
  }
  return null;
}

/** HTML efectivo para preview/código — misma prioridad en los tres modos */
export async function getEffectiveHtmlSource(params: {
  projectPath: string | null;
  tabs: TabNode[];
  activeTabId: string | null;
  getDraft: DraftGetter;
}): Promise<{ html: string; htmlPath: string } | null> {
  const htmlPath = findHtmlEntry(params.tabs, params.activeTabId, params.projectPath);
  if (!htmlPath) return null;

  const html = await readProjectFile(htmlPath, params.tabs, params.getDraft);
  if (!html?.trim()) return null;

  return { html, htmlPath };
}

/** Ensambla preview: HTML + CSS + JS del proyecto (misma fuente que código/diseño) */
export async function buildProjectPreviewSrcDoc(params: {
  projectPath: string | null;
  tabs: TabNode[];
  activeTabId: string | null;
  getDraft: DraftGetter;
}): Promise<string | null> {
  const source = await getEffectiveHtmlSource(params);
  if (!source) return null;

  let { html, htmlPath } = source;
  const { projectPath, tabs, getDraft } = params;

  if (isCraftReactOutput(html) || html.includes('export default function')) {
    html = buildDraftPreviewHtml(html);
    htmlPath = htmlPath;
  }

  if (!isHtmlDocument(html)) return null;

  html = await inlineLinkedAssets(html, htmlPath, tabs, getDraft);
  html = await injectDefaultProjectCss(html, htmlPath, projectPath, tabs, getDraft);

  return html;
}

/** Lee styles.css del proyecto (para inyectar en lienzo de diseño) */
export async function loadProjectStylesheet(params: {
  projectPath: string | null;
  tabs: TabNode[];
  getDraft: DraftGetter;
}): Promise<string> {
  const { projectPath, tabs, getDraft } = params;
  if (!projectPath) return '';

  const candidates = [
    normalizePath(`${projectPath}/styles.css`),
    normalizePath(`${projectPath}/style.css`),
  ];

  for (const path of candidates) {
    const css = await readProjectFile(path, tabs, getDraft);
    if (css?.trim()) return css;
  }
  return '';
}

export function buildSingleFilePreviewSrcDoc(
  content: string,
  filename: string,
  virtualCode?: string | null
): string | null {
  const source = virtualCode || content;
  if (!source?.trim()) return null;

  if (isHtmlDocument(source)) return source;
  if (isCraftReactOutput(source) || source.includes('export default function')) {
    return buildDraftPreviewHtml(source);
  }

  if (filename.endsWith('.css')) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${source}</style></head><body><p style="font-family:system-ui;color:#64748b;padding:2rem">Vista previa de ${filename}</p></body></html>`;
  }

  if (filename.endsWith('.js')) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><script>${source}</script></body></html>`;
  }

  return null;
}
