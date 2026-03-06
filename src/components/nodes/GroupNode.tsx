import { NodeProps, NodeResizer, useReactFlow } from 'reactflow';
import { GroupData } from '../../types';
import { useTheme } from '../../context/ThemeContext';

export default function GroupNode({ id, data, selected }: NodeProps<GroupData>) {
  const { setNodes } = useReactFlow();
  const { theme } = useTheme();

  const borderColor = data.borderColor || theme.group.border || '#fbbf24';
  const bgColor = data.bgColor || theme.group.bg || 'rgba(255, 251, 235, 0.4)';
  const titleColor = data.titleColor || theme.group.title || '#92400e';
  const commentColor = data.commentColor || theme.group.comment || '#d97706';

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
          <div style={{ color: titleColor, fontSize: '1.4rem' }} className="font-bold tracking-wide">{data.label}</div>
          {data.comment && (
            <div style={{ color: commentColor, fontSize: '1.3rem' }} className="mt-1 whitespace-pre-wrap leading-relaxed">
              {data.comment}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
