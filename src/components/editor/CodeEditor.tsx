import React from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '../../store/useStore';

const MONACO_LANG_MAP: Record<string, string> = {
  html: 'html',
  css: 'css',
  js: 'javascript',
  ts: 'typescript',
  json: 'json',
  text: 'plaintext',
};

export const CodeEditor: React.FC = () => {
  const { tabs, activeTabId, setTabContent } = useStore();
  const activeTab = tabs.find(t => t.path === activeTabId);
  const editorRef = React.useRef<any>(null);
  const isTyping = React.useRef(false);

  React.useEffect(() => {
    if (editorRef.current && activeTab && !isTyping.current) {
      if (editorRef.current.getValue() !== activeTab.content) {
        editorRef.current.setValue(activeTab.content);
      }
    }
  }, [activeTab?.content]);

  if (!activeTab) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0A0A10] text-gray-600 text-sm">
        Abre un archivo para comenzar
      </div>
    );
  }

  const handleEditorChange = (value: string | undefined) => {
    isTyping.current = true;
    setTabContent(activeTab.path, value ?? '');
    setTimeout(() => { isTyping.current = false; }, 500);
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <Editor
        key={activeTab.path}
        height="100%"
        language={MONACO_LANG_MAP[activeTab.language] || 'plaintext'}
        defaultValue={activeTab.content}
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
  );
};
