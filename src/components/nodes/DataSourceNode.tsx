import { Handle, Position, NodeProps } from 'reactflow';
import { Database } from 'lucide-react';
import { NodeData } from '../../types';
import { useTheme } from '../../context/ThemeContext';

export default function DataSourceNode({ data, selected }: NodeProps<NodeData['data']>) {
  const { theme } = useTheme();
  const colors = theme.dataSource;

  return (
    <div
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
      className={`
        relative overflow-visible px-4 py-2 rounded-lg border-2 min-w-[200px]
        ${data.searchMatch === 'node' ? 'ring-4 ring-[#f42c16] !border-[#f42c16] !bg-red-50 shadow-xl' :
          data.searchMatch === 'attribute' ? 'ring-4 ring-cyan-400 !border-cyan-500 shadow-xl' :
          data.columnFlowHighlight === 'up' ? 'ring-2 ring-[#f73be7] !border-[#f73be7] shadow-lg' :
          data.columnFlowHighlight === 'down' ? 'ring-2 ring-[#e8a6e2] !border-[#e8a6e2] shadow-lg' :
            selected ? 'shadow-lg ring-2 ring-offset-2 ring-gray-400' : ''
        }
        hover:shadow-md transition-shadow
      `}
    >
      <Handle type="source" position={Position.Top} style={{ backgroundColor: colors.icon }} className="!border-white" />

      <div className="flex items-center gap-2">
        <Database style={{ color: colors.icon }} className="w-4 h-4" />
        <div className="flex-1">
          <div style={{ color: colors.text }} className="font-semibold text-sm">{data.label}</div>
          <div className="text-xs text-gray-500">Database Table</div>
          {data.dataSourceInfo?.schemaName && (
            <div className="text-xs text-gray-400 mt-1">
              {data.dataSourceInfo.schemaName}.{data.dataSourceInfo.columnObjectName}
            </div>
          )}
        </div>
      </div>

      {data.columnFlowLabel && (
        <div className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-10 whitespace-nowrap" style={{ left: 'calc(100% + 6px)' }}>
          <span
            style={{ borderColor: data.columnFlowHighlight === 'up' ? '#f73be7' : '#e8a6e2', color: data.columnFlowHighlight === 'up' ? '#a000a0' : '#9a6099' }}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-white shadow-sm block"
          >
            {data.columnFlowLabel}
          </span>
        </div>
      )}
    </div>
  );
}