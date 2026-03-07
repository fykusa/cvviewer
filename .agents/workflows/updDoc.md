---
description: Aktualizace projektové dokumentace po dokončení úkolu
---

Když tě uživatel požádá o aktualizaci dokumentace (např. pomocí `updDoc`), postupuj podle těchto kroků:

1. Zhodnoť, jaké změny, funkce nebo opravy byly právě dokončeny.
2. Zkontroluj a aktualizuj soubor `doc/implementation_plan.md` (odškrtni hotové úkoly, uprav odhady pro další kroky, pokud se změnily priority).
3. Zkontroluj a aktualizuj soubor `doc/development.md`. Zaznamenej sem všechna nová architektonická rozhodnutí, klíčové přidání knihoven, vyřešené složité problémy nebo nová pravidla pro psaní kódu.
4. Pokud nová funkcionalita mění chování aplikace pro koncového uživatele, zvaž doplnění nebo aktualizaci souboru `README.md`.
5. Promítni tyto změny přímo do souborů (použij nástroje jako `replace_file_content`).
6. Nakonec uživateli oznam, co přesně a ve kterých dokumentech bylo aktualizováno.
