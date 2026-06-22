import React from 'react';
import { useEditor } from '@craftjs/core';

export const SettingsPanel = () => {
  const { selected, hasSelectedNode, actions } = useEditor((state, query) => {
    const currentNodeId = state.events.selected;
    let selected;

    if (currentNodeId && state.nodes[currentNodeId]) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.name,
        settings: state.nodes[currentNodeId].related?.settings,
        isDeletable: currentNodeId !== 'ROOT' // La raíz nunca se borra
      };
    }

    return {
      selected,
      hasSelectedNode: state.events.selected != null,
      actions: query.node // we don't return actions directly, we use useEditor destructured actions
    };
  });

  // Actually useEditor gives us actions directly
  const { actions: editorActions } = useEditor();

  return hasSelectedNode && selected ? (
    <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar h-full">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
        <h3 className="text-xs font-bold text-gray-200">Settings: {selected.name}</h3>
        {selected.isDeletable && (
          <button 
            onClick={() => editorActions.delete(selected.id)}
            className="text-[10px] bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-2 py-1 rounded transition-colors"
          >
            Eliminar
          </button>
        )}
      </div>
      {selected.settings && React.createElement(selected.settings)}
    </div>
  ) : (
    <div className="p-4 text-xs text-gray-500 text-center">
      Selecciona un elemento para editarlo
    </div>
  );
};

