import { Handle, Position, NodeProps } from 'reactflow';
import { Copy, MessageSquare, Filter } from 'lucide-react';
import { NodeData } from '../../types';
import { useTheme } from '../../context/ThemeContext';

export default function ProjectionNode({ data, selected }: NodeProps<NodeData['data']>) {
  const { theme } = useTheme();
  const colors = theme.projection;

  return (
    <div
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
      className={`
        relative overflow-visible px-4 py-2 rounded-lg border-2 min-w-[200px]
        ${data.searchMatch === 'node' ? 'ring-4 ring-[#f42c16] !border-[#f42c16] !bg-red-50 shadow-xl' :
          data.searchMatch === 'attribute' ? 'ring-4 ring-cyan-400 !border-cyan-500 shadow-xl' :
          data.columnFlowHighlight === 'up' ? 'ring-2 ring-[#f73be7] !border-[#f73be7] shadow-lg' :
          data.columnFlowHighlight === 'down' ? 'ring-2 ring-[#4ae80b] !border-[#4ae80b] shadow-lg' :
            selected ? 'shadow-lg ring-2 ring-offset-2 ring-blue-400' : ''
        }
        hover:shadow-md transition-shadow
      `}
    >
      <Handle type="target" position={Position.Bottom} style={{ backgroundColor: colors.icon }} className="!border-white" />

      <div className="flex items-center gap-2">
        <div
          title="View Projection Diagram"
          className="cursor-pointer hover:scale-110 hover:brightness-110 transition-all opacity-80 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(
              new CustomEvent('open-node-projection', { detail: { nodeId: data.id } })
            );
          }}
        >
          <Copy style={{ color: colors.icon }} className="w-5 h-5 drop-shadow-sm" />
        </div>
        <div className="flex-1">
          <div style={{ color: colors.text }} className="font-semibold text-sm">{data.label}</div>
          <div className="text-xs text-gray-500">Projection</div>
        </div>
        {data.comment && (
          <div
            title="This node has a comment. Click to read."
            className="cursor-pointer hover:scale-110 hover:brightness-110 transition-all opacity-80 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(
                new CustomEvent('open-node-comment', { detail: { nodeId: data.id } })
              );
            }}
          >
            <MessageSquare style={{ color: colors.icon, fill: colors.bg }} className="w-5 h-5 drop-shadow-sm" />
          </div>
        )}
        {data.filter && (
          <div
            title="This node has a filter. Click to view."
            className="cursor-pointer hover:scale-110 hover:brightness-110 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(
                new CustomEvent('open-node-filter', { detail: { nodeId: data.id } })
              );
            }}
          >
            <Filter className="w-5 h-5 text-orange-500 fill-orange-100 drop-shadow-sm" />
          </div>
        )}
      </div>

      {data.attributes && data.attributes.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
          <div className="text-xs text-gray-400">
            {data.attributes.filter((a: { isCalculated?: boolean }) => !a.isCalculated).length} attrs
            {data.attributes.filter((a: { isCalculated?: boolean }) => a.isCalculated).length > 0 &&
              ` + ${data.attributes.filter((a: { isCalculated?: boolean }) => a.isCalculated).length} calc`}
          </div>
        </div>
      )}
      {data.inputs && data.inputs.length > 0 && (
        <div style={{ borderTopColor: colors.border }} className="mt-1 pt-1 border-t opacity-50">
          {data.inputs.map((inp: { nodeId: string }, i: number) => (
            <div key={i} style={{ color: colors.text }} className="text-xs font-mono truncate">← {inp.nodeId}</div>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Top} style={{ backgroundColor: colors.icon }} className="!border-white" />

      {data.columnFlowLabel && (
        <div className="absolute pointer-events-none z-10 whitespace-nowrap" style={{ top: '-10px', right: '-30px' }}>
          <span
            style={{ backgroundColor: data.columnFlowHighlight === 'up' ? '#f97316' : '#fb923c' }}
            className="text-[10px] font-mono font-semibold text-white px-1.5 py-0.5 rounded shadow-sm block"
          >
            {data.columnFlowLabel}
          </span>
        </div>
      )}
    </div>
  );
}