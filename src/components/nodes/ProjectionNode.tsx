import { Handle, Position, NodeProps } from 'reactflow';
import { Copy, MessageSquare } from 'lucide-react';
import { NodeData } from '../../types';

export default function ProjectionNode({ data, selected }: NodeProps<NodeData['data']>) {
  return (
    <div
      className={`
        px-4 py-2 rounded-lg border-2 bg-white min-w-[200px]
        ${selected ? 'border-blue-500 shadow-lg' : 'border-blue-200'}
        hover:shadow-md transition-shadow
      `}
    >
      <Handle type="target" position={Position.Bottom} className="!bg-blue-500" />

      <div className="flex items-center gap-2">
        <Copy className="w-4 h-4 text-blue-600" />
        <div className="flex-1">
          <div className="font-semibold text-sm text-gray-800">{data.label}</div>
          <div className="text-xs text-gray-500">Projection</div>
        </div>
        {data.comment && (
          <div title="This node has a comment. Select it to read.">
            <MessageSquare className="w-4 h-4 text-blue-500 fill-blue-100" />
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
        <div className="mt-1 pt-1 border-t border-blue-100">
          {data.inputs.map((inp: { nodeId: string }, i: number) => (
            <div key={i} className="text-xs text-blue-600 font-mono truncate">← {inp.nodeId}</div>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Top} className="!bg-blue-500" />
    </div>
  );
}