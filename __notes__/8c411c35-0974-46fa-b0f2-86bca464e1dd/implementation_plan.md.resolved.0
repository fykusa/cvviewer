# Implementace sloupce LP090ITS — Initial Timestamp pro LP status 90

Přidat nový výstupní sloupec `LP090ITS` (NVARCHAR 14) do Calculation View `SERVICEGRADE`,
který zachytí **první okamžik, kdy paket dosáhl stavu 90** v Package DB (ALPPZP0392).

Existující `LP_MAX_TS_90` zachytává **poslední** TS stavu 90 (agregace MAX).
Nový `LP090ITS` bude zachytávat **první** TS stavu 90 (agregace MIN).

---

## Proposed Changes

### SERVICEGRADE Calculation View

#### [MODIFY] [xml_SERVICEGRADE.calculationview](file:///d:/AI/VibeCoding/cvviewer/public/xml_SERVICEGRADE.calculationview)

Změny jsou potřeba ve **4 uzlech** v sérii LP pipeline:

---

**Uzel 1 — `LP_1st_date` (AggregationView, ~řádek 7022)**

Přidat nový `calculatedViewAttribute` vedle stávajícího `LP_MAX_TS_90`:

```xml
<!-- STÁVAJÍCÍ (MAX = poslední TS stavu 90) -->
<calculatedViewAttribute datatype="NVARCHAR" id="LP_MAX_TS_90" length="14" expressionLanguage="COLUMN_ENGINE">
  <formula>if(int(&quot;LP_STATUS&quot;)=90,&quot;LP_MIN_TS&quot;,'')</formula>
</calculatedViewAttribute>

<!-- NOVÉ (MIN = první TS stavu 90) -->
<calculatedViewAttribute datatype="NVARCHAR" id="LPC_MIN_TS_90" length="14" expressionLanguage="COLUMN_ENGINE">
  <formula>if(int(&quot;LP_STATUS&quot;)=90,&quot;LP_MIN_TS&quot;,'99991231000000')</formula>
</calculatedViewAttribute>
```

> Hodnota `'99991231000000'` se používá jako neutrální sentinel pro MIN agregaci
> (stejný vzor jako u existujícího `LP_MIN_TS_GE_50` na řádku 7110).

---

**Uzel 2 — `LP_1st_date_state` (AggregationView, ~řádek 7126)**

Přidat nový `viewAttribute` s agregací **MIN** a mapování ze zdroje:

```xml
<!-- Do <viewAttributes> přidat: -->
<viewAttribute aggregationType="min" id="LP_MIN_TS_90"/>

<!-- Do <input node="#LP_1st_date"> přidat: -->
<mapping xsi:type="Calculation:AttributeMapping" target="LP_MIN_TS_90" source="LPC_MIN_TS_90"/>
```

---

**Uzel 3 — `LP_current_with_TSs` (JoinView, ~řádek 7296)**

Přidat forward pole z `LP_1st_date_state` a výsledný `calculatedViewAttribute` pro výstup:

```xml
<!-- Do <viewAttributes> přidat: -->
<viewAttribute id="LP090ITS"/>

<!-- Do <calculatedViewAttributes> přidat: -->
<calculatedViewAttribute datatype="NVARCHAR" id="LP090ITS" length="14" expressionLanguage="COLUMN_ENGINE">
  <formula>if(&quot;LP_MIN_TS_90&quot;='99991231000000','',&quot;LP_MIN_TS_90&quot;)</formula>
</calculatedViewAttribute>

<!-- Do <input node="#LP_1st_date_state"> přidat: -->
<mapping xsi:type="Calculation:AttributeMapping" target="LP_MIN_TS_90" source="LP_MIN_TS_90"/>
```

> Sentinel `'99991231000000'` se převede zpět na prázdný řetězec `''` — stejný vzor
> jako u `LPC_TS_GE_50` v tomtéž uzlu.

---

**Uzel 4 — `LP_agg_to_VL` (AggregationView / JoinView — downstream)**

Dohledat uzel, který agreguje LP data a joinuje je s VL (obsahuje `LP_MAX_TS_GE_90`, `LPA_MAX_TS_GE_90` apod.) a přidat:

```xml
<!-- viewAttribute s MAX agregací (LP090ITS je už první TS, MAX přes pickets je ok): -->
<viewAttribute aggregationType="max" id="LP090ITS"/>

<!-- mapping z upstream: -->
<mapping xsi:type="Calculation:AttributeMapping" target="LP090ITS" source="LP090ITS"/>
```

Dále forward přes všechny uzly až do výstupního `Aggregation` node a do `VA_union_VL`.

---

## Verification Plan

### Ruční ověření

1. Ve výstupní agregaci zkontrolovat, že `LP090ITS` je přítomno.
2. Otestovat na dokladu, který přešel stavem 90 vícekrát — `LP090ITS` musí být **menší nebo rovno** `LP_MAX_TS_90`.
3. Ověřit, že doklady bez stavu 90 mají `LP090ITS = ''`.
