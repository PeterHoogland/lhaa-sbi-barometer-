# SBI Pipeline

Python-pipeline die de non-deterministische indicatoren fetcht.
De deterministische indicatoren (D4, D6, daglicht) berekent de TS engine zelf.

Doc-referentie: `03_Laag-4_Operationalisering.md §5.2 (bronnen) + §5.6 (MVP)`.

## Status per fetcher (bijgewerkt 2026-06)

Alles draait op **echte bronnen**. De labels noemen de werkelijke toegangsweg —
sommige Belgische cijfers halen we via ECB/Eurostat omdat de producent zelf geen
machine-leesbare API heeft (de data is dezelfde officiële statistiek).

| Code     | Indicator                  | Echte bron                                            |
|----------|----------------------------|-------------------------------------------------------|
| I-D1-002 | Hitte (>30°C)              | KMI via open-meteo                                    |
| I-D1-003 | Kou (<-5°C)                | KMI via open-meteo                                    |
| I-D1-004 | Luchtkwaliteit             | open-meteo Air Quality (CAMS-model)                   |
| I-D1-009 | Wateroverlast              | Waterinfo.be (VMM/HIC)                                |
| I-D1-010 | Pollen                     | open-meteo Air Quality (CAMS)                         |
| I-D2-001 | Filezwaarte                | Verkeerscentrum jaarcijfer (YoY); geen netwerk        |
| I-D2-004 | Brandstofprijzen           | be.STAT + ECB ICP (prijsindex)                        |
| I-D2-009 | Treinverstoringen          | iRail (NMBS/Infrabel)                                 |
| I-D3-001 | CPI inflatie               | STATBEL CPI via ECB SDW                               |
| I-D3-002 | Energieprijzen             | ENTSO-E (vereist `ENTSOE_TOKEN`)                      |
| I-D3-003 | Ontslagdruk                | **PROXY** — ECB LFSI werkloosheidsrate-delta (geen open ontslag-feed) |
| I-D3-005 | Werkloosheid               | Eurostat (BE werkloosheidsgraad)                      |
| I-D3-006 | Hypotheekrente             | ECB MIR                                               |
| I-D3-009 | Stroomnet-druk             | Elia Open Data                                        |
| I-D5-001 | Nieuwsnegativiteit         | GDELT DOC v2 + 13 BE-RSS-bronnen                      |
| I-D5-002 | Wikipedia-aandacht stress  | Wikimedia Pageviews (nl.wikipedia)                    |
| I-D5-003 | Collectieve gebeurtenissen | `events.json` (mens-coded) + GDELT                   |

Elke fetcher valt automatisch terug op mock met `simulated: true` wanneer zijn bron
op een dag faalt — eerlijk in de output (doc 09 §2). De CI stuurt dan een
**demo-fallback-melding** (zie `.github/workflows/daily.yml` → stap "Demo-fallback
alert"; `ALERT_WEBHOOK_URL` → e-mail, anders een GitHub-issue als vangnet).
`I-D5-002` was vroeger Google Trends, nu Wikipedia (Google blokkeert server-zoekdata).

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
