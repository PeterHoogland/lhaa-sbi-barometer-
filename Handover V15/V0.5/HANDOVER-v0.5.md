# HANDOVER v0.5 — Les Hautes Alpes SBI-barometer

**Lees dit eerst als je in een nieuwe Claude-sessie verder werkt.**
Uitgevoerd: 2026-06-01 (avond) · Vervangt `HANDOVER-v0.4.md` als startpunt.
Bouwt voort op v0.4; lees `HANDOVER-v0.4.md` + `MASTERDOCUMENT-v0.4-addendum.md` voor de diepere engine-/methodologie-details (die blijven geldig).

- **Live (nieuw, primair): https://les-hautes-alpes-sbi.brainwolves.workers.dev** (Cloudflare Workers static assets)
- Live (oud, vangnet, wordt uitgefaseerd): https://les-hautes-alpes-sbi.surge.sh
- Repo: https://github.com/PeterHoogland/lhaa-sbi-barometer-
- `main` @ `d563e7c` (deze sessie: `b8576a7` → `d563e7c`, ~16 inhoudelijke commits)
- Project-root: `/Users/franky/Desktop/Les Hautes Alpes Anti Stress Activator (voorlopige werktitel)/`

---

## 0. EERSTE TAAK (was in uitvoering toen de sessie stopte)

**Verkeer (+ brandstof + inflatie) uit de "WAT SPEELT VANDAAG HET MEEST MEE?"-top-3 halen.**
Peter koos expliciet "uit de top-3 halen". Reden: verkeer toont sinds Pad A het JAARgemiddelde
filezwaarte (obs=2024, het record), maar verschijnt in de "vandaag"-lijst met een live-klinkend
label → leest alsof er nú file staat (verwarrend om 23:35). Energie blijft (echte dagprijs).

**Concreet (nog te doen):** in `app/web/src/components/TopInfluences.tsx` — vóór de
`.sort(...).slice(0,3)` (regel ~9-12) — de trage/structurele codes wegfilteren:
```ts
const SLOW = new Set(["I-D2-001", "I-D2-004", "I-D3-001"]); // verkeer(jaar), brandstof(maand), inflatie(maand)
const top = [...breakdown]
  .filter((b) => b.state !== "ontbreekt" && !SLOW.has(b.code))
  .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
  .slice(0, 3);
```
Energie (`I-D3-002`, dagelijkse ENTSO-E-prijs) NIET wegfilteren — die hoort er wel in.
Daarna verifiëren in de preview + deployen (zie §3).

---

## 1. Wat staat er NU live (eindstand sessie)

De **v0.4-kern + alle v0.2-output** draaien zoals in v0.4 (zie HANDOVER-v0.4 §1). Nieuw deze sessie:

- **Hosting verhuisd Surge → Cloudflare.** De site draait nu op Cloudflare Workers static assets
  (`*.brainwolves.workers.dev`). Reden: Surge's CDN-edge plakte oude deploys ~27 min vast
  (`surge-cache: HIT`, hoge `age`) en negeerde `must-revalidate` → bezoekers zagen de oude bundel.
  Cloudflare honoreert `must-revalidate` + propageert instant. **De dagelijkse cron deployt nu
  automatisch naar Cloudflare** (token werkt — zie §3).
- **Campagne-webhook (trigger-uitgang) gebouwd** — `app/engine/src/webhook.ts`. Stuurt `v04.triggers[]`
  naar `CAMPAIGN_WEBHOOK_URL`; leeg → dry-run. Nog GÉÉN endpoint gekoppeld (Zapier geparkeerd).
- **Verkeer I-D2-001 = Pad A** (officiële filezwaarte, jaarcijfer; traag + grondlast). Zie §2.
- **Volledige UI-overhaul** (foto, kleuren-per-niveau, mobiel, header, teksten). Zie §2.
- **Triggers blijven in `mode: "test"`** (handmatige goedkeuring, vuren niks automatisch). Bewust —
  kalibratie-review gedaan, maar bevriezen/live uitgesteld tot meer LIVE-historie + een Zapier-endpoint.

---

## 2. Wat deze sessie gebouwd is (per gebied, met commits)

### A. Campagne-webhook (`d92ddbc`)
- `app/engine/src/webhook.ts`: `buildWebhookPayload` (puur, schema `lhaa-sbi-webhook/v1`) +
  `dispatchTriggers` (POST met time-out, vangt élke fout op → breekt nooit de build). Geëxporteerd
  via `src/index.ts`. Aangeroepen aan het eind van `cli/generate-fixture.ts`.
- `daily.yml`-stap "Generate daily output" geeft `CAMPAIGN_WEBHOOK_URL`/`CAMPAIGN_WEBHOOK_TOKEN` door
  (secrets; nu leeg → dry-run die de payload logt). 12 tests in `test/webhook.test.ts`.
- Dedup = engine-cooldown + getrackte `trigger-state.json` (bewust géén apart dispatch-state-bestand).

### B. Verkeer Pad A (`4a34df8` + backfill `eb60aa9`)
- **Herdefinitie:** I-D2-001 = officiële **filezwaarte** (km·uur/werkdag) uit de Verkeerscentrum-
  jaarrapporten i.p.v. de oude homepage-scrape-proxy. Jaarreeks 2013-2024 (604→952), hardcoded in
  `app/pipeline/pipeline/fetchers/verkeerscentrum.py` als `ANNUAL_FILEZWAARTE` (= bron van waarheid).
- **Geen publiek machine-leesbare maand/dag-reeks** (webtool interactief, DATEX realtime, VDV
  Itsme-auth — bevestigd via deep-research). Daarom de jaarmaat. Verrijking = uitgever mailen
  (`wegen.verkeer@mow.vlaanderen.be`).
- **Backfill** `app/pipeline/scripts/backfill_verkeer_baseline.py` (geen netwerk): schrijft een
  maand-projectie (piecewise-constant, 144 punten) naar `app/data/history/I-D2-001.json`.
- **Reclassificatie** (`indicators/kern.ts`): klasse ⚡direct → 🐢**traag**, toegevoegd aan
  `ACHTERGROND_CODES` (grondlast). `registry.ts`: `applyStl=false`. `plain-language.ts`: unit
  "km·uur/werkdag", reads herschreven. `generate-fixture.ts`: synthetische fallback op nieuwe schaal.
- **§3.3-fix** (`methodology/triggers.ts`): grondlast-bronnen (energie/brandstof/inflatie/verkeer)
  zijn uitgesloten van T2 (`indicator.red`) via `GRONDLAST_SET` — ze laden de drempel, vuren niet
  zelf (anders dubbeltelling: verkeer op P94 verlaagt via load_factor de drempel die het zelf vangt).
  Test `redCore` aangepast naar niet-grondlast-code + nieuwe test toegevoegd. 67 tests groen.
- **Amendement** gedocumenteerd in `MASTERDOCUMENT-v0.4-addendum.md` §F.
- **LET OP (bekend neveneffect):** verkeer staat op zijn jaarrecord (z_lang ~4,4, P94, state "rood"),
  laadt de achtergrond én verschijnt nu hoog in de top-3 met een live-klinkend label → zie §0.

### C. UI-overhaul
1. **Kern-kaart ondertitel** (`e9f2323`, `b80a4ef`): jargon weg → "De kern-indicatoren + achtergrond druk".
2. **Footer-noten weg** (`4934710`): McEwen/Marmot/Hobfoll + "Methodologie open / Code / Pre-registratie"
   verwijderd uit `App.tsx`; logo + tagline blijven.
3. **Header** (`48ff7e1`, `e94296d`, `1deefa1`): geëindigd op een **slanke balk van 96px** (`.hero-top`
   padding `4px 32px 6px`), **logo 60px**, slogan "Natuurlijk in het hart van de Alpen." onder het logo,
   lead op 2 regels via een **harde `<br/>`** (geen `text-wrap: balance` meer; `max-width: 46rem`).
   (Historie: eerst 175px/56px = origineel gematcht, toen logo 2×/112px, toen op verzoek gehalveerd.)
4. **Eyebrow-titel +30%** (`1deefa1`): `.intro-eyebrow` 0.74→0.96rem.
5. **"STRESS-CIJFER OP DIT MOMENT"** (`b80a4ef`): was "...VAN VANDAAG". Blijft in HOOFDLETTERS (keuze Peter).
6. **Panelen herordend + hernoemd** (`b7c57f0`): volgorde = Wat dit is → De kern → 60 dagen →
   "Inzichten voor wetenschappers, journalisten en adversariële reviewer" (was "Technische details") →
   "Extra Expert view" (was "Expert view") → databronnen → wetenschappelijke bronnen.
   Expert-ondertitel ontjargond. Trigger-status-tekst → "Campagne-triggers (testfase): geen vandaag".
7. **Paginabrede hero-foto** (`9a94057`): **`/hero.jpg`** = echte Hautes-Alpes-foto (belvédère
   Saint-Apollinaire, gedownload van hautes-alpes.net, ligt in `app/web/public/hero.jpg`). Gezet als
   **fixed `body::before`** (+ `body::after` groene gradient-tint), achter alles. Loopt door op de
   zijkanten + in de gaten tussen de witte blokken; de blokken zijn ondoorzichtig → foto nooit ín een
   blok. Header-eigen `.hero-bg`/`.hero-tint` + de Unsplash-URL verwijderd.
8. **Kleuren evolueren met het niveau** (`be86575`): `.cn-display.cn-level-{1..5}` zetten elk een
   `--cn-accent` + `--cn-tint`: groen → mid-groen → amber → rood → grijs(pauze). Cijfer, eyebrow-label,
   kicker én kaart-achtergrond kleuren mee.
9. **Mobiele versie** (`d563e7c`): `@media (max-width: 640px)`-blok onderaan `styles.css`. Belangrijkste
   fix: de "Naar hautes-alpes.net"-link stond absoluut top-right en dekte het gecentreerde logo af →
   nu `position: static`, gecentreerd boven het logo. Plus: compactere marges, kleiner cijfer, "LAAG"
   links onder het cijfer, top-3 "↑/↓ duwt"-kolom onder de tekst (knaagde anders de body tot losse woorden).

### D. Hosting Surge → Cloudflare (`0c4b764`, `898a015`, `00398e3`)
- `app/web/wrangler.jsonc`: Workers static-assets config (`assets.directory: ./dist`, SPA-fallback,
  **`account_id` ingebakken** = `90650c9157a45b740546805924c8c42e`, zodat CI alleen een token nodig heeft).
- `daily.yml`: **Cloudflare-deploystap** (primair) vóór de Surge-stap. Token-guarded: draait
  `npx wrangler@4 deploy` alleen als de token-env niet leeg is. **De Cloudflare API-token staat als
  repo-secret `LESHAUTES`** (Peter noemde 'm zo i.p.v. CLOUDFLARE_API_TOKEN; de workflow mapt
  `CLOUDFLARE_API_TOKEN: ${{ secrets.LESHAUTES }}`). De Surge-stap staat er nog als tijdelijk vangnet
  ("verwijderen na cutover" — zie open punt). `.wrangler/` is gegitignored.

---

## 3. Operationeel — deployen (LEES DIT)

- **Dagelijks automatisch:** de cron in `daily.yml` (08:00 BE-tijd) doet fetch → build → **deploy naar
  Cloudflare** (token werkt) + Surge (vangnet) + persist. Geen handwerk meer voor de dagelijkse update.
- **Code-wijziging live zetten (aanrader):** committen + `gh workflow run daily.yml --ref main`. De CI
  bouwt en deployt naar Cloudflare (~6-7 min). `gh` is ingelogd als `PeterHoogland`.
- **Snelle LOKALE deploy** (gebruikt tijdens deze sessie; ~1 min i.p.v. 7): in `app/web` —
  haal verse data van de live site (sneller dan 2,5 min `generate-fixture`), bouw, deploy met de
  lokale `wrangler login` (account "brainwolves", scope workers:write):
  ```bash
  cd app/web && U="https://les-hautes-alpes-sbi.brainwolves.workers.dev"
  for f in data/latest.json data/sparkline-30d.json data/signal.json api/v1/signal.json; do curl -s "$U/$f" -o "public/$f"; done
  npm run build && npx --yes wrangler@latest deploy
  ```
  Daarna **`git checkout -- app/data app/web/public`** (gegenereerde data terugzetten → code-only commits).
- **`hero.jpg` is een vast asset** in `app/web/public/` (getrackt) — NIET terugzetten met git checkout.
- **Cache:** Cloudflare serveert `max-age=0, must-revalidate` en honoreert dat → bezoekers zien direct
  de nieuwste deploy. (Surge deed dat niet.) Verifieer live met
  `curl -s $U/ | grep -oE "index-[A-Za-z0-9_-]+\.(js|css)"` en grep de bundel op nieuwe teksten.
- Tests: `cd app/engine && npm test` (67 groen) · `npx tsc --noEmit`. Web-build: `cd app/web && npm run build`.
- Backtest (kalibratie): `cd app/engine && npx tsx src/cli/backtest.ts` (~1 min).

---

## 4. Open punten

1. **(EERST, in uitvoering)** Verkeer/brandstof/inflatie uit de "WAT SPEELT VANDAAG"-top-3 — zie §0.
2. **Surge eruit:** Cloudflare-auto-deploy is bevestigd werkend → de Surge-stap in `daily.yml` mag weg
   (één blok). Eventueel later de surge-URL als custom domain op de Worker zetten.
3. **Zapier / campagne-eindpunt** (geparkeerd op Peters verzoek): wanneer Peter een
   `hooks.zapier.com/hooks/catch/.../...`-URL aanlevert → koppelen als `CAMPAIGN_WEBHOOK_URL` (mag
   ik instellen, is een URL geen credential). Dan stuurt de barometer triggers naar zijn Zap; in
   test-modus reist `require_manual_approval` mee zodat de Zap enkel meldt, niet auto-lanceert.
4. **Drempels bevriezen → live** (geparkeerd): kalibratie-review is gedaan (backtest 742d: ~2×/maand
   `composite.red`, 5,3% rode dagen — vorm OK maar op grotendeels BACKFILL-data). Peter koos:
   pas bevriezen + `mode: live` zetten ná méér ECHTE live-dagen + zodra Zapier er is. Niet nu doen.
5. **Spanning CN-kop vs v04-kern:** de publieke kop (CN, `condition_level`) gebruikt de v0.2-percentiel
   (`percentile.short_24m`, was 2 → CN 1 "Rust"), maar de v04-kern-percentiel (`v04.percentile.lang`)
   kan tegelijk hoog staan (bv. P77/amber, opgeblazen door verkeer's jaarrecord z=4,4 + energie z=2,7).
   Twee metingen kunnen dus tegenstrijdig ogen ("Rust" vs technisch "amber"). De build-status-memory
   zei ooit "CN komt uit percentile.lang" — dat klopt nu NIET met de live data; check `web/src/lib/
   explainer.ts` (`buildContext`/CN-mapping) als je dit wil verzoenen. Niet urgent, wel goed om te weten.
6. **Verkeer 2025-cijfer:** het jaarrapport 2025 is al uit (april 2026); `ANNUAL_FILEZWAARTE` stopt bij
   2024 (952). Voeg 2025 toe wanneer je het cijfer hebt → backfill opnieuw draaien.

---

## 5. Ratificeerde keuzes (NIET zomaar terugdraaien)

- Verkeer = officiële filezwaarte (jaarmaat), traag + grondlast, uitgesloten van T2. Pre-registratie-
  amendement (doc 00 §13 A2), zie addendum §F. [[methodology-discipline]]
- Triggers blijven `mode: test` tot kalibratie op echte live-historie + bevriezing (spec §8).
- "STRESS-CIJFER OP DIT MOMENT" blijft in HOOFDLETTERS (consistent met de andere eyebrows).
- De foto loopt op de zijkanten, nooit ín de witte info-blokken (die blijven ondoorzichtig).
- Cloudflare is de primaire host; cache-correctheid was de reden van de verhuizing.
