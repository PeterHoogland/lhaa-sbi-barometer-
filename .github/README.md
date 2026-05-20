# GitHub Actions cron

Dagelijkse run om 23:00 CET (22:00 UTC). Werkflow doet:

1. **Python pipeline** — fetcht echte data waar mogelijk (open-meteo voor KMI, GDELT, Google Trends)
2. **Engine** — combineert echte waarden met synthetische baseline + berekent CN, percentiel, tier
3. **Web build** — produceert statisch dist/
4. **Surge deploy** — pusht naar `les-hautes-alpes-sbi.surge.sh`

## Vereiste secret

`SURGE_TOKEN` — gegenereerd met `npx surge token`. Toegevoegd in
GitHub repo → Settings → Secrets and variables → Actions.

## Handmatig triggeren

Repo → Actions → "Daily SBI Update" → Run workflow.
