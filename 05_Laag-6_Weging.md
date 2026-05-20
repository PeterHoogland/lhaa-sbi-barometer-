# Stressor-Blootstellings-Index (SBI)
## Laag 6: Weging

**Status:** v0.2 — werkdocument
**Document:** laag 6 van de methodologie
**Bouwt op:** laag 1-5
**Auteur:** BRAINWOLVES
**Datum:** mei 2026

---

## 0. Samenvatting

Dit document legt vast hoe de 20 genormaliseerde indicatoren in 6 domeinen worden gewogen tot één composiet. Twee hoofdschema's worden parallel uitgevoerd: een **equal-weights-schema** (transparant, geen verborgen aannames) en een **evidence-graded-schema** (factoren met sterkere wetenschappelijke onderbouwing wegen zwaarder). Een derde schema — *weegafhankelijkheid-diagnostiek* — is geen pass/fail-toets maar een rapportage-instrument dat de gevoeligheid voor weegkeuzes kwantificeert.

Het document specificeert verder een domein-balance-correctie en de pre-registratie van gewichten.

---

## 1. Twee fundamentele wegings-vragen

**Vraag A: Hoe wegen indicatoren *binnen* een domein?**
- Optie 1: gelijk
- Optie 2: gewogen naar evidence-grade per indicator
- Optie 3: gewogen naar variance-explanation (datadreven)

**Vraag B: Hoe wegen domeinen *tegen elkaar*?**
- Optie 1: gelijk (elk domein = 1/6)
- Optie 2: gewogen naar aantal indicatoren in domein
- Optie 3: gewogen naar gecombineerde evidence-grade van het domein
- Optie 4: gelijk met balance-correctie voor dunne domeinen

We selecteren combinaties die elk een specifiek wegingsschema vormen.

---

## 2. Schema 1 — Equal Weights (primair publicatie-schema)

### 2.1 Indicator-binnen-domein

Alle indicatoren binnen een domein krijgen identiek gewicht.

w_indicator(i ∈ D) = 1 / |D|

### 2.2 Domein-tussen

Alle zes domeinen krijgen gelijk gewicht:

w_domain(D) = 1/6 ≈ 0.167

### 2.3 Composiet-formule (volledige aggregatie in laag 7)

C_equal(t) = Σ_D [w_domain(D) × Σ_{i ∈ D} (w_indicator(i ∈ D) × Z_short(i, t))]

### 2.4 Waarom dit het primaire schema is

Equal weights heeft drie voordelen die in een methodologie zonder veldwerk dragend zijn:

1. *Transparantie:* geen verborgen aannames over relatieve belangrijkheid.
2. *Robuustheid:* geen overfitting aan historische data. Niet door achteraf-tuning te vertekenen.
3. *Verdedigbaarheid:* "we gaven elke literatuur-onderbouwde stressor gelijk gewicht" is een claim die geen empirische rechtvaardiging vereist die we niet kunnen leveren.

### 2.5 Beperking

Een file is duidelijk niet even belangrijk als een oorlog. Equal weights verbergt dat verschil. Daarom: het primaire publicatie-schema gebruikt equal weights, maar Schema 2 wordt parallel berekend en gepubliceerd zodat het verschil zichtbaar is.

---

## 3. Schema 2 — Evidence-Graded Weights (parallel)

### 3.1 Indicator-binnen-domein

Gewicht volgt de evidence-grade uit laag 3:

| Grade | Gewicht |
|---|---|
| A | 3 |
| B | 2 |
| C | 1 (alleen secundaire set) |

Genormaliseerd binnen domein:

w_indicator(i ∈ D) = grade_weight(i) / Σ_{j ∈ D} grade_weight(j)

### 3.2 Domein-tussen

Domein-gewicht = gemiddelde indicator-evidence-grade × balance-correctie:

w_domain(D) = (mean_grade(D) × balance(D)) / Σ_D (mean_grade(D) × balance(D))

### 3.3 Berekende waarden voor de 6 SBI-domeinen

Primaire set per domein met evidence-grades:

| Domein | Indicatoren | |D| | Grades | Mean grade |
|---|---|---|---|---|
| D1 Omgeving & klimaat | 4 | 4 | A, A, B, A | 2.75 |
| D2 Mobiliteit & ruimte | 2 | 2 | A, B | 2.50 |
| D3 Economische conditie | 5 | 5 | A, B, A, A, B | 2.60 |
| D4 Werk & belasting | 2 | 2 | B, B | 2.00 |
| D5 Media & collectieve gebeurtenissen | 3 | 3 | B, B, A | 2.33 |
| D6 Kalender & ritme | 4 | 4 | B, B, A, B | 2.25 |

Gemiddelde |D| = 20/6 ≈ 3.33; √(mean|D|) = 1.825

Balance-correctie balance(D) = √(|D|) / √(mean|D|):

| Domein | √(\|D\|) | balance(D) |
|---|---|---|
| D1 | 2.000 | 1.096 |
| D2 | 1.414 | 0.775 |
| D3 | 2.236 | 1.225 |
| D4 | 1.414 | 0.775 |
| D5 | 1.732 | 0.949 |
| D6 | 2.000 | 1.096 |

Gewicht ongeschaald = mean_grade × balance:

| Domein | mean_grade × balance | norm gewicht |
|---|---|---|
| D1 | 2.75 × 1.096 = 3.014 | 0.211 |
| D2 | 2.50 × 0.775 = 1.938 | 0.135 |
| D3 | 2.60 × 1.225 = 3.185 | 0.223 |
| D4 | 2.00 × 0.775 = 1.550 | 0.108 |
| D5 | 2.33 × 0.949 = 2.211 | 0.155 |
| D6 | 2.25 × 1.096 = 2.466 | 0.172 |
| **Totaal** | **14.364** | **1.000** |

### 3.4 Waarom parallel rapporteren

Equal en Evidence-Graded kunnen significant verschillen. Door beide te rapporteren toont de SBI haar gevoeligheid voor weegkeuze. Dit ondersteunt falsifieerbaarheidscriterium F2 (mono-causaliteit) uit het anker-paper.

---

## 4. Schema 3 — Weegafhankelijkheid-diagnostiek

### 4.1 Doel

Schema 1 en 2 maken impliciete keuzes over wat "belangrijk" is. Schema 3 *kwantificeert hoe sterk* het composiet afhangt van die keuzes — zonder pass/fail-drempel. Het is een **rapportage-instrument**, geen toets.

### 4.2 Methode

Drie tegen-intuïtieve gewichtsvariaties worden parallel berekend:

- *Inverse-rank:* w_indicator(i) = 1 / rank_by_grade(i)
- *Single-domain-dropouts:* zes varianten waarbij telkens één domein wordt weggelaten
- *Random-weight-bootstrap:* 1000 trekkingen met willekeurige gewichten uit een Dirichlet-verdeling

### 4.3 Output

Niet als signaal gepubliceerd, maar als **gevoeligheidsstatistiek** in de output:

```
weight_sensitivity:
  correlation_inverse_vs_equal_12w: 0.84
  composite_range_with_dropouts: [1.21, 1.65]   # min..max C(t) over 6 dropouts
  bootstrap_95_ci_around_equal: [1.32, 1.54]
```

### 4.4 Hoe deze rapportage te lezen

- *Hoge correlatie* tussen Schema 1 en inverse-rank betekent: weegkeuze maakt weinig uit — wat impliceert dat indicatoren een sterke gemeenschappelijke factor delen (mogelijk redundant).
- *Lage correlatie* betekent: weegkeuze maakt veel uit — het composiet is fragiel onder weeg-aanname.
- Beide zijn informatie. Geen van beide is "pass" of "fail". De gebruiker (en kritische reviewer) interpreteert naar context.

### 4.5 Verschil met v0.1

In v0.1 werd Schema 3 voorgesteld als pass/fail-toets met drempel 0.85. Dit was logisch kreupel — beide uitkomsten signaleerden een probleem. In v0.2 is de drempel weg en is Schema 3 puur diagnostisch.

---

## 5. Domein-balance-correctie

### 5.1 Probleem

Met v0.2-consolidatie hebben domeinen 2-5 indicatoren. Zonder correctie zou een 5-indicatoren-domein (D3) 2.5× meer signaal hebben dan een 2-indicatoren-domein (D2 of D4), louter door indicator-aantal.

### 5.2 Correctie

Voor evidence-graded schema (Schema 2):

balance(D) = √(|D|) / √(mean(|D|))

Wortel-correctie omdat lineaire correctie te zwaar is voor dunne domeinen (kunstmatig opwaardering) en geen correctie te zwaar voor dikke (oververtegenwoordiging).

### 5.3 Effect

In v0.2:
- D2 en D4 (elk 2 indicatoren) krijgen balance 0.775 — niet ondervertegenwoordigd, niet opgepompt
- D3 (5 indicatoren) krijgt balance 1.225 — relatief gedempt
- D1 en D6 (4 indicatoren) krijgen balance 1.096 — milde verhoging
- D5 (3 indicatoren) krijgt balance 0.949 — neutraal

Vergeleken met v0.1 (waar D5 met 1 indicator een balance van 0.58 kreeg, leidend tot systematische deflatie van het composiet door een dood domein), is de balansering in v0.2 substantieel gezonder.

### 5.4 Alternatieve aanpak overwogen en verworpen

We overwogen: domeinen wegen op basis van *theoretisch belang* eerder dan databeschikbaarheid. Verworpen omdat dit een subjectieve waardenoordeel-laag introduceert die we expliciet uit de methodologie willen houden.

---

## 6. Pre-registratie van gewichten

Alle wegings-keuzes worden vastgelegd in `00_Pre-Registratie.md`. Hier samengevat:

1. **Schema 1** (equal weights) — primair publicatie-schema
2. **Schema 2** (evidence-graded met balance-correctie) — parallel publicatie-schema
3. **Schema 3** (weegafhankelijkheid-diagnostiek) — rapportage-instrument, niet als signaal gepubliceerd

Alle drie worden bij *elke* wekelijkse berekening uitgevoerd. Output omvat:
- C_equal(t)
- C_evidence(t)
- weight_sensitivity-statistieken

Pre-registratie vindt plaats op OSF vóór eerste publieke meting. Gewichten kunnen alleen worden gewijzigd via het in 08_Onderhoud-Protocol.md gedocumenteerde proces.

---

## 7. Wanneer mogen gewichten herzien worden?

Drie legitieme gronden:

**A1. Nieuwe meta-analyse of systematic review** die evidence-grade van een indicator structureel verandert (A→B of B→A).

**A2. Indicator-toevoeging of -verwijdering** uit laag 3 (nieuwe data wordt beschikbaar; oude bron verdwijnt).

**A3. Falsifieerbaarheidscriteria-falen** uit anker-paper §7. Bij F2 (mono-causaliteit) is herziening vereist; bij F1, F4, F5 mogelijk vereist.

Elke herziening:
- Wordt minimaal 30 dagen vooraf publiek aangekondigd
- Wordt gedocumenteerd in versioned methodology paper
- Triggert herberekening van alle historische data onder beide schema's, gepubliceerd parallel

---

## 8. Bekende spanningen in de wegingslaag

### 8.1 Equal weights versus inhoudelijke validiteit

Equal weights is de meest defensieve keuze, maar de minst inhoudelijk geïnformeerde. Wie inhoudelijke prioritering wil, raadpleegt Schema 2.

### 8.2 Evidence-grade ≠ stress-relevantie

Evidence-grade weerspiegelt *hoeveel onderzoek* een associatie ondersteunt, niet *hoe sterk* de associatie is. Geaccepteerde beperking.

### 8.3 D4-zwakte

Onder Schema 2 krijgt D4 (werk, beide grade B) het laagste gewicht (0.108). Dit reflecteert eerlijk de relatief zwakkere evidence voor onze gekozen D4-indicatoren — kalendarische deadlines en schoolvakantie, beide grade B. Het is *niet* een uitspraak dat werkstress onbelangrijk is, maar dat *onze publieke proxies* matiger onderbouwd zijn dan onze D1-omgevingsproxies.

### 8.4 D5-consolidatie verbetert de structuur

Met media en collectieve gebeurtenissen samen in D5 is het composiet niet meer kwetsbaar voor de "zero-deflation" die in v0.1 optrad (toen D5 met één event-indicator 95% van de tijd 0 bijdroeg ondanks ~10% gewicht). In v0.2 draagt D5 in normale weken voortdurend bij via nieuwsnegativiteit en Google Trends.

---

## 9. Volgende stap (laag 7: aggregatie en drempel)

1. Composiet-formule met aggregatie-regel
2. Percentiel-rangschikking tegen historische verdeling
3. Drie-tier-signaal (groen/oranje/rood)
4. Decay-regels voor signaal-overgang
5. Output-API-specificatie

---

## Annex A — Definitieve wegingstabel Schema 2 (v0.2, gepre-registreerd)

| Domein | |D| | mean grade | balance | gew_raw | gew_norm |
|---|---|---|---|---|---|
| D1 Omgeving & klimaat | 4 | 2.75 | 1.096 | 3.014 | **0.211** |
| D2 Mobiliteit & ruimte | 2 | 2.50 | 0.775 | 1.938 | **0.135** |
| D3 Economische conditie | 5 | 2.60 | 1.225 | 3.185 | **0.223** |
| D4 Werk & belasting | 2 | 2.00 | 0.775 | 1.550 | **0.108** |
| D5 Media & collectieve gebeurtenissen | 3 | 2.33 | 0.949 | 2.211 | **0.155** |
| D6 Kalender & ritme | 4 | 2.25 | 1.096 | 2.466 | **0.172** |
| **Totaal** | **20** | | | **14.364** | **1.000** |

Onder Schema 1 (equal): elk domein **0.167**.
