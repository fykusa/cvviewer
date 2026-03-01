# HANA Calculation View Viewer — Developer Guide

## What this project is

A browser-based viewer and layout editor for SAP HANA `.calculationview` XML files.
The user loads a file, sees the node graph, can rearrange nodes, apply auto-layout,
and save the updated positions back to a valid `.calculationview` XML that SAP HANA
Studio / SAP Business Application Studio can open.

**Version:** 0.2.1  
**Stack:** React 18 + TypeScript + Vite + React Flow + dagre + fast-xml-parser + TailwindCSS

---

## Current State & Recent Features

The application currently supports the following refined workflows:
- **Automatic Layout:** Models are automatically organized using `dagre` upon initial loading.
- **Robust Export:** The Save layout functionality reliably downloads the updated XML file retaining the original `.calculationview` filename.
- **Interactive Nodes:** Node comment icons are now directly clickable, immediately opening a modal with comment details (bypassing the sidebar workflow).

---

## Documentation

All documentation lives in the `doc/` directory:

| File | Contents |
|------|----------|
| `doc/architecture.md` | Component hierarchy, state model, key handlers, FlowViewer imperative API |
| `doc/data-flow.md` | Full parsing pipeline (XML → React Flow), export pipeline (nodes → XML), auto-layout pipeline |
| `doc/node-types.md` | All node types, color scheme, handle layout, `data` field contracts, edge styles |

**Read these docs before making any changes.** They describe non-obvious design decisions
that, if ignored, will reintroduce fixed bugs.

---

## Running locally

```bash
npm install
npm run dev -- --port 3000
```

The app will be available at `http://localhost:3000`.  
There is no backend — this is a pure client-side SPA.

---

## Critical rules & known gotchas

### 1. Layout replacement must use `lastIndexOf`
SAP HANA XML files contain **two** `<layout>` elements:
- An early empty one inside `<privateDataFoundation>`
- The real one with node positions at the end of the file

Always use `lastIndexOf('<layout>')` when replacing. **Never** use a regex that matches
the first occurrence. See `doc/data-flow.md` → Export section for details.

### 2. Node visibility is driven by layout shapes, not by XML declarations
A node should be rendered **only** if it has a corresponding `<shape>` in the `<layout>`
section. Nodes declared in `<dataSources>` or `<calculationViews>` but without a shape
(e.g. `M_TIME_DIMENSION`, external prequery nodes) must be silently skipped.

Rule:
```ts
if (!idToPosition.has(nodeId)) return; // no shape → not visible
```

### 3. Edges to undefined nodes must be filtered
If a `<calculationView>` has `<input node="#SOME_EXTERNAL_NODE">` but that node has no
shape and no local definition, the edge must be skipped. After building all nodes into
a `Set`, filter edges against that set. See `transformToReactFlow` in `xmlParser.ts`.

### 4. rectangleSize must be preserved
The export must write back original `rectangleSize height/width` values per node.
These are parsed and stored in `layoutShapes` state in `App.tsx`, passed to
`exportToXml` as the `originalShapes` argument. Fallback is `"0"/"0"` for new nodes.
**Do not hardcode `-1`.**

### 5. fast-xml-parser attribute prefix
The parser is configured with `attributeNamePrefix: ''`.
XML attributes are accessed directly by name, WITH NO prefix:
```ts
shape.upperLeftCorner.x   // NOT shape['@_upperLeftCorner']['@_x']
shape.modelObjectName     // NOT shape['@_modelObjectName']
```
Attribute values for numeric fields are **strings** — always parse with `parseInt`.

### 6. `useNodesState` initializes only once
React Flow's `useNodesState(initialNodes)` captures initial state on mount only.
To push new positions from outside React Flow (e.g. auto-layout), use the imperative
`applyLayout` method on the `flowRef`. Do not pass changing props expecting them to update
the internal React Flow state.

### 7. Export uses `positionAbsolute ?? position`
`node.positionAbsolute` is set by React Flow after it computes layout. For flat graphs
(no nested sub-flows) it equals `position`, but using it is safer for consistency.
Cast to `(node as any).positionAbsolute` since the public type doesn't expose it.

### 8. File save uses File System Access API first
`handleSave` tries `window.showSaveFilePicker` before falling back to `<a download>`.
This avoids the browser appending `(1)` to filenames when the file already exists.
The `AbortError` (user cancelled dialog) is silently swallowed.

---

## Code locations for common tasks

| Task | File | Function/area |
|---|---|---|
| Change node visual appearance | `src/components/nodes/*.tsx` | JSX return |
| Change auto-layout parameters | `src/utils/autoLayout.ts` | `g.setGraph({...})` |
| Change which nodes are visible | `src/utils/xmlParser.ts` | `transformToReactFlow` |
| Change how XML is written | `src/utils/xmlParser.ts` | `exportToXml` |
| Add a new node type | 1. Add `.tsx` in `nodes/`, 2. Register in `FlowViewer.tsx → nodeTypes`, 3. Add mapping in `transformToReactFlow` |
| Add state to App | `src/App.tsx` | top-level `useState` calls |
| Change Sidebar content | `src/components/Sidebar.tsx` | — |

---

## Adding a new calculationView type

1. Add the type string to `CalculationViewType` union in `src/types/index.ts`
2. Create `src/components/nodes/YourNode.tsx` following the pattern of existing nodes
3. Register it in `FlowViewer.tsx`:
   ```ts
   const nodeTypes = { ..., yourNode: YourNode };
   ```
4. Map the `xsi:type` value in `transformToReactFlow`:
   ```ts
   cv.type === 'YourView' ? 'yourNode' : ...
   ```
5. Add a color to the MiniMap `nodeColor` function in `FlowViewer.tsx`

---

## Build for production

```bash
npm run build
```

Output goes to `dist/`. The app is a static SPA — serve `dist/` from any static host.
No server-side code.

---

## Known limitations (v0.1)

- No node editing — positions only; attributes are read-only in Sidebar
- Auto-layout overwrites all manual positions (confirm dialog warns user)
- `fitView` is always on — absolute canvas position is not preserved across sessions
- Only `DATA_BASE_TABLE` DataSource type is handled; other types render as DataSourceNode
- No support for calculated columns visible in graph edges
- Large files (1000+ nodes) may be slow to render; no virtualization
