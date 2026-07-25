# HANDOVER-V15 - De Nationale Stress Index (motor: SBI), Les Hautes Alpes

**Lees dit eerst in een nieuwe sessie.** Vervolg op `V14/HANDOVER-V14.md` (4 juni, stand v0.2). Tussen V14 en nu is er veel veranderd: het hoofdcijfer is twee keer geherdefinieerd en de campagne staat op het punt live te gaan. De diepere stappen staan in de dagelijkse sessieverslagen in `~/Desktop/De Nationale Stress Barometer/` (HANDOVER_2026-06-17 t/m 20 + AVOND-2). Datum: 2026-06-21.

- **Live:** https://les-hautes-alpes-sbi.brainwolves.workers.dev (Cloudflare Workers).
- **Repo:** https://github.com/PeterHoogland/lhaa-sbi-barometer- · `main` · PUBLIEK · `gh` als PeterHoogland.
- **Root:** `/Users/franky/Desktop/Les Hautes Alpes Anti Stress Activator (voorlopige werktitel)/`
- **GO-LIVE: maandag 22 juni 2026, 07:00 (automatisch, zie sectie 4).**
- **Publieksnaam:** De Nationale Stress Index. **Afzender:** een initiatief van June20, in samenwerking met het toeristisch agentschap van Les Hautes-Alpes.
- **methodology_version:** 0.4.1. **Schrijfstijl Peter:** je-vorm, neutraal, GEEN em-dashes, eerlijk en specifiek.
- **HEAD na deze sessie:** `79547a8`.

---

## 0. TL;DR, de stand na deze sessie

1. **Het hoofdcijfer is de hybride dagkop `daily_pressure`** (sinds 0.4.0/0.4.1). Een vast structureel anker (kosten van levensonderhoud en energie, vergeleken met 2010-2019) gecombineerd met de dagelijkse beweging (weer, nieuwstoon, verkeer en openbaar vervoer). Het cijfer ademt met de dag. Vandaag rond 85. 50 = normaal.
2. **De campagne gaat maandag 22/6 om 07:00 automatisch live.** Een datum-gate in `daily.yml` zet `SBI_STRICT_REAL=1` vanaf de Brusselse datum 22/6. Geen handmatige stap, geen agent, geen push op de dag zelf. Vandaag in productie bewezen: hij logt "UIT".
3. **Afzender beslist (Peter 20/6): June20 als initiatiefnemer, Les Hautes-Alpes als partner.** Doorgevoerd op site (footer + meta) en in beide persberichten.
4. **Frontend volledig consistent gemaakt** (multi-agent audit, 22 fixes): hero-claim-grens hersteld (meet omstandigheden, niet individueel ervaren stress), em-dashes uit user-facing copy, naam overal "De Nationale Stress Index", "telt niet mee"-paneel verwijderd.
5. **Persberichten en wetenschapsdocs geactualiseerd** naar 0.4.1 + de afzender + plain language.
6. **Kritiek pad blijft de campagne-kant op 22/6.** De CTA-banner staat bewust UIT (Peter: geen CTA-wijziging deze ronde).

**Tests:** engine 206/206 (14 bestanden), pipeline 12 suites, web-build groen. **Live laatste controle:** versie 0.4.1, kop ~85, `day_signals` = verkeer + STIB + De Lijn, `indicators_simulated`/`missing` leeg.

---

## 1. Wat er veranderde sinds V14 (de korte boog)

V14 (4 juni) had als publieke kop het **relatieve seizoenspercentiel** (~69). Dat las misleidend laag tegenover de crisisjaren 2024-2025. Daarna, in volgorde:

- **0.3.7 (17/6):** kop werd de **brede absolute meting** `broad_pressure` ("vs normale tijden 2010-2019", 8 indicatoren), publieksnaam terug naar **De Nationale Stress Index**.
- **0.3.9 (19/6):** `broad_pressure` verbreed naar 9 indicatoren (nieuws/GDELT-toon erbij), weer active-regime-geschaald (hitte/koude tegen de niet-nul-spreiding).
- **0.4.0 (20/6):** kop werd de **hybride dagkop** `daily_pressure` (anker + dagelijkse beweging, Phi-blend, w_fast=0.30), met verkeer (DATEX) als dagsignaal. `broad_pressure` werd sub-view.
- **0.4.1 (20/6):** openbaar vervoer (STIB + De Lijn) toegevoegd als dagsignaal, exact zoals verkeer.
- **20/6 (avond) + 21/6:** "telt niet mee"-paneel weg, frontend-consistentie-audit, afzender naar June20, persberichten + wetenschapsdocs naar 0.4.1, en de **automatische datum-gegrendelde go-live**.

De volledige stap-voor-stap staat in de dagelijkse sessiedocs in `~/Desktop/De Nationale Stress Barometer/`. Zie ook `CHANGELOG.md` (repo-root, nieuwste bovenaan) en `00_Pre-Registratie.md` §4.1 (amendementen t/m §4.1.15).

---

## 2. Het hoofdcijfer (methodologie 0.4.1)

Zie het aparte `METHODOLOGIE-V15.md` in deze map voor de volledige uitleg. Kort:

```
daily_pressure.score = round( 100 * Phi( (1 - w_fast) * z_slow + w_fast * z_fast ) )
```
- **z_slow** (traag anker) = gemiddelde MAD-z van 6 structurele codes (inflatie, brandstof, consumentenvertrouwen inverse, werkloosheid, hypotheekrente, energieprijs) vs 2010-2019. Hergebruikt exact de `broad_pressure`-z's.
- **z_fast** (dagelijkse beweging) = gemiddelde z van hitte, koude, nieuwstoon (vs 2010-2019/2017-2019) plus de dagsignalen verkeer (I-D2-001-rt) en OV (I-D2-stib, I-D2-delijn) via hun eigen ECDF.
- **w_fast = 0.30** (`HYBRID_W_FAST` in `app/engine/src/methodology/hybrid-headline.ts`; 0.40 = "meest ademend" optie).
- Sub-views (blijven berekend): `broad_pressure` (9 indicatoren absoluut), `economic_pressure` (5 economisch), relatief seizoenspercentiel (transparantielaag, "tweede lens vs de afgelopen 2 jaar").

**De harde grens:** alleen OV is als dagsignaal toegevoegd. Bewust GEWEIGERD (zou het cijfer rekenkundig fout maken): RSS-nieuws + emotie (dubbel met GDELT), iRail (dubbel met Infrabel-stiptheid), Google Trends (schaal-artefact), Reddit/Mastodon (niet representatief). Niet heropenen zonder dat Peter de dubbeltelling expliciet aanvaardt.

**Claim-grens (in alle user-facing copy):** meet blootstelling aan omstandigheden, NIET individueel ervaren stress; geen causale of fysiologische claim; geen peer-reviewed/gevalideerd-claim. Label = signaalindex.

---

## 3. Afzender (Peter-beslissing 20/6)

Overal: **"een initiatief van June20, in samenwerking met het toeristisch agentschap van Les Hautes-Alpes"** (de framing van het mainstream-persbericht). Doorgevoerd op de site (`App.tsx` footer-h2 + footer-credits, `index.html` meta-description) en in beide persberichten. De Les Hautes Alpes-CTA en de embed-`brand` blijven LHA (partner-stem, geen afzenderclaim). Eerdere documenten die "initiatief van Les Hautes Alpes" zeiden zijn hiermee achterhaald.

---

## 4. Automatische go-live op 22/6 (server-side, datum-gegrendeld)

De campagnemodus gaat **vanzelf** live, zonder enige handeling op de dag zelf.

- **Wat:** in `.github/workflows/daily.yml` staat vlak voor de `generate-fixture`-step een "go-live-gate"-step. Die zet `SBI_STRICT_REAL=1` in `$GITHUB_ENV` zodra de Brusselse datum >= 2026-06-22; daarvoor blijft het uit.
- **Effect:** `SBI_STRICT_REAL=1` laat de synthetische fallback-waarden weg (alleen echte metingen tellen; `indicators_simulated` wordt leeg). Het laat de build NIET falen (gedrag uit `generate-fixture.ts`).
- **Wanneer:** de bestaande 07:00-cron (BE) op maandag 22/6 is de eerste run die omslaat. Daarna elke run.
- **Veiligheid:** datum-gegrendeld, dus kan niet te vroeg. Vandaag (20/6/21) in productie bewezen: de gate logt `Pre-go-live: strict-real UIT`.
- **Terugdraaien:** de gate-step uit `daily.yml` halen.
- **Controleren maandag:** in de CI-log van de 07:00-run staat `Go-live actief: strict-real AAN`; live `indicators_simulated` leeg.

**CTA-banner ("Adem in. Adem uit.")** staat bewust UIT (Peter: geen CTA-wijziging deze ronde). Heractiveren = 1 regel in `app/web/src/App.tsx` (de `CallToAction`-render in `<main>`), volledig reversibel.

---

## 5. Bestands- en architectuurinventaris (voor de programmeur)

Zie het aparte `ARCHITECTUUR-EN-BOUWEN-V15.md` in deze map voor de volledige uitleg: stack, repo-structuur, dataflow, lokaal draaien/bouwen/testen/deployen, en de harde regels. Kort:

- **app/pipeline/** (Python): haalt ~20 bronnen op (`pipeline/run.py`, fetchers met cache/mock-fallback), schrijft `app/data/raw-values.json` + `app/data/history/*.json`. 12 testsuites.
- **app/engine/** (TypeScript): normaliseert + aggregeert + publiceert. `methodology/hybrid-headline.ts` = het hoofdcijfer. CLI: `npm run generate-fixture` (de dag-compute). 206 vitest-tests (14 bestanden).
- **app/web/** (React/Vite op Cloudflare Worker): toont het cijfer + serveert de JSON. `npm run build`.
- **app/cron-worker/**: Cloudflare Worker die `daily.yml` op schema triggert.
- **.github/workflows/**: `daily.yml` (fetch-build-deploy; push naar main deployt meteen), `monitor.yml` (20 min bewaking), `backfill.yml`.

---

## 6. Operationeel (deploy, git, tests)

- **Deploy:** push naar `main` -> `daily.yml` draait pipeline + engine, bouwt web, deployt via `wrangler` naar Cloudflare. Cron-worker triggert 6x/dag (07/08/12/15/17:30/20u BE).
- **Git-dans:** altijd `git pull --rebase origin main` vóór push (CI commit elk uur cache/historie). CI-beheerde bestanden (`app/data/history/*`, `raw-values.json`, `latest*.json`, `sparkline*`, `trigger-state.json`, `web/public/data|api`) na lokale smoketests terugzetten met `git checkout --`. `sbi-cache.json` heeft skip-worktree.
- **Verificatie verplicht:** engine -> `npx tsc --noEmit && npm test` (206). Pipeline -> `python3 tests/test_*.py` (12). Web -> `npm run build`. Live -> altijd de live URL met cache-bust, nooit gecommitte JSON.

---

## 7. Open punten

1. **CTA-banner** (Peter beslist of die later terugkomt; nu bewust uit).
2. **Domein `nationalestressindex.be`** moet live staan voor de embed-snippets + de banner-methodologie-link werken (deze sessie is het dode `barometer.sbi` daardoor vervangen).
3. **w_fast 0.30 vs 0.40** (de ademknop; 1 constante).
4. **OSF-upload** (Peters actie; daarna geldt het 30-dagen-protocol, doc 08).
5. **Klant-uitleg** (`SBI-uitleg-voor-de-klant-V1`) in deze map: controleer of die nog de oude naam/framing draagt en actualiseer indien nodig.
6. **Criteriumvalidatie** (convergentie met gezondheidsuitkomsten) blijft de grootste openstaande wetenschappelijke leemte; zie de wetenschapsdocs.

---

## 8. De wetenschapper-bestanden

De twee Word-documenten voor de wetenschappers (Jelle) staan in `~/Desktop/Voor Jelle - Nationale Stress Index/`: "1. Methodologie en validatie.docx" en "2. Wetenschappelijke onderbouwing per indicator.docx", beide op 0.4.1 (OV toegevoegd, afzender June20). Backups in `~/Desktop/De Nationale Stress Barometer/_docx_backup_2026-06-20/`.
