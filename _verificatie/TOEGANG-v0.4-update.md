# TOEGANG & INFRASTRUCTUUR — v0.4-update

Uitgevoerd 2026-06-01. Aanvulling op `TOEGANG-EN-INFRASTRUCTUUR.md` (de basis — links, Surge-
account `peter@hoogland.be`, GitHub-collaborators, secrets `SURGE_TOKEN`/`GITHUB_TOKEN`,
bronnen-tabel, lokaal-draaien — blijft geldig). Hieronder alleen wat in v0.4 veranderde.

## Deploy (gewijzigd t.o.v. de basis-doc)

- **`.github/workflows/daily.yml` heeft GEEN push-trigger** — alleen `schedule` (08:00 BE, dual
  cron + tijd-guard) en `workflow_dispatch`. Pushen naar `main` deployt dus NIET vanzelf.
- **Handmatig deployen:** `gh workflow run daily.yml --ref main`. Of wachten op de 08:00-cron.
- Deploys serialiseren (concurrency `deploy-${ref}`, geen cancel): meerdere triggers draaien
  achter elkaar, elk ~6-7 min.
- Pipeline-stap (`python -m pipeline.run`) staat op `continue-on-error: true` — een gefaalde
  fetch blokkeert de deploy niet (val terug op cache/synthetisch + de echte history-baselines).
- `generate-fixture` duurt nu ~2,5 min (730-dagen-percentiel-loop).
- De persist-stap commit terug: `app/data/sbi-cache.json`, `app/pipeline/pending_events.json`,
  `app/data/history`, **`app/data/trigger-state.json`** (nieuw — cooldown-state).

## Backfill-workflow (NIEUW)

`.github/workflows/backfill.yml` — `workflow_dispatch`, input `script`. Draait een backfill-
script op GitHub's schone netwerk en commit de opgehaalde historie naar `main`.
- **Waarom CI:** de lokale/sandbox-omgeving onderschept TLS en is traag → be.STAT en GDELT
  time-outen/429'en lokaal. CI heeft schoon netwerk. (ECB SDMX werkt wél lokaal.)
- Gebruik: `gh workflow run backfill.yml -f script=backfill_fuel_baseline.py` (of
  `backfill_event_baseline.py`). Daarna lokaal `git pull --rebase origin main`.

## Externe bronnen — wijzigingen

| Code | Was | Nu (v0.4) |
|---|---|---|
| I-D2-004 Brandstof | be.STAT €/l (alleen vandaag) | **ECB HICP-index** CP07.2.2 BE (1996→nu), verankerd op be.STAT-dagprijs → maandelijkse €/l-baseline. Endpoint: `data-api.ecb.europa.eu/service/data/ICP/M.BE.N.072200.4.INX` |
| I-D5-003 Gebeurtenis | mensen-codering (geen historie) | **GDELT DOC 2.0 timelinevol** — thema's WAR/TERROR/KILL/NATURAL_DISASTER/… BE, 2021→nu. Zelfde API als de nieuwstoon (I-D5-001). Pre-registratie-amendement (zie MASTERDOCUMENT-v0.4-addendum §B). |
| I-D2-001 Verkeer | Verkeerscentrum filebarometer-scrape (live momentopname) | onveranderd — **geen historische bron**; forward-accumuleert. Open: CI-probe op Vlaanderen/Verkeerscentrum open data, of TomTom Traffic Index. |

Geen nieuwe betaalde API's of tokens. ECB SDMX + GDELT DOC 2.0 zijn open/gratis.

## Verificatie-checklist (v0.4-aanvulling)

- [ ] `cd app/engine && npm test` → 54 groen (29 v0.2 + 25 v0.4).
- [ ] `npx tsc --noEmit` schoon; `cd app/web && npm run build` schoon.
- [ ] `latest.json` bevat een `v04`-blok; 8/9 kern actief (verkeer = "ontbreekt").
- [ ] `data/history/I-D2-004.json` ≈ 360 maandpunten (1996→); `I-D5-003.json` ≈ 1960 dagpunten (2021→).
- [ ] Backtest: `npx tsx app/engine/src/cli/backtest.ts` → tier-verdeling ~groen 69 / oranje 27 / rood 4 %.
- [ ] Publieke CN = instant uit kern-percentiel (geen sustained-na-ijling in de kop).

## Contact — onveranderd
Eigenaar: Peter Hoogland — peter@hoogland.be · Verificatie/beheer: Laurent — laurent@june20.be
(GitHub `laurentjune20`).
