# HANA Calculation View Viewer — Architecture

## Overview

A React/TypeScript single-page application that parses SAP HANA `.calculationview` XML files,
renders them as interactive node graphs (React Flow), allows the user to rearrange nodes,
and saves updated positions back to the XML file.

---

## Technology Stack

| Layer | Library | Version |
|---|---|---|
| UI Framework | React | 18.3 |
| Language | TypeScript | 5.5 |
| Build tool | Vite | 5.3 |
| Graph rendering | React Flow (reactflow) | 11.11 |
| Auto-layout | dagre | 0.8 |
| XML parsing | fast-xml-parser | 4.5 |
| Icons | lucide-react | 0.400 |
| Styling | TailwindCSS | 3.4 |

---

## Directory Structure

```
cvviewer/
├── doc/                        ← project documentation (this folder)
│   ├── architecture.md         ← this file
│   ├── data-flow.md            ← parsing & export pipeline
│   └── node-types.md           ← description of all node types
├── src/
│   ├── main.tsx                ← React entry point
│   ├── App.tsx                 ← root component, all state & handlers
│   ├── index.css               ← global styles
│   ├── vite-env.d.ts
│   ├── types/
│   │   └── index.ts            ← shared TypeScript interfaces
│   ├── utils/
│   │   ├── xmlParser.ts        ← parse + export XML; core logic
│   │   └── autoLayout.ts       ← dagre-based auto-layout
│   └── components/
│       ├── FileUpload.tsx       ← landing / upload screen
│       ├── FlowViewer.tsx       ← React Flow canvas wrapper
│       ├── Sidebar.tsx          ← node detail panel
│       └── nodes/
│           ├── ProjectionNode.tsx
│           ├── JoinNode.tsx
│           ├── AggregationNode.tsx
│           ├── UnionNode.tsx
│           ├── DataSourceNode.tsx
│           └── OutputNode.tsx
└── index.html
```

---

## Component Hierarchy

```
App
├── FileUpload          (rendered when no file is loaded)
└── (main view)
    ├── Header bar      (Back · Auto-Layout · Save Layout buttons)
    ├── FlowViewer      (React Flow canvas + imperative ref)
    └── Sidebar         (optional, slides in on node click)
```

---

## State managed in App.tsx

| State variable | Type | Purpose |
|---|---|---|
| `xmlContent` | `string \| null` | Raw original XML (preserved for export) |
| `fileName` | `string \| null` | Original filename used as save suggestion |
| `nodes` | `Node[]` | Initial React Flow nodes (set once on load) |
| `edges` | `Edge[]` | Initial React Flow edges (set once on load) |
| `layoutShapes` | `LayoutShape[]` | Parsed shapes including original `rectangleSize` values |
| `selectedNode` | `Node \| null` | Currently selected node for Sidebar |
| `error` | `string \| null` | Parse error message |
| `isSidebarOpen` | `boolean` | Controls Sidebar visibility |

> **Important:** React Flow owns the live positions internally via `useNodesState` inside
> `FlowViewer`. App.tsx accesses current positions via an imperative ref (`flowRef`).

---

## Key Handlers in App.tsx

### `handleFileLoad(content, name)`
Called by `FileUpload` when a file is selected.  
Calls `parseCalculationView` → `transformToReactFlow`.  
Sets all state, including `layoutShapes` (for `rectangleSize` preservation on save).

### `handleSave()`
1. Reads current node positions from React Flow via `flowRef.current.getCurrentNodes()`
2. Calls `exportToXml(xmlContent, currentNodes, layoutShapes)`
3. **Preferred path:** `window.showSaveFilePicker` (File System Access API) — native "Save As" dialog, no browser duplicate-naming
4. **Fallback:** `<a download>` blob link (may append `(1)` to filename if already in Downloads)
5. Updates `xmlContent` state so next save includes latest positions

### `handleAutoLayout()`
1. Gets current nodes from `flowRef`
2. Calls `computeAutoLayout(currentNodes, edges)` (dagre BT)
3. Pushes result back via `flowRef.current.applyLayout(laidOutNodes)`

---

## FlowViewer — Imperative Handle

`FlowViewer` exposes two methods via `forwardRef` + `useImperativeHandle`:

```ts
interface FlowViewerHandle {
  getCurrentNodes: () => Node[];   // returns live node state
  applyLayout:   (newNodes: Node[]) => void;  // replaces node positions
}
```

React Flow's `fitView` prop is enabled — the viewport always fits all nodes on mount.
