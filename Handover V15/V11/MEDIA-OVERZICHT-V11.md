# MEDIA-OVERZICHT-V11 — SBI-barometer (Vlaams/NL)

**Status:** de medialaag is in V11 **niet gewijzigd** (V11 ging over het publieke percentiel + UI). Dit doc draagt MEDIA-OVERZICHT-V10/V6 ongewijzigd voort.

**Doel:** vastleggen welke media de SBI leest, hoe ze gewogen worden, en welke uitbreidingen open staan.
**Scope (Peter):** alleen Vlaamse/Nederlandstalige bronnen. Geen RTBF/Le Soir/La Libre. GDELT dekt FR mee in zijn landelijke aggregaat, maar de RSS-/emotie-laag is bewust NL.
**Plaats in het model:** alle media-signalen leven in de trigger-/signaallaag. (Uitzondering: media-toon `I-D5-001` + wikipedia `I-D5-002` staan op Peters override grade-C en tellen tóch mee in het cijfer.)

---

## 1. Wat er VANDAAG draait

### 1.1 Nieuwstoon — I-D5-001 (grade-C, Peters override → in het cijfer + trigger)
- **Schaal-aandrijver:** GDELT DOC 2.0 timelinetone (`sourcecountry:BE`, NL+FR), `negativiteit = −AvgTone`, 3-daags venster, echte 24m-baseline (MAD-Z).
- **Controle/descriptief:** 16 Vlaamse RSS-feeds, Pattern.nl-valentielexicon per headline+lead → near-dup-dedup (Jaccard ≥0.8) → bron-poststratificatie naar leeftijdspubliek. Levert ook de top-10 negatiefste headlines en een gesegmenteerde lezing.
- **Emotie-profiel (V10):** `lexicon_emotion_nl.py` scoort woede/angst/verdriet/walging op dezelfde headlines (descriptief in de bronvermelding + als secundair signaal `I-D5-emotie`).

### 1.2 Collectieve gebeurtenissen — I-D5-003 (grade-A → in het cijfer)
- **Score:** GDELT DOC 2.0 timelinevol, volume-intensiteit van zware negatieve thema's (WAR/ARMEDCONFLICT/TERROR/KILL/NATURAL_DISASTER/MANMADE_DISASTER/CRISISLEX).
- **Transparantie:** Vlaamse RSS-feeds, magnitude-keywords (1/3/5) → kandidaten naar `pending_events.json` → menselijke review → `events.json`.
- **Onrust-pad (V10):** `events.py`-keywords uitgebreid met staking/sociale onrust/betoging/blokkade → een skeyes-type staking wordt nu minstens een pending-kandidaat. (GDELT `PROTEST/STRIKE` in de I-D5-003-SCORE is nog open = pre-reg-amendement + re-backfill.)

### 1.3 Onderstroom / secundair (niet in het cijfer)
- `I-D5-002` Wikipedia-pageviews (NL stress-thema's) — grade-C override, in het cijfer + trigger.
- `I-D5-006S` Reddit r/belgium + r/Vlaanderen — jong/stedelijk skew, expliciet secundair (confirmation-only).
- `I-D3-003S` Ontslag-radar — telt BE-nieuwsartikels over collectieve ontslagen (confirmation-only).
- `I-D5-emotie` — totale emotionele lading, bouwt eigen historie op (voor de `emotie.spike`-trigger).
- `I-D2-001-rt` — DATEX v3 file-km dagmaat, bouwt historie op (verkeer als mogelijke dag-mover, optioneel).

### 1.4 De 16 Vlaamse RSS-bronnen + publieksprofiel
Bron-niveau poststratificatie (`media_profiles.py`): per medium een geraamd leeftijdspubliek [jong 18-34 / midden 35-54 / ouder 55+] en relatief bereik (CIM/Digimeter/mediakits, ramingen). Kern: HLN (10), VRT NWS (9), Sporza (6), De Standaard (4), Het Belang van Limburg (4), De Morgen (3), De Tijd (3), Knack (2.5), Trends (2), Bruzz (1.5), Business AM (1.5), Eos (1), Newsmonkey (1), Reddit (1, secundair). **V10-uitbreiding (geverifieerde feeds):** Het Nieuwsblad, Gazet van Antwerpen, De Wereld Morgen. Doorbraak/MO*/Apache gaven geen bruikbare feed → weggelaten (geen stille no-ops).

---

## 2. Open uitbreidingen (Vlaams/NL)
- **GDELT `PROTEST/STRIKE`-thema's** in de I-D5-003-score (pre-reg-amendement → re-backfill van de I-D5-003-baseline, daarom bewust apart).
- **Emotie-lexicon upgrade:** van lexicon-telling naar NRC Emotion Lexicon (NL) of RobBERT (NL-BERT) voor zinscontext.
- **Extra subreddits:** r/Vlaanderen (al toegevoegd), r/brussels, r/belgium2.
- **Wikipedia NL** uitbreiden naar 15-20 stress-artikels.

---

## 3. Wetenschappelijke haken
Soroka/Fournier/Nir 2019 (negativity bias, psychofysiologische respons), Marin 2012 (reactiviteit), Plutchik (emotie-subset woede/angst/verdriet/walging). De medialaag meet wat de media brengen, niet rechtstreeks bevolkingsstress (review §3.2, de naming-/ecologische fallacy); daarom is de grade-C-status van I-D5-001/002 een bewuste owner-override van Peter, niet de review-aanbeveling.

## 4. ⚠️ Bekende blinde vlek (Peter, 2026-06-03): nationale rouw / zware ongevallen
Bij nationale rouw door zware ongevallen pikt het systeem niets op, geverifieerd in de live data (`I-D5-003` las zelfs z−2,29 "rustig" en duwde het cijfer omlaag). Oorzaken: I-D5-003 telt enkel GDELT-volume van **oorlog/geweld/ramp/terreur** (een verkeersongeval valt daarbuiten); de `events.py`-keywords kennen "nationale rouw/tragedie/treintragedie" maar NIET "ongeval/dodelijk/verkeersongeval/slachtoffers"; RSS-kandidaten wachten op menselijke review (`pending_events.json` nu vol Skeyes-staking); de verdriet-emotie wordt gedetecteerd maar zit buiten het cijfer; `brand_safety` bleef "normal".
**Fix (te bouwen, detail in HANDOVER-V11 §3 punt 8):** (a) `KEYWORDS_MAG_*` in `events.py` uitbreiden met ongeval/dodelijk/verkeersongeval/busongeval/slachtoffers/rouwdag/minuut stilte; (b) verdriet-/rouw-piek koppelen aan **brand-safety** (auto-pauze van de CTA), NIET aan het cijfer (dat blijft omgevingsdruk, geen emotie).

*Bijgewerkt: 2026-06-03 (V11). Medialaag ongewijzigd sinds V10; blinde vlek nationale rouw genoteerd.*
