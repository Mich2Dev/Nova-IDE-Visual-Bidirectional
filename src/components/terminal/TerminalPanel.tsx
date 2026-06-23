import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { parseBuildErrorsFromLines } from '../../lib/parseBuildErrors';
import { useContextStore } from '../../context/useContextStore';
import { useLayoutStore } from '../../store/useLayoutStore';
import { ResizeHandle } from '../layout/ResizeHandle';
import { Terminal as TerminalIcon, X, Trash2, ChevronUp } from 'lucide-react';

const nova = (window as any).novaAPI;

export const TerminalPanel: React.FC = () => {
  const { terminalOutput, terminalVisible, addTerminalLine, clearTerminal, toggleTerminal, projectPath } = useStore();
  const terminalHeight = useLayoutStore((s) => s.terminalHeight);
  const nudgeTerminal = useLayoutStore((s) => s.nudgeTerminal);
  const setBuildErrors = useContextStore((s) => s.setBuildErrors);
  const [cmd, setCmd] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBuildErrors(parseBuildErrorsFromLines(terminalOutput));
  }, [terminalOutput, setBuildErrors]);

  useEffect(() => {
    const unsub = nova?.onTerminalOutput?.((data: any) => {
      if (data.type === 'stdout' || data.type === 'stderr') {
        addTerminalLine(data.data);
      } else if (data.type === 'exit') {
        addTerminalLine(`\n[Proceso terminó con código ${data.code}]\n`);
      }
    });
    return () => unsub?.();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput]);

  const runCommand = async () => {
    const command = cmd.trim();
    if (!command) return;
    addTerminalLine(`$ ${command}\n`);
    setCmd('');

    const cwd = projectPath || '.';
    const parts = command.split(' ');
    const mainCmd = parts[0];
    const args = parts.slice(1);

    // Use spawn for streaming (npm, node, etc.) vs exec for simple commands
    const streamCmds = ['npm', 'npx', 'node', 'python', 'pip', 'git'];
    if (streamCmds.includes(mainCmd)) {
      await nova.spawnCommand(mainCmd, args, cwd);
    } else {
      const result = await nova.execCommand(command, cwd);
      if (result.stdout) addTerminalLine(result.stdout);
      if (result.stderr) addTerminalLine(result.stderr);
      if (result.error) addTerminalLine(`Error: ${result.error}\n`);
    }
  };

  if (!terminalVisible) {
    return (
      <div className="h-7 bg-[#0D0D13] border-t border-white/5 flex items-center px-3 gap-2 cursor-pointer hover:bg-white/3 transition-colors" onClick={toggleTerminal}>
        <TerminalIcon className="w-3 h-3 text-gray-600" />
        <span className="text-[10px] text-gray-600 uppercase tracking-wider">Terminal</span>
        <ChevronUp className="w-3 h-3 text-gray-700 ml-auto" />
      </div>
    );
  }

  return (
    <>
      <ResizeHandle direction="vertical" onResize={nudgeTerminal} />
      <div className="bg-[#0A0A10] border-t border-white/5 flex flex-col shrink-0" style={{ height: terminalHeight }}>
      {/* Terminal header */}
      <div className="h-7 bg-[#0D0D13] border-b border-white/5 flex items-center px-3 gap-2 shrink-0">
        <TerminalIcon className="w-3 h-3 text-emerald-500" />
        <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Terminal</span>
        <span className="text-[10px] text-gray-600 font-mono">{projectPath || '~'}</span>
        <div className="ml-auto flex gap-1">
          <button onClick={clearTerminal} title="Limpiar" className="text-gray-600 hover:text-gray-300 p-1 rounded hover:bg-white/5 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
          <button onClick={toggleTerminal} title="Cerrar" className="text-gray-600 hover:text-gray-300 p-1 rounded hover:bg-white/5 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] text-gray-300 leading-relaxed custom-scrollbar">
        {terminalOutput.length === 0 ? (
          <span className="text-gray-700">Terminal lista. Escribe un comando abajo.</span>
        ) : (
          terminalOutput.map((line, i) => (
            <span key={i} className={`block whitespace-pre-wrap ${line.startsWith('$') ? 'text-emerald-400 font-bold' : line.startsWith('Error') || line.includes('ERR') ? 'text-red-400' : 'text-gray-300'}`}>
              {line}
            </span>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-white/5 bg-black/20 shrink-0">
        <span className="text-emerald-500 font-mono text-[11px] font-bold shrink-0">$</span>
        <input
          ref={inputRef}
          type="text"
          value={cmd}
          onChange={e => setCmd(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') runCommand(); }}
          placeholder="npm install, git status, ..."
          className="flex-1 bg-transparent font-mono text-[11px] text-gray-200 outline-none placeholder-gray-700"
          autoFocus
        />
      </div>
    </div>
    </>
  );
};
