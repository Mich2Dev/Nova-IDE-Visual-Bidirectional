import { useEditor } from '@craftjs/core';
import { useDraftStore } from '../../draft/useDraftStore';
import { useStore } from '../../store/useStore';

type SetPropFn = (cb: (props: Record<string, unknown>) => void) => void;

const label = (text: string) => (
  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">
    {text}
  </label>
);

const inputCls =
  'w-full rounded-md border border-white/10 bg-[#0f172a] px-2 py-1.5 text-xs text-gray-200 outline-none focus:border-indigo-500/50';

function TextPropertiesForm({ props, setProp }: { props: Record<string, unknown>; setProp: SetPropFn }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        {label('Contenido')}
        <textarea
          value={String(props.text ?? '')}
          onChange={(e) => setProp((p) => { p.text = e.target.value; })}
          className={`${inputCls} min-h-[60px] resize-y`}
        />
      </div>
      <div>
        {label('Clase CSS')}
        <input
          value={String(props.className ?? '')}
          onChange={(e) => setProp((p) => { p.className = e.target.value; })}
          placeholder="ej. text-xl font-bold"
          className={inputCls}
        />
      </div>
      <div>
        {label('Tipo')}
        <select
          value={String(props.tag ?? 'p')}
          onChange={(e) => setProp((p) => { p.tag = e.target.value; })}
          className={inputCls}
        >
          <option value="h1">H1</option>
          <option value="h2">H2</option>
          <option value="h3">H3</option>
          <option value="p">Párrafo</option>
          <option value="span">Inline</option>
        </select>
      </div>
      <div className="grid grid-cols-[40px_1fr] items-end gap-2">
        <div>
          {label('Color')}
          <input
            type="color"
            value={String(props.color ?? '#1e293b')}
            onChange={(e) => setProp((p) => { p.color = e.target.value; })}
            className="h-8 w-full cursor-pointer rounded border border-white/10"
          />
        </div>
        <div>
          {label(`Tamaño: ${props.fontSize ?? 16}px`)}
          <input
            type="range"
            min={8}
            max={96}
            value={Number(props.fontSize ?? 16)}
            onChange={(e) => setProp((p) => { p.fontSize = +e.target.value; })}
            className="w-full accent-indigo-500"
          />
        </div>
      </div>
      <div>
        {label('Peso')}
        <select
          value={String(props.fontWeight ?? '400')}
          onChange={(e) => setProp((p) => { p.fontWeight = e.target.value; })}
          className={inputCls}
        >
          {['300', '400', '500', '600', '700', '800'].map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>
      <div>
        {label('Alineación')}
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => setProp((p) => { p.textAlign = align; })}
              className={`flex-1 rounded py-1 text-[10px] border transition-colors ${
                props.textAlign === align
                  ? 'border-indigo-500 bg-indigo-600 text-white'
                  : 'border-white/10 bg-[#0f172a] text-gray-400 hover:border-white/20'
              }`}
            >
              {align === 'left' ? 'Izq' : align === 'center' ? 'Centro' : 'Der'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ButtonPropertiesForm({ props, setProp }: { props: Record<string, unknown>; setProp: SetPropFn }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        {label('Texto')}
        <input
          value={String(props.text ?? '')}
          onChange={(e) => setProp((p) => { p.text = e.target.value; })}
          className={inputCls}
        />
      </div>
      <div>
        {label('Clase CSS')}
        <input
          value={String(props.className ?? '')}
          onChange={(e) => setProp((p) => { p.className = e.target.value; })}
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          {label('Fondo')}
          <input
            type="color"
            value={String(props.background ?? '#6366f1')}
            onChange={(e) => setProp((p) => { p.background = e.target.value; })}
            className="h-8 w-full cursor-pointer rounded border border-white/10"
          />
        </div>
        <div>
          {label('Texto')}
          <input
            type="color"
            value={String(props.color ?? '#ffffff')}
            onChange={(e) => setProp((p) => { p.color = e.target.value; })}
            className="h-8 w-full cursor-pointer rounded border border-white/10"
          />
        </div>
      </div>
    </div>
  );
}

function ContainerPropertiesForm({ props, setProp }: { props: Record<string, unknown>; setProp: SetPropFn }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        {label('Clase CSS')}
        <input
          value={String(props.className ?? '')}
          onChange={(e) => setProp((p) => { p.className = e.target.value; })}
          className={inputCls}
        />
      </div>
      <div>
        {label('Fondo')}
        <input
          type="color"
          value={String(props.background ?? '#ffffff')}
          onChange={(e) => setProp((p) => { p.background = e.target.value; })}
          className="h-8 w-full cursor-pointer rounded border border-white/10"
        />
      </div>
      <div>
        {label(`Padding: ${props.padding ?? 0}px`)}
        <input
          type="range"
          min={0}
          max={80}
          value={Number(props.padding ?? 0)}
          onChange={(e) => setProp((p) => { p.padding = +e.target.value; })}
          className="w-full accent-indigo-500"
        />
      </div>
      <div>
        {label(`Radio: ${props.radius ?? 0}px`)}
        <input
          type="range"
          min={0}
          max={48}
          value={Number(props.radius ?? 0)}
          onChange={(e) => setProp((p) => { p.radius = +e.target.value; })}
          className="w-full accent-indigo-500"
        />
      </div>
    </div>
  );
}

function ImagePropertiesForm({ props, setProp }: { props: Record<string, unknown>; setProp: SetPropFn }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        {label('URL')}
        <input
          value={String(props.src ?? '')}
          onChange={(e) => setProp((p) => { p.src = e.target.value; })}
          className={inputCls}
        />
      </div>
      <div>
        {label('Alt')}
        <input
          value={String(props.alt ?? '')}
          onChange={(e) => setProp((p) => { p.alt = e.target.value; })}
          className={inputCls}
        />
      </div>
    </div>
  );
}

export function ElementProperties({ nodeId, isHoverPreview }: { nodeId: string; isHoverPreview?: boolean }) {
  const { actions, nodeInfo } = useEditor((state) => {
    const node = state.nodes[nodeId];
    if (!node) return { nodeInfo: null as null };
    const type = (node.data.type as { resolvedName?: string })?.resolvedName ?? String(node.data.type);
    return {
      nodeInfo: {
        type,
        displayName: String(node.data.displayName ?? node.data.name ?? type),
        props: (node.data.props as Record<string, unknown>) ?? {},
        isDeletable: nodeId !== 'ROOT',
      },
    };
  });

  if (!nodeInfo) return null;

  const setProp: SetPropFn = (cb) => {
    const activeTabId = useStore.getState().activeTabId;
    if (activeTabId) useDraftStore.getState().markUserTouchedVisual(activeTabId);
    actions.setProp(nodeId, cb);
  };

  const form = (() => {
    switch (nodeInfo.type) {
      case 'Text': return <TextPropertiesForm props={nodeInfo.props} setProp={setProp} />;
      case 'Button': return <ButtonPropertiesForm props={nodeInfo.props} setProp={setProp} />;
      case 'Container': return <ContainerPropertiesForm props={nodeInfo.props} setProp={setProp} />;
      case 'Image': return <ImagePropertiesForm props={nodeInfo.props} setProp={setProp} />;
      default: return (
        <p className="text-[10px] text-gray-500">Propiedades básicas no disponibles para este tipo.</p>
      );
    }
  })();

  return (
    <div className="flex h-full flex-col">
      <div className={`border-b px-3 py-2.5 ${isHoverPreview ? 'border-blue-500/20 bg-blue-500/5' : 'border-white/5 bg-black/20'}`}>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              {isHoverPreview ? 'Hover' : 'Seleccionado'}
            </p>
            <p className="truncate text-xs font-semibold text-gray-200">{nodeInfo.displayName}</p>
            {nodeInfo.props.className ? (
              <p className="truncate font-mono text-[9px] text-indigo-300/80">.{String(nodeInfo.props.className).split(' ')[0]}</p>
            ) : null}
          </div>
          {nodeInfo.isDeletable && !isHoverPreview && (
            <button
              type="button"
              onClick={() => actions.delete(nodeId)}
              className="rounded-md bg-red-500/10 px-2 py-1 text-[10px] text-red-400 hover:bg-red-500 hover:text-white"
            >
              Eliminar
            </button>
          )}
        </div>
        {isHoverPreview && (
          <p className="mt-1.5 text-[9px] text-blue-300/70">Clic en el elemento para fijar la selección</p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">{form}</div>
    </div>
  );
}
