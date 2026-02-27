# Data Flow — Parsing & Export Pipeline

## 1. Parsing: File → React Flow graph

```
File input / drag-drop
        │
        ▼
  FileReader.readAsText()
        │ raw XML string
        ▼
  parseCalculationView(xmlContent)          [xmlParser.ts]
        │
        │  Uses: fast-xml-parser
        │    ignoreAttributes: false
        │    attributeNamePrefix: ''      ← attributes have NO prefix
        │    textNodeName: '_text'
        │
        │  Reads from <Calculation:scenario>:
        │    dataSources:      DataSource[]
        │    calculationViews: calculationView[]
        │    logicalModel:     treated as AggregationView
        │    layout.shapes:    LayoutShape[]  (incl. rectangleSize)
        │
        ▼
  ParsedCalculationView
        │
        ▼
  transformToReactFlow(parsed)              [xmlParser.ts]
        │
        │  VISIBILITY RULE:
        │  ┌─────────────────────────────────────────────┐
        │  │ A node is created ONLY if it has a shape    │
        │  │ in the <layout> section (idToPosition.has). │
        │  │ Nodes without a shape are silently skipped. │
        │  └─────────────────────────────────────────────┘
        │
        │  EDGE FILTER:
        │  ┌─────────────────────────────────────────────┐
        │  │ Edges are created only if BOTH source and   │
        │  │ target node IDs are in the known-nodes set. │
        │  │ References to external/undefined nodes are  │
        │  │ silently ignored.                           │
        │  └─────────────────────────────────────────────┘
        │
        ▼
  { nodes: Node[], edges: Edge[] }
        │
        ▼
  App.tsx state  →  FlowViewer (React Flow canvas)
```

---

## 2. Export: React Flow graph → XML file

```
User clicks "Save Layout"
        │
        ▼
  flowRef.getCurrentNodes()       ← live positions from React Flow state
        │  uses positionAbsolute ?? position
        ▼
  exportToXml(originalXml, currentNodes, layoutShapes)   [xmlParser.ts]
        │
        │  Builds <shapes> XML block:
        │    - modelObjectNameSpace: DataSource | MeasureGroup | CalculationView
        │    - upperLeftCorner x/y: Math.round(node.positionAbsolute ?? position)
        │    - rectangleSize: restored from layoutShapes (original values)
        │
        │  LAYOUT REPLACEMENT STRATEGY:
        │  ┌─────────────────────────────────────────────┐
        │  │ Uses lastIndexOf('<layout>') to find the    │
        │  │ LAST <layout> block in the file.            │
        │  │                                             │
        │  │ WHY: SAP HANA files contain an earlier      │
        │  │ <layout><shapes/></layout> inside           │
        │  │ <privateDataFoundation> — that one must     │
        │  │ NOT be replaced. The real position layout   │
        │  │ is always the LAST occurrence in the file.  │
        │  └─────────────────────────────────────────────┘
        │
        ▼
  Updated XML string
        │
        ├── showSaveFilePicker available?
        │         YES → native "Save As" dialog (no (1) duplicates)
        │         NO  → <a download> blob link (browser may add "(1)")
        │
        ▼
  setXmlContent(updatedXml)   ← next save uses updated XML as baseline
```

---

## 3. Auto-Layout Pipeline

```
User clicks "Auto-Layout" → confirms dialog
        │
        ▼
  flowRef.getCurrentNodes()
        │
        ▼
  computeAutoLayout(nodes, edges)           [autoLayout.ts]
        │
        │  dagre graph config:
        │    rankdir: 'BT'   (Bottom-to-Top: sources at bottom, output at top)
        │    nodesep: 60
        │    ranksep: 80
        │    marginx/y: 40
        │    nodeSize: 220×80 (fixed, not measured)
        │
        ▼
  nodes with new positions (dagreNode.x - width/2, dagreNode.y - height/2)
        │
        ▼
  flowRef.applyLayout(laidOutNodes)   ← setNodes() inside FlowViewer
```

---

## Key Parsing Details

### fast-xml-parser attribute handling
With `attributeNamePrefix: ''`, XML attributes are accessed directly by name:
- `<upperLeftCorner x="100" y="200"/>` → `shape.upperLeftCorner.x === "100"` (string!)
- `parseInt` is applied in `parseCalculationView` to convert to numbers

### rectangleSize preservation
- Parsed values (`rectWidth`, `rectHeight`) are stored on `LayoutShape`
- Carried in `layoutShapes` state in `App.tsx`
- Passed to `exportToXml` as `originalShapes`
- Looked up per node ID during export; fallback is `"0"/"0"`
- Common values: `"0"/"0"` (SAP default), `"-1"/"-1"` (auto-size)

### logicalModel treatment
`<logicalModel>` has no `xsi:type` attribute but represents the top-level Aggregation node.
It is pushed into `calculationViews` array with a synthetic type `Calculation:AggregationView`.
