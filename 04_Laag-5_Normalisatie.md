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

### 2.6 Geïmplementeerde schaal-keten en schaarste-regels (v0.3.x, geverifieerd 2026-06-12)

> Dit hoofdstuk documenteert de werkelijke implementatie in `app/engine/src/methodology/zscore.ts` en `app/engine/src/runtime.ts`, die strikter is dan de vereenvoudigde formule in §2.1. Bij verschil tussen §2.1 en deze sectie geldt deze sectie.

**Baseline-venster (amendement §4.1.7, v0.3.3, 2026-06-13):** de MAD-z-baseline is niet langer de volledige beschikbare historie maar een rollend recency-venster: **24 maanden** voor dagbronnen, **60 maanden** voor maand-/jaarritmebronnen (I-D2-001, I-D2-004, I-D3-001, I-D3-003, I-D3-005, I-D3-006, I-D3-007). Lookahead-veilig (alleen punten ≤ rekendatum); STL en de schaal-keten hieronder werken binnen het venster; de eCDF-gate (§2.7) beoordeelt de volle historie en houdt zijn eigen 5-jaars-drift-cap. Zie 00_Pre-Registratie §4.1.7 voor de volledige motivering en meetvoorbeelden.

**Robuuste spreidingsschaal met fallback-keten** (`robustScale()`): de σ in de Z-formule is niet kaal "MAD ×1.4826" maar een keten met expliciete uitval:

1. **MAD ×1.4826** (consistentiefactor naar SD-equivalent voor normale verdelingen; equivalent aan delen door 0.6745). Gebruikt tenzij de geschaalde MAD < `MIN_SCALE` (1e-6).
2. **IQR/1.349** als de MAD wegvalt. De MAD wordt exact 0 zodra >50% van de baselinepunten identiek is — typisch bij telt-indicatoren en gecensureerde reeksen (bv. koude-overschrijding die meestal 0 is). De interkwartielafstand overleeft tot >75% identieke punten.
3. **Klassieke SD** (n−1) als ook de IQR wegvalt.
4. **NaN** als er werkelijk geen variatie is: expliciet "geen schaal", nooit een stille 0.

**Geen-schaal-semantiek** (`zscore()` + aanroeper in `runtime.ts`): bij σ = NaN of 0 geeft `zscore()` NaN terug. Er kan dus per constructie geen ±∞ ontstaan en dataschaarste verschijnt nooit als z = 0 ("normaal"). De aanroeper splitst het NaN-geval in twee:

- **(a) Vlakke baseline, dagwaarde op of onder de mediaan** (en niet inverse-gecodeerd): dit is geen datagebrek maar een gemeten "geen uitschieter" — score z = 0, state "normaal". Voorbeeld: koude-overschrijding in Brussel is vrijwel altijd 0; een dagwaarde 0 tegen een vlakke 0-baseline is een echte meting van afwezigheid.
- **(b) Vlakke baseline, dagwaarde erboven**: er is geen schaal om te wegen hoe uitzonderlijk de overschrijding is → indicator telt als "ontbreekt" (uitgesloten uit het composiet), geen stille geruststelling en geen verzonnen uitslag.

**Minimale historie** (`MIN_HISTORY_FOR_Z = 30` in `runtime.ts`): met minder dan 30 baselinepunten wordt geen Z berekend; de indicator telt als "ontbreekt". De v0.4-kernlaag gebruikt bewust een lagere grens (`MIN_POINTS_FOR_Z = 8`) omdat die laag maandbronnen verwerkt; dat is een gedocumenteerd verschil, geen inconsistentie.

**Volgorde van bewerkingen per indicator:** STL-residu (waar van toepassing, met gedetrende baseline) → baseline (mediaan + schaal-keten) → Z → geen-schaal-splitsing (a)/(b) → inverse-codering (§5) → winsorization (§4). Inverse-codering vóór winsorization, zodat de clip symmetrisch om de gecorrigeerde richting ligt.

Unit-tests dekken de MAD=0-tak en de geen-schaal-paden (`app/engine/test/engine.test.ts`).

### 2.7 eCDF-normalisatie met 3-jaarsgate en 5-jaars-drift-cap (B2, amendement §4.1.6, methodologie 0.3.2)

> Pre-geregistreerde regel, vastgelegd 2026-06-12. Stand bij registratie: alleen
> I-D5-003 kwalificeert (dagdata sinds mei 2023); effect op het composiet
> verwaarloosbaar (z −3,0 → −2,91; dagpercentiel 4 → 5).
> Implementatie: `app/engine/src/methodology/ecdf.ts`.

Percentielen en z-scores op 18-24 maanden historie dragen een wezenlijke schattingsonzekerheid (±10-12 pp; bevestigd door de gemeten spread van 18,8 pp in de B4-gevoeligheidsanalyse). Daarom schakelt elke indicator, zodra zijn seizoensbewuste referentie (±45 dagen rond dezelfde dag-van-het-jaar, **begrensd op de recentste 5 jaar**) **ten minste 3 jaargangen overspant én 90 punten telt**, over op eCDF-normalisatie naar het voorbeeld van de ECB CISS (Holló, Kremer & Lo Duca 2012):

1. p = empirische kans (midrank) van de dagwaarde in de seizoensreferentie;
2. klemming op [1/(2n), 1−1/(2n)] — ±∞ is per constructie onmogelijk;
3. z = Φ⁻¹(p) (probit, Acklam-benadering), zodat eCDF- en MAD-z-indicatoren tijdens de overgang in één composiet aggregeerbaar blijven;
4. inverse-codering en winsorization (±3) blijven onverkort gelden;
5. géén STL voor eCDF-indicatoren: het seizoensvenster ís de seizoenscorrectie.

**Waarom de 5-jaarscap:** zonder begrenzing zou een decennialange trendreeks "vandaag" permanent als extreem scoren — de brandstofprijs-index (maandreeks sinds 1996) kwalificeerde in de eerste smoketest en zou tegen 1996-niveaus wegen; dat meet inflatie, geen seizoens-ongewoonheid. Het drift-argument van §8.2 geldt voor de eCDF onverkort; de cap volgt het plan-anker "3-5 jaar per seizoensvenster".

Tot een indicator de gate haalt geldt de MAD-z-keten uit §2.6 en wordt de normalisatie expliciet **"voorlopig"** gelabeld (breakdown-veld `normalization`, percentiel-veld `normalization_provisional`). Maandbronnen halen de 90-puntseis binnen de cap structureel niet: die blijven bewust op MAD-z (een eCDF op een handvol punten is een trap-functie, geen verdeling). De B3-bootstrap spiegelt voor eCDF-indicatoren exact dezelfde keten.

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

**Werkelijke MVP-staat (geverifieerd 2026-06-13, na de adversariële review; beschrijving, geen herdefinitie):** de geïmplementeerde STL (`app/engine/src/methodology/stl.ts`, aangeroepen vanuit `runtime.ts`) is bewust conservatief en raakt vandaag minder indicatoren dan tabel 3.2 suggereert:

- **Gate:** de seizoenscomponent S(t) wordt alleen geschat als er ≥ 10 historiepunten binnen ±7 dagen rond dezelfde dag-van-het-jaar uit **strikt voorgaande** jaren beschikbaar zijn (anders eerlijke terugval op de ruwe waarde, `applied: false`). Gevolg: **maandbronnen halen die eis structureel niet** (een maandreeks levert ~1 punt per voorgaand jaar in een ±7-daagsvenster). I-D3-001 (CPI), I-D3-003 (ontslagen) en I-D3-005 (werkloosheid) draaien daardoor **de facto op de ruwe waarde**, ook al staat hun `applyStl`-vlag aan. STL is vandaag alleen echt actief voor de dagelijkse weer-/luchtreeksen I-D1-002 (Hitte), I-D1-003 (Kou), I-D1-004 (Luchtkwaliteit) en I-D3-002 (energieprijs, dagdata).
- **Effectieve baseline binnen het 24m-venster (§4.1.7):** punten zonder een voorgaand jaar bínnen het venster kunnen niet gedetrend worden en vallen uit de residuverdeling; de effectieve STL-baseline is daardoor ~12-14 maanden, niet 24. De n ≥ 30-poort staat sinds 2026-06-13 op die residuenset (de verdeling waar de Z écht tegen weegt), niet op de ruwe historielengte.
- **Cycli vs kalenderjaren:** de gate telt unieke kalenderjaren; een 24-maands venster raakt doorgaans 3 kalenderjaren maar bevat 2 echte seizoenscycli. De volledige 3-cycli-betrouwbaarheid van deze §3.4 wordt voor de dagreeksen ~mei 2027 bereikt; tot dan is de seizoenscorrectie op indicatorniveau een tweede, lichtere correctie bovenop de seizoensmatch die het composietpercentiel (±45 d, 24 m, doc 06 §1.1) sowieso al draagt.

Dit is bewust **niet** opgelost door STL op 2 cycli te forceren (dat zou tegen deze stabiliteitsvoorwaarde ingaan) noch door STL uit te zetten (dat zou een werkende, geteste transformatie verwijderen vlak vóór go-live). De keuze is: de huidige conservatieve werking eerlijk documenteren en de schone herijking (STL op volle historie zodra ≥ 3 cycli, met amendement) plannen voor ~mei 2027. Zie 00_Pre-Registratie §4.1.7, slotnoten.

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

**Vastgelegde grens (geverifieerd 2026-06-12):** de grens is één constante, `WINSOR_BOUND = 3` in `app/engine/src/methodology/winsorize.ts`, gebruikt door zowel de v0.2- als de v0.4-laag. Motivatie voor ±3:

1. Bij MAD-gebaseerde Z's is ±3 het *conservatieve* afkappunt uit de robust-statistics-literatuur (Leys et al. 2013 noemen 2.5 "gematigd" en 3 "zeer conservatief"): er wordt zo min mogelijk echte informatie weggeknipt, terwijl één extreme indicator het composiet niet kan domineren.
2. Met 20 gescoorde indicatoren en domeingewichten van 1/5 is de maximale bijdrage van één geclipte indicator aan het composiet begrensd; een hogere grens zou single-indicator-dominantie weer mogelijk maken, een lagere grens zou echte crises afvlakken (§8.4).
3. De keuze blijft conventioneel, niet empirisch afgeleid; dat staat hieronder eerlijk vermeld en de gevoeligheid wordt in laag 8 getoetst.

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
