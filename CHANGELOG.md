# CHANGELOG — Stressor-Blootstellings-Index (SBI)

Audit-trail per 08_Onderhoud-Protocol.md §5.6: elke wijziging gelogd met datum, aanleiding en beslissing. Nieuwste entries bovenaan.

Eerlijke noot bij de start van dit logboek: dit bestand is aangemaakt op 2026-06-11. De entries vóór die datum zijn retroactief gereconstrueerd uit de git-historie en commit-berichten van de app. De wijzigingen zelf zijn op het moment van invoering in commits gedocumenteerd, maar het formele wijzigingsproces (30-dagen-aankondiging, adviesraad-consultatie per 08 §5.3-5.4) is voor geen van deze wijzigingen vooraf gevolgd; er is op dit moment ook nog geen adviesraad, dus dissenting opinions ontbreken. Zie 00_Pre-Registratie.md §4.1 voor de formele regularisatie.

---

## 2026-06-14 — Amendement §4.1.8: afvlakking van het gepubliceerde percentiel (7-daags trailing gemiddelde), methodologie 0.3.4 (Peter GO)

**Aanleiding:** uitvoering van de afvlak-fix na de whipsaw-diagnose (zie vorige entry). Peter koos het 7-daagse venster.

**Wijziging:** het gepubliceerde dagpercentiel rust niet langer op het ruwe dagcomposiet maar op het **7-daags trailing gemiddelde** ervan, tegen de evenzo afgevlakte referentiehistorie (afgevlakt tegen afgevlakt). Consistent over de hele keten: percentiel, tier/campagnelogica, B3-bootstrap-band (elke trekking afgevlakt met de vaste voorgaande dagen) én de referentie-audit. Lookahead-vrij. Nieuwe module `methodology/smoothing.ts`.

**Transparantie:** het ruwe dagcomposiet blijft in de output (`composite.equal`) naast het afgevlakte (`composite.equal_smoothed`); `percentile.smoothing_window_days = 7`. De media-bijdrage-diagnostiek blijft like-for-like op de ruwe basis.

**Effect (smoketest):** dag-tot-dag-percentielsprong van gemiddeld ~15 naar ~3 (max 54 → 20), ~5× stabieler; de laatste 7 dagen lopen vloeiend (24→24→30→35→37→34→39) i.p.v. te whipsawen. Een echte brede stressbeweging blijft volledig doorkomen — ruis gedempt, geen signaal. Referentie-audit bevestigt: het afgevlakte percentiel is reproduceerbaar tegen de afgevlakte referentie, niet overgevoelig.

**Discipline:** methodology_version 0.3.3 → **0.3.4**; amendement §4.1.8 + doc 06 §2.1-notitie + manifest. Engine **182/182** (nieuw `smoothing.test.ts`, 8 tests). Pipeline 11 suites groen. Reikwijdte: v0.2-publiekspad nu; v0.4-`percentile.lang` krijgt dezelfde afvlakking bij go-live als publieke kop.

---

## 2026-06-14 — Echte oorzaak van het whipsawen gevonden: composiet is bijna pure dagruis; afvlakking is de fix (analyse)

**Aanleiding:** Peter zag het percentiel van pieken (56-80) terugvallen naar 6/100 en eiste consistentie ("er klopt iets niet, zoek"). Dit is een ander, scherper probleem dan de aggregatie: de DAG-TOT-DAG-stabiliteit van het publieke cijfer.

**Diagnose (live + dump):**

- Live sparkline (30d): gemiddelde dag-tot-dag-percentielsprong **14,7**, max **54** (26 mei +54 op één dag; 23-26 mei 52→8→10→64). Onbruikbaar volatiel voor een publieke barometer.
- Kernoorzaak: de composiet-**dag-tot-dag-sd (0,166) ≈ de TOTALE sd (0,179)** — er is vrijwel geen persistentie; het composiet is bijna pure dagruis, elke dag los van de vorige. Het krappe percentiel vergroot dat uit.
- Drijvers (gem |Δz| per dag): nieuws I-D5-001 **0,92**, stroomvraag I-D3-009 **0,83**, gebeurtenissen I-D5-003 **0,78**, treinen I-D2-009 **0,71**, lucht I-D1-004 **0,71**. De macro-indicatoren staan dag-tot-dag vrijwel stil. Vijf snelle bronnen whipsawen de barometer.

**Fix (geprototyped):** een voortschrijdend gemiddelde van het composiet vóór het percentiel (referentie ook afgevlakt). `app/pipeline/analysis/smoothing_prototype.py` meet de stabilisatie: 3d snijdt de dag-sprong 2,0×, **7d 3,0×** (composiet dag-sd 0,166→0,034), 14d 3,9×, 21d 4,9×. Een barometer meet zo weer een traag evoluerende toestand i.p.v. nieuws-/stroomruis. Stabiliseert ook de campagne-trigger (die nu op één ruisdag kan vuren).

**Status:** afvlakken verandert het gepubliceerde cijfer → pre-registratie-amendement (harde regel 4), wacht op Peters keuze (ven*sterlengte = stabiliteit vs reactiviteit). NB: één bijvangst om apart te bekijken — stroomvraag I-D3-009 (0,83 dag-volatiliteit) is mogelijk niet weekdag-/weer-gecorrigeerd en meet dan deels "weekend/koude dag" i.p.v. stress.

---

## 2026-06-14 — CISS-prototype getest en VERWORPEN voor SBI: zonder co-beweging is er niets te versterken (analyse)

**Aanleiding:** vervolg op het aggregatie-variantie-onderzoek. Peter GO om een CISS-achtige (correlatie-bewuste) aggregatie te prototypen met backtest, om te zien of die het composiet realistischer/waardevoller maakt.

**Gebouwd:** `app/pipeline/analysis/ciss_prototype.py` — domein-subindices (5 domeinen), EWMA tijd-variërende correlatiematrix, CISS = (w∘s)' C_t (w∘s) (Holló-Kremer-Lo Duca), vergeleken met het huidige domein-gelijk-gewogen composiet over 329 dagen + een gecontroleerde synthetische test.

**Bevinding — CISS helpt NIET voor SBI, en kan zelfs averechts werken:**

- Backtest: op systemische dagen (≥3 domeinen hoog, n=34) CISS-percentiel 87,6 vs equal 86,7; op geïsoleerde pieken (n=92) 34,4 vs 32,6. CISS en equal correleren 0,79 — nauwelijks verschil.
- Synthetisch (zelfde totale stress, anders verdeeld): "1 geïsoleerde piek" geeft CISS 0,086, "systemisch gespreid" 0,077 — CISS beloont de geïsoleerde piek, het OMGEKEERDE van de bedoeling.
- **Oorzaak:** CISS versterkt co-beweging via de correlatiematrix. De SBI-domeinen zijn structureel ONGECORRELEERD (gem. correlatie −0,015; een hittegolf correleert niet met een economische schok), dus C_t ≈ identiteit en CISS degenereert tot Σw²s² — een som van kwadraten die juist concentratie (één piek) beloont. CISS werkt voor financiële markten omdat correlaties dáár in een crisis naar 1 schieten; bij onafhankelijke maatschappelijke stressoren is er geen correlatiestructuur om uit te buiten.

**Conclusie (eerlijk):** de lage variantie is FUNDAMENTEEL bij onafhankelijke stressoren — geen aggregatie haalt signaal terug dat er niet is. Het gelijk-gewogen gemiddelde is daarmee de juiste keuze: het negeert (terecht) geïsoleerde pieken en reageert juist sterk op échte brede stress (alle indicatoren +1 → composiet +1 ≈ 5,5 sd boven de ruisvloer → percentiel ~100). De index schreeuwt dus wél bij een echte systemische gebeurtenis. Het prototype heeft een verkeerde wijziging voorkómen.

**Aanbeveling:** aggregatie NIET wijzigen. Resterende, data-gedragen "consistentie"-optie als Peter dat wil: een BREEDTE-poort op de campagne-trigger (alleen vuren als ≥N domeinen tegelijk verhoogd zijn) — een kleine, verdedigbare toevoeging die systemische breedte eist zónder het publieke cijfer te raken; dat is een aparte trigger-amendement-beslissing. Caveat: het venster bevat geen echte crisisperiode; mocht een crisis wél cross-domein-correlatie opwekken, dan zou CISS daar herbeoordeeld moeten worden met crisis-dagdata (die nu ontbreekt).

---

## 2026-06-14 — Aggregatie-variantie-onderzoek: het gelijk-gewogen composiet is ~96% uitmiddeling, ~4% echte samenhang (analyse, geen wijziging)

**Aanleiding:** Peter vroeg of ~20 indicatoren elkaar niet te sterk uitvlakken — of het gelijke gewicht te veel signaal wegwast, en eiste een onderzoek met consistentie ("dit is niet realistisch en waardevol").

**Bevinding (rigoureus, faithfull tegen de engine-z's, 20 gescoorde indicatoren / 329 dagen):**

- Gemiddelde paarsgewijze correlatie tussen de indicatoren: **−0,015** (vrijwel nul). Multicollineariteit-audit (B6): 0 paren |rho|≥0,70, participatieratio 12,6/18.
- Composiet-sd **0,179** ≈ onafhankelijkheids-floor **0,176** (= 1/√N bij nul correlatie). **Slechts ~4% van de dag-tot-dag-composiet-variantie komt uit echte samenhang; ~96% is het statistisch uitmiddelen van onafhankelijke signalen** (portefeuille-/diversificatie-effect).
- Dag-coherentie |mean z|/mean|z| = **0,18**: op een gemiddelde dag valt ~82% van het bruto-signaal tegen elkaar weg. Een sterk los signaal (pollen z=+3) draagt maar +3/20 ≈ +0,14 aan het composiet, binnen de normale ruisvloer.

**Interpretatie (eerlijk, met de advocaat van de duivel):** dit is deels het ONTWERP — een brede-druk-index hoort niet door één indicator te schieten; de lage variantie is robuustheid. Een ECHTE systemische gebeurtenis (veel indicatoren die samen bewegen) zou de samenhang-term wél laten pieken en registreren. Maar op normale dagen rangschikt het percentiel grotendeels ruisvloer-wiebel — vandaar dat een rustige dag een willekeurig-aanvoelende lage waarde geeft.

**Geleverd:** `app/pipeline/analysis/aggregation_variance.py` (herbruikbare B-block-audit, schrijft `app/data/analysis/aggregation_variance.json`) + een env-gated diagnostische z-reeks-dump in `generate-fixture.ts` (`SBI_DUMP_Z=1`, nul kosten in productie). Het script vergelijkt ook twee consistentie-bewuste aggregaties die NIET wegmiddelen (`C_breadth` = netto-aandeel verhoogd; `C_rms` = getekende RMS, sd 0,94 = 5× meer behouden signaal, corr 0,79 met equal).

**Niet gedaan (bewust):** de live-aggregatie is NIET gewijzigd. Een andere aggregatie (bv. CISS-correlatie-weging à la Holló-Kremer-Lo Duca — al de bron voor de eCDF — die amplificeert bij co-beweging en dempt bij geïsoleerde ruis) raakt de pre-registratie (harde regel 4) en hoort via een amendement + een backtest over een echte stressperiode, niet via een stille omschakeling. Dit script is de bewijsbasis voor die beslissing.

---

## 2026-06-14 — Automatische referentie-audit: elke cyclus zelf-controle of het cijfer tegen een consistente referentie staat (Peter GO)

**Aanleiding:** Toen het cijfer onverwacht laag stond, moest een mens (ik) handmatig nagaan of de dag wel tegen een CONSISTENTE referentie werd vergeleken (geen appels-met-peren door een methodologie-wijziging) en of de lage waarde echt was of een artefact. Peter: bouw dat soort controle in zodat het automatisch elke cyclus gebeurt na fetch + verwerking.

**Beslissingen:**

- Nieuwe engine-module `methodology/reference-audit.ts`: `auditReferenceConsistency` reproduceert het gepubliceerde dagpercentiel uit zijn eigen seizoensreferentie (gedeelde helper, dus exact dezelfde set als `seasonalPercentile`) en weegt af op vier assen — **reproduceerbaar** (gepubliceerd == herberekend; zo niet → het cijfer staat tegen een andere referentie dan het record beweert), **niet-degeneraat** (sd > 0), **seizoensmatch** (geen volledige-historie-terugval), **overgevoelig** (extreem percentiel ≤10/≥90 terwijl |z t.o.v. referentie-midden| < 0,5 = fragiel, lage-variantie-vergrootglas). Stempelt de methodologie-versie.
- `runtime.ts` voegt het blok `reference_audit` toe aan elke output; `types.ts` mee. De canary (`healthcheck.py`, laag 2-bis) leest het verdict: `critical` (niet-reproduceerbaar/degeneraat) breekt de run rood → alarm via de bestaande keten; `degraded` (dun/cross-seizoen/overgevoelig) is een zichtbare notitie en zet ook het canary-verdict op degraded.
- Doc 08 §1-bis uitgebreid met laag 2-bis; manifest herberekend.
- Verificatie: engine **174/174** (nieuw bestand `reference-audit.test.ts`, 6 tests: reproduceerbaar/niet-reproduceerbaar/degeneraat/overgevoelig/dun/integratie); pipeline **11 suites** incl. 4 nieuwe healthcheck-tests (backward-compatible, ok, critical-escalatie, degraded-escalatie); end-to-end gedraaid (engine → canary leest de audit). Nevenbevinding: de referentie-sd is ~0,24 — vandaag (−0,20, P6) ligt ~1,1 sd onder het seizoensmidden, dus een echte afwijking, geen overgevoeligheids-artefact (audit bevestigt: niet hypersensitive).

---

## 2026-06-14 — Scorekaart-uitlijning: kicker op de meterlijn + openingszin in balans (Peter, cosmetisch)

**Aanleiding:** Peter, twee uitlijn-wensen op basis van schermafbeeldingen.

**Beslissingen (alleen CSS, geen gedrag/data):**

- Kicker (RUSTIG/NORMAAL/…) op de verlengde van de meterlijn: de meterkolom is track + as, dus center-uitlijning zette het woord op de as. `transform: translateY(-10px)` tilt het naar het hart van de balk (gereset in de mobiele gestapelde layout).
- Openingszin onder de merknaam met `text-wrap: balance`: twee even lange regels in plaats van een korte stub-regel. Visueel geverifieerd.

---

## 2026-06-14 — Percentielzin noemt de 2-jaars-groundroot; zichtbare bandbreedte-regel weg (Peter)

**Aanleiding:** Peter, twee aanscherpingen op de scorekaart: (1) de referentieperiode terug in de percentielzin ("in vergelijking met 2 jaar terug"); (2) de regel "Bandbreedte (90% zeker): X tot Y." weg.

**Beslissingen:**

- Percentielzin: "Vandaag hoger dan op X% van de dagen rond deze tijd van het jaar, **gemeten over de laatste twee jaar**." Maakt de 24-maands-groundroot (= `short_24m`) expliciet, naast het ±45-daags seizoensvenster.
- Zichtbare bandbreedte-regel verwijderd. De onzekerheid blijft als **90%-band in de meter** (primaire visuele weergave). Voor schermlezers (de meter is `aria-hidden`) blijft de band als `sr-only`-tekst behouden, zodat een score nooit zónder onzekerheid wordt uitgeleverd — het principe achter de v0.4-CI-bouw blijft intact. Bij `thin_reference` luidt die tekst "indicatief bereik".
- Dode CSS opgeruimd (`.cn-uncertainty-band` verwijderd, `.sr-only` toegevoegd). Doc 07 §13-bis bijgewerkt; manifest herberekend. Verificatie: web bouwt, tsc schoon, screenshot (2-jaars-zin zichtbaar, bandbreedte-regel weg). Geen engine-/datawijziging.

---

## 2026-06-14 — Niveauschaal relatief + band-bewuste kicker + mediaan-scharnier op de meter (Peter GO)

**Aanleiding:** Peter, na het advocaat-van-de-duivel-overleg over de woordenschat: (1) de kicker-woorden moeten relatief en consistent; "GEMIDDELD" voor P50-70 is oneerlijk want dat ligt al boven de mediaan; (2) de weergave moet al bij de mediaan reageren; (3) toon dat ook op de kleurbalk; (4) band-bewuste kicker (eerder goedgekeurd).

**Beslissingen:**

- **Relatieve woordenschat** (één register, vervangt LAAG/GEMIDDELD/VERHOOGD/EXTREEM): **RUSTIG < 50 ≤ NORMAAL < 70 ≤ VERHOOGD < 90 ≤ UITZONDERLIJK**. Relatief omdat het cijfer een percentiel-anomalie is, niet een absolute meting; "RUSTIG/NORMAAL" sluiten aan op de CN-namen, "UITZONDERLIJK" op het indicator-woord. `copy.ts BAND_LABEL` is de enige bron; `kickerWord` gebruikt nu `scoreBand`+`BAND_LABEL` (drempel-duplicaat verwijderd).
- **Band-bewuste kicker:** kruist de 90%-band een niveaugrens, dan toont de kicker het bereik ("RUSTIG TOT VERHOOGD") i.p.v. één woord dat het eigen interval tegenspreekt (IPCC-kalibratie). Binnen één niveau één woord. Hoofdcijfer blijft altijd één getal op 100. Nieuwe `cn-kicker-range`-stijl (compacter, afbreekbaar) — visueel geverifieerd: bereik wrapt netjes over twee regels.
- **Mediaan-scharnier op de meter:** de groene zone gesplitst in rustig (0-50, lichter) en normaal (50-70, dieper groen), zodat de mediaan zichtbaar is als kantelpunt. Amber 70-90, rood blijft alleen de top-10% (merkkeuze rust = groen behouden).
- **Bewust NIET gewijzigd (advocaat van de duivel):** de campagne-/trigger-drempel blijft P70/P90. "Reageren bij de mediaan" geldt alleen de wéérgave (woord + kleur); de campagne bij P50 laten vuren zou ~50% van alle dagen "verhoogd" maken en de anomalie-betekenis breken — dat vergt een apart, expliciet pre-registratie-amendement en is afgeraden. De campagnebanner staat op de publieke site sowieso uit.
- Doc 07 §13-bis bijgewerkt; manifest herberekend. Verificatie: web bouwt, tsc schoon, twee screenshots (RUSTIG enkelvoudig + RUSTIG TOT VERHOOGD bereik). Geen engine-/datawijziging.

---

## 2026-06-13 — v0.4-onzekerheid: bootstrap-CI rond percentile.lang; onzekerheids-black-out opgeheven (Peter GO na advocaat-van-de-duivel-overleg)

**Aanleiding:** open beslispunt uit de adversariële review. Zodra de campagne live gaat stuurt de v0.4-kern de publieke kop, maar er bestond geen v0.4-CI — `ConditionLevelDisplay` onderdrukte dan élke onzekerheidsweergave (black-out), precies op de dag van maximale exposure. Overlegd met de advocaat van de duivel; uitkomst: niet ontkoppelen (P4) of accepteren (P1), maar de CI bouwen (P3) — de bootstrap-infrastructuur stond er al.

**Beslissingen:**

- `methodology/bootstrap.ts`: `bootstrapDayUncertainty` gegeneraliseerd met een optionele `aggregate`-callback (default = equal-composiet, dus v0.2 volledig ongewijzigd). De v0.4-aanroep geeft `compositeMeting` mee (kern-gewichten), zodat band en getal op dezelfde maat staan.
- `runtime.ts computeV04`: verzamelt per gescoorde kern-indicator de (effectiveValue, lange-baseline)-paren en berekent `v04.uncertainty` rond `percentile.lang`, opt-in via `computeUncertainty` (al aan in beide productie-dagschrijvers). Eigen seed-suffix (datum + ":v04") zodat de v0.2- en v0.4-trekkingen niet correleren.
- `types.ts` + web `types.ts`: `V04Output.uncertainty` toegevoegd (vorm identiek aan `DailyOutput.uncertainty`).
- `ConditionLevelDisplay.tsx`: black-out vervangen — in live-modus leest de UI `data.v04.uncertainty`, anders `data.uncertainty`. Er is geen toestand meer waarin een score zonder band publiek gaat.
- Doc 07 §13-bis uitgebreid; manifest herberekend. NB: dit is een uitbreiding van de nog-niet-bevroren v0.4-laag (spec §8); bij de formele v0.4-go-live hoort deze grootheid in het §4.1-amendement dat die go-live vastlegt.
- Verificatie: 4 nieuwe tests (vorm, determinisme, eigen seed, afwezig zonder opt-in); engine **168/168**; smoke (testmodus, expert-output): percentile.lang 5, v04.uncertainty CI90 (2.1, 7.8), flag low, n_indicators 9, n_reference 730 — band omvat de score. Web bouwt; v0.2-weergave (vandaag zichtbaar) onveranderd.

---

## 2026-06-13 — STL-besluit (advocaat-van-de-duivel-overleg): werkelijke MVP-werking documenteren, geen hybride bouwen

**Aanleiding:** Peter vroeg wat "het meest correct" is voor STL op het gevensterde MAD-z-pad: echte-jaargangen tellen, STL uitschakelen, of een hybride op volle historie. Tweede adversariële ronde uitgevoerd; mijn eigen voorkeur (hybride STL op volle historie) is na verificatie verworpen.

**Beslissing: documenteren, geen code-wijziging (optie O2).** Twee gemeten feiten kantelden het besluit:

- De STL raakt vandaag **4 indicatoren, niet 7**: de maandbronnen I-D3-001/003/005 halen de gate (≥10 seizoenspunten binnen ±7 d uit voorgaande jaren) structureel niet en draaien de facto al op de ruwe waarde (geverifieerd: 0 seizoenspunten). STL is alleen echt actief voor I-D1-002/003/004 en I-D3-002.
- Het composietpercentiel is al seizoensgematcht (±45 d, 24 m). De indicator-STL is een tweede, lichtere correctie; de winst van een hybride op 2 cycli is marginaal en zou exact de stabiliteitsvoorwaarde van doc 04 §3.4 ("STL betrouwbaar bij ≥3 cycli") codificeren die ze wil respecteren.

De hybride (O3) is verworpen omdat hij pre-registratie-schuld maximaliseert voor een marginale winst; STL uitzetten (O1) is verworpen omdat het een werkende, geteste transformatie verwijdert vlak vóór go-live (prime directive: werkende kern niet blind herschrijven). Doc 04 §3.4 kreeg een eerlijke "werkelijke MVP-staat"-notitie (raakt ook harde regel 2: de docs suggereerden STL op maandbronnen terwijl dat niet draait). Schone herijking — STL op volle historie zodra ≥3 cycli, met amendement — gepland ~mei 2027. Manifest herberekend (doc 04 wijzigde). Geen engine-wijziging, dus gedrag identiek.

---

## 2026-06-13 — Adversariële review op verzoek van Peter ("advocaat van de duivel"): drie correcties, drie open beslissingen

**Aanleiding:** Peter vroeg een advocaat van de duivel op de wetenschappelijke houdbaarheid van de onzekerheidsweergave en de recente methodologiewijzigingen. Onafhankelijke adversariële review uitgevoerd (verdicten: onzekerheidsweergave HOUDBAAR MET AANPASSING; §4.1.7-vensters HOUDBAAR MET AANPASSING; testmodus-regel-verwijdering HOUDBAAR). Alle technische claims handmatig geverifieerd vóór verwerking.

**Direct gecorrigeerd (deze commit):**

- **§4.1.7-rationale was een mis-citatie van het eigen ankerpaper**: doc 01 §5.1 zegt juist dat cumulatieve blootstelling zwaarder weegt dan acute incidenten (McEwen), niet dat mensen hun "normaal" op recente ervaring ijken. Vervangen door een eerlijke spanningsnotitie (anomalie-index vs cumulatieve last; niveau-perspectief = v0.4 z_lang + halfjaarlijkse audit) + de claim "herstelt vergelijkbaarheid" afgezwakt naar "verbetert wezenlijk".
- **n≥30-poort stond op de verkeerde variabele**: checkte de ruwe historielengte, terwijl de z weegt tegen de post-STL-residuenset (die binnen het 24m-venster ~12 maanden beslaat omdat eerste-jaars-punten niet gedetrend kunnen worden). Poort verplaatst naar `baselineValues.length`. Smoke: geen gedragsverandering vandaag (alle STL-indicatoren hebben ≥30 residuen); de poort bewaakt nu wel het juiste aantal. Beperking expliciet gedocumenteerd in §4.1.7.
- **Stale artefacten**: comments die de oude bereik-weergave/ONZEKER-kicker beschreven + dode CSS-klassen (.cn-score-range, .cn-uncertainty-warning) opgeruimd; comment toegevoegd die de v0.4-onzekerheids-black-out als beslispunt vóór 22/6 markeert.

**Open beslissingen voor Peter (niet uitgevoerd, vergen GO):**

1. Band-bewuste kicker: als de 90%-band een niveaugrens kruist (bv. 48-71) doet het enkele niveauwoord een categorische claim die het eigen interval tegenspreekt (IPCC-kalibratieprincipe). Voorstel reviewer: "LAAG TOT VERHOOGD" tonen wanneer band-onder en band-boven een verschillend niveauwoord hebben. Raakt de weergaveregel "altijd één niveauwoord" (doc 07 §13-bis).
2. STL op het 24m-pad: echte-jaargangen-telling in de STL-gate, dan wel STL uitschakelen op het MAD-z-pad (seizoenswerk aan de eCDF-gate laten). Verandert z-scores; hoort via amendement.
3. Vóór go-live 22/6: (a) de geplande onzekerheids-black-out zodra v0.4 live de score levert (er bestaat nog geen v0.4-CI); (b) één disclosure-zin op de methodologiepagina (financiering Les Hautes Alpes + campagnemechanisme); (c) "90% zeker"-copy eventueel kwalificeren (interval dekt geen bron-/modelfouten). Gevoeligheidsanalyse uitbreiden met venstervarianten (60m, volle historie) kan bij de halfjaarlijkse audit.

---

## 2026-06-13 — Merknaam in June20-rood; testmodus-regel uit de footer (Peter, met schermafbeelding)

**Aanleiding:** Peter: de merknaam "De Nationale Stress Barometer" in het June20-signaalrood; de regel "Campagne-koppeling staat in testmodus. Er vuurt niets automatisch." weg. (De June20-bouwer-credit en de onzekerheids-waarschuwingszin op zijn schermafbeelding waren al verwijderd in de vorige commits; die wachtten alleen op de deploy.)

**Beslissingen:**

- `.hero-brand` kleur `#fff` → `var(--j20-red)` (#e6371e). De CN-kleurkoppeling blijft onaangeroerd: rust blijft groen/inkt, rood blijft als merk-/alarmaccent.
- Testmodus-melding (A5) uit de publieke footer: de campagne-CTA staat op de hoofdsite toch uit, dus de regel beschreef iets dat de bezoeker niet kan zien. De modus zelf blijft eerlijk zichtbaar in de API (`v04.mode` in latest-expert.json); de A3-gate-logica is intact en de melding kan met één regel terug bij de go-live-beslissing.

---

## 2026-06-13 — Amendement §4.1.7: geharmoniseerde recency-vensters MAD-z-baseline (Peter GO, methodologie 0.3.3)

**Aanleiding:** Peter: "moeten we niet elke indicator afzetten tov 2 jaar terug? is er anders een vertekende situatie?" Meting bevestigde de vertekening: zeven maand-/jaarbronnen wogen tegen 16-30 jaar historie terwijl dagbronnen tegen ~2 jaar wogen — zelfde meting kon van teken wisselen afhankelijk van de vensterdiepte (inflatie 4,1%: z +1,12 tegen 18 j vs −0,08 tegen 5 j; werkloosheid: −0,43 vs +1,35).

**Beslissingen (gekozen uit drie voorgelegde varianten):**

- Eén recency-principe: **dagbronnen rollend 24 maanden** (zelfde groundroot als het gepubliceerde 24m-percentiel), **maand-/jaarritmebronnen rollend 60 maanden** (n ≈ 60 voor stabiele MAD; strikt 24m zou met n ≈ 24 onder de 30-puntsdrempel duiken en die zeven bronnen uit de index gooien). Consistent met de pre-geregistreerde eCDF-drift-cap (5 jaar, §4.1.6).
- eCDF-pad ongewijzigd: de gate blijft de volle historie beoordelen (anders kan hij nooit openen); I-D5-003 blijft eCDF.
- Lookahead-veilig via de bestaande `sliceTrailing` (v0.4-helper, nu ook in het v0.2-pad); bootstrap hertrekt automatisch de gevensterde baseline; percentiel-referentie wordt per run door dezelfde engine herberekend en is dus venster-consistent.
- Amendement §4.1.7 + doc 04 §2.6-notitie + manifest herberekend; methodology_version 0.3.2 → **0.3.3**.
- Verificatie: 3 nieuwe venstertests gepind (maandbron 60m, dagpunten >24m uitgesloten, eCDF-gate ziet volle historie); engine **164/164**; smoke productiepad: niets valt uit, percentiel 40 → 34, CN blijft 1 (Rust).

---

## 2026-06-13 — Openingszin herzien, onzekerheids-waarschuwingszin weg, footer alleen afzender (Peter)

**Aanleiding:** Peter, drie UI-beslissingen in één bericht: (1) nieuwe openingszin; (2) de zin "De meting is vandaag onzeker: met 90% zekerheid ligt het cijfer tussen X en Y (de band in de meter)." moet weg; (3) de footer-credit wordt alleen "Een initiatief van Les Hautes Alpes".

**Beslissingen:**

- Openingszin (de bindende claim-mitigatie onder de naam) wordt: **"Deze index meet elke dag en elk uur hoe omstandigheden in heel België op mensen kunnen inwerken."** De mitigatie-kern (omstandigheden die KUNNEN inwerken, geen gemeten gevoelens) blijft intact; de meetfrequentie is nu expliciet; de "ongewoon zwaar"-duiding blijft beschikbaar via de percentiel-regel onder het cijfer. Doc 09-annotatie geactualiseerd. De zin was al gecentreerd (header-CSS), geen stijlwijziging nodig.
- Onzekerheidsweergave (derde aanscherping van doc 07 §13-bis): geen waarschuwingszin meer bij vlag high — in élke vlagtoestand dezelfde sobere regel "Bandbreedte (90% zeker): X tot Y." De eerlijkheidsnuance blijft: bij `thin_reference` staat er "Bandbreedte (indicatief)" omdat het interval die onzekerheid niet dekt. De 90%-band in de meter en alle JSON-velden ongewijzigd.
- Footer-credit op hoofdsite én PreviewPage: alleen "Een initiatief van Les Hautes Alpes"; de regel "Gebouwd door de JUNE20 Business Innovation OS" (incl. gereconstrueerd woordmerk) is verwijderd. `June20Mark.tsx` blijft in de codebase (ongebruikt) voor het geval de credit terugkeert.
- OSF-manifest herberekend (docs 07 en 09 wijzigden; nog niet geüpload). Verificatie licht gehouden op Peters aanwijzing: build groen + één preview-schermcheck (zin gecentreerd, waarschuwing weg, sobere band-regel zichtbaar).

---

## 2026-06-13 — HICP-migratie 2026: bevroren inflatiereeksen vervangen door de ECOICOP ver.2-opvolger

**Aanleiding:** Bron-audit op vraag van Peter ("werken alle databronnen?"). I-D3-001 (CPI) stond op observatie 2025-12 (194 dagen oud; de healthcheck vlagde dit al als zachte "stale"-notitie). Diagnose: Eurostat heeft de HICP per 2026 gemigreerd naar ECOICOP ver.2 (basis 2025=100); de oude reeksen — ECB SDW `ICP/M.BE.N.000000.4.ANR` én Eurostat `prc_hicp_manr` — zijn per 2025-12 officieel bevroren (catalogustitel: "(1997-2025)"). De fetcher werkte correct; de bron zelf stopte. Echte BE-inflatie mei 2026 = **4,1%**, niet de bevroren 2,2% van december.

**Beslissingen:**

- `statbel.fetch_cpi`: primaire bron naar **Eurostat `prc_hicp_minr`** (coicop18=TOTAL, unit=RCH_A) — zelfde meetgrootheid (BE HICP yoy %, officiële Europese statistiek), alleen de doorlopende opvolger-reeks; geen indicator-herdefinitie, pre-registratie ongewijzigd. `lastTimePeriod=3` omdat de nieuwste periode voor BE leeg kan zijn (publicatie-naijling); de parser pakt de laatste gevulde observatie (nieuwe test pint dit). Ladder (cache ≤14d → mock) ongewijzigd.
- `fod_economie`: brandstof-maandfallback (CP0722 yoy) en de lange indexreeks voor de I-D2-004-backfill naar dezelfde opvolger-dataset (unit **I15** = zelfde basis 2015=100 als de oude ECB-reeks; de €/l-verankering is bovendien ratio-gebaseerd, dus basisjaar-invariant). `ecb_fuel_eur_per_l_series` hernoemd naar `hicp_fuel_eur_per_l_series` (eerlijke naam), import in `backfill_fuel_baseline.py` mee.
- `backfill_macro_baseline.py` deelt nu URL én parser met de dagfetcher (schaaldiscipline, CLAUDE.md regel 5: baseline en dagwaarde uit exact dezelfde reeks).
- **Overlap-validatie oud↔nieuw vóór de switch:** 216 gedeelde maanden; recente 10 jaar identiek; 6 maanden (2008–2016) met max |Δ| = 0,1 pp (afrondingsrevisies) — geen schaalbreuk, ruim binnen de 0,75 pp-norm. Daarna **bewuste herbackfill I-D3-001**: 221 punten (2008-01 t/m 2026-05), incl. de maanden jan–mei 2026 die de bevroren bron nooit leverde.
- Eurostat-werkloosheidsfallback (`une_rt_m`) ook op `lastTimePeriod=3`: zelfde naijlings-bugklasse — met `=1` gaf de fallback None zodra de nieuwste maand voor BE leeg was, precies wanneer hij nodig is.
- Verificatie: ladder-suite 12/12 (incl. nieuwe naijlingstest), alle 11 pipeline-suites groen; live smoke: CPI 4,1 (2026-05), werkloosheid 6,2 (2026-04, LFSI-primair), brandstof-fallback +26,8% → €2,346/l (2026-04), indexreeks 364 punten 1996-01→2026-04.

---

## 2026-06-13 — Kicker altijd een niveauwoord laag → extreem; nooit "ONZEKER" (Peter)

**Aanleiding:** Peter (met schermafbeelding): naast de meter geen "ONZEKER" maar een niveauwoord op de schaal laag naar extreem, wetenschappelijk binnen de aanpak en de methodologie.

**Beslissingen:**

- De kicker volgt altijd de percentielband (P50/P70/P90, dagregel-conform): LAAG < 50 ≤ GEMIDDELD < 70 ≤ VERHOOGD < 90 ≤ **EXTREEM**. "Extreem" vervangt "hoog" als top-10%-label — zelfde register als de indicator-states (rustig/normaal/verhoogd/extreem) en de "uitzonderlijk hoog"-copy; het interne bandtype blijft ongewijzigd. Ook BAND_LABEL (TierIndicator) volgt, zodat één schaalwoordenschat overal geldt.
- Onzekerheid is geen niveau en krijgt dus geen kicker meer: ze blijft volwaardig zichtbaar via de 90%-band in de meter en de vetgedrukte bandbreedte-regel onder het cijfer. Doc 07 §13-bis geactualiseerd (weergavekeuze, data-velden onaangeroerd); CN 5 behoudt "EVEN OP PAUZE".
- Typografische fix: ontbrekende spatie vóór "(de band in de meter)" in de onzekerheidsregel (JSX-witruimteval).
- OSF-manifest herberekend (doc 07 wijzigde; nog niet geüpload).

---

## 2026-06-13 — Top-3 en kalendercontext achter uitklikbalken (Peter, met schermafbeeldingen)

**Aanleiding:** Peter: "Wat speelt vandaag het meest mee?" en het kalendercontext-blok moeten uitklikbalken worden zoals de balken lager op de site; het open contextblok mag van de pagina.

**Beslissingen:**

- Nieuw `CollapseBar`-component dat exact de bp-rij-stijl van ButtonPanels hergebruikt (zelfde klassen = gegarandeerd zelfde look/gedrag); beide blokken staan nu dichtgeklapt direct onder de scorekaart: "Wat speelt vandaag het meest mee?" en "Context - Niet in het cijfer".
- `TopInfluences` en `ContextSignals` kregen een `bare`-variant: binnen een balk levert de balk de titel, dus eigen kop/badge/paneelkader blijven daar weg (dubbelop). Buiten een balk (PreviewPage e.d.) renderen ze onveranderd.
- Inhoud, data en eerlijkheidscopy (lead, "telt niet mee"-notes, disclaimer, A6-uitleg) zijn ongewijzigd; alleen de verpakking is ingeklapt. Visueel geverifieerd in lokale preview (dicht + open: 3 top-items, 4 contextsignalen, geen dubbele koppen).

**Aanleiding:** Peter (13/6, met de June20-poster): header = "De Nationale Stress Barometer", nieuwe openingszin, "Meetgebied: België" onder de grote vraag, afzenders naar de onderste balk, en het JUNE20-woordmerk gereconstrueerd uit de poster (rest van de poster genegeerd).

**Beslissingen:**

- **Publieksnaam consistent "De Nationale Stress Barometer"** (header, browser-titel, meta-description, controle-stempel, embed-meta, stijlgids). NB: 12/6 was "Stress Index" gekozen; Peters header-instructie van 13/6 zegt expliciet "Barometer" — consistent doorgevoerd zodat header en overige plekken nooit uiteenlopen; één woord terugdraaien kan met dezelfde greep.
- **Header herschikt:** merknaam in de bovenbalk (June20-posterregister: Inter zwaar, caps, wit); LHA-logo, tagline en site-link weg uit de header. Openingszin in Peters formulering van 13/6: "Deze index meet hoe ongewoon zwaar de omstandigheden vandaag zijn die in heel België op mensen kunnen inwerken." (blijft de bindende claim-mitigatie: omstandigheden die KUNNEN inwerken, geen gemeten gevoelens — stijlgids bijgewerkt). Daarna de grote vraag, met "Meetgebied: België" eronder.
- **Onderste balk:** LHA-logo + tagline (afzender) + nieuwe credits-regel "Een initiatief van Les Hautes Alpes · Gebouwd door de JUNE20 Business Innovation OS"; footer op June20-off-black.
- **JUNE20-woordmerk typografisch gereconstrueerd** (June20Mark-component): Inter Black, signaalrood, 180°-gedraaide J — geen beeldmateriaal van de poster overgenomen.
- Visueel geverifieerd via lokale preview (header, geo-positie, footer-credits incl. woordmerk).

---

## 2026-06-13 — UI: altijd één getal (Peter GO) + June20-visuele branding

**Aanleiding:** Peter (13/6, met schermafbeelding): het hoofdcijfer moet altijd één getal op 100 zijn (geen bereik), de "/100" 50% groter, en de visuele branding van june20.be/innovationscan.

**Beslissingen:**

- **Altijd één getal:** de bereik-weergave bij hoge onzekerheid (B3) is vervangen; de eerlijkheid blijft volwaardig zichtbaar via de 90%-band in de meter (ongewijzigd, op Peters verzoek), de kicker "ONZEKER" en de bandbreedte-zin onder het cijfer (bij thin_reference zonder 90%-claim). Doc 07 §13-bis geactualiseerd als gedocumenteerde productkeuze; de data-velden (uncertainty) zijn onaangeroerd.
- **"/100" 50% groter** (1,7rem → 2,55rem).
- **June20-branding** (bron: june20.be/innovationscan): vlak warm off-black (#211419) i.p.v. de alpenfoto, Inter-typografie (i.p.v. Ubuntu), signaalrood accent (#e6371e / donker #c02b0a), strakke 4px-hoeken; pills blijven. De lha-*-variabelenamen zijn behouden met herijkte waarden, dus alle componenten volgen mee.
- **Stoplicht-semantiek bewaakt:** CN 1/2 zijn losgekoppeld van het (nu rode) merkaccent — een rustige dag kleurt kalm groen/inkt, rood blijft voorbehouden aan CN 4. Visueel geverifieerd via lokale preview (rustige dag: groen cijfer, band zichtbaar, geen alarm-uitstraling).
- Open: het June20-displayfont "Ethereal" is een niet-herdistribueerbare custom woff; Inter draagt de identiteit tot Peter het fontbestand aanlevert.

---

## 2026-06-12 — I-D2-009-baseline verlengd: 13 → 24 maanden, alle maanden gevalideerd; 2023 eerlijk geweigerd

**Aanleiding:** Peters GO voor de baselineverlenging (Infrabel-maandbestanden gaan ~12 jaar terug).

**Beslissingen:**

- Baseline nu **730 echte dagpunten (juni 2024 t/m mei 2026)** — het volledige methodologische 24-maandsvenster (doc 04 §2.1), via `backfill_infrabel_baseline.py --months 24`. Elke maand gevalideerd tegen het officiële maandcijfer; delta's tussen −0,535 en +0,265 pp, allemaal binnen de 0,75-pp-tolerantie. Oude 396-puntenreeks vervangen (zelfde maat, langere periode).
- **Verder terug is eerlijk NIET mogelijk:** de probes april/mei/juni/september/oktober 2023 weken −0,76 tot −1,19 pp af; de meetset-benadering klopt daar structureel niet meer (juli/augustus 2023 passeerden wel, maar het script weigert terecht een reeks met een falende tussenmaand). Geen `--force` gebruikt: dat zou de schaaldiscipline breken. De gemeten 2023-delta's staan hierboven als bewijs.
- Gevolg voor de eCDF-gate (amendement §4.1.6): 24 maanden < 3 jaargangen, dus I-D2-009 blijft eerlijk op MAD-z ("voorlopig"); de gate opent vanzelf zodra de live-aanvoer de seizoensreferentie over 3 jaargangen tilt (~juni 2027), of eerder als een latere hervalidatie van eind-2023-maanden alsnog slaagt.

**Aanleiding:** Peters GO voor OSF-publicatie; plan-volgorde gerespecteerd (eerst alle amendementen §4.1.1-§4.1.6 + naamkeuze, dán hashen).

**Beslissingen:**

- `OSF_PUBLICATIE/SHA256-MANIFEST.txt`: hashes van de tien methodologiedocumenten op het moment van bevriezing. CHANGELOG.md valt bewust buiten de hash (levend auditlog).
- `OSF_PUBLICATIE/README_OSF.md`: de zes publicatiestappen, incl. de §14-invulling (die doc 00 wijzigt → manifest direct herberekenen) en de footer-link die pas ná publicatie geactiveerd mag worden (C2-claimaudit).
- De upload zelf vereist Peters OSF-account; zonder credentials is dit het maximaal voorbereidbare. Vanaf feitelijke publicatie geldt het 30-dagen-protocol (doc 08 §5).

---

## 2026-06-12 — B7-naamkeuze (Peter GO): publieksnaam "De Nationale Stress Index"

**Aanleiding:** Peter koos uit het B7-beslismemo voor de Stress-naam (optie B-familie). Bindende voorwaarde uit het memo: de eerlijke openingszin is de permanente claim-mitigatie en mag nooit losgekoppeld worden van de naam.

**Beslissingen:**

- Publieksnaam overal: browser-titel + meta-description (index.html, "stress-cijfer"-formulering weg), hero-eyebrow, controle-stempel onder het cijfer, embed-meta-regel (abonnee-banner). SBI blijft de methodologische motornaam (footer-versienummer, docs, API) — geen wijziging aan registry of methodologie.
- De eerlijke subtitel ("meet hoe ongewoon zwaar de omstandigheden zijn... niet of mensen zich gestrest voelen") staat direct onder de naam en is in de code gemarkeerd als niet-verwijderbaar zonder nieuwe naamkeuze-beslissing; 09_Brand-Message-Style-Guide draagt dezelfde bindende voorwaarde voor elke downstream-uiting.
- "Nationale" bevestigt het meetgebied België (C3); de afzender-regel ("initiatief van Les Hautes-Alpes") blijft.
- Open: de visuele branding "van de innovatiescan" — de gegeven docx-bestanden (HYE/Navitec) bevatten standaard Office-opmaak en geen link; wacht op de link van Peter voor de visuele pass.

---

## 2026-06-12 — Datacheck Hitte-bug-klasse: drie synthetische fallbacks op verouderde schaal gefixt

**Aanleiding:** Peters datacheck-opdracht n.a.v. de I-D5-003-observatie (gebeurtenisloze dag scoorde winsorized −3 in de lokale smoketest).

**Bevindingen en beslissingen:**

- **Productie is schaal-consistent:** de live I-D5-003-dagwaarde (0,062) en de baseline (0,05-0,22) zijn beide GDELT-volume-intensiteit, zoals de v0.4-herdefinitie voorschrijft. Geen productiebug; de −3-observatie kwam uit de lokale smoketest zonder pipeline-output (regel 7-les: niet op lokale data diagnosticeren).
- **De echte landmijn:** drie `syntheticRawValue`-fallbacks in generate-fixture.ts stonden nog op de schaal van vóór hun herdefinitie — exact de klasse die eerder bij Hitte en I-D1-009 is gefixt. Bij een pipeline-uitval (zonder SBI_STRICT_REAL) zouden ze valse extremen injecteren: I-D5-003 (magnitude 0-15 i.p.v. GDELT-volume ~0,1 → vals "uitzonderlijk rustig"), I-D2-009 (iRail-teller ~3 i.p.v. vertragingsgraad ~6,5% → vals "rustig"), I-D3-003 (altijd log1p≈4,6-5,3 i.p.v. 66% nullen; grade D, diagnostisch). Alle drie nu op de echte verdelingsschaal met landmijn-commentaar.
- NB: deze fallbacks verdwijnen sowieso bij go-live (SBI_STRICT_REAL=1 = "ontbreekt" i.p.v. synthese); tot dan zijn ze nu tenminste schaal-eerlijk.

**Aanleiding:** Peter (12/6): het systeem moet zichzelf controleren, bijstellen en herstellen, en mailen naar peter@hoogland.be zodra iets faalt dat niet automatisch hersteld kan worden. Audit wees uit dat lagen 0-4 al bestonden (cron-Worker + fallback-schedule; fetcher-ladders; healthcheck-canary met rollende issue; verify_live; monitor.yml met hertrigger elke 20 min + optionele Claude-laag). Het gat: geen directe-mailroute, en een willekeurige stapfaal (build/deploy/verify_live) had alleen de rode run als signaal.

**Beslissingen:**

- Nieuw `pipeline/alert.py` (pure stdlib): kanaal-ladder SMTP-mail naar peter@hoogland.be (secrets SMTP_HOST/SMTP_USER/SMTP_PASS, optioneel SMTP_PORT) → ALERT_WEBHOOK_URL → expliciete "geen kanalen"-melding. Exit altijd 0: alarmering mag de oorspronkelijke fout nooit maskeren; een falend kanaal wordt gerapporteerd, niet fataal.
- daily.yml: nieuwe laatste-lijn-stap op `failure()` — vuurt bij élke stapfaal (per definitie niet zelf hersteld; de hertrigger-laag heeft dan al gefaald of komt nog), mailt/webhookt met run-URL en houdt daarnaast één rollende "dagrun gefaald"-issue bij (dedupe).
- monitor.yml: zelfde alarmstap op `failure()` — de monitor exit non-zero alléén bij harde problemen die hertriggeren niet oplost (inconsistent cijfer, kritieke canary, vangrail).
- Doc 08 §1-bis documenteert de volledige vijf-lagen-architectuur incl. activatie-instructie (3 secrets) en de bewuste grens: geen zelf-modificerende "fixes", herstel = hertriggeren + eerlijke degradatie-labels (pre-registratie-discipline).
- Test: tests/test_alert.py (11 standalone checks: kanaal-detectie, default-ontvanger peter@hoogland.be, dry-run, falend kanaal niet fataal, exit 0). Beide workflow-YAML's gevalideerd.
- Open voor Peter: de SMTP-secrets (of ALERT_WEBHOOK_URL) zetten — tot dan dragen rollende issue + rode run (GitHub-notificatiemail) het alarm.

---

## 2026-06-12 — CTA-banner van de hoofdsite gehaald (Peter, 12/6)

**Aanleiding:** Peter (schermafbeelding 12/6): haal de campagne-banner ("Adem in. Adem uit." / "Ontdek de bestemmingen") van de site.

**Beslissingen:**

- App.tsx rendert `CallToAction` niet meer; component en copy (`LES_HAUTES_ALPES_CTA`) blijven bestaan voor heractivering (één regel terugzetten, gedocumenteerd in de code).
- Bewust NIET geraakt: de abonnee-kanalen (embed `public/embed/banner.js`, PreviewPage) en de tier-/banner-logica zelf — alleen de weergave op de hoofdsite is uit.
- Zichtbaar effect volgt pas bij de push (live draait nog 0.2.0 mét banner).

---

## 2026-06-12 — C3: meetgebied België expliciet binnen één scherm; afzender gescheiden van meetgebied

**Aanleiding:** BLOK C-taak C3 (02_VERBETERPLAN): een nieuwe bezoeker moet binnen één scherm begrijpen dat dit een Belgische index is, ondanks de Hautes-Alpes-branding.

**Beslissingen:**

- HeroBanner: nieuwe regel direct onder de openingszin: "Meetgebied: België · een initiatief van Les Hautes-Alpes (Frankrijk)". Samen met de B7-openingszin ("...voor heel België...") staat het meetgebied nu tweemaal op het eerste scherm, en is de alpenbranding expliciet afzender, geen meetgebied.
- METHODOLOGY_DISCLAIMER: "het hele land" → "heel België" (geen impliciete lands-aanname); Methodology "Wat we doen" zegt nu "voor België".
- "Wat we (nog) niet dekken" was al actueel (Vlaamse bron-bias) en C1 voegde de validatiekalender toe.
- De naamafhankelijke stap (een "Nationale ..."-naam die dit definitief oplost) wacht op Peters B7-naamkeuze (04_B7_BESLISMEMO_NAAMKEUZE.md).
- Verificatie: engine 161/161 (synchronisatietest-regexes ongemoeid), web build groen.

**Aanleiding:** BLOK C-taak C1 (02_VERBETERPLAN). Verificatie eerst: validation/criterion_validity.py bestond al als stub met datacontract en verzendklare data-aanvragen (DATA-REQUESTS.md); de publieke jaaraggregaten stonden al verzameld met bronlinks (GATHERED-DATA.md). De resttaak was de rekenkern op acceptatieniveau brengen.

**Beslissingen:**

- criterion_validity.py uitgebreid: p-waarden via Fisher-z (math.erf, gerapporteerd als p_approx), kruiscorrelatie lag 0-3 dagen ruw ÉN seizoens-gecorrigeerd (maand-centrering als confounder-controle; "best" wordt bewust uit de gecorrigeerde reeks gekozen omdat een louter ruwe correlatie gedeelde seizoensgang kan zijn), maand-/kwartaalbronnen via periodegemiddelde-aggregatie (lag 0-1 periode), minimale-n-bewaking (30 dagen / 8 periodes), en de SBI-zijde pakt automatisch composite-history.json zodra die bestaat (met schaalbreuk-caveat) i.p.v. alleen de 30-dagen-sparkline.
- Statuslogica eerlijk: "computed" alleen als er echt een correlatie uit komt; de verzamelde jaaraggregaten (geen dagresolutie, geen overlap) geven "partial". Het rapport draagt datacontract, methode, confounder-note en de validatiekalender.
- Methodologiepagina: nieuw klap-paneel "Hoe we de index extern gaan ijken" met de validatiekalender (dagelijks Tele-Onthaal/1813, kwartaal BELHEALTH, jaarlijks RIZIV/absenteïsme) en de expliciete beleids-/aanbod-caveat (RIZIV-hervorming 2022, campagne-effecten op hulplijnen).
- Test: tests/test_criterion_validity.py (14 standalone checks: Fisher-p-randen, maand-centrering dempt seizoensgang, geconstrueerde lag-2 wordt gevonden op witte-ruis-basis, periodieke aggregatie, stub/partial/computed-statussen).
- Open (extern, niet code): datadelingsprotocollen met Tele-Onthaal/CPZ voor dag-resolutie; de aanvraagmails staan verzendklaar in DATA-REQUESTS.md.

**Aanleiding:** BLOK C-taak C2 (02_VERBETERPLAN): elke open-source-/pre-registratie-/kalibratie-claim moet een werkende verwijzing of reproduceerbaar artefact hebben, of verdwijnen — vóór de OSF-hash alles bevriest.

**Beslissingen:**

- **Kalibratie-artefact:** `cli/backtest.ts` schrijft nu `app/data/backtest-calibration.json` (bewust gecommit, geen CI-output): datum, periode, n, de exacte drempels waarmee gedraaid is (SPIKE_DREMPEL, P70/P90, LOAD_K, SUSTAINED_DAYS, COOLDOWN_H, ERNST_DREMPEL, V04-drempels) en de resultaten. Run van vandaag: 2024-05-21 t/m 2026-06-12, 753 dagen, 18/25 echte baselines; v0.4-tier 69,7% groen / 24,6% oranje / 5,7% rood; 371 triggers.
- **Synchronisatietest:** nieuw `test/calibration.test.ts` pint de engine-constanten exact op het artefact (zelfde bewuste-frictie-patroon als registry.test.ts): een drempel wijzigen zonder her-backtest + nieuw artefact laat de suite falen. De engine blijft puur (geen runtime-file-I/O); de koppeling loopt via de test.
- **Claimaudit publieke copy:** footer-claim "Code: open source." verwijderd (onwaar tot de repo publiek is) → eerlijke formulering "publicatie van code en pre-registratie (OSF) is voorbereid maar nog niet live". Methodologie-stap "staan vooraf vast en zijn publiek" → "staan vooraf vast in de methodologie-documenten en worden bij publicatie integraal openbaar", met verwijzing naar amendement-pad + falende tests bij stille wijziging.
- OSF-publicatie zelf blijft Peters beslissing (01_STATUS §2.4); de volgorde-eis van het plan (eerst amendementen afronden, dán hashen) is gerespecteerd: §4.1.6 (B2) staat erin.
- Verificatie: engine 161/161 (+2 tests), web build groen.

---

## 2026-06-12 — B2/amendement: eCDF-normalisatie met 3-jaarsgate pre-geregistreerd (methodologie 0.3.2)

**Aanleiding:** BLOK B-taak B2 (02_VERBETERPLAN): percentielen op 18-24 maanden dragen ±10-12 pp onzekerheid (B4 mat 18,8 pp spread); de CISS-methode (eCDF over een lange seizoensbaseline) is het einddoel zodra de historie het toelaat.

**Beslissingen:**

- Nieuw `methodology/ecdf.ts` + amendement 00_Pre-Registratie §4.1.6 + doc 04 §2.7: per indicator schakelt de normalisatie over op eCDF (midrank-kans, geklemd op [1/(2n), 1−1/(2n)], via probit naar z-equivalent zodat het composiet aggregeerbaar blijft; winsorize/inverse blijven gelden; geen STL want het seizoensvenster is de seizoenscorrectie) **zodra** de seizoensreferentie ≥3 jaargangen overspant én ≥90 punten telt, **begrensd op de recentste 5 jaar**.
- **Drift-cap gevangen door de smoketest:** zonder cap kwalificeerde de brandstofprijs-index (maandreeks sinds 1996) en zou "vandaag" tegen 1996-niveaus wegen — dat meet inflatie, geen seizoens-ongewoonheid (zelfde klasse als het baseline-drift-argument in doc 04 §8.2). De 5-jaarscap volgt het plan-anker "3-5 jaar per seizoensvenster"; maandbronnen blijven daardoor structureel op MAD-z (een eCDF op een handvol punten is een trap-functie).
- **Stand bij registratie (smoketest):** alleen I-D5-003 haalt de gate (dagdata sinds mei 2023, 3,05 jaar). Effect op het composiet verwaarloosbaar: z −3,0 (winsorized MAD-z) → −2,91 (eCDF), dagpercentiel 4 → 5. Voor alle andere indicatoren verandert vandaag niets; latere overschakelingen zijn uitvoering van deze pre-geregistreerde regel, geen stille wijziging.
- Tot de gate opent is de normalisatie expliciet "voorlopig": breakdown draagt per indicator `normalization` ("mad_z" | "ecdf"), het percentiel-blok `normalization_provisional` + `ecdf_active`, en de methodologie-pagina benoemt het voorlopige karakter (acceptatie-eis "tot dan expliciete onzekerheid", samen met het B3-interval).
- B3-bootstrap spiegelt het eCDF-pad (hertrokken seizoensreferentie → probit → winsorize); methodologie-versie 0.3.1 → 0.3.2.
- Tests: nieuwe suite test/ecdf.test.ts (12 tests: probit-kwantielen, klemming nooit ±∞, gate dicht bij 2 jaar / open bij 4 jaar / dicht bij dunne maandbron, 5-jaarscap, runtime-labels + bootstrap op het eCDF-pad). Engine 159/159.
- Genoteerd voor Peter: (a) een bewuste I-D2-009-baselineverlenging (Infrabel-maandbestanden ~12 jaar terug; backfill `--months N` valideert per maand) zou die indicator binnen de cap door de gate brengen — aparte beslissing, niet uitgevoerd; (b) dataobservatie buiten B2-scope: de I-D5-003-historie (1.100 punten, band 0,05-0,22, geen nullen) staat op een andere schaal dan de dagwaarde 0 van vandaag, waardoor een gebeurtenisloze dag al vóór B2 als winsorized −3 scoorde — bestaand gedrag, het verdient een eigen datacheck.

---

## 2026-06-12 — Reviewfixes BLOK B-snel + B3 (adversariële multi-agent-review, 14 bevestigde bevindingen)

**Aanleiding:** onafhankelijke review van de B1/B8/B7/B3-commits (drie lenzen: statistiek, integratie, eerlijkheid; 16 bevindingen, 14 bevestigd, 2 weerlegd) — zelfde werkwijze als de BLOK A-review.

**Beslissingen (bevinding → fix):**

- **CHANGELOG-koppen hersteld (integratie/minor):** elke BLOK B-edit overschreef de kop van de vorige entry; alleen de nieuwste kop bestond nog. Alle zes koppen (B1/B8/B7/B3/B4/B6) zijn teruggeplaatst; de audit-trail leest weer per taak. Oorzaak: edit-anker op de vorige kop zonder die kop in de vervangtekst te herhalen.
- **Legende-overclaim gecorrigeerd (eerlijkheid/MAJOR):** de B8-legende zei "in het hoofdcijfer tellen alle getoonde indicatoren gelijk mee"; in werkelijkheid wegen de domeinen gelijk en de indicatoren alleen bínnen hun domein (kleine categorie = zwaarder per indicator). Legende zegt dat nu expliciet.
- **Flag volgt de gepubliceerde velden (statistiek/minor):** de uncertainty_flag wordt nu geclassificeerd op de afgeronde, gepubliceerde grenzen; width_fraction is exact (upper−lower)/100 van die grenzen. Een lezer die de doc-regel op latest.json toepast krijgt altijd dezelfde vlag.
- **Grade D uit de bootstrap-inputs (statistiek/minor):** I-D3-003 telde mee in n_indicators (21) terwijl computeComposite hem in elke trekking overslaat; nu gefilterd (n_indicators = 20 dragende indicatoren, ~5% minder rekenwerk). NB: dit verschuift de RNG-stroom, dus de exacte CI-grenzen wijken af van de eerdere smoketest-waarden; methode ongewijzigd.
- **composite_ci_95 = null zonder trekkingen (statistiek/minor):** de no_scored_indicators-tak gaf [0,0] dat als "echt gebootstrapt" naar bootstrap_95_ci_around_equal stroomde; nu null + not_computed-status (placeholder-regel gerespecteerd).
- **nDraws-validatie (integratie/minor):** 0/negatief/NaN gaf NaN-kwantielen (null in JSON met misleidende flag_reason); valt nu terug op de default met test.
- **thin_reference-copy (integratie/minor):** bij high door te dunne referentie claimde de UI "met 90% zekerheid tussen X en Y" terwijl het interval die onzekerheid juist niet dekt; aparte formulering ("indicatief bereik") per flag_reason.
- **Kicker-precedentie (integratie/minor):** "ONZEKER" overschreef het CN 5-brand-safety-pauzewoord; CN 5 wint nu weer (gedocumenteerde hiërarchie).
- **v0.4-maatdiscipline (integratie/minor, latent):** zodra v0.4 live de score levert, hoort de v0.2-CI niet bij het getoonde getal; band/bereik worden dan onderdrukt tot er een v0.4-CI bestaat.
- **Meter consistent bij high (statistiek/nit):** de exacte stip verdwijnt als de copy zegt dat een scherp getal niet kan; band-positie geklemd zodat hij bij lo=hi=100 niet buiten de track valt (integratie/nit).
- **Gedeelde referentie-helper (statistiek/nit):** seasonalReferenceWithFallback in seasonal-percentile.ts; percentiel en CI zien per constructie dezelfde referentie (driftrisico weg).
- **covers/doc eerlijker (statistiek/minor):** expliciet dat referentieset en dagwaarde vastgehouden worden en referentie-steekproefruis boven de 30-puntsgrens ongedekt blijft (doc 07 §13-bis + covers-string).
- **Marin-referentie toegevoegd aan I-D5-001 (eerlijkheid/nit):** de evidence-note verwees naar "het beste experiment" dat niet bij de indicator-bronnen stond; Marin et al. (2012, PLoS ONE) staat nu in de references.
- Verworpen na verificatie (2): hero-zin "voor heel België" (dekkingsbias staat eerlijk in "Wat we (nog) niet dekken"); pollen-prevalentie 20-30% (gedragen door de bron).
- Verificatie: engine 147/147 (+2 tests), web build groen.

---

## 2026-06-12 — B5: empirische kalibratie van de CN-banden expliciet gedocumenteerd

**Aanleiding:** BLOK B-taak B5 (02_VERBETERPLAN): drempels aantoonbaar afleiden van de empirische verdeling en documenteren (kalibratieperiode + n).

**Beslissingen:**

- Doc 06 §3.7 (nieuw): de CN-banden zijn percentiel-posities in de empirische verdeling van het composiet zelf. Kalibratieperiode = voortschrijdend 24 maanden, seizoensbewust (±45 d); n ≈ 180 referentiedagen per dag (productie 12 juni 2026: n = 181; terugval volledig venster ≤ ~730 bij < 30 seizoenspunten; actuele n per dag in uncertainty.n_reference sinds B3). Bandfrequenties per constructie ~50/20/20/10%; herijking impliciet door het meeschuivende venster.
- Geen drempelwijziging: de fijnere 5-bands-variant (P20/P40/P60/P80) staat gedocumenteerd als open productkeuze voor Peter (amendement-pad), niet eigenmachtig doorgevoerd.
- condition-level.ts-docblock geactualiseerd: beschreef nog de 3-dagen-regel; verwijst nu naar de dagregel (0.3.1) en doc 06 §3.7. Geen gedragswijziging (commentaar-only); engine-suite groen.

---

## 2026-06-12 — B6: multicollineariteits-audit met echte PCA + D5-EWMA-monitor; halvering expliciet monitor-only

**Aanleiding:** BLOK B-taak B6 (02_VERBETERPLAN): halfjaarlijkse Spearman-audit + PCA-dimensionaliteitscheck; de D5-halvering formaliseren of als bewuste vereenvoudiging documenteren.

**Beslissingen:**

- `analysis/multicollinearity.py` uitgebreid: echte PCA-eigenwaarden van de Spearman-correlatiematrix via cyclische Jacobi-rotaties (pure Python; de oude "vereist numpy"-disclaimer vervalt), met Kaiser-telling en participatieratio naast de bestaande cluster-ondergrens. Paren zonder voldoende overlap krijgen rho 0 (conservatief, geen verzonnen samenhang).
- D5-monitor geformaliseerd als EWMA-correlatie (halfwaardetijd 7 dagen, RiskMetrics-stijl) voor I-D5-001 × I-D5-003: actuele waarde, aandeel dagen boven 0,70 en 30-dagen-piek in het auditrapport.
- **De automatische D5-gewichts-halvering uit doc 03 §4.4 stap 2 is bewust NIET geactiveerd** (gedocumenteerde keuze, geen omissie): automatische herweging zou de pre-geregistreerde gewichten stil wijzigen. Doc 03 §4.4 draagt nu een implementatie-annotatie; activering vergt een amendement. Mitigatie blijft zichtbaar via composite_without_d5 + deze audit.
- Onderhoudsritme vastgelegd: doc 08 §1.3 (halfjaarlijks) bevat nu de multicollineariteits-audit én de B4-gevoeligheidsanalyse met expliciete actiedrempels (nieuwe paren ≥ 0,70 of dalende dimensionaliteit → gewichten-reviewagendapunt, amendement vereist).
- Resultaat op de echte historie (18 reeksen, 82 paren): 0 paren ≥ 0,70; effectieve dimensionaliteit Kaiser 8 / participatieratio 12,5 van 18; D5-EWMA nu 0,51 met 2% van de dagen boven de drempel. De gewichten hoeven dus niet aangepast: de redundantie wordt aantoonbaar gemonitord en zit onder de actiedrempel.
- Test: `tests/test_multicollinearity.py` (15 standalone checks: Jacobi op bekende matrices, spoorbehoud, Kaiser/participatieratio, EWMA-convergentie ±1, monitor-only-note).

---

## 2026-06-12 — B4: Monte-Carlo-gevoeligheidsanalyse (OECD/JRC stap 7) met Sobol'-indices

**Aanleiding:** BLOK B-taak B4 (02_VERBETERPLAN): kwantificeer hoeveel het dagcijfer beweegt onder redelijke alternatieve methodekeuzes.

**Beslissingen:**

- Nieuw `app/pipeline/analysis/sensitivity.py` (pure Python, stijl multicollinearity.py): 1.200 geseede Monte-Carlo-runs over vier factoren: normalisatiemethode (MAD/IQR/SD-z), domeingewichten ±30% (hernormaliseerd), baselinelengte (18/24 m), indicator-uitsluiting (geen of één). Precompute van z-varianten per (methode × lengte) houdt de looptijd onder 2 s.
- Per dag p05/p50/p95 + spread van het dagpercentiel over alle runs; eerste-orde Sobol'-indices via conditional-mean-binning (Y = percentiel van de recentste 7 dagen; expliciet NIET het gemiddelde over alle dagen — dat is binnen de eigen verdeling per constructie ~50 en drukt alle indices naar 0; deze valkuil zat in de eerste implementatie en is door de determinismetest + nulvariantie-symptoom gevangen).
- Eerlijke vereenvoudigingen expliciet in het rapport (`limitations`): geen STL, percentiel binnen het analysisvenster, brute-force-Sobol zonder Saltelli-design, equal-binnen-domein.
- Resultaat op de echte historie (90 dagen, 17 indicatoren met voldoende reeks, seed 20260612): gemiddelde spread dagpercentiel 18,8 pp (mediaan 17,8, max 43,3) — consistent met de ±10-12 pp-onzekerheidsmotivatie achter B2. Sobol': indicator-uitsluiting 0,40; gewichten samen 0,42 (D1 0,17 &gt; D2 0,11 &gt; D3 0,09 &gt; D5 0,06); normalisatiemethode 0,16; baselinelengte ~0.
- Output naar `app/data/analysis/sensitivity.json` (gitignored, regenereerbaar). Test: `tests/test_sensitivity.py` (14 checks, standalone): determinisme, registry-filterregels (geen S/D6/grade-D), Sobol-sanity (dominante factor ~1, irrelevante ~0), spreidingsrapport.

---

## 2026-06-12 — B3: echte bootstrap-CI rond het dagcijfer (ci_90 + uncertainty_flag)

**Aanleiding:** BLOK B-taak B3 (02_VERBETERPLAN): zichtbare onzekerheid is de grootste geloofwaardigheidssprong. De oude `bootstrap_95_ci_around_equal` stond bewust op null/not_computed; die wordt nu écht berekend.

**Beslissingen:**

- Nieuw `methodology/bootstrap.ts`: baseline-resampling per gescoorde indicator (met teruglegging, zelfde n), volledige productieketen herberekend per trekking (computeBaseline → zscore → geen-schaal-splitsing → inverse → winsorize → equal-composiet → percentiel tegen exact dezelfde seizoensreferentie als het gepubliceerde cijfer). 2.000 trekkingen, deterministisch geseed op de datum (mulberry32/FNV-1a) — reproduceerbaar voor audit.
- Output `uncertainty` in latest.json: ci_90_lower/upper (percentielpunten), width_fraction, uncertainty_flag (low <0,10 ≤ medium ≤ 0,20 < high), flag_reason (ci_width / thin_reference bij <30 referentiepunten / no_scored_indicators), composite_ci_95, covers (eerlijk: dekt baseline-schattingsonzekerheid, geen bronfouten/modelkeuzes — dat is B4). Veld alleen aanwezig als de bootstrap echt draaide.
- `bootstrap_95_ci_around_equal` wordt uit dezelfde trekkingen gevuld (2,5e–97,5e percentiel composiet); zonder bootstrap eerlijk null + not_computed.
- Opt-in via `computeUncertainty` (DailyComputeInput): de twee productie-dagschrijvers (generate-fixture vandaag-pad, compute-daily-bridge) zetten hem aan; warm-up-loop en backtest niet (honderden aanroepen; kost gemeten: ~23 s per dag-run bij 21 indicatoren × 730 baselinepunten × 2.000 trekkingen — acceptabel voor de uurlijkse CI, funest in een loop).
- UI respecteert de vlag: bij "high" géén scherp getal maar het 90%-bereik + waarschuwing (kicker "ONZEKER"); bij low/medium bandbreedte-regel onder het cijfer en een band in de meter.
- Doc 07 §13-bis beschrijft methode, vlagregels en de eerlijke dekking-grens (bootstrap ≠ multiverse).
- Tests: nieuwe suite test/bootstrap.test.ts (9 tests: determinisme, flag-drempels, thin-reference/no-indicators-eerlijkheid, vlakke-baseline-pad, smaller interval bij strakkere baselines, runtime-integratie aan/uit). Engine 145/145, web build groen; smoketest productie: CI [0,6–9,4] rond percentiel 4, flag low, n_reference 181.

---

## 2026-06-12 — B7 (deel 1, naam-agnostisch): eerste schermzin + bronlabels eerlijk; naamkeuze ligt bij Peter

**Aanleiding:** BLOK B-taak B7 (02_VERBETERPLAN). De index meet omgevingsongewoonheid, geen bewezen populatiestress; titel en bronteksten moeten die claim dragen. De publieksnaam zelf ("De Nationale Stress Barometer" vs alternatieven) is een beslissing van Peter; beslismemo staat klaar in het handover-pakket (04_B7_BESLISMEMO_NAAMKEUZE.md).

**Beslissingen (alles naam-agnostisch, geldig onder elke naamkeuze):**

- HeroBanner-subtitel = de verplichte openingszin uit het copy-deck (04_REFERENTIE_CONSTRUCT.md, oud wetenschapspakket): "Deze index meet hoe ongewoon zwaar de omstandigheden vandaag zijn voor heel België, niet of mensen zich gestrest voelen." (verving "blootstelling aan stressverhogende omstandigheden"; benoemt en passant het meetgebied België, voorschot op C3).
- Allostatic load overal alleen nog gelabelde inspiratie: footer-copy + SBI_FOUNDATIONS zeggen expliciet "niet de gemeten grootheid en niet de validatie van deze dagindex".
- Vertekende-citatie-fix (wetenschapspakket §bronnen): het Marin et al. 2012-label claimt niet langer dat negatief nieuws stressreactiviteit "verhoogt"; het vermeldt nu de echte uitkomst (geen directe stresshormoon-stijging; wel verhoogde reactiviteit op een latere stressor; kleine steekproef, alleen vrouwen).
- Methodologie-stap 4 gecorrigeerd: het hoofdcijfer weegt de vijf categorieën gelijk; het evidence-gewogen schema is een controleversie (de oude tekst suggereerde evidence-weging van het hoofdcijfer). Verwijst nu naar de B8-bewijskracht per indicator.
- Em-dashes uit user-facing copy (footer, SBI_FOUNDATIONS-labels) verwijderd (huisregel).
- Verificatie: engine 136/136, web build groen. Open: naamkeuze (memo §5) en de naamafhankelijke vervolgtaken (titel, eyebrow, embed-copy, style-guide, C3-koppeling).

---

## 2026-06-12 — B8: evidence-grading zichtbaar in de UI + claim-precisie per indicator

**Aanleiding:** BLOK B-taak B8 (02_VERBETERPLAN). De grades (A/B/C/D) zaten al in registry en breakdown, maar de UI toonde ze nergens; per indicator ontbrak een eerlijke duiding van wat het bewijs wel en niet draagt.

**Beslissingen:**

- plain-language.ts: nieuw veld `evidenceNote` voor alle 25 indicatoren, geschreven volgens 03_REFERENTIE_BRONNEN_GRADING.md (oud wetenschapspakket): expliciet over niveau (individueel vs bevolking), proxy-afstand en beperkingen; overschrijdt de gelinkte bronnen niet. Grades zelf NIET gewijzigd (per amendement gepind; hergraderen zou een nieuw amendement vergen).
- Breakdown (21) en context_signals (4) dragen nu `evidence_note` (context ook `grade`); UI: bewijskracht-chip per rij (IndicatorList), Bewijskracht-blok met badge + note (IndicatorDetail, dus ook TopInfluences), grade + note bij de kalendercontext (ContextSignals), legende in de lijst-footer. Grade D blijft buiten de publieke lijst (bestaande gedocumenteerde keuze).
- Claim-correctie: de copy van I-D5-001 beweerde "telt mee met een gereduceerd gewicht", maar het publieke cijfer gebruikt gelijke domeingewichten; de reductie geldt alleen in het parallelle evidence-controleschema. Copy herschreven; de legende legt expliciet uit dat de grade bewijskracht beschrijft, geen gewicht in het hoofdcijfer.
- Huisregel afgedwongen: em-dashes verwijderd uit user-facing bronnamen/labels in plain-language.ts; nieuwe testsuite test/evidence.test.ts (5 tests) pint notes aanwezig + "telt niet mee"-eerlijkheid voor D/context + geen gewichtsclaim + geen em-dash.
- Verificatie: engine 136/136 (was 131, +5), web build groen, smoketest generate-fixture: 21 breakdown-entries en 4 contextsignalen dragen note/grade; CI-data teruggezet.

---

## 2026-06-12 — B1: doc 04 beschrijft de werkelijke z-implementatie (geen code-wijziging)

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
