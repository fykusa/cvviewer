# SERVICEGRADE — Analýza Calculation View

> **Soubor:** `public/xml_SERVICEGRADE.calculationview`  
> **Typ:** SAP HANA Calculation View (XML)  
> **Rozsah:** ~18 500 řádků  
> **Datum analýzy:** 2026-03-05  

---

## Účel

> *"Extracts delta information for Processmonitor, ADSO IPBSER29."*

View **počítá tzv. Servicegrade (SGR)** — metriku, která měří, zda položky (objednávky, dodávky) byly zpracovány včas. Slouží pro sledování plnění logistických procesů ve skladu a je základem pro **Process Monitor** v SAP BW/4HANA.

Výsledná data jsou načítána do ADSO `IPBSER29`.

---

## Vstupní datové zdroje

| Prefix | Tabulka (ABAP schéma)  | Co reprezentuje                                                    |
|--------|------------------------|--------------------------------------------------------------------|
| `VA_`  | `/BIC/AVAPVBAH92`      | Prodejní objednávky (Sales Orders)                                 |
| `VL_`  | `/BIC/AVLPLIPK92`      | Dodávky (Deliveries)                                               |
| `VR_`  | `/BIC/AVRPVBR_92`      | Fakturace (Billing)                                                |
| `TG_`  | `/BIC/AIPBTOUR92`      | Turné a cíle (Tours & Targets — pro SA objednávky)                 |
| `TP_`  | `/BIC/AIPBPURT92`      | Turné a cíle pro nákupní objednávky (Purchase Orders)              |
| `LT_`  | `/BIC/ALTPLTA_92`      | Přepravní příkazy (Transfer Orders / LTA)                          |
| `LP_`  | `/BIC/ALPPZP0392`      | Paketová databáze (Package DB — stavy zpracování)                  |
| `EK_`  | `/BIC/AEKPEKET92`      | Nákupní objednávky (Purchase Orders / Nachschub)                   |
| `FI_`  | `/BIC/AIPBSFIB92`      | FIB procesy (výrobní zakázky)                                      |
| `MD_`  | `/BIC/AMDPMDOC92`      | MD dokumenty                                                       |
| `KO_`  | `/BIC/ALTPKONV92`      | Konverter data (automatický dopravníkový systém ve skladu)         |
| `ZZ_`  | `/BIC/ALTPZSPI92`      | ZZ Spiegelplätze (zrcadlová místa, pouze sl. 064)                  |
| —      | `HOLIDAYS`             | Calculation View pro svátky (pro výpočet VLC_HOLY)                 |
| —      | `M_TIME_DIMENSION`     | Časová dimenze (pro TD_* pole — rok, měsíc, týden)                 |

---

## Vstupní parametry

| Parametr               | Typ           | Default | Popis                                                                                  |
|------------------------|---------------|---------|----------------------------------------------------------------------------------------|
| `stichtag`             | NVARCHAR(14)  | —       | Referenční timestamp (key date). Pro historické full-loady: bere se jen záznamy před tímto časem |
| `stichtag_bis`         | NVARCHAR(14)  | —       | Horní hranice timestamp                                                                |
| `use_delta`            | VARCHAR(1)    | `X`     | `X` = delta mód (vše co se změnilo); prázdné = full/history load                      |
| `package_from`         | NVARCHAR(6)   | —       | Dolní hranice datového balíku z ADSO changelogu                                        |
| `package_to`           | NVARCHAR(6)   | —       | Horní hranice datového balíku z ADSO changelogu                                        |
| `ip_use_reload_table`  | VARCHAR(1)    | —       | Zda brát v úvahu reload tabulku `IPBRELO9` pro delta prequery                          |
| `ip_history_init`      | NVARCHAR(1)   | —       | Příznak inicializačního historického načtení                                           |
| `ip_hist_audat_from`   | NVARCHAR(8)   | —       | Dolní hranice data vytvoření dodávky (VL_AUDAT) pro historický init                   |
| `ip_hist_audat_to`     | NVARCHAR(8)   | —       | Horní hranice data vytvoření dodávky pro historický init                               |
| `ip_pure_order_mode`   | NVARCHAR(1)   | —       | Pokud `X`, dodávky/LT/LP/VR/MD data jsou kompletně vyfiltrována (pouze SA objednávky) |
| `erdat`                | DATE          | —       | Datum vytvoření — dolní hranice pro filtrování záznamů ve všech hlavních uzlech       |

---

## Architektura — tok dat

View je postaven jako **strom výpočetních uzlů** (Projection → Join → Aggregation → Union). Celková logika:

```
VA_history (SO)   ──┐
VL_history (VL)   ──┤
EK_history (EK)   ──┤──→ [Delta selekce]
                    │
                    ├──→ [Join s TG / TP (Tours & Targets)]
                    │
                    ├──→ [Join s LT (Transfer Orders + Konverter)]
                    │
                    ├──→ [Join s LP (Package DB stavy)]
                    │
                    ├──→ [Join s VR (Billing)]
                    │
                    ├──→ [Join s MD]
                    │
                    ├──→ [Join s FI (FIB procesy)]
                    │
                    └──→ [Výpočet SGR flagů]
                              │
                              └──→ [VA_union_VL] ──→ [Aggregation OUTPUT]
```

---

## Klíčové uzly (nodes) a jejich role

### Vstupní uzly (Projection)

| Uzel                          | Zdroj        | Účel                                                                                                    |
|-------------------------------|--------------|---------------------------------------------------------------------------------------------------------|
| `VA_history`                  | AVAPVBAH92   | SO položky; filtruje smazané (`VWK_EIS_DEL != 'A'`), stornované (`VWK_EIS_CNC != 'X'`), záznamy po stichtag |
| `VL_history`                  | AVLPLIPK92   | Dodávky; stejné filtry jako VA + `ip_pure_order_mode`                                                   |
| `VR_current`                  | AVRPVBR_92   | Fakturační doklady                                                                                      |
| `TG`                          | AIPBTOUR92   | Tours & Targets pro SO (DUEGI, ORDERTS, TOUR...)                                                        |
| `TP_TARGETS_PURCHASE_ORDER`   | AIPBPURT92   | Tours & Targets pro nákupní objednávky                                                                  |
| `LT_history_w_konverter`      | ALTPLTA_92   | Transfer Orders + konverter data                                                                        |
| `LP_history`                  | ALPPZP0392   | Package DB stavy (pouze status ≥ 28)                                                                    |
| `EK_history`                  | AEKPEKET92   | Nákupní objednávky (Nachschub/Relocation)                                                               |
| `FI_history_proj`             | AIPBSFIB92   | FIB výrobní zakázky                                                                                     |
| `MD_current`                  | AMDPMDOC92   | MD dokumenty                                                                                            |

### Delta selekce

| Uzel           | Účel                                                                              |
|----------------|-----------------------------------------------------------------------------------|
| `VL_Delta`     | Záznamy změněné od posledního delta loadu (přes `SERVICEGRADE_DELTA_PREQUERY_OPT`) |
| `VL_DELTA_VA`  | Delta dodávky pro SA objednávky (filtr: `VL_LFART != 'NL'` nebo null)            |
| `VL_DELTA_EK`  | Delta dodávky pro nákupní objednávky (filtr: `VL_LFART = 'NL'`)                  |

### Výpočetní uzly (Join)

| Uzel                                        | Co dělá                                                              |
|---------------------------------------------|----------------------------------------------------------------------|
| `Delta_mit_zielen`                          | Join delta záznamů s TG (přidání DUEGI, TOUR, ORDERTS...)           |
| `VL_only_Delta`                             | Výběr pouze delta dodávek z VL_history                              |
| `VL_with_VA`                                | Join dodávek s prodejními objednávkami                              |
| `VL_with_VA_TG_LT`                          | Přidání Transfer Orders; výpočet `VL_STATUS` (A/C/D)               |
| `VL_with_VA_TG_LT_LP`                       | Přidání Package DB stavů a jejich timestampů                        |
| `VL_with_VA_TG_LT_LP_VR_MD`                 | Přidání billing a MD timestampů                                     |
| **`VL_with_VA_TG_LT_LP_VR_MD_FI`**         | **Centrální SGR výpočetní uzel**                                    |
| `VL_with_VA_TG_LT_LP_VR_MD_FI_HT_TD`       | Přidání holiday flag a časové dimenze                               |
| `VA_not_full_delivered`                     | SA objednávky bez kompletní dodávky (alternativní SGR cesta)        |
| `VA_union_VL`                               | Sjednocení obou SGR cest (dodaných i nedodaných)                    |

---

## Výpočet Servicegrade — klíčová logika

### Statusy dodávky (`VL_STATUS`)

Status je počítán v uzlu `VL_with_VA_TG_LT`:

| Status | Popis                                                              |
|--------|--------------------------------------------------------------------|
| `A`    | Objednáno — žádná dodávka ani Transfer Order                      |
| `C`    | Committed — Transfer Order existuje (nebo Konverter bez picku)    |
| `D`    | Dispatched — Konverter s pickem, nebo SA status > 208             |
| `L`    | Delivered — fakticky doručeno (LP stav ≥ 90 nebo jiný TS)        |

### Timestamps používané pro SGR

| Pole                | Popis                                             |
|---------------------|---------------------------------------------------|
| `TG_DUEGI`          | Due Date for Goods Issue — cílový termín          |
| `LP_MAX_TS_GE_40`   | Maximální timestamp Package DB stavu ≥ 40         |
| `LP_MAX_TS_GE_60`   | Max. TS stavu ≥ 60                                |
| `LP_MAX_TS_GE_90`   | Max. TS stavu ≥ 90                                |
| `LP_MAX_TS_GE_100`  | Max. TS stavu ≥ 100 (připraveno k expedici)       |
| `LP_MAX_TS_GE_106`  | Max. TS stavu ≥ 106                               |
| `LP_MAX_TS_GE_110`  | Max. TS stavu ≥ 110                               |
| `LP_MAX_TS_GE_115`  | Max. TS stavu ≥ 115                               |
| `LP_MAX_TS_GE_120`  | Max. TS stavu ≥ 120                               |
| `MD_TS`             | Timestamp MD dokumentu                            |
| `VR_TS`             | Timestamp fakturace (billing)                     |

### Výstupní SGR flag pole (uzel `VL_with_VA_TG_LT_LP_VR_MD_FI`)

| Pole                      | Popis                                                                                    |
|---------------------------|------------------------------------------------------------------------------------------|
| `VLC_CNT_BGR`             | `1` pokud objednávka byla včas připravena k odvozu (Bereitstellungsgrad)                 |
| `VLC_CNT_DGR1`            | `1` pokud LP status ≥ 40 nebo ≥ 60 existuje a je ≤ DUEGI                                |
| `VLC_CNT_BSGR`            | `1` pokud LP status ≥ 90 existuje (začátek SGR pásma)                                   |
| `VLC_CNT_DGR`             | `1` pokud byla položka doručena včas (Delivered Grade)                                   |
| **`VLC_CNT_SGR`**         | **`1` pokud položka splnila Servicegrade** (konečný flag)                                |
| `VLC_CNT_SGR_ALL_TIME`    | `1` pokud bylo dosaženo stavu D/L bez ohledu na čas                                     |
| `VLC_CNT_SGR_REL`         | SGR relevantní k zákazníkově objednávce (zohledňuje VA_ABGR_TS, lock TS, STATUS_0_TS)   |
| `VLC_CONF_VALUE`          | Potvrzené množství pro SGR výpočet                                                       |
| `VLC_TARGET_VALUE`        | Cílové množství pro SGR výpočet                                                          |

### Principiální logika SGR výpočtu (pseudokód)

```
-- Položka splní SGR (VLC_CNT_SGR = 1) pokud:
IF status = 'L' AND EXISTS(timestamp > '00000000000000') AND timestamp <= TG_DUEGI
   WHERE timestamp IN (LP_MAX_TS_GE_100, LP_MAX_TS_GE_106, ..., MD_TS, VR_TS,
                       LP_MAX_TS_GE_90)
THEN VLC_CNT_SGR = 1
ELSE VLC_CNT_SGR = 0

-- Výsledný SGR% = SUM(VLC_CONF_VALUE) / SUM(VLC_TARGET_VALUE)
```

---

## Speciální větvení — objednávky bez dodávky

Pro SA objednávky, které **nemají kompletní dodávku**, existuje paralelní cesta přes:
- `VA_wo_VL` → `VA_w_VL` → `VA_only_Delta` → `VA_current` → `VA_undeleted`
- → `VA_with_VL` → `VA_with_FI` → `VA_with_FI_TD` → **`VA_not_full_delivered`**

V uzlu `VA_not_full_delivered` se počítají analogické pole:
- `VAC_CONF_VALUE`, `VAC_TARGET_VALUE`, `VLC_CNT_BGR`, `VLC_CNT_SGR_REL`

Obě větve jsou sloučeny v uzlu `VA_union_VL`.

---

## Konverter (Warehouse Automation)

Konverter (`KO_`) reprezentuje automatický dopravníkový systém ve skladu. Data z konverteru:
- Mají vlastní pick timestamp (`KOC_TS_KONV_PICK`) a create timestamp
- Opravují/doplňují Transfer Order záznamy
- Ovlivňují `VL_STATUS`: Konverter bez picku → status `C`; Konverter s pickem → status `D`
- Jsou mixovány s LTA daty přes uzel `LT_UNION_LTA_KONV`

---

## Prediktivní alerting (historicky)

View obsahoval uzly pro **Predictive Alerting (PA)** — výpočet pravděpodobnosti, že objednávka nesplní DUEGI na základě historických průměrných časů. Tyto uzly byly od **změny 38488 (2023-06-22)** odstraněny a logika přesunuta do end-routine.

---

## Historie klíčových změn

| Datum      | Change# | Autor   | Popis                                                                               |
|------------|---------|---------|-------------------------------------------------------------------------------------|
| 2024-12-12 | 39223   | FG408DJ | Fix výpočtu VLC_TARGET_VALUE — přidána kontrola prázdnosti VLC_VR_TS_NONULL        |
| 2024-08-22 | 38907   | FIJ8NKN | Nové pole ZZGG8_ADDITIVE v LP_history                                               |
| 2023-11-28 | 38752   | EHV5BD2 | Přidán VA_LPRIO; VLC_LPRIO plněn z VL_LPRIO pokud VA_LPRIO prázdné                 |
| 2023-08-22 | 38729   | EHV5BD2 | VLC_PA_STATUS_* přepočítán z TG_VACTS místo TG_ORDERTS                             |
| 2023-06-22 | 38488   | EHV5BD2 | Odebrání PA uzlů, zjednodušení prediktivního alertingu                              |
| 2022-10-24 | 36519   | EHV5BD2 | Nové pole VACTS (actual tour start) průchod celým grafem                            |
| 2022-03-18 | 34181   | EHV5BD2 | Přidán VA_AUGRU (důvod odmítnutí)                                                   |
| 2021-10-01 | 33740   | EHV5BD2 | SGR_STAT pro nákupní objednávky; VA_KUNNR/KUNWE prohozeny; LM_LGORT                |
| 2021-07-07 | 32788   | EHV5BD2 | Nový parametr ERDAT; filtry dolní hranice ve všech hlavních uzlech                  |
| 2020-09-29 | 30801   | EHV5BD2 | Přepočet VLC_CNT_DGR/SGR/SGR_ALL_TIME pro status L s TS ≥ LP_MAX_TS_GE_90         |
| 2019-01-29 | 27699   | TD3AB04 | VLC_CNT_SGR_ALL_TIME, VLC_SGR_TS, VLC_CNT_SGR_REL                                  |
| 2018-02-26 | 20520   | SUIK131 | Lagermonitor 2: FIB procesy, Konverter, prediktivní alerting                        |
| 2017-12-11 | —       | SUIK131 | Podpora nákupních objednávek (Nachschub) jako paralelní datový zdroj                |

---

## Výstupní pole (výběr)

| Pole                         | Popis                                               |
|------------------------------|-----------------------------------------------------|
| `VLC_CNT_BGR`                | Flag: Bereitstellungsgrad (připravenost k odvozu)   |
| `VLC_CNT_DGR`                | Flag: Delivered Grade                               |
| `VLC_CNT_SGR`                | Flag: **Servicegrade** (klíčová metrika)            |
| `VLC_CNT_SGR_ALL_TIME`       | Flag: SGR bez ohledu na čas                         |
| `VLC_CNT_SGR_REL`            | Flag: SGR relevantní k objednávce                   |
| `VLC_CONF_VALUE`             | Potvrzené množství                                  |
| `VLC_TARGET_VALUE`           | Cílové množství                                     |
| `VL_STATUS`                  | Status dodávky (A/C/D/L)                            |
| `TG_DUEGI`                   | Cílový termín vydání zboží                          |
| `LTC_QDATU` / `LTC_QZEIT`   | Datum/čas picku v přepravním příkazu                |
| `VLC_PICKDATE`               | Datum picku (opravené o noční směnu před 6:30)      |
| `VLC_SHIFT`                  | Směna (1=ranní, 2=denní, 3=noční)                   |
| `VLC_HOLY`                   | Flag: pick fell on holiday                          |
| `TD_YEAR` / `TD_MONTH` / `TD_WEEK` | Časová dimenze                              |
| `XX_SOURCEDOC`               | Typ startovacího dokumentu (SO/EK/...)              |
| `XXC_LGORT_E`                | Skutečné/aktuální skladové místo                    |
