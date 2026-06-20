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

### 4.1.7 Amendement: geharmoniseerde recency-vensters voor de MAD-z-baseline (2026-06-13, Peter GO, methodologie 0.3.3)

Vóór dit amendement woog elke MAD-z-indicator tegen zijn **volledige** beschikbare historie. Die diepte was heterogeen (≈2 jaar voor dagbronnen, 16-30 jaar voor de maand-/jaarbronnen brandstof, CPI, werkloosheid, hypotheekrente, ontslagen, consumentenvertrouwen en filezwaarte), waardoor "ongewoon" per indicator iets anders betekende en z-groottes onderling beperkt vergelijkbaar waren. Meting 2026-06-13 (dagwaarden van die dag): inflatie 4,1% scoorde z = +1,12 tegen 18 jaar maar −0,08 tegen 5 jaar; werkloosheid 6,2% scoorde −0,43 tegen 18 jaar maar +1,35 tegen 5 jaar — zelfde meting, omgekeerd teken. Vanaf 0.3.3 geldt één recency-principe (`runtime.ts`, lookahead-veilig via `sliceTrailing`, alleen punten ≤ rekendatum):

- **Dagbronnen: rollend 24 maanden** — dezelfde groundroot als het gepubliceerde 24-maands-seizoenspercentiel.
- **Maand-/jaarritmebronnen: rollend 60 maanden** (I-D2-001, I-D2-004, I-D3-001, I-D3-003, I-D3-005, I-D3-006, I-D3-007) — n ≈ 58-62 punten voor een stabiele MAD. Een 24-maands venster is hier statistisch onhoudbaar: n ≈ 24 valt onder de minimumdrempel van 30 punten en zou deze bronnen uit de index gooien. De 60 maanden zijn consistent met de eCDF-drift-cap van §4.1.6 ("recentste 5 jaar").
- **eCDF-pad ongewijzigd:** de gate van §4.1.6 beoordeelt de volle historie (een 24m-venster zou de 3-jaargangen-gate per constructie onmogelijk maken) en kent zijn eigen 5-jaars-drift-cap. STL-seizoenscorrectie blijft gelden binnen het venster; de B3-bootstrap hertrekt automatisch de gevensterde baseline (zelfde `baselineValues`-paren).
- **Effect bij registratie (smoketest 2026-06-13):** geen indicator valt uit (`indicators_missing` leeg); dagpercentiel verschuift 40 → 34 (CN blijft 1); de percentiel-referentie wordt per run door dezelfde engine herberekend en is dus automatisch venster-consistent. Gedrag gepind in `engine.test.ts` ("Baseline-vensters §4.1.7": maandbron weegt tegen 60m, dagpunten ouder dan 24m tellen niet mee, eCDF-gate blijft de volle historie zien).
- **Rationale:** het composiet aggregeert z-scores over indicatoren; dat veronderstelt dat ze hetzelfde soort afwijking meten. Eén gedeelde recency-definitie ("ongewoon t.o.v. het recente regime") verbetert die vergelijkbaarheid wezenlijk (de resterende 24m/60m-tweedeling en de eCDF-5-jaarscap zijn gedocumenteerde, cadans-gedreven uitzonderingen — volledig uniform is het bewust niet). Het baseline-drift-argument van doc 04 §8.2 geldt nu uniform voor álle indicatoren, niet alleen voor de eCDF.
- **Eerlijke spanning met het ankerpaper (adversariële review 2026-06-13):** doc 01 §5.1 neemt van McEwen juist het principe over dat *cumulatieve* blootstelling zwaarder weegt dan acute incidenten. Een rollend venster laat een chronische stressor na ~2 (dag) of ~5 jaar (maand) geleidelijk in de baseline opgaan ("het nieuwe normaal"), terwijl de hedonic-adaptation-literatuur laat zien dat aan sommige stressoren (lawaai, financiële druk, werkloosheid) niet of onvolledig gewend wordt. Die spanning wordt geaccepteerd omdat dit per ontwerp een dagelijkse *anomalie*-index is (hoe ongewoon is vandaag), geen cumulatieve-lastmeter; het niveau-perspectief is het domein van de v0.4-testlaag (z_lang, 120 maanden rollend) en de halfjaarlijkse audit. Wie het construct als cumulatieve last leest, leest deze index verkeerd — de publieke copy mag die suggestie dus ook niet wekken.
- **Bekende beperking (adversariële review 2026-06-13, geverifieerd):** voor STL-indicatoren is de effectieve baseline binnen het 24m-venster kleiner dan 24 maanden (~12 maanden residuen: punten zonder voorgaand jaar bínnen het venster kunnen niet gedetrend worden en vallen uit de verdeling), en de cyclustelling van doc 04 §3.4 telt kalenderjaren waardoor een 24m-venster met 2 echte seizoenscycli door de "≥3"-gate gaat. De n≥30-poort is per deze review verplaatst naar de post-STL-residuenset (de verdeling waar de z écht tegen weegt). De definitieve keuze — echte-jaargangen-telling in de STL-gate dan wel STL uitschakelen op het 24m-MAD-z-pad — staat open als expliciete vervolgbeslissing; tot dan is deze beperking de gedocumenteerde realiteit.

### 4.1.8 Amendement: afvlakking van het gepubliceerde percentiel (7-daags trailing gemiddelde) (2026-06-14, Peter GO, methodologie 0.3.4)

Vóór dit amendement was het gepubliceerde dagpercentiel het seizoenspercentiel van het **ruwe** dagcomposiet. Onderzoek (analyse-scripts `aggregation_variance.py` + `smoothing_prototype.py`, CHANGELOG 14/6) toonde dat het composiet vrijwel geen persistentie had: de dag-tot-dag-standaarddeviatie (~0,166) was bijna gelijk aan de totale (~0,179). Het composiet was grotendeels dagruis, gedreven door vijf snelle bronnen (nieuws I-D5-001, stroomvraag I-D3-009, gebeurtenissen I-D5-003, treinen I-D2-009, lucht I-D1-004); de macro-indicatoren staan dag-tot-dag vrijwel stil. Het krappe seizoenspercentiel blies die ruis op tot dag-tot-dag-sprongen van gemiddeld ~15 en pieken tot 54 percentielpunten (live gemeten) — onbruikbaar volatiel voor een publieke barometer, die per construct een traag evoluerende toestand hoort te tonen.

**Regel (vanaf 0.3.4):** het gepubliceerde cijfer is het seizoenspercentiel van het **7-daags trailing gemiddelde** van het composiet, vergeleken tegen de **evenzo afgevlakte** referentiehistorie (afgevlakt tegen afgevlakt, nooit afgevlakt tegen ruw). Borging:

- **Consistent over de hele keten:** het percentiel, de tier-/campagnelogica, de B3-bootstrap-band én de referentie-audit gebruiken alle het afgevlakte composiet en de afgevlakte referentie. De bootstrap vlakt elke trekking af met de (vaste) voorgaande dagen — `smoothed = (pastSum + draw)/count` — zodat de band exact de onzekerheid van het afgevlakte cijfer dekt, niet die van een ruwe dag.
- **Lookahead-vrij:** elk historiepunt middelt uitsluitend zichzelf en voorgaande dagen (`smoothTrailing`); de vroegste punten gebruiken een korter expanderend venster.
- **Transparant, niets verstopt:** het ruwe dagcomposiet blijft in de output (`composite.equal`) naast het afgevlakte (`composite.equal_smoothed`), en `percentile.smoothing_window_days` benoemt het venster. Het ruwe percentiel voedt nog de media-bijdrage-diagnostiek (like-for-like, raw vs raw).
- **Effect (smoketest 2026-06-14):** de dag-tot-dag-percentielsprong daalde van gemiddeld ~15 naar ~3 (max 54 → 20), een ~5× stabilisatie; een echte brede stressbeweging (veel indicatoren samen) blijft volledig doorkomen — afvlakking dempt ruis, geen signaal.
- **Vensterkeuze:** 7 dagen is de pre-geregistreerde keuze (stabiliteit versus reactiviteit; prototype: 3d ~2×, 7d ~3×, 14d ~4×). Wijzigen = amendement.
- **Reikwijdte:** geldt nu voor het publieke v0.2-percentiel. Het v0.4-kernpad (`percentile.lang`) krijgt dezelfde afvlakking bij zijn go-live als publieke kop; tot dan blijft het de testlaag.

### 4.1.9 Amendement: absolute economische stress-meting "vs normale tijden" (vaste 2010-2019 baseline) (2026-06-17, Peter GO, methodologie 0.3.5)

Het brede publieke cijfer is een **rollend seizoenspercentiel** (hoe ongewoon is vandaag t.o.v. de laatste 24 maanden). In 2026 leest dat genuinely kalm (~20): de meeste indicatoren zijn rustig vergeleken met de zwaardere periode 2024-2025 die in de referentie zit. Dat cijfer is eerlijk en wordt **niet** opgepompt (harde regel 1; zie sessieverslag 07 §2). De eerlijke aanvulling is een **absolute** meting: hoe verheven staan de economische stressoren t.o.v. een **vaste normale periode**? Dit operationaliseert de in §6.1 al pre-geregistreerde vaste 2010-2019-baseline, binnen zijn eerlijke datagrens.

**Regel (vanaf 0.3.5):** een additief, expliciet **apart** blok `economic_pressure` in de dag-output (`methodology/economic-pressure.ts`). Per indicator wordt de laatste waarde (≤ rekendatum, lookahead-veilig) MAD-gescoord tegen de **2010-2019-waarden van dezelfde reeks** (zelfde historiebestand, zelfde eenheid, geen STL: een "vs normaal decennium"-meting leest het niveau, niet het seizoensresidu), met inverse-codering uit de registry en winsorize ±3 (§6.3) zoals de brede keten. Het composiet is het equal-weight-gemiddelde van de per-indicator z (parallel ook demografische-reikwijdte-gewogen, schema 3). Mapping naar 0-100 via de **normale CDF** (Peter-beslissing 2026-06-17): `score = round(100·Φ(z̄))`, zodat z̄ = 0 (exact het normale decennium) → 50, +1σ → 84.

- **Indicatorset (de harde datagrens):** alléén indicatoren met een echte 2010-2019-historie kunnen "vs normale tijden" gemeten worden. Dat zijn de vijf economische: **I-D3-001** inflatie, **I-D2-004** brandstof, **I-D3-007** consumentenvertrouwen (inverse), **I-D3-005** werkloosheid, **I-D3-006** hypotheekrente. Weer/nieuws/verkeer/pollen bestaan pas sinds 2024; energie **I-D3-002** start óók pas in 2024 en valt er bewust uit. De **brede** index kan daarom géén eerlijke 2010-2019-meting krijgen (`percentile.fixed_2010_2019` blijft `null`/`not_computed`); dit blok is een smaller, apart construct.
- **Bindende label-mitigatie (harde regel 1, doc 09):** dit cijfer mag **niet** "De Nationale Stress Barometer op dit moment" heten — dat label hoort bij de brede meting (~20). Het `label`-veld in de output zegt permanent: "Economische druk t.o.v. normale tijden (2010-2019). Niet het brede Barometer-cijfer." Wil men de hoofd-index tóch op dit cijfer zetten, dan vergt dat een formele **herdefinitie** van de Index (apart amendement), niet deze parallel-publicatie.
- **Eerlijk, pompt niets op:** werkloosheid leest vandaag z = −1,26 (genuinely **gunstig** t.o.v. het decennium) en drukt het composiet omlaag; die meegerekend houden i.p.v. wegcherrypicken is een harde-regel-1-eis. Stand 2026-06-17 (live historie): inflatie +1,94, brandstof +1,27, consumentenvertrouwen +3,00 (gewinsorized van +3,02), hypotheekrente +0,76, werkloosheid −1,26 → z̄ = **+1,14** → **score 87** (demografisch gewogen z̄ +1,30 → 90). In een rustige economische periode zou dit vanzelf naar 50 of lager zakken.
- **Niet berekenbaar = eerlijk leeg:** zonder toereikende 2010-2019-baseline (≥ 36 punten per indicator, ≥ 3 indicatoren) geeft het blok `status: "not_computed"` + `score: null` (harde regel 2). De productie-dagschrijver (`generate-fixture`) levert de volledige reeks; de bridge met een kort `raw-history`-venster valt zo eerlijk terug.
- **Effect op het brede cijfer: nul.** Geen wijziging aan composiet, percentiel, tier, condition-level of trigger. Puur additief. Gedrag gepind in `economic-pressure.test.ts` (13 tests: Φ-correctheid, MAD-z tegen de vaste baseline, inverse, winsorize, lookahead-veiligheid, not_computed-terugval, integratie in `computeDaily`, label-eerlijkheid).

### 4.1.10 Amendement: herdefinitie van het publieke hoofdcijfer naar de absolute "vs normale tijden"-meting (2026-06-17, Peter GO, methodologie 0.3.6)

Het publieke hoofdcijfer was het rollende seizoenspercentiel (§4.1.8): "hoe ongewoon is vandaag t.o.v. de afgelopen 24 maanden". Dat leest in 2026 structureel laag (~13-20) omdat de referentieperiode de zware crisisjaren 2024-2025 bevat: vergeleken met die jaren is vandaag genuinely rustiger, dus het percentiel is laag. Op een publieke "stress-index" communiceert "13 / RUSTIG" misleidend dat er nauwelijks druk is, terwijl de economische druk (inflatie, koopkracht, energie, wonen) t.o.v. normale tijden juist uitzonderlijk hoog is. Sessieverslag 07 §3 voorzag deze keuze expliciet: de hoofd-index op het absolute "vs normale tijden"-cijfer zetten kan, mits formeel herdefinieerd en gedocumenteerd. Dit amendement doet dat.

**Regel (vanaf 0.3.6):** het publieke hoofdgetal van De Nationale Stress Index is voortaan de **absolute economische stress-meting "vs normale tijden"** (`economic_pressure.score`, §4.1.9: vaste 2010-2019-baseline, MAD-z, 100·Φ(z̄)), niet langer het relatieve seizoenspercentiel.

- **Eerlijke datagrens (ongewijzigd t.o.v. §4.1.9):** alleen de vijf economische indicatoren met echte 2010-2019-historie dragen dit cijfer (inflatie, brandstof, consumentenvertrouwen, werkloosheid, hypotheekrente). Weer/verkeer/nieuws hebben geen vast normaal-ijkpunt (bestaan pas sinds 2024) en kunnen dus niet absoluut "vs normale tijden" gemeten worden. Het hoofdcijfer is daarmee in de praktijk een **economische-druk-index**; de bredere omstandigheden blijven zichtbaar als context.
- **Bindende claim-mitigatie (harde regel 1, doc 09):** onder het cijfer staat permanent dat het de economische druk op gezinnen meet vergeleken met normale tijden (2010-2019), met 50 als normaal niveau, en dat het **geen meting van individuele stress** is. De publieke kop mag geen "algemene stress in België"-claim wekken die het cijfer niet draagt.
- **Bandwoorden absoluut gelezen:** de schaal RUSTIG < 50 ≤ NORMAAL < 70 ≤ VERHOOGD < 90 ≤ UITZONDERLIJK blijft, nu absoluut (50 = normaal decennium). Stand 17/6: z̄ +1,14 → score 87 → VERHOOGD.
- **Transparantie, niets verborgen:** de engine blijft het relatieve composiet én het seizoenspercentiel berekenen en in de output zetten (`composite`, `percentile.short_24m`); ze zijn alleen niet langer de publieke kop. Het relatieve cijfer blijft beschikbaar in de data en de diagnostiek.
- **Coherentie van de pagina:** de indicatorlijst is herkaderd van "Hoe is het cijfer opgebouwd?" naar "De omstandigheden die we volgen": het hoofdcijfer meet de economische druk, de bredere omstandigheden (weer, verkeer, werk, nieuws) worden als context getoond, ook waar het juist rustig is. Dat de meeste niet-economische indicatoren "normaal/rustig" staan is consistent met het verhaal: breed rustiger dan de crisisjaren, economisch zwaar t.o.v. normaal.
- **Reikwijdte:** dit is een PRESENTATIE-herdefinitie; de engine-berekening (economic_pressure §4.1.9 én het relatieve composiet) is ongewijzigd. Een latere uitbreiding naar een echt brede absolute meting vereist 2010-2019-baselines voor de niet-economische indicatoren (apart datatraject, apart amendement).

### 4.1.11 Amendement: verbreding van het hoofdcijfer naar een BREDE absolute meting (economie + energie + weer) (2026-06-17, Peter GO, methodologie 0.3.7)

§4.1.10 maakte het hoofdcijfer de economie-only absolute meting (87). Dat botste echter zichtbaar met het brede relatieve cijfer (~19): "87 economisch hoog, de rest 19 laag" klopt niet als verhaal omdat beide een ANDERE referentie gebruiken (87 vs 2010-2019, 19 vs de crisisjaren 2024-2025). De wetenschappelijk zuivere oplossing (Peter, 17/6): meet ZOVEEL MOGELIJK indicatoren absoluut "vs normale tijden", niet alleen de economische, zodat er één coherent breed cijfer is.

**Regel (vanaf 0.3.7):** het publieke hoofdgetal is de **brede absolute meting** (`broad_pressure.score`) over de indicatoren met een echte pre-2020-baseline: de 5 economische + **hitte + koude + energie** (8 in totaal). Per indicator MAD-z van de laatste waarde tegen zijn eigen 2010-2019-baseline (energie 2016-2019 daarbinnen), equal-weight gemiddeld, 100·Φ(z̄). Stand 17/6: z̄ +1,09 → **86/100, VERHOOGD**.

- **Backfill (schaaldiscipline, harde regel 5):** weer en energie hadden alleen 2024+. Ze kregen een echte pre-2020-baseline met EXACT dezelfde maat als de live-fetcher: hitte = max(0, Tmax-30) en koude = max(0, -5-Tmin) uit open-meteo (ERA5, 2010-2019); energie = dag-gemiddelde uurprijs EUR/MWh (UTC-dag) uit energy-charts (2016-2019). Script: `app/pipeline/scripts/backfill_absolute_baselines.py`. De backfill voegt ALLEEN pre-2020-rijen toe; de bestaande 2024+-historie blijft onaangeroerd. De rolling MAD-z-vensters (§4.1.7, 24/60m) en de eCDF-cap (5 jaar) zien pre-2020 niet, dus de relatieve keten verandert niet; alleen de absolute meting (filtert <2020) gebruikt deze punten.
- **Vlakke-baseline-eerlijkheid:** weer staat vandaag op 0 (niet warm/koud) en is in het normale decennium ook meestal 0, dus z = 0 — en die indicatoren tellen MEE (niet uitgesloten), exact zoals de "geen uitschieter"-regel van de hoofd-engine. Een neutrale indicator weglaten zou het cijfer kunstmatig omhoog vertekenen (zonder weer was het 93 i.p.v. 86). Gebruik daarom `robustScale` (MAD -> IQR -> SD), niet kale MAD.
- **Eerlijke datagrens:** lucht (IRCELINE), nieuwstoon (GDELT) en Wikipedia blijven relatief/context. Hun historische maat is niet betrouwbaar te reproduceren voor 2016-2019 (geen RSS-archief, geen Pattern.nl-lexicon op oude headlines, onzekere IRCELINE-archieftoegang); ze toevoegen met een afwijkende maat zou een Hitte-bug-landmijn zijn. Uitbreidbaar zodra een betrouwbare backfill bestaat.
- **Transparantie:** `economic_pressure` (economie-only, §4.1.9) blijft als sub-view in de output; `broad_pressure` is het hoofdcijfer; het relatieve composiet en seizoenspercentiel blijven berekend en zichtbaar in de data en diagnostiek.
- **Effect:** lost de 87-vs-19-incoherentie op met één coherent breed cijfer (86). Geen reken-wijziging aan het relatieve composiet/percentiel.

### 4.1.12 Amendement: active-regime-schaal voor de nul-zware weerindicatoren (hitte/koude) (2026-06-19, Peter GO, methodologie 0.3.8)

§4.1.11 nam hitte en koude op in het brede hoofdcijfer met de standaard `robustScale` over de VOLLEDIGE 2010-2019-baseline. Dat verborg een schaalprobleem: hitte (max(0, Tmax-30)) en koude (max(0, -5-Tmin)) zijn 0 op >98% van de dagen, dus de all-days-MAD/IQR is 0 en `robustScale` valt terug op de SD over alle dagen (~0,27 voor hitte). Die is minuscuul omdat de structurele nullen domineren. Gevolg: ELKE milde tropische dag (31°C, waarde 1) gaf z ≈ 3,7 → winsorize-kap +3, even zwaar als een 38°C-hittegolf. Het hoofdcijfer kon zo op een gewone warme zomerdag 7 punten springen (86 → 93), zonder onderscheid tussen mooi weer en een echte hittegolf. (Deze landmijn werd pas zichtbaar nadat de baseline-trim-bug van 2026-06-19 was gedicht en de echte, complete 2010-2019-weerbaseline weer aanwezig was; zie CHANGELOG 2026-06-19.)

**Regel (vanaf 0.3.8):** voor hitte (I-D1-002) en koude (I-D1-003) wordt in de absolute meting de SPREIDING berekend over het ACTIEVE (niet-nul) regime van de baseline (`robustScale(baseline.filter(v > 0))`), niet over alle dagen. De MEDIAAN (= het normale niveau, 0) blijft over de volledige baseline. Implementatie: de set `ACTIVE_REGIME_SCALE_CODES` in `app/engine/src/methodology/economic-pressure.ts`.

- **Wetenschappelijke verankering (KMI/RMI + gezondheid):** zomerdag = Tmax ≥ 25°C; tropische dag = Tmax ≥ 30°C; officiële hittegolf = ≥5 dagen op rij ≥ 25°C waarvan ≥3 ≥ 30°C (Ukkel). De gezondheidsliteratuur legt de morbiditeitsdrempel rond 30°C en de mortaliteitsdrempel rond 33°C, met steile risicostijging daarboven (o.a. Seoul- en Zwitserse mortaliteitsstudies). De active-regime-schaal (~1,04 voor hitte 2010-2019) reproduceert die gradient: 31°C → z ≈ 0,96; 33°C → ~1,9; 35°C+ → kap +3.
- **Effect:** een milde warme dag tilt het hoofdcijfer licht (86 → ~88) i.p.v. vol (93); alleen een echte hittegolf bereikt de kap. Een dag zonder hitte blijft z = 0 (meetelt, neutraal); het hoofdcijfer vandaag (hitte = 0) blijft 86. Schaaldiscipline (harde regel 5) intact: dezelfde maat én dezelfde uit-de-baseline-afgeleide schaal voor baseline en dagwaarde; geen herbackfill nodig.
- **Reikwijdte:** raakt alleen hitte/koude in `broad_pressure`. `economic_pressure` (5 economische) en het relatieve composiet/percentiel zijn ongewijzigd. Gepind in `app/engine/test/economic-pressure.test.ts` ("active-regime schaal voor nul-zware weerindicatoren").
- **Presentatie:** de uitleg van deze gradient (waarom een hittegolf zwaarder weegt dan een losse warme dag) staat in de publieke per-indicator-uitklap (`plain-language.ts`, hitte/koude) en deze methodologie-annex, niet in het hoofdblok met het cijfer (Peter 2026-06-19).

### 4.1.13 Amendement: nieuws (GDELT-nieuwstoon) toegevoegd aan het brede hoofdcijfer (2026-06-19, Peter GO, methodologie 0.3.9)

§4.1.11 sloot nieuws uit het hoofdcijfer omdat de RSS/lexicon-meting (de secundaire I-D5-001-rss/emotie) niet reproduceerbaar is voor 2016-2019 (geen RSS-archief, geen Pattern.nl-lexicon op oude headlines). Maar de PRIMAIRE I-D5-001 is GDELT-nieuwstoon (`gdelt_tone_series`, negativity = -AvgTone), en die heeft via de GDELT DOC v2-API wél een reproduceerbaar archief tot ~2017. Peter (19/6) wilde negatief nieuws expliciet in het hoofdcijfer meewegen; dat is eerlijk haalbaar omdat baseline en dagwaarde dezelfde GDELT-maat dragen (schaaldiscipline intact). De RSS/lexicon-signalen blijven secundair.

**Regel (vanaf 0.3.9):** I-D5-001 (nieuwsnegativiteits-index, GDELT) is de 9e indicator in `BROAD_PRESSURE_CODES`. Baseline: 2017-2019 GDELT-nieuwstoon (backfill via `gdelt_tone_series`, ~910 dagpunten; 2017 Q2-Q3 ontbreekt door GDELT-rate-limiting, voor een niet-seizoensgebonden bron niet bezwaarlijk). Niet-inverse (hoge negativiteit = meer stress), MAD-z, winsorize ±3, equal-weight zoals de andere acht.

- **Effect:** nieuws beweegt het hoofdcijfer beide kanten op — een kalme nieuwsdag verlaagt het (value 0,53 << baseline-mediaan 1,21 → z = -3 → ~81), een normale dag (value ~1,33 ≈ baseline) laat het ~ongewijzigd (~91), een zware-nieuwsdag verhoogt het (z +3 → ~94). Het hoofdcijfer volgt nu de nieuwscyclus (nieuws is de snelst bewegende bron). Dit is bewust: Peter wilde dat negatief nieuws meeweegt.
- **Bevroren bestand (harde regel 3):** de backfill voegde ALLEEN pre-2020-rijen toe aan `data/history/I-D5-001.json`; de bevroren 2024-2026-rijen bleven byte-voor-byte intact (assert-gecontroleerd). Expliciete Peter-go 2026-06-19.
- **Reikwijdte:** raakt alleen `broad_pressure`. `economic_pressure` (5 economische) en het relatieve composiet/percentiel zijn ongewijzigd (I-D5-001 zat daar al in). Geborgd in `verify_live.py` (baseline-integriteit I-D5-001).
- **Eerlijke datagrens (onderzocht 19/6, agents):** pollen, verkeer, trein, OV (De Lijn/STIB) en social blijven uit het hoofdcijfer — geen reproduceerbaar 2010-2019-archief met dezelfde maat (pollen: ander model + alleen seizoensskill; trein: ruwe Infrabel-bestanden valideren niet binnen 0,75pp, zelfde reden als de afgewezen 2023-backfill; verkeer: alleen Vlaanderen + login-muur + maatverschil; OV/social: bestaan pas sinds 2024). Ze blijven in de relatieve laag.

### 4.1.14 Amendement: hybride dagkop "niveau x beweging" (2026-06-19, Peter GO, methodologie 0.4.0)

§4.1.11/§4.1.13 maakten `broad_pressure` (9 indicatoren, absoluut vs 2010-2019, equal-weight, 100*Phi(z̄)) het hoofdcijfer. Dat leest eerlijk-hoog maar beweegt nauwelijks van dag tot dag: drie indicatoren staan op de winsor-kap, de economische grondlast pint een hoge bodem, en Phi verzadigt aan de top (~1,6 punt per 0,1 z̄ rond z̄=1,36). Verkeer zit er bovendien niet in (geen 2010-2019-archief). Peter (19/6) wil één dagelijks getal dat de STRUCTURELE druk (kosten van levensonderhoud, energie) combineert met de DAGELIJKSE omstandigheden (weer, nieuws, verkeer), eerlijk-hoog verankerd maar zichtbaar ademend.

Wetenschappelijke kern (Peter, 19/6): het relatieve seizoenspercentiel (~23) ademt wél dagelijks maar leest laag, NIET inherent, maar omdat het de crisisjaren 2024-2025 als referentie heeft. De hybride lost dat aan de bron op door de snelle factoren tegen hun NORMALE-jaren-referentie te meten (weer: 2010-2019; nieuws: 2017-2019), niet tegen de recente jaren.

**Regel (vanaf 0.4.0):** `daily_pressure` = `round(100 * Phi( (1 - w_fast) * z_slow + w_fast * z_fast ))`, met:
- **z_slow** (traag anker) = gemiddelde MAD-z van de 6 structurele codes vs hun 2010-2019/2016-2019-baseline: I-D3-001 inflatie, I-D2-004 brandstof, I-D3-007 consumentenvertrouwen, I-D3-005 werkloosheid, I-D3-006 hypotheekrente, I-D3-002 energieprijs. Hergebruikt exact de `broad_pressure`-z's (zelfde maat, scale-discipline harde regel 5).
- **z_fast** (snelle beweging) = gemiddelde z van de snelle codes (I-D1-002 hitte, I-D1-003 koude, I-D5-001 nieuws, elk vs zijn 2010-2019/2017-2019-normaal) plus **verkeer**.
- **w_fast = 0,30** (de ademknop; Phi-blend i.p.v. additief om plafond-verzadiging te vermijden).
- **mapping:** dezelfde normale CDF als `broad_pressure` (z̄=0 -> 50).

**Verkeer (I-D2-001-rt, DATEX-dagfilezwaarte):** geen 2010-2019-archief, dus geen "vs normaal"-anker mogelijk; weegt mee als **dagsignaal** via de empirische CDF van zijn eigen (nog korte, aangroeiende) historie -> probit-z, gewinsoriseerd. `n_reference` wordt gerapporteerd zodat de dunne basis zichtbaar blijft; onder 10 dagpunten valt verkeer eerlijk weg. Dit is een eerlijke uitzondering (harde regel 1): verkeer wordt NIET "vs normale jaren" geclaimd, maar als dagelijkse afwijking van zijn eigen norm. De historie bouwt verder op.

- **Effect (19/6):** vandaag ~90 (dicht bij de oude 91 -> geen schok bij overgang), ademt ~79-93: een hittegolf die breekt zakt het ~3 punten, een rustige filedag + kalm nieuws ~84, een zware dag (file-spike + zwaar nieuws + hitte) ~94. Een kalme dag blijft eerlijk VERHOOGD (verankerd op de structurele druk), nooit misleidend laag.
- **Reikwijdte:** raakt alleen de PUBLIEKE KOP. `broad_pressure` (§4.1.11) blijft berekend als sub-view (transparantie); `economic_pressure` (5 economische, §4.1.9) en het relatieve composiet/percentiel zijn ongewijzigd. Frontend leest `daily_pressure.score` (terugval op `broad_pressure` tijdens het data-overgangsvenster).
- **Geborgd:** `app/engine/test/hybrid-headline.test.ts` (7 tests: blend-mapping, anker, verkeer als dagsignaal, ademhaling, not_computed). `economic-pressure.ts` (de z-keten) ongewijzigd.

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
