# HANA Calculation View Viewer — Developer Guide

## Co je projekt

Browser-based viewer a layout editor pro SAP HANA `.calculationview` XML soubory.
Uživatel nahraje soubor, vidí node graph, může přesouvat uzly, aplikovat auto-layout
a uložit pozice zpět do validního XML kompatibilního se SAP HANA Studio / BAS.

**Version:** 0.2.1
**Stack:** React 18 + TypeScript + Vite + React Flow 11 + dagre + fast-xml-parser + TailwindCSS

---

## AI Assistant Rules
- **Po implementaci zásadní funkcionality aktualizuj `README.md`, `doc/development.md` a `doc/implementation_plan.md`.**
- Před úpravami si přečti `doc/architecture.md`, `doc/data-flow.md` a `doc/node-types.md` — popisují neobvyklá designová rozhodnutí.

---

## Implementované funkcionality (chronologicky)

001 - grafické zobrazení uzlů na canvasu, po nakliknutí detail v pravém sidebaru
002 - new: parsování XML `Calculation:scenario` do React Flow nodes/edges
003 - new: vlastní node komponenty pro různé typy uzlů — Projection, Join, Aggregation, Union, DataSource, Output
004 - new: unifikace handles — vstupy zespodu, výstup zeshora u všech typů uzlů
005 - new: statistiky na kartičkách uzlů — počty vstupů, atributů, indikátor kalkulovaných sloupců
006 - new: extrémní odzoomování — `minZoom` snížen na `0.05`
007 - new: načítání původních pozic uzlů přímo z `<layout>` bloku XML (1:1 bez přepočtu Y osy)
008 - new: tlačítko Auto-Layout (dagre, algoritmus bottom-to-top)
009 - new: inteligentní Auto-Layout s dynamickými rozměry přes browser bounding box
010 - new: potvrzovací dialog před Auto-Layoutem (prevence ztráty ručně naformátovaného layoutu)
011 - new: Save Layout — stažení validního XML se zapsanými aktuálními pozicemi uzlů
012 - new: rozlišení běžných a kalkulovaných atributů v sidebaru
013 - new: vizuální redesign sidebaru — kompaktní badges (Tag = sloupce, Calculator = kalkulované)
014 - new: zobrazení SQL formule kalkulovaného sloupce v sidebaru přes modal
015 - new: komentáře uzlů jako proklikávací ikona na plátně → neblokující modal
016 - new: vyhledávací panel v hlavičce s real-time filtrací uzlů
017 - new: vizuální highlight — červené orámování při shodě v názvu uzlu
018 - new: vizuální highlight — tyrkysové orámování při hluboké shodě (atributy/formule)
019 - bugfix: stabilita pozic uzlů při live search (props-override fix)
020 - new: Settings dialog — uživatelsky měnitelné barvy typů uzlů (ThemeContext + localStorage)
021 - bugfix: Auto-Layout zachovává skupiny (groupNode) — compound graph přes dagre
022 - new: levý sidebar — abecední seznam aktivních uzlů, klik → center na plátně + detail v pravém sidebaru
023 - new: Column Flow Visualization — klik na sloupec v sidebaru zvýrazní jeho datovou cestu přes canvas (upstream fialová, downstream zelená)
024 - new: pokročilé modály pro Join, Union, Projection — interaktivní diagram mapování sloupců s SVG Bezier křivkami
025 - new: skrytý přístup k Save Layout přes písmeno „r" v nadpisu (tlačítko deaktivováno pro veřejné uživatele)
026 - bugfix: klik na kalkulovaný sloupec spouští column flow; formule se zobrazí až kliknutím na badge „Calculated"
027 - new: zvýraznění shody vyhledávání i v pravém sidebaru — shoda v názvech sloupců označena žlutým highlightem (komponenta HighlightText)
028 - new: jednotné černé orámování vybraného uzlu na canvasu — ring-black konzistentně napříč všemi typy uzlů

---

