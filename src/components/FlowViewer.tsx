import React, { useCallback, useImperativeHandle, forwardRef, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  NodeTypes,
  BackgroundVariant,
  SelectionMode,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import ProjectionNode from './nodes/ProjectionNode';
import JoinNode from './nodes/JoinNode';
import AggregationNode from './nodes/AggregationNode';
import DataSourceNode from './nodes/DataSourceNode';
import OutputNode from './nodes/OutputNode';
import UnionNode from './nodes/UnionNode';
import GroupNode from './nodes/GroupNode';

const nodeTypes: NodeTypes = {
  projectionNode: ProjectionNode,
  joinNode: JoinNode,
  aggregationNode: AggregationNode,
  dataSource: DataSourceNode,
  outputNode: OutputNode,
  unionNode: UnionNode,
  groupNode: GroupNode,
};

export interface FlowViewerHandle {
  getCurrentNodes: () => Node[];
  applyLayout: (newNodes: Node[]) => void;
  applyEdges: (newEdges: Edge[]) => void;
  focusNode: (nodeId: string) => void;
}

interface FlowViewerProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodeClick?: (node: Node) => void;
  onGroupDeleted?: (groupId: string) => void;
}

const FlowViewer = forwardRef<FlowViewerHandle, FlowViewerProps>(
  ({ initialNodes, initialEdges, onNodeClick, onGroupDeleted }, ref) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

    useImperativeHandle(ref, () => ({
      getCurrentNodes: () => nodes,
      applyLayout: (newNodes: Node[]) => { setNodes(newNodes); },
      applyEdges: (newEdges: Edge[]) => { setEdges(newEdges); },
      focusNode: (nodeId: string) => {
        if (!rfInstance) return;
        const targetNode = nodes.find(n => n.id === nodeId);
        if (targetNode) {
          rfInstance.fitView({ nodes: [{ id: nodeId }], duration: 800, maxZoom: 1 });
          setNodes((prev) =>
            prev.map((n) => ({
              ...n,
              selected: n.id === nodeId,
            }))
          );
        }
      }
    }));

    // Synchronize data (e.g., searchMatch) from prop changes without resetting node positions.
    // Only runs when initialNodes reference changes (triggered by useMemo in App.tsx).
    useEffect(() => {
      setNodes(prev => {
        const propMap = new Map(initialNodes.map(n => [n.id, n]));
        return prev.map(n => {
          const incoming = propMap.get(n.id);
          if (!incoming) return n;
          // Preserve live position/selected state but update data
          return { ...n, data: incoming.data };
        });
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialNodes]);

    const handleNodeClick = useCallback(
      (_event: React.MouseEvent, node: Node) => {
        if (onNodeClick) {
          onNodeClick(node);
        }
      },
      [onNodeClick]
    );

    // Intercept arrow keys before ReactFlow handles them.
    // ArrowUp/Down expand selection to connected nodes instead of moving them.
    const wrapperRef = useRef<HTMLDivElement>(null);
    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);
    useEffect(() => { nodesRef.current = nodes; }, [nodes]);
    useEffect(() => { edgesRef.current = edges; }, [edges]);

    useEffect(() => {
      const el = wrapperRef.current;
      if (!el) return;
      const onKeyDown = (e: KeyboardEvent) => {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
        const selected = nodesRef.current.filter(n => n.selected);
        if (selected.length === 0) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        const selectedIds = new Set(selected.map(n => n.id));
        const toAdd = new Set<string>();
        if (e.key === 'ArrowUp') {
          // Expand toward data consumers (edge.source → edge.target)
          selectedIds.forEach(id => {
            edgesRef.current.forEach(edge => { if (edge.source === id) toAdd.add(edge.target); });
          });
        } else {
          // Expand toward data providers (edge.target ← edge.source)
          selectedIds.forEach(id => {
            edgesRef.current.forEach(edge => { if (edge.target === id) toAdd.add(edge.source); });
          });
        }
        if (toAdd.size === 0) return;
        setNodes(prev => prev.map(n => ({ ...n, selected: selectedIds.has(n.id) || toAdd.has(n.id) })));
      };
      el.addEventListener('keydown', onKeyDown, { capture: true });
      return () => el.removeEventListener('keydown', onKeyDown, { capture: true });
    }, []);

    const handleNodesDelete = useCallback((deletedNodes: Node[]) => {
      const deletedGroupIds = new Set(
        deletedNodes.filter(n => n.type === 'groupNode').map(n => n.id)
      );
      if (deletedGroupIds.size === 0) return;
      setNodes(prev => prev.map(n => {
        if (n.parentId && deletedGroupIds.has(n.parentId)) {
          const absPos = (n as any).positionAbsolute ?? n.position;
          const { parentId, ...rest } = n;
          return { ...rest, position: absPos };
        }
        return n;
      }));
      deletedGroupIds.forEach(id => onGroupDeleted?.(id));
    }, [onGroupDeleted]);

    return (

      <div ref={wrapperRef} className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onNodesDelete={handleNodesDelete}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          panOnDrag={true}
          selectionOnDrag={false}
          selectionMode={SelectionMode.Partial}
          panOnScroll={false}
          fitView
          minZoom={0.05}
          maxZoom={2}
          attributionPosition="bottom-left"
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#cbd5e1" />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'joinNode': return '#a855f7';
                case 'aggregationNode': return '#22c55e';
                case 'projectionNode': return '#3b82f6';
                case 'dataSource': return '#6b7280';
                case 'outputNode': return '#10b981';
                case 'unionNode': return '#6366f1';
                default: return '#94a3b8';
              }
            }}
          />
        </ReactFlow>
      </div>
    );
  }
);

FlowViewer.displayName = 'FlowViewer';

export default FlowViewer;