# CODE-V12 — Architectuur & bestandskaart

Begeleidt `HANDOVER-V12.md`. Beschrijft de codebase-structuur na de V12-sessie. Bouwt voort op CODE-V11 (de kern-architectuur is ongewijzigd; dit doc focust op wat nieuw/gewijzigd is).

## Overzicht datastroom
```
Python pijplijn (app/pipeline)        TS engine (app/engine)            Web (app/web)
  fetchers/*.py  ──► raw-values.json ──► computeDaily()  ──► latest.json ──► React-UI
  (echte data)        (+ secondary)      (Z, STL, winsor,    (publiek v0.2)    (Cloudflare)
                                          composite, percentiel,
                                          tier, brand-safety,
  data/history/*.json ◄── append_to_history     v0.4-triggers)
  (doorlopende baseline)                  generate-fixture.ts = het LIVE-pad
                                          (730d-reconstructie + vandaag)
```

De **CI (daily.yml)** draait: `python -m pipeline.run` (fetch) → `npm run generate-fixture` (engine + reconstructie) → `npm run build` (web) → wrangler deploy. **Uurlijks 6-21u BE** (V12).

## app/pipeline/pipeline — Python fetchers

**Primaire indicatoren (in het cijfer):** kmi (weer), irceline (lucht), waterinfo, pollen, verkeerscentrum (filezwaarte-jaar), fod_economie (brandstof), irail (trein), statbel (CPI/werkloosheid), energy_charts, fod_waso (ontslagen), nbb (hypotheek), elia (stroomnet), **consumer_confidence (NIEUW V12)**, gdelt (nieuwsnegativiteit), wikipedia (stress-zoek), events (gebeurtenissen). D4/D6 zijn deterministisch in de engine.

**Secundaire fetchers (NIET in cijfer):** reddit, **mastodon (NIEUW)**, layoff_radar, gdelt (`news_emotion_secondary`, `news_sadness_secondary` NIEUW, `news_negativity_rss_secondary` NIEUW), **google_trends (NIEUW, herbruikt)**, datex_traffic (+ intra-dag-collector NIEUW), **stib (NIEUW)**, **delijn (NIEUW)**.

**Nieuwe/gewijzigde Python-modules (V12):**
- `consumer_confidence.py` — Eurostat ei_bsco_m (BS-CSMCI) → I-D3-007. Hergebruikt `statbel._parse_eurostat_latest`.
- `lexicon_nl.py` — uitgebreid + `tone_of_text` met NEGATORS/BOOSTERS/DIMINISHERS (negatie-laag).
- `lexicon_emotion_nl.py` — uitgebreid (289 woorden).
- `lexicon_pattern_fr.py` (NIEUW) — Pattern.fr polariteit (3673 woorden, gegenereerd uit de CLiPS XML, BSD).
- `lexicon_fr.py` (NIEUW) — `tone_of_text_fr` (Pattern-fr + NEGATIVE_FR/POSITIVE_FR overlay + FR negatie).
- `media_profiles.py` — `lang`-veld (fr) toegevoegd + FR-profielen + TV Oost-profiel.
- `fetchers/gdelt.py` — `RSS_FEEDS` 22 (17 NL + 5 FR + TV Oost); per-bron-taal-routing (NL→`tone_of_text`, FR→`tone_of_text_fr`); emotie-profiel alleen over NL-bronnen; nieuwe secundaire functies (`news_sadness_secondary`, `news_negativity_rss_secondary`); stash `_LAST_RSS_NEG`.
- `fetchers/events.py` — `RSS_FEEDS` afgeleid van `gdelt.RSS_FEEDS` (één bron van waarheid); keywords uitgebreid (ongeval/rouw).
- `fetchers/reddit.py` — `.rss`-route i.p.v. dode `.json`; 5 subs.
- `fetchers/mastodon.py` (NIEUW), `fetchers/stib.py` (NIEUW), `fetchers/delijn.py` (NIEUW), `fetchers/google_trends.py` (herbruikt voor trending-RSS).
- `fetchers/datex_traffic.py` — `_append_intraday()` (getimestampte snapshots in `I-D2-001-rt-intraday.json`).
- `fetchers/irail.py` — URL `/v1/disturbances`.
- `run.py` — alle nieuwe fetchers gewired (imports + `batch.add`/`add_secondary` + `_fetcher_for`-tabel voor I-D3-007).

## app/engine/src — TS engine

**Nieuw/gewijzigd (V12):**
- `methodology/brand-safety.ts` (NIEUW) — `decideBrandSafety(sig, todayISO)`: pure functie, verdriet-piek → `{flag, reason, expires_estimated}`. Constanten `VERDRIET_SHARE_MIN=0.40`, `VERDRIET_SPIKE_P=90`, `MIN_VERDRIET_HISTORY=20`, `VERDRIET_COLD_START_FLOOR=0.5` (provisoir). Geëxporteerd via `index.ts`.
- `indicators/registry.ts` — `I-D3-007` Consumentenvertrouwen (grade B, inverseCoded, applyStl false).
- `types.ts` — `IndicatorCode`-union: `| "I-D3-007"`.
- `indicators/plain-language.ts` + `methodology/demographic-reach.ts` — I-D3-007-entries.
- `methodology/weights.ts` — ONGEWIJZIGD: gewichten herbalanceren automatisch (equal = 1/domeinaantal; evidence = grade-gewogen). Een nieuwe indicator vereist dus geen gewicht-edit.
- `cli/generate-fixture.ts` — brand-safety-beslissing gewired (verdriet-stats + `decideBrandSafety` → `brandSafety`-input voor vandaag); `I-D5-verdriet` gefilterd uit de publieke secundaire-lijst; `SECONDARY_NAMES` uitgebreid; `syntheticRawValue` case voor I-D3-007.
- `runtime.ts`, `methodology/condition-level.ts`, `methodology/triggers.ts` — ONGEWIJZIGD t.o.v. V11: brand-safety was al volledig bedraad aan de consumptie-kant (CN5-override, `holdForBrandSafety`), alleen werd de vlag nooit geheven. V12 heft hem nu via generate-fixture.

**Tests:** `test/brand-safety.test.ts` (13, NIEUW). Totaal 99 vitest-tests groen. `tsc --noEmit` schoon.

## app/web/src — React-UI
- `components/V04Technical.tsx` — "campagnes: handmatig"-badge verwijderd.
- `components/Methodology.tsx` + `copy.ts` — indicator-count 24→25.
- Rest ongewijzigd. Brand-safety-UI (`BrandSafetyBanner`, `CallToAction` die zich verbergt bij flag≠normal, `ConditionLevelDisplay` kicker "EVEN OP PAUZE") bestond al in V11.

## app/pipeline/pipeline/healthcheck.py (NIEUW, 2026-06-03 avond) — bron-gezondheid-canary
Pure `analyze(raw_values, index, today)` + `main()`. Leest `raw-values.json` (18 primair + 10 secundair, `simulated`-vlaggen) + `latest-expert.json` (composiet/percentiel/breakdown). Verdict ok/degraded/critical. **Alarmeert op `simulated`/cache-terugval/afwezig/stale, NOOIT op waarde 0** (gezonde nul = Google Trends op sportdag, Kou in zomer). Schrijft `health-report.json` → app/data + web/public/data (`/data/health-report.json`). Tests: `tests/test_healthcheck.py` (18). Inventaris is expliciet gedeclareerd zodat een verdwenen fetcher opvalt.

## .github/workflows/daily.yml
- **Canary-stap (NIEUW):** na `generate-fixture` draait `python -m pipeline.healthcheck` (continue-on-error). De oude "demo-fallback alert" is vervangen door: één rollende GitHub-issue (opent bij degraded/critical, sluit bij herstel) + een stap die de run rood markeert bij `critical` (GitHub mailt dan).
- Cron `0 * * * *` + tijd-guard (`H=$((10#$BE_HOUR))`, door bij 6-21).
- Pipeline-stap heeft nu `env: DELIJN_API_KEY: ${{ secrets.DELIJN_API_KEY }}`.
- Persist-stap (`git add -f app/data/history ...`) commit automatisch de nieuwe history-bestanden incl. `I-D2-001-rt-intraday.json`, `I-D3-007.json`, `I-D5-verdriet.json`, `I-D5-trends.json`, etc.

## Belangrijke architectuur-principes (onveranderd, ter herinnering)
- **Het GESCOORDE nieuws-cijfer (I-D5-001) = GDELT-toon.** De RSS-feeds + lexicons voeden de CONTROLE-lezing (poststratificatie) + de trigger-/emotie-laag, NIET het cijfer. Daarom is lexicon-uitbreiding + FR + reach-signaal veilig t.o.v. pre-registratie.
- **Secundaire signalen bouwen historie op** via `append_to_history` (per `data/history/<code>.json`) en kunnen later gepromoveerd worden (pre-reg-amendement). Zo werkt het pad DATEX/verdriet/trends/STIB/De Lijn.
- **Brand-safety raakt het cijfer NIET** — alleen CN5 (banner-override) + CTA-pauze + `require_manual_approval` op triggers.
