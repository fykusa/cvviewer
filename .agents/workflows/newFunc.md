---
description: Začátek práce na nové funkcionalitě - načtení kontextu
---

Když uživatel zavolá `newFunc` (nebo tě požádá o novou funkcionalitu), postupuj přesně podle těchto kroků:

1. Pomocí nástroje `view_file` si **vždy** nejprve přečti soubor `doc/implementation_plan.md` pro zjištění aktuálního plánu a zařazení nové funkcionality do kontextu celého projektu. Nezapomeň převést cestu na absolutní.
2. Pomocí nástroje `view_file` si přečti soubor `doc/development.md` pro pochopení technického stavu, zvyklostí a důležitých poznámek z předchozího vývoje.
3. Zařaď novou funkcionalitu do aktuálního plánu a zapiš tyto změny do `doc/implementation_plan.md`.
4. Pečlivě analyzuj uživatelovo zadání s ohledem na přečtené dokumenty.
5. Před započetím samotného kódování uživateli krátce shrň, jak plánuješ novou funkcionalitu implementovat (architektura, dotčené soubory), a případně se zeptej na nejasnosti. Až po odsouhlasení (nebo pokud jde o triviální změnu) se pusť do úprav souborů.