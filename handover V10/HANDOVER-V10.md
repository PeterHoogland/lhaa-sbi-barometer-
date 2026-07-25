# HANDOVER-V10 — Les Hautes Alpes SBI-barometer

**Lees dit eerst in een nieuwe sessie.** Vervangt `handover V6 documenten/HANDOVER-V6.md`. Uitgevoerd: 2026-06-02.
Begeleidende docs in deze map: **CODE-V10** (architectuur), **MASTERDOCUMENT-V10** (methodologie), **TOEGANG-V10** (toegang/infra/valkuilen), **MEDIA-OVERZICHT** (medialandschap).
Externe wetenschappelijke review die het werk stuurde: `_PROJECTEN/Client-Werk/LES HAUTES ALPES/perplexit verbetering /SBI_VERBETERPLAN_CLAUDE_CODE.md`.

- **Live (primair):** https://les-hautes-alpes-sbi.brainwolves.workers.dev (Cloudflare Workers).
- **Repo:** https://github.com/PeterHoogland/lhaa-sbi-barometer- · `main` · `gh` ingelogd als PeterHoogland.
- **Project-root:** `/Users/franky/Desktop/Les Hautes Alpes Anti Stress Activator (voorlopige werktitel)/`
- **Triggers:** `mode: test` (vuren niets automatisch; `require_manual_approval` reist mee).
- 🎯 **GO-LIVE-DEADLINE: 22 juni 2026.** Dan moet `mode: live` aan en moet ALLE data actief en betrouwbaar zijn.

---

## ▶️ EERSTE OPDRACHT (START HIER)

**Bouw de verkeer-backfill en schakel `I-D2-001` om van jaarcijfer naar de dagmaat (`I-D2-001-rt`, DATEX v3).** Dit is tegelijk:
- het **kritieke pad** voor go-live op 22 juni, én
- de **fix voor het structureel te lage publieke getal** dat Peter opmerkte: de index las "3/100" op een dag met verhoogde economische signalen, omdat de jaar-verkeersterm (`I-D2-001`, YoY ≈ -0,17) het composiet domineert en omlaagtrekt, en het composiet-bereik samengeknepen is.

Concrete stappen staan in **§3.1**. Daarna in volgorde: Google Trends in het cijfer (§3.2), dan drempels via backtest bevriezen + `mode: live` (§3.3; Peter levert de Zapier-hook). De volledige context en alle eerdere keuzes staan hieronder.

## 0. De allerbelangrijkste dingen (TL;DR)

1. **Go-live = 22 juni.** Volgorde die Peter wil: éérst alles feilloos + automatisch zelf-reparerend, volle baselines, drempels via backtest bevriezen, dán `mode: live`. Zonder de Zapier-webhook blijft het sowieso dry-run, dus wachten op die hook kost niks.
2. **Open wachtrij (beide door Peter goedgekeurd, NOG TE BOUWEN):**
   - **Verkeer-backfill** = kritieke pad. Bouw een backfill zodat de dagelijkse verkeersmaat (`I-D2-001-rt`) meteen een volle baseline heeft, en schakel dan `I-D2-001` om van jaarcijfer naar dagmaat.
   - **Google Trends** = de Belgische trending-searches-RSS binnentrekken, er de emotie-scan overheen draaien, en **in het cijfer** zetten (grade C, met baseline). Peters woorden: "Doen en wel in het cijfer na de emotie scan."
3. **Belangrijke owner-beslissing deze sessie:** media-toon (`I-D5-001`) + wikipedia (`I-D5-002`) staan nu **grade C → tóch ín het cijfer** (Peter overrulet review §3.2 bewust; gedocumenteerd in `registry.ts`-comments). Zichtbaar nu 23 indicatoren, 9 kern.
4. **Git-valkuil:** `app/data/sbi-cache.json` heeft de `skip-worktree`-vlag. Pipeline-/fetcher-tests schrijven ernaar; daardoor weigeren `git rebase`/`checkout` ("could not detach HEAD" / "would be overwritten"). **Fix:** `git update-index --no-skip-worktree app/data/sbi-cache.json` → `git checkout -- app/data/sbi-cache.json` → rebase/push → `git update-index --skip-worktree app/data/sbi-cache.json`. Zie TOEGANG-V10 §4.
5. **Schrijfstijl Peter:** publieke barometer-UI-copy = neutraal correct Nederlands (geen "u/jij", geen spreektaal). **Geen em-dashes (—)**, ook niet in je antwoorden. Algemene content blijft je-vorm/persoonlijk.
6. **⚠️ BEKEND PROBLEEM — de index leest structureel TE LAAG** (bv. 3/100 op een dag met zichtbaar verhoogde economische signalen; Peter merkte dit terecht op). Oorzaak: het composiet (-0,15) wordt **gedomineerd door de jaar-verkeersterm** (`I-D2-001`, YoY ≈ -0,17, een grote statische min) en het composiet-bereik is samengeknepen (-0,20 tot +0,35), waardoor percentielen laag én grillig zijn. **Fix = de verkeer-backfill + omschakeling naar de dagmaat** (haalt de dominante min-term eruit) plus later een schaal-herijking (Fase 3, eCDF). Dit maakt de verkeer-backfill de **#1-prioriteit vóór go-live**, anders is het publieke getal niet geloofwaardig. Diagnose-commando: `node -e` op `latest.json` → `indicator_breakdown` sorteren op contribution.

---

## 1. Wat er NU live staat (na deze V10-sessie)

Twee lagen, sinds V6 gescheiden, met in V10 één belangrijke wijziging:
- **MEETLAAG = het publieke cijfer (v0.2).** In test-modus is `latest.json` puur v0.2. Het publieke getal (sinds V10 een **score op 100 = het percentiel zelf**, was 1-5), label en banner draaien op `percentile.short_24m` (v0.2-composiet).
- **TRIGGER/EXPERT-laag (v0.4).** Volledige output incl. `v04` in `latest-expert.json`; alleen "expert/test"-panelen lezen dat.

**Indicatoren in het cijfer: nu 23 (was 21).** Reden: de media-override (zie §2). Alleen `I-D3-003` (ontslagen-proxy) blijft grade-D en dus buiten het cijfer + verborgen uit de lijsten.

**Data:** alle indicatoren draaien op echte bronnen (geen demo) waar de bron werkt. Sinds V10 is er een **self-repair-pass**: valt een indicator op mock, dan volgt automatisch een verse poging.

---

## 2. Wat deze V10-sessie gebouwd + gedeployed is (chronologisch)

Alles hieronder staat **live** (laatste deploys 2026-06-02, alle success). Commit-hashes kunnen door rebases licht afwijken; gebruik `git log`.

1. **D-grade-rijen verborgen uit de expert-lijsten** (`dc54621`). `grade` als veld door `IndicatorBreakdown` geplumbd (engine emit + web mirror). `IndicatorList` + `IndicatorZView` filteren grade-D; telling-copy **dynamisch** (`visible.length`/kern). `AllSources` + `ScienceReferences` bewust volledig (bronnen/wetenschap nog in trigger-laag). `enrichKern`/TopInfluences ongemoeid (rijen blijven in de JSON).
2. **Fase 2-rest §6 + §2.1** (`7e23e58`, daarna §2.1 teruggedraaid in `bf7edf2`). §6 copy-deck eerlijk: verkeer-why ("stresshormonen" → bloeddruk/ervaren druk individueel), nieuws-why, allostatic load (`kern.ts`+`copy.ts`) → theoretische inspiratie i.p.v. "Basis van de SBI". **§2.1 rename naar "Stress-omstandigheden-index" is gebouwd maar op verzoek TERUGGEDRAAID** — de naam blijft **"Stressor-Blootstellings-Index"** + originele subtitel. Peter parkeerde "Stress-invloeden" als mogelijke naam.
3. **Emotie-laag (Vlaams/NL, trigger-laag):**
   - **Increment 1** (`ecc9bde`): `pipeline/lexicon_emotion_nl.py` — discrete emotie-scoring **woede/angst/verdriet/walging** op de Vlaamse RSS-headlines (lexicon-telling, Plutchik-subset; 5 tests in `app/pipeline/tests/test_lexicon_emotion.py`, draait met `python3`). **Onrust-pad** (`events.py`): keywords staking/sociale onrust/betoging/blokkade → skeyes-type events worden nu kandidaat (magnitude 1/3).
   - **Increment 2a** (`0f8327e`): `gdelt.news_emotion_secondary()` emit secundair signaal **`I-D5-emotie`** (totale emotionele lading); `run.py append_to_history` accumuleert nu óók secundaire signalen → `data/history/I-D5-emotie.json` groeit. `generate-fixture.ts`: `emotieElevated` = top-30% van eigen historie (≥20 punten, cold-start-veilig) → `confirmedBy.push("I-D5-emotie")` versterkt nieuws-spikes.
   - **Increment 2b + 2c** (`ba465a1`): nieuwe trigger **`emotie.spike`** in `triggers.ts` (`EMOTIE_SPIKE_P=90`, `MIN_EMOTIE_HISTORY=20`, `COOLDOWN_EMOTIE_H=48`) — vuurt als de lading in de top-10% van de eigen historie zit, gated op ≥20 dagen. 76 tests. **2c**: 3 extra geverifieerde Vlaamse media (Nieuwsblad, GvA, De Wereld Morgen) in `gdelt.RSS_FEEDS` (13→16) + `events.RSS_FEEDS` + `media_profiles`.
4. **⚠️ Media-override** (`b81ade1`): `I-D5-001` + `I-D5-002` grade **D→C** → tóch ín het cijfer. Peter overrulet review §3.2/§2.3 bewust; gedocumenteerd in `registry.ts`. Effect: zichtbaar 21→23, kern 7→9 (dynamische copy schuift mee). `I-D3-003` blijft D.
5. **Verkeer dagmaat** (`1998aff`): `pipeline/fetchers/datex_traffic.py` haalt de **DATEX II v3-feed** op (`verkeerscentrum.be/uitwisseling/datex2v3`, géén sleutel/Itsme) en sommeert `queueLength` → totale file-km. Secundair signaal `I-D2-001-rt` dat **dagreeks opbouwt** (live getest ~85 km). Doel: vervangt jaar-`I-D2-001` zodra baseline (zie wachtrij).
6. **"Hoe kiezen we deze drie?"** (`855ffb5` + tekst-herziening `2fd334b`): uitklapbare uitleg onder `TopInfluences` (top-3 = grootste gewogen afwijking-van-normaal, richting-agnostisch). Tekst neutraal, kleiner font, geen em-dashes.
7. **Nieuwe hero-achtergrond + warmer palet** (`0d9729c`, `ffb0246`): `hero.webp` (zonsopgang-bivak, Header_Home van plus.hautes-alpes.net) vervangt `hero.jpg`. Hero-tint groen → warm charcoal (`rgba 43,32,25`), zachte achtergronden warmer. Semantische status-kleuren (groen/amber/rood) ongewijzigd.
8. **Pipeline self-repair** (`f3d8490`): `run.py repair_failed()` + `_fetcher_for`-map. Elke indicator die op mock viel krijgt automatisch nog één verse ophaalpoging. Dekt alle 17 primaire indicatoren.
9. **⭐ Publiek getal van 1-5 naar score op 100** (`1132c30`, Peter+Kris): het 1-5-cijfer voelde laag + de schaal was onduidelijk. We tonen nu het onderliggende **percentiel (0-100) als heel getal** ("Stress-index 55 op 100, hoger dan op 55% van de afgelopen twee jaar"). Wetenschappelijk = heel getal, GEEN decimaal (valse precisie; onzekerheidsband ~±10-12 punten). `ConditionLevelDisplay`: grote score + "/100" + 0-100-meter met drempelzones + positie-stip; band-kleur (`cn-level`) + kicker (LAAG/GEMIDDELD/...) blijven. Banner + campagne-drempels (P70/P90) draaien onveranderd op het percentiel; alléén de weergave wijzigde. Label nu "STRESS-INDEX OP DIT MOMENT" (Peter noemde "Nationale Stress Index"; naam nog vrij). **Optie open:** licht dempen (3-daags) als het dag-op-dag te grillig springt.

---

## 3. Open wachtrij / volgende stappen (geprioriteerd voor 22 juni)

1. **(KRITIEK PAD, #1) Verkeer-backfill bouwen + `I-D2-001` omschakelen.** ⚠️ Dit is óók de fix voor het structureel te lage index-getal (§0 punt 6). De live dagmaat `I-D2-001-rt` (file-km uit DATEX v3) bouwt sinds 2 juni historie op, maar dat duurt ~3-4 weken. **Versnellen via backfill** (Peter: JA): het Vlaams Dataportaal Verkeersgegevens publiceert historische verkeersindicatoren (filelengte/filezwaarte/voertuigverliesuren) **downloadbaar per dag** (zie bronnen in MASTERDOCUMENT-V10 §4). Stappen: (a) exact download-endpoint + formaat vinden, (b) de live-metric afstemmen op de historische reeks zodat live + baseline dezelfde meetlat hebben (zelfde discipline als de GDELT-backfill), (c) `scripts/backfill_datex_traffic.py` bouwen (draait via `backfill.yml` in CI, sandbox kan geen echte bronnen), (d) `data/history/I-D2-001-rt.json` seeden, (e) `I-D2-001` omschakelen van jaarcijfer naar dagmaat = **pre-registratie-amendement** (documenteren). Fallback-bron als DATEX dichtgaat: TomTom (gratis sleutel, 2500/dag) of Itsme-registratie.
2. **Google Trends in het cijfer (na emotie-scan).** Peter: "Doen en wel in het cijfer na de emotie scan." De Belgische **trending-searches-RSS** (`https://trends.google.com/trending/rss?geo=BE`) werkt wél vanaf de server (getest, 22 KB XML; de oude pytrends-stress-interesse blokkeert op server-IP's). Bouw: (a) een fetcher die de trending-RSS ophaalt, (b) de emotie-scan (`lexicon_emotion_nl`) over de trending-termen draaien → een emotie-gewogen zeitgeist-signaal, (c) als **registry-indicator in het cijfer** zetten (grade C, gereduceerd gewicht; nieuw codenummer in D5), (d) baseline-opbouw zoals de andere (history accumuleert). De `google_trends.py`-fetcher bestaat al maar staat uit (niet in `run.py`); `wikipedia.py` is de actieve `I-D5-002`.
3. **`mode: live` zetten (rond 22 juni).** Drempels via backtest valideren + **bevriezen** (pre-registratie, daarna niet meer schuiven). `mode: test` → `live` in `triggers.ts`/`generate-fixture.ts`. Vereist: (a) genoeg echte live-historie voor stabiele percentielen, (b) de self-repair (gedaan), (c) de Zapier-webhook (Peter levert; nu geparkeerd → zonder hook blijft alles dry-run), (d) Peters go op de bevroren drempels + het construct. Voor-/tegen + impact: zie MASTERDOCUMENT-V10 §6.
4. **Emotie-spike-timing.** `MIN_EMOTIE_HISTORY=20`, historie bouwt sinds 2 juni → trigger komt ~22 juni online (op het randje, niet backfillbaar want headlines hebben geen archief). Overweeg de drempel naar ~14 te zetten voor marge vóór go-live.
5. **`ALERT_WEBHOOK_URL`/`CAMPAIGN_WEBHOOK_URL` zetten** zodra Peter de Zapier-hook levert (Catch Hook → mail naar peter@hoogland.be).
6. **Fase 3 (statistiek, ná go-live):** eCDF/CISS-normalisatie, Monte-Carlo/Sobol, échte bootstrap-CI, 1–5-schaal kalibreren, multicollineariteit-audit. **Fase 4:** criteriumvalidatie tegen Belgische uitkomstmaten (Tele-Onthaal/1813, RIZIV, Sciensano).

---

## 4. Operationeel (zie TOEGANG-V10 voor details + valkuilen)
- **Deploy:** code committen + `git push origin main` + `gh workflow run daily.yml --ref main` (CI fetcht echte data → bouwt → Cloudflare, ~7 min).
- **Lokale data-gen** (verificatie): `cd app/engine && npm run generate-fixture`. **Daarna reverten:** `git checkout -- app/data app/web/public` + `rm -f app/data/latest-expert.json app/web/public/data/latest-expert.json`.
- **Tests:** `cd app/engine && npx tsc --noEmit && npm test` (76 groen). **Emotie-test:** `python3 app/pipeline/tests/test_lexicon_emotion.py`. **Web:** `cd app/web && npm run build`.
- **Backfills:** via `.github/workflows/backfill.yml` (workflow_dispatch; CI = schoon net). Sandbox kan be.STAT/GDELT/Itsme-bronnen niet ophalen, maar **RSS + DATEX v3 + Trending-RSS wél** (getest).
- **Git-valkuil `sbi-cache.json` (skip-worktree):** zie §0 punt 4 + TOEGANG-V10 §4.

## 5. Geheugen (auto-memory)
`~/.claude/projects/.../memory/`: `build-status.md` (live-stand + V10-changes + de skip-worktree-fix), `project-sbi-verbeterplan.md` (de review + ground truth), `methodology-discipline.md`, `feedback-schrijfstijl-peter.md` (je-vorm, anti-AI, **geen em-dashes**, neutrale UI-copy). MEMORY.md is de index.
