# HANA CV Viewer - Implementační Plán

Vývojový a implementační deník funkcionalit. Zde sledujeme hotové bloky i nově plánované updaty.

### Komponenty a renderování grafu
- [x] Základní parsování `Calculation:scenario` do uzlů a hran React Flow
- [x] Vlastní React Flow komponenty pro různé typy: `ProjectionView`, `JoinView`, `AggregationView`, `UnionView`, `DataSource` a `Output`
- [x] Unifikace úchytů hran (handles) - u všech uzlů jsou vstupy směřovány plynule zespodu a výstup ústí zeshora
- [x] Zobrazení informativních statistik přímo na "kartičkách" uzlů na plátně (počty vstupů, počty atributů a indikátor kalkulovaných sloupců)
- [x] Extrémní odzoomování plátna - upraven limit `minZoom` na `0.05`

### Layout a souřadnice
- [x] Načítání původních pozic (souřadnic) uzlů přímo z `layout` bloku v XML, kompatibilita souřadnicových systémů zachována 1:1 (bez převracení Y osy)
- [x] Implementace tlačítka **Auto-Layout** (využívající knihovnu Dagre s algoritmem top-to-bottom BT)
- [x] Inteligentní Auto-Layout pomocí Dagre: respektování dynamických rozměrů elementů (okraje) přes browser bounding box místo pevných krabiček 220x80px
- [x] Ochranný potvrzovací (confirm) dialog před provedením Auto-Layoutu (prevence ztráty těžce naformátovaného stromu)
- [x] Funkce **Save Layout** - stažení validního XML souboru, do kterého jsou zapsány vaše aktuální nově posunuté souřadnice uzlů pomocí manipulace původního zdrojového textu

### Analýza uzlů a postranní panel (Sidebar / Modal)
- [x] Odlišení běžných a vypočítaných atributů u uzlů logickým zpracováním XML
- [x] Vizuální přepracování postranního panelu: atributy reprezentovány kompaktními štítky (badges). Modrá (Tag) pro klasické sloupce a measures; fialová (Calculator) pro "Calculated column"
- [x] V Sidebaru zobrazení SQL vizuální formule (kalkulačky) s proklikem skrze modal / nebo zobrazení na hover
- [x] Komentáře uvnitř uzlů reprezentovány proklikávací ikonkou zobrazenou přímo na plátně - otevírající neblokující módál rovnou

### Search & Interaktivita
- [x] Vyhledávací panel v hlavičce (Search) a real-time filtrace uzlů
- [x] Vizualní highlight vyhledávaných prvků: tlusté zářivě oranžové/červené (#f42c16) orámování při shodě v názvu uzlu
- [x] Vizualní highlight při "hluboké shodě" (shoda textu uvnitř nějaké definice sloupce či atributu v daném uzlu) - svítivě tyrkysové orámování
- [x] Fix ztrácející se pozice v React Flow skrze props-override (zachování stability rozložení při live type-seach)

### Novější funkce
- [x] Nastavení vzhledu aplikace (Ozubené kolečko) — přidána možnost uživatelsky měnit barvy jednotlivých typů uzlů (projection, union, atd.) a výchozí barvy pro skupiny. Zcela přepracováno UI: možnost výběru typu uzlu přes Select Box, ovládání průhlednosti (opacity slider) a plnohodnotný živý náhled přímo v dialogu pomocí vložené instance React Flow. Nastavení se ukládá do `localStorage` a je asynchronně propsáno pomocí vlastního React Contextu (`ThemeContext.tsx`).
- [x] Auto-Layout zachovává skupiny (groupNode) — fix pomocí compound graph (dagre) tak, aby dagre drželo členy skupiny u sebe a nepouštělo tam cizí nody.

### Právě řešíme / Budoucí plán
- [x] Přidání levého sidebaru — kompletni seznam všech existujících aktivních uzlů, vypsaných v kondenzované formě bez zbytečného místa nad a pod řádkem, seřazených abecedně. Seznam bude fungovat jako navigace: po kliknutí na uzel se tento uzel zvýrazní na plátně (Canvas) a jeho detail se rovnou zobrazí v pravém sidebaru.
