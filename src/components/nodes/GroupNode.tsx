import { NodeProps } from 'reactflow';

export interface GroupData {
  id: string;
  label: string;
  comment?: string;
}

export default function GroupNode({ data, selected }: NodeProps<GroupData>) {
  return (
    <div
      style={{ width: '100%', height: '100%' }}
      className={`rounded-xl border-2 border-dashed bg-amber-50/40 backdrop-blur-sm
        ${selected ? 'border-amber-500' : 'border-amber-300'}`}
    >
      <div className="px-3 py-2 border-b border-amber-300/60">
        <div className="text-sm font-semibold text-amber-800">{data.label}</div>
        {data.comment && (
          <div className="text-xs text-amber-600 mt-1 whitespace-pre-wrap">{data.comment}</div>
        )}
      </div>
    </div>
  );
}
