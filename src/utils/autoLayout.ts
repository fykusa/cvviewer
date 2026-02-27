import dagre from 'dagre';
import { Node, Edge } from 'reactflow';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;

export function computeAutoLayout(nodes: Node[], edges: Edge[]): Node[] {
    const g = new dagre.graphlib.Graph();

    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
        rankdir: 'BT', // Bottom-to-Top: sources at bottom, output at top
        nodesep: 60,
        ranksep: 80,
        marginx: 40,
        marginy: 40,
    });

    nodes.forEach((node) => {
        g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    return nodes.map((node) => {
        const dagreNode = g.node(node.id);
        return {
            ...node,
            position: {
                x: dagreNode.x - NODE_WIDTH / 2,
                y: dagreNode.y - NODE_HEIGHT / 2,
            },
        };
    });
}
