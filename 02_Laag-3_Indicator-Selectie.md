# Stressor-Blootstellings-Index (SBI)
## Laag 3: Indicator-selectie per domein

**Status:** v0.2 — werkdocument
**Document:** laag 3 van de methodologie
**Bouwt op:** 01_Anker-Paper.md (laag 1 + 2)
**Auteur:** BRAINWOLVES
**Datum:** mei 2026

---

## 0. Samenvatting

Dit document selecteert indicatoren voor elk van de zes SBI-domeinen die in het anker-paper zijn vastgelegd. Per domein worden kandidaat-indicatoren beoordeeld langs vijf inclusiecriteria en een vierpunts-evidence-grading. Het document levert vier zaken op: (1) een inclusielijst van indicatoren die het primaire composiet vormen, (2) een secundaire lijst voor sensitivity-analyse, (3) een expliciete exclusion log van overwogen-maar-afgewezen indicatoren, en (4) per indicator een acknowledgement van contrasterend bewijs voor zover bekend.

Indicator-selectie volgt voor laag 4 (operationalisering), niet andersom.

---

## 1. Doel en relatie tot het anker-paper

Het anker-paper legde vast *wat* de SBI meet (publieke blootstelling aan stressoren-condities geassocieerd met stressrespons op populatieniveau) en in *welke domeinen*. Dit document legt vast *welke concrete indicatoren* in die domeinen voldoen aan de inclusiecriteria.

Selectie volgt een strikt protocol: een indicator komt in aanmerking dan en slechts dan als ze aan alle vijf criteria voldoet (zie §3). De evidence-strength bepaalt vervolgens of de indicator in de *primaire set* (composiet) of de *secundaire set* (sensitivity) terechtkomt.

Indicatoren die overwogen maar niet geselecteerd worden, gaan naar de exclusion log met expliciete reden. Dit beschermt tegen stille selectie-bias.

---

## 2. Evidence-grading-schema

Aangepast van GRADE (Grading of Recommendations Assessment, Development and Evaluation) en Cochrane-conventies, vereenvoudigd voor populatieniveau-stressoren.

| Grade | Criterium | Lot |
|---|---|---|
| **A — High** | ≥1 meta-analyse OF ≥2 systematic reviews die associatie met stressrespons op populatieniveau ondersteunen | Primaire set |
| **B — Moderate** | 1 systematic review OF ≥3 consistente cohortstudies | Primaire set |
| **C — Low** | Meerdere consistente individuele studies, geen SR | Secundaire set (sensitivity) |
| **D — Very Low** | Enkele studie of alleen mechanistische evidentie | Uitgesloten |

**Regel:** alleen grade A en B vormen het primaire composiet. Grade C wordt parallel gerapporteerd in sensitivity-analyse. Grade D komt niet in de index.

**Beperking van de grading:** evidence-grade weerspiegelt *hoeveel onderzoek* een associatie ondersteunt, niet *hoe sterk* de associatie is. Een goed-onderzochte zwakke associatie krijgt hoger gewicht dan een matig-onderzochte sterke associatie. Dit is een bekende beperking van evidence-grading-systemen; geaccepteerd omdat alternatieven (effect-size-weging) datawerk vereisen dat buiten scope ligt.

---

## 3. Inclusiecriteria

Een indicator komt in aanmerking dan en slechts dan als ze aan álle vijf voldoet:

1. **Theoretische verankering** in minstens één ondersteunend kader (allostatic load, SDoH, CoR)
2. **Empirische evidence** op SR/MA-niveau (grade A of B)
3. **Publieke beschikbaarheid** — geen proprietary data, geen veldwerk
4. **Tijdsresolutie ≤ wekelijks**
5. **Gedocumenteerde confounder-set**

---

## 4. Domein D1 — Omgeving & klimaat

### D1.1 Daglichturen / lichtblootstelling

- **Ondersteunend kader:** Allostatic Load (chronobiologische component); SDoH neighborhood/environment
- **Pathway:** verminderde lichtblootstelling → circadiane verstoring → verlaagde serotonine-/melatonine-functie → verhoogde affectieve dysregulatie en SAD-symptomen op populatieniveau
- **Evidence:** Rosenthal et al (1984) primaire SAD-beschrijving; Lam & Levitt (1999) reviewmonograaf; Golden et al (2005, *Am J Psychiatry*) meta-analyse lichttherapie en stemmingsstoornissen
- **Grade:** A
- **Contrasterend bewijs:** Mersch et al (1999) toont dat SAD-prevalentie minder consistent is dan vaak gerapporteerd; effectgroottes van lichteffecten op populatieniveau variëren sterk per breedtegraad
- **Operationalisering:** uren tussen zonsopgang en zonsondergang per locatie, eventueel gecorrigeerd voor bewolking via solar irradiance (KW/m²)
- **Databron:** KMI/RMI (openbare meteodata)
- **Resolutie:** dagelijks
- **Historische beschikbaarheid:** >50 jaar
- **Confounders:** seizoenseffect (gedeeltelijk gewenst signaal); activity levels; sociale isolatie in winter
- **Beslissing:** **INGESLOTEN (primair)**

### D1.2 Temperatuur-extremen (hitte en kou)

- **Ondersteunend kader:** Allostatic Load (thermoregulatie); SDoH neighborhood/environment
- **Pathway:** thermoregulatieve belasting → slaapverstoring (hitte > 25°C 's nachts) → cumulatieve allostatic load → stressrespons
- **Evidence:** Hajat et al (2010, *Epidemiology*); Thompson et al (2018, *Sci Total Environ*); Liu et al (2021)
- **Grade:** A (hitte), B (kou)
- **Contrasterend bewijs:** sommige analyses (Burke et al 2018) suggereren dat acclimatisering hitte-effecten op populatieniveau ten dele neutraliseert; effectgroottes variëren tussen klimaatzones
- **Operationalisering:** dagen met Tmax > 30°C; tropische nachten (Tmin > 20°C); koude-episodes (Tmin < -5°C); afwijking van seizoensgemiddelde
- **Databron:** KMI/RMI
- **Resolutie:** dagelijks
- **Confounders:** vochtigheid; sociale gatherings; air-conditioning-toegang naar SES
- **Beslissing:** **INGESLOTEN (primair, hitte); INGESLOTEN (primair, kou)**

### D1.3 Luchtkwaliteit (PM2.5, ozon, NO₂)

- **Ondersteunend kader:** Allostatic Load (inflammatoire pathway); SDoH neighborhood/environment
- **Pathway:** fijnstof- en ozonblootstelling → systeem-inflammatie + cerebrale ontsteking → verhoogd depressie- en angstrisico
- **Evidence:** Braithwaite et al (2019, *Environ Health Perspect*) meta-analyse; Newbury et al (2019, *JAMA Psychiatry*); WHO (2021)
- **Grade:** A
- **Contrasterend bewijs:** effect-omkering bij lage blootstellingen (lineair-niet-drempel-debat in luchtkwaliteit-epidemiologie); methodologische kritieken op cohorts met overlap stedelijke confounders
- **Operationalisering:** dagelijkse gemiddelden PM2.5, max ozon, NO₂ — relatief tot WHO-grenswaarden
- **Databron:** IRCEL-CELINE (publiek)
- **Resolutie:** uurlijks/dagelijks
- **Confounders:** correlatie met weer (windstilte), verkeer, seizoen
- **Beslissing:** **INGESLOTEN (primair)**

### D1.4 Luchtdruk-schommelingen

- **Ondersteunend kader:** Allostatic Load (chronobiologische/fysiologische component)
- **Evidence:** Hoffmann et al (2011); verspreide studies, geen SR op populatieniveau
- **Grade:** C
- **Contrasterend bewijs:** Hoffmann et al (2015) replicatiepoging vond geen consistent verband; debat over weeromslag-stress is folklore-zwaar
- **Beslissing:** **SECUNDAIRE SET**

### D1.5 Pollenconcentratie

- **Ondersteunend kader:** Allostatic Load (allergische inflammatie)
- **Evidence:** D'Amato et al (2007) overzicht; verband met depressie minder hard
- **Grade:** C
- **Contrasterend bewijs:** verband pollen-stress is grotendeels indirect via allergie-symptomen, niet rechtstreeks
- **Beslissing:** **SECUNDAIRE SET**

### D1.6 Lawaaiblootstelling

- **Ondersteunend kader:** Allostatic Load; SDoH
- **Evidence:** WHO Environmental Noise Guidelines (2018) — A-grade voor cardiovasculair/slaap; B voor mentale gezondheid (Hahad et al 2019)
- **Grade:** B
- **Beslissing:** **UITGESLOTEN** — voldoet niet aan criterium 4 (geen wekelijkse publieke data op populatieniveau beschikbaar in België)

---

## 5. Domein D2 — Mobiliteit & ruimte

### D2.1 Filezwaarte (verkeerscongestie)

- **Ondersteunend kader:** Conservation of Resources (tijd, controle); SDoH
- **Pathway:** lange/onvoorspelbare reistijd → autonomieverlies + tijdsverlies → cortisol-respons (Novaco et al 1990)
- **Evidence:** Novaco et al (1990) originele studie; Stutzer & Frey (2008); Künn-Nelen (2016); Chatterjee et al (2020) systematic review
- **Grade:** A
- **Contrasterend bewijs:** Lorenz (2018) en sommige studies in stedelijke contexten tonen dat reistijd na controle voor SES en woon-werk-locatiekeuze veel zwakker correleert met welzijn; "commute paradox" suggereert zelfselectie-bias in cross-sectionele studies
- **Operationalisering:** totale file-kilometers spitsuur; gemiddelde vertraging in minuten
- **Databron:** Vlaams Verkeerscentrum (publiek dagelijks)
- **Resolutie:** uurlijks/dagelijks
- **Confounders:** weer; vakantieperiodes; ongevallen; wegenwerken
- **Beslissing:** **INGESLOTEN (primair)**

### D2.2 Openbaar-vervoer-verstoringen

- **Ondersteunend kader:** CoR (controle, voorspelbaarheid)
- **Evidence:** Cheng (2010) train delay and commuter stress
- **Grade:** B
- **Contrasterend bewijs:** beperkte literatuur, voornamelijk klein-schalige studies
- **Beslissing:** **HOLD** — voldoet aan criterium 4 alleen indien dagelijkse aggregaten via NMBS/Infrabel beschikbaar. Te bevestigen in laag 4.

### D2.3 Aangekondigde stakingen openbaar vervoer

- **Ondersteunend kader:** CoR (anticipatorische resource-loss)
- **Grade:** C
- **Beslissing:** **SECUNDAIRE SET**

### D2.4 Brandstofprijzen

- **Ondersteunend kader:** CoR (financiële resource); SDoH economic
- **Pathway:** verhoogde brandstofprijs → koopkrachtdruk + mobiliteitsbeperking → cumulatieve stress
- **Evidence:** financial stress literature (Brüggen et al 2017)
- **Grade:** B
- **Contrasterend bewijs:** prijs-effecten op stress zijn sterk gemoduleerd door inkomen; geen direct SR voor brandstofprijs specifiek
- **Databron:** FOD Economie maximumprijzen
- **Resolutie:** dagelijks
- **Beslissing:** **INGESLOTEN (primair)**

### D2.5 Aangekondigde grote wegenwerken

- **Grade:** D
- **Beslissing:** **UITGESLOTEN**

---

## 6. Domein D3 — Economische conditie

### D3.1 Consumptieprijsindex (inflatie)

- **Ondersteunend kader:** CoR (financiële resource); SDoH economic stability
- **Evidence:** Brüggen et al (2017); Kahneman & Tversky (1979); meerdere SR financial-strain
- **Grade:** A
- **Contrasterend bewijs:** Easterlin paradox-debat suggereert dat absolute inkomensniveaus minder voorspellend zijn voor welzijn dan relatieve veranderingen
- **Operationalisering:** jaar-op-jaar CPI-stijging
- **Databron:** STATBEL
- **Resolutie:** maandelijks (forward-filled in wekelijks composiet)
- **Beslissing:** **INGESLOTEN (primair, chronische component)**

### D3.2 Energieprijzen (gas, elektriciteit)

- **Ondersteunend kader:** CoR; SDoH economic
- **Evidence:** Thomson et al (2017); Liddell & Morris (2010) review energy poverty
- **Grade:** B
- **Contrasterend bewijs:** prijs-effecten gefilterd door energiearmoede-status; niet alle huishoudens even gevoelig
- **Databron:** VREG/CREG; Eurostat
- **Resolutie:** wekelijks
- **Beslissing:** **INGESLOTEN (primair)**

### D3.3 Aangekondigde collectieve ontslagen

- **Ondersteunend kader:** CoR (job-resource threat); SDoH economic
- **Evidence:** Brand (2015) meta-analyse; Burgard et al (2009); De Witte et al (2016) SR
- **Grade:** A
- **Contrasterend bewijs:** spillover van aangekondigde ontslagen naar niet-betrokkenen is matig sterk maar niet consistent over alle studies
- **Operationalisering:** log(1 + werknemers in collectieve-ontslagprocedures per week)
- **Databron:** FOD WASO
- **Resolutie:** wekelijks
- **Beslissing:** **INGESLOTEN (primair)**

### D3.4 Beurs-volatiliteit (BEL20)

- **Grade:** C
- **Contrasterend bewijs:** populatie-stress-effect via media-transmissie minder hard onderbouwd dan beleggers-effect
- **Beslissing:** **SECUNDAIRE SET**

### D3.5 Werkloosheidscijfer

- **Ondersteunend kader:** SDoH economic; CoR
- **Grade:** A
- **Databron:** STATBEL / Steunpunt Werk
- **Resolutie:** maandelijks
- **Beslissing:** **INGESLOTEN (primair, chronische component)**

### D3.6 Hypotheekrente

- **Ondersteunend kader:** CoR; financial stress literature
- **Grade:** B
- **Databron:** NBB
- **Beslissing:** **INGESLOTEN (primair, chronische component)**

---

## 7. Domein D4 — Werk & belasting

*Notitie: D4 lijdt structureel onder gebrek aan hoogfrequente publieke werkstress-data.*

### D4.1 Kalendarische deadlinepieken

- **Ondersteunend kader:** JDR-model (Bakker & Demerouti 2007); CoR
- **Evidence:** Bakker & Demerouti (2007, 2017); Sonnentag (2018) recovery-literatuur
- **Grade:** B
- **Contrasterend bewijs:** literatuur over deadlines is overwegend laboratoriumonderzoek; populatie-effect minder direct gedocumenteerd
- **Operationalisering:** binaire vlaggen voor belastingdeadline-week, kwartaaleinde, jaareinde
- **Databron:** kalender-deterministisch
- **Beslissing:** **INGESLOTEN (primair)**

### D4.2 Schoolvakantie-zonder-opvang-druk

- **Ondersteunend kader:** CoR (tijd, sociale resource); JDR
- **Evidence:** Bianchi et al (2012); Crouter et al (2001)
- **Grade:** B
- **Contrasterend bewijs:** effectgrootte sterk gemodereerd door huishouden-type en gender
- **Beslissing:** **INGESLOTEN (primair)**

### D4.3 Ziekteverzuim-aggregaat

- **Status:** uitkomst, geen stressor — gebruikt als convergente validatie (laag 8)
- **Beslissing:** **UITGESLOTEN als input; INGESLOTEN als validatievariabele**

### D4.4 Aangekondigde reorganisaties / herstructureringen

- **Beslissing:** **UITGESLOTEN als zelfstandig — onderdeel van D3.3**

---

## 8. Domein D5 — Mediaomgeving & collectieve gebeurtenissen

*Dit domein consolideert wat in v0.1 verspreid was over D5 (sociaal) en D6 (media). Aangezien een 1-indicator-domein geen domein is maar een placeholder, en collectieve gebeurtenissen voornamelijk via mediablootstelling werken, zijn beide samengevoegd.*

### D5.1 Nieuwsnegativiteits-index

- **Ondersteunend kader:** Mean World Syndrome (Gerbner 1976); affective contagion
- **Pathway:** consumptie van negatief nieuws → verhoogde threat-appraisal op aggregaatniveau → stressrespons
- **Evidence:** Soroka et al (2019, *PNAS*); Boukes et al (2015); Kleemans & Hendriks Vettehen (2009)
- **Grade:** B
- **Contrasterend bewijs:** kritiek op tone-analyse-validiteit; Boydstun et al (2014) tonen dat news-tone-metriek inconsistent reageert tussen taalgebieden
- **Operationalisering:** GDELT-tone-score voor NL-talige Belgische bronnen, 7-daags voortschrijdend gemiddelde
- **Databron:** GDELT (publiek via BigQuery)
- **Resolutie:** dagelijks
- **Confounders:** mediacyclus; agenda-setting; nieuwsvolume
- **Beslissing:** **INGESLOTEN (primair)**

### D5.2 Google-zoekvolume voor stress-gerelateerde termen

- **Ondersteunend kader:** revealed preference; behavioral indicator
- **Evidence:** Stephens-Davidowitz (2017); Ayers et al (2013, *Am J Prev Med*) voor mental health
- **Grade:** B
- **Contrasterend bewijs:** **Lazer et al (2014, *Science*) — Google Flu Trends-debacle**. Google Trends-validiteit is sterk afhankelijk van update-algoritme-stabiliteit, demografische sampling-bias, en nieuws-event-amplificatie. Niet alleen acknowledged maar gemitigeerd: zoekvolume-spikes binnen 3 dagen van majeure nieuwsgebeurtenissen worden uit-gefilterd (zie §13.2).
- **Operationalisering:** weighted index NL-termen ("stress", "burn-out", "slaapproblemen", "moe", "hoofdpijn", "angst", "uitgeput", "slapeloosheid"), regio België
- **Databron:** Google Trends API
- **Resolutie:** dagelijks
- **Beslissing:** **INGESLOTEN (primair, met mitigatie)**

### D5.3 Negatieve collectieve gebeurtenissen (was D5.1 in v0.1)

- **Ondersteunend kader:** SDoH social context; collectieve trauma-literatuur
- **Pathway:** mediablootstelling aan collectief trauma → vicariërende stress
- **Evidence:** Holman et al (2014, *PNAS*); Silver et al (2013); Garfin et al (2015)
- **Grade:** A
- **Contrasterend bewijs:** Pfefferbaum et al (2014) review wijst op publicatie-bias in collectieve-trauma-literatuur; effecten van mediablootstelling gemodereerd door pre-event-kwetsbaarheid
- **Operationalisering:** event-tagging met magnitude-coderingsregels (vooraf vastgelegd), 7-daags decay-window
- **Codering:** twee onafhankelijke codeurs, inter-rater reliability vooraf testen op 50 historische cases (vereiste κ ≥ 0.75)
- **Bron:** nieuwsmonitoring (VRT, De Standaard, HLN), aangevuld met Politiezone-rapporten
- **Beslissing:** **INGESLOTEN (primair, met magnitude-drempel)**
- **Notitie:** codering vereist menselijke beoordeling — vraagt zorgvuldige documentatie van rules. Het magnitude-niveau-systeem (1/3/5) is functioneel verwant aan Holmes-Rahe, met als kritisch verschil dat onze regels worden toegepast op *geobserveerde gebeurtenissen* binnen een gedocumenteerd codeerprotocol, niet op *zelf-gerapporteerde life events* zoals bij Holmes-Rahe.

### D5.4 Sociale-media-sentiment Nederlandstalig

- **Beslissing:** **UITGESLOTEN** — X-API niet vrij sinds 2023, alternatieven onvoldoende representatief (criterium 3)

### D5.5 Algemene staking / nationale onrust

- **Grade:** C
- **Beslissing:** **SECUNDAIRE SET**

### D5.6 Eenzaamheidsproxies

- **Beslissing:** **UITGESLOTEN** — vereist veldwerk

---

## 9. Domein D6 — Kalender & ritme

### D6.1 Dagen tot volgende vakantie

- **Ondersteunend kader:** CoR (anticipatie hersteltijd); recovery-literatuur (Sonnentag 2018)
- **Evidence:** Sonnentag (2018); Fritz & Sonnentag (2005)
- **Grade:** B (recovery-literatuur), C (specifiek voor "afstand tot vakantie")
- **Contrasterend bewijs:** "vakantie-effect" op stress is sterker voor afgeronde vakantie dan voor anticipatie volgens De Bloom et al (2009)
- **Beslissing:** **INGESLOTEN (primair)**

### D6.2 Weekdag-cyclus

- **Ondersteunend kader:** chronobiologie; weekly cycle research
- **Evidence:** Stone et al (2012); Areni & Burger (2008)
- **Grade:** B
- **Contrasterend bewijs:** Helliwell & Wang (2014) tonen dat weekdag-mood-effect kleiner is dan vaak geclaimd in oudere literatuur
- **Beslissing:** **INGESLOTEN (primair)**

### D6.3 Klok-verzetten (zomer-/wintertijd)

- **Ondersteunend kader:** Allostatic Load (circadiane verstoring)
- **Evidence:** Manfredini et al (2018, *J Clin Med*); Roenneberg et al (2019)
- **Grade:** A
- **Contrasterend bewijs:** Diaz Garrido et al (2022) recente review wijst op heterogene effecten per leeftijdsgroep
- **Beslissing:** **INGESLOTEN (primair)**

### D6.4 Seizoensfase (continu signaal)

- **Beslissing:** **VERPLAATST NAAR SECUNDAIRE SET** — wiskundig overlappend met I-D1-001 (daglichturen) en met seizoenscomponent van andere indicatoren. Behoud in primaire set zou seizoens-dubbeltelling veroorzaken. Beschikbaar voor sensitivity-analyse waarin expliciet getest wordt of dubbele seizoensbijdrage het signaal verandert.

### D6.5 Examenperiode-vlaggen

- **Ondersteunend kader:** JDR; academic stress literature
- **Evidence:** Pascoe et al (2020) academic stress review
- **Grade:** B
- **Beslissing:** **INGESLOTEN (primair)**

---

## 10. Geconsolideerde inclusielijst (na v0.2-herziening; amendementen verwerkt op 2026-06-11)

### Geregistreerde set (gescoord + context + diagnostisch)

| Code | Indicator | Domein | Grade | Resolutie |
|---|---|---|---|---|
| I-D1-001 | Daglichturen | D1 | A | dagelijks |
| I-D1-002 | Hitte (Tmax >30°C, tropische nachten) | D1 | A | dagelijks |
| I-D1-003 | Kou (Tmin <-5°C) | D1 | B | dagelijks |
| I-D1-004 | Luchtkwaliteit (PM2.5, O₃, NO₂) | D1 | A | dagelijks |
| I-D1-009 | Wateroverlast ¹ | D1 | B | dagelijks |
| I-D1-010 | Pollen ¹ ² | D1 | B | dagelijks |
| I-D2-001 | Filezwaarte | D2 | A | dagelijks |
| I-D2-004 | Brandstofprijzen | D2 | B | dagelijks |
| I-D2-009 | Treinvertragingen (vertragingsgraad Infrabel) ¹ ⁸ | D2 | B | dagelijks |
| I-D3-001 | Consumptieprijsindex | D3 | A | maandelijks |
| I-D3-002 | Energieprijzen | D3 | B | wekelijks |
| I-D3-003 | Aangekondigde collectieve ontslagen ³ | D3 | D | wekelijks |
| I-D3-005 | Werkloosheidscijfer | D3 | A | maandelijks |
| I-D3-006 | Hypotheekrente | D3 | B | maandelijks |
| I-D3-007 | Consumentenvertrouwen ⁴ | D3 | B | maandelijks |
| I-D3-009 | Stroomnet-druk ¹ | D3 | B | dagelijks |
| I-D4-001 | Kalendarische deadlinepieken | D4 | B | dagelijks |
| I-D4-002 | Schoolvakantie-zonder-opvang | D4 | B | dagelijks |
| I-D5-001 | Nieuwsnegativiteits-index ⁵ | D5 | C | dagelijks |
| I-D5-002 | Wikipedia-aandacht stress-thema's ⁶ | D5 | C | dagelijks |
| I-D5-003 | Negatieve collectieve gebeurtenissen | D5 | A | event |
| I-D6-001 | Dagen tot volgende vakantie ⁷ | D6 | B | dagelijks |
| I-D6-002 | Weekdag-cyclus ⁷ | D6 | B | dagelijks |
| I-D6-003 | Klok-verzetten ⁷ | D6 | A | event |
| I-D6-005 | Examenperiode ⁷ | D6 | B | dagelijks |

¹ Amendement 2026-05-21 (§13 grond A2 van 00_Pre-Registratie.md): toegevoegd na de oorspronkelijke pre-registratie. De 30-dagen-aankondigingstermijn is niet vooraf gevolgd; retroactief geregulariseerd op 2026-06-11, zie 00_Pre-Registratie.md §4.1.
² Vervangt de secundaire I-D1-005S Pollenconcentratie (grade C, zie secundaire set hieronder). Bron: Copernicus CAMS (Europees model; geen Belgische pollenmeting machine-leesbaar).
³ Grade-override 2026-06-02 (A naar D): de feitelijke feed is een werkloosheidsgraad-proxy, geen echte ontslag-aankondigingsdata. Diagnostisch zichtbaar, telt niet mee in het cijfer.
⁴ Amendement 2026-06-03 (Peter GO, commit 0cefc23, §13 grond A2): inverse-coded (hoog vertrouwen = lage stress), bron Eurostat ei_bsco_m (BS-CSMCI), backfill 197 maandpunten 2010-2026.
⁵ Grade-override 2026-06-02 (B naar C): bewuste keuze Peter, blijft gescoord met gereduceerd gewicht in het evidence-schema. Zie 00_Pre-Registratie.md §4.1.2.
⁶ Oorspronkelijk gepre-registreerd als "Google Trends stress-termen". Bronwissel 2026-05-21 naar Wikipedia-pageviews (Wikimedia REST API) omdat Google Trends geautomatiseerde afname blokkeert; grade-override 2026-06-02 (B naar C). Zie 00_Pre-Registratie.md §4.1.2.
⁷ Context (A6, 2026-06-11, telt niet mee in het cijfer): gepubliceerd als kalendercontext (context_signals) naast het composiet.
⁸ Herdefinitie 2026-06-12 (Peter GO): van iRail-verstoringsteller naar Infrabel-vertragingsgraad (aandeel treinen met 6 min of meer aankomstvertraging, officiële meetset, meetdag tot 20 uur). De teller loopt door als secundair I-D2-009S. Zie 00_Pre-Registratie §4.1.4.

**Totaal: 25 geregistreerde indicatoren in 6 domeinen — 20 gescoord, 4 kalendercontext, 1 diagnostisch.**

### Secundaire set (sensitivity-analyse)

| Code | Indicator | Domein | Grade |
|---|---|---|---|
| I-D1-004S | Luchtdruk-schommelingen | D1 | C |
| I-D1-005S | Pollenconcentratie (per 2026-05-21 vervangen door primaire I-D1-010 Pollen) | D1 | C |
| I-D2-003S | Aangekondigde OV-stakingen | D2 | C |
| I-D3-004S | Beurs-volatiliteit | D3 | C |
| I-D5-005S | Algemene staking / sociale onrust | D5 | C |
| I-D6-004S | Seizoensfase | D6 | (overlapping) |

**Totaal secundaire set: 6 indicatoren**

### Validatie-set (niet in composiet, voor convergente validatie)

| Code | Variabele | Domein | Functie |
|---|---|---|---|
| V-001 | Ziekteverzuim-aggregaat | D4 | uitkomst-validatie |
| V-002 | Retail-bestedingen | algemeen | gedragsproxy-validatie |
| V-003 | Mentale-gezondheidszorg-utilisatie | algemeen | uitkomst-validatie |
| V-004 | Alcohol/gokken-omzet | algemeen | gedragsproxy-validatie |

*Notitie: deze publieke datasets (RIZIV-aggregaten, STATBEL retail-index, Belastingdienst-omzetdata) worden gebruikt als publieke data — identiek aan andere publieke bronnen. Gebruik is geen institutionele samenwerking; data is openbaar toegankelijk in geanonimiseerde aggregaatvorm.*

---

## 11. Exclusion log

| Indicator | Reden uitsluiting |
|---|---|
| Lawaaiblootstelling | Geen wekelijkse publieke data op populatieniveau (criterium 4) |
| Aangekondigde grote wegenwerken | Grade D — onvoldoende evidence (criterium 2) |
| Aangekondigde reorganisaties | Overlap met I-D3-003 — uitgesloten om dubbeltelling te vermijden |
| Ziekteverzuim als input | Uitkomst-variabele, geen stressor — gebruikt voor validatie |
| Eenzaamheidsproxies | Vereist veldwerk — geen publieke hoogfrequente bron (criterium 3) |
| Sociale-media-sentiment NL | X-API niet vrij sinds 2023; alternatieven onvoldoende representatief (criterium 3) |
| Schoolresultaten / rapporten | Geen wekelijkse publieke data (criterium 4) |
| Familiespanningen rond feestdagen | Niet meetbaar uit publieke data; behoort tot narratieve laag |
| Verkeersongevallen | Confounder voor I-D2-001 — uit te werken in laag 4 |

---

## 12. Counter-evidence-discipline

Per indicator in dit document is een explicit "contrasterend bewijs"-veld opgenomen. Doel: voorkomen van one-sided lit-review. Beperking: wij hebben *niet systematisch* gezocht naar tegenbewijs voor elke indicator; we hebben binnen redelijke literatuur-search gemeld wat we tegenkwamen. Dit is een eerlijke beperking, niet een volwaardige Cochrane-bias-assessment.

In jaarlijkse onderhoudscyclus (zie 08_Onderhoud-Protocol.md) wordt counter-evidence systematischer doorgenomen.

---

## 13. Bekende lacunes en methodologische spanningen

### 13.1 Onevenwicht tussen domeinen
Met de v0.2-consolidatie hebben we 6 domeinen, met 2-5 indicatoren elk. Beter dan v0.1 (D5 had 1), maar nog steeds heterogeen. In laag 6 (weging) blijft balance-correctie nodig.

### 13.2 Mediacyclus-decorrelatie (nieuw protocol)
I-D3-003 (ontslagen), I-D5-001 (nieuwsnegativiteit), I-D5-002 (Google Trends) en I-D5-003 (collectieve gebeurtenissen) zijn allen deels door media-cyclus gedreven. Risico op zelfversterkende feedback in het composiet.

**Decorrelatie-protocol (uit te voeren in laag 4):**
- Voor I-D5-002 (Google Trends): zoekvolume-spikes binnen 3 dagen van majeure nieuwsgebeurtenissen (uit I-D5-003) worden geïsoleerd via differentiële tijdreeks. Het "newsless residue" wordt in composiet gebruikt; de "newsful spike" beschikbaar als sensitivity.
- Voor I-D5-001 (nieuwsnegativiteit): cross-correlatie met I-D5-003 wordt continu gemonitord. Indien correlatie > 0.7 voor sustained periode: domein-gewicht voor D5 wordt automatisch gehalveerd in betreffende periode (auto-decorrelatie).
- Voor sensitivity-rapportage: composiet zonder D5 wordt parallel berekend en gepubliceerd als "non-media baseline".

### 13.3 Tijdsresolutie-heterogeniteit
Indicatoren variëren van event-based tot dagelijks tot maandelijks. Voor wekelijks composiet moet laag 4 een tijdsharmonisatie-strategie definiëren (forward-fill, interpolatie, of differentiële weging).

### 13.4 Collineariteit binnen domeinen
- I-D1-001 (daglichturen) en I-D6-004S (seizoensfase, nu secundair): grotendeels opgelost door I-D6-004S te verplaatsen naar secundaire set
- I-D1-002 (hitte) × I-D1-004 (luchtkwaliteit, ozon-component): expected matig, sensitivity-analyse vereist
- I-D3-001 (CPI) × I-D3-006 (hypotheekrente): verschillende lag-structuren, te verifiëren in laag 4

### 13.5 Cultuur-specifieke indicatoren ontbreken
"Belgische gelatenheid", bouwverlof-fenomeen, file-cultuur — culturele specificiteit valt voor het grootste deel buiten meetbare indicatoren. Eerlijke beperking.

### 13.6 Codering I-D5-003 functioneel verwant aan Holmes-Rahe
Het magnitude-niveau-systeem voor collectieve gebeurtenissen lijkt op Holmes-Rahe maar verschilt cruciaal: wij coderen *publiek observeerbare* gebeurtenissen volgens vooraf vastgelegde regels (niet zelf-gerapporteerde life events met arbitraire gewichten). Dit blijft echter een interpretatieve indicator die zorgvuldige inter-rater-protocol vereist.

---

## 14. Volgende stappen (laag 4: operationalisering)

1. **Per indicator:** exacte formule, eenheid, missing-data-strategie, ruis-karakteristiek
2. **Tijdsharmonisatie:** hoe maandelijkse indicatoren te integreren in wekelijks signaal
3. **Collineariteit-resolutie:** VIF-analyse en eventuele indicator-consolidatie
4. **Mediacyclus-decorrelatie-protocol:** technische implementatie
5. **Datapipeline-specificatie:** target architecture vs minimum viable pipeline
6. **Robuustheidstest:** wat gebeurt bij missing data van één of meerdere bronnen

---

## Bronnen

Ayers, J. W., Althouse, B. M., & Dredze, M. (2013). Could behavioral medicine lead the web data revolution? *American Journal of Preventive Medicine*, 47(5), 678-680.

Bakker, A. B., & Demerouti, E. (2007). The Job Demands-Resources model: State of the art. *Journal of Managerial Psychology*, 22(3), 309-328.

Bakker, A. B., & Demerouti, E. (2017). Job demands-resources theory: Taking stock and looking forward. *Journal of Occupational Health Psychology*, 22(3), 273-285.

Bianchi, S. M., Sayer, L. C., Milkie, M. A., & Robinson, J. P. (2012). Housework: Who did, does or will do it, and how much does it matter? *Social Forces*, 91(1), 55-63.

Boukes, M., Boomgaarden, H. G., Moorman, M., & de Vreese, C. H. (2015). News with an attitude. *Mass Communication and Society*, 18(3), 354-378.

Boydstun, A. E., Highton, B., & Linn, S. (2014). Assessing the relationship between economic conditions and news coverage. *Political Communication*, 31(4), 607-626.

Braithwaite, I., Zhang, S., Kirkbride, J. B., et al. (2019). Air pollution exposure and associations with depression, anxiety, bipolar, psychosis and suicide risk: A systematic review and meta-analysis. *Environmental Health Perspectives*, 127(12), 126002.

Brand, J. E. (2015). The far-reaching impact of job loss and unemployment. *Annual Review of Sociology*, 41, 359-375.

Brüggen, E. C., Hogreve, J., Holmlund, M., Kabadayi, S., & Löfgren, M. (2017). Financial well-being. *Journal of Business Research*, 79, 228-237.

Burgard, S. A., Brand, J. E., & House, J. S. (2009). Perceived job insecurity and worker health in the United States. *Social Science & Medicine*, 69(5), 777-785.

Burke, M., Hsiang, S. M., & Miguel, E. (2018). Global non-linear effect of temperature on economic production. *Nature*, 527, 235-239.

Chatterjee, K., Chng, S., Clark, B., et al. (2020). Commuting and wellbeing: A critical overview. *Transport Reviews*, 40(1), 5-34.

Cheng, Y. H. (2010). Exploring passenger anxiety associated with train travel. *Transportation*, 37(6), 875-896.

Crouter, A. C., Bumpus, M. F., Head, M. R., & McHale, S. M. (2001). Implications of overwork and overload for the quality of men's family relationships. *Journal of Marriage and Family*, 63(2), 404-416.

D'Amato, G., Cecchi, L., Bonini, S., et al. (2007). Allergenic pollen and pollen allergy in Europe. *Allergy*, 62(9), 976-990.

De Bloom, J., Geurts, S. A. E., Sonnentag, S., et al. (2009). Effects of vacation from work on health and well-being. *Work & Stress*, 23(4), 359-378.

De Witte, H., Pienaar, J., & De Cuyper, N. (2016). Review of 30 years of longitudinal studies on the association between job insecurity and health and well-being. *Australian Psychologist*, 51(1), 18-31.

Diaz Garrido, F., Knapen, S., et al. (2022). Daylight saving time and health: a review of recent literature. *Sleep Medicine Reviews*, 64, 101633.

Fritz, C., & Sonnentag, S. (2005). Recovery, health, and job performance. *Journal of Occupational Health Psychology*, 10(3), 187-199.

Garfin, D. R., Holman, E. A., & Silver, R. C. (2015). Cumulative exposure to prior collective trauma. *Psychological Science*, 26(6), 675-683.

Hahad, O., Prochaska, J. H., Daiber, A., & Münzel, T. (2019). Environmental noise-induced effects on stress hormones. *Oxidative Medicine and Cellular Longevity*, 2019, 4623109.

Hajat, S., O'Connor, M., & Kosatsky, T. (2010). Health effects of hot weather. *The Lancet*, 375(9717), 856-863.

Helliwell, J. F., & Wang, S. (2014). Weekends and subjective well-being. *Social Indicators Research*, 116(2), 389-407.

Hoffmann, J., Schirra, T., Lo, H., et al. (2011). The influence of weather on migraine. *Annals of Clinical and Translational Neurology*, 2(1), 22-28.

Hoffmann, J., et al. (2015). Replication study on weather and headache. *Cephalalgia*, 35(8), 658-666.

Holman, E. A., Garfin, D. R., & Silver, R. C. (2014). Media's role in broadcasting acute stress following the Boston Marathon bombings. *PNAS*, 111(1), 93-98.

Kahneman, D., & Tversky, A. (1979). Prospect theory. *Econometrica*, 47(2), 263-292.

Kleemans, M., & Hendriks Vettehen, P. G. J. (2009). Sensationalism in television news. *Communications*, 34(2), 109-131.

Künn-Nelen, A. (2016). Does commuting affect health? *Health Economics*, 25(8), 984-1004.

Lam, R. W., & Levitt, A. J. (Eds.). (1999). *Canadian consensus guidelines for the treatment of seasonal affective disorder*.

Lazer, D., Kennedy, R., King, G., & Vespignani, A. (2014). The parable of Google Flu. *Science*, 343(6176), 1203-1205.

Liddell, C., & Morris, C. (2010). Fuel poverty and human health. *Energy Policy*, 38(6), 2987-2997.

Liu, J., Varghese, B. M., Hansen, A., et al. (2021). Is there an association between hot weather and poor mental health outcomes? *Environment International*, 153, 106533.

Lorenz, O. (2018). Does commuting matter to subjective well-being? *Journal of Transport Geography*, 66, 180-199.

Manfredini, R., Fabbian, F., Cappadona, R., et al. (2018). Daylight saving time and acute myocardial infarction. *Journal of Clinical Medicine*, 8(3), 404.

Mersch, P. P., Middendorp, H. M., Bouhuys, A. L., et al. (1999). Seasonal affective disorder and latitude. *Journal of Affective Disorders*, 53(1), 35-48.

Newbury, J. B., Arseneault, L., Beevers, S., et al. (2019). Association of air pollution exposure with psychotic experiences during adolescence. *JAMA Psychiatry*, 76(6), 614-623.

Novaco, R. W., Stokols, D., & Milanesi, L. (1990). Objective and subjective dimensions of travel impedance. *American Journal of Community Psychology*, 18(2), 231-257.

Pascoe, M. C., Hetrick, S. E., & Parker, A. G. (2020). The impact of stress on students. *International Journal of Adolescence and Youth*, 25(1), 104-112.

Pfefferbaum, B., Newman, E., Nelson, S. D., et al. (2014). Disaster media coverage and psychological outcomes. *Current Psychiatry Reports*, 16(9), 464.

Roenneberg, T., Wirz-Justice, A., Skene, D. J., et al. (2019). Why should we abolish daylight saving time? *Journal of Biological Rhythms*, 34(3), 227-230.

Rosenthal, N. E., Sack, D. A., Gillin, J. C., et al. (1984). Seasonal affective disorder. *Archives of General Psychiatry*, 41(1), 72-80.

Silver, R. C., Holman, E. A., Andersen, J. P., et al. (2013). Mental- and physical-health effects of acute exposure to media images. *Psychological Science*, 24(9), 1623-1634.

Sonnentag, S. (2018). The recovery paradox. *Research in Organizational Behavior*, 38, 169-185.

Soroka, S., Fournier, P., & Nir, L. (2019). Cross-national evidence of a negativity bias. *PNAS*, 116(38), 18888-18892.

Stephens-Davidowitz, S. (2017). *Everybody lies*. Dey Street Books.

Stone, A. A., Schneider, S., & Harter, J. K. (2012). Day-of-week mood patterns. *The Journal of Positive Psychology*, 7(4), 306-314.

Stutzer, A., & Frey, B. S. (2008). Stress that doesn't pay: The commuting paradox. *Scandinavian Journal of Economics*, 110(2), 339-366.

Thompson, R., Hornigold, R., Page, L., & Waite, T. (2018). Associations between high ambient temperatures and heat waves with mental health outcomes. *Science of the Total Environment*, 626, 1213-1224.

Thomson, H., Snell, C., & Bouzarovski, S. (2017). Health, well-being and energy poverty in Europe. *International Journal of Environmental Research and Public Health*, 14(6), 584.

WHO (2018). *Environmental Noise Guidelines for the European Region*.

WHO (2021). *WHO global air quality guidelines*.
