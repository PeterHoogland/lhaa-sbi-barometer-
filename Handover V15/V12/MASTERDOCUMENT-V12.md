# MASTERDOCUMENT-V12 — Methodologie (delta t.o.v. V11)

Begeleidt `HANDOVER-V12.md`. De methodologische kern (seizoens-percentiel, dubbele baseline v0.4, evidence-grading A/B/C/D, geen demping) staat in MASTERDOCUMENT-V11 en is ONGEWIJZIGD. Dit doc beschrijft de methodologische keuzes van de V12-sessie.

## 1. Nieuwe gescoorde indicator: consumentenvertrouwen (I-D3-007)
**Pre-registratie-amendement (bewust, Peters GO 2026-06-03).** De registry was "bevroren"; dit is een gedocumenteerde uitbreiding van 24 → 25 indicatoren.

- **Construct:** voorlopend economisch sentiment (verwachtingen over financiën/werk/sparen). Meet collectief economisch onbehagen rechtstreeks uit een enquête — iets wat de nieuws-laag (GDELT) niet vangt → **geen dubbeltelling** met de media-indicatoren.
- **Bron:** EC-geharmoniseerd via **Eurostat ei_bsco_m** (indicator BS-CSMCI, geo BE, seizoens-gecorrigeerd, saldo). De NBB-eigen API (`stat.nbb.be`) antwoordt niet stabiel vanaf een server-IP; Eurostat geeft hetzelfde EC-cijfer schoon + met lange historie. Maandelijks → forward-fill (doc 03 §3.2).
- **Codering:** grade **B**; **inverse-coded** (hoog vertrouwen = LAGE stress, dus een saldo onder het normale levert positieve stress); geen STL (bron is al seizoens-gecorrigeerd).
- **Baseline:** backfill `data/history/I-D3-007.json` met 197 maandpunten (2010-2026) → echte mediaan+MAD-meetlat vanaf dag 1. Mediaan ≈ -9.4; live -20 = "extreem" pessimistisch → terechte positieve bijdrage.
- **Gewichten:** automatisch herbalanceerd. Equal-schema: indicator-gewicht = 1/(aantal indicatoren in D3). Evidence-schema: grade-gewogen binnen D3. **Geen handmatige gewicht-edit nodig** (de domein-gewichten D1-D6 blijven vast).
- **NIET in de kern/v0.4-trigger-laag** (zoals werkloosheid I-D3-005) — het is een trage grondlast, geen snelle mover.

## 2. Brand-safety: verdriet-/rouwpiek → CTA-pauze (NIET het cijfer)
**Waarom:** het cijfer meet OMGEVINGSDRUK, geen emotie; rouw hoort het getal dus NIET te bewegen. Maar een toerisme-merk dat "kom tot rust" toont tijdens nationale rouw is tone-deaf. Daarom een veiligheidsoverlay die enkel de commerciële CTA pauzeert.

- **Mechaniek** (`methodology/brand-safety.ts`, pure functie): `flag = "elevated"` wanneer (1) AANDEEL verdriet/totaal-emotie ≥ `VERDRIET_SHARE_MIN` (0.40) — rouwdag, geen woede-/angstdag — ÉN (2) PIEK: percentiel ≥ `VERDRIET_SPIKE_P` (90) binnen de eigen verdriet-historie, of (cold-start, < `MIN_VERDRIET_HISTORY` 20 punten) boven de absolute vloer `VERDRIET_COLD_START_FLOOR` (0.5).
- **Gevolg:** condition-level → CN5 (banner-override, géén hogere stress-score), CTA verbergt, alle triggers krijgen `require_manual_approval`. Het percentiel-getal blijft eerlijk.
- **Nooit auto-`block`:** block blijft voorbehouden aan een door een mens bevestigde catastrofe (events.json), niet aan een lexicon-signaal.
- **⚠️ Drempels zijn PROVISOIR** (er was geen verdriet-historie bij cold-start). Brand-safety is een veiligheidsoverlay, GEEN pre-geregistreerde meting/campagnedrempel, dus hier is meer latitude. Kalibratie ingepland 24 juni (`/schedule`-taak): verdeling van `I-D5-verdriet` bekijken, drempels met Peter bevriezen, cold-start-vloer eruit zodra ≥20 dagen historie.

## 3. Lexicon-uitbreiding + FR: waarom veilig t.o.v. pre-registratie
Het **gescoorde** nieuws-cijfer (I-D5-001) = **GDELT-toon**, onveranderd. De NL-lexicon-uitbreiding (362 negatief, 289 emotie, negatie-laag) en het nieuwe FR-lexicon raken alleen:
- de **controle-lezing** (poststratificatie, descriptief in de bronvermelding),
- de **trigger-/emotie-laag** (grade-D, niet het cijfer),
- het secundaire `I-D5-001-rss`.
Dus geen wijziging aan de pre-geregistreerde meting. De **timing** voor de emotie-uitbreiding was gunstig: de eigen historie begon net op te bouwen, dus de percentielen ijken meteen op het uitgebreide lexicon.

**Linguïstische negatie-laag** (`tone_of_text`/`tone_of_text_fr`): negatoren keren+dempen (×-0.5) het volgende polaire woord; versterkers/verzwakkers schalen de magnitude. Conventie uit De Smedt & Daelemans (Pattern) / VADER-familie.

**FR-emoties bewust nog niet:** FEEL erft de NRC-licentie (research gratis, commercieel = fee) → grijszone. Pattern-fr (BSD) dekt de toon licentie-schoon; emoties blijven NL tot een licentie-beslissing.

## 4. Secundair-dan-promoveren-patroon (pre-reg-discipline)
Nieuwe signalen worden eerst **secundair** toegevoegd (bouwen historie op via `append_to_history`) en pas later, met genoeg eigen baseline, eventueel gepromoveerd tot gescoorde indicator (pre-reg-amendement). Zo vermijden we een verzonnen baseline in het bevroren cijfer. Dit pad geldt voor: DATEX-dagverkeer (`I-D2-001-rt`), STIB, De Lijn, emotie, verdriet, trends, reach-RSS.

**Verkeer-proxy specifiek (Peters "sneller en ruwer", gefaseerd):** met 2-4 dagen ruisende DATEX-snapshots zou een dag-impact in het cijfer ruis injecteren. Daarom STAP 1 = de intra-dag-collector (dichte data opbouwen, ~16/dag), STAP 2 (de proxy met dagtype-baseline) pas rond eind juni. Dat is de eerlijke route die Peters eigen 4-fasen-plan volgt (nu jaar-baseline → 30d descriptief → 45-60d dag-mover met dagtype-correctie → 1j seizoensbaseline).

## 5. Register van pre-registratie-amendementen (cumulatief)
- I-D5-001 + I-D5-002 grade D→C (Peter override, V6): media-toon + wikipedia tóch in het cijfer.
- I-D2-001 niveau → jaar-op-jaar % (V6): trend-artefact vermijden.
- GDELT PROTEST/STRIKE in I-D5-003 = nog open (vereist re-backfill).
- **I-D3-007 consumentenvertrouwen NIEUW in het cijfer (V12).**
- (Toekomst) DATEX-dagverkeer promoveren = STAP 2 verkeer-proxy.
- (Toekomst) reach-gewogen RSS-negativiteit promoveren = open.

## 6. Eerlijke beperkingen (ongewijzigd + nieuw)
- Lexicon-methode (woordtelling) i.p.v. ML; transparant maar mist nuance. Target-state = RobBERT/CamemBERT/NRC.
- FR-bronnen tellen mee in de toon maar nog niet in het emotie-profiel (FEEL-licentie).
- Sociale onderstroom (Reddit/Mastodon) blijft niet-representatief → bewust secundair.
- Consumentenvertrouwen meet ECONOMISCH sentiment; label het in de UI correct als zodanig, niet als "de" stress.
- De brand-safety-drempels zijn provisoir tot de kalibratie.
