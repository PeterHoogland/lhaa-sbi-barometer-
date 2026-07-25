# Fase 0 — codedefecten (checklist)

Bron: externe review `V2 SBI_VERBETERPLAN_CLAUDE_CODE.docx`, §0-bis + §7.
Werkwijze: één taak tegelijk → wijzigen → verifiëren (tsc/tests/backtest/preview) → aan Peter tonen. Niets live zonder OK. Deploy van de hele Fase-0-batch in één keer aan het eind (of op Peters teken).

Status-legenda: ⬜ open · 🔄 bezig · ✅ klaar (geverifieerd)

---

## ✅ Vooraf — verkeer YoY (hoorde bij §1.2, al uitgevoerd)
Commit `906cfe3` + deploy. Verkeer scoort jaar-op-jaar % i.p.v. niveau → z 4,4→~0, "rood"→"normaal". Backtest: rode dagen 5,3%→4,0%.

---

## ✅ Taak 1 — placeholders eerlijk maken (0-bis.1)  [commit ca41cf7, live]
**Probleem:** drie velden in `latest.json` ogen als metingen maar zijn verzonnen.
- `composite.weight_sensitivity.correlation_inverse_vs_equal_12w` = hardcoded `0.84` — `runtime.ts:163/250`
- `composite.weight_sensitivity.bootstrap_95_ci_around_equal` = ±max(0.1, 0.15·|anchor|) heuristiek, géén bootstrap — `runtime.ts:165/255` + `estimateBootstrapCI` :354
- `percentile.fixed_2010_2019` = `Math.round(percShort)`, kopie van short_24m — `runtime.ts:263` (wordt getoond via `ButtonPanels.tsx:81` → `PercentileDisplay`)
**Fix:** alle drie → `null` + expliciete `*_status: "not_computed"`. Dode `estimateBootstrapCI` verwijderen. Types (engine + web) nullable maken. `PercentileDisplay` verbergt de 2010–2019-regel bij `null`. (Echte berekening = Fase 3 §4.4 / aparte baseline.)
**Acceptatie:** geen veld in `latest.json` draagt een naam die een niet-uitgevoerde berekening suggereert.

## ✅ Taak 2 — lookahead-lek dichten (0-bis.2)  [commit b789cb8, +2 tests]
**Probleem:** `buildPercentileHistory` (`runtime.ts:361`) berekent elke dag tegen het héle venster (incl. toekomst); voedt de tier (:176, :514). Backtest claimt "lookahead-vrij" maar gebruikt dit.
**Fix:** percentiel op dag *t* alleen tegen punten ≤ *t* (rollend 24m / lang venster). Backtest opnieuw draaien; unit-test die bewijst dat latere data een bevroren dag niet verandert.
**Acceptatie:** percentiel/tier op elke dag hangt aantoonbaar alleen af van data t/m die dag.

## ✅ Taak 3 — "te weinig data" ≠ "normaal" (0-bis.3)  [commit 8330b8f, +1 test]
**Probleem:** `if (hist.length < 30) { zShort = 0 }` (`runtime.ts:136`) → rendert "normaal" i.p.v. "ontbreekt".
**Fix:** te weinig historie → status "ontbreekt"/null, uitsluiten uit het composiet (zoals de missing-tak al doet), niet als 0 meewegen. Drempel afstemmen met de v04-`MIN_POINTS_FOR_Z` (8).
**Acceptatie:** geen indicator met te weinig historie verschijnt als "normaal".

## ✅ Taak 4 — testlaag (v0.4) lekt niet naar publiek (0-bis.5 / §1.1)  [commit d51b23c — engine splitst publiek/expert]
**FASE 0 COMPLEET.** latest.json = v0.2-only; v04 → latest-expert.json; signal.json v04-getallen null; top-3 nu v0.2; kern-paneel gelabeld "(v0.4 — testfase)".
**Probleem:** het volledige v04-blok (mode "test", eigen statussen) staat onverkort in `latest.json` én `signal.json` (embed-API). Niets in de engine houdt het weg van publiek → "Rust" naast "3 — VEEL TEGELIJK".
**Fix:** op één plek afdwingen dat in `mode = "test"` geen v04-afgeleide waarde een publiek kanaal bereikt (UI, signal.json, /api/v1/signal.json). v04 naar een apart, als "expert/test" gelabeld kanaal. v0.2 = enige publieke bron.
**Acceptatie:** elk publiek kanaal toont in test-modus uitsluitend v0.2-waarden.

---

## Daarna (buiten Fase 0)
- **Fase 1** — één bron van waarheid (1.1), één indicatorstatus publiek (1.2), per-indicator demo/echt-labels (1.3), z-randgeval MAD=0→NaN (rest van 4.1), provenance (5.1).
- **Fase 2 (Peters strategische calls)** — construct hernoemen (2.1), allostatic-load eruit (2.2), evidence-grading A/B/C/D, D⇒w=0 (3), copy-deck (6).
- **Fase 3** — eCDF/CISS-normalisatie (4.2), Sobol-gevoeligheid (4.3), échte bootstrap-CI (4.4), schaalkalibratie (4.5), multicollineariteit (4.6), repo/pre-registratie publiceren (5.2).
- **Fase 4** — criteriumvalidatie tegen Belgische cijfers (2.4).
