# Plan: HANA Calculation View Viewer
Cílem je vytvořit prohlížeč SAP HANA Calculation Views pomocí React Flow. Aplikace načte XML export (.calculationview) z SAP HANA Modeling Tools, naparsuje strukturu a vizualizuje ji jako interaktivní graf, přičemž se pokusi zachovat původní layout z HANA modeleru, ale neni to nutnost.
## 1. Project Setup (Příprava projektu)
* **Stack:** Vite + React + TypeScript
* **Styling:** Tailwind CSS
* **Knihovny:**
* `reactflow` (vizualizace grafu)
* `fast-xml-parser` (parsování XML)
* `lucide-react` (ikony)
### Struktura adresářů
```text
src/
├── components/
│ ├── FlowViewer.tsx # Hlavní plátno React Flow
│ ├── FileUpload.tsx # Komponenta pro nahrání souboru
│ ├── Sidebar.tsx # Panel s detaily vybraného uzlu
│ └── nodes/ # Vlastní typy uzlů
│ ├── ProjectionNode.tsx
│ ├── JoinNode.tsx
│ └── AggregationNode.tsx
├── types/
│ └── index.ts # Definice typů (NodeData, CalculationView, atd.)
├── utils/
│ └── xmlParser.ts # Logika pro transformaci XML -> React Flow Nodes/Edges
├── App.tsx
└── main.tsx
```
## 2. Data Model & Parsing Logic
Parser bude zpracovávat soubory typu `Calculation:scenario`.
### Klíčové elementy k parsování
1. **Nodes (Uzly):**
* Hledat v: ``
* Atributy: `id`, `xsi:type` (určuje typ uzlu - Projection, Join, Aggregation).
* Obsah: `viewAttributes` (seznam sloupců), `joinAttribute` (pokud jde o Join).
2. **Edges (Hrany):**
* Hledat v: ``
* Logika: Každý `input` element definuje hranu **OD** zdroje (`node`) **DO** aktuálního view.
3. **Layout (Pozice):**
* Hledat v: ``
* Párování: Atribut `modelObjectName` v layoutu odpovídá atributu `id` v calculationView.
* Souřadnice: ``.
## 3. Implementation Steps (Kroky implementace)
### Fáze 1: Inicializace a statický prototyp
1. Vytvořit projekt: `npm create vite@latest . -- --template react-ts`
2. Nainstalovat závislosti: `npm install reactflow fast-xml-parser tailwindcss postcss autoprefixer lucide-react`
3. Nastavit Tailwind CSS.
4. Vytvořit základní layout aplikace (Header, Main Area, Sidebar).
### Fáze 2: XML Parser
1. Vytvořit `src/types/index.ts` definující rozhraní pro naparsovaná data.
2. Implementovat `src/utils/xmlParser.ts`:
* Funkce `parseCalculationView(xmlContent: string)`
* Použít `fast-xml-parser` s nastavením `ignoreAttributes: false`.
* Transformovat surová data na pole `nodes` a `edges` kompatibilní s React Flow.
* Přiřadit souřadnice z sekce ``. Pokud chybí, nastavit defaultní (0,0).
### Fáze 3: Vizualizace (React Flow)
1. Implementovat `FlowViewer.tsx`.
2. Vytvořit Custom Nodes (`ProjectionNode`, `JoinNode`, atd.) pro lepší vizuální reprezentaci (ikona, název, barva ohraničení podle typu).
3. Zobrazit graf pomocí ``.
### Fáze 4: Interaktivita
1. Přidat `onNodeClick` handler.
2. Zobrazit detaily uzlu v Sidebaru (seznam atributů, typ joinu, filtry).
3. Implementovat `FileUpload` pro načtení uživatelského souboru.
## 4. Verification (Ověření)
* [ ] Aplikace jde spustit (`npm run dev`).
* [ ] Dialog/formular pro nacteni vstupniho souboru - inicialne muze nahravat `xml_example_ZZP01_MAT.calculationview`

* [ ] Po nahrání se zobrazí graf.
* [ ] Rozmístění uzlů odpovídá souřadnicím v XML (není náhodné) ale s uzly jde manipulovat.
* [ ] Šipky vedou správným směrem (tok dat).
* [ ] Kliknutí na uzel zobrazí jeho atributy na prave strane v k tomu dedikovanemu panelu
* [ ] Aktualni stav rozmisteni uzlu jde ulozit do stejneho vstupniho souboru




