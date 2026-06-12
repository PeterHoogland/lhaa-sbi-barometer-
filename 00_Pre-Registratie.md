# Stressor-Blootstellings-Index (SBI)
## Pre-registratie van methodologische keuzes

**Status:** v0.2 — pre-registratie-document
**Doel:** centraliseren van alle pre-geregistreerde methodologische keuzes uit lagen 1-8
**Bedoeld voor:** OSF (Open Science Framework) publicatie vóór eerste meting
**Auteur:** BRAINWOLVES
**Datum:** mei 2026

---

## 0. Wat dit document is

Eén centrale bron van waarheid voor alle keuzes die vóór de eerste meting publiek vastgelegd moeten worden. In v0.1 waren pre-registratie-vereisten verspreid over de laag-1, laag-6 en laag-7 documenten. Dat is fragiel: bij wijziging kunnen documenten uit synchronisatie raken. Dit document consolideert.

Wijzigingen aan deze keuzes worden uitsluitend toegestaan via het in `08_Onderhoud-Protocol.md` beschreven proces. Stille aanpassingen zijn verboden — niet door technische beveiliging, maar door publieke audit-trail.

---

## 1. Identificatie van het instrument

- **Naam:** Stressor-Blootstellings-Index
- **Afkorting:** SBI
- **Versie methodologie:** 0.2
- **Werkmarkt:** België
- **Tijdsresolutie:** wekelijks (met dagelijkse onderliggende data)
- **Eigenaar:** BRAINWOLVES (geen institutionele affiliatie)
- **Licentie:** open methodologie (CC BY 4.0 of equivalent); code: open source (MIT of Apache 2.0)

---

## 2. Construct-definitie (uit laag 1)

> De SBI meet de aggregaat-blootstelling van een populatie aan omgevings-, economische, sociale en mediaomstandigheden waarvan de literatuur consistent aantoont dat ze geassocieerd zijn met stressrespons op populatieniveau, ten opzichte van een gedocumenteerde historische baseline.

**Vier expliciete uitsluitingen** (zie laag 1 §3): geen klinisch instrument, geen individuele meting, geen peer-reviewed wetenschappelijk instrument, geen gedragsvoorspeller.

---

## 3. Theoretische ondersteunende kaders (uit laag 1)

- Allostatic Load Theory (McEwen 1998)
- Social Determinants of Health framework (Marmot/WHO 2008)
- Conservation of Resources (Hobfoll 1989)

**Bewust niet als anker gebruikt:** Lazarus & Folkman (1984) appraisal-model; Holmes-Rahe (1967) Social Readjustment Rating Scale. Reden: zie laag 1 §5.5.

---

## 4. Domein-taxonomie (uit laag 2/3)

**Zes domeinen** (stand na amendementen, zie §4.1):

1. D1 — Omgeving & klimaat (6 indicatoren)
2. D2 — Mobiliteit & ruimte (3 indicatoren)
3. D3 — Economische conditie (7 indicatoren, waarvan 1 diagnostisch)
4. D4 — Werk & belasting (2 indicatoren)
5. D5 — Media & collectieve gebeurtenissen (3 indicatoren)
6. D6 — Kalender & ritme (4 indicatoren, kalendercontext)

**Totaal: 25 geregistreerde indicatoren — 20 gescoord in het cijfer, 4 kalendercontext (D6, amendement A6), 1 diagnostisch (grade D)** + 6 secundaire (sensitivity) + 4 validatie-variabelen.

De registry in `app/engine/src/indicators/registry.ts` is de single source of truth voor deze set.

---

## 4.1 Amendementen op de indicatorset

**Eerlijkheidsverklaring vooraf.** De 30-dagen-aankondigingstermijn (§13) is voor de onderstaande wijzigingen niet vooraf gevolgd; dit is een retroactieve regularisatie, vastgelegd op 2026-06-11. De wijzigingen zelf zijn wel op het moment van invoering in commit-berichten en in de registry gedocumenteerd (geen stille aanpassingen aan data of berekeningen achteraf), maar de formele procedure uit §13 is pas nu, achteraf, in dit document geregistreerd. Dit wordt hier expliciet benoemd in plaats van weggemoffeld.

### 4.1.1 Toegevoegde indicatoren (§13 grond A2: indicator-toevoeging door datatoegang)

| Code | Naam | Datum GO | Grond | Motivatie | Bron | Codering |
|---|---|---|---|---|---|---|
| I-D1-009 | Wateroverlast | 2026-05-21 | A2 | Overstromingsdruk ontbrak in D1; machine-leesbare dagelijkse debietdata beschikbaar | VMM Waterinfo.be + SPW Wallonië (dag-debiet, KiWIS) | direct, grade B, dagelijks |
| I-D1-010 | Pollen | 2026-05-21 | A2 | Vervangt secundaire I-D1-005S Pollenconcentratie (grade C, laag 3 §10); dagelijkse modelbron beschikbaar. Geen Belgische pollenmeting machine-leesbaar; eerlijk gelabeld als Europees model | Copernicus CAMS | direct, grade B, dagelijks |
| I-D2-009 | Treinverstoringen | 2026-05-21 | A2 | OV-verstoringsdruk ontbrak in D2; open API beschikbaar | iRail API (NMBS/Infrabel) | direct, grade B, dagelijks |
| I-D3-007 | Consumentenvertrouwen | 2026-06-03 (Peter GO, commit 0cefc23) | A2 | Voorlopend enquête-sentiment; zit niet in de nieuws-laag, dus geen dubbeltelling met D5. Backfill: 197 maandpunten (2010-2026) | Eurostat ei_bsco_m (BS-CSMCI) | inverse-coded (hoog vertrouwen = lage stress), grade B, maandelijks |
| I-D3-009 | Stroomnet-druk | 2026-05-21 | A2 | Netbelasting als druk-signaal in D3; open databron beschikbaar | Elia Open Data | direct, grade B, dagelijks |

### 4.1.2 Grade-overrides en bronwissel (2026-06-02, evidence-review §3)

| Code | Naam | Wijziging | Motivatie |
|---|---|---|---|
| I-D3-003 | Aangekondigde collectieve ontslagen | grade A → D; uit het cijfer, blijft diagnostisch zichtbaar | De feitelijke feed is een werkloosheidsgraad-proxy, geen echte ontslag-aankondigingsdata; dat rechtvaardigt grade A niet |
| I-D5-001 | Nieuwsnegativiteits-index | grade B → C; blijft in het cijfer | Review §3.2 zette media-toon op D (mediatoon is geen stressmeting). Bewuste keuze Peter 2026-06-02: indicator blijft gescoord op C met gereduceerd gewicht in het evidence-schema. Dit wijkt af van de §5-regel dat grade C naar de secundaire set gaat; die afwijking is bewust en hier gedocumenteerd. Baseline: bevroren GDELT-historiek |
| I-D5-002 | Wikipedia-aandacht stress-thema's | bron- en naamwissel (2026-05-21) plus grade B → C (2026-06-02); blijft in het cijfer | Oorspronkelijk gepre-registreerd als "Google Trends stress-termen"; Google Trends bleek geblokkeerd voor geautomatiseerde afname. Vervangen door Wikipedia-pageviews (Wikimedia REST API). Zelfde §5-afwijking als I-D5-001, eveneens bewust en gedocumenteerd |

### 4.1.3 Amendement A6: kalenderdomein D6 naar contextlaag (2026-06-11, methodologie 0.2.0 → 0.3.0)

De vier D6-kalenderindicatoren (I-D6-001, I-D6-002, I-D6-003, I-D6-005) zijn deterministische kalenderfeiten, geen metingen. Sinds A6 tellen ze niet meer mee in composiet en condition_level; ze worden gepubliceerd als `context_signals` naast het cijfer. Gevolgen:

- Equal-domeingewicht van 1/6 naar 1/5 per gescoord domein (D1-D5).
- De Schema-2-tabel in §7.2 blijft bevroren als historiek; de actieve Schema-2-gewichten worden pro rata hernormaliseerd over D1-D5 (deling door 0.832, som van de D1-D5-gewichten). D6 weegt 0.
- De demografische TOTAL_REACH-noemer telt contextcodes niet meer mee.
- Historische dagscores zijn onder 0.3.0 herberekend; verwacht en waargenomen gevolg op 2026-06-11: composiet van 0.13 naar circa -0.11, waarmee de amber-banner doofde (de examens-bijdrage was de drijver). De bevroren v0.4-kern bevat geen D6 en is ongemoeid.

**Gemotiveerde scopekeuze:** I-D1-001 (daglichturen), I-D4-001 (deadlinepieken) en I-D4-002 (schoolvakantie) zijn eveneens deterministisch maar blijven voorlopig gescoord. Dit is een bewuste, gedocumenteerde beperking; heroverweging staat gepland bij de construct-herziening (BLOK B).

### 4.1.4 Amendement: herdefinitie I-D2-009 naar Infrabel-vertragingsgraad (2026-06-12, Peter GO)

De maat van I-D2-009 wijzigt van "aantal ongeplande verstoringen" (iRail-teller) naar "vertragingsgraad": het aandeel treinmetingen met 6 minuten of meer aankomstvertraging, in procent, over de officiële Infrabel-meetset-benadering (per trein de eerste Brussel-aankomst, anders de eindbestemming), beperkt tot aankomsten vóór 20:00 lokale tijd. Motivatie en borging:

- **Waarom:** de iRail-teller had op go-live-datum (22 juni) maar circa 14 echte historiepunten en kon dus niet eerlijk gescoord worden vóór eind juli. De Infrabel-stiptheidsdata levert jaren echte daghistorie en een officiële, dagelijks ververste bron zonder sleutel.
- **Schaaldiscipline:** de baseline (app/pipeline/scripts/backfill_infrabel_baseline.py, 13 maanden) en de live fetcher (pipeline/fetchers/infrabel.py) delen exact dezelfde drempel- en venster-constanten. De meetset-benadering is een 75%-subsample van de officiële telling met vrijwel hetzelfde niveau, empirisch geijkt: mei 2026 reconstructie 7,63% vs officieel maandcijfer 7,61% (regelmaat 92,39); over mei-oktober 2025 lagen de maanddelta's tussen -0,53 en +0,27 procentpunt zonder systematische richting. Het backfill-script valideert ELKE maand tegen het officiële cijfer en weigert een baseline te schrijven bij een afwijking groter dan 0,75 procentpunt (tolerantie empirisch afgeleid uit die delta-verdeling; een echte meetset-drift valt erbuiten).
- **Grade blijft B:** de bronkwaliteit steeg (officieel, dagelijks), maar het wetenschappelijke bewijs voor de stress-link veranderde niet; geen stille gewichtswijziging.
- **De iRail-teller verdwijnt niet:** hij loopt door als secundair signaal I-D2-009S (eigen historie, niet in het cijfer). De oude I-D2-009-historie (verstoringsteller, andere schaal) is vervangen, niet gemengd.
- **Procedure:** ook dit amendement is vastgelegd vóór OSF-publicatie van dit document; de 30-dagen-termijn van §13 is met expliciete GO van de methodologie-eigenaar verkort (zie de eerlijkheidsverklaring bovenaan §4.1).

### 4.1.5 Amendement: tier dagelijks reactief (2026-06-12, Peter GO, methodologie 0.3.1)

De 3-dagen-sustained-regel (doc 06 §3) is vervangen door een dagregel: de tier volgt de band van het dagpercentiel direct, zowel omhoog als omlaag (oranje >= P70, rood >= P90, afschalen dezelfde dag). De norm wijzigt niet: het percentiel blijft seizoensbewust gewogen tegen dezelfde periode van het jaar over de laatste 24 maanden. Motivatie: de oorspronkelijke regel maakte het advertentievenster traag (backtest 97,7% groen) en kon een laag dagcijfer combineren met een nog actieve banner uit het meerdaagse geheugen; sinds de dagregel zijn cijfer, label en banner elke dag onderling consistent. Verwacht gevolg, per definitie van het percentiel: venster open op circa 30% van de dagen (waarvan circa 10% piekniveau); de brand-safety-override (CN 5) blijft onverkort gelden. De rechtvaardiging van de oude regel blijft als historiek staan in doc 06 §3.5.

### 4.1.6 Amendement: eCDF-normalisatie met 3-jaarsgate, pre-geregistreerd vóór activering (2026-06-12, methodologie 0.3.2, plan-uitvoering B2)

Per indicator schakelt de normalisatie over van de MAD-z-keten (doc 04 §2.6) op een empirische-CDF-normalisatie (CISS-methode: Holló, Kremer & Lo Duca 2012) **zodra** de seizoensbewuste referentie van die indicator (±45 dagen rond dezelfde dag-van-het-jaar, begrensd op de **recentste 5 jaar**) ten minste **3 jaargangen overspant én 90 punten telt**. De eCDF-kans (midrank, geklemd op [1/(2n), 1−1/(2n)] zodat ±∞ onmogelijk is) wordt via de probit naar een z-equivalent gebracht, zodat eCDF- en MAD-z-indicatoren tijdens de overgang in één composiet aggregeerbaar blijven; winsorization (±3) en inverse-codering blijven onverkort gelden. Voor eCDF-indicatoren vervalt STL: het seizoensvenster is daar de seizoenscorrectie. Borging:

- **Drift-cap (5 jaar):** zonder begrenzing zou een decennialange reeks met structurele trend "vandaag" permanent als extreem scoren (de brandstofprijs-index sinds 1996 kwalificeerde in de eerste smoketest en zou tegen 1996-niveaus wegen: dat meet inflatie, geen seizoens-ongewoonheid). De cap is het plan-anker "3-5 jaar per seizoensvenster"; het baseline-drift-argument van doc 04 §8.2 geldt onverkort.
- **Stand bij registratie (smoketest 2026-06-12):** alleen **I-D5-003** haalt de gate (dagdata sinds mei 2023, 3,05 jaar); het effect op het composiet is verwaarloosbaar (z verschuift van −3,0 winsorized MAD-z naar −2,91 eCDF; dagpercentiel 4 → 5). Alle overige gescoorde indicatoren blijven MAD-z met "voorlopig"-label. Wanneer een indicator later de gate haalt, is dat de uitvoering van deze pre-geregistreerde regel, geen wijziging.
- **Zichtbaar, niet verstopt:** elke dag-output labelt per indicator de gebruikte normalisatie (`normalization: "mad_z" | "ecdf"` in de breakdown) en het percentiel-blok draagt `normalization_provisional` (waar zolang minstens één gescoorde indicator op MAD-z draait) + `ecdf_active` (welke indicatoren over zijn). De publieke methodologie-pagina benoemt het voorlopige karakter.
- **Maandbronnen:** door de 90-puntseis binnen de 5-jaarscap blijven maandelijkse reeksen (CPI, werkloosheid, hypotheekrente, brandstofprijs, consumentenvertrouwen) structureel op MAD-z; dat is bewust (een eCDF op een handvol punten is een trap-functie, geen verdeling) en gedocumenteerd in doc 04 §2.7.
- **Onzekerheid blijft gemeten:** de B3-bootstrap hertrekt voor eCDF-indicatoren de seizoensreferentie en spiegelt exact dezelfde keten (probit, klemming, winsorize).
- **Procedure:** vastgelegd vóór OSF-publicatie van dit document; verkorte termijn per de eerlijkheidsverklaring bovenaan §4.1. De Infrabel-maandbestanden gaan ~12 jaar terug; een bewuste baseline-verlenging van I-D2-009 (backfill `--months N`, valideert per maand) zou die indicator binnen de 5-jaarscap door de gate brengen en is een aparte, expliciete beslissing.

---

## 5. Inclusiecriteria (uit laag 3)

Een indicator komt in aanmerking dan en slechts dan als ze aan álle vijf voldoet:

1. Theoretische verankering in minstens één ondersteunend kader
2. Empirische evidence op systematic-review- of meta-analyse-niveau (grade A of B)
3. Publieke beschikbaarheid
4. Tijdsresolutie ≤ wekelijks
5. Gedocumenteerde confounder-set

Indicatoren in primaire set met grade A of B; grade C-indicatoren in secundaire set; grade D uitgesloten.

---

## 6. Normalisatie-keuzes (uit laag 5)

### 6.1 Baselines

- *Korte baseline:* 24 maanden voortschrijdend, mediaan + MAD
- *Vaste baseline:* 2010-2019, mediaan + MAD
- Beide parallel gerapporteerd

### 6.2 STL-decompositie

Toegepast op indicatoren waar seizoen confounder is (zie laag 5 §3.2 tabel). Niet toegepast waar seizoen het signaal is (daglichturen, kalender-indicatoren).

### 6.3 Winsorization

±3 SD-equivalent (na MAD-Z-scoring), met audit-trail per gewinsorizeerde waarde.

---

## 7. Wegings-keuzes (uit laag 6)

### 7.1 Drie parallelle schema's

- **Schema 1 — Equal weights** (primair publicatie-schema)
  - Binnen domein: gelijk
  - Tussen domein: 1/6 = 0.167

- **Schema 2 — Evidence-graded met balance-correctie** (parallel)
  - Binnen domein: gewicht ∝ grade (A=3, B=2)
  - Tussen domein: zie definitieve tabel hieronder

- **Schema 3 — Weegafhankelijkheid-diagnostiek** (rapportage, geen signaal)
  - Inverse-rank + single-domain-dropouts + Dirichlet-bootstrap
  - Gerapporteerd als gevoeligheidsstatistiek

### 7.2 Definitieve Schema-2-tabel

| Domein | gewicht |
|---|---|
| D1 Omgeving & klimaat | 0.211 |
| D2 Mobiliteit & ruimte | 0.135 |
| D3 Economische conditie | 0.223 |
| D4 Werk & belasting | 0.108 |
| D5 Media & collectieve gebeurtenissen | 0.155 |
| D6 Kalender & ritme | 0.172 |

---

## 8. Drempelwaarde-keuzes (uit laag 7)

### 8.1 Drie-tier-signaal

| Tier | Voorwaarde |
|---|---|
| Groen | P(t) < 70 |
| Oranje | 70 ≤ P(t) < 90, sustained ≥ 3 opeenvolgende dagen |
| Rood | P(t) ≥ 90, sustained ≥ 3 opeenvolgende dagen |

### 8.2 Decay

Tier-afschaling pas na 3 dagen onder drempel.

### 8.3 Rechtvaardiging

3-dagen-sustained: cortisol-cyclus-literatuur (3 dagen = 3 cycli minimum). P=90: epidemiologische conventie voor "exceptionele dagen". P=70: waarschuwingsband. Allen alternatief getoetst in laag 8 multiverse.

---

## 9. Falsifieerbaarheidscriteria (uit laag 1)

Bij vervulling van enige criterium → methodologie verworpen (of, voor F4, beperking gedocumenteerd):

- **F1.** Inconsistentie bij externe schok (geen stijging tijdens onbetwiste nationale stressor)
- **F2.** Mono-causaliteit (één indicator verklaart > 60% variantie composiet)
- **F3.** Placebo-doorbraak (placebo-indicator significant effect)
- **F4.** Convergentiefalen (geen significante convergentie met gedragsproxies)
- **F5.** Reproduceerbaarheidsfalen (replicatie wijkt > 10% af)

---

## 10. Validatie-tier-gates (uit laag 8)

**Tier-1 — Must-pass voor launch:**
- Toets 1: Natural-experiments (≥ 5/7 events detected)
- Toets 5: Placebo-test (95% CI omvat 0)
- Toets 6: Test-retest reliability (≥ 70% tier-agreement)

**Tier-2 — Should-pass voor launch:**
- Toets 2: Retrospectieve backtest (inter-rater > 80%)
- Toets 3: Convergente validiteit (≥ 2 proxies rho > 0.40, OF ≥ 3 proxies rho > 0.30)
- Toets 4: Multiverse (default-pad binnen centrale 95%)

**Tier-3 — Doorlopend, geen launch-gate:**
- Toets 7: Adversariële review (ontwerp-iteratie)
- Toets 8: Publieke replicatie-uitdaging

---

## 11. Operationele keuzes (uit laag 4)

- Geografische referentie: 50.85°N, 4.35°E (Brussel) voor astronomische metingen
- Missing-data: LCF 3 dagen → linear interpolation 14 dagen → explicit flag
- Tijdsharmonisatie: maand → forward-fill in wekelijks composiet
- Mediacyclus-decorrelatie: protocol §4.4 van laag 4
- Implementatie-stadium: minimum viable pipeline → target architecture stapsgewijs

---

## 12. Publicatie-conventies

### 12.1 Publieke output

- Dagelijkse barometer-record (JSON)
- Signal-API (tier + brand-safety-vlag)
- Volledige historische dataset

### 12.2 Communicatie-discipline (zie ook 09_Brand-Message-Style-Guide.md)

Toegestane formulering: "blootstellings-conditie hoog", "verhoogd-blootstellings-venster", "extreme omstandigheden".
Niet toegestaan: "u bent gestrest", "Vlamingen zijn collectief gestrest", individuele attributies.

Abonnees (campagnes, persgebruik) tekenen voor naleving van deze stijlgids.

---

## 13. Wijzigings-protocol

Aanpassingen aan deze pre-registratie:
- Minimaal 30 dagen vooraf publiek aangekondigd
- Reden gedocumenteerd in versioned methodology paper
- Triggert herberekening alle historische data onder beide versies
- Beide versies parallel beschikbaar tot uitfasering van oude versie

Toegestane wijzigings-gronden (zie laag 6 §7):

- A1. Nieuwe meta-analyse/SR verandert evidence-grade structureel
- A2. Indicator-toevoeging of -verwijdering door datatoegang
- A3. Falsifieerbaarheidscriteria-falen

Geen wijziging mag worden gemotiveerd door "het signaal komt niet uit zoals we willen".

---

## 14. Datum van pre-registratie

Deze pre-registratie wordt gepubliceerd op OSF op datum [TE BEPALEN] vóór eerste meting. SHA-256-hash van het document wordt op datum van OSF-publicatie publiek gemaakt om manipulatie achteraf zichtbaar te maken.

---

## 15. Adviesraad (in opbouw)

Vóór livegang: drie tot vijf individuele academici uit tegengestelde methodologische scholen. Identiteit, disclosures en vergoeding publiek bij livegang. Eén adviseur expliciet aangewezen als *adversariële collaborator* met methodologische veto-positie op specifieke ontwerpkeuzes (welke nog te bepalen voor finale pre-registratie).
