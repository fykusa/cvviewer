import { Node } from 'reactflow';

export interface ColumnFlowMatch {
  inputName: string;
  outputName: string;
}

export function traceColumnFlow(
  nodeId: string,
  columnId: string,
  allNodes: Node[]
): {
  upflow: Map<string, ColumnFlowMatch>;
  downflow: Map<string, ColumnFlowMatch>;
} {
  const upflow = new Map<string, ColumnFlowMatch>();
  const downflow = new Map<string, ColumnFlowMatch>();

  function traceUp(currentNodeId: string, currentColId: string) {
    const node = allNodes.find(n => n.id === currentNodeId);
    const inputs: Array<{ nodeId: string; mapping?: Array<{ target: string; source: string }> }> =
      node?.data?.inputs ?? [];

    for (const input of inputs) {
      if (!input.nodeId) continue;
      const match = input.mapping?.find(m => m.target === currentColId);
      if (match && !upflow.has(input.nodeId)) {
        upflow.set(input.nodeId, { inputName: match.source, outputName: currentColId });
        traceUp(input.nodeId, match.source);
      }
    }
  }

  function traceDown(currentNodeId: string, currentColId: string) {
    for (const node of allNodes) {
      if (downflow.has(node.id)) continue;
      const inputs: Array<{ nodeId: string; mapping?: Array<{ target: string; source: string }> }> =
        node.data?.inputs ?? [];
      for (const input of inputs) {
        if (input.nodeId !== currentNodeId) continue;
        const match = input.mapping?.find(m => m.source === currentColId);
        if (match) {
          downflow.set(node.id, { inputName: currentColId, outputName: match.target });
          traceDown(node.id, match.target);
        }
      }
    }
  }

  traceUp(nodeId, columnId);
  traceDown(nodeId, columnId);

  return { upflow, downflow };
}
