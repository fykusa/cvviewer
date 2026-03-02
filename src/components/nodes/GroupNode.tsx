import { NodeProps, NodeResizer, useReactFlow } from 'reactflow';
import { GroupData } from '../../types';

export default function GroupNode({ id, data, selected }: NodeProps<GroupData>) {
  const { setNodes } = useReactFlow();

  const borderColor = data.borderColor || '#fbbf24';
  const bgColor = data.bgColor || 'rgba(255, 251, 235, 0.4)';
  const titleColor = data.titleColor || '#92400e';
  const commentColor = data.commentColor || '#d97706';

  return (
    <>
      <NodeResizer
        color={borderColor}
        isVisible={selected}
        minWidth={120}
        minHeight={80}
        onResizeEnd={(_evt, params) => {
          setNodes(nds =>
            nds.map(n =>
              n.id === id
                ? { ...n, style: { ...n.style, width: params.width, height: params.height } }
                : n
            )
          );
        }}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: bgColor,
          border: `2px dashed ${borderColor}`,
          borderRadius: 12,
        }}
      >
        <div style={{ borderBottom: `1px solid ${borderColor}60` }} className="px-3 py-2">
          <div style={{ color: titleColor }} className="text-sm font-semibold">{data.label}</div>
          {data.comment && (
            <div style={{ color: commentColor }} className="text-xs mt-1 whitespace-pre-wrap">
              {data.comment}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
