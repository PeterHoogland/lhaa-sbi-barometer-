# Stressor-Blootstellings-Index (SBI)
## Laag 7: Aggregatie en signaal-logica

**Status:** v0.2 — werkdocument
**Document:** laag 7 van de methodologie
**Bouwt op:** laag 1-6
**Auteur:** BRAINWOLVES
**Datum:** mei 2026

---

## 0. Samenvatting

Dit document specificeert hoe gewogen indicator-Z-scores uit laag 6 worden geaggregeerd tot één composiet, hoe die waarde wordt vertaald naar een percentiel-positie en hoe die positie omgezet wordt naar een drie-tier-signaal (groen/oranje/rood) met decay-regels. Het document legt ook de output-API-specificatie vast.

Belangrijk ontwerpprincipe: het composiet zelf is geen binaire ja/nee-uitspraak. Het signaal is een *positie* in een distributie. Of die positie als "venster open" of "venster gesloten" wordt geïnterpreteerd, hangt af van pre-geregistreerde drempels.

---

## 1. Composiet-formule

### 1.1 Per indicator

Z_weighted(i, t) = w_indicator(i ∈ D) × Z_short(i, t)

### 1.2 Per domein

D_score(D, t) = Σ_{i ∈ D} Z_weighted(i, t)

### 1.3 Composiet

C(t) = Σ_D [w_domain(D) × D_score(D, t)]

Onder Schema 1 (equal, 1/6 per domein): C_equal(t)
Onder Schema 2 (evidence-graded met balance-correctie): C_evidence(t)
Schema 3 (weegafhankelijkheid-diagnostiek): gerapporteerd als gevoeligheidsstatistiek, niet als signaal.

C_equal(t) is het primaire publieke signaal.

### 1.4 Eenheid

Composiet C(t) is dimensieloos.

---

## 2. Percentiel-positie

### 2.1 Waarom percentielen

Een MAD-Z-score van +1.8 op het composiet zegt weinig zonder context. Een percentiel-positie ("vandaag is in de top 12% van alle dagen van de laatste 24 maanden") is interpreteerbaar en historisch geankerd.

### 2.2 Definitie

P(t) = rang van C(t) binnen de verdeling van C-waarden over de afgelopen 24 maanden, uitgedrukt als percentiel (0-100).

### 2.3 Tijdsvenster

24 maanden voortschrijdend. Sluit aan op de korte baseline uit laag 5.

### 2.4 Bootstrapping

Eerste 24 maanden: historische backtest-data 2010-2024 als percentiel-referentie. Vanaf maand 24 schuift het venster mee.

### 2.5 Parallelle percentielen

Naast P_short(t) (24m venster) wordt P_fixed(t) berekend tegen de gehele backtest-historiek 2010-2019.

---

## 3. Drie-tier-signaal

### 3.1 Definitie

| Tier | Symbool | Voorwaarde |
|---|---|---|
| **Groen** | 🟢 | P(t) < 70 OF tier niet gehandhaafd lang genoeg |
| **Oranje** | 🟡 | 70 ≤ P(t) < 90, gehandhaafd ≥ 3 opeenvolgende dagen |
| **Rood** | 🔴 | P(t) ≥ 90, gehandhaafd ≥ 3 opeenvolgende dagen |

### 3.2 Sustained-duration-regel

Eén dag boven drempel ≠ tier-overgang. Drie opeenvolgende dagen binnen dezelfde band ⇒ tier-overgang.

### 3.3 Decay-regel

Bij daling onder drempel: tier wordt afgeschaald pas na 3 opeenvolgende dagen onder.

### 3.4 Asymmetrische logica

Het instrument is ontworpen om *trage* tier-overgangen op te leggen (zowel omhoog als omlaag). Het is geen real-time alarm; het is een rapport over collectieve conditie.

### 3.5 Rechtvaardiging van de 3-dagen-sustained-regel

De keuze van 3 dagen is niet arbitrair maar geankerd in twee literatuurlijnen:

**Chronobiologie:** de HPA-as-cortisol-respons heeft een circadiane cyclus van ongeveer 24 uur (Sapolsky 2004; Kirschbaum & Hellhammer 1989). Drie opeenvolgende dagen omvatten drie volledige cortisol-cycli — het minimum om een acute respons (één-daagse stressor, eindigend met herstel) te onderscheiden van een aanhoudende respons (geen herstel-gelegenheid).

**Stress-habituatie-literatuur:** McEwen (2007) toont dat allostatic load mechanismen actief worden na *meerdaagse* aanhoudende stressor-blootstelling, niet na acute eenmalige blootstelling. Drie dagen valt aan de ondergrens van wat als "aanhoudend" geldt in deze literatuur.

**Sensitivity-test:** in laag 8 (multiverse-analyse) wordt 1d, 3d, 5d en 7d sustained-duration parallel getest. Indien 3d niet robuust blijkt, wordt het criterium herzien.

### 3.6 Rechtvaardiging van P=70 en P=90 (eerlijk geformuleerd)

P=90 (top 10%) is een conventionele uitzonderlijkheidsdrempel in epidemiologische literatuur op uitkomst-meting (excess mortality, hospital admissions). Voor stressor-blootstelling-meting bestaat geen vergelijkbare conventie.

P=70 is gekozen als "waarschuwingsband" vóór rood; het exacte percentiel heeft geen empirische basis maar wordt in de multiverse-toets parallel gevarieerd (P=65, 70, 75) om robuustheid te tonen.

We zijn over deze keuze expliciet: het zijn redelijke conventies, niet wetenschappelijke noodzakelijkheden.

---

## 4. Output-specificatie

### 4.1 Daily output record

```
{
  "timestamp": "2026-05-24T23:00:00+02:00",
  "week_iso": "2026-W21",
  "composite": {
    "equal": 1.42,
    "evidence_graded": 1.58,
    "weight_sensitivity": {
      "correlation_inverse_vs_equal_12w": 0.84,
      "composite_range_with_dropouts": [1.21, 1.65],
      "bootstrap_95_ci_around_equal": [1.32, 1.54]
    }
  },
  "percentile": {
    "short_24m": 87,
    "fixed_2010_2019": 92
  },
  "tier": {
    "current": "amber",
    "days_in_tier": 5,
    "tier_history_30d": ["green", "green", "amber", "amber", ...]
  },
  "top_contributing_domains": [
    {"domain": "D1", "contribution": 0.34},
    {"domain": "D5", "contribution": 0.28},
    {"domain": "D2", "contribution": 0.22}
  ],
  "media_cluster_diagnostic": {
    "d5_cross_correlation_7d": 0.42,
    "composite_without_d5": 1.31,
    "media_contribution_percentile_points": 8
  },
  "data_quality": {
    "indicators_with_imputed_data": ["I-D3-002"],
    "indicators_missing": [],
    "pipeline_version": "0.2.0",
    "implementation_stage": "minimum_viable_pipeline"
  }
}
```

### 4.2 Drie outputs voor extern gebruik

**(a) De publieke barometer** — dagelijkse records via publieke website + RSS. Voor pers en publiek.

**(b) Signal-API** — minimal endpoint:

```
GET /signal/latest
{
  "tier": "amber",
  "timestamp": "2026-05-24T23:00:00+02:00",
  "valid_until": "2026-05-25T23:00:00+02:00",
  "brand_safety_flag": "normal"
}
```

**(c) Full dataset** — historische data, alle indicatoren, voor onderzoekers en kritische review.

### 4.3 Wat de output *niet* doet

- Geen beleidsadvies
- Geen interventie-aanbeveling
- Geen individuele aanbevelingen
- Geen demografische uitsplitsing
- Geen voorspelling van toekomstige tier

---

## 5. Transparantie van top-contributing-domains

### 5.1 Doel

Voorkomen van black-box-perceptie.

### 5.2 Berekening

contribution(D, t) = w_domain(D) × D_score(D, t) / C(t)

### 5.3 Indicator-niveau-detail

Bij verzoek: contribution per indicator. Niet in hoofdsignaal om overload te vermijden.

---

## 6. Signaal-onafhankelijkheid

Het signaal is een **passief rapport**. Het:
- Heeft geen kennis van wie abonneert
- Heeft geen kennis van of een campagne loopt
- Heeft geen feedback-loop met geconsumeerd gedrag
- Verandert niet onder commerciële druk

Ontwerpvereiste, geen optie.

---

## 7. Brand-safety-vlag

### 7.1 Probleem

Bij nationale tragedie kan het ongepast zijn dat downstream-systemen commercieel reageren op het signaal.

### 7.2 Mechanisme

Het signaal blijft de gemeten waarde rapporteren — wetenschappelijke integriteit wordt niet aangepast aan gevoeligheid. Wat *wel* wordt aangepast: een brand-safety-vlag.

```
"brand_safety": {
  "flag": "elevated",
  "reason": "national mourning declared",
  "expires_estimated": "2026-05-26T23:00:00+02:00"
}
```

### 7.3 Verantwoordelijkheid

Vlag is een service voor abonnees. Beslissing tot pauze ligt bij abonnee, niet bij meetsysteem.

---

## 8. Versies, audit en reproduceerbaarheid

### 8.1 Versionering

Semver per methodologie-versie. Elke output bevat pipeline_version + implementation_stage.

### 8.2 Audit-trail

Alle pipeline-stappen loggen naar publieke audit-log.

### 8.3 Reproducibility package

- Pipeline-code (open source)
- Configuratiebestanden
- Voorbeelddata
- Stappen-voor-stappen-reproductie-handleiding

---

## 9. Bekende beperkingen

### 9.1 Percentielen vereisen baseline
Eerste 24 maanden minder betrouwbaar — gebaseerd op backtest. Expliciet gemarkeerd.

### 9.2 Sustained-duration vertraagt detectie
Acute episode van 1-2 dagen wordt niet als tier-overgang gerapporteerd. Bewust ontwerp.

### 9.3 P=70 en P=90 zijn pre-registratie, geen wetenschap
Conventionele keuzes, niet wetenschappelijke noodzakelijkheden. Multiverse-getoetst in laag 8.

### 9.4 Discrete tier-grenzen
Een dag op P=89 is "amber", op P=91 is "red". Statistisch ongeveer dezelfde positie, instrumenteel anders gemarkeerd. Voor analytisch gebruik: continue percentielen beschikbaar.

---

## 10. Volgende stap (laag 8: validatie en robuustheid)

Reeds gespecificeerd in `07_Laag-8_Validatie-en-Robuustheid.md`: acht toetsen met tier-gates (must-pass / should-pass / continu).

---

## Bronnen

Kirschbaum, C., & Hellhammer, D. H. (1989). Salivary cortisol in psychoneuroendocrine research. *Neuropsychobiology*, 22(3), 150-169.

McEwen, B. S. (2007). Physiology and neurobiology of stress and adaptation: Central role of the brain. *Physiological Reviews*, 87(3), 873-904.

Sapolsky, R. M. (2004). *Why zebras don't get ulcers* (3rd ed.). Holt.
