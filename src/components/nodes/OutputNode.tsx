import { Handle, Position, NodeProps } from 'reactflow';
import { ArrowRightCircle, MessageSquare } from 'lucide-react';
import { NodeData } from '../../types';
import { useTheme } from '../../context/ThemeContext';

export default function OutputNode({ data, selected }: NodeProps<NodeData['data']>) {
  const { theme } = useTheme();
  const colors = theme.output;

  return (
    <div
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
      className={`
        relative overflow-visible px-4 py-2 rounded-lg border-2 min-w-[180px]
        ${data.searchMatch === 'node' ? 'ring-4 ring-[#f42c16] !border-[#f42c16] !bg-red-50 shadow-xl' :
          data.searchMatch === 'attribute' ? 'ring-4 ring-cyan-400 !border-cyan-500 shadow-xl' :
          data.columnFlowHighlight === 'up' ? 'ring-2 ring-[#f73be7] !border-[#f73be7] shadow-lg' :
          data.columnFlowHighlight === 'down' ? 'ring-2 ring-[#4ae80b] !border-[#4ae80b] shadow-lg' :
            selected ? 'shadow-lg ring-2 ring-offset-2 ring-emerald-400' : ''
        }
        hover:shadow-md transition-shadow
      `}
    >
      <Handle type="target" position={Position.Bottom} style={{ backgroundColor: colors.icon }} className="!border-white" />

      <div className="flex flex-col gap-1 items-center justify-center">
        <div className="flex items-center gap-2">
          <ArrowRightCircle style={{ color: colors.icon }} className="w-5 h-5 text-emerald-600" />
          <div className="flex-1">
            <div style={{ color: colors.text }} className="font-bold text-sm text-center">{data.label}</div>
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
        </div>
        <div style={{ color: colors.icon, backgroundColor: colors.bg, borderColor: colors.border }} className="text-[10px] font-semibold px-2 py-0.5 border rounded-full uppercase tracking-wider">
          {data.type === 'Semantics' ? 'Semantics' : 'Final Output'}
        </div>
      </div>
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