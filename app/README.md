# Les Hautes Alpes Anti-Stress Activator

Een publieke barometer die het signaal van de **Stressor-Blootstellings-Index (SBI)**
visualiseert binnen de strikte methodologische en communicatieve grenzen die in de
9 bovenliggende documenten (`00_Pre-Registratie.md` t/m `09_Brand-Message-Style-Guide.md`)
zijn vastgelegd.

> **Implementation stage:** `minimum_viable_pipeline` (conform `03_Laag-4 §5.6`).
> Eerlijk gerapporteerd in elk daily-output-record als `data_quality.implementation_stage`.

## Wat dit is

De SBI is **geen** klinisch instrument, **geen** individuele meting, **geen** peer-reviewed
wetenschap, en **geen** gedragsvoorspeller (doc 01 §3). De barometer toont:

- Tier-stand (groen / oranje / rood) met 3-dagen-sustained-regel
- Percentiel-positie tegen 24-maands voortschrijdende baseline + 2010-2019 vaste referentie
- Top-3 bijdragende domeinen
- 60-daagse sparkline van het percentiel
- Mediacyclus-decorrelatie-diagnostiek (composiet zonder D5)
- Brand-safety-vlag (UI-override bij nationale rouw)
- Datakwaliteit: welke indicatoren gesimuleerd/imputed/missing zijn

## Architectuur

```
   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
   │  pipeline/   │    │   engine/    │    │     web/     │
   │  Python      │──▶ │  TypeScript  │──▶ │  React+Vite  │
   │  fetchers    │    │  methodology │    │  barometer   │
   └──────────────┘    └──────────────┘    └──────────────┘
       raw-values.json   latest.json         /data/latest.json
```

**engine/** is de eenduidige bron-van-waarheid voor de methodologie.
**pipeline/** doet alléén EXTRACT (doc 03 §5.3 stap 1).
**web/** consumeert alléén het daily-output-record en past de stijlgids toe.

## Aan de slag

### 1. Engine + tests

```bash
cd engine
npm install
npm test                  # 23 tests, reproduceert doc 04 §7 voorbeelden
```

### 2. Snelle demo (fixture-data)

```bash
cd engine
npm run generate-fixture  # produceert latest.json met realistische seizoens-mock
cd ../web
npm install && npm run dev
# Open http://localhost:5173
```

### 3. Echte pipeline-run

```bash
cd pipeline
pip install -r requirements.txt
python -m pipeline.run --history-days 730  # 24m historie + vandaag
cd ../engine
npm run compute-daily     # leest pipeline output, draait engine, schrijft latest.json
cd ../web
npm run dev
```

## Welke indicatoren zijn echt vs gemockt?

| Tier | Indicatoren | Bron-status |
|------|-------------|-------------|
| **A — deterministisch** | I-D1-001, I-D4-001/002, I-D6-001/002/003/005 (7 stuks) | NOAA Solar + Belgische kalender — altijd echt |
| **B — real-fetch werkt** | I-D1-002 hitte, I-D1-003 kou | open-meteo (KMI proxy), gratis |
| **B — real-fetch beschikbaar mits token** | I-D5-001 nieuwsneg., I-D5-002 Google Trends | GDELT v2 (no-key), pytrends |
| **C — mock (real-fetch TODO)** | I-D1-004, I-D2-001/004, I-D3-001/002/003/005/006 | scraping/registratie vereist |
| **D — menselijke codering** | I-D5-003 | leest `pipeline/events.json` |

Per indicator wordt eerlijk gerapporteerd of de waarde echt is of gesimuleerd —
zichtbaar in de UI onder "Datakwaliteit" en in elk JSON-record onder `data_quality`.

## Methodologie-discipline

Het project respecteert hard:

1. **Pre-registratie-onveranderlijkheid** (doc 00) — alle drempels, gewichten,
   formules zijn in code bevroren. Wijziging vereist het proces uit doc 08.
2. **Stijlgids** (doc 09) — geen "u bent gestrest", geen klinische taal,
   geen demografische uitsplitsing. Hard-coded in `web/src/copy.ts`.
3. **Mediacyclus-decorrelatie** (doc 03 §4.4) — composiet zonder D5 wordt
   altijd parallel berekend en gerapporteerd.
4. **Brand-safety-override** (doc 06 §7) — wanneer de vlag staat op
   `elevated` of `block`, schorten we de commerciële uitnodiging op
   terwijl de index blijft rapporteren.
5. **Eerlijke vlaggen** — `simulated`, `imputed`, `missing` per indicator
   in het output-record, en `implementation_stage` in elke build.

## Volgende stappen (target architecture)

1. Real-fetch IRCEL-CELINE via WFS-protocol (vereist GDAL)
2. Real-fetch Verkeerscentrum via TomTom Move API als fallback
3. STATBEL CTAS real-fetch met view-ID-discovery
4. ENTSO-E real-fetch (set `ENTSOE_TOKEN`)
5. Statsmodels STL-implementatie in pipeline i.p.v. naive DOY-mediaan
6. Schedule via cron/launchd voor dagelijkse 23:00 CET run
7. Sign + publiceer SHA-256 hash van pre-registratie op OSF (doc 00 §14)
