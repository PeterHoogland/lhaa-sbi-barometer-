# Stressor-Blootstellings-Index (SBI)
## Laag 8: Validatie en robuustheid

**Status:** v0.2 — werkdocument
**Document:** laag 8 van de methodologie
**Bouwt op:** laag 1-7
**Auteur:** BRAINWOLVES
**Datum:** mei 2026

---

## 0. Samenvatting

Dit document specificeert hoe de SBI gevalideerd wordt — niet via een academische peer-review (die structureel niet mogelijk is zonder institutionele affiliatie), maar via **acht onafhankelijke toetsen** in drie hiërarchische tier-gates: must-pass, should-pass, en doorlopend (geen launch-gate). Het 6/8-criterium uit v0.1 — een arbitraire score-drempel die alle toetsen gelijk behandelde — is vervangen door deze gewogen tier-structuur waarin sommige toetsen fataal zijn en andere informatief.

---

## 1. Validatie-architectuur (v0.2 herzien)

Acht toetsen in drie tiers:

**Tier-1 — Must-pass (faal = methodologie verworpen):**
- Toets 1: Natural-experiments
- Toets 5: Placebo-indicator-test
- Toets 6: Test-retest reliability

**Tier-2 — Should-pass (faal = waarschuwing, beperking gedocumenteerd):**
- Toets 2: Retrospectieve backtest
- Toets 3: Convergente validiteit
- Toets 4: Multiverse-analyse

**Tier-3 — Continu (geen launch-gate, doorlopend proces):**
- Toets 7: Adversariële review als ontwerp-iteratie
- Toets 8: Publieke replicatie-uitdaging

### Verschil met v0.1

In v0.1 stond "6/8 toetsen pass" als launch-criterium. Dit was arbitrair en behandelde alle toetsen gelijk. In v0.2:
- Falen op één tier-1-toets is fataal (geen launch)
- Falen op tier-2-toets vereist gedocumenteerde beperking maar blokkeert launch niet noodzakelijk
- Tier-3 is een proces, geen toets

---

## 2. Toets 1 — Natural-experiments (Tier-1)

### 2.1 Doel

Toetsen of het instrument piekt tijdens onafhankelijk vastgestelde collectieve stress-episodes.

### 2.2 Pre-gedefinieerde gebeurtenissen

| Periode | Gebeurtenis | Verwacht effect |
|---|---|---|
| Maart 2020 | COVID-lockdown 1 | Stijging week 12-15 |
| Oktober-december 2020 | COVID-lockdown 2 | Stijging tijdens lockdown |
| Juli 2019 | Hittegolf (T_max > 38°C) | Stijging week 30 |
| Juli 2021 | Watersnood Wallonië | Lokale piek; nationale stijging |
| Oktober 2022 - maart 2023 | Energiecrisis | Aanhoudende stijging |
| 22 maart 2016 | Aanslagen Brussel/Zaventem | Acute piek week 12 |
| Najaar 2008 | Financiële crisis | Stijging CPI- en werkloosheidssubindex |

### 2.3 Succescriterium

Minimaal **5 van 7** gebeurtenissen: SBI in oranje of rode tier (P ≥ 70 sustained).

### 2.4 Faalmechanisme

<5 events detected: **F1 geactiveerd → methodologie verworpen**.

### 2.5 Beperking

7 events is statistisch beperkt. Geen formele hypothese-toetsing maar een redelijkheidstoets.

---

## 3. Toets 2 — Retrospectieve backtest (Tier-2)

### 3.1 Doel

Het instrument 14 jaar terug berekenen (2010-2024) en kijken of gedrag intuïtief is.

### 3.2 Pipeline

1. Alle 20 gescoorde indicatoren ophalen voor 2010-2024. Let op: dit zijn er na de amendementen toevallig opnieuw 20, maar in een andere samenstelling dan de oorspronkelijke 20-set (5 indicatoren toegevoegd, 4 D6-kalenderindicatoren naar de contextlaag, 1 indicator diagnostisch op grade D; zie 00_Pre-Registratie.md §4.1)
2. Pipeline draaien met live-methodologie — geen aanpassing aan historische data
3. C(t), P(t), tier produceren per dag

### 3.3 Verwachte patronen

- Januari-pieken (Blue Monday, energiekosten)
- Zomer-pieken in hittejaren
- COVID-stijging maart 2020
- Energiecrisis-plateau eind 2022

### 3.4 Succescriterium

Twee onafhankelijke beoordelaars: aanvaardbaarheid > 80%.

### 3.5 Faalmechanisme

Onverklaarde extreme pieken → diagnostiek per indicator → identificatie van pipeline-bug.

---

## 4. Toets 3 — Convergente validiteit (Tier-2)

### 4.1 Doel

Triangulatie tegen gerelateerde gedragsproxies.

### 4.2 Convergente variabelen

| Variabele | Bron | Verwachte richting |
|---|---|---|
| Ziekteverzuim-aggregaat | RIZIV (publieke aggregaten) | + correlatie |
| Mentale-gezondheidszorg-utilisatie | RIZIV/IMA-publieke aggregaten | + correlatie, lag mogelijk |
| Retail-bestedingen | STATBEL retail-index | - correlatie tijdens pieken |
| Alcohol/gokken-omzet | STATBEL/Belastingdienst aggregaten | + correlatie (coping) |

*Notitie: RIZIV-aggregaten zijn publieke data, identiek behandeld als STATBEL of NBB. Dit is geen institutionele samenwerking.*

### 4.3 Methode

- Maandelijkse SBI-gemiddelde
- Spearman-correlatie met variabele over 2010-2024
- Statistische significantie + effect-size

### 4.4 Succescriterium (v0.2 verscherpt)

Minimaal:
- **2 proxies met Spearman rho > 0.40 en p < 0.05** *OF*
- **3 proxies met Spearman rho > 0.30 en p < 0.05**

In v0.1 was de bar rho > 0.25 (zwak in elke statistische standaard). In v0.2 is dit verhoogd naar 0.30 of 0.40 afhankelijk van het aantal proxies. Eerlijkere, scherpere lat.

### 4.5 Faalmechanisme

0 of 1 proxy convergeert volgens criterium: **F4 geactiveerd** — beperking gedocumenteerd; launch alleen mogelijk met expliciete acknowledgement van zwakke convergente validiteit.

---

## 5. Toets 4 — Multiverse-analyse (Tier-2)

### 5.1 Doel

Alle redelijke analytische paden uitvoeren; meten hoe robuust de uitkomst is voor methode-keuzes (Steegen et al 2016).

### 5.2 Variatie-dimensies

- *Wegingsschema:* {equal, evidence-graded, inverse-rank}
- *Baseline-window:* {12m, 24m, 36m}
- *Percentiel-drempel oranje:* {65, 70, 75}
- *Percentiel-drempel rood:* {85, 90, 95}
- *Sustained-duration:* {1d, 3d, 5d, 7d}
- *Winsorization:* {±2.5, ±3.0, ±3.5}
- *STL voor twijfelgevallen:* {standaard, alle indicatoren STL, geen STL}

Totaal: 3 × 3 × 3 × 3 × 4 × 3 × 3 = **2916 analytische paden**.

### 5.3 Computationele realiteit

Pipeline op 5 jaar dagelijkse data per pad ≈ enkele seconden. Totaal 2916 paden ≈ 1-2 uur op standaard hardware. Eenmalige run vóór livegang; in onderhoudscyclus per kwartaal herhaald.

### 5.4 Succescriterium

Het **primaire pad** (default-configuratie zoals pre-geregistreerd) moet binnen de **centrale 95%** van de uitkomstenverdeling van alle paden vallen.

### 5.5 Faalmechanisme

Default valt buiten centrale 95% → herzie defaults of accepteer multiverse als primair signaal. Beperking gedocumenteerd, launch mogelijk met aanpassing.

---

## 6. Toets 5 — Placebo-indicator-test (Tier-1)

### 6.1 Doel

Testen of de pipeline correlaties detecteert die er niet mogen zijn.

### 6.2 Placebo's

| Placebo | Bron | Hypothese |
|---|---|---|
| P1: Maan-fase | astronomisch | Geen significant effect |
| P2: Pi-decimalen-stream | wiskundig | Geen significant effect |

### 6.3 Test

1000 trekkingen met willekeurige timing-offsets van placebo's. Verdeling van placebo-contributie aan composiet.

### 6.4 Succescriterium

95%-CI van placebo-contributie omvat 0.

### 6.5 Faalmechanisme

Placebo systematisch contribueert → **F3 geactiveerd → methode-bug → correctie vereist vóór launch**.

---

## 7. Toets 6 — Test-retest reliability (Tier-1)

### 7.1 Doel

Composiet moet substantieel hetzelfde blijven als 50% van indicatoren weggelaten worden.

### 7.2 Methode

Bootstrap: 1000 trekkingen × 50% van de 20 gescoorde indicatoren × pipeline herberekenen × tier vergelijken met volledige-set. Het aantal is na de amendementen toevallig opnieuw 20, maar de samenstelling verschilt van de oorspronkelijke 20-set (zie 00_Pre-Registratie.md §4.1); de bootstrap trekt uit de gescoorde set, dus zonder de D6-contextcodes en zonder de grade-D-code I-D3-003.

### 7.3 Succescriterium

≥ 70% tier-agreement.

### 7.4 Faalmechanisme

Lage agreement → composiet hangt te zwaar van specifieke indicatoren af → identificatie en mogelijk herziening vóór launch.

---

## 8. Toets 7 — Adversariële review als ontwerp-iteratie (Tier-3)

### 8.1 Verschil met v0.1

In v0.1 was "vijandige review" een launch-gate. In v0.2 is het **een ontwerp-iteratie-stap** — uitgevoerd vóór livegang om het ontwerp te verbeteren, niet om het te gate-en. Reden: indien een review fundamentele problemen blootlegt en het ontwerp wordt aangepast, is dat *bouwen*, geen *valideren*.

### 8.2 Werving

Drie tot vijf individuele academici, niet hun instellingen, uit verschillende methodologische scholen:
- Eén positivist-kwantitatief
- Eén kritisch-kwalitatief
- Eén psychometricus
- Eén epidemioloog of sociale-data-scientist
- Optioneel: één gedragseconoom

### 8.3 Vergoeding

Marktconform (€500-1500 per review). Disclosures publiek.

### 8.4 Procedure

- Reviewer ontvangt complete methodologie-paper
- Schrijft formele kritiek (5-10 pagina's)
- Methodologie-team reageert op elk punt
- Beide gepubliceerd als annex

### 8.5 Output

Verbeterd ontwerp én publiek-gemaakte kritiek met respons. Lezers zien wat critici aanmerkten.

### 8.6 Geen pass/fail

De review is een verbetercyclus, geen toets. Indien een reviewer een fataal probleem identificeert dat niet opgelost kan worden, wordt dit gedocumenteerd als beperking.

---

## 9. Toets 8 — Publieke replicatie-uitdaging (Tier-3)

### 9.1 Doel

Onafhankelijke derden moeten hetzelfde resultaat krijgen.

### 9.2 Procedure

Bij livegang publieke:
- Volledige code (open source)
- Configuratiebestanden
- Voorbeelddata voor testperiode
- Reproductie-handleiding

Publieke uitnodiging op OSF en GitHub. Replicaties krijgen citatie.

### 9.3 Succescriterium

Binnen 12 maanden na livegang: ≥ 2 onafhankelijke replicaties die SBI-scores reproduceren binnen 10%.

### 9.4 Faalmechanisme

0 replicaties of > 10% afwijkingen → **F5 geactiveerd** → documentatie van niet-reproduceerbaarheid → mogelijke methodologie-update.

### 9.5 Doorlopend proces, geen launch-gate

Replicatie kost tijd. Launch wacht niet op replicatie. Indien jaar 2 nog steeds 0 replicaties: serieuze herziening.

---

## 10. Tier-gate-beslismatrix voor launch

| Tier-1 (Must-pass) | Tier-2 (Should-pass) | Beslissing |
|---|---|---|
| 3/3 pass | 3/3 pass | **Launch** |
| 3/3 pass | 2/3 pass | **Launch** met gedocumenteerde beperking |
| 3/3 pass | ≤1/3 pass | **Stop** — heroverweeg ontwerp |
| <3/3 pass | enig | **Stop** — methodologie verworpen |

Tier-3 is geen launch-input maar doorlopend programma.

---

## 11. Validatie-rapport-template

Bij elke versie-uitgave:

| Toets | Tier | Status | Score | Notitie |
|---|---|---|---|---|
| 1. Natural-experiments | 1 | pass/fail | X/7 events detected | |
| 5. Placebo-test | 1 | pass/fail | 95% CI bevat 0: ja/nee | |
| 6. Test-retest | 1 | pass/fail | X% agreement | |
| 2. Retrospectieve backtest | 2 | pass/fail | inter-rater X% | |
| 3. Convergente validiteit | 2 | pass/fail | rho-overzicht | |
| 4. Multiverse | 2 | pass/fail | default percentiel-positie | |
| 7. Adversariële review | 3 | uitgevoerd/openstaand | X reviewers, Y aanpassingen | |
| 8. Publieke replicatie | 3 | aantal replicaties, % match | | |

---

## 12. Doorlopende monitoring (zie ook 08_Onderhoud-Protocol.md)

### 12.1 Jaarlijkse heraudit

Externe reviewer (jaarlijks andere) audit pipeline, methodologie, output. Audit-rapport publiek.

### 12.2 Quartaal-multiverse-monitor

Multiverse-analyse per kwartaal herhaald met groeiende dataset.

### 12.3 Bug-bounty-programma

Publieke uitnodiging voor methodologische uitdagingen.

---

## 13. Wat validatie *niet* doet

- Bewijst geen causaliteit
- Bewijst geen klinische relevantie
- Bewijst geen universele toepasbaarheid
- Bewijst geen voorspellende kracht

---

## 13-bis. Dagelijkse onzekerheidsrapportage (B3, geïmplementeerd 2026-06-12)

Elke productie-dagberekening rapporteert sinds B3 een echt bootstrap-betrouwbaarheidsinterval rond het dagcijfer (`uncertainty` in latest.json; implementatie `app/engine/src/methodology/bootstrap.ts`).

**Methode (baseline-resampling):** per gescoorde indicator (grade D uitgezonderd: die draagt het cijfer niet) wordt de baseline met teruglegging hertrokken (zelfde n) en de volledige productieketen herberekend (mediaan/robuuste schaal → z → geen-schaal-splitsing → inverse-codering → winsorization → equal-composiet → seizoenspercentiel tegen exact dezelfde referentieset als het gepubliceerde cijfer, via de gedeelde helper `seasonalReferenceWithFallback`). Over 2.000 trekkingen (deterministisch geseed op de datum, mulberry32) geeft de 5e–95e percentiel-spreiding het 90%-interval.

**Vlag:** `uncertainty_flag` op de intervalbreedte als fractie van de 0–100-schaal: low < 0,10 ≤ medium ≤ 0,20 < high. De vlag wordt berekend op de **gepubliceerde** (afgeronde) grenzen, zodat een lezer die de regel op de JSON-velden toepast altijd dezelfde vlag krijgt als de engine. Structurele overrides: minder dan 30 referentiepunten voor het percentiel → high (`thin_reference`); nul gescoorde indicatoren → high met volledig bereik en zónder composiet-CI (`no_scored_indicators`, composite_ci_95 = null). Bij high toont de publieke UI géén scherp getal maar het bereik plus een waarschuwing (bij `thin_reference` zonder de "90% zekerheid"-claim: het interval dekt die onzekerheid juist niet); bij low/medium staat de bandbreedte onder het cijfer en als band in de meter.

**Wat het interval dekt — en eerlijk: wat niet.** Het dekt de schattingsonzekerheid van de baselines (eindige steekproef) en de doorvertaling daarvan naar het dagpercentiel. Het dekt géén bronfouten, géén modelkeuzes (winsor-grens, STL-parameters, wegingsschema), géén afhankelijkheid tussen indicator-baselines (indicatoren worden onafhankelijk hertrokken), en ook niet de steekproefruis van de percentiel-referentieset zelf of van de dagwaarde: referentieset en dagwaarde worden vastgehouden. Onder de 30 referentiepunten wordt dat binair afgevangen (`thin_reference`); erboven blijft de rangkorrel (orde 100/n percentielpunt) buiten het interval. Die bredere model- en referentie-onzekerheid is het domein van de multiverse-/gevoeligheidsanalyse (§5 en de OECD/JRC-stap-7-analyse van BLOK B4).

**Relatie met §5 (multiverse):** bootstrap = "hoe zeker is dit getal gegeven de gekozen methode"; multiverse = "hoe anders was het getal onder andere redelijke methodekeuzes". Beide worden gerapporteerd, nooit door elkaar geteld.

De oude placeholder `bootstrap_95_ci_around_equal` (bewust `null`/`not_computed` sinds review §0-bis.1) wordt nu écht gevuld uit dezelfde trekkingen (2,5e–97,5e percentiel van het composiet, z-eenheden); zonder uitgevoerde bootstrap blijft hij eerlijk `null`.

---

## 14. Sluiting van de methodologie-build

Met laag 8 voltooid (v0.2) is de volledige SBI-methodologie gedocumenteerd op acht lagen, plus drie ondersteunende documenten:

- *Laag 1+2 — Anker:* construct, theorie, scope, falsifieerbaarheid → `01_Anker-Paper.md`
- *Laag 3 — Indicator-selectie:* 20 primair, 6 secundair, 9 uitgesloten → `02_Laag-3_Indicator-Selectie.md`
- *Laag 4 — Operationalisering:* formules, data, pipeline, decorrelatie → `03_Laag-4_Operationalisering.md`
- *Laag 5 — Normalisatie:* dubbele baseline, STL, winsorization → `04_Laag-5_Normalisatie.md`
- *Laag 6 — Weging:* drie schema's, balance-correctie, 6 domeinen → `05_Laag-6_Weging.md`
- *Laag 7 — Aggregatie & signaal:* drie-tier, percentielen, output-API → `06_Laag-7_Aggregatie-en-Drempel.md`
- *Laag 8 — Validatie:* acht toetsen, tier-gates, jaarlijkse audit → dit document

Ondersteunende documenten:
- `00_Pre-Registratie.md` — alle pre-geregistreerde keuzes
- `08_Onderhoud-Protocol.md` — review-kalender, update-procedures
- `09_Brand-Message-Style-Guide.md` — communicatie-vereisten voor abonnees

---

## Bronnen

Borsboom, D., Mellenbergh, G. J., & van Heerden, J. (2004). The concept of validity. *Psychological Review*, 111(4), 1061-1071.

Cronbach, L. J., & Meehl, P. E. (1955). Construct validity in psychological tests. *Psychological Bulletin*, 52(4), 281-302.

Mellers, B., Hertwig, R., & Kahneman, D. (2001). Do frequency representations eliminate conjunction effects? An exercise in adversarial collaboration. *Psychological Science*, 12(4), 269-275.

Munafò, M. R., Nosek, B. A., Bishop, D. V. M., et al. (2017). A manifesto for reproducible science. *Nature Human Behaviour*, 1, 0021.

Open Science Collaboration (2015). Estimating the reproducibility of psychological science. *Science*, 349(6251), aac4716.

Steegen, S., Tuerlinckx, F., Gelman, A., & Vanpaemel, W. (2016). Increasing transparency through a multiverse analysis. *Perspectives on Psychological Science*, 11(5), 702-712.
