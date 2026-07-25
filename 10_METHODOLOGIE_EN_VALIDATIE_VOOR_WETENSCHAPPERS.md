# De Nationale Stress Index (SBI) - Methodologie en validatie voor wetenschappers

> **Doel van dit document.** Dit is de ingang voor onderzoekers, journalisten en reviewers die de tool willen doorlichten, narekenen en valideren. Het beschrijft wat de index meet, hoe elk cijfer tot stand komt (met de formules), welke databronnen worden gebruikt, hoe de onzekerheid en de bewaking werken, en - even belangrijk - waar de eerlijke grenzen liggen. Alles is naleesbaar in de publieke data en de broncode; de verwijzingen staan per onderdeel.
>
> **Versie:** methodologie 0.4.0 (20 juni 2026). **Status:** levend document; de bindende, formele specificatie blijft de pre-registratie `00_Pre-Registratie.md` (laag 1) en de laag-documenten `01`-`09`. Dit document vat die samen, actualiseert ze naar 0.4.0 en voegt het validatie- en reproductiepad toe.

---

## 1. Wat de index meet (en uitdrukkelijk niet)

De Nationale Stress Index meet **hoe ongewoon zwaar de maatschappelijke omstandigheden in heel Belgie vandaag zijn, vergeleken met een normaal decennium (2010-2019)**. Het is een samengestelde index van blootstellings-omstandigheden (kosten van levensonderhoud, energie, weer, nieuws, verkeer, en meer), niet een meting van wat een individu voelt.

**Bindende claim-discipline (in elke publicatie verplicht):** het cijfer is *geen meting van individuele stress*. 50 = het normale niveau van 2010-2019. Het meet blootstelling aan omstandigheden, niet een fysiologische of klinische stresstoestand. Deze grens is een harde regel (zie §11) en is ingebouwd in de publieke copy.

De index is gebouwd door BRAINWOLVES als reactieve campagne-trigger voor Les Hautes-Alpes. Er is **geen academische affiliatie en (nog) geen peer review**; de bindende zelfkwalificatie is: *een signaalindex, geen wetenschappelijk meetinstrument*. Dit document is er net om externe toetsing mogelijk te maken.

---

## 2. Architectuur in een oogopslag

Drie lagen, volledig deterministisch (geen `Date.now()`/`Math.random()` in de rekenkern; alles geseed op de observatiedatum, zodat een run reproduceerbaar is):

1. **Pipeline (Python, `app/pipeline/`)** - haalt elke dag de ruwe waarden op bij ~20 officiele bronnen (fetcher-ladders met cache- en mock-fallback), schrijft `app/data/raw-values.json` en bouwt per indicator historie in `app/data/history/*.json`.
2. **Rekenkern (TypeScript, `app/engine/`)** - normaliseert (Z-scores), winsoriseert, aggregeert, mapt naar 0-100, berekent onzekerheid en tier, en schrijft de publieke output.
3. **Web (React/Vite op een Cloudflare Worker, `app/web/`)** - toont het cijfer en serveert de JSON.

**Cadans:** CI ververst 6x/dag (07/08/12/15/17:30/20u Belgische tijd). Een code-push naar `main` deployt meteen.

**Live endpoints (publiek, cache-busten verplicht):**
- `https://les-hautes-alpes-sbi.brainwolves.workers.dev/data/latest.json` - het publieke record.
- `.../data/latest-expert.json` - het volledige expert-record (incl. het v0.4-blok met per-indicator `z_kort`/`z_lang`).
- `.../data/sparkline-30d.json` - 60-daagse reeks van het relatieve composiet.

---

## 3. De cijfers en hun aggregatie

Er worden **meerdere** maten parallel berekend en gepubliceerd (transparantie). Het is belangrijk te weten welke de publieke kop is.

### 3.1 Hybride dagkop `daily_pressure` - HET publieke hoofdcijfer (0.4.0, amendement §4.1.14)

Sinds 0.4.0 is de publieke kop een **hybride "niveau x beweging"**: een stabiel structureel anker, gecombineerd met de dagelijkse beweging.

```
daily_pressure.score = round( 100 * Phi( (1 - w_fast) * z_slow + w_fast * z_fast ) )
```
- `w_fast = 0,30` (de "ademknop"; `HYBRID_W_FAST` in `app/engine/src/methodology/hybrid-headline.ts`).
- `z_slow` = gemiddelde MAD-z van de **6 structurele codes** vs hun 2010-2019/2016-2019-baseline: I-D3-001 inflatie, I-D2-004 brandstof, I-D3-007 consumentenvertrouwen (inverse), I-D3-005 werkloosheid, I-D3-006 hypotheekrente, I-D3-002 energieprijs. Dit hergebruikt exact de `broad_pressure`-z's (zelfde maat, zie §4).
- `z_fast` = gemiddelde z van de **snelle codes** (I-D1-002 hitte, I-D1-003 koude, I-D5-001 nieuwstoon, elk vs hun 2010-2019/2017-2019-normaal) **plus verkeer** (I-D2-001-rt, DATEX-dagfilezwaarte).
- `Phi` = de normale cumulatieve verdelingsfunctie (z=0 -> 50).

**Waarom een hybride.** De brede absolute meting (`broad_pressure`, §3.2) leest eerlijk-hoog maar beweegt nauwelijks van dag tot dag (verzadigingseffecten), en verkeer zat er niet in. De hybride houdt het structurele anker hoog en eerlijk, maar laat het cijfer zichtbaar ademen met de dagelijkse omstandigheden. Wetenschappelijke kern: het relatieve seizoenspercentiel (§3.3) leest laag NIET inherent, maar door zijn crisisjaren-referentie; door de snelle factoren tegen hun **normale jaren** (2010-2019) te meten, ademt het cijfer wel maar leest het eerlijk-hoog.

**Verkeer als dagsignaal (eerlijke uitzondering).** Verkeer (I-D2-001-rt) heeft geen reproduceerbaar 2010-2019-archief, dus geen "vs normaal"-anker. Het weegt mee als **dagsignaal** via de empirische CDF van zijn eigen, nog korte en aangroeiende historie: `z = probit(percentielrang van vandaag binnen de eigen historie)`, gewinsoriseerd. Het aantal referentiepunten (`n_reference`) wordt gerapporteerd zodat de dunne basis zichtbaar is; onder 10 dagpunten valt verkeer eerlijk weg. Het wordt **niet** geclaimd als "vs normale jaren".

**Keuze-discipline:** `w_fast = 0,30` en de blend-vorm zijn een door Peter bepaalde productkeuze, niet empirisch uit data afgeleid. De Phi-blend (een samengestelde z-score, geen additieve plak-punten) is gekozen om plafond-verzadiging te vermijden.

### 3.2 `broad_pressure` (sub-view) en `economic_pressure` (sub-view)

De **brede absolute meting** (§4.1.11, sinds 0.4.0 een sub-view onder de dagkop):
```
broad_pressure.score = round( 100 * Phi(zbar) ),   zbar = gemiddelde van 9 gewinsoriseerde z's
```
over 9 indicatoren (5 economisch + hitte + koude + energie + nieuws), elk MAD-z vs zijn eigen 2010-2019-normaal (energie 2016-2019, nieuws 2017-2019). `Phi` per Abramowitz & Stegun 26.2.17 (`normalCdf`, `economic-pressure.ts:121-134`). De **economie-only** variant (`economic_pressure`, §4.1.9) is hetzelfde over enkel de 5 economische codes.

### 3.3 Het relatieve seizoenspercentiel (transparantie-laag)

Het oorspronkelijke cijfer: hoe ongewoon is vandaag ten opzichte van de **laatste 24 maanden** in hetzelfde seizoen?
```
composiet C(t) = Sum_domein [ w_domein * Sum_indicator ( w_indicator * z_short ) ]
percentile    = percentielrang van het 7-daags afgevlakte composiet binnen
                het +/-45-dagen-seizoensvenster over de laatste 24 maanden
```
Twee weegschema's worden parallel berekend: **Schema 1 (equal)** - domeingewicht 1/5, indicatorgewicht 1/n binnen het domein; **Schema 2 (evidence-graded)** - per bewijsklasse A/B/C/D = 3/2/1/0. De 7-daagse afvlakking is amendement §4.1.8 (lookahead-vrij). Dit cijfer leest momenteel laag (~13-25); dat is **eerlijk** (2024-2025 waren extreem, dus "vandaag" is kalmer dan die referentie), maar het las misleidend laag als publieke kop - vandaar de absolute/hybride herdefinitie. Het blijft berekend voor transparantie en diagnostiek.

### 3.4 De v0.4 kern- en trigger-laag

Apart van de kop draait een snelle **trigger-laag** (`kern-composite.ts`) over 9 kern-indicatoren:
- `composite_meting = Sum_kern (w_meting_i * z_lang_i) / Sum_aanwezig w_meting_i`
- `achtergrond` = de economische grondlast (incl. verkeer), die via `load_factor = clamp(1 - 0,15*achtergrond, 0,6, 1,0)` de triggerdrempel oplaadt.
- `w_meting = bewijslast * reikwijdte`; `w_trigger = bewijslast * reikwijdte * snelheidsfactor` (snelheid direct/snel/traag = 1,5/1,0/0,4).
- De v0.4-tier (oranje P60/1 dag, rood P90/2 dagen, met hysterese) bepaalt de campagne-trigger. De pre-geregistreerde v0.2-tier (P70/P90/3 dagen) loopt parallel onveranderd mee.

---

## 4. Normalisatie - de wiskunde (verbatim)

Bron: `app/engine/src/methodology/zscore.ts`, `winsorize.ts`, `ecdf.ts`, `economic-pressure.ts`, doc `04_Laag-5`.

**Robuuste Z-score (MAD-z).** Robuust gekozen zodat een hittegolf of crisis in de baseline de schaal niet scheeftrekt:
```
z = (x - mediaan(baseline)) / robustScale(baseline)
MAD = mediaan(|x - mediaan(x)|);   robustScale = MAD * 1,4826
```
**Fallback-keten** (bij een vlakke/gecensureerde baseline): `MAD*1,4826 -> IQR/1,349 -> SD -> NaN`. Bij NaN ("geen schaal") wordt de indicator als ontbrekend gemarkeerd, niet stilletjes als 0 - geen-variatie mag niet als "normaal" verschijnen.

**Winsorisatie:** `z_capped = clip(z, -3, +3)`. De +/-3-grens is een conventie zonder specifieke empirische basis; de gevoeligheidsanalyse varieert ze (+/-2,5 en +/-3,5).

**Active-regime-schaal voor hitte/koude (§4.1.12).** Hitte (`max(0, Tmax-30)`) en koude (`max(0, -5-Tmin)`) zijn 0 op >98% van de dagen. De spreiding wordt daarom over de **niet-nul-dagen** gemeten, de mediaan over de volledige baseline:
```
scale = robustScale( baseline.filter(v > 0) );   mediaan = mediaan(baseline_alle)
```
Zo telt een normale dag neutraal (z=0) mee, maar kapt niet elke milde warme dag meteen op +3. (Dit dichtte een landmijn: voorheen las een 31C-dag even zwaar als een 38C-hittegolf.)

**Empirische CDF (eCDF), het robuuste alternatief (§4.1.6).** Voor lange, seizoensbewuste baselines:
```
z_ecdf = probit( clamp( percentielrang(x, referentie)/100 , [1/(2n), 1-1/(2n)] ) )
```
met de Acklam-benadering voor de probit. De **gate** (vooraf geregistreerd): activeert pas bij >= 3 jaargangen en >= 90 punten in het seizoensvenster (+/-45 dagen), met een drift-cap op de recentste 5 jaar. Op vandaag kwalificeert alleen **I-D5-003**; alle andere indicatoren dragen MAD-z met het label `normalization_provisional: true`. (Het verkeer-dagsignaal in de hybride gebruikt dezelfde eCDF-probit, maar tegen zijn eigen korte historie.)

**STL en recency-vensters (§4.1.7).** Sommige indicatoren krijgen een naieve seizoens-detrending (dag-van-jaar-mediaan-aftrek). De MAD-z-baseline is een **rollend venster**: 24 maanden voor dagbronnen, 60 maanden voor maand-/jaarbronnen (anders te weinig punten voor een stabiele MAD).

---

## 5. De indicatoren (de single source of truth)

De registry (`app/engine/src/indicators/registry.ts`) is bevroren en de enige bron van waarheid: **25 geregistreerd = 20 gescoord + 4 kalendercontext (D6, niet in het cijfer) + 1 diagnostisch (I-D3-003, grade D)**. Een synchronisatietest (`registry.test.ts`) faalt bewust bij een stille wijziging.

**Bewijsklassen:** A = primair, sterk onderbouwd; B = secundair; C = gereduceerd; D = experimentele proxy (gewicht 0, telt niet mee).

### 5.1 De 20 gescoorde indicatoren

| Code | Naam | Domein | Grade | Inverse | Databron | Baseline |
|---|---|---|---|---|---|---|
| I-D1-001 | Daglichturen | D1 | A | ja | NOAA Solar (astronomisch, deterministisch) | kalender |
| I-D1-002 | Hitte (max(0,Tmax-30)) | D1 | A | nee | KMI synop Ukkel (opendata.meteo.be); fallback open-meteo, MET Norway | 2010-2019 + rollend 24m |
| I-D1-003 | Koude (max(0,-5-Tmin)) | D1 | B | nee | KMI synop Ukkel | 2010-2019 + rollend 24m |
| I-D1-004 | Luchtkwaliteit | D1 | A | nee | IRCELINE (Brussel) | rollend 24m |
| I-D1-009 | Wateroverlast (rivierdebiet) | D1 | B | nee | VMM Waterinfo + SPW KiWIS | rollend 24m |
| I-D1-010 | Pollen (5 soorten) | D1 | B | nee | Copernicus CAMS (Europees model) | rollend 24m |
| I-D2-001 | Filezwaarte (jaar-op-jaar %) | D2 | A | nee | Vlaams Verkeerscentrum (jaarrapport) | rollend 60m |
| I-D2-004 | Brandstofprijs (Euro95) | D2 | B | nee | FOD Economie / be.STAT | 2010-2019 + rollend 60m |
| I-D2-009 | Treinstiptheid (% >= 6 min) | D2 | B | nee | Infrabel Open Data | rollend 24m + gevalideerde 13m |
| I-D3-001 | Inflatie (CPI YoY) | D3 | A | nee | STATBEL via ECB | 2010-2019 + rollend 60m |
| I-D3-002 | Energieprijzen (EUR/MWh) | D3 | B | nee | ENTSO-E / Belpex | 2016-2019 + rollend 24m |
| I-D3-005 | Werkloosheid (%) | D3 | A | nee | Eurostat | 2010-2019 + rollend 60m |
| I-D3-006 | Hypotheekrente (%) | D3 | B | nee | ECB MIR | 2010-2019 + rollend 60m |
| I-D3-007 | Consumentenvertrouwen | D3 | B | **ja** | Eurostat EC-enquete | 2010-2019 + rollend 60m |
| I-D3-009 | Stroomnet-druk (vraag/forecast) | D3 | B | nee | Elia Open Data | rollend 24m |
| I-D4-001 | Werk-deadlinepieken | D4 | B | nee | FOD Financien fiscale kalender (det.) | kalender |
| I-D4-002 | Schoolvakantie z. opvang | D4 | B | nee | Vlaamse onderwijskalender (det.) | kalender |
| I-D5-001 | Nieuwsnegativiteit (GDELT-toon) | D5 | C | nee | GDELT DOC v2 (BE-bronnen) | 2017-2019 + rollend 24m |
| I-D5-002 | Wikipedia stress-aandacht | D5 | C | nee | Wikimedia Pageviews (nl) | rollend 24m |
| I-D5-003 | Grote negatieve gebeurtenis | D5 | A | nee | nieuwsmonitoring + menselijke codering | rollend 24m / eCDF |

*Opmerkingen:* I-D3-007 (consumentenvertrouwen) is de enige inverse-gecodeerde economische indicator (hoog vertrouwen = lage stress). I-D5-001 en I-D5-002 staan op grade **C** door een expliciete Peter-keuze (2026-06-02); de evidence-review plaatste ze lager - dit is een transparante, geen verborgen keuze. De backfill-baseline voor hitte/koude komt uit een open-meteo historische reanalyse (2010-2019); de live-waarde uit de KMI-synop. Beide gebruiken dezelfde SYNOP-meetpunten maar verschillende systemen (een drift-studie staat nog open).

### 5.2 De 4 kalendercontext-indicatoren (D6, NIET in het cijfer)

I-D6-001 (dagen tot volgende vakantie), I-D6-002 (weekdag-cyclus), I-D6-003 (klok-verzetten), I-D6-005 (examenperiode). Amendement A6 (2026-06-11): kalenderfeiten zijn deterministische aannames, geen metingen, dus ze voeden het composiet niet; ze worden als `context_signals` naast het cijfer getoond.

### 5.3 Het diagnostische signaal (grade D)

I-D3-003 (collectieve ontslagen): de naam suggereert een feed van aangekondigde ontslagen, maar zo'n machineleesbare open bron bestaat niet; de gebruikte werkloosheidsdelta meet iets anders. Daarom **grade D, niet gescoord** - eerlijk als diagnostisch gelabeld.

### 5.4 Secundaire signalen (sensitivity/trigger-laag, NIET in het cijfer)

Verzameld via `batch.add_secondary()` in `run.py`, bouwen eigen historie op, maar tellen niet mee in de score. Onder meer: **I-D2-001-rt** (DATEX-dagverkeer; *wel* in de hybride dagkop als dagsignaal), I-D2-009S (iRail-storingen), I-D2-delijn / I-D2-stib (OV-verstoringen), I-D5-001-rss / I-D5-emotie / I-D5-verdriet (RSS-toon/emotie/rouw via Pattern.nl-lexicon, voor diagnostiek en brand-safety), I-D5-006S (Reddit), I-D5-mastodon, I-D5-trends (Google Trends, geblokkeerd voor bots), I-D3-003S (ontslag-radar), AeroDataBox (vluchtvertragingen Brussel, historie in opbouw). Reden secundair: geen reproduceerbaar pre-2024-archief, niet-representatieve steekproef, of dubbeltelling.

---

## 6. Onzekerheid

**B3-bootstrap** (`bootstrap.ts`): 2.000 trekkingen, deterministisch geseed op de observatiedatum. De gepubliceerde band is het 90%-interval (`ci_90 = [5e percentiel, 95e percentiel]` van de bootstrap-verdeling). De `uncertainty_flag` is `low` (< 0,10 breedtefractie), `medium` (0,10-0,20) of `high` (> 0,20, of n_reference < 30). De bootstrap dekt **alleen de schattingsonzekerheid van de baseline** (resampling), niet bron-, model- of specificatieonzekerheid.

**Specificatie-/multiverse-onzekerheid.** De keuzevrijheid in het ontwerp (winsorize-grens 2,5 vs 3 vs 3,5, weegschema, baseline-venster +/- 1 jaar) geeft samen **~19 percentielpunten** spreiding. Dit is de eerlijke bovengrens op de "echtheid" van een precies getal; behandel het cijfer als een band, niet als een puntschatting.

---

## 7. Validatie en bewaking

**Geautomatiseerde tests (de eerste validatielaag).**
- **Rekenkern: 205 tests over 14 bestanden** (`cd app/engine && npx tsc --noEmit && npm test`). Onder meer: `registry.test.ts` (de pre-registratie-synchronisatiebewaker, faalt bij stille indicator-/weegwijzigingen), `evidence.test.ts` (claim-/plain-language-discipline), `zscore`/`ecdf`/`economic-pressure`/`hybrid-headline`/`v04`/`bootstrap`/`reference-audit`/`seasonal`/`smoothing`/`brand-safety`/`calibration`.
- **Pipeline: 12 standalone suites** (`app/pipeline/tests/test_*.py`, geen pytest: `python3 tests/test_<naam>.py`).

**Referentie-audit (`reference-audit.ts`).** Reproduceert het dagpercentiel uit zijn eigen referentie en alarmeert (canary) bij niet-reproduceerbaar (`reproducible = (herberekend == gepubliceerd)`), degeneraat (`sd <= 1e-4`), te dun (`n < 30`) of overgevoelig.

**Operationele bewaking in lagen (doc 08).** Cron-Worker + `daily.yml` (primair) -> fetcher-ladders met cache-/mock-fallback -> `healthcheck.py`-canary (verdict `critical`/`degraded`/`ok`; alarmeert op afwezigheid en op de `simulated`-vlag, niet op een waarde 0, want kou=0 in de zomer is gezond) -> `verify_live.py` (structuurchecks op de live output, o.a. baseline-integriteit) -> `monitor.yml` (elke 20 min, onafhankelijke bewaker) -> `alert.py` (e-mail/Telegram bij faal). Belangrijk: deze checks bewaken **vorm en versheid, geen inhoudelijke juistheid** - ze zijn een vangnet, geen bewijs.

---

## 8. Inzage, reproductie en validatie - hoe u het zelf narekent

1. **De live data lezen** (cache-busten verplicht; nooit diagnosticeren op gecommitte JSON):
   ```bash
   curl -s "https://les-hautes-alpes-sbi.brainwolves.workers.dev/data/latest.json?cb=$(date +%s)"
   ```
   Velden om te checken: `daily_pressure` (kop: score, z_slow, z_fast, w_fast, components, traffic.n_reference), `broad_pressure` en `economic_pressure` (sub-views), `percentile.short_24m` (relatief), `uncertainty` (90%-band), `data_quality` (`methodology_version`, `indicators_simulated`, `indicators_missing`, `demo_fraction`). Het `latest-expert.json` bevat daarnaast het volledige `v04`-blok met per-indicator `z_kort`/`z_lang`, ruwe waarden en baseline-vensters.
2. **De broncode inzien en draaien.** Repo: `github.com/PeterHoogland/lhaa-sbi-barometer-`. Structuur: `app/engine` (TypeScript-rekenkern), `app/pipeline` (Python-fetchers + tests), `app/web` (frontend). Reproductie:
   ```bash
   cd app/engine && npx tsc --noEmit && npm test      # rekenkern, 205 tests
   npm run generate-fixture                            # reconstrueert de volledige historie + output (~150s)
   cd ../pipeline && for t in tests/test_*.py; do python3 "$t"; done   # 12 suites
   ```
   De rekenkern is deterministisch (geseed op de datum), dus een herberekening op dezelfde input geeft hetzelfde getal.
3. **Het pre-registratie- en wijzigingsspoor.** `00_Pre-Registratie.md` §4.1 bevat elk amendement (4.1.1 t/m 4.1.14) met datum, aanleiding en regel. `CHANGELOG.md` is de volledige audit-trail. Het bevroren publicatiepakket staat in `OSF_PUBLICATIE/` (docs 00-09 + `SHA256-MANIFEST.txt`, met een 30-dagen-wijzigingsprotocol per doc 08).

---

## 9. Eerlijke grenzen (lees dit als reviewer eerst)

De index hanteert harde regels die de geloofwaardigheid bewaken; de belangrijkste voor een validator:

1. **Geen nepdata als echte meting.** Een ontbrekende waarde wordt `null` + `*_status: "not_computed"`, of wordt expliciet gevlagd (`simulated: true`, `imputed`). Geen stille gap-bridging of forward-fill.
2. **Schaaldiscipline ("Hitte-bug-klasse").** Een baseline en zijn dagwaarde moeten exact dezelfde transformatie en meetset hebben. Reeksen van verschillende maten worden nooit gemengd. (Twee echte landmijnen hieruit zijn 2026-06-19 gedicht: de baseline-trim-bug en de hitte-schaalbug.)
3. **Bevroren GDELT-cijfer.** De pre-2020-historie van I-D5-001 is bevroren; wijzigen vereist expliciete goedkeuring.
4. **Wat NIET in het absolute cijfer kan.** Pollen, trein, verkeer-als-anker, OV (De Lijn/STIB) en social-signalen hebben **geen reproduceerbaar 2010-2019-archief met dezelfde maat**; ze kunnen niet absoluut "vs normale tijden" gemeten worden. Verkeer weegt in de hybride alleen als **dagsignaal** (eigen eCDF), niet als anker. Deze breedte hoort in de relatieve laag, die met ~2 jaar eigen historie kan ingroeien.
5. **Onbewezen criteriumvaliditeit (de grootste openstaande leemte).** Convergentie met gezondheidsuitkomsten (hulplijn-volume, ziekteverzuim/RIZIV, Sciensano geestelijke-gezondheidssurveys) is **opgezet maar nog niet uitgevoerd** - er is nog geen fijnmazige data gedeeld. De index is dus nog niet extern gevalideerd tegen werkelijke stress-uitkomsten.
6. **Korte/zwakke baselines, eerlijk gelabeld.** Energie 2016-2019, nieuws 2017-2019 (geen volledig decennium); weer/lucht/pollen hebben geen meet-archief vanaf 2010 (pollen is een Europees model, lucht is een Brussels station). De 24-maands rollende MAD-z bevat ~2 cycli (Cochrane adviseert >= 3); daarom het label "voorlopig" tot ~2027.
7. **Indirecte proxies.** Nieuwstoon (GDELT) meet kopsentiment, geen objectieve gebeurtenis-zwaarte; Wikipedia-aandacht kan door een nieuwsbericht gedreven zijn (Google Flu-waarschuwing); consumentenvertrouwen is verwachting, geen gemeten ontbering. Grade C/D markeert die lagere zekerheid.
8. **Procedurele eerlijkheid.** De amendementen 4.1.1-4.1.13 zijn ingevoerd zonder de formele 30-dagen-aankondiging (er is nog geen adviesraad); dit is retroactief geregulariseerd en open vermeld in de pre-registratie en de CHANGELOG. De versie-discipline (0.4.0) is een audit-trail, geen technische dwang tegen stille wijzigingen - naleving steunt op de synchronisatietest, de CHANGELOG en review.

---

## 10. Verder lezen (de bindende specificatie)

| Doc | Inhoud |
|---|---|
| `00_Pre-Registratie.md` | Laag 1: pre-registratie, inclusiecriteria, alle amendementen §4.1 |
| `01_Anker-Paper.md` | Conceptueel kader |
| `02`-`06` (Laag 3-7) | Indicator-selectie, operationalisering, normalisatie, weging, aggregatie+drempel |
| `07_Laag-8` | Validatie en robuustheid (falsifieerbaarheid F1-F5, gevoeligheid) |
| `08_Onderhoud-Protocol.md` | Bewaking, alarmering, 30-dagen-wijzigingsprotocol |
| `09_Brand-Message-Style-Guide.md` | Claim-discipline, communicatieregels |
| `CHANGELOG.md` | Volledige audit-trail |

---

*Vragen, replicatie-issues of een aanbod tot databron-koppeling voor criteriumvalidatie zijn welkom: dat laatste is precies de openstaande stap die de index van "signaalindex" naar "gevalideerd instrument" kan brengen. Contact via de eigenaar van het project.*
