import { Handle, Position, NodeProps } from 'reactflow';
import { Shuffle, MessageSquare, Filter } from 'lucide-react';
import { NodeData } from '../../types';
import { useTheme } from '../../context/ThemeContext';

export default function UnionNode({ data, selected }: NodeProps<NodeData['data']>) {
    const { theme } = useTheme();
    const colors = theme.union;

    return (
        <div
            style={{ backgroundColor: colors.bg, borderColor: colors.border }}
            className={`
        px-4 py-2 rounded-lg border-2 min-w-[200px]
        ${data.searchMatch === 'node' ? 'ring-4 ring-[#f42c16] !border-[#f42c16] !bg-red-50 shadow-xl' :
                    data.searchMatch === 'attribute' ? 'ring-4 ring-cyan-400 !border-cyan-500 shadow-xl' :
                        selected ? 'shadow-lg ring-2 ring-offset-2 ring-indigo-400' : ''
                }
        hover:shadow-md transition-shadow
      `}
        >
            <Handle type="source" position={Position.Top} style={{ backgroundColor: colors.icon }} className="!border-white" />
            <Handle type="target" position={Position.Bottom} id="input-left" style={{ left: '30%', backgroundColor: colors.icon }} className="!border-white" />
            <Handle type="target" position={Position.Bottom} id="input-right" style={{ left: '70%', backgroundColor: colors.icon }} className="!border-white" />

            <div className="flex items-center gap-2">
                <Shuffle style={{ color: colors.icon }} className="w-4 h-4" />
                <div className="flex-1">
                    <div style={{ color: colors.text }} className="font-semibold text-sm">{data.label}</div>
                    <div className="text-xs text-gray-500">Union</div>
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

            {data.inputs && data.inputs.length > 0 && (
                <div style={{ borderTopColor: colors.border }} className="mt-2 pt-2 border-t opacity-50">
                    {data.inputs.map((inp: { nodeId: string }, i: number) => (
                        <div key={i} style={{ color: colors.text }} className="text-xs font-mono truncate">← {inp.nodeId}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
