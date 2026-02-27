import React, { useCallback, useImperativeHandle, forwardRef } from 'react';
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
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';

import ProjectionNode from './nodes/ProjectionNode';
import JoinNode from './nodes/JoinNode';
import AggregationNode from './nodes/AggregationNode';
import DataSourceNode from './nodes/DataSourceNode';
import OutputNode from './nodes/OutputNode';
import UnionNode from './nodes/UnionNode';

const nodeTypes: NodeTypes = {
  projectionNode: ProjectionNode,
  joinNode: JoinNode,
  aggregationNode: AggregationNode,
  dataSource: DataSourceNode,
  outputNode: OutputNode,
  unionNode: UnionNode,
};

export interface FlowViewerHandle {
  getCurrentNodes: () => Node[];
  applyLayout: (newNodes: Node[]) => void;
}

interface FlowViewerProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodeClick?: (node: Node) => void;
}

const FlowViewer = forwardRef<FlowViewerHandle, FlowViewerProps>(
  ({ initialNodes, initialEdges, onNodeClick }, ref) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, , onEdgesChange] = useEdgesState(initialEdges);

    useImperativeHandle(ref, () => ({
      getCurrentNodes: () => nodes,
      applyLayout: (newNodes: Node[]) => {
        setNodes(newNodes);
      },
    }));

    const handleNodeClick = useCallback(
      (_event: React.MouseEvent, node: Node) => {
        if (onNodeClick) {
          onNodeClick(node);
        }
      },
      [onNodeClick]
    );

    return (
      <div className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
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