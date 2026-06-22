import React, { useState } from 'react';
import { Editor, Frame, Element } from '@craftjs/core';
import { Container } from '../craft/Container';
import { Text } from '../craft/Text';
import { Button } from '../craft/Button';
import { Image } from '../craft/Image';
import { Divider } from '../craft/Divider';
import { FloatingPanel } from '../FloatingPanel';
import { Toolbox } from '../craft/Toolbox';
import { SettingsPanel } from '../craft/SettingsPanel';
import { useStore } from '../../store/useStore';
import { useEditor as useCraftEditor } from '@craftjs/core';
import { compileCraftToReact } from '../../utils/craftCompiler';
import { Code2 } from 'lucide-react';

const StateObserver = ({ activeTabId }: { activeTabId: string }) => {
  const { nodes, query } = useCraftEditor((state) => ({ nodes: state.nodes }));
  const updateTabVisualState = useStore(state => state.updateTabVisualState);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      const json = query.serialize();
      updateTabVisualState(activeTabId, json);
    }, 500);
    return () => clearTimeout(timeout);
  }, [nodes, activeTabId, updateTabVisualState, query]);

  return null;
};

export const VisualEditor: React.FC = () => {
  const [topPanelId, setTopPanelId] = useState<string>('toolbox');
  const { activeTabId, setTabContent, tabs } = useStore();
  const activeTab = tabs.find(t => t.path === activeTabId);

  const bringToFront = (id: string) => {
    setTopPanelId(id);
  };

  const handleExportCode = () => {
    if (!activeTab?.visualState || !activeTabId) {
      alert('Arrastra al menos un elemento primero.');
      return;
    }
    const generatedCode = compileCraftToReact(activeTab.visualState);
    setTabContent(activeTabId, generatedCode);
    alert(`¡Código generado con éxito en ${activeTab?.name}!\nCambia a la vista "Código" para verlo.`);
  };

  return (
    <div key={activeTabId || 'empty'} className="flex-1 w-full h-full relative overflow-hidden bg-[#0A0A10]">
      {/* Botón flotante para generar código */}
      <button
        onClick={handleExportCode}
        className="absolute top-4 right-4 z-[60] flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-lg font-medium text-sm transition-transform hover:scale-105 active:scale-95"
      >
        <Code2 className="w-4 h-4" />
        Exportar a Código
      </button>

      <Editor resolver={{ Container, Text, Button, Image, Divider }}>
        {activeTabId && <StateObserver activeTabId={activeTabId} />}
        
        {/* Toolbox Panel */}
        <FloatingPanel 
          id="toolbox" 
          title="Toolbox" 
          defaultX={20} 
          defaultY={20} 
          width={280} 
          height={400} 
          zIndex={topPanelId === 'toolbox' ? 50 : 40}
          onBringToFront={bringToFront}
        >
          <Toolbox />
        </FloatingPanel>

        {/* Settings Panel */}
        <FloatingPanel 
          id="settings" 
          title="Settings" 
          defaultX={window.innerWidth - 650} 
          defaultY={20} 
          width={280} 
          height={500} 
          zIndex={topPanelId === 'settings' ? 50 : 40}
          onBringToFront={bringToFront}
        >
          <SettingsPanel />
        </FloatingPanel>

        {/* Main Canvas */}
        <div className="flex-1 h-full overflow-auto custom-scrollbar p-8 flex justify-center">
          <div className="bg-white min-h-[800px] w-full max-w-[1200px] shadow-2xl rounded-lg overflow-hidden">
            <Frame data={activeTab?.visualState}>
              {!activeTab?.visualState && (
                <Element is={Container} padding={20} canvas>
                  <Text text={`Diseñando: ${activeTab?.name || 'Archivo'}`} fontSize={24} />
                  <Divider />
                  <Button text="Arrastra elementos desde el Toolbox" />
                </Element>
              )}
            </Frame>
          </div>
        </div>
      </Editor>
    </div>
  );
};
