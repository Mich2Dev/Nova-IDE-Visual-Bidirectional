import React, { useEffect } from 'react';
import { Code2 } from 'lucide-react';
import { Editor, Frame, Element, useEditor as useCraftEditor } from '@craftjs/core';

import { Container } from '../craft/Container';

import { Text } from '../craft/Text';

import { Button } from '../craft/Button';

import { Image } from '../craft/Image';

import { Divider } from '../craft/Divider';

import { Toolbox } from '../craft/Toolbox';

import { SettingsPanel } from '../craft/SettingsPanel';

import { useStore } from '../../store/useStore';

import { useDraftStore } from '../../draft/useDraftStore';

import { useContextStore } from '../../context/useContextStore';

import { buildNodeHierarchy } from '../../draft/craftSelection';

import { captureElementAsJpeg } from '../../lib/captureCanvas';
import { useLayoutStore } from '../../store/useLayoutStore';
import { ResizeHandle } from '../layout/ResizeHandle';
import { loadProjectStylesheet } from '../../lib/projectPreview';

const SelectionObserver = () => {

  const { selected, nodes } = useCraftEditor((state) => ({

    selected: state.events.selected,

    nodes: state.nodes,

  }));

  const setSelection = useContextStore((s) => s.setSelection);



  useEffect(() => {

    const selectedId =

      selected instanceof Set

        ? Array.from(selected)[0]

        : typeof selected === 'string'

          ? selected

          : null;



    if (!selectedId || !nodes[selectedId]) {

      setSelection(null);

      return;

    }



    const node = nodes[selectedId];

    const craftType =

      (node.data?.type as { resolvedName?: string })?.resolvedName ??

      String(node.data?.displayName ?? 'Unknown');



    const hierarchy = buildNodeHierarchy(

      nodes as Record<string, { data?: { type?: { resolvedName?: string }; displayName?: string; parent?: string } }>,

      selectedId

    );



    setSelection({

      nodeId: selectedId,

      craftType,

      displayName: String(node.data?.displayName ?? craftType),

      props: (node.data?.props as Record<string, unknown>) ?? {},

      hierarchy,

    });

  }, [selected, nodes, setSelection]);



  return null;

};



const StateObserver = ({
  activeTabId,
  persistedContent,
  onGraphChange,
}: {
  activeTabId: string;
  persistedContent: string;
  onGraphChange: () => void;
}) => {
  const { nodes, query } = useCraftEditor((state) => ({ nodes: state.nodes }));
  const prevSerialized = React.useRef<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const json = query.serialize();
      if (json === prevSerialized.current) return;
      prevSerialized.current = json;

      queueMicrotask(() => {
        const store = useDraftStore.getState();
        store.ensureSession(activeTabId, persistedContent);
        const session = store.getSession(activeTabId);

        if (!session?.baselineDesignGraph) {
          store.captureCraftBaseline(activeTabId, json);
          return;
        }

        if (!session.userTouchedVisual) return;

        store.updateDesignGraph(activeTabId, json, {
          type: 'graph_change',
          nodeId: 'ROOT',
          nodeType: 'Canvas',
        });

        const updated = store.getSession(activeTabId);
        if (updated?.dirty.visual && updated.virtualCode) {
          store.syncCodeFromVisual(activeTabId, updated.virtualCode);
          useStore.getState().markTabDirty(activeTabId);
          window.dispatchEvent(new Event('nova-preview-content-changed'));
        }

        onGraphChange();
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [nodes, activeTabId, persistedContent, query, onGraphChange]);

  return null;
};

const UserInteractionObserver = ({ activeTabId }: { activeTabId: string }) => {
  const dragged = useCraftEditor((state) => state.events.dragged);

  useEffect(() => {
    if (dragged.size > 0) {
      useDraftStore.getState().markUserTouchedVisual(activeTabId);
    }
  }, [dragged, activeTabId]);

  return null;
};



export const VisualEditor: React.FC = () => {

  const canvasRef = React.useRef<HTMLDivElement>(null);

  const [frameKey, setFrameKey] = React.useState(0);

  const { activeTabId, tabs, markTabDirty, projectPath } = useStore();

  const activeTab = tabs.find((t) => t.path === activeTabId);

  const getSession = useDraftStore((s) => s.getSession);

  const ensureSession = useDraftStore((s) => s.ensureSession);

  const setCodeDraft = useDraftStore((s) => s.setCodeDraft);

  const selection = useContextStore((s) => s.selection);

  const toolboxWidth = useLayoutStore((s) => s.toolboxWidth);

  const settingsWidth = useLayoutStore((s) => s.settingsWidth);

  const nudgeToolbox = useLayoutStore((s) => s.nudgeToolbox);

  const nudgeSettings = useLayoutStore((s) => s.nudgeSettings);

  const [projectCss, setProjectCss] = React.useState('');

  const sessions = useDraftStore((s) => s.sessions);
  const rebootstrapDesignFromCode = useDraftStore((s) => s.rebootstrapDesignFromCode);

  const getDraft = React.useCallback((path: string) => {
    const s = useDraftStore.getState().getSession(path);
    if (!s) return null;
    return {
      codeDraft: s.codeDraft,
      virtualCode: s.virtualCode,
      dirtyCode: s.dirty.code,
      dirtyVisual: s.dirty.visual,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const css = await loadProjectStylesheet({ projectPath, tabs, getDraft });
      if (!cancelled) setProjectCss(css);
    })();
    return () => { cancelled = true; };
  }, [projectPath, tabs, sessions, getDraft]);

  useEffect(() => {
    if (!activeTabId || !activeTab?.name.match(/\.html?$/i)) return;
    ensureSession(activeTabId, activeTab.content);
    const session = getSession(activeTabId);
    if (session?.dirty.visual || session?.userTouchedVisual) return;
    const code = session?.codeDraft ?? activeTab.content;
    rebootstrapDesignFromCode(activeTabId, code);
    setFrameKey((k) => k + 1);
  }, [activeTabId]);

  useEffect(() => {
    const handler = () => {
      loadProjectStylesheet({ projectPath, tabs, getDraft }).then(setProjectCss);
    };
    window.addEventListener('nova-preview-content-changed', handler);
    return () => window.removeEventListener('nova-preview-content-changed', handler);
  }, [projectPath, tabs, getDraft]);



  const session = activeTabId ? getSession(activeTabId) : null;

  const designGraph = session?.designGraph;

  const hasVisualDraft = session?.dirty.visual ?? false;

  const setDesignScreenshot = useContextStore((s) => s.setDesignScreenshot);

  const captureScreenshot = React.useCallback(async () => {
    if (!canvasRef.current) return;
    const base64 = await captureElementAsJpeg(canvasRef.current);
    if (base64) {
      setDesignScreenshot({
        base64,
        mimeType: 'image/jpeg',
        caption: `Lienzo de diseño — ${activeTab?.name ?? 'archivo'}`,
        capturedAt: Date.now(),
      });
    }
  }, [activeTab?.name, setDesignScreenshot]);

  useEffect(() => {
    if (!hasVisualDraft) return;
    const t = setTimeout(() => { captureScreenshot(); }, 800);
    return () => clearTimeout(t);
  }, [hasVisualDraft, designGraph, captureScreenshot]);

  const handlePreviewCode = () => {
    if (!session?.virtualCode || !activeTabId) {
      alert('Arrastra al menos un elemento primero.');
      return;
    }
    setCodeDraft(activeTabId, session.virtualCode);
    markTabDirty(activeTabId);
    useStore.getState().setViewMode('code');
  };

  return (

    <div key={activeTabId || 'empty'} className="flex-1 w-full h-full flex min-h-0 overflow-hidden bg-[#0A0A10]">

      <Editor resolver={{ Container, Text, Button, Image, Divider }}>

        <div className="flex flex-1 h-full min-h-0 min-w-0 w-full overflow-hidden">

        {activeTabId && activeTab && (
          <>
            <StateObserver
              activeTabId={activeTabId}
              persistedContent={activeTab.content}
              onGraphChange={captureScreenshot}
            />
            <UserInteractionObserver activeTabId={activeTabId} />
            <SelectionObserver />
          </>
        )}



        {/* Barra lateral Toolbox — fija, no flotante */}

        <aside
          className="shrink-0 border-r border-white/5 bg-[#0D0D13] flex flex-col overflow-hidden"
          style={{ width: toolboxWidth }}
        >

          <div className="h-8 px-3 flex items-center border-b border-white/5 bg-black/20 shrink-0">

            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Toolbox</span>

          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">

            <Toolbox />

          </div>

        </aside>

        <ResizeHandle direction="horizontal" onResize={nudgeToolbox} />

        {/* Lienzo central */}

        <div className="flex-1 flex flex-col min-w-0 min-h-0">

          <div className="h-9 shrink-0 border-b border-white/5 bg-[#0D0D13] flex items-center px-3 gap-3">

            <span className="text-[10px] text-gray-600 font-mono flex-1 truncate">
              Diseñando: {activeTab?.name || 'archivo'}
              {hasVisualDraft && (
                <span className="ml-2 text-amber-400">· sin guardar</span>
              )}
            </span>

            <button

              onClick={handlePreviewCode}

              className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md bg-indigo-600/80 hover:bg-indigo-500 text-white transition-colors"

            >

              <Code2 className="w-3 h-3" />

              Ver Código

            </button>

          </div>

          <div className="relative flex-1 overflow-auto custom-scrollbar p-4 min-h-0">

            <div
              ref={canvasRef}
              className="bg-white min-h-full w-full max-w-none shadow-lg rounded-md overflow-hidden"
            >
              {projectCss ? (
                <style data-nova-project-css dangerouslySetInnerHTML={{ __html: projectCss }} />
              ) : null}
              <Frame key={frameKey} data={designGraph || undefined}>

                {!designGraph && (

                  <Element is={Container} padding={20} canvas>

                    <Text text={`Diseñando: ${activeTab?.name || 'Archivo'}`} fontSize={24} />

                    <Divider />

                    <Button text="Arrastra elementos desde el Toolbox" />

                  </Element>

                )}

              </Frame>

            </div>

          </div>

        </div>

        <ResizeHandle direction="horizontal" onResize={nudgeSettings} />

        {/* Panel Settings — fijo a la derecha */}

        <aside
          className="shrink-0 border-l border-white/5 bg-[#0D0D13] flex flex-col overflow-hidden"
          style={{ width: settingsWidth }}
        >

          <div className="h-8 px-3 flex items-center border-b border-white/5 bg-black/20 shrink-0">

            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Personalizar</span>

            {selection && (

              <span className="ml-auto text-[9px] text-primary font-mono truncate max-w-[100px]">

                {selection.craftType}

              </span>

            )}

          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">

            <SettingsPanel />

          </div>

        </aside>

        </div>

      </Editor>

    </div>

  );

};


