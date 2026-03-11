# HANA Calculation View Viewer v0.4

Browser-based viewer and layout editor for SAP HANA `.calculationview` XML files.

## Quick Start

```bash
npm install
npm run dev -- --port 3000
```

Open `http://localhost:3000`, load a `.calculationview` file, explore the graph.

## Aktuální Funkcionality

- **Načítání & Zobrazení:** Interaktivní graf pro HANA `Calculation:scenario` XML. Podpora typů Projection, Join, Aggregation, Union, DataSource, Output.
- **Jednotný datový tok (Bottom-to-Top):** Přehledné toky hran směřující logicky ze spodních úchytů vždy směrem nahoru (od zdroje k výstupu).
- **Pokročilé detaily uzlů (Modals):** Zcela nové interaktivní nástroje pro pochopení datového toku uvnitř složitých uzlů. Modální okna pro **Join**, **Union** a **Projection** vizualizují vstupní tabulky a jejich mapování na výstupní strukturu pomocí přehledných barevných Bézierových křivek s možností interaktivně klikat na sloupce a prosvětlovat cesty.
- **Inteligentní pravý Sidebar:** Postranní panel poskytuje vyčerpávající informace o zvoleném uzlu:
  - Vizuálně odlišuje atributy, které se "dostanou na výstup" (černě) od těch, které "propadly" (šedě).
  - U běžných sloupců navíc zobrazuje přesný zdroj ve formátu `ZDROJ_TABULKA.ZDROJ_SLOUPEC` zarovnaný vpravo.
  - Odlišuje ikonami běžná data, Measure (měřítka) a modře zvýrazňuje kalkulovaná pole (Calculated columns) s přímým proklikem na SQL kód/formuli.
- **Rychlá navigace (Levý Sidebar):** Kompaktní abecední seznam všech aktivních uzlů slouží jako rychlá obsahová navigace po dokumentu. Možnost okamžitě najít a scrollovat grafem kliknutím na prvek v seznamu.
- **Prohledávání grafu:** Vyhledávací lišta s barevným zvýrazněním. Rychle rozezná, jestli se hledaný výraz nachází v názvu uzlu (červený obrys) nebo hluboko v jeho atributech (tyrkysový obrys).
- **Modální zobrazení Komentářů a Filtrů:** Přímý rychlý proklik ikonkou na případné zakotvené komentáře nebo omezující filtry bez lovení v kódu.
- **Vizualizace datového toku sloupce (Column Flow):** Kliknutím na konkrétní sloupec v pravém sidebaru se na canvasu barevně zvýrazní celá datová trasa daného sloupce — upstream uzly fialově, downstream uzly zeleně — s popiskem `[vstup → výstup]` u každého relevantního uzlu. Opakovaný klik flow skryje.
- **Chytrý Auto-Layout:** Top-to-Bottom (příp. Bottom-to-Top) algoritmus s ohledem na reálné prostorové velikosti `DOM` elementů, zabraňující překrývání.
- **Bezpečný XML Export:** Funkce "Save Layout" čte původní dokument a elegantně přepisuje pouze `<layout>` tag, čímž uchovává vše ostatní dokonale bez poskvrny.

## Documentation

See [`doc/`](doc/) for full technical documentation:
- [`doc/architecture.md`](doc/architecture.md) — component structure and state model
- [`doc/data-flow.md`](doc/data-flow.md) — parsing and export pipeline
- [`doc/node-types.md`](doc/node-types.md) — node types, colors, handle layout

See [`DEVELOPMENT.md`](DEVELOPMENT.md) for developer guide, critical rules, and extension instructions.
