import { Handle, Position, NodeProps } from 'reactflow';
import { ArrowRightCircle, MessageSquare } from 'lucide-react';
import { NodeData } from '../../types';

export default function OutputNode({ data, selected }: NodeProps<NodeData['data']>) {
  return (
    <div
      className={`
        px-4 py-2 rounded-lg border-2 min-w-[180px] bg-emerald-50
        ${selected ? 'border-emerald-500 shadow-lg ring-2 ring-offset-2 ring-emerald-400' : 'border-emerald-300'}
        hover:shadow-md transition-shadow
      `}
    >
      <Handle type="target" position={Position.Bottom} className="!bg-emerald-500" />

      <div className="flex flex-col gap-1 items-center justify-center">
        <div className="flex items-center gap-2">
          <ArrowRightCircle className="w-5 h-5 text-emerald-600" />
          <div className="flex-1">
            <div className="font-bold text-sm text-gray-800 text-center">{data.label}</div>
          </div>
          {data.comment && (
            <div title="This node has a comment. Select it to read.">
              <MessageSquare className="w-4 h-4 text-emerald-500 fill-emerald-100" />
            </div>
          )}
        </div>
        <div className="text-[10px] text-emerald-700 font-semibold px-2 py-0.5 bg-emerald-100 rounded-full uppercase tracking-wider">
          {data.type === 'Semantics' ? 'Semantics' : 'Final Output'}
        </div>
      </div>
    </div>
  );
}