# HANDOVER v0.4 — Les Hautes Alpes SBI-barometer

**Lees dit eerst als je in een nieuwe Claude-sessie verder werkt.**
Uitgevoerd: 2026-06-01 · Vervangt de oude `HANDOVER.md` (die beschreef v0.2 + de v0.4-spec).

- Live: https://les-hautes-alpes-sbi.surge.sh
- Repo: https://github.com/PeterHoogland/lhaa-sbi-barometer-
- `main` @ `afd9811` (deze sessie: ea0b9a7 → afd9811, ~18 inhoudelijke commits)
- Project-root: `/Users/franky/Desktop/Les Hautes Alpes Anti Stress Activator (voorlopige werktitel)/`
- Begeleidende docs: `CODEDOCUMENT-v0.4.md` (code-kaart), `MASTERDOCUMENT-v0.4-addendum.md`
  (methodologie-wijzigingen + amendementen), `TOEGANG-EN-INFRASTRUCTUUR.md` (basis, nog grotendeels geldig).

---

## 1. Wat staat er NU live (eindstand van deze sessie)

**De v0.4-kern is de PUBLIEKE hoofd-meting geworden.** Het grote cijfer (CN 1-5), de
kleur en de tekst bovenaan draaien op de v0.4-kern, niet meer op de v0.2-24-meting.

- **CN komt INSTANT uit het kern-percentiel** (`v04.percentile.lang`, tegen ~2 jaar):
  ≥90→CN4 (rood/uitzonderlijk), ≥60→CN3 (oranje/verhoogd), ≥40→CN2 (gemiddeld), <40→CN1 (laag).
  Géén sustained-tier-na-ijling in de kop → de kop kan niet "verhoogd" tonen op een kalme dag.
- **Gevoeligheid (gekalibreerd op backtest):** oranje al vanaf P60, rood vanaf P90 (2 dagen,
  uitzonderlijk). Backtest over de vollere kern: ~27% oranje, ~4% rood.
- **De v0.2-24-indicatoren-meting loopt PARALLEL mee** in het "Technische details"-paneel
  (niets verwijderd → discipline-conform; geen 30-dagen-amendement nodig).
- **Paginastroom (web):** groot cijfer + kicker + percentiel-regel → call-to-action →
  "Wat speelt vandaag het meest mee?" (top-3 kern) → klap-knoppen (kern-detail, sparkline-
  verloop, expert, methodologie, bronnen, wetenschap, technisch v0.4-paneel).
  Het oude PlainExplainer-uitlegblok + de beschrijvende zin onder het cijfer zijn VERWIJDERD.

**Data — alle 9 kern-indicatoren actief met ECHTE baseline (verkeer opgelost via Pad A):**
| Kern | Bron / status |
|---|---|
| Nieuws I-D5-001 | GDELT-toon, ~2j |
| Verkeer I-D2-001 | **filezwaarte** — officiële jaarreeks 2013-2024 (Verkeerscentrum), Pad A: traag/grondlast |
| Gebeurtenis I-D5-003 | **GDELT-volume** (oorlog/geweld/ramp/terreur), 1960d, 2021→nu — GEHERDEFINIEERD |
| Wikipedia I-D5-002 | ~11m |
| Hitte/Koude I-D1-002/003 | KMI, ~2j |
| Energie I-D3-002 | ENTSO-E, ~2j |
| Brandstof I-D2-004 | **ECB HICP-index** verankerd op be.STAT, 360 maanden (1996→nu) |
| Inflatie I-D3-001 | STATBEL, ~18j |

---

## 2. Wat deze sessie gebouwd is (chronologisch, de commits)

1. **v0.4-engine** (`6b39056`): dubbele rolling baseline (z_kort 18m / z_lang langst-besch.
   cap 120m), twee gewichtssets `w_meting`/`w_trigger`, `composite_meting` + achtergrond +
   `load_factor`, trigger-engine T1 spike / T2 rood / T3 composiet + cooldown + confirmatie +
   brand-safety. Alles in een `v04`-blok in `DailyOutput`. Test-modus (`require_manual_approval`).
2. **v0.4-UI** (`2d955b3`, `433e65f`, `efa640d`): zichtbare kern-sectie + technisch v0.4-paneel;
   sparkline + kern-sectie onder eigen klap-knoppen.
3. **Kalibratie + brandstof** (`a5894c1`…`dbbb71c`): backtest-script; gevoeligheid; brandstof
   via ECB (be.STAT bleek géén historie te geven — alleen 1 rij/vandaag).
4. **GDELT-gebeurtenis** (`04ee89a`…`9fd1f30`): I-D5-003 geherdefinieerd naar GDELT-volume-
   intensiteit + backfill (1960 dagen).
5. **Rood getemperd** (`7634268`): rood van P85/1d → P90/2d (15% → 4% rode dagen).
6. **Kern wordt de kop** (`079924d`, `18d1fb5`, `ab04751`): explainer + ConditionLevelDisplay
   op de kern; "10"-bug gefixt (dynamisch); percentiel-venster 60d → 730d (geen opgeblazen CN).
7. **UI-opschoning** (`1dacf17`, `afd9811`): PlainExplainer-blok weg, banner-jargon weg,
   beschrijvende zin onder het cijfer weg.

---

## 3. Operationeel — bouwen, deployen, backfillen (LEES DIT, hier zitten de landmijnen)

- **Deploy = `gh workflow run daily.yml --ref main`.** `daily.yml` heeft GEEN push-trigger;
  pushen naar main alleen zet de code klaar. De cron (08:00 BE) deployt ook automatisch.
  `gh auth` staat ingelogd als `PeterHoogland`.
- **Webhook-secret zetten:** `gh secret set CAMPAIGN_WEBHOOK_URL` (en optioneel
  `gh secret set CAMPAIGN_WEBHOOK_TOKEN`). Zolang dit niet gezet is, draait de webhook in
  dry-run en logt hij alleen de payload — handig om eerst de vorm te zien in de CI-log van
  de "Generate daily output"-stap. Lokaal testen: `CAMPAIGN_WEBHOOK_URL=… npm run
  generate-fixture` in `app/engine` (let op: vereist triggers op die dag, anders 0 verstuurd).
- **Deploys serialiseren** (`concurrency: deploy-${ref}`, cancel-in-progress:false): meerdere
  triggers draaien ACHTER ELKAAR, elk ~6-7 min. Niet in paniek raken als het traag lijkt.
- **`generate-fixture` duurt ~2,5 min** sinds het percentiel-venster 730 dagen is (730×
  computeDaily). Binnen het CI-budget (15 min), maar traag bij lokaal iteren.
- **Sandbox-netwerk is onbetrouwbaar (TLS-onderschepping + traag):** be.STAT en GDELT
  time-outen/429'en hier. **ECB SDMX werkt wél.** → externe historische data ophalen doe je
  via de **backfill-workflow op CI** (schoon netwerk), NIET lokaal.
- **Backfill = `gh workflow run backfill.yml -f script=<naam>`** (`.github/workflows/backfill.yml`,
  workflow_dispatch). Draait het script op CI en commit de historie naar main. Bestaande:
  `backfill_fuel_baseline.py` (ECB→I-D2-004), `backfill_event_baseline.py` (GDELT→I-D5-003).
- **Na een backfill/deploy: `git pull --rebase origin main`** lokaal — de CI commit cache/
  historie/trigger-state terug ("chore: persist…"), dus lokaal loopt anders achter.
- **`app/data/trigger-state.json` is getrackt** — NIET `rm`-en (brak een rebase). Gebruik
  `git checkout -- app/data` om gegenereerde data terug te zetten.
- **Code-only commits:** ik revert telkens de gegenereerde data (`git checkout -- app/data
  app/web/public`) vóór commit; CI regenereert ze. Houdt de diffs schoon.
- **Browser-cache:** na een deploy ziet de bezoeker soms de oude bundel → harde ververs
  (⌘+Shift+R). De JS-bundel is gehasht (`index-<hash>.js`); check de live bundel met
  `curl -s <url>/ | grep -oE "index-[A-Za-z0-9_-]+\.js"`.
- Tests: `cd app/engine && npm test` (54 groen) · `npx tsc --noEmit` · `npm run build` (web).
- Backtest: `cd app/engine && npx tsx src/cli/backtest.ts` (~40-70s, leest de echte historie).

---

## 4. Open punten (waar de volgende sessie aan verder kan)

1. **Verkeer I-D2-001 — OPGELOST (Pad A, 2026-06).** Geherdefinieerd naar de officiële filezwaarte
   (km·uur/werkdag) uit de Verkeerscentrum-jaarrapporten; echte baseline 2013-2024 (backfill
   `backfill_verkeer_baseline.py`), klasse ⚡direct → 🐢traag + grondlast, en grondlast uitgesloten
   van T2 (§3.3, anders dubbeltelling). Géén machine-leesbare maand/dag-reeks publiek beschikbaar
   (webtool interactief, DATEX realtime, VDV Itsme-auth) → de jaarmaat is de echte basis. Restant:
   verrijking naar echte maanddata vereist contact met de uitgever (wegen.verkeer@mow.vlaanderen.be).
   Zie `MASTERDOCUMENT-v0.4-addendum.md` §F.
2. **Webhook — GEBOUWD (2026-06-01).** `app/engine/src/webhook.ts`: `buildWebhookPayload`
   (puur, payload-schema `lhaa-sbi-webhook/v1`) + `dispatchTriggers` (POST met time-out die
   élke fout opvangt → breekt nooit de build). Aangeroepen aan het eind van
   `generate-fixture.ts`; de `daily.yml`-stap geeft `CAMPAIGN_WEBHOOK_URL`/
   `CAMPAIGN_WEBHOOK_TOKEN` door. Leeg/ongezet → **dry-run** (logt de payload, verstuurt
   niets). Vuurt óók in `mode=test`; `mode` + `require_manual_approval` reizen mee zodat de
   ontvanger gate't (niets start automatisch). Dedup = de engine-cooldown + getrackte
   `trigger-state.json` (bewust géén apart dispatch-state-bestand — zie de comment-kop in
   `webhook.ts`). 12 tests in `test/webhook.test.ts`. **Rest:** (a) `gh secret set
   CAMPAIGN_WEBHOOK_URL` zetten (zie §3), (b) het ontvangende Make/Zapier-endpoint bouwen.
   De per-thema-routing (oorlog/economie/weer) hangt aan open punt 3.
3. **Per-thema-routing in het nieuws** (v0.5 §9.5) — campaign_hint is nu per indicator-code,
   nog niet per nieuws-thema. De GDELT-event-query levert de thema's al; koppel ze door.
4. **Reddit-confirmation bedraden** — `confirmationSignals.redditElevated` staat op `false`
   (valentie-conventie onbekend). Ontslag-radar idem.
5. **Drempels bevriezen** — SPIKE_DREMPEL/k/P-grenzen/v04-tier zijn gekalibreerd maar nog niet
   formeel bevroren; na meer forward-historie herijken + bevriezen (spec §8).
6. **Verouderde grote `_verificatie/`-dumps** (`HANDOVER.md`/`CODEDOCUMENT.md`/`MASTERDOCUMENT.md`,
   593/351/351 KB) beschrijven v0.2 — vervangen door deze v0.4-docs of opschonen.

---

## 5. Ratificeerde keuzes (NIET zomaar terugdraaien — pre-registratie-discipline)

- v0.4 staat **parallel** naast v0.2 (niets verwijderd). De kern-als-kop is een PRESENTATIE-
  keuze (beide blijven berekend + gepubliceerd), geen verwijdering → discipline-conform.
- I-D5-003 GDELT-herdefinitie = pre-registratie-amendement (doc 00 §13, grond A2 — datatoegang),
  eerlijk gedocumenteerd in de fetcher-bronstring + `MASTERDOCUMENT-v0.4-addendum.md`.
- Brandstof-2022-piek blijft in de baseline (MAD is robuust; weghalen = cherry-picking,
  +0,2 z, en z_kort 18m vangt recente stijging al). Zie addendum.
- Gevoeligheid: oranje agressief (zichtbare beweging), rood uitzonderlijk (geloofwaardig alarm).
  Niet "opkrikken omdat we een hoger cijfer willen" — dat verbiedt doc 00 §13. Zie [[methodology-discipline]].
