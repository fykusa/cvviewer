import { Handle, Position, NodeProps } from 'reactflow';
import { Shuffle } from 'lucide-react';
import { NodeData } from '../../types';

export default function UnionNode({ data, selected }: NodeProps<NodeData['data']>) {
    return (
        <div
            className={`
        px-4 py-2 rounded-lg border-2 min-w-[200px] bg-indigo-50
        ${selected ? 'border-indigo-500 shadow-lg ring-2 ring-offset-2 ring-indigo-400' : 'border-indigo-300'}
        hover:shadow-md transition-shadow
      `}
        >
            <Handle type="source" position={Position.Top} className="!bg-indigo-500" />
            <Handle type="target" position={Position.Bottom} id="input-left" style={{ left: '30%' }} className="!bg-indigo-500" />
            <Handle type="target" position={Position.Bottom} id="input-right" style={{ left: '70%' }} className="!bg-indigo-500" />

            <div className="flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-indigo-600" />
                <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-800">{data.label}</div>
                    <div className="text-xs text-gray-500">Union</div>
                </div>
            </div>

            {data.inputs && data.inputs.length > 0 && (
                <div className="mt-2 pt-2 border-t border-indigo-200">
                    {data.inputs.map((inp: { nodeId: string }, i: number) => (
                        <div key={i} className="text-xs text-indigo-700 font-mono truncate">← {inp.nodeId}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
