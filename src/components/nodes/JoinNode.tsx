import { Handle, Position, NodeProps } from 'reactflow';
import { GitMerge, MessageSquare } from 'lucide-react';
import { NodeData } from '../../types';

export default function JoinNode({ data, selected }: NodeProps<NodeData['data']>) {
  const getJoinColor = () => {
    switch (data.joinType) {
      case 'inner': return 'bg-purple-100 border-purple-500';
      case 'leftOuter': return 'bg-orange-100 border-orange-500';
      case 'rightOuter': return 'bg-yellow-100 border-yellow-500';
      case 'fullOuter': return 'bg-red-100 border-red-500';
      default: return 'bg-gray-100 border-gray-500';
    }
  };

  return (
    <div
      className={`
        px-4 py-2 rounded-lg border-2 min-w-[200px]
        ${getJoinColor()}
        ${selected ? 'shadow-lg ring-2 ring-offset-2 ring-purple-400' : ''}
        hover:shadow-md transition-shadow
      `}
    >
      <Handle type="source" position={Position.Top} className="!bg-purple-500" />
      <Handle type="target" position={Position.Bottom} id="input-left" style={{ left: '30%' }} className="!bg-purple-500" />
      <Handle type="target" position={Position.Bottom} id="input-right" style={{ left: '70%' }} className="!bg-purple-500" />

      <div className="flex items-center gap-2">
        <GitMerge className="w-4 h-4 text-purple-600" />
        <div className="flex-1">
          <div className="font-semibold text-sm text-gray-800">{data.label}</div>
          <div className="text-xs text-gray-500">
            {data.joinType || 'inner'} Join
          </div>
        </div>
        {data.comment && (
          <div title="This node has a comment. Select it to read.">
            <MessageSquare className="w-4 h-4 text-purple-500 fill-purple-100" />
          </div>
        )}
      </div>

      {data.inputs && data.inputs.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-300">
          {data.inputs.map((inp: { nodeId: string }, i: number) => (
            <div key={i} className="text-xs text-purple-700 font-mono truncate">← {inp.nodeId}</div>
          ))}
        </div>
      )}


    </div>
  );
}