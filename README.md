# HANA Calculation View Viewer v0.1

Browser-based viewer and layout editor for SAP HANA `.calculationview` XML files.

## Quick Start

```bash
npm install
npm run dev -- --port 3000
```

Open `http://localhost:3000`, load a `.calculationview` file, explore the graph.

## Features (v0.1)

- **Parse** SAP HANA Calculation View XML and render as an interactive node graph
- **Node types:** Projection, Join (inner/left outer/right outer/full outer), Aggregation, Union, DataSource, Output
- **Node detail:** click any node to open a sidebar with attributes and input connections
- **Auto-layout:** dagre Bottom-to-Top hierarchical layout with one click
- **Save Layout:** writes updated node positions back to the original XML (using native Save As dialog when available)
- **Safe export:** preserves all original XML content; only the `<layout>` section is replaced

## Documentation

See [`doc/`](doc/) for full technical documentation:
- [`doc/architecture.md`](doc/architecture.md) — component structure and state model
- [`doc/data-flow.md`](doc/data-flow.md) — parsing and export pipeline
- [`doc/node-types.md`](doc/node-types.md) — node types, colors, handle layout

See [`DEVELOPMENT.md`](DEVELOPMENT.md) for developer guide, critical rules, and extension instructions.
