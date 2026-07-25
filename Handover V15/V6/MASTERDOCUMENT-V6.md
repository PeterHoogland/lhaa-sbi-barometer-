# MASTERDOCUMENT-V6 — Methodologie (SBI-barometer)

Begeleidt **HANDOVER-V6**. Vervangt/actualiseert `MASTERDOCUMENT.md` + `-v0.4-addendum`. Gestuurd door de externe review (`V2 SBI_VERBETERPLAN_CLAUDE_CODE.docx`).

## 1. Wat de index meet (eerlijk geformuleerd)
De SBI meet **statistische ongewoonheid van omgevingscondities** voor heel België — niet individuele of bewezen "stress". De review noemt het claimen van het tweede terwijl je het eerste meet een *naming fallacy* + *ecologische fout*. Publieke subtitel daarom: *"Een barometer voor collectieve blootstelling aan stressverhogende omstandigheden."* (Volledige herpositionering van de naam = §2.1, open.)

## 2. Twee lagen (kernontwerp na V6)
- **MEETLAAG → het publieke cijfer.** Alleen goed-onderbouwde indicatoren (grade A/B/C). Voedt `w_meting` / het v0.2-composiet → 1–5-cijfer.
- **TRIGGER-/DIAGNOSTIEKLAAG → campagnesignalen.** Snelle, brede, ook media-signalen. Voedt `w_trigger` + per-indicator spikes. Hier mag het "minder wetenschappelijk" zijn.

Dit lost de spanning op: het cijfer is verdedigbaar (media eruit) terwijl de trigger snel/gevoelig blijft. Mechanisme: `w_meting` ≠ `w_trigger`, en triggers vuren per-indicator (`delta_1d`/`percentile_lang`), niet via het meet-gewicht.

## 3. Evidence-grade A/B/C/D (review §3, ingevoerd V6)
| Grade | Betekenis | Meet-gewicht |
|---|---|---|
| A | Sterk, gerepliceerd, populatie-valide | 3 |
| B | Consistent observationeel/zelfgerapporteerd | 2 |
| C | Zwak/gedateerd/subpopulatie/analoog | 1 |
| D | Meet iets anders dan stress (mediatoon, zoekgedrag) of bron weerlegt de claim | **0** (uit het cijfer; blijft trigger/diagnostisch) |

**D-grade nu:** `I-D5-001` (nieuwstoon), `I-D5-002` (wikipedia-aandacht), `I-D3-003` (ontslagen-proxy). `I-D5-003` (échte collectieve gebeurtenissen) blijft **B**. Volledige hergradering van álle 24 per review §3.2 (verkeer→C, pollen→C, koude→C, daglicht→C, …) is een **open** vervolgstap.

## 4. Statistiek (na V6)
- **Robuuste z**: mediaan + MAD×1,4826 (= 1/0,6745, zat er al in). Bij MAD=0 (telt-indicatoren): fallback **IQR/1,349 → SD → NaN**. NaN = "geen schaal" → indicator "ontbreekt" (niet stil 0/"normaal"). Winsor ±3 → geen ±∞.
- **Percentiel/tier lookahead-vrij**: dag t weegt enkel tegen data ≤ t. Rollende baselines: v0.2 ~24m; v0.4-kern z_kort ~18m / z_lang ~120m.
- **Onvoldoende historie** (<30 punten) → "ontbreekt", uitgesloten uit het composiet.
- **Drempels NOG NIET bevroren**, `mode: test`. Backtest 742d (na §3): ~68% groen / ~26% oranje / ~6% rood; triggers ~382 (indicator.spike 148) — campagnegevoeligheid intact.

## 5. Pre-registratie-amendementen (doc 00 §13, grond A2)
- **Verkeer I-D2-001 → jaar-op-jaar % (YoY)** i.p.v. niveau. Reden: een MAD-Z op een stijgende reeks (604→952) vlagt het nieuwste jaar permanent als "extreem" — een trend-artefact, geen signaal. YoY (2024 = +12,7% → z ~0) is een eerlijke maat. *Prijs:* het absolute recordniveau telt niet meer als grondlast — alleen abnormale groei. (Eerder: Pad A = officiële filezwaarte als jaarmaat; er is geen publiek machine-leesbare dag/maand-reeks.)
- **§3 media uit het cijfer**: I-D5-001, I-D5-002 → D. Reden: media-toon/aandacht ≠ stress (Marin 2012, Lazer 2014). Blijven trigger/diagnostisch.
- **Ontslagen I-D3-003 → gedowngraded (D)**: geen automatiseerbare echte feed (FOD WASO enkel kwartaal-PDF); de werkloosheidsgraad-delta is een proxy voor iets anders. Niet meer in het cijfer.
- (Eerder geldig: I-D5-003 via GDELT-volume; brandstof via ECB-verankering.)

## 6. Open methodologie (volgende fasen)
- **Fase 2 rest:** §2.1 construct hernoemen; §2.2 allostatic load uit de operationele fundering (hooguit losse inspiratie); §6 copy-deck (overspannen claims → eerlijk); volledige A/B/C/D-hergradering van alle 24.
- **Fase 3:** eCDF/CISS-normalisatie (i.p.v. korte-baseline-percentielen); Monte-Carlo/Sobol-gevoeligheid; échte resample-bootstrap-CI per dag; 1–5-schaal kalibreren op de empirische verdeling; multicollineariteit-audit (Spearman/PCA, formaliseer de D5-decorrelatie).
- **Fase 4:** criteriumvalidatie tegen onafhankelijke BE-uitkomstmaten (Tele-Onthaal 106/Zelfmoordlijn 1813, RIZIV psychosociale arbeidsongeschiktheid, Sciensano BELHEALTH).

## 7. Bronnen (kern van de review)
ECB CISS (WP 1426); OECD/JRC Handbook composite indicators; Iglewicz & Hoaglin (modified z); Robinson 1950 (ecological fallacy); Marin 2012; Lazer 2014 (Google Flu); Generous 2014 (Wikipedia surveillance); Novaco 1990 (verkeer); Hansen 2008 (hitte). Volledige lijst in de review-docx.
