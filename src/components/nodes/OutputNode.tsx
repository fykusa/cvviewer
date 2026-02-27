import { Handle, Position, NodeProps } from 'reactflow';
import { ArrowRightCircle } from 'lucide-react';
import { NodeData } from '../../types';

export default function OutputNode({ data, selected }: NodeProps<NodeData['data']>) {
  return (
    <div
      className={`
        px-4 py-2 rounded-lg border-2 min-w-[150px] bg-emerald-50
        ${selected ? 'border-emerald-500 shadow-lg ring-2 ring-offset-2 ring-emerald-400' : 'border-emerald-300'}
        hover:shadow-md transition-shadow
      `}
    >
      <Handle type="target" position={Position.Bottom} className="!bg-emerald-500" />

      <div className="flex items-center gap-2">
        <ArrowRightCircle className="w-4 h-4 text-emerald-600" />
        <div className="flex-1">
          <div className="font-semibold text-sm text-gray-800">{data.label}</div>
          <div className="text-xs text-emerald-600 font-medium">Final Output</div>
        </div>
      </div>
    </div>
  );
}