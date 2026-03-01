import dagre from 'dagre';
import { Node, Edge } from 'reactflow';

const getFallbackWidth = (node: Node) => {
    const labelLen = node.data?.label?.length || 0;
    return Math.max(220, labelLen * 8 + 80);
};

const getFallbackHeight = (node: Node) => {
    let h = 80;
    if (node.data?.inputs) h += node.data.inputs.length * 24;
    if (node.data?.attributes?.length > 0) h += 40;
    return h;
};

export function computeAutoLayout(nodes: Node[], edges: Edge[]): Node[] {
    const selectedNodes = nodes.filter(n => n.selected);
    const nodesToLayout = selectedNodes.length > 0 ? selectedNodes : nodes;

    const nodeIds = new Set(nodesToLayout.map(n => n.id));
    const layoutEdges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

    const g = new dagre.graphlib.Graph();

    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
        rankdir: 'BT', // Bottom-to-Top: sources at bottom, output at top
        nodesep: 60,
        ranksep: 80,
        marginx: 40,
        marginy: 40,
    });

    let origMinX = Infinity, origMinY = Infinity, origMaxX = -Infinity, origMaxY = -Infinity;

    nodesToLayout.forEach((node) => {
        const width = node.width || getFallbackWidth(node);
        const height = node.height || getFallbackHeight(node);
        g.setNode(node.id, { width, height });

        const x = node.position.x;
        const y = node.position.y;
        if (x < origMinX) origMinX = x;
        if (y < origMinY) origMinY = y;
        if (x > origMaxX) origMaxX = x;
        if (y > origMaxY) origMaxY = y;
    });

    const origCenterX = selectedNodes.length > 0 ? origMinX + (origMaxX - origMinX) / 2 : 0;
    const origCenterY = selectedNodes.length > 0 ? origMinY + (origMaxY - origMinY) / 2 : 0;

    layoutEdges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    let newMinX = Infinity, newMinY = Infinity, newMaxX = -Infinity, newMaxY = -Infinity;

    if (selectedNodes.length > 0) {
        nodesToLayout.forEach((node) => {
            const dn = g.node(node.id);
            if (dn.x < newMinX) newMinX = dn.x;
            if (dn.y < newMinY) newMinY = dn.y;
            if (dn.x > newMaxX) newMaxX = dn.x;
            if (dn.y > newMaxY) newMaxY = dn.y;
        });
    }

    const newCenterX = selectedNodes.length > 0 ? newMinX + (newMaxX - newMinX) / 2 : 0;
    const newCenterY = selectedNodes.length > 0 ? newMinY + (newMaxY - newMinY) / 2 : 0;

    const dx = selectedNodes.length > 0 ? origCenterX - newCenterX : 0;
    const dy = selectedNodes.length > 0 ? origCenterY - newCenterY : 0;

    return nodes.map((node) => {
        if (!nodeIds.has(node.id)) {
            return node;
        }

        const dagreNode = g.node(node.id);
        const width = node.width || getFallbackWidth(node);
        const height = node.height || getFallbackHeight(node);

        return {
            ...node,
            position: {
                x: dagreNode.x - width / 2 + dx,
                y: dagreNode.y - height / 2 + dy,
            },
        };
    });
}
