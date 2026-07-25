# HANDOVER-V11 — Les Hautes Alpes SBI-barometer

**Lees dit eerst in een nieuwe sessie.** Vervangt `handover V10/HANDOVER-V10.md`. Uitgevoerd: 2026-06-02 (avond).
Begeleidende docs in deze map: **CODE-V11** (architectuur), **MASTERDOCUMENT-V11** (methodologie), **TOEGANG-V11** (toegang/infra/valkuilen), **MEDIA-OVERZICHT-V11** (medialandschap), **VERBETERPLAN-V3-STATUS** (item-per-item status van het wetenschappelijke V3-verbeterplan: wat ✅ gedaan is, wat ⛔ Peters override is, wat ⏳ CI/numpy/externe data vereist).
Externe wetenschappelijke review die het werk stuurde: `_PROJECTEN/Client-Werk/LES HAUTES ALPES/perplexit verbetering /SBI_VERBETERPLAN_CLAUDE_CODE.md`.

- **Live (primair):** https://les-hautes-alpes-sbi.brainwolves.workers.dev (Cloudflare Workers).
- **Repo:** https://github.com/PeterHoogland/lhaa-sbi-barometer- · `main` · `gh` ingelogd als PeterHoogland.
- **Project-root:** `/Users/franky/Desktop/Les Hautes Alpes Anti Stress Activator (voorlopige werktitel)/`
- **Triggers:** `mode: test` (vuren niets automatisch; `require_manual_approval` reist mee). Auto-campagnes gaan pas aan met de Zapier-hook + bevroren drempels.
- 🎯 **GO-LIVE-DEADLINE: 22 juni 2026.** Dan moet `mode: live` aan en moet ALLE data actief en betrouwbaar zijn.

---

## ⚠️ LEES DIT EERST: V10 zat fout over "3/100" (stale-file misdiagnose)

HANDOVER-V10 noemde als #1 kritiek pad een **verkeer-backfill** om "het structureel te lage publieke getal (3/100)" te fixen. **Die diagnose was fout, gebaseerd op een verouderd bestand.** Geverifieerd tegen de grond-waarheid in deze sessie:

- De "3/100" kwam uit het **gecommitte `app/data/latest.json`**, en dat was van **21 mei** (had nog `grade: null`, van vóór de YoY-fix én vóór het V10-grade-veld). `daily.yml` commit `latest.json` **bewust nooit** terug, CI regenereert het vers bij elke deploy. De gecommitte kopie is dus een stale leftover, **niet** de live-stand.
- De **live site stond al gezond op 59/100** (en is door deze sessie nu 71). De verkeer-YoY-term droeg `+0,03` bij, niet `-0,17`.
- **Les: diagnosticeer NOOIT op het gecommitte `latest.json`.** Gebruik de live URL (`/data/latest.json?cb=...`) of regenereer lokaal. Zie [[project-percentiel-kwaliteit]] in het geheugen.

**Gevolg:** de verkeer-backfill is GEEN geloofwaardigheidsfix. Er bestaat ook geen schone machine-leesbare historische dag-bron voor file-km (de "historische verkeerssituatie" is een interactieve GIS-kaart, VDV vereist Itsme, bevestigd). Een backfill zou een herschaalde proxy zijn → enkel een kwaliteitsverbetering (verkeer als dag-mover), geen brand. **Peter koos: pivot naar go-live i.p.v. de backfill.**

---

## ▶️ EERSTE OPDRACHT (START HIER)

Het publieke cijfer is af, geloofwaardig en live. Het kritieke pad naar 22 juni is nu de **echte go-live van de campagne-kant**, in deze volgorde:

1. **Wacht op Peters Zapier-hook** (`hooks.zapier.com`-URL, Catch Hook → mail naar peter@hoogland.be). Zonder die hook blijft alles sowieso dry-run. Zetten: `gh secret set CAMPAIGN_WEBHOOK_URL` (+ evt. `ALERT_WEBHOOK_URL`).
2. **Drempels bevriezen via backtest** (`npx tsx src/cli/backtest.ts`, lookahead-vrij). Pre-registratie: vastleggen en daarna niet meer bijdraaien. Peters call op de bevroren waarden.
3. **`mode: test` → `live`** in `triggers.ts` + `generate-fixture.ts`. Pas doen na (a) genoeg live-historie, (b) de webhook, (c) Peters go op de bevroren drempels + construct.

**Niet meer doen tenzij Peter er expliciet om vraagt:** de verkeer-backfill (geen brand, geen schone bron) en demping van het cijfer (Peter wil het rauw, zie §2).

## 0. De allerbelangrijkste dingen (TL;DR)

1. **Het publieke cijfer is OPGELOST en live.** Vandaag 71/100 "VERHOOGD", groen, alle data echt, reproduceerbaar. Deze sessie heeft de echte problemen (grilligheid-perceptie + structurele lage-bias) bij de wortel aangepakt met een **seizoens-bewust percentiel** (vergelijk vandaag tegen dezelfde tijd van het jaar), plus **determinisme** en **carry-forward**. Zie §2.
2. **GEEN demping (Peters expliciete keuze).** Niet aan de uitgang (week-mediaan op 0-100) en niet aan de ingang (ruisfilter op de score). Het cijfer toont elke dag rauw wat het is. De grilligheid (sprong ~16 percentielpunten/dag) is dus **bewust behouden** als eerlijke dag-werkelijkheid. eCDF/CISS-herijking (review §4.5) is geparkeerd, want dat zou richting demping/herijking gaan.
3. **"testfase / v0.4 / test-modus"-jargon is uit de publieke weergave.** Het leest nu als een afgewerkt product. De ECHTE staat blijft eerlijk: badge "campagnes: handmatig", de campagne-triggers vragen handmatige goedkeuring, er vuurt niets automatisch. **De engine staat bewust nog `mode: test`** onder de motorkap (geen engine-code aangeraakt).
4. **Open wachtrij voor 22 juni:** (a) Zapier-hook van Peter, (b) drempel-freeze via backtest, (c) `mode: live`. Zie de EERSTE OPDRACHT.
5. **Git-valkuil (ongewijzigd):** `app/data/sbi-cache.json` heeft `skip-worktree`. Bij elke push schuift `origin/main` op door de CI-cache-commit, dus rebase nodig, en die struikelt over de vlag. Fix: `git update-index --no-skip-worktree app/data/sbi-cache.json` → `git pull --rebase` → `git update-index --skip-worktree app/data/sbi-cache.json`. Zie TOEGANG-V11 §4.
6. **Schrijfstijl Peter:** publieke UI-copy = neutraal correct Nederlands, specifiek en verantwoord. **Geen em-dashes (—)**, ook niet in je antwoorden. Concreet voorbeeld deze sessie: "afgelopen jaren" was te vaag → vervangen door "in de voorbije twee jaar" (het venster is exact 730 dagen).

---

## 1. Wat er NU live staat (na deze V11-sessie)

Twee lagen, sinds V6 gescheiden:
- **MEETLAAG = het publieke cijfer (v0.2).** In test-modus is `latest.json` puur v0.2 (geen `v04`-lek, geverifieerd). Het publieke getal is een **score op 100** = het percentiel zelf, maar nu **seizoens-bewust** berekend (zie §2). Vandaag 71.
- **TRIGGER/EXPERT-laag (v0.4).** Volledige output incl. `v04` in `latest-expert.json`; alleen de "expert"-panelen lezen dat. Labels ontdaan van version-jargon, staat blijft eerlijk ("campagnes: handmatig").

**Indicatoren in het cijfer: 23** (alleen `I-D3-003` ontslagen-proxy blijft grade-D en buiten het cijfer). Media-toon (`I-D5-001`) + wikipedia (`I-D5-002`) blijven op Peters override grade-C, in het cijfer.

**Data:** alle indicatoren op echte bronnen (live `simulated: []`, alleen `I-D1-003` kou ontbrak vandaag). Self-repair-pass (V10) draait.

---

## 2. Wat deze V11-sessie gebouwd + gedeployed is (chronologisch)

Alles hieronder staat **live** (deploys 2026-06-02 avond, alle success). Commit-hashes via `git log`.

1. **Determinisme** (`generate-fixture.ts`): de synthetische fallback-baseline gebruikte een **ongezaaide `Math.random`** → het publieke percentiel was niet-reproduceerbaar (±2-3 punten run-op-run, zelfde data). Nu gezaaide `mulberry32(hashStr(code + ":" + datum))`. Identiek bij elke run. Geen methodologie-wijziging, puur determinisme.
2. **Carry-forward maandindicatoren** (`generate-fixture.ts`): in de 730-dagen-reconstructie werden maandcijfers (file, brandstof, CPI, werkloosheid, hypotheek) op niet-maandgrens-dagen met synthetische ruis gevuld. Nu wordt de laatst bekende echte waarde **doorgedragen** (een maandcijfer staat binnen de maand vast). Correctere referentieverdeling.
3. **⭐ Seizoens-bewust percentiel** (`methodology/seasonal-percentile.ts`, NIEUW): het publieke percentiel rangschikte vandaag tegen het HELE 2-jaars-venster, waardoor een rustige junidag tegen winters en 2024 werd afgezet (structureel laag + cross-seizoen-grilligheid). Nu vergelijkt vandaag tegen **dezelfde periode van het jaar** (`SEASONAL_WINDOW_DAYS=45`, ± rond dezelfde dag-van-het-jaar over alle jaren), lookahead-vrij, met terugval op het volledige venster bij <30 seizoenspunten. Gewired in `runtime.ts` (`percShort` + de tier-percentiel-historie + de media-diagnostiek). **Matcht de bestaande methodologie-copy** die al "een zomerdag wordt vergeleken met zomerdagen" beloofde (de engine deed dat alleen per-indicator via STL, nu ook op het composiet). 10 nieuwe tests (`test/seasonal.test.ts`), 86 totaal groen. Effect: een typische dag leest eerlijker (niet meer structureel ~16, maar mid-schaal voor het seizoen); pompt niets kunstmatig op.
4. **UI: negatieve domein-balken zichtbaar** (`DomainContributions.tsx` + `styles.css`): negatieve bijdragen (bv. D5 −0,10) werden in bijna-wit (`#efe9e1`) getekend, onzichtbaar. Nu een warme klei/terracotta (`--lha-clay: #b87d58`), leesbaar en distinct van de groen/amber/rood-statuskleuren.
5. **UI-copy: "voorbije twee jaar"** (`ConditionLevelDisplay.tsx` + `PercentileDisplay.tsx`): "afgelopen jaren" was te vaag/onwetenschappelijk → nu "vergelijkbare dagen (zelfde tijd van het jaar) in de voorbije twee jaar" (het venster is exact 730 dagen).
6. **"testfase/v0.4"-jargon weg** (`ButtonPanels.tsx`, `V04Technical.tsx`, `KernIndicators.tsx`, `copy.ts`): paneel heet nu "De kern van de meting", "Meet- en trigger-laag", footer "Dagelijks automatisch bijgewerkt", badge "campagnes: handmatig". Honest substance behouden in gewone taal. **Engine onaangeraakt, blijft `mode: test`.**
7. **Kicker-woord volgt de percentiel-band** (`ConditionLevelDisplay.tsx`): het kicker-woord hing aan het conditie-niveau, dus 71 las "GEMIDDELD" terwijl de meter-stip al in de verhoogde zone staat (Peter: voelt fout). Nu volgt het woord de band (50/70/90, zoals de meter): `<50 LAAG, 50-69 GEMIDDELD, 70-89 VERHOOGD, ≥90 HOOG`, brand-safety (CN5) overschrijft. Banner/campagne-logica blijft onveranderd op de pre-geregistreerde sustained-tier-regel.
9. **Baseline-venster 2 vs 10 jaar (Peters keuze: optie 1).** Het kern-paneel toonde per indicator "tegen X jaar historie" (brandstof/inflatie 10j, weer/nieuws 2j). Dat is **databeschikbaarheid**, geen willekeur: het v0.4-lange-venster is `LANG_MAANDEN=120` (10 jaar doel), gecapt op de echte historie. Het **publieke cijfer is sowieso al consistent 2 jaar** (seizoens-percentiel). Peter koos optie 1: **engine ongemoeid** (brandstof/inflatie houden hun robuustere ~10-jaars-meetlat + crisis-context), maar de verwarrende per-chip-regel in `KernIndicators` is vervangen door "vergeleken met dezelfde tijd van het jaar" (consistent). De echte jaar-span blijft in de diepe `V04Technical`-tabel voor reviewers. **NIET overal op 2 jaar zetten** (dat was optie 2, bewust niet gekozen: zou crisis-context + robuustheid weggooien en de niet-live campagne-drempels veranderen).
8. **UI-copy + consistentie-ronde** (Peters batch, alles live): (a) intro "Wat dit is" ingekort (24-dingen-zin + "geen dokter" + "geen wetenschappelijke studie" weg); (b) "Wat we doen" = **6 thema's en 24 elementen** (de tool heeft 6 domeinen, niet 9 — Peter zei 9, maar dat zou de tool tegenspreken die overal 6 categorieën noemt; **open vraag aan Peter, voorlopig 6**); (c) de status-kaart (`TierIndicator`) volgt nu de **DAG-band** (`scoreBand`, 50/70/90, zelfde als de kicker + meter) i.p.v. de sustained-tier, zodat de kop klopt met het getal (71 = "VERHOOGD / drukker dan gewoonlijk", niet "gewone dag/BAND NORMAAL"); band-copy in `copy.ts` (`BAND_HEADLINE/SUBLINE/LABEL/COLOR`); (d) databronnen-paneel zonder de wetenschappelijke artikels (`AllSources`, die staan in het aparte "Wetenschappelijke bronnen"-paneel); (e) kern-meting + meet-laag-tekst in gewone taal (geen "percentiel van het lange venster" of Σ-formule); campagne-triggers-blok uit `V04Technical`; (f) footer-balk in warm charcoal (`#2b2019`) uit het palet van de hero-foto i.p.v. groen.
10. **Wetenschappelijk V3-verbeterplan uitgevoerd (resterende veilige items).** Het plan (`_PROJECTEN/Client-Werk/LES HAUTES ALPES/perplexit verbetering /V3 SBI_VERBETERPLAN_CLAUDE_CODE.md`) was grotendeels al gebouwd (Fase 0/1/2 + evidence-grading A/B/C/D + echte API's, live geverifieerd). Deze sessie toegevoegd: `app/pipeline/analysis/multicollinearity.py` (§4.6, draait: 0 paren |rho|≥0,70, geen dubbeltelling); `app/pipeline/validation/criterion_validity.py` + `DATA-REQUESTS.md` (verzendklare aanvragen) + `GATHERED-DATA.md` + `validation/data/*.csv` (publieke ijkdata opgezocht met bronlinks: 1813/CPZ jaarcontacten 2019-2025, Tele-Onthaal 2022, RIZIV depressie/burn-out eind 2023 = 137.454, Sciensano GAD-7/PHQ-9 per golf); methodologie-pagina "Wat we (nog) niet dekken"-sectie (§6-bis.5). **Volledige item-per-item status: `VERBETERPLAN-V3-STATUS.md`** (✅/⛔/⏳). Bewust NIET: media/wiki naar grade-D + naam-rename (Peters overrides).

---

## 3. Open wachtrij / volgende stappen (geprioriteerd voor 22 juni)

1. **(KRITIEK PAD) Go-live van de campagne-kant.** Zie EERSTE OPDRACHT: Zapier-hook (Peter) → drempel-freeze via backtest → `mode: live`. Voor/tegen/impact: MASTERDOCUMENT-V11 §6.
2. **Emotie-spike-timing.** `MIN_EMOTIE_HISTORY=20`; de eigen historie bouwt op sinds 2 juni → trigger komt ~22 juni online (op het randje, niet backfillbaar). Overweeg de drempel naar ~14 voor marge.
3. **(OPTIONEEL, geen brand) Verkeer als dag-mover.** De DATEX-dagmaat (`I-D2-001-rt`, file-km, geen sleutel) bouwt historie op. Wil Peter verkeer ooit als dag-mover ín het cijfer, dan moet de live-metric afgestemd worden op een (herschaalde proxy-)baseline, want een schone historische dag-bron bestaat niet. Geen geloofwaardigheidsfix (V10 zat daar fout), dus alleen op Peters expliciete vraag.
4. **(GEPARKEERD, Peter wil het niet) Demping / eCDF-herijking.** De grilligheid is bewust behouden (rauw cijfer). Alleen oprakelen als Peter van gedacht verandert.
5. **GDELT `PROTEST/STRIKE` in de I-D5-003-score** = pre-reg-amendement → re-backfill nodig (bewust apart). Skeyes-onrust zit nu wel in de trigger-keywords (`events.py`).
6. **Wetenschappelijk plan, resterende ⏳-items** (detail in `VERBETERPLAN-V3-STATUS.md`): Monte-Carlo-Sobol-gevoeligheid (§4.3, vereist numpy + parameteriseerbare gewichten i.p.v. hardcoded `weights.ts`), echte bootstrap-CI (§4.4, nu eerlijk `null`), ervaren-stress-pijler NBB-enquête + EPU-index (§6-bis.2), ML-mediapipeline RobBERT/CamemBERT (§6-bis.3).
7. **Criteriumvalidatie: volgende stap = CPZ-maandreeks.** De publieke ijkdata is verzameld (`validation/GATHERED-DATA.md`) maar jaarlijks/golf → geen dag-overlap met de jonge SBI, dus nog geen echte correlatie. Eerste echte (maandelijkse) correlatie: de CPZ-**maandtabel** uit de PDF extraheren (publiek, geen afspraak nodig) + de SBI-composiet-historie als maandexport. Daarna dagcijfers van de hulplijnen via afspraak (de e-mails staan klaar in `validation/DATA-REQUESTS.md`). Peter overweegt dit als volgende stap.
8. **⚠️ TE BOUWEN — Blinde vlek: nationale rouw / zware ongevallen worden niet opgepikt** (Peter merkte dit op 2026-06-03, geverifieerd in de live data: bij nationale rouw door twee zware ongevallen "merkte" het cijfer niets; `I-D5-003` "Grote gebeurtenis" las zelfs z−2,29 "rustig" en duwde het cijfer OMLAAG). **Vijf oorzaken:** (1) `I-D5-003` telt enkel GDELT-volume van oorlog/geweld/ramp/terreur → een verkeersongeval valt daar niet onder; (2) de `events.py`-keywords kennen wel "nationale rouw/tragedie/treintragedie" maar NIET "ongeval/dodelijk/verkeersongeval/slachtoffers"; (3) RSS-kandidaten wachten op menselijke review (`pending_events.json`, nu vol Skeyes-staking, niets goedgekeurd → telt niet); (4) de emotie-lading (verdriet, `I-D5-emotie`) wordt wél gedetecteerd maar zit buiten het cijfer; (5) `brand_safety` bleef "normal" → de commerciële CTA werd niet gepauzeerd (pijnlijkst voor een toerisme-merk). **FIX (Peter wil dit):** **(a)** `events.py` `KEYWORDS_MAG_*` (rond r.52-67) uitbreiden met: ongeval, dodelijk, verkeersongeval, busongeval, slachtoffers, rouwdag, minuut stilte (+ evt. zwaar ongeval, omgekomen). **(b)** De verdriet-/rouw-piek uit de emotie-laag koppelen aan **brand-safety** (auto-pauze van de CTA bij een verdriet-piek), NIET aan het cijfer (dat blijft eerlijk = omgevingsdruk, geen emotie). Eventueel "nationale rouw" als expliciete brand-safety-trigger. Raakvlakken: `app/pipeline/pipeline/fetchers/events.py` + brand-safety in `runtime.ts`/`methodology/triggers.ts` + `copy.ts BRAND_SAFETY_OVERRIDE`.

---

## 4. Operationeel (zie TOEGANG-V11 voor details + valkuilen)
- **Deploy:** code committen + `git push origin main` + `gh workflow run daily.yml --ref main` (CI fetcht echte data → bouwt → Cloudflare, ~7 min). Verifieer live met `/data/latest.json?cb=$(date +%s)` (cache-bust).
- **Lokale data-gen** (verificatie): `cd app/engine && npm run generate-fixture`. **Daarna reverten:** `git checkout -- app/data app/web/public` + `rm -f app/data/latest-expert.json app/web/public/data/latest-expert.json` + `git checkout -- app/data/trigger-state.json`.
- **Preview-server:** `barometer`-config in `.claude/launch.json` (poort 5173). **LET OP:** die leest de lokale (vaak stale) data, niet de live data. Laat geen preview-tab openstaan, dat verwart (deze sessie zag Peter even de stale 3/100 van de preview voor de live site aan). Stop de preview na gebruik.
- **Tests:** `cd app/engine && npx tsc --noEmit && npm test` (86 groen). **Web:** `cd app/web && npm run build`. **Emotie:** `python3 app/pipeline/tests/test_lexicon_emotion.py`.
- **Git-valkuil `sbi-cache.json` (skip-worktree):** zie §0 punt 5 + TOEGANG-V11 §4.

## 5. Geheugen (auto-memory)
`~/.claude/projects/.../memory/`: **`project-percentiel-kwaliteit.md`** (de stale-file-vondst + de seizoens-fix + Peters geen-demping-keuze), `build-status.md` (live-stand), `methodology-discipline.md`, `feedback-schrijfstijl-peter.md` (je-vorm, anti-AI, geen em-dashes, neutrale UI-copy). MEMORY.md is de index.
