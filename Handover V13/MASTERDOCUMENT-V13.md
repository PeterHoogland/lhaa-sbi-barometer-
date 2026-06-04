# MASTERDOCUMENT-V13 — Methodologie (deltas sinds V12)

Begeleidt `HANDOVER-V13.md`. MASTERDOCUMENT-V12 blijft het volledige methodologie-kader; deze sessie (2026-06-04) was vooral infra (bewaking) + bron-swaps, met enkele scoring-/eerlijkheids-verfijningen. Hier enkel die deltas.

## 1. Geen niet-echte data in het echte cijfer (kernprincipe aangescherpt)
- **Synthetische baseline uitgesloten:** de v0.2-scoring (`runtime.ts`) sluit nu niet-deterministische indicatoren zonder ECHTE baseline (`realBaselineCodes`, ≥60 echte historiepunten in generate-fixture) uit als state "ontbreekt", i.p.v. ze tegen de synthetisch-opgevulde reconstructie-historie te scoren. Reden: trein (I-D2-009, 6 echte punten) gaf een valse z=−2,16. Deterministische indicatoren (kalender/daglicht) zijn uitgezonderd (berekend, altijd geldig). De v0.4-laag deed dit al via `baselineReal`; dit trekt v0.2 gelijk.
- **`imputed` = label-only:** raakt het cijfer NIET (geen scoring), enkel `data_quality.indicators_with_imputed_data` + de "verouderd"/"vertraagd"-weergave. Jaarconstante (I-D2-001) + cache-terugval worden zo eerlijk getoond zonder de meting te veranderen.
- **Cache-terugval ≠ verse meting:** een bron op cache toont nu "verouderd" in de breakdown (detectie op `source` begint met "cache"), naast de canary-degraded-melding.

## 2. Inverse-coding weergave (perceptie-correctie)
Inverse-coded indicatoren (consumentenvertrouwen I-D3-007, daglicht I-D1-001): het toestand-badge toont de richting van de METING, niet van de stress. Hoge stress + inverse → "uitzonderlijk laag" (rood). Z-score/kleur blijven op stress; enkel het label is meting-richting-bewust (`stateLabelFor`). Voorkomt "Consumentenvertrouwen: uitzonderlijk hoog" bij een laag saldo.

## 3. Bron-swaps zijn methodologisch neutraal mits baseline her-ijkt
Bij het vervangen van een bron (lucht: CAMS→IRCELINE; water: GloFAS→VMM+SPW) verandert de waarde-schaal. De baseline `data/history/<code>.json` is daarom HER-BACKFILLED op exact dezelfde bron + formule, zodat de Z-score (vandaag vs. baseline) consistent blijft. Zonder backfill (Sciensano-pollen: geen historie-API) bouwt de meetlat vooruit op en blijft de indicator "ontbreekt" tot ≥60 echte dagen — bewuste keuze (geen scoren tegen een vreemde schaal).

## 4. ⛔ OPEN methodologisch defect — Hitte (I-D1-002)
Live raw_value 26 (temperatuur-schaal) terwijl de baseline hitte-DELTAS zijn (`max(0, temp−30)`, 0-6) → valse z=3 "extreem" terwijl er geen hitte is. **Dit is exact de fout-klasse die §1 wil voorkomen** (waarde + baseline op verschillende schaal). Fix: zorg dat de live-waarde dezelfde delta-schaal heeft als de baseline (check kmi-fetcher + syntheticRawValue; mogelijk viel kmi op mock/temp). Mogelijk ook Kou. Zie HANDOVER-V13 §"EERSTE PRIORITEIT".

## 5. Pollen-promotie: seizoens-overweging
Pollen heeft `applyStl: false` → scoort tegen de RAW baseline. CAMS' baseline is jaarrond (incl. winter-nullen) → "extreem" het hele seizoen. Sciensano bouwt vanaf juni op → ~60 zomerdagen = zomer-only baseline (geen winter) → ander gedrag. Bij promotie (geplande beoordeling 8 aug) expliciet wegen: 60 dagen voldoende voor een eerlijke z, of wachten op vollere seizoensdekking. Pre-registratie-discipline: bron-wissel van een gescoorde indicator = amendement (Peters go), net als I-D3-007.

## 6. Onveranderd t.o.v. V12
Pre-registratie-kader, de zes lagen, de v0.4-trigger-laag (drempels in `triggers.ts`, mode:test), brand-safety (verdriet → CTA-pauze, kalibratie 24 juni), de seizoens-bewuste percentiel-meting, de evidence/equal/demografische composieten, de D-grade-keuzes (Peters overrides I-D5-001/002). Zie MASTERDOCUMENT-V12.
