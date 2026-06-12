# CHANGELOG — Stressor-Blootstellings-Index (SBI)

Audit-trail per 08_Onderhoud-Protocol.md §5.6: elke wijziging gelogd met datum, aanleiding en beslissing. Nieuwste entries bovenaan.

Eerlijke noot bij de start van dit logboek: dit bestand is aangemaakt op 2026-06-11. De entries vóór die datum zijn retroactief gereconstrueerd uit de git-historie en commit-berichten van de app. De wijzigingen zelf zijn op het moment van invoering in commits gedocumenteerd, maar het formele wijzigingsproces (30-dagen-aankondiging, adviesraad-consultatie per 08 §5.3-5.4) is voor geen van deze wijzigingen vooraf gevolgd; er is op dit moment ook nog geen adviesraad, dus dissenting opinions ontbreken. Zie 00_Pre-Registratie.md §4.1 voor de formele regularisatie.

---

## 2026-06-12 — B4: Monte-Carlo-gevoeligheidsanalyse (OECD/JRC stap 7) met Sobol'-indices

**Aanleiding:** BLOK B-taak B4 (02_VERBETERPLAN): kwantificeer hoeveel het dagcijfer beweegt onder redelijke alternatieve methodekeuzes.

**Beslissingen:**

- Nieuw `app/pipeline/analysis/sensitivity.py` (pure Python, stijl multicollinearity.py): 1.200 geseede Monte-Carlo-runs over vier factoren: normalisatiemethode (MAD/IQR/SD-z), domeingewichten ±30% (hernormaliseerd), baselinelengte (18/24 m), indicator-uitsluiting (geen of één). Precompute van z-varianten per (methode × lengte) houdt de looptijd onder 2 s.
- Per dag p05/p50/p95 + spread van het dagpercentiel over alle runs; eerste-orde Sobol'-indices via conditional-mean-binning (Y = percentiel van de recentste 7 dagen; expliciet NIET het gemiddelde over alle dagen — dat is binnen de eigen verdeling per constructie ~50 en drukt alle indices naar 0; deze valkuil zat in de eerste implementatie en is door de determinismetest + nulvariantie-symptoom gevangen).
- Eerlijke vereenvoudigingen expliciet in het rapport (`limitations`): geen STL, percentiel binnen het analysisvenster, brute-force-Sobol zonder Saltelli-design, equal-binnen-domein.
- Resultaat op de echte historie (90 dagen, 17 indicatoren met voldoende reeks, seed 20260612): gemiddelde spread dagpercentiel 18,8 pp (mediaan 17,8, max 43,3) — consistent met de ±10-12 pp-onzekerheidsmotivatie achter B2. Sobol': indicator-uitsluiting 0,40; gewichten samen 0,42 (D1 0,17 &gt; D2 0,11 &gt; D3 0,09 &gt; D5 0,06); normalisatiemethode 0,16; baselinelengte ~0.
- Output naar `app/data/analysis/sensitivity.json` (gitignored, regenereerbaar). Test: `tests/test_sensitivity.py` (14 checks, standalone): determinisme, registry-filterregels (geen S/D6/grade-D), Sobol-sanity (dominante factor ~1, irrelevante ~0), spreidingsrapport.

**Aanleiding:** BLOK B-taak B3 (02_VERBETERPLAN): zichtbare onzekerheid is de grootste geloofwaardigheidssprong. De oude `bootstrap_95_ci_around_equal` stond bewust op null/not_computed; die wordt nu écht berekend.

**Beslissingen:**

- Nieuw `methodology/bootstrap.ts`: baseline-resampling per gescoorde indicator (met teruglegging, zelfde n), volledige productieketen herberekend per trekking (computeBaseline → zscore → geen-schaal-splitsing → inverse → winsorize → equal-composiet → percentiel tegen exact dezelfde seizoensreferentie als het gepubliceerde cijfer). 2.000 trekkingen, deterministisch geseed op de datum (mulberry32/FNV-1a) — reproduceerbaar voor audit.
- Output `uncertainty` in latest.json: ci_90_lower/upper (percentielpunten), width_fraction, uncertainty_flag (low <0,10 ≤ medium ≤ 0,20 < high), flag_reason (ci_width / thin_reference bij <30 referentiepunten / no_scored_indicators), composite_ci_95, covers (eerlijk: dekt baseline-schattingsonzekerheid, geen bronfouten/modelkeuzes — dat is B4). Veld alleen aanwezig als de bootstrap echt draaide.
- `bootstrap_95_ci_around_equal` wordt uit dezelfde trekkingen gevuld (2,5e–97,5e percentiel composiet); zonder bootstrap eerlijk null + not_computed.
- Opt-in via `computeUncertainty` (DailyComputeInput): de twee productie-dagschrijvers (generate-fixture vandaag-pad, compute-daily-bridge) zetten hem aan; warm-up-loop en backtest niet (honderden aanroepen; kost gemeten: ~23 s per dag-run bij 21 indicatoren × 730 baselinepunten × 2.000 trekkingen — acceptabel voor de uurlijkse CI, funest in een loop).
- UI respecteert de vlag: bij "high" géén scherp getal maar het 90%-bereik + waarschuwing (kicker "ONZEKER"); bij low/medium bandbreedte-regel onder het cijfer en een band in de meter.
- Doc 07 §13-bis beschrijft methode, vlagregels en de eerlijke dekking-grens (bootstrap ≠ multiverse).
- Tests: nieuwe suite test/bootstrap.test.ts (9 tests: determinisme, flag-drempels, thin-reference/no-indicators-eerlijkheid, vlakke-baseline-pad, smaller interval bij strakkere baselines, runtime-integratie aan/uit). Engine 145/145, web build groen; smoketest productie: CI [0,6–9,4] rond percentiel 4, flag low, n_reference 181.

**Aanleiding:** BLOK B-taak B7 (02_VERBETERPLAN). De index meet omgevingsongewoonheid, geen bewezen populatiestress; titel en bronteksten moeten die claim dragen. De publieksnaam zelf ("De Nationale Stress Barometer" vs alternatieven) is een beslissing van Peter; beslismemo staat klaar in het handover-pakket (04_B7_BESLISMEMO_NAAMKEUZE.md).

**Beslissingen (alles naam-agnostisch, geldig onder elke naamkeuze):**

- HeroBanner-subtitel = de verplichte openingszin uit het copy-deck (04_REFERENTIE_CONSTRUCT.md, oud wetenschapspakket): "Deze index meet hoe ongewoon zwaar de omstandigheden vandaag zijn voor heel België, niet of mensen zich gestrest voelen." (verving "blootstelling aan stressverhogende omstandigheden"; benoemt en passant het meetgebied België, voorschot op C3).
- Allostatic load overal alleen nog gelabelde inspiratie: footer-copy + SBI_FOUNDATIONS zeggen expliciet "niet de gemeten grootheid en niet de validatie van deze dagindex".
- Vertekende-citatie-fix (wetenschapspakket §bronnen): het Marin et al. 2012-label claimt niet langer dat negatief nieuws stressreactiviteit "verhoogt"; het vermeldt nu de echte uitkomst (geen directe stresshormoon-stijging; wel verhoogde reactiviteit op een latere stressor; kleine steekproef, alleen vrouwen).
- Methodologie-stap 4 gecorrigeerd: het hoofdcijfer weegt de vijf categorieën gelijk; het evidence-gewogen schema is een controleversie (de oude tekst suggereerde evidence-weging van het hoofdcijfer). Verwijst nu naar de B8-bewijskracht per indicator.
- Em-dashes uit user-facing copy (footer, SBI_FOUNDATIONS-labels) verwijderd (huisregel).
- Verificatie: engine 136/136, web build groen. Open: naamkeuze (memo §5) en de naamafhankelijke vervolgtaken (titel, eyebrow, embed-copy, style-guide, C3-koppeling).

**Aanleiding:** BLOK B-taak B8 (02_VERBETERPLAN). De grades (A/B/C/D) zaten al in registry en breakdown, maar de UI toonde ze nergens; per indicator ontbrak een eerlijke duiding van wat het bewijs wel en niet draagt.

**Beslissingen:**

- plain-language.ts: nieuw veld `evidenceNote` voor alle 25 indicatoren, geschreven volgens 03_REFERENTIE_BRONNEN_GRADING.md (oud wetenschapspakket): expliciet over niveau (individueel vs bevolking), proxy-afstand en beperkingen; overschrijdt de gelinkte bronnen niet. Grades zelf NIET gewijzigd (per amendement gepind; hergraderen zou een nieuw amendement vergen).
- Breakdown (21) en context_signals (4) dragen nu `evidence_note` (context ook `grade`); UI: bewijskracht-chip per rij (IndicatorList), Bewijskracht-blok met badge + note (IndicatorDetail, dus ook TopInfluences), grade + note bij de kalendercontext (ContextSignals), legende in de lijst-footer. Grade D blijft buiten de publieke lijst (bestaande gedocumenteerde keuze).
- Claim-correctie: de copy van I-D5-001 beweerde "telt mee met een gereduceerd gewicht", maar het publieke cijfer gebruikt gelijke domeingewichten; de reductie geldt alleen in het parallelle evidence-controleschema. Copy herschreven; de legende legt expliciet uit dat de grade bewijskracht beschrijft, geen gewicht in het hoofdcijfer.
- Huisregel afgedwongen: em-dashes verwijderd uit user-facing bronnamen/labels in plain-language.ts; nieuwe testsuite test/evidence.test.ts (5 tests) pint notes aanwezig + "telt niet mee"-eerlijkheid voor D/context + geen gewichtsclaim + geen em-dash.
- Verificatie: engine 136/136 (was 131, +5), web build groen, smoketest generate-fixture: 21 breakdown-entries en 4 contextsignalen dragen note/grade; CI-data teruggezet.

**Aanleiding:** BLOK B-taak B1 (02_VERBETERPLAN). De code had sinds de reviewfix van §4.1 al de robuuste fallback-keten, maar doc 04_Laag-5 beschreef nog de simpele MAD-z uit v0.2.

**Beslissingen:**

- Doc 04 §2.6 (nieuw) documenteert de geïmplementeerde keten: MAD ×1.4826 → IQR/1.349 → SD → NaN (MIN_SCALE 1e-6), de geen-schaal-semantiek (nooit ±∞, nooit stille 0), de vlakke-baseline-splitsing (op/onder mediaan = gemeten z=0; erboven = "ontbreekt"), MIN_HISTORY_FOR_Z = 30 (v0.2) vs MIN_POINTS_FOR_Z = 8 (v0.4, maandbronnen) en de bewerkingsvolgorde (STL → baseline → Z → splitsing → inverse → winsor).
- Doc 04 §4.1 legt WINSOR_BOUND = 3 vast als gedeelde constante (winsorize.ts, beide lagen) met motivatie (conservatief afkappunt per Leys et al. 2013; dominantie-begrenzing bij 20 indicatoren); de eerlijke disclaimer dat ±3 conventioneel is blijft staan, laag 8 toetst de gevoeligheid.
- Geverifieerd: geen code-wijziging nodig; engine 131/131 groen.

---

## 2026-06-12 — Amendement: tier dagelijks reactief (Peter GO, methodologie 0.3.1)

**Aanleiding:** Peter wil dat het advertentievenster per dag reageert op de 2-jaarsnorm in plaats van na 3 dagen vasthouden. De 3-dagen-regel maakte de banner traag (backtest 97,7% groen) en live zichtbaar inconsistent (12 juni: scherm "LAAG" op percentiel 42 terwijl de banner nog "Venster opent" toonde uit het 3-dagen-geheugen).

**Beslissingen:**

- tier.ts SUSTAINED_DAYS 3 → 1: oranje zodra dagpercentiel >= P70, rood zodra >= P90; afschalen dezelfde dag. Drempels en norm (seizoensbewust 24-maands percentiel) ongewijzigd.
- Verwacht gevolg, per definitie van het percentiel: venster open op ~30% van de dagen, waarvan ~10% piek; drempel is met één constante bij te stellen (P75 → ~25%, P80 → ~20%) als de campagne-frequentie te hoog blijkt.
- Cijfer, label en banner zijn nu per dag onderling consistent; brand-safety-override (CN 5) blijft onverkort.
- Web-copy bijgewerkt (Methodology stap 5, TIER_SUBLINE, ZView-voetnoot, PreviewPage-notities); doc 06 §3 geannoteerd, §3.5 blijft als historiek; 00_Pre-Registratie §4.1.5.

---

## 2026-06-12 — Amendement: I-D2-009 herdefinitie naar Infrabel-vertragingsgraad (Optie B, Peter GO)

**Aanleiding:** de iRail-verstoringsteller had op go-live-datum maar ~14 echte historiepunten; eerlijk scoren kon pas eind juli (Optie A). Peter koos Optie B: herdefinitie naar een bron met jaren echte daghistorie.

**Beslissingen:**

- **Maat:** vertragingsgraad % = aandeel treinmetingen met >= 6 min aankomstvertraging, officiële-meetset-benadering (per trein eerste Brussel-aankomst, anders eindbestemming), aankomsten vóór 20:00. Grade blijft B (bronkwaliteit steeg, stress-bewijs niet — geen stille gewichtswijziging).
- **Live:** nieuw pipeline/fetchers/infrabel.py op "stiptheid-van-vandaag-per-uur" (geen sleutel). Ladder: einddagcijfer (run om/na 20u, gaat de cache in) → gecachte volledige meetdag D-1 (eerlijke observation_date) → intraday-partieel (imputed) → mock. Het dode "ruwe-gegevens-van-stiptheid-d-1"-endpoint uit het referentiepakket is vervangen door deze werkende combinatie.
- **Baseline:** scripts/backfill_infrabel_baseline.py reconstrueert dezelfde maat per dag uit 13 maandelijkse ruwe bestanden (mei 2025 t/m mei 2026); constanten gedeeld met de fetcher (schaaldiscipline by construction). Empirische ijking: mei 2026 reconstructie 7,63% vs officieel 7,61%; maanddelta's mei-okt 2025 tussen -0,53 en +0,27 pp zonder systematische richting; het script valideert elke maand en weigert bij afwijking > 0,75 pp (tolerantie uit die delta-verdeling afgeleid). De oude iRail-reeks (andere schaal) is VERVANGEN, niet gemengd.
- **iRail-teller** loopt door als secundair signaal I-D2-009S (eigen cache-key en historie; healthcheck-inventaris 18 primair + 12 secundair).
- Zie 00_Pre-Registratie §4.1.4 en 02_Laag-3 §10 voetnoot 8.

---

## 2026-06-12 — Reviewfixes BLOK A (adversariële multi-agent-review, 18 bevindingen)

**Aanleiding:** onafhankelijke review van de BLOK A-commits bevestigde 2 unieke majors en een reeks kleinere eerlijkheids- en consistentiepunten.

**Beslissingen:**

- **achtergrond/load_factor dekkingsonafhankelijk gemaakt:** de A1-hernormalisatie deelde de grondlast-deelsom door het gewicht van ALLE aanwezige kern-codes, waardoor de triggerdrempels meebewogen met de dekking van niet-grondlast-bronnen (tot 2,26x gevoeliger bij schaarste). De achtergrond hernormaliseert nu binnen de grondlast-subset en herschaalt naar het volledige-dekking-aandeel; bij volledige dekking identiek aan de oorspronkelijke formule. Invariantietest toegevoegd.
- **Cache-vangnet publiceert de echte observatieperiode:** een gecachte waarde kreeg observation_date = vandaag (valse versheid). cache.put bewaart nu de periode, nieuw cache.get_with_date geeft hem terug, en de vijf geraakte fetchers (nbb, statbel x2, consumer_confidence, fod_waso, irail) geven hem door. Bestaand cache.get-contract (o.a. gdelt) ongewijzigd; de overige cache-fetchers volgen in een latere ronde.
- **Strict-real labelt niet-geleverde codes niet langer als simulated:** in SBI_STRICT_REAL-modus wordt niets gesimuleerd, dus is de simulated-lijst leeg; niet-geleverde codes zijn eerlijk "ontbreekt". Anders zou de HARDE-EIS-check op go-live onwaar alarm slaan.
- **Demografische noemer:** grade-D-reach (I-D3-003) uit de TOTAL_REACH-noemer (composiet was circa 3,3% gedeflateerd).
- **percentile_lang = null** in het vlakke-baseline-geval (er is geen percentiel berekend; 0 suggereerde "laagste ooit").
- **Embed-banner respecteert het demolabel:** banner.js rendert geen commerciële banner wanneer score_label "demo" is.
- **Doc 06 en doc 04 geannoteerd met het A6-amendement** (composietformule over 5 gescoorde domeinen); user-facing copy gepreciseerd: niet "de kalender telt niet mee" maar exact de vier D6-signalen, met expliciete vermelding dat daglicht, werk-deadlines en schoolvakantie voorlopig wel meetellen; em-dash uit nieuwe copy; ContextSignals toont nu ook bron en referenties per signaal.
- **Bekende beperkingen, bewust gedocumenteerd, niet gefixt:** (1) de compute-daily-bridge mengt pre-0.3.0-composietwaarden in composite-history.json; het productiepad (generate-fixture) herrekent per run en is niet geraakt; (2) tot de eerste deploy na deze commits checkt de monitor de oude live-site (25 entries) tegen de nieuwe verwachting (21) en kleurt rood; lost zichzelf op bij de eerstvolgende deploy.

---

## 2026-06-11 — BLOK A (SBI-verbeterplan) + documentatie-regularisatie

**Aanleiding:** interne review (SBI-verbeterplan BLOK A): scoringslekken, oneerlijke labels en niet-geregulariseerde pre-registratie-afwijkingen.

**Beslissingen:**

- **A1 — v0.4-schaarste eerlijk behandeld** (commit 51faa64): een ontbrekende v0.4-kernindicator telt als "ontbreekt", niet langer als z=0; het kern-composiet hernormaliseert over de aanwezige codes.
- **A3 — registry als single source of truth** (commit e9a4309): `app/engine/src/indicators/registry.ts` is de enige bron voor de indicatorset; synchronisatietest bewaakt web-copy en pipeline-constanten; publish-helper toegevoegd; lek in compute-daily gedicht.
- **A6 — kalenderdomein D6 naar contextlaag** (commit 0037ea9, methodologie 0.2.0 naar 0.3.0): de 4 D6-kalenderindicatoren (I-D6-001/002/003/005) tellen niet meer mee in composiet en condition_level; ze verschijnen als `context_signals` naast het cijfer. Equal-domeingewicht van 1/6 naar 1/5; Schema-2-tabel bevroren als historiek, actieve gewichten pro rata hernormaliseerd over D1-D5 (deling door 0.832); demografische TOTAL_REACH-noemer zonder contextcodes. Zichtbaar gevolg: composiet van 0.13 naar circa -0.11, amber-banner gedoofd (de examens-bijdrage met z=3 was de drijver). De bevroren v0.4-kern bevat geen D6 en is ongemoeid. Gemotiveerde scopekeuze: I-D1-001 (daglicht), I-D4-001 (deadlinepieken) en I-D4-002 (schoolvakantie) zijn ook deterministisch maar blijven voorlopig gescoord; heroverweging bij BLOK B / construct-herziening.
- **A7 — demo-aandeel eerlijk gelabeld** (commit 360fac3): `data_quality` krijgt `demo_fraction` en `score_label` ("demo" bij een gewogen demo-aandeel van 30% of meer); demo-banner in de UI.
- **A2 — documentatie-regularisatie** (deze wijziging): pre-registratie-amendementen retroactief en expliciet vastgelegd in 00_Pre-Registratie.md §4.1; inclusielijst 02_Laag-3 §10 gesynchroniseerd met de registry (25 geregistreerd: 20 gescoord, 4 kalendercontext, 1 diagnostisch); totaal-zinnen in 03, 05, 07 en README bijgewerkt; dit CHANGELOG aangemaakt. De 30-dagen-aankondigingstermijn (00 §13) is voor de eerdere wijzigingen niet vooraf gevolgd; dat staat nu expliciet in de documenten in plaats van verzwegen.

---

## 2026-06-03 — Amendement I-D3-007 Consumentenvertrouwen

**Aanleiding:** wijzigingsgrond A2 (datatoegang): maandelijks voorlopend enquête-sentiment beschikbaar via Eurostat.

**Beslissing** (Peter GO, commit 0cefc23): I-D3-007 Consumentenvertrouwen toegevoegd als gescoorde D3-indicator, grade B. Bron: Eurostat ei_bsco_m (BS-CSMCI). Inverse-coded: hoog vertrouwen betekent lage stress. Geen STL (bron is al seizoensgecorrigeerd). Zit niet in de nieuws-laag, dus geen dubbeltelling met D5. Backfill: 197 maandpunten 2010-2026.

---

## 2026-06-02 — Evidence-review §3: grade-overrides + twee scoringsfixes

**Aanleiding:** externe methodologische review (§3) van de evidence-grades en de percentielberekening.

**Beslissingen:**

- **Grades A/B/C/D ingevoerd, twee indicatoren uit het cijfer** (commit 62a0d10): I-D3-003 Aangekondigde collectieve ontslagen van A naar D (de feed is een werkloosheidsgraad-proxy, geen echte ontslag-aankondigingsdata) en blijft alleen diagnostisch zichtbaar; media-indicatoren initieel op D.
- **Peter overrulet review voor D5** (commit b81ade1): I-D5-001 Nieuwsnegativiteits-index en I-D5-002 Wikipedia-aandacht stress-thema's terug in het cijfer op grade C (gereduceerd gewicht in het evidence-schema). Bewuste, gedocumenteerde afwijking van de regel dat grade C naar de secundaire set gaat. I-D5-001 scoort tegen de bevroren GDELT-baseline.
- **Lookahead-lek gedicht** (commit 5ab84b8): `buildPercentileHistory` gebruikte toekomstige datapunten in de historische percentielen; gefixt.
- **Seizoens-bewust percentiel** (commit 7d78dfa): publiek cijfer op seizoens-bewust percentiel, deterministisch, met carry-forward zonder demping.

---

## 2026-05-21 — Laag-3-amendementen: vier nieuwe indicatoren + bronwissel I-D5-002

**Aanleiding:** wijzigingsgrond A2 (datatoegang): nieuwe machine-leesbare Belgische en Europese bronnen beschikbaar; Google Trends bleek geblokkeerd voor geautomatiseerde afname.

**Beslissingen:**

- **Vier indicatoren toegevoegd** (commit 8bb4378, telling 20 naar 24): I-D1-009 Wateroverlast (VMM Waterinfo.be + SPW Wallonië), I-D1-010 Pollen (Copernicus CAMS; vervangt secundaire I-D1-005S Pollenconcentratie), I-D2-009 Treinverstoringen (iRail API, NMBS/Infrabel), I-D3-009 Stroomnet-druk (Elia Open Data). Alle grade B.
- **Bronwissel I-D5-002** (commit a73023b): "Google Trends stress-termen" vervangen door "Wikipedia-aandacht stress-thema's" (Wikipedia-pageviews, Wikimedia REST API).

De 30-dagen-aankondiging is voor deze wijzigingen niet vooraf gevolgd; retroactief geregulariseerd op 2026-06-11 in 00_Pre-Registratie.md §4.1.
