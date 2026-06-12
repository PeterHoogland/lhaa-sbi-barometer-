# CHANGELOG — Stressor-Blootstellings-Index (SBI)

Audit-trail per 08_Onderhoud-Protocol.md §5.6: elke wijziging gelogd met datum, aanleiding en beslissing. Nieuwste entries bovenaan.

Eerlijke noot bij de start van dit logboek: dit bestand is aangemaakt op 2026-06-11. De entries vóór die datum zijn retroactief gereconstrueerd uit de git-historie en commit-berichten van de app. De wijzigingen zelf zijn op het moment van invoering in commits gedocumenteerd, maar het formele wijzigingsproces (30-dagen-aankondiging, adviesraad-consultatie per 08 §5.3-5.4) is voor geen van deze wijzigingen vooraf gevolgd; er is op dit moment ook nog geen adviesraad, dus dissenting opinions ontbreken. Zie 00_Pre-Registratie.md §4.1 voor de formele regularisatie.

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
