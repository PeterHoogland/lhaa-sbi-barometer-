# Verbeterplan V3 — status per item (eerlijk uitgevoerd)

Bron: `_PROJECTEN/.../perplexit verbetering /V3 SBI_VERBETERPLAN_CLAUDE_CODE.md`. Bijgewerkt 2026-06-03.
Legenda: ✅ gedaan + live · 🟡 deels / scaffolding · ⛔ Peters override (bewust niet gedaan) · ⏳ vereist CI/numpy/externe data, niet in-sessie te faken.

## Fase 0 — Code-defecten (✅ allemaal, live geverifieerd)
- **0-bis.1 placeholder-diagnostiek** ✅ — `correlation_inverse_vs_equal_12w`, `bootstrap_95_ci_around_equal`, `fixed_2010_2019` staan live op `null` + `*_status: "not_computed"`. Geen verzonnen getallen meer.
- **0-bis.2 lookahead-lek** ✅ — `buildPercentileHistory` weegt enkel ≤ t; backtest is lookahead-vrij. (Deze sessie ook de seizoens-percentiel-historie lookahead-vrij gehouden.)
- **0-bis.3 te weinig historie → "ontbreekt"** ✅ — `MIN_HISTORY_FOR_Z=30`, anders state "ontbreekt", uit het composiet.
- **0-bis.4 kalibratie-claim triggers** 🟡 — drempels staan vast (`triggers.ts`); een getrackt backtest-artefact (`data/backtest-calibration.json`) is nog niet weggeschreven. Hoort bij de drempel-freeze vóór go-live (22 juni).
- **0-bis.5 v04 lekt niet publiek** ✅ — in `mode: test` is `latest.json` v0.2-only (live geverifieerd `'v04' in latest.json == false`); `latest-expert.json` heeft v04.

## Fase 1 — Interne consistentie (✅)
- **1.1 één bron van waarheid** ✅ — publieke kop = v0.2; deze sessie ook de kicker + status-kaart op één band-logica gezet.
- **1.2 indicator-status per laag** ✅ — publieke lijst = v0.2; v0.4 in expert-paneel, expliciet gelabeld.
- **1.3 demo-data eerlijk** ✅ — `data_quality` per-indicator; live `simulated: []`.
- **4.1 robuuste z + 0,6745** ✅ — `zscore.ts` heeft de MAD-schaal (1.4826 = 1/0.6745) + IQR/SD-fallback + NaN-markering (review-bevinding: zat er al in).
- **5.1 provenance** ✅ — provenance door de pipeline; demo-fallback-mailalert.

## Fase 2 — Construct + evidence-grading (✅, met Peters overrides)
- **2.1 herpositioneer construct** ⛔ — Peter behield bewust "Stressor-Blootstellings-Index" (rename teruggedraaid). De eerlijke "wat dit niet is"-zinnen staan wél bovenaan.
- **2.2 allostatic load als inspiratie** ✅ — gelabeld als theoretische inspiratie, niet als validatie.
- **2.3 Lazer-tegenstrijdigheid** 🟡/⛔ — het plan wil media/wikipedia uit het cijfer; **Peter overrulet en houdt ze ín (grade C)**. Bewuste owner-keuze, gedocumenteerd in `registry.ts`.
- **3.1 STRESS-GRADE A/B/C/D** ✅ — type + registry uitgebreid; live verdeling A:8 B:13 C:2 D:1; grade-D weegt 0 en is verborgen.
- **3.2 grades per cluster** ✅ met override — `I-D3-003` (ontslagen-proxy) = D (uit cijfer); media-toon + wikipedia = **C op Peters keuze** (plan wilde D).
- **6 copy-deck** ✅ — eerlijke claims (verkeer/nieuws-why, allostatic load); deze sessie verder ingekort + jargon weg.

## Fase 3 — Statistische ruggengraat
- **4.2 eCDF / seizoens-normalisatie** ✅ (kern) — deze sessie: **seizoens-bewust percentiel** (`seasonal-percentile.ts`, ±45d, zelfde tijd van het jaar, max 730d). De volledige eCDF met ≥3 jaar per seizoensvenster ⏳ (vereist meer historie).
- **4.3 Monte-Carlo gevoeligheid + Sobol** ⏳ — vereist numpy + parameteriseerbare gewichten in de engine (nu hardcoded in `weights.ts`). `analysis/sensitivity.py` nog te bouwen in CI.
- **4.4 echte bootstrap-CI** ⏳ — nu eerlijk `null` (Fase 0). Een echte resample-bootstrap (≥2000) hoort in de engine; medium ingreep, nog te doen.
- **4.5 1-5-kalibratie** ✅ (vervangen) — het publieke getal is nu een **score op 100 = het percentiel zelf**, seizoensbewust; geen arbitraire 1-5-drempels meer.
- **5.2 repo/pre-registratie-claims** 🟡 — repo bestaat (`github.com/PeterHoogland/lhaa-sbi-barometer-`); een publieke pre-registratie-link is nog te zetten of de claim te nuanceren.
- **5.3 Belgische index duidelijk** ✅ — intro: "een teller voor het hele land" + "voor heel België".

## Fase 4 — Validatie + redundantie
- **4.6 multicollineariteit** ✅ — `app/pipeline/analysis/multicollinearity.py` (pure Python, draait): 16 indicatoren, **0 paren met |Spearman| ≥ 0,70**, effectieve dimensionaliteit ~16/16 → geen dubbeltelling. (Exacte PCA-eigenwaarden ⏳ numpy/CI.)
- **2.4 + 6-bis.4 criteriumvalidatie** 🟡 — `criterion_validity.py` (draait) + verzendklare aanvragen (`DATA-REQUESTS.md`). **Publieke ijkdata opgezocht + verzameld** (`GATHERED-DATA.md`, met directe bron-URL's): 1813/CPZ jaarcontacten 2019-2025 (18.452 → 26.937) + maandtabel bestaat in de PDF; Tele-Onthaal 2022 = 110.269 tel; RIZIV depressie/burn-out-invaliditeit eind 2023 = 137.454 (+44% sinds 2018); Sciensano angst/depressie per golf (2018: 11,2%/9,4% → 2024: 19%/17%, met methode-discontinuïteit). Staat als CSV in `validation/data/`. **Beperking:** dit zijn jaar-/golfcijfers, dus geen datum-overlap met de jonge dag-SBI → nog geen echte correlatie. Pad naar echte validatie: (a) CPZ-**maandreeks** uit de PDF extraheren + de SBI-composiet-historie als maandexport, of (b) dagcijfers van de hulplijnen via afspraak.

## Fase B — Bronnen
- **6-bis.1 echte gratis API's** ✅ — alle indicatoren draaien op echte bronnen (live `simulated: []`), met self-repair-pass.
- **6-bis.2 ervaren-stress-pijler (NBB-enquête, EPU-index)** ⏳ — nog te bouwen als aparte `ervaren_stress`-component + fetchers.
- **6-bis.3 media-toonpipeline** 🟡 — RSS + valentie + bron-poststratificatie + emotie-laag (woede/angst/verdriet/walging) draaien; de ML-upgrade (RobBERT/CamemBERT) + FR-tak ⏳.
- **6-bis.5 lacune-sectie** ✅ — deze sessie: "Wat we (nog) niet dekken" toegevoegd aan de methodologie-pagina.

## Samengevat
Het kritieke deel van het plan (Fase 0, 1, 2, evidence-grading, echte API's, eerlijke copy) is gedaan en live. Deze sessie toegevoegd: multicollineariteit-audit (geen redundantie gevonden), criteriumvalidatie-stub met datacontract, en de lacune-sectie. Wat rest is bewust ⛔ (Peters overrides: naam + media/wiki grade-C) of ⏳ (numpy/CI + engine-refactor + externe datadelingsprotocollen): Monte-Carlo-Sobol, echte bootstrap-CI, ervaren-stress-pijler, ML-mediapipeline, en de echte criteriumvalidatie tegen klinische ijkbronnen.
