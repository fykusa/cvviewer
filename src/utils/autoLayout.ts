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
    // Separate group container nodes from real content nodes
    const groupNodes = nodes.filter(n => n.type === 'groupNode');
    const contentNodes = nodes.filter(n => n.type !== 'groupNode');

    // Build a map of group positions so we can convert child relative → absolute
    const groupPositionMap = new Map<string, { x: number; y: number }>();
    groupNodes.forEach(g => {
        groupPositionMap.set(g.id, { x: g.position.x, y: g.position.y });
    });

    // Remember which group each node belongs to
    const nodeToGroup = new Map<string, string>();
    contentNodes.forEach(n => {
        if (n.parentId && groupPositionMap.has(n.parentId)) {
            nodeToGroup.set(n.id, n.parentId);
        }
    });

    // Normalize child nodes to absolute positions for dagre
    const absoluteNodes = contentNodes.map(n => {
        if (n.parentId && groupPositionMap.has(n.parentId)) {
            const gp = groupPositionMap.get(n.parentId)!;
            return {
                ...n,
                position: { x: n.position.x + gp.x, y: n.position.y + gp.y },
            };
        }
        return n;
    });

    // Determine which nodes to layout (selected subset or all content nodes)
    const selectedNodes = absoluteNodes.filter(n => n.selected);
    const nodesToLayout = selectedNodes.length > 0 ? selectedNodes : absoluteNodes;

    const nodeIds = new Set(nodesToLayout.map(n => n.id));
    const layoutEdges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

    // Use compound graph so dagre keeps group members clustered together
    const g = new dagre.graphlib.Graph({ compound: true });

    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
        rankdir: 'BT',
        nodesep: 60,
        ranksep: 80,
        marginx: 40,
        marginy: 40,
    });

    // Register group containers as parent nodes in dagre
    groupNodes.forEach(gn => {
        g.setNode(gn.id, { clusterLabelPos: 'top' });
    });

    let origMinX = Infinity, origMinY = Infinity, origMaxX = -Infinity, origMaxY = -Infinity;

    nodesToLayout.forEach((node) => {
        const width = node.width || getFallbackWidth(node);
        const height = node.height || getFallbackHeight(node);
        g.setNode(node.id, { width, height });

        // Assign node to its group parent in dagre compound graph
        const groupId = nodeToGroup.get(node.id);
        if (groupId) {
            g.setParent(node.id, groupId);
        }

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

    // Compute new absolute positions for all content nodes
    const newAbsolutePositions = new Map<string, { x: number; y: number }>();
    absoluteNodes.forEach((node) => {
        if (nodeIds.has(node.id)) {
            const dagreNode = g.node(node.id);
            const width = node.width || getFallbackWidth(node);
            const height = node.height || getFallbackHeight(node);
            newAbsolutePositions.set(node.id, {
                x: dagreNode.x - width / 2 + dx,
                y: dagreNode.y - height / 2 + dy,
            });
        } else {
            newAbsolutePositions.set(node.id, node.position);
        }
    });

    // Recalculate group bounding boxes from their members' new absolute positions
    const GROUP_PADDING = 30;
    const GROUP_TOP_PADDING = 50; // Extra space for title bar
    const updatedGroupNodes: Node[] = groupNodes.map(gn => {
        const memberIds = contentNodes
            .filter(n => nodeToGroup.get(n.id) === gn.id)
            .map(n => n.id);

        if (memberIds.length === 0) {
            return gn;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        memberIds.forEach(mid => {
            const pos = newAbsolutePositions.get(mid)!;
            const origNode = absoluteNodes.find(n => n.id === mid)!;
            const w = origNode.width || getFallbackWidth(origNode);
            const h = origNode.height || getFallbackHeight(origNode);
            if (pos.x < minX) minX = pos.x;
            if (pos.y < minY) minY = pos.y;
            if (pos.x + w > maxX) maxX = pos.x + w;
            if (pos.y + h > maxY) maxY = pos.y + h;
        });

        return {
            ...gn,
            position: { x: minX - GROUP_PADDING, y: minY - GROUP_TOP_PADDING },
            style: {
                ...gn.style,
                width: (maxX - minX) + GROUP_PADDING * 2,
                height: (maxY - minY) + GROUP_TOP_PADDING + GROUP_PADDING,
            },
        };
    });

    // Build updated group position map for relative conversion
    const updatedGroupPositionMap = new Map<string, { x: number; y: number }>();
    updatedGroupNodes.forEach(gn => {
        updatedGroupPositionMap.set(gn.id, { x: gn.position.x, y: gn.position.y });
    });

    // Build final content nodes: grouped ones get relative positions + parentId
    const finalContentNodes = absoluteNodes.map((node) => {
        const absPos = newAbsolutePositions.get(node.id)!;
        const groupId = nodeToGroup.get(node.id);

        if (groupId && updatedGroupPositionMap.has(groupId)) {
            const gp = updatedGroupPositionMap.get(groupId)!;
            return {
                ...node,
                parentId: groupId,
                position: { x: absPos.x - gp.x, y: absPos.y - gp.y },
            };
        }

        // Ungrouped node — strip parentId
        const { parentId: _pid, ...rest } = node as any;
        return { ...rest, position: absPos };
    });

    // Return groups first (React Flow requirement), then content nodes
    return [...updatedGroupNodes, ...finalContentNodes];
}
