# 0.5 Handover — SBI-barometer (2026-06-01)

Aparte handover-map: de **code + alle docs** die bij versie 0.5 horen, op één plek.
Bevroren momentopname voor handover/archief.
Geverifieerd **identiek aan de repo** op commit `d563e7c` (alle `diff -rq` schoon).
Live op Cloudflare: https://les-hautes-alpes-sbi.brainwolves.workers.dev

> ⚠️ Dit is een SNAPSHOT (referentie). De **levende code staat in de repo** (`app/`, `.github/`) —
> bewerk daar, niet hier. Deze map is bedoeld om in één keer mee te geven aan een nieuwe sessie.

## Startpunt
Lees **`docs/HANDOVER-v0.5.md`** eerst — dat is de volledige sessie-stand + open punten
(§0 = de eerste taak die nog open staat: verkeer/brandstof/inflatie uit de "WAT SPEELT VANDAAG"-top-3).

## Inhoud

```
docs/                         alle markdown-docs
  HANDOVER-v0.5.md            ← START HIER (deze sessie, vervangt v0.4)
  HANDOVER-v0.4.md            v0.4-handover (engine/methodologie-basis, nog geldig)
  MASTERDOCUMENT-v0.4-addendum.md   methodologie-amendementen (§F verkeer, §H v0.5)
  CODEDOCUMENT-v0.4.md        code-kaart v0.4
  TOEGANG-v0.4-update.md      toegang/infrastructuur
  HANDOVER.md / MASTERDOCUMENT.md / CODEDOCUMENT.md / TOEGANG-EN-INFRASTRUCTUUR.md  (v0.2-era, verouderd)

code/
  app/engine/    methodologie-engine (TS): src/ (incl. webhook.ts, methodology/triggers.ts,
                 indicators/kern.ts), test/ (67 tests groen), package.json, tsconfig.json
  app/web/       frontend (React/Vite): src/ (App.tsx, components/, styles.css, lib/), wrangler.jsonc
                 (Cloudflare Workers static assets), hero.jpg, package.json, vite/tsconfig
  app/pipeline/  data-fetchers (Python): pipeline/fetchers/ (incl. verkeerscentrum.py),
                 scripts/ (backfills, incl. backfill_verkeer_baseline.py), requirements.txt
  app/data/      history/ = echte baselines per indicator; trigger-state.json; sbi-cache.json
  .github/workflows/   daily.yml (cron → Cloudflare-deploy, secret LESHAUTES) + backfill.yml
```

## Belangrijkste v0.5-wijzigingen (zie HANDOVER-v0.5 §2 voor detail + commits)
- Campagne-webhook (`app/engine/src/webhook.ts`) — dry-run tot een endpoint gezet is.
- Verkeer Pad A — officiële filezwaarte, traag/grondlast, §3.3 T2-uitsluiting (`triggers.ts`).
- UI-overhaul — paginabrede hero-foto, kleuren-per-niveau, mobiele versie, header/teksten.
- Hosting Surge → **Cloudflare** (`wrangler.jsonc` + `daily.yml`; token = repo-secret `LESHAUTES`).
- Triggers blijven `mode: test` (bevriezen/live geparkeerd tot meer live-historie + Zapier).
