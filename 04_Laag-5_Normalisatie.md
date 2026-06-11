# Stressor-Blootstellings-Index (SBI)
## Laag 5: Normalisatie en seizoenscorrectie

**Status:** v0.2 — werkdocument
**Document:** laag 5 van de methodologie
**Bouwt op:** laag 1-4
**Auteur:** BRAINWOLVES
**Datum:** mei 2026

---

## 0. Samenvatting

Dit document beschrijft hoe ruwe indicator-waarden uit laag 4 worden omgezet naar vergelijkbare, dimensieloze Z-scores die het composiet kunnen vormen. Drie kernelementen: (1) dubbele baseline-aanpak — elke indicator wordt vergeleken met zowel een 24-maands voortschrijdend mediaangemiddelde als een vaste referentieperiode 2010-2019, (2) STL-decompositie voor indicatoren waar seizoenseffect een confounder is, en (3) winsorization tegen extreme outliers.

---

## 1. Doelstellingen

Normalisatie lost drie problemen op: schaal-heterogeniteit, baseline-drift-blindheid, en seizoenseffect-confounding.

---

## 2. Dubbele baseline

### 2.1 Korte baseline (voortschrijdend)

- B_short(i, t) = mediaan van indicator i over de 24 maanden voorafgaand aan t
- σ_short(i, t) = MAD over diezelfde 24 maanden, geschaald naar SD-equivalent (×1.4826)
- Z_short(i, t) = (X(i, t) - B_short(i, t)) / σ_short(i, t)

Doel: detecteert recente afwijkingen ten opzichte van de directe historische context.

**Waarom mediaan + MAD i.p.v. gemiddelde + SD:** robust statistics — een hittegolf of energiecrisis in de baseline-periode trekt het gemiddelde scheef. Mediaan en MAD blijven stabiel.

### 2.2 Vaste baseline

- B_fixed(i) = mediaan over 1 januari 2010 — 31 december 2019
- σ_fixed(i) = MAD over diezelfde periode
- Z_fixed(i, t) = (X(i, t) - B_fixed(i)) / σ_fixed(i)

Doel: detecteert structurele verschuiving ten opzichte van pre-pandemisch, pre-energiecrisis decennium.

Alternatieve referentieperiodes (bv. 2015-2019) worden in laag 8 als sensitivity meegerekend.

### 2.3 Welke baseline waar gebruikt wordt

| Output | Baseline | Doel |
|---|---|---|
| Wekelijks signaal (productie) | Korte (24m) | Acute detectie |
| Structurele-drift-rapportage | Vaste (2010-2019) | Langetermijn-context |
| Persrapportage | Beide naast elkaar | Rijker verhaal |

### 2.4 Bootstrapping

Voor de eerste 24 maanden na opstart: vaste baseline als surrogaat, met expliciete vlag in output.

### 2.5 Belangrijke interpretatie-discipline

MAD-gebaseerde Z-scores zijn *niet* equivalent aan klassieke Z-scores. Een Z_short van 2.0 in onze methodologie staat ongeveer overeen met een klassieke Z van 1.5 voor symmetrische verdelingen. In communicatie spreken we daarom uitsluitend over *percentielen* (uit laag 7), niet over "σ-overschrijdingen", om verwarring met klassieke statistische standaarden te vermijden.

---

## 3. Seizoensdecompositie

### 3.1 STL als techniek

STL (Cleveland et al, 1990) ontbindt een tijdreeks in: X(t) = T(t) + S(t) + R(t), waarbij T = trend, S = seizoen, R = residu. Bij indicatoren waar seizoen een confounder is, gebruiken we het residu R voor Z-scoring.

### 3.2 Beslisregel per indicator (v0.2-update)

| Indicator | STL? | Reden |
|---|---|---|
| I-D1-001 Daglichturen | NEE | Seizoenspatroon ís het signaal |
| I-D1-002 Hitte | DEELS | Triggers behouden seizoenspatroon; continue T_max krijgt STL |
| I-D1-003 Kou | DEELS | Idem |
| I-D1-004 Luchtkwaliteit | JA | Seizoen is confounder (winter-NO₂, zomer-O₃) |
| I-D2-001 Filezwaarte | JA | Vakantieperiode-effect is confounder |
| I-D2-004 Brandstofprijs | NEE | Geen sterk seizoenspatroon |
| I-D3-001 CPI | JA | Seizoensgecorrigeerde reeks via STATBEL |
| I-D3-002 Energie | JA | Sterk seizoenseffect |
| I-D3-003 Ontslagen | JA | Eindejaarsperiode-cluster is confounder |
| I-D3-005 Werkloosheid | JA | Officieel seizoensgecorrigeerde reeks |
| I-D3-006 Hypotheekrente | NEE | Geen seizoenspatroon |
| I-D4-001 Deadlinekalender | NEE | Deterministisch |
| I-D4-002 Schoolvakantie | NEE | Deterministisch |
| I-D5-001 Nieuwsnegativiteit | JA | "Komkommertijd"-effect zomer |
| I-D5-002 Google Trends | JA | Seizoenspatroon in zoekgedrag |
| I-D5-003 Collectieve gebeurtenissen | NEE | Event-driven |
| I-D6-001..003, 005 | NEE | Kalender-deterministisch |

### 3.3 STL-parameters

- Seizoens-periode: 365 dagen voor dagelijkse reeksen; 52 voor wekelijkse; 12 voor maandelijkse
- Robust mode: aan
- Trend-window: 1.5 × seizoensperiode

### 3.4 Stabiliteitsvoorwaarde

STL betrouwbaar bij ≥ 3 seizoenscycli. Voor indicatoren met < 3 jaar betrouwbare historiek: geen STL toegepast, expliciet gelogd.

### 3.5 Bescherming tegen seizoens-dubbeltelling

In v0.1 zat seizoenseffect dubbel: één keer expliciet (via I-D7-004 seizoensfase) en één keer impliciet (via daglichturen, hitte, etc.). In v0.2 is I-D6-004 (was I-D7-004) verplaatst naar secundaire set, en wordt seizoensimpact gemeten uitsluitend via:
- *Expliciet:* I-D6-002 weekdag-cyclus + I-D6-003 klok-verzetten
- *Impliciet:* I-D1-001 daglicht (waar seizoen het signaal is, geen STL)
- *Gecorrigeerd:* alle andere indicatoren waar seizoen confounder is (STL toegepast)

Geen overlap meer.

> **Amendement A6 (2026-06-11, methodologie 0.3.0):** de D6-kalenderindicatoren
> (I-D6-001/002/003/005) worden nog wel berekend maar tellen niet meer mee in het
> composiet; ze verschijnen als context_signals. De normalisatie-afspraken in dit
> document blijven gelden voor de gescoorde set. Zie 00_Pre-Registratie §4.1.3.

---

## 4. Outlier-bescherming

### 4.1 Winsorization

Voor alle continue indicatoren na Z-scoring:

Z_winsorized(i, t) = clip(Z(i, t), -3, +3)

Behoudt richting en relatieve grootte van extremen, voorkomt single-indicator-dominantie.

**Eerlijke disclaimer:** ±3 is een conventionele drempel zonder specifieke empirische basis. In laag 8 (multiverse-analyse) wordt het effect van varieerde drempels (±2.5, ±3.5) systematisch getoetst.

### 4.2 Voor event-indicatoren

I-D5-003 en I-D6-003 zijn al ontworpen met begrensde schaal en decay. Geen aanvullende winsorization.

### 4.3 Audit-trail

Elke winsorization gelogd. Beschermt tegen informatieverlies; sensitivity-analyse mogelijk.

---

## 5. Inverse-codering

Sommige indicatoren hebben inverse relatie met stressor-blootstelling (hogere ruwe waarde = lagere blootstelling).

| Indicator | Ruwe relatie | Codering |
|---|---|---|
| I-D1-001 Daglichturen | meer licht = minder blootstelling | Z_inv = -Z |
| I-D6-001 Dagen tot vakantie | meer dagen = meer blootstelling | Z behouden |

Na inverse-codering geldt: hogere Z = hogere stressor-blootstelling. Vereiste voor optelbaarheid in laag 6.

---

## 6. Output van laag 5

Per indicator per tijdstap vier waarden:

1. X(i, t) — ruwe waarde uit laag 4
2. Z_short(i, t) — Z-score tegen 24m baseline, na inverse-codering en winsorization
3. Z_fixed(i, t) — Z-score tegen 2010-2019 baseline, idem
4. R(i, t) — STL-residu (waar toepasselijk)

Z_short → primair composiet. Z_fixed → structurele-drift. R → indicatoren waar seizoen confounder.

---

## 7. Voorbeeld-uitwerking

Hypothetisch voor week 24 van 2026:

| Indicator | X | B_short | σ_short | Z_short |
|---|---|---|---|---|
| I-D1-002 Hitte (T_max) | 34.2°C | 22.1°C | 5.4°C | +2.24 |
| I-D2-001 Filezwaarte | 8400 km·min | 6200 | 1100 | +2.00 |
| I-D3-002 Energie | 95 €/MWh | 78 | 12 | +1.42 |
| I-D5-001 Nieuwsneg (na STL) | residu +3.1 | 0 | 1.8 | +1.72 |
| I-D6-001 Dagen tot vakantie | 41 | 28 | 19 | +0.68 |

Deze gaan naar laag 6 voor weging.

---

## 8. Bekende beperkingen

### 8.1 Mediaan-MAD vs gemiddelde-SD
Robust statistics geven andere uitkomst dan klassieke. We zijn hier expliciet over.

### 8.2 Baseline-drift
24-maands rolling baseline absorbeert geleidelijke verslechtering. Daarom de parallel vaste baseline 2010-2019.

### 8.3 STL bij korte historiek
Eerste paar jaar kan STL het seizoenseffect over/onderschatten.

### 8.4 Winsorization vermindert detectie van extremen
Bewust ontwerpcompromis. Ruwe Z-waarden separaat beschikbaar voor extremen-rapportage.

---

## 9. Volgende stap (laag 6: weging)

Reeds gespecificeerd in `05_Laag-6_Weging.md`: drie wegingsschema's parallel (equal / evidence-graded / weegafhankelijkheid-diagnostiek), met balance-correctie voor 6-domein-structuur.

---

## Bronnen

Cleveland, R. B., Cleveland, W. S., McRae, J. E., & Terpenning, I. (1990). STL: A seasonal-trend decomposition procedure based on Loess. *Journal of Official Statistics*, 6(1), 3-73.

Leys, C., Ley, C., Klein, O., Bernard, P., & Licata, L. (2013). Detecting outliers: Do not use standard deviation around the mean, use absolute deviation around the median. *Journal of Experimental Social Psychology*, 49(4), 764-766.
