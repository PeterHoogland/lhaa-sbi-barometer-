# METHODOLOGIE-V15 - De Nationale Stress Index (v0.4.2)

Bron van waarheid blijft `00_Pre-Registratie.md` §4.1 (amendementen t/m §4.1.15) + de Laag-docs 01-09 + de twee wetenschapsdocs. Dit is de actuele samenvatting. Geen em-dashes, je-vorm.

## De drie cijfers (en welk de publieke kop is)

### 1. daily_pressure, de hybride dagkop = HET publieke hoofdcijfer (§4.1.14 + §4.1.15)

`app/engine/src/methodology/hybrid-headline.ts`

```
daily_pressure.score = round( 100 * Phi( (1 - w_fast) * z_slow + w_fast * z_fast ) )
```
- **w_fast = 0.30** (`HYBRID_W_FAST`, de ademknop; 0.40 = meest ademend, optie).
- **z_slow** (traag anker) = gemiddelde MAD-z van de 6 structurele codes vs hun 2010-2019/2016-2019-baseline: I-D3-001 inflatie, I-D2-004 brandstof, I-D3-007 consumentenvertrouwen (inverse), I-D3-005 werkloosheid, I-D3-006 hypotheekrente, I-D3-002 energieprijs. Hergebruikt exact de broad_pressure-z's (zelfde maat, scale-discipline).
- **z_fast** (snelle beweging, §4.1.16) splitst STRESS van MOBILITEIT. STRESS-term = gemiddelde z van: de snelle broad-codes (I-D1-002 hitte met escalatie-cap +5, I-D1-003 koude, I-D5-001 nieuwstoon, vs 2010-2019/2017-2019) PLUS de omgevings-stress-dagsignalen pollen (I-D1-010) en luchtkwaliteit (I-D1-004) (ECDF vs eigen historie; nieuw in de kop sinds 0.4.2). MOBILITEIT-term = verkeer (I-D2-001-rt) + OV (I-D2-stib, I-D2-delijn) als kleine modificator: `z_fast = 0.80*z_stress + 0.20*max(z_mobiliteit, -0.5)`. De vloer -0.5 zorgt dat een rustige avondspits een hittegolf niet uitvlakt; geen mobiliteitssignaal -> z_fast = z_stress.
- **mapping:** normale CDF (z=0 -> 50). Phi-blend (geen additieve plak-punten, dus geen plafond-verzadiging).

**Dagsignalen** (de verbreding, geen 2010-2019-anker mogelijk): elk `z = winsorize(probit(ECDF van vandaag binnen de eigen, korte historie))`. Per signaal in de output: `day_signals[].{code, value, z, n_reference}`. Onder 10 dagpunten valt een signaal eerlijk weg; een gesimuleerde of mock-waarde telt NIET mee. `computeHybridHeadline(broadIndicators, dayProxies[], wFast)` neemt een LIJST dagsignalen.

**Gedrag:** ademt met de dag (hete namiddag hoger, koele nacht lager). Verankerd op de structurele economische druk, dus nooit misleidend laag.

### 2. broad_pressure (sub-view, §4.1.11) en economic_pressure (sub-view, §4.1.9)

`broad_pressure.score = round(100*Phi(zbar))`, zbar = gemiddelde van 9 gewinsoriseerde MAD-z's (5 economisch + hitte + koude + energie + nieuws) elk vs 2010-2019 (energie 2016-2019, nieuws 2017-2019). `economic_pressure` = idem over enkel de 5 economische. Sinds 0.4.0 sub-views onder de dagkop.

### 3. Relatief seizoenspercentiel (transparantielaag)

Het 7-daags afgevlakte composiet (20 indicatoren, equal + evidence-graded weging) gerankt tegen het +/-45-dagen seizoensvenster over de laatste 24 maanden. Leest laag want het vergelijkt met de crisisjaren 2024-25. Blijft berekend voor transparantie en diagnostiek; is NIET de kop. De v0.4 "kern van de meting" (composite_meting, percentile_lang) is een verwante relatieve laag, in de UI duidelijk als "tweede lens vs de afgelopen 2 jaar" gelabeld.

## Normalisatie (de wiskunde)

- **MAD-z** (`zscore.ts`): `z = (x - mediaan(baseline)) / robustScale(baseline)`, robustScale = MAD*1.4826, dan IQR/1.349, dan SD, dan NaN. Winsorize +/-3 (`winsorize.ts`). Bij NaN ("geen schaal") wordt de indicator als ontbrekend gemarkeerd, niet stil als 0.
- **eCDF/probit** (`ecdf.ts`): `probit(clamp(percentielrang/100, [1/2n, 1-1/2n]))`. Gebruikt voor de dagsignalen (vs eigen historie) en, na de gate (>=3 jaargangen, >=90 punten in het seizoensvenster, drift-cap recentste 5 jaar), voor seizoens-eCDF (nu alleen I-D5-003). Rest = MAD-z met `normalization_provisional: true`.
- **Active-regime-schaal hitte/koude (§4.1.12):** mediaan over de volledige 2010-2019-baseline, spreiding alleen over de niet-nul-dagen. Zo telt een normale dag neutraal (z=0) en kapt niet elke milde warme dag op +3. **Hitte-escalatie (§4.1.16):** hitte (I-D1-002) winsoriseert op +5 i.p.v. +3, zodat 35°C+ verder kan stijgen dan een tropische dag (33°C); werkt door in broad_pressure én de dagkop.
- **Recency-vensters (§4.1.7):** 24 maanden (dagbronnen), 60 maanden (maand-/jaarbronnen).

## De indicatoren (single source of truth)

`app/engine/src/indicators/registry.ts` is bevroren en de enige bron: 25 geregistreerd = 20 gescoord + 4 kalendercontext (D6, niet in het cijfer) + 1 diagnostisch (I-D3-003, grade D). `registry.test.ts` faalt bewust bij een stille wijziging. Bewijsklassen A/B/C/D (A=sterk, D=experimentele proxy, gewicht 0). De dagsignalen (I-D2-001-rt, I-D2-stib, I-D2-delijn) zijn geen gescoorde registry-indicatoren maar secundaire signalen die via de hybride dagkop meewegen.

## DE HARDE GRENS (waarom alleen OV mocht meewegen)

Een dagsignaal mag pas in de weging als het iets NIEUWS meet (geen dubbeltelling) en geen ruis-artefact is. OV (STIB/De Lijn) voldoet. Bewust GEWEIGERD:
- RSS-nieuws (I-D5-001-rss) + emotie (I-D5-emotie): dubbel met de GDELT-nieuwstoon I-D5-001 (al in z_fast).
- iRail-trein (I-D2-009S): dubbel met Infrabel-stiptheid I-D2-009.
- Google Trends (I-D5-trends): schaal-artefact. Reddit (I-D5-006S) / Mastodon (I-D5-mastodon): niet representatief.

## Onzekerheid en bewaking

- **B3-bootstrap** (`bootstrap.ts`): 2000 trekkingen, geseed op de datum; 90%-band in `uncertainty`. Dekt alleen baseline-schattingsonzekerheid.
- **Specificatie-onzekerheid:** ongeveer 19 percentielpunten (winsor-grens, weegschema, baseline-venster). Behandel het cijfer als een band.
- **Bewaking in lagen** (doc 08): cron-Worker + daily.yml, dan fetcher-ladders (cache/mock-fallback), dan healthcheck.py-canary, dan reference-audit.ts, dan verify_live.py, dan monitor.yml (20 min), dan alert.py (e-mail/Telegram bij faal).

## Claim-grens (hard, in alle user-facing copy)

Meet blootstelling aan omstandigheden, NIET individueel ervaren stress; geen causale of fysiologische claim; geen peer-reviewed of gevalideerd-claim. Label = signaalindex. 50 = normaal decennium. Banden: RUSTIG <50, NORMAAL 50-70, VERHOOGD 70-90, UITZONDERLIJK 90+. Geen em-dash in user-facing copy (gepind door `test/evidence.test.ts` + `test/brand-safety.test.ts`).
