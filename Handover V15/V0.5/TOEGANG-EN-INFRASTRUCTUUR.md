# TOEGANG & INFRASTRUCTUUR — SBI Barometer

**Project:** Les Hautes Alpes · Anti-Stress Activator (barometer)
**Versie:** SBI v0.2 (24 indicatoren + 2 secundair, 6 domeinen)
**Status:** Live, dagelijks bijgewerkt om 09:00 Belgische tijd
**Document uitgevoerd:** 2026-05-31

Dit document bundelt alles wat een externe reviewer/beheerder/collaborator
nodig heeft om het project te verifiëren, lokaal te draaien of te onderhouden.

---

## 1. Live-toegang (publiek, geen login)

| Wat | URL |
| --- | --- |
| Website | https://les-hautes-alpes-sbi.surge.sh |
| Volledige data (JSON) | https://les-hautes-alpes-sbi.surge.sh/data/latest.json |
| Sparkline 60 dagen | https://les-hautes-alpes-sbi.surge.sh/data/sparkline-30d.json |
| Compacte signal-API (banner-embed) | https://les-hautes-alpes-sbi.surge.sh/api/v1/signal.json |

De site is statisch (geen backend, geen database, geen login). Alle data is
publiek. Embedbaar via de signal-API + een JS-snippet.

---

## 2. Broncode (GitHub)

| Wat | URL |
| --- | --- |
| Repository | https://github.com/PeterHoogland/lhaa-sbi-barometer- |
| Issues | https://github.com/PeterHoogland/lhaa-sbi-barometer-/issues |
| Actions (cron-runs) | https://github.com/PeterHoogland/lhaa-sbi-barometer-/actions |
| Settings → Collaborators | https://github.com/PeterHoogland/lhaa-sbi-barometer-/settings/access |

**Laatste commit:** `36702fc · 2026-05-21 22:05:08 +0200 · Header groter logo + scheidingslijn; domeinen als fotokaarten`

---

## 3. Mensen met toegang

| GitHub-handle | Rol | Wat ze kunnen |
| --- | --- | --- |
| [PeterHoogland](https://github.com/PeterHoogland) | admin | Admin — volledig beheer (code, secrets, mensen, settings, deploy). |
| [laurentjune20](https://github.com/laurentjune20) | admin | Admin — volledig beheer (code, secrets, mensen, settings, deploy). |


**Iemand toevoegen:** https://github.com/PeterHoogland/lhaa-sbi-barometer-/settings/access → *Add people* → username of e-mail.
Of via CLI: `gh api -X PUT repos/PeterHoogland/lhaa-sbi-barometer-/collaborators/USER -f permission=push|admin`.

---

## 4. Hosting & deploy

| Onderdeel | Configuratie |
| --- | --- |
| Front-end-hosting | **Surge.sh** (statisch, gratis tier) |
| Subdomain | `les-hautes-alpes-sbi.surge.sh` |
| Surge-account | `peter@hoogland.be` |
| Build & deploy | **GitHub Actions** — dagelijks 09:00 BE-tijd + bij elke push naar `main` |
| Workflow-bestand | `.github/workflows/daily.yml` |
| Pipeline-runtime | Python 3.11 + Node 22 LTS (geforceerd Node 24 voor `actions/*`) |
| Cron (dual) | `0 7 * * *` (UTC, zomer) + `0 8 * * *` (UTC, winter), met BE-tijdwacht |
| Auto-commit | Cache (`sbi-cache.json`), pending events en historie worden teruggecommit |

### Deploy-flow

```
push naar main  ─┐
                 ▼
        GitHub Actions trigger
                 │
                 ├── python -m pipeline.run         (haalt 17 echte bronnen op)
                 │       │
                 │       ▼
                 │   schrijft  app/data/raw-values.json
                 │   appended  app/data/history/*.json   (echte baselines)
                 │
                 ├── npm run generate-fixture       (TS-engine berekent composiet)
                 │       │
                 │       ▼
                 │   schrijft  app/web/public/data/{latest,signal,sparkline-30d}.json
                 │
                 ├── npm run build                  (Vite bouwt React-bundle)
                 │
                 └── surge ./dist les-hautes-alpes-sbi.surge.sh
                         │
                         ▼
                     Site live
                 │
                 ▼
        Auto-commit: cache + historie
                 │
                 ▼
        Nieuwe baseline-data in git
```

### GitHub-secrets (alleen namen, niet de waarden)
- `SURGE_TOKEN` — bijgewerkt op 2026-05-20
- `GITHUB_TOKEN` — automatisch door GitHub geleverd aan elke run.

**Token roteren (Surge):**
```
# 1. nieuwe token genereren
surge token

# 2. in GitHub plaatsen
gh secret set SURGE_TOKEN --body "<nieuwe-token>" --repo PeterHoogland/lhaa-sbi-barometer-
```

---

## 5. Externe data-bronnen (24 primair + 2 secundair)

Alle bronnen zijn open / publiek. Geen betaalde API's. Geen tokens nodig
(behalve de Surge-deploy-token hierboven).

| Code | Dom | Indicator | Databron |
| --- | --- | --- | --- |
| `I-D1-001` | D1 | Daglicht | [NOAA Solar Calculator (astronomisch)](https://gml.noaa.gov/grad/solcalc/) |
| `I-D1-002` | D1 | Hitte | [KMI (via open-meteo)](https://www.meteo.be) |
| `I-D1-003` | D1 | Koude | [KMI (via open-meteo)](https://www.meteo.be) |
| `I-D1-004` | D1 | Luchtkwaliteit | [IRCEL-CELINE](https://www.irceline.be) |
| `I-D1-009` | D1 | Staat het water gevaarlijk hoog? | [Waterinfo.be (VMM / HIC)](https://www.waterinfo.be/) |
| `I-D1-010` | D1 | Hoeveel pollen zit er in de lucht? | [open-meteo Air Quality (CAMS)](https://open-meteo.com/) |
| `I-D2-001` | D2 | Verkeersdrukte | [Vlaams Verkeerscentrum](https://www.verkeerscentrum.be) |
| `I-D2-004` | D2 | Brandstofprijs | [FOD Economie](https://economie.fgov.be/nl/themas/energie/energieprijzen) |
| `I-D2-009` | D2 | Hoeveel treinen rijden er in de soep? | [iRail API (NMBS/Infrabel)](https://api.irail.be/) |
| `I-D3-001` | D3 | Inflatie (prijzen stijgen) | [STATBEL](https://statbel.fgov.be/nl/themas/consumptieprijzen/consumptieprijsindex) |
| `I-D3-002` | D3 | Energieprijs | [ENTSO-E Transparency](https://transparency.entsoe.eu) |
| `I-D3-003` | D3 | Ontslagen aangekondigd | [FOD WASO](https://werk.belgie.be/nl/themas/herstructureringen) |
| `I-D3-005` | D3 | Werkloosheid | [STATBEL: Werkloosheid](https://statbel.fgov.be/nl/themas/werk-opleiding/werkloosheid) |
| `I-D3-006` | D3 | Hypotheekrente | [Nationale Bank van België](https://stat.nbb.be) |
| `I-D3-009` | D3 | Trekt België meer stroom dan verwacht? | [Elia Open Data](https://opendata.elia.be/) |
| `I-D4-001` | D4 | Werk-deadlines | [FOD Financiën (fiscale kalender)](https://financien.belgium.be/nl/particulieren/belastingaangifte) |
| `I-D4-002` | D4 | Schoolvakantie | [Vlaamse onderwijskalender](https://onderwijs.vlaanderen.be/nl/schoolvakanties) |
| `I-D5-001` | D5 | Hoe negatief is het nieuws? | [GDELT DOC 2.0 nieuwstoon BE + RSS-controle van 13 BE-bronnen](https://www.gdeltproject.org/) |
| `I-D5-002` | D5 | Hoeveel mensen lezen over stress? | [Wikimedia Pageviews API (nl.wikipedia)](https://wikimedia.org/api/rest_v1/) |
| `I-D5-003` | D5 | Grote gebeurtenis | [Nieuwsmonitoring + menselijke codering](https://www.vrt.be/vrtnws/) |
| `I-D6-001` | D6 | Tot de volgende vakantie | [Federale feestdagen + Vlaamse onderwijskalender](https://onderwijs.vlaanderen.be/nl/schoolvakanties) |
| `I-D6-002` | D6 | Welke dag van de week | [Kalender (deterministisch)](https://nl.wikipedia.org/wiki/Week_(tijdsaanduiding)) |
| `I-D6-003` | D6 | Zomertijd/wintertijd | [Wettelijke DST-data EU](https://eur-lex.europa.eu/legal-content/NL/TXT/?uri=CELEX:32000L0084) |
| `I-D6-005` | D6 | Examens | [Academische kalender](https://onderwijs.vlaanderen.be) |
| `I-D5-006S` | SEC | Reddit-sentiment (onderstroom-peiling) | cache (laatst succesvol: Reddit r/belgium + r/Vlaanderen, 200 posts, NL valentie-lexicon (299 woorden, nl-valence-0.1); SECUNDAIR, niet-representatief, niet in composiet) |
| `I-D3-003S` | SEC | Ontslag-radar (nieuws-detectie) | Ontslag-radar: 3 artikels met collectief-ontslag-thema in 11 BE-nieuwsbronnen; SECUNDAIR, trefwoord-detectie, niet in composiet |


### Historische baselines

24-maands-historie per indicator staat in `app/data/history/<CODE>.json`
en wordt elke dag bijgewerkt door de pipeline (`append_to_history` in
`run.py`). De backfill-scripts in `app/pipeline/scripts/` halen voor
specifieke bronnen ineens de volledige geschiedenis op:

- `backfill_gdelt_baseline.py` — nieuwstoon GDELT (24m).
- `backfill_wikipedia_baseline.py` — Wikipedia-aandacht (~11m).
- `backfill_weather_baseline.py` — KMI/open-meteo (24m, 3 indicatoren).
- `backfill_macro_baseline.py` — ECB + Energy-Charts (8-18 jaar, 5 indicatoren).
- `backfill_flood_baseline.py` — GloFAS rivierafvoer (24m).
- `backfill_pollen_baseline.py` — open-meteo CAMS-pollen (24m).
- `backfill_elia_baseline.py` — Elia stroomnet (24m).

---

## 6. Lokaal draaien (cheat-sheet)

```bash
git clone https://github.com/PeterHoogland/lhaa-sbi-barometer-.git
cd lhaa-sbi-barometer-

# python-pipeline
cd app/pipeline
pip install -r requirements.txt
python -m pipeline.run                  # haalt vandaag's data

# TS-engine + UI
cd ../engine
npm install
npm test                                # 29 tests, moet groen zijn
npm run generate-fixture                # schrijft latest.json
cd ../web
npm install
npm run dev                             # localhost:5173

# build voor productie
npm run build                           # output in dist/
```

---

## 7. Verificatie-checklist voor de reviewer

- [ ] Methodologie consistent met pre-registratie (zie `00_Pre-Registratie.md` t.e.m. `08_Onderhoud-Protocol.md`).
- [ ] Pre-registratie-amendementen expliciet gedocumenteerd (Schema 3 demografisch, Wikipedia ipv Google Trends, 4 nieuwe indicatoren).
- [ ] 29 engine-unittests groen (`cd app/engine && npm test`).
- [ ] TypeScript schoon (`npx tsc --noEmit`).
- [ ] Alle 24 fetchers leveren echte data (`/data/latest.json` → `data_quality.indicators_simulated` is leeg).
- [ ] 20 van de 24 indicatoren wegen tegen een echte historische baseline (zie `app/data/history/`).
- [ ] De resterende 4 (verkeer, brandstof, treinen, gebeurtenissen) accumuleren forward via `append_to_history`.
- [ ] Daily cron draait om 09:00 BE-tijd (zie https://github.com/PeterHoogland/lhaa-sbi-barometer-/actions).

---

## 8. Contact

| Rol | Persoon |
| --- | --- |
| Eigenaar / opdrachtgever | Peter Hoogland — peter@hoogland.be |
| Verificatie / beheer | Laurent — laurent@june20.be (GitHub: `laurentjune20`) |

---

*Einde toegang & infrastructuur-document.*
