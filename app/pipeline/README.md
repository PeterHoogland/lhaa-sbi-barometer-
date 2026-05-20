# SBI Pipeline

Python-pipeline die de 13 non-deterministische indicatoren fetcht.
De 7 deterministische indicatoren (D4, D6, daglicht) berekent de TS engine zelf.

Doc-referentie: `03_Laag-4_Operationalisering.md §5.2 (bronnen) + §5.6 (MVP)`.

## Status per fetcher

| Code     | Indicator                              | Status                         |
|----------|----------------------------------------|--------------------------------|
| I-D1-002 | Hitte (Tmax > 30°C)                    | **REAL** via open-meteo        |
| I-D1-003 | Kou (Tmin < -5°C)                      | **REAL** via open-meteo        |
| I-D1-004 | Luchtkwaliteit                          | mock (IRCEL scraping TODO)     |
| I-D2-001 | Filezwaarte                             | mock (Verkeerscentrum TODO)    |
| I-D2-004 | Brandstofprijzen                        | mock (FOD Economie scrape TODO)|
| I-D3-001 | CPI inflatie                            | mock (STATBEL CTAS TODO)       |
| I-D3-002 | Energieprijzen                          | mock — needs `ENTSOE_TOKEN`    |
| I-D3-003 | Aangekondigde ontslagen                 | mock (FOD WASO scrape TODO)    |
| I-D3-005 | Werkloosheid                            | mock (STATBEL TODO)            |
| I-D3-006 | Hypotheekrente                          | mock (NBB Stat CSV TODO)       |
| I-D5-001 | Nieuwsnegativiteit                      | **REAL** via GDELT DOC v2      |
| I-D5-002 | Google Trends stress-termen             | **REAL** via pytrends (fragiel)|
| I-D5-003 | Collectieve gebeurtenissen              | leest `events.json` (mens-coded)|

Real-fetchers vallen automatisch terug op mock wanneer de bron faalt,
met `simulated: true` in de output — eerlijk per doc 09 §2.

## Run

```bash
pip install -r requirements.txt
python -m pipeline.run                    # fetcht vandaag
python -m pipeline.run --date 2026-05-15  # specifieke datum
python -m pipeline.run --history-days 30  # ook 30 dagen historie
```

Output:
- `app/data/raw-values.json` — vandaag, voor consumptie door de engine
- `app/data/raw-history.json` — wanneer `--history-days > 0`

## Events.json format

```json
[
  { "date": "2026-05-15", "magnitude": 3, "label": "Hypothetisch event" }
]
```

Magnitude conform doc 03 §2.5: 1 (regionaal), 3 (nationaal), 5 (terreur/oorlog/massa-evacuatie).
Codeer-protocol: twee codeurs, κ ≥ 0.75 op 50 historische test-cases vereist voor livegang.
