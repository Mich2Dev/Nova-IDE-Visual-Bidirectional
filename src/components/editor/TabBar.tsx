import React from 'react';
import { useStore } from '../../store/useStore';
import { X } from 'lucide-react';

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, closeTab } = useStore();

  if (tabs.length === 0) return null;

  return (
    <div className="flex bg-[#0D0D11] border-b border-white/5 overflow-x-auto h-9 shrink-0 no-scrollbar">
      {tabs.map(tab => (
        <div
          key={tab.path}
          onClick={() => setActiveTab(tab.path)}
          className={`flex items-center gap-2 px-3 py-1.5 min-w-[120px] max-w-[200px] border-r border-white/5 cursor-pointer group transition-colors select-none ${
            activeTabId === tab.path 
              ? 'bg-[#1a1a24] text-indigo-400 border-t-2 border-t-indigo-500' 
              : 'text-gray-500 hover:bg-[#1a1a24]/50 border-t-2 border-t-transparent hover:text-gray-300'
          }`}
        >
          <span className="text-xs truncate flex-1 font-mono">
            {tab.name}
          </span>
          <div className="flex items-center w-4 h-4 justify-center">
            {tab.isDirty ? (
              <div className="w-2 h-2 rounded-full bg-white/40 group-hover:hidden" />
            ) : null}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.path);
              }}
              className={`hover:bg-white/10 p-0.5 rounded transition-colors ${tab.isDirty ? 'hidden group-hover:flex' : 'flex'}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
