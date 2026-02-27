# Node Types

All node types are React Flow custom nodes defined in `src/components/nodes/`.
Each is registered in `FlowViewer.tsx` under `nodeTypes`.

---

## Mapping: XML → React Flow node type

| XML `xsi:type` | React Flow type key | Component |
|---|---|---|
| `Calculation:ProjectionView` | `projectionNode` | `ProjectionNode.tsx` |
| `Calculation:JoinView` | `joinNode` | `JoinNode.tsx` |
| `Calculation:AggregationView` | `aggregationNode` | `AggregationNode.tsx` |
| `Calculation:UnionView` | `unionNode` | `UnionNode.tsx` |
| `<logicalModel>` (implicit) | `aggregationNode` | `AggregationNode.tsx` |
| `DataSource` (type="DATA_BASE_TABLE") | `dataSource` | `DataSourceNode.tsx` |
| `Output` (synthetic, from logicalModel) | `outputNode` | `OutputNode.tsx` |

The `Output` node is synthetic — it does not exist as a `<calculationView>` in the XML.
It is created from the `<logicalModel>` element and acts as the terminal node of the graph.

---

## Node Visual Design

### Colors & styles (TailwindCSS classes)

| Type | Background | Border | Icon color |
|---|---|---|---|
| ProjectionNode | blue-100 | blue-500 | blue-600 |
| JoinNode (inner) | purple-100 | purple-500 | purple-600 |
| JoinNode (leftOuter) | orange-100 | orange-500 | — |
| JoinNode (rightOuter) | yellow-100 | yellow-500 | — |
| JoinNode (fullOuter) | red-100 | red-500 | — |
| AggregationNode | green-100 | green-500 | green-600 |
| UnionNode | indigo-100 | indigo-500 | indigo-600 |
| DataSourceNode | gray-100 | gray-400 | gray-600 |
| OutputNode | emerald-100 | emerald-500 | emerald-600 |

---

## Handle layout (React Flow connection points)

All nodes use `rankdir: BT` (Bottom-to-Top) in dagre, so:
- **source** handle: `Position.Top` (data flows upward)
- **target** handle: `Position.Bottom` (receives inputs from below)

**JoinNode** is special — it has **two target handles** (for left and right inputs):
```
id="input-left"   left: 30%
id="input-right"  left: 70%
```

---

## Node `data` properties

Each node's `data` field (defined in `types/index.ts → NodeData`):

```ts
{
  id:           string;            // unique node ID from XML
  type:         CalculationViewType;
  label:        string;            // displayed name (= id)
  attributes?:  ViewAttribute[];   // viewAttribute elements
  joinType?:    string;            // inner | leftOuter | rightOuter | fullOuter
  inputs?:      InputConnection[]; // parsed <input> elements
  isDataSource?: boolean;
  dataSourceInfo?: {
    schemaName?:       string;
    columnObjectName?: string;
  };
}
```

---

## Edge styling

| Edge category | Stroke color | arrowhead |
|---|---|---|
| Regular connections (`input` links) | `#64748b` (slate-500) | ArrowClosed |
| Output edges (to Output node) | `#22c55e` (green-500) | ArrowClosed, strokeWidth 2 |

Edges are non-animated by default.

---

## MiniMap colors

The MiniMap in `FlowViewer.tsx` uses the following `nodeColor` mapping:

```ts
joinNode        → #a855f7  (purple)
aggregationNode → #22c55e  (green)
projectionNode  → #3b82f6  (blue)
dataSource      → #6b7280  (gray)
outputNode      → #10b981  (emerald)
unionNode       → #6366f1  (indigo)
default         → #94a3b8  (slate)
```
