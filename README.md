# HANA Calculation View Viewer v0.1

Browser-based viewer and layout editor for SAP HANA `.calculationview` XML files.

## Quick Start

```bash
npm install
npm run dev -- --port 3000
```

Open `http://localhost:3000`, load a `.calculationview` file, explore the graph.

## Aktuální Funkcionality

- **Načítání & Zobrazení:** Interaktivní graf pro HANA `Calculation:scenario` XML. Podpora typů Projection, Join, Aggregation, Union, DataSource, Output.
- **Jednotný datový tok (Bottom-to-Top):** Přehledné toky hran směřující logicky ze spodních úchytů vždy směrem nahoru.
- **Nabitý Sidebar:** Moderní postranní panel vizuálně oddělující běžné atributy (Tag) od těch počítaných - "Calculated" (Včetně rychlého přístupu ke vzorcům a SQL).
- **Prohledávání grafu:** Vyhledávací lišta s barevným zvýrazněním. Rychle rozezná, jestli se hledaný výraz nachází v názvu uzlu (červený obrys) nebo hluboko v jeho atributech (tyrkysový obrys).
- **Chytrý Auto-Layout:** Top-to-Bottom algoritmus s ohledem na reálné prostorové velikosti `DOM` elementů (nedochází k překrývání).
- **Modální zobrazení Komentářů:** Přímý proklik na komentáře uvnitř uzlů bez nutnosti složitě lovit v sidebaru.
- **Bezpečný XML Export:** Funkce "Save Layout" čte původní dokument a přepisuje pouze `<layout>` tag čistými, nepřevrácenými daty kompatibilními s HANA systémy.

## Documentation

See [`doc/`](doc/) for full technical documentation:
- [`doc/architecture.md`](doc/architecture.md) — component structure and state model
- [`doc/data-flow.md`](doc/data-flow.md) — parsing and export pipeline
- [`doc/node-types.md`](doc/node-types.md) — node types, colors, handle layout

See [`DEVELOPMENT.md`](DEVELOPMENT.md) for developer guide, critical rules, and extension instructions.
