# Les Hautes Alpes · Stressor-Blootstellings-Index (SBI)

Publieke barometer die elke dag opnieuw meet hoe ongewoon de omstandigheden in
België zijn op 21 gemeten indicatoren (20 gescoord + 1 diagnostisch) in 5
domeinen, plus 4 kalendercontext-signalen — weer, economie, nieuws, kalender.
Niet voor individuele meting; voor het collectief.

🌐 **Live**: [les-hautes-alpes-sbi.brainwolves.workers.dev](https://les-hautes-alpes-sbi.brainwolves.workers.dev)

## Wat zit waar

```
.
├── 00_Pre-Registratie.md         ← methodologische keuzes, publiek vastgelegd
├── 01_Anker-Paper.md             ← laag 1+2: construct + domeinen
├── 02_Laag-3_Indicator-Selectie.md
├── 03_Laag-4_Operationalisering.md
├── 04_Laag-5_Normalisatie.md
├── 05_Laag-6_Weging.md
├── 06_Laag-7_Aggregatie-en-Drempel.md
├── 07_Laag-8_Validatie-en-Robuustheid.md
├── 08_Onderhoud-Protocol.md
├── 09_Brand-Message-Style-Guide.md
│
├── app/
│   ├── engine/       TypeScript: MAD-Z, STL, winsorize, weights, percentile, tier, CN 1-5
│   ├── pipeline/     Python: 13 data-fetchers (KMI, GDELT live; rest mocked of TODO)
│   ├── web/          React + Vite: publieke barometer, embed-snippet, signal-API
│   └── data/         daily output JSON (regenerated)
│
└── .github/workflows/daily.yml    ← cron 23:00 CET → fetch + build + deploy
```

## Lokaal draaien

```bash
# Engine + tests
cd app/engine && npm install && npm test     # 29 tests, doc 04 §7 reproductie

# Pipeline (Python 3.11+)
cd app/pipeline && pip install -r requirements.txt && python -m pipeline.run

# Combineer pipeline output met synthetische baseline → latest.json
cd app/engine && npm run generate-fixture

# Web-app
cd app/web && npm install && npm run dev
```

## Productie-deploy

Cloudflare Workers (static assets) via `wrangler` (config: `app/web/wrangler.jsonc`).
Handmatig: `cd app/web && npm run build && npx wrangler@4 deploy`.

## Automatische update + deploy

GitHub Actions `.github/workflows/daily.yml` (fetch -> build -> `wrangler deploy` ->
post-deploy `verify_live`):
- **Uurlijks** (06-20u BE), getriggerd door de Cloudflare cron-Worker + een GitHub-cron-fallback.
- **Bij elke push naar `main`** (sinds 18/6): een code-wijziging deployt meteen.
- `monitor.yml` (elke 20 min) hertriggert zelf bij data-stilstand.
- Forceren: `gh workflow run daily.yml --ref main`.

Vereist secret: `CLOUDFLARE_API_TOKEN` (zonder wordt de deploy-stap overgeslagen).

## Welke indicatoren zijn echt vs mock?

| Tier | Indicatoren | Status |
|---|---|---|
| **A — deterministisch** | I-D1-001 (daglicht), I-D4-001/002 (kalender), I-D6-001/002/003/005 | Altijd echt — 7 stuks |
| **B — werkende real-fetch** | I-D1-002/003 (hitte/kou via open-meteo), I-D5-001 (GDELT), I-D5-002 (Wikipedia-aandacht) | Echt wanneer pipeline draait — 4 stuks |
| **C — scraper TODO** | I-D1-004, I-D2-001/004, I-D3-001/002/003/005/006 | Mock, eerlijk gevlagd — 8 stuks |
| **D — menselijke codering** | I-D5-003 | Leest `pipeline/events.json` — 1 stuk |

Eerlijk gerapporteerd in elke output onder `data_quality.indicators_simulated`.

## Methodologische discipline

- Pre-registratie van drempels, gewichten, formules (doc 00). Geen achteraf-tuning.
- Stijlgids (doc 09) hard-gecodeerd in `app/web/src/copy.ts`. Geen "u bent gestrest".
- 3-dagen-sustained tier-overgang geankerd in cortisol-cyclus-literatuur (doc 06 §3.5).
- Mediacyclus-decorrelatie protocol (doc 03 §4.4) ingebouwd in engine.
- Brand-safety override (doc 06 §7) automatisch in UI én banner-embed.

## Licentie

Methodologie: CC BY 4.0. Code: MIT.
