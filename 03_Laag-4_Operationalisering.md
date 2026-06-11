# Stressor-Blootstellings-Index (SBI)
## Laag 4: Operationalisering en datapipeline

**Status:** v0.2 — werkdocument
**Document:** laag 4 van de methodologie
**Bouwt op:** 01_Anker-Paper.md, 02_Laag-3_Indicator-Selectie.md
**Auteur:** BRAINWOLVES
**Datum:** mei 2026

---

## 0. Samenvatting

Dit document operationaliseert de in laag 3 geselecteerde indicatorset. Sinds de amendementen (zie 00_Pre-Registratie.md §4.1 en 02_Laag-3 §10) telt die set 25 geregistreerde indicatoren in 6 domeinen: 20 gescoord in het cijfer, 4 kalendercontext (D6, amendement A6) en 1 diagnostisch (grade D). De uitwerking hieronder beschrijft de oorspronkelijke 20-set; de vijf later toegevoegde indicatoren (I-D1-009, I-D1-010, I-D2-009, I-D3-007, I-D3-009) zijn geoperationaliseerd in de registry en fetchers van de app, met `app/engine/src/indicators/registry.ts` als single source of truth. Per indicator wordt de exacte formule, eenheid, missing-data-strategie, ruis-karakteristiek en databron-toegang gespecificeerd. Aanvullend worden vijf methodologische protocollen vastgelegd: tijdsharmonisatie tussen indicatoren van verschillende frequentie, collineariteit-resolutie via VIF, mediacyclus-decorrelatie binnen D5, datapipeline-architectuur (target state én minimum viable pipeline), en robuustheidstest bij dataverlies.

---

## 1. Algemene operationalisering-conventies

### 1.1 Tijdsreferentie

Alle indicatoren in CET/CEST, datum-stempel d. Canonieke meetfrequentie: wekelijks, dagelijkse onderliggende data waar beschikbaar.

### 1.2 Geografische scope

België als werkmarkt. Lokale data gewogen naar bevolkingsdichtheid per provincie (NUTS-2). Voor weers- en astronomische indicatoren wordt 50.85°N, 4.35°E (Brussel) als referentie gebruikt — een bekende keuze die in laag 8 in sensitivity-analyse wordt getest (alternatief: bevolkingsgewogen middelpunt Vlaanderen).

### 1.3 Missing-data-strategie

Drie hiërarchische regels:

1. *Last-observation-carried-forward* binnen 3 dagen voor dagelijkse indicatoren
2. *Linear interpolation* binnen 14 dagen voor wekelijkse/maandelijkse indicatoren
3. *Explicit missing flag* bij grotere gaten — domeinweging wordt herberekend exclusief de ontbrekende indicator

Elke imputatie wordt gelogd.

### 1.4 Ruis-conventies

Per continue indicator wordt ruis-karakteristiek geschat. Indicatoren met verwachte signal-to-noise-ratio < 2 worden uitgesloten — tenzij deterministisch.

### 1.5 Eenheid-conventie

Alle indicatoren worden in laag 5 omgezet naar Z-scores. In dit document staan de ruwe eenheden.

---

## 2. Indicator-specificaties

### 2.1 Domein D1 — Omgeving & klimaat

#### I-D1-001 Daglichturen

- **Formule:** L(d) = uren tussen astronomische zonsopgang en zonsondergang op datum d
- **Eenheid:** uren (decimaal)
- **Missing:** geen — deterministisch
- **Bron:** astronomische berekening (NOAA Solar Calculator-algoritme)
- **Resolutie:** dagelijks
- **Historiek:** onbeperkt

#### I-D1-002 Hitte

- **Formules:**
  - T_max(d), T_min(d) — dagelijkse extremen (°C)
  - Trigger H1(d) = 1 indien T_max > 30°C
  - Trigger H2(d) = 1 indien T_min > 20°C (tropische nacht)
  - Continu: Heat_excess(d) = max(0, T_max - 30)
- **Eenheid:** °C; binair voor triggers
- **Missing:** nearest-neighbor station (max 50 km)
- **Bron:** KMI/RMI

#### I-D1-003 Kou

- **Formules:**
  - C1(d) = 1 indien T_min < -5°C
  - Cold_excess(d) = max(0, -5 - T_min)
- **Bron:** KMI/RMI

#### I-D1-004 Luchtkwaliteit

- **Formules:**
  - PM25(d), O3_max(d), NO2(d)
  - Composite_AQ(d) = max(PM25/15, O3_max/100, NO2/25) — ratio tot WHO 2021-grenswaarden
- **Eenheid:** μg/m³ ruw; ratio voor composite
- **Missing:** mediaan over 3 dichtstbijzijnde stations
- **Bron:** IRCEL-CELINE

### 2.2 Domein D2 — Mobiliteit & ruimte

#### I-D2-001 Filezwaarte

- **Formule:**
  - F_morn(d) = totaal file-km × file-minuten 06:30-09:30
  - F_eve(d) = totaal file-km × file-minuten 16:00-19:00
  - F_total(d) = F_morn + F_eve
- **Eenheid:** km·min
- **Bron:** Vlaams Verkeerscentrum
- **Confounder-flag:** weersextremen, ongevallen → afzonderlijk loggen

#### I-D2-004 Brandstofprijzen

- **Formule:**
  - P_euro95(d), P_diesel(d) — officiële maximumprijzen
  - Fuel_combined(d) = 7-daags voortschrijdend gemiddelde
- **Eenheid:** €/l
- **Bron:** FOD Economie

### 2.3 Domein D3 — Economische conditie

#### I-D3-001 Consumptieprijsindex (CPI)

- **Formule:** Infl_yoy(m) = (CPI(m) - CPI(m-12)) / CPI(m-12) × 100
- **Wekelijkse SBI:** forward-fill van Infl_yoy(m) over weken in maand m
- **Bron:** STATBEL

#### I-D3-002 Energieprijzen

- **Formules:**
  - Gas_wk(w), Elec_wk(w) — wekelijkse spotprijzen
  - Energy_combined(w) = 0.5 × (Gas_norm + Elec_norm)
- **Bron:** Belpex (Epex Spot), gas hub

#### I-D3-003 Aangekondigde collectieve ontslagen

- **Formule:**
  - CD_workers(w) = werknemers in collectieve-ontslagprocedures, week w
  - CD_combined(w) = log(1 + CD_workers(w))
- **Bron:** FOD WASO

#### I-D3-005 Werkloosheidscijfer

- **Formule:** U(m) = werkzoekenden % beroepsbevolking, seizoensgecorrigeerd
- **Bron:** STATBEL / Steunpunt Werk

#### I-D3-006 Hypotheekrente

- **Formule:** I_mort(m) = NBB-gemiddelde rente nieuwe hypotheken
- **Bron:** Nationale Bank van België

### 2.4 Domein D4 — Werk & belasting

#### I-D4-001 Kalendarische deadlinepieken

- **Formule:** D_dl(d) = +1 in belastingaangifte-weken; +1 in kwartaaleinde-week; +2 in jaareinde-week
- **Eenheid:** integer 0-3
- **Bron:** kalender FOD Financiën

#### I-D4-002 Schoolvakantie-zonder-opvang

- **Formule:**
  - SH(d) = 1 indien schoolvakantieperiode én niet-zondag
  - SH_weighted(d) = SH(d) × (1 + duration_remaining/total_duration)
- **Bron:** Vlaamse onderwijskalender

### 2.5 Domein D5 — Media & collectieve gebeurtenissen

#### I-D5-001 Nieuwsnegativiteits-index

- **Formule:**
  - Tone(d) = gemiddelde GDELT-tonescore voor NL-talige Belgische bronnen
  - Negativity(d) = -Tone(d)
  - Weekly: 7-daags gemiddelde
- **Eenheid:** GDELT tone units (typisch -20 tot +20)
- **Bron:** GDELT Project v2 (BigQuery publieke dataset)
- **Resolutie:** dagelijks

#### I-D5-002 Google Trends — stress-termen

- **Formule:**
  - GT_set = {stress, burn-out, slaapproblemen, moe, hoofdpijn, angst, uitgeput, slapeloosheid}
  - GT_raw(d) = som van Google Trends Interest voor termen in GT_set, regio BE, NL-taal
  - GT_score(d) = GT_raw(d) - GT_news_correction(d) (zie §4.4 decorrelatie)
- **Eenheid:** relatieve index 0-100
- **Bron:** Google Trends API

#### I-D5-003 Negatieve collectieve gebeurtenissen

- **Formule:** event-tagging met magnitude-coderingsregels:
  - Niveau 1 (gewicht 1): regionale ramp, ≥5 doden óf >100 gewonden óf >€10M materiële schade
  - Niveau 2 (gewicht 3): nationale ramp, ≥10 doden óf nationale rouw afgekondigd
  - Niveau 3 (gewicht 5): terreuraanval, oorlogsverklaring, massa-evacuatie
  - Per gebeurtenis: 7-daags exponentieel decay-window
- **Eenheid:** continu 0-15
- **Codering:** twee onafhankelijke codeurs, inter-rater κ ≥ 0.75 op 50 historische test-cases vereist vóór livegang. Indien κ niet haalbaar: vereenvoudig naar binair (gebeurtenis ja/nee) met magnitude als sensitivity.
- **Bron:** nieuwsmonitoring (VRT, De Standaard, HLN, RTBF), aangevuld met Politiezone-rapporten

### 2.6 Domein D6 — Kalender & ritme

#### I-D6-001 Dagen tot volgende vakantie

- **Formule:** DV(d) = min(dagen tot volgende officiële feestdag, dagen tot schoolvakantie)
- **Eenheid:** dagen
- **Notitie:** in laag 5 wordt het signaal omgekeerd zodat meer dagen = hogere stressor-blootstelling

#### I-D6-002 Weekdag-cyclus

- **Formule:** zes dummies (zondag = referentie)
- **Eenheid:** binair per dummy

#### I-D6-003 Klok-verzetten

- **Formule:** DST_effect(d) = exp(-(d - d_DST) / 3) voor 0 ≤ (d - d_DST) ≤ 7
- **Eenheid:** continu 0-1

#### I-D6-005 Examenperiode

- **Formule:** binair voor:
  - 1e examenperiode hoger onderwijs (5-30 januari)
  - 2e examenperiode hoger onderwijs (laatste 2 weken mei + 1e 2 weken juni)
  - CSE-periode secundair (typisch juni)

---

## 3. Tijdsharmonisatie

### 3.1 Heterogeniteit-overzicht

- *Dagelijks:* alle D1-, D2-, D4-, D5-001, D5-002, D6-indicatoren
- *Wekelijks:* I-D3-002, I-D3-003
- *Maandelijks:* I-D3-001, I-D3-005, I-D3-006
- *Event-based:* I-D5-003, I-D6-003

### 3.2 Harmonisatie-protocol

**Maandelijkse indicatoren binnen wekelijks composiet:**
- Forward-fill van laatste publicatie tot volgende publicatie
- Maandelijkse indicatoren in laag 5 afzonderlijk genormaliseerd om transitie-effecten te vermijden

**Event-indicatoren:**
- Behouden als continue waarde met decay-window
- Niet samengedrukt naar wekelijks-binair

**Wekelijkse composiet-cel:**
- Berekend op zondagavond, voor week eindigend zaterdag

---

## 4. Collineariteit en decorrelatie

### 4.1 VIF-protocol

Variance Inflation Factor berekend na 24 maanden dataverzameling voor paren binnen elk domein én tussen domeinen.

**Beslisregel:**
- VIF < 5: indicatoren behouden
- 5 ≤ VIF < 10: een van beide markeren als secundaire set
- VIF ≥ 10: hoogste-evidence-grade indicator behouden

### 4.2 Vooraf bekende collineariteit-risico's

| Paar | Verwachte VIF | Voorgenomen oplossing |
|---|---|---|
| I-D1-002 (hitte) × I-D1-004 (luchtkwaliteit) | Matig (5-10) | Behouden, sensitivity-analyse |
| I-D3-001 (CPI) × I-D3-006 (hypotheekrente) | Matig | Behouden — verschillende lag-structuren |
| I-D5-001 (nieuwsnegativiteit) × I-D5-003 (collectieve gebeurtenissen) | Hoog (>5) | Zie §4.4 decorrelatie-protocol |
| I-D5-002 (Google Trends) × I-D5-001 (nieuwsnegativiteit) | Matig | Zie §4.4 |

Notitie: in v0.1 was er een I-D7-004 (seizoensfase) × I-D1-001 (daglicht) collineariteits-risico. Dit is opgelost door I-D6-004 (was I-D7-004) naar secundaire set te verplaatsen.

### 4.3 Documentatie-vereiste

Elke collineariteits-beslissing gelogd met VIF-waarde, beslissing en datum.

### 4.4 Mediacyclus-decorrelatie-protocol (nieuw in v0.2)

**Probleem:** I-D5-001, I-D5-002 en I-D5-003 zijn alle gedeeltelijk door media-cyclus gedreven. Risico op zelfversterkende loop.

**Protocol:**

*Stap 1 — Event-spike-correctie voor Google Trends.*
- Wanneer een I-D5-003 niveau ≥2 gebeurtenis plaatsvindt op dag d_event, wordt I-D5-002 voor de periode [d_event, d_event + 7] aangepast:
- GT_news_correction(d) = GT_raw(d) - GT_baseline(d)
- waarbij GT_baseline(d) = gemiddelde van GT_raw over [d-14, d-7] (twee weken vóór event)
- Het residu (GT_raw - news_correction) wordt als signaal gebruikt; de spike wordt apart geregistreerd

*Stap 2 — Continue cross-correlatie-monitor.*
- 7-daagse cross-correlatie tussen I-D5-001 en I-D5-003 wordt continu berekend
- Indien correlatie > 0.7 over een gehele week: D5-domein-gewicht automatisch gehalveerd in die week
- Origineel én gehalveerd composiet beide gerapporteerd voor transparantie

*Stap 3 — "Non-media baseline" als sensitivity-rapportage.*
- Een composiet zonder D5 wordt parallel berekend
- Wekelijks gerapporteerd: het verschil ("media-bijdrage") in percentielpunten

Dit protocol maakt de mediacyclus-circulariteit zichtbaar en mitigeerbaar, niet onzichtbaar.

---

## 5. Datapipeline-architectuur

### 5.1 Eerlijke disclaimer: target state vs current state

De pipeline-beschrijving hieronder is *target state*. De *current state* is een minimum viable pipeline (zie §5.6). Bij elke versie-uitgave wordt expliciet vermeld in welk implementatie-stadium het systeem zich bevindt.

### 5.2 Bronnen-stack (target state)

| Bron | Indicatoren | Toegangsmodus | Frequentie |
|---|---|---|---|
| KMI/RMI Open Data | I-D1-001..003 | API | dagelijks |
| IRCEL-CELINE | I-D1-004 | API | uurlijks |
| Vlaams Verkeerscentrum | I-D2-001 | scraping + API | dagelijks |
| FOD Economie | I-D2-004 | scraping | dagelijks |
| STATBEL | I-D3-001, I-D3-005 | API | maandelijks |
| Belpex / Epex | I-D3-002 | API | dagelijks |
| FOD WASO | I-D3-003 | scraping | wekelijks |
| NBB | I-D3-006 | API | maandelijks |
| Vlaamse onderwijskalender | I-D4-002, I-D6-005 | statisch | jaarlijks |
| Nieuwsmonitoring | I-D5-003 | menselijke codering | event |
| GDELT | I-D5-001 | BigQuery | dagelijks |
| Google Trends | I-D5-002 | pytrends API | dagelijks |
| Kalender-deterministisch | I-D4-001, I-D6-001..003 | lokaal | dagelijks |

### 5.3 Pipeline-stappen (target state)

```
[1] EXTRACT — scheduled fetch met retry-logica
[2] VALIDATE — schema- en range-check
[3] TRANSFORM — formules uit §2 toepassen
[4] HARMONIZE — tijdsharmonisatie uit §3
[5] DECORRELATE — protocol §4.4
[6] AUDIT — sanity checks, anomaly flags
```

### 5.4 Opslag-formaat (target state)

- Ruwe data: source-native
- Geharmoniseerde data: Apache Parquet
- Metadata: JSON met versie, bron, fetch-tijd

### 5.5 Versionering

- Elke transformatieregel: semver
- Bij wijziging: alle historische data herberekend
- Oude versies behouden voor reproduceerbaarheid

### 5.6 Minimum Viable Pipeline (current state vereiste)

Voor de eerste 6 maanden na livegang volstaat een minimale pipeline:
- Python-scripts (lokaal of single VM)
- Flat-file opslag (CSV + JSON)
- Handmatige trigger of dagelijks cronjob
- Versie-control via Git
- Output: één JSON-file per dag, publiek toegankelijk

Doel: snelheid van iteratie boven schaalbaarheid. Target-state-architectuur kan stapsgewijs worden opgebouwd zodra het instrument haar waarde heeft bewezen.

---

## 6. Robuustheidstest-protocol

Vóór composiet operationeel kan uitzenden:

### 6.1 Test 1 — Indicator-dropout

Op willekeurige 24-maands-historische subset:
- 1 indicator verwijderen → composiet herberekenen → max afwijking < 15%
- 3 indicatoren verwijderen → < 30%
- 5 indicatoren verwijderen → < 50%

### 6.2 Test 2 — Bron-dropout

Eén bron uitschakelen → composiet werkt via missing-data-protocol. Max afwijking < 20%.

### 6.3 Test 3 — Lag-tolerantie

Vertraging in publicatie van één bron tot 7 dagen → composiet blijft consistent berekenbaar via forward-fill.

---

## 7. Volgende stap (laag 5: normalisatie)

1. Z-scoring per indicator (mediaan + MAD)
2. Dubbele baseline-aanpak (24m voortschrijdend + 2010-2019 vast)
3. STL-decompositie per indicator
4. Winsorization
5. Inverse-codering waar nodig

---

## Annex A — Indicator-overzichtstabel (v0.2)

| Code | Indicator | Eenheid | Resolutie | Bron | Type |
|---|---|---|---|---|---|
| I-D1-001 | Daglichturen | uren | dagelijks | astronomisch | continu |
| I-D1-002 | Hitte | °C / binair | dagelijks | KMI | continu+binair |
| I-D1-003 | Kou | °C / binair | dagelijks | KMI | continu+binair |
| I-D1-004 | Luchtkwaliteit | ratio | dagelijks | IRCEL-CELINE | continu |
| I-D2-001 | Filezwaarte | km·min | dagelijks | Verkeerscentrum | continu |
| I-D2-004 | Brandstofprijs | €/l | dagelijks | FOD Economie | continu |
| I-D3-001 | CPI inflatie | % yoy | maandelijks | STATBEL | continu |
| I-D3-002 | Energieprijs | €/MWh | wekelijks | Belpex | continu |
| I-D3-003 | Aangekondigde ontslagen | log(N) | wekelijks | FOD WASO | continu |
| I-D3-005 | Werkloosheid | % | maandelijks | STATBEL | continu |
| I-D3-006 | Hypotheekrente | % | maandelijks | NBB | continu |
| I-D4-001 | Deadlinekalender | 0-3 | dagelijks | deterministisch | ordinaal |
| I-D4-002 | Schoolvakantie | 0-2 | dagelijks | onderwijskalender | continu |
| I-D5-001 | Nieuwsnegativiteit | tone units | dagelijks | GDELT | continu |
| I-D5-002 | Google Trends stress | 0-100 | dagelijks | Google Trends | continu |
| I-D5-003 | Collectieve gebeurtenissen | 0-15 | event | menselijke codering | continu |
| I-D6-001 | Dagen tot vakantie | dagen | dagelijks | deterministisch | continu |
| I-D6-002 | Weekdag | 6× binair | dagelijks | deterministisch | binair |
| I-D6-003 | Klok-verzetten | 0-1 | event | deterministisch | continu |
| I-D6-005 | Examenperiode | binair | dagelijks | academisch kalender | binair |
