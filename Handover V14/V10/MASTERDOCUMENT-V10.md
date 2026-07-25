# MASTERDOCUMENT-V10 — Methodologie & beslissingen

Begeleidt HANDOVER-V10. De volledige laag-1-tot-8-methodologie staat in de root (`00_Pre-Registratie.md` t/m `08_Onderhoud-Protocol.md`) en in MASTERDOCUMENT-V6. Dit doc legt vast wat in V10 methodologisch veranderde en welke beslissingen Peter nam.

## 1. Wat meet de SBI

Een samengestelde index van **24 indicatoren** over 6 domeinen (omgeving, mobiliteit, economie, werk, media/gebeurtenissen, kalender). Per indicator: hoe ongewoon is de waarde van vandaag t.o.v. wat normaal is voor dit moment in het jaar (robuuste MAD-z-score, seizoensbewust). Gewogen opgeteld → composiet → percentiel (24m) → 1–5-cijfer + banner.

**Eerlijke grens (review §2):** de index meet *statistische ongewoonheid van omstandigheden*, niet bewezen individuele/populatie-stress. De publieke naam blijft "Stressor-Blootstellings-Index" met de subtitel "Een barometer voor collectieve blootstelling aan stressverhogende omstandigheden". De §2.1-aanbeveling om te hernoemen naar "Stress-omstandigheden-index" is gebouwd maar door Peter teruggedraaid; "Stress-invloeden" staat geparkeerd.

**Publieke schaal (V10): score op 100, niet 1-5.** Het 1-5-cijfer voelde laag en de schaal was onduidelijk (Peter+Kris). We tonen nu het onderliggende **percentiel (0-100) als heel getal** ("55 op 100, hoger dan op 55% van de afgelopen twee jaar"). Heel getal i.p.v. decimaal = wetenschappelijk verantwoord (geen valse precisie; onzekerheidsband ~±10-12 punten). Distributie-gebaseerd, sluit aan op review §4.5. Banner + drempels (P70/P90) draaien onveranderd op het percentiel; alleen de weergave wijzigde.

**⚠️ Geloofwaardigheidsprobleem (bekend, fixen vóór go-live):** de index leest structureel te laag (bv. 3/100 op een dag met verhoogde economische signalen). Oorzaak: het composiet (-0,15) wordt gedomineerd door de **jaar-verkeersterm** (`I-D2-001`, YoY ≈ -0,17, grote statische min) en het composiet-bereik is samengeknepen (-0,20 tot +0,35) → lage, grillige percentielen. Fix: de **verkeer-backfill + omschakeling naar de dagmaat** (weg met de dominante min-term) plus een Fase-3 schaal-herijking (eCDF/CISS). Daarom is de verkeer-backfill #1-prioriteit.

## 2. Evidence-grading (review §3) + de V10-override

Grade bepaalt of/hoe een indicator meetelt: **A=3, B=2, C=1, D=0** (gewicht-basis). Grade-D telt 0 in het cijfer en wordt verborgen uit de publieke lijsten; grade-C telt mee met gereduceerd evidence-gewicht.

**⚠️ Owner-override 2026-06-02 (Peter, bewust):** de review zette media-toon (`I-D5-001`, GDELT) en wikipedia-aandacht (`I-D5-002`) op **grade D** — uit het cijfer — omdat mediatoon/zoekaandacht meet wat de media brengt, niet hoe de bevolking zich voelt (de naming-/ecologische fallacy, §2.3 Lazer 2014 / §3.2). **Peter overrulet dit expliciet en zet beide op grade C → tóch in het cijfer.** Reden: hij vindt dat negatief nieuws en zoekgedrag de collectieve stemming/stress wél beïnvloeden. Gedocumenteerd in `registry.ts`-comments. `I-D3-003` (ontslagen-proxy, werkloosheidsgraad-delta ≠ aangekondigde ontslagen) blijft D (data-validiteit, geen construct-kwestie).

Gevolg: het publieke 1–5-cijfer telt nu media-toon + wikipedia mee (equal-schema = vol gewicht; evidence-schema = gereduceerd). Zichtbaar 23 indicatoren, 9 kern.

## 3. Emotie-laag (V10, Vlaams/NL, trigger-laag)

Bovenop de valentie (hoe negatief) meet de emotie-laag **discrete emoties** in de nieuws-headlines: woede, angst, verdriet, walging (Plutchik-subset; wetenschappelijke haak: Soroka/Fournier/Nir 2019, Marin 2012). Lexicon-telling (`lexicon_emotion_nl.py`), NRC Emotion Lexicon als latere upgrade.

Plaats: **trigger-/signaallaag, niet het cijfer.** Twee mechanismen:
- **A (confirmation):** `I-D5-emotie` (totale emotionele lading) versterkt nieuws-spikes naar severity "hoog" als de lading in de top-30% van de eigen historie zit.
- **B (vurende trigger):** `emotie.spike` vuurt bij top-10% van de eigen historie, **gated op ≥20 dagen** eigen historie (bouwt op sinds 2 juni; ~22 juni online). In test-modus toch `require_manual_approval`, dus veilig.

Onrust-pad (skeyes-type stakingen): `events.py`-keywords + (nog te doen) GDELT `PROTEST/STRIKE`-thema's in de `I-D5-003`-score (= pre-reg-amendement → re-backfill nodig).

## 4. Verkeer: van jaarmaat naar dagmaat (V10, in uitvoering)

`I-D2-001` draait op de officiële **jaar**-filezwaarte (Verkeerscentrum-jaarrapporten) — goed voor het niveau, beweegt niet dag-op-dag, hoort daarom niet in de "wat speelt vandaag"-lijst. V10 voegt een **dagmaat** toe: `I-D2-001-rt` = totale file-km uit de DATEX II v3-feed (`verkeerscentrum.be/uitwisseling/datex2v3`, geen sleutel/Itsme; live getest ~85 km). Loopt mee als secundair signaal dat dagreeks opbouwt.

**Open (kritiek pad, Peter: JA):** backfill de dagreeks zodat de baseline meteen vol is en `I-D2-001` omgeschakeld kan worden naar de dagmaat (pre-reg-amendement). Bron: Vlaams Dataportaal Verkeersgegevens levert historische verkeersindicatoren (filelengte/filezwaarte/voertuigverliesuren) **per dag** downloadbaar. Belangrijk: stem de live-metric (file-km) af op de historische reeks zodat live + baseline dezelfde meetlat hebben.
- Bronnen: `verkeerscentrum.be/data` · `verkeerscentrum.be/filebarometer` · `vlaanderen.be/.../traffic-jam-severity/metadata` (Statistiek Vlaanderen filezwaarte) · TomTom Traffic Index downloads (fallback, gratis CSV 2018-nu).

## 5. Google Trends (V10, te bouwen, IN het cijfer)

De pytrends-"stress-interesse" werkt niet betrouwbaar vanaf server-IP's (429/blokkade); `google_trends.py` staat daarom uit en Wikipedia verving het. **Maar** de Belgische **trending-searches-RSS** (`https://trends.google.com/trending/rss?geo=BE`) werkt wél vanaf de server (getest). Peters beslissing: **binnentrekken, de emotie-scan eroverheen draaien, en in het cijfer zetten (grade C, met baseline).** Dit is een zeitgeist-signaal (waar zoekt België nu naar), emotie-gewogen. Bouw als nieuwe registry-indicator in D5 met baseline-opbouw.

## 6. mode: live — voor/tegen/impact (Peters openstaande beslissing)

**Nu `mode: test`:** publiek cijfer + banner werken; elke trigger krijgt `require_manual_approval` (geen auto-campagne).
**"Bevriezen + live":** drempels op slot (pre-registratie) + triggers mogen auto-vuren.

- **Voor:** de barometer doet z'n werk (auto-campagne bij echte druk-piek); wetenschappelijk verdedigbaar (geen post-hoc tweaken).
- **Tegen:** auto-vurende campagnes = risico op mistimede campagne (vals alarm/gemist moment) op een publieke klant-tool; dunne live-historie maakt percentielen de eerste weken ruisig; bevroren = vastgelegd; webhook vereist (zonder Zapier blijft het dry-run).
- **Impact:** publiek cijfer/banner veranderen niet; de campagne-kant wordt actief; brand-safety blijft afremmen.
- **Advies:** pas live na (a) genoeg live-historie, (b) gevalideerde + bevroren drempels, (c) self-repair (gedaan), (d) webhook. Doel 22 juni.

## 7. Wat van de review is toegepast vs. afgeweken
- **Toegepast:** Fase 0 (placeholders → null, lookahead-fix, ontbreekt-vs-normaal, v04-split), Fase 1 (één bron van waarheid, robuuste z, provenance), evidence-grading-systeem (A/B/C/D), §6 copy-deck (eerlijke claims), allostatic load als inspiratie i.p.v. fundament.
- **Bewust afgeweken (Peters call):** §3.2 media/wikipedia uit het cijfer → tóch in het cijfer (grade C). §2.1 hernoemen → naam behouden.
- **Nog open (Fase 3/4):** eCDF/CISS-normalisatie, Monte-Carlo/Sobol, echte bootstrap-CI, 1–5-kalibratie, multicollineariteit, criteriumvalidatie tegen BE-uitkomstmaten.
