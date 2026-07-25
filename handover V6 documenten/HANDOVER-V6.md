# HANDOVER-V6 — Les Hautes Alpes SBI-barometer

**Lees dit eerst in een nieuwe sessie.** Vervangt `HANDOVER-v0.5.md`. Uitgevoerd: 2026-06-02.
Begeleidende docs: **CODEV6** (architectuur), **MASTERDOCUMENT-V6** (methodologie), **TOEGANG-V6** (toegang/infra).
Externe wetenschappelijke review die deze sessie stuurde: `_PROJECTEN/Client-Werk/LES HAUTES ALPES/VERBETER DOC 1 JUNI/V2 SBI_VERBETERPLAN_CLAUDE_CODE.docx`.

- **Live (primair):** https://les-hautes-alpes-sbi.brainwolves.workers.dev (Cloudflare Workers).
- **Repo:** https://github.com/PeterHoogland/lhaa-sbi-barometer- · `main` · `gh` ingelogd als PeterHoogland.
- **Project-root:** `/Users/franky/Desktop/Les Hautes Alpes Anti Stress Activator (voorlopige werktitel)/`
- **Triggers:** `mode: test` (vuren niets automatisch; require_manual_approval reist mee).

---

## 1. Wat er NU live staat (na deze sessie)

Twee parallelle lagen, sinds deze sessie netjes gescheiden:
- **MEETLAAG = het publieke cijfer (v0.2).** In test-modus is `latest.json` puur v0.2 (geen v04). Het 1–5-cijfer/label/banner draaien op `percentile.short_24m` (v0.2-composiet).
- **TRIGGER/EXPERT-laag (v0.4).** De volledige output incl. `v04` staat in een apart bestand `latest-expert.json`; alleen de als "expert/test" gelabelde panelen lezen dat. De v0.4-triggers leveren de campagnesignalen.

**Data:** alle indicatoren draaien op **echte bronnen** (geen demo). Sommige zijn dagvers (energie, weer, GDELT-nieuws, wikipedia, treinen, pollen, stroomnet), andere echte maand-/jaarcijfers (inflatie, werkloosheid, hypotheek, brandstof, verkeer). Mock-fallback alleen als een API faalt → dan een demo-fallback-melding (zie §3 + TOEGANG-V6).

---

## 2. Wat deze sessie (V6) gebouwd is

**Meting / methodologie**
- **Verkeer (I-D2-001) scoort nu jaar-op-jaar % (YoY)** i.p.v. het niveau → z ~0/"normaal" i.p.v. het spookrecord "rood" (een MAD-Z op een stijgende reeks vlagde het nieuwste jaar altijd als extreem). Pre-registratie-amendement.
- **Fase 0 (codedefecten uit de review):**
  1. Verzonnen "diagnostiek" in `latest.json` → `null` + `not_computed` (hardcoded corr 0.84, nep-bootstrap, gekopieerde `fixed_2010_2019`).
  2. **Lookahead-lek** in `buildPercentileHistory` gedicht (elke dag enkel tegen data ≤ die dag) + 2 tests; backtest nu echt lookahead-vrij.
  3. **Te weinig historie → "ontbreekt"** (uit het composiet) i.p.v. stille 0/"normaal".
  4. **v0.4-testlaag uit de publieke kanalen**: `latest.json` v0.2-only, v04 → `latest-expert.json`, `signal.json` v04-getallen `null` in test-modus.
- **Fase 1:** publieke kop uitsluitend v0.2 in test-modus (`buildContext` mode-gate); robuuste z-schaal (MAD=0 → IQR/1.349 → σ → NaN; 0,6745-factor zat er al in als 1,4826); eerlijke per-indicator provenance ("echt/vertraagd/demo") + kloppende disclaimer.
- **Fase 2 §3 (evidence-grading):** A/B/C/D-grade ingevoerd. **Media + ontslagen → grade D → uit het cijfer** (contribution 0): `I-D5-001` (nieuwstoon), `I-D5-002` (wikipedia), `I-D3-003` (ontslagen-proxy). `I-D5-003` (échte collectieve gebeurtenissen) blijft B. Cruciaal: `w_meting` (D→0, uit cijfer) ≠ `w_trigger` (D→1, blijft triggeren) → **campagnetrigger blijft scherp** (backtest: indicator.spike 142→148, totaal 370→382). Cijfer iets minder media-gedreven (rode dagen 4,4→6,1%).

**Data-eerlijkheid**
- **Bronlabels kloppend**: UI zei "STATBEL/FOD/NBB/IRCEL", echte toegang = ECB/Eurostat/open-meteo → labels nu eerlijk in `registry.ts` + `plain-language.ts`. README-statustabel bijgewerkt (was verouderd "mock").
- **Ontslagen (I-D3-003)**: grondig gezocht naar echte bron → bestaat alleen als kwartaal-PDF (FOD WASO, niet automatiseerbaar) → **gedowngraded** (grade D, uit het cijfer). De werkloosheidsgraad-delta blijft hoogstens diagnostisch; échte ontslag-aankondigingen kunnen via een nieuwsscan (de `layoff_radar` doet dit al, secundair).
- **Demo-fallback-mailmelding**: nieuwe CI-stap stuurt een melding wanneer een bron faalt (→ `ALERT_WEBHOOK_URL`/Zapier-mail, anders GitHub-issue). Zie TOEGANG-V6.

**UI**
- Trage indicatoren (verkeer/brandstof/inflatie) uit de "Wat speelt vandaag"-top-3.
- Construct-subtitel "Een barometer voor collectieve blootstelling aan stressverhogende omstandigheden"; melding verplaatst naar het cijfer-blok ("De Stressor-Blootstellings-index werd gecontroleerd en bijgestuurd · laatst om HH:MM"); meta-regel + dubbele lead weg.
- Aantallen-copy gecorrigeerd: **24 indicatoren / 6 domeinen / 9 kern / 2 secundaire** (was fout "10 kern / 14 secundair").

72 engine-tests groen. Alles hierboven staat **live** (laatste deploy: §3, run 26812507582).

---

## 3. Open punten / volgende stappen (geprioriteerd)

1. **(EERST, klein) D-grade-rijen verbergen uit de expert-indicatorlijst.** Na §3 hebben `I-D5-001/I-D5-002/I-D3-003` contribution 0 maar staan ze nog in de 24-lijst (expert-paneel "Extra Expert view"). Peter: niet labelen, gewoon niet tonen. → filter grade-D uit `indicator_breakdown` (engine, `runtime.ts` ~r.300) of uit `IndicatorList`, en pas de telling-copy aan (24→21; let op de "9 kern"-formulering, 2 kern-media staan dan niet in de lijst). Bewust uitgesteld voor deze handoff.
2. **Fase 2 rest (strategische calls van Peter):** §2.1 construct hernoemen ("stress-cijfer" → "omgevingsdruk"); §2.2 allostatic-load uit de fundering; §6 copy-deck (overspannen claims → eerlijk).
3. **Brede BE-media-negativiteitsscan** als TRIGGER-laag (niet in het cijfer): HLN, Nieuwsblad, VRT (web/radio/tv), De Tijd + Reddit + "onderstroom". Uitbreiding van `I-D5-001`. "Minder wetenschappelijk" is prima — het zit in de trigger, niet de meting. **Altijd BE/Vlaamse bronnen.**
4. **Diagnostische signalen:** Google Trends (geo=BE) + https://news-consumer-insights.appspot.com/ als info/context (niet in het cijfer).
5. **`ALERT_WEBHOOK_URL` zetten** (Peter levert Zapier "Catch Hook → e-mail naar peter@hoogland.be") → directe demo-fallback-mail i.p.v. GitHub-issue.
6. **Fase 3 (statistiek):** eCDF/CISS-normalisatie, Monte-Carlo/Sobol-gevoeligheid, échte bootstrap-CI per dag, 1–5-schaal kalibreren op de empirische verdeling, multicollineariteit-audit. **Fase 4:** criteriumvalidatie tegen Belgische uitkomstmaten (Tele-Onthaal/1813, RIZIV, Sciensano).
7. **Drempels bevriezen + `mode: live`** ná meer echte live-historie (nu nog test). **Surge-stap** uit `daily.yml` (Cloudflare bevestigd).
8. **Verkeer 2025-jaarcijfer** toevoegen aan `ANNUAL_FILEZWAARTE` zodra bekend → backfill opnieuw.

---

## 4. Operationeel (zie TOEGANG-V6 voor details)
- **Deploy:** committen + `gh workflow run daily.yml --ref main` (CI → Cloudflare, ~7 min). Lokale data-gen daarna `git checkout -- app/data app/web/public` + verwijder `latest-expert.json`.
- **Tests:** `cd app/engine && npx tsc --noEmit && npm test` (72 groen). **Backtest:** `npx tsx src/cli/backtest.ts`. **Web:** `cd app/web && npm run build`.
- **Sandbox kan echte bronnen niet ophalen** (TLS/rate-limit) → echte data komt via CI.

## 5. Geheugen (auto-memory)
`~/.claude/projects/.../memory/`: `build-status.md` (live-stand), `project-sbi-verbeterplan.md` (de review + ground truth), `methodology-discipline.md`, `feedback-schrijfstijl-peter.md` (je-vorm, anti-AI).
