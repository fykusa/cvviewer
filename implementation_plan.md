# Layout & Node Improvements

Čtyři navazující úpravy pro HANA CV Viewer.

## Navrhované změny

---

### 1. Union Node komponent (handles zespoda/nahoře)

**Problém:** `UnionView` typ padá do `default` React Flow nodu — špatné handles a bez stylu.

#### [NEW] [UnionNode.tsx](file:///d:/AI/VibeCoding/cvviewer/src/components/nodes/UnionNode.tsx)
- Nový node komponent, stejný styl jako ostatní (fialová/modrá barva, `Shuffle` ikona)
- `target` handle → `Position.Bottom`, `source` handle → `Position.Top`

#### [MODIFY] [xmlParser.ts](file:///d:/AI/VibeCoding/cvviewer/src/utils/xmlParser.ts)
- Přidat mapping `UnionView` → `unionNode` (řádek 156–159)

#### [MODIFY] [FlowViewer.tsx](file:///d:/AI/VibeCoding/cvviewer/src/components/FlowViewer.tsx)
- Registrovat `unionNode` do `nodeTypes`

---

### 2. Načítání pozic z XML (oprava)

**Problém:** Parser pozice čte, ale pokud chybí layout pro nod, padnou na `{0,0}` (překryv). HANA layout souřadnice jsou navíc v invertovaném Y (větší Y = výše v grafu → je třeba Y negovat).

#### [MODIFY] [xmlParser.ts](file:///d:/AI/VibeCoding/cvviewer/src/utils/xmlParser.ts)
- Souřadnice z XML se **nesmí transformovat** — HANA i React Flow mají Y osu dolů, jsou kompatibilní 1:1
- Fallback pro nody bez layoutu: přiřadit pozici v rámci HANA souřadnicového prostoru (kladné X,Y) tak aby nepřekrývaly existující nody. Tato pozice se zapíše zpět do XML při Save Layout.

---

### 3. Auto-Layout tlačítko (dagre)

**Řešení:** Knihovna `dagre` — standardní directed-graph hierarchický layout.

#### [MODIFY] [package.json](file:///d:/AI/VibeCoding/cvviewer/package.json)
- Přidat závislost `dagre` + `@types/dagre`

#### [NEW] [useAutoLayout.ts](file:///d:/AI/VibeCoding/cvviewer/src/utils/useAutoLayout.ts)
- Hook přijme aktuální `nodes` a `edges` z React Flow
- Spustí dagre layout (direction: `TB` = top-to-bottom, odpovídá naší konvenci)
- Vrátí nové pozice nodů

#### [MODIFY] [FlowViewer.tsx](file:///d:/AI/VibeCoding/cvviewer/src/components/FlowViewer.tsx)
- Vystavit `onAutoLayout` callback prop
- Aplikovat nové pozice přes `setNodes`

#### [MODIFY] [App.tsx](file:///d:/AI/VibeCoding/cvviewer/src/App.tsx)
- Přidat tlačítko **Auto-Layout** vedle Save Layout do headeru
- Ikona: `LayoutGrid` (lucide)

---

### 4. Save Layout — uložení pozic zpět do XML

**Řešení:** Aktualizovat `<layout>` sekci v XML a spustit download souboru.

#### [MODIFY] [xmlParser.ts](file:///d:/AI/VibeCoding/cvviewer/src/utils/xmlParser.ts)
- Implementovat `exportToXml(originalXml, nodes)`:
  - Projít `nodes`, sestavit nové `<shape>` elementy s aktuálními pozicemi
  - Pozice zapisovat **přímo tak jak jsou** v React Flow (žádná transformace) — HANA X,Y jsou identické
  - Regex/string replace pro `<layout>` sekci v XML stringu

> [!IMPORTANT]
> Souřadnice MUSÍ být zpětně kompatibilní s HANA Modeling Tools. Nesmíme transformovat ani invertovat osy.

#### [MODIFY] [FlowViewer.tsx](file:///d:/AI/VibeCoding/cvviewer/src/components/FlowViewer.tsx)
- Vystavit `onGetCurrentNodes` nebo `ref` pro získání aktuálních pozic nodů

#### [MODIFY] [App.tsx](file:///d:/AI/VibeCoding/cvviewer/src/App.tsx)
- `handleSave`: zavolat `exportToXml`, spustit browser download (`<a download>`)

---

## Pořadí implementace

| Krok | Úprava | Složitost |
|------|--------|-----------|
| 1 | Union Node komponent | ⭐ nízká |
| 2 | Oprava načítání pozic z XML | ⭐⭐ střední |
| 3 | Auto-Layout (dagre) | ⭐⭐ střední |
| 4 | Save Layout do XML | ⭐⭐⭐ vyšší |

## Verification Plan

### Manuální testování (po každém kroku)

1. Otevřít **http://localhost:3000/**
2. Kliknout **Load Example File** (načte `xml_example_minimal.calculationview`)
3. **Krok 1:** Union node musí mít fialový styl + handles správně (dole vstupy, nahoře výstup)
4. **Krok 2:** Nody se nesmí překrývat — musí respektovat pozice z XML
5. **Krok 3:** Kliknout **Auto-Layout** → nody se uspořádají bez překryvu ve stromové struktuře
6. **Krok 4:** Přesunout nod myší → kliknout **Save Layout** → stáhne se soubor → otevřít v editoru a ověřit nové souřadnice v `<layout>` sekci
