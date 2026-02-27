import { Handle, Position, NodeProps } from 'reactflow';
import { Database } from 'lucide-react';
import { NodeData } from '../../types';

export default function DataSourceNode({ data, selected }: NodeProps<NodeData['data']>) {
  return (
    <div
      className={`
        px-4 py-2 rounded-lg border-2 min-w-[200px] bg-gray-50
        ${selected ? 'border-gray-600 shadow-lg ring-2 ring-offset-2 ring-gray-400' : 'border-gray-400'}
        hover:shadow-md transition-shadow
      `}
    >
      <Handle type="source" position={Position.Top} className="!bg-gray-600" />

      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-gray-600" />
        <div className="flex-1">
          <div className="font-semibold text-sm text-gray-800">{data.label}</div>
          <div className="text-xs text-gray-500">Database Table</div>
          {data.dataSourceInfo?.schemaName && (
            <div className="text-xs text-gray-400 mt-1">
              {data.dataSourceInfo.schemaName}.{data.dataSourceInfo.columnObjectName}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}