# MASTERDOCUMENT-V11 — Methodologie & beslissingen

Begeleidt HANDOVER-V11. De volledige laag-1-tot-8-methodologie staat in de root (`00_Pre-Registratie.md` t/m `08_Onderhoud-Protocol.md`) en in MASTERDOCUMENT-V6/V10. Dit doc legt vast wat in V11 methodologisch veranderde en welke beslissingen Peter nam.

## 1. Wat meet de SBI

Een samengestelde index van **24 indicatoren** over 6 domeinen. Per indicator: hoe ongewoon is de waarde van vandaag t.o.v. wat normaal is voor dit moment in het jaar (robuuste MAD-z, seizoensbewust). Gewogen opgeteld → composiet → **percentiel** → score op 100 + banner.

**Eerlijke grens (review §2):** de index meet *statistische ongewoonheid van omstandigheden*, niet bewezen individuele/populatiestress. Publieke naam blijft "Stressor-Blootstellings-Index".

**Publieke schaal: score op 100 = het percentiel zelf, als heel getal.** Geen valse precisie (onzekerheidsband ~±10-12 punten).

## 2. ⭐ V11-kern: het publieke percentiel is OPGELOST (seizoens-bewust, eerlijk, reproduceerbaar)

### 2.1 De foute V10-diagnose (stale file)
V10 dacht dat het cijfer structureel te laag las (3/100) door de jaar-verkeersterm. **Dat was een verouderd bestand** (`latest.json` van 21 mei, dat `daily.yml` nooit terugcommit). De live site was altijd gezond (59). Zie HANDOVER-V11 bovenaan. Les: nooit diagnosticeren op de gecommitte `latest.json`.

### 2.2 De ECHTE problemen (gemeten op de live sparkline, 61 dagen)
- **Grilligheid:** percentiel zwierf 2–91, dag-op-dag-sprong gem ~16 / max 72. Oorzaak: het composiet is smal (±0,18) en de percentiel-CDF steil rond nul, dus echte dag-variatie (weer/nieuws/treinen) wordt enorm uitvergroot.
- **Structurele lage-bias:** mediaan-percentiel ~16 i.p.v. ~50. Diagnose (carry-forward + segment-analyse): grotendeels **echt/seizoensgebonden** (late lente is genuin kalm), plus een bescheiden synthetische opblazing in het oudere deel van de referentie. **Conclusie: het cijfer niet kunstmatig oppompen** (dat zou post-hoc geknoei zijn dat de pre-registratie verbiedt).

### 2.3 De fix: drie wijzigingen, GEEN demping
1. **Determinisme** — gezaaide synthese; het cijfer was niet-reproduceerbaar door ongezaaide `Math.random`. Pure correctheid.
2. **Carry-forward** — maandindicatoren staan binnen de maand vast in de referentie-reconstructie i.p.v. synthetisch te ruisen.
3. **Seizoens-bewust percentiel** — vandaag wordt vergeleken met dezelfde tijd van het jaar (±45 dagen, over alle jaren, max 730 dagen), niet met het hele 2-jaars-blok. Dit is dezelfde seizoenslogica die de engine al PER INDICATOR doet (STL), nu op het composiet, en het matcht de bestaande publieke copy ("een zomerdag wordt vergeleken met zomerdagen"). Lookahead-vrij. **Pompt niets op:** een echt rustige periode blijft laag; het stijgt pas als de omstandigheden ongewoon worden VOOR DIT SEIZOEN.

### 2.4 ⚠️ Peters expliciete beslissing: GEEN demping
Peter wil een **gevoelig** cijfer dat **elke dag rauw** toont wat het is. Daarom:
- **Geen uitgang-demping** (week-mediaan op het 0-100-getal): doodt de gevoeligheid. Afgewezen.
- **Geen ingang-ruisfilter** (2-3 daags gemiddelde van de score): ook afgewezen. "Hij moet gewoon elke dag weergeven zoals het zou kunnen zijn."
- **Gevolg:** de grilligheid (sprong ~16/dag) is **bewust behouden** als eerlijke dag-werkelijkheid. De seizoens-fix lost de EERLIJKHEID (lage-bias/cross-seizoen) op, niet de sprongerigheid, en dat is bewust zo gelaten.
- **eCDF/CISS-herijking (review §4.5) is geparkeerd**, niet nagestreefd: zou richting demping/herijking gaan.

### 2.5 Kicker-woord volgt de percentiel-band (V11)
Het kicker-woord (LAAG/GEMIDDELD/...) hing aan het conditie-niveau, dus 71 las "GEMIDDELD" terwijl de meter-stip al in de verhoogde zone staat (Peter: voelt fout). Nu volgt het woord de band (50/70/90, zoals de meter): `<50 LAAG, 50-69 GEMIDDELD, 70-89 VERHOOGD, ≥90 HOOG`. Dit is een DISPLAY-afstemming op de bestaande P70/P90-drempels, geen nieuwe drempel. De banner/campagne-logica blijft onveranderd op de pre-geregistreerde sustained-tier-regel (een verhoogde dagwaarde geeft het juiste woord, maar nog geen vals alarm).

## 3. "testfase weg" zonder te liegen (V11)
Peter wilde de "testfase/v0.4/test-modus"-labels weg, want het systeem werkt. Aanpak:
- **Version-/test-JARGON uit de zichtbare tekst** (panelen, footer, badges) → gewone taal. Het publieke cijfer was sowieso al live (geen test-label daar).
- **De honest SUBSTANCE behouden** in gewone taal: de campagne-triggers vereisen handmatige goedkeuring, er vuurt niets automatisch (badge "campagnes: handmatig").
- **De engine NIET fake-live gezet.** `mode: test` blijft onder de motorkap, want de auto-campagnes kunnen pas écht aan met de Zapier-hook + bevroren drempels. De labels weghalen terwijl je fake-live doet zou een leugen zijn op een publieke klant-tool. Het woord "test" is de honesty niet, de substance ("vuurt niets automatisch") wel.

## 4. Evidence-grading + de override (ongewijzigd sinds V10)
Grade A=3, B=2, C=1, D=0. **Owner-override (Peter):** media-toon (`I-D5-001`) + wikipedia (`I-D5-002`) op grade C → in het cijfer (overrulet review §3.2). `I-D3-003` blijft D. 23 indicatoren zichtbaar, 9 kern.

## 5. Emotie-laag (ongewijzigd sinds V10)
Discrete emoties (woede/angst/verdriet/walging) in de headlines, trigger-/signaallaag, Vlaams/NL. `I-D5-emotie` versterkt nieuws-spikes (confirmation) + eigen `emotie.spike`-trigger (gated ≥20 dagen eigen historie). Zie MEDIA-OVERZICHT-V11.

## 6. mode: live — voor/tegen/impact (Peters openstaande beslissing, de echte 22-juni-stap)
**Nu `mode: test`:** publiek cijfer + banner werken; elke trigger krijgt `require_manual_approval`, geen auto-campagne. Zonder Zapier-hook blijft alles dry-run.
**"Bevriezen + live":** drempels op slot (pre-registratie) + triggers mogen auto-vuren.
- **Voor:** de barometer doet z'n werk (auto-campagne bij echte druk-piek); wetenschappelijk verdedigbaar (geen post-hoc tweaken).
- **Tegen:** auto-vurende campagnes = risico op mistimede campagne op een publieke klant-tool; bevroren = vastgelegd; webhook vereist.
- **Vereist vóór live:** (a) Zapier-hook (Peter levert), (b) drempels gevalideerd + bevroren via backtest, (c) genoeg live-historie, (d) Peters go op de bevroren drempels + het construct.

## 7. Wat van de review is toegepast vs. afgeweken
- **Toegepast:** Fase 0 (placeholders, lookahead-fix, v04-split), Fase 1 (één bron van waarheid, robuuste z, provenance), evidence-grading, §6 eerlijke copy, **én nu (V11) de seizoens-normalisatie op het composiet** (een stuk van wat §4.5 vroeg, zonder de volle eCDF/kalibratie).
- **Bewust afgeweken (Peters call):** §3.2 media/wikipedia tóch in het cijfer (grade C); §2.1 naam behouden; **geen demping van het publieke cijfer** (Peter wil het rauw/gevoelig).
- **Nog open (Fase 3/4):** volledige eCDF/CISS-normalisatie (geparkeerd, Peter wil geen herijking-naar-een-getal), Monte-Carlo/Sobol, echte bootstrap-CI, multicollineariteit, criteriumvalidatie tegen BE-uitkomstmaten (Tele-Onthaal/1813, RIZIV, Sciensano).
