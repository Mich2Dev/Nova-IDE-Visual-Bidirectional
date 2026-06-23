import React from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '../../store/useStore';
import { useDraftStore } from '../../draft/useDraftStore';

const MONACO_LANG_MAP: Record<string, string> = {
  html: 'html',
  css: 'css',
  js: 'javascript',
  ts: 'typescript',
  json: 'json',
  text: 'plaintext',
};

export const CodeEditor: React.FC = () => {
  const { tabs, activeTabId, markTabDirty } = useStore();
  const activeTab = tabs.find((t) => t.path === activeTabId);
  const getSession = useDraftStore((s) => s.getSession);
  const setCodeDraft = useDraftStore((s) => s.setCodeDraft);
  const editorRef = React.useRef<any>(null);
  const isTyping = React.useRef(false);

  const session = activeTabId ? getSession(activeTabId) : null;
  const displayContent =
    session?.codeDraft ??
    (session?.dirty.visual && session?.virtualCode ? session.virtualCode : null) ??
    activeTab?.content ??
    '';

  const hasCodeDraft = session?.dirty.code ?? false;
  const hasVisualDraft = session?.dirty.visual ?? false;
  const rebootstrapTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => {
    if (editorRef.current && activeTab && !isTyping.current) {
      const current =
        session?.codeDraft ??
        (session?.dirty.visual && session?.virtualCode ? session.virtualCode : null) ??
        activeTab.content;
      if (editorRef.current.getValue() !== current) {
        editorRef.current.setValue(current);
      }
    }
  }, [activeTab?.content, activeTab?.path, session?.codeDraft, session?.virtualCode, session?.dirty.visual]);

  if (!activeTab) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0A0A10] text-gray-600 text-sm">
        Abre un archivo para comenzar
      </div>
    );
  }

  const handleEditorChange = (value: string | undefined) => {
    isTyping.current = true;
    const content = value ?? '';
    useDraftStore.getState().ensureSession(activeTab.path, activeTab.content);
    setCodeDraft(activeTab.path, content);
    markTabDirty(activeTab.path);

    if (activeTab.name.match(/\.html?$/i)) {
      clearTimeout(rebootstrapTimer.current);
      rebootstrapTimer.current = setTimeout(() => {
        const s = useDraftStore.getState().getSession(activeTab.path);
        if (!s?.dirty.visual) {
          useDraftStore.getState().rebootstrapDesignFromCode(activeTab.path, content);
        }
      }, 400);
    }

    window.dispatchEvent(new Event('nova-preview-content-changed'));
    setTimeout(() => { isTyping.current = false; }, 500);
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
      {(hasCodeDraft || hasVisualDraft) && (
        <div className="shrink-0 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-[10px] px-3 py-1.5 text-center">
          {hasCodeDraft && hasVisualDraft
            ? 'Editando draft de código y hay cambios visuales sin guardar'
            : hasCodeDraft
              ? 'Editando draft — no guardado en disco'
              : 'Mostrando código generado desde Diseño — sin guardar en disco'}
        </div>
      )}
      <div className="flex-1 min-h-0">
        <Editor
          key={activeTab.path}
          height="100%"
          language={MONACO_LANG_MAP[activeTab.language] || 'plaintext'}
          defaultValue={displayContent}
          onChange={handleEditorChange}
          onMount={(editor) => { editorRef.current = editor; }}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            lineHeight: 22,
            minimap: { enabled: false },
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            renderLineHighlight: 'gutter',
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            tabSize: 2,
            wordWrap: 'on',
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
          }}
          loading={
            <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] text-gray-500 text-sm">
              Cargando editor...
            </div>
          }
        />
      </div>
    </div>
  );
};
