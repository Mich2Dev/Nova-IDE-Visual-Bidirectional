import { useEditor, Element } from '@craftjs/core';
import { Container } from './Container';
import { Text } from './Text';
import { Button } from './Button';
import { Image } from './Image';
import { Divider } from './Divider';
import { Type, Square, LayoutPanelTop, Image as ImageIcon, Minus, MousePointerClick } from 'lucide-react';

export const Toolbox = () => {
  const { connectors } = useEditor();

  const ToolItem = ({ icon: Icon, label, component, createFn }: { icon: any, label: string, component?: any, createFn?: any }) => (
    <button 
      type="button"
      title={`Arrastrar ${label}`}
      aria-label={`Herramienta para añadir ${label}`}
      className="flex flex-col items-center justify-center gap-1.5 p-2.5 border border-white/5 rounded-lg bg-[#111116] hover:bg-white/5 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary/50 hover:border-primary/50 text-xs transition-all group"
      ref={(ref) => { 
        if (ref) {
          if (createFn) connectors.create(ref, createFn());
          else connectors.create(ref, <Element is={component} canvas={component === Container} />);
        }
      }}
    >
      <Icon className="w-5 h-5 text-gray-500 group-hover:text-primary group-focus:text-primary transition-colors" />
      <span className="text-[10px] font-medium text-gray-400 group-hover:text-gray-200 group-focus:text-gray-200">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#0D0D13]">
      <div className="p-3 grid grid-cols-2 gap-2 overflow-y-auto custom-scrollbar">
        
        {/* Layout */}
        <div className="col-span-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider mt-1 mb-1">Estructura</div>
        <ToolItem icon={Square} label="Contenedor" component={Container} />
        <ToolItem icon={LayoutPanelTop} label="Hero Section" createFn={() => <Element is={Container} padding={40} background="#1e1e24" canvas />} />
        
        {/* Contenido */}
        <div className="col-span-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider mt-3 mb-1">Contenido</div>
        <ToolItem icon={Type} label="Texto" component={Text} />
        <ToolItem icon={MousePointerClick} label="Botón" component={Button} />
        <ToolItem icon={ImageIcon} label="Imagen" component={Image} />
        <ToolItem icon={Minus} label="Divisor" component={Divider} />

      </div>
    </div>
  );
};
