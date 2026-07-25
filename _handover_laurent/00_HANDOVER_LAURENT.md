# Handover voor Laurent — wijzigingen 13-14 juni 2026 + verklaring lage scores

**Van:** het GitHub-team (Peter / Brainwolves, motor-/methodologiekant)
**Voor:** Laurent (md_developers, Bitbucket `nationalestressindex.be`)
**Datum:** 14 juni 2026
**Doel:** (1) verklaren waarom de scores laag staan, (2) jou alles geven om mijn wijzigingen handmatig in Bitbucket toe te passen zonder jullie nieuwe frontend te verliezen.

---

## DEEL 1 — De lage scores: wat is er aan de hand? (kort antwoord eerst)

**Het is geen bug, geen sync-probleem, en niet de frontend. De index meet een echte daling.**

Wat we gemeten en geverifieerd hebben:

1. **Beide sites tonen exact hetzelfde cijfer.** `les-hautes-alpes-sbi.brainwolves.workers.dev` (GitHub) en `nationalestressindex.be` (Bitbucket) tonen allebei versie 0.3.4, percentiel 20, composiet −0,07, `equal_smoothed` −0,05. Dat veld `equal_smoothed` is minuten geleden door ons toegevoegd. **Conclusie: jullie frontend consumeert dezelfde data-feed die onze pipeline produceert. De scores komen 100% uit de motor (`app/engine/` + `app/pipeline/fetchers/`), niet uit de frontend.** De divergentie zit alléén in de frontend-code, niet in de cijfers.

2. **De score is een seizoens-PERCENTIEL: "hoger dan X% van de vergelijkbare dagen in de laatste 24 maanden."** Het is een relatieve maat, geen absoluut stressniveau.

3. **De gemeten omstandigheden zijn sinds 2024 echt kalmer geworden.** Het onderliggende composiet (het gewogen gemiddelde van ~20 indicatoren) daalde maand na maand:

   | Periode | composiet-gemiddelde | komt overeen met percentiel |
   |---|---|---|
   | 2024 (jun-dec) | **+0,16 tot +0,32** | **≈ 57-83** |
   | 2025 (jan-jul) | +0,18 tot +0,31 | ≈ 60-80 |
   | 2025 (aug-dec) | ~0,00 | ≈ 40 |
   | **2026 (jan-jun)** | **−0,03 tot −0,14** | **≈ 20** |

   **Jullie herinnering aan "we zaten op 50-83" klopt — dat was 2024 en begin 2025.** Toen waren energieprijzen, inflatie en macro-druk hoog. In 2026 zijn die genormaliseerd (energieprijs uitzonderlijk laag, inflatiepiek voorbij), dus de index leest correct dat het nu kalmer is dan de afgelopen twee jaar.

4. **De methode is gezond gekalibreerd.** Een volkomen neutrale dag (composiet = 0) geeft percentiel 39; +0,2 geeft 71; −0,1 geeft 20. Geen scheve berekening.

5. **Onze recente methodologie-wijziging (§4.1.7 recency-vensters) is NIET de oorzaak.** We hebben dit getest: zet je die vensters uit (terug naar de oude volledige-historie-baseline), dan is het percentiel 17 in plaats van 20 — even laag. Het percentiel is een *rangorde* en die verschuift niet door de baseline-keuze.

### Is er dan iets te "fixen"?

**Nee, niet als bug.** Het cijfer is eerlijk. Wat overblijft is een *interpretatie*-kwestie: het publiek leest "20/100" als "bijna geen stress", terwijl het betekent "kalmer dan de zware periode 2024-2025". Daarom staat er nu expliciet bij: *"hoger dan op X% van de dagen rond deze tijd van het jaar, gemeten over de laatste twee jaar."*

Mogelijke vervolgkeuzes (allemaal optioneel, allemaal een methodologie-beslissing voor Peter — **niet** zomaar doen):
- **Niets** — accepteren dat het cijfer relatief is; de framing dekt het.
- **Referentie verlengen** (bijv. 3-5 jaar) zodat het percentiel minder door de recente periode wordt gedomineerd en stabieler ligt.
- **Een vaste absolute baseline** (bijv. 2010-2019) toevoegen naast het rollende percentiel, als je een "absoluut" stressniveau wilt tonen. Vereist historische ijkdata.

**Wat je vooral NIET moet doen:** onze methodologie-wijzigingen terugdraaien om de scores "hoger" te maken. De lage scores zijn de eerlijke werkelijkheid; ze kunstmatig opkrikken zou de wetenschappelijke basis breken (en de scores stonden in 2024 hoog om een echte reden, niet door een truc).

---

## DEEL 2 — Architectuur: waar komen de cijfers vandaan?

```
  [app/pipeline/  Python]          [app/engine/  TypeScript]         [app/web/  React]
   haalt echte bronnen op   ->  berekent z-scores, composiet,   ->  toont het cijfer
   (KMI, ECB, GDELT, ...)       percentiel, tier, onzekerheid       (JULLIE FRONTEND)
        |                                  |                                |
        v                                  v                                v
   raw-values.json   ----------->   latest.json (de score)  ----------->  de site
```

- **De SCORE wordt bepaald door `app/pipeline/fetchers/` (welke data) en `app/engine/` (de berekening).** Niet door de frontend.
- **`app/cron-worker/` is deze sessie NIET gewijzigd.** Niets te doen daar.
- Jullie nieuwe frontend consumeert `latest.json`. Zolang jullie diezelfde `latest.json`-feed gebruiken die onze CI produceert, kloppen de cijfers automatisch. Draaien jullie een EIGEN pipeline/engine op Bitbucket, dan moet je de wijzigingen uit Deel 3 toepassen om dezelfde cijfers te krijgen.

---

## DEEL 3 — Wat ik gewijzigd heb (volledige catalogus, 13-14 juni)

Diff-basis: vanaf de gemeenschappelijke stand van 12 juni (commit `33e5bdc`, methodologie 0.3.2) tot nu (0.3.4). Kant-en-klare patches staan naast dit bestand (zie Deel 4).

### A. `app/pipeline/` — bronnen, bewaking, analyse

| Bestand | Status | Wat & waarom |
|---|---|---|
| `pipeline/fetchers/statbel.py` | gewijzigd | **HICP-bronfix.** De oude inflatiebron (ECB SDW `ICP/...ANR` en Eurostat `prc_hicp_manr`) is per 2025-12 bevroren; CPI hing 194 dagen op 2,2%. Overgezet naar de opvolger `prc_hicp_minr` (ECOICOP ver.2). Echte BE-inflatie nu 4,1%. Ook `une_rt_m`-werkloosheidsfallback robuust tegen lege nieuwste maand. |
| `pipeline/fetchers/fod_economie.py` | gewijzigd | Brandstof-HICP-fallback + lange indexreeks mee naar dezelfde opvolger-dataset (CP0722, unit I15). `ecb_fuel_eur_per_l_series` → `hicp_fuel_eur_per_l_series`. |
| `pipeline/healthcheck.py` | gewijzigd | **Canary-uitbreiding (laag 2-bis).** Leest het nieuwe `reference_audit`-blok uit `latest.json` en escaleert: niet-reproduceerbaar/degeneraat → `critical` (run rood); overgevoelig/dun → `degraded`. |
| `scripts/backfill_macro_baseline.py` | gewijzigd | CPI-backfill gebruikt nu dezelfde Eurostat-reeks + parser als de dagfetcher (schaaldiscipline). |
| `scripts/backfill_fuel_baseline.py` | gewijzigd | Importnaam mee (`hicp_fuel_eur_per_l_series`). |
| `analysis/aggregation_variance.py` | **nieuw** | Diagnostiek: kwantificeert dat het composiet ~96% uitmiddeling is. Niet in de score-keten. |
| `analysis/ciss_prototype.py` | **nieuw** | Diagnostiek: CISS-aggregatie getest en verworpen voor SBI. Niet in de score-keten. |
| `analysis/smoothing_prototype.py` | **nieuw** | Diagnostiek: meet hoeveel afvlakking de volatiliteit dempt. Niet in de score-keten. |
| `tests/test_fetcher_ladders.py`, `tests/test_healthcheck.py` | gewijzigd | Tests voor bovenstaande. |

### B. `app/engine/` — de score-berekening (TypeScript)

| Bestand | Status | Wat & waarom |
|---|---|---|
| `src/runtime.ts` | gewijzigd | De kern. **(1)** §4.1.7 recency-vensters (MAD-z baseline rollend 24m dag / 60m maand). **(2)** §4.1.8 afvlakking: het gepubliceerde percentiel rust op het 7-daags trailing gemiddelde van het composiet (lost dag-tot-dag-whipsawen op). **(3)** referentie-audit per cyclus. **(4)** v0.4-onzekerheidsband. Versie 0.3.2 → 0.3.4. |
| `src/methodology/smoothing.ts` | **nieuw** | De 7-daagse afvlak-helper (§4.1.8). |
| `src/methodology/reference-audit.ts` | **nieuw** | Automatische consistentie-/plausibiliteitscontrole van het dagpercentiel. |
| `src/methodology/bootstrap.ts` | gewijzigd | Onzekerheidsband: aggregator-callback (v0.4) + afvlakking per trekking (§4.1.8). |
| `src/types.ts` | gewijzigd | Nieuwe velden: `composite.equal_smoothed`, `percentile.smoothing_window_days`, `reference_audit`, `v04.uncertainty`. |
| `src/cli/generate-fixture.ts` | gewijzigd | Env-gated diagnostische z-reeks-dump (`SBI_DUMP_Z`), nul kosten in productie. |
| `test/*.ts` | gewijzigd/nieuw | `smoothing.test.ts`, `reference-audit.test.ts` + uitbreidingen. 182 tests groen. |

### C. `app/cron-worker/`

**Niets gewijzigd.**

### D. `app/web/` — frontend (LET OP: jullie hebben dit heropgebouwd)

Hier zit de spanning. Wij hebben deze sessie óók frontend-aanpassingen gedaan (kicker-woorden RUSTIG/NORMAAL/VERHOOGD/UITZONDERLIJK, band-bewuste kicker, mediaan op de meterbalk, June20-rode merknaam, openingszin, percentielzin met 2-jaars-context, afgevlakte band, footer). **Deze conflicteren waarschijnlijk met jullie nieuwe frontend.** Patch `04_frontend_changes.patch` staat erbij zodat je kunt kiezen wat je overneemt — maar de cijfer-logica zit NIET in de frontend, dus je kunt deze gerust negeren als jullie eigen frontend de data correct toont. De enige inhoudelijke frontend-punten die de moeite waard zijn om over te nemen (tekstueel, geen logica):
- De percentielzin met "gemeten over de laatste twee jaar" (belangrijk voor de juiste interpretatie van het lage cijfer).
- De relatieve niveauwoorden RUSTIG/NORMAAL/VERHOOGD/UITZONDERLIJK i.p.v. LAAG/GEMIDDELD/VERHOOGD/EXTREEM.

### E. Documentatie (audit-trail, niet code)

Pre-registratie §4.1.7 + §4.1.8, doc 04/06/07/08, CHANGELOG, OSF-manifest. Niet nodig om te draaien; wel de wetenschappelijke onderbouwing.

---

## DEEL 4 — Hoe pas je dit toe op Bitbucket

Naast dit bestand staan vier patches:

| Patch | Inhoud | Toepassen? |
|---|---|---|
| `01_pipeline_fetchers_en_scripts.patch` | HICP-bronfix + canary + backfills | **JA** als jullie een eigen pipeline draaien (anders levert de feed verkeerde/oude inflatie). |
| `02_engine_scoring.patch` | §4.1.7 + §4.1.8 + audits + onzekerheid | **JA** als jullie een eigen engine draaien (anders andere cijfers dan de live feed). |
| `03_analyse_diagnostiek.patch` | analyse-scripts | optioneel (alleen diagnostiek). |
| `04_frontend_changes.patch` | onze frontend-aanpassingen | **selectief** — alleen de tekst-punten uit Deel 3.D; de rest botst met jullie rebuild. |

Toepassen (vanuit de repo-root op Bitbucket):

```bash
# Bekijk eerst wat de patch doet:
git apply --stat _handover_laurent/01_pipeline_fetchers_en_scripts.patch
git apply --check _handover_laurent/01_pipeline_fetchers_en_scripts.patch   # conflictcheck
# Pas toe:
git apply _handover_laurent/01_pipeline_fetchers_en_scripts.patch
git apply _handover_laurent/02_engine_scoring.patch
```

Als `git apply` botst (door jullie rebuild), open de patch als leesbare diff en neem de hunks handmatig over — de patches zijn klein en goed becommentarieerd. Wil je liever de volledige bestanden, vraag ze op; ze staan in onze repo.

### Verificatie na toepassen

```bash
cd app/engine && npx tsc --noEmit && npm test            # verwacht: 182 groen
cd ../pipeline && for t in tests/test_*.py; do python3 "$t"; done   # 11 suites groen
```

Live-check (jullie feed moet matchen met onze GitHub-feed):
```bash
curl -s "https://les-hautes-alpes-sbi.brainwolves.workers.dev/data/latest.json" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data_quality']['methodology_version'], d['percentile']['short_24m'], d['composite'].get('equal_smoothed'))"
# verwacht iets als: 0.3.4 20 -0.05
```

---

## DEEL 5 — Samengevat in drie zinnen

1. De lage scores zijn echt en correct: de gemeten omstandigheden zijn sinds 2024 genormaliseerd; "50-83" was 2024/2025, "20" is het kalmere 2026.
2. Beide sites draaien dezelfde data-feed; de divergentie zit alleen in de frontend, niet in de cijfers — onze score-wijzigingen leven in `app/engine/` + `app/pipeline/fetchers/`, `app/cron-worker/` is onaangeroerd.
3. Pas patch 01 + 02 toe als jullie een eigen motor draaien; neem uit de frontend alleen de twee tekst-punten over; draai de methodologie NIET terug om de cijfers op te krikken.

Vragen? Stuur gerust. — Het GitHub-team
