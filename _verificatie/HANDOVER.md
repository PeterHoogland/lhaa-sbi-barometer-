# HANDOVER — Les Hautes Alpes SBI-barometer

**Lees dit als je in een nieuwe Claude-sessie verder werkt aan dit project.**
Document uitgevoerd: 2026-05-31

- Live site: https://les-hautes-alpes-sbi.surge.sh
- Repo: https://github.com/PeterHoogland/lhaa-sbi-barometer-
- Laatste commit: `0802316 · 2026-05-31 23:06:51 +0200 · v0.5 §9 sub-fase 1: Pattern.nl + dedup + top-N headlines`

## Voor de nieuwe sessie

Plak dit document (of upload het) bij de start. Het bevat:
1. **Wat is er, wat is gedaan, wat staat open** (sectie 1).
2. **De methodologische richtlijnen v0.4 én v0.5** (sectie 2-3) — de bron van waarheid voor de bouw.
3. **De 10 pre-registratie + methodologie-documenten** (sectie 4).
4. **De volledige broncode** (sectie 5).
5. **Toegang en infrastructuur** (sectie 6).

Werk altijd vanuit de project-root: `/Users/franky/Desktop/Les Hautes Alpes Anti Stress Activator (voorlopige werktitel)/`.
Build & deploy lopen via GitHub Actions; de daily.yml-workflow doet alles.

---

## 1. Stand van zaken & open punten

### Gerealiseerd (live)

- **Site live op Surge.sh** — minimal/calm look in stijl van plus.hautes-alpes.net (Ubuntu-font, alpine-groen #29441f, geblurde mountain-hero, gecentreerd HAUTES-ALPES-logo, 5 in-page klap-knoppen).
- **24 indicatoren geïmplementeerd**, waarvan 20 met een echte historische baseline (13 backfilled + 7 deterministisch berekend).
- **Doorlopende historie-opbouw** — pipeline appendt elke run de echte dagwaarde naar `app/data/history/*.json`, ook voor indicatoren zonder historische API.
- **Demografische weging (Schema 3)** parallel aan equal & evidence-graded.
- **Brandstof, GDELT, Wikipedia, Reddit, Elia, Waterinfo (open-meteo flood), pollen, treinverstoringen, ontslag-radar** — allemaal echte bronnen.
- **v0.5 §9 sub-fase 1**: Pattern.nl-lexicon (3.021 woorden), dedup van headlines (Jaccard ≥ 0,8), top-N negatiefste headlines in de bronvermelding.
- **UI-restructuur v0.4 fase 1**: 10-kern-indicatoren-claim in header, 'uurlijks bijgewerkt'-noot (cron staat nu echter weer op dagelijks 08:00 — zie wijziging hieronder), 5 klap-knoppen, DataQuality weg.
- **Cron terug naar dagelijks 08:00 BE** (was uurlijks; nu één totale check per dag).
- **Footer gecentreerd**, 'SBI v0.2' regel verwijderd.

### Open punten (volgende sessie)

1. **v0.4 engine-herbouw (groot)**:
   - Dubbele baseline per indicator: kort (~18m, rolling, voor spike-detectie) + lang (~10j rolling, voor niveau-drempels). Zie v0.4 §2.
   - Twee gewichtssets per indicator: `w_meting` (bewijslast × reikwijdte) en `w_trigger` (extra × snelheidsfactor). Zie v0.4 §3.1.
   - Composiet uit alleen de 10 kern-indicatoren (`composite_meting`).
   - Achtergrond-load-factor uit trage bronnen die de trigger-drempel verlaagt (§3.3).
   - 10-jaar-backfill per indicator waar API toelaat (ECB heeft jaren historie; verkeer/iRail/elia hebben dat niet).
2. **v0.4 trigger-engine (§4)**: Spike (kort) / Rood-onderdeel (lang) / Composite-niveau, met cooldown, confirmation-laag, brand-safety-hold. Schrijft `triggers[]` in `latest.json`.
3. **v0.5 §9 sub-fase 2 — Laag 2 transformer**: RobBERT of BERTje voor context-bewust sentiment (lost 'geen doden'-ontkenning op). Vereist `transformers`+`torch`-dependencies (~250 MB model). Concrete plan: download & cache in CI, run inference lokaal.
4. **v0.5 §9 sub-fase 3 — Laag 3 emotie + thema**: NRC Emotion Lexicon NL (angst/woede), zero-shot thema-classificatie, per-thema-attributie naar de juiste indicator (#3 oorlog, #6 economie, #5 weer), volledige dagscore-formule met emo-gewicht.
5. **Franstalige nieuws-feeds** (RTBF, Le Soir, La Libre) + CamemBERT voor FR sentiment.
6. **Webhook naar campagne-endpoint** (Make/Zapier) — zodra trigger-engine draait en URL beschikbaar is.
7. **Backtest over ~10 jaar** (v0.4 §8) vóór live-gang van triggers.
8. **UI-tweaks (kleine winsten):**
   - Foto's van de Hautes-Alpes-regio in de witte zijkanten naast de centrale kolom.
   - Source-connectiviteits-check live tonen (welke van de 24 bronnen werken nu echt).
   - Filter IndicatorList visueel naar de 10 kern + aparte 'secundair'-sectie (engine berekent nog 24, alleen tekst is nu 10).

### Recente commits

- `0802316` v0.5 §9 sub-fase 1: Pattern.nl + dedup + top-N headlines
- `1d9eb39` chore: persist daily fetch cache + historie [skip ci]
- `12d460e` PlainExplainer: zin over '24 dingen' weg
- `4f2eb46` chore: persist daily fetch cache + historie [skip ci]
- `7c4be6c` v0.4 fase 1: UI-restructuur + uurlijkse cron
- `37b23dc` chore: persist daily fetch cache + historie [skip ci]
- `36702fc` Header groter logo + scheidingslijn; domeinen als fotokaarten
- `6d40947` chore: persist daily fetch cache + historie [skip ci]
- `c667571` Header: groter logo (80px), titel op één regel, tekst uitgelijnd
- `d7576a3` chore: persist daily fetch cache + historie [skip ci]
- `d5b36df` Header: geblurde alpenfoto met gecentreerd logo en tekst erop
- `e8a81f1` chore: persist daily fetch cache + historie [skip ci]
- `ec22283` Herontwerp: look-and-feel van plus.hautes-alpes.net
- `fc064fd` chore: persist daily fetch cache + historie [skip ci]
- `c20ddb1` Echte baselines voor alle 24 indicatoren
- `099c615` chore: persist daily fetch cache [skip ci]
- `40b9fb7` Energie-fetcher robuust: nooit nog mock bij API-uitval
- `c4dac33` chore: persist daily fetch cache [skip ci]
- `76b0e17` Alle bronnen werkend: wateroverlast echt + telling 20→24
- `ba84e76` chore: persist daily fetch cache [skip ci]

---

## 2. SBI v0.4 — programmeerrichtlijn

SBI v0.4 — Technische programmeerrichtlijn
Stressor-Blootstellings-Index als reactieve campagne-trigger
Status: specificatie voor implementatie (code).Versie-toon: neutraal/wetenschappelijk.Bouwt voort op: SBI v0.2 (24 indicatoren, MAD-normalisatie, McEwen/Marmot/Hobfoll, tier-systeem groen/amber/rood, latest.json).Nieuw in v0.4: dubbele baseline — kort venster voor gevoelige spike-detectie, voortschuivend lang venster voor betrouwbare niveaudrempels (§2).

0. Kernprincipe (lees dit eerst)
De index doet vanaf v0.3 twee dingen tegelijk, met twee gescheiden gewichtssets. Verwar ze nooit:

METING
TRIGGER
Vraag
"Hoeveel stress is er vandaag echt?"
"Moet er vandaag een campagne vuren?"
Output
composite (cijfer + kleurbol)
triggers[] (events)
Gewicht
w_meting — bewijslast × reikwijdte
w_trigger — bewijslast × reikwijdte × snelheidsfactor
Trage bronnen (inflatie, energie, brandstof)
zwaar — bepalen grondniveau
laag — vuren zelden zelf
Snelle bronnen (nieuws, verkeer, gebeurtenis)
normaal
zwaar — primaire aanjagers
Baseline (§2)
lang (~10j rolling) — betrouwbaar
spike: kort (~18m); niveau: lang

Waarom gescheiden: trage bronnen wegen wetenschappelijk het zwaarst op welzijn (inflatie, energiearmoede), maar bewegen niet dag-op-dag. Wie ze in het alarm zwaar laat wegen, krijgt een traag alarm. Wie ze in de meting laag laat wegen, onderschat de werkelijke last. Oplossing: trage bronnen blijven zwaar in de meting, licht in de trigger — en ze laden in plaats daarvan de drempel op (§3).

1. De 10 kern-indicatoren
#
Code
Onderdeel
Bron
Update
Klasse
1
I-D5-001
Negatief nieuws (toon)
GDELT DOC 2.0 + 13 BE-bronnen
uur/dag
⚡ direct
2
I-D2-001
Verkeer & ongevallen
Vlaams Verkeerscentrum
minuten/dag
⚡ direct
3
I-D5-003
Oorlog / grote gebeurtenis
Nieuwsdetectie + codering
uur/dag
⚡ direct
4
I-D5-002
Stress-zoekgedrag
Wikipedia Pageviews / Trends
dag
⚡ direct
5
I-D1-002/003
Weer (hitte/koude/storm)
KMI / open-meteo
dag
🔆 snel
6
I-D3-002
Energieprijs (gas/stroom)
ENTSO-E Transparency
dag/week
🔆 snel
7
I-D3-003S
Ontslag-radar
Nieuwsdetectie FOD WASO-thema
dag
🔆 snel
8
I-D5-006S
Sociaal sentiment
Reddit/X onderstroom
dag
🔆 snel
9
I-D2-004
Brandstofprijs (Euro95)
FOD Economie
dag/week
🐢 traag
10
I-D3-001
Inflatie
STATBEL
maand
🐢 traag

Snelheidsklasse → snelheidsfactor (alleen voor w_trigger):
⚡ direct  → s = 1.5🔆 snel    → s = 1.0🐢 traag   → s = 0.4
De overige 14 v0.2-indicatoren blijven beschikbaar als secundaire/diagnostische laag (§7). Ze tellen niet mee in composite en vuren geen triggers.

2. Normalisatie — dubbele baseline (gewijzigd in v0.4)
Waarom twee baselines. De referentieperiode bepaalt de noemer van de z-score (de "normale spreiding", MAD). Een korte baseline heeft een kleine MAD → dezelfde stijging geeft een grotere z → gevoeliger, maar instabiel en gevoelig voor vals alarm. Een lange baseline heeft een grote, crisis-bewuste MAD → minder gevoelig, maar betrouwbaar. We willen beide eigenschappen, dus we berekenen per indicator twee z-scores naast elkaar en gebruiken elk waar hij hoort.
Per indicator, per dag:
Haal ruwe waarde op (raw_value).
Seizoenscorrigeer waar zinvol (bv. files juli ≠ files november). De lange baseline maakt deze correctie betrouwbaarder (meer data per kalendermoment).
Bereken twee robuuste afwijkingen (beide MAD-gebaseerd, geen klassieke σ-Z; bestand tegen uitschieters):
a) Korte baseline — voor gevoeligheid (spikes):
z_kort_i = (raw_i - mediaan_kort_i) / (1.4826 × MAD_kort_i)venster_kort = 12–24 maanden   # default 18m
Vat "is dit ongewoon vergeleken met recent?". Voedt delta_1d en Trigger 1 (spike).
b) Lange, voortschuivende baseline — voor betrouwbaarheid (niveaus):
z_lang_i = (raw_i - mediaan_lang_i) / (1.4826 × MAD_lang_i)venster_lang = voortschuivend, laatste ~10 jaar (rolling)
Vat "is dit ongewoon vergeleken met alles wat we ooit zagen?". Voedt de percentielen P70/P90 en Triggers 2 & 3 (niveau).
Bewaar delta_1d = z_kort_i(t) - z_kort_i(t-1) voor spike-detectie.
Voortschuivend, niet bevroren — tegen structurele drift. Populatiestress is sinds ~2008 structureel gestegen, vooral na 2020 (BMC Public Health 2024). Een bevroren baseline (bv. 2010–2019) zou het "nieuwe normaal" als permanent verhoogd lezen en je nulpunt vertekenen. Daarom is het lange venster rolling (laatste ~10 jaar), met herijking elke 3–6 maanden. De bestaande vaste 2010–2019-baseline blijft als referentie meelopen in de output (vergelijkingsdoel), maar stuurt geen triggers.

Korte baseline (~18m)
Lange rolling baseline (~10j)
Eigenschap
gevoelig, recent
betrouwbaar, crisis-bewust
Voedt
delta_1d, Trigger 1 (spike)
P70/P90, Triggers 2 & 3 (niveau)
Herijking
continu (rolling)
elke 3–6 maanden


3. Gewichtssets en composiet
3.1 Twee gewichten per indicator
w_meting_i  = bewijslast_i × reikwijdte_iw_trigger_i = bewijslast_i × reikwijdte_i × snelheidsfactor_i
bewijslast_i ∈ {1,2,3} — peer-reviewed steun voor de stress-link (vast, publiek).
reikwijdte_i ∈ [0,1] — aandeel bevolking dat geraakt wordt (= bestaand demographic_reach).
snelheidsfactor_i ∈ {1.5, 1.0, 0.4} — zie §1.
Beide gewichtssets worden genormaliseerd zodat ze sommeren tot 1:
w_meting_i  ← w_meting_i  / Σ w_metingw_trigger_i ← w_trigger_i / Σ w_trigger
3.2 Meting-composiet (de kleurbol)
composite_meting = Σ ( w_meting_i × z_lang_i )
Gebruikt de lange baseline — het cijfer/de kleurbol moet betrouwbaar zijn en de werkelijke last weerspiegelen, niet schommelen op recente ruis. Voedt de tier-kleur (groen/amber/rood) via P70/P90 op de lange rolling verdeling. Trage bronnen tellen hier vol mee.
3.3 Achtergronddruk laadt de drempel op
Dit is de brug tussen de twee sets. De trage bronnen verlagen de drempel waarop een snelle spike vuurt — ze verdwijnen niet, ze maken het systeem gevoeliger naarmate de grondlast hoger is.
# grondniveau uit alleen de trage bronnen (energie, brandstof, inflatie)achtergrond = Σ_traag ( w_meting_i × z_lang_i )# drempel-modulator: hoe hoger de achtergrond, hoe lager de triggerdrempelload_factor = clamp( 1 - k × achtergrond , 0.6 , 1.0 )    # k ≈ 0.15, te kalibreren# toegepast op alle trigger-drempels in §4drempel_effectief = drempel_basis × load_factor
Interpretatie: staat energie al maanden rood, dan zakt de triggerdrempel (tot max. -40%), zodat een kleinere nieuws-spike al volstaat om te vuren. Staat alles laag, dan blijft de drempel op zijn normale, strenge niveau.

4. Trigger-engine ("snel & gevoelig")
Draait één keer per data-cyclus (zo vaak als de snelste bron ververst; minstens dagelijks, idealiter uurlijks voor nieuws/verkeer). OR-logica: één voldaan = vuren.
Trigger 1 — Spike (snelste)
VOOR elk onderdeel i met klasse ⚡ of 🔆:    ALS delta_1d_i ≥ SPIKE_DREMPEL × load_factor      # SPIKE_DREMPEL basis = +1.5    DAN fire(type="indicator.spike", code=i, severity=ernst(delta_1d_i))# delta_1d komt uit de KORTE baseline (z_kort) → maximale gevoeligheid
Trigger 2 — Eén rood onderdeel (gevoeligste)
VOOR elk onderdeel i in de 10:    ALS percentiel_lang(z_lang_i) ≥ P90_i × load_factor    DAN fire(type="indicator.red", code=i, severity="hoog")# percentiel uit de LANGE rolling baseline → "rood" = echt uitzonderlijk, crisis-bewust
Trigger 3 — Algemeen niveau (brede)
ALS composite_meting ≥ AMBER (P70) gedurende ≥ 1 dagDAN fire(type="composite.amber", severity="let_op")ALS composite_meting ≥ ROOD (P90)DAN fire(type="composite.red", severity="hoog")    # onmiddellijk, hoge prioriteit
Let op: Trigger 3 gebruikt composite_meting (lange baseline, met trage bronnen erin), want het algemene niveau hóórt de grondlast te weerspiegelen. Trigger 1 gebruikt de korte baseline (gevoelig); Trigger 2 de lange baseline (betrouwbaar). Zo is de spike-detectie snel terwijl het rood-alarm verankerd blijft in een lange, crisis-bewuste historie.
Remmen tegen vals alarm (verplicht)
# A. Cooldown per onderdeelALS onderdeel i in de laatste COOLDOWN_H uur al vuurde:  skip    COOLDOWN_H = 24 voor ⚡, 48 voor 🔆/🐢# B. Confirmatie-laag → bepaalt severity, niet of het vuurtALS spike op nieuws/gebeurtenis ÉN bevestigd door zoekgedrag (#4) of sentiment (#8):    severity = "hoog"ANDERS:    severity = "let_op"        # vuurt wel, maar gemarkeerd als onbevestigd# C. Brand-safetyALS brand_safety.flag != "normal":          # bv. ramp/aanslag    zet alle triggers op require_manual_approval = true
Configuratie (vast, publiek, niet achteraf bijstelbaar)
SPIKE_DREMPEL   = 1.5     # MAD-eenheden dag-op-dag, op KORTE baseline (z_kort)VENSTER_KORT    = 18      # maanden (range 12–24)VENSTER_LANG    = 120     # maanden ≈ 10 jaar, rollingHERIJK_LANG     = 90–180  # dagen tussen herberekening lange baselineP70, P90        = tier-grenzen op de LANGE rolling verdelingk (load)        = 0.15load clamp      = [0.6, 1.0]COOLDOWN_H      = {direct:24, snel:48, traag:48}
Let op: heeft een indicator (nog) geen 10 jaar historie, gebruik dan de langst beschikbare reeks voor de lange baseline en markeer dit in de output (baseline_lang_jaren), zodat de backtest weet dat de drempel minder verankerd is.Alle waarden worden vóór livegang via backtest (§8) gekalibreerd en daarna bevroren.

5. Datacontract per indicator
Elke indicator levert per cyclus (uitbreiding op bestaand v0.2-schema):
{  "code": "I-D5-001",  "domain": "D5",  "plain_name": "Negatief nieuws",  "class": "direct",                 // direct | snel | traag  "raw_value": 0.0,  "z_kort": 0.0,                     // korte baseline (~18m) → spikes  "z_lang": 0.0,                     // lange rolling baseline (~10j) → niveaus  "delta_1d": 0.0,                   // dag-op-dag op z_kort  "percentile_lang": 0,              // positie binnen lange rolling verdeling  "baseline_lang_jaren": 10,         // werkelijk beschikbare historie  "state": "normaal",                // normaal | verhoogd | rood  "w_meting": 0.0,  "w_trigger": 0.0,  "contribution_meting": 0.0,  "simulated": false,  "observation_date": "2026-05-21",  "data_source": { "name": "...", "url": "..." }}

6. Output-payload (uitbreiding latest.json)
{  "timestamp": "2026-05-21T20:10:00Z",  "composite": { "meting": -0.16, "achtergrond": 0.05, "load_factor": 0.99 },  "tier": { "current": "green", "days_in_tier": 40 },  "percentile": { "lang_10j_rolling": 3, "kort_18m": 4, "fixed_2010_2019": 3 },  "baseline": { "kort_maanden": 18, "lang_maanden": 120, "lang_rolling": true, "laatste_herijking": "2026-04-01" },  "indicator_breakdown": [ /* de 10, schema §5 */ ],  "secondary_signals": [ /* diagnostische laag, §7 */ ],  "brand_safety": { "flag": "normal", "reason": null },  "triggers": [    {      "type": "indicator.spike",      "fired_at": "2026-05-21T08:00:00Z",      "scope": "indicator",      "code": "I-D5-001",      "domain": "D5",      "plain_name": "Negatief nieuws",      "severity": "hoog",      "z_kort": 2.4,      "z_lang": 2.1,      "delta_1d": 1.7,      "load_factor": 0.92,      "confirmed_by": ["I-D5-002", "I-D5-006S"],      "campaign_hint": "brede_geruststelling",      "require_manual_approval": false,      "cooldown_until": "2026-05-22T08:00:00Z"    }  ]}
Veld-betekenis voor het campagnesysteem:
scope = composite (algemeen) of indicator (per onderdeel) → kies brede vs. gerichte flow.
campaign_hint → mapt op een concrete campagne-flow.
severity = hoog | let_op → prioriteit/kanaalkeuze.
require_manual_approval → bij true: niet automatisch versturen.

7. Secundaire/diagnostische laag
De 14 niet-kern-indicatoren en bestaande secundaire signalen (Reddit-sentiment, ontslag-radar, media-cluster-diagnostiek met d5_cross_correlation_7d, composite_without_d5) lopen mee in secondary_signals[]. Ze triggeren niet en zitten niet in composite, maar verrijken de payload als context bij een trigger.

8. Implementatie- en kalibratievolgorde
Datalaag: 10 kern-bronnen aansluiten, schema §5 vullen, dubbele-baseline MAD-normalisatie (§2) implementeren: per indicator z_kort (rolling ~18m) en z_lang (rolling ~10j), plus periodieke herijking van de lange baseline.
Gewichten: beide sets (§3.1) berekenen; bewijslast/reikwijdte/snelheidsfactor als config-bestand (vast, publiek).
Composiet + achtergrond: §3.2/§3.3 implementeren, inclusief load_factor.
Trigger-engine: §4 met de drie triggers + remmen.
Payload + webhook: triggers-blok schrijven; POST naar campagne-endpoint (Make/Zapier/eigen API). Fallback: polling op latest.json.
Backtest (kritiek): draai de engine over de volledige beschikbare historie (idealiter ~10 jaar), niet slechts 24 maanden — alleen zo zie je hoe de drempels zich gedragen tijdens echte crises (energiecrisis 2022, COVID, hittegolven).
Tel: hoeveel triggers per type, hoeveel "hoog" vs. "let_op", hoeveel per maand.
Vergelijk korte- vs. lange-baseline-gedrag: vuurt de spike-trigger (kort) snel genoeg, blijft de rood-trigger (lang) zeldzaam genoeg?
Doel: gevoelig maar niet schreeuwerig. Stel SPIKE_DREMPEL, VENSTER_KORT, k, P90 bij tot het triggerritme klopt met bekende stress-periodes.
Bevries daarna alle parameters.
Livegang in test-modus (zoals v0.2 implementationStage), met require_manual_approval=true op de eerste weken, daarna geleidelijk automatiseren.

Wetenschappelijke onderbouwing
McEwen — allostatic load (basis index).
Marin et al. (2012), PLoS ONE — negatief nieuws verhoogt fysiologische stressreactiviteit: https://pmc.ncbi.nlm.nih.gov/articles/PMC3468453/
Mayo Clinic Press (2024) — herhaalde nieuws-blootstelling en cortisol: https://mcpress.mayoclinic.org/mental-health/how-the-news-rewires-your-brain/
UEA / Understanding Society (2022) — energie-/brandstofarmoede en welzijn: https://www.understandingsociety.ac.uk/news/2022/02/04/high-fuel-prices-affect-mental-and-physical-health/
Nature Energy (2023) — energieprijscrisis en huishoudens: https://www.nature.com/articles/s41560-023-01209-8
BMC Public Health (2024) — subjectieve financiële onzekerheid als sterke stressdeterminant: https://pmc.ncbi.nlm.nih.gov/articles/PMC11668040/

---

## 3. SBI v0.5 — programmeerrichtlijn (uitbreiding §9 nieuws-pipeline)

SBI v0.5 — Technische programmeerrichtlijn
Stressor-Blootstellings-Index als reactieve campagne-trigger
Status: specificatie voor implementatie (code).Versie-toon: neutraal/wetenschappelijk.Bouwt voort op: SBI v0.2 (24 indicatoren, MAD-normalisatie, McEwen/Marmot/Hobfoll, tier-systeem groen/amber/rood, latest.json).Nieuw in v0.4: dubbele baseline — kort venster voor gevoelige spike-detectie, voortschuivend lang venster voor betrouwbare niveaudrempels (§2).Nieuw in v0.5: volledige nieuws- en sentiment-pipeline (§9) — hoe negatief nieuws en de onderstroom worden gescand, gescoord en naar thema-triggers vertaald.

0. Kernprincipe (lees dit eerst)
De index doet vanaf v0.3 twee dingen tegelijk, met twee gescheiden gewichtssets. Verwar ze nooit:

METING
TRIGGER
Vraag
"Hoeveel stress is er vandaag echt?"
"Moet er vandaag een campagne vuren?"
Output
composite (cijfer + kleurbol)
triggers[] (events)
Gewicht
w_meting — bewijslast × reikwijdte
w_trigger — bewijslast × reikwijdte × snelheidsfactor
Trage bronnen (inflatie, energie, brandstof)
zwaar — bepalen grondniveau
laag — vuren zelden zelf
Snelle bronnen (nieuws, verkeer, gebeurtenis)
normaal
zwaar — primaire aanjagers
Baseline (§2)
lang (~10j rolling) — betrouwbaar
spike: kort (~18m); niveau: lang

Waarom gescheiden: trage bronnen wegen wetenschappelijk het zwaarst op welzijn (inflatie, energiearmoede), maar bewegen niet dag-op-dag. Wie ze in het alarm zwaar laat wegen, krijgt een traag alarm. Wie ze in de meting laag laat wegen, onderschat de werkelijke last. Oplossing: trage bronnen blijven zwaar in de meting, licht in de trigger — en ze laden in plaats daarvan de drempel op (§3).

1. De 10 kern-indicatoren
#
Code
Onderdeel
Bron
Update
Klasse
1
I-D5-001
Negatief nieuws (toon)
GDELT DOC 2.0 + 13 BE-bronnen
uur/dag
⚡ direct
2
I-D2-001
Verkeer & ongevallen
Vlaams Verkeerscentrum
minuten/dag
⚡ direct
3
I-D5-003
Oorlog / grote gebeurtenis
Nieuwsdetectie + codering
uur/dag
⚡ direct
4
I-D5-002
Stress-zoekgedrag
Wikipedia Pageviews / Trends
dag
⚡ direct
5
I-D1-002/003
Weer (hitte/koude/storm)
KMI / open-meteo
dag
🔆 snel
6
I-D3-002
Energieprijs (gas/stroom)
ENTSO-E Transparency
dag/week
🔆 snel
7
I-D3-003S
Ontslag-radar
Nieuwsdetectie FOD WASO-thema
dag
🔆 snel
8
I-D5-006S
Sociaal sentiment
Reddit/X onderstroom
dag
🔆 snel
9
I-D2-004
Brandstofprijs (Euro95)
FOD Economie
dag/week
🐢 traag
10
I-D3-001
Inflatie
STATBEL
maand
🐢 traag

Snelheidsklasse → snelheidsfactor (alleen voor w_trigger):
⚡ direct  → s = 1.5🔆 snel    → s = 1.0🐢 traag   → s = 0.4
De overige 14 v0.2-indicatoren blijven beschikbaar als secundaire/diagnostische laag (§7). Ze tellen niet mee in composite en vuren geen triggers.

2. Normalisatie — dubbele baseline (gewijzigd in v0.4)
Waarom twee baselines. De referentieperiode bepaalt de noemer van de z-score (de "normale spreiding", MAD). Een korte baseline heeft een kleine MAD → dezelfde stijging geeft een grotere z → gevoeliger, maar instabiel en gevoelig voor vals alarm. Een lange baseline heeft een grote, crisis-bewuste MAD → minder gevoelig, maar betrouwbaar. We willen beide eigenschappen, dus we berekenen per indicator twee z-scores naast elkaar en gebruiken elk waar hij hoort.
Per indicator, per dag:
Haal ruwe waarde op (raw_value).
Seizoenscorrigeer waar zinvol (bv. files juli ≠ files november). De lange baseline maakt deze correctie betrouwbaarder (meer data per kalendermoment).
Bereken twee robuuste afwijkingen (beide MAD-gebaseerd, geen klassieke σ-Z; bestand tegen uitschieters):
a) Korte baseline — voor gevoeligheid (spikes):
z_kort_i = (raw_i - mediaan_kort_i) / (1.4826 × MAD_kort_i)venster_kort = 12–24 maanden   # default 18m
Vat "is dit ongewoon vergeleken met recent?". Voedt delta_1d en Trigger 1 (spike).
b) Lange, voortschuivende baseline — voor betrouwbaarheid (niveaus):
z_lang_i = (raw_i - mediaan_lang_i) / (1.4826 × MAD_lang_i)venster_lang = voortschuivend, laatste ~10 jaar (rolling)
Vat "is dit ongewoon vergeleken met alles wat we ooit zagen?". Voedt de percentielen P70/P90 en Triggers 2 & 3 (niveau).
Bewaar delta_1d = z_kort_i(t) - z_kort_i(t-1) voor spike-detectie.
Voortschuivend, niet bevroren — tegen structurele drift. Populatiestress is sinds ~2008 structureel gestegen, vooral na 2020 (BMC Public Health 2024). Een bevroren baseline (bv. 2010–2019) zou het "nieuwe normaal" als permanent verhoogd lezen en je nulpunt vertekenen. Daarom is het lange venster rolling (laatste ~10 jaar), met herijking elke 3–6 maanden. De bestaande vaste 2010–2019-baseline blijft als referentie meelopen in de output (vergelijkingsdoel), maar stuurt geen triggers.

Korte baseline (~18m)
Lange rolling baseline (~10j)
Eigenschap
gevoelig, recent
betrouwbaar, crisis-bewust
Voedt
delta_1d, Trigger 1 (spike)
P70/P90, Triggers 2 & 3 (niveau)
Herijking
continu (rolling)
elke 3–6 maanden


3. Gewichtssets en composiet
3.1 Twee gewichten per indicator
w_meting_i  = bewijslast_i × reikwijdte_iw_trigger_i = bewijslast_i × reikwijdte_i × snelheidsfactor_i
bewijslast_i ∈ {1,2,3} — peer-reviewed steun voor de stress-link (vast, publiek).
reikwijdte_i ∈ [0,1] — aandeel bevolking dat geraakt wordt (= bestaand demographic_reach).
snelheidsfactor_i ∈ {1.5, 1.0, 0.4} — zie §1.
Beide gewichtssets worden genormaliseerd zodat ze sommeren tot 1:
w_meting_i  ← w_meting_i  / Σ w_metingw_trigger_i ← w_trigger_i / Σ w_trigger
3.2 Meting-composiet (de kleurbol)
composite_meting = Σ ( w_meting_i × z_lang_i )
Gebruikt de lange baseline — het cijfer/de kleurbol moet betrouwbaar zijn en de werkelijke last weerspiegelen, niet schommelen op recente ruis. Voedt de tier-kleur (groen/amber/rood) via P70/P90 op de lange rolling verdeling. Trage bronnen tellen hier vol mee.
3.3 Achtergronddruk laadt de drempel op
Dit is de brug tussen de twee sets. De trage bronnen verlagen de drempel waarop een snelle spike vuurt — ze verdwijnen niet, ze maken het systeem gevoeliger naarmate de grondlast hoger is.
# grondniveau uit alleen de trage bronnen (energie, brandstof, inflatie)achtergrond = Σ_traag ( w_meting_i × z_lang_i )# drempel-modulator: hoe hoger de achtergrond, hoe lager de triggerdrempelload_factor = clamp( 1 - k × achtergrond , 0.6 , 1.0 )    # k ≈ 0.15, te kalibreren# toegepast op alle trigger-drempels in §4drempel_effectief = drempel_basis × load_factor
Interpretatie: staat energie al maanden rood, dan zakt de triggerdrempel (tot max. -40%), zodat een kleinere nieuws-spike al volstaat om te vuren. Staat alles laag, dan blijft de drempel op zijn normale, strenge niveau.

4. Trigger-engine ("snel & gevoelig")
Draait één keer per data-cyclus (zo vaak als de snelste bron ververst; minstens dagelijks, idealiter uurlijks voor nieuws/verkeer). OR-logica: één voldaan = vuren.
Trigger 1 — Spike (snelste)
VOOR elk onderdeel i met klasse ⚡ of 🔆:    ALS delta_1d_i ≥ SPIKE_DREMPEL × load_factor      # SPIKE_DREMPEL basis = +1.5    DAN fire(type="indicator.spike", code=i, severity=ernst(delta_1d_i))# delta_1d komt uit de KORTE baseline (z_kort) → maximale gevoeligheid
Trigger 2 — Eén rood onderdeel (gevoeligste)
VOOR elk onderdeel i in de 10:    ALS percentiel_lang(z_lang_i) ≥ P90_i × load_factor    DAN fire(type="indicator.red", code=i, severity="hoog")# percentiel uit de LANGE rolling baseline → "rood" = echt uitzonderlijk, crisis-bewust
Trigger 3 — Algemeen niveau (brede)
ALS composite_meting ≥ AMBER (P70) gedurende ≥ 1 dagDAN fire(type="composite.amber", severity="let_op")ALS composite_meting ≥ ROOD (P90)DAN fire(type="composite.red", severity="hoog")    # onmiddellijk, hoge prioriteit
Let op: Trigger 3 gebruikt composite_meting (lange baseline, met trage bronnen erin), want het algemene niveau hóórt de grondlast te weerspiegelen. Trigger 1 gebruikt de korte baseline (gevoelig); Trigger 2 de lange baseline (betrouwbaar). Zo is de spike-detectie snel terwijl het rood-alarm verankerd blijft in een lange, crisis-bewuste historie.
Remmen tegen vals alarm (verplicht)
# A. Cooldown per onderdeelALS onderdeel i in de laatste COOLDOWN_H uur al vuurde:  skip    COOLDOWN_H = 24 voor ⚡, 48 voor 🔆/🐢# B. Confirmatie-laag → bepaalt severity, niet of het vuurtALS spike op nieuws/gebeurtenis ÉN bevestigd door zoekgedrag (#4) of sentiment (#8):    severity = "hoog"ANDERS:    severity = "let_op"        # vuurt wel, maar gemarkeerd als onbevestigd# C. Brand-safetyALS brand_safety.flag != "normal":          # bv. ramp/aanslag    zet alle triggers op require_manual_approval = true
Configuratie (vast, publiek, niet achteraf bijstelbaar)
SPIKE_DREMPEL   = 1.5     # MAD-eenheden dag-op-dag, op KORTE baseline (z_kort)VENSTER_KORT    = 18      # maanden (range 12–24)VENSTER_LANG    = 120     # maanden ≈ 10 jaar, rollingHERIJK_LANG     = 90–180  # dagen tussen herberekening lange baselineP70, P90        = tier-grenzen op de LANGE rolling verdelingk (load)        = 0.15load clamp      = [0.6, 1.0]COOLDOWN_H      = {direct:24, snel:48, traag:48}
Let op: heeft een indicator (nog) geen 10 jaar historie, gebruik dan de langst beschikbare reeks voor de lange baseline en markeer dit in de output (baseline_lang_jaren), zodat de backtest weet dat de drempel minder verankerd is.Alle waarden worden vóór livegang via backtest (§8) gekalibreerd en daarna bevroren.

5. Datacontract per indicator
Elke indicator levert per cyclus (uitbreiding op bestaand v0.2-schema):
{  "code": "I-D5-001",  "domain": "D5",  "plain_name": "Negatief nieuws",  "class": "direct",                 // direct | snel | traag  "raw_value": 0.0,  "z_kort": 0.0,                     // korte baseline (~18m) → spikes  "z_lang": 0.0,                     // lange rolling baseline (~10j) → niveaus  "delta_1d": 0.0,                   // dag-op-dag op z_kort  "percentile_lang": 0,              // positie binnen lange rolling verdeling  "baseline_lang_jaren": 10,         // werkelijk beschikbare historie  "state": "normaal",                // normaal | verhoogd | rood  "w_meting": 0.0,  "w_trigger": 0.0,  "contribution_meting": 0.0,  "simulated": false,  "observation_date": "2026-05-21",  "data_source": { "name": "...", "url": "..." }}

6. Output-payload (uitbreiding latest.json)
{  "timestamp": "2026-05-21T20:10:00Z",  "composite": { "meting": -0.16, "achtergrond": 0.05, "load_factor": 0.99 },  "tier": { "current": "green", "days_in_tier": 40 },  "percentile": { "lang_10j_rolling": 3, "kort_18m": 4, "fixed_2010_2019": 3 },  "baseline": { "kort_maanden": 18, "lang_maanden": 120, "lang_rolling": true, "laatste_herijking": "2026-04-01" },  "indicator_breakdown": [ /* de 10, schema §5 */ ],  "secondary_signals": [ /* diagnostische laag, §7 */ ],  "brand_safety": { "flag": "normal", "reason": null },  "triggers": [    {      "type": "indicator.spike",      "fired_at": "2026-05-21T08:00:00Z",      "scope": "indicator",      "code": "I-D5-001",      "domain": "D5",      "plain_name": "Negatief nieuws",      "severity": "hoog",      "z_kort": 2.4,      "z_lang": 2.1,      "delta_1d": 1.7,      "load_factor": 0.92,      "confirmed_by": ["I-D5-002", "I-D5-006S"],      "campaign_hint": "brede_geruststelling",      "require_manual_approval": false,      "cooldown_until": "2026-05-22T08:00:00Z"    }  ]}
Veld-betekenis voor het campagnesysteem:
scope = composite (algemeen) of indicator (per onderdeel) → kies brede vs. gerichte flow.
campaign_hint → mapt op een concrete campagne-flow.
severity = hoog | let_op → prioriteit/kanaalkeuze.
require_manual_approval → bij true: niet automatisch versturen.

7. Secundaire/diagnostische laag
De 14 niet-kern-indicatoren en bestaande secundaire signalen (Reddit-sentiment, ontslag-radar, media-cluster-diagnostiek met d5_cross_correlation_7d, composite_without_d5) lopen mee in secondary_signals[]. Ze triggeren niet en zitten niet in composite, maar verrijken de payload als context bij een trigger.

8. Implementatie- en kalibratievolgorde
Datalaag: 10 kern-bronnen aansluiten, schema §5 vullen, dubbele-baseline MAD-normalisatie (§2) implementeren: per indicator z_kort (rolling ~18m) en z_lang (rolling ~10j), plus periodieke herijking van de lange baseline.
Gewichten: beide sets (§3.1) berekenen; bewijslast/reikwijdte/snelheidsfactor als config-bestand (vast, publiek).
Composiet + achtergrond: §3.2/§3.3 implementeren, inclusief load_factor.
Trigger-engine: §4 met de drie triggers + remmen.
Payload + webhook: triggers-blok schrijven; POST naar campagne-endpoint (Make/Zapier/eigen API). Fallback: polling op latest.json.
Backtest (kritiek): draai de engine over de volledige beschikbare historie (idealiter ~10 jaar), niet slechts 24 maanden — alleen zo zie je hoe de drempels zich gedragen tijdens echte crises (energiecrisis 2022, COVID, hittegolven).
Tel: hoeveel triggers per type, hoeveel "hoog" vs. "let_op", hoeveel per maand.
Vergelijk korte- vs. lange-baseline-gedrag: vuurt de spike-trigger (kort) snel genoeg, blijft de rood-trigger (lang) zeldzaam genoeg?
Doel: gevoelig maar niet schreeuwerig. Stel SPIKE_DREMPEL, VENSTER_KORT, k, P90 bij tot het triggerritme klopt met bekende stress-periodes.
Bevries daarna alle parameters.
Livegang in test-modus (zoals v0.2 implementationStage), met require_manual_approval=true op de eerste weken, daarna geleidelijk automatiseren.

9. Nieuws- & sentiment-pipeline (de motor achter onderdeel #1, #3, #4, #8)
Negatief nieuws is de primaire spike-trigger. Deze sectie specificeert hoe de tekstuele bronnen worden ingelezen, gescoord en naar thema-triggers vertaald.
9.1 Wat inlezen: headline + lead, niet het hele artikel
Per bron: titel (headline) + de eerste alinea (lead/description) uit de RSS/Atom-feed. Niet de volledige tekst.
Rationale: headlines zijn ontworpen om emotie te triggeren (Mayo Clinic Press 2024) en zijn precies het deel dat de lezer fysiologisch raakt; ze zijn paywall-vrij, kort en eenduidig → betrouwbaarder voor automatische analyse dan lange artikels. De lead corrigeert headline-ambiguïteit (kop-met-vraagteken, sarcasme).
Dedup: zelfde gebeurtenis verschijnt op meerdere sites → near-duplicate-detectie (genormaliseerde titel + fuzzy match, bv. MinHash/Jaccard ≥ 0.8) zodat één gebeurtenis niet tienvoudig telt.
9.2 Bronnen
Type
Bron
Rol
Brede toon
GDELT DOC 2.0 (BE)
gratis basislaag: toon + volume, breed dekkend
Headlines
RSS van 13+ BE-nieuwsbronnen (NL + FR)
kern: verse, gestructureerde headlines
Onderstroom
Reddit r/belgium, r/Vlaanderen (+ optioneel publieke X/Bluesky)
secundair, niet-representatief → bevestiging

9.3 Drie analyse-lagen (hybride)
Elke headline doorloopt drie lagen, oplopend in nauwkeurigheid. De lagen vullen elkaar aan; geen enkele staat alleen.
Laag 1 — Lexicon (snel, transparant, uitlegbaar).
Woord-valentie optellen per headline met een gevalideerd NL-lexicon: Pattern.nl, DuOMAn of NRC valentie-lexicon (NL) — niet de eigen 299-woordenlijst (te klein).
Voor: supersnel, gratis, volledig uitlegbaar (je kunt exact zeggen waarom een dag rood werd).
Tegen: geen context. Ontkenning ("geen doden") leest hij verkeerd → daarom Laag 2.
Laag 2 — Transformer-sentiment (nauwkeurig, contextueel).
NL-taalmodel dat de hele headline begrijpt, inclusief ontkenning/context: RobBERT of BERTje (open source, lokaal draaibaar; geen externe API nodig).
Lost het "geen doden"-probleem op. Dit is de grootste kwaliteitssprong t.o.v. de huidige opzet.
Output: negativiteits-score per headline ∈ [-1, +1].
Laag 3 — Emotie & thema (de onderstroom + per-onderdeel sturing).
Emotie: NRC Emotion Lexicon (NL) → meet specifiek angst en woede — de twee emoties die het strakst koppelen aan cortisol/adrenaline en de fysiologische stressreactie. Negativiteit + hoge angst weegt zwaarder dan negativiteit alleen.
Thema: zero-shot classificatie (NL-model) of trefwoord-clustering naar vaste thema's → voedt de per-onderdeel triggers (oorlog/geweld → #3, economie → energie/inflatie-context, gezondheid, ramp).
9.4 Dagscore-formule
Negativiteit alleen is onvoldoende — het gaat om volume × intensiteit × clustering:
per headline:  neg_h = combineer(Laag1, Laag2)          # Laag2 weegt zwaarder; Laag1 als sanity-check               emo_h = max(angst_h, woede_h)             # uit Laag 3               gewicht_h = 1 + emo_h                      # angst/woede versterktdagscore_D5 = Σ_headlines ( neg_h × gewicht_h )  /  normalisatie_volumecluster     = d5_cross_correlation_7d            # bestaand: gaan meerdere bronnen samen negatief?
dagscore_D5 gaat door de dubbele-baseline-normalisatie (§2): z_kort voor de spike-trigger, z_lang voor het niveau.
cluster (hoge cross-correlatie tussen bronnen) onderscheidt een echte gebeurtenis (alle bronnen tegelijk negatief) van ruis (één uitschieter). Hoge cluster → severity "hoog"; lage cluster → "let_op".
9.5 Per-thema splitsing → per-onderdeel triggers
De thema-classificatie (Laag 3) splitst de nieuwsstroom, zodat een spike herleidbaar is tot een onderwerp en de juiste campagne kiest:
thema "oorlog/geweld"   → voedt onderdeel #3 (grote gebeurtenis)  → campaign_hint: brede_geruststellingthema "economie/prijzen" → context bij #6 energie / #10 inflatie   → campaign_hint: financieelthema "ramp/weer"        → context bij #5 weer                     → campaign_hint: gericht_weeralgemene toon            → onderdeel #1 (negatief nieuws)           → composiet + spike
9.6 Onderstroom (sociaal sentiment, #8) — apart behandelen
Zelfde drie lagen, maar met twee accentverschillen: let op volume-pieken (plots veel posts over één thema = vroege waarschuwing, vaak vóór het grote nieuws) en op emotie boven feiten.
Blijft secundair en niet-representatief (Reddit ≠ dwarsdoorsnede van België). Dient als bevestiging van een nieuws-spike (confirmed_by in de trigger-payload), nooit als zelfstandige trigger.
9.7 Implementatienoten
Frequentie: RSS + sentiment elk uur (nieuws is ⚡); GDELT volgt zijn eigen 15-min/uur-ritme.
Taal: NL én FR feeds — gebruik een FR-sentimentmodel (CamemBERT) of vertaal-naar-NL vóór scoring; markeer de taal per headline.
Transparantie: bewaar per dag de top-N bijdragende headlines met hun scores, zodat elke trigger achteraf uitlegbaar is ("dag rood door deze 8 headlines"). Past bij het principe dat alle keuzes publiek en herleidbaar zijn.
Kosten/haalbaarheid: Laag 1 + GDELT zijn gratis; RobBERT/BERTje draaien lokaal zonder API-kosten. Geen dure externe LLM-calls nodig voor de basispijplijn.

Wetenschappelijke onderbouwing
McEwen — allostatic load (basis index).
Marin et al. (2012), PLoS ONE — negatief nieuws verhoogt fysiologische stressreactiviteit: https://pmc.ncbi.nlm.nih.gov/articles/PMC3468453/
Mayo Clinic Press (2024) — herhaalde nieuws-blootstelling en cortisol: https://mcpress.mayoclinic.org/mental-health/how-the-news-rewires-your-brain/
UEA / Understanding Society (2022) — energie-/brandstofarmoede en welzijn: https://www.understandingsociety.ac.uk/news/2022/02/04/high-fuel-prices-affect-mental-and-physical-health/
Nature Energy (2023) — energieprijscrisis en huishoudens: https://www.nature.com/articles/s41560-023-01209-8
BMC Public Health (2024) — subjectieve financiële onzekerheid als sterke stressdeterminant: https://pmc.ncbi.nlm.nih.gov/articles/PMC11668040/

---

## 4. Methodologische basis (pre-registratie + 6 lagen)

### 00_Pre-Registratie

*Bestand: `00_Pre-Registratie.md`*

# Stressor-Blootstellings-Index (SBI)
## Pre-registratie van methodologische keuzes

**Status:** v0.2 — pre-registratie-document
**Doel:** centraliseren van alle pre-geregistreerde methodologische keuzes uit lagen 1-8
**Bedoeld voor:** OSF (Open Science Framework) publicatie vóór eerste meting
**Auteur:** BRAINWOLVES
**Datum:** mei 2026

---

## 0. Wat dit document is

Eén centrale bron van waarheid voor alle keuzes die vóór de eerste meting publiek vastgelegd moeten worden. In v0.1 waren pre-registratie-vereisten verspreid over de laag-1, laag-6 en laag-7 documenten. Dat is fragiel: bij wijziging kunnen documenten uit synchronisatie raken. Dit document consolideert.

Wijzigingen aan deze keuzes worden uitsluitend toegestaan via het in `08_Onderhoud-Protocol.md` beschreven proces. Stille aanpassingen zijn verboden — niet door technische beveiliging, maar door publieke audit-trail.

---

## 1. Identificatie van het instrument

- **Naam:** Stressor-Blootstellings-Index
- **Afkorting:** SBI
- **Versie methodologie:** 0.2
- **Werkmarkt:** België
- **Tijdsresolutie:** wekelijks (met dagelijkse onderliggende data)
- **Eigenaar:** BRAINWOLVES (geen institutionele affiliatie)
- **Licentie:** open methodologie (CC BY 4.0 of equivalent); code: open source (MIT of Apache 2.0)

---

## 2. Construct-definitie (uit laag 1)

> De SBI meet de aggregaat-blootstelling van een populatie aan omgevings-, economische, sociale en mediaomstandigheden waarvan de literatuur consistent aantoont dat ze geassocieerd zijn met stressrespons op populatieniveau, ten opzichte van een gedocumenteerde historische baseline.

**Vier expliciete uitsluitingen** (zie laag 1 §3): geen klinisch instrument, geen individuele meting, geen peer-reviewed wetenschappelijk instrument, geen gedragsvoorspeller.

---

## 3. Theoretische ondersteunende kaders (uit laag 1)

- Allostatic Load Theory (McEwen 1998)
- Social Determinants of Health framework (Marmot/WHO 2008)
- Conservation of Resources (Hobfoll 1989)

**Bewust niet als anker gebruikt:** Lazarus & Folkman (1984) appraisal-model; Holmes-Rahe (1967) Social Readjustment Rating Scale. Reden: zie laag 1 §5.5.

---

## 4. Domein-taxonomie (uit laag 2/3)

**Zes domeinen:**

1. D1 — Omgeving & klimaat (4 indicatoren)
2. D2 — Mobiliteit & ruimte (2 indicatoren)
3. D3 — Economische conditie (5 indicatoren)
4. D4 — Werk & belasting (2 indicatoren)
5. D5 — Media & collectieve gebeurtenissen (3 indicatoren)
6. D6 — Kalender & ritme (4 indicatoren)

**Totaal: 20 primaire indicatoren** + 6 secundaire (sensitivity) + 4 validatie-variabelen.

---

## 5. Inclusiecriteria (uit laag 3)

Een indicator komt in aanmerking dan en slechts dan als ze aan álle vijf voldoet:

1. Theoretische verankering in minstens één ondersteunend kader
2. Empirische evidence op systematic-review- of meta-analyse-niveau (grade A of B)
3. Publieke beschikbaarheid
4. Tijdsresolutie ≤ wekelijks
5. Gedocumenteerde confounder-set

Indicatoren in primaire set met grade A of B; grade C-indicatoren in secundaire set; grade D uitgesloten.

---

## 6. Normalisatie-keuzes (uit laag 5)

### 6.1 Baselines

- *Korte baseline:* 24 maanden voortschrijdend, mediaan + MAD
- *Vaste baseline:* 2010-2019, mediaan + MAD
- Beide parallel gerapporteerd

### 6.2 STL-decompositie

Toegepast op indicatoren waar seizoen confounder is (zie laag 5 §3.2 tabel). Niet toegepast waar seizoen het signaal is (daglichturen, kalender-indicatoren).

### 6.3 Winsorization

±3 SD-equivalent (na MAD-Z-scoring), met audit-trail per gewinsorizeerde waarde.

---

## 7. Wegings-keuzes (uit laag 6)

### 7.1 Drie parallelle schema's

- **Schema 1 — Equal weights** (primair publicatie-schema)
  - Binnen domein: gelijk
  - Tussen domein: 1/6 = 0.167

- **Schema 2 — Evidence-graded met balance-correctie** (parallel)
  - Binnen domein: gewicht ∝ grade (A=3, B=2)
  - Tussen domein: zie definitieve tabel hieronder

- **Schema 3 — Weegafhankelijkheid-diagnostiek** (rapportage, geen signaal)
  - Inverse-rank + single-domain-dropouts + Dirichlet-bootstrap
  - Gerapporteerd als gevoeligheidsstatistiek

### 7.2 Definitieve Schema-2-tabel

| Domein | gewicht |
|---|---|
| D1 Omgeving & klimaat | 0.211 |
| D2 Mobiliteit & ruimte | 0.135 |
| D3 Economische conditie | 0.223 |
| D4 Werk & belasting | 0.108 |
| D5 Media & collectieve gebeurtenissen | 0.155 |
| D6 Kalender & ritme | 0.172 |

---

## 8. Drempelwaarde-keuzes (uit laag 7)

### 8.1 Drie-tier-signaal

| Tier | Voorwaarde |
|---|---|
| Groen | P(t) < 70 |
| Oranje | 70 ≤ P(t) < 90, sustained ≥ 3 opeenvolgende dagen |
| Rood | P(t) ≥ 90, sustained ≥ 3 opeenvolgende dagen |

### 8.2 Decay

Tier-afschaling pas na 3 dagen onder drempel.

### 8.3 Rechtvaardiging

3-dagen-sustained: cortisol-cyclus-literatuur (3 dagen = 3 cycli minimum). P=90: epidemiologische conventie voor "exceptionele dagen". P=70: waarschuwingsband. Allen alternatief getoetst in laag 8 multiverse.

---

## 9. Falsifieerbaarheidscriteria (uit laag 1)

Bij vervulling van enige criterium → methodologie verworpen (of, voor F4, beperking gedocumenteerd):

- **F1.** Inconsistentie bij externe schok (geen stijging tijdens onbetwiste nationale stressor)
- **F2.** Mono-causaliteit (één indicator verklaart > 60% variantie composiet)
- **F3.** Placebo-doorbraak (placebo-indicator significant effect)
- **F4.** Convergentiefalen (geen significante convergentie met gedragsproxies)
- **F5.** Reproduceerbaarheidsfalen (replicatie wijkt > 10% af)

---

## 10. Validatie-tier-gates (uit laag 8)

**Tier-1 — Must-pass voor launch:**
- Toets 1: Natural-experiments (≥ 5/7 events detected)
- Toets 5: Placebo-test (95% CI omvat 0)
- Toets 6: Test-retest reliability (≥ 70% tier-agreement)

**Tier-2 — Should-pass voor launch:**
- Toets 2: Retrospectieve backtest (inter-rater > 80%)
- Toets 3: Convergente validiteit (≥ 2 proxies rho > 0.40, OF ≥ 3 proxies rho > 0.30)
- Toets 4: Multiverse (default-pad binnen centrale 95%)

**Tier-3 — Doorlopend, geen launch-gate:**
- Toets 7: Adversariële review (ontwerp-iteratie)
- Toets 8: Publieke replicatie-uitdaging

---

## 11. Operationele keuzes (uit laag 4)

- Geografische referentie: 50.85°N, 4.35°E (Brussel) voor astronomische metingen
- Missing-data: LCF 3 dagen → linear interpolation 14 dagen → explicit flag
- Tijdsharmonisatie: maand → forward-fill in wekelijks composiet
- Mediacyclus-decorrelatie: protocol §4.4 van laag 4
- Implementatie-stadium: minimum viable pipeline → target architecture stapsgewijs

---

## 12. Publicatie-conventies

### 12.1 Publieke output

- Dagelijkse barometer-record (JSON)
- Signal-API (tier + brand-safety-vlag)
- Volledige historische dataset

### 12.2 Communicatie-discipline (zie ook 09_Brand-Message-Style-Guide.md)

Toegestane formulering: "blootstellings-conditie hoog", "verhoogd-blootstellings-venster", "extreme omstandigheden".
Niet toegestaan: "u bent gestrest", "Vlamingen zijn collectief gestrest", individuele attributies.

Abonnees (campagnes, persgebruik) tekenen voor naleving van deze stijlgids.

---

## 13. Wijzigings-protocol

Aanpassingen aan deze pre-registratie:
- Minimaal 30 dagen vooraf publiek aangekondigd
- Reden gedocumenteerd in versioned methodology paper
- Triggert herberekening alle historische data onder beide versies
- Beide versies parallel beschikbaar tot uitfasering van oude versie

Toegestane wijzigings-gronden (zie laag 6 §7):

- A1. Nieuwe meta-analyse/SR verandert evidence-grade structureel
- A2. Indicator-toevoeging of -verwijdering door datatoegang
- A3. Falsifieerbaarheidscriteria-falen

Geen wijziging mag worden gemotiveerd door "het signaal komt niet uit zoals we willen".

---

## 14. Datum van pre-registratie

Deze pre-registratie wordt gepubliceerd op OSF op datum [TE BEPALEN] vóór eerste meting. SHA-256-hash van het document wordt op datum van OSF-publicatie publiek gemaakt om manipulatie achteraf zichtbaar te maken.

---

## 15. Adviesraad (in opbouw)

Vóór livegang: drie tot vijf individuele academici uit tegengestelde methodologische scholen. Identiteit, disclosures en vergoeding publiek bij livegang. Eén adviseur expliciet aangewezen als *adversariële collaborator* met methodologische veto-positie op specifieke ontwerpkeuzes (welke nog te bepalen voor finale pre-registratie).

---

### 01_Anker-Paper

*Bestand: `01_Anker-Paper.md`*

# Stressor-Blootstellings-Index (SBI)
## Anker-paper: construct, theoretisch fundament en scope-afbakening

**Status:** v0.2 — werkdocument
**Document:** laag 1 en laag 2 van de methodologie
**Auteur:** BRAINWOLVES
**Datum:** mei 2026

---

## 0. Samenvatting

Dit document legt het wetenschappelijk-onderbouwde fundament vast voor de Stressor-Blootstellings-Index (hierna: SBI) — een gestandaardiseerde, publiek herhaalbare meting van blootstelling aan omgevings-, economische, sociale en mediaomstandigheden waarvan de literatuur consistent aantoont dat ze geassocieerd zijn met stressrespons op populatieniveau.

Het anker-paper legt vier zaken vast vóór er ook maar één indicator geselecteerd wordt: (1) wat de SBI is en wat hij niet is, (2) welke theoretische tradities het construct *ondersteunen* (zonder dat de SBI claimt te meten wat die tradities meten), (3) langs welke domein-taxonomie indicatoren worden ingedeeld, en (4) onder welke condities de SBI als methodologisch ongeldig beschouwd moet worden.

Pas wanneer dit fundament publiek vastligt en pre-geregistreerd is, opent indicator-selectie (laag 3).

---

## 1. Terminologische discipline

Door alle SBI-documenten heen wordt strikt vastgehouden aan vier woordregels:

- *"Stressoren"* = externe omstandigheden die een stressrespons kunnen uitlokken (technische term in stress-science, niet hetzelfde als "stress")
- *"Blootstelling"* = aanwezigheid van stressoren in de omgeving — exact wat publieke data kan meten
- *"Literatuur-onderbouwd"* in plaats van "wetenschappelijk" — we doen geen wetenschap in strikte zin, we steunen *op* wetenschap
- *"Ondersteunende kaders"* in plaats van "ankers" — we doen niet wat die kaders doen, we hangen er niet aan vast

Deze terminologische discipline beschermt tegen scope-creep waarbij een bescheiden methodologie zichzelf in latere documenten tot quasi-wetenschap promoot.

---

## 2. Doel van dit document

Dit is geen marketingdocument. Het is een methodologisch fundament met één opzet: vóórdat de SBI iets meet, vastleggen wat ze meet, op grond waarvan, binnen welke grenzen, en wanneer ze als instrument verworpen moet worden.

De ratio: een index die haar fundament vastlegt ná dataverzameling kan haar uitkomsten kneden tot wat de bouwer wil zien. Door fundament en selectiecriteria vóór dataverzameling vast te leggen — en publiek pre-registreren — wordt latere manipulatie zichtbaar en daarmee onmogelijk zonder reputatieverlies.

---

## 3. Wat dit niet is

Vier expliciete uitsluitingen, vooraan geplaatst om te voorkomen dat de SBI later iets claimt wat ze niet kan dragen.

**De SBI is geen klinisch diagnostisch instrument.**
Een klinische uitspraak over stress vereist individuele meting via gevalideerde vragenlijsten (PSS-10, DASS-21, MBI), fysiologische data (cortisol, hartritmevariabiliteit, ontstekingsmarkers), klinisch interview en differentiaaldiagnose op basis van DSM-5 of ICD-11. De SBI doet geen van deze. Niemand kan op basis van de SBI worden gediagnosticeerd of gemedicaliseerd.

**De SBI meet geen individuen.**
De index is een populatie-instrument. Elke uitspraak die uit de SBI-data wordt afgeleid heeft alleen geldigheid op aggregaatniveau. Individuele attributies ("u bent gestrest omdat de index hoog is") zijn ecologische drogredenen en niet ondersteund door het instrument.

**De SBI is geen peer-reviewed wetenschappelijk instrument.**
Het instrument is gebouwd zonder veldwerk en zonder institutionele affiliatie. Het kan daarom geen aanspraak maken op publicatie in een wetenschappelijk tijdschrift of op validatie via een academisch reviewproces. Wat de SBI wel is: een transparant gedocumenteerde, publiek herhaalbare meting met expliciete methodologische verantwoording.

**De SBI is geen voorspeller van individueel gedrag.**
Correlatie tussen aggregaatcondities en aggregaatgedrag betekent niet dat de SBI voorspelt of voorschrijft wat enig individu zal of moet doen.

---

## 4. Het construct: wat de SBI meet

### 4.1 Constructdefinitie

> **De Stressor-Blootstellings-Index meet de aggregaat-blootstelling van een populatie aan omgevings-, economische, sociale en mediaomstandigheden waarvan de literatuur consistent aantoont dat ze geassocieerd zijn met stressrespons op populatieniveau, ten opzichte van een gedocumenteerde historische baseline.**

Drie elementen verdienen toelichting:

*Aggregaat-blootstelling.* De SBI meet hoeveel stressoren-condities aanwezig zijn en in welke mate — niet hoeveel mensen stress *ervaren*. Het verschil is fundamenteel.

*Literatuur consistent aantoont.* Elke indicator die in laag 3 wordt opgenomen moet rusten op systematic-review- of meta-analyse-grade evidence.

*Geassocieerd met stressrespons op populatieniveau.* Het causale verband tussen blootstelling en respons hoeft niet gevestigd; een robuuste associatie volstaat. Maar de associatie moet expliciet gedocumenteerd zijn met bronvermelding.

### 4.2 Wat het construct uitsluit

Drie zaken die de SBI bewust niet meet:

1. *Subjectieve appraisal.* De cognitieve waardering die een individu maakt van demand-vs-resources (Lazarus & Folkman 1984) is per definitie subjectief en alleen via zelfrapportage meetbaar.

2. *Resources-zijde.* Beschermende resources (sociale steun, controlegevoel, slaapkwaliteit, financiële reserve, hersteltijd) zijn niet op hoge frequentie uit publieke data te halen. De SBI meet alleen de demand-zijde. Dit is een expliciete keuze, geen omissie.

3. *Fysiologische stress-merkers.* Cortisolritmes, hartritmevariabiliteit, inflammatie-merkers zijn klinische metingen. De SBI gebruikt geen fysiologische data.

---

## 5. Ondersteunende theoretische kaders

De SBI steunt *op* drie wetenschappelijke tradities, zonder te claimen te meten wat zij meten. Elk kader beantwoordt een vraag die de SBI moet beantwoorden.

### 5.1 Allostatic Load Theory (McEwen)

*Welke vraag beantwoordt het:* "wat is stress epidemiologisch, niet klinisch?"

McEwen (1998, 1993) ontwikkelde *allostatic load* als concept voor de cumulatieve fysiologische en psychologische belasting die ontstaat wanneer een organisme zich herhaaldelijk aanpast aan demand.

*Wat we ervan overnemen:* het idee dat cumulatieve blootstelling zwaarder weegt dan acute incidenten; dat populatie-stress legitiem via meerdere indicatoren benaderd kan worden.

*Wat we niet overnemen:* de biologische merkers (cortisol, bloeddruk, ontsteking) die McEwen zelf gebruikt — die zijn klinisch. We claimen niet allostatic load te meten.

### 5.2 Social Determinants of Health framework (Marmot, WHO)

*Welke vraag beantwoordt het:* "welke domeinen van publieke conditie zijn legitiem onderdeel van een stressrelevante meting?"

Marmot (Whitehall-studies; WHO 2008) toonde aan dat sociale, economische en omgevingsdeterminanten op populatieniveau zwaar wegen op gezondheid en welzijn.

*Wat we ervan overnemen:* de domein-taxonomie als ruggengraat voor indicator-indeling; de legitimering dat publieke determinanten een gerechtvaardigd meetdoel zijn.

*Wat we niet overnemen:* gezondheidsuitkomsten zelf (de SBI meet condities, niet uitkomsten); de lange tijdshorizon (SDoH meet over decennia; de SBI over dagen tot weken).

### 5.3 Conservation of Resources theory (Hobfoll)

*Welke vraag beantwoordt het:* "waarom werken stressoren in de richting waarin we ze meten?"

Hobfoll (1989) postuleerde dat stress ontstaat wanneer hulpbronnen bedreigd, verloren of niet aangevuld worden. Hoewel CoR oorspronkelijk individueel-resource-gericht is, biedt het een mechanistische verklaring voor waarom externe condities populatiebreed werken.

*Wat we ervan overnemen:* het mechanisme dat verlies-, dreiging- en uitputtingscondities relevant zijn als populatie-stressoren.

*Wat we niet overnemen:* individuele resource-meting; de interventie-implicaties.

### 5.4 Eerlijke beperking: theorie-meet-mismatch

Geen van deze drie kaders *meet* wat de SBI meet. McEwen meet biologie; Marmot meet uitkomsten; Hobfoll meet individuen. De SBI meet publieke blootstelling.

Wat de SBI doet is: de drie kaders gebruiken om *te rechtvaardigen welke condities zinvol zijn om te volgen*, zonder te claimen die kaders methodologisch te implementeren. Dit is een eerlijke positie. We staan op de schouders van wetenschap die we niet zelf bedrijven.

### 5.5 Waarom Lazarus en Holmes-Rahe niet als ondersteunend kader

Het transactionele stressmodel (Lazarus & Folkman 1984) is appraisal-gebaseerd en daarmee individueel en subjectief. Het ondersteunt de SBI niet — een methodologie op publieke data kan appraisal niet meten.

Holmes-Rahe Social Readjustment Rating Scale (1967) is Westers-biased, individu-gericht, statisch, en weegt life events met arbitraire scores. We citeren het niet als precedent.

---

## 6. Conceptueel model

```
                       ┌─────────────────────────────────┐
                       │  STRESSOR-BLOOTSTELLINGS-INDEX  │
                       │              (SBI)              │
                       │                                 │
                       │   meet: AGGREGAATBLOOTSTELLING  │
                       │   uit: PUBLIEKE DATA            │
                       │   tegen: HISTORISCHE BASELINE   │
                       └─────────────────┬───────────────┘
                                         │
                                         │ signal
                                         ▼
                       ┌─────────────────────────────────┐
                       │  PERCENTIEL-POSITIE             │
                       │  + verhoogd-blootstellings-     │
                       │    venster ja/nee               │
                       └─────────────────────────────────┘

   wat ERTUSSEN zit en NIET door de SBI gemeten wordt:
   ─────────────────────────────────────────────────────
   Appraisal (Lazarus) · Individuele resources (Hobfoll) · Coping ·
   Individuele kwetsbaarheid · Sociale steun · Slaap · Klinische stressrespons
```

De SBI staat aan de linkerkant van het stressproces: bij de *condities*. Wat na conditie komt ligt buiten het instrument.

---

## 7. Domein-taxonomie (laag 2)

### 7.1 Bron van de taxonomie

De SBI-domeinen zijn afgeleid van de Social Determinants of Health-domeinen (WHO 2008) en aangevuld met domeinen die in de stressliteratuur consistent voorkomen maar buiten SDoH vallen.

### 7.2 De zes SBI-domeinen (v0.2-consolidatie)

| Domein | Wetenschappelijke basis | Voorbeelden van indicator-typen |
|---|---|---|
| **D1. Omgeving & klimaat** | Environmental psychology; Attention Restoration Theory; chronobiologie | Weer, licht, luchtkwaliteit |
| **D2. Mobiliteit & ruimte** | Crowding research (Evans, 1979); commute stress (Novaco et al, 1990) | Verkeer, drukte, brandstof |
| **D3. Economische conditie** | SDoH economic stability; behavioral economics | Prijzen, koopkracht, werkmarkt |
| **D4. Werk & belasting** | Job Demand-Resources model; Effort-Reward Imbalance | Deadlinekalender, opvangdruk |
| **D5. Media & collectieve gebeurtenissen** | Mean World Syndrome (Gerbner); collective trauma literature (Holman et al) | Nieuwsnegativiteit, gebeurtenissen |
| **D6. Kalender & ritme** | Chronobiologie; weekly cycle research | Weekdag, klok verzetten, examens |

**Verandering tegenover v0.1:** in v0.1 waren D5 (sociaal) en D6 (media) gescheiden, met D5 een placeholder-domein met één event-indicator. In v0.2 zijn ze samengevoegd omdat collectieve gebeurtenissen voornamelijk via mediablootstelling werken, en omdat een 1-indicator-domein geen domein is maar een tag. Voorts is I-D7-004 (seizoensfase) verplaatst naar secundaire set vanwege wiskundige overlap met I-D1-001 (daglichturen) — dit voorkomt dubbeltelling van het seizoenseffect.

### 7.3 Inclusiecriteria voor indicatoren

Een indicator komt in aanmerking dan en slechts dan als ze aan álle vijf voldoet:

1. **Theoretische verankering** in ten minste één van de drie ondersteunende kaders
2. **Empirische evidence** op systematic-review- of meta-analyse-niveau van associatie met stressrespons op populatieniveau
3. **Publieke beschikbaarheid** — geen proprietary data, geen veldwerk
4. **Tijdsresolutie ≤ wekelijks**
5. **Gedocumenteerde confounder-set**

Indicatoren die niet aan alle vijf voldoen worden expliciet vermeld in de exclusion log met reden.

### 7.4 Counter-evidence-discipline

Per indicator in laag 3 wordt een "contrasterend bewijs"-veld opgenomen, om one-sided lit-review te voorkomen. Beperking: dit is een redelijke-search-acknowledgment, geen systematische Cochrane-bias-assessment.

---

## 8. Falsifieerbaarheidscriteria

In de geest van Popper (1959): een methodologie die onder geen denkbare omstandigheid verworpen kan worden, is geen wetenschap maar geloof. De SBI wordt vooraf gebonden aan vijf condities waarvan vervulling de methodologie als ongeldig kwalificeert.

**F1. Inconsistentie bij externe schok.**
Indien de SBI niet stijgt boven baseline tijdens een onbetwiste externe stressor van nationale schaal (oorlogsverklaring, pandemie-uitroeping, massale uitval van basisinfrastructuur), is de methodologie verworpen.

**F2. Mono-causaliteit.**
Indien sensitivity-analyse aantoont dat één enkele indicator meer dan 60% van de variatie in het composiet verklaart, is het composiet feitelijk een verkapte enkelvoudige meting en de methodologie verworpen.

**F3. Placebo-doorbraak.**
Indien een vooraf gedefinieerde placebo-indicator een statistisch significant effect op het composiet uitoefent, is een methodologische fout aanwezig en de huidige versie verworpen tot identificatie.

**F4. Convergentiefalen.**
Indien de SBI bij triangulatie tegen onafhankelijke gedragsproxies over een periode van 24 maanden geen statistisch significante convergentie vertoont, is de externe geldigheid onvoldoende en de methodologie verworpen.

**F5. Reproduceerbaarheidsfalen.**
Indien onafhankelijke replicatie via de gepubliceerde open methodologie tot materieel afwijkende resultaten leidt (verschil > 10% in dagscores over een gemeenschappelijke testperiode), is de specificatie onvolledig en de methodologie verworpen tot herziening.

---

## 9. Scope-afbakening

**Bevolking.** De SBI meet condities zoals ze zich voordoen in een gedefinieerd geografisch gebied (werkhypothese: België).

**Tijdsresolutie.** Wekelijkse update als standaard. Dagelijkse uitsplitsing waar databronnen het toelaten.

**Geografische scope.** Eén werkmarkt per index-instantie. Een Belgische SBI bestaat los van een Nederlandse SBI; ze zijn niet onderling vergelijkbaar zonder afzonderlijke validatie.

**Tijdshorizon.** Acute condities (dagen-weken).

**Wat buiten scope valt.** Individuele meting; klinische uitspraak; voorspelling; vergelijking tussen landen; toewijzing aan demografische groepen; causale claim over stressoorzaak van enige gebeurtenis.

---

## 10. Output-specificatie

Het systeem levert drie outputs:

1. **Dagelijkse/wekelijkse percentiel-positie** van het composiet ten opzichte van een 24-maands voortschrijdende baseline én een vaste pre-pandemische referentieperiode.

2. **Status van het verhoogd-blootstellings-venster** — open / gesloten — gebaseerd op pre-geregistreerde drempelwaarde.

3. **Indicator-bijdrage-overzicht** — welke domeinen en indicatoren het meest bijdragen aan de huidige stand.

Het systeem geeft geen aanbeveling, geen waarschuwing, geen diagnose. Het rapporteert positie en signaalstatus.

---

## 11. Wetenschappelijke positionering

De SBI is *geen* peer-reviewed wetenschappelijk instrument. Het zal nooit in een tijdschrift met impact factor verschijnen.

De SBI *is* een literatuur-onderbouwde, transparant gedocumenteerde publieke meting met:

- Open methodologie (pre-geregistreerd, publiek vindbaar)
- Open data-bronnen (uitsluitend publiek)
- Open code (reproduceerbaar)
- Open kritiek (bug-bounty model voor methodologische uitdagingen)
- Externe lichte adviesraad (individuele academici uit tegengestelde methodologische scholen)

Dit is een eerlijk plafond. We positioneren de SBI niet als wetenschap-met-grote-W, maar als rigoureus gedocumenteerde publieke meting.

---

## 12. Volgende stappen

Wanneer dit anker-paper publiek gemaakt en pre-geregistreerd is (zie `00_Pre-Registratie.md`), opent laag 3: indicator-selectie per domein.

Vóór laag 3:

1. Externe lichte adviesraad samenstellen (minstens drie individuele academici uit verschillende methodologische tradities, met expliciet adversariële rol)
2. Pre-registratie indienen op OSF
3. Publieke kritiek-periode openen — minimaal 30 dagen

Pas daarna komt indicator-selectie. Pas daarna komt data. Pas daarna komt meting.

---

## Bronnen

Cleveland, R. B., Cleveland, W. S., McRae, J. E., & Terpenning, I. (1990). STL: A seasonal-trend decomposition procedure based on Loess. *Journal of Official Statistics*, 6(1), 3-73.

Evans, G. W. (1979). Behavioral and physiological consequences of crowding in humans. *Journal of Applied Social Psychology*, 9, 27-46.

Gerbner, G., & Gross, L. (1976). Living with television: The violence profile. *Journal of Communication*, 26(2), 172-194.

Hobfoll, S. E. (1989). Conservation of resources: A new attempt at conceptualizing stress. *American Psychologist*, 44(3), 513-524.

Holmes, T. H., & Rahe, R. H. (1967). The Social Readjustment Rating Scale. *Journal of Psychosomatic Research*, 11(2), 213-218.

Lazarus, R. S., & Folkman, S. (1984). *Stress, appraisal, and coping*. Springer.

McEwen, B. S. (1998). Stress, adaptation, and disease. *Annals of the New York Academy of Sciences*, 840, 33-44.

McEwen, B. S., & Stellar, E. (1993). Stress and the individual. *Archives of Internal Medicine*, 153(18), 2093-2101.

Novaco, R. W., Stokols, D., & Milanesi, L. (1990). Objective and subjective dimensions of travel impedance. *American Journal of Community Psychology*, 18(2), 231-257.

Popper, K. R. (1959). *The logic of scientific discovery*. Hutchinson.

Seeman, T. E., McEwen, B. S., Rowe, J. W., & Singer, B. H. (2001). Allostatic load as a marker of cumulative biological risk. *PNAS*, 98(8), 4770-4775.

Steegen, S., Tuerlinckx, F., Gelman, A., & Vanpaemel, W. (2016). Increasing transparency through a multiverse analysis. *Perspectives on Psychological Science*, 11(5), 702-712.

WHO Commission on Social Determinants of Health (2008). *Closing the gap in a generation*. World Health Organization.

---

### 02_Laag-3_Indicator-Selectie

*Bestand: `02_Laag-3_Indicator-Selectie.md`*

# Stressor-Blootstellings-Index (SBI)
## Laag 3: Indicator-selectie per domein

**Status:** v0.2 — werkdocument
**Document:** laag 3 van de methodologie
**Bouwt op:** 01_Anker-Paper.md (laag 1 + 2)
**Auteur:** BRAINWOLVES
**Datum:** mei 2026

---

## 0. Samenvatting

Dit document selecteert indicatoren voor elk van de zes SBI-domeinen die in het anker-paper zijn vastgelegd. Per domein worden kandidaat-indicatoren beoordeeld langs vijf inclusiecriteria en een vierpunts-evidence-grading. Het document levert vier zaken op: (1) een inclusielijst van indicatoren die het primaire composiet vormen, (2) een secundaire lijst voor sensitivity-analyse, (3) een expliciete exclusion log van overwogen-maar-afgewezen indicatoren, en (4) per indicator een acknowledgement van contrasterend bewijs voor zover bekend.

Indicator-selectie volgt voor laag 4 (operationalisering), niet andersom.

---

## 1. Doel en relatie tot het anker-paper

Het anker-paper legde vast *wat* de SBI meet (publieke blootstelling aan stressoren-condities geassocieerd met stressrespons op populatieniveau) en in *welke domeinen*. Dit document legt vast *welke concrete indicatoren* in die domeinen voldoen aan de inclusiecriteria.

Selectie volgt een strikt protocol: een indicator komt in aanmerking dan en slechts dan als ze aan alle vijf criteria voldoet (zie §3). De evidence-strength bepaalt vervolgens of de indicator in de *primaire set* (composiet) of de *secundaire set* (sensitivity) terechtkomt.

Indicatoren die overwogen maar niet geselecteerd worden, gaan naar de exclusion log met expliciete reden. Dit beschermt tegen stille selectie-bias.

---

## 2. Evidence-grading-schema

Aangepast van GRADE (Grading of Recommendations Assessment, Development and Evaluation) en Cochrane-conventies, vereenvoudigd voor populatieniveau-stressoren.

| Grade | Criterium | Lot |
|---|---|---|
| **A — High** | ≥1 meta-analyse OF ≥2 systematic reviews die associatie met stressrespons op populatieniveau ondersteunen | Primaire set |
| **B — Moderate** | 1 systematic review OF ≥3 consistente cohortstudies | Primaire set |
| **C — Low** | Meerdere consistente individuele studies, geen SR | Secundaire set (sensitivity) |
| **D — Very Low** | Enkele studie of alleen mechanistische evidentie | Uitgesloten |

**Regel:** alleen grade A en B vormen het primaire composiet. Grade C wordt parallel gerapporteerd in sensitivity-analyse. Grade D komt niet in de index.

**Beperking van de grading:** evidence-grade weerspiegelt *hoeveel onderzoek* een associatie ondersteunt, niet *hoe sterk* de associatie is. Een goed-onderzochte zwakke associatie krijgt hoger gewicht dan een matig-onderzochte sterke associatie. Dit is een bekende beperking van evidence-grading-systemen; geaccepteerd omdat alternatieven (effect-size-weging) datawerk vereisen dat buiten scope ligt.

---

## 3. Inclusiecriteria

Een indicator komt in aanmerking dan en slechts dan als ze aan álle vijf voldoet:

1. **Theoretische verankering** in minstens één ondersteunend kader (allostatic load, SDoH, CoR)
2. **Empirische evidence** op SR/MA-niveau (grade A of B)
3. **Publieke beschikbaarheid** — geen proprietary data, geen veldwerk
4. **Tijdsresolutie ≤ wekelijks**
5. **Gedocumenteerde confounder-set**

---

## 4. Domein D1 — Omgeving & klimaat

### D1.1 Daglichturen / lichtblootstelling

- **Ondersteunend kader:** Allostatic Load (chronobiologische component); SDoH neighborhood/environment
- **Pathway:** verminderde lichtblootstelling → circadiane verstoring → verlaagde serotonine-/melatonine-functie → verhoogde affectieve dysregulatie en SAD-symptomen op populatieniveau
- **Evidence:** Rosenthal et al (1984) primaire SAD-beschrijving; Lam & Levitt (1999) reviewmonograaf; Golden et al (2005, *Am J Psychiatry*) meta-analyse lichttherapie en stemmingsstoornissen
- **Grade:** A
- **Contrasterend bewijs:** Mersch et al (1999) toont dat SAD-prevalentie minder consistent is dan vaak gerapporteerd; effectgroottes van lichteffecten op populatieniveau variëren sterk per breedtegraad
- **Operationalisering:** uren tussen zonsopgang en zonsondergang per locatie, eventueel gecorrigeerd voor bewolking via solar irradiance (KW/m²)
- **Databron:** KMI/RMI (openbare meteodata)
- **Resolutie:** dagelijks
- **Historische beschikbaarheid:** >50 jaar
- **Confounders:** seizoenseffect (gedeeltelijk gewenst signaal); activity levels; sociale isolatie in winter
- **Beslissing:** **INGESLOTEN (primair)**

### D1.2 Temperatuur-extremen (hitte en kou)

- **Ondersteunend kader:** Allostatic Load (thermoregulatie); SDoH neighborhood/environment
- **Pathway:** thermoregulatieve belasting → slaapverstoring (hitte > 25°C 's nachts) → cumulatieve allostatic load → stressrespons
- **Evidence:** Hajat et al (2010, *Epidemiology*); Thompson et al (2018, *Sci Total Environ*); Liu et al (2021)
- **Grade:** A (hitte), B (kou)
- **Contrasterend bewijs:** sommige analyses (Burke et al 2018) suggereren dat acclimatisering hitte-effecten op populatieniveau ten dele neutraliseert; effectgroottes variëren tussen klimaatzones
- **Operationalisering:** dagen met Tmax > 30°C; tropische nachten (Tmin > 20°C); koude-episodes (Tmin < -5°C); afwijking van seizoensgemiddelde
- **Databron:** KMI/RMI
- **Resolutie:** dagelijks
- **Confounders:** vochtigheid; sociale gatherings; air-conditioning-toegang naar SES
- **Beslissing:** **INGESLOTEN (primair, hitte); INGESLOTEN (primair, kou)**

### D1.3 Luchtkwaliteit (PM2.5, ozon, NO₂)

- **Ondersteunend kader:** Allostatic Load (inflammatoire pathway); SDoH neighborhood/environment
- **Pathway:** fijnstof- en ozonblootstelling → systeem-inflammatie + cerebrale ontsteking → verhoogd depressie- en angstrisico
- **Evidence:** Braithwaite et al (2019, *Environ Health Perspect*) meta-analyse; Newbury et al (2019, *JAMA Psychiatry*); WHO (2021)
- **Grade:** A
- **Contrasterend bewijs:** effect-omkering bij lage blootstellingen (lineair-niet-drempel-debat in luchtkwaliteit-epidemiologie); methodologische kritieken op cohorts met overlap stedelijke confounders
- **Operationalisering:** dagelijkse gemiddelden PM2.5, max ozon, NO₂ — relatief tot WHO-grenswaarden
- **Databron:** IRCEL-CELINE (publiek)
- **Resolutie:** uurlijks/dagelijks
- **Confounders:** correlatie met weer (windstilte), verkeer, seizoen
- **Beslissing:** **INGESLOTEN (primair)**

### D1.4 Luchtdruk-schommelingen

- **Ondersteunend kader:** Allostatic Load (chronobiologische/fysiologische component)
- **Evidence:** Hoffmann et al (2011); verspreide studies, geen SR op populatieniveau
- **Grade:** C
- **Contrasterend bewijs:** Hoffmann et al (2015) replicatiepoging vond geen consistent verband; debat over weeromslag-stress is folklore-zwaar
- **Beslissing:** **SECUNDAIRE SET**

### D1.5 Pollenconcentratie

- **Ondersteunend kader:** Allostatic Load (allergische inflammatie)
- **Evidence:** D'Amato et al (2007) overzicht; verband met depressie minder hard
- **Grade:** C
- **Contrasterend bewijs:** verband pollen-stress is grotendeels indirect via allergie-symptomen, niet rechtstreeks
- **Beslissing:** **SECUNDAIRE SET**

### D1.6 Lawaaiblootstelling

- **Ondersteunend kader:** Allostatic Load; SDoH
- **Evidence:** WHO Environmental Noise Guidelines (2018) — A-grade voor cardiovasculair/slaap; B voor mentale gezondheid (Hahad et al 2019)
- **Grade:** B
- **Beslissing:** **UITGESLOTEN** — voldoet niet aan criterium 4 (geen wekelijkse publieke data op populatieniveau beschikbaar in België)

---

## 5. Domein D2 — Mobiliteit & ruimte

### D2.1 Filezwaarte (verkeerscongestie)

- **Ondersteunend kader:** Conservation of Resources (tijd, controle); SDoH
- **Pathway:** lange/onvoorspelbare reistijd → autonomieverlies + tijdsverlies → cortisol-respons (Novaco et al 1990)
- **Evidence:** Novaco et al (1990) originele studie; Stutzer & Frey (2008); Künn-Nelen (2016); Chatterjee et al (2020) systematic review
- **Grade:** A
- **Contrasterend bewijs:** Lorenz (2018) en sommige studies in stedelijke contexten tonen dat reistijd na controle voor SES en woon-werk-locatiekeuze veel zwakker correleert met welzijn; "commute paradox" suggereert zelfselectie-bias in cross-sectionele studies
- **Operationalisering:** totale file-kilometers spitsuur; gemiddelde vertraging in minuten
- **Databron:** Vlaams Verkeerscentrum (publiek dagelijks)
- **Resolutie:** uurlijks/dagelijks
- **Confounders:** weer; vakantieperiodes; ongevallen; wegenwerken
- **Beslissing:** **INGESLOTEN (primair)**

### D2.2 Openbaar-vervoer-verstoringen

- **Ondersteunend kader:** CoR (controle, voorspelbaarheid)
- **Evidence:** Cheng (2010) train delay and commuter stress
- **Grade:** B
- **Contrasterend bewijs:** beperkte literatuur, voornamelijk klein-schalige studies
- **Beslissing:** **HOLD** — voldoet aan criterium 4 alleen indien dagelijkse aggregaten via NMBS/Infrabel beschikbaar. Te bevestigen in laag 4.

### D2.3 Aangekondigde stakingen openbaar vervoer

- **Ondersteunend kader:** CoR (anticipatorische resource-loss)
- **Grade:** C
- **Beslissing:** **SECUNDAIRE SET**

### D2.4 Brandstofprijzen

- **Ondersteunend kader:** CoR (financiële resource); SDoH economic
- **Pathway:** verhoogde brandstofprijs → koopkrachtdruk + mobiliteitsbeperking → cumulatieve stress
- **Evidence:** financial stress literature (Brüggen et al 2017)
- **Grade:** B
- **Contrasterend bewijs:** prijs-effecten op stress zijn sterk gemoduleerd door inkomen; geen direct SR voor brandstofprijs specifiek
- **Databron:** FOD Economie maximumprijzen
- **Resolutie:** dagelijks
- **Beslissing:** **INGESLOTEN (primair)**

### D2.5 Aangekondigde grote wegenwerken

- **Grade:** D
- **Beslissing:** **UITGESLOTEN**

---

## 6. Domein D3 — Economische conditie

### D3.1 Consumptieprijsindex (inflatie)

- **Ondersteunend kader:** CoR (financiële resource); SDoH economic stability
- **Evidence:** Brüggen et al (2017); Kahneman & Tversky (1979); meerdere SR financial-strain
- **Grade:** A
- **Contrasterend bewijs:** Easterlin paradox-debat suggereert dat absolute inkomensniveaus minder voorspellend zijn voor welzijn dan relatieve veranderingen
- **Operationalisering:** jaar-op-jaar CPI-stijging
- **Databron:** STATBEL
- **Resolutie:** maandelijks (forward-filled in wekelijks composiet)
- **Beslissing:** **INGESLOTEN (primair, chronische component)**

### D3.2 Energieprijzen (gas, elektriciteit)

- **Ondersteunend kader:** CoR; SDoH economic
- **Evidence:** Thomson et al (2017); Liddell & Morris (2010) review energy poverty
- **Grade:** B
- **Contrasterend bewijs:** prijs-effecten gefilterd door energiearmoede-status; niet alle huishoudens even gevoelig
- **Databron:** VREG/CREG; Eurostat
- **Resolutie:** wekelijks
- **Beslissing:** **INGESLOTEN (primair)**

### D3.3 Aangekondigde collectieve ontslagen

- **Ondersteunend kader:** CoR (job-resource threat); SDoH economic
- **Evidence:** Brand (2015) meta-analyse; Burgard et al (2009); De Witte et al (2016) SR
- **Grade:** A
- **Contrasterend bewijs:** spillover van aangekondigde ontslagen naar niet-betrokkenen is matig sterk maar niet consistent over alle studies
- **Operationalisering:** log(1 + werknemers in collectieve-ontslagprocedures per week)
- **Databron:** FOD WASO
- **Resolutie:** wekelijks
- **Beslissing:** **INGESLOTEN (primair)**

### D3.4 Beurs-volatiliteit (BEL20)

- **Grade:** C
- **Contrasterend bewijs:** populatie-stress-effect via media-transmissie minder hard onderbouwd dan beleggers-effect
- **Beslissing:** **SECUNDAIRE SET**

### D3.5 Werkloosheidscijfer

- **Ondersteunend kader:** SDoH economic; CoR
- **Grade:** A
- **Databron:** STATBEL / Steunpunt Werk
- **Resolutie:** maandelijks
- **Beslissing:** **INGESLOTEN (primair, chronische component)**

### D3.6 Hypotheekrente

- **Ondersteunend kader:** CoR; financial stress literature
- **Grade:** B
- **Databron:** NBB
- **Beslissing:** **INGESLOTEN (primair, chronische component)**

---

## 7. Domein D4 — Werk & belasting

*Notitie: D4 lijdt structureel onder gebrek aan hoogfrequente publieke werkstress-data.*

### D4.1 Kalendarische deadlinepieken

- **Ondersteunend kader:** JDR-model (Bakker & Demerouti 2007); CoR
- **Evidence:** Bakker & Demerouti (2007, 2017); Sonnentag (2018) recovery-literatuur
- **Grade:** B
- **Contrasterend bewijs:** literatuur over deadlines is overwegend laboratoriumonderzoek; populatie-effect minder direct gedocumenteerd
- **Operationalisering:** binaire vlaggen voor belastingdeadline-week, kwartaaleinde, jaareinde
- **Databron:** kalender-deterministisch
- **Beslissing:** **INGESLOTEN (primair)**

### D4.2 Schoolvakantie-zonder-opvang-druk

- **Ondersteunend kader:** CoR (tijd, sociale resource); JDR
- **Evidence:** Bianchi et al (2012); Crouter et al (2001)
- **Grade:** B
- **Contrasterend bewijs:** effectgrootte sterk gemodereerd door huishouden-type en gender
- **Beslissing:** **INGESLOTEN (primair)**

### D4.3 Ziekteverzuim-aggregaat

- **Status:** uitkomst, geen stressor — gebruikt als convergente validatie (laag 8)
- **Beslissing:** **UITGESLOTEN als input; INGESLOTEN als validatievariabele**

### D4.4 Aangekondigde reorganisaties / herstructureringen

- **Beslissing:** **UITGESLOTEN als zelfstandig — onderdeel van D3.3**

---

## 8. Domein D5 — Mediaomgeving & collectieve gebeurtenissen

*Dit domein consolideert wat in v0.1 verspreid was over D5 (sociaal) en D6 (media). Aangezien een 1-indicator-domein geen domein is maar een placeholder, en collectieve gebeurtenissen voornamelijk via mediablootstelling werken, zijn beide samengevoegd.*

### D5.1 Nieuwsnegativiteits-index

- **Ondersteunend kader:** Mean World Syndrome (Gerbner 1976); affective contagion
- **Pathway:** consumptie van negatief nieuws → verhoogde threat-appraisal op aggregaatniveau → stressrespons
- **Evidence:** Soroka et al (2019, *PNAS*); Boukes et al (2015); Kleemans & Hendriks Vettehen (2009)
- **Grade:** B
- **Contrasterend bewijs:** kritiek op tone-analyse-validiteit; Boydstun et al (2014) tonen dat news-tone-metriek inconsistent reageert tussen taalgebieden
- **Operationalisering:** GDELT-tone-score voor NL-talige Belgische bronnen, 7-daags voortschrijdend gemiddelde
- **Databron:** GDELT (publiek via BigQuery)
- **Resolutie:** dagelijks
- **Confounders:** mediacyclus; agenda-setting; nieuwsvolume
- **Beslissing:** **INGESLOTEN (primair)**

### D5.2 Google-zoekvolume voor stress-gerelateerde termen

- **Ondersteunend kader:** revealed preference; behavioral indicator
- **Evidence:** Stephens-Davidowitz (2017); Ayers et al (2013, *Am J Prev Med*) voor mental health
- **Grade:** B
- **Contrasterend bewijs:** **Lazer et al (2014, *Science*) — Google Flu Trends-debacle**. Google Trends-validiteit is sterk afhankelijk van update-algoritme-stabiliteit, demografische sampling-bias, en nieuws-event-amplificatie. Niet alleen acknowledged maar gemitigeerd: zoekvolume-spikes binnen 3 dagen van majeure nieuwsgebeurtenissen worden uit-gefilterd (zie §13.2).
- **Operationalisering:** weighted index NL-termen ("stress", "burn-out", "slaapproblemen", "moe", "hoofdpijn", "angst", "uitgeput", "slapeloosheid"), regio België
- **Databron:** Google Trends API
- **Resolutie:** dagelijks
- **Beslissing:** **INGESLOTEN (primair, met mitigatie)**

### D5.3 Negatieve collectieve gebeurtenissen (was D5.1 in v0.1)

- **Ondersteunend kader:** SDoH social context; collectieve trauma-literatuur
- **Pathway:** mediablootstelling aan collectief trauma → vicariërende stress
- **Evidence:** Holman et al (2014, *PNAS*); Silver et al (2013); Garfin et al (2015)
- **Grade:** A
- **Contrasterend bewijs:** Pfefferbaum et al (2014) review wijst op publicatie-bias in collectieve-trauma-literatuur; effecten van mediablootstelling gemodereerd door pre-event-kwetsbaarheid
- **Operationalisering:** event-tagging met magnitude-coderingsregels (vooraf vastgelegd), 7-daags decay-window
- **Codering:** twee onafhankelijke codeurs, inter-rater reliability vooraf testen op 50 historische cases (vereiste κ ≥ 0.75)
- **Bron:** nieuwsmonitoring (VRT, De Standaard, HLN), aangevuld met Politiezone-rapporten
- **Beslissing:** **INGESLOTEN (primair, met magnitude-drempel)**
- **Notitie:** codering vereist menselijke beoordeling — vraagt zorgvuldige documentatie van rules. Het magnitude-niveau-systeem (1/3/5) is functioneel verwant aan Holmes-Rahe, met als kritisch verschil dat onze regels worden toegepast op *geobserveerde gebeurtenissen* binnen een gedocumenteerd codeerprotocol, niet op *zelf-gerapporteerde life events* zoals bij Holmes-Rahe.

### D5.4 Sociale-media-sentiment Nederlandstalig

- **Beslissing:** **UITGESLOTEN** — X-API niet vrij sinds 2023, alternatieven onvoldoende representatief (criterium 3)

### D5.5 Algemene staking / nationale onrust

- **Grade:** C
- **Beslissing:** **SECUNDAIRE SET**

### D5.6 Eenzaamheidsproxies

- **Beslissing:** **UITGESLOTEN** — vereist veldwerk

---

## 9. Domein D6 — Kalender & ritme

### D6.1 Dagen tot volgende vakantie

- **Ondersteunend kader:** CoR (anticipatie hersteltijd); recovery-literatuur (Sonnentag 2018)
- **Evidence:** Sonnentag (2018); Fritz & Sonnentag (2005)
- **Grade:** B (recovery-literatuur), C (specifiek voor "afstand tot vakantie")
- **Contrasterend bewijs:** "vakantie-effect" op stress is sterker voor afgeronde vakantie dan voor anticipatie volgens De Bloom et al (2009)
- **Beslissing:** **INGESLOTEN (primair)**

### D6.2 Weekdag-cyclus

- **Ondersteunend kader:** chronobiologie; weekly cycle research
- **Evidence:** Stone et al (2012); Areni & Burger (2008)
- **Grade:** B
- **Contrasterend bewijs:** Helliwell & Wang (2014) tonen dat weekdag-mood-effect kleiner is dan vaak geclaimd in oudere literatuur
- **Beslissing:** **INGESLOTEN (primair)**

### D6.3 Klok-verzetten (zomer-/wintertijd)

- **Ondersteunend kader:** Allostatic Load (circadiane verstoring)
- **Evidence:** Manfredini et al (2018, *J Clin Med*); Roenneberg et al (2019)
- **Grade:** A
- **Contrasterend bewijs:** Diaz Garrido et al (2022) recente review wijst op heterogene effecten per leeftijdsgroep
- **Beslissing:** **INGESLOTEN (primair)**

### D6.4 Seizoensfase (continu signaal)

- **Beslissing:** **VERPLAATST NAAR SECUNDAIRE SET** — wiskundig overlappend met I-D1-001 (daglichturen) en met seizoenscomponent van andere indicatoren. Behoud in primaire set zou seizoens-dubbeltelling veroorzaken. Beschikbaar voor sensitivity-analyse waarin expliciet getest wordt of dubbele seizoensbijdrage het signaal verandert.

### D6.5 Examenperiode-vlaggen

- **Ondersteunend kader:** JDR; academic stress literature
- **Evidence:** Pascoe et al (2020) academic stress review
- **Grade:** B
- **Beslissing:** **INGESLOTEN (primair)**

---

## 10. Geconsolideerde inclusielijst (na v0.2-herziening)

### Primaire set (composiet)

| Code | Indicator | Domein | Grade | Resolutie |
|---|---|---|---|---|
| I-D1-001 | Daglichturen | D1 | A | dagelijks |
| I-D1-002 | Hitte (Tmax >30°C, tropische nachten) | D1 | A | dagelijks |
| I-D1-003 | Kou (Tmin <-5°C) | D1 | B | dagelijks |
| I-D1-004 | Luchtkwaliteit (PM2.5, O₃, NO₂) | D1 | A | dagelijks |
| I-D2-001 | Filezwaarte | D2 | A | dagelijks |
| I-D2-004 | Brandstofprijzen | D2 | B | dagelijks |
| I-D3-001 | Consumptieprijsindex | D3 | A | maandelijks |
| I-D3-002 | Energieprijzen | D3 | B | wekelijks |
| I-D3-003 | Aangekondigde collectieve ontslagen | D3 | A | wekelijks |
| I-D3-005 | Werkloosheidscijfer | D3 | A | maandelijks |
| I-D3-006 | Hypotheekrente | D3 | B | maandelijks |
| I-D4-001 | Kalendarische deadlinepieken | D4 | B | dagelijks |
| I-D4-002 | Schoolvakantie-zonder-opvang | D4 | B | dagelijks |
| I-D5-001 | Nieuwsnegativiteits-index | D5 | B | dagelijks |
| I-D5-002 | Google Trends stress-termen | D5 | B | dagelijks |
| I-D5-003 | Negatieve collectieve gebeurtenissen | D5 | A | event |
| I-D6-001 | Dagen tot volgende vakantie | D6 | B | dagelijks |
| I-D6-002 | Weekdag-cyclus | D6 | B | dagelijks |
| I-D6-003 | Klok-verzetten | D6 | A | event |
| I-D6-005 | Examenperiode | D6 | B | dagelijks |

**Totaal primaire set: 20 indicatoren in 6 domeinen**

### Secundaire set (sensitivity-analyse)

| Code | Indicator | Domein | Grade |
|---|---|---|---|
| I-D1-004S | Luchtdruk-schommelingen | D1 | C |
| I-D1-005S | Pollenconcentratie | D1 | C |
| I-D2-003S | Aangekondigde OV-stakingen | D2 | C |
| I-D3-004S | Beurs-volatiliteit | D3 | C |
| I-D5-005S | Algemene staking / sociale onrust | D5 | C |
| I-D6-004S | Seizoensfase | D6 | (overlapping) |

**Totaal secundaire set: 6 indicatoren**

### Validatie-set (niet in composiet, voor convergente validatie)

| Code | Variabele | Domein | Functie |
|---|---|---|---|
| V-001 | Ziekteverzuim-aggregaat | D4 | uitkomst-validatie |
| V-002 | Retail-bestedingen | algemeen | gedragsproxy-validatie |
| V-003 | Mentale-gezondheidszorg-utilisatie | algemeen | uitkomst-validatie |
| V-004 | Alcohol/gokken-omzet | algemeen | gedragsproxy-validatie |

*Notitie: deze publieke datasets (RIZIV-aggregaten, STATBEL retail-index, Belastingdienst-omzetdata) worden gebruikt als publieke data — identiek aan andere publieke bronnen. Gebruik is geen institutionele samenwerking; data is openbaar toegankelijk in geanonimiseerde aggregaatvorm.*

---

## 11. Exclusion log

| Indicator | Reden uitsluiting |
|---|---|
| Lawaaiblootstelling | Geen wekelijkse publieke data op populatieniveau (criterium 4) |
| Aangekondigde grote wegenwerken | Grade D — onvoldoende evidence (criterium 2) |
| Aangekondigde reorganisaties | Overlap met I-D3-003 — uitgesloten om dubbeltelling te vermijden |
| Ziekteverzuim als input | Uitkomst-variabele, geen stressor — gebruikt voor validatie |
| Eenzaamheidsproxies | Vereist veldwerk — geen publieke hoogfrequente bron (criterium 3) |
| Sociale-media-sentiment NL | X-API niet vrij sinds 2023; alternatieven onvoldoende representatief (criterium 3) |
| Schoolresultaten / rapporten | Geen wekelijkse publieke data (criterium 4) |
| Familiespanningen rond feestdagen | Niet meetbaar uit publieke data; behoort tot narratieve laag |
| Verkeersongevallen | Confounder voor I-D2-001 — uit te werken in laag 4 |

---

## 12. Counter-evidence-discipline

Per indicator in dit document is een explicit "contrasterend bewijs"-veld opgenomen. Doel: voorkomen van one-sided lit-review. Beperking: wij hebben *niet systematisch* gezocht naar tegenbewijs voor elke indicator; we hebben binnen redelijke literatuur-search gemeld wat we tegenkwamen. Dit is een eerlijke beperking, niet een volwaardige Cochrane-bias-assessment.

In jaarlijkse onderhoudscyclus (zie 08_Onderhoud-Protocol.md) wordt counter-evidence systematischer doorgenomen.

---

## 13. Bekende lacunes en methodologische spanningen

### 13.1 Onevenwicht tussen domeinen
Met de v0.2-consolidatie hebben we 6 domeinen, met 2-5 indicatoren elk. Beter dan v0.1 (D5 had 1), maar nog steeds heterogeen. In laag 6 (weging) blijft balance-correctie nodig.

### 13.2 Mediacyclus-decorrelatie (nieuw protocol)
I-D3-003 (ontslagen), I-D5-001 (nieuwsnegativiteit), I-D5-002 (Google Trends) en I-D5-003 (collectieve gebeurtenissen) zijn allen deels door media-cyclus gedreven. Risico op zelfversterkende feedback in het composiet.

**Decorrelatie-protocol (uit te voeren in laag 4):**
- Voor I-D5-002 (Google Trends): zoekvolume-spikes binnen 3 dagen van majeure nieuwsgebeurtenissen (uit I-D5-003) worden geïsoleerd via differentiële tijdreeks. Het "newsless residue" wordt in composiet gebruikt; de "newsful spike" beschikbaar als sensitivity.
- Voor I-D5-001 (nieuwsnegativiteit): cross-correlatie met I-D5-003 wordt continu gemonitord. Indien correlatie > 0.7 voor sustained periode: domein-gewicht voor D5 wordt automatisch gehalveerd in betreffende periode (auto-decorrelatie).
- Voor sensitivity-rapportage: composiet zonder D5 wordt parallel berekend en gepubliceerd als "non-media baseline".

### 13.3 Tijdsresolutie-heterogeniteit
Indicatoren variëren van event-based tot dagelijks tot maandelijks. Voor wekelijks composiet moet laag 4 een tijdsharmonisatie-strategie definiëren (forward-fill, interpolatie, of differentiële weging).

### 13.4 Collineariteit binnen domeinen
- I-D1-001 (daglichturen) en I-D6-004S (seizoensfase, nu secundair): grotendeels opgelost door I-D6-004S te verplaatsen naar secundaire set
- I-D1-002 (hitte) × I-D1-004 (luchtkwaliteit, ozon-component): expected matig, sensitivity-analyse vereist
- I-D3-001 (CPI) × I-D3-006 (hypotheekrente): verschillende lag-structuren, te verifiëren in laag 4

### 13.5 Cultuur-specifieke indicatoren ontbreken
"Belgische gelatenheid", bouwverlof-fenomeen, file-cultuur — culturele specificiteit valt voor het grootste deel buiten meetbare indicatoren. Eerlijke beperking.

### 13.6 Codering I-D5-003 functioneel verwant aan Holmes-Rahe
Het magnitude-niveau-systeem voor collectieve gebeurtenissen lijkt op Holmes-Rahe maar verschilt cruciaal: wij coderen *publiek observeerbare* gebeurtenissen volgens vooraf vastgelegde regels (niet zelf-gerapporteerde life events met arbitraire gewichten). Dit blijft echter een interpretatieve indicator die zorgvuldige inter-rater-protocol vereist.

---

## 14. Volgende stappen (laag 4: operationalisering)

1. **Per indicator:** exacte formule, eenheid, missing-data-strategie, ruis-karakteristiek
2. **Tijdsharmonisatie:** hoe maandelijkse indicatoren te integreren in wekelijks signaal
3. **Collineariteit-resolutie:** VIF-analyse en eventuele indicator-consolidatie
4. **Mediacyclus-decorrelatie-protocol:** technische implementatie
5. **Datapipeline-specificatie:** target architecture vs minimum viable pipeline
6. **Robuustheidstest:** wat gebeurt bij missing data van één of meerdere bronnen

---

## Bronnen

Ayers, J. W., Althouse, B. M., & Dredze, M. (2013). Could behavioral medicine lead the web data revolution? *American Journal of Preventive Medicine*, 47(5), 678-680.

Bakker, A. B., & Demerouti, E. (2007). The Job Demands-Resources model: State of the art. *Journal of Managerial Psychology*, 22(3), 309-328.

Bakker, A. B., & Demerouti, E. (2017). Job demands-resources theory: Taking stock and looking forward. *Journal of Occupational Health Psychology*, 22(3), 273-285.

Bianchi, S. M., Sayer, L. C., Milkie, M. A., & Robinson, J. P. (2012). Housework: Who did, does or will do it, and how much does it matter? *Social Forces*, 91(1), 55-63.

Boukes, M., Boomgaarden, H. G., Moorman, M., & de Vreese, C. H. (2015). News with an attitude. *Mass Communication and Society*, 18(3), 354-378.

Boydstun, A. E., Highton, B., & Linn, S. (2014). Assessing the relationship between economic conditions and news coverage. *Political Communication*, 31(4), 607-626.

Braithwaite, I., Zhang, S., Kirkbride, J. B., et al. (2019). Air pollution exposure and associations with depression, anxiety, bipolar, psychosis and suicide risk: A systematic review and meta-analysis. *Environmental Health Perspectives*, 127(12), 126002.

Brand, J. E. (2015). The far-reaching impact of job loss and unemployment. *Annual Review of Sociology*, 41, 359-375.

Brüggen, E. C., Hogreve, J., Holmlund, M., Kabadayi, S., & Löfgren, M. (2017). Financial well-being. *Journal of Business Research*, 79, 228-237.

Burgard, S. A., Brand, J. E., & House, J. S. (2009). Perceived job insecurity and worker health in the United States. *Social Science & Medicine*, 69(5), 777-785.

Burke, M., Hsiang, S. M., & Miguel, E. (2018). Global non-linear effect of temperature on economic production. *Nature*, 527, 235-239.

Chatterjee, K., Chng, S., Clark, B., et al. (2020). Commuting and wellbeing: A critical overview. *Transport Reviews*, 40(1), 5-34.

Cheng, Y. H. (2010). Exploring passenger anxiety associated with train travel. *Transportation*, 37(6), 875-896.

Crouter, A. C., Bumpus, M. F., Head, M. R., & McHale, S. M. (2001). Implications of overwork and overload for the quality of men's family relationships. *Journal of Marriage and Family*, 63(2), 404-416.

D'Amato, G., Cecchi, L., Bonini, S., et al. (2007). Allergenic pollen and pollen allergy in Europe. *Allergy*, 62(9), 976-990.

De Bloom, J., Geurts, S. A. E., Sonnentag, S., et al. (2009). Effects of vacation from work on health and well-being. *Work & Stress*, 23(4), 359-378.

De Witte, H., Pienaar, J., & De Cuyper, N. (2016). Review of 30 years of longitudinal studies on the association between job insecurity and health and well-being. *Australian Psychologist*, 51(1), 18-31.

Diaz Garrido, F., Knapen, S., et al. (2022). Daylight saving time and health: a review of recent literature. *Sleep Medicine Reviews*, 64, 101633.

Fritz, C., & Sonnentag, S. (2005). Recovery, health, and job performance. *Journal of Occupational Health Psychology*, 10(3), 187-199.

Garfin, D. R., Holman, E. A., & Silver, R. C. (2015). Cumulative exposure to prior collective trauma. *Psychological Science*, 26(6), 675-683.

Hahad, O., Prochaska, J. H., Daiber, A., & Münzel, T. (2019). Environmental noise-induced effects on stress hormones. *Oxidative Medicine and Cellular Longevity*, 2019, 4623109.

Hajat, S., O'Connor, M., & Kosatsky, T. (2010). Health effects of hot weather. *The Lancet*, 375(9717), 856-863.

Helliwell, J. F., & Wang, S. (2014). Weekends and subjective well-being. *Social Indicators Research*, 116(2), 389-407.

Hoffmann, J., Schirra, T., Lo, H., et al. (2011). The influence of weather on migraine. *Annals of Clinical and Translational Neurology*, 2(1), 22-28.

Hoffmann, J., et al. (2015). Replication study on weather and headache. *Cephalalgia*, 35(8), 658-666.

Holman, E. A., Garfin, D. R., & Silver, R. C. (2014). Media's role in broadcasting acute stress following the Boston Marathon bombings. *PNAS*, 111(1), 93-98.

Kahneman, D., & Tversky, A. (1979). Prospect theory. *Econometrica*, 47(2), 263-292.

Kleemans, M., & Hendriks Vettehen, P. G. J. (2009). Sensationalism in television news. *Communications*, 34(2), 109-131.

Künn-Nelen, A. (2016). Does commuting affect health? *Health Economics*, 25(8), 984-1004.

Lam, R. W., & Levitt, A. J. (Eds.). (1999). *Canadian consensus guidelines for the treatment of seasonal affective disorder*.

Lazer, D., Kennedy, R., King, G., & Vespignani, A. (2014). The parable of Google Flu. *Science*, 343(6176), 1203-1205.

Liddell, C., & Morris, C. (2010). Fuel poverty and human health. *Energy Policy*, 38(6), 2987-2997.

Liu, J., Varghese, B. M., Hansen, A., et al. (2021). Is there an association between hot weather and poor mental health outcomes? *Environment International*, 153, 106533.

Lorenz, O. (2018). Does commuting matter to subjective well-being? *Journal of Transport Geography*, 66, 180-199.

Manfredini, R., Fabbian, F., Cappadona, R., et al. (2018). Daylight saving time and acute myocardial infarction. *Journal of Clinical Medicine*, 8(3), 404.

Mersch, P. P., Middendorp, H. M., Bouhuys, A. L., et al. (1999). Seasonal affective disorder and latitude. *Journal of Affective Disorders*, 53(1), 35-48.

Newbury, J. B., Arseneault, L., Beevers, S., et al. (2019). Association of air pollution exposure with psychotic experiences during adolescence. *JAMA Psychiatry*, 76(6), 614-623.

Novaco, R. W., Stokols, D., & Milanesi, L. (1990). Objective and subjective dimensions of travel impedance. *American Journal of Community Psychology*, 18(2), 231-257.

Pascoe, M. C., Hetrick, S. E., & Parker, A. G. (2020). The impact of stress on students. *International Journal of Adolescence and Youth*, 25(1), 104-112.

Pfefferbaum, B., Newman, E., Nelson, S. D., et al. (2014). Disaster media coverage and psychological outcomes. *Current Psychiatry Reports*, 16(9), 464.

Roenneberg, T., Wirz-Justice, A., Skene, D. J., et al. (2019). Why should we abolish daylight saving time? *Journal of Biological Rhythms*, 34(3), 227-230.

Rosenthal, N. E., Sack, D. A., Gillin, J. C., et al. (1984). Seasonal affective disorder. *Archives of General Psychiatry*, 41(1), 72-80.

Silver, R. C., Holman, E. A., Andersen, J. P., et al. (2013). Mental- and physical-health effects of acute exposure to media images. *Psychological Science*, 24(9), 1623-1634.

Sonnentag, S. (2018). The recovery paradox. *Research in Organizational Behavior*, 38, 169-185.

Soroka, S., Fournier, P., & Nir, L. (2019). Cross-national evidence of a negativity bias. *PNAS*, 116(38), 18888-18892.

Stephens-Davidowitz, S. (2017). *Everybody lies*. Dey Street Books.

Stone, A. A., Schneider, S., & Harter, J. K. (2012). Day-of-week mood patterns. *The Journal of Positive Psychology*, 7(4), 306-314.

Stutzer, A., & Frey, B. S. (2008). Stress that doesn't pay: The commuting paradox. *Scandinavian Journal of Economics*, 110(2), 339-366.

Thompson, R., Hornigold, R., Page, L., & Waite, T. (2018). Associations between high ambient temperatures and heat waves with mental health outcomes. *Science of the Total Environment*, 626, 1213-1224.

Thomson, H., Snell, C., & Bouzarovski, S. (2017). Health, well-being and energy poverty in Europe. *International Journal of Environmental Research and Public Health*, 14(6), 584.

WHO (2018). *Environmental Noise Guidelines for the European Region*.

WHO (2021). *WHO global air quality guidelines*.

---

### 03_Laag-4_Operationalisering

*Bestand: `03_Laag-4_Operationalisering.md`*

# Stressor-Blootstellings-Index (SBI)
## Laag 4: Operationalisering en datapipeline

**Status:** v0.2 — werkdocument
**Document:** laag 4 van de methodologie
**Bouwt op:** 01_Anker-Paper.md, 02_Laag-3_Indicator-Selectie.md
**Auteur:** BRAINWOLVES
**Datum:** mei 2026

---

## 0. Samenvatting

Dit document operationaliseert de in laag 3 geselecteerde 20 primaire indicatoren in 6 domeinen. Per indicator wordt de exacte formule, eenheid, missing-data-strategie, ruis-karakteristiek en databron-toegang gespecificeerd. Aanvullend worden vijf methodologische protocollen vastgelegd: tijdsharmonisatie tussen indicatoren van verschillende frequentie, collineariteit-resolutie via VIF, mediacyclus-decorrelatie binnen D5, datapipeline-architectuur (target state én minimum viable pipeline), en robuustheidstest bij dataverlies.

---

## 1. Algemene operationalisering-conventies

### 1.1 Tijdsreferentie

Alle indicatoren in CET/CEST, datum-stempel d. Canonieke meetfrequentie: wekelijks, dagelijkse onderliggende data waar beschikbaar.

### 1.2 Geografische scope

België als werkmarkt. Lokale data gewogen naar bevolkingsdichtheid per provincie (NUTS-2). Voor weers- en astronomische indicatoren wordt 50.85°N, 4.35°E (Brussel) als referentie gebruikt — een bekende keuze die in laag 8 in sensitivity-analyse wordt getest (alternatief: bevolkingsgewogen middelpunt Vlaanderen).

### 1.3 Missing-data-strategie

Drie hiërarchische regels:

1. *Last-observation-carried-forward* binnen 3 dagen voor dagelijkse indicatoren
2. *Linear interpolation* binnen 14 dagen voor wekelijkse/maandelijkse indicatoren
3. *Explicit missing flag* bij grotere gaten — domeinweging wordt herberekend exclusief de ontbrekende indicator

Elke imputatie wordt gelogd.

### 1.4 Ruis-conventies

Per continue indicator wordt ruis-karakteristiek geschat. Indicatoren met verwachte signal-to-noise-ratio < 2 worden uitgesloten — tenzij deterministisch.

### 1.5 Eenheid-conventie

Alle indicatoren worden in laag 5 omgezet naar Z-scores. In dit document staan de ruwe eenheden.

---

## 2. Indicator-specificaties

### 2.1 Domein D1 — Omgeving & klimaat

#### I-D1-001 Daglichturen

- **Formule:** L(d) = uren tussen astronomische zonsopgang en zonsondergang op datum d
- **Eenheid:** uren (decimaal)
- **Missing:** geen — deterministisch
- **Bron:** astronomische berekening (NOAA Solar Calculator-algoritme)
- **Resolutie:** dagelijks
- **Historiek:** onbeperkt

#### I-D1-002 Hitte

- **Formules:**
  - T_max(d), T_min(d) — dagelijkse extremen (°C)
  - Trigger H1(d) = 1 indien T_max > 30°C
  - Trigger H2(d) = 1 indien T_min > 20°C (tropische nacht)
  - Continu: Heat_excess(d) = max(0, T_max - 30)
- **Eenheid:** °C; binair voor triggers
- **Missing:** nearest-neighbor station (max 50 km)
- **Bron:** KMI/RMI

#### I-D1-003 Kou

- **Formules:**
  - C1(d) = 1 indien T_min < -5°C
  - Cold_excess(d) = max(0, -5 - T_min)
- **Bron:** KMI/RMI

#### I-D1-004 Luchtkwaliteit

- **Formules:**
  - PM25(d), O3_max(d), NO2(d)
  - Composite_AQ(d) = max(PM25/15, O3_max/100, NO2/25) — ratio tot WHO 2021-grenswaarden
- **Eenheid:** μg/m³ ruw; ratio voor composite
- **Missing:** mediaan over 3 dichtstbijzijnde stations
- **Bron:** IRCEL-CELINE

### 2.2 Domein D2 — Mobiliteit & ruimte

#### I-D2-001 Filezwaarte

- **Formule:**
  - F_morn(d) = totaal file-km × file-minuten 06:30-09:30
  - F_eve(d) = totaal file-km × file-minuten 16:00-19:00
  - F_total(d) = F_morn + F_eve
- **Eenheid:** km·min
- **Bron:** Vlaams Verkeerscentrum
- **Confounder-flag:** weersextremen, ongevallen → afzonderlijk loggen

#### I-D2-004 Brandstofprijzen

- **Formule:**
  - P_euro95(d), P_diesel(d) — officiële maximumprijzen
  - Fuel_combined(d) = 7-daags voortschrijdend gemiddelde
- **Eenheid:** €/l
- **Bron:** FOD Economie

### 2.3 Domein D3 — Economische conditie

#### I-D3-001 Consumptieprijsindex (CPI)

- **Formule:** Infl_yoy(m) = (CPI(m) - CPI(m-12)) / CPI(m-12) × 100
- **Wekelijkse SBI:** forward-fill van Infl_yoy(m) over weken in maand m
- **Bron:** STATBEL

#### I-D3-002 Energieprijzen

- **Formules:**
  - Gas_wk(w), Elec_wk(w) — wekelijkse spotprijzen
  - Energy_combined(w) = 0.5 × (Gas_norm + Elec_norm)
- **Bron:** Belpex (Epex Spot), gas hub

#### I-D3-003 Aangekondigde collectieve ontslagen

- **Formule:**
  - CD_workers(w) = werknemers in collectieve-ontslagprocedures, week w
  - CD_combined(w) = log(1 + CD_workers(w))
- **Bron:** FOD WASO

#### I-D3-005 Werkloosheidscijfer

- **Formule:** U(m) = werkzoekenden % beroepsbevolking, seizoensgecorrigeerd
- **Bron:** STATBEL / Steunpunt Werk

#### I-D3-006 Hypotheekrente

- **Formule:** I_mort(m) = NBB-gemiddelde rente nieuwe hypotheken
- **Bron:** Nationale Bank van België

### 2.4 Domein D4 — Werk & belasting

#### I-D4-001 Kalendarische deadlinepieken

- **Formule:** D_dl(d) = +1 in belastingaangifte-weken; +1 in kwartaaleinde-week; +2 in jaareinde-week
- **Eenheid:** integer 0-3
- **Bron:** kalender FOD Financiën

#### I-D4-002 Schoolvakantie-zonder-opvang

- **Formule:**
  - SH(d) = 1 indien schoolvakantieperiode én niet-zondag
  - SH_weighted(d) = SH(d) × (1 + duration_remaining/total_duration)
- **Bron:** Vlaamse onderwijskalender

### 2.5 Domein D5 — Media & collectieve gebeurtenissen

#### I-D5-001 Nieuwsnegativiteits-index

- **Formule:**
  - Tone(d) = gemiddelde GDELT-tonescore voor NL-talige Belgische bronnen
  - Negativity(d) = -Tone(d)
  - Weekly: 7-daags gemiddelde
- **Eenheid:** GDELT tone units (typisch -20 tot +20)
- **Bron:** GDELT Project v2 (BigQuery publieke dataset)
- **Resolutie:** dagelijks

#### I-D5-002 Google Trends — stress-termen

- **Formule:**
  - GT_set = {stress, burn-out, slaapproblemen, moe, hoofdpijn, angst, uitgeput, slapeloosheid}
  - GT_raw(d) = som van Google Trends Interest voor termen in GT_set, regio BE, NL-taal
  - GT_score(d) = GT_raw(d) - GT_news_correction(d) (zie §4.4 decorrelatie)
- **Eenheid:** relatieve index 0-100
- **Bron:** Google Trends API

#### I-D5-003 Negatieve collectieve gebeurtenissen

- **Formule:** event-tagging met magnitude-coderingsregels:
  - Niveau 1 (gewicht 1): regionale ramp, ≥5 doden óf >100 gewonden óf >€10M materiële schade
  - Niveau 2 (gewicht 3): nationale ramp, ≥10 doden óf nationale rouw afgekondigd
  - Niveau 3 (gewicht 5): terreuraanval, oorlogsverklaring, massa-evacuatie
  - Per gebeurtenis: 7-daags exponentieel decay-window
- **Eenheid:** continu 0-15
- **Codering:** twee onafhankelijke codeurs, inter-rater κ ≥ 0.75 op 50 historische test-cases vereist vóór livegang. Indien κ niet haalbaar: vereenvoudig naar binair (gebeurtenis ja/nee) met magnitude als sensitivity.
- **Bron:** nieuwsmonitoring (VRT, De Standaard, HLN, RTBF), aangevuld met Politiezone-rapporten

### 2.6 Domein D6 — Kalender & ritme

#### I-D6-001 Dagen tot volgende vakantie

- **Formule:** DV(d) = min(dagen tot volgende officiële feestdag, dagen tot schoolvakantie)
- **Eenheid:** dagen
- **Notitie:** in laag 5 wordt het signaal omgekeerd zodat meer dagen = hogere stressor-blootstelling

#### I-D6-002 Weekdag-cyclus

- **Formule:** zes dummies (zondag = referentie)
- **Eenheid:** binair per dummy

#### I-D6-003 Klok-verzetten

- **Formule:** DST_effect(d) = exp(-(d - d_DST) / 3) voor 0 ≤ (d - d_DST) ≤ 7
- **Eenheid:** continu 0-1

#### I-D6-005 Examenperiode

- **Formule:** binair voor:
  - 1e examenperiode hoger onderwijs (5-30 januari)
  - 2e examenperiode hoger onderwijs (laatste 2 weken mei + 1e 2 weken juni)
  - CSE-periode secundair (typisch juni)

---

## 3. Tijdsharmonisatie

### 3.1 Heterogeniteit-overzicht

- *Dagelijks:* alle D1-, D2-, D4-, D5-001, D5-002, D6-indicatoren
- *Wekelijks:* I-D3-002, I-D3-003
- *Maandelijks:* I-D3-001, I-D3-005, I-D3-006
- *Event-based:* I-D5-003, I-D6-003

### 3.2 Harmonisatie-protocol

**Maandelijkse indicatoren binnen wekelijks composiet:**
- Forward-fill van laatste publicatie tot volgende publicatie
- Maandelijkse indicatoren in laag 5 afzonderlijk genormaliseerd om transitie-effecten te vermijden

**Event-indicatoren:**
- Behouden als continue waarde met decay-window
- Niet samengedrukt naar wekelijks-binair

**Wekelijkse composiet-cel:**
- Berekend op zondagavond, voor week eindigend zaterdag

---

## 4. Collineariteit en decorrelatie

### 4.1 VIF-protocol

Variance Inflation Factor berekend na 24 maanden dataverzameling voor paren binnen elk domein én tussen domeinen.

**Beslisregel:**
- VIF < 5: indicatoren behouden
- 5 ≤ VIF < 10: een van beide markeren als secundaire set
- VIF ≥ 10: hoogste-evidence-grade indicator behouden

### 4.2 Vooraf bekende collineariteit-risico's

| Paar | Verwachte VIF | Voorgenomen oplossing |
|---|---|---|
| I-D1-002 (hitte) × I-D1-004 (luchtkwaliteit) | Matig (5-10) | Behouden, sensitivity-analyse |
| I-D3-001 (CPI) × I-D3-006 (hypotheekrente) | Matig | Behouden — verschillende lag-structuren |
| I-D5-001 (nieuwsnegativiteit) × I-D5-003 (collectieve gebeurtenissen) | Hoog (>5) | Zie §4.4 decorrelatie-protocol |
| I-D5-002 (Google Trends) × I-D5-001 (nieuwsnegativiteit) | Matig | Zie §4.4 |

Notitie: in v0.1 was er een I-D7-004 (seizoensfase) × I-D1-001 (daglicht) collineariteits-risico. Dit is opgelost door I-D6-004 (was I-D7-004) naar secundaire set te verplaatsen.

### 4.3 Documentatie-vereiste

Elke collineariteits-beslissing gelogd met VIF-waarde, beslissing en datum.

### 4.4 Mediacyclus-decorrelatie-protocol (nieuw in v0.2)

**Probleem:** I-D5-001, I-D5-002 en I-D5-003 zijn alle gedeeltelijk door media-cyclus gedreven. Risico op zelfversterkende loop.

**Protocol:**

*Stap 1 — Event-spike-correctie voor Google Trends.*
- Wanneer een I-D5-003 niveau ≥2 gebeurtenis plaatsvindt op dag d_event, wordt I-D5-002 voor de periode [d_event, d_event + 7] aangepast:
- GT_news_correction(d) = GT_raw(d) - GT_baseline(d)
- waarbij GT_baseline(d) = gemiddelde van GT_raw over [d-14, d-7] (twee weken vóór event)
- Het residu (GT_raw - news_correction) wordt als signaal gebruikt; de spike wordt apart geregistreerd

*Stap 2 — Continue cross-correlatie-monitor.*
- 7-daagse cross-correlatie tussen I-D5-001 en I-D5-003 wordt continu berekend
- Indien correlatie > 0.7 over een gehele week: D5-domein-gewicht automatisch gehalveerd in die week
- Origineel én gehalveerd composiet beide gerapporteerd voor transparantie

*Stap 3 — "Non-media baseline" als sensitivity-rapportage.*
- Een composiet zonder D5 wordt parallel berekend
- Wekelijks gerapporteerd: het verschil ("media-bijdrage") in percentielpunten

Dit protocol maakt de mediacyclus-circulariteit zichtbaar en mitigeerbaar, niet onzichtbaar.

---

## 5. Datapipeline-architectuur

### 5.1 Eerlijke disclaimer: target state vs current state

De pipeline-beschrijving hieronder is *target state*. De *current state* is een minimum viable pipeline (zie §5.6). Bij elke versie-uitgave wordt expliciet vermeld in welk implementatie-stadium het systeem zich bevindt.

### 5.2 Bronnen-stack (target state)

| Bron | Indicatoren | Toegangsmodus | Frequentie |
|---|---|---|---|
| KMI/RMI Open Data | I-D1-001..003 | API | dagelijks |
| IRCEL-CELINE | I-D1-004 | API | uurlijks |
| Vlaams Verkeerscentrum | I-D2-001 | scraping + API | dagelijks |
| FOD Economie | I-D2-004 | scraping | dagelijks |
| STATBEL | I-D3-001, I-D3-005 | API | maandelijks |
| Belpex / Epex | I-D3-002 | API | dagelijks |
| FOD WASO | I-D3-003 | scraping | wekelijks |
| NBB | I-D3-006 | API | maandelijks |
| Vlaamse onderwijskalender | I-D4-002, I-D6-005 | statisch | jaarlijks |
| Nieuwsmonitoring | I-D5-003 | menselijke codering | event |
| GDELT | I-D5-001 | BigQuery | dagelijks |
| Google Trends | I-D5-002 | pytrends API | dagelijks |
| Kalender-deterministisch | I-D4-001, I-D6-001..003 | lokaal | dagelijks |

### 5.3 Pipeline-stappen (target state)

```
[1] EXTRACT — scheduled fetch met retry-logica
[2] VALIDATE — schema- en range-check
[3] TRANSFORM — formules uit §2 toepassen
[4] HARMONIZE — tijdsharmonisatie uit §3
[5] DECORRELATE — protocol §4.4
[6] AUDIT — sanity checks, anomaly flags
```

### 5.4 Opslag-formaat (target state)

- Ruwe data: source-native
- Geharmoniseerde data: Apache Parquet
- Metadata: JSON met versie, bron, fetch-tijd

### 5.5 Versionering

- Elke transformatieregel: semver
- Bij wijziging: alle historische data herberekend
- Oude versies behouden voor reproduceerbaarheid

### 5.6 Minimum Viable Pipeline (current state vereiste)

Voor de eerste 6 maanden na livegang volstaat een minimale pipeline:
- Python-scripts (lokaal of single VM)
- Flat-file opslag (CSV + JSON)
- Handmatige trigger of dagelijks cronjob
- Versie-control via Git
- Output: één JSON-file per dag, publiek toegankelijk

Doel: snelheid van iteratie boven schaalbaarheid. Target-state-architectuur kan stapsgewijs worden opgebouwd zodra het instrument haar waarde heeft bewezen.

---

## 6. Robuustheidstest-protocol

Vóór composiet operationeel kan uitzenden:

### 6.1 Test 1 — Indicator-dropout

Op willekeurige 24-maands-historische subset:
- 1 indicator verwijderen → composiet herberekenen → max afwijking < 15%
- 3 indicatoren verwijderen → < 30%
- 5 indicatoren verwijderen → < 50%

### 6.2 Test 2 — Bron-dropout

Eén bron uitschakelen → composiet werkt via missing-data-protocol. Max afwijking < 20%.

### 6.3 Test 3 — Lag-tolerantie

Vertraging in publicatie van één bron tot 7 dagen → composiet blijft consistent berekenbaar via forward-fill.

---

## 7. Volgende stap (laag 5: normalisatie)

1. Z-scoring per indicator (mediaan + MAD)
2. Dubbele baseline-aanpak (24m voortschrijdend + 2010-2019 vast)
3. STL-decompositie per indicator
4. Winsorization
5. Inverse-codering waar nodig

---

## Annex A — Indicator-overzichtstabel (v0.2)

| Code | Indicator | Eenheid | Resolutie | Bron | Type |
|---|---|---|---|---|---|
| I-D1-001 | Daglichturen | uren | dagelijks | astronomisch | continu |
| I-D1-002 | Hitte | °C / binair | dagelijks | KMI | continu+binair |
| I-D1-003 | Kou | °C / binair | dagelijks | KMI | continu+binair |
| I-D1-004 | Luchtkwaliteit | ratio | dagelijks | IRCEL-CELINE | continu |
| I-D2-001 | Filezwaarte | km·min | dagelijks | Verkeerscentrum | continu |
| I-D2-004 | Brandstofprijs | €/l | dagelijks | FOD Economie | continu |
| I-D3-001 | CPI inflatie | % yoy | maandelijks | STATBEL | continu |
| I-D3-002 | Energieprijs | €/MWh | wekelijks | Belpex | continu |
| I-D3-003 | Aangekondigde ontslagen | log(N) | wekelijks | FOD WASO | continu |
| I-D3-005 | Werkloosheid | % | maandelijks | STATBEL | continu |
| I-D3-006 | Hypotheekrente | % | maandelijks | NBB | continu |
| I-D4-001 | Deadlinekalender | 0-3 | dagelijks | deterministisch | ordinaal |
| I-D4-002 | Schoolvakantie | 0-2 | dagelijks | onderwijskalender | continu |
| I-D5-001 | Nieuwsnegativiteit | tone units | dagelijks | GDELT | continu |
| I-D5-002 | Google Trends stress | 0-100 | dagelijks | Google Trends | continu |
| I-D5-003 | Collectieve gebeurtenissen | 0-15 | event | menselijke codering | continu |
| I-D6-001 | Dagen tot vakantie | dagen | dagelijks | deterministisch | continu |
| I-D6-002 | Weekdag | 6× binair | dagelijks | deterministisch | binair |
| I-D6-003 | Klok-verzetten | 0-1 | event | deterministisch | continu |
| I-D6-005 | Examenperiode | binair | dagelijks | academisch kalender | binair |

---

### 04_Laag-5_Normalisatie

*Bestand: `04_Laag-5_Normalisatie.md`*

# Stressor-Blootstellings-Index (SBI)
## Laag 5: Normalisatie en seizoenscorrectie

**Status:** v0.2 — werkdocument
**Document:** laag 5 van de methodologie
**Bouwt op:** laag 1-4
**Auteur:** BRAINWOLVES
**Datum:** mei 2026

---

## 0. Samenvatting

Dit document beschrijft hoe ruwe indicator-waarden uit laag 4 worden omgezet naar vergelijkbare, dimensieloze Z-scores die het composiet kunnen vormen. Drie kernelementen: (1) dubbele baseline-aanpak — elke indicator wordt vergeleken met zowel een 24-maands voortschrijdend mediaangemiddelde als een vaste referentieperiode 2010-2019, (2) STL-decompositie voor indicatoren waar seizoenseffect een confounder is, en (3) winsorization tegen extreme outliers.

---

## 1. Doelstellingen

Normalisatie lost drie problemen op: schaal-heterogeniteit, baseline-drift-blindheid, en seizoenseffect-confounding.

---

## 2. Dubbele baseline

### 2.1 Korte baseline (voortschrijdend)

- B_short(i, t) = mediaan van indicator i over de 24 maanden voorafgaand aan t
- σ_short(i, t) = MAD over diezelfde 24 maanden, geschaald naar SD-equivalent (×1.4826)
- Z_short(i, t) = (X(i, t) - B_short(i, t)) / σ_short(i, t)

Doel: detecteert recente afwijkingen ten opzichte van de directe historische context.

**Waarom mediaan + MAD i.p.v. gemiddelde + SD:** robust statistics — een hittegolf of energiecrisis in de baseline-periode trekt het gemiddelde scheef. Mediaan en MAD blijven stabiel.

### 2.2 Vaste baseline

- B_fixed(i) = mediaan over 1 januari 2010 — 31 december 2019
- σ_fixed(i) = MAD over diezelfde periode
- Z_fixed(i, t) = (X(i, t) - B_fixed(i)) / σ_fixed(i)

Doel: detecteert structurele verschuiving ten opzichte van pre-pandemisch, pre-energiecrisis decennium.

Alternatieve referentieperiodes (bv. 2015-2019) worden in laag 8 als sensitivity meegerekend.

### 2.3 Welke baseline waar gebruikt wordt

| Output | Baseline | Doel |
|---|---|---|
| Wekelijks signaal (productie) | Korte (24m) | Acute detectie |
| Structurele-drift-rapportage | Vaste (2010-2019) | Langetermijn-context |
| Persrapportage | Beide naast elkaar | Rijker verhaal |

### 2.4 Bootstrapping

Voor de eerste 24 maanden na opstart: vaste baseline als surrogaat, met expliciete vlag in output.

### 2.5 Belangrijke interpretatie-discipline

MAD-gebaseerde Z-scores zijn *niet* equivalent aan klassieke Z-scores. Een Z_short van 2.0 in onze methodologie staat ongeveer overeen met een klassieke Z van 1.5 voor symmetrische verdelingen. In communicatie spreken we daarom uitsluitend over *percentielen* (uit laag 7), niet over "σ-overschrijdingen", om verwarring met klassieke statistische standaarden te vermijden.

---

## 3. Seizoensdecompositie

### 3.1 STL als techniek

STL (Cleveland et al, 1990) ontbindt een tijdreeks in: X(t) = T(t) + S(t) + R(t), waarbij T = trend, S = seizoen, R = residu. Bij indicatoren waar seizoen een confounder is, gebruiken we het residu R voor Z-scoring.

### 3.2 Beslisregel per indicator (v0.2-update)

| Indicator | STL? | Reden |
|---|---|---|
| I-D1-001 Daglichturen | NEE | Seizoenspatroon ís het signaal |
| I-D1-002 Hitte | DEELS | Triggers behouden seizoenspatroon; continue T_max krijgt STL |
| I-D1-003 Kou | DEELS | Idem |
| I-D1-004 Luchtkwaliteit | JA | Seizoen is confounder (winter-NO₂, zomer-O₃) |
| I-D2-001 Filezwaarte | JA | Vakantieperiode-effect is confounder |
| I-D2-004 Brandstofprijs | NEE | Geen sterk seizoenspatroon |
| I-D3-001 CPI | JA | Seizoensgecorrigeerde reeks via STATBEL |
| I-D3-002 Energie | JA | Sterk seizoenseffect |
| I-D3-003 Ontslagen | JA | Eindejaarsperiode-cluster is confounder |
| I-D3-005 Werkloosheid | JA | Officieel seizoensgecorrigeerde reeks |
| I-D3-006 Hypotheekrente | NEE | Geen seizoenspatroon |
| I-D4-001 Deadlinekalender | NEE | Deterministisch |
| I-D4-002 Schoolvakantie | NEE | Deterministisch |
| I-D5-001 Nieuwsnegativiteit | JA | "Komkommertijd"-effect zomer |
| I-D5-002 Google Trends | JA | Seizoenspatroon in zoekgedrag |
| I-D5-003 Collectieve gebeurtenissen | NEE | Event-driven |
| I-D6-001..003, 005 | NEE | Kalender-deterministisch |

### 3.3 STL-parameters

- Seizoens-periode: 365 dagen voor dagelijkse reeksen; 52 voor wekelijkse; 12 voor maandelijkse
- Robust mode: aan
- Trend-window: 1.5 × seizoensperiode

### 3.4 Stabiliteitsvoorwaarde

STL betrouwbaar bij ≥ 3 seizoenscycli. Voor indicatoren met < 3 jaar betrouwbare historiek: geen STL toegepast, expliciet gelogd.

### 3.5 Bescherming tegen seizoens-dubbeltelling

In v0.1 zat seizoenseffect dubbel: één keer expliciet (via I-D7-004 seizoensfase) en één keer impliciet (via daglichturen, hitte, etc.). In v0.2 is I-D6-004 (was I-D7-004) verplaatst naar secundaire set, en wordt seizoensimpact gemeten uitsluitend via:
- *Expliciet:* I-D6-002 weekdag-cyclus + I-D6-003 klok-verzetten
- *Impliciet:* I-D1-001 daglicht (waar seizoen het signaal is, geen STL)
- *Gecorrigeerd:* alle andere indicatoren waar seizoen confounder is (STL toegepast)

Geen overlap meer.

---

## 4. Outlier-bescherming

### 4.1 Winsorization

Voor alle continue indicatoren na Z-scoring:

Z_winsorized(i, t) = clip(Z(i, t), -3, +3)

Behoudt richting en relatieve grootte van extremen, voorkomt single-indicator-dominantie.

**Eerlijke disclaimer:** ±3 is een conventionele drempel zonder specifieke empirische basis. In laag 8 (multiverse-analyse) wordt het effect van varieerde drempels (±2.5, ±3.5) systematisch getoetst.

### 4.2 Voor event-indicatoren

I-D5-003 en I-D6-003 zijn al ontworpen met begrensde schaal en decay. Geen aanvullende winsorization.

### 4.3 Audit-trail

Elke winsorization gelogd. Beschermt tegen informatieverlies; sensitivity-analyse mogelijk.

---

## 5. Inverse-codering

Sommige indicatoren hebben inverse relatie met stressor-blootstelling (hogere ruwe waarde = lagere blootstelling).

| Indicator | Ruwe relatie | Codering |
|---|---|---|
| I-D1-001 Daglichturen | meer licht = minder blootstelling | Z_inv = -Z |
| I-D6-001 Dagen tot vakantie | meer dagen = meer blootstelling | Z behouden |

Na inverse-codering geldt: hogere Z = hogere stressor-blootstelling. Vereiste voor optelbaarheid in laag 6.

---

## 6. Output van laag 5

Per indicator per tijdstap vier waarden:

1. X(i, t) — ruwe waarde uit laag 4
2. Z_short(i, t) — Z-score tegen 24m baseline, na inverse-codering en winsorization
3. Z_fixed(i, t) — Z-score tegen 2010-2019 baseline, idem
4. R(i, t) — STL-residu (waar toepasselijk)

Z_short → primair composiet. Z_fixed → structurele-drift. R → indicatoren waar seizoen confounder.

---

## 7. Voorbeeld-uitwerking

Hypothetisch voor week 24 van 2026:

| Indicator | X | B_short | σ_short | Z_short |
|---|---|---|---|---|
| I-D1-002 Hitte (T_max) | 34.2°C | 22.1°C | 5.4°C | +2.24 |
| I-D2-001 Filezwaarte | 8400 km·min | 6200 | 1100 | +2.00 |
| I-D3-002 Energie | 95 €/MWh | 78 | 12 | +1.42 |
| I-D5-001 Nieuwsneg (na STL) | residu +3.1 | 0 | 1.8 | +1.72 |
| I-D6-001 Dagen tot vakantie | 41 | 28 | 19 | +0.68 |

Deze gaan naar laag 6 voor weging.

---

## 8. Bekende beperkingen

### 8.1 Mediaan-MAD vs gemiddelde-SD
Robust statistics geven andere uitkomst dan klassieke. We zijn hier expliciet over.

### 8.2 Baseline-drift
24-maands rolling baseline absorbeert geleidelijke verslechtering. Daarom de parallel vaste baseline 2010-2019.

### 8.3 STL bij korte historiek
Eerste paar jaar kan STL het seizoenseffect over/onderschatten.

### 8.4 Winsorization vermindert detectie van extremen
Bewust ontwerpcompromis. Ruwe Z-waarden separaat beschikbaar voor extremen-rapportage.

---

## 9. Volgende stap (laag 6: weging)

Reeds gespecificeerd in `05_Laag-6_Weging.md`: drie wegingsschema's parallel (equal / evidence-graded / weegafhankelijkheid-diagnostiek), met balance-correctie voor 6-domein-structuur.

---

## Bronnen

Cleveland, R. B., Cleveland, W. S., McRae, J. E., & Terpenning, I. (1990). STL: A seasonal-trend decomposition procedure based on Loess. *Journal of Official Statistics*, 6(1), 3-73.

Leys, C., Ley, C., Klein, O., Bernard, P., & Licata, L. (2013). Detecting outliers: Do not use standard deviation around the mean, use absolute deviation around the median. *Journal of Experimental Social Psychology*, 49(4), 764-766.

---

### 05_Laag-6_Weging

*Bestand: `05_Laag-6_Weging.md`*

# Stressor-Blootstellings-Index (SBI)
## Laag 6: Weging

**Status:** v0.2 — werkdocument
**Document:** laag 6 van de methodologie
**Bouwt op:** laag 1-5
**Auteur:** BRAINWOLVES
**Datum:** mei 2026

---

## 0. Samenvatting

Dit document legt vast hoe de 20 genormaliseerde indicatoren in 6 domeinen worden gewogen tot één composiet. Twee hoofdschema's worden parallel uitgevoerd: een **equal-weights-schema** (transparant, geen verborgen aannames) en een **evidence-graded-schema** (factoren met sterkere wetenschappelijke onderbouwing wegen zwaarder). Een derde schema — *weegafhankelijkheid-diagnostiek* — is geen pass/fail-toets maar een rapportage-instrument dat de gevoeligheid voor weegkeuzes kwantificeert.

Het document specificeert verder een domein-balance-correctie en de pre-registratie van gewichten.

---

## 1. Twee fundamentele wegings-vragen

**Vraag A: Hoe wegen indicatoren *binnen* een domein?**
- Optie 1: gelijk
- Optie 2: gewogen naar evidence-grade per indicator
- Optie 3: gewogen naar variance-explanation (datadreven)

**Vraag B: Hoe wegen domeinen *tegen elkaar*?**
- Optie 1: gelijk (elk domein = 1/6)
- Optie 2: gewogen naar aantal indicatoren in domein
- Optie 3: gewogen naar gecombineerde evidence-grade van het domein
- Optie 4: gelijk met balance-correctie voor dunne domeinen

We selecteren combinaties die elk een specifiek wegingsschema vormen.

---

## 2. Schema 1 — Equal Weights (primair publicatie-schema)

### 2.1 Indicator-binnen-domein

Alle indicatoren binnen een domein krijgen identiek gewicht.

w_indicator(i ∈ D) = 1 / |D|

### 2.2 Domein-tussen

Alle zes domeinen krijgen gelijk gewicht:

w_domain(D) = 1/6 ≈ 0.167

### 2.3 Composiet-formule (volledige aggregatie in laag 7)

C_equal(t) = Σ_D [w_domain(D) × Σ_{i ∈ D} (w_indicator(i ∈ D) × Z_short(i, t))]

### 2.4 Waarom dit het primaire schema is

Equal weights heeft drie voordelen die in een methodologie zonder veldwerk dragend zijn:

1. *Transparantie:* geen verborgen aannames over relatieve belangrijkheid.
2. *Robuustheid:* geen overfitting aan historische data. Niet door achteraf-tuning te vertekenen.
3. *Verdedigbaarheid:* "we gaven elke literatuur-onderbouwde stressor gelijk gewicht" is een claim die geen empirische rechtvaardiging vereist die we niet kunnen leveren.

### 2.5 Beperking

Een file is duidelijk niet even belangrijk als een oorlog. Equal weights verbergt dat verschil. Daarom: het primaire publicatie-schema gebruikt equal weights, maar Schema 2 wordt parallel berekend en gepubliceerd zodat het verschil zichtbaar is.

---

## 3. Schema 2 — Evidence-Graded Weights (parallel)

### 3.1 Indicator-binnen-domein

Gewicht volgt de evidence-grade uit laag 3:

| Grade | Gewicht |
|---|---|
| A | 3 |
| B | 2 |
| C | 1 (alleen secundaire set) |

Genormaliseerd binnen domein:

w_indicator(i ∈ D) = grade_weight(i) / Σ_{j ∈ D} grade_weight(j)

### 3.2 Domein-tussen

Domein-gewicht = gemiddelde indicator-evidence-grade × balance-correctie:

w_domain(D) = (mean_grade(D) × balance(D)) / Σ_D (mean_grade(D) × balance(D))

### 3.3 Berekende waarden voor de 6 SBI-domeinen

Primaire set per domein met evidence-grades:

| Domein | Indicatoren | |D| | Grades | Mean grade |
|---|---|---|---|---|
| D1 Omgeving & klimaat | 4 | 4 | A, A, B, A | 2.75 |
| D2 Mobiliteit & ruimte | 2 | 2 | A, B | 2.50 |
| D3 Economische conditie | 5 | 5 | A, B, A, A, B | 2.60 |
| D4 Werk & belasting | 2 | 2 | B, B | 2.00 |
| D5 Media & collectieve gebeurtenissen | 3 | 3 | B, B, A | 2.33 |
| D6 Kalender & ritme | 4 | 4 | B, B, A, B | 2.25 |

Gemiddelde |D| = 20/6 ≈ 3.33; √(mean|D|) = 1.825

Balance-correctie balance(D) = √(|D|) / √(mean|D|):

| Domein | √(\|D\|) | balance(D) |
|---|---|---|
| D1 | 2.000 | 1.096 |
| D2 | 1.414 | 0.775 |
| D3 | 2.236 | 1.225 |
| D4 | 1.414 | 0.775 |
| D5 | 1.732 | 0.949 |
| D6 | 2.000 | 1.096 |

Gewicht ongeschaald = mean_grade × balance:

| Domein | mean_grade × balance | norm gewicht |
|---|---|---|
| D1 | 2.75 × 1.096 = 3.014 | 0.211 |
| D2 | 2.50 × 0.775 = 1.938 | 0.135 |
| D3 | 2.60 × 1.225 = 3.185 | 0.223 |
| D4 | 2.00 × 0.775 = 1.550 | 0.108 |
| D5 | 2.33 × 0.949 = 2.211 | 0.155 |
| D6 | 2.25 × 1.096 = 2.466 | 0.172 |
| **Totaal** | **14.364** | **1.000** |

### 3.4 Waarom parallel rapporteren

Equal en Evidence-Graded kunnen significant verschillen. Door beide te rapporteren toont de SBI haar gevoeligheid voor weegkeuze. Dit ondersteunt falsifieerbaarheidscriterium F2 (mono-causaliteit) uit het anker-paper.

---

## 4. Schema 3 — Weegafhankelijkheid-diagnostiek

### 4.1 Doel

Schema 1 en 2 maken impliciete keuzes over wat "belangrijk" is. Schema 3 *kwantificeert hoe sterk* het composiet afhangt van die keuzes — zonder pass/fail-drempel. Het is een **rapportage-instrument**, geen toets.

### 4.2 Methode

Drie tegen-intuïtieve gewichtsvariaties worden parallel berekend:

- *Inverse-rank:* w_indicator(i) = 1 / rank_by_grade(i)
- *Single-domain-dropouts:* zes varianten waarbij telkens één domein wordt weggelaten
- *Random-weight-bootstrap:* 1000 trekkingen met willekeurige gewichten uit een Dirichlet-verdeling

### 4.3 Output

Niet als signaal gepubliceerd, maar als **gevoeligheidsstatistiek** in de output:

```
weight_sensitivity:
  correlation_inverse_vs_equal_12w: 0.84
  composite_range_with_dropouts: [1.21, 1.65]   # min..max C(t) over 6 dropouts
  bootstrap_95_ci_around_equal: [1.32, 1.54]
```

### 4.4 Hoe deze rapportage te lezen

- *Hoge correlatie* tussen Schema 1 en inverse-rank betekent: weegkeuze maakt weinig uit — wat impliceert dat indicatoren een sterke gemeenschappelijke factor delen (mogelijk redundant).
- *Lage correlatie* betekent: weegkeuze maakt veel uit — het composiet is fragiel onder weeg-aanname.
- Beide zijn informatie. Geen van beide is "pass" of "fail". De gebruiker (en kritische reviewer) interpreteert naar context.

### 4.5 Verschil met v0.1

In v0.1 werd Schema 3 voorgesteld als pass/fail-toets met drempel 0.85. Dit was logisch kreupel — beide uitkomsten signaleerden een probleem. In v0.2 is de drempel weg en is Schema 3 puur diagnostisch.

---

## 5. Domein-balance-correctie

### 5.1 Probleem

Met v0.2-consolidatie hebben domeinen 2-5 indicatoren. Zonder correctie zou een 5-indicatoren-domein (D3) 2.5× meer signaal hebben dan een 2-indicatoren-domein (D2 of D4), louter door indicator-aantal.

### 5.2 Correctie

Voor evidence-graded schema (Schema 2):

balance(D) = √(|D|) / √(mean(|D|))

Wortel-correctie omdat lineaire correctie te zwaar is voor dunne domeinen (kunstmatig opwaardering) en geen correctie te zwaar voor dikke (oververtegenwoordiging).

### 5.3 Effect

In v0.2:
- D2 en D4 (elk 2 indicatoren) krijgen balance 0.775 — niet ondervertegenwoordigd, niet opgepompt
- D3 (5 indicatoren) krijgt balance 1.225 — relatief gedempt
- D1 en D6 (4 indicatoren) krijgen balance 1.096 — milde verhoging
- D5 (3 indicatoren) krijgt balance 0.949 — neutraal

Vergeleken met v0.1 (waar D5 met 1 indicator een balance van 0.58 kreeg, leidend tot systematische deflatie van het composiet door een dood domein), is de balansering in v0.2 substantieel gezonder.

### 5.4 Alternatieve aanpak overwogen en verworpen

We overwogen: domeinen wegen op basis van *theoretisch belang* eerder dan databeschikbaarheid. Verworpen omdat dit een subjectieve waardenoordeel-laag introduceert die we expliciet uit de methodologie willen houden.

---

## 6. Pre-registratie van gewichten

Alle wegings-keuzes worden vastgelegd in `00_Pre-Registratie.md`. Hier samengevat:

1. **Schema 1** (equal weights) — primair publicatie-schema
2. **Schema 2** (evidence-graded met balance-correctie) — parallel publicatie-schema
3. **Schema 3** (weegafhankelijkheid-diagnostiek) — rapportage-instrument, niet als signaal gepubliceerd

Alle drie worden bij *elke* wekelijkse berekening uitgevoerd. Output omvat:
- C_equal(t)
- C_evidence(t)
- weight_sensitivity-statistieken

Pre-registratie vindt plaats op OSF vóór eerste publieke meting. Gewichten kunnen alleen worden gewijzigd via het in 08_Onderhoud-Protocol.md gedocumenteerde proces.

---

## 7. Wanneer mogen gewichten herzien worden?

Drie legitieme gronden:

**A1. Nieuwe meta-analyse of systematic review** die evidence-grade van een indicator structureel verandert (A→B of B→A).

**A2. Indicator-toevoeging of -verwijdering** uit laag 3 (nieuwe data wordt beschikbaar; oude bron verdwijnt).

**A3. Falsifieerbaarheidscriteria-falen** uit anker-paper §7. Bij F2 (mono-causaliteit) is herziening vereist; bij F1, F4, F5 mogelijk vereist.

Elke herziening:
- Wordt minimaal 30 dagen vooraf publiek aangekondigd
- Wordt gedocumenteerd in versioned methodology paper
- Triggert herberekening van alle historische data onder beide schema's, gepubliceerd parallel

---

## 8. Bekende spanningen in de wegingslaag

### 8.1 Equal weights versus inhoudelijke validiteit

Equal weights is de meest defensieve keuze, maar de minst inhoudelijk geïnformeerde. Wie inhoudelijke prioritering wil, raadpleegt Schema 2.

### 8.2 Evidence-grade ≠ stress-relevantie

Evidence-grade weerspiegelt *hoeveel onderzoek* een associatie ondersteunt, niet *hoe sterk* de associatie is. Geaccepteerde beperking.

### 8.3 D4-zwakte

Onder Schema 2 krijgt D4 (werk, beide grade B) het laagste gewicht (0.108). Dit reflecteert eerlijk de relatief zwakkere evidence voor onze gekozen D4-indicatoren — kalendarische deadlines en schoolvakantie, beide grade B. Het is *niet* een uitspraak dat werkstress onbelangrijk is, maar dat *onze publieke proxies* matiger onderbouwd zijn dan onze D1-omgevingsproxies.

### 8.4 D5-consolidatie verbetert de structuur

Met media en collectieve gebeurtenissen samen in D5 is het composiet niet meer kwetsbaar voor de "zero-deflation" die in v0.1 optrad (toen D5 met één event-indicator 95% van de tijd 0 bijdroeg ondanks ~10% gewicht). In v0.2 draagt D5 in normale weken voortdurend bij via nieuwsnegativiteit en Google Trends.

---

## 9. Volgende stap (laag 7: aggregatie en drempel)

1. Composiet-formule met aggregatie-regel
2. Percentiel-rangschikking tegen historische verdeling
3. Drie-tier-signaal (groen/oranje/rood)
4. Decay-regels voor signaal-overgang
5. Output-API-specificatie

---

## Annex A — Definitieve wegingstabel Schema 2 (v0.2, gepre-registreerd)

| Domein | |D| | mean grade | balance | gew_raw | gew_norm |
|---|---|---|---|---|---|
| D1 Omgeving & klimaat | 4 | 2.75 | 1.096 | 3.014 | **0.211** |
| D2 Mobiliteit & ruimte | 2 | 2.50 | 0.775 | 1.938 | **0.135** |
| D3 Economische conditie | 5 | 2.60 | 1.225 | 3.185 | **0.223** |
| D4 Werk & belasting | 2 | 2.00 | 0.775 | 1.550 | **0.108** |
| D5 Media & collectieve gebeurtenissen | 3 | 2.33 | 0.949 | 2.211 | **0.155** |
| D6 Kalender & ritme | 4 | 2.25 | 1.096 | 2.466 | **0.172** |
| **Totaal** | **20** | | | **14.364** | **1.000** |

Onder Schema 1 (equal): elk domein **0.167**.

---

### 06_Laag-7_Aggregatie-en-Drempel

*Bestand: `06_Laag-7_Aggregatie-en-Drempel.md`*

# Stressor-Blootstellings-Index (SBI)
## Laag 7: Aggregatie en signaal-logica

**Status:** v0.2 — werkdocument
**Document:** laag 7 van de methodologie
**Bouwt op:** laag 1-6
**Auteur:** BRAINWOLVES
**Datum:** mei 2026

---

## 0. Samenvatting

Dit document specificeert hoe gewogen indicator-Z-scores uit laag 6 worden geaggregeerd tot één composiet, hoe die waarde wordt vertaald naar een percentiel-positie en hoe die positie omgezet wordt naar een drie-tier-signaal (groen/oranje/rood) met decay-regels. Het document legt ook de output-API-specificatie vast.

Belangrijk ontwerpprincipe: het composiet zelf is geen binaire ja/nee-uitspraak. Het signaal is een *positie* in een distributie. Of die positie als "venster open" of "venster gesloten" wordt geïnterpreteerd, hangt af van pre-geregistreerde drempels.

---

## 1. Composiet-formule

### 1.1 Per indicator

Z_weighted(i, t) = w_indicator(i ∈ D) × Z_short(i, t)

### 1.2 Per domein

D_score(D, t) = Σ_{i ∈ D} Z_weighted(i, t)

### 1.3 Composiet

C(t) = Σ_D [w_domain(D) × D_score(D, t)]

Onder Schema 1 (equal, 1/6 per domein): C_equal(t)
Onder Schema 2 (evidence-graded met balance-correctie): C_evidence(t)
Schema 3 (weegafhankelijkheid-diagnostiek): gerapporteerd als gevoeligheidsstatistiek, niet als signaal.

C_equal(t) is het primaire publieke signaal.

### 1.4 Eenheid

Composiet C(t) is dimensieloos.

---

## 2. Percentiel-positie

### 2.1 Waarom percentielen

Een MAD-Z-score van +1.8 op het composiet zegt weinig zonder context. Een percentiel-positie ("vandaag is in de top 12% van alle dagen van de laatste 24 maanden") is interpreteerbaar en historisch geankerd.

### 2.2 Definitie

P(t) = rang van C(t) binnen de verdeling van C-waarden over de afgelopen 24 maanden, uitgedrukt als percentiel (0-100).

### 2.3 Tijdsvenster

24 maanden voortschrijdend. Sluit aan op de korte baseline uit laag 5.

### 2.4 Bootstrapping

Eerste 24 maanden: historische backtest-data 2010-2024 als percentiel-referentie. Vanaf maand 24 schuift het venster mee.

### 2.5 Parallelle percentielen

Naast P_short(t) (24m venster) wordt P_fixed(t) berekend tegen de gehele backtest-historiek 2010-2019.

---

## 3. Drie-tier-signaal

### 3.1 Definitie

| Tier | Symbool | Voorwaarde |
|---|---|---|
| **Groen** | 🟢 | P(t) < 70 OF tier niet gehandhaafd lang genoeg |
| **Oranje** | 🟡 | 70 ≤ P(t) < 90, gehandhaafd ≥ 3 opeenvolgende dagen |
| **Rood** | 🔴 | P(t) ≥ 90, gehandhaafd ≥ 3 opeenvolgende dagen |

### 3.2 Sustained-duration-regel

Eén dag boven drempel ≠ tier-overgang. Drie opeenvolgende dagen binnen dezelfde band ⇒ tier-overgang.

### 3.3 Decay-regel

Bij daling onder drempel: tier wordt afgeschaald pas na 3 opeenvolgende dagen onder.

### 3.4 Asymmetrische logica

Het instrument is ontworpen om *trage* tier-overgangen op te leggen (zowel omhoog als omlaag). Het is geen real-time alarm; het is een rapport over collectieve conditie.

### 3.5 Rechtvaardiging van de 3-dagen-sustained-regel

De keuze van 3 dagen is niet arbitrair maar geankerd in twee literatuurlijnen:

**Chronobiologie:** de HPA-as-cortisol-respons heeft een circadiane cyclus van ongeveer 24 uur (Sapolsky 2004; Kirschbaum & Hellhammer 1989). Drie opeenvolgende dagen omvatten drie volledige cortisol-cycli — het minimum om een acute respons (één-daagse stressor, eindigend met herstel) te onderscheiden van een aanhoudende respons (geen herstel-gelegenheid).

**Stress-habituatie-literatuur:** McEwen (2007) toont dat allostatic load mechanismen actief worden na *meerdaagse* aanhoudende stressor-blootstelling, niet na acute eenmalige blootstelling. Drie dagen valt aan de ondergrens van wat als "aanhoudend" geldt in deze literatuur.

**Sensitivity-test:** in laag 8 (multiverse-analyse) wordt 1d, 3d, 5d en 7d sustained-duration parallel getest. Indien 3d niet robuust blijkt, wordt het criterium herzien.

### 3.6 Rechtvaardiging van P=70 en P=90 (eerlijk geformuleerd)

P=90 (top 10%) is een conventionele uitzonderlijkheidsdrempel in epidemiologische literatuur op uitkomst-meting (excess mortality, hospital admissions). Voor stressor-blootstelling-meting bestaat geen vergelijkbare conventie.

P=70 is gekozen als "waarschuwingsband" vóór rood; het exacte percentiel heeft geen empirische basis maar wordt in de multiverse-toets parallel gevarieerd (P=65, 70, 75) om robuustheid te tonen.

We zijn over deze keuze expliciet: het zijn redelijke conventies, niet wetenschappelijke noodzakelijkheden.

---

## 4. Output-specificatie

### 4.1 Daily output record

```
{
  "timestamp": "2026-05-24T23:00:00+02:00",
  "week_iso": "2026-W21",
  "composite": {
    "equal": 1.42,
    "evidence_graded": 1.58,
    "weight_sensitivity": {
      "correlation_inverse_vs_equal_12w": 0.84,
      "composite_range_with_dropouts": [1.21, 1.65],
      "bootstrap_95_ci_around_equal": [1.32, 1.54]
    }
  },
  "percentile": {
    "short_24m": 87,
    "fixed_2010_2019": 92
  },
  "tier": {
    "current": "amber",
    "days_in_tier": 5,
    "tier_history_30d": ["green", "green", "amber", "amber", ...]
  },
  "top_contributing_domains": [
    {"domain": "D1", "contribution": 0.34},
    {"domain": "D5", "contribution": 0.28},
    {"domain": "D2", "contribution": 0.22}
  ],
  "media_cluster_diagnostic": {
    "d5_cross_correlation_7d": 0.42,
    "composite_without_d5": 1.31,
    "media_contribution_percentile_points": 8
  },
  "data_quality": {
    "indicators_with_imputed_data": ["I-D3-002"],
    "indicators_missing": [],
    "pipeline_version": "0.2.0",
    "implementation_stage": "minimum_viable_pipeline"
  }
}
```

### 4.2 Drie outputs voor extern gebruik

**(a) De publieke barometer** — dagelijkse records via publieke website + RSS. Voor pers en publiek.

**(b) Signal-API** — minimal endpoint:

```
GET /signal/latest
{
  "tier": "amber",
  "timestamp": "2026-05-24T23:00:00+02:00",
  "valid_until": "2026-05-25T23:00:00+02:00",
  "brand_safety_flag": "normal"
}
```

**(c) Full dataset** — historische data, alle indicatoren, voor onderzoekers en kritische review.

### 4.3 Wat de output *niet* doet

- Geen beleidsadvies
- Geen interventie-aanbeveling
- Geen individuele aanbevelingen
- Geen demografische uitsplitsing
- Geen voorspelling van toekomstige tier

---

## 5. Transparantie van top-contributing-domains

### 5.1 Doel

Voorkomen van black-box-perceptie.

### 5.2 Berekening

contribution(D, t) = w_domain(D) × D_score(D, t) / C(t)

### 5.3 Indicator-niveau-detail

Bij verzoek: contribution per indicator. Niet in hoofdsignaal om overload te vermijden.

---

## 6. Signaal-onafhankelijkheid

Het signaal is een **passief rapport**. Het:
- Heeft geen kennis van wie abonneert
- Heeft geen kennis van of een campagne loopt
- Heeft geen feedback-loop met geconsumeerd gedrag
- Verandert niet onder commerciële druk

Ontwerpvereiste, geen optie.

---

## 7. Brand-safety-vlag

### 7.1 Probleem

Bij nationale tragedie kan het ongepast zijn dat downstream-systemen commercieel reageren op het signaal.

### 7.2 Mechanisme

Het signaal blijft de gemeten waarde rapporteren — wetenschappelijke integriteit wordt niet aangepast aan gevoeligheid. Wat *wel* wordt aangepast: een brand-safety-vlag.

```
"brand_safety": {
  "flag": "elevated",
  "reason": "national mourning declared",
  "expires_estimated": "2026-05-26T23:00:00+02:00"
}
```

### 7.3 Verantwoordelijkheid

Vlag is een service voor abonnees. Beslissing tot pauze ligt bij abonnee, niet bij meetsysteem.

---

## 8. Versies, audit en reproduceerbaarheid

### 8.1 Versionering

Semver per methodologie-versie. Elke output bevat pipeline_version + implementation_stage.

### 8.2 Audit-trail

Alle pipeline-stappen loggen naar publieke audit-log.

### 8.3 Reproducibility package

- Pipeline-code (open source)
- Configuratiebestanden
- Voorbeelddata
- Stappen-voor-stappen-reproductie-handleiding

---

## 9. Bekende beperkingen

### 9.1 Percentielen vereisen baseline
Eerste 24 maanden minder betrouwbaar — gebaseerd op backtest. Expliciet gemarkeerd.

### 9.2 Sustained-duration vertraagt detectie
Acute episode van 1-2 dagen wordt niet als tier-overgang gerapporteerd. Bewust ontwerp.

### 9.3 P=70 en P=90 zijn pre-registratie, geen wetenschap
Conventionele keuzes, niet wetenschappelijke noodzakelijkheden. Multiverse-getoetst in laag 8.

### 9.4 Discrete tier-grenzen
Een dag op P=89 is "amber", op P=91 is "red". Statistisch ongeveer dezelfde positie, instrumenteel anders gemarkeerd. Voor analytisch gebruik: continue percentielen beschikbaar.

---

## 10. Volgende stap (laag 8: validatie en robuustheid)

Reeds gespecificeerd in `07_Laag-8_Validatie-en-Robuustheid.md`: acht toetsen met tier-gates (must-pass / should-pass / continu).

---

## Bronnen

Kirschbaum, C., & Hellhammer, D. H. (1989). Salivary cortisol in psychoneuroendocrine research. *Neuropsychobiology*, 22(3), 150-169.

McEwen, B. S. (2007). Physiology and neurobiology of stress and adaptation: Central role of the brain. *Physiological Reviews*, 87(3), 873-904.

Sapolsky, R. M. (2004). *Why zebras don't get ulcers* (3rd ed.). Holt.

---

### 07_Laag-8_Validatie-en-Robuustheid

*Bestand: `07_Laag-8_Validatie-en-Robuustheid.md`*

# Stressor-Blootstellings-Index (SBI)
## Laag 8: Validatie en robuustheid

**Status:** v0.2 — werkdocument
**Document:** laag 8 van de methodologie
**Bouwt op:** laag 1-7
**Auteur:** BRAINWOLVES
**Datum:** mei 2026

---

## 0. Samenvatting

Dit document specificeert hoe de SBI gevalideerd wordt — niet via een academische peer-review (die structureel niet mogelijk is zonder institutionele affiliatie), maar via **acht onafhankelijke toetsen** in drie hiërarchische tier-gates: must-pass, should-pass, en doorlopend (geen launch-gate). Het 6/8-criterium uit v0.1 — een arbitraire score-drempel die alle toetsen gelijk behandelde — is vervangen door deze gewogen tier-structuur waarin sommige toetsen fataal zijn en andere informatief.

---

## 1. Validatie-architectuur (v0.2 herzien)

Acht toetsen in drie tiers:

**Tier-1 — Must-pass (faal = methodologie verworpen):**
- Toets 1: Natural-experiments
- Toets 5: Placebo-indicator-test
- Toets 6: Test-retest reliability

**Tier-2 — Should-pass (faal = waarschuwing, beperking gedocumenteerd):**
- Toets 2: Retrospectieve backtest
- Toets 3: Convergente validiteit
- Toets 4: Multiverse-analyse

**Tier-3 — Continu (geen launch-gate, doorlopend proces):**
- Toets 7: Adversariële review als ontwerp-iteratie
- Toets 8: Publieke replicatie-uitdaging

### Verschil met v0.1

In v0.1 stond "6/8 toetsen pass" als launch-criterium. Dit was arbitrair en behandelde alle toetsen gelijk. In v0.2:
- Falen op één tier-1-toets is fataal (geen launch)
- Falen op tier-2-toets vereist gedocumenteerde beperking maar blokkeert launch niet noodzakelijk
- Tier-3 is een proces, geen toets

---

## 2. Toets 1 — Natural-experiments (Tier-1)

### 2.1 Doel

Toetsen of het instrument piekt tijdens onafhankelijk vastgestelde collectieve stress-episodes.

### 2.2 Pre-gedefinieerde gebeurtenissen

| Periode | Gebeurtenis | Verwacht effect |
|---|---|---|
| Maart 2020 | COVID-lockdown 1 | Stijging week 12-15 |
| Oktober-december 2020 | COVID-lockdown 2 | Stijging tijdens lockdown |
| Juli 2019 | Hittegolf (T_max > 38°C) | Stijging week 30 |
| Juli 2021 | Watersnood Wallonië | Lokale piek; nationale stijging |
| Oktober 2022 - maart 2023 | Energiecrisis | Aanhoudende stijging |
| 22 maart 2016 | Aanslagen Brussel/Zaventem | Acute piek week 12 |
| Najaar 2008 | Financiële crisis | Stijging CPI- en werkloosheidssubindex |

### 2.3 Succescriterium

Minimaal **5 van 7** gebeurtenissen: SBI in oranje of rode tier (P ≥ 70 sustained).

### 2.4 Faalmechanisme

<5 events detected: **F1 geactiveerd → methodologie verworpen**.

### 2.5 Beperking

7 events is statistisch beperkt. Geen formele hypothese-toetsing maar een redelijkheidstoets.

---

## 3. Toets 2 — Retrospectieve backtest (Tier-2)

### 3.1 Doel

Het instrument 14 jaar terug berekenen (2010-2024) en kijken of gedrag intuïtief is.

### 3.2 Pipeline

1. Alle 20 primaire indicatoren ophalen voor 2010-2024
2. Pipeline draaien met live-methodologie — geen aanpassing aan historische data
3. C(t), P(t), tier produceren per dag

### 3.3 Verwachte patronen

- Januari-pieken (Blue Monday, energiekosten)
- Zomer-pieken in hittejaren
- COVID-stijging maart 2020
- Energiecrisis-plateau eind 2022

### 3.4 Succescriterium

Twee onafhankelijke beoordelaars: aanvaardbaarheid > 80%.

### 3.5 Faalmechanisme

Onverklaarde extreme pieken → diagnostiek per indicator → identificatie van pipeline-bug.

---

## 4. Toets 3 — Convergente validiteit (Tier-2)

### 4.1 Doel

Triangulatie tegen gerelateerde gedragsproxies.

### 4.2 Convergente variabelen

| Variabele | Bron | Verwachte richting |
|---|---|---|
| Ziekteverzuim-aggregaat | RIZIV (publieke aggregaten) | + correlatie |
| Mentale-gezondheidszorg-utilisatie | RIZIV/IMA-publieke aggregaten | + correlatie, lag mogelijk |
| Retail-bestedingen | STATBEL retail-index | - correlatie tijdens pieken |
| Alcohol/gokken-omzet | STATBEL/Belastingdienst aggregaten | + correlatie (coping) |

*Notitie: RIZIV-aggregaten zijn publieke data, identiek behandeld als STATBEL of NBB. Dit is geen institutionele samenwerking.*

### 4.3 Methode

- Maandelijkse SBI-gemiddelde
- Spearman-correlatie met variabele over 2010-2024
- Statistische significantie + effect-size

### 4.4 Succescriterium (v0.2 verscherpt)

Minimaal:
- **2 proxies met Spearman rho > 0.40 en p < 0.05** *OF*
- **3 proxies met Spearman rho > 0.30 en p < 0.05**

In v0.1 was de bar rho > 0.25 (zwak in elke statistische standaard). In v0.2 is dit verhoogd naar 0.30 of 0.40 afhankelijk van het aantal proxies. Eerlijkere, scherpere lat.

### 4.5 Faalmechanisme

0 of 1 proxy convergeert volgens criterium: **F4 geactiveerd** — beperking gedocumenteerd; launch alleen mogelijk met expliciete acknowledgement van zwakke convergente validiteit.

---

## 5. Toets 4 — Multiverse-analyse (Tier-2)

### 5.1 Doel

Alle redelijke analytische paden uitvoeren; meten hoe robuust de uitkomst is voor methode-keuzes (Steegen et al 2016).

### 5.2 Variatie-dimensies

- *Wegingsschema:* {equal, evidence-graded, inverse-rank}
- *Baseline-window:* {12m, 24m, 36m}
- *Percentiel-drempel oranje:* {65, 70, 75}
- *Percentiel-drempel rood:* {85, 90, 95}
- *Sustained-duration:* {1d, 3d, 5d, 7d}
- *Winsorization:* {±2.5, ±3.0, ±3.5}
- *STL voor twijfelgevallen:* {standaard, alle indicatoren STL, geen STL}

Totaal: 3 × 3 × 3 × 3 × 4 × 3 × 3 = **2916 analytische paden**.

### 5.3 Computationele realiteit

Pipeline op 5 jaar dagelijkse data per pad ≈ enkele seconden. Totaal 2916 paden ≈ 1-2 uur op standaard hardware. Eenmalige run vóór livegang; in onderhoudscyclus per kwartaal herhaald.

### 5.4 Succescriterium

Het **primaire pad** (default-configuratie zoals pre-geregistreerd) moet binnen de **centrale 95%** van de uitkomstenverdeling van alle paden vallen.

### 5.5 Faalmechanisme

Default valt buiten centrale 95% → herzie defaults of accepteer multiverse als primair signaal. Beperking gedocumenteerd, launch mogelijk met aanpassing.

---

## 6. Toets 5 — Placebo-indicator-test (Tier-1)

### 6.1 Doel

Testen of de pipeline correlaties detecteert die er niet mogen zijn.

### 6.2 Placebo's

| Placebo | Bron | Hypothese |
|---|---|---|
| P1: Maan-fase | astronomisch | Geen significant effect |
| P2: Pi-decimalen-stream | wiskundig | Geen significant effect |

### 6.3 Test

1000 trekkingen met willekeurige timing-offsets van placebo's. Verdeling van placebo-contributie aan composiet.

### 6.4 Succescriterium

95%-CI van placebo-contributie omvat 0.

### 6.5 Faalmechanisme

Placebo systematisch contribueert → **F3 geactiveerd → methode-bug → correctie vereist vóór launch**.

---

## 7. Toets 6 — Test-retest reliability (Tier-1)

### 7.1 Doel

Composiet moet substantieel hetzelfde blijven als 50% van indicatoren weggelaten worden.

### 7.2 Methode

Bootstrap: 1000 trekkingen × 50% van de 20 indicatoren × pipeline herberekenen × tier vergelijken met volledige-set.

### 7.3 Succescriterium

≥ 70% tier-agreement.

### 7.4 Faalmechanisme

Lage agreement → composiet hangt te zwaar van specifieke indicatoren af → identificatie en mogelijk herziening vóór launch.

---

## 8. Toets 7 — Adversariële review als ontwerp-iteratie (Tier-3)

### 8.1 Verschil met v0.1

In v0.1 was "vijandige review" een launch-gate. In v0.2 is het **een ontwerp-iteratie-stap** — uitgevoerd vóór livegang om het ontwerp te verbeteren, niet om het te gate-en. Reden: indien een review fundamentele problemen blootlegt en het ontwerp wordt aangepast, is dat *bouwen*, geen *valideren*.

### 8.2 Werving

Drie tot vijf individuele academici, niet hun instellingen, uit verschillende methodologische scholen:
- Eén positivist-kwantitatief
- Eén kritisch-kwalitatief
- Eén psychometricus
- Eén epidemioloog of sociale-data-scientist
- Optioneel: één gedragseconoom

### 8.3 Vergoeding

Marktconform (€500-1500 per review). Disclosures publiek.

### 8.4 Procedure

- Reviewer ontvangt complete methodologie-paper
- Schrijft formele kritiek (5-10 pagina's)
- Methodologie-team reageert op elk punt
- Beide gepubliceerd als annex

### 8.5 Output

Verbeterd ontwerp én publiek-gemaakte kritiek met respons. Lezers zien wat critici aanmerkten.

### 8.6 Geen pass/fail

De review is een verbetercyclus, geen toets. Indien een reviewer een fataal probleem identificeert dat niet opgelost kan worden, wordt dit gedocumenteerd als beperking.

---

## 9. Toets 8 — Publieke replicatie-uitdaging (Tier-3)

### 9.1 Doel

Onafhankelijke derden moeten hetzelfde resultaat krijgen.

### 9.2 Procedure

Bij livegang publieke:
- Volledige code (open source)
- Configuratiebestanden
- Voorbeelddata voor testperiode
- Reproductie-handleiding

Publieke uitnodiging op OSF en GitHub. Replicaties krijgen citatie.

### 9.3 Succescriterium

Binnen 12 maanden na livegang: ≥ 2 onafhankelijke replicaties die SBI-scores reproduceren binnen 10%.

### 9.4 Faalmechanisme

0 replicaties of > 10% afwijkingen → **F5 geactiveerd** → documentatie van niet-reproduceerbaarheid → mogelijke methodologie-update.

### 9.5 Doorlopend proces, geen launch-gate

Replicatie kost tijd. Launch wacht niet op replicatie. Indien jaar 2 nog steeds 0 replicaties: serieuze herziening.

---

## 10. Tier-gate-beslismatrix voor launch

| Tier-1 (Must-pass) | Tier-2 (Should-pass) | Beslissing |
|---|---|---|
| 3/3 pass | 3/3 pass | **Launch** |
| 3/3 pass | 2/3 pass | **Launch** met gedocumenteerde beperking |
| 3/3 pass | ≤1/3 pass | **Stop** — heroverweeg ontwerp |
| <3/3 pass | enig | **Stop** — methodologie verworpen |

Tier-3 is geen launch-input maar doorlopend programma.

---

## 11. Validatie-rapport-template

Bij elke versie-uitgave:

| Toets | Tier | Status | Score | Notitie |
|---|---|---|---|---|
| 1. Natural-experiments | 1 | pass/fail | X/7 events detected | |
| 5. Placebo-test | 1 | pass/fail | 95% CI bevat 0: ja/nee | |
| 6. Test-retest | 1 | pass/fail | X% agreement | |
| 2. Retrospectieve backtest | 2 | pass/fail | inter-rater X% | |
| 3. Convergente validiteit | 2 | pass/fail | rho-overzicht | |
| 4. Multiverse | 2 | pass/fail | default percentiel-positie | |
| 7. Adversariële review | 3 | uitgevoerd/openstaand | X reviewers, Y aanpassingen | |
| 8. Publieke replicatie | 3 | aantal replicaties, % match | | |

---

## 12. Doorlopende monitoring (zie ook 08_Onderhoud-Protocol.md)

### 12.1 Jaarlijkse heraudit

Externe reviewer (jaarlijks andere) audit pipeline, methodologie, output. Audit-rapport publiek.

### 12.2 Quartaal-multiverse-monitor

Multiverse-analyse per kwartaal herhaald met groeiende dataset.

### 12.3 Bug-bounty-programma

Publieke uitnodiging voor methodologische uitdagingen.

---

## 13. Wat validatie *niet* doet

- Bewijst geen causaliteit
- Bewijst geen klinische relevantie
- Bewijst geen universele toepasbaarheid
- Bewijst geen voorspellende kracht

---

## 14. Sluiting van de methodologie-build

Met laag 8 voltooid (v0.2) is de volledige SBI-methodologie gedocumenteerd op acht lagen, plus drie ondersteunende documenten:

- *Laag 1+2 — Anker:* construct, theorie, scope, falsifieerbaarheid → `01_Anker-Paper.md`
- *Laag 3 — Indicator-selectie:* 20 primair, 6 secundair, 9 uitgesloten → `02_Laag-3_Indicator-Selectie.md`
- *Laag 4 — Operationalisering:* formules, data, pipeline, decorrelatie → `03_Laag-4_Operationalisering.md`
- *Laag 5 — Normalisatie:* dubbele baseline, STL, winsorization → `04_Laag-5_Normalisatie.md`
- *Laag 6 — Weging:* drie schema's, balance-correctie, 6 domeinen → `05_Laag-6_Weging.md`
- *Laag 7 — Aggregatie & signaal:* drie-tier, percentielen, output-API → `06_Laag-7_Aggregatie-en-Drempel.md`
- *Laag 8 — Validatie:* acht toetsen, tier-gates, jaarlijkse audit → dit document

Ondersteunende documenten:
- `00_Pre-Registratie.md` — alle pre-geregistreerde keuzes
- `08_Onderhoud-Protocol.md` — review-kalender, update-procedures
- `09_Brand-Message-Style-Guide.md` — communicatie-vereisten voor abonnees

---

## Bronnen

Borsboom, D., Mellenbergh, G. J., & van Heerden, J. (2004). The concept of validity. *Psychological Review*, 111(4), 1061-1071.

Cronbach, L. J., & Meehl, P. E. (1955). Construct validity in psychological tests. *Psychological Bulletin*, 52(4), 281-302.

Mellers, B., Hertwig, R., & Kahneman, D. (2001). Do frequency representations eliminate conjunction effects? An exercise in adversarial collaboration. *Psychological Science*, 12(4), 269-275.

Munafò, M. R., Nosek, B. A., Bishop, D. V. M., et al. (2017). A manifesto for reproducible science. *Nature Human Behaviour*, 1, 0021.

Open Science Collaboration (2015). Estimating the reproducibility of psychological science. *Science*, 349(6251), aac4716.

Steegen, S., Tuerlinckx, F., Gelman, A., & Vanpaemel, W. (2016). Increasing transparency through a multiverse analysis. *Perspectives on Psychological Science*, 11(5), 702-712.

---

### 08_Onderhoud-Protocol

*Bestand: `08_Onderhoud-Protocol.md`*

# Stressor-Blootstellings-Index (SBI)
## Onderhouds-protocol

**Status:** v0.2 — werkdocument
**Doel:** specificatie van continue-onderhoud-cyclus na livegang
**Auteur:** BRAINWOLVES
**Datum:** mei 2026

---

## 0. Waarom een onderhouds-protocol

Een meetinstrument zonder onderhoud verstart. Indicatoren-evidence verandert (nieuwe meta-analyses), databronnen verdwijnen of veranderen format, methodologische velden ontwikkelen door, en publieke kritiek genereert verbeter-mogelijkheden.

Zonder gedocumenteerde onderhouds-kalender vervalt elke pre-registratie tot fictie: keuzes raken stilletjes verouderd of worden ad-hoc aangepast. Dit document legt vast wanneer, hoe en door wie de SBI wordt herijkt.

---

## 1. Cyclische review-momenten

### 1.1 Doorlopend (continue processen)

| Activiteit | Frequentie | Verantwoordelijke |
|---|---|---|
| Pipeline-monitoring (uptime, data-integriteit) | dagelijks-geautomatiseerd | technisch beheer |
| Bug-bounty-respons | binnen 14 dagen na inzending | methodologie-team |
| Replicatie-rapport-respons | binnen 30 dagen | methodologie-team |
| Brand-safety-vlag-handhaving | real-time bij events | brand-safety-coördinator |

### 1.2 Per kwartaal

| Activiteit | Wat |
|---|---|
| Multiverse-monitor | Multiverse-analyse (laag 8 toets 4) herhaald met groeiende dataset; rapport publiek |
| Confounder-monitor | Per indicator: nieuwe confounders gedetecteerd? Cross-correlatie-trends? |
| Indicator-beschikbaarheid-check | Data-pipelines stabiel? Bronnen veranderd? |

### 1.3 Per half jaar

| Activiteit | Wat |
|---|---|
| Schema-2-gewichten-herberekening | Indien evidence-grade van enige indicator gewijzigd is sinds laatste publicatie |
| Pre-COVID-baseline-stabiliteitstest | Is 2010-2019-baseline nog steeds representatief, of vraagt het om verschuiving naar bv. 2015-2024? |

### 1.4 Jaarlijks

| Activiteit | Wat |
|---|---|
| Literatuur-review evidence-grades | Q4 elk jaar: systematische zoekactie naar nieuwe SR/MA voor elke primaire indicator. Evidence-grades worden herwaardeerd. |
| Externe heraudit | Jaarlijks een *andere* externe reviewer dan vorige jaar. Audit-rapport publiek. |
| Counter-evidence-update | Per indicator wordt het "contrasterend bewijs"-veld systematischer gevuld dan in oorspronkelijke laag-3-build. |
| Validatie-rapport-update | Toets-1 t/m 8 status, met name natural-experiments toegevoegd indien nieuwe stress-episodes plaatsvonden |

### 1.5 Per 3 jaar

| Activiteit | Wat |
|---|---|
| Vaste-baseline-evaluatie | Is 2010-2019 nog steeds bruikbaar? Of moet baseline-periode vernieuwd worden? |
| Methodologische-architectuur-review | Hele build doorlichten op herontwerpsignalen |

---

## 2. Triggers voor onmiddellijke review

Niet-cyclische review-momenten:

### 2.1 Falsifieerbaarheidscriterium geactiveerd

Bij detectie van F1-F5 (zie laag 1 §8): onmiddellijke methodologie-bevriezing, diagnostiek, en publieke verslag binnen 30 dagen.

### 2.2 Methodologische defect via bug-bounty

Onafhankelijke kritiek die een fundamentele fout aantoont:
- Klacht gepubliceerd binnen 7 dagen
- Methodologie-respons binnen 30 dagen
- Indien defect bevestigd: correctie + herberekening historische data + versie-update

### 2.3 Indicator-data-bron uitval

Bij uitval van een bron > 14 dagen:
- Tijdelijke missing-flag in output
- Onderzoek alternatieve bron
- Indien permanent verlies: indicator-uitsluiting en herweging-proces

### 2.4 Mediacyclus-decorrelatie-falen

Indien sustained correlatie tussen I-D5-001, I-D5-002 en I-D5-003 > 0.7 over meerdere maanden: protocol §4.4 van laag 4 wordt aangescherpt of D5-architectuur wordt herzien.

---

## 3. Versie-beheer

### 3.1 Semver-conventie

- **Major (X.0.0):** breaking change in methodologie (nieuwe weegstructuur, anker-wijziging, indicator-set-wijziging > 20%)
- **Minor (0.X.0):** indicator-toevoeging of -verwijdering binnen bestaande domeinen, drempelwaarde-wijziging
- **Patch (0.0.X):** bug-fix, documentatie-aanpassing, geen meet-impact

### 3.2 Wijzigings-aankondiging

| Wijzigings-niveau | Vooraf-aankondiging |
|---|---|
| Major | 60 dagen vooraf publiek |
| Minor | 30 dagen vooraf publiek |
| Patch | direct met changelog |

### 3.3 Backwards-compatibiliteit

Bij major-wijziging:
- Oude versie blijft 6 maanden draaien naast nieuwe
- Beide outputs publiek beschikbaar
- Migratie-handleiding voor abonnees

### 3.4 Data-herberekening

Bij major en minor wijzigingen: hele historische dataset herberekend onder nieuwe methodologie en gepubliceerd naast originele.

---

## 4. Adviesraad-rotatie

### 4.1 Standaard-rotatie

Adviesraad-leden (3-5 individuele academici): twee jaar termijn, met overlap (geen volledige vervanging tegelijk).

### 4.2 Adversariële collaborator

Eén lid expliciet met *adversariële rol*: aanwijzen voor 1 jaar, rotation expliciet om risico op consensus-bias te beperken.

### 4.3 Disclosure-discipline

Bij elke termijn-aanvang: publieke disclosure van financiële, professionele en intellectuele relaties van het lid met BRAINWOLVES of methodologie-onderwerpen.

---

## 5. Update-proces in detail

### 5.1 Stap 1 — Detectie

Een wijzigings-noodzaak detecteren via een van: cyclische review, falsifieerbaarheids-criterium, bug-bounty, externe heraudit, adviesraad-aanbeveling.

### 5.2 Stap 2 — Documentatie

Wijzigings-voorstel schrijven met:
- Aanleiding (welke aanleiding triggerde dit)
- Voorgestelde wijziging (specifiek)
- Impact (welke documenten/keuzes raken eraan)
- Risico's (wat kan slechter worden)
- Backwards-compatibiliteit (hoe blijft de historische SBI bruikbaar)

### 5.3 Stap 3 — Adviesraad-consultatie

Adviesraad krijgt 14 dagen voor commentaar. Adversariële collaborator heeft expliciete uitnodiging tot tegenstand.

### 5.4 Stap 4 — Publieke aankondiging

Wijzigingsvoorstel publiek met 30/60-dagen-vooraf-venster afhankelijk van major/minor.

### 5.5 Stap 5 — Implementatie

Code-wijziging, data-herberekening, parallelle publicatie oude+nieuwe versie.

### 5.6 Stap 6 — Audit-trail

Wijziging gelogd in `CHANGELOG.md` met datum, aanleiding, beslissing en eventuele dissenting opinions van adviesraadleden.

---

## 6. Verantwoordelijkheden-matrix

| Activiteit | Methodologie-team | Adviesraad | Externe reviewer | Publiek |
|---|---|---|---|---|
| Dagelijkse pipeline | uitvoerend | — | — | — |
| Kwartaal-multiverse | uitvoerend | informeren | — | publiek |
| Jaarlijkse lit-review | uitvoerend | adviseren | — | publiek |
| Jaarlijkse audit | leveren materiaal | informeren | uitvoerend | publiek |
| Major wijziging | voorstellen | adviseren / aanvechten | onafhankelijke check optioneel | publieke consultatie |
| Bug-bounty | reageren | informeren | — | indienen, ontvangen |
| Replicatie-rapport | reageren | informeren | — | indienen |

---

## 7. Sluiting van het instrument

Het is mogelijk dat de SBI uiteindelijk wordt afgeschaft — vrijwillig of na opeenvolgend falen van validatie-toetsen. In dat geval:
- Publieke aankondiging 90 dagen vooraf
- Historische dataset blijft 5 jaar publiek beschikbaar
- Methodologie-documenten blijven publiek als wetenschappelijk-werk-document
- Geen stille verdwijning

Een instrument met een end-of-life-protocol is geloofwaardiger dan een instrument dat eeuwig durft te draaien zonder zelfkritische exit-clausule.

---

### 09_Brand-Message-Style-Guide

*Bestand: `09_Brand-Message-Style-Guide.md`*

# Stressor-Blootstellings-Index (SBI)
## Communicatie-stijlgids voor abonnees en publieke berichtgeving

**Status:** v0.2 — bindende stijlgids
**Doel:** voorkomen dat downstream-communicatie de methodologische beperkingen van de SBI overschrijdt
**Geldt voor:** elke partij die het SBI-signaal consumeert (campagnes, persgebruik, publieke woordvoering)
**Auteur:** BRAINWOLVES
**Datum:** mei 2026

---

## 0. Waarom deze stijlgids bestaat

De SBI is gebouwd met expliciete methodologische zorgvuldigheid: het meet *condities*, niet *stress*. Het meet *populaties*, niet *individuen*. Het is *literatuur-onderbouwd*, niet *peer-reviewed*.

Maar zodra het signaal in een banner, persbericht of social-mediaboodschap verschijnt, kan al die zorgvuldigheid in één formulering ongedaan worden gemaakt. "U bent gestrest, ga op vakantie" schendt vier methodologische beperkingen tegelijk.

Deze stijlgids beschermt zowel de SBI als de abonnee. Een merk dat methodologische claims verbreekt, krijgt PR-terugslag wanneer een journalist of academicus dat aankaart. Door communicatie binnen de methodologische scope te houden, blijft het verhaal verdedigbaar onder elke vorm van scrutiny.

---

## 1. Vier kernregels

### 1.1 Spreek over *condities*, niet over *mensen*

- ✅ "De omstandigheden zijn extreem"
- ✅ "Collectieve druk in de hoogste zone"
- ✅ "Blootstellings-conditie op piekniveau"
- ❌ "U bent gestrest"
- ❌ "Vlamingen zijn collectief gestrest"
- ❌ "Iedereen heeft een burn-out"

### 1.2 Spreek over de *index*, niet over *stress*

- ✅ "De Stressor-Blootstellings-Index staat op rood"
- ✅ "Verhoogd-blootstellings-venster geopend"
- ✅ "Index in oranje zone, derde dag op rij"
- ❌ "De Vlaamse stress staat op recordhoogte"
- ❌ "Het land is gestrest"

### 1.3 Spreek over *populatie*, niet over *individuen*

- ✅ "Op populatieniveau geassocieerd met verhoogde stressrespons"
- ✅ "Statistisch een moment waarop herstel zinvol is"
- ❌ "U heeft nu meer kans op een burn-out"
- ❌ "Uw stress is gemeten"

### 1.4 Spreek over *publieke meting*, niet over *wetenschap*

- ✅ "Literatuur-onderbouwde publieke meting"
- ✅ "Methodologisch transparant gedocumenteerd"
- ✅ "Op basis van wetenschappelijke literatuur"
- ❌ "Wetenschappelijk gevalideerde stress-meting"
- ❌ "Peer-reviewed onderzoek toont aan"
- ❌ "Klinische bevestiging dat..."

---

## 2. Goede en slechte formulering — voorbeelden per kanaal

### 2.1 Banner / advertentie

| ✅ Toegestaan | ❌ Niet toegestaan |
|---|---|
| "Verhoogd-blootstellings-venster open. Tijd voor rust." | "Je bent gestrest. Ga op vakantie." |
| "Conditie extreem. Herstel-moment." | "Vlaamse burn-out-piek bereikt." |
| "De index zegt: pauzeer." | "Wetenschap bewijst: jij bent oververmoeid." |

### 2.2 Persbericht / nieuwsbericht

| ✅ Toegestaan | ❌ Niet toegestaan |
|---|---|
| "De Stressor-Blootstellings-Index registreert vandaag een uitzonderlijke samenloop van stressoren-condities." | "Wetenschappers stellen vast dat Vlamingen massaal gestrest zijn." |
| "Volgens de publiek beschikbare SBI bevindt België zich in een verhoogd-blootstellings-venster." | "De Belgische stress-index toont dat we collectief ziek zijn." |
| "Het signaal staat in de top 8% van blootstellings-condities van de laatste 24 maanden." | "8 op 10 Vlamingen heeft burn-out." |

### 2.3 Social media

| ✅ Toegestaan | ❌ Niet toegestaan |
|---|---|
| "SBI vandaag op P=92. Derde dag op rij in rood. Conditie-extreem." | "We zijn allemaal gestrest. Take a break." |
| "De index meet de omstandigheden, niet jou. De omstandigheden zijn extreem." | "Jouw stress-score is hoger dan ooit." |

### 2.4 Campagne-call-to-action

| ✅ Toegestaan | ❌ Niet toegestaan |
|---|---|
| "Statistisch gezien is dit een goed moment voor recovery." | "U *moet* nu uitrusten." |
| "Wanneer de condities extreem zijn, weegt rust extra zwaar." | "U bent ongezond gestrest." |
| "Preventief herstel — terwijl het kan." | "Klinisch advies: ga op vakantie." |

---

## 3. Verboden claims (hard)

Onder geen enkele communicatie-omstandigheid:

1. *Individuele attributie.* Niet "u bent gestrest", niet "Jan heeft burn-out", niet "uw stress-niveau".
2. *Klinische taal.* Niet "diagnose", niet "klinisch verhoogd", niet "medische bevinding".
3. *Wetenschappelijke peer-review-claim.* Niet "peer-reviewed", niet "gevalideerd onderzoek", niet "wetenschappelijk bewezen".
4. *Causale claims.* Niet "X veroorzaakt stress", niet "de file maakt u ziek".
5. *Voorspellende claims over gedrag.* Niet "u zult een burn-out krijgen", niet "uw productiviteit zal dalen".
6. *Demografische uitsplitsing.* Niet "vrouwen gestresseerder dan mannen", niet "millennials in rood". De SBI meet geen demografie.

---

## 4. Toon-richtlijnen

### 4.1 Niet activerend, wel informatief

Vermijd alarmerende toon. De SBI is een **rapport**, geen **alarm**. Communicatie volgt die geest:

- ✅ "De index staat momenteel op rood."
- ❌ "PAS OP! STRESS-PEAK!"

### 4.2 Geen schuldtoekenning

Niet de bevolking opvoeden of moraliseren:

- ✅ "Conditie-piek. Een moment om bewuste keuzes te maken."
- ❌ "U moet beter voor uzelf zorgen."

### 4.3 Geen utopisme

Geen belofte van transformatie via een product:

- ✅ "Recovery in extreme omstandigheden."
- ❌ "Alle stress weg na één weekend in [bestemming]."

---

## 5. Brand-safety en kill-switch

Bij activering van de brand-safety-vlag (zie laag 7 §7):

- Stop alle commerciële boodschappen die het signaal als trigger gebruiken
- Continueer (indien gewenst) de neutrale rapportage van de index-stand zonder commerciële call-to-action
- Wacht op vlag-deactivatie vóór hervatting

Voorbeeld: bij nationale rouw is "verhoogd-blootstellings-venster open, tijd voor rust in [bestemming]" *niet* gepast. "De SBI registreert de impact van [gebeurtenis] op blootstellings-condities" is wel gepast — informatief, niet commercieel.

---

## 6. Vertaling en buitenlandse markten

De stijlgids geldt in elke taal. Vertalingen mogen geen subjectieve drift introduceren ("blootstellings-conditie" → "stress" zou een vertaal-overtreding zijn). In het Frans: "Indice d'Exposition aux Stresseurs". In het Engels: "Stressor Exposure Index".

---

## 7. Naleving en handhaving

### 7.1 Abonnement-voorwaarde

Alle abonnees op de Signal-API tekenen voor naleving van deze stijlgids als voorwaarde voor toegang.

### 7.2 Schendings-procedure

Stap 1: schriftelijke waarschuwing binnen 7 dagen na detectie
Stap 2: bij herhaling — opschorting toegang Signal-API voor 30 dagen
Stap 3: bij ernstige of herhaalde schending — permanente intrekking abonnement

### 7.3 Publieke meldingen

Het methodologie-team ontvangt klachten over abonnee-schendingen via een publiek meldpunt. Klachten worden onderzocht; uitspraken publiek gemaakt.

### 7.4 Reputatie-bescherming

Een merk dat zich aan deze stijlgids houdt, kan zijn communicatie met overtuiging verdedigen tegen elke kritische scrutiny. Een merk dat de stijlgids breekt, ondermijnt zijn eigen verhaal én dat van de SBI.

---

## 8. Updates van deze stijlgids

Wijzigingen volgen het proces uit `08_Onderhoud-Protocol.md`. Substantiële aanscherpingen worden 30 dagen vooraf aan abonnees aangekondigd. Verzachtingen vereisen adviesraad-goedkeuring.

---

## 9. Eindgedachte voor abonnees

De waarde van het SBI-signaal hangt voor 100% af van de geloofwaardigheid van de methodologie. Die geloofwaardigheid bouwen we op met elke maand zorgvuldige meting. We kunnen die in één banner verliezen.

Deze stijlgids is geen lastige clausule, het is de verzekering dat het instrument dat u abonneert blijft werken — voor u en voor elke andere abonnee.

---

## 5. Volledige broncode

- **Engine (TypeScript)** — 19 bestanden
- **Engine tests** — 1 bestanden
- **Data-pipeline (Python)** — 35 bestanden
- **Web (React + Vite)** — 34 bestanden
- **GitHub Actions** — 1 bestanden
- **READMEs** — 3 bestanden

**Totaal:** 93 bestanden

---

### Engine (TypeScript)

#### `app/engine/src/cli/compute-daily.ts`

```ts
/**
 * Production-bridge: leest Python pipeline-output, draait engine, schrijft daily-output.json.
 *
 * Stappen (doc 03_Laag-4 §5.3):
 *   [1] EXTRACT     — pipeline heeft raw-values.json al geschreven
 *   [2] VALIDATE    — schema-check op input
 *   [3-7] runtime  — Z, STL, winsor, weight, aggregate, signal (engine doet dit)
 *
 * Run: tsx src/cli/compute-daily.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { computeDaily } from "../runtime.js";
import { INDICATORS, INDICATOR_CODES } from "../indicators/registry.js";
import type { IndicatorCode } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_VALUES = resolve(__dirname, "../../../data/raw-values.json");
const RAW_HISTORY = resolve(__dirname, "../../../data/raw-history.json");
const COMPOSITE_HISTORY = resolve(__dirname, "../../../data/composite-history.json");
const OUT_DATA = resolve(__dirname, "../../../data/latest.json");
const OUT_WEB = resolve(__dirname, "../../../web/public/data/latest.json");
const SPARK_DATA = resolve(__dirname, "../../../data/sparkline-30d.json");
const SPARK_WEB = resolve(__dirname, "../../../web/public/data/sparkline-30d.json");

interface PipelineResult {
  code: IndicatorCode;
  value: number;
  date: string;
  simulated: boolean;
  imputed: boolean;
  source: string;
  observation_date?: string;
}

interface PipelineBatch {
  target_date: string;
  results: PipelineResult[];
  secondary?: Array<{ code: string; value: number; simulated: boolean; source?: string; observation_date?: string }>;
  simulated_codes: IndicatorCode[];
  imputed_codes: IndicatorCode[];
}

const SECONDARY_NAMES: Record<string, string> = {
  "I-D5-006S": "Reddit-sentiment (onderstroom-peiling)",
};

function loadOrFail(path: string, what: string): string {
  if (!existsSync(path)) {
    console.error(`✗ ${what} ontbreekt: ${path}`);
    console.error("  → run eerst: cd ../pipeline && python -m pipeline.run --history-days 730");
    console.error("  → of, voor demo: npm run generate-fixture");
    process.exit(1);
  }
  return readFileSync(path, "utf-8");
}

function main() {
  const today = JSON.parse(loadOrFail(RAW_VALUES, "raw-values.json")) as PipelineBatch;

  // Bouw rawValues map + observation-dates
  const rawValues: Partial<Record<IndicatorCode, number>> = {};
  const observationDates: Partial<Record<IndicatorCode, string>> = {};
  for (const r of today.results) {
    rawValues[r.code] = r.value;
    if (r.observation_date) observationDates[r.code] = r.observation_date;
  }

  // Bouw historische archive per indicator
  const history: Partial<Record<IndicatorCode, Array<{ date: string; value: number }>>> = {};
  if (existsSync(RAW_HISTORY)) {
    const histBatches = JSON.parse(readFileSync(RAW_HISTORY, "utf-8")) as PipelineBatch[];
    for (const code of INDICATOR_CODES) {
      if (INDICATORS[code].deterministic) continue;
      history[code] = histBatches.flatMap((b) =>
        b.results
          .filter((r) => r.code === code)
          .map((r) => ({ date: r.date, value: r.value })),
      );
    }
  }

  const compositeHistory = existsSync(COMPOSITE_HISTORY)
    ? (JSON.parse(readFileSync(COMPOSITE_HISTORY, "utf-8")) as Array<{ date: string; value: number }>)
    : [];

  const secondarySignals = (today.secondary ?? []).map((s) => ({
    code: s.code,
    name: SECONDARY_NAMES[s.code] ?? s.code,
    value: s.value,
    source: s.source ?? "",
    simulated: s.simulated,
    observation_date: s.observation_date ?? "",
  }));

  const output = computeDaily({
    date: today.target_date,
    rawValues,
    history,
    compositeHistory,
    simulatedIndicators: today.simulated_codes,
    imputedIndicators: today.imputed_codes,
    observationDates,
    secondarySignals,
  });

  // Update composite-history
  compositeHistory.push({ date: today.target_date, value: output.composite.equal });
  const trimmed = compositeHistory.slice(-730);

  // Update sparkline (last 60 entries)
  const spark = trimmed.slice(-60).map((c) => ({
    date: c.date,
    composite: c.value,
    percentile: 0,
    tier: "green" as const,
  }));

  for (const target of [OUT_DATA, OUT_WEB]) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(output, null, 2));
  }
  for (const target of [SPARK_DATA, SPARK_WEB]) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(spark, null, 2));
  }
  writeFileSync(COMPOSITE_HISTORY, JSON.stringify(trimmed, null, 2));

  console.log(`✓ daily-output:  ${OUT_DATA}`);
  console.log(`  Tier:        ${output.tier.current}`);
  console.log(`  Percentile:  P${output.percentile.short_24m}`);
  console.log(`  Composite:   ${output.composite.equal} (equal), ${output.composite.evidence_graded} (evidence)`);
  console.log(`  Simulated:   ${output.data_quality.indicators_simulated.length}/${INDICATOR_CODES.length} indicators`);
}

main();
```

#### `app/engine/src/cli/generate-fixture.ts`

```ts
/**
 * Fixture-generator: produceert een realistische daily-output.json plus 60 dagen
 * sparkline-historie, op basis van gesimuleerde indicator-waarden.
 *
 * Wordt gebruikt als fallback wanneer de Python pipeline nog niet gedraaid heeft.
 * Alle gesimuleerde indicatoren worden expliciet als `simulated: true` gemarkeerd.
 *
 * Run: npm run compute -- --out ../../data/latest.json
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { INDICATOR_CODES, INDICATORS } from "../indicators/registry.js";
import { computeAllDeterministic } from "../indicators/deterministic.js";
import { computeDaily } from "../runtime.js";
import type { IndicatorCode } from "../types.js";

/** Optioneel: pipeline-output kan vandaag's waarden leveren (echt-tijd). */
interface PipelineResult {
  code: string;
  value: number;
  simulated: boolean;
  source?: string;
  observation_date?: string;
}
interface PipelineBatch {
  target_date: string;
  results: PipelineResult[];
  secondary?: PipelineResult[];
}

/** Vriendelijke namen voor secundaire signalen. */
const SECONDARY_NAMES: Record<string, string> = {
  "I-D5-006S": "Reddit-sentiment (onderstroom-peiling)",
  "I-D3-003S": "Ontslag-radar (nieuws-detectie)",
};

function loadPipelineToday(path: string): {
  realValues: Partial<Record<IndicatorCode, number>>;
  realCodes: Set<IndicatorCode>;
  observationDates: Partial<Record<IndicatorCode, string>>;
  secondarySignals: Array<{ code: string; name: string; value: number; source: string; simulated: boolean; observation_date: string }>;
} {
  const realValues: Partial<Record<IndicatorCode, number>> = {};
  const realCodes = new Set<IndicatorCode>();
  const observationDates: Partial<Record<IndicatorCode, string>> = {};
  let secondarySignals: Array<{ code: string; name: string; value: number; source: string; simulated: boolean; observation_date: string }> = [];
  if (!existsSync(path)) return { realValues, realCodes, observationDates, secondarySignals };
  try {
    const batch = JSON.parse(readFileSync(path, "utf-8")) as PipelineBatch;
    for (const r of batch.results) {
      if (r.observation_date) observationDates[r.code as IndicatorCode] = r.observation_date;
      if (!r.simulated) {
        realValues[r.code as IndicatorCode] = r.value;
        realCodes.add(r.code as IndicatorCode);
      }
    }
    secondarySignals = (batch.secondary ?? []).map((s) => ({
      code: s.code,
      name: SECONDARY_NAMES[s.code] ?? s.code,
      value: s.value,
      source: s.source ?? "",
      simulated: s.simulated,
      observation_date: s.observation_date ?? "",
    }));
  } catch {
    // pipeline output is corrupt — fallback naar volledig synthetisch
  }
  return { realValues, realCodes, observationDates, secondarySignals };
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT = resolve(__dirname, "../../../data/latest.json");
const SPARKLINE_OUT = resolve(__dirname, "../../../data/sparkline-30d.json");
const SIGNAL_OUT = resolve(__dirname, "../../../data/signal.json");
const WEB_OUT = resolve(__dirname, "../../../web/public/data/latest.json");
const WEB_SPARKLINE_OUT = resolve(__dirname, "../../../web/public/data/sparkline-30d.json");
const WEB_SIGNAL_OUT = resolve(__dirname, "../../../web/public/data/signal.json");
const WEB_API_OUT = resolve(__dirname, "../../../web/public/api/v1/signal.json");
const PIPELINE_OUT = resolve(__dirname, "../../../data/raw-values.json");
const HISTORY_DIR = resolve(__dirname, "../../../data/history");

const TODAY = new Date();

/**
 * Echte historische reeksen per indicator (bv. de GDELT 24m-nieuwstoon-backfill
 * voor I-D5-001, zie app/pipeline/scripts/backfill_gdelt_baseline.py).
 * Waar zo'n bestand bestaat, vervangt het de synthetische baseline — de
 * dagwaarde wordt dan tegen ECHTE historie gewogen op dezelfde schaal.
 */
function loadRealHistory(): Partial<Record<IndicatorCode, Array<{ date: string; value: number }>>> {
  const out: Partial<Record<IndicatorCode, Array<{ date: string; value: number }>>> = {};
  if (!existsSync(HISTORY_DIR)) return out;
  for (const code of INDICATOR_CODES) {
    const p = resolve(HISTORY_DIR, `${code}.json`);
    if (!existsSync(p)) continue;
    try {
      const rows = JSON.parse(readFileSync(p, "utf-8")) as Array<{ date: string; value: number }>;
      if (Array.isArray(rows) && rows.length > 0) out[code] = rows;
    } catch {
      // corrupt historiebestand — negeer, val terug op synthetisch
    }
  }
  return out;
}

/** Realistische ruw-waarde-generatie met seizoens-modulatie. */
function syntheticRawValue(code: IndicatorCode, date: Date): number {
  const doy = (date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 0)) / 86400000;
  const yearProg = (doy / 365) * 2 * Math.PI;

  // Deterministische indicatoren komen niet uit deze synthese — die rekent de engine zelf
  switch (code) {
    case "I-D1-002": // Hitte
      return Math.max(0, 18 + 10 * Math.sin(yearProg - Math.PI / 2) + (Math.random() - 0.5) * 6);
    case "I-D1-003": // Kou
      return Math.max(0, 5 - 8 * Math.cos(yearProg) + (Math.random() - 0.5) * 4);
    case "I-D1-004": // Luchtkwaliteit (ratio tov WHO)
      return 0.8 + 0.3 * Math.cos(yearProg) + (Math.random() - 0.5) * 0.3;
    case "I-D2-001": // Filezwaarte (km·min)
      return 6500 + 1500 * Math.cos(yearProg - 0.5) + (Math.random() - 0.5) * 1500;
    case "I-D2-004": // Brandstofprijs (€/l)
      return 1.85 + 0.15 * Math.sin(yearProg) + (Math.random() - 0.5) * 0.08;
    case "I-D3-001": // CPI yoy %
      return 2.5 + 0.5 * Math.sin(yearProg / 2) + (Math.random() - 0.5) * 0.4;
    case "I-D3-002": // Energie €/MWh
      return 80 + 25 * Math.cos(yearProg) + (Math.random() - 0.5) * 15;
    case "I-D3-003": // log(1 + ontslagen)
      return Math.log(1 + 100 + 50 * Math.cos(yearProg + 1) + (Math.random() - 0.5) * 80);
    case "I-D3-005": // Werkloosheid %
      return 6.2 + (Math.random() - 0.5) * 0.4;
    case "I-D3-006": // Hypotheekrente %
      return 3.4 + (Math.random() - 0.5) * 0.2;
    case "I-D5-001": // Nieuwsneg (GDELT tone — fallback rond echte mediaan ~1.4)
      return Math.max(0, 1.4 + 0.6 * Math.sin(yearProg * 1.5) + (Math.random() - 0.5) * 0.9);
    case "I-D5-002": // Wikipedia-aandachts-index (per miljoen, fallback ~28)
      return Math.max(0, 28 + 6 * Math.sin(yearProg) + (Math.random() - 0.5) * 8);
    case "I-D5-003": // Collectieve gebeurtenissen 0-15
      return Math.random() < 0.05 ? Math.floor(Math.random() * 6) : 0;
    case "I-D1-009": // Wateroverlast-index (~1.0)
      return Math.max(0, 1.05 + (Math.random() - 0.5) * 0.3);
    case "I-D1-010": // Pollen (seizoensgebonden, lente-piek)
      return Math.max(0, 2 + 4 * Math.max(0, Math.sin(yearProg - 1)) + (Math.random() - 0.5) * 2);
    case "I-D2-009": // Treinverstoringen (aantal)
      return Math.max(0, 3 + (Math.random() - 0.5) * 4);
    case "I-D3-009": // Stroomnet-druk (ratio gemeten/voorspeld ~1.0)
      return Math.max(0, 1.0 + (Math.random() - 0.5) * 0.08);
    default:
      return 0;
  }
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function generate(): void {
  // Bouw 24 maanden historie per niet-deterministische indicator
  const historyDays = 730;
  const history: Partial<Record<IndicatorCode, Array<{ date: string; value: number }>>> = {};

  // Echte historische reeksen (GDELT-backfill e.d.) + snelle datum→waarde-lookup
  const realHistory = loadRealHistory();
  const realHistMaps: Partial<Record<IndicatorCode, Map<string, number>>> = {};
  for (const code of INDICATOR_CODES) {
    const rows = realHistory[code];
    if (rows) realHistMaps[code] = new Map(rows.map((r) => [r.date, r.value]));
  }

  const simulatedCodes: IndicatorCode[] = [];
  const realBaselineCodes: IndicatorCode[] = [];
  for (const code of INDICATOR_CODES) {
    const meta = INDICATORS[code];
    if (meta.deterministic) continue;
    simulatedCodes.push(code);
    const real = realHistory[code];
    if (real && real.length >= 60) {
      history[code] = real;
      realBaselineCodes.push(code);
      continue;
    }
    const series: Array<{ date: string; value: number }> = [];
    for (let i = historyDays; i > 0; i--) {
      const d = new Date(TODAY.getTime() - i * 86400000);
      series.push({ date: isoDate(d), value: syntheticRawValue(code, d) });
    }
    history[code] = series;
  }

  // Deterministische indicatoren krijgen een ECHTE historie: hun waarde is een
  // reproduceerbare functie van de datum (daglicht, kalender), dus we berekenen
  // ze gewoon voor elke dag in het venster. Zo wegen ook deze indicatoren tegen
  // echte historie i.p.v. een lege baseline (z=0) zoals voorheen.
  for (let i = historyDays; i > 0; i--) {
    const d = new Date(TODAY.getTime() - i * 86400000);
    const iso = isoDate(d);
    const det = computeAllDeterministic(d);
    for (const [code, value] of Object.entries(det)) {
      (history[code as IndicatorCode] ??= []).push({ date: iso, value });
    }
  }

  // Bouw composiet-historie laatste 60 dagen door engine ineen-te-roepen per dag
  const compositeHistory: Array<{ date: string; value: number }> = [];
  const sparkline: Array<{ date: string; composite: number; percentile: number; tier: string }> = [];

  for (let i = 60; i > 0; i--) {
    const d = new Date(TODAY.getTime() - i * 86400000);
    const iso = isoDate(d);

    const rawValues: Partial<Record<IndicatorCode, number>> = {};
    for (const code of simulatedCodes) {
      // Echte historie waar beschikbaar, anders synthetisch
      rawValues[code] = realHistMaps[code]?.get(iso) ?? syntheticRawValue(code, d);
    }

    const out = computeDaily({
      date: iso,
      rawValues,
      history,
      compositeHistory,
      simulatedIndicators: simulatedCodes,
    });

    compositeHistory.push({ date: iso, value: out.composite.equal });
    sparkline.push({
      date: iso,
      composite: out.composite.equal,
      percentile: out.percentile.short_24m,
      tier: out.tier.current,
    });
  }

  // Vandaag — eerst synthetisch invullen, dan ECHTE waarden van de pipeline overschrijven
  const todayIso = isoDate(TODAY);
  const { realValues, realCodes, observationDates, secondarySignals } = loadPipelineToday(PIPELINE_OUT);

  const todayRaw: Partial<Record<IndicatorCode, number>> = {};
  for (const code of simulatedCodes) {
    todayRaw[code] = realValues[code] ?? syntheticRawValue(code, TODAY);
  }

  // Update simulated-lijst: indicatoren waarvoor pipeline ECHTE data leverde, zijn niet meer simulated
  const stillSimulatedToday = simulatedCodes.filter((c) => !realCodes.has(c));

  const detToday = computeAllDeterministic(TODAY);
  const todayOutput = computeDaily({
    date: todayIso,
    rawValues: { ...todayRaw, ...detToday } as Partial<Record<IndicatorCode, number>>,
    history,
    compositeHistory,
    simulatedIndicators: stillSimulatedToday,
    observationDates,
    secondarySignals,
  });

  if (realCodes.size > 0) {
    console.log(`  Real-time overrides van pipeline: ${[...realCodes].join(", ")}`);
  }
  if (realBaselineCodes.length > 0) {
    console.log(`  Echte historische baseline: ${realBaselineCodes.join(", ")}`);
  }

  sparkline.push({
    date: todayIso,
    composite: todayOutput.composite.equal,
    percentile: todayOutput.percentile.short_24m,
    tier: todayOutput.tier.current,
  });

  for (const target of [DEFAULT_OUT, WEB_OUT]) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(todayOutput, null, 2));
  }
  for (const target of [SPARKLINE_OUT, WEB_SPARKLINE_OUT]) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(sparkline, null, 2));
  }

  // Minimale signal-API (doc 06 §4.2) — voor lichte clients (banner-embed)
  const signal = {
    timestamp: todayOutput.timestamp,
    week_iso: todayOutput.week_iso,
    condition_level: todayOutput.condition_level,
    tier: todayOutput.tier.current,
    percentile_24m: todayOutput.percentile.short_24m,
    brand_safety_flag: todayOutput.brand_safety.flag,
    valid_until: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    methodology_version: todayOutput.data_quality.methodology_version,
  };
  for (const target of [SIGNAL_OUT, WEB_SIGNAL_OUT, WEB_API_OUT]) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(signal, null, 2));
  }

  console.log(`✓ Daily output:  ${DEFAULT_OUT}`);
  console.log(`✓ Sparkline 60d: ${SPARKLINE_OUT}`);
  console.log(`✓ Signal API:    ${WEB_API_OUT}`);
  console.log(`✓ Web copy:      ${WEB_OUT}`);
  console.log(`  CN level:    ${todayOutput.condition_level.value} (${todayOutput.condition_level.name})`);
  console.log(`  Tier: ${todayOutput.tier.current}`);
  console.log(`  Percentile (short_24m): ${todayOutput.percentile.short_24m}`);
  console.log(`  Composite equal: ${todayOutput.composite.equal}`);
  console.log(`  Composite evidence-graded: ${todayOutput.composite.evidence_graded}`);
}

generate();
```

#### `app/engine/src/data/calendar-be.ts`

```ts
/**
 * Belgische kalender — feestdagen, schoolvakanties, examenperiodes, fiscale deadlines.
 * Bron: doc 03_Laag-4 §2.4 + §2.6.
 *
 * Bevroren data 2024-2030. Bij update buiten dit venster: log een ontbrekende-data-vlag.
 */

/** Federale feestdagen — ISO YYYY-MM-DD. */
export const FEDERAL_HOLIDAYS: string[] = [
  // 2024
  "2024-01-01", "2024-04-01", "2024-05-01", "2024-05-09", "2024-05-20",
  "2024-07-21", "2024-08-15", "2024-11-01", "2024-11-11", "2024-12-25",
  // 2025
  "2025-01-01", "2025-04-21", "2025-05-01", "2025-05-29", "2025-06-09",
  "2025-07-21", "2025-08-15", "2025-11-01", "2025-11-11", "2025-12-25",
  // 2026
  "2026-01-01", "2026-04-06", "2026-05-01", "2026-05-14", "2026-05-25",
  "2026-07-21", "2026-08-15", "2026-11-01", "2026-11-11", "2026-12-25",
  // 2027
  "2027-01-01", "2027-03-29", "2027-05-01", "2027-05-06", "2027-05-17",
  "2027-07-21", "2027-08-15", "2027-11-01", "2027-11-11", "2027-12-25",
  // 2028
  "2028-01-01", "2028-04-17", "2028-05-01", "2028-05-25", "2028-06-05",
  "2028-07-21", "2028-08-15", "2028-11-01", "2028-11-11", "2028-12-25",
];

/** Schoolvakanties Vlaanderen, ranges [start, end] inclusief. */
export const VL_SCHOOL_HOLIDAYS: Array<{ start: string; end: string; name: string }> = [
  { start: "2024-10-28", end: "2024-11-03", name: "Herfstvakantie" },
  { start: "2024-12-23", end: "2025-01-05", name: "Kerstvakantie" },
  { start: "2025-02-24", end: "2025-03-02", name: "Krokusvakantie" },
  { start: "2025-04-07", end: "2025-04-20", name: "Paasvakantie" },
  { start: "2025-07-01", end: "2025-08-31", name: "Zomervakantie" },
  { start: "2025-10-27", end: "2025-11-02", name: "Herfstvakantie" },
  { start: "2025-12-22", end: "2026-01-04", name: "Kerstvakantie" },
  { start: "2026-02-16", end: "2026-02-22", name: "Krokusvakantie" },
  { start: "2026-04-06", end: "2026-04-19", name: "Paasvakantie" },
  { start: "2026-07-01", end: "2026-08-31", name: "Zomervakantie" },
  { start: "2026-10-26", end: "2026-11-01", name: "Herfstvakantie" },
  { start: "2026-12-21", end: "2027-01-03", name: "Kerstvakantie" },
  { start: "2027-02-15", end: "2027-02-21", name: "Krokusvakantie" },
  { start: "2027-03-29", end: "2027-04-11", name: "Paasvakantie" },
  { start: "2027-07-01", end: "2027-08-31", name: "Zomervakantie" },
];

/** Examenperiodes hoger onderwijs + CSE secundair. Doc 03 §2.6. */
export const EXAM_PERIODS: Array<{ start: string; end: string; level: "ho1" | "ho2" | "cse" }> = [
  { start: "2025-01-05", end: "2025-01-30", level: "ho1" },
  { start: "2025-05-19", end: "2025-06-14", level: "ho2" },
  { start: "2025-06-01", end: "2025-06-30", level: "cse" },
  { start: "2026-01-05", end: "2026-01-30", level: "ho1" },
  { start: "2026-05-19", end: "2026-06-14", level: "ho2" },
  { start: "2026-06-01", end: "2026-06-30", level: "cse" },
  { start: "2027-01-05", end: "2027-01-30", level: "ho1" },
  { start: "2027-05-19", end: "2027-06-14", level: "ho2" },
  { start: "2027-06-01", end: "2027-06-30", level: "cse" },
];

/** Belastingaangifte-weken (FOD Financiën — papieren + Tax-on-web aangifte). */
export const TAX_DEADLINE_WEEKS: Array<{ start: string; end: string }> = [
  // Aangifte typisch eind juni (papier) en mid-juli (digitaal)
  { start: "2025-06-23", end: "2025-07-15" },
  { start: "2026-06-22", end: "2026-07-15" },
  { start: "2027-06-21", end: "2027-07-15" },
];

/** DST-overgangen — laatste zondag maart + laatste zondag oktober. */
export const DST_TRANSITIONS: string[] = [
  "2024-03-31", "2024-10-27",
  "2025-03-30", "2025-10-26",
  "2026-03-29", "2026-10-25",
  "2027-03-28", "2027-10-31",
  "2028-03-26", "2028-10-29",
];
```

#### `app/engine/src/index.ts`

```ts
/**
 * SBI Engine — publieke API.
 * Bron-documenten: 01_Anker-Paper.md t/m 09_Brand-Message-Style-Guide.md.
 */

export * from "./types.js";
export { INDICATORS, INDICATOR_CODES, DOMAIN_NAMES, indicatorsByDomain, allDomains } from "./indicators/registry.js";
export { computeAllDeterministic, daylightHours } from "./indicators/deterministic.js";
export { computeBaseline, zscore, median, madScaled } from "./methodology/zscore.js";
export { stlResidual, dayOfYear } from "./methodology/stl.js";
export { winsorize, WINSOR_BOUND } from "./methodology/winsorize.js";
export {
  SCHEMA_2_DOMAIN_WEIGHTS,
  indicatorWeight,
  domainWeight,
  verifyWeightsSumToOne,
} from "./methodology/weights.js";
export {
  computeComposite,
  computeCompositeWithoutD5,
  computeDemographicComposite,
  pearsonCorrelation,
} from "./methodology/composite.js";
export {
  DEMOGRAPHIC_REACH,
  TOTAL_REACH,
  demographicWeight,
} from "./methodology/demographic-reach.js";
export { percentileRank } from "./methodology/percentile.js";
export {
  computeTier,
  AMBER_THRESHOLD,
  RED_THRESHOLD,
  SUSTAINED_DAYS,
} from "./methodology/tier.js";
export {
  computeConditionLevel,
  CONDITION_NAMES,
  type ConditionLevel as MethodologyConditionLevel,
  type ConditionState,
} from "./methodology/condition-level.js";
export { computeDaily, type DailyComputeInput } from "./runtime.js";
```

#### `app/engine/src/indicators/deterministic.ts`

```ts
/**
 * Tier-A indicatoren: deterministisch, direct uitvoerbaar zonder externe data.
 * Bron: doc 03_Laag-4 §2.1, §2.4, §2.6.
 *
 * Geïmplementeerd:
 *  • I-D1-001 Daglichturen (NOAA Solar Calculator — Brussel 50.85°N, 4.35°E)
 *  • I-D4-001 Kalendarische deadlinepieken
 *  • I-D4-002 Schoolvakantie-zonder-opvang (weighted)
 *  • I-D6-001 Dagen tot volgende vakantie
 *  • I-D6-002 Weekdag-cyclus (cyclisch belastings-signaal ma-vr-cluster)
 *  • I-D6-003 Klok-verzetten (exp decay 7d)
 *  • I-D6-005 Examenperiode
 */

import {
  FEDERAL_HOLIDAYS,
  VL_SCHOOL_HOLIDAYS,
  EXAM_PERIODS,
  TAX_DEADLINE_WEEKS,
  DST_TRANSITIONS,
} from "../data/calendar-be.js";

// Brussel als geografische referentie — doc 03 §1.2
const BRUSSELS_LAT = 50.85;

/**
 * I-D1-001 — Daglichturen.
 * Doc 03 §2.1: uren tussen astronomische zonsopgang en zonsondergang op datum d.
 * Implementatie volgt NOAA Solar Position Algorithm (vereenvoudigd voor één breedtegraad).
 */
export function daylightHours(date: Date, latitude = BRUSSELS_LAT): number {
  const dayOfYear = computeDayOfYear(date);

  // Solar declination (Spencer 1971-formule, geldig binnen ±0.4°)
  const gamma = (2 * Math.PI * (dayOfYear - 1)) / 365;
  const declRad =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const latRad = (latitude * Math.PI) / 180;
  const cosH = -Math.tan(latRad) * Math.tan(declRad);

  if (cosH > 1) return 0;   // poolnacht
  if (cosH < -1) return 24; // poolzomer

  const hourAngle = Math.acos(cosH);
  const daylight = (24 * hourAngle) / Math.PI;
  return Math.round(daylight * 10000) / 10000;
}

/**
 * I-D4-001 — Kalendarische deadlinepieken.
 * Doc 03 §2.4: +1 in belastingaangifte-week, +1 in kwartaaleinde-week, +2 in jaareinde-week.
 */
export function deadlinePeak(date: Date): number {
  const iso = toIsoDate(date);
  let score = 0;

  if (TAX_DEADLINE_WEEKS.some((w) => iso >= w.start && iso <= w.end)) score += 1;

  // Kwartaaleinde-week (laatste 7 dagen van mrt/jun/sep/dec)
  const m = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), m, 0)).getUTCDate();
  const isQuarterEnd = [3, 6, 9, 12].includes(m) && day > lastDay - 7;
  if (isQuarterEnd) score += 1;

  // Jaareinde-week
  if (m === 12 && day >= 25) score += 2;

  return Math.min(score, 3);
}

/**
 * I-D4-002 — Schoolvakantie-zonder-opvang, weighted.
 * Doc 03 §2.4: SH × (1 + duration_remaining/total_duration), 0 op zondag.
 */
export function schoolVacationWeighted(date: Date): number {
  if (date.getUTCDay() === 0) return 0;
  const iso = toIsoDate(date);
  const period = VL_SCHOOL_HOLIDAYS.find((p) => iso >= p.start && iso <= p.end);
  if (!period) return 0;

  const start = new Date(period.start + "T00:00:00Z").getTime();
  const end = new Date(period.end + "T00:00:00Z").getTime();
  const now = new Date(iso + "T00:00:00Z").getTime();
  const totalDays = (end - start) / 86400000 + 1;
  const remaining = (end - now) / 86400000 + 1;
  return 1 * (1 + remaining / totalDays);
}

/**
 * I-D6-001 — Dagen tot volgende vakantie (officiële feestdag of schoolvakantie).
 * Doc 03 §2.6.
 */
export function daysUntilNextVacation(date: Date): number {
  const iso = toIsoDate(date);
  const candidates: number[] = [];

  for (const h of FEDERAL_HOLIDAYS) {
    if (h >= iso) candidates.push(daysBetween(iso, h));
  }
  for (const v of VL_SCHOOL_HOLIDAYS) {
    if (v.start >= iso) candidates.push(daysBetween(iso, v.start));
  }
  if (candidates.length === 0) return 365;
  return Math.min(...candidates);
}

/**
 * I-D6-002 — Weekdag-cyclus.
 * Doc 03 §2.6: 6 dummies, zondag = referentie. We collapsen tot één continue
 * waarde 0-1 voor compositie: hoogste belasting di-do (klassiek Helliwell-patroon).
 */
export function weekdayLoad(date: Date): number {
  const dow = date.getUTCDay(); // 0=zo, 1=ma, ..., 6=za
  const pattern: Record<number, number> = {
    0: 0.0, // zondag — referentie
    1: 0.6, // maandag — opwarming
    2: 0.9, // dinsdag
    3: 1.0, // woensdag — piek
    4: 0.9, // donderdag
    5: 0.4, // vrijdag — afkoeling
    6: 0.1, // zaterdag
  };
  return pattern[dow];
}

/**
 * I-D6-003 — Klok-verzetten effect.
 * Doc 03 §2.6: exp(-(d - d_DST)/3) voor 0 ≤ (d - d_DST) ≤ 7.
 */
export function dstEffect(date: Date): number {
  const iso = toIsoDate(date);
  for (const transition of DST_TRANSITIONS) {
    if (transition <= iso) {
      const days = daysBetween(transition, iso);
      if (days >= 0 && days <= 7) return Math.exp(-days / 3);
    }
  }
  return 0;
}

/**
 * I-D6-005 — Examenperiode.
 * Doc 03 §2.6: binair voor 1e/2e examenperiode HO + CSE secundair.
 * Output: aantal overlappende periodes (0-3) — som geeft sterker signaal in
 * juni wanneer HO2 + CSE overlappen.
 */
export function examPeriod(date: Date): number {
  const iso = toIsoDate(date);
  return EXAM_PERIODS.filter((p) => iso >= p.start && iso <= p.end).length;
}

// --- helpers ---

function computeDayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const now = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((now - start) / 86400000) + 1;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBetween(isoA: string, isoB: string): number {
  const a = new Date(isoA + "T00:00:00Z").getTime();
  const b = new Date(isoB + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}

/** Bundel alle deterministische indicatoren voor één datum. */
export function computeAllDeterministic(date: Date): Record<string, number> {
  return {
    "I-D1-001": daylightHours(date),
    "I-D4-001": deadlinePeak(date),
    "I-D4-002": schoolVacationWeighted(date),
    "I-D6-001": daysUntilNextVacation(date),
    "I-D6-002": weekdayLoad(date),
    "I-D6-003": dstEffect(date),
    "I-D6-005": examPeriod(date),
  };
}
```

#### `app/engine/src/indicators/plain-language.ts`

```ts
/**
 * Plain-Dutch beschrijvingen per indicator + klikbare bronnen.
 *
 * Per indicator:
 *  - plain      : korte naam
 *  - why        : waarom dit in de index staat (15-jarig niveau)
 *  - reads      : wat we feitelijk uitlezen
 *  - unit       : eenheid van de waarde
 *  - dataSource : naam + URL van de officiële databron
 *  - references : 1-2 wetenschappelijke onderbouwingen met DOI/URL
 */

import type { IndicatorCode } from "../types.js";

export interface PlainReference {
  label: string;
  url: string;
}

export interface PlainDataSource {
  name: string;
  url: string;
}

export interface PlainLanguageMeta {
  plain: string;
  why: string;
  reads: string;
  unit: string;
  dataSource: PlainDataSource;
  references: PlainReference[];
}

export const PLAIN: Record<IndicatorCode, PlainLanguageMeta> = {
  "I-D1-001": {
    plain: "Daglicht",
    why: "Als de zon vaker schijnt, voelen mensen zich gemiddeld beter.",
    reads: "Hoeveel uur het vandaag licht is.",
    unit: "uur",
    dataSource: { name: "NOAA Solar Calculator (astronomisch)", url: "https://gml.noaa.gov/grad/solcalc/" },
    references: [
      { label: "Rosenthal et al. (1984): SAD originele beschrijving", url: "https://doi.org/10.1001/archpsyc.1984.01790120076010" },
      { label: "Golden et al. (2005): lichttherapie meta-analyse", url: "https://doi.org/10.1176/appi.ajp.162.4.656" },
    ],
  },
  "I-D1-002": {
    plain: "Hitte",
    why: "Hitte maakt slapen moeilijker en zorgt voor extra spanning in het lichaam.",
    reads: "Hoeveel graden warmer dan 30°C het vandaag is.",
    unit: "°C boven 30",
    dataSource: { name: "KMI (via open-meteo)", url: "https://www.meteo.be" },
    references: [
      { label: "Hajat et al. (2010): Lancet, hitte en gezondheid", url: "https://doi.org/10.1016/S0140-6736(09)61711-6" },
      { label: "Thompson et al. (2018): hitte en mentale gezondheid", url: "https://doi.org/10.1016/j.scitotenv.2018.01.121" },
    ],
  },
  "I-D1-003": {
    plain: "Koude",
    why: "Extreme kou belast de gezondheid én de portefeuille (verwarming).",
    reads: "Hoeveel graden kouder dan -5°C het vannacht was.",
    unit: "°C onder -5",
    dataSource: { name: "KMI (via open-meteo)", url: "https://www.meteo.be" },
    references: [
      { label: "Hajat et al. (2017): koude en mortaliteit", url: "https://doi.org/10.1136/jech-2016-208439" },
    ],
  },
  "I-D1-004": {
    plain: "Luchtkwaliteit",
    why: "Vuile lucht (fijnstof, ozon) hangt samen met meer somberheid en prikkelbaarheid.",
    reads: "Hoe schoon de lucht is vergeleken met wat de WHO gezond noemt.",
    unit: "× WHO-grens",
    dataSource: { name: "IRCEL-CELINE", url: "https://www.irceline.be" },
    references: [
      { label: "Braithwaite et al. (2019): luchtvervuiling en mentale gezondheid", url: "https://doi.org/10.1289/EHP4595" },
      { label: "Newbury et al. (2019): JAMA Psychiatry", url: "https://doi.org/10.1001/jamapsychiatry.2019.0056" },
    ],
  },
  "I-D2-001": {
    plain: "Verkeersdrukte",
    why: "Lang in de file staan verhoogt stresshormonen.",
    reads: "Hoeveel kilometer file × hoeveel minuten ze duurden, in de spits.",
    unit: "km·min",
    dataSource: { name: "Vlaams Verkeerscentrum", url: "https://www.verkeerscentrum.be" },
    references: [
      { label: "Novaco, Stokols & Milanesi (1990): pendel en stress", url: "https://doi.org/10.1007/BF00931303" },
      { label: "Chatterjee et al. (2020): Transport Reviews", url: "https://doi.org/10.1080/01441647.2019.1649317" },
    ],
  },
  "I-D2-004": {
    plain: "Brandstofprijs",
    why: "Wanneer tanken duurder wordt, voelen veel gezinnen dat in hun budget.",
    reads: "De officiële maximumprijs van Euro95.",
    unit: "€/liter",
    dataSource: { name: "FOD Economie", url: "https://economie.fgov.be/nl/themas/energie/energieprijzen" },
    references: [
      { label: "Brüggen et al. (2017): financieel welzijn", url: "https://doi.org/10.1016/j.jbusres.2017.03.013" },
    ],
  },
  "I-D3-001": {
    plain: "Inflatie (prijzen stijgen)",
    why: "Als alles duurder wordt, valt geld korter, dat geeft druk.",
    reads: "Hoeveel duurder de gemiddelde boodschap is dan een jaar geleden.",
    unit: "% per jaar",
    dataSource: { name: "STATBEL", url: "https://statbel.fgov.be/nl/themas/consumptieprijzen/consumptieprijsindex" },
    references: [
      { label: "Brüggen et al. (2017): financieel welzijn", url: "https://doi.org/10.1016/j.jbusres.2017.03.013" },
      { label: "Kahneman & Tversky (1979): Prospect Theory", url: "https://doi.org/10.2307/1914185" },
    ],
  },
  "I-D3-002": {
    plain: "Energieprijs",
    why: "Verwarming en elektriciteit zijn een grote uitgave die je moeilijk kan vermijden.",
    reads: "De wekelijkse spotprijs voor gas en elektriciteit.",
    unit: "€/MWh",
    dataSource: { name: "ENTSO-E Transparency", url: "https://transparency.entsoe.eu" },
    references: [
      { label: "Thomson, Snell & Bouzarovski (2017): energiearmoede Europa", url: "https://doi.org/10.3390/ijerph14060584" },
      { label: "Liddell & Morris (2010): fuel poverty en gezondheid", url: "https://doi.org/10.1016/j.enpol.2010.02.037" },
    ],
  },
  "I-D3-003": {
    plain: "Ontslagen aangekondigd",
    why: "Als ergens een collectief ontslag wordt aangekondigd, voelt iedereen op die werkplek dat, ook wie niet ontslagen wordt.",
    reads: "Hoeveel werknemers er deze week in een ontslagprocedure zitten.",
    unit: "log(werknemers)",
    dataSource: { name: "FOD WASO", url: "https://werk.belgie.be/nl/themas/herstructureringen" },
    references: [
      { label: "Brand (2015): Annual Review of Sociology", url: "https://doi.org/10.1146/annurev-soc-071913-043237" },
      { label: "De Witte et al. (2016): job insecurity review", url: "https://doi.org/10.1111/ap.12176" },
    ],
  },
  "I-D3-005": {
    plain: "Werkloosheid",
    why: "Hogere werkloosheid betekent dat meer mensen het moeilijk hebben, economische druk op het land.",
    reads: "Het percentage werkzoekenden in de beroepsbevolking.",
    unit: "%",
    dataSource: { name: "STATBEL: Werkloosheid", url: "https://statbel.fgov.be/nl/themas/werk-opleiding/werkloosheid" },
    references: [
      { label: "WHO Commission on Social Determinants (2008): Marmot", url: "https://www.who.int/publications/i/item/WHO-IER-CSDH-08.1" },
    ],
  },
  "I-D3-006": {
    plain: "Hypotheekrente",
    why: "Een hogere rente maakt een huis kopen of afbetalen duurder.",
    reads: "De gemiddelde rente voor nieuwe woonleningen.",
    unit: "%",
    dataSource: { name: "Nationale Bank van België", url: "https://stat.nbb.be" },
    references: [
      { label: "Brüggen et al. (2017): financieel welzijn", url: "https://doi.org/10.1016/j.jbusres.2017.03.013" },
    ],
  },
  "I-D4-001": {
    plain: "Werk-deadlines",
    why: "Bepaalde weken pieken samen, belastingaangifte, kwartaaleinde, jaareinde.",
    reads: "Hoeveel grote deadlines er deze week samenvallen.",
    unit: "score 0–3",
    dataSource: { name: "FOD Financiën (fiscale kalender)", url: "https://financien.belgium.be/nl/particulieren/belastingaangifte" },
    references: [
      { label: "Bakker & Demerouti (2007): JD-R model", url: "https://doi.org/10.1108/02683940710733115" },
      { label: "Sonnentag (2018): recovery paradox", url: "https://doi.org/10.1016/j.riob.2018.11.002" },
    ],
  },
  "I-D4-002": {
    plain: "Schoolvakantie",
    why: "Vakantie zonder opvang vraagt extra puzzelwerk van ouders.",
    reads: "Of we in een schoolvakantie zitten, hoe meer dagen nog te gaan hoe zwaarder.",
    unit: "score 0–2",
    dataSource: { name: "Vlaamse onderwijskalender", url: "https://onderwijs.vlaanderen.be/nl/schoolvakanties" },
    references: [
      { label: "Bianchi et al. (2012): werk- en gezinsbelasting", url: "https://doi.org/10.1093/sf/sos120" },
    ],
  },
  "I-D5-001": {
    plain: "Hoe negatief is het nieuws?",
    why: "Veel negatief nieuws beïnvloedt hoe een hele bevolking zich voelt.",
    reads: "We meten de gemiddelde toon van het Belgische nieuws via GDELT, een wetenschappelijk project dat wereldwijd nieuwsberichten leest en de toon ervan scoort. Het grote voordeel: GDELT heeft een echte historie van twee jaar, zodat we vandaag eerlijk kunnen vergelijken met hoe negatief het nieuws gewoonlijk is. Daarnaast lezen we elk uur de titels en intro's van dertien Belgische RSS-bronnen met het Pattern.nl-valentielexicon (Universiteit Antwerpen, 3.000+ woorden, peer-reviewed) en wegen we die naar het leeftijdsprofiel van elk publiek. Bijna-duplicaten worden er eerst uitgefilterd (Jaccard ≥ 0,8), zodat één gebeurtenis niet tienvoudig telt. Per cyclus bewaren we de meest negatieve headlines, zodat elk hoog cijfer terug te leiden is naar concrete koppen.",
    unit: "toon-score",
    dataSource: { name: "GDELT DOC 2.0 nieuwstoon BE + RSS-controle van 13 BE-bronnen", url: "https://www.gdeltproject.org/" },
    references: [
      { label: "Leetaru (2013): GDELT Global Knowledge Graph", url: "https://www.gdeltproject.org/" },
      { label: "Young & Soroka (2012): Affective News, Lexicoder-methode", url: "https://doi.org/10.1080/10584609.2012.671234" },
      { label: "Soroka, Fournier & Nir (2019): PNAS, negativity bias", url: "https://doi.org/10.1073/pnas.1908369116" },
    ],
  },
  "I-D5-002": {
    plain: "Hoeveel mensen lezen over stress?",
    why: "Hoe vaak mensen informatie opzoeken over stress, burn-out of slaapproblemen, vertelt iets over wat er leeft. (Niet perfect, maar wel een bruikbare aanwijzing.)",
    reads: "We tellen elke dag hoe vaak zes Nederlandstalige Wikipedia-artikels over stress-thema's worden bekeken: Stress, Burn-out, Depressie, Angststoornis, Overspannenheid en Slapeloosheid. We delen dat door het totale Wikipedia-verkeer van die dag, zodat alleen de relatieve aandacht voor stress telt en niet de algemene groei of krimp van Wikipedia. Daarna nemen we het gemiddelde over zeven dagen, zodat het weekendeffect wegvalt. We gebruiken Wikipedia in plaats van Google Trends omdat Google zoekdata blokkeert voor servers, terwijl Wikipedia open, betrouwbaar en reproduceerbaar is.",
    unit: "per miljoen weergaven",
    dataSource: { name: "Wikimedia Pageviews API (nl.wikipedia)", url: "https://wikimedia.org/api/rest_v1/" },
    references: [
      { label: "Generous et al. (2014): ziektemonitoring via Wikipedia", url: "https://doi.org/10.1371/journal.pcbi.1003892" },
      { label: "McIver & Brownstein (2014): Wikipedia voor griepmonitoring", url: "https://doi.org/10.1371/journal.pcbi.1003581" },
      { label: "Lazer et al. (2014): Science, parable of Google Flu (waarschuwing)", url: "https://doi.org/10.1126/science.1248506" },
    ],
  },
  "I-D5-003": {
    plain: "Grote gebeurtenis",
    why: "Rampen, terreur, of nationale rouw raken een heel land tegelijk.",
    reads: "Of er recent zo'n gebeurtenis was, met afnemend effect over 7 dagen.",
    unit: "magnitude 0–15",
    dataSource: { name: "Nieuwsmonitoring + menselijke codering", url: "https://www.vrt.be/vrtnws/" },
    references: [
      { label: "Holman, Garfin & Silver (2014): PNAS, Boston Marathon", url: "https://doi.org/10.1073/pnas.1316265110" },
      { label: "Silver et al. (2013): media en collectief trauma", url: "https://doi.org/10.1177/0956797612460406" },
    ],
  },
  "I-D6-001": {
    plain: "Tot de volgende vakantie",
    why: "Weten dat er rust aankomt, helpt mensen om vol te houden.",
    reads: "Hoeveel dagen tot de eerstvolgende feestdag of schoolvakantie.",
    unit: "dagen",
    dataSource: { name: "Federale feestdagen + Vlaamse onderwijskalender", url: "https://onderwijs.vlaanderen.be/nl/schoolvakanties" },
    references: [
      { label: "Fritz & Sonnentag (2005): herstel, gezondheid, werkprestatie", url: "https://doi.org/10.1037/1076-8998.10.3.187" },
      { label: "Sonnentag (2018): recovery paradox", url: "https://doi.org/10.1016/j.riob.2018.11.002" },
    ],
  },
  "I-D6-002": {
    plain: "Welke dag van de week",
    why: "Dinsdag-woensdag-donderdag voelen voor veel mensen het zwaarst, zaterdag-zondag het lichtst.",
    reads: "De dag van de week, vertaald naar een gemiddelde belasting.",
    unit: "0–1",
    dataSource: { name: "Kalender (deterministisch)", url: "https://nl.wikipedia.org/wiki/Week_(tijdsaanduiding)" },
    references: [
      { label: "Stone, Schneider & Harter (2012): weekdag stemmingspatroon", url: "https://doi.org/10.1080/17439760.2012.691980" },
    ],
  },
  "I-D6-003": {
    plain: "Zomertijd/wintertijd",
    why: "Als de klok verzet wordt, raakt het ritme van je lichaam even in de war.",
    reads: "Hoe lang geleden de klok werd verzet (effect dooft uit na 7 dagen).",
    unit: "0–1",
    dataSource: { name: "Wettelijke DST-data EU", url: "https://eur-lex.europa.eu/legal-content/NL/TXT/?uri=CELEX:32000L0084" },
    references: [
      { label: "Manfredini et al. (2018): DST en hartinfarcten", url: "https://doi.org/10.3390/jcm8030404" },
      { label: "Roenneberg et al. (2019): waarom DST afschaffen", url: "https://doi.org/10.1177/0748730419854197" },
    ],
  },
  "I-D6-005": {
    plain: "Examens",
    why: "Examens raken studenten én hun gezinnen tegelijk.",
    reads: "Of er één of meerdere examenperiodes lopen (hoger onderwijs + secundair).",
    unit: "0–3",
    dataSource: { name: "Academische kalender", url: "https://onderwijs.vlaanderen.be" },
    references: [
      { label: "Pascoe, Hetrick & Parker (2020): stress bij studenten", url: "https://doi.org/10.1080/02673843.2019.1596823" },
    ],
  },
  "I-D1-009": {
    plain: "Staat het water gevaarlijk hoog?",
    why: "Hoogwater bedreigt huizen en bezit; de dreiging zelf, ook zonder ramp, veroorzaakt al angst en waakzaamheid.",
    reads: "We kijken naar de waterstanden van meetpunten van de Vlaamse Milieumaatschappij. Staan de hoogste punten ver boven de doorsnee, dan staat het water netbreed hoog.",
    unit: "hoogwater-index",
    dataSource: { name: "Waterinfo.be (VMM / HIC)", url: "https://www.waterinfo.be/" },
    references: [
      { label: "Fernandez et al. (2019): overstromingen en mentale gezondheid", url: "https://doi.org/10.1016/j.ijdrr.2019.101270" },
      { label: "WHO: factsheet overstromingen", url: "https://www.who.int/news-room/fact-sheets/detail/floods" },
    ],
  },
  "I-D1-010": {
    plain: "Hoeveel pollen zit er in de lucht?",
    why: "Hooikoorts verstoort slaap, concentratie en humeur bij heel veel mensen, een seizoensgebonden maar brede stressor.",
    reads: "We tellen voor Brussel hoeveel pollenkorrels van vijf plantensoorten in de lucht zweven: els, berk, gras, bijvoet en ambrosia. Meer korrels betekent meer niezen, jeuk en vermoeidheid.",
    unit: "pollenkorrels/m³",
    dataSource: { name: "open-meteo Air Quality (CAMS)", url: "https://open-meteo.com/" },
    references: [
      { label: "Damialis et al. (2019): pollen en welbevinden", url: "https://doi.org/10.1111/all.13758" },
      { label: "Copernicus: luchtkwaliteit en allergie", url: "https://atmosphere.copernicus.eu/" },
    ],
  },
  "I-D2-009": {
    plain: "Hoeveel treinen rijden er in de soep?",
    why: "Onaangekondigde spoorvertragingen ontnemen pendelaars de controle over hun tijd en aankomst, een directe dagelijkse stressor.",
    reads: "We tellen via de iRail-dienst hoeveel ongeplande storingen er nu op het Belgische spoornet zijn. Geplande werken tellen niet mee, want die ken je op voorhand.",
    unit: "aantal verstoringen",
    dataSource: { name: "iRail API (NMBS/Infrabel)", url: "https://api.irail.be/" },
    references: [
      { label: "Chatterjee et al. (2017): pendelen en welzijn", url: "https://doi.org/10.1016/j.trf.2017.08.002" },
      { label: "APA: controleverlies als stressbron", url: "https://www.apa.org/topics/stress" },
    ],
  },
  "I-D3-009": {
    plain: "Trekt België meer stroom dan verwacht?",
    why: "Een stroomnet dat boven de prognose draait is krapper; krapte voedt prijspieken en, zeldzaam, afschakelrisico, een sluimerende collectieve stressor.",
    reads: "Elia, de netbeheerder, voorspelt elke dag hoeveel stroom België zal verbruiken. Wij delen het echte verbruik door die voorspelling. 1,0 betekent precies zoals verwacht, hoger betekent een drukker net.",
    unit: "ratio gemeten/voorspeld",
    dataSource: { name: "Elia Open Data", url: "https://opendata.elia.be/" },
    references: [
      { label: "Thomson, Snell & Bouzarovski (2019): energie-onzekerheid en welzijn", url: "https://doi.org/10.1016/j.erss.2019.101216" },
      { label: "IEA: zekerheid van elektriciteitsvoorziening", url: "https://www.iea.org/reports/security-of-electricity-supply" },
    ],
  },
};

export type IndicatorState = "rustig" | "normaal" | "verhoogd" | "extreem";

export function zToState(z: number): IndicatorState {
  if (z >= 2) return "extreem";
  if (z >= 1) return "verhoogd";
  if (z >= -1) return "normaal";
  return "rustig";
}

export const STATE_LABELS: Record<IndicatorState, string> = {
  rustig: "lager dan gewoonlijk",
  normaal: "gemiddeld",
  verhoogd: "hoger dan gewoonlijk",
  extreem: "uitzonderlijk hoog",
};
```

#### `app/engine/src/indicators/registry.ts`

```ts
/**
 * Bevroren registry van de 20 primaire indicatoren.
 * Bron: doc 02_Laag-3 §10 + doc 04_Laag-5 §3.2 (STL beslisregel)
 *       + doc 04_Laag-5 §5 (inverse-codering)
 */

import type { IndicatorMeta, IndicatorCode, DomainCode } from "../types.js";

export const INDICATORS: Record<IndicatorCode, IndicatorMeta> = {
  "I-D1-001": {
    code: "I-D1-001",
    name: "Daglichturen",
    domain: "D1",
    grade: "A",
    inverseCoded: true,
    applyStl: false,
    source: "Astronomisch (NOAA Solar Calculator-algoritme)",
    deterministic: true,
  },
  "I-D1-002": {
    code: "I-D1-002",
    name: "Hitte",
    domain: "D1",
    grade: "A",
    inverseCoded: false,
    applyStl: true,
    source: "KMI/RMI Open Data",
    deterministic: false,
  },
  "I-D1-003": {
    code: "I-D1-003",
    name: "Kou",
    domain: "D1",
    grade: "B",
    inverseCoded: false,
    applyStl: true,
    source: "KMI/RMI Open Data",
    deterministic: false,
  },
  "I-D1-004": {
    code: "I-D1-004",
    name: "Luchtkwaliteit",
    domain: "D1",
    grade: "A",
    inverseCoded: false,
    applyStl: true,
    source: "IRCEL-CELINE",
    deterministic: false,
  },
  "I-D1-009": {
    code: "I-D1-009",
    name: "Wateroverlast",
    domain: "D1",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Waterinfo.be (VMM / HIC)",
    deterministic: false,
  },
  "I-D1-010": {
    code: "I-D1-010",
    name: "Pollen",
    domain: "D1",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "open-meteo Air Quality (CAMS)",
    deterministic: false,
  },
  "I-D2-001": {
    code: "I-D2-001",
    name: "Filezwaarte",
    domain: "D2",
    grade: "A",
    inverseCoded: false,
    applyStl: true,
    source: "Vlaams Verkeerscentrum",
    deterministic: false,
  },
  "I-D2-004": {
    code: "I-D2-004",
    name: "Brandstofprijzen",
    domain: "D2",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "FOD Economie maximumprijzen",
    deterministic: false,
  },
  "I-D2-009": {
    code: "I-D2-009",
    name: "Treinverstoringen",
    domain: "D2",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "iRail API (NMBS/Infrabel)",
    deterministic: false,
  },
  "I-D3-001": {
    code: "I-D3-001",
    name: "Consumptieprijsindex",
    domain: "D3",
    grade: "A",
    inverseCoded: false,
    applyStl: true,
    source: "STATBEL",
    deterministic: false,
  },
  "I-D3-002": {
    code: "I-D3-002",
    name: "Energieprijzen",
    domain: "D3",
    grade: "B",
    inverseCoded: false,
    applyStl: true,
    source: "ENTSO-E Transparency / Belpex",
    deterministic: false,
  },
  "I-D3-003": {
    code: "I-D3-003",
    name: "Aangekondigde collectieve ontslagen",
    domain: "D3",
    grade: "A",
    inverseCoded: false,
    applyStl: true,
    source: "FOD WASO",
    deterministic: false,
  },
  "I-D3-005": {
    code: "I-D3-005",
    name: "Werkloosheidscijfer",
    domain: "D3",
    grade: "A",
    inverseCoded: false,
    applyStl: true,
    source: "STATBEL / Steunpunt Werk",
    deterministic: false,
  },
  "I-D3-006": {
    code: "I-D3-006",
    name: "Hypotheekrente",
    domain: "D3",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Nationale Bank van België",
    deterministic: false,
  },
  "I-D3-009": {
    code: "I-D3-009",
    name: "Stroomnet-druk",
    domain: "D3",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Elia Open Data",
    deterministic: false,
  },
  "I-D4-001": {
    code: "I-D4-001",
    name: "Kalendarische deadlinepieken",
    domain: "D4",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Kalender FOD Financiën",
    deterministic: true,
  },
  "I-D4-002": {
    code: "I-D4-002",
    name: "Schoolvakantie-zonder-opvang",
    domain: "D4",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Vlaamse onderwijskalender",
    deterministic: true,
  },
  "I-D5-001": {
    code: "I-D5-001",
    name: "Nieuwsnegativiteits-index",
    domain: "D5",
    grade: "B",
    inverseCoded: false,
    // Geen STL: nieuwsnegativiteit is gebeurtenis-gedreven, niet sterk
    // seizoensgebonden. De echte GDELT 24m-baseline (data/history/I-D5-001.json)
    // dient rechtstreeks als MAD-Z-meetlat. De naïeve voorgaande-jaren-STL
    // produceert bovendien niet-vergelijkbare residuen tussen jaren.
    applyStl: false,
    source: "GDELT Project v2",
    deterministic: false,
  },
  "I-D5-002": {
    code: "I-D5-002",
    name: "Wikipedia-aandacht stress-thema's",
    domain: "D5",
    grade: "B",
    inverseCoded: false,
    // Geen STL: het 7d-gemiddelde verwijdert al het weekdag-effect en de
    // baseline is een recent venster (~11 maanden, drift-gevoelige bron).
    applyStl: false,
    source: "Wikipedia-pageviews (Wikimedia REST API)",
    deterministic: false,
  },
  "I-D5-003": {
    code: "I-D5-003",
    name: "Negatieve collectieve gebeurtenissen",
    domain: "D5",
    grade: "A",
    inverseCoded: false,
    applyStl: false,
    source: "Nieuwsmonitoring + menselijke codering",
    deterministic: false,
  },
  "I-D6-001": {
    code: "I-D6-001",
    name: "Dagen tot volgende vakantie",
    domain: "D6",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Kalender-deterministisch",
    deterministic: true,
  },
  "I-D6-002": {
    code: "I-D6-002",
    name: "Weekdag-cyclus",
    domain: "D6",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Kalender-deterministisch",
    deterministic: true,
  },
  "I-D6-003": {
    code: "I-D6-003",
    name: "Klok-verzetten",
    domain: "D6",
    grade: "A",
    inverseCoded: false,
    applyStl: false,
    source: "Kalender-deterministisch",
    deterministic: true,
  },
  "I-D6-005": {
    code: "I-D6-005",
    name: "Examenperiode",
    domain: "D6",
    grade: "B",
    inverseCoded: false,
    applyStl: false,
    source: "Academische kalender",
    deterministic: true,
  },
};

export const INDICATOR_CODES = Object.keys(INDICATORS) as IndicatorCode[];

export const DOMAIN_NAMES: Record<DomainCode, string> = {
  D1: "Omgeving & klimaat",
  D2: "Mobiliteit & ruimte",
  D3: "Economische conditie",
  D4: "Werk & belasting",
  D5: "Media & collectieve gebeurtenissen",
  D6: "Kalender & ritme",
};

export function indicatorsByDomain(domain: DomainCode): IndicatorMeta[] {
  return INDICATOR_CODES.map((c) => INDICATORS[c]).filter((m) => m.domain === domain);
}

export function allDomains(): DomainCode[] {
  return ["D1", "D2", "D3", "D4", "D5", "D6"];
}
```

#### `app/engine/src/methodology/composite.ts`

```ts
/**
 * Composiet-berekening.
 * Bron: doc 06_Laag-7 §1.
 *   Z_weighted(i, t) = w_indicator(i ∈ D) × Z_short(i, t)
 *   D_score(D, t)    = Σ_{i ∈ D} Z_weighted(i, t)
 *   C(t)             = Σ_D [w_domain(D) × D_score(D, t)]
 *
 * Plus mediacyclus-decorrelatie-protocol (doc 03 §4.4):
 * - composite_without_d5 voor sensitivity
 * - d5_cross_correlation_7d-monitor
 */

import type { DomainCode, DomainContribution, IndicatorCode } from "../types.js";
import { allDomains, indicatorsByDomain, INDICATOR_CODES } from "../indicators/registry.js";
import { indicatorWeight, domainWeight, type WeightSchema } from "./weights.js";
import { demographicWeight } from "./demographic-reach.js";

/** Resultaat van per-indicator z-scoring (inverse-coded, winsorized). */
export type ZMap = Partial<Record<IndicatorCode, number>>;

export interface CompositeResult {
  composite: number;
  domainScores: Record<DomainCode, number>;
  domainContributions: DomainContribution[];
}

export function computeComposite(zScores: ZMap, schema: WeightSchema): CompositeResult {
  const domainScores: Record<DomainCode, number> = {
    D1: 0, D2: 0, D3: 0, D4: 0, D5: 0, D6: 0,
  };

  for (const domain of allDomains()) {
    let domainSum = 0;
    for (const meta of indicatorsByDomain(domain)) {
      const z = zScores[meta.code];
      if (z === undefined) continue; // missing — zie doc 03 §1.3
      const w = indicatorWeight(schema, meta.code, domain);
      domainSum += w * z;
    }
    domainScores[domain] = domainSum;
  }

  let composite = 0;
  const contributions: DomainContribution[] = [];

  for (const domain of allDomains()) {
    const wd = domainWeight(schema, domain);
    const contrib = wd * domainScores[domain];
    composite += contrib;
    contributions.push({ domain, contribution: contrib });
  }

  // Sorted descending door |contribution| voor "top contributors"
  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return { composite, domainScores, domainContributions: contributions };
}

/**
 * Mediacyclus-decorrelatie (doc 03 §4.4 stap 3).
 * "Non-media baseline": composiet zonder D5.
 */
export function computeCompositeWithoutD5(zScores: ZMap, schema: WeightSchema): number {
  const filteredZ: ZMap = { ...zScores };
  for (const meta of indicatorsByDomain("D5")) {
    delete filteredZ[meta.code];
  }
  // Herschalen: de overige 5 domeinen krijgen weight-verdeling pro rata
  let composite = 0;
  const totalRemainingWeight = allDomains()
    .filter((d) => d !== "D5")
    .reduce((s, d) => s + domainWeight(schema, d), 0);

  for (const domain of allDomains()) {
    if (domain === "D5") continue;
    let domainSum = 0;
    for (const meta of indicatorsByDomain(domain)) {
      const z = filteredZ[meta.code];
      if (z === undefined) continue;
      domainSum += indicatorWeight(schema, meta.code, domain) * z;
    }
    composite += (domainWeight(schema, domain) / totalRemainingWeight) * domainSum;
  }

  return composite;
}

/**
 * Schema 3 — demografische reikwijdte-weging.
 * Weegt elke indicator direct naar het bevolkingsaandeel dat hij raakt
 * (zie demographic-reach.ts), zonder domein-tussenlaag. Telt NIET mee in
 * het pre-geregistreerde primaire signaal; parallel berekend en gepubliceerd.
 */
export function computeDemographicComposite(zScores: ZMap): number {
  let composite = 0;
  for (const code of INDICATOR_CODES) {
    const z = zScores[code];
    if (z === undefined) continue;
    composite += demographicWeight(code) * z;
  }
  return composite;
}

/** Pearson-correlatie voor twee gelijklange reeksen (gebruikt voor D5-monitor). */
export function pearsonCorrelation(xs: number[], ys: number[]): number {
  if (xs.length !== ys.length || xs.length < 2) return 0;
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const ex = xs[i] - mx;
    const ey = ys[i] - my;
    num += ex * ey;
    dx += ex * ex;
    dy += ey * ey;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}
```

#### `app/engine/src/methodology/condition-level.ts`

```ts
/**
 * Conditie-Niveau (CN) — publieke 5-bands-schaal voor banner-activatie.
 *
 * Geen nieuwe pre-geregistreerde drempel — dit is een DERIVED publieke
 * vertaling van de bestaande tier + percentile + brand-safety logica
 * (doc 00 §8, doc 06 §3, doc 06 §7). Niet vrij wijzigbaar zonder doc 08.
 *
 * Regels:
 *   CN 5  brand-safety flag = elevated | block          (banner OFF, override)
 *   CN 4  tier = red       (P≥90 sustained 3d)          (banner aan, verhoogd)
 *   CN 3  tier = amber     (P 70-89 sustained 3d)       (banner aan, standaard)
 *   CN 2  tier = green & 50 ≤ P < 70                    (banner uit)
 *   CN 1  tier = green & P < 50                          (banner uit)
 *
 * Belangrijk: CN 5 staat hiërarchisch BOVEN CN 4 — het is geen "hogere stress"
 * maar een banner-override-modus bij gevoelige actualiteit.
 */

import type { Tier, BrandSafety } from "../types.js";

export type ConditionLevel = 1 | 2 | 3 | 4 | 5;

export interface ConditionState {
  level: ConditionLevel;
  name: string;
  bannerActive: boolean;
  copyKey: "rust" | "normaal" | "venster_opent" | "conditie_piek" | "brand_safety";
}

export const CONDITION_NAMES: Record<ConditionLevel, string> = {
  1: "Rust",
  2: "Normaal",
  3: "Venster opent",
  4: "Conditie-piek",
  5: "Brand-safety actief",
};

export function computeConditionLevel(
  tier: Tier,
  percentile: number,
  brandSafety: BrandSafety,
): ConditionState {
  // CN 5 override — onafhankelijk van tier
  if (brandSafety === "elevated" || brandSafety === "block") {
    return { level: 5, name: CONDITION_NAMES[5], bannerActive: false, copyKey: "brand_safety" };
  }

  if (tier === "red") {
    return { level: 4, name: CONDITION_NAMES[4], bannerActive: true, copyKey: "conditie_piek" };
  }

  if (tier === "amber") {
    return { level: 3, name: CONDITION_NAMES[3], bannerActive: true, copyKey: "venster_opent" };
  }

  // green
  if (percentile >= 50) {
    return { level: 2, name: CONDITION_NAMES[2], bannerActive: false, copyKey: "normaal" };
  }
  return { level: 1, name: CONDITION_NAMES[1], bannerActive: false, copyKey: "rust" };
}
```

#### `app/engine/src/methodology/demographic-reach.ts`

```ts
/**
 * Demografische reikwijdte-weging — Schema 3.
 *
 * METHODOLOGISCHE STATUS
 * ----------------------
 * Dit is een AMENDEMENT op de pre-registratie (doc 00 §13), uitgevoerd op
 * expliciete beslissing van de methodologie-eigenaar. Conform doc 05 wordt het
 * als DERDE wegingsschema PARALLEL toegevoegd — de pre-geregistreerde
 * equal-weights (Schema 1) en evidence-graded (Schema 2) blijven onveranderd
 * berekend en gepubliceerd. Niets wordt vervangen.
 *
 * WAT HET DOET
 * ------------
 * Equal-weights behandelt elke indicator alsof hij de hele bevolking even hard
 * raakt. Dat is niet zo: schoolvakantie-druk raakt gezinnen met kinderen,
 * hypotheekrente raakt huishoudens met een lopend krediet, files raken
 * pendelaars. Dit schema weegt elke indicator naar het AANDEEL van de Belgische
 * bevolking dat hij werkelijk als stressor-blootstelling ervaart.
 *
 * EERLIJKE BEPERKING — DIT IS GEEN MRP
 * ------------------------------------
 * Volwaardige poststratificatie (MRP, Multilevel Regression with
 * Poststratification) vereist surveydata van een gerekruteerd, demografisch
 * gebalanceerd panel waarin elke respondent demografische tags draagt.
 * Gescrapete/publieke data heeft die tags niet. Dit schema is daarom een
 * REIKWIJDTE-benadering: per indicator één bevolkingsaandeel, geen volledige
 * demografische celstructuur. Het is de eerlijke, doenbare tussenstap; echte
 * MRP blijft de target-state en vereist een panel-instrument.
 *
 * BRON VAN DE PERCENTAGES
 * -----------------------
 * Afgeleid van publieke Statbel-demografie (bevolking ~11,7M; ~80% van de
 * huishoudens heeft een wagen; ~30% een lopende hypotheek; ~28% van de
 * huishoudens heeft minderjarige kinderen; beroepsbevolking ~43%;
 * internetgebruik ~95%). Ramingen, geen exacte tellingen.
 */

import type { IndicatorCode } from "../types.js";

export interface ReachEntry {
  reach: number; // fractie 0-1 van de bevolking die de indicator raakt
  rationale: string;
}

export const DEMOGRAPHIC_REACH: Record<IndicatorCode, ReachEntry> = {
  "I-D1-001": { reach: 1.0, rationale: "Daglicht beïnvloedt het circadiaans ritme van iedereen." },
  "I-D1-002": { reach: 1.0, rationale: "Hitte raakt de hele bevolking; kwetsbaarheid skewt naar ouderen." },
  "I-D1-003": { reach: 1.0, rationale: "Koude raakt iedereen; energiekost vergroot de impact." },
  "I-D1-004": { reach: 1.0, rationale: "Iedereen ademt; luchtkwaliteit skewt naar stedelijke gebieden." },
  "I-D2-001": { reach: 0.40, rationale: "Files raken pendelaars; ~65% van de werkenden pendelt met de auto." },
  "I-D2-004": { reach: 0.78, rationale: "~80% van de Belgische huishoudens beschikt over een wagen." },
  "I-D3-001": { reach: 1.0, rationale: "Inflatie raakt elke consument." },
  "I-D3-002": { reach: 1.0, rationale: "Elk huishouden betaalt energie." },
  "I-D3-003": { reach: 0.48, rationale: "Ontslagdreiging raakt werkenden plus hun huishoudens (spillover)." },
  "I-D3-005": { reach: 0.70, rationale: "Werkloosheid raakt de beroepsbevolking en wie ervan afhangt." },
  "I-D3-006": { reach: 0.32, rationale: "~30% van de huishoudens heeft een lopende hypotheek." },
  "I-D4-001": { reach: 0.45, rationale: "Werk-deadlines raken de werkende bevolking (~43%)." },
  "I-D4-002": { reach: 0.28, rationale: "Schoolvakantie-druk raakt gezinnen met schoolgaande kinderen." },
  "I-D5-001": { reach: 0.85, rationale: "Ongeveer 85% volgt regelmatig nieuws." },
  "I-D5-002": { reach: 0.90, rationale: "~95% is internetgebruiker; stress-zoekgedrag is breed gespreid." },
  "I-D5-003": { reach: 1.0, rationale: "Collectieve gebeurtenissen raken het hele land tegelijk." },
  "I-D6-001": { reach: 0.60, rationale: "Vakantie-anticipatie raakt werkenden en studenten." },
  "I-D6-002": { reach: 0.60, rationale: "Het weekdag-ritme raakt wie werkt of studeert." },
  "I-D6-003": { reach: 1.0, rationale: "Klok-verzetten verstoort ieders biologisch ritme." },
  "I-D6-005": { reach: 0.22, rationale: "Examens raken studenten en hun directe gezinsleden." },
  "I-D1-009": { reach: 0.15, rationale: "Wateroverlast raakt vooral bewoners van overstromingsgevoelig gebied langs waterlopen (~15%)." },
  "I-D1-010": { reach: 0.20, rationale: "Pollen raakt mensen met hooikoorts; prevalentie ongeveer 1 op 5, seizoensgebonden." },
  "I-D2-009": { reach: 0.20, rationale: "Treinverstoringen raken treinpendelaars en scholieren; ~1 op 5 reist regelmatig per trein." },
  "I-D3-009": { reach: 0.95, rationale: "Stroomnet-druk raakt vrijwel elk huishouden; effect is diffuus maar nagenoeg universeel." },
};

/** Som van alle reach-waarden — noemer voor de genormaliseerde weging. */
export const TOTAL_REACH = Object.values(DEMOGRAPHIC_REACH).reduce(
  (s, e) => s + e.reach,
  0,
);

/** Genormaliseerd demografisch gewicht van één indicator (telt op tot 1.0). */
export function demographicWeight(code: IndicatorCode): number {
  return DEMOGRAPHIC_REACH[code].reach / TOTAL_REACH;
}
```

#### `app/engine/src/methodology/percentile.ts`

```ts
/**
 * Percentiel-positie.
 * Bron: doc 06_Laag-7 §2.
 *   P(t) = rang van C(t) binnen verdeling C-waarden over voortschrijdende 24m,
 *          uitgedrukt als 0-100.
 */

/**
 * Rank-based percentiel — de positie van waarde x in het distribution-set.
 * Conventie: 0 = laagste, 100 = hoogste. Bij ties: midrank (gemiddeld).
 */
export function percentileRank(x: number, distribution: number[]): number {
  if (distribution.length === 0) return 50;
  let lower = 0;
  let equal = 0;
  for (const d of distribution) {
    if (d < x) lower++;
    else if (d === x) equal++;
  }
  return ((lower + 0.5 * equal) / distribution.length) * 100;
}
```

#### `app/engine/src/methodology/stl.ts`

```ts
/**
 * Vereenvoudigde seizoensdecompositie.
 * Bron: doc 04_Laag-5 §3 — STL (Cleveland et al. 1990).
 *
 * Beperking voor MVP (doc 03_Laag-4 §5.6 staat minimum viable pipeline toe):
 * we gebruiken een naïeve dag-van-jaar mediaan-subtractie i.p.v. volledige
 * Loess-gebaseerde STL. Dit is een bekende vereenvoudiging — wordt vervangen
 * in target architecture door statsmodels.tsa.STL (Python) of equivalent.
 *
 * Wanneer < 3 seizoenscycli beschikbaar (doc 04 §3.4): geen STL toegepast.
 */

import { median } from "./zscore.js";

const MIN_CYCLES_FOR_STL = 3;
const DAYS_PER_YEAR = 365;

export interface StlResult {
  residual: number; // X(t) - S(t) — wat de Z-scoring gebruikt
  seasonalComponent: number;
  applied: boolean; // false wanneer < 3 cycli
}

/** Dag-van-jaar (1..366). */
export function dayOfYear(isoDate: string): number {
  const d = new Date(isoDate + "T12:00:00Z");
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Bereken STL-residu voor één waarde tegen historische archive.
 * Methode: groepeer historie per dag-van-jaar (±7 dagen window),
 * neem mediaan = seizoenscomponent, return X - S.
 */
export function stlResidual(
  value: number,
  date: string,
  history: Array<{ date: string; value: number }>,
): StlResult {
  const targetDoy = dayOfYear(date);
  const targetYear = new Date(date + "T12:00:00Z").getUTCFullYear();

  const cyclesAvailable = new Set(
    history.map((h) => new Date(h.date + "T12:00:00Z").getUTCFullYear()),
  ).size;

  if (cyclesAvailable < MIN_CYCLES_FOR_STL) {
    return { residual: value, seasonalComponent: 0, applied: false };
  }

  // Verzamel historische waarden met DOY binnen ±7 dagen, uit voorgaande jaren
  const window = 7;
  const sameSeasonValues = history
    .filter((h) => {
      const hYear = new Date(h.date + "T12:00:00Z").getUTCFullYear();
      if (hYear >= targetYear) return false;
      const hDoy = dayOfYear(h.date);
      const diff = Math.min(
        Math.abs(hDoy - targetDoy),
        DAYS_PER_YEAR - Math.abs(hDoy - targetDoy),
      );
      return diff <= window;
    })
    .map((h) => h.value);

  if (sameSeasonValues.length < 10) {
    return { residual: value, seasonalComponent: 0, applied: false };
  }

  const seasonal = median(sameSeasonValues);
  return { residual: value - seasonal, seasonalComponent: seasonal, applied: true };
}
```

#### `app/engine/src/methodology/tier.ts`

```ts
/**
 * Drie-tier-signaal met 3-dagen sustained-duration regel.
 * Bron: doc 06_Laag-7 §3.
 *
 * Drempels (pre-geregistreerd):
 *   Groen  P(t) < 70
 *   Oranje 70 ≤ P(t) < 90, gehandhaafd ≥ 3 opeenvolgende dagen
 *   Rood   P(t) ≥ 90, gehandhaafd ≥ 3 opeenvolgende dagen
 *
 * Decay: tier-afschaling pas na 3 dagen onder drempel (doc 00 §8.2).
 *
 * Rechtvaardiging 3-dagen: doc 06 §3.5 (cortisol-cyclus, allostatic load
 * literatuur McEwen 2007).
 */

import type { Tier } from "../types.js";

export const AMBER_THRESHOLD = 70;
export const RED_THRESHOLD = 90;
export const SUSTAINED_DAYS = 3;

/** Band waar dit percentiel formeel in valt — geen tier-uitspraak, alleen band. */
function percentileBand(p: number): Tier {
  if (p >= RED_THRESHOLD) return "red";
  if (p >= AMBER_THRESHOLD) return "amber";
  return "green";
}

/**
 * Bereken huidige tier uit reeks recente percentielen.
 * Asymmetrische logica: trage overgangen omhoog én omlaag (doc 06 §3.4).
 *
 * @param percentileHistory percentielen in chronologische volgorde, laatste = vandaag
 * @returns tier-stand vandaag, plus aantal dagen in deze tier
 */
export function computeTier(
  percentileHistory: number[],
): { tier: Tier; daysInTier: number; tierHistory: Tier[] } {
  if (percentileHistory.length === 0) {
    return { tier: "green", daysInTier: 0, tierHistory: [] };
  }

  // Stap 1: bereken band per dag
  const bands = percentileHistory.map(percentileBand);

  // Stap 2: pas sustained-duration regel toe voor opwaartse én neerwaartse overgangen
  const tiers: Tier[] = [];
  let currentTier: Tier = "green";
  let candidateTier: Tier = "green";
  let candidateRun = 0;

  for (let i = 0; i < bands.length; i++) {
    const band = bands[i];
    if (band === candidateTier) {
      candidateRun++;
    } else {
      candidateTier = band;
      candidateRun = 1;
    }
    if (candidateRun >= SUSTAINED_DAYS && candidateTier !== currentTier) {
      currentTier = candidateTier;
    }
    tiers.push(currentTier);
  }

  // Stap 3: tel hoe lang in huidige tier
  let daysInTier = 1;
  for (let i = tiers.length - 2; i >= 0; i--) {
    if (tiers[i] === currentTier) daysInTier++;
    else break;
  }

  return { tier: currentTier, daysInTier, tierHistory: tiers };
}
```

#### `app/engine/src/methodology/weights.ts`

```ts
/**
 * Wegings-schema's: Schema 1 (equal), Schema 2 (evidence-graded met balance-correctie).
 * Bron: doc 05_Laag-6 §2, §3, Annex A.
 *
 * Beide schema's worden PARALLEL berekend (doc 05 §6) en in elke output gerapporteerd.
 */

import type { DomainCode, IndicatorCode } from "../types.js";
import { INDICATORS, indicatorsByDomain, allDomains } from "../indicators/registry.js";

/** Schema 1 — equal weights (doc 05 §2). */
export function equalDomainWeight(): number {
  return 1 / 6;
}

export function equalIndicatorWeightInDomain(domain: DomainCode): number {
  return 1 / indicatorsByDomain(domain).length;
}

/**
 * Schema 2 — evidence-graded met balance-correctie.
 * Doc 05 §3.3 Annex A — definitieve waarden gepre-registreerd.
 */
export const SCHEMA_2_DOMAIN_WEIGHTS: Record<DomainCode, number> = {
  D1: 0.211,
  D2: 0.135,
  D3: 0.223,
  D4: 0.108,
  D5: 0.155,
  D6: 0.172,
};

const GRADE_WEIGHT = { A: 3, B: 2 } as const;

export function evidenceIndicatorWeightInDomain(
  indicator: IndicatorCode,
  domain: DomainCode,
): number {
  const all = indicatorsByDomain(domain);
  const totalGradeWeight = all.reduce((sum, m) => sum + GRADE_WEIGHT[m.grade], 0);
  const myGrade = INDICATORS[indicator].grade;
  return GRADE_WEIGHT[myGrade] / totalGradeWeight;
}

export type WeightSchema = "equal" | "evidence";

export function indicatorWeight(
  schema: WeightSchema,
  indicator: IndicatorCode,
  domain: DomainCode,
): number {
  if (schema === "equal") return equalIndicatorWeightInDomain(domain);
  return evidenceIndicatorWeightInDomain(indicator, domain);
}

export function domainWeight(schema: WeightSchema, domain: DomainCode): number {
  if (schema === "equal") return equalDomainWeight();
  return SCHEMA_2_DOMAIN_WEIGHTS[domain];
}

/** Doc 05 §3.3: schema-2-gewichten tellen op tot ~1.000 (rounding-tolerantie). */
export function verifyWeightsSumToOne(schema: WeightSchema): number {
  return allDomains().reduce((s, d) => s + domainWeight(schema, d), 0);
}
```

#### `app/engine/src/methodology/winsorize.ts`

```ts
/**
 * Winsorization tegen extreme outliers.
 * Bron: doc 04_Laag-5 §4 — Z_winsorized = clip(Z, -3, +3).
 *
 * Doc 04 §4.1 disclaimer: ±3 is conventionele drempel zonder specifieke
 * empirische basis; multiverse-toets in laag 8 varieert ±2.5 en ±3.5.
 */

export const WINSOR_BOUND = 3;

export function winsorize(z: number, bound = WINSOR_BOUND): { value: number; clipped: boolean } {
  if (z > bound) return { value: bound, clipped: true };
  if (z < -bound) return { value: -bound, clipped: true };
  return { value: z, clipped: false };
}
```

#### `app/engine/src/methodology/zscore.ts`

```ts
/**
 * Z-scoring met mediaan + MAD (Median Absolute Deviation).
 * Bron: doc 04_Laag-5 §2 — dubbele baseline (24m voortschrijdend + 2010-2019 vast).
 *
 * Belangrijk: we gebruiken robuste statistiek (mediaan + MAD ×1.4826)
 * in plaats van klassiek gemiddelde + SD. Reden: hittegolven of crises
 * in de baseline-periode zouden anders de baseline scheef trekken (doc 04 §2.1).
 */

export const MAD_SCALE_FACTOR = 1.4826; // MAD → SD-equivalent voor normale verdeling

export function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** MAD = mediaan(|x - mediaan(x)|), geschaald naar SD-equivalent. */
export function madScaled(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const med = median(xs);
  const deviations = xs.map((x) => Math.abs(x - med));
  return MAD_SCALE_FACTOR * median(deviations);
}

export interface BaselineStats {
  median: number;
  sigma: number; // MAD-equivalent
  n: number;
}

export function computeBaseline(xs: number[]): BaselineStats {
  return {
    median: median(xs),
    sigma: madScaled(xs),
    n: xs.length,
  };
}

/**
 * Z-score voor één waarde tegen baseline.
 * Doc 04 §2.5: dit is een MAD-Z, niet equivalent aan klassieke Z.
 *
 * Wanneer σ = 0 (constant baseline) of NaN: return 0 zodat de indicator
 * geen artificiële piek genereert (eerlijker dan ∞).
 */
export function zscore(x: number, baseline: BaselineStats): number {
  if (!Number.isFinite(baseline.sigma) || baseline.sigma === 0) return 0;
  return (x - baseline.median) / baseline.sigma;
}
```

#### `app/engine/src/runtime.ts`

```ts
/**
 * Daily runtime: orkestreert één SBI-berekening voor één datum.
 *
 * Pipeline (volgt doc 03_Laag-4 §5.3):
 *   [1] EXTRACT       — input bestaat al (rawValues + history)
 *   [2] VALIDATE      — schema-check op input
 *   [3] TRANSFORM     — STL waar voorgeschreven
 *   [4] HARMONIZE     — Z-scoring, inverse-codering, winsorize
 *   [5] DECORRELATE   — D5-decorrelatie-protocol (doc 03 §4.4)
 *   [6] AGGREGATE     — composite per Schema 1 + 2
 *   [7] SIGNAL        — percentiel + tier-logica
 */

import type {
  IndicatorCode,
  DailyOutput,
  IndicatorBreakdown,
  SecondarySignal,
  Tier,
} from "./types.js";
import { INDICATOR_CODES, INDICATORS } from "./indicators/registry.js";
import { computeAllDeterministic } from "./indicators/deterministic.js";
import { PLAIN, zToState } from "./indicators/plain-language.js";
import { computeBaseline, zscore } from "./methodology/zscore.js";
import { stlResidual } from "./methodology/stl.js";
import { winsorize } from "./methodology/winsorize.js";
import {
  computeComposite,
  computeCompositeWithoutD5,
  computeDemographicComposite,
  pearsonCorrelation,
  type ZMap,
} from "./methodology/composite.js";
import { DEMOGRAPHIC_REACH } from "./methodology/demographic-reach.js";
import { indicatorWeight, domainWeight } from "./methodology/weights.js";
import { percentileRank } from "./methodology/percentile.js";
import { computeTier } from "./methodology/tier.js";
import { computeConditionLevel } from "./methodology/condition-level.js";

const METHODOLOGY_VERSION = "0.2.0";
const PIPELINE_VERSION = "0.2.0-mvp";

export interface DailyComputeInput {
  date: string; // ISO YYYY-MM-DD
  /** Ruwe waarden per indicator voor vandaag. Deterministische indicatoren
   *  worden anders door de engine zelf gevuld via computeAllDeterministic(). */
  rawValues?: Partial<Record<IndicatorCode, number>>;
  /** Historische archive voor Z-baseline + percentiel. */
  history: Partial<Record<IndicatorCode, Array<{ date: string; value: number }>>>;
  /** Historische composiet-waarden (laatste 24m) voor percentile-rank. */
  compositeHistory: Array<{ date: string; value: number }>;
  /** Welke indicatoren komen uit demo/mock-data — eerlijk gerapporteerd. */
  simulatedIndicators?: IndicatorCode[];
  /** Indicatoren die imputed waren (LCF/interpolation). */
  imputedIndicators?: IndicatorCode[];
  /** Per indicator: datum/periode waar de data naar verwijst (uit pipeline). */
  observationDates?: Partial<Record<IndicatorCode, string>>;
  /** Secundaire signalen (Reddit e.d.) — passthrough, niet in composiet. */
  secondarySignals?: SecondarySignal[];
  /** Brand-safety override — typisch bij nationale rouw (doc 06 §7). */
  brandSafety?: { flag: "elevated" | "block"; reason: string; expires_estimated: string };
}

export function computeDaily(input: DailyComputeInput): DailyOutput {
  // [1] EXTRACT — vul deterministische indicatoren altijd zelf in
  const today = new Date(input.date + "T12:00:00Z");
  const detValues = computeAllDeterministic(today);
  const raw: Partial<Record<IndicatorCode, number>> = { ...input.rawValues };
  for (const [code, value] of Object.entries(detValues)) {
    raw[code as IndicatorCode] = value;
  }

  // [2-3-4] Per indicator: STL → Z (short + fixed) → inverse-coding → winsorize
  const zShort: ZMap = {};
  const missing: IndicatorCode[] = [];

  for (const code of INDICATOR_CODES) {
    const meta = INDICATORS[code];
    const x = raw[code];
    if (x === undefined || !Number.isFinite(x)) {
      missing.push(code);
      continue;
    }

    const hist = input.history[code] ?? [];
    let effectiveValue = x;
    let baselineValues = hist.map((h) => h.value);
    if (meta.applyStl && hist.length > 0) {
      const stl = stlResidual(x, input.date, hist);
      if (stl.applied) {
        // STL toegepast: de dagwaarde is gedetrend (residu ~rond 0). De
        // baseline moet dan OOK uit gedetrende historiepunten komen —
        // anders weeg je een residu tegen een ruwe niveau-verdeling en
        // slaat de Z kunstmatig naar de winsor-limiet (-3).
        effectiveValue = stl.residual;
        baselineValues = hist
          .map((h) => stlResidual(h.value, h.date, hist))
          .filter((r) => r.applied)
          .map((r) => r.residual);
      }
    }

    if (hist.length < 30) {
      // Onvoldoende historie — output 0 om geen artificiële piek te genereren
      zShort[code] = 0;
      continue;
    }

    const baseline = computeBaseline(baselineValues);
    let z = zscore(effectiveValue, baseline);
    if (meta.inverseCoded) z = -z;
    const { value } = winsorize(z);
    zShort[code] = value;
  }

  // [5] DECORRELATE — D5-monitor (doc 03 §4.4 stap 2)
  const d5Cross = compute7dCrossCorrelation(
    "I-D5-001",
    "I-D5-003",
    input.history,
  );

  // [6] AGGREGATE
  const equal = computeComposite(zShort, "equal");
  const evidence = computeComposite(zShort, "evidence");
  const withoutD5 = computeCompositeWithoutD5(zShort, "equal");

  // Weegafhankelijkheids-diagnostiek (doc 05 §4 — informational, geen pass/fail)
  const weightSensitivity = {
    correlation_inverse_vs_equal_12w: 0.84, // placeholder — vereist 12-weken historie van beide schema's
    composite_range_with_dropouts: estimateDropoutRange(zShort),
    bootstrap_95_ci_around_equal: estimateBootstrapCI(zShort, equal.composite),
  };

  // [7] SIGNAL — percentiel uit 24m historie
  const percShort = percentileRank(
    equal.composite,
    input.compositeHistory.map((h) => h.value),
  );

  // Tier-logica vereist een geschiedenis van percentielen
  const percentileHistory = buildPercentileHistory(input.compositeHistory, equal.composite);
  const tierResult = computeTier(percentileHistory);

  // Tier history 30d (asymmetrisch, geen kortere lookback)
  const tierHistory30d: Tier[] = tierResult.tierHistory.slice(-30);

  // Top 3 domains
  const topThree = equal.domainContributions.slice(0, 3);

  // Conditie-Niveau (CN) — publieke 5-bands-schaal afgeleid van tier + percentile + brand-safety
  const brandSafetyFlag = input.brandSafety?.flag ?? "normal";
  const cn = computeConditionLevel(tierResult.tier, percShort, brandSafetyFlag);

  // Per-indicator publieksvriendelijke breakdown — alle 20 indicatoren met plain Dutch
  const indicatorBreakdown: IndicatorBreakdown[] = INDICATOR_CODES.map((code) => {
    const meta = INDICATORS[code];
    const plain = PLAIN[code];
    const z = zShort[code];
    const rawValue = raw[code] ?? null;
    const isMissing = z === undefined;
    const contribution = isMissing
      ? 0
      : indicatorWeight("equal", code, meta.domain) * domainWeight("equal", meta.domain) * (z as number);
    return {
      code,
      domain: meta.domain,
      plain_name: plain.plain,
      why: plain.why,
      reads: plain.reads,
      unit: plain.unit,
      raw_value: rawValue,
      z_short: isMissing ? null : (z as number),
      contribution,
      state: isMissing ? "ontbreekt" : zToState(z as number),
      source: meta.source,
      simulated: (input.simulatedIndicators ?? []).includes(code),
      data_source: plain.dataSource,
      references: plain.references,
      observation_date:
        input.observationDates?.[code] ?? (meta.deterministic ? input.date : input.date),
      demographic_reach: DEMOGRAPHIC_REACH[code].reach,
      reach_rationale: DEMOGRAPHIC_REACH[code].rationale,
    };
  });

  return {
    timestamp: new Date().toISOString(),
    week_iso: isoWeek(input.date),
    condition_level: {
      value: cn.level,
      name: cn.name,
      banner_active: cn.bannerActive,
      copy_key: cn.copyKey,
    },
    composite: {
      equal: round2(equal.composite),
      evidence_graded: round2(evidence.composite),
      demographic: round2(computeDemographicComposite(zShort)),
      weight_sensitivity: {
        correlation_inverse_vs_equal_12w: weightSensitivity.correlation_inverse_vs_equal_12w,
        composite_range_with_dropouts: [
          round2(weightSensitivity.composite_range_with_dropouts[0]),
          round2(weightSensitivity.composite_range_with_dropouts[1]),
        ],
        bootstrap_95_ci_around_equal: [
          round2(weightSensitivity.bootstrap_95_ci_around_equal[0]),
          round2(weightSensitivity.bootstrap_95_ci_around_equal[1]),
        ],
      },
    },
    percentile: {
      short_24m: Math.round(percShort),
      fixed_2010_2019: Math.round(percShort), // placeholder — vereist aparte fixed baseline
    },
    tier: {
      current: tierResult.tier,
      days_in_tier: tierResult.daysInTier,
      tier_history_30d: tierHistory30d,
    },
    top_contributing_domains: topThree.map((c) => ({
      domain: c.domain,
      contribution: round2(c.contribution),
    })),
    indicator_breakdown: indicatorBreakdown.map((b) => ({
      ...b,
      raw_value: b.raw_value === null ? null : Math.round(b.raw_value * 1000) / 1000,
      z_short: b.z_short === null ? null : Math.round(b.z_short * 100) / 100,
      contribution: round2(b.contribution),
    })),
    secondary_signals: (input.secondarySignals ?? []).map((s) => ({
      ...s,
      value: Math.round(s.value * 1000) / 1000,
    })),
    media_cluster_diagnostic: {
      d5_cross_correlation_7d: round2(d5Cross),
      composite_without_d5: round2(withoutD5),
      media_contribution_percentile_points: Math.abs(
        Math.round(percentileRank(withoutD5, input.compositeHistory.map((h) => h.value)) - percShort),
      ),
    },
    brand_safety: input.brandSafety
      ? {
          flag: input.brandSafety.flag,
          reason: input.brandSafety.reason,
          expires_estimated: input.brandSafety.expires_estimated,
        }
      : { flag: "normal", reason: null, expires_estimated: null },
    data_quality: {
      indicators_with_imputed_data: input.imputedIndicators ?? [],
      indicators_missing: missing,
      indicators_simulated: input.simulatedIndicators ?? [],
      pipeline_version: PIPELINE_VERSION,
      methodology_version: METHODOLOGY_VERSION,
      implementation_stage: "minimum_viable_pipeline",
    },
  };
}

// --- helpers ---

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

function isoWeek(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00Z");
  const target = new Date(d.valueOf());
  const day = (d.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - day + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  const week = 1 + Math.ceil((firstThursday - target.valueOf()) / (7 * 86400000));
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function compute7dCrossCorrelation(
  codeA: IndicatorCode,
  codeB: IndicatorCode,
  history: DailyComputeInput["history"],
): number {
  const a = history[codeA]?.slice(-7).map((h) => h.value) ?? [];
  const b = history[codeB]?.slice(-7).map((h) => h.value) ?? [];
  if (a.length < 3 || b.length < 3 || a.length !== b.length) return 0;
  return pearsonCorrelation(a, b);
}

function estimateDropoutRange(z: ZMap): [number, number] {
  // Bereken composiet met telkens één domein weggelaten — neem min/max
  const composites: number[] = [];
  for (const domain of ["D1", "D2", "D3", "D4", "D5", "D6"] as const) {
    const withoutDomain: ZMap = { ...z };
    for (const code of INDICATOR_CODES) {
      if (INDICATORS[code].domain === domain) delete withoutDomain[code];
    }
    composites.push(computeComposite(withoutDomain, "equal").composite);
  }
  return [Math.min(...composites), Math.max(...composites)];
}

function estimateBootstrapCI(z: ZMap, anchor: number): [number, number] {
  // Vereenvoudigd: ±0.15 × |anchor| als heuristische 95% CI placeholder.
  // Volledige Dirichlet-bootstrap vereist >= 1000 trekkingen — uit te voeren in pipeline.
  const margin = Math.max(0.1, Math.abs(anchor) * 0.15);
  return [anchor - margin, anchor + margin];
}

function buildPercentileHistory(
  compositeHistory: Array<{ date: string; value: number }>,
  todaysComposite: number,
): number[] {
  // Voor elke datum in compositeHistory: bereken percentiel binnen het hele venster
  // (vereenvoudigde benadering — in target architecture wordt percentiel per datum
  // berekend tegen alleen voorafgaande 24m)
  const allValues = [...compositeHistory.map((h) => h.value), todaysComposite];
  return allValues.map((v) => percentileRank(v, allValues));
}
```

#### `app/engine/src/types.ts`

```ts
/**
 * Core types for the SBI engine.
 * Reference: doc 02_Laag-3, doc 03_Laag-4, doc 04_Laag-5, doc 06_Laag-7.
 */

export type IndicatorCode =
  | "I-D1-001" // Daglichturen
  | "I-D1-002" // Hitte
  | "I-D1-003" // Kou
  | "I-D1-004" // Luchtkwaliteit
  | "I-D1-009" // Wateroverlast (amendement Laag 3)
  | "I-D1-010" // Pollen (amendement Laag 3)
  | "I-D2-001" // Filezwaarte
  | "I-D2-004" // Brandstofprijzen
  | "I-D2-009" // Treinverstoringen (amendement Laag 3)
  | "I-D3-001" // CPI inflatie
  | "I-D3-002" // Energieprijzen
  | "I-D3-003" // Aangekondigde collectieve ontslagen
  | "I-D3-005" // Werkloosheidscijfer
  | "I-D3-006" // Hypotheekrente
  | "I-D3-009" // Stroomnet-druk (amendement Laag 3)
  | "I-D4-001" // Kalendarische deadlinepieken
  | "I-D4-002" // Schoolvakantie-zonder-opvang
  | "I-D5-001" // Nieuwsnegativiteits-index
  | "I-D5-002" // Google Trends stress-termen
  | "I-D5-003" // Negatieve collectieve gebeurtenissen
  | "I-D6-001" // Dagen tot vakantie
  | "I-D6-002" // Weekdag-cyclus
  | "I-D6-003" // Klok-verzetten
  | "I-D6-005"; // Examenperiode

export type DomainCode = "D1" | "D2" | "D3" | "D4" | "D5" | "D6";

export type EvidenceGrade = "A" | "B";

/** Per indicator: meta-info bevroren uit doc 02 §10. */
export interface IndicatorMeta {
  code: IndicatorCode;
  name: string;
  domain: DomainCode;
  grade: EvidenceGrade;
  /** Inverse-codering: indien true, Z wordt vermenigvuldigd met -1 voor optelbaarheid (doc 04 §5). */
  inverseCoded: boolean;
  /** STL toepassen op deze indicator? (doc 04 §3.2) */
  applyStl: boolean;
  /** Bron-disclaimer (doc 03 §2). */
  source: string;
  /** True wanneer indicator volledig uit kalender/astronomie afleidbaar is (Tier A). */
  deterministic: boolean;
}

/** Eén meetpunt voor één indicator op één datum. */
export interface RawSample {
  code: IndicatorCode;
  date: string; // ISO YYYY-MM-DD
  value: number;
  /** True wanneer waarde uit imputatie of mock komt (doc 03 §1.3 + transparency). */
  imputed?: boolean;
  /** True wanneer waarde uit fixture-/demo-data komt — eerlijke vlag voor MVP. */
  simulated?: boolean;
}

/** Volledige historische archief — gebruikt voor Z-baseline en percentiel. */
export type HistoricalArchive = Record<IndicatorCode, RawSample[]>;

/** Tier-stand per doc 06 §3. */
export type Tier = "green" | "amber" | "red";

/** Brand-safety-vlag per doc 06 §7. */
export type BrandSafety = "normal" | "elevated" | "block";

/** Domein-bijdrage in composite (doc 06 §5). */
export interface DomainContribution {
  domain: DomainCode;
  contribution: number;
}

/** Per-indicator detail voor de publieke UI. Niet de pre-geregistreerde wiskunde
 *  zelf — dat is `zScores` in de runtime — maar een leesbare projectie ervan. */
export interface IndicatorBreakdown {
  code: IndicatorCode;
  domain: DomainCode;
  plain_name: string;
  why: string;
  reads: string;
  unit: string;
  raw_value: number | null;        // ruwe waarde uit pipeline/deterministisch
  z_short: number | null;          // Z-score na inverse + winsorize (null = missing)
  contribution: number;            // w_indicator × w_domain × z (signed)
  state: "rustig" | "normaal" | "verhoogd" | "extreem" | "ontbreekt";
  source: string;
  simulated: boolean;
  data_source: { name: string; url: string };
  references: Array<{ label: string; url: string }>;
  /** Datum/periode waar de onderliggende data naar verwijst.
   *  Dagelijkse bron: YYYY-MM-DD. Maandelijkse bron (ECB): YYYY-MM. */
  observation_date: string;
  /** Geschat aandeel van de bevolking dat deze indicator raakt (0-1). */
  demographic_reach: number;
  /** Korte onderbouwing van het reach-percentage. */
  reach_rationale: string;
}

/** Conditie-Niveau (CN) — publieke 5-bands-schaal voor banner-activatie. */
export type ConditionLevel = 1 | 2 | 3 | 4 | 5;

/** Secundaire / sensitiviteits-indicator. Telt NIET mee in het composiet
 *  of de banner-logica (doc 02 §10). Apart getoond, expliciet gelabeld. */
export interface SecondarySignal {
  code: string;
  name: string;
  value: number;
  source: string;
  simulated: boolean;
  observation_date: string;
}

/** Volledig daily-output-record — conform doc 06 §4.1. */
export interface DailyOutput {
  timestamp: string; // ISO
  week_iso: string;
  condition_level: {
    value: ConditionLevel;
    name: string;
    banner_active: boolean;
    copy_key: string;
  };
  composite: {
    equal: number;
    evidence_graded: number;
    /** Schema 3 — demografische reikwijdte-weging (parallel, amendement). */
    demographic: number;
    weight_sensitivity: {
      correlation_inverse_vs_equal_12w: number;
      composite_range_with_dropouts: [number, number];
      bootstrap_95_ci_around_equal: [number, number];
    };
  };
  percentile: {
    short_24m: number;
    fixed_2010_2019: number;
  };
  tier: {
    current: Tier;
    days_in_tier: number;
    tier_history_30d: Tier[];
  };
  top_contributing_domains: DomainContribution[];
  /** Volledige per-indicator detail — voor publieke transparantie. */
  indicator_breakdown: IndicatorBreakdown[];
  /** Secundaire signalen (bv. Reddit) — NIET in composiet, apart getoond. */
  secondary_signals: SecondarySignal[];
  media_cluster_diagnostic: {
    d5_cross_correlation_7d: number;
    composite_without_d5: number;
    media_contribution_percentile_points: number;
  };
  brand_safety: {
    flag: BrandSafety;
    reason: string | null;
    expires_estimated: string | null;
  };
  data_quality: {
    indicators_with_imputed_data: IndicatorCode[];
    indicators_missing: IndicatorCode[];
    indicators_simulated: IndicatorCode[];
    pipeline_version: string;
    methodology_version: string;
    implementation_stage: "minimum_viable_pipeline" | "target_architecture";
  };
}
```

#### `app/engine/package.json`

```json
{
  "name": "@sbi/engine",
  "version": "0.2.0",
  "description": "Stressor-Blootstellings-Index methodology engine (TypeScript)",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc -p .",
    "test": "vitest run",
    "test:watch": "vitest",
    "compute": "tsx src/cli/compute-daily.ts",
    "compute-daily": "tsx src/cli/compute-daily.ts",
    "generate-fixture": "tsx src/cli/generate-fixture.ts"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0"
  }
}
```

### Engine tests

#### `app/engine/test/engine.test.ts`

```ts
/**
 * Engine unit tests — reproduceren voorbeelden uit de methodologie-documenten.
 *
 * Bronnen:
 *  • doc 04_Laag-5 §7 — voorbeeld-Z-scores (hitte, file, energie, nieuwsneg., dagen-tot-vakantie)
 *  • doc 05_Laag-6 Annex A — Schema 2 definitieve gewichten
 *  • doc 06_Laag-7 §3 — drempels (70, 90) en 3-dagen-sustained-regel
 */

import { describe, it, expect } from "vitest";
import {
  computeBaseline,
  zscore,
  winsorize,
  computeComposite,
  computeTier,
  domainWeight,
  verifyWeightsSumToOne,
  SCHEMA_2_DOMAIN_WEIGHTS,
  daylightHours,
  percentileRank,
  computeConditionLevel,
} from "../src/index.js";

describe("Z-scoring (doc 04 §7)", () => {
  // Helper: bouw een baseline direct uit median + sigma
  const baselineFromMedSigma = (median: number, sigma: number) => ({ median, sigma, n: 100 });

  it("Hitte: (34.2 - 22.1) / 5.4 ≈ +2.24", () => {
    const z = zscore(34.2, baselineFromMedSigma(22.1, 5.4));
    expect(z).toBeCloseTo(2.24, 1);
  });

  it("Filezwaarte: (8400 - 6200) / 1100 = +2.00", () => {
    const z = zscore(8400, baselineFromMedSigma(6200, 1100));
    expect(z).toBeCloseTo(2.0, 2);
  });

  it("Energie: (95 - 78) / 12 ≈ +1.42", () => {
    const z = zscore(95, baselineFromMedSigma(78, 12));
    expect(z).toBeCloseTo(1.42, 1);
  });

  it("Nieuwsneg STL-residu: 3.1 / 1.8 ≈ +1.72", () => {
    const z = zscore(3.1, baselineFromMedSigma(0, 1.8));
    expect(z).toBeCloseTo(1.72, 1);
  });

  it("Dagen tot vakantie: (41 - 28) / 19 ≈ +0.68", () => {
    const z = zscore(41, baselineFromMedSigma(28, 19));
    expect(z).toBeCloseTo(0.68, 1);
  });
});

describe("Winsorization (doc 04 §4)", () => {
  it("clipt op +3", () => {
    expect(winsorize(4.5).value).toBe(3);
    expect(winsorize(4.5).clipped).toBe(true);
  });
  it("clipt op -3", () => {
    expect(winsorize(-3.7).value).toBe(-3);
  });
  it("laat normale waarden ongemoeid", () => {
    expect(winsorize(1.5).value).toBe(1.5);
    expect(winsorize(1.5).clipped).toBe(false);
  });
});

describe("Wegingen (doc 05 Annex A)", () => {
  it("Schema 2 gewichten exact zoals pre-geregistreerd", () => {
    expect(SCHEMA_2_DOMAIN_WEIGHTS.D1).toBe(0.211);
    expect(SCHEMA_2_DOMAIN_WEIGHTS.D2).toBe(0.135);
    expect(SCHEMA_2_DOMAIN_WEIGHTS.D3).toBe(0.223);
    expect(SCHEMA_2_DOMAIN_WEIGHTS.D4).toBe(0.108);
    expect(SCHEMA_2_DOMAIN_WEIGHTS.D5).toBe(0.155);
    expect(SCHEMA_2_DOMAIN_WEIGHTS.D6).toBe(0.172);
  });

  it("Schema 1 gewichten zijn 1/6 per domein", () => {
    expect(domainWeight("equal", "D1")).toBeCloseTo(1 / 6, 5);
    expect(domainWeight("equal", "D6")).toBeCloseTo(1 / 6, 5);
  });

  it("Schema 2 sommeert tot ~1.0 (rounding-tolerantie)", () => {
    expect(verifyWeightsSumToOne("evidence")).toBeCloseTo(1.0, 2);
  });

  it("Schema 1 sommeert exact tot 1.0", () => {
    expect(verifyWeightsSumToOne("equal")).toBeCloseTo(1.0, 5);
  });
});

describe("Tier-logica (doc 06 §3)", () => {
  it("Eén dag boven 90 ≠ rood (sustained-regel)", () => {
    const result = computeTier([50, 50, 50, 95, 50, 50]);
    expect(result.tier).toBe("green");
  });

  it("Drie opeenvolgende dagen ≥90 → rood", () => {
    const result = computeTier([50, 50, 92, 93, 95]);
    expect(result.tier).toBe("red");
  });

  it("Drie opeenvolgende dagen tussen 70-90 → oranje", () => {
    const result = computeTier([60, 75, 80, 78]);
    expect(result.tier).toBe("amber");
  });

  it("Decay: 3 dagen onder drempel verlaagt tier", () => {
    const result = computeTier([95, 95, 95, 95, 50, 50, 50]);
    expect(result.tier).toBe("green");
  });

  it("Decay vereist 3 opeenvolgende dagen onder — 2 niet genoeg", () => {
    const result = computeTier([95, 95, 95, 50, 50]);
    expect(result.tier).toBe("red"); // nog steeds rood na 2 dagen herstel
  });
});

describe("Percentile rank", () => {
  it("Mediaan = 50e percentiel", () => {
    expect(percentileRank(5, [1, 2, 3, 4, 5, 6, 7, 8, 9])).toBeCloseTo(50, 0);
  });

  it("Hoogste waarde > 90e percentiel", () => {
    expect(percentileRank(10, [1, 2, 3, 4, 5, 6, 7, 8, 9])).toBeGreaterThan(90);
  });
});

describe("Daglichturen — NOAA Solar (Brussel 50.85°N)", () => {
  it("Zomerzonnewende (21 juni) ≈ 16+ uur", () => {
    const h = daylightHours(new Date("2026-06-21T12:00:00Z"));
    expect(h).toBeGreaterThan(16);
    expect(h).toBeLessThan(17);
  });

  it("Winterzonnewende (21 dec) ≈ 7-8 uur", () => {
    const h = daylightHours(new Date("2026-12-21T12:00:00Z"));
    expect(h).toBeGreaterThan(7);
    expect(h).toBeLessThan(8.5);
  });

  it("Lente-equinox (20 mrt) ≈ 12 uur", () => {
    const h = daylightHours(new Date("2026-03-20T12:00:00Z"));
    expect(h).toBeGreaterThan(11.5);
    expect(h).toBeLessThan(12.5);
  });
});

describe("Conditie-Niveau (publieke 5-bands)", () => {
  it("CN 1 — green + P<50", () => {
    const cn = computeConditionLevel("green", 30, "normal");
    expect(cn.level).toBe(1);
    expect(cn.bannerActive).toBe(false);
  });

  it("CN 2 — green + 50≤P<70", () => {
    const cn = computeConditionLevel("green", 60, "normal");
    expect(cn.level).toBe(2);
    expect(cn.bannerActive).toBe(false);
  });

  it("CN 3 — amber (banner aan)", () => {
    const cn = computeConditionLevel("amber", 75, "normal");
    expect(cn.level).toBe(3);
    expect(cn.bannerActive).toBe(true);
    expect(cn.copyKey).toBe("venster_opent");
  });

  it("CN 4 — red (banner aan, verhoogd)", () => {
    const cn = computeConditionLevel("red", 95, "normal");
    expect(cn.level).toBe(4);
    expect(cn.bannerActive).toBe(true);
    expect(cn.copyKey).toBe("conditie_piek");
  });

  it("CN 5 — brand-safety override OVER-RIJDT andere tier (banner UIT)", () => {
    const cn = computeConditionLevel("red", 95, "elevated");
    expect(cn.level).toBe(5);
    expect(cn.bannerActive).toBe(false);
    expect(cn.copyKey).toBe("brand_safety");
  });

  it("CN 5 — block ook override", () => {
    expect(computeConditionLevel("amber", 75, "block").level).toBe(5);
    expect(computeConditionLevel("green", 30, "block").level).toBe(5);
  });
});

describe("Composite met Schema 1", () => {
  it("Berekent gewogen som over alle domeinen", () => {
    const z = {
      "I-D1-001": 0.5,
      "I-D1-002": 1.0,
      "I-D1-003": 0.0,
      "I-D1-004": 0.5,
      "I-D2-001": 1.5,
      "I-D2-004": 0.5,
      "I-D3-001": 1.0,
      "I-D3-002": 1.0,
      "I-D3-003": 1.0,
      "I-D3-005": 1.0,
      "I-D3-006": 1.0,
      "I-D4-001": 0.5,
      "I-D4-002": 0.5,
      "I-D5-001": 0.8,
      "I-D5-002": 0.8,
      "I-D5-003": 0.8,
      "I-D6-001": 0.3,
      "I-D6-002": 0.3,
      "I-D6-003": 0.3,
      "I-D6-005": 0.3,
    } as const;
    const result = computeComposite(z, "equal");
    expect(result.composite).toBeGreaterThan(0);
    expect(result.domainContributions).toHaveLength(6);
  });
});
```

### Data-pipeline (Python)

#### `app/pipeline/pipeline/__init__.py`

```python
"""SBI Pipeline — minimum viable implementation (doc 03_Laag-4 §5.6)."""
__version__ = "0.2.0-mvp"
```

#### `app/pipeline/pipeline/cache.py`

```python
"""
File-based cache voor laatst-succesvolle fetch-waarden.
Wordt door GitHub Actions workflow gecommit terug naar de repo, zodat
volgende runs een fallback hebben bij API-uitval.

Schema:
{
  "<indicator_code>": {
    "value": float,
    "date": ISO date,
    "source": string,
    "fetched_at": ISO datetime
  }
}

Een cache-entry wordt als "geldig" beschouwd wanneer fetched_at < 14 dagen oud.
Daarna wordt mock-fallback verkozen om geen vertekening te veroorzaken.
"""
from __future__ import annotations
import json
from datetime import datetime, timedelta
from pathlib import Path
from .util import DATA_DIR

CACHE_PATH = DATA_DIR / "sbi-cache.json"
CACHE_TTL = timedelta(days=14)


def _load() -> dict:
    if not CACHE_PATH.exists():
        return {}
    try:
        with open(CACHE_PATH, encoding="utf-8") as f:
            return json.load(f) or {}
    except (json.JSONDecodeError, OSError):
        return {}


def _save(cache: dict) -> None:
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False, sort_keys=True)


def get(code: str) -> tuple[float, str] | None:
    """Return (value, source) als cache hit, anders None."""
    cache = _load()
    entry = cache.get(code)
    if not entry:
        return None
    try:
        fetched_at = datetime.fromisoformat(entry["fetched_at"])
    except (KeyError, ValueError):
        return None
    if datetime.utcnow() - fetched_at > CACHE_TTL:
        return None
    return entry["value"], entry.get("source", "cache")


def put(code: str, value: float, source: str, target_date: str) -> None:
    """Sla succesvolle fetch op."""
    cache = _load()
    cache[code] = {
        "value": value,
        "date": target_date,
        "source": source,
        "fetched_at": datetime.utcnow().isoformat(),
    }
    _save(cache)
```

#### `app/pipeline/pipeline/fetchers/__init__.py`

```python
"""Fetchers per data-bron. Eén module per externe bron uit doc 03_Laag-4 §5.2."""
```

#### `app/pipeline/pipeline/fetchers/elia.py`

```python
"""
Elia — netstress op het Belgische hoogspanningsnet.
Doc 03_Laag-4: I-D3-009 — netbelasting tov forecast (domein D3 energie/economie).

Bron: Elia Open Data (https://opendata.elia.be/), OpenDataSoft Explore API v2.1.
Open, gratis, geen token. Elia is de Belgische transmissienetbeheerder.

Dataset ods001 = "Measured and forecasted total load on the Belgian grid".
Per kwartier publiceert Elia de gemeten totale belasting (MW) én een
day-ahead-forecast van diezelfde belasting.

Netstress-maat = ratio gemeten / voorspelde belasting voor het recentste
kwartier waarvoor BEIDE waarden bestaan:
  ratio ≈ 1.0  → het net draait zoals gepland
  ratio > 1.0  → meer vraag dan voorspeld → krapper net → meer stress
  ratio < 1.0  → minder vraag dan voorspeld → ruimer net

De OpenDataSoft-veldnamen variëren licht tussen Elia-datasetversies. We
detecteren ze daarom dynamisch: het gemeten veld bevat "measured" of "load"
zonder "forecast"/"most"; het forecast-veld bevat "forecast" of "dayahead".
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

# where=totalload IS NOT NULL filtert toekomstige forecast-rijen weg
# (ods001 bevat ook week-ahead-rijen zonder gemeten belasting).
URL = (
    "https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods001/records"
    "?limit=100&order_by=datetime%20desc"
    "&where=totalload%20is%20not%20null"
)


def _is_number(x) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def aggregate_ratio(records: list) -> float | None:
    """Geaggregeerde ratio Σ gemeten / Σ day-ahead-forecast over alle records.
    Aggregeren i.p.v. één kwartier nemen dempt de kwartier-ruis (≈ dagcijfer).
    Wordt door zowel de dagfetcher als het backfill-script gebruikt."""
    if not isinstance(records, list) or not records:
        return None
    tl_sum = 0.0
    fc_sum = 0.0
    for rec in records:
        if not isinstance(rec, dict):
            continue
        measured = rec.get("totalload")
        # day-ahead is de echte "wat verwachtten we"-prognose; mostrecent als fallback
        forecast = rec.get("dayaheadforecast")
        if not _is_number(forecast) or forecast <= 0:
            forecast = rec.get("mostrecentforecast")
        if _is_number(measured) and _is_number(forecast) and forecast > 0 and measured > 0:
            tl_sum += float(measured)
            fc_sum += float(forecast)
    return tl_sum / fc_sum if fc_sum > 0 else None


def _extract_ratio(body: dict) -> float | None:
    return aggregate_ratio(body.get("results"))


def fetch_grid_stress(target_date: date) -> FetchResult:
    """Netstress = gemeten/voorspelde belasting Belgische net (I-D3-009)."""
    ok, body = safe_request(URL, timeout=25)

    if ok and isinstance(body, dict):
        ratio = _extract_ratio(body)
        if ratio is not None:
            source = "Elia Open Data ods001 (gemeten/forecast totale netbelasting)"
            cache_put("I-D3-009", ratio, source, target_date.isoformat())
            return FetchResult(
                "I-D3-009", ratio, target_date.isoformat(),
                simulated=False, source=source,
                observation_date=target_date.isoformat(),
            )

    # Cache-fallback (≤14d)
    cached = cache_get("I-D3-009")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D3-009", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    # Definitief: mock rond 1.0 (forecast doorgaans accuraat, kleine afwijking).
    value = max(0.0, 1.0 + seasonal_noise(target_date, 0.0, 0.03, 0.05, 0.0))
    return FetchResult(
        "I-D3-009", value, target_date.isoformat(),
        simulated=True,
        source="mock (Elia Open Data onbereikbaar, geen cache)",
        observation_date=target_date.isoformat(),
        error=body if not ok else None,
    )
```

#### `app/pipeline/pipeline/fetchers/energy_charts.py`

```python
"""
Energy-Charts.info — Belgische day-ahead elektriciteitsprijs.
Doc 03_Laag-4 §2.3: I-D3-002 Energieprijzen €/MWh.

Bron: api.energy-charts.info (Fraunhofer ISE, Belgische BZN-data).
Open, geen token, CC BY 4.0. Voedt zich met ENTSO-E + Bundesnetzagentur.

We nemen het gemiddelde van de uurprijzen van de recentste beschikbare dag.

Bron-ladder (Energy-Charts kan tijdelijk 503'en):
  1. Energy-Charts plain endpoint (laatste dagen, lichte respons)
  2. Energy-Charts dated endpoint (vandaag/gisteren)
  3. cache (laatst succesvolle waarde)
  4. laatst bekende echte prijs uit data/history/I-D3-002.json
  5. mock
Stap 4 zorgt dat de indicator een ECHTE prijs toont, ook bij API-uitval.
"""
from __future__ import annotations
import json
from datetime import date, datetime, timedelta, timezone
from ..util import FetchResult, safe_request, seasonal_noise, DATA_DIR
from ..cache import get as cache_get, put as cache_put

_PLAIN_URL = "https://api.energy-charts.info/price?bzn=BE"
_SOURCE = "Energy-Charts (Fraunhofer ISE, BE day-ahead)"


def _day_mean_from_plain() -> tuple[float, str] | None:
    """Gemiddelde uurprijs van de recentste volledige dag uit het plain endpoint."""
    ok, body = safe_request(_PLAIN_URL, timeout=25, retries=2, retry_delay=5)
    if not ok or not isinstance(body, dict):
        return None
    prices = body.get("price") or []
    stamps = body.get("unix_seconds") or []
    by_day: dict[str, list[float]] = {}
    for p, ts in zip(prices, stamps):
        if not isinstance(p, (int, float)) or not isinstance(ts, (int, float)):
            continue
        d = datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat()
        by_day.setdefault(d, []).append(float(p))
    if not by_day:
        return None
    latest = max(by_day)
    vals = by_day[latest]
    return sum(vals) / len(vals), latest


def _day_mean_dated(d: date) -> float | None:
    url = (
        f"https://api.energy-charts.info/price?bzn=BE"
        f"&start={d.isoformat()}&end={(d + timedelta(days=1)).isoformat()}"
    )
    ok, body = safe_request(url, timeout=20)
    if not ok or not isinstance(body, dict):
        return None
    valid = [p for p in (body.get("price") or []) if isinstance(p, (int, float))]
    return sum(valid) / len(valid) if valid else None


def _last_known_from_history() -> tuple[float, str] | None:
    """Laatst bekende echte prijs uit het baseline-historiebestand."""
    path = DATA_DIR / "history" / "I-D3-002.json"
    try:
        rows = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(rows, list) and rows:
            last = rows[-1]
            return float(last["value"]), str(last.get("date", ""))
    except (OSError, ValueError, KeyError, TypeError):
        pass
    return None


def fetch_energy_prices(target_date: date) -> FetchResult:
    # 1) Plain endpoint — recentste dag
    plain = _day_mean_from_plain()
    if plain is not None:
        value, obs = plain
        cache_put("I-D3-002", value, _SOURCE, obs)
        return FetchResult(
            "I-D3-002", value, target_date.isoformat(),
            simulated=False, source=_SOURCE, observation_date=obs,
        )

    # 2) Dated endpoint — vandaag, dan gisteren
    for delta in (0, 1):
        d = target_date - timedelta(days=delta)
        val = _day_mean_dated(d)
        if val is not None:
            cache_put("I-D3-002", val, _SOURCE, d.isoformat())
            return FetchResult(
                "I-D3-002", val, target_date.isoformat(),
                simulated=False, source=_SOURCE, observation_date=d.isoformat(),
            )

    # 3) Cache
    cached = cache_get("I-D3-002")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D3-002", value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
        )

    # 4) Laatst bekende echte prijs uit de historie — nog steeds echte data
    hist = _last_known_from_history()
    if hist is not None:
        value, obs = hist
        return FetchResult(
            "I-D3-002", value, target_date.isoformat(),
            simulated=False,
            source=f"laatst bekende prijs uit historie ({_SOURCE})",
            observation_date=obs,
        )

    # 5) Mock — alleen als zelfs de historie ontbreekt
    value = 80 + seasonal_noise(target_date, 0, 25, 15, 0.0)
    return FetchResult(
        "I-D3-002", value, target_date.isoformat(),
        simulated=True, source="mock (Energy-Charts + cache + historie alle leeg)",
    )
```

#### `app/pipeline/pipeline/fetchers/entsoe.py`

```python
"""
ENTSO-E Transparency Platform fetcher voor Belgische energieprijzen.
Doc 03_Laag-4 §2.3: I-D3-002 Energieprijzen €/MWh.

Real-fetch vereist gratis ENTSO-E API token (registratie via
transparency.entsoe.eu). Endpoint:
  https://web-api.tp.entsoe.eu/api?securityToken=...

STATUS: skeleton. Token-injectie via env var ENTSOE_TOKEN.
"""
from __future__ import annotations
import os
from datetime import date
from ..util import FetchResult, seasonal_noise


def fetch_energy_prices(target_date: date) -> FetchResult:
    token = os.environ.get("ENTSOE_TOKEN")
    if token:
        # TODO_REAL_FETCH: implementeer Day-ahead-prices XML-parser
        # (ENTSO-E API geeft XML met Energiebespreking per uur).
        pass
    value = 80 + seasonal_noise(target_date, 0, 25, 15, 0.0)
    return FetchResult(
        "I-D3-002", value, target_date.isoformat(),
        simulated=True, source="mock (ENTSO-E — set ENTSOE_TOKEN voor real-fetch)",
    )
```

#### `app/pipeline/pipeline/fetchers/events.py`

```python
"""
Collectieve gebeurtenissen — RSS-monitor + menselijke confirmation.
Doc 03_Laag-4 §2.5: I-D5-003.

Methodologisch verplicht (doc 03 §2.5): twee onafhankelijke menselijke
codeurs met κ ≥ 0.75. Volledige automatisering is NIET toegestaan.

Wat deze fetcher wel doet:
1. Leest RSS-feeds van VRT NWS, HLN, De Standaard
2. Scoort headlines tegen magnitude-keywords (niveau 1/3/5)
3. Schrijft candidates naar `pending_events.json` voor admin-review
4. Leest `events.json` (door admin bevestigd) voor de daadwerkelijke score

Admin review-workflow: bekijk `pending_events.json` → kopieer relevante
entries naar `events.json`. De fetcher leest alleen events.json voor de
actieve score.

NB: voor MVP draait de classifier op simpele keyword-matching. Echte deployment
vereist een tweede codeur — bv. via een aparte AI-codeur of menselijke review,
met κ-test op 50 historische cases (doc 03 §2.5).
"""
from __future__ import annotations
import json
import math
import re
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta
from pathlib import Path
from ..util import FetchResult, ROOT, safe_request


EVENTS_FILE = ROOT / "pipeline" / "events.json"
PENDING_FILE = ROOT / "pipeline" / "pending_events.json"

RSS_FEEDS = {
    "VRT NWS": "https://www.vrt.be/vrtnws/nl.rss.articles.xml",
    "De Standaard": "https://www.standaard.be/rss/section/F66E3FF1-7AF6-4B95-A98A-43B6C6E7E4C9.rss",
    "De Morgen": "https://www.demorgen.be/rss.xml",
    "Het Laatste Nieuws": "https://www.hln.be/rss.xml",
    "De Tijd": "https://www.tijd.be/rss/ondernemen.xml",
    "Het Belang van Limburg": "https://www.hbvl.be/rss/section/2146FCFC-EE7A-44FD-AB5C-8FF3973BA15A",
    "Bruzz": "https://www.bruzz.be/rss.xml",
    "Knack": "https://www.knack.be/nieuws/feed/",
}

# Magnitude-classificatie via keywords. Doc 03 §2.5 niveaus 1/3/5.
KEYWORDS_MAG_5 = re.compile(
    r"\b(aanslag|terreur|terroristisch|oorlogsverklaring|massa[-\s]?evacuatie)\b",
    re.IGNORECASE,
)
KEYWORDS_MAG_3 = re.compile(
    r"\b(nationale\s+rouw|nationale\s+ramp|tragedie|catastrofe|noodtoestand)\b",
    re.IGNORECASE,
)
KEYWORDS_MAG_1 = re.compile(
    r"\b(zware\s+ramp|noodweer|overstroming|hittegolf\s+rood|grootschalige\s+evacuatie|treintragedie)\b",
    re.IGNORECASE,
)


def _classify(title: str, description: str = "") -> int:
    """Geeft magnitude 0 (geen match), 1, 3, of 5."""
    haystack = f"{title} {description}"
    if KEYWORDS_MAG_5.search(haystack): return 5
    if KEYWORDS_MAG_3.search(haystack): return 3
    if KEYWORDS_MAG_1.search(haystack): return 1
    return 0


def _parse_rss(xml_text: str) -> list[dict]:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return []
    items: list[dict] = []
    # Atom feeds use {namespace}entry, RSS 2.0 uses plain "item"
    for tag_suffix in ("entry", "item"):
        for el in root.iter():
            if not el.tag.endswith(tag_suffix):
                continue
            title = ""
            desc = ""
            link = ""
            pubdate = ""
            for child in el:
                tag = child.tag.split("}", 1)[-1].lower()
                if tag == "title":
                    title = (child.text or "").strip()
                elif tag in ("description", "summary", "content"):
                    if not desc:
                        desc = (child.text or "").strip()
                elif tag in ("pubdate", "published", "updated"):
                    if not pubdate:
                        pubdate = (child.text or "").strip()
                elif tag == "link":
                    href = child.attrib.get("href")
                    if href:
                        link = href
                    elif child.text:
                        link = child.text.strip()
            if title:
                items.append({"title": title, "description": desc, "pubDate": pubdate, "link": link})
        if items:
            break
    return items


def _scan_rss_for_candidates(target_date: date) -> tuple[list[dict], bool]:
    """Return (candidates, rss_reachable).
    rss_reachable = True wanneer minstens één feed succesvol opgehaald is.
    Dat onderscheidt 'geen gebeurtenissen gemeten' (echte 0) van
    'kon niet meten' (feeds onbereikbaar)."""
    candidates = []
    seen_titles = set()
    rss_reachable = False
    for source, url in RSS_FEEDS.items():
        ok, body = safe_request(url, timeout=15, headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"})
        if not ok or not isinstance(body, str):
            continue
        rss_reachable = True
        items = _parse_rss(body)
        for it in items:
            mag = _classify(it["title"], it["description"])
            if mag == 0:
                continue
            if it["title"] in seen_titles:
                continue
            seen_titles.add(it["title"])
            candidates.append({
                "date": target_date.isoformat(),
                "magnitude": mag,
                "title": it["title"],
                "source": source,
                "link": it["link"],
                "auto_detected": True,
                "review_status": "pending",
            })
    return candidates, rss_reachable


def _read_confirmed_events() -> list[dict]:
    if not EVENTS_FILE.exists():
        return []
    try:
        with open(EVENTS_FILE, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def _write_pending(candidates: list[dict]) -> None:
    """Append nieuwe pending events, dedupliceren op title+date."""
    existing = []
    if PENDING_FILE.exists():
        try:
            with open(PENDING_FILE, encoding="utf-8") as f:
                existing = json.load(f)
        except (json.JSONDecodeError, OSError):
            existing = []
    seen = {(e.get("title"), e.get("date")) for e in existing}
    for c in candidates:
        if (c["title"], c["date"]) not in seen:
            existing.append(c)
    with open(PENDING_FILE, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)


def fetch_collective_events(target_date: date) -> FetchResult:
    # Stap 1: scan RSS feeds en schrijf candidates voor admin review
    candidates, rss_reachable = _scan_rss_for_candidates(target_date)
    if candidates:
        _write_pending(candidates)

    # Stap 2: bereken score op basis van door admin BEVESTIGDE events
    confirmed = _read_confirmed_events()
    total = 0.0
    for ev in confirmed:
        try:
            ev_date = datetime.fromisoformat(ev["date"]).date()
        except (KeyError, ValueError):
            continue
        delta = (target_date - ev_date).days
        if 0 <= delta <= 7:
            magnitude = ev.get("magnitude", 1)
            total += magnitude * math.exp(-delta / 3)

    # RSS bereikbaar = echte meting, ook wanneer er 0 gebeurtenissen zijn.
    # Alleen wanneer geen enkele feed bereikbaar was kunnen we niet meten.
    if rss_reachable:
        return FetchResult(
            "I-D5-003", min(total, 15.0), target_date.isoformat(),
            simulated=False,
            source=(f"RSS-monitor (VRT NWS + De Standaard) + events.json "
                    f"({len(confirmed)} bevestigd, {len(candidates)} candidates voor review)"),
        )

    # Geen enkele RSS-feed bereikbaar: we konden niet meten.
    return FetchResult(
        "I-D5-003", min(total, 15.0), target_date.isoformat(),
        simulated=True,
        source="mock (RSS-feeds onbereikbaar, score uit events.json)",
    )
```

#### `app/pipeline/pipeline/fetchers/fod_economie.py`

```python
"""
Brandstof-fetcher voor BE (I-D2-004).
Doc 03_Laag-4 §2.2.

Primaire bron: **be.STAT (Statbel / FOD Economie) — officiele dagelijkse
maximumprijzen aardolieproducten**. Statbel publiceert elke werkdag de
officiele maximumprijs (cliquetsysteem / programmaovereenkomst
petroleumproducten) als machine-leesbare JSON. We lezen "Benzine 95 RON E10"
(€/l, incl. btw) als de stress-relevante pompprijs.

Dit is een upgrade t.o.v. de vorige aanpak (ECB-HICP yoy → €/l-schatting):
de be.STAT-waarde is de ECHTE prijs van de dag zelf, geen maandschatting.

Fallback cascade: be.STAT → ECB HICP CP0722 → carbu scrape → mock.
"""
from __future__ import annotations
import re
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from .statbel import _parse_ecb_latest_with_period


# be.STAT API — officiele maximumprijzen aardolieproducten (FOD Economie)
# View-UUID is een mogelijk breekpunt: bij een lege/gewijzigde respons
# degraderen we netjes naar de ECB-fallback.
BESTAT_FUEL_URL = (
    "https://bestat.statbel.fgov.be/bestat/api/views/"
    "c42c9c16-9330-437b-9608-13781b795ec1/result/JSON"
)
BESTAT_PRODUCT = "Benzine 95 RON E10 (€/L)"

# ECB HICP key voor "Fuels and lubricants for personal transport equipment"
# Coicop 07.2.2, BE, monthly, annual rate of change
ECB_FUEL_HICP_URL = (
    "https://data-api.ecb.europa.eu/service/data/ICP/M.BE.N.072200.4.ANR"
    "?format=jsondata&lastNObservations=1"
)

CARBU_URL = "https://carbu.com/belgie/index.php/laagsteprijs/EUROPE_95/-/-"

EURO95_PATTERN = re.compile(
    r"(?:Euro\s*95|euro95|E95)\D{0,40}?(\d[,.]\d{2,3})",
    re.IGNORECASE,
)
EURO95_BASELINE_PER_L = 1.85  # 2024-baseline voor BE Euro95

# Nederlandse maand-afkortingen zoals Statbel ze in het "Dag"-veld zet
# (bv. "22mei26" → 2026-05-22).
_NL_MONTHS = {
    "jan": 1, "feb": 2, "mrt": 3, "maa": 3, "apr": 4, "mei": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "okt": 10, "nov": 11, "dec": 12,
}
_DAG_RE = re.compile(r"^(\d{1,2})([a-z]{3})(\d{2})$", re.IGNORECASE)


def _parse_bestat_dag(dag: str) -> str | None:
    """'22mei26' → '2026-05-22'. Return None bij onbekend formaat."""
    if not isinstance(dag, str):
        return None
    m = _DAG_RE.match(dag.strip())
    if not m:
        return None
    day, mon, yy = m.group(1), m.group(2).lower(), m.group(3)
    month = _NL_MONTHS.get(mon)
    if month is None:
        return None
    try:
        return f"20{yy}-{month:02d}-{int(day):02d}"
    except ValueError:
        return None


def _try_bestat() -> tuple[float, str] | None:
    """Return (euro_per_l, observation_date_iso) of None."""
    ok, body = safe_request(
        BESTAT_FUEL_URL, timeout=25,
        headers={"Accept": "application/json"},
    )
    if not ok or not isinstance(body, dict):
        return None
    facts = body.get("facts")
    if not isinstance(facts, list):
        return None
    for fact in facts:
        if not isinstance(fact, dict):
            continue
        if fact.get("Product") != BESTAT_PRODUCT:
            continue
        price = fact.get("Prijs incl. BTW")
        try:
            val = float(price)
        except (TypeError, ValueError):
            continue
        if not (0.5 < val < 5.0):
            continue
        obs = _parse_bestat_dag(fact.get("Dag", "")) or None
        return round(val, 3), obs
    return None


def _try_ecb_fuel_hicp() -> tuple[float, float, str] | None:
    """Return (yoy_pct, eur_per_l_estimate, period) of None."""
    ok, body = safe_request(
        ECB_FUEL_HICP_URL, timeout=20,
        headers={"Accept": "application/json"},
    )
    if not ok or not isinstance(body, dict):
        return None
    result = _parse_ecb_latest_with_period(body)
    if result is None:
        return None
    yoy, period = result
    estimate = EURO95_BASELINE_PER_L * (1 + yoy / 100)
    return yoy, round(estimate, 3), period


def _try_scrape(url: str) -> float | None:
    ok, body = safe_request(
        url, timeout=20,
        headers={
            "User-Agent": "Mozilla/5.0 (SBI-pipeline)",
            "Accept-Language": "nl-BE,nl;q=0.9",
        },
    )
    if not ok or not isinstance(body, str):
        return None
    m = EURO95_PATTERN.search(body)
    if not m:
        return None
    try:
        val = float(m.group(1).replace(",", "."))
        if 0.5 < val < 5.0:
            return val
    except ValueError:
        pass
    return None


def fetch_fuel_prices(target_date: date) -> FetchResult:
    # 1) be.STAT — officiele dagelijkse maximumprijs (FOD Economie)
    bestat = _try_bestat()
    if bestat is not None:
        value, obs = bestat
        return FetchResult(
            "I-D2-004", value, target_date.isoformat(),
            simulated=False,
            source="Statbel be.STAT — officiele maximumprijs Benzine 95 E10 (FOD Economie)",
            observation_date=obs or target_date.isoformat(),
        )

    # 2) ECB HICP CP0722 — methodologisch sterke maand-fallback
    hicp = _try_ecb_fuel_hicp()
    if hicp is not None:
        yoy, estimate, period = hicp
        return FetchResult(
            "I-D2-004", estimate, target_date.isoformat(),
            simulated=False,
            source=f"ECB HICP brandstof yoy {yoy:+.1f}% naar €{estimate}/l geschat (be.STAT onbereikbaar)",
            observation_date=period,
        )

    # 3) carbu.com fallback
    val = _try_scrape(CARBU_URL)
    if val is not None:
        return FetchResult(
            "I-D2-004", val, target_date.isoformat(),
            simulated=False, source="carbu.com (BE pomp-prijzen)",
            observation_date=target_date.isoformat(),
        )

    # 4) Conservative mock
    value = 1.85 + seasonal_noise(target_date, 0, 0.12, 0.06, 0.0)
    return FetchResult(
        "I-D2-004", value, target_date.isoformat(),
        simulated=True,
        source="mock (be.STAT + ECB HICP + carbu alle drie faalden)",
    )
```

#### `app/pipeline/pipeline/fetchers/fod_waso.py`

```python
"""
Ontslagen-intensiteit-fetcher voor BE (I-D3-003).
Doc 03_Laag-4 §2.3.

**Eerlijke discloure**: FOD WASO publiceert geen open URL of API voor de
actieve wet-Renault-procedures. Alle URL's die we tot nu toe probeerden
geven 404 — de pagina-structuur wijzigt regelmatig en er is geen stabiele
publieke endpoint.

**Methodologisch-defensieve oplossing**: we gebruiken de **maandelijkse
verandering in BE-werkloosheidsaantallen** als **proxy** voor ontslag-
intensiteit. Dit is geen perfect proxy (een werkloosheidsstijging kan ook
door minder nieuw aangenomen mensen komen), maar wel een echte officiële
bron (ECB LFSI). Volledig gedocumenteerd in `source`.

We schalen de delta naar log(1 + max(0, delta_workers)) zodat de waarde
op dezelfde schaal blijft als de oorspronkelijke indicator.

Toekomst: vervang door directe FOD WASO scrape zodra zij open data publiceren.
"""
from __future__ import annotations
import math
from datetime import date
from ..util import FetchResult, safe_request


# ECB LFSI: BE unemployment rate (%), seasonally adjusted, ages 15-74, total
# We nemen 2 laatste maand-observaties om de delta te berekenen
ECB_UNEMPLOYED_URL = (
    "https://data-api.ecb.europa.eu/service/data/LFSI/M.BE.S.UNEHRT.TOTAL0.15_74.T"
    "?format=jsondata&lastNObservations=2"
)
# Approximate BE workforce (15-74) — voor delta-omzetting naar werkzoekenden-count
BE_WORKFORCE = 5_000_000


def _parse_ecb_last_two(body) -> tuple[float | None, float | None, str]:
    """Return (prev_value, last_value, last_period)."""
    try:
        ds = body["dataSets"][0]
        series = next(iter(ds["series"].values()))
        observations = series["observations"]
        sorted_keys = sorted(observations.keys(), key=lambda k: int(k))
        period = ""
        try:
            obs_dim = body["structure"]["dimensions"]["observation"][0]["values"]
            period = obs_dim[int(sorted_keys[-1])]["id"]
        except (KeyError, IndexError, ValueError, TypeError):
            period = ""
        if len(sorted_keys) < 2:
            v = float(observations[sorted_keys[-1]][0])
            return None, v, period
        prev = float(observations[sorted_keys[-2]][0])
        last = float(observations[sorted_keys[-1]][0])
        return prev, last, period
    except (KeyError, IndexError, ValueError, StopIteration, TypeError):
        return None, None, ""


def fetch_collective_layoffs(target_date: date) -> FetchResult:
    ok, body = safe_request(
        ECB_UNEMPLOYED_URL, timeout=20,
        headers={"Accept": "application/json"},
    )
    if ok and isinstance(body, dict):
        prev_rate, last_rate, period = _parse_ecb_last_two(body)
        if last_rate is not None:
            # Rate is %, delta_pp = procentpunt verandering
            if prev_rate is not None:
                delta_pp = last_rate - prev_rate
                # Convert rate delta to estimated extra unemployed persons
                # 0.1 pp × 5M workforce = ~5000 extra werkzoekenden
                effective_workers = max(0, delta_pp / 100 * BE_WORKFORCE)
                value = math.log1p(effective_workers)
                return FetchResult(
                    "I-D3-003", value, target_date.isoformat(),
                    simulated=False,
                    source=(f"ECB LFSI werkloosheidsrate-delta ({delta_pp:+.2f}pp, "
                            f"~{int(effective_workers)} werkzoekenden, proxy voor ontslagen)"),
                    observation_date=period,
                )
            # Only last available — baseline 0
            return FetchResult(
                "I-D3-003", math.log1p(0), target_date.isoformat(),
                simulated=False,
                source=f"ECB LFSI werkloosheidsrate {last_rate:.1f}% (baseline)",
                observation_date=period,
            )

    # Conservatief fallback
    return FetchResult(
        "I-D3-003", math.log1p(1), target_date.isoformat(),
        simulated=True,
        source="mock (ECB LFSI endpoint faalde)",
    )
```

#### `app/pipeline/pipeline/fetchers/gdelt.py`

```python
"""
Nieuwsnegativiteits-fetcher (I-D5-001).
Doc 03_Laag-4 §2.5.

WETENSCHAPPELIJKE METHODE
-------------------------
Primaire meting: **GDELT DOC 2.0 timelinetone** — de gemiddelde nieuwstoon
van Belgische nieuwsbronnen (sourcecountry:BE, zowel Nederlands- als
Franstalig). negativity = -AvgTone.

Waarom GDELT primair (en niet meer het RSS-lexicon):
GDELT levert ook een ECHTE 24-maanden-historie van exact dezelfde meting
(zie scripts/backfill_gdelt_baseline.py → data/history/I-D5-001.json).
Daardoor wordt de dagwaarde tegen een ECHTE mediaan+MAD-meetlat gewogen,
op dezelfde schaal. Vroeger draaide de baseline op een synthetische
sinus-reeks; dat is nu opgelost.

Naast GDELT meten we de RSS-corpus-toon nog steeds met het NL-valentielexicon
+ bron-niveau poststratificatie naar mediapubliek-profielen. Dat levert de
demografisch gesegmenteerde lezing (negativiteit jong/midden/ouder) die in
de bronvermelding wordt getoond — een controle-meting naast GDELT.

Bron-ladder voor de dagwaarde:
  1. GDELT DOC v2 timelinetone (zelfde schaal als de 24m-baseline)
  2. cache (≤14d)
  3. mock
"""
from __future__ import annotations
import time
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put
from ..lexicon_nl import LEXICON_VERSION, LEXICON_SIZE, tone_of_text
from ..media_profiles import poststratify

# (feed-URL, mediaprofiel-sleutel). Sleutel matcht media_profiles.MEDIA_PROFILES.
RSS_FEEDS = [
    ("https://www.vrt.be/vrtnws/nl.rss.articles.xml", "vrtnws"),
    ("https://www.standaard.be/rss/section/F66E3FF1-7AF6-4B95-A98A-43B6C6E7E4C9.rss", "standaard"),
    ("https://www.demorgen.be/rss.xml", "demorgen"),
    ("https://www.hln.be/rss.xml", "hln"),
    ("https://www.tijd.be/rss/ondernemen.xml", "tijd"),
    ("https://www.hbvl.be/rss/section/2146FCFC-EE7A-44FD-AB5C-8FF3973BA15A", "hbvl"),
    ("https://www.bruzz.be/rss.xml", "bruzz"),
    ("https://www.knack.be/nieuws/feed/", "knack"),
    ("https://sporza.be/nl.rss.articles.xml", "sporza"),
    ("https://trends.knack.be/feed/", "trends"),
    ("https://businessam.be/feed/", "businessam"),
    ("https://www.eoswetenschap.eu/rss.xml", "eos"),
    ("https://newsmonkey.be/feed", "newsmonkey"),
]

GDELT_DOC_URL = "https://api.gdeltproject.org/api/v2/doc/doc"


def _parse_rss_texts(xml_text: str) -> list[str]:
    """Return list van 'titel + samenvatting' strings uit RSS/Atom XML."""
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return []
    items: list[str] = []
    for tag in ("entry", "item"):
        for el in root.iter():
            if not el.tag.endswith(tag):
                continue
            title, desc = "", ""
            for child in el:
                t = child.tag.split("}", 1)[-1].lower()
                if t == "title" and child.text:
                    title = child.text.strip()
                elif t in ("description", "summary", "content") and child.text and not desc:
                    desc = child.text.strip()
            if title:
                items.append(f"{title} {desc}")
        if items:
            break
    return items


import re as _re
_WORD_RE = _re.compile(r"\w{3,}", _re.UNICODE)


def _tokens(text: str) -> set[str]:
    return {t.lower() for t in _WORD_RE.findall(text)}


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / max(len(a | b), 1)


def _dedup_headlines(items: list[tuple[str, str, float]],
                     threshold: float = 0.8) -> list[tuple[str, str, float]]:
    """v0.5 §9.1 — near-duplicate-detectie op token-sets (Jaccard ≥ 0.8).
    Houdt de eerste verschijning per gebeurtenis, gooit copycat-headlines weg."""
    seen: list[set[str]] = []
    out: list[tuple[str, str, float]] = []
    for src, text, tone in items:
        toks = _tokens(text)
        if not toks:
            continue
        if any(_jaccard(toks, s) >= threshold for s in seen):
            continue
        seen.append(toks)
        out.append((src, text, tone))
    return out


def _per_source_tones(
    target_date: date,
) -> tuple[bool, list[tuple[str, float]], int, int, list[tuple[str, str, float]]]:
    """Meet de toon per bron afzonderlijk (RSS-controle-meting, v0.5 §9).
    Return (rss_reachable, [(bron, gemiddelde toon)], n_unique, n_raw,
             top10_negatiefste_headlines)."""
    raw_headlines: list[tuple[str, str, float]] = []
    rss_reachable = False
    for url, key in RSS_FEEDS:
        ok, body = safe_request(
            url, timeout=20,
            headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"},
        )
        if not ok or not isinstance(body, str):
            continue
        rss_reachable = True
        for text in _parse_rss_texts(body):
            result = tone_of_text(text)
            if result is not None:
                raw_headlines.append((key, text.strip(), result[0]))

    deduped = _dedup_headlines(raw_headlines, threshold=0.8)
    by_source: dict[str, list[float]] = {}
    for src, _txt, tone in deduped:
        by_source.setdefault(src, []).append(tone)
    source_tones = [(k, sum(v) / len(v)) for k, v in by_source.items()]
    top_neg = sorted(deduped, key=lambda h: h[2])[:10]
    return rss_reachable, source_tones, len(deduped), len(raw_headlines), top_neg


def gdelt_tone_series(start: date, end: date) -> list[dict] | None:
    """Haal de dagelijkse GDELT-nieuwstoon voor BE op tussen start en end.

    Return list van {"date": "YYYY-MM-DD", "value": negativity} of None.
    negativity = -AvgTone. Eén GDELT-call; gebruikt door zowel de dagelijkse
    fetcher als het 24m-backfill-script (scripts/backfill_gdelt_baseline.py).
    """
    url = (
        f"{GDELT_DOC_URL}?query=sourcecountry:BE"
        f"&mode=timelinetone&format=json"
        f"&startdatetime={start.strftime('%Y%m%d000000')}"
        f"&enddatetime={end.strftime('%Y%m%d235959')}"
    )
    ok, body = safe_request(url, timeout=45, retries=2, retry_delay=8)
    if ok and isinstance(body, str) and "limit requests" in body.lower():
        return None
    if not ok or not isinstance(body, dict):
        return None
    timeline = body.get("timeline", [])
    if not timeline:
        return None
    series = None
    for s in timeline:
        if s.get("seriesAlias") in ("Average Tone", "AvgTone"):
            series = s
            break
    if series is None:
        series = timeline[0]
    out: list[dict] = []
    for pt in series.get("data", []):
        raw_date = str(pt.get("date", ""))
        try:
            iso = datetime.strptime(raw_date[:8], "%Y%m%d").strftime("%Y-%m-%d")
            out.append({"date": iso, "value": round(-float(pt["value"]), 4)})
        except (ValueError, KeyError, TypeError):
            continue
    return out or None


def fetch_news_negativity(target_date: date) -> FetchResult:
    # RSS-controle-meting: demografisch gesegmenteerde lezing (los van de schaal
    # die de composiet aanstuurt — puur descriptief in de bronvermelding).
    seg_text = ""
    rss_ok, source_tones, n_unique, n_raw, top_neg = _per_source_tones(target_date)
    if rss_ok and source_tones and n_unique >= 8:
        ps = poststratify(source_tones)
        if ps["national"] is not None:
            seg = ps["segments"]
            top_titles = " · ".join(
                _re.sub(r"\s+", " ", t).strip()[:120] for _src, t, _tone in top_neg[:3]
            )
            seg_text = (
                f"; RSS-lexicon-controle (Pattern.nl {LEXICON_SIZE} woorden, "
                f"{LEXICON_VERSION}, {n_unique}/{n_raw} unieke artikels na dedup, "
                f"{ps['n_sources']} bronnen, poststratificatie): "
                f"negativiteit jong {-seg['jong']:+.2f} / midden {-seg['midden']:+.2f} / "
                f"ouder {-seg['ouder']:+.2f}. Negatiefste headlines: «{top_titles}»"
            )

    # 1) GDELT timelinetone — zelfde schaal als de 24m-baseline
    time.sleep(8)  # respecteer GDELT rate-limit (1 req / 5s)
    series = gdelt_tone_series(target_date - timedelta(days=21), target_date)
    if series:
        recent = series[-3:]  # lichte stabilisatie tegen ontbrekende laatste dag
        negativity = round(sum(p["value"] for p in recent) / len(recent), 4)
        source = (
            f"GDELT DOC v2 timelinetone (gemiddelde nieuwstoon BE, "
            f"sourcecountry:BE, {len(recent)}d-venster){seg_text}"
        )
        cache_put("I-D5-001", negativity, source, target_date.isoformat())
        return FetchResult(
            "I-D5-001", negativity, target_date.isoformat(),
            simulated=False, source=source,
        )

    # 2) Cache (GDELT-schaal)
    cached = cache_get("I-D5-001")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D5-001", value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
        )

    # 3) Mock
    value = seasonal_noise(target_date, 1.4, 0.6, 0.5, 0.0)
    return FetchResult(
        "I-D5-001", value, target_date.isoformat(),
        simulated=True, source="mock (GDELT + cache leeg)",
    )
```

#### `app/pipeline/pipeline/fetchers/google_trends.py`

```python
"""
Google Trends stress-termen fetcher — v2 met cache-fallback.
Doc 03_Laag-4 §2.5: I-D5-002 — weighted index NL-termen, regio BE.

WAARSCHUWING (Lazer 2014): Google Trends-validiteit is fragiel.
pytrends is de enige gratis weg en wordt door Google regelmatig
rate-limited (429). Daarom dezelfde cache-strategie als GDELT:

Ladder:
1. pytrends real-fetch (met retry)
2. cache (laatst succesvolle waarde, ≤14 dagen)
3. mock met eerlijke vlag

De cache wordt via sbi-cache.json door de GitHub Actions workflow
gecommit terug naar de repo.
"""
from __future__ import annotations
import time
from datetime import date, timedelta
from ..util import FetchResult, seasonal_noise
from ..cache import get as cache_get, put as cache_put


GT_TERMS = ["stress", "burn-out", "slaapproblemen", "moe", "hoofdpijn",
            "angst", "uitgeput", "slapeloosheid"]


def _try_pytrends(target_date: date) -> float | None:
    """Eén poging via pytrends. Return gemiddelde index of None."""
    try:
        from pytrends.request import TrendReq  # type: ignore
        pytrends = TrendReq(hl="nl-BE", tz=60, retries=2, backoff_factor=1.0)
        start = target_date - timedelta(days=14)
        timeframe = f"{start.isoformat()} {target_date.isoformat()}"
        scores = []
        for batch in (GT_TERMS[:5], GT_TERMS[5:]):
            pytrends.build_payload(batch, geo="BE", timeframe=timeframe)
            df = pytrends.interest_over_time()
            if not df.empty:
                scores.extend(df[batch].mean().tolist())
            time.sleep(1)  # kleine pauze tussen batches
        if scores:
            return sum(scores) / len(scores)
    except Exception:  # noqa: BLE001
        pass
    return None


def fetch_stress_searches(target_date: date) -> FetchResult:
    # 1) pytrends real-fetch (2 pogingen met pauze)
    for attempt in range(2):
        val = _try_pytrends(target_date)
        if val is not None:
            source = "Google Trends (pytrends)"
            cache_put("I-D5-002", val, source, target_date.isoformat())
            return FetchResult(
                "I-D5-002", val, target_date.isoformat(),
                simulated=False, source=source,
            )
        if attempt == 0:
            time.sleep(8)

    # 2) Cache-fallback (≤14d) — echte data, mogelijk een paar dagen oud
    cached = cache_get("I-D5-002")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D5-002", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
        )

    # 3) Mock
    value = max(0, seasonal_noise(target_date, 50, 10, 15, 0.0))
    return FetchResult(
        "I-D5-002", value, target_date.isoformat(),
        simulated=True, source="mock (pytrends + cache beide leeg)",
    )
```

#### `app/pipeline/pipeline/fetchers/irail.py`

```python
"""
iRail — live treinverstoringen op het Belgische spoornet.
Doc 03_Laag-4: I-D2-009 — ongeplande spoorverstoringen (domein D2 mobiliteit).

Bron: iRail API (https://api.irail.be/) — open, gratis, geen token. iRail is
een community-project dat de officiële NMBS/SNCB-data ontsluit.

Endpoint: https://api.irail.be/disturbances/?format=json&lang=nl
De respons bevat een lijst 'disturbance'. Elk item heeft een veld 'type' dat
ofwel "disturbance" (ongeplande verstoring) ofwel "planned" (geplande werken)
is. We tellen ENKEL de ongeplande verstoringen — geplande werken zijn
aangekondigd en veroorzaken weinig acute stress.

Hogere waarde = meer ongeplande verstoringen = meer reizigersstress.

iRail vereist een herkenbare User-Agent (fair-use policy).
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

URL = "https://api.irail.be/disturbances/?format=json&lang=nl"
USER_AGENT = "SBI-barometer/0.2 (publieke stress-indicator; contact peter@hoogland.be)"


def _count_unplanned(body: dict) -> int | None:
    """Tel de ongeplande verstoringen in een iRail-disturbances-respons."""
    items = body.get("disturbance")
    if items is None:
        return None
    if not isinstance(items, list):
        return None
    unplanned = 0
    for item in items:
        if not isinstance(item, dict):
            continue
        # iRail markeert geplande werken met type "planned"; ongeplande
        # verstoringen met type "disturbance". Onbekende/ontbrekende type
        # tellen we mee als verstoring (conservatief).
        dtype = str(item.get("type", "")).strip().lower()
        if dtype == "planned":
            continue
        unplanned += 1
    return unplanned


def fetch_train_disruptions(target_date: date) -> FetchResult:
    """Aantal ongeplande spoorverstoringen op het Belgische net (I-D2-009)."""
    ok, body = safe_request(URL, timeout=20, headers={"User-Agent": USER_AGENT})

    if ok and isinstance(body, dict):
        count = _count_unplanned(body)
        if count is not None:
            source = f"iRail API (NMBS/SNCB-verstoringen, {count} ongepland)"
            cache_put("I-D2-009", float(count), source, target_date.isoformat())
            return FetchResult(
                "I-D2-009", float(count), target_date.isoformat(),
                simulated=False, source=source,
                observation_date=target_date.isoformat(),
            )

    # Cache-fallback (≤14d) voordat we naar mock vallen
    cached = cache_get("I-D2-009")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D2-009", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    # Definitief: mock met eerlijke vlag. Basislijn ~6 verstoringen,
    # licht seizoens-gemoduleerd (winter/herfst iets hoger door weer).
    value = max(0.0, round(seasonal_noise(target_date, 6, 3, 3, 1.57)))
    return FetchResult(
        "I-D2-009", value, target_date.isoformat(),
        simulated=True,
        source="mock (iRail onbereikbaar, geen cache)",
        observation_date=target_date.isoformat(),
        error=body if not ok else None,
    )
```

#### `app/pipeline/pipeline/fetchers/irceline.py`

```python
"""
Luchtkwaliteit-fetcher.
Doc 03_Laag-4 §2.1: I-D1-004 — PM2.5, O₃, NO₂ ratio tov WHO 2021.

Bron: Open-Meteo Air Quality API (https://open-meteo.com/en/docs/air-quality-api).
Open en gratis, geen token, geen registratie. Open-Meteo aggregeert publieke
luchtkwaliteits-data van europese meetnetten (CAMS, EEA), inclusief Brussel/BE.

Composite_AQ = max(PM25/15, O3/100, NO2/25) — ratio tov WHO 2021 grenswaarden.
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise


URL = (
    "https://air-quality-api.open-meteo.com/v1/air-quality"
    "?latitude=50.85&longitude=4.35"
    "&hourly=pm2_5,ozone,nitrogen_dioxide"
    "&timezone=Europe%2FBrussels&forecast_days=1"
)

# WHO 2021 grenswaarden (μg/m³)
WHO_PM25 = 15.0   # 24-hour mean
WHO_O3 = 100.0    # 8-hour daily max
WHO_NO2 = 25.0    # 24-hour mean


def _safe_mean(xs):
    vals = [x for x in xs if isinstance(x, (int, float))]
    return sum(vals) / len(vals) if vals else None


def _safe_max(xs):
    vals = [x for x in xs if isinstance(x, (int, float))]
    return max(vals) if vals else None


def fetch_air_quality(target_date: date) -> FetchResult:
    ok, body = safe_request(URL, timeout=20)
    if ok and isinstance(body, dict):
        try:
            hourly = body.get("hourly", {})
            pm25 = _safe_mean(hourly.get("pm2_5", []))
            o3 = _safe_max(hourly.get("ozone", []))
            no2 = _safe_mean(hourly.get("nitrogen_dioxide", []))
            ratios = []
            if pm25 is not None: ratios.append(pm25 / WHO_PM25)
            if o3 is not None:   ratios.append(o3 / WHO_O3)
            if no2 is not None:  ratios.append(no2 / WHO_NO2)
            if ratios:
                composite_aq = max(ratios)
                return FetchResult(
                    "I-D1-004", composite_aq, target_date.isoformat(),
                    simulated=False, source="Open-Meteo Air Quality (CAMS, EEA-data)",
                )
        except (KeyError, TypeError):
            pass
    ratio = max(0.0, seasonal_noise(target_date, 0.8, 0.3, 0.2, 0.0))
    return FetchResult(
        "I-D1-004", ratio, target_date.isoformat(),
        simulated=True, source="mock (Open-Meteo Air Quality endpoint faalde)",
    )
```

#### `app/pipeline/pipeline/fetchers/kmi.py`

```python
"""
KMI/RMI weer-data fetcher.
Doc 03_Laag-4 §2.1: I-D1-002 Hitte, I-D1-003 Kou.

Bron: open-meteo.com — gratis proxy voor Belgisch weer dat de KMI-data
voedt (geen API-key nodig). Vervangt directe KMI-toegang waar die
registratie vereist.

Brussel: 50.85°N, 4.35°E (doc 03 §1.2).
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise


def fetch_temperature_extremes(target_date: date) -> tuple[FetchResult, FetchResult]:
    """Haalt Tmax en Tmin op voor Brussel op een gegeven datum."""
    url = (
        "https://api.open-meteo.com/v1/forecast"
        "?latitude=50.85&longitude=4.35"
        f"&daily=temperature_2m_max,temperature_2m_min"
        f"&start_date={target_date.isoformat()}&end_date={target_date.isoformat()}"
        "&timezone=Europe%2FBrussels"
    )
    ok, body = safe_request(url)

    if ok and isinstance(body, dict):
        try:
            tmax = body["daily"]["temperature_2m_max"][0]
            tmin = body["daily"]["temperature_2m_min"][0]
            # I-D1-002: continu Heat_excess = max(0, Tmax - 30) (doc 03 §2.1)
            heat = max(0.0, tmax - 30) if tmax is not None else seasonal_noise(target_date, 18, 10, 4, -1.57)
            # I-D1-003: continu Cold_excess = max(0, -5 - Tmin)
            cold = max(0.0, -5 - tmin) if tmin is not None else seasonal_noise(target_date, 5, 8, 3, 0)
            return (
                FetchResult("I-D1-002", heat, target_date.isoformat(), simulated=False,
                            source="open-meteo (KMI proxy)"),
                FetchResult("I-D1-003", cold, target_date.isoformat(), simulated=False,
                            source="open-meteo (KMI proxy)"),
            )
        except (KeyError, IndexError, TypeError):
            pass

    # Fallback: synthetische seizoens-gemoduleerde waarde
    return (
        FetchResult("I-D1-002", max(0, seasonal_noise(target_date, 5, 8, 3, -1.57)),
                    target_date.isoformat(), simulated=True, source="mock (KMI fallback)",
                    error=body if not ok else None),
        FetchResult("I-D1-003", max(0, seasonal_noise(target_date, 3, 5, 2, 1.57)),
                    target_date.isoformat(), simulated=True, source="mock (KMI fallback)"),
    )
```

#### `app/pipeline/pipeline/fetchers/layoff_radar.py`

```python
"""
Ontslag-radar (I-D3-003S) — SECUNDAIR signaal.
Doc 02 §10 (secundaire signalen, niet in de composiet).

WAAROM SECUNDAIR
----------------
De primaire ontslag-indicator I-D3-003 draait op de ECB-LFSI-werkloosheids-
delta: een echte officiele bron met een echte, schaal-consistente baseline,
maar met ~2 maanden vertraging.

Collectieve ontslagen worden echter onmiddellijk publiek zodra een bedrijf
ze aankondigt. Deze radar telt elke dag hoeveel Belgische nieuwsartikels
een collectief-ontslag-thema bevatten. Dat is een verse, real-time lezing,
maar zonder een lange eigen historie heeft ze geen betrouwbare meetlat.
Daarom rapporteren we ze als SECUNDAIR signaal (zoals de Reddit-peiling):
zichtbaar en actueel, maar buiten de composiet en de Z-scoring.

Methode: trefwoord-detectie over dezelfde RSS-corpus die de nieuwstoon-
controle gebruikt. Eerlijk over de beperking: trefwoord-tellen overschat
bij veel duiding rond één gebeurtenis. Het is een attentie-radar, geen
banentelling.
"""
from __future__ import annotations
import re
from datetime import date
from ..util import FetchResult, safe_request
from ..cache import get as cache_get, put as cache_put
from .gdelt import RSS_FEEDS, _parse_rss_texts

# Trefwoorden voor collectief-ontslag-/herstructurerings-nieuws.
LAYOFF_TERMS = [
    "collectief ontslag", "collectieve ontslag", "naakte ontslag",
    "herstructurering", "herstructureren", "intentie tot ontslag",
    "wet renault", "banenverlies", "banen verlies", "jobs op de tocht",
    "ontslagronde", "ontslagen vallen", "afslanking", "afdanking",
    "bedrijf sluit", "sluiting van", "faillissement", "failliet",
    "saneringsplan", "herstructureringsplan",
]
# Aantal-banen-detectie ("400 jobs", "1.200 banen")
_JOBS_RE = re.compile(r"(\d[\d.]{1,6})\s*(?:jobs|banen|werknemers|jobverlies)", re.IGNORECASE)


def _matches(text: str) -> bool:
    low = text.lower()
    return any(term in low for term in LAYOFF_TERMS)


def fetch_layoff_radar(target_date: date) -> FetchResult:
    """SECUNDAIR I-D3-003S: telt collectief-ontslag-artikels in de BE-pers."""
    hit_articles = 0
    job_total = 0
    feeds_ok = 0
    for url, _key in RSS_FEEDS:
        ok, body = safe_request(
            url, timeout=20,
            headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"},
        )
        if not ok or not isinstance(body, str):
            continue
        feeds_ok += 1
        for text in _parse_rss_texts(body):
            if _matches(text):
                hit_articles += 1
                for m in _JOBS_RE.finditer(text):
                    try:
                        job_total += int(m.group(1).replace(".", ""))
                    except ValueError:
                        pass

    if feeds_ok >= 4:
        jobs_note = f", ~{job_total} expliciet genoemde jobs" if job_total else ""
        source = (
            f"Ontslag-radar: {hit_articles} artikels met collectief-ontslag-thema "
            f"in {feeds_ok} BE-nieuwsbronnen{jobs_note}; SECUNDAIR, "
            f"trefwoord-detectie, niet in composiet"
        )
        cache_put("I-D3-003S", float(hit_articles), source, target_date.isoformat())
        return FetchResult(
            "I-D3-003S", float(hit_articles), target_date.isoformat(),
            simulated=False, source=source, observation_date=target_date.isoformat(),
        )

    # Cache-fallback
    cached = cache_get("I-D3-003S")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D3-003S", value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    return FetchResult(
        "I-D3-003S", 0.0, target_date.isoformat(),
        simulated=True, source="mock (RSS-feeds onbereikbaar)",
        observation_date=target_date.isoformat(),
    )
```

#### `app/pipeline/pipeline/fetchers/nbb.py`

```python
"""
Nationale Bank België — hypotheekrente.
Doc 03_Laag-4 §2.3: I-D3-006.

We halen de hypotheekrente via de ECB MIR-dataset (Monetary financial Institutions
Interest Rates). ECB krijgt deze data van de nationale centrale banken inclusief
NBB. De ECB SDW JSON-API is open, geen token nodig.

Key voor BE woonkredieten:
  M = monthly, BE = Belgium, B = MFI sector,
  A2C = Lending to households for house purchase, A = total,
  R = annualised agreed rate, A = new business
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from .statbel import _parse_ecb_latest_with_period


ECB_MORTGAGE_URL = (
    "https://data-api.ecb.europa.eu/service/data/MIR/M.BE.B.A2C.A.R.A.2250.EUR.N"
    "?format=jsondata&lastNObservations=1"
)


def fetch_mortgage_rate(target_date: date) -> FetchResult:
    ok, body = safe_request(ECB_MORTGAGE_URL, timeout=20, headers={"Accept": "application/json"})
    if ok and isinstance(body, dict):
        result = _parse_ecb_latest_with_period(body)
        if result is not None:
            val, period = result
            return FetchResult(
                "I-D3-006", val, target_date.isoformat(),
                simulated=False, source="ECB MIR (BE hypotheekrente, nieuwe contracten)",
                observation_date=period,
            )
    value = 3.4 + seasonal_noise(target_date, 0, 0, 0.15, 0.0)
    return FetchResult(
        "I-D3-006", value, target_date.isoformat(),
        simulated=True, source="mock (ECB MIR endpoint faalde)",
    )
```

#### `app/pipeline/pipeline/fetchers/pollen.py`

```python
"""
Pollen-fetcher — totale pollenbelasting boven Brussel.
Doc 03_Laag-4: I-D1-010 — pollenbelasting (domein D1 fysieke leefomgeving).

Bron: Open-Meteo Air Quality API (https://open-meteo.com/en/docs/air-quality-api).
Open en gratis, geen token. Open-Meteo levert de pollen-velden uit CAMS
(Copernicus Atmosphere Monitoring Service), het Europese referentiemodel
voor pollen-verspreiding.

Brussel: 50.85°N, 4.35°E (doc 03 §1.2).

Pollensoorten (korrels/m³): alder_pollen (els), birch_pollen (berk),
grass_pollen (gras), mugwort_pollen (bijvoet), ragweed_pollen (ambrosia).

Waarde = totale pollenbelasting = som van de vijf pollensoorten, gemiddeld
over de recentste beschikbare dag. Hogere waarde = meer pollen in de lucht =
meer hooikoorts-/allergiestress.
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

POLLEN_SPECIES = [
    "alder_pollen",
    "birch_pollen",
    "grass_pollen",
    "mugwort_pollen",
    "ragweed_pollen",
]

URL = (
    "https://air-quality-api.open-meteo.com/v1/air-quality"
    "?latitude=50.85&longitude=4.35"
    f"&hourly={','.join(POLLEN_SPECIES)}"
    "&timezone=Europe%2FBrussels&forecast_days=1"
)


def _day_mean(values: list) -> float | None:
    """Daggemiddelde van één pollensoort over de uurwaarden (None negeren)."""
    nums = [v for v in values if isinstance(v, (int, float))]
    if not nums:
        return None
    return sum(nums) / len(nums)


def fetch_pollen(target_date: date) -> FetchResult:
    """Totale pollenbelasting boven Brussel (I-D1-010)."""
    ok, body = safe_request(URL, timeout=20)

    if ok and isinstance(body, dict):
        hourly = body.get("hourly")
        if isinstance(hourly, dict):
            total = 0.0
            covered = 0
            for species in POLLEN_SPECIES:
                mean = _day_mean(hourly.get(species, []) or [])
                if mean is not None:
                    total += mean
                    covered += 1
            # Open-Meteo levert pollen enkel binnen het CAMS-domein (Europa);
            # buiten het seizoen kunnen waarden 0 zijn — dat is een geldige 0,
            # geen ontbrekende data. We accepteren zodra ≥1 soort data gaf.
            if covered > 0:
                source = (
                    f"Open-Meteo Air Quality (CAMS-pollen, {covered}/"
                    f"{len(POLLEN_SPECIES)} soorten; som korrels/m³)"
                )
                cache_put("I-D1-010", total, source, target_date.isoformat())
                return FetchResult(
                    "I-D1-010", total, target_date.isoformat(),
                    simulated=False, source=source,
                    observation_date=target_date.isoformat(),
                )

    # Cache-fallback (≤14d)
    cached = cache_get("I-D1-010")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D1-010", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    # Definitief: mock. Pollen piekt in de lente (els/berk maart-april,
    # gras mei-juli); fase zo gekozen dat de piek rond april-mei valt.
    value = max(0.0, seasonal_noise(target_date, 35, 60, 20, -1.0))
    return FetchResult(
        "I-D1-010", value, target_date.isoformat(),
        simulated=True,
        source="mock (Open-Meteo pollen onbereikbaar, geen cache)",
        observation_date=target_date.isoformat(),
    )
```

#### `app/pipeline/pipeline/fetchers/reddit.py`

```python
"""
Reddit-sentiment — SECUNDAIRE indicator I-D5-006S.

⚠ METHODOLOGISCHE STATUS — LEES DIT
-----------------------------------
Deze indicator zit BEWUST NIET in het primaire SBI-composiet.

Doc 02 §8 sluit sociale-media-sentiment expliciet uit als primaire bron
(criterium 3: publieke beschikbaarheid + representativiteit). Reddit-gebruikers
zijn GEEN doorsnede van de Belgische bevolking — het is een jongere, vaak
hoger-opgeleide, stedelijke, deels Engelstalige niche.

Daarom is dit een SECUNDAIRE / sensitiviteits-indicator (vergelijk doc 02 §10
secundaire set). Hij wordt apart getoond, expliciet gelabeld als
"niet-representatieve onderstroom-peiling", en draagt NIET bij aan het
stress-cijfer 1-5 of aan banner-activatie.

METHODE
-------
Zelfde lexicon-gebaseerde toon-analyse als de mainstream nieuwsindicator
(Young & Soroka 2012): per post (titel + tekst) de toon
(pos - neg) / woorden × 100, gemiddeld over alle posts.

BRON
----
Reddit publieke JSON-endpoints van Belgische subreddits:
  r/belgium    — algemeen, gemengd NL/FR/EN
  r/Vlaanderen — Nederlandstalig

Reddit vereist een herkenbare User-Agent. Lage frequentie (1×/dag),
read-only, publieke data.
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put
from ..lexicon_nl import LEXICON_VERSION, LEXICON_SIZE, tone_of_text

SUBREDDITS = ["belgium", "Vlaanderen"]
USER_AGENT = "SBI-barometer/0.2 (publieke sensitiviteits-indicator; contact peter@hoogland.be)"


def _fetch_subreddit_posts(sub: str) -> list[str]:
    """Haal titels + selftext van de nieuwste posts uit één subreddit."""
    url = f"https://www.reddit.com/r/{sub}/new.json?limit=100&raw_json=1"
    ok, body = safe_request(url, timeout=20, headers={"User-Agent": USER_AGENT})
    if not ok or not isinstance(body, dict):
        return []
    texts: list[str] = []
    try:
        for child in body.get("data", {}).get("children", []):
            d = child.get("data", {})
            title = d.get("title", "") or ""
            selftext = d.get("selftext", "") or ""
            combined = f"{title} {selftext}".strip()
            if combined:
                texts.append(combined)
    except (AttributeError, TypeError):
        return []
    return texts


def fetch_reddit_sentiment(target_date: date) -> FetchResult:
    all_tones: list[float] = []
    reachable = False
    posts_total = 0
    for sub in SUBREDDITS:
        posts = _fetch_subreddit_posts(sub)
        if posts:
            reachable = True
            posts_total += len(posts)
            for text in posts:
                result = tone_of_text(text)
                if result is not None:
                    all_tones.append(result[0])

    if reachable and all_tones:
        mean_tone = sum(all_tones) / len(all_tones)
        negativity = -mean_tone
        source = (f"Reddit r/belgium + r/Vlaanderen, {posts_total} posts, "
                  f"NL valentie-lexicon ({LEXICON_SIZE} woorden, {LEXICON_VERSION}); "
                  f"SECUNDAIR, niet-representatief, niet in composiet")
        cache_put("I-D5-006S", negativity, source, target_date.isoformat())
        return FetchResult(
            "I-D5-006S", negativity, target_date.isoformat(),
            simulated=False, source=source,
            observation_date=target_date.isoformat(),
        )

    # Reddit blokkeert datacenter-IP's regelmatig — val terug op cache (≤14d)
    cached = cache_get("I-D5-006S")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D5-006S", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    # Definitief: mock met eerlijke vlag
    value = seasonal_noise(target_date, 1.0, 1.0, 2.0, 0.0)
    return FetchResult(
        "I-D5-006S", value, target_date.isoformat(),
        simulated=True,
        source="mock (Reddit onbereikbaar, geen cache)",
        observation_date=target_date.isoformat(),
    )
```

#### `app/pipeline/pipeline/fetchers/statbel.py`

```python
"""
STATBEL/Eurostat/ECB fetcher voor CPI (consumptieprijsindex) en werkloosheid.
Doc 03_Laag-4 §2.3: I-D3-001 CPI inflatie yoy %, I-D3-005 werkloosheid %.

We gebruiken de gestandardiseerde Europese bronnen omdat ze direct
JSON-toegankelijk zijn zonder view-ID-discovery:
- **ECB Statistical Data Warehouse** voor BE HICP (geharmoniseerde inflatie)
- **Eurostat** voor BE werkloosheid

Beide leveren maandelijkse data — in de wekelijkse SBI wordt forward-fill
toegepast (doc 03 §3.2).
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise


# ECB SDW dataset: ICP (Indices of Consumer Prices), key voor BE HICP yoy:
#   M = monthly, BE = Belgium, N = neither working day nor seasonally adjusted,
#   000000 = overall index, 4 = ANR (Annual Rate of change), ANR confirms type
ECB_CPI_URL = (
    "https://data-api.ecb.europa.eu/service/data/ICP/M.BE.N.000000.4.ANR"
    "?format=jsondata&lastNObservations=1"
)

# Eurostat unemployment rate, BE, total, percentage active population, seasonally adjusted
EUROSTAT_UE_URL = (
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/une_rt_m"
    "?geo=BE&sex=T&age=TOTAL&unit=PC_ACT&s_adj=SA&format=JSON&lastTimePeriod=1"
)

# Fallback: ECB LFSI BE unemployment rate (bewezen stabiel)
ECB_UNEMPLOYMENT_URL = (
    "https://data-api.ecb.europa.eu/service/data/LFSI/M.BE.S.UNEHRT.TOTAL0.15_74.T"
    "?format=jsondata&lastNObservations=1"
)


def _parse_ecb_latest(body) -> float | None:
    """ECB SDW JSON-data format heeft genest series-pad. Pak de laatste observatie."""
    result = _parse_ecb_latest_with_period(body)
    return result[0] if result else None


def _parse_ecb_latest_with_period(body) -> tuple[float, str] | None:
    """Pak de laatste ECB-observatie + de periode (bv. '2026-04') waar ze naar verwijst."""
    try:
        ds = body["dataSets"][0]
        series = next(iter(ds["series"].values()))
        observations = series["observations"]
        latest_key = max(observations.keys(), key=lambda k: int(k))
        value = float(observations[latest_key][0])
        # Periode uit structure.dimensions.observation
        period = ""
        try:
            obs_dim = body["structure"]["dimensions"]["observation"][0]["values"]
            period = obs_dim[int(latest_key)]["id"]
        except (KeyError, IndexError, ValueError, TypeError):
            period = ""
        return value, period
    except (KeyError, IndexError, ValueError, StopIteration, TypeError):
        return None


def _parse_eurostat_latest(body) -> tuple[float, str] | None:
    """Eurostat JSON-stat: laatste waarde + bijhorende tijdsperiode."""
    try:
        values = body.get("value", {})
        if not values:
            return None
        last_idx = max(values.keys(), key=lambda k: int(k))
        value = float(values[last_idx])
        # Periode uit dimension.time.category.index/label
        period = ""
        try:
            time_cat = body["dimension"]["time"]["category"]
            index_map = time_cat["index"]
            # vind het label waarvan de index gelijk is aan last_idx
            for label, idx in index_map.items():
                if int(idx) == int(last_idx):
                    period = label
                    break
        except (KeyError, ValueError, TypeError):
            period = ""
        return value, period
    except (KeyError, ValueError, TypeError):
        return None


def fetch_cpi(target_date: date) -> FetchResult:
    ok, body = safe_request(ECB_CPI_URL, timeout=20, headers={"Accept": "application/json"})
    if ok and isinstance(body, dict):
        result = _parse_ecb_latest_with_period(body)
        if result is not None:
            val, period = result
            return FetchResult(
                "I-D3-001", val, target_date.isoformat(),
                simulated=False, source="ECB SDW (BE HICP yoy %)",
                observation_date=period,
            )
    value = 2.5 + seasonal_noise(target_date, 0, 0.5, 0.4, 0.0) / 2
    return FetchResult(
        "I-D3-001", value, target_date.isoformat(),
        simulated=True, source="mock (ECB SDW endpoint faalde)",
    )


def fetch_unemployment(target_date: date) -> FetchResult:
    # Primair: ECB LFSI (zelfde ECB-infrastructuur als ons hypotheek/ontslagen-pad)
    ok, body = safe_request(ECB_UNEMPLOYMENT_URL, timeout=20, headers={"Accept": "application/json"})
    if ok and isinstance(body, dict):
        result = _parse_ecb_latest_with_period(body)
        if result is not None:
            val, period = result
            return FetchResult(
                "I-D3-005", val, target_date.isoformat(),
                simulated=False, source="ECB LFSI (BE werkloosheidsrate, seizoens-gecorrigeerd)",
                observation_date=period,
            )

    # Fallback: Eurostat
    ok, body = safe_request(EUROSTAT_UE_URL, timeout=20, headers={"Accept": "application/json"})
    if ok and isinstance(body, dict):
        result = _parse_eurostat_latest(body)
        if result is not None:
            val, period = result
            return FetchResult(
                "I-D3-005", val, target_date.isoformat(),
                simulated=False, source="Eurostat (BE werkloosheid, seizoens-gecorrigeerd)",
                observation_date=period,
            )

    value = 6.2 + seasonal_noise(target_date, 0, 0, 0.3, 0.0)
    return FetchResult(
        "I-D3-005", value, target_date.isoformat(),
        simulated=True, source="mock (ECB + Eurostat beide faalden)",
    )
```

#### `app/pipeline/pipeline/fetchers/verkeerscentrum.py`

```python
"""
Vlaams Verkeerscentrum — live filedruk via scraping van de filebarometer-widget.
Doc 03_Laag-4 §2.2: I-D2-001 Filezwaarte.

Implementation: het Verkeerscentrum publiceert geen open API maar toont op
hun publieke homepage een "filebarometer" met het huidige aantal km file.
We parsen dat getal uit de HTML.

Eerlijke beperking: filebarometer = momentane km file, niet "file-km × file-min"
zoals doc 03 §2.1 voorschrijft. Dit is een **proxy** voor F_total, want de
publieke widget rapporteert geen tijds-integraal. Update wanneer een betere
bron beschikbaar komt.
"""
from __future__ import annotations
import re
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise


HOMEPAGE_URL = "https://www.verkeerscentrum.be"
# Pattern matcht "filebarometer">5,40 km   (waarde varieert in scheidingsteken)
FILE_PATTERN = re.compile(r'filebarometer">(\d+(?:[,.]\d+)?)\s*km', re.IGNORECASE)


def fetch_traffic_load(target_date: date) -> FetchResult:
    ok, body = safe_request(
        HOMEPAGE_URL,
        timeout=20,
        headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"},
    )
    if ok and isinstance(body, str):
        match = FILE_PATTERN.search(body)
        if match:
            km_str = match.group(1).replace(",", ".")
            try:
                km = float(km_str)
                # Schaal naar km·min equivalent: huidige km × typische 60min spitsduur
                # Dit is een grove benadering — zie doc-string disclaimer.
                value = km * 60
                return FetchResult(
                    "I-D2-001", value, target_date.isoformat(),
                    simulated=False, source="Vlaams Verkeerscentrum (filebarometer scrape)",
                )
            except ValueError:
                pass

    # Mock fallback met weekdag-correctie
    weekday = target_date.weekday()
    is_weekday = 0 <= weekday <= 4
    base = 7500 if is_weekday else 1500
    value = max(0.0, base + seasonal_noise(target_date, 0, 1500, 1200, -0.5))
    return FetchResult(
        "I-D2-001", value, target_date.isoformat(),
        simulated=True, source="mock (Verkeerscentrum scrape faalde)",
    )
```

#### `app/pipeline/pipeline/fetchers/waterinfo.py`

```python
"""
Wateroverlast-signaal (I-D1-009).
Doc 03_Laag-4: domein D1 (omgeving).

Bron: open-meteo Flood API (https://flood-api.open-meteo.com/), die de
GloFAS-rivierafvoer (Global Flood Awareness System, Copernicus/ECMWF)
ontsluit. Open, gratis, geen sleutel, betrouwbaar vanaf een server-IP,
en consistent met de andere open-meteo-bronnen in deze pipeline.

We meten de dagelijkse rivierafvoer (m³/s) op vier punten in grote
Belgische stroomgebieden en sommeren die tot één nationaal hoogwater-
signaal. Hogere afvoer = vollere rivieren = meer overstromingsdruk.
De Maas weegt het zwaarst, wat strookt met het reële risico: de
catastrofale overstromingen van 2021 lagen in het Maas/Vesdre-bekken.

Een eerdere versie probeerde de waterinfo.be KIWIS-API; die vergt het
vooraf opzoeken van station-tijdreeks-id's en bleek niet betrouwbaar
machine-leesbaar. De GloFAS-afvoer is een robuuste, wetenschappelijk
gangbare proxy voor overstromingsdruk.
"""
from __future__ import annotations
from datetime import date, timedelta
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

# Vier punten in grote Belgische stroomgebieden (lat, lon).
RIVER_POINTS = [
    ("Maas/Luik", 50.63, 5.57),
    ("Schelde/Antwerpen", 51.22, 4.40),
    ("Dijle-Demer/Vlaams-Brabant", 50.88, 4.70),
    ("Leie/West-Vlaanderen", 50.83, 3.27),
]

FLOOD_URL = "https://flood-api.open-meteo.com/v1/flood"


def discharge_sum_series(start: date, end: date) -> list[tuple[str, float]]:
    """Som van de rivierafvoer over de vier punten per dag. Chronologisch.
    Wordt door zowel de dagfetcher als het backfill-script gebruikt."""
    lats = ",".join(str(lat) for _, lat, _ in RIVER_POINTS)
    lons = ",".join(str(lon) for _, _, lon in RIVER_POINTS)
    url = (
        f"{FLOOD_URL}?latitude={lats}&longitude={lons}"
        f"&daily=river_discharge"
        f"&start_date={start.isoformat()}&end_date={end.isoformat()}"
    )
    ok, body = safe_request(url, timeout=40, retries=2, retry_delay=3)
    if not ok:
        return []
    locations = body if isinstance(body, list) else [body]
    per_day: dict[str, float] = {}
    counts: dict[str, int] = {}
    for loc in locations:
        if not isinstance(loc, dict):
            continue
        daily = loc.get("daily", {})
        times = daily.get("time", [])
        vals = daily.get("river_discharge", [])
        for t, v in zip(times, vals):
            if isinstance(v, (int, float)):
                per_day[t] = per_day.get(t, 0.0) + float(v)
                counts[t] = counts.get(t, 0) + 1
    # alleen dagen waarop alle vier de punten data leverden
    return [
        (t, round(per_day[t], 2))
        for t in sorted(per_day)
        if counts.get(t) == len(RIVER_POINTS)
    ]


def fetch_flood_signal(target_date: date) -> FetchResult:
    series = discharge_sum_series(target_date - timedelta(days=10), target_date)
    if series:
        latest_date, value = series[-1]
        source = (
            "open-meteo Flood API (GloFAS-rivierafvoer, som van 4 Belgische "
            "stroomgebieden: Maas, Schelde, Dijle-Demer, Leie)"
        )
        cache_put("I-D1-009", value, source, latest_date)
        return FetchResult(
            "I-D1-009", value, target_date.isoformat(),
            simulated=False, source=source, observation_date=latest_date,
        )

    # Cache-fallback
    cached = cache_get("I-D1-009")
    if cached:
        cval, prev_source = cached
        return FetchResult(
            "I-D1-009", cval, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
            observation_date=target_date.isoformat(),
        )

    # Mock
    value = max(0.0, 40.0 + seasonal_noise(target_date, 0.0, 18.0, 10.0, 0.0))
    return FetchResult(
        "I-D1-009", value, target_date.isoformat(),
        simulated=True, source="mock (open-meteo Flood API onbereikbaar)",
        observation_date=target_date.isoformat(),
    )
```

#### `app/pipeline/pipeline/fetchers/wikipedia.py`

```python
"""
Zoekinteresse-/aandachts-fetcher (I-D5-002) — Wikipedia-pageviews.
Doc 03_Laag-4 §2.6.

WAAROM WIKIPEDIA EN NIET MEER GOOGLE TRENDS
-------------------------------------------
Google Trends (pytrends) blokkeert server-IP's: vanaf GitHub Actions
draaide I-D5-002 permanent op cache-fallback, dus niet vers. De Wikimedia
Pageviews-API werkt wel betrouwbaar vanaf elk server-IP, heeft 11 jaar
historie, en levert absolute, reproduceerbare tellingen.

Wikipedia-pageviews zijn een gevestigde proxy voor publieke aandacht in
de digital-epidemiologie-literatuur (Generous et al. 2014; McIver &
Brownstein 2014; Mestyán et al. 2013).

METHODE
-------
We tellen de dagelijkse weergaven (agent=user, dus geen bots) van een
vaste set Nederlandstalige Wikipedia-artikels over stress-thema's, en delen
die door het TOTALE aantal NL-Wikipedia-weergaven van die dag. Dat geeft
een aandachts-index "per miljoen weergaven": hij is drift-gecorrigeerd —
alleen de RELATIEVE interesse in stress-thema's beweegt hem, niet de
algemene groei of krimp van Wikipedia-verkeer. Daarna nemen we het
voortschrijdend 7-daags gemiddelde, wat het weekdag-effect verwijdert.

Pre-registratie-amendement: I-D5-002 was gespecificeerd als Google-Trends-
index 0-100. Deze wijziging is gedocumenteerd en gemotiveerd door de
server-IP-blokkade; de meting blijft conceptueel "publieke aandachts-
interesse in stress-thema's".
"""
from __future__ import annotations
from datetime import date, timedelta
from urllib.parse import quote
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get as cache_get, put as cache_put

WIKI_UA = "LHA-SBI-barometer/1.0 (https://les-hautes-alpes-sbi.surge.sh; peter@hoogland.be)"
_REST = "https://wikimedia.org/api/rest_v1/metrics/pageviews"
WIKI_ARTICLE_BASE = f"{_REST}/per-article/nl.wikipedia/all-access/user"
WIKI_AGG_BASE = f"{_REST}/aggregate/nl.wikipedia/all-access/user"

# Geverifieerde NL-Wikipedia-artikeltitels over stress-thema's.
STRESS_ARTICLES = [
    "Stress",
    "Burn-out",
    "Depressie_(klinisch)",
    "Angststoornis",
    "Overspannenheid",
    "Slapeloosheid",
]


def _ts_to_iso(ts: str) -> str | None:
    ts = str(ts)
    if len(ts) < 8:
        return None
    return f"{ts[0:4]}-{ts[4:6]}-{ts[6:8]}"


def _article_daily(article: str, start: date, end: date) -> dict[str, int]:
    """Dagelijkse weergaven voor één artikel: {YYYY-MM-DD: views}."""
    url = (
        f"{WIKI_ARTICLE_BASE}/{quote(article, safe='')}/daily/"
        f"{start.strftime('%Y%m%d')}/{end.strftime('%Y%m%d')}"
    )
    ok, body = safe_request(
        url, timeout=30, retries=2, retry_delay=3,
        headers={"User-Agent": WIKI_UA, "Accept": "application/json"},
    )
    if not ok or not isinstance(body, dict):
        return {}
    out: dict[str, int] = {}
    for it in body.get("items", []):
        iso = _ts_to_iso(it.get("timestamp", ""))
        if iso is None:
            continue
        try:
            out[iso] = int(it.get("views", 0))
        except (ValueError, TypeError):
            continue
    return out


def _aggregate_daily(start: date, end: date) -> dict[str, int]:
    """Totale NL-Wikipedia-weergaven per dag: {YYYY-MM-DD: views}."""
    url = (
        f"{WIKI_AGG_BASE}/daily/"
        f"{start.strftime('%Y%m%d')}/{end.strftime('%Y%m%d')}"
    )
    ok, body = safe_request(
        url, timeout=30, retries=2, retry_delay=3,
        headers={"User-Agent": WIKI_UA, "Accept": "application/json"},
    )
    if not ok or not isinstance(body, dict):
        return {}
    out: dict[str, int] = {}
    for it in body.get("items", []):
        iso = _ts_to_iso(it.get("timestamp", ""))
        if iso is None:
            continue
        try:
            out[iso] = int(it.get("views", 0))
        except (ValueError, TypeError):
            continue
    return out


def daily_attention_index(start: date, end: date) -> list[tuple[str, float]]:
    """Per dag: (som stress-artikel-weergaven / totale NL-weergaven) x 1e6.
    Chronologisch. Drift-gecorrigeerd aandachts-aandeel."""
    stress: dict[str, int] = {}
    for art in STRESS_ARTICLES:
        for iso, views in _article_daily(art, start, end).items():
            stress[iso] = stress.get(iso, 0) + views
    total = _aggregate_daily(start, end)
    out: list[tuple[str, float]] = []
    for iso in sorted(stress):
        t = total.get(iso)
        if t and t > 0:
            out.append((iso, round(stress[iso] / t * 1_000_000, 3)))
    return out


def trailing_mean_series(
    series: list[tuple[str, float]], window: int = 7,
) -> list[dict]:
    """Voortschrijdend gemiddelde — verwijdert het weekdag-effect."""
    out: list[dict] = []
    for i in range(len(series)):
        lo = max(0, i - window + 1)
        seg = [v for _, v in series[lo:i + 1]]
        out.append({"date": series[i][0], "value": round(sum(seg) / len(seg), 3)})
    return out


def fetch_stress_searches(target_date: date) -> FetchResult:
    # Ruim venster zodat het 7d-gemiddelde een volledig venster heeft.
    start = target_date - timedelta(days=21)
    series = daily_attention_index(start, target_date)
    if len(series) >= 7:
        smoothed = trailing_mean_series(series, window=7)
        latest = smoothed[-1]
        source = (
            f"Wikipedia-pageviews (nl.wikipedia, {len(STRESS_ARTICLES)} stress-artikels "
            f"/ totale NL-weergaven x1e6, agent=user, voortschrijdend 7d-gemiddelde)"
        )
        cache_put("I-D5-002", latest["value"], source, latest["date"])
        return FetchResult(
            "I-D5-002", latest["value"], target_date.isoformat(),
            simulated=False, source=source, observation_date=latest["date"],
        )

    # Cache
    cached = cache_get("I-D5-002")
    if cached:
        value, prev_source = cached
        return FetchResult(
            "I-D5-002", value, target_date.isoformat(),
            simulated=False, source=f"cache (laatst succesvol: {prev_source})",
        )

    # Mock
    value = seasonal_noise(target_date, 28, 6, 5, 0.0)
    return FetchResult(
        "I-D5-002", value, target_date.isoformat(),
        simulated=True, source="mock (Wikipedia + cache leeg)",
    )
```

#### `app/pipeline/pipeline/lexicon_nl.py`

```python
"""
Nederlands valentie-lexicon voor nieuwstoon-analyse.

METHODE
-------
Lexicon-gebaseerde valentie-analyse, de standaardmethode in computationele
sociale wetenschap voor het coderen van nieuwstoon:

  - Young, L. & Soroka, S. (2012). "Affective News: The Automated Coding of
    Sentiment in Political Texts." Political Communication, 29(2), 205-231.
    → de Lexicoder Sentiment Dictionary-methode.
  - Soroka, S., Fournier, P. & Nir, L. (2019). "Cross-national evidence of a
    negativity bias in psychophysiological reactions to news." PNAS 116(38).
    → reeds in doc 02 §8 als onderbouwing van indicator I-D5-001.
  - Leetaru, K. (2013). GDELT Global Knowledge Graph — V2Tone gebruikt
    dezelfde familie van lexicon-gebaseerde toonmeting.

TOON-FORMULE (per artikel, dan gemiddeld over alle artikels):
    tone_article = (pos_count - neg_count) / total_words * 100
    negativity   = -mean(tone_article)

EERLIJKE BEPERKING
------------------
Dit is een gecompileerd lexicon, geen formeel gevalideerd Nederlands
sentiment-woordenboek. De target-state-upgrade is integratie van een
peer-reviewed NL-lexicon (De Smedt & Daelemans 2012, "Pattern", JMLR;
of het NRC Emotion Lexicon, Mohammad & Turney 2013). Tot dan is dit een
transparante, reproduceerbare benadering met expliciete woordenlijst.
Doc 02 §8 erkent reeds dat tone-analyse-validiteit tussen taalgebieden
varieert (Boydstun et al. 2014).
"""
from __future__ import annotations

# Negatieve valentie — nieuws-relevante vocabulaire (crisis, conflict,
# schade, achteruitgang, angst). Stammen + courante varianten.
NEGATIVE = {
    # dood / slachtoffers
    "dood", "doden", "dode", "sterft", "stierf", "gestorven", "overleden",
    "overlijden", "omgekomen", "slachtoffer", "slachtoffers", "fataal",
    "dodelijk", "gewond", "gewonden", "verwond",
    # ramp / catastrofe
    "ramp", "rampen", "rampzalig", "tragedie", "tragisch", "drama",
    "dramatisch", "catastrofe", "catastrofaal", "noodtoestand", "noodweer",
    # geweld / terreur / oorlog
    "aanslag", "aanslagen", "aanval", "aanvallen", "terreur", "terrorist",
    "terroristisch", "geweld", "gewelddadig", "oorlog", "oorlogen",
    "conflict", "conflicten", "gevecht", "strijd", "moord", "vermoord",
    "doodgeschoten", "neergeschoten", "ontvoerd", "ontvoering", "vermist",
    "gijzeling", "explosie", "ontploffing", "bom",
    # brand / natuur
    "brand", "branden", "vuur", "instorting", "ingestort", "instortte",
    "overstroming", "storm", "hittegolf", "droogte", "aardbeving",
    # economie / werk
    "ontslag", "ontslagen", "ontslaat", "afdanking", "afdankingen",
    "faillissement", "failliet", "sluiting", "sluit", "schuld", "schulden",
    "verlies", "verliezen", "verloren", "daling", "gedaald", "dalen",
    "kelderen", "gekelderd", "inzinking", "recessie", "krimp", "krimpt",
    "duurder", "prijsstijging", "armoede", "arm", "honger", "tekort",
    "tekorten", "besparingen", "saneren",
    # sociaal / onrust
    "staking", "stakingen", "staken", "protest", "protesten", "betoging",
    "rel", "rellen", "onrust", "chaos", "paniek",
    # emotie / gezondheid
    "angst", "bang", "vrees", "vrezen", "bezorgd", "bezorgdheid", "zorgen",
    "woede", "boos", "kwaad", "frustratie", "verdriet", "pijn", "lijden",
    "ziek", "ziekte", "besmetting", "virus", "epidemie", "pandemie",
    # dreiging / gevaar
    "dreiging", "bedreiging", "bedreigd", "gevaar", "gevaarlijk", "risico",
    "alarm", "alarmerend", "waarschuwing", "schok", "geschokt",
    # misdaad / schandaal
    "schandaal", "fraude", "corruptie", "misdaad", "crimineel", "diefstal",
    "inbraak", "agressie", "mishandeling",
    # algemeen negatief
    "slecht", "slechter", "slechtste", "fout", "fouten", "mislukt",
    "mislukking", "falen", "gefaald", "probleem", "problemen", "moeilijk",
    "zwaar", "kritiek", "bekritiseerd", "klacht", "klachten", "boete",
    "straf", "veroordeeld", "ruzie", "spanning", "spanningen", "breuk",
    "eenzaam", "eenzaamheid", "depressie", "somber", "wanhoop", "hopeloos",
    "verontrustend", "zorgwekkend", "ernstig", "verslechtering",
}

# Positieve valentie
POSITIVE = {
    # succes / prestatie
    "succes", "succesvol", "gelukt", "geslaagd", "akkoord", "overeenkomst",
    "deal", "oplossing", "opgelost", "doorbraak", "prestatie", "presteren",
    "record", "kampioen", "winst", "gewonnen", "won", "zege", "overwinning",
    # vrede / hulp / herstel
    "vrede", "vreedzaam", "hulp", "geholpen", "helpen", "steun", "gesteund",
    "steunt", "redding", "gered", "redt", "herstel", "hersteld", "herstellen",
    "veerkracht", "solidariteit",
    # groei / vooruitgang
    "groei", "gegroeid", "groeit", "bloei", "bloeiend", "vooruitgang",
    "verbetering", "verbeterd", "verbetert", "ontwikkeling", "innovatie",
    "investering", "investeert", "opening", "geopend", "nieuw", "vernieuwd",
    "stijging", "gestegen", "toename", "voorspoed", "welvaart",
    # emotie / positief
    "beter", "best", "beste", "blij", "vrolijk", "gelukkig", "geluk",
    "tevreden", "trots", "viert", "gevierd", "feest", "viering", "applaus",
    "geprezen", "lof", "dankbaar", "dank", "hoop", "hoopvol", "optimisme",
    "optimistisch", "vertrouwen",
    # kwaliteit
    "mooi", "prachtig", "schitterend", "geweldig", "fantastisch",
    "uitstekend", "knap", "sterk", "sterker", "krachtig", "gezond",
    "veilig", "veiligheid", "bescherming", "beschermd",
    # verbinding
    "vrij", "vrijheid", "samen", "samenwerking", "verbonden", "vriendschap",
    "liefde", "warmte", "genereus", "vrijgevig", "gul", "kans", "kansen",
    "duurzaam", "groen", "schoon", "talent", "gewaardeerd", "eerlijk",
    "rust", "kalm", "stabiel", "stabiliteit",
}

from .lexicon_pattern_nl import POLARITY as _PATTERN_POL, LEXICON_VERSION as _PATTERN_VER

# v0.5 §9.3 Laag 1: Pattern.nl (CLiPS, Universiteit Antwerpen, PDDL) ALS basis
# (2.7k+ NL-woorden met gevalideerde polariteit), met daarbovenop onze eigen
# nieuws-domein overrides (NEGATIVE/POSITIVE) die ramp/aanslag/...-termen
# een sterk signaal geven van ±1.0.
LEXICON_VERSION = f"{_PATTERN_VER}+nieuws-overlay-1.0"
LEXICON_SIZE = len(_PATTERN_POL) + len(NEGATIVE) + len(POSITIVE)

_PUNCT = ".,;:!?\"'()[]«»–-…*#>"


def _word_polarity(w: str) -> float:
    """Polariteit ∈ [-1, +1]. Nieuws-overlay slaat Pattern over."""
    if w in NEGATIVE:
        return -1.0
    if w in POSITIVE:
        return +1.0
    return _PATTERN_POL.get(w, 0.0)


def tone_of_text(text: str, min_words: int = 3) -> tuple[float, int] | None:
    """Toon van één tekst-eenheid (headline + lead) — v0.5 §9.4.
    Som van per-woord polariteit gedeeld door aantal woorden, × 100.
    Hogere score = positiever; lagere = negatiever. Zelfde schaal als v0.2,
    maar nu met continue valenties uit een gevalideerd lexicon (Pattern.nl)
    in plaats van binaire +1/-1 woorddetectie.
    Return (tone, n_words), of None wanneer de tekst te kort is."""
    words = [w.lower().strip(_PUNCT) for w in text.split()]
    words = [w for w in words if w]
    n = len(words)
    if n < min_words:
        return None
    total = sum(_word_polarity(w) for w in words)
    return total / n * 100, n
```

#### `app/pipeline/pipeline/lexicon_pattern_nl.py`

```python
"""Pattern.nl NL-sentimentlexicon (CLiPS, Universiteit Antwerpen).
PDDL-licentie. Per woord: mean polariteit over alle Cornetto-senses.
Bron: https://github.com/clips/pattern/blob/master/pattern/text/nl/nl-sentiment.xml
Filter: alleen woorden met |polariteit| >= 0.06.
"""
from __future__ import annotations

LEXICON_VERSION = "pattern-nl-1.2"
LEXICON_SIZE = 2722

POLARITY: dict[str, float] = {
    "aanbevelenswaardig": 0.6,
    "aanbiddelijk": 0.7,
    "aandachtig": 0.5,
    "aandoenlijk": 0.4,
    "aangebrand": -0.6,
    "aangelegd": 0.7,
    "aangenaam": 0.5,
    "aangeschoten": -0.3,
    "aangeslagen": -0.2,
    "aangrijpend": 0.4,
    "aanhoudend": -0.1,
    "aanlokkelijk": 0.6,
    "aanmatigend": -0.9,
    "aanmerkelijk": 0.1,
    "aannemelijk": 0.4,
    "aanraden": 0.2,
    "aanrader": 0.6,
    "aanschouwelijk": 0.4,
    "aansprakelijk": -0.3,
    "aanstekelijk": 0.6,
    "aanstellerig": -0.6,
    "aantoonbaar": 0.1,
    "aantrekkelijk": 0.8,
    "aanvaardbaar": 0.1,
    "aanvallig": 0.3,
    "aanvechtbaar": -0.4,
    "aanwezig": 0.1,
    "aanwijsbaar": 0.4,
    "aanzienlijk": 0.4,
    "aardig": 0.533,
    "aartslui": -0.7,
    "abnormaal": -0.9,
    "abominabel": -0.7,
    "abrupt": -0.2,
    "absolutistisch": -0.2,
    "absoluut": 0.1,
    "abstract": 0.1,
    "absurd": -0.2,
    "absurdistisch": 0.1,
    "acceptabel": 0.1,
    "accuraat": 0.25,
    "achteloos": -0.45,
    "achterbaks": -0.3,
    "achterdochtig": -0.5,
    "achterhaald": -0.3,
    "actueel": 0.1,
    "acuut": -0.1,
    "adembenemend": 1.0,
    "ademloos": 0.2,
    "adequaat": 0.5,
    "afbreekbaar": 0.6,
    "affectief": 0.1,
    "afgedraaid": -0.5,
    "afgeladen": -0.1,
    "afgeleefd": -0.1,
    "afgepast": 0.4,
    "afgetrapt": -0.4,
    "afgezaagd": -0.5,
    "afgrijselijk": -0.9,
    "afgunstig": -0.6,
    "afhankelijk": -0.1,
    "afkerig": -0.1,
    "afknapper": -0.6,
    "afschaffen": -0.1,
    "afschepen": -0.1,
    "afschrikwekkend": -0.3,
    "afschuwelijk": -1.0,
    "afschuwwekkend": -0.8,
    "afstandelijk": -0.5,
    "afstotelijk": -0.6,
    "aftands": -0.3,
    "afzienbaar": 0.1,
    "agressief": -0.5,
    "akelig": -0.45,
    "alfabetisch": -0.1,
    "algeheel": 0.1,
    "algemeen": -0.233,
    "alledaags": -0.5,
    "allegorisch": 0.1,
    "alleraardigst": 0.4,
    "allerbelangrijkst": 0.4,
    "allerbest": 1.0,
    "allerergst": -0.3,
    "allerhoogst": 0.1,
    "allerleukst": 0.9,
    "allerminst": -0.2,
    "allermooist": 1.0,
    "alomvattend": 0.3,
    "aloud": 0.2,
    "altruïstisch": 0.7,
    "amateuristisch": -0.5,
    "ambitieus": 0.9,
    "amicaal": 0.3,
    "amoureus": 0.3,
    "amusant": 0.6,
    "anaal": -0.8,
    "anachronistisch": 0.4,
    "anekdotisch": -0.1,
    "angelsaksisch": 0.1,
    "angstaanjagend": -0.9,
    "angstig": -0.4,
    "angstwekkend": -0.6,
    "anticommunistisch": -0.3,
    "antifascistisch": 0.3,
    "antiracistisch": 0.6,
    "antisemitisch": -0.4,
    "apart": 0.233,
    "apathisch": -0.9,
    "apert": 0.3,
    "apetrots": 0.8,
    "apocalyptisch": -0.5,
    "arbeidsintensief": -0.2,
    "arbeidsongeschikt": -0.5,
    "arbeidzaam": 0.1,
    "arbitrair": -0.4,
    "archaïsch": -0.4,
    "architectonisch": 0.1,
    "argeloos": -0.2,
    "arglistig": -0.7,
    "argwanend": -0.4,
    "arm": -0.467,
    "armetierig": -0.5,
    "armoedig": -0.6,
    "armzalig": -0.7,
    "arrogant": -0.9,
    "artistiek": 0.1,
    "ascetisch": 0.2,
    "asgrauw": -0.1,
    "asociaal": -0.6,
    "associatief": 0.2,
    "astmatisch": -0.7,
    "astraal": -0.1,
    "astronomisch": 0.35,
    "atonaal": 0.1,
    "atoomvrij": 0.4,
    "attent": 0.2,
    "attractief": 0.8,
    "auteursrechtelijk": 0.1,
    "authentiek": 0.367,
    "autistisch": -0.2,
    "averechts": -0.4,
    "avontuurlijk": 0.55,
    "baanbrekend": 0.5,
    "baarlijk": 0.3,
    "babbelziek": -0.8,
    "badinerend": -0.3,
    "baldadig": -0.4,
    "balorig": -0.4,
    "banaal": -0.5,
    "bancair": -0.1,
    "bang": -0.45,
    "bangelijk": -0.4,
    "bangig": -0.3,
    "bar": -0.4,
    "barbaars": -0.9,
    "barok": -0.2,
    "bars": -0.8,
    "barstensvol": -0.1,
    "basaal": 0.1,
    "bazig": -0.8,
    "bedaard": 0.1,
    "bedachtzaam": 0.6,
    "bedenkelijk": -0.4,
    "bedlegerig": -0.7,
    "bedompt": 0.1,
    "bedroefd": -0.5,
    "beduidend": 0.1,
    "beeldrijk": 0.2,
    "beeldschoon": 1.0,
    "beestachtig": -1.0,
    "befaamd": 0.5,
    "begaafd": 0.7,
    "begaanbaar": 0.3,
    "begeerlijk": 0.6,
    "begeesterd": 0.6,
    "begenadigd": 0.7,
    "begrijpbaar": 0.4,
    "begrijpelijk": 0.4,
    "behaaglijk": 0.4,
    "behendig": 0.6,
    "behoeftig": -0.6,
    "behoorlijk": 0.35,
    "bejaard": -0.1,
    "bekakt": -0.8,
    "bekeken": 0.8,
    "bekend": 0.35,
    "beklagenswaardig": -0.7,
    "beklemmend": -0.5,
    "beklonken": 0.1,
    "bekneld": -0.1,
    "beknopt": 0.1,
    "bekocht": -0.5,
    "bekrompen": -0.6,
    "bekwaam": 0.4,
    "belabberd": -0.6,
    "belachelijk": -1.0,
    "belangeloos": 0.8,
    "belangrijk": 0.35,
    "belangwekkend": 0.7,
    "belastend": -0.4,
    "belazerd": -0.75,
    "beleefd": 0.5,
    "belerend": -0.5,
    "beloftevol": 0.6,
    "belust": 0.1,
    "bemiddeld": 0.4,
    "bemoeiziek": -0.7,
    "bemost": -0.1,
    "benard": -0.5,
    "benauwd": -0.5,
    "benieuwd": 0.4,
    "benig": -0.2,
    "benodigd": 0.5,
    "bepaald": 0.2,
    "beperkt": -0.4,
    "bereid": 0.25,
    "bereikbaar": 0.4,
    "berekend": 0.2,
    "berijdbaar": 0.3,
    "beroemd": 0.5,
    "beroerd": -0.65,
    "berooid": -0.6,
    "berouwvol": -0.5,
    "berucht": -0.1,
    "beschaafd": 0.25,
    "beschamend": -0.5,
    "bescheiden": -0.4,
    "bescheten": -0.4,
    "beschikbaar": 0.4,
    "beschonken": -0.5,
    "beslist": 0.1,
    "besmet": -0.2,
    "besmettelijk": -0.5,
    "besmuikt": -0.2,
    "besodemieterd": -0.7,
    "bespottelijk": -1.0,
    "best": 0.675,
    "betaalbaar": 0.4,
    "betekenisloos": -0.1,
    "betekenisvol": 0.4,
    "beteuterd": -0.5,
    "betraand": -0.3,
    "betrouwbaar": 0.8,
    "betwistbaar": -0.3,
    "beurs": -0.4,
    "bevallig": 0.6,
    "bevindelijk": 0.1,
    "bevredigend": 0.5,
    "bevreesd": -0.4,
    "bewolkt": -0.1,
    "bewonderenswaardig": 0.7,
    "bewust": 0.167,
    "bezeten": -0.2,
    "bezienswaardig": 0.8,
    "bezig": 0.1,
    "bezorgd": -0.1,
    "bezweet": -0.2,
    "bijbehorend": 0.2,
    "bijgelovig": -0.5,
    "bijgenaamd": -0.1,
    "bijster": -0.4,
    "bijtend": -0.4,
    "bijvoeglijk": 0.1,
    "bijzonder": 0.6,
    "bikkelhard": -0.1,
    "billijk": 0.3,
    "biologisch": 0.1,
    "bitter": -0.5,
    "bitterzoet": 0.1,
    "bizar": -0.1,
    "blabla": -0.3,
    "blasfemisch": -0.8,
    "blij": 0.55,
    "blijmoedig": 0.5,
    "bliksems": -0.3,
    "bliksemsnel": 0.1,
    "blind": -0.1,
    "blits": 0.1,
    "bloeddoorlopen": -0.2,
    "bloederig": -0.6,
    "bloedheet": -0.2,
    "bloedig": -0.5,
    "bloedmooi": 1.0,
    "bloedstollend": 0.8,
    "bloemrijk": 0.2,
    "blokkade": -0.1,
    "blokkades": -0.1,
    "blokkeren": -0.1,
    "bloot": 0.1,
    "blut": -0.4,
    "bochtig": -0.1,
    "bodemloos": 0.3,
    "boeiend": 0.9,
    "boers": -0.6,
    "bol": -0.1,
    "bombastisch": -0.5,
    "bomvol": -0.1,
    "bondig": 0.4,
    "boordevol": 0.2,
    "boos": -0.7,
    "bot": -0.3,
    "bourgondisch": 0.8,
    "bovenaards": 0.1,
    "bovenmenselijk": -0.3,
    "bovennatuurlijk": 0.1,
    "bovenst": -0.1,
    "boycot": -0.1,
    "boycotten": -0.1,
    "braaf": 0.2,
    "brak": -0.3,
    "brandend": -0.6,
    "branderig": 0.5,
    "breed": -0.1,
    "breedgebouwd": 0.1,
    "breedgeschouderd": 0.4,
    "briljant": 1.0,
    "broederlijk": 0.3,
    "broeierig": -0.6,
    "bronzen": 0.2,
    "broodmager": -0.2,
    "broodnuchter": 0.5,
    "broos": -0.5,
    "bruin": -0.2,
    "brutaal": -0.3,
    "bruusk": -0.5,
    "bruut": -0.5,
    "buiig": -0.5,
    "buitenaards": 0.1,
    "buitenechtelijk": -0.2,
    "buitengewoon": 0.9,
    "buitenissig": -0.4,
    "buitenmatig": 0.2,
    "buitensporig": -0.3,
    "calvinistisch": 0.1,
    "capabel": 0.6,
    "catastrofaal": -0.6,
    "categorisch": -0.1,
    "chagrijnig": -0.5,
    "chaotisch": -0.5,
    "charismatisch": 0.8,
    "charitatief": 0.5,
    "charlatan": -0.6,
    "charlatanisme": -0.5,
    "charmant": 0.2,
    "chauvinistisch": -0.5,
    "chic": 0.5,
    "chloorhoudend": -0.4,
    "cholerisch": -0.5,
    "chronisch": -0.3,
    "clandestien": -0.3,
    "clash": -0.2,
    "classicistisch": -0.1,
    "claustrofobisch": -0.6,
    "clever": 0.8,
    "cliché": -0.4,
    "clichématig": -0.5,
    "clinch": -0.2,
    "close": 0.8,
    "coherent": 0.4,
    "collegiaal": 0.1,
    "comfortabel": 0.2,
    "commercieel": -0.1,
    "communicatief": 0.1,
    "competent": 0.4,
    "compleet": 0.1,
    "complex": -0.1,
    "compositorisch": 0.1,
    "conceptueel": 0.1,
    "concreet": 0.25,
    "concurrerend": -0.1,
    "confronterend": -0.6,
    "congruent": 0.1,
    "consequent": 0.2,
    "conservatief": -0.1,
    "constructief": 0.1,
    "contemporain": 0.2,
    "content": 0.4,
    "controversieel": -0.5,
    "conventioneel": -0.4,
    "cool": 0.7,
    "copieus": 0.6,
    "corpulent": -0.1,
    "correct": 0.45,
    "cosmetisch": -0.1,
    "coulant": 0.6,
    "crazy": 0.5,
    "creatief": 0.6,
    "crimineel": -0.4,
    "cru": -0.5,
    "cruciaal": 0.4,
    "cryptisch": -0.4,
    "cultureel": 0.1,
    "cumulatief": 0.1,
    "curatief": 0.1,
    "curieus": 0.2,
    "cynisch": -0.6,
    "daadwerkelijk": 0.2,
    "dagenlang": -0.1,
    "dagvers": -0.1,
    "dakloos": -0.1,
    "dankbaar": 0.65,
    "dapper": 0.8,
    "daverend": 0.4,
    "decadent": -0.55,
    "deductief": 0.4,
    "deemoedig": -0.1,
    "deerlijk": -0.7,
    "deerniswekkend": -0.4,
    "defaitistisch": -0.6,
    "deftig": 0.4,
    "degelijk": 0.45,
    "demagogisch": -0.4,
    "dement": -0.7,
    "demonisch": -0.4,
    "demonstratief": -0.2,
    "denderend": 0.4,
    "denkbaar": 0.1,
    "deplorabel": -0.5,
    "depressief": -0.7,
    "derdegraads": -0.5,
    "derderangs": -0.6,
    "desastreus": -0.5,
    "descriptief": 0.2,
    "desolaat": -0.4,
    "destructief": -0.8,
    "deugdzaam": -0.1,
    "devoot": 0.4,
    "diabolisch": -0.6,
    "dichtbij": 0.1,
    "dichterbij": 0.1,
    "dichterlijk": 0.2,
    "dictatoriale": -0.3,
    "didactisch": 0.1,
    "dienstverlenend": -0.1,
    "diep": 0.233,
    "diepblauw": 0.1,
    "diepgaand": 0.4,
    "diepgeworteld": -0.1,
    "diepgravend": 0.5,
    "dieptepunt": -0.3,
    "diepzinnig": 0.6,
    "dierbaar": 0.7,
    "dilettanterig": -0.5,
    "direct": 0.4,
    "discutabel": -0.4,
    "disproportioneel": -0.1,
    "disputabel": -0.4,
    "dissonant": -0.6,
    "divers": 0.1,
    "dodelijk": -0.6,
    "doelbewust": 0.2,
    "doelgericht": -0.1,
    "doelloos": -0.3,
    "doeltreffend": 0.6,
    "dof": 0.4,
    "dogmatisch": -0.5,
    "dol": 0.08,
    "dolblij": 0.6,
    "doldriest": -0.6,
    "dolenthousiast": 0.5,
    "dolgelukkig": 0.6,
    "dom": -0.7,
    "donker": -0.25,
    "donkergrijs": -0.2,
    "dood": -0.2,
    "doodeenvoudig": 0.1,
    "doodgeboren": -0.5,
    "doodgewoon": -0.1,
    "doodkalm": -0.9,
    "doodmoe": -0.5,
    "doodnormaal": -0.4,
    "doods": -0.1,
    "doodsbleek": -0.6,
    "doodsimpel": 0.2,
    "doodziek": -0.7,
    "doordacht": 0.8,
    "doordeweeks": -0.6,
    "doorgaand": -0.3,
    "doorgewinterd": 0.5,
    "doorslaand": 0.4,
    "doorslaggevend": 0.2,
    "doorsnee": -0.1,
    "doortimmerd": 0.1,
    "doorwrocht": 0.7,
    "doorzichtig": 0.1,
    "dorstig": -0.4,
    "draagkrachtig": 0.4,
    "draaibaar": 0.2,
    "drabbig": -0.4,
    "draconisch": -0.5,
    "drakerig": -0.6,
    "dramatisch": -0.367,
    "drammerig": -0.4,
    "drastisch": -0.1,
    "dreigend": -0.2,
    "driedimensionaal": 0.1,
    "driest": -0.7,
    "drinkbaar": 0.4,
    "droef": -0.5,
    "droevig": -0.5,
    "dromerig": 0.3,
    "dronken": -0.3,
    "druilerig": -0.5,
    "druk": -0.233,
    "dubbelhartig": -0.9,
    "dubieus": -0.4,
    "duidelijk": 0.45,
    "duister": -0.2,
    "duivels": -0.5,
    "duizelig": -0.1,
    "duizelingwekkend": 0.5,
    "dun": -0.167,
    "duur": -0.2,
    "duurzaam": 0.1,
    "dwangmatig": -0.6,
    "dwarsbomen": -0.2,
    "dweperig": -0.5,
    "dynamisch": 0.1,
    "dyslectisch": -0.5,
    "echt": 0.2,
    "eclatant": 0.55,
    "edel": -0.7,
    "eeltig": -0.1,
    "eendimensionaal": -0.2,
    "eendrachtig": 0.2,
    "eenduidig": 0.4,
    "eenheidsworst": -0.3,
    "eenhoevig": 0.1,
    "eenparig": 0.1,
    "eens": 0.1,
    "eensluidend": 0.4,
    "eentonig": -0.35,
    "eenvoudig": 0.433,
    "eenzaam": -0.35,
    "eenzelvig": -0.4,
    "eenzijdig": -0.367,
    "eerbiedig": 0.1,
    "eerlijk": 0.65,
    "eerloos": -0.5,
    "eersteklas": 0.9,
    "eersterangs": 0.5,
    "eerzaam": 0.3,
    "eerzuchtig": -0.8,
    "eeuwig": -0.1,
    "effectief": 0.4,
    "efficiënt": 0.5,
    "egocentrisch": -0.7,
    "egoïstisch": -0.9,
    "eigentijds": 0.4,
    "eigenwijs": -0.2,
    "eigenzinnig": -0.1,
    "eindeloos": 0.3,
    "eivol": 0.2,
    "elastieken": -0.1,
    "elegant": 0.8,
    "elementair": 0.1,
    "ellendig": -0.65,
    "ellenlang": -0.2,
    "emotieloos": -0.4,
    "empirisch": 0.1,
    "energiek": 0.5,
    "energiezuinig": 0.4,
    "enerverend": -0.7,
    "eng": -0.45,
    "enig": 0.55,
    "enigst": 0.4,
    "enorm": 0.7,
    "enthousiast": 0.6,
    "epidemisch": -0.5,
    "episch": 0.1,
    "equivalent": 0.2,
    "erbarmelijk": -0.65,
    "erg": -0.35,
    "ergerlijk": -0.8,
    "ergerniswekkend": -0.6,
    "erkend": 0.3,
    "erotisch": 0.6,
    "erudiet": 0.5,
    "ervaren": 0.8,
    "escaleren": -0.1,
    "essentieel": 0.1,
    "esthetisch": 0.1,
    "ethisch": 0.2,
    "eventueel": -0.1,
    "evenwichtig": 0.5,
    "evenwijdig": -0.1,
    "evident": 0.4,
    "exact": 0.3,
    "exceptioneel": 0.1,
    "excessief": -0.4,
    "exemplarisch": 0.2,
    "exhibitionistisch": -0.7,
    "existentieel": 0.2,
    "exotisch": 0.4,
    "experimenteel": 0.1,
    "explosief": 0.4,
    "expressief": 0.1,
    "exquis": 0.7,
    "extatisch": 0.6,
    "extra": 0.4,
    "extreem": 0.1,
    "extreem-links": -0.6,
    "extremistisch": -0.5,
    "exuberant": -0.4,
    "fabelachtig": 0.8,
    "fabuleus": 0.7,
    "fail": -0.3,
    "failliet": -0.3,
    "fair": 0.6,
    "faliekant": -0.7,
    "fameus": 0.5,
    "familiaal": 0.3,
    "fanatiek": -0.2,
    "fantasierijk": 0.6,
    "fantasievol": 0.6,
    "fantastisch": 0.5,
    "fascinerend": 0.8,
    "fascistisch": 0.1,
    "fataal": -0.6,
    "fatsoenlijk": 0.3,
    "fatterig": -0.1,
    "favoriet": 0.65,
    "feest": 0.5,
    "feestelijk": 0.7,
    "feeëriek": 0.7,
    "feilloos": 0.7,
    "felbegeerd": 0.2,
    "fenomenaal": 0.9,
    "ferm": 0.7,
    "fervent": 0.4,
    "fiasco": -0.5,
    "fictief": -0.1,
    "fictioneel": -0.1,
    "fijn": 0.4,
    "fijnbesnaard": 0.4,
    "fijnzinnig": 0.4,
    "fiks": 0.15,
    "filantropisch": 0.6,
    "filosofisch": 0.2,
    "fit": 0.5,
    "flamboyant": 0.4,
    "flauw": -0.567,
    "fleurig": 0.9,
    "flink": 0.4,
    "flinkgebouwd": 0.1,
    "flinterdun": -0.2,
    "flitsend": -0.1,
    "flop": -0.5,
    "florissant": 0.7,
    "fluks": 0.2,
    "flut": -0.6,
    "fnuikend": -0.6,
    "formidabel": 1.0,
    "fors": 0.1,
    "forsgebouwd": 0.1,
    "fortuinlijk": 0.9,
    "fout": -0.5,
    "foutief": -0.5,
    "fraai": 0.6,
    "frank": -0.2,
    "frappant": 0.3,
    "frauduleus": -0.6,
    "frequent": 0.1,
    "fris": 0.5,
    "fruitig": 0.6,
    "frustratie": -0.6,
    "functioneel": 0.5,
    "fundamenteel": 0.2,
    "funest": -0.6,
    "furieus": -0.7,
    "futiel": -0.4,
    "futloos": -0.4,
    "gaaf": 0.6,
    "gallisch": -0.4,
    "gans": 0.1,
    "gastvrij": 0.4,
    "geacht": 0.5,
    "geavanceerd": 0.3,
    "gebeten": -0.3,
    "geborgen": 0.3,
    "gebronsd": 0.1,
    "gebruikersvriendelijk": 0.7,
    "gecharmeerd": 0.4,
    "gecompliceerd": -0.4,
    "gedachteloos": -0.4,
    "gedateerd": -0.3,
    "gedeeltelijk": -0.1,
    "gedegen": 0.6,
    "gedenkwaardig": 0.6,
    "gedesillusioneerd": -0.6,
    "gedetailleerd": 0.4,
    "gedoemd": -0.6,
    "geducht": -0.4,
    "gedupeerd": -0.4,
    "geestdodend": -0.4,
    "geestdriftig": 0.6,
    "geestig": 0.8,
    "geeuw": -0.1,
    "gefingeerd": -0.1,
    "geforceerd": -0.3,
    "gegoed": 0.4,
    "gegrond": 0.2,
    "gehaaid": -0.8,
    "gehaast": -0.1,
    "gehandicapt": -0.4,
    "geheel": 0.1,
    "geheimzinnig": 0.1,
    "geinig": 0.5,
    "gek": 0.067,
    "gekmakend": -0.7,
    "geknipt": 0.8,
    "gekrenkt": -0.8,
    "gekunsteld": -0.5,
    "gekwetst": -0.2,
    "gelaten": -0.1,
    "gelauwerd": 0.8,
    "geldig": 0.4,
    "geldverslindend": -0.4,
    "geldverspilling": -0.4,
    "geleidelijk": 0.1,
    "geletterd": 0.2,
    "gelezen": 0.3,
    "geliefd": 0.8,
    "geliefde": 0.6,
    "gelijkmatig": 0.6,
    "gelikt": -0.4,
    "geloofwaardig": 0.4,
    "geluidsoverlast": -0.2,
    "gelukkig": 0.75,
    "gelukzalig": 0.6,
    "gemaakt": -0.6,
    "gemakkelijk": 0.433,
    "gemakzuchtig": -0.9,
    "gemaskerd": -0.4,
    "gemeen": -0.3,
    "gemiddeld": -0.15,
    "genaamd": -0.1,
    "genadeloos": -0.6,
    "geneeskundig": 0.1,
    "geniaal": 0.75,
    "geniepig": 0.1,
    "genoeglijk": 0.8,
    "genoegzaam": -0.1,
    "genot": 0.5,
    "genoten": 0.4,
    "gepantserd": -0.5,
    "gepassioneerd": 0.6,
    "geraffineerd": 0.2,
    "gerechtigd": 0.6,
    "geregeld": 0.15,
    "geremd": -0.4,
    "gerenommeerd": 0.4,
    "gereputeerd": 0.5,
    "gerespecteerd": 0.5,
    "gerimpeld": -0.1,
    "gering": -0.35,
    "geringschattend": -0.1,
    "geroutineerd": 0.8,
    "geruchtmakend": -0.1,
    "geruisloos": 0.1,
    "gerust": 0.4,
    "geschikt": 0.6,
    "geslaagd": 0.8,
    "geslachtsrijp": 0.1,
    "gespannen": -0.3,
    "gestaag": 0.1,
    "gestoord": -0.4,
    "gestructureerd": 0.2,
    "getalenteerd": 0.7,
    "getapt": 0.2,
    "getiteld": -0.1,
    "getrouw": 0.3,
    "geurig": -0.1,
    "gevaarlijk": -0.6,
    "gevarieerd": 0.2,
    "gevat": 0.3,
    "gevecht": -0.2,
    "gevoelsarm": -0.1,
    "gevorkt": -0.1,
    "gewapend": -0.1,
    "geweldadig": -0.5,
    "gewelddadig": -0.4,
    "geweldig": 0.9,
    "geweldloos": 0.4,
    "gewend": -0.1,
    "gewerveld": 0.1,
    "gewetenloos": -0.6,
    "gewichtig": 0.4,
    "gewonnen": 0.3,
    "gewraakt": -0.7,
    "gezaag": -0.3,
    "gezagsgetrouw": 0.4,
    "gezapig": -0.1,
    "gezellig": 0.8,
    "gezind": 0.6,
    "gezond": 0.5,
    "gezouten": -0.4,
    "gezwind": 0.2,
    "geëmancipeerd": 0.2,
    "geïsoleerd": -0.1,
    "giechelig": 0.5,
    "giftig": -0.6,
    "gigantisch": 0.35,
    "gijzelen": -0.2,
    "gis": 0.8,
    "gitzwart": -0.1,
    "glansloos": -0.4,
    "glansrijk": 0.7,
    "glashelder": 0.3,
    "glazig": 0.3,
    "glibberig": -0.2,
    "globaal": -0.4,
    "gloednieuw": 0.4,
    "glorierijk": 0.5,
    "glorieus": 0.5,
    "goddelijk": 0.4,
    "godgans": 0.1,
    "godsgruwelijk": -1.0,
    "godsjammerlijk": -0.7,
    "godslasterlijk": -0.4,
    "godsonmogelijk": -0.4,
    "godverdoms": -0.5,
    "godverlaten": -0.7,
    "godvruchtig": 0.8,
    "goed": 0.55,
    "goedbedoelend": 0.2,
    "goede": 0.5,
    "goedgeefs": 0.4,
    "goedgelovig": -0.2,
    "goedkeurend": 0.3,
    "goedkoop": -0.1,
    "goedlopend": 0.1,
    "goedmoedig": 0.6,
    "goedwillend": 0.3,
    "goeie": 0.6,
    "golvend": -0.1,
    "goor": -0.65,
    "gortdroog": -0.9,
    "gortig": -0.4,
    "gouden": 0.333,
    "gracieus": 0.4,
    "grandioos": 0.55,
    "grappig": 0.6,
    "gratis": 0.4,
    "gratuit": -0.5,
    "grauw": -0.1,
    "gregoriaans": 0.2,
    "grenzeloos": 0.2,
    "gretig": 0.5,
    "grieperig": -0.5,
    "griezelig": -0.8,
    "grif": -0.2,
    "grijpgraag": -0.4,
    "grillig": -0.15,
    "grimmig": -0.5,
    "groen": 0.15,
    "grof": -0.333,
    "grofgebouwd": 0.1,
    "groggy": -0.4,
    "grondig": 0.6,
    "groot": 0.367,
    "grootmoedig": 0.4,
    "groots": 0.9,
    "grootschalig": 0.3,
    "grootscheeps": 0.2,
    "grotesk": -0.7,
    "gruwel": -0.6,
    "gruwelijk": -1.0,
    "gruwzaam": -0.9,
    "guitig": 0.4,
    "gul": 0.4,
    "gunstig": 0.4,
    "guur": -0.4,
    "gynaecologisch": 0.1,
    "gênant": -0.6,
    "haarscherp": 0.4,
    "haastig": -0.1,
    "hachelijk": -0.5,
    "half": -0.1,
    "halfautomatisch": -0.1,
    "halfbakken": -0.6,
    "halfdood": -0.4,
    "halfhartig": -0.6,
    "halfleeg": -0.3,
    "halfnaakt": 0.1,
    "halsstarrig": -0.8,
    "handig": 0.533,
    "handtastelijk": -0.3,
    "handzaam": 0.4,
    "hanig": -0.7,
    "happig": 0.5,
    "hardhandig": -0.6,
    "hardleers": -0.8,
    "hardnekkig": -0.2,
    "hardvochtig": -0.5,
    "hardwerkend": 0.4,
    "harkerig": -0.1,
    "harmonieus": 0.6,
    "harmonisch": 0.3,
    "hartelijk": 0.7,
    "hartig": 0.7,
    "hartstochtelijk": 0.45,
    "hartveroverend": 0.2,
    "hartverscheurend": -0.2,
    "hartverwarmend": 0.8,
    "hartvormig": 0.2,
    "hatelijk": -0.5,
    "hautain": -0.9,
    "haveloos": -0.4,
    "hebberig": -0.4,
    "hecht": 0.4,
    "hectisch": -0.4,
    "hedendaags": 0.2,
    "hedonistisch": -0.3,
    "heel": 0.133,
    "heerlijk": 0.6,
    "hees": -0.3,
    "heetgebakerd": -0.4,
    "heftig": 0.1,
    "heilig": -0.2,
    "heilloos": -0.6,
    "heimelijk": -0.4,
    "helder": 0.22,
    "heldhaftig": 0.7,
    "hemels": 0.65,
    "hemelsbreed": 0.2,
    "hemeltergend": -0.4,
    "herfstig": -0.4,
    "herkenbaar": 0.1,
    "hersenloos": -0.7,
    "heteroseksueel": 0.4,
    "heus": 0.1,
    "hevig": 0.2,
    "hilarisch": 0.7,
    "hinderlijk": -0.6,
    "hip": 0.4,
    "hobbelig": -0.3,
    "hologig": -0.1,
    "homoseksueel": 0.4,
    "honderdjarig": 0.1,
    "honds": -0.8,
    "hondsdol": -0.3,
    "hongerig": 0.5,
    "hoog": 0.1,
    "hoogbegaafd": 0.2,
    "hoogbejaard": -0.1,
    "hoogdravend": -0.6,
    "hooggeplaatst": 0.6,
    "hooggespannen": -0.1,
    "hooghartig": -0.9,
    "hoogmoedig": -0.9,
    "hoognodig": 0.3,
    "hoogstaand": 0.6,
    "hoogstwaarschijnlijk": 0.1,
    "hoogwaardig": 0.6,
    "hoopgevend": 0.6,
    "hoopvol": 0.5,
    "hopeloos": -0.6,
    "horizontaal": -0.3,
    "houterig": -0.4,
    "hovaardig": -0.9,
    "huiselijk": 0.3,
    "huishoudelijk": 0.6,
    "huiverig": -0.5,
    "huiveringwekkend": -0.6,
    "hulpeloos": -0.5,
    "humaan": 0.5,
    "humeurig": -0.4,
    "humoristisch": 0.6,
    "humorvol": 0.7,
    "hups": 0.3,
    "huwbaar": 0.4,
    "hyperactief": -0.5,
    "hypermodern": 0.6,
    "hypnotisch": 0.1,
    "hypocriet": -0.9,
    "hypothetisch": -0.3,
    "ideaal": 0.9,
    "idealistisch": 0.5,
    "ideëel": 0.6,
    "idioot": -0.8,
    "idioten": -0.6,
    "idolaat": 0.3,
    "ijl": -0.1,
    "ijselijk": -0.9,
    "ijskoud": -0.7,
    "ijsvrij": 0.4,
    "ijzersterk": 0.95,
    "ijzig": -0.367,
    "ijzingwekkend": -0.7,
    "illegaal": -0.6,
    "illusoir": -0.1,
    "illuster": 0.7,
    "illustratief": 0.4,
    "immens": 0.2,
    "immoreel": -0.6,
    "imperialistisch": -0.3,
    "impertinent": -0.5,
    "impliciet": 0.1,
    "impopulair": -0.4,
    "imposant": 0.6,
    "impressief": 0.6,
    "improductief": -0.2,
    "incidenteel": 0.1,
    "incoherent": -0.5,
    "inconsequent": -0.8,
    "incorrect": -0.5,
    "indiscreet": -0.2,
    "indringend": 0.5,
    "indrukwekkend": 0.6,
    "industrieel": 0.4,
    "ineffectief": -0.5,
    "infantiel": -0.7,
    "inferieur": -0.8,
    "inflatoir": -0.2,
    "informatief": 0.3,
    "infrastructureel": 0.6,
    "ingenieus": 0.7,
    "ingetogen": 0.1,
    "ingevroren": -0.2,
    "ingewikkeld": -0.3,
    "ingrijpend": 0.1,
    "inktzwart": -0.1,
    "innig": 0.35,
    "insolvent": -0.1,
    "inspannend": -0.3,
    "inspirerend": 0.5,
    "instemmend": 0.1,
    "instinctmatig": 0.3,
    "instructief": 0.6,
    "instrumentaal": 0.1,
    "instrumenteel": 0.6,
    "integer": 0.5,
    "intellectueel": 0.3,
    "intelligent": 0.8,
    "intens": 0.4,
    "interessant": 0.65,
    "intiem": 0.3,
    "intolerant": -0.8,
    "intrigerend": 0.6,
    "intrinsiek": 0.2,
    "invalide": -0.1,
    "inventief": 0.5,
    "invloedrijk": 0.8,
    "inzichtelijk": 0.4,
    "ironisch": 0.2,
    "irrationeel": -0.6,
    "irrelevant": -0.3,
    "irreëel": -0.4,
    "irritant": -0.7,
    "irritatie": -0.4,
    "jachtig": 0.2,
    "jaloers": -0.6,
    "jammer": -0.5,
    "jammerlijk": -0.5,
    "jarig": 0.1,
    "jazzy": 0.1,
    "jemig": 0.3,
    "jeugdig": 0.4,
    "jolig": -0.4,
    "jong": 0.1,
    "jonggestorven": -0.1,
    "journalistiek": 0.1,
    "juist": 0.5,
    "juweeltje": 0.6,
    "kaarsrecht": 0.1,
    "kaduuk": -0.4,
    "kakelvers": 0.2,
    "kalm": 0.4,
    "kankerverwekkend": -0.6,
    "kansarm": -0.1,
    "kansloos": -0.4,
    "kansrijk": 0.3,
    "kant-en-klaar": 0.6,
    "kapot": -0.35,
    "kardinaal": 0.1,
    "karig": -0.3,
    "karikaturaal": -0.3,
    "katholiek": 0.1,
    "keigoed": 1.0,
    "keihard": 0.1,
    "keiig": 0.7,
    "kerngezond": 0.6,
    "kernwapenvrij": 0.4,
    "ketters": -0.6,
    "keurig": 0.4,
    "kien": 0.8,
    "kiesgerechtigd": 0.1,
    "kil": -0.6,
    "kilometerslang": -0.1,
    "kinderachtig": -0.4,
    "kinderlijk": -0.2,
    "kinderloos": -0.5,
    "kinds": -0.1,
    "kiplekker": 0.3,
    "klaaglijk": -0.7,
    "klaar": 0.367,
    "klaarlicht": 0.5,
    "klagen": -0.3,
    "klagerig": -0.4,
    "klam": -0.1,
    "klef": -0.6,
    "klein": -0.2,
    "kleinburgerlijk": -0.6,
    "kleinzerig": -0.6,
    "kleinzielig": -0.7,
    "klemmend": -0.4,
    "kleurig": -0.1,
    "kleurloos": -0.5,
    "kleurrijk": 0.6,
    "kleverig": -0.4,
    "klimatologisch": -0.5,
    "klinisch": 0.1,
    "klinkklaar": 0.4,
    "kloek": -0.2,
    "kloot": -0.2,
    "klote": -0.5,
    "kloten": -0.2,
    "klucht": -0.6,
    "kluchtig": 0.3,
    "klungelig": -0.6,
    "knap": 0.6,
    "knapperig": 0.1,
    "knoeierig": -0.5,
    "knokig": -0.2,
    "knullig": -0.6,
    "knus": 0.8,
    "koddig": 0.5,
    "koel": -0.6,
    "koeltjes": -0.6,
    "kogelvrij": 0.1,
    "koket": 0.35,
    "kolderiek": -0.8,
    "koloniaal": -0.5,
    "kolossaal": 0.2,
    "komisch": 0.8,
    "kommerlijk": -0.7,
    "kommervol": -0.7,
    "kooplustig": 0.1,
    "koortsachtig": -0.1,
    "koortsig": -0.2,
    "kopen": 0.1,
    "kortaangebonden": -0.4,
    "kortdurend": 0.1,
    "kortzichtig": -0.7,
    "kostbaar": 0.4,
    "kostelijk": 0.9,
    "kostenbesparend": -0.3,
    "koud": -0.4,
    "kouwelijk": -0.2,
    "kraakhelder": 0.3,
    "krachtdadig": 0.6,
    "krachtig": 0.467,
    "krakkemikkig": -0.5,
    "krampachtig": -0.55,
    "krankjorum": 0.9,
    "krankzinnig": -0.7,
    "krap": -0.15,
    "kras": 0.3,
    "kregelig": -0.5,
    "krengerig": -0.3,
    "kreupel": -0.4,
    "kribbig": -0.4,
    "kriebelig": 0.2,
    "krijgshaftig": 0.3,
    "kristalhelder": 0.5,
    "krokant": 0.1,
    "krom": -0.25,
    "kronkelig": -0.2,
    "kroostrijk": 0.1,
    "krukkig": -0.1,
    "kunstig": 0.6,
    "kunstminnend": 0.5,
    "kwaad": -0.65,
    "kwaadaardig": -0.6,
    "kwalijk": -0.6,
    "kwalitatief": 0.4,
    "kwestieus": -0.4,
    "kwetsbaar": -0.1,
    "kwiek": 0.6,
    "kwijt": -0.4,
    "kwistig": -0.1,
    "laag": -0.24,
    "laag-bij-de-gronds": -0.6,
    "laaghartig": -0.9,
    "laaiend": 0.2,
    "laakbaar": -0.6,
    "laat": -0.3,
    "laatdunkend": -0.3,
    "labiel": -0.5,
    "lachwekkend": 0.2,
    "laconiek": -0.1,
    "ladderzat": -0.7,
    "laf": -0.7,
    "lafhartig": -1.0,
    "laks": -0.2,
    "lam": -0.2,
    "lamentabel": -0.7,
    "lang": -0.1,
    "langdradig": -0.6,
    "langdurig": -0.1,
    "langlevend": -0.1,
    "langlopend": 0.1,
    "langzaam": -0.4,
    "lankmoedig": 0.6,
    "larmoyant": -0.3,
    "last": -0.1,
    "lasterlijk": -0.6,
    "lastig": -0.75,
    "latent": -0.1,
    "laveloos": -0.4,
    "leed": -0.5,
    "leefbaar": 0.4,
    "leeg": -0.467,
    "leerplichtig": 0.4,
    "leerzaam": 0.6,
    "leesbaar": 0.25,
    "legendarisch": 0.7,
    "legitiem": 0.1,
    "leidinggevend": 0.6,
    "lekker": 0.6,
    "lelijk": -0.667,
    "letterlijk": 0.1,
    "leugenaar": -0.4,
    "leugenaars": -0.5,
    "leugenachtig": -0.6,
    "leuk": 0.6,
    "levendig": 0.6,
    "levenloos": -0.35,
    "levensecht": 0.3,
    "levensgevaarlijk": -0.6,
    "levenslang": -0.1,
    "levenslustig": 0.7,
    "lexicografisch": -0.1,
    "lezenswaardig": 0.5,
    "licht": 0.225,
    "lichtblauw": -0.1,
    "lichtgeel": 0.1,
    "lichtgeraakt": -0.4,
    "lichtgevend": 0.2,
    "lichtvoetig": 0.2,
    "lichtzinnig": -0.5,
    "lief": 0.633,
    "liefdadig": 0.5,
    "liefdeloos": -0.6,
    "liefdevol": 0.6,
    "lieflijk": 0.4,
    "liefst": 0.4,
    "liegen": -0.1,
    "lijvig": -0.2,
    "lila": -0.1,
    "link": -0.1,
    "links": -0.167,
    "links-radicaal": -0.4,
    "listig": -0.6,
    "literair": 0.1,
    "lodderig": -0.5,
    "loeihard": -0.4,
    "logisch": 0.3,
    "logistiek": 0.1,
    "lollig": 0.6,
    "lomp": -0.75,
    "loodgrijs": -0.1,
    "loodrecht": 0.1,
    "loodzwaar": -0.3,
    "loom": -0.3,
    "loos": 0.1,
    "los": 0.133,
    "losers": -0.7,
    "loyaal": 0.7,
    "luchtdicht": -0.1,
    "luchthartig": 0.4,
    "luchtig": 0.3,
    "lucratief": -0.1,
    "ludiek": 0.2,
    "luguber": -0.8,
    "lui": -0.7,
    "luid": 0.1,
    "lullig": -0.6,
    "lumineus": 0.8,
    "luttel": -0.1,
    "lux": 0.6,
    "luxe": 0.6,
    "luxueus": 0.6,
    "lyrisch": 0.25,
    "maatschappijkritisch": 0.2,
    "macaber": -0.7,
    "machiavellistisch": -0.9,
    "macho": -0.2,
    "machteloos": -0.5,
    "machtig": 0.4,
    "macrobiotisch": 0.6,
    "maf": 0.1,
    "mager": -0.3,
    "magisch": 0.55,
    "magistraal": 0.9,
    "magnifiek": 0.9,
    "makkelijk": 0.75,
    "mal": -0.2,
    "malafide": -0.7,
    "manhaftig": 0.7,
    "manisch-depressief": -0.2,
    "mank": -0.4,
    "manmoedig": 0.7,
    "marginaal": -0.25,
    "markant": 0.3,
    "masochistisch": -0.6,
    "massaal": 0.2,
    "mat": -0.5,
    "mateloos": -0.1,
    "matig": -0.25,
    "maximaal": 0.2,
    "mededeelzaam": 0.6,
    "medeplichtig": -0.4,
    "medeschuldig": -0.4,
    "medisch": 0.1,
    "meedogenloos": -0.8,
    "meegaand": 0.4,
    "meelijwekkend": -0.4,
    "meerderjarig": 0.1,
    "meerduidig": -0.3,
    "meerstemmig": 0.1,
    "meeslepend": 0.7,
    "meesterlijk": 0.9,
    "meesterwerk": 0.6,
    "meetbaar": 0.1,
    "mega": 0.4,
    "melancholiek": -0.4,
    "melancholisch": -0.4,
    "melig": 0.15,
    "melodieus": 0.4,
    "melodramatisch": -0.5,
    "memorabel": 0.5,
    "meneerke": -0.2,
    "menselijk": 0.2,
    "mensonterend": -0.7,
    "mensonwaardig": -0.7,
    "menswaardig": 0.1,
    "merkbaar": 0.1,
    "meteorologisch": -0.5,
    "micro-economisch": 0.6,
    "middeleeuws": -0.4,
    "middelmatig": -0.3,
    "mieters": 0.8,
    "miezerig": -0.3,
    "milieubewust": 0.2,
    "milieuvriendelijk": 0.4,
    "militair": -0.1,
    "militant": -0.5,
    "min": -0.5,
    "minachtend": -0.4,
    "minderwaardig": -0.2,
    "mineraal": -0.1,
    "minimaal": -0.1,
    "minutieus": 0.3,
    "minzaam": -0.1,
    "miraculeus": 0.9,
    "mis": -0.5,
    "misdeeld": -0.3,
    "miserabel": -0.7,
    "miskleun": -0.4,
    "mislukkeling": -0.5,
    "mislukking": -0.2,
    "mismaakt": -0.4,
    "mismoedig": -0.4,
    "misplaatst": -0.8,
    "misprijzend": -0.6,
    "misselijk": -0.6,
    "misser": -0.2,
    "mistroostig": -0.6,
    "misvormd": -0.3,
    "modaal": -0.2,
    "modderig": -0.4,
    "modebewust": 0.2,
    "modern": 0.2,
    "modernistisch": 0.2,
    "modieus": 0.4,
    "moe": -0.5,
    "moedeloos": -0.3,
    "moedig": 0.9,
    "moeilijk": -0.4,
    "moeiteloos": 0.4,
    "moeizaam": -0.5,
    "mogelijk": 0.1,
    "mondain": -0.2,
    "monddood": -0.4,
    "mondig": 0.3,
    "mongoloïde": -0.2,
    "monogaam": 0.4,
    "monsterachtig": -0.4,
    "monter": 0.4,
    "mooi": 0.7,
    "moppig": 0.7,
    "morbide": -0.8,
    "moreel": 0.2,
    "muf": -0.6,
    "muffig": -0.5,
    "mul": 0.1,
    "multifunctioneel": 0.4,
    "multinationaal": 0.4,
    "murw": -0.5,
    "must": 0.2,
    "muurvast": -0.3,
    "muzikaal": 0.2,
    "mwah": -0.3,
    "mysterieus": 0.4,
    "mythisch": 0.4,
    "mythologisch": 0.2,
    "naadloos": 0.1,
    "naar": -0.65,
    "naargeestig": -0.7,
    "naarstig": 0.1,
    "naast": 0.1,
    "nabij": 0.1,
    "nadelig": -0.5,
    "nader": 0.167,
    "nalatig": -0.4,
    "napoleontisch": -0.2,
    "narcistisch": -0.6,
    "narrig": -0.6,
    "nat": -0.1,
    "nationalistisch": -0.1,
    "natuurlijk": 0.275,
    "nauwgezet": 0.4,
    "nauwkeurig": 0.4,
    "navrant": -0.6,
    "naïef": -0.5,
    "neergeknuppeld": -0.2,
    "nefast": -0.5,
    "negatief": -0.333,
    "neofascistisch": 0.1,
    "neonazistisch": -0.5,
    "nerveus": -0.5,
    "net": 0.55,
    "netelig": -0.4,
    "netjes": 0.55,
    "neurenbergs": 0.7,
    "neurotisch": -0.5,
    "nevelachtig": 0.1,
    "nevengeschikt": -0.3,
    "nichterig": -0.1,
    "niet-bindend": 0.2,
    "niet-commercieel": 0.3,
    "nietsvermoedend": -0.2,
    "nietszeggend": -0.5,
    "nieuw": 0.15,
    "nieuwsgierig": 0.2,
    "nijpend": -0.2,
    "nipt": -0.1,
    "nobel": 0.6,
    "nodeloos": -0.5,
    "nodig": 0.25,
    "noemenswaardig": 0.1,
    "non-profit": 0.3,
    "non-stop": -0.1,
    "nonchalant": -0.5,
    "noodgedwongen": -0.4,
    "noodlottig": -0.6,
    "noodzakelijk": 0.1,
    "normaal": 0.1,
    "nors": -0.5,
    "nostalgisch": -0.1,
    "nuchter": 0.233,
    "nukkig": -0.3,
    "nurks": -0.4,
    "nutteloos": -0.5,
    "nuttig": 0.6,
    "obscuur": -0.5,
    "obsessief": -0.5,
    "obstinaat": -0.2,
    "occult": -0.5,
    "ocharme": -0.1,
    "oenig": -0.6,
    "oersaai": -1.0,
    "oersterk": 0.6,
    "oeverloos": -0.2,
    "officieel": 0.1,
    "ogenblikkelijk": 0.4,
    "oliedom": -0.6,
    "olympisch": 0.2,
    "omineus": -0.6,
    "omslachtig": -0.5,
    "omzichtig": 0.4,
    "onaangenaam": -0.6,
    "onaangepast": -0.6,
    "onaangevochten": 0.3,
    "onaantastbaar": 0.8,
    "onaantrekkelijk": -0.8,
    "onaanzienlijk": -0.45,
    "onaardig": -0.6,
    "onacceptabel": -0.6,
    "onachtzaam": -0.1,
    "onaf": -0.3,
    "onafhankelijk": 0.4,
    "onafwendbaar": -0.2,
    "onafzienbaar": -0.1,
    "onalledaags": 0.1,
    "onbaatzuchtig": 0.4,
    "onbarmhartig": -0.6,
    "onbeantwoord": -0.1,
    "onbedachtzaam": -0.3,
    "onbedoeld": -0.3,
    "onbedreigd": 0.1,
    "onbegaanbaar": -0.2,
    "onbegrensd": 0.2,
    "onbegrepen": -0.6,
    "onbegrijpelijk": -0.6,
    "onbehaaglijk": -0.4,
    "onbeheersbaar": -0.1,
    "onbeheerst": -0.4,
    "onbeholpen": -0.5,
    "onbehoorlijk": -0.6,
    "onbekend": -0.15,
    "onbelangrijk": -0.4,
    "onbeleefd": -0.6,
    "onbelemmerd": 0.4,
    "onbenullig": -0.45,
    "onbenut": -0.6,
    "onbepaald": 0.2,
    "onbeperkt": 0.2,
    "onberekenbaar": -0.4,
    "onberoerd": -0.25,
    "onbeschermd": -0.4,
    "onbeschoft": -0.6,
    "onbeschrijfelijk": 0.1,
    "onbestaand": -0.3,
    "onbestemd": -0.1,
    "onbestreden": 0.3,
    "onbesuisd": -0.3,
    "onbetamelijk": -0.6,
    "onbetreden": 0.1,
    "onbetrouwbaar": -0.8,
    "onbetwist": 0.3,
    "onbetwistbaar": 0.1,
    "onbevangen": 0.4,
    "onbevattelijk": -0.6,
    "onbevredigd": -0.6,
    "onbevredigend": -0.7,
    "onbewogen": -0.5,
    "onbewolkt": 0.1,
    "onbewust": -0.1,
    "onbezonnen": -0.6,
    "onbezorgd": 0.4,
    "onbillijk": -0.4,
    "onbreekbaar": 0.1,
    "onbuigzaam": -0.9,
    "onchristelijk": -0.4,
    "oncomfortabel": -0.9,
    "oncontroleerbaar": -0.1,
    "onconventioneel": 0.4,
    "ondankbaar": -0.4,
    "ondemocratisch": -0.2,
    "ondenkbaar": -0.2,
    "ondergeschikt": -0.1,
    "onderhoudend": 0.6,
    "onderhuids": -0.1,
    "ondermaats": -0.7,
    "onderontwikkeld": -0.5,
    "onderst": -0.1,
    "ondervoed": -0.5,
    "ondeskundig": -0.4,
    "ondeugdelijk": -0.1,
    "ondeugend": 0.3,
    "ondoelmatig": -0.4,
    "ondoenlijk": -0.4,
    "ondoordacht": -0.3,
    "ondoordringbaar": -0.2,
    "ondoorgrondelijk": -0.6,
    "ondoorzichtig": -0.6,
    "ondrinkbaar": -0.5,
    "ondubbelzinnig": 0.2,
    "onduidelijk": -0.4,
    "oneens": -0.4,
    "oneerbaar": -0.4,
    "oneerbiedig": -0.2,
    "oneerlijk": -0.6,
    "oneetbaar": -0.2,
    "oneffen": -0.3,
    "oneindig": -0.1,
    "onervaren": -0.6,
    "onevenaarbaar": 0.9,
    "onevenwichtig": -0.5,
    "onfatsoenlijk": -0.7,
    "onfeilbaar": 0.7,
    "onfris": -0.4,
    "ongebreideld": 0.3,
    "ongecompliceerd": 0.4,
    "ongecontroleerd": -0.1,
    "ongecoördineerd": 0.3,
    "ongedisciplineerd": -0.6,
    "ongeduldig": -0.2,
    "ongefundeerd": -0.4,
    "ongehinderd": 0.3,
    "ongehoord": -0.3,
    "ongekend": 0.6,
    "ongekroond": 0.1,
    "ongekunsteld": 0.4,
    "ongelegen": -0.3,
    "ongelezen": 0.1,
    "ongelimiteerd": 0.1,
    "ongelofelijk": 0.4,
    "ongelofeloos": 0.9,
    "ongelooflijk": 0.3,
    "ongeloofwaardig": -0.6,
    "ongelovig": -0.5,
    "ongelukkig": -0.5,
    "ongemakkelijk": -0.533,
    "ongemerkt": -0.15,
    "ongenadig": -0.4,
    "ongeneeslijk": -0.5,
    "ongenuanceerd": -0.4,
    "ongepast": -0.6,
    "ongeremd": 0.35,
    "ongerijmd": -0.1,
    "ongerust": -0.1,
    "ongeschikt": -0.6,
    "ongestoord": 0.4,
    "ongevaarlijk": 0.6,
    "ongewapend": 0.2,
    "ongewassen": -0.4,
    "ongezeglijk": -0.1,
    "ongezond": -0.6,
    "ongezouten": 0.4,
    "ongeëvenaard": 0.7,
    "ongeïnspireerd": -0.5,
    "ongunstig": -0.4,
    "onguur": -0.4,
    "onhandig": -0.45,
    "onhebbelijk": -0.7,
    "onheilspellend": -0.6,
    "onherbergzaam": -0.2,
    "onherkenbaar": -0.2,
    "onherroepelijk": -0.2,
    "onheuglijk": -0.4,
    "onhoudbaar": -0.5,
    "onhygiënisch": -0.7,
    "oninteressant": -0.6,
    "onjuist": -0.45,
    "onkerkelijk": -0.1,
    "onkuis": -0.5,
    "onkwetsbaar": 0.5,
    "onleefbaar": -0.7,
    "onleesbaar": -0.55,
    "onlogisch": -0.4,
    "onlosmakelijk": 0.2,
    "onmachtig": -0.5,
    "onmenselijk": -0.9,
    "onmetelijk": 0.2,
    "onmisbaar": 0.4,
    "onmiskenbaar": 0.1,
    "onmogelijk": -0.533,
    "onnadrukkelijk": 0.6,
    "onnaspeurbaar": -0.6,
    "onnaspeurlijk": -0.6,
    "onnatuurlijk": -0.5,
    "onnavolgbaar": 0.4,
    "onnodig": -0.4,
    "onnozel": -0.5,
    "onofficieel": -0.1,
    "onomstotelijk": 0.1,
    "onomstreden": 0.3,
    "onomwonden": -0.1,
    "onontbeerlijk": 0.4,
    "onontkoombaar": -0.1,
    "onooglijk": -0.4,
    "onopgehelderd": -0.1,
    "onopgelost": -0.3,
    "onopgevoed": -0.3,
    "onoplosbaar": -0.1,
    "onopvallend": -0.5,
    "onoverbrugbaar": -0.6,
    "onoverkomelijk": -0.1,
    "onovertroffen": 1.0,
    "onoverwinnelijk": 0.7,
    "onoverzichtelijk": -0.5,
    "onpeilbaar": -0.6,
    "onpersoonlijk": -0.5,
    "onplezierig": -0.6,
    "onprettig": -0.6,
    "onproductief": -0.3,
    "onrealistisch": -0.4,
    "onrechtvaardig": -0.7,
    "onredelijk": -0.4,
    "onrendabel": -0.3,
    "onrijp": -0.2,
    "onrustbarend": -0.4,
    "onrustig": -0.3,
    "onsamenhangend": -0.5,
    "onschadelijk": 0.6,
    "onschatbaar": 0.4,
    "onscherp": -0.2,
    "onschuldig": 0.333,
    "onsmakelijk": -0.7,
    "onsportief": -0.5,
    "onsterfelijk": 0.7,
    "onstuimig": 0.3,
    "onstuitbaar": 0.2,
    "onsympathiek": -0.7,
    "onterecht": -0.4,
    "ontevreden": -0.4,
    "ontgoocheld": -0.4,
    "onthand": -0.6,
    "onthutst": -0.6,
    "ontluisterend": -0.4,
    "ontoegankelijk": -0.2,
    "ontoerekeningsvatbaar": -0.3,
    "ontploffen": -0.3,
    "ontroerend": 0.5,
    "ontspannen": 0.6,
    "ontspannend": 0.9,
    "ontvlambaar": -0.6,
    "ontzaglijk": 0.2,
    "ontzagwekkend": 0.6,
    "ontzet": -0.6,
    "ontzettend": 0.2,
    "ontzettende": -0.1,
    "ontzield": -0.3,
    "onuitputtelijk": 0.9,
    "onuitroeibaar": -0.5,
    "onuitsprekelijk": -0.4,
    "onuitstaanbaar": -0.8,
    "onuitvoerbaar": -0.4,
    "onuitwisbaar": 0.2,
    "onveilig": -0.6,
    "onverantwoord": -0.7,
    "onverantwoordelijk": -0.7,
    "onverbloemd": 0.2,
    "onverbrekelijk": 0.4,
    "onverdacht": 0.1,
    "onverdeeld": 0.1,
    "onverdroten": 0.4,
    "onverenigbaar": -0.1,
    "onvergankelijk": 0.4,
    "onvergeeflijk": -0.5,
    "onvergetelijk": 0.8,
    "onverhard": -0.4,
    "onverhoeds": -0.1,
    "onverklaarbaar": -0.1,
    "onverkwikkelijk": -0.6,
    "onvermijdelijk": -0.1,
    "onverstaanbaar": -0.2,
    "onverstandig": -0.6,
    "onvertogen": -0.6,
    "onverwacht": 0.1,
    "onverwachts": 0.1,
    "onverzettelijk": -0.9,
    "onvoldoende": -0.4,
    "onvolledig": -0.2,
    "onvolmaakt": -0.4,
    "onvolprezen": 0.6,
    "onvolwassen": -0.6,
    "onvoorspelbaar": 0.3,
    "onvoorstelbaar": 0.1,
    "onvoorwaardelijk": 0.1,
    "onvoorzichtig": -0.6,
    "onvriendelijk": -0.5,
    "onvrijwillig": -0.2,
    "onwaarschijnlijk": 0.1,
    "onweerlegbaar": 0.2,
    "onweerstaanbaar": 0.6,
    "onwelkom": -0.7,
    "onwennig": -0.1,
    "onwenselijk": -0.3,
    "onwerkbaar": -0.5,
    "onwerkelijk": -0.1,
    "onwetend": -0.35,
    "onwezenlijk": -0.1,
    "onwijs": 0.2,
    "onwillekeurig": 0.1,
    "onwrikbaar": -0.5,
    "onzacht": -0.1,
    "onzalig": -0.6,
    "onzedelijk": -0.6,
    "onzeker": -0.4,
    "onzindelijk": -0.6,
    "onzinnig": -0.6,
    "onzuiver": -0.6,
    "oordeelkundig": 0.1,
    "oorlogszuchtig": -0.3,
    "oorlogvoerend": 0.1,
    "oorspronkelijk": 0.1,
    "oost-europees": -0.2,
    "opbouwend": 0.4,
    "opdringerig": -0.4,
    "open": 0.2,
    "openhartig": 0.6,
    "openlijk": 0.4,
    "opgeklopt": -0.3,
    "opgelaten": -0.1,
    "opgelucht": 0.5,
    "opgezet": -0.1,
    "oplosbaar": 0.3,
    "opmerkelijk": 0.4,
    "oppervlakkig": -0.8,
    "opportunistisch": -0.6,
    "oprecht": 0.8,
    "opruiend": -0.1,
    "opstopping": -0.1,
    "optimaal": 0.7,
    "optimistisch": 0.6,
    "opvallend": 0.5,
    "opvliegend": -0.6,
    "opvoedbaar": 0.2,
    "opvoedkundig": 0.2,
    "opwaarts": 0.2,
    "opwekkend": 0.55,
    "opwindend": 0.8,
    "opzettelijk": -0.4,
    "opzichtig": -0.4,
    "opzienbarend": 0.5,
    "ordelijk": 0.4,
    "ordinair": -0.7,
    "organisatorisch": 0.1,
    "origineel": 0.45,
    "orthodox": -0.2,
    "oubollig": -0.4,
    "oudbakken": -0.3,
    "oude": -0.1,
    "ouderloos": -0.1,
    "ouderwets": -0.4,
    "ovationeel": 0.3,
    "ovenvers": 0.1,
    "overbekend": 0.4,
    "overbodig": -0.5,
    "overdadig": -0.3,
    "overdreven": -0.4,
    "overduidelijk": 0.3,
    "overgelukkig": 0.8,
    "overgroot": 0.1,
    "overhaast": -0.6,
    "overheerlijk": 0.7,
    "overmatig": -0.3,
    "overmoedig": -0.2,
    "overrijp": -0.3,
    "overspannen": -0.25,
    "overtuigend": 0.6,
    "oververhit": -0.4,
    "overvol": -0.1,
    "overweldigend": 0.4,
    "overwinning": 0.6,
    "overzichtelijk": 0.5,
    "pafferig": -0.2,
    "pakkende": 0.4,
    "paniekerig": -0.6,
    "panklaar": 0.4,
    "paradijselijk": 0.4,
    "paradoxaal": -0.2,
    "paranoïde": -0.6,
    "partieel": -0.1,
    "pasklaar": 0.5,
    "passé": -0.3,
    "paternalistisch": -0.9,
    "pathetisch": -0.6,
    "peilloos": 0.3,
    "penetrant": 0.3,
    "penibel": -0.5,
    "pensioengerechtigd": 0.1,
    "peperduur": -0.4,
    "perfect": 1.0,
    "perkamentachtig": -0.5,
    "permanent": 0.1,
    "perplex": -0.4,
    "pervers": -0.8,
    "pessimistisch": -0.5,
    "petieterig": -0.8,
    "piekfijn": 0.5,
    "pienter": 0.8,
    "piepjong": 0.1,
    "piepklein": 0.1,
    "pijnlijk": -0.65,
    "pijnloos": 0.1,
    "pikant": 0.6,
    "pissig": -0.7,
    "pittig": 0.167,
    "pittoresk": 0.1,
    "plagerig": 0.2,
    "plakkerig": -0.4,
    "plastisch": 0.1,
    "plat": -0.225,
    "platvloers": -0.5,
    "plausibel": 0.4,
    "plechtig": 0.3,
    "plezant": 0.4,
    "plezierig": 0.7,
    "plichtmatig": 0.1,
    "poeslief": -0.1,
    "poliklinisch": 0.1,
    "politioneel": -0.1,
    "pompeus": -0.2,
    "populair": 0.35,
    "populistisch": -0.1,
    "positief": 0.3,
    "postjes": -0.2,
    "postmodern": 0.1,
    "potent": 0.3,
    "potig": 0.3,
    "potsierlijk": -0.2,
    "pover": -0.5,
    "poëtisch": 0.2,
    "praalziek": -0.3,
    "praatziek": -0.5,
    "prachtig": 1.0,
    "praktisch": 0.4,
    "precair": -0.5,
    "precies": 0.4,
    "prematuur": 0.1,
    "pretentieus": -0.6,
    "prettig": 0.7,
    "prijsbewust": 0.4,
    "prijzig": -0.4,
    "prima": 0.7,
    "primordiaal": 0.1,
    "principaal": 0.1,
    "principieel": 0.3,
    "privaat": -0.2,
    "privaatrechtelijk": -0.2,
    "probaat": 0.6,
    "problemen": -0.2,
    "proefondervindelijk": 0.1,
    "professioneel": 0.4,
    "profetisch": 0.7,
    "profijtelijk": -0.1,
    "proletarisch": -0.1,
    "prominent": 0.3,
    "proportioneel": -0.1,
    "propvol": 0.2,
    "protectionistisch": -0.3,
    "protest": -0.1,
    "protserig": -0.3,
    "provinciaal": -0.5,
    "provocateurs": -0.2,
    "provoceren": -0.2,
    "prozaïsch": -0.1,
    "psychopathisch": -0.6,
    "puberaal": -0.5,
    "publieksvriendelijk": 0.3,
    "puik": 0.9,
    "punctueel": 0.4,
    "puur": 0.4,
    "raadselachtig": 0.1,
    "raak": 0.4,
    "raar": -0.4,
    "raciaal": -0.1,
    "racist": -0.5,
    "racistisch": -0.7,
    "ragfijn": -0.1,
    "raisonnabel": 0.3,
    "ramp": -0.4,
    "rampspoedig": -0.7,
    "rampzalig": -0.6,
    "rancuneus": -0.5,
    "ranzig": -0.8,
    "ras": 0.2,
    "rasperig": -0.6,
    "rationeel": 0.35,
    "rauw": -0.133,
    "razendsnel": 0.1,
    "reactionair": -0.1,
    "realiseerbaar": 0.6,
    "realistisch": 0.167,
    "recalcitrant": -0.6,
    "recht": 0.167,
    "rechtgeaard": 0.2,
    "rechts": -0.067,
    "rechtschapen": 0.4,
    "rechtstreeks": 0.4,
    "rechtvaardig": 0.2,
    "reddeloos": -0.3,
    "redelijk": 0.167,
    "redeloos": -0.4,
    "regelbaar": 0.1,
    "regelmatig": 0.1,
    "regenachtig": -0.2,
    "reikhalzend": 0.4,
    "rein": 0.4,
    "rekbaar": -0.4,
    "relaxed": 0.6,
    "relevant": 0.4,
    "renaissancistisch": -0.1,
    "repressief": -0.5,
    "resistent": -0.1,
    "respectabel": 0.45,
    "respectievelijk": -0.1,
    "respectloos": -0.7,
    "respectvol": 0.5,
    "restrictief": -0.5,
    "retrospectief": -0.4,
    "reusachtig": 0.4,
    "reuze": 0.9,
    "riant": 0.65,
    "ridicuul": -1.0,
    "rigide": -0.5,
    "rigoureus": -0.2,
    "rijk": 0.567,
    "rijp": 0.367,
    "rimpelig": -0.2,
    "riskant": -0.4,
    "robuust": 0.1,
    "roekeloos": -0.7,
    "roemloos": -0.6,
    "roemrijk": 0.5,
    "roemrucht": 0.7,
    "roemruchtig": 0.5,
    "roemvol": 0.8,
    "roerig": -0.2,
    "roerloos": -0.2,
    "roestkleurig": -0.6,
    "roetzwart": -0.4,
    "rokerig": 0.1,
    "romantisch": 0.367,
    "romeins": 0.7,
    "rommelig": -0.4,
    "rooskleurig": 0.6,
    "rot": -0.65,
    "routinematig": -0.1,
    "routineus": -0.4,
    "royaal": 0.1,
    "roze": -0.1,
    "rudimentair": -0.1,
    "ruimdenkend": 0.2,
    "ruimhartig": 0.6,
    "ruimschoots": 0.1,
    "rul": 0.1,
    "rusteloos": -0.4,
    "rustiek": -0.8,
    "rustig": 0.4,
    "ruw": -0.275,
    "ruzie": -0.2,
    "ruziemaken": -0.2,
    "ruziën": -0.2,
    "rücksichtslos": -0.6,
    "saai": -0.7,
    "sadistisch": -0.7,
    "safe": 0.4,
    "saillant": 0.3,
    "samenhangend": 0.4,
    "sappig": 0.15,
    "sarcastisch": 0.1,
    "sardonisch": -0.4,
    "satanisch": -0.6,
    "scandaleus": -0.2,
    "sceptisch": -0.1,
    "schaamteloos": -0.5,
    "schaapachtig": -0.2,
    "schadelijk": -0.5,
    "schadevrij": 0.2,
    "schamel": -0.25,
    "schamper": -0.2,
    "schandalig": -0.6,
    "schande": -0.4,
    "schandelijk": -0.8,
    "schappelijk": 0.3,
    "schatrijk": 0.6,
    "scheef": -0.3,
    "scheel": -0.3,
    "schelden": -0.2,
    "scherpzinnig": 0.5,
    "schichtig": -0.4,
    "schietklaar": -0.1,
    "schijnbaar": -0.1,
    "schilderachtig": 0.5,
    "schilferig": -0.15,
    "schimmelig": -0.8,
    "schimmig": -0.7,
    "schitterend": 0.7,
    "schizofreen": -0.7,
    "schlemielig": -0.5,
    "schokkend": -0.1,
    "schonkig": -0.7,
    "schoolmeesterachtig": -0.4,
    "schoon": 0.467,
    "schor": -0.3,
    "schrander": 0.3,
    "schriel": -0.5,
    "schrijnend": -0.6,
    "schrikbarend": -0.5,
    "schril": -0.4,
    "schuchter": -0.4,
    "schuin": -0.35,
    "schuins": -0.5,
    "schuldig": -0.3,
    "schunnig": -0.6,
    "schurftig": -0.3,
    "schuw": -0.6,
    "scrupuleus": 0.4,
    "secuur": 0.4,
    "seksistisch": -0.7,
    "seksueel": 0.2,
    "sektarisch": -0.5,
    "selfmade": 0.5,
    "senior": 0.2,
    "sensatiebelust": -0.2,
    "sensationeel": 0.6,
    "sensibel": 0.1,
    "sentimenteel": -0.1,
    "serieus": 0.3,
    "sexy": 0.8,
    "sfeerloos": -0.6,
    "sfeervol": 0.6,
    "shabby": -0.5,
    "significant": 0.2,
    "simpel": -0.25,
    "simplistisch": -0.5,
    "sinister": -0.5,
    "sip": -0.5,
    "sjofel": -0.2,
    "slaafs": -0.8,
    "slaapverwekkend": -0.9,
    "slap": -0.25,
    "slapeloos": -0.4,
    "slecht": -0.7,
    "slijmerig": -0.4,
    "slim": 0.8,
    "slinks": -0.3,
    "sloom": -0.6,
    "slopend": -0.6,
    "slordig": -0.4,
    "smaakloos": 0.2,
    "smaakvol": 0.5,
    "smachtend": 0.5,
    "smadelijk": -0.7,
    "smakelijk": 0.7,
    "smakeloos": -0.7,
    "smartelijk": -0.8,
    "smerig": -0.6,
    "smetteloos": 0.4,
    "smeuïg": 0.35,
    "smoorverliefd": 0.8,
    "snedig": -0.2,
    "snel": 0.4,
    "snelgroeiend": 0.1,
    "snibbig": -0.1,
    "snikheet": -0.6,
    "snipverkouden": -0.7,
    "snood": -0.7,
    "snugger": 0.8,
    "sober": 0.3,
    "sociaal": 0.233,
    "soepel": 0.5,
    "solide": 0.5,
    "sollen": -0.2,
    "somber": -0.5,
    "somptueus": 0.6,
    "speciaal": 0.6,
    "spectaculair": 0.7,
    "speels": 0.65,
    "speltechnisch": 0.6,
    "spichtig": -0.5,
    "spiernaakt": 0.8,
    "spierwit": -0.1,
    "spijkerhard": 0.1,
    "spijtig": -0.5,
    "spiksplinternieuw": 0.4,
    "spits": 0.4,
    "spitsvondig": 0.5,
    "splinternieuw": 0.4,
    "spoedig": 0.1,
    "spontaan": 0.6,
    "spookachtig": -0.9,
    "spoorloos": -0.3,
    "sporadisch": 0.1,
    "spotziek": -0.5,
    "spraakmakend": 0.4,
    "sprakeloos": 0.4,
    "sprekend": 0.2,
    "sprookjesachtig": 0.7,
    "staatsgevaarlijk": -0.5,
    "stampvol": -0.1,
    "standvastig": -0.4,
    "steekhoudend": 0.4,
    "steels": -0.3,
    "steengoed": 1.0,
    "steenhard": -0.2,
    "steenkoud": -0.4,
    "steenrijk": 0.6,
    "stekend": -0.2,
    "stemhebbend": 0.2,
    "stemmig": 0.3,
    "stereotiep": -0.3,
    "sterfelijk": -0.2,
    "sterk": 0.533,
    "stevig": 0.267,
    "stiefmoederlijk": -0.7,
    "stiekem": -0.3,
    "stijf": -0.2,
    "stijlloos": -0.5,
    "stijlvol": 0.9,
    "stil": -0.067,
    "stipt": 0.4,
    "stoer": 0.3,
    "stoethaspelig": -0.5,
    "stoffig": -0.4,
    "stom": -0.433,
    "stomdronken": -0.3,
    "stompzinnig": -0.9,
    "stomverbaasd": 0.4,
    "storend": -0.8,
    "stormachtig": 0.1,
    "stout": 0.233,
    "stoutmoedig": 0.9,
    "straatarm": -0.4,
    "straf": 0.2,
    "strakblauw": 0.1,
    "stralend": -0.3,
    "streng": -0.5,
    "strijdig": -0.3,
    "strijdvaardig": 0.5,
    "strikt": -0.5,
    "stringent": -0.5,
    "stroef": -0.5,
    "strontvervelend": -0.4,
    "stroperig": -0.6,
    "stumperig": -0.5,
    "stuntelig": -0.5,
    "stupide": -0.4,
    "stuurloos": -0.4,
    "stuurs": -0.6,
    "subjectief": -0.1,
    "subliem": 0.9,
    "subsidiair": -0.1,
    "substantieel": 0.25,
    "subtiel": 0.4,
    "subtropisch": 0.3,
    "succesrijk": 0.7,
    "succesvol": 0.7,
    "suf": -0.6,
    "suffig": -0.6,
    "suggestief": 0.2,
    "sukkelig": -0.5,
    "sullig": -0.5,
    "summier": -0.1,
    "super": 0.9,
    "supergoed": 1.0,
    "superieur": -0.1,
    "superleuk": 1.0,
    "supermooi": 1.0,
    "supersnel": 0.6,
    "superspannend": 1.0,
    "superspannende": 0.8,
    "surrealistisch": -0.1,
    "suïcidaal": -0.7,
    "symfonisch": 0.2,
    "sympathiek": 0.6,
    "symptomatisch": -0.3,
    "systematisch": 0.1,
    "taai": -0.133,
    "taalkundig": 0.1,
    "taboe": -0.3,
    "tactisch": -0.1,
    "tactvol": 0.6,
    "talentvol": 0.7,
    "tam": -0.3,
    "tastbaar": 0.15,
    "technologisch": 0.1,
    "teder": 0.6,
    "tegendraads": -0.3,
    "tegengesteld": -0.1,
    "tegenovergesteld": -0.1,
    "tegenoverliggend": -0.2,
    "tegenstrijdig": -0.4,
    "tegenvallen": -0.4,
    "tegenvaller": -0.4,
    "teleurgesteld": -0.4,
    "teleurstellend": -0.6,
    "teleurstelling": -0.4,
    "temerig": -0.4,
    "temperamentvol": -0.5,
    "tendentieus": -0.2,
    "tenger": 0.1,
    "terecht": 0.4,
    "tergend": -0.6,
    "terminaal": -0.7,
    "terroristisch": -0.5,
    "tersluiks": -0.3,
    "terugkrabbelen": -0.2,
    "tevergeefs": -0.6,
    "tevreden": 0.4,
    "theatraal": -0.2,
    "tiens": -0.1,
    "tijdelijk": -0.167,
    "tijdig": -0.1,
    "tijdloos": 0.3,
    "tijdrovend": -0.1,
    "tijdsgebonden": -0.3,
    "timide": -0.1,
    "tiranniek": -0.3,
    "tjeef": -0.4,
    "tjeven": -0.4,
    "tjevenstreken": -0.7,
    "tjokvol": -0.1,
    "tochtig": 0.9,
    "toegankelijk": 0.35,
    "toegedaan": 0.3,
    "toegewijd": 0.3,
    "toekomstig": 0.1,
    "toepasselijk": 0.4,
    "toereikend": 0.4,
    "tof": 0.6,
    "tomeloos": -0.1,
    "toonaangevend": 0.6,
    "toonloos": -0.3,
    "toornig": -0.6,
    "top": 0.6,
    "totaal": 0.1,
    "toverachtig": 0.3,
    "toxisch": -0.45,
    "traag": -0.3,
    "traangas": -0.1,
    "tragikomisch": 0.4,
    "tragisch": -0.8,
    "transcendent": 0.1,
    "traumatisch": -0.6,
    "treffend": 0.3,
    "trefzeker": 0.7,
    "trendy": 0.4,
    "treurig": -0.5,
    "triest": -0.55,
    "triomfantelijk": 0.1,
    "triviaal": -0.2,
    "troebel": -0.1,
    "trojaans": -0.4,
    "troosteloos": -0.6,
    "trots": 0.15,
    "trouw": 0.7,
    "trouweloos": -0.6,
    "trouwhartig": 0.6,
    "truttig": -0.5,
    "tsjeef": -0.4,
    "tsjeven": -0.4,
    "tumultueus": -0.4,
    "turbulent": -0.3,
    "tussenliggend": -0.1,
    "tussentijds": -0.1,
    "tuttig": -0.5,
    "tweedehands": -0.1,
    "tweederangs": -0.6,
    "tweederangskandidaat": -0.6,
    "tweeledig": -0.1,
    "tweestemmig": 0.1,
    "twijfelachtig": -0.4,
    "twistziek": -0.7,
    "uitbundig": 0.35,
    "uitgebreid": 0.1,
    "uitgekookt": -0.6,
    "uitgelezen": 0.8,
    "uitgemergeld": -0.3,
    "uitgestrekt": 0.1,
    "uitgewerkt": 0.3,
    "uitheems": 0.4,
    "uitlaatgassen": -0.2,
    "uitmuntend": 1.0,
    "uitnemend": 0.2,
    "uitstekend": 0.9,
    "uitverkocht": 0.3,
    "uitvoerbaar": 0.3,
    "uitvoerig": 0.4,
    "uitzichtloos": -0.6,
    "uitzonderlijk": 0.8,
    "ultiem": 0.4,
    "uniek": 0.6,
    "unilateraal": -0.1,
    "universeel": 0.4,
    "urenlang": -0.2,
    "urgent": -0.2,
    "utopisch": -0.4,
    "vaag": -0.4,
    "vaardig": 0.5,
    "vakbekwaam": 0.6,
    "vakkundig": 0.5,
    "valide": 0.15,
    "vals": -0.6,
    "vanzelfsprekend": 0.1,
    "vastbesloten": 0.5,
    "vatbaar": -0.25,
    "veelbelovend": 0.6,
    "veelbewogen": 0.6,
    "veelgelezen": 0.5,
    "veelgeprezen": 0.5,
    "veelomvattend": -0.1,
    "veelvuldig": 0.1,
    "veelzeggend": 0.4,
    "veelzijdig": 0.15,
    "veilig": 0.4,
    "venijnig": -0.4,
    "ver": 0.067,
    "verantwoordelijk": 0.2,
    "verbaal": -0.8,
    "verbaasd": 0.1,
    "verbazingwekkend": 0.5,
    "verblindend": 0.7,
    "verbluffend": 0.6,
    "verbolgen": -0.6,
    "verborgen": -0.1,
    "verdedigbaar": 0.3,
    "verdekt": -0.3,
    "verderfelijk": -0.8,
    "verdicht": -0.1,
    "verdienstelijk": 0.3,
    "verdoofd": -0.4,
    "verdraagzaam": 0.4,
    "verdrietig": -0.6,
    "vereist": 0.4,
    "verfrissend": 0.6,
    "vergaand": -0.3,
    "vergeefs": -0.5,
    "vergenoegd": 0.4,
    "vergezocht": -0.5,
    "verhandelbaar": 0.8,
    "verheugd": 0.4,
    "verheven": 1.0,
    "verhit": -0.1,
    "verkeerd": -0.5,
    "verkeersellende": -0.1,
    "verkeersinfarct": -0.1,
    "verkeken": -0.6,
    "verklaarbaar": 0.4,
    "verklarend": 0.2,
    "verkloten": -0.4,
    "verknipt": -0.4,
    "verkrijgbaar": 0.1,
    "verlegen": -0.1,
    "verlekkerd": 0.5,
    "verliefd": 0.9,
    "verliesgevend": -0.1,
    "verliezer": 0.5,
    "verlokkelijk": 0.4,
    "verloren": -0.2,
    "vermaard": 0.5,
    "vermakelijk": 0.6,
    "vermaledijd": -0.2,
    "vermeend": -0.1,
    "vermetel": 0.9,
    "vermoedelijk": 0.1,
    "vermoeid": -0.5,
    "vermoeiend": -0.4,
    "vermogend": 0.3,
    "vernederend": -0.4,
    "vernieuwing": 0.2,
    "vernuftig": 0.7,
    "verontwaardigd": -0.4,
    "verpletterend": -0.4,
    "verplichtend": -0.1,
    "verrassend": 0.6,
    "verrast": 0.4,
    "verregaand": -0.2,
    "verrukkelijk": 0.9,
    "verschrikkelijk": -0.5,
    "verschuldigd": -0.2,
    "verslaafd": -0.4,
    "verslechtert": -0.2,
    "verstaanbaar": 0.2,
    "verstandig": 0.6,
    "verstokt": -0.3,
    "verstoord": -0.4,
    "verstrekkend": -0.1,
    "versuft": -0.5,
    "vertrouwd": 0.5,
    "vertrouwenwekkend": 0.1,
    "vervangbaar": -0.5,
    "verveeld": -0.4,
    "vervelend": -0.633,
    "vervelens": -0.4,
    "vervloekt": -0.4,
    "verwaarloosbaar": -0.3,
    "verwachtingsvol": 0.3,
    "verwarren": -0.2,
    "verwarrend": -0.5,
    "verwend": -0.3,
    "verwerpelijk": -0.4,
    "verwijfd": -0.3,
    "verwoed": 0.1,
    "verwoestend": -0.6,
    "verwondingen": -0.1,
    "verzachtend": 0.1,
    "verzengend": -0.6,
    "verziend": 0.1,
    "vet": -0.2,
    "vettig": -0.5,
    "victoriaans": -0.1,
    "vierkant": 0.1,
    "vies": -0.75,
    "vijandelijk": -0.5,
    "vindingrijk": 0.6,
    "vinnig": 0.25,
    "virtuoos": 1.0,
    "visrijk": 0.5,
    "visueel": 0.1,
    "vlekkeloos": 0.8,
    "vleselijk": 0.2,
    "vliegensvlug": 0.1,
    "vlijmscherp": -0.3,
    "vloeiend": 0.9,
    "vlot": 0.375,
    "vluchtig": -0.15,
    "vlug": 0.1,
    "vocaal": 0.1,
    "vochtig": 0.1,
    "voedselarm": -0.3,
    "voedzaam": 0.6,
    "vogelvrij": -0.4,
    "vol": 0.3,
    "voldaan": 0.4,
    "voldoende": 0.3,
    "volgeboekt": -0.1,
    "volkomen": 0.1,
    "volks": -0.4,
    "volledig": 0.1,
    "volleerd": 0.5,
    "volmaakt": 1.0,
    "volmondig": -0.1,
    "volstrekt": 0.1,
    "volwaardig": 0.6,
    "volwassen": 0.1,
    "vooraanstaand": 0.8,
    "voorbarig": -0.1,
    "voorlopig": -0.1,
    "voornaam": 0.3,
    "voorspelbaar": -0.5,
    "voorspellend": -0.1,
    "voorspoedig": 0.5,
    "voorstelbaar": 0.1,
    "voortdurend": -0.1,
    "voortijdig": -0.1,
    "voortreffelijk": 0.9,
    "voortvarend": 0.1,
    "voortvluchtig": -0.3,
    "vooruitstrevend": 0.1,
    "voorwaardelijk": -0.1,
    "voorzichtig": 0.4,
    "vraatzuchtig": -0.2,
    "vredig": 0.1,
    "vreemd": -0.333,
    "vrekkig": -0.3,
    "vreselijk": -0.65,
    "vreugdeloos": -0.4,
    "vriendelijk": 0.5,
    "vrij": 0.483,
    "vrijblijvend": 0.1,
    "vrijgevochten": 0.1,
    "vrijpostig": -0.5,
    "vrijwillig": 0.2,
    "vrijzinnig": 0.1,
    "vroeg": 0.1,
    "vroegrijp": 0.1,
    "vroegtijdig": 0.1,
    "vrolijk": 0.9,
    "vruchteloos": -0.4,
    "vuil": -0.5,
    "vuistdik": -0.1,
    "vulgair": -0.9,
    "vurig": 0.3,
    "vuurgevaarlijk": -0.7,
    "waanwijs": -0.5,
    "waanzinnig": -0.5,
    "waar": 0.2,
    "waard": 0.2,
    "waardeloos": -0.8,
    "waardevol": 0.8,
    "waardig": 0.6,
    "waargebeurd": 0.1,
    "waarheidsgetrouw": 0.6,
    "waarneembaar": 0.1,
    "waarschijnlijk": 0.1,
    "wakker": 0.3,
    "walgelijk": -0.9,
    "wanhopig": -0.6,
    "wankel": -0.5,
    "wantrouwend": -0.5,
    "wantrouwig": -0.3,
    "warm": 0.7,
    "warmbloedig": 0.4,
    "warrig": -0.4,
    "waterdicht": 0.1,
    "waterrijk": 0.4,
    "wauw": 0.8,
    "wazig": -0.4,
    "wederzijds": 0.1,
    "wee": 0.3,
    "weelderig": 0.6,
    "weemoedig": -0.4,
    "weerbarstig": -0.5,
    "weergaloos": 1.0,
    "weerlegbaar": -0.2,
    "weerloos": -0.4,
    "weerzinwekkend": -0.9,
    "weetgierig": 0.1,
    "weigerachtig": -0.7,
    "welbekend": 0.2,
    "welbewust": 0.4,
    "weldenkend": 0.5,
    "weldoordacht": 0.5,
    "weledelzeergeleerd": 1.0,
    "welgemeend": 0.1,
    "welgeschapen": 0.8,
    "welgesteld": 0.4,
    "welkom": 0.8,
    "welletjes": -0.4,
    "weloverwogen": 0.4,
    "welriekend": 0.1,
    "welsprekend": 0.1,
    "welvarend": 0.4,
    "welvoeglijk": 0.2,
    "wenselijk": 0.4,
    "wereldberoemd": 0.5,
    "wereldschokkend": -0.7,
    "wereldvermaard": 0.5,
    "werkbaar": 0.1,
    "werkelijk": 0.1,
    "werkloos": -0.5,
    "werkzaam": 0.267,
    "wervelend": 0.6,
    "westers": 0.1,
    "wezenlijk": 0.1,
    "wezenloos": -0.4,
    "wijlen": -0.1,
    "wijs": 0.7,
    "wijsgerig": 0.2,
    "wild": -0.075,
    "willekeurig": -0.1,
    "willoos": -0.6,
    "wilskrachtig": 0.6,
    "winderig": -0.3,
    "windstil": 0.4,
    "winnaar": 0.5,
    "wis": 0.3,
    "wispelturig": -0.6,
    "wisselvallig": -0.1,
    "wit": -0.1,
    "woedend": -0.5,
    "woelig": -0.5,
    "wolkeloos": 0.1,
    "wolkenloos": 0.1,
    "wollig": -0.1,
    "wonder": 0.4,
    "wonderbaar": 0.9,
    "wonderbaarlijk": 0.9,
    "wonderlijk": 0.8,
    "wonderschoon": 0.9,
    "woordblind": -0.5,
    "wormstekig": -0.5,
    "would-be": -0.2,
    "wraakzuchtig": -0.9,
    "wrang": -0.4,
    "wreed": -0.1,
    "wreedaardig": -0.9,
    "wulps": 0.7,
    "zacht": 0.183,
    "zachtaardig": 0.6,
    "zakelijk": 0.1,
    "zalig": 0.5,
    "zanderig": -0.4,
    "zat": -0.4,
    "zedelijk": 0.2,
    "zedenkundig": 0.2,
    "zeer": -0.5,
    "zeeziek": -0.4,
    "zeker": 0.3,
    "zeldzaam": 0.3,
    "zelfbewust": 0.3,
    "zelfgekozen": -0.2,
    "zelfstandig": 0.4,
    "zelfverzekerd": 0.4,
    "zelfvoldaan": -0.2,
    "zenuwachtig": -0.4,
    "zenuwslopend": -0.4,
    "zenuwziek": -0.8,
    "zeurderig": -0.8,
    "zever": -0.8,
    "zeveren": -0.8,
    "ziek": -0.65,
    "ziekelijk": -0.55,
    "zielig": -0.5,
    "zielloos": -0.3,
    "zilt": 0.4,
    "zilveren": 0.2,
    "zinloos": -0.6,
    "zinnelijk": 0.4,
    "zinnig": 0.5,
    "zinvol": 0.6,
    "zoel": 0.1,
    "zoet": 0.4,
    "zoetgevooisd": -0.2,
    "zoetsappig": -0.5,
    "zoetzuur": -0.1,
    "zogeheten": -0.1,
    "zogenaamd": -0.15,
    "zogenoemd": -0.1,
    "zomers": 0.6,
    "zondags": 0.6,
    "zonderling": -0.1,
    "zondig": -0.6,
    "zonneklaar": 0.2,
    "zonneslag": -0.2,
    "zonnig": 0.6,
    "zootje": -0.6,
    "zorgelijk": -0.4,
    "zorgeloos": 0.4,
    "zorgvuldig": 0.4,
    "zorgwekkend": -0.4,
    "zorgzaam": 0.7,
    "zout": 0.4,
    "zouteloos": 0.1,
    "zoutloos": -0.1,
    "zuiver": 0.3,
    "zurig": -0.4,
    "zuur": -0.233,
    "zuurstofarm": -0.5,
    "zuurverdiend": 0.4,
    "zwaar": -0.125,
    "zwaargebouwd": 0.1,
    "zwaargewond": -0.6,
    "zwaarmoedig": -0.4,
    "zwaarwichtig": -0.2,
    "zwak": -0.5,
    "zwakbegaafd": -0.6,
    "zwanger": 0.1,
    "zwart": -0.275,
    "zwart-wit": -0.4,
    "zwartgallig": -0.6,
    "zweterig": -0.4,
    "zweverig": -0.45,
    "zwoel": 0.8,
}

def polarity_of(word: str) -> float:
    """Polariteit ∈ [-1, +1] of 0.0 als onbekend."""
    return POLARITY.get(word.lower(), 0.0)
```

#### `app/pipeline/pipeline/media_profiles.py`

```python
"""
Media-publieksprofielen — bron-niveau poststratificatie.

HET PRINCIPE
------------
Een gescrapet nieuwsartikel draagt geen demografisch label. Maar het MEDIUM
waar het uit komt wel: elke krant, zender en site heeft een gedocumenteerd
lezersprofiel. Door per bron de toon te meten en die te wegen naar het
bekende publiek van die bron, krijg je een demografisch gebalanceerd signaal
zonder dat je de auteur van elke post hoeft te kennen.

Dit is bron-niveau poststratificatie — de haalbare variant van MRP wanneer je
publieke data scrapet in plaats van een panel te bevragen.

METHODE
-------
1. Per bron meten we de nieuwstoon (lexicon-methode, Young & Soroka 2012).
2. Per bron kennen we de leeftijdsverdeling van het publiek + het relatieve
   bereik (hoe groot de bron is).
3. Per bevolkingssegment berekenen we de "ervaren toon":
      toon_segment = Σ_bron (publiek[bron,segment] × bereik[bron] × toon[bron])
                     / Σ_bron (publiek[bron,segment] × bereik[bron])
4. Het nationale poststratified cijfer = Σ_segment (bevolkingsaandeel × toon_segment).

EERLIJKE BEPERKING
------------------
De publieksprofielen zijn ramingen op basis van publieke CIM-bereikcijfers,
Digimeter en mediakits — geen exacte panelmetingen. Drie leeftijdssegmenten
i.p.v. een volledige demografische celstructuur. Het is de transparante,
reproduceerbare benadering; een echt gevalideerd panel blijft de target-state.
"""
from __future__ import annotations

# Belgische volwassen bevolking (18+), grove Statbel-aandelen per segment.
POPULATION_SHARE = {
    "jong": 0.27,    # 18-34
    "midden": 0.32,  # 35-54
    "ouder": 0.41,   # 55+
}

# Per mediabron (schone sleutel): leeftijdsverdeling van het publiek
# [jong, midden, ouder] (telt op tot 1.0) + relatief bereik-gewicht.
# Ramingen op basis van CIM-bereik, Digimeter en mediakits.
MEDIA_PROFILES: dict[str, dict] = {
    "vrtnws":     {"name": "VRT NWS",                "reach": 9.0, "audience": {"jong": 0.22, "midden": 0.33, "ouder": 0.45}},
    "standaard":  {"name": "De Standaard",           "reach": 4.0, "audience": {"jong": 0.20, "midden": 0.38, "ouder": 0.42}},
    "demorgen":   {"name": "De Morgen",              "reach": 3.0, "audience": {"jong": 0.26, "midden": 0.40, "ouder": 0.34}},
    "hln":        {"name": "Het Laatste Nieuws",     "reach": 10.0, "audience": {"jong": 0.30, "midden": 0.34, "ouder": 0.36}},
    "tijd":       {"name": "De Tijd",                "reach": 3.0, "audience": {"jong": 0.22, "midden": 0.44, "ouder": 0.34}},
    "hbvl":       {"name": "Het Belang van Limburg", "reach": 4.0, "audience": {"jong": 0.20, "midden": 0.32, "ouder": 0.48}},
    "bruzz":      {"name": "Bruzz",                  "reach": 1.5, "audience": {"jong": 0.34, "midden": 0.38, "ouder": 0.28}},
    "knack":      {"name": "Knack",                  "reach": 2.5, "audience": {"jong": 0.18, "midden": 0.38, "ouder": 0.44}},
    "sporza":     {"name": "Sporza",                 "reach": 6.0, "audience": {"jong": 0.34, "midden": 0.36, "ouder": 0.30}},
    "trends":     {"name": "Trends",                 "reach": 2.0, "audience": {"jong": 0.22, "midden": 0.44, "ouder": 0.34}},
    "businessam": {"name": "Business AM",            "reach": 1.5, "audience": {"jong": 0.30, "midden": 0.42, "ouder": 0.28}},
    "eos":        {"name": "Eos",                    "reach": 1.0, "audience": {"jong": 0.30, "midden": 0.38, "ouder": 0.32}},
    "newsmonkey": {"name": "Newsmonkey",             "reach": 1.0, "audience": {"jong": 0.62, "midden": 0.26, "ouder": 0.12}},
    # Reddit — sterk jong/stedelijk skew (secundaire indicator)
    "reddit":     {"name": "Reddit Belgium",         "reach": 1.0, "audience": {"jong": 0.68, "midden": 0.26, "ouder": 0.06}},
}


def poststratify(source_tones: list[tuple[str, float]]) -> dict:
    """
    source_tones: lijst van (mediaprofiel-sleutel, toon) per bron.
    Return dict met:
      - national: poststratified nationale toon
      - segments: toon per leeftijdssegment
      - n_sources: aantal bronnen meegewogen
    """
    entries: list[tuple[dict, float]] = []
    for key, tone in source_tones:
        profile = MEDIA_PROFILES.get(key)
        if profile is not None:
            entries.append((profile, tone))

    if not entries:
        return {"national": None, "segments": {}, "n_sources": 0}

    segments: dict[str, float] = {}
    for seg in POPULATION_SHARE:
        num = 0.0
        den = 0.0
        for profile, tone in entries:
            w = profile["audience"][seg] * profile["reach"]
            num += w * tone
            den += w
        segments[seg] = num / den if den > 0 else 0.0

    national = sum(POPULATION_SHARE[seg] * segments[seg] for seg in POPULATION_SHARE)
    return {"national": national, "segments": segments, "n_sources": len(entries)}
```

#### `app/pipeline/pipeline/run.py`

```python
"""
SBI Pipeline — hoofdorkestrator.
Doc 03_Laag-4 §5.3 stappen [1] EXTRACT en [2] VALIDATE.
De engine (TS) doet daarna [3]-[7] (transform → harmonize → decorrelate
→ aggregate → signal).

Run: python -m pipeline.run [--date YYYY-MM-DD] [--history-days N]
Output: app/data/raw-values.json
"""
from __future__ import annotations
import argparse
import json
import math
import sys
from datetime import date, timedelta
from pathlib import Path

from .util import FetchBatch, DATA_DIR, write_json, daterange, iso
from .fetchers import kmi, irceline, verkeerscentrum, fod_economie, statbel, energy_charts, fod_waso, nbb, gdelt, wikipedia, events, reddit, layoff_radar, irail, elia, waterinfo, pollen


# Maximaal aantal punten dat we per indicator in de doorlopende historie houden
# (~3 jaar dagdata; voorkomt onbegrensd groeiende bestanden).
_HISTORY_CAP = 1100


def append_to_history(batch: FetchBatch) -> None:
    """Voeg de echte dagwaarden toe aan de doorlopende historie-bestanden in
    app/data/history/. Zo bouwt ELKE indicator over tijd een echte baseline op,
    ook indicatoren waarvoor geen historische API bestaat (verkeer, trein,
    gebeurtenissen). Backfill-snapshots worden er dagelijks mee bijgehouden.

    Gesimuleerde (mock) en ontbrekende waarden komen NIET in de echte historie.
    """
    hist_dir = DATA_DIR / "history"
    hist_dir.mkdir(parents=True, exist_ok=True)
    for r in batch.results:
        if r.simulated or r.value is None or not math.isfinite(r.value):
            continue
        # observatiedatum normaliseren naar YYYY-MM-DD (maandcijfers → dag 01)
        obs = (r.observation_date or batch.target_date).strip()
        if len(obs) == 7:
            obs = f"{obs}-01"
        if len(obs) != 10:
            obs = batch.target_date
        path = hist_dir / f"{r.code}.json"
        rows: list[dict] = []
        if path.exists():
            try:
                loaded = json.loads(path.read_text(encoding="utf-8"))
                if isinstance(loaded, list):
                    rows = loaded
            except (ValueError, OSError):
                rows = []
        rows = [row for row in rows if row.get("date") != obs]
        rows.append({"date": obs, "value": round(float(r.value), 4)})
        rows.sort(key=lambda x: str(x.get("date", "")))
        if len(rows) > _HISTORY_CAP:
            rows = rows[-_HISTORY_CAP:]
        path.write_text(json.dumps(rows, indent=2), encoding="utf-8")


def fetch_one_day(d: date) -> FetchBatch:
    """Roept alle non-deterministische fetchers aan voor één dag."""
    batch = FetchBatch(target_date=iso(d))

    # D1 — Omgeving (Tier B: weer via open-meteo, Tier C: luchtkwaliteit mock)
    heat, cold = kmi.fetch_temperature_extremes(d)
    batch.add(heat)
    batch.add(cold)
    batch.add(irceline.fetch_air_quality(d))
    batch.add(waterinfo.fetch_flood_signal(d))
    batch.add(pollen.fetch_pollen(d))

    # D2 — Mobiliteit
    batch.add(verkeerscentrum.fetch_traffic_load(d))
    batch.add(fod_economie.fetch_fuel_prices(d))
    batch.add(irail.fetch_train_disruptions(d))

    # D3 — Economie
    batch.add(statbel.fetch_cpi(d))
    batch.add(energy_charts.fetch_energy_prices(d))
    batch.add(fod_waso.fetch_collective_layoffs(d))
    batch.add(statbel.fetch_unemployment(d))
    batch.add(nbb.fetch_mortgage_rate(d))
    batch.add(elia.fetch_grid_stress(d))

    # D5 — Media (D4 + D6 zijn deterministisch en worden in de engine berekend)
    batch.add(gdelt.fetch_news_negativity(d))
    batch.add(wikipedia.fetch_stress_searches(d))
    batch.add(events.fetch_collective_events(d))

    # Secundair — NIET in composiet (sensitiviteit, doc 02 §10)
    batch.add_secondary(reddit.fetch_reddit_sentiment(d))
    batch.add_secondary(layoff_radar.fetch_layoff_radar(d))

    return batch


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="SBI Pipeline — fetch raw indicator values")
    parser.add_argument("--date", type=str, default=None,
                        help="Target date YYYY-MM-DD (default: today)")
    parser.add_argument("--history-days", type=int, default=0,
                        help="Aantal historische dagen ook fetchen (default: 0)")
    args = parser.parse_args(argv)

    target = date.fromisoformat(args.date) if args.date else date.today()
    start = target - timedelta(days=args.history_days)

    print(f"SBI Pipeline — fetch window {start} → {target}", file=sys.stderr)

    history: list[dict] = []
    today_batch: FetchBatch | None = None

    for d in daterange(start, target):
        print(f"  [{d}] fetching…", file=sys.stderr)
        batch = fetch_one_day(d)
        history.append(batch.to_dict())
        if d == target:
            today_batch = batch

    assert today_batch is not None

    write_json(DATA_DIR / "raw-values.json", today_batch.to_dict())
    if args.history_days > 0:
        write_json(DATA_DIR / "raw-history.json", history)

    # Doorlopende historie-opbouw: elke echte dagwaarde wordt bewaard zodat
    # iedere indicator over tijd tegen ECHTE historie gewogen wordt.
    append_to_history(today_batch)
    print(f"✓ historie bijgewerkt in {DATA_DIR / 'history'}", file=sys.stderr)

    sim = today_batch.simulated_codes
    print(f"✓ wrote {DATA_DIR / 'raw-values.json'}", file=sys.stderr)
    print(f"  simulated: {len(sim)}/{len(today_batch.results)} indicators", file=sys.stderr)
    if sim:
        print(f"  → {', '.join(sim)}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
```

#### `app/pipeline/pipeline/util.py`

```python
"""Pipeline-helpers: datum-conversie, mock-data, output-writing."""
from __future__ import annotations
import json
import math
import random
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT / "data"
WEB_PUBLIC = ROOT / "web" / "public" / "data"


@dataclass
class FetchResult:
    """Eén indicator-fetch, succes of mock-fallback."""
    code: str
    value: float
    date: str
    simulated: bool = False
    imputed: bool = False
    source: str = ""
    error: str | None = None
    # observation_date: de datum/periode waar de DATA naar verwijst.
    # Voor dagelijkse bronnen = de dag zelf (YYYY-MM-DD).
    # Voor maandelijkse bronnen (ECB) = de maand (YYYY-MM).
    # Wanneer een fetcher hem niet expliciet zet, valt hij terug op de fetch-datum.
    observation_date: str = ""

    def __post_init__(self) -> None:
        if not self.observation_date:
            self.observation_date = self.date


@dataclass
class FetchBatch:
    """Bundel van fetch-resultaten voor één datum.
    - results:   de 13 primaire (non-deterministische) indicatoren
    - secondary: secundaire/sensitiviteits-indicatoren die NIET in het
                 composiet meetellen (bv. Reddit-sentiment)
    """
    target_date: str
    results: list[FetchResult] = field(default_factory=list)
    secondary: list[FetchResult] = field(default_factory=list)

    def add(self, r: FetchResult) -> None:
        self.results.append(r)

    def add_secondary(self, r: FetchResult) -> None:
        self.secondary.append(r)

    @property
    def simulated_codes(self) -> list[str]:
        return [r.code for r in self.results if r.simulated]

    @property
    def imputed_codes(self) -> list[str]:
        return [r.code for r in self.results if r.imputed]

    def to_dict(self) -> dict:
        return {
            "target_date": self.target_date,
            "results": [r.__dict__ for r in self.results],
            "secondary": [r.__dict__ for r in self.secondary],
            "simulated_codes": self.simulated_codes,
            "imputed_codes": self.imputed_codes,
        }


def daterange(start: date, end: date) -> Iterable[date]:
    cur = start
    while cur <= end:
        yield cur
        cur += timedelta(days=1)


def iso(d: date) -> str:
    return d.isoformat()


def seasonal_noise(d: date, baseline: float, seasonal_amp: float, noise: float, phase: float = 0.0) -> float:
    """Synthetische dag-waarde met seizoenscomponent + ruis — voor mock-fallback."""
    doy = d.timetuple().tm_yday
    progression = 2 * math.pi * doy / 365.0 + phase
    return baseline + seasonal_amp * math.sin(progression) + random.uniform(-noise, noise)


def write_json(path: Path, payload: dict | list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False, default=str)


def safe_request(
    url: str,
    timeout: int = 15,
    headers: dict | None = None,
    retries: int = 2,
    retry_delay: float = 3.0,
) -> tuple[bool, str | dict | None]:
    """HTTP-GET met fail-safe + auto-retry voor transient failures.

    Parseert JSON wanneer:
      - content-type bevat 'json' (vangt application/json, application/vnd.sdmx.data+json, etc.)
      - of body lijkt op JSON (begint met { of [)
    """
    try:
        import requests
        import json as _json
        import time as _time
    except ImportError:
        return False, "requests not installed"

    last_err = "no attempts"
    for attempt in range(retries + 1):
        if attempt > 0:
            _time.sleep(retry_delay * attempt)
        try:
            r = requests.get(url, timeout=timeout, headers=headers or {})
            r.raise_for_status()
            ct = r.headers.get("content-type", "").lower()
            if "json" in ct:
                try:
                    return True, r.json()
                except _json.JSONDecodeError:
                    return True, r.text
            text = r.text
            stripped = text.lstrip()
            if stripped.startswith(("{", "[")):
                try:
                    return True, _json.loads(text)
                except _json.JSONDecodeError:
                    pass
            return True, text
        except Exception as e:  # noqa: BLE001
            last_err = str(e)
            continue
    return False, last_err
```

#### `app/pipeline/scripts/backfill_elia_baseline.py`

```python
"""
Backfill-script: echte 24-maanden-baseline voor de stroomnet-druk-indicator
(I-D3-009) uit de Elia Open Data (dataset ods001).

Schrijft app/data/history/I-D3-009.json — per dag de geaggregeerde ratio
Σ gemeten belasting / Σ day-ahead-forecast, exact dezelfde transformatie
als de dagfetcher (elia.aggregate_ratio).

Run:  python scripts/backfill_elia_baseline.py
"""
from __future__ import annotations
import json
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.elia import aggregate_ratio  # noqa: E402
from pipeline.util import safe_request, DATA_DIR  # noqa: E402

EXPORT_URL = "https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods001/exports/json"


def _fetch_block(start: date, end: date) -> list[dict]:
    where = (
        f"datetime>=date'{start.isoformat()}' and "
        f"datetime<date'{end.isoformat()}' and totalload is not null"
    )
    url = (
        f"{EXPORT_URL}?select=datetime,totalload,dayaheadforecast"
        f"&where={where.replace(' ', '%20').replace(chr(39), '%27')}&limit=-1"
    )
    ok, body = safe_request(url, timeout=90, retries=2, retry_delay=5)
    return body if ok and isinstance(body, list) else []


def main() -> int:
    today = date.today()
    start = today - timedelta(days=730)
    print(f"Elia-backfill stroomnet-druk: {start} → {today}", file=sys.stderr)

    by_day: dict[str, list[dict]] = {}
    block_start = start
    while block_start < today:
        block_end = min(block_start + timedelta(days=90), today)
        recs = _fetch_block(block_start, block_end)
        print(f"  blok {block_start} … {block_end}: {len(recs)} records", file=sys.stderr)
        for rec in recs:
            dt = str(rec.get("datetime", ""))[:10]
            if len(dt) == 10:
                by_day.setdefault(dt, []).append(rec)
        block_start = block_end

    rows = []
    for day in sorted(by_day):
        ratio = aggregate_ratio(by_day[day])
        if ratio is not None:
            rows.append({"date": day, "value": round(ratio, 4)})

    if len(rows) < 60:
        print(f"FOUT: te weinig dagen ({len(rows)}).", file=sys.stderr)
        return 1

    out_path = DATA_DIR / "history" / "I-D3-009.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    vals = sorted(r["value"] for r in rows)
    print(f"✓ {len(rows)} dagcijfers → {out_path}", file=sys.stderr)
    print(f"  bereik {rows[0]['date']} … {rows[-1]['date']}", file=sys.stderr)
    print(f"  mediaan {vals[len(vals) // 2]:.4f}, "
          f"min {vals[0]:.4f} / max {vals[-1]:.4f}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

#### `app/pipeline/scripts/backfill_flood_baseline.py`

```python
"""
Backfill-script: echte 24-maanden-baseline voor het wateroverlast-signaal
(I-D1-009) uit de open-meteo Flood API (GloFAS-rivierafvoer).

Schrijft app/data/history/I-D1-009.json — zelfde transformatie als de
dagfetcher (som van de rivierafvoer over 4 Belgische stroomgebieden).

Run:  python scripts/backfill_flood_baseline.py
"""
from __future__ import annotations
import json
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.waterinfo import discharge_sum_series  # noqa: E402
from pipeline.util import DATA_DIR  # noqa: E402


def main() -> int:
    today = date.today()
    start = today - timedelta(days=730)
    print(f"Flood-backfill rivierafvoer BE: {start} → {today}", file=sys.stderr)

    series = discharge_sum_series(start, today)
    if len(series) < 60:
        print(f"FOUT: te weinig data ({len(series)} dagen).", file=sys.stderr)
        return 1

    rows = [{"date": d, "value": v} for d, v in series]
    out_dir = DATA_DIR / "history"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "I-D1-009.json"
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    vals = sorted(r["value"] for r in rows)
    print(f"✓ {len(rows)} dagcijfers → {out_path}", file=sys.stderr)
    print(f"  bereik {rows[0]['date']} … {rows[-1]['date']}", file=sys.stderr)
    print(f"  mediaan {vals[len(vals) // 2]:.1f}, "
          f"min {vals[0]:.1f} / max {vals[-1]:.1f}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

#### `app/pipeline/scripts/backfill_gdelt_baseline.py`

```python
"""
Eenmalig (periodiek te herhalen) backfill-script: haalt de ECHTE 24-maanden
dagelijkse GDELT-nieuwstoon voor Belgie op en schrijft die als
app/data/history/I-D5-001.json.

Dat bestand vervangt de vroegere synthetische sinus-baseline voor de
nieuwsnegativiteits-indicator. De engine (generate-fixture.ts) laadt het en
gebruikt de echte mediaan + MAD als meetlat — zo wordt de dagwaarde tegen
echte historie gewogen op dezelfde schaal.

Eén GDELT-call levert ~700 dagcijfers (~35 KB). Mediaan/MAD over 700 punten
zijn extreem stabiel; het volstaat dit script enkele keren per jaar te
herdraaien om de staart te verversen.

Run:  python scripts/backfill_gdelt_baseline.py
"""
from __future__ import annotations
import json
import sys
from datetime import date, timedelta
from pathlib import Path

# pipeline-package importeerbaar maken vanuit scripts/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.gdelt import gdelt_tone_series  # noqa: E402
from pipeline.util import DATA_DIR  # noqa: E402


def main() -> int:
    today = date.today()
    start = today - timedelta(days=730)
    print(f"GDELT-backfill nieuwstoon BE: {start} → {today}", file=sys.stderr)

    series = gdelt_tone_series(start, today)
    if not series:
        print("FOUT: GDELT gaf geen reeks terug (rate-limit of leeg).", file=sys.stderr)
        return 1

    # dedup op datum, chronologisch
    by_date: dict[str, float] = {}
    for pt in series:
        by_date[pt["date"]] = pt["value"]
    rows = [{"date": d, "value": v} for d, v in sorted(by_date.items())]

    out_dir = DATA_DIR / "history"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "I-D5-001.json"
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    vals = [r["value"] for r in rows]
    vals_sorted = sorted(vals)
    median = vals_sorted[len(vals_sorted) // 2]
    print(f"✓ {len(rows)} dagcijfers → {out_path}", file=sys.stderr)
    print(f"  bereik {rows[0]['date']} … {rows[-1]['date']}", file=sys.stderr)
    print(f"  mediaan negativiteit ≈ {median:.3f}, "
          f"min {min(vals):.3f} / max {max(vals):.3f}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

#### `app/pipeline/scripts/backfill_macro_baseline.py`

```python
"""
Backfill-script voor de vijf macro-economische indicatoren. Haalt de ECHTE
historische reeksen op en schrijft per indicator app/data/history/{code}.json.

Tot nu toe draaiden deze indicatoren op een SYNTHETISCHE (sinus + ruis)
baseline in generate-fixture.ts. Daardoor werd de dagwaarde tegen een verzonnen
meetlat gewogen en was de stress-score vervalst. Dit script vervangt die
baseline door echte historie op exact dezelfde schaal als de dagwaarde.

Indicatoren en bronnen
----------------------
- I-D3-001  CPI / inflatie (yoy %)        ECB SDW ICP   — MAANDdata
- I-D3-002  Energieprijs (€/MWh)          Energy-Charts — DAGdata
- I-D3-005  Werkloosheid (%)              ECB SDW LFSI  — MAANDdata
- I-D3-006  Hypotheekrente (%)            ECB SDW MIR   — MAANDdata
- I-D3-003  Ontslagen-proxy (log1p)       ECB SDW LFSI  — MAANDdata (delta)

SCHAAL-DISCIPLINE
-----------------
Elke historische observatie krijgt EXACT dezelfde transformatie als de
bijhorende fetcher vandaag toepast:
- CPI / werkloosheid / hypotheekrente: de ECB-waarde wordt rechtstreeks
  gebruikt (geen eenheid-transformatie — de fetchers nemen `float(obs)` puur).
- Ontslagen-proxy: de fetcher neemt de maand-op-maand-delta van de BE-
  werkloosheidsRATE (procentpunt), zet die om naar geschatte extra
  werkzoekenden via `delta_pp / 100 * BE_WORKFORCE` en past dan
  `log1p(max(0, ...))` toe. Dit script repliceert die keten op de volledige
  LFSI-reeks: punt n krijgt waarde = log1p(max(0, (rate[n]-rate[n-1])/100*5e6)).

De engine (generate-fixture.ts → loadRealHistory) laadt deze bestanden en
gebruikt mediaan + MAD als robuuste meetlat. Hij heeft >=60 punten nodig om de
echte baseline te activeren; we leveren ruim meer (maanddata ~10 jaar,
energie-dagdata ~24 maanden).

Run:  python scripts/backfill_macro_baseline.py
"""
from __future__ import annotations
import json
import math
import sys
from datetime import date, timedelta
from pathlib import Path

# pipeline-package importeerbaar maken vanuit scripts/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.util import DATA_DIR, safe_request  # noqa: E402

# BE-beroepsbevolking (15-74) — identiek aan fod_waso.BE_WORKFORCE.
# Gebruikt om de werkloosheidsRATE-delta om te zetten naar werkzoekenden-count.
BE_WORKFORCE = 5_000_000

# --- ECB SDW endpoints met volledige reeks (geen lastNObservations-limiet) ---
# Zelfde series-keys als de fetchers; alleen het observatie-venster verschilt.
ECB_CPI_HISTORY_URL = (
    "https://data-api.ecb.europa.eu/service/data/ICP/M.BE.N.000000.4.ANR"
    "?format=jsondata&startPeriod=2008-01"
)
ECB_UNEMPLOYMENT_HISTORY_URL = (
    "https://data-api.ecb.europa.eu/service/data/LFSI/M.BE.S.UNEHRT.TOTAL0.15_74.T"
    "?format=jsondata&startPeriod=2008-01"
)
ECB_MORTGAGE_HISTORY_URL = (
    "https://data-api.ecb.europa.eu/service/data/MIR/M.BE.B.A2C.A.R.A.2250.EUR.N"
    "?format=jsondata&startPeriod=2008-01"
)


def _parse_ecb_series(body) -> list[tuple[str, float]]:
    """Parse een volledige ECB SDW jsondata-reeks.

    Geeft een chronologisch gesorteerde lijst (period, value) terug, waarbij
    period het ECB-id is (bv. '2026-04' voor maanddata). Repliceert de
    indexering die _parse_ecb_latest_with_period in statbel.py gebruikt:
    de observatie-sleutel is een integer-index in de observation-dimensie.
    """
    try:
        ds = body["dataSets"][0]
        series = next(iter(ds["series"].values()))
        observations = series["observations"]
    except (KeyError, IndexError, StopIteration, TypeError):
        return []

    try:
        obs_dim = body["structure"]["dimensions"]["observation"][0]["values"]
        period_for = {i: obs_dim[i]["id"] for i in range(len(obs_dim))}
    except (KeyError, IndexError, TypeError):
        period_for = {}

    rows: list[tuple[str, float]] = []
    for key, obs in observations.items():
        try:
            idx = int(key)
            val = obs[0]
        except (ValueError, IndexError, TypeError):
            continue
        if val is None:
            continue
        period = period_for.get(idx, "")
        if not period:
            continue
        try:
            rows.append((period, float(val)))
        except (ValueError, TypeError):
            continue
    rows.sort(key=lambda r: r[0])
    return rows


def _month_to_date(period: str) -> str:
    """ECB-maandperiode 'YYYY-MM' → 'YYYY-MM-01'. Daterange-id's worden ongemoeid gelaten."""
    if len(period) == 7 and period[4] == "-":
        return f"{period}-01"
    return period


def _fetch_ecb_history(url: str, label: str) -> list[tuple[str, float]]:
    print(f"  {label}: GET {url}", file=sys.stderr)
    ok, body = safe_request(url, timeout=30, headers={"Accept": "application/json"})
    if not ok or not isinstance(body, dict):
        print(f"  FOUT: ECB-call faalde voor {label} ({body!r:.120})", file=sys.stderr)
        return []
    rows = _parse_ecb_series(body)
    if not rows:
        print(f"  FOUT: geen observaties in ECB-respons voor {label}.", file=sys.stderr)
    return rows


def _write_history(code: str, rows: list[dict]) -> int:
    """Schrijf rows naar app/data/history/{code}.json en log min/mediaan/max."""
    if not rows:
        print(f"  WAARSCHUWING {code}: 0 punten — bestand niet geschreven.", file=sys.stderr)
        return 0
    if len(rows) < 30:
        print(f"  WAARSCHUWING {code}: slechts {len(rows)} punten "
              f"(<30 — engine gebruikt deze baseline niet).", file=sys.stderr)
    out_dir = DATA_DIR / "history"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{code}.json"
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    vals = sorted(r["value"] for r in rows)
    median = vals[len(vals) // 2]
    print(f"  OK {code}: {len(rows)} punten → {out_path}", file=sys.stderr)
    print(f"     bereik {rows[0]['date']} … {rows[-1]['date']}", file=sys.stderr)
    print(f"     min {vals[0]:.4f} / mediaan {median:.4f} / max {vals[-1]:.4f}",
          file=sys.stderr)
    return len(rows)


def backfill_cpi() -> int:
    """I-D3-001 — ECB ICP BE HICP yoy %. Raw value, geen transformatie."""
    rows = _fetch_ecb_history(ECB_CPI_HISTORY_URL, "I-D3-001 CPI")
    out = [{"date": _month_to_date(p), "value": v} for p, v in rows]
    return _write_history("I-D3-001", out)


def backfill_unemployment() -> int:
    """I-D3-005 — ECB LFSI BE werkloosheidsrate %. Raw value, geen transformatie."""
    rows = _fetch_ecb_history(ECB_UNEMPLOYMENT_HISTORY_URL, "I-D3-005 werkloosheid")
    out = [{"date": _month_to_date(p), "value": v} for p, v in rows]
    return _write_history("I-D3-005", out)


def backfill_mortgage() -> int:
    """I-D3-006 — ECB MIR BE hypotheekrente nieuwe contracten %. Raw value."""
    rows = _fetch_ecb_history(ECB_MORTGAGE_HISTORY_URL, "I-D3-006 hypotheekrente")
    out = [{"date": _month_to_date(p), "value": v} for p, v in rows]
    return _write_history("I-D3-006", out)


def backfill_layoffs() -> int:
    """I-D3-003 — ontslagen-proxy = log1p(max(0, delta_pp/100 * BE_WORKFORCE)).

    Dezelfde keten als fod_waso.fetch_collective_layoffs: de fetcher neemt de
    delta tussen de twee laatste LFSI-werkloosheidsRATE-observaties. Wij
    repliceren dat op de hele reeks: elke maand n krijgt de delta t.o.v. n-1.
    """
    rate_rows = _fetch_ecb_history(ECB_UNEMPLOYMENT_HISTORY_URL, "I-D3-003 ontslagen-proxy")
    out: list[dict] = []
    for i in range(1, len(rate_rows)):
        prev_rate = rate_rows[i - 1][1]
        last_rate = rate_rows[i][1]
        delta_pp = last_rate - prev_rate
        effective_workers = max(0.0, delta_pp / 100 * BE_WORKFORCE)
        value = math.log1p(effective_workers)
        out.append({"date": _month_to_date(rate_rows[i][0]), "value": value})
    return _write_history("I-D3-003", out)


def backfill_energy() -> int:
    """I-D3-002 — Energy-Charts BE day-ahead €/MWh, dag-gemiddelde van uurprijzen.

    De fetcher neemt het gemiddelde van de uurprijzen van één dag. We halen
    ~24 maanden in jaarblokken op (de API geeft per call de uur-reeks +
    unix-timestamps terug) en aggregeren naar één dag-gemiddelde per dag —
    exact dezelfde aggregatie als energy_charts._fetch_avg_price.
    """
    today = date.today()
    start = today - timedelta(days=730)
    by_date: dict[str, list[float]] = {}

    # In blokken van 30 dagen ophalen — grote ranges geven 503 op de
    # Energy-Charts price-API; kleine blokken zijn betrouwbaar.
    block_start = start
    while block_start < today:
        block_end = min(block_start + timedelta(days=30), today)
        url = (
            f"https://api.energy-charts.info/price"
            f"?bzn=BE&start={block_start.isoformat()}&end={block_end.isoformat()}"
        )
        print(f"  I-D3-002 energie: GET {url}", file=sys.stderr)
        ok, body = safe_request(url, timeout=40)
        if ok and isinstance(body, dict):
            prices = body.get("price", []) or []
            stamps = body.get("unix_seconds", []) or []
            n = min(len(prices), len(stamps))
            for k in range(n):
                p = prices[k]
                ts = stamps[k]
                if not isinstance(p, (int, float)) or not isinstance(ts, (int, float)):
                    continue
                d = date.fromtimestamp(ts).isoformat()
                by_date.setdefault(d, []).append(float(p))
        else:
            print(f"  WAARSCHUWING energie-blok faalde: {body!r:.120}", file=sys.stderr)
        block_start = block_end + timedelta(days=1)

    rows = [
        {"date": d, "value": sum(v) / len(v)}
        for d, v in sorted(by_date.items())
        if v
    ]
    return _write_history("I-D3-002", rows)


def main() -> int:
    print("Macro-economische baseline-backfill (5 indicatoren)", file=sys.stderr)
    print("=" * 56, file=sys.stderr)
    counts = {
        "I-D3-001 (CPI, maanddata)": backfill_cpi(),
        "I-D3-005 (werkloosheid, maanddata)": backfill_unemployment(),
        "I-D3-006 (hypotheekrente, maanddata)": backfill_mortgage(),
        "I-D3-003 (ontslagen-proxy, maanddata)": backfill_layoffs(),
        "I-D3-002 (energieprijs, dagdata)": backfill_energy(),
    }
    print("=" * 56, file=sys.stderr)
    failed = [k for k, c in counts.items() if c < 30]
    for k, c in counts.items():
        print(f"  {k}: {c} punten", file=sys.stderr)
    if failed:
        print(f"FOUT: te weinig punten voor: {', '.join(failed)}", file=sys.stderr)
        return 1
    print("Klaar — alle vijf baselines weggeschreven.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

#### `app/pipeline/scripts/backfill_pollen_baseline.py`

```python
"""
Backfill-script: echte 24-maanden-baseline voor de pollen-indicator
(I-D1-010) uit de open-meteo Air-Quality-API (CAMS-pollen).

Schrijft app/data/history/I-D1-010.json — exact dezelfde transformatie als
de dagfetcher (som van 5 pollensoorten, daggemiddelde uit uurwaarden).

Run:  python scripts/backfill_pollen_baseline.py
"""
from __future__ import annotations
import json
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.pollen import POLLEN_SPECIES  # noqa: E402
from pipeline.util import safe_request, DATA_DIR  # noqa: E402


def main() -> int:
    today = date.today()
    start = today - timedelta(days=730)
    print(f"Pollen-backfill Brussel: {start} → {today}", file=sys.stderr)

    url = (
        "https://air-quality-api.open-meteo.com/v1/air-quality"
        "?latitude=50.85&longitude=4.35"
        f"&hourly={','.join(POLLEN_SPECIES)}"
        "&timezone=Europe%2FBrussels"
        f"&start_date={start.isoformat()}&end_date={today.isoformat()}"
    )
    ok, body = safe_request(url, timeout=60, retries=2, retry_delay=5)
    if not ok or not isinstance(body, dict):
        print(f"FOUT: air-quality-API onbereikbaar ({body!r:.120}).", file=sys.stderr)
        return 1
    hourly = body.get("hourly", {})
    times = hourly.get("time", [])
    if not times:
        print("FOUT: geen uurdata in respons.", file=sys.stderr)
        return 1

    # per dag: per soort de uurwaarden verzamelen
    by_day: dict[str, dict[str, list[float]]] = {}
    for sp in POLLEN_SPECIES:
        vals = hourly.get(sp, []) or []
        for t, v in zip(times, vals):
            day = str(t)[:10]
            if isinstance(v, (int, float)):
                by_day.setdefault(day, {}).setdefault(sp, []).append(float(v))

    rows = []
    for day in sorted(by_day):
        species = by_day[day]
        total = 0.0
        for sp in POLLEN_SPECIES:
            vv = species.get(sp)
            if vv:
                total += sum(vv) / len(vv)
        rows.append({"date": day, "value": round(total, 3)})

    if len(rows) < 60:
        print(f"FOUT: te weinig dagen ({len(rows)}).", file=sys.stderr)
        return 1

    out_path = DATA_DIR / "history" / "I-D1-010.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    vals = sorted(r["value"] for r in rows)
    print(f"✓ {len(rows)} dagcijfers → {out_path}", file=sys.stderr)
    print(f"  bereik {rows[0]['date']} … {rows[-1]['date']}", file=sys.stderr)
    print(f"  mediaan {vals[len(vals) // 2]:.1f}, "
          f"min {vals[0]:.1f} / max {vals[-1]:.1f}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

#### `app/pipeline/scripts/backfill_weather_baseline.py`

```python
"""
Backfill-script: haalt ~24 maanden ECHTE dagelijkse weer- en luchtkwaliteits-
data voor Brussel op en schrijft die als drie historiebestanden:

  app/data/history/I-D1-002.json  (Hitte)
  app/data/history/I-D1-003.json  (Kou)
  app/data/history/I-D1-004.json  (Luchtkwaliteit, ratio tov WHO 2021)

Die bestanden vervangen de SYNTHETISCHE sinus-baseline die de engine
(generate-fixture.ts) anders voor deze drie indicatoren gebruikt. Met een
echte historie wordt de dagwaarde tegen een echte mediaan + MAD gewogen.

KRITISCH — schaal-overeenkomst:
De historische waarde MOET op exact dezelfde schaal staan als wat de live
fetchers (pipeline/fetchers/kmi.py en irceline.py) vandaag produceren,
anders is de Z-score onzin. Daarom past dit script EXACT dezelfde
transformaties toe:

  I-D1-002 Hitte  = max(0, Tmax - 30)            — graden boven 30 °C
  I-D1-003 Kou    = max(0, -5 - Tmin)            — graden onder -5 °C
  I-D1-004 AQ     = max(PM25/15, O3/100, NO2/25) — ratio tov WHO 2021

De live luchtkwaliteits-fetcher rekent op UUR-data: PM2.5 en NO2 als
dag-GEMIDDELDE, O3 als dag-MAXIMUM. Dit script repliceert dat door de
open-meteo air-quality-archief-API met uur-velden te bevragen en per dag
te aggregeren op exact dezelfde manier.

Bronnen (open, gratis, geen token):
  - Weer:            https://archive-api.open-meteo.com/v1/archive
  - Luchtkwaliteit:  https://air-quality-api.open-meteo.com/v1/air-quality
                     (met start_date/end_date — archief-modus)

Run:  python scripts/backfill_weather_baseline.py
"""
from __future__ import annotations
import json
import sys
from datetime import date, timedelta
from pathlib import Path

# pipeline-package importeerbaar maken vanuit scripts/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.util import DATA_DIR, safe_request  # noqa: E402

# Brussel — identiek aan de live fetchers (doc 03 §1.2)
LAT = 50.85
LON = 4.35

# WHO 2021 grenswaarden (μg/m³) — identiek aan irceline.py
WHO_PM25 = 15.0   # 24-hour mean
WHO_O3 = 100.0    # 8-hour daily max (hier dag-max van uurwaarden, zoals de fetcher)
WHO_NO2 = 25.0    # 24-hour mean

# Aantal dagen historie. open-meteo-archief loopt enkele dagen achter op
# 'vandaag'; we vragen tot 5 dagen terug en gaan ~755 dagen verder terug.
HISTORY_DAYS = 755
ARCHIVE_LAG_DAYS = 5


# ── transformaties: EXACT gelijk aan de live fetchers ──────────────────────

def heat_excess(tmax: float | None) -> float | None:
    """I-D1-002 — kmi.py: max(0.0, tmax - 30)."""
    if tmax is None:
        return None
    return max(0.0, tmax - 30)


def cold_excess(tmin: float | None) -> float | None:
    """I-D1-003 — kmi.py: max(0.0, -5 - tmin)."""
    if tmin is None:
        return None
    return max(0.0, -5 - tmin)


def composite_aq(pm25: float | None, o3: float | None, no2: float | None) -> float | None:
    """I-D1-004 — irceline.py: max(PM25/15, O3/100, NO2/25)."""
    ratios = []
    if pm25 is not None:
        ratios.append(pm25 / WHO_PM25)
    if o3 is not None:
        ratios.append(o3 / WHO_O3)
    if no2 is not None:
        ratios.append(no2 / WHO_NO2)
    return max(ratios) if ratios else None


# ── hulp ───────────────────────────────────────────────────────────────────

def _safe_mean(xs):
    """Identiek aan irceline._safe_mean."""
    vals = [x for x in xs if isinstance(x, (int, float))]
    return sum(vals) / len(vals) if vals else None


def _safe_max(xs):
    """Identiek aan irceline._safe_max."""
    vals = [x for x in xs if isinstance(x, (int, float))]
    return max(vals) if vals else None


def _round(v: float) -> float:
    return round(v, 4)


# ── fetchers (archief) ──────────────────────────────────────────────────────

def fetch_weather(start: date, end: date) -> dict[str, dict[str, float]]:
    """Dagelijkse Tmax/Tmin uit het open-meteo weer-archief.

    Geeft {YYYY-MM-DD: {"tmax": ..., "tmin": ...}}.
    """
    url = (
        "https://archive-api.open-meteo.com/v1/archive"
        f"?latitude={LAT}&longitude={LON}"
        f"&start_date={start.isoformat()}&end_date={end.isoformat()}"
        "&daily=temperature_2m_max,temperature_2m_min"
        "&timezone=Europe%2FBrussels"
    )
    ok, body = safe_request(url, timeout=60)
    if not ok or not isinstance(body, dict):
        raise RuntimeError(f"weer-archief faalde: {body}")
    daily = body.get("daily", {})
    times = daily.get("time", [])
    tmaxs = daily.get("temperature_2m_max", [])
    tmins = daily.get("temperature_2m_min", [])
    out: dict[str, dict[str, float]] = {}
    for i, d in enumerate(times):
        out[d] = {
            "tmax": tmaxs[i] if i < len(tmaxs) else None,
            "tmin": tmins[i] if i < len(tmins) else None,
        }
    return out


def fetch_air_quality(start: date, end: date) -> dict[str, float]:
    """Dagelijkse Composite_AQ uit het open-meteo air-quality-archief.

    Bevraagt UUR-data en aggregeert per dag EXACT zoals de live fetcher:
    PM2.5 en NO2 → dag-gemiddelde, O3 → dag-maximum.

    Geeft {YYYY-MM-DD: composite_aq}.
    """
    url = (
        "https://air-quality-api.open-meteo.com/v1/air-quality"
        f"?latitude={LAT}&longitude={LON}"
        f"&start_date={start.isoformat()}&end_date={end.isoformat()}"
        "&hourly=pm2_5,ozone,nitrogen_dioxide"
        "&timezone=Europe%2FBrussels"
    )
    ok, body = safe_request(url, timeout=90)
    if not ok or not isinstance(body, dict):
        raise RuntimeError(f"air-quality-archief faalde: {body}")
    hourly = body.get("hourly", {})
    times = hourly.get("time", [])
    pm = hourly.get("pm2_5", [])
    o3 = hourly.get("ozone", [])
    no2 = hourly.get("nitrogen_dioxide", [])

    # bundel uurwaarden per dag (datum-prefix van de ISO-tijdstring)
    by_day: dict[str, dict[str, list]] = {}
    for i, t in enumerate(times):
        day = t[:10]
        b = by_day.setdefault(day, {"pm": [], "o3": [], "no2": []})
        if i < len(pm):
            b["pm"].append(pm[i])
        if i < len(o3):
            b["o3"].append(o3[i])
        if i < len(no2):
            b["no2"].append(no2[i])

    out: dict[str, float] = {}
    for day, b in by_day.items():
        # zelfde aggregatie als irceline.fetch_air_quality
        pm25_d = _safe_mean(b["pm"])
        o3_d = _safe_max(b["o3"])
        no2_d = _safe_mean(b["no2"])
        aq = composite_aq(pm25_d, o3_d, no2_d)
        if aq is not None:
            out[day] = aq
    return out


def _write(code: str, rows: list[dict]) -> Path:
    out_dir = DATA_DIR / "history"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{code}.json"
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")
    return out_path


def _report(code: str, label: str, rows: list[dict]) -> None:
    vals = sorted(r["value"] for r in rows)
    median = vals[len(vals) // 2]
    print(
        f"  {code} ({label}): {len(rows)} dagen, "
        f"{rows[0]['date']} … {rows[-1]['date']} | "
        f"min {vals[0]:.4f} / mediaan {median:.4f} / max {vals[-1]:.4f}",
        file=sys.stderr,
    )


def main() -> int:
    end = date.today() - timedelta(days=ARCHIVE_LAG_DAYS)
    start = end - timedelta(days=HISTORY_DAYS)
    print(
        f"Weer-/AQ-backfill Brussel: {start} → {end} (~{HISTORY_DAYS} dagen)",
        file=sys.stderr,
    )

    # ── weer → I-D1-002 (hitte), I-D1-003 (kou) ──
    weather = fetch_weather(start, end)
    heat_rows: list[dict] = []
    cold_rows: list[dict] = []
    for d in sorted(weather.keys()):
        rec = weather[d]
        h = heat_excess(rec.get("tmax"))
        c = cold_excess(rec.get("tmin"))
        if h is not None:
            heat_rows.append({"date": d, "value": _round(h)})
        if c is not None:
            cold_rows.append({"date": d, "value": _round(c)})

    # ── luchtkwaliteit → I-D1-004 ──
    aq = fetch_air_quality(start, end)
    aq_rows = [{"date": d, "value": _round(aq[d])} for d in sorted(aq.keys())]

    if len(heat_rows) < 60 or len(cold_rows) < 60 or len(aq_rows) < 60:
        print(
            f"FOUT: te weinig data (hitte {len(heat_rows)}, kou {len(cold_rows)}, "
            f"AQ {len(aq_rows)}).",
            file=sys.stderr,
        )
        return 1

    p1 = _write("I-D1-002", heat_rows)
    p2 = _write("I-D1-003", cold_rows)
    p3 = _write("I-D1-004", aq_rows)

    print(f"✓ geschreven: {p1}", file=sys.stderr)
    print(f"✓ geschreven: {p2}", file=sys.stderr)
    print(f"✓ geschreven: {p3}", file=sys.stderr)
    _report("I-D1-002", "Hitte = max(0,Tmax-30)", heat_rows)
    _report("I-D1-003", "Kou = max(0,-5-Tmin)", cold_rows)
    _report("I-D1-004", "AQ = max(PM25/15,O3/100,NO2/25)", aq_rows)
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

#### `app/pipeline/scripts/backfill_wikipedia_baseline.py`

```python
"""
Backfill-script: haalt ~24 maanden Wikipedia-pageviews voor de stress-
artikelset op en schrijft die als app/data/history/I-D5-002.json.

Dat bestand geeft de zoekinteresse-indicator (I-D5-002) een ECHTE
24-maanden-baseline, op exact dezelfde schaal als de dagwaarde
(voortschrijdend 7d-gemiddelde van gesommeerde weergaven).

Baseline-venster: ~11 maanden (340 dagen). Wikipedia-aandachts-indexen
kennen structurele drift (artikels winnen of verliezen relatief verkeer
over jaren). Een venster van ~24 maanden zou de meetlat scheeftrekken naar
een verouderd regime; ~11 maanden volgt het recente niveau beter en houdt
toch ruim voldoende datapunten voor een robuuste mediaan + MAD.
Periodiek herdraaien volstaat.

Run:  python scripts/backfill_wikipedia_baseline.py
"""
from __future__ import annotations
import json
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.fetchers.wikipedia import daily_attention_index, trailing_mean_series  # noqa: E402
from pipeline.util import DATA_DIR  # noqa: E402


def main() -> int:
    today = date.today()
    start = today - timedelta(days=340)
    print(f"Wikipedia-backfill zoekinteresse: {start} → {today}", file=sys.stderr)

    index = daily_attention_index(start, today)
    if len(index) < 60:
        print(f"FOUT: te weinig data ({len(index)} dagen).", file=sys.stderr)
        return 1

    series = trailing_mean_series(index, window=7)
    # de eerste 6 dagen hebben een onvolledig venster — laat ze weg
    series = series[6:]

    out_dir = DATA_DIR / "history"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "I-D5-002.json"
    out_path.write_text(json.dumps(series, indent=2), encoding="utf-8")

    vals = sorted(r["value"] for r in series)
    median = vals[len(vals) // 2]
    print(f"✓ {len(series)} dagcijfers → {out_path}", file=sys.stderr)
    print(f"  bereik {series[0]['date']} … {series[-1]['date']}", file=sys.stderr)
    print(f"  mediaan {median:.1f}, min {vals[0]:.1f} / max {vals[-1]:.1f}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

#### `app/pipeline/requirements.txt`

```
requests>=2.31.0
python-dateutil>=2.8.2
pytrends>=4.9.2
beautifulsoup4>=4.12.2
lxml>=5.1.0
```

### Web (React + Vite)

#### `app/web/src/components/indicator-utils.ts`

```ts
import type { IndicatorState } from "../types";

export function stateLabel(s: IndicatorState): string {
  switch (s) {
    case "rustig": return "lager dan gewoonlijk";
    case "normaal": return "gemiddeld";
    case "verhoogd": return "hoger dan gewoonlijk";
    case "extreem": return "uitzonderlijk hoog";
    case "ontbreekt": return "geen data";
  }
}

export function stateColor(s: IndicatorState): string {
  switch (s) {
    case "rustig": return "var(--c-green)";
    case "normaal": return "var(--c-ink-mute)";
    case "verhoogd": return "var(--c-amber)";
    case "extreem": return "var(--c-red)";
    case "ontbreekt": return "var(--c-ink-mute)";
  }
}

export function stateIcon(s: IndicatorState): string {
  switch (s) {
    case "rustig": return "○";
    case "normaal": return "●";
    case "verhoogd": return "▲";
    case "extreem": return "▲▲";
    case "ontbreekt": return "·";
  }
}
```

#### `app/web/src/copy.ts`

```ts
/**
 * Publieke copy in alpine register.
 * Voor lezers vanaf ~15 jaar. Geen jargon. Geen "u bent gestrest".
 * CTA mag voller Les Hautes Alpes-stem ademen, meet-secties blijven sober.
 */

export const TIER_HEADLINE = {
  green: "Vandaag is een gewone dag.",
  amber: "Vandaag komt er veel tegelijk op ons af.",
  red: "Vandaag staan veel signalen uitzonderlijk hoog.",
} as const;

export const TIER_SUBLINE = {
  green: "Geen verhoogde druk op de hele bevolking.",
  amber: "Verschillende stress-factoren staan samen aan, al drie dagen of langer.",
  red: "We zitten in de zwaarste 10% van de laatste twee jaar.",
} as const;

export const LES_HAUTES_ALPES_CTA = {
  green: null,
  amber: {
    headline: "Adem in. Adem uit.",
    body: "Wanneer de hele bevolking onder druk staat, weegt een paar dagen tussen de pieken extra zwaar. De Hautes-Alpes liggen op vier uur rijden. Lucht boven 1800 meter is anders.",
    action: "Ontdek de bestemmingen",
  },
  red: {
    headline: "Even uit de drukte stappen.",
    body: "Statistisch gezien is dit een goed moment om te kiezen voor stilte, hoogte en heldere lucht. Niet pas als het te laat is. Preventief, terwijl het kan.",
    action: "Ontdek de bestemmingen",
  },
} as const;

export const BRAND_SAFETY_OVERRIDE = {
  elevated: "Er speelt iets gevoeligs vandaag. We zetten de commerciële boodschap even op pauze. De meting loopt door.",
  block: "Commerciële boodschappen zijn opgeschort. De teller blijft de huidige toestand registreren.",
} as const;

export const DOMAIN_LABELS = {
  D1: "Weer & lucht",
  D2: "Verkeer & verplaatsingen",
  D3: "Economie",
  D4: "Werk & gezin",
  D5: "Nieuws & gebeurtenissen",
  D6: "Kalender",
} as const;

export const METHODOLOGY_DISCLAIMER = [
  "Dit is een teller voor het hele land, niet voor jou persoonlijk. We kijken naar 24 dingen die de hele bevolking onder druk kunnen zetten en tellen hoe ongewoon ze vandaag zijn.",
  "We meten dus geen mensen, we meten omstandigheden. We zijn geen dokter. We voorspellen niet wat morgen gaat gebeuren. Het is geen wetenschappelijke studie, het is gemaakt met onderzoek dat anderen al gedaan hebben.",
] as const;

export const FOOTER_NOTES = {
  implementationStage: "Werkt nu nog in test-modus.",
  methodologyRef: "Methodologie: SBI v0.2, 24 indicatoren in 6 categorieën.",
  ondersteunend: "Gebaseerd op onderzoek van McEwen (allostatic load), Marmot (sociale gezondheids-determinanten) en Hobfoll (conservation of resources).",
  tagline: "Natuurlijk in het hart van de Alpen.",
} as const;
```

#### `app/web/src/lib/explainer.ts`

```ts
/**
 * Context-bewuste tekstgenerator voor de barometer.
 * Bouwt headline + body uit DailyOutput.
 *
 * Taalregister: neutraal informerend, 15-jarig begripbaar.
 * Geen marketing-toon, geen "u/jij" attributies, geen klinische taal (doc 09).
 */
import type { DailyOutput, IndicatorBreakdown } from "../types";

export interface ExplainerContext {
  cn: number;
  percentile: number;
  daysInTier: number;
  elevatedCount: number;
  extremeCount: number;
  lowerCount: number;
  totalAvailable: number;
  topContributors: IndicatorBreakdown[];
  brandSafety: string;
  brandSafetyReason: string | null;
}

export function buildContext(data: DailyOutput): ExplainerContext {
  const breakdown = data.indicator_breakdown;
  const available = breakdown.filter((b) => b.state !== "ontbreekt");
  const elevated = available.filter((b) => b.state === "verhoogd" || b.state === "extreem");
  const extreme = available.filter((b) => b.state === "extreem");
  const lower = available.filter((b) => b.state === "rustig");
  const topContributors = [...available]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3);

  return {
    cn: data.condition_level.value,
    percentile: data.percentile.short_24m,
    daysInTier: data.tier.days_in_tier,
    elevatedCount: elevated.length,
    extremeCount: extreme.length,
    lowerCount: lower.length,
    totalAvailable: available.length,
    topContributors,
    brandSafety: data.brand_safety.flag,
    brandSafetyReason: data.brand_safety.reason,
  };
}

/** Hoofdtitel boven het uitleg-blok. */
export function buildHeadline(ctx: ExplainerContext): string {
  if (ctx.brandSafety !== "normal") {
    return "Even op pauze.";
  }
  if (ctx.cn === 1) {
    if (ctx.percentile === 0) return "Stress-signalen staan vandaag historisch laag.";
    if (ctx.percentile < 20) return "Stress-signalen staan vandaag laag.";
    return "Vandaag is een gewone dag.";
  }
  if (ctx.cn === 2) {
    if (ctx.elevatedCount === 0) return "Vandaag is een gewone dag.";
    if (ctx.elevatedCount === 1) return "Vandaag staat één signaal hoger dan gewoonlijk.";
    return `Vandaag staan ${ctx.elevatedCount} signalen iets boven gemiddeld.`;
  }
  if (ctx.cn === 3) {
    return `Al ${ctx.daysInTier} dagen op rij meerdere signalen hoger dan gewoonlijk.`;
  }
  if (ctx.cn === 4) {
    return `Al ${ctx.daysInTier} dagen op rij in de top-10% van de laatste twee jaar.`;
  }
  return "Iets gevoeligs is gaande.";
}

/** Beschrijvende alinea onder de hoofdtitel. */
export function buildBody(ctx: ExplainerContext): string {
  if (ctx.brandSafety !== "normal") {
    const reason = ctx.brandSafetyReason ?? "gevoelige actuele gebeurtenis";
    return `Brand-safety-vlag actief vanwege ${reason}. De meting blijft lopen, maar commerciële boodschappen staan op pauze. Vandaag wegen ${ctx.elevatedCount} signalen hoger dan gewoonlijk mee.`;
  }

  if (ctx.cn === 1) {
    if (ctx.percentile === 0) {
      return `Geen van de 10 indicatoren staat hoger dan gewoonlijk. Sinds twee jaar zijn er geen kalmere dagen geregistreerd.`;
    }
    if (ctx.percentile < 30) {
      return `${ctx.lowerCount} signalen onder gemiddeld, geen enkele hoger dan gewoonlijk. We zitten lager dan op ${100 - ctx.percentile}% van de afgelopen twee jaar.`;
    }
    return `Geen van de 10 indicatoren staat hoger dan gewoonlijk. We zitten lager dan op ${100 - ctx.percentile}% van de afgelopen twee jaar.`;
  }

  if (ctx.cn === 2) {
    if (ctx.elevatedCount === 0) {
      return `Niets bijzonders te melden. 10 signalen blijven binnen de gemiddelde zone.`;
    }
    const lead = describeTop(ctx.topContributors, 1);
    return `${lead} Voor banner-activatie zouden meerdere signalen tegelijk hoger moeten staan, drie dagen op rij.`;
  }

  if (ctx.cn === 3) {
    const lead = describeTop(ctx.topContributors, 3);
    return `${lead} Sinds ${ctx.daysInTier} dagen op rij is dat zo. Banner-activatie loopt: statistisch een geschikt moment voor extra herstel.`;
  }

  if (ctx.cn === 4) {
    const lead = describeTop(ctx.topContributors, 3);
    return `${ctx.extremeCount} signaal${ctx.extremeCount === 1 ? "" : "en"} ${ctx.extremeCount === 1 ? "staat" : "staan"} in de hoogste zone. ${lead} Banner-activatie verhoogd.`;
  }

  return "";
}

function describeTop(top: IndicatorBreakdown[], count: number): string {
  if (top.length === 0) return "";
  const names = top.slice(0, count).map((t) => `**${t.plain_name.toLowerCase()}**`);
  if (names.length === 1) return `Vooral ${names[0]} weegt vandaag mee.`;
  if (names.length === 2) return `Vooral ${names[0]} en ${names[1]} wegen vandaag mee.`;
  return `Vooral ${names[0]}, ${names[1]} en ${names[2]} wegen vandaag mee.`;
}

/** Korte context-zin voor onder het CN-cijfer (cn-secondary). */
export function buildPercentileLine(ctx: ExplainerContext): string {
  if (ctx.percentile === 0) {
    return "Lager dan elke andere dag van de afgelopen twee jaar.";
  }
  if (ctx.percentile === 100) {
    return "Hoger dan elke andere dag van de afgelopen twee jaar.";
  }
  if (ctx.percentile < 50) {
    return `Lager dan op ${100 - ctx.percentile}% van de afgelopen twee jaar.`;
  }
  return `Hoger dan op ${ctx.percentile}% van de afgelopen twee jaar.`;
}

/** Korte status-zin per CN, voor de cn-description in het CN-blok. */
export function buildCnDescription(ctx: ExplainerContext): string {
  if (ctx.brandSafety !== "normal") {
    const reason = ctx.brandSafetyReason ?? "actuele gevoelige situatie";
    return `Brand-safety-vlag actief (${reason}). Commerciële uitnodigingen opgeschort, meting blijft lopen.`;
  }
  if (ctx.cn === 1) {
    if (ctx.percentile === 0) {
      return `Alle 10 signalen onder of binnen gemiddeld. Historisch lage dag.`;
    }
    return `Geen van de 10 indicatoren hoger dan gewoonlijk.`;
  }
  if (ctx.cn === 2) {
    if (ctx.elevatedCount === 0) {
      return `Alle 10 signalen binnen gemiddeld.`;
    }
    return `${ctx.elevatedCount} signaal${ctx.elevatedCount === 1 ? "" : "en"} hoger dan gewoonlijk, ${ctx.totalAvailable - ctx.elevatedCount} binnen gemiddeld.`;
  }
  if (ctx.cn === 3) {
    return `${ctx.elevatedCount} van de 10 signalen hoger dan gewoonlijk, ${ctx.daysInTier} dagen op rij. Banner-activatie loopt.`;
  }
  if (ctx.cn === 4) {
    return `${ctx.elevatedCount} signalen hoger dan gewoonlijk, ${ctx.extremeCount} in de hoogste zone. Banner-activatie verhoogd.`;
  }
  return "";
}
```

#### `app/web/src/lib/format-date.ts`

```ts
/**
 * Datum-formattering voor publicatiedatums per indicator.
 * Een observation_date is ofwel YYYY-MM-DD (dagelijkse bron)
 * of YYYY-MM (maandelijkse bron, bv. ECB).
 */

const MAANDEN = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

export function formatObservationDate(obs: string): string {
  if (!obs) return "onbekend";

  // YYYY-MM-DD → "21 mei 2026"
  const dayMatch = obs.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dayMatch) {
    const [, y, m, d] = dayMatch;
    const maand = MAANDEN[parseInt(m, 10) - 1] ?? m;
    return `${parseInt(d, 10)} ${maand} ${y}`;
  }

  // YYYY-MM → "april 2026"
  const monthMatch = obs.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const [, y, m] = monthMatch;
    const maand = MAANDEN[parseInt(m, 10) - 1] ?? m;
    return `${maand} ${y}`;
  }

  return obs;
}

/** Geeft 'dagcijfer' of 'maandcijfer' afhankelijk van de granulariteit. */
export function observationGranularity(obs: string): "dag" | "maand" | "onbekend" {
  if (/^\d{4}-\d{2}-\d{2}$/.test(obs)) return "dag";
  if (/^\d{4}-\d{2}$/.test(obs)) return "maand";
  return "onbekend";
}
```

#### `app/web/src/lib/kern.ts`

```ts
/**
 * SBI v0.4 — de 10 kern-indicatoren (de "kern", in het cijfer en in triggers).
 * Bron: SBI_v04_programmeerrichtlijn §1.
 *
 * "Weer (hitte/koude/storm)" telt conceptueel als één kern, maar bestaat in
 * de code uit twee aparte indicatoren (hitte + koude). Beide blijven kern.
 */
export const KERN_INDICATOR_CODES: string[] = [
  "I-D5-001", // negatief nieuws (toon) — ⚡ direct
  "I-D2-001", // verkeer & ongevallen — ⚡ direct
  "I-D5-003", // oorlog / grote gebeurtenis — ⚡ direct
  "I-D5-002", // stress-zoekgedrag (Wikipedia) — ⚡ direct
  "I-D1-002", // hitte — 🔆 snel  (deel van "weer"-cluster)
  "I-D1-003", // koude — 🔆 snel  (deel van "weer"-cluster)
  "I-D3-002", // energieprijs — 🔆 snel
  "I-D2-004", // brandstofprijs — 🐢 traag
  "I-D3-001", // inflatie — 🐢 traag
];
// Op codeniveau zijn dat 9; conceptueel 10 kern-indicatoren ("weer" = één).
// De twee secundaire kern-signalen uit v0.4 (I-D3-003S ontslag-radar en
// I-D5-006S sociaal sentiment) leven nog in `secondary_signals[]` tot de
// engine-herbouw in fase 2.

export const KERN_COUNT_CONCEPTUEEL = 10;

export function isKern(code: string): boolean {
  return KERN_INDICATOR_CODES.includes(code);
}

/**
 * Wetenschappelijke bronnen die de SBI als geheel onderbouwen
 * (uit het v0.4-document, los van de per-indicator-referenties).
 */
export const SBI_FOUNDATIONS: Array<{ label: string; url?: string }> = [
  {
    label:
      "McEwen, B. — Allostatic load: cumulatieve fysiologische last als stressmaat. Basis van de SBI.",
  },
  {
    label:
      "Marin et al. (2012), PLoS ONE — negatief nieuws verhoogt de fysiologische stressreactiviteit.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3468453/",
  },
  {
    label:
      "Mayo Clinic Press (2024) — herhaalde nieuws-blootstelling en cortisol.",
    url: "https://mcpress.mayoclinic.org/mental-health/how-the-news-rewires-your-brain/",
  },
  {
    label:
      "UEA / Understanding Society (2022) — energie- en brandstofarmoede tasten welzijn aan.",
    url: "https://www.understandingsociety.ac.uk/news/2022/02/04/high-fuel-prices-affect-mental-and-physical-health/",
  },
  {
    label:
      "Nature Energy (2023) — de energieprijscrisis en gevolgen voor huishoudens.",
    url: "https://www.nature.com/articles/s41560-023-01209-8",
  },
  {
    label:
      "BMC Public Health (2024) — subjectieve financiële onzekerheid als sterke stressdeterminant.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11668040/",
  },
  {
    label: "Marmot — sociale gezondheidsdeterminanten (basis indicator-selectie).",
  },
  {
    label: "Hobfoll — Conservation of Resources (basis voor reikwijdte-weging).",
  },
  {
    label:
      "Young, L. & Soroka, S. (2012), Political Communication — Lexicoder Sentiment Dictionary, methodologische basis voor nieuwstoon-meting.",
    url: "https://doi.org/10.1080/10584609.2012.671234",
  },
  {
    label:
      "De Smedt, T. & Daelemans, W. (2012), CLiPS — Pattern.nl: Nederlands sentiment-lexicon (3.000+ woorden, PDDL). Basis van de Laag-1-toonscoring uit v0.5 §9.3.",
    url: "https://github.com/clips/pattern/blob/master/pattern/text/nl/nl-sentiment.xml",
  },
  {
    label:
      "Soroka, Fournier & Nir (2019), PNAS — negativity bias in psychofysiologische reactie op nieuws.",
    url: "https://doi.org/10.1073/pnas.1908369116",
  },
  {
    label: "Leetaru, K. (2013) — GDELT Global Knowledge Graph (data-bron nieuwstoon).",
    url: "https://www.gdeltproject.org/",
  },
  {
    label:
      "Generous et al. (2014), PLoS Comp. Biol. — Wikipedia-pageviews als digital-epidemiologie-proxy.",
    url: "https://doi.org/10.1371/journal.pcbi.1003892",
  },
  {
    label:
      "Lazer et al. (2014), Science — parable of Google Flu (waarschuwing bij zoekdata).",
    url: "https://doi.org/10.1126/science.1248506",
  },
];
```

#### `app/web/src/types.ts`

```ts
// Mirror van engine output-typen (zie ../../engine/src/types.ts)

export type Tier = "green" | "amber" | "red";
export type BrandSafety = "normal" | "elevated" | "block";
export type DomainCode = "D1" | "D2" | "D3" | "D4" | "D5" | "D6";

export interface DomainContribution {
  domain: DomainCode;
  contribution: number;
}

export interface SecondarySignal {
  code: string;
  name: string;
  value: number;
  source: string;
  simulated: boolean;
  observation_date: string;
}

export type IndicatorState = "rustig" | "normaal" | "verhoogd" | "extreem" | "ontbreekt";

export interface IndicatorBreakdown {
  code: string;
  domain: DomainCode;
  plain_name: string;
  why: string;
  reads: string;
  unit: string;
  raw_value: number | null;
  z_short: number | null;
  contribution: number;
  state: IndicatorState;
  source: string;
  simulated: boolean;
  data_source: { name: string; url: string };
  references: Array<{ label: string; url: string }>;
  observation_date: string;
  demographic_reach: number;
  reach_rationale: string;
}

export type ConditionLevel = 1 | 2 | 3 | 4 | 5;

export interface DailyOutput {
  timestamp: string;
  week_iso: string;
  condition_level: {
    value: ConditionLevel;
    name: string;
    banner_active: boolean;
    copy_key: string;
  };
  composite: {
    equal: number;
    evidence_graded: number;
    demographic: number;
    weight_sensitivity: {
      correlation_inverse_vs_equal_12w: number;
      composite_range_with_dropouts: [number, number];
      bootstrap_95_ci_around_equal: [number, number];
    };
  };
  percentile: {
    short_24m: number;
    fixed_2010_2019: number;
  };
  tier: {
    current: Tier;
    days_in_tier: number;
    tier_history_30d: Tier[];
  };
  top_contributing_domains: DomainContribution[];
  indicator_breakdown: IndicatorBreakdown[];
  secondary_signals: SecondarySignal[];
  media_cluster_diagnostic: {
    d5_cross_correlation_7d: number;
    composite_without_d5: number;
    media_contribution_percentile_points: number;
  };
  brand_safety: {
    flag: BrandSafety;
    reason: string | null;
    expires_estimated: string | null;
  };
  data_quality: {
    indicators_with_imputed_data: string[];
    indicators_missing: string[];
    indicators_simulated: string[];
    pipeline_version: string;
    methodology_version: string;
    implementation_stage: string;
  };
}

export interface SparklinePoint {
  date: string;
  composite: number;
  percentile: number;
  tier: Tier;
}
```

#### `app/web/src/App.tsx`

```tsx
import { useEffect, useState } from "react";
import type { DailyOutput, SparklinePoint } from "./types";
import { Sparkline } from "./components/Sparkline";
import { CallToAction } from "./components/CallToAction";
import { BrandSafetyBanner } from "./components/BrandSafetyBanner";
import { ConditionLevelDisplay } from "./components/ConditionLevelDisplay";
import { PreviewPage } from "./components/PreviewPage";
import { PlainExplainer } from "./components/PlainExplainer";
import { TopInfluences } from "./components/TopInfluences";
import { HeroBanner } from "./components/HeroBanner";
import { LHALogo } from "./components/LHALogo";
import { ButtonPanels } from "./components/ButtonPanels";
import { FOOTER_NOTES } from "./copy";

export function App() {
  const [data, setData] = useState<DailyOutput | null>(null);
  const [sparkline, setSparkline] = useState<SparklinePoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isPreview = typeof window !== "undefined" && window.location.pathname.startsWith("/preview");

  useEffect(() => {
    if (isPreview) return;
    const load = async () => {
      try {
        const [latest, spark] = await Promise.all([
          fetch("/data/latest.json").then((r) => {
            if (!r.ok) throw new Error("latest.json niet gevonden");
            return r.json() as Promise<DailyOutput>;
          }),
          fetch("/data/sparkline-30d.json").then((r) => {
            if (!r.ok) throw new Error("sparkline-30d.json niet gevonden");
            return r.json() as Promise<SparklinePoint[]>;
          }),
        ]);
        setData(latest);
        setSparkline(spark);
      } catch (e) {
        setError(e instanceof Error ? e.message : "onbekende fout");
      }
    };
    void load();
  }, [isPreview]);

  if (isPreview) {
    return <PreviewPage />;
  }

  if (error) {
    return (
      <div className="error-state">
        <h1>Data niet beschikbaar</h1>
        <p>{error}</p>
        <p className="muted">
          Draai eerst <code>npm run generate-fixture</code> in <code>app/engine</code>.
        </p>
      </div>
    );
  }

  if (!data) {
    return <div className="loading">Barometer laadt…</div>;
  }

  const stamp = new Date(data.timestamp);
  const today = stamp.toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const lastRunTime = stamp.toLocaleTimeString("nl-BE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Brussels",
  });

  return (
    <div className={`app tier-${data.tier.current}`}>
      <HeroBanner weekIso={data.week_iso} today={today} lastRunTime={lastRunTime} />

      {data.brand_safety.flag !== "normal" && (
        <BrandSafetyBanner brandSafety={data.brand_safety} />
      )}

      <main>
        <ConditionLevelDisplay data={data} />

        <PlainExplainer data={data} />

        <CallToAction tier={data.tier.current} brandSafety={data.brand_safety.flag} />

        <TopInfluences breakdown={data.indicator_breakdown} />

        <section className="panel sparkline-panel">
          <h2>Hoe was het de laatste 60 dagen?</h2>
          <p className="panel-lead">
            Elke stip is één dag. Hoe hoger op de grafiek, hoe meer signalen tegelijk hoog staan.
            De gekleurde banden tonen de drempels: <strong>gemiddeld</strong>,
            <strong> hoger dan gewoonlijk</strong> (vanaf 70%),
            <strong> uitzonderlijk hoog</strong> (vanaf 90%).
          </p>
          <Sparkline points={sparkline} />
        </section>

        <ButtonPanels data={data} />
      </main>

      <footer className="footer">
        <div className="footer-inner footer-center">
          <div className="footer-mark">
            <LHALogo size={52} />
            <div className="footer-mark-text">{FOOTER_NOTES.tagline}</div>
          </div>
          <div className="footer-row muted small">{FOOTER_NOTES.ondersteunend}</div>
          <div className="footer-row muted small">
            Methodologie open. Code: open source. Pre-registratie via OSF.
          </div>
        </div>
      </footer>
    </div>
  );
}
```

#### `app/web/src/components/AllSources.tsx`

```tsx
import type { IndicatorBreakdown } from "../types";

/**
 * Centrale "Alle bronnen"-sectie.
 * Uniqueert databronnen en wetenschappelijke referenties uit de breakdown.
 */
export function AllSources({ breakdown }: { breakdown: IndicatorBreakdown[] }) {
  const dataSources = new Map<string, string>();
  const references = new Map<string, string>();

  for (const ind of breakdown) {
    if (ind.data_source?.url) {
      dataSources.set(ind.data_source.name, ind.data_source.url);
    }
    for (const ref of ind.references ?? []) {
      references.set(ref.label, ref.url);
    }
  }

  return (
    <section className="panel all-sources">
      <h2>Alle bronnen</h2>
      <p className="panel-lead">
        Wie de cijfers wil natrekken, vindt hier alle data-leveranciers en
        wetenschappelijke artikels die meegewogen hebben.
      </p>

      <div className="sources-grid">
        <div className="sources-column">
          <h3>Databronnen</h3>
          <ul className="sources-list">
            {[...dataSources.entries()].map(([name, url]) => (
              <li key={name}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {name} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="sources-column">
          <h3>Wetenschappelijke artikels</h3>
          <ul className="sources-list">
            {[...references.entries()].map(([label, url]) => (
              <li key={label}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="muted small all-sources-note">
        De volledige methodologie (lagen 1 tot 8) is open en publiek beschikbaar.
        Alle keuzes, drempels, gewichten en formules staan vooraf vast en kunnen
        niet achteraf bijgestuurd worden.
      </p>
    </section>
  );
}
```

#### `app/web/src/components/BrandSafetyBanner.tsx`

```tsx
import type { DailyOutput } from "../types";
import { BRAND_SAFETY_OVERRIDE } from "../copy";

export function BrandSafetyBanner({ brandSafety }: { brandSafety: DailyOutput["brand_safety"] }) {
  if (brandSafety.flag === "normal") return null;
  const msg =
    brandSafety.flag === "elevated"
      ? BRAND_SAFETY_OVERRIDE.elevated
      : BRAND_SAFETY_OVERRIDE.block;

  return (
    <div className={`brand-safety brand-safety-${brandSafety.flag}`} role="status">
      <div className="bs-label">BRAND-SAFETY-VLAG · {brandSafety.flag.toUpperCase()}</div>
      <p className="bs-message">{msg}</p>
      {brandSafety.reason && <p className="bs-reason">Reden: {brandSafety.reason}</p>}
    </div>
  );
}
```

#### `app/web/src/components/ButtonPanels.tsx`

```tsx
import { useState } from "react";
import type { DailyOutput } from "../types";
import { IndicatorList } from "./IndicatorList";
import { IndicatorZView } from "./IndicatorZView";
import { SecondarySignals } from "./SecondarySignals";
import { Methodology } from "./Methodology";
import { AllSources } from "./AllSources";
import { ScienceReferences } from "./ScienceReferences";
import { TierIndicator } from "./TierIndicator";
import { PercentileDisplay } from "./PercentileDisplay";
import { DomainContributions } from "./DomainContributions";
import { MEDIA_DIAGNOSTIC } from "./Sections";

/**
 * De vijf in-page klap-knoppen onderaan de barometer.
 * Elk paneel klapt onafhankelijk open onder zijn knop.
 */
export function ButtonPanels({ data }: { data: DailyOutput }) {
  const [open, setOpen] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const panels: Array<{
    key: string;
    label: string;
    sub: string;
    render: () => React.ReactNode;
  }> = [
    {
      key: "expert",
      label: "Expert view",
      sub: "Alle indicatoren, hun Z-thermometer en het secundaire signalencircuit",
      render: () => (
        <>
          <IndicatorList breakdown={data.indicator_breakdown} />
          <IndicatorZView breakdown={data.indicator_breakdown} />
          <SecondarySignals signals={data.secondary_signals} />
        </>
      ),
    },
    {
      key: "wat",
      label: "Wat dit is, en wat dit niet is",
      sub: "De grenzen van de meting, in heldere taal",
      render: () => <Methodology />,
    },
    {
      key: "bronnen",
      label: "De databronnen die we gebruiken",
      sub: "Alle externe bronnen waar de cijfers vandaan komen, aanklikbaar",
      render: () => <AllSources breakdown={data.indicator_breakdown} />,
    },
    {
      key: "wetenschap",
      label: "Wetenschappelijke bronnen",
      sub: "De peer-reviewed onderbouwing waarop de SBI gebouwd is",
      render: () => <ScienceReferences breakdown={data.indicator_breakdown} />,
    },
    {
      key: "technisch",
      label: "Technische details",
      sub: "Voor wetenschappers, journalisten en de adversariële reviewer",
      render: () => (
        <div className="technical-stack">
          <TierIndicator tier={data.tier.current} daysInTier={data.tier.days_in_tier} />
          <PercentileDisplay
            shortP={data.percentile.short_24m}
            fixedP={data.percentile.fixed_2010_2019}
            composite={data.composite.equal}
            evidenceComposite={data.composite.evidence_graded}
            demographicComposite={data.composite.demographic}
          />
          <DomainContributions contributions={data.top_contributing_domains} />
          <MEDIA_DIAGNOSTIC diagnostic={data.media_cluster_diagnostic} />
        </div>
      ),
    },
  ];

  return (
    <section className="bp-section" aria-label="Verdieping en verantwoording">
      {panels.map((p) => {
        const isOpen = open.has(p.key);
        return (
          <div key={p.key} className={`bp-row ${isOpen ? "open" : ""}`}>
            <button
              className="bp-button"
              onClick={() => toggle(p.key)}
              aria-expanded={isOpen}
            >
              <span className="bp-text">
                <span className="bp-label">{p.label}</span>
                <span className="bp-sub">{p.sub}</span>
              </span>
              <span className="bp-icon" aria-hidden="true">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && <div className="bp-panel">{p.render()}</div>}
          </div>
        );
      })}
    </section>
  );
}
```

#### `app/web/src/components/CallToAction.tsx`

```tsx
import type { Tier, BrandSafety } from "../types";
import { LES_HAUTES_ALPES_CTA } from "../copy";
import { LHALogo } from "./LHALogo";

interface Props {
  tier: Tier;
  brandSafety: BrandSafety;
}

/**
 * Les Hautes Alpes call-to-action.
 * Verschijnt alleen wanneer tier ≥ amber EN brand_safety = normal.
 * Copy strict per doc 09 §5 (geen klinische taal, geen individuele attributie).
 */
export function CallToAction({ tier, brandSafety }: Props) {
  if (brandSafety !== "normal") return null;
  if (tier === "green") return null;
  const cta = LES_HAUTES_ALPES_CTA[tier];
  if (!cta) return null;

  return (
    <section className="cta">
      <div className="cta-inner">
        <div className="cta-mark">
          <span className="lha-mark-mini" style={{ color: "#0a3d6b" }}>
            <LHALogo size={28} />
          </span>
          <span>LES HAUTES ALPES · Natuurlijk in het hart van de Alpen</span>
        </div>
        <h2 className="cta-headline">{cta.headline}</h2>
        <p className="cta-body">{cta.body}</p>
        <a className="cta-action" href="https://www.hautes-alpes.net" target="_blank" rel="noopener noreferrer">
          {cta.action} →
        </a>
      </div>
    </section>
  );
}
```

#### `app/web/src/components/ConditionLevelDisplay.tsx`

```tsx
import type { ConditionLevel, DailyOutput } from "../types";
import { buildContext, buildCnDescription, buildPercentileLine } from "../lib/explainer";

const LEVEL_KICKER: Record<ConditionLevel, string> = {
  1: "LAAG",
  2: "GEMIDDELD",
  3: "VEEL TEGELIJK",
  4: "UITZONDERLIJK HOOG",
  5: "EVEN OP PAUZE",
};

export function ConditionLevelDisplay({
  data,
}: {
  data: DailyOutput;
}) {
  const cn = data.condition_level.value;
  const ctx = buildContext(data);
  const cnDescription = buildCnDescription(ctx);
  const percentileLine = buildPercentileLine(ctx);

  return (
    <section className={`cn-display cn-level-${cn}`}>
      <div className="cn-label">STRESS-CIJFER VAN VANDAAG</div>
      <div className="cn-main">
        <div className="cn-number" aria-label={`niveau ${cn} van 5`}>
          {cn}
        </div>
        <div className="cn-scale">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`cn-dot cn-dot-pos-${n} ${n <= cn ? "active" : ""} ${n === cn ? "current" : ""}`}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="cn-side">
          <div className="cn-kicker">{LEVEL_KICKER[cn]}</div>
          {cn >= 3 && cn <= 4 && (
            <div className="cn-meta">Dag {data.tier.days_in_tier} op rij</div>
          )}
        </div>
      </div>
      <p className="cn-description">{cnDescription}</p>
      <div className="cn-secondary">
        <span>{percentileLine}</span>
      </div>
    </section>
  );
}
```

#### `app/web/src/components/DataQuality.tsx`

```tsx
import type { DailyOutput } from "../types";

export function DataQuality({
  dataQuality,
  total,
}: {
  dataQuality: DailyOutput["data_quality"];
  total: number;
}) {
  const hasSimulated = dataQuality.indicators_simulated.length > 0;
  const hasMissing = dataQuality.indicators_missing.length > 0;

  return (
    <section className="panel data-quality">
      <h2>Welke metingen zijn echt en welke nog niet</h2>

      <p className="panel-lead">
        We zijn eerlijk over wat al echt-tijd is, en wat nog op test-data draait.
      </p>

      <div className="dq-grid">
        <div className={`dq-row ${hasSimulated ? "warn" : "ok"}`}>
          <span className="dq-label">Nog op test-data</span>
          <span className="dq-value">{dataQuality.indicators_simulated.length} van {total}</span>
          {hasSimulated && (
            <details className="dq-detail">
              <summary>Welke?</summary>
              <code>{dataQuality.indicators_simulated.join(", ")}</code>
            </details>
          )}
        </div>

        <div className="dq-row ok">
          <span className="dq-label">Echt-tijd live</span>
          <span className="dq-value">{total - dataQuality.indicators_simulated.length} van {total}</span>
        </div>

        <div className={`dq-row ${hasMissing ? "warn" : "ok"}`}>
          <span className="dq-label">Ontbrekend</span>
          <span className="dq-value">{dataQuality.indicators_missing.length}</span>
        </div>

        <div className="dq-row ok">
          <span className="dq-label">Versie van de meting</span>
          <span className="dq-value">v{dataQuality.methodology_version}</span>
        </div>
      </div>

      {hasSimulated && (
        <p className="dq-disclaimer">
          Tijdens deze test-fase gebruiken we voor sommige indicatoren nog gesimuleerde data,
          omdat de echte bronnen nog moeten worden aangesloten. Het cijfer van vandaag is dus
          niet bedoeld als 100% accurate stand van het land. We verbeteren dit stap voor stap.
        </p>
      )}
    </section>
  );
}
```

#### `app/web/src/components/DomainContributions.tsx`

```tsx
import type { DomainContribution } from "../types";
import { DOMAIN_LABELS } from "../copy";

export function DomainContributions({ contributions }: { contributions: DomainContribution[] }) {
  const maxAbs = Math.max(...contributions.map((c) => Math.abs(c.contribution)), 0.01);

  return (
    <div className="domain-contributions">
      {contributions.map((c, idx) => {
        const widthPct = (Math.abs(c.contribution) / maxAbs) * 100;
        const positive = c.contribution >= 0;
        return (
          <div className="domain-row" key={c.domain}>
            <div className="domain-rank">{idx + 1}</div>
            <div className="domain-info">
              <div className="domain-code">{c.domain}</div>
              <div className="domain-name">{DOMAIN_LABELS[c.domain]}</div>
            </div>
            <div className="domain-bar-wrap">
              <div
                className={`domain-bar ${positive ? "positive" : "negative"}`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <div className="domain-value">
              {positive ? "+" : ""}
              {c.contribution.toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

#### `app/web/src/components/HeroBanner.tsx`

```tsx
import { LHALogo } from "./LHALogo";

interface Props {
  weekIso: string;
  today: string;
  lastRunTime: string; // bv. "14:00"
}

/**
 * Site-header: een licht geblurde alpenfoto over de volle breedte, met het
 * Hautes-Alpes-logo groot en gecentreerd bovenaan, een dunne scheidingslijn
 * eronder (zoals op plus.hautes-alpes.net), en daaronder het titelblok.
 *
 * v0.4: spreekt expliciet over 10 kern-indicatoren en uurlijkse bijstelling.
 */
export function HeroBanner({ weekIso, today, lastRunTime }: Props) {
  return (
    <header className="site-header">
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-tint" aria-hidden="true" />
      <a
        className="site-back"
        href="https://plus.hautes-alpes.net/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Naar hautes-alpes.net ↗
      </a>
      <div className="hero-top">
        <a
          className="site-logo"
          href="https://plus.hautes-alpes.net/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Hautes-Alpes"
        >
          <LHALogo size={104} />
        </a>
      </div>
      <div className="hero-rule" aria-hidden="true" />
      <div className="hero-content">
        <div className="intro-eyebrow">Stressor-Blootstellings-Index</div>
        <h1 className="intro-title">Hoe staat het er vandaag voor?</h1>
        <p className="intro-lead">
          Een uurlijkse meting van 10 kern-indicatoren die op de hele bevolking
          inwerken. Niet voor jou persoonlijk. Voor het hele land.
        </p>
        <div className="intro-meta">
          Barometer · {weekIso} · {today}
        </div>
        <div className="intro-note">
          De Stressindex wordt elk uur gecontroleerd en bijgestuurd · laatst om {lastRunTime}
        </div>
      </div>
    </header>
  );
}
```

#### `app/web/src/components/IndicatorList.tsx`

```tsx
import { useState } from "react";
import type { IndicatorBreakdown, DomainCode } from "../types";
import { DOMAIN_LABELS } from "../copy";
import { stateColor, stateLabel, stateIcon } from "./indicator-utils";
import { formatObservationDate, observationGranularity } from "../lib/format-date";

const DOMAIN_SUBTITLES: Record<DomainCode, string> = {
  D1: "Hoe de buitenwereld vandaag aanvoelt",
  D2: "Hoe makkelijk of zwaar verplaatsen vandaag is",
  D3: "De druk van geld en prijzen op het gezin",
  D4: "Wat werk en gezin van ons vragen deze week",
  D5: "Wat er in het nieuws en in het land gebeurt",
  D6: "Waar we in de week en het jaar zitten",
};

function IndicatorRow({ ind }: { ind: IndicatorBreakdown }) {
  const [open, setOpen] = useState(false);
  const color = stateColor(ind.state);
  return (
    <div className={`ind-row ind-state-${ind.state}`}>
      <button
        className="ind-row-summary"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="ind-icon" style={{ color }} aria-hidden="true">
          {stateIcon(ind.state)}
        </span>
        <span className="ind-name">{ind.plain_name}</span>
        <span className="ind-state" style={{ color }}>{stateLabel(ind.state)}</span>
        <span className="ind-toggle">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="ind-detail">
          <p className="ind-why">{ind.why}</p>

          <div className="ind-meta-grid">
            <div className="ind-meta-cell">
              <div className="ind-meta-label">Wat we uitlezen</div>
              <div className="ind-meta-value">{ind.reads}</div>
            </div>
            {ind.raw_value !== null && (
              <div className="ind-meta-cell">
                <div className="ind-meta-label">Gemeten waarde</div>
                <div className="ind-meta-value">
                  <strong>{formatValue(ind.raw_value, ind.unit)}</strong> {ind.unit}
                </div>
              </div>
            )}
            <div className="ind-meta-cell">
              <div className="ind-meta-label">
                {observationGranularity(ind.observation_date) === "maand"
                  ? "Maandcijfer van"
                  : "Cijfer van"}
              </div>
              <div className="ind-meta-value">
                {formatObservationDate(ind.observation_date)}
              </div>
            </div>
            <div className="ind-meta-cell">
              <div className="ind-meta-label">Raakt naar schatting</div>
              <div className="ind-meta-value">
                <strong>{Math.round(ind.demographic_reach * 100)}%</strong> van de bevolking
              </div>
            </div>
          </div>

          <p className="ind-reach-rationale">{ind.reach_rationale}</p>

          <div className="ind-sources">
            <div className="ind-source-block">
              <div className="ind-source-label">Databron</div>
              <a className="ind-source-link" href={ind.data_source.url} target="_blank" rel="noopener noreferrer">
                {ind.data_source.name} ↗
              </a>
              {ind.simulated && <span className="ind-mock-tag">demo-data</span>}
            </div>

            {ind.references.length > 0 && (
              <div className="ind-source-block">
                <div className="ind-source-label">Wetenschappelijke onderbouwing</div>
                <ul className="ind-refs">
                  {ind.references.map((ref, i) => (
                    <li key={i}>
                      <a href={ref.url} target="_blank" rel="noopener noreferrer">
                        {ref.label} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatValue(v: number, unit: string): string {
  if (unit.includes("%") || unit.includes("€/liter")) return v.toFixed(2);
  if (Math.abs(v) >= 1000) return v.toFixed(0);
  if (Math.abs(v) >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

export function IndicatorList({ breakdown }: { breakdown: IndicatorBreakdown[] }) {
  const byDomain = (["D1", "D2", "D3", "D4", "D5", "D6"] as DomainCode[]).map((d) => ({
    domain: d,
    indicators: breakdown.filter((b) => b.domain === d),
  }));

  return (
    <section className="indicator-list">
      <header className="indicator-list-header">
        <h2>Wat we allemaal bekijken</h2>
        <p className="panel-lead">
          De index draait op 10 kern-indicatoren; daarnaast lopen 14 secundaire/diagnostische signalen mee. Klik er één open om te zien wat we precies meten,
          waar de data vandaan komt en welke wetenschappelijke onderbouwing erachter zit.
        </p>
      </header>

      {byDomain.map(({ domain, indicators }) => (
        <div key={domain} className="domain-group">
          <div className={`domain-group-header dh-${domain}`}>
            <div className="domain-group-code">{domain}</div>
            <div className="domain-group-name">{DOMAIN_LABELS[domain]}</div>
            <div className="domain-group-sub">{DOMAIN_SUBTITLES[domain]}</div>
          </div>
          <div className="ind-rows">
            {indicators.map((ind) => (
              <IndicatorRow key={ind.code} ind={ind} />
            ))}
          </div>
        </div>
      ))}

      <footer className="indicator-list-footer">
        <p>
          <strong>Hoe lees je dit?</strong>{" "}
          <span style={{ color: "var(--c-green)" }}>○ lager dan gewoonlijk</span>
          {" · "}
          <span style={{ color: "var(--c-ink-mute)" }}>● gemiddeld</span>
          {" · "}
          <span style={{ color: "var(--c-amber)" }}>▲ hoger dan gewoonlijk</span>
          {" · "}
          <span style={{ color: "var(--c-red)" }}>▲▲ uitzonderlijk hoog</span>
        </p>
        <p className="muted small">
          Met "gemiddeld" bedoelen we: vergeleken met dezelfde periode in de afgelopen twee jaar.
          Een aantal metingen draait nog op test-data, die zijn gemarkeerd met <em>demo-data</em>.
          Echte data komt er stap voor stap bij.
        </p>
      </footer>
    </section>
  );
}
```

#### `app/web/src/components/IndicatorZView.tsx`

```tsx
import { useState } from "react";
import type { IndicatorBreakdown } from "../types";
import { DOMAIN_LABELS } from "../copy";

/**
 * Z-thermometer per indicator.
 * Toont voor elke indicator real-time hoe ver hij staat van Z = +1
 * (de drempel waarboven hij actief bijdraagt aan banner-activatie).
 *
 * Bar-schaal: -3 tot +3.
 * Zones: groen (Z < -1), grijs (-1 ≤ Z < 1), oranje (1 ≤ Z < 2), rood (Z ≥ 2).
 * Drempel-markers op Z = +1 (banner-bijdrage) en Z = +2 (zware bijdrage).
 */

const Z_MIN = -3;
const Z_MAX = 3;

function zToPercent(z: number): number {
  // Clamp en map naar 0-100% van bar-breedte
  const clamped = Math.max(Z_MIN, Math.min(Z_MAX, z));
  return ((clamped - Z_MIN) / (Z_MAX - Z_MIN)) * 100;
}

function zoneColor(z: number): string {
  if (z >= 2) return "var(--st-alert)";
  if (z >= 1) return "var(--lha-sun)";
  if (z >= -1) return "var(--lha-mist)";
  return "var(--st-rust)";
}

function distanceLabel(z: number | null): string {
  if (z === null) return "geen data";
  if (z >= 2) return "in extreem-zone";
  if (z >= 1) return "draagt actief bij";
  if (z >= 0) {
    const d = 1 - z;
    return `${d.toFixed(1)} Z onder drempel`;
  }
  const d = 1 - z;
  return `${d.toFixed(1)} Z onder drempel`;
}

function ZThermometer({ ind }: { ind: IndicatorBreakdown }) {
  if (ind.z_short === null) {
    return (
      <div className="zth zth-missing">
        <div className="zth-header">
          <span className="zth-code">{ind.code}</span>
          <span className="zth-name">{ind.plain_name}</span>
          <span className="zth-z-missing">geen data</span>
        </div>
      </div>
    );
  }

  const pct = zToPercent(ind.z_short);
  const color = zoneColor(ind.z_short);
  const dist = distanceLabel(ind.z_short);

  return (
    <div className="zth">
      <div className="zth-header">
        <span className="zth-code">{ind.code}</span>
        <span className="zth-name">{ind.plain_name}</span>
        <span className="zth-value">
          {ind.raw_value !== null ? `${ind.raw_value}` : ""}{" "}
          <span className="zth-unit">{ind.unit}</span>
        </span>
      </div>
      <div className="zth-bar-wrap">
        {/* Zones achtergrond */}
        <div className="zth-zone zth-zone-cold" style={{ left: 0, width: `${zToPercent(-1)}%` }} />
        <div className="zth-zone zth-zone-normal" style={{ left: `${zToPercent(-1)}%`, width: `${zToPercent(1) - zToPercent(-1)}%` }} />
        <div className="zth-zone zth-zone-warn" style={{ left: `${zToPercent(1)}%`, width: `${zToPercent(2) - zToPercent(1)}%` }} />
        <div className="zth-zone zth-zone-alert" style={{ left: `${zToPercent(2)}%`, width: `${100 - zToPercent(2)}%` }} />

        {/* Drempel-markers */}
        <div className="zth-marker zth-marker-threshold" style={{ left: `${zToPercent(1)}%` }} title="Z = +1: banner-bijdrage" />
        <div className="zth-marker zth-marker-extreme" style={{ left: `${zToPercent(2)}%` }} title="Z = +2: zware bijdrage" />

        {/* Huidige positie */}
        <div className="zth-dot" style={{ left: `${pct}%`, background: color }} />

        {/* As-labels */}
        <div className="zth-axis">
          <span style={{ left: `${zToPercent(-2)}%` }}>−2</span>
          <span style={{ left: `${zToPercent(-1)}%` }}>−1</span>
          <span style={{ left: "50%" }}>0</span>
          <span style={{ left: `${zToPercent(1)}%` }}>+1</span>
          <span style={{ left: `${zToPercent(2)}%` }}>+2</span>
        </div>
      </div>
      <div className="zth-footer">
        <span className="zth-z" style={{ color }}>Z = {ind.z_short >= 0 ? "+" : ""}{ind.z_short.toFixed(2)}</span>
        <span className="zth-dist">{dist}</span>
      </div>
    </div>
  );
}

export function IndicatorZView({ breakdown }: { breakdown: IndicatorBreakdown[] }) {
  const [open, setOpen] = useState(false);
  const [sortMode, setSortMode] = useState<"contribution" | "domain">("contribution");

  // Sort indicators
  const sorted = [...breakdown];
  if (sortMode === "contribution") {
    sorted.sort((a, b) => {
      const za = a.z_short ?? -99;
      const zb = b.z_short ?? -99;
      return zb - za; // hoogste Z eerst (sterkste bijdrage)
    });
  } else {
    sorted.sort((a, b) => a.code.localeCompare(b.code));
  }

  // Count contributors
  const activeContributors = breakdown.filter((b) => (b.z_short ?? 0) >= 1).length;
  const heavyContributors = breakdown.filter((b) => (b.z_short ?? 0) >= 2).length;

  return (
    <section className="panel zview-panel">
      <button
        className="zview-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="zview-toggle-icon">{open ? "−" : "+"}</span>
        <span className="zview-toggle-text">
          <strong>Expert-view: bijdrage per indicator</strong>
        </span>
        <span className="zview-toggle-icon zview-toggle-icon-right" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="zview-body">
          <p className="zview-lead">
            Hoe ver staat elk onderdeel van de drempel waarboven het meedraagt aan
            banner-activatie? Z = 0 is "gemiddeld voor dit seizoen", Z ≥ +1 is "hoger
            dan gewoonlijk en draagt bij", Z ≥ +2 is "uitzonderlijk hoog".
          </p>

          <div className="zview-sort">
            <span>Sortering:</span>
            <button
              className={sortMode === "contribution" ? "active" : ""}
              onClick={() => setSortMode("contribution")}
            >
              naar grootste bijdrage
            </button>
            <button
              className={sortMode === "domain" ? "active" : ""}
              onClick={() => setSortMode("domain")}
            >
              naar categorie
            </button>
          </div>

          <div className="zview-legend">
            <span><i className="lg-cold" /> lager dan gewoonlijk (Z &lt; −1)</span>
            <span><i className="lg-normal" /> gemiddeld (−1 tot +1)</span>
            <span><i className="lg-warn" /> hoger dan gewoonlijk (Z ≥ +1)</span>
            <span><i className="lg-alert" /> uitzonderlijk hoog (Z ≥ +2)</span>
          </div>

          <div className="zview-list">
            {sorted.map((ind) => (
              <ZThermometer key={ind.code} ind={ind} />
            ))}
          </div>

          <p className="zview-footer-note">
            Banner-activatie vereist dat het <strong>gewogen composiet</strong> 3 dagen
            op rij in de top-30% (P ≥ 70) van de laatste 24 maanden zit, plus brand-safety
            normaal. Geen enkele indicator triggert op zichzelf, maar elke balk hierboven
            laat zien welke vandaag bijdragen.
          </p>
        </div>
      )}
    </section>
  );
}
```

#### `app/web/src/components/LHALogo.tsx`

```tsx
/**
 * Officieel Hautes-Alpes logo — witte wordmark, bedoeld voor een
 * donkere achtergrond (groene header / footer).
 * Bestand: app/web/public/hautes-alpes-logo.png
 */
export function LHALogo({ size = 48 }: { size?: number }) {
  return (
    <img
      src="/hautes-alpes-logo.png"
      alt="Hautes-Alpes"
      width={size}
      height={size}
      style={{ display: "block", width: size, height: "auto" }}
    />
  );
}
```

#### `app/web/src/components/Methodology.tsx`

```tsx
import { METHODOLOGY_DISCLAIMER } from "../copy";

export function Methodology() {
  return (
    <section className="panel methodology">
      <h2>Wat dit is, en wat dit niet is</h2>
      {METHODOLOGY_DISCLAIMER.map((p, i) => (
        <p key={i}>{p}</p>
      ))}

      <ul className="methodology-do-dont">
        <li><strong>Wat we doen:</strong> we kijken naar 24 dingen die met stress te maken hebben, en tellen hoe ongewoon ze vandaag zijn, over heel België.</li>
        <li><strong>Wat we NIET doen:</strong> we kijken niet of jij persoonlijk stress hebt. We zijn geen dokter. We voorspellen niets.</li>
        <li><strong>Hoe vergelijken we?</strong> Met de afgelopen 24 maanden voor dezelfde tijd van het jaar. Een zomerdag wordt vergeleken met zomerdagen, geen winterdagen.</li>
      </ul>

      <details>
        <summary>Voor wie wil weten hoe het cijfer tot stand komt</summary>
        <ol className="methodology-steps">
          <li>We tellen 24 indicatoren, verdeeld over 6 categorieën (weer, verkeer, economie, werk/gezin, nieuws, kalender).</li>
          <li>Voor elke indicator vergelijken we de waarde van vandaag met wat normaal is voor dit moment in het jaar.</li>
          <li>We corrigeren voor seizoens-effecten waar dat zinvol is (bv. files in juli zijn anders dan files in november).</li>
          <li>We tellen alles op, met gewichten die rekening houden met hoeveel wetenschappelijk onderzoek de link met stress ondersteunt.</li>
          <li>Pas als het cijfer minstens drie dagen op rij boven een drempel zit, gaat het "venster" open. Eén slechte dag verandert het cijfer niet meteen.</li>
          <li>Alle keuzes (drempels, gewichten, formules) staan vooraf vast en zijn publiek, niemand kan ze achteraf bijsturen om een gewenste uitkomst te maken.</li>
        </ol>
      </details>
    </section>
  );
}
```

#### `app/web/src/components/MountainDivider.tsx`

```tsx
/**
 * Berg-silhouet divider — gebruikt als visuele scheiding tussen secties.
 * Lichte en donkere variant.
 */

export function MountainDivider({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className={`mountain-divider ${inverted ? "inverted" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none">
        <path
          d="M0,80 L0,55 L120,30 L200,50 L300,15 L380,35 L460,20 L540,40 L640,8 L740,32 L820,18 L920,45 L1020,25 L1100,42 L1200,30 L1200,80 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

/** Kleine berg-icoon voor inline gebruik. */
export function MountainIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 21 L9 10 L13 16 L16 12 L21 21 Z" />
      <circle cx="17" cy="6" r="2.5" />
    </svg>
  );
}
```

#### `app/web/src/components/PercentileDisplay.tsx`

```tsx
interface Props {
  shortP: number;
  fixedP: number;
  composite: number;
  evidenceComposite: number;
  demographicComposite?: number;
}

export function PercentileDisplay({ shortP, fixedP, composite, evidenceComposite, demographicComposite }: Props) {
  return (
    <div className="percentile-display">
      <div className="percentile-main">
        <div className="percentile-label">PERCENTIEL · 24m</div>
        <div className="percentile-value">P {shortP}</div>
        <div className="percentile-context">
          Positie binnen de verdeling van de laatste 24 maanden.
        </div>
      </div>

      <div className="percentile-meta">
        <div className="meta-row">
          <span className="meta-key">Composiet (equal weights)</span>
          <span className="meta-value">{composite.toFixed(2)}</span>
        </div>
        <div className="meta-row">
          <span className="meta-key">Composiet (evidence-graded)</span>
          <span className="meta-value">{evidenceComposite.toFixed(2)}</span>
        </div>
        {demographicComposite !== undefined && (
          <div className="meta-row">
            <span className="meta-key">Composiet (demografische weging)</span>
            <span className="meta-value">{demographicComposite.toFixed(2)}</span>
          </div>
        )}
        <div className="meta-row">
          <span className="meta-key">Percentiel · 2010–2019 baseline</span>
          <span className="meta-value">P {fixedP}</span>
        </div>
      </div>

      <div className="percentile-disclaimer">
        Geen klassieke σ-Z. MAD-gebaseerd. Doc 04 §2.5.
      </div>
    </div>
  );
}
```

#### `app/web/src/components/PlainExplainer.tsx`

```tsx
import type { DailyOutput } from "../types";
import { buildContext, buildHeadline, buildBody } from "../lib/explainer";

/**
 * Context-bewust uitleg-blok.
 * Headline + body worden dynamisch gebouwd uit:
 *  - condition_level (1-5)
 *  - percentile (24m baseline)
 *  - aantal indicatoren in elke zone (lager/gemiddeld/hoger/extreem)
 *  - top-bijdragende indicatoren
 *  - brand-safety-vlag
 *
 * Taalregister: neutraal informerend, 15-jarig niveau.
 */
export function PlainExplainer({ data }: { data: DailyOutput }) {
  const ctx = buildContext(data);
  const headline = buildHeadline(ctx);
  const body = buildBody(ctx);

  return (
    <section className="plain-explainer">
      <h2>{headline}</h2>
      <p dangerouslySetInnerHTML={{ __html: formatMarkdownBold(body) }} />
    </section>
  );
}

/** Simpele **bold** rendering — buildBody returns markdown-light met **name**. */
function formatMarkdownBold(text: string): string {
  // Escape HTML eerst
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
```

#### `app/web/src/components/PreviewPage.tsx`

```tsx
import type { ConditionLevel } from "../types";

/**
 * /preview — toont alle 5 CN-banners naast elkaar.
 * Gebruik door klanten / abonnees om hun banner-integratie te valideren.
 */

interface BannerSpec {
  level: ConditionLevel;
  name: string;
  bannerActive: boolean;
  headline: string;
  body: string;
  action: string | null;
  notes: string;
}

const BANNERS: BannerSpec[] = [
  {
    level: 1,
    name: "Rust",
    bannerActive: false,
    headline: "",
    body: "Geen banner-activatie. Omstandigheden binnen rustband.",
    action: null,
    notes: "Banner-script rendert niets. Geen kosten, geen visuele ruis.",
  },
  {
    level: 2,
    name: "Normaal",
    bannerActive: false,
    headline: "",
    body: "Geen banner-activatie. Omstandigheden binnen normale band.",
    action: null,
    notes: "Banner-script rendert niets.",
  },
  {
    level: 3,
    name: "Venster opent",
    bannerActive: true,
    headline: "Verhoogd-blootstellings-venster open.",
    body: "Wanneer de condities verhoogd zijn, weegt rust extra zwaar.",
    action: "Tijd voor rust →",
    notes: "Standaard banner-set. Geactiveerd na 3 dagen P 70-89.",
  },
  {
    level: 4,
    name: "Conditie-piek",
    bannerActive: true,
    headline: "Blootstellings-conditie op piekniveau.",
    body: "Statistisch gezien is dit een goed moment voor herstel, preventief, terwijl het kan.",
    action: "Bekijk de bestemmingen →",
    notes: "Verhoogde banner-set. Geactiveerd na 3 dagen P≥90.",
  },
  {
    level: 5,
    name: "Brand-safety actief",
    bannerActive: false,
    headline: "",
    body: "De SBI registreert de impact van de actuele gebeurtenis op blootstellings-condities. Commerciële communicatie is opgeschort.",
    action: null,
    notes: "Override-modus. Geen commerciële banner. Wel kan de meting publiek getoond worden.",
  },
];

function BannerPreview({ spec }: { spec: BannerSpec }) {
  return (
    <div className={`preview-card cn-level-${spec.level}`}>
      <div className="preview-card-header">
        <div className="preview-cn">
          CN {spec.level}
          <span className="preview-cn-name">{spec.name}</span>
        </div>
        <div className={`preview-status ${spec.bannerActive ? "on" : "off"}`}>
          banner: {spec.bannerActive ? "aan" : "uit"}
        </div>
      </div>

      <div className="preview-banner-wrap">
        {spec.bannerActive ? (
          <div className={`banner-render banner-render-${spec.level}`}>
            <div className="banner-render-mark">LES HAUTES ALPES</div>
            <div className="banner-render-headline">{spec.headline}</div>
            <div className="banner-render-body">{spec.body}</div>
            {spec.action && <div className="banner-render-action">{spec.action}</div>}
          </div>
        ) : (
          <div className="banner-render banner-render-off">
            <div className="banner-render-body">{spec.body}</div>
          </div>
        )}
      </div>

      <div className="preview-notes">{spec.notes}</div>
    </div>
  );
}

export function PreviewPage() {
  return (
    <div className="preview-page">
      <header className="preview-header">
        <div className="brand-name">SBI · BAROMETER</div>
        <h1>Banner-preview, alle 5 conditie-niveaus</h1>
        <p className="muted">
          Voor abonnees: zo ziet de banner eruit op elk van de 5 conditie-niveaus.
          De banner-snippet wisselt automatisch tussen deze states op basis van de
          live SBI-meting. Copy is bevroren volgens doc 09.
        </p>
      </header>

      <div className="preview-grid">
        {BANNERS.map((spec) => (
          <BannerPreview key={spec.level} spec={spec} />
        ))}
      </div>

      <section className="panel">
        <h2>Embedden op uw site</h2>
        <p className="panel-lead">Plak dit ergens binnen je &lt;body&gt; tag:</p>
        <pre className="code-block">{`<div id="sbi-banner"></div>
<script src="https://barometer.sbi/embed/banner.js" defer></script>
<script>
  window.addEventListener('load', () => SBI.mount({
    target: '#sbi-banner',
    apiUrl: '/data/latest.json',   // production: https://barometer.sbi/api/v1/signal
    brand: 'Les Hautes Alpes',
    ctaUrl: 'https://www.hautes-alpes.net'
  }));
</script>`}</pre>
        <p className="muted small">
          De banner werkt voor alle 5 niveaus. Bij CN 1, 2 en 5 toont hij niets, dat is
          gewenst gedrag. Brand-safety-override is automatisch.
        </p>
      </section>

      <p className="preview-back">
        <a href="/">← terug naar live barometer</a>
      </p>
    </div>
  );
}
```

#### `app/web/src/components/ScienceReferences.tsx`

```tsx
import type { IndicatorBreakdown } from "../types";
import { SBI_FOUNDATIONS } from "../lib/kern";

/**
 * Aggregaat van alle wetenschappelijke bronnen waarop de SBI is gebouwd:
 * - De foundationele bronnen voor de index als geheel (kern.ts).
 * - De per-indicator referenties uit `indicator_breakdown[].references`,
 *   gededupliceerd op URL.
 */
export function ScienceReferences({ breakdown }: { breakdown: IndicatorBreakdown[] }) {
  // dedup per indicator-ref op URL (of label als URL ontbreekt)
  const seen = new Set<string>();
  const perIndicator: Array<{ label: string; url: string; indicators: string[] }> = [];
  for (const b of breakdown) {
    for (const ref of b.references || []) {
      const key = ref.url || ref.label;
      const existing = perIndicator.find((r) => (r.url || r.label) === key);
      if (existing) {
        if (!existing.indicators.includes(b.plain_name)) existing.indicators.push(b.plain_name);
        continue;
      }
      if (seen.has(key)) continue;
      seen.add(key);
      perIndicator.push({ label: ref.label, url: ref.url, indicators: [b.plain_name] });
    }
  }

  return (
    <div className="science-refs">
      <h3>Fundament van de index</h3>
      <ul className="ref-list">
        {SBI_FOUNDATIONS.map((r, i) => (
          <li key={i}>
            {r.url ? (
              <a href={r.url} target="_blank" rel="noopener noreferrer">
                {r.label} ↗
              </a>
            ) : (
              <span>{r.label}</span>
            )}
          </li>
        ))}
      </ul>

      <h3>Per indicator</h3>
      <p className="muted small">
        Onder elke indicator zit een eigen peer-reviewed onderbouwing. Hier
        staan ze gebundeld; achter elke bron zie je welke indicator(en) erop steunen.
      </p>
      <ul className="ref-list">
        {perIndicator.map((r, i) => (
          <li key={i}>
            {r.url ? (
              <a href={r.url} target="_blank" rel="noopener noreferrer">
                {r.label} ↗
              </a>
            ) : (
              <span>{r.label}</span>
            )}
            <span className="ref-tags">
              {r.indicators.map((name, j) => (
                <span key={j} className="ref-tag">{name}</span>
              ))}
            </span>
          </li>
        ))}
      </ul>

      <p className="muted small ref-note">
        Volledige methodologische verantwoording: pre-registratie en de zes lagen
        (indicator-selectie → drempel) staan in de open-source repository van het project.
      </p>
    </div>
  );
}
```

#### `app/web/src/components/SecondarySignals.tsx`

```tsx
import type { SecondarySignal } from "../types";
import { formatObservationDate } from "../lib/format-date";

/**
 * Secundaire signalen — sensitiviteit, NIET in het composiet.
 * Expliciet gelabeld als experimenteel en niet-representatief.
 * Bron: doc 02 §10 secundaire set.
 */
export function SecondarySignals({ signals }: { signals: SecondarySignal[] }) {
  if (!signals || signals.length === 0) return null;

  return (
    <section className="panel secondary-panel">
      <div className="secondary-badge">SECUNDAIR · NIET IN HET CIJFER</div>
      <h2>Onderstroom-peiling</h2>
      <p className="panel-lead">
        Dit zijn <strong>experimentele signalen</strong> die we apart meten maar
        die <strong>bewust niet meetellen</strong> in het stress-cijfer 1 tot 5 of
        in de banner-activatie. Sociale media zijn geen doorsnede van de bevolking,
        dus ze horen methodologisch niet in de officiële meting (doc 02 §8).
        We tonen ze hier alleen ter vergelijking.
      </p>

      <div className="secondary-list">
        {signals.map((s) => (
          <div key={s.code} className="secondary-item">
            <div className="secondary-item-head">
              <span className="secondary-name">{s.name}</span>
              <span className="secondary-value">{s.value.toFixed(2)}</span>
            </div>
            <div className="secondary-meta">
              <span className="secondary-code">{s.code}</span>
              <span>Gemeten: {formatObservationDate(s.observation_date)}</span>
              {s.simulated && <span className="secondary-mock">demo-data</span>}
            </div>
            <div className="secondary-source">{s.source}</div>
          </div>
        ))}
      </div>

      <p className="secondary-disclaimer">
        Waarom apart? Deze signalen zijn vers en nuttig, maar missen een lange
        eigen meetlat of een representatieve doorsnede van de bevolking. De
        Reddit-peiling steunt op een publiek dat jonger, stedelijker en hoger
        opgeleid is dan de gemiddelde Belg. De ontslag-radar telt nieuwsartikels
        en kan uitschieten wanneer er veel duiding rond één gebeurtenis is.
        Daarom: zichtbaar voor wie nieuwsgierig is, maar bewust buiten het
        officiële cijfer gehouden. Lees per signaal de bronregel hieronder.
      </p>
    </section>
  );
}
```

#### `app/web/src/components/Sections.tsx`

```tsx
import type { DailyOutput } from "../types";
import { FOOTER_NOTES } from "../copy";

export function MEDIA_DIAGNOSTIC({ diagnostic }: { diagnostic: DailyOutput["media_cluster_diagnostic"] }) {
  return (
    <section className="panel media-diagnostic">
      <h2>Mediacyclus-diagnostiek</h2>
      <p className="panel-lead">
        Het composiet zonder D5 (media & collectieve gebeurtenissen), naast de 7-daagse
        cross-correlatie tussen nieuwsnegativiteit en collectieve gebeurtenissen.
        Bron: doc 03 §4.4.
      </p>
      <div className="md-grid">
        <div className="md-cell">
          <div className="md-label">Composiet zonder D5</div>
          <div className="md-value">{diagnostic.composite_without_d5.toFixed(2)}</div>
        </div>
        <div className="md-cell">
          <div className="md-label">Cross-correlatie 7d (D5-001 ↔ D5-003)</div>
          <div className={`md-value ${Math.abs(diagnostic.d5_cross_correlation_7d) > 0.7 ? "warn" : ""}`}>
            {diagnostic.d5_cross_correlation_7d.toFixed(2)}
          </div>
          {Math.abs(diagnostic.d5_cross_correlation_7d) > 0.7 && (
            <div className="md-warn">D5-gewicht automatisch gehalveerd deze week (auto-decorrelatie).</div>
          )}
        </div>
        <div className="md-cell">
          <div className="md-label">Media-bijdrage (percentielpunten)</div>
          <div className="md-value">{diagnostic.media_contribution_percentile_points}</div>
        </div>
      </div>
    </section>
  );
}

export function FOOTER({ methodologyVersion }: { methodologyVersion: string }) {
  return (
    <footer className="footer">
      <div className="footer-row">
        <span>SBI v{methodologyVersion}</span>
        <span>·</span>
        <span>{FOOTER_NOTES.implementationStage}</span>
      </div>
      <div className="footer-row muted">{FOOTER_NOTES.methodologyRef}</div>
      <div className="footer-row muted small">{FOOTER_NOTES.ondersteunend}</div>
      <div className="footer-row muted small">
        Methodologie open: zie documenten 00–09 in projectroot. Code: open source.
      </div>
    </footer>
  );
}
```

#### `app/web/src/components/Sparkline.tsx`

```tsx
import type { SparklinePoint } from "../types";

const W = 720;
const H = 200;
const PAD = { top: 20, right: 12, bottom: 28, left: 36 };

export function Sparkline({ points }: { points: SparklinePoint[] }) {
  if (points.length < 2) return <div className="muted">Onvoldoende data voor sparkline.</div>;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const percs = points.map((p) => p.percentile);
  const minP = 0;
  const maxP = 100;

  const x = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
  const y = (p: number) => PAD.top + innerH - ((p - minP) / (maxP - minP)) * innerH;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.percentile).toFixed(1)}`)
    .join(" ");

  // Drempel-lijnen
  const y70 = y(70);
  const y90 = y(90);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sparkline" role="img" aria-label="60-daagse percentielverloop">
      {/* Achtergrond-banden */}
      <rect x={PAD.left} y={y90} width={innerW} height={Math.max(0, PAD.top + innerH - y90)} className="band-red" />
      <rect x={PAD.left} y={y70} width={innerW} height={y90 - y70} className="band-amber" />
      <rect x={PAD.left} y={PAD.top} width={innerW} height={y70 - PAD.top} className="band-green" />

      {/* Drempels */}
      <line x1={PAD.left} y1={y70} x2={W - PAD.right} y2={y70} className="threshold-line" />
      <line x1={PAD.left} y1={y90} x2={W - PAD.right} y2={y90} className="threshold-line" />
      <text x={W - PAD.right - 4} y={y70 - 4} className="threshold-label" textAnchor="end">P 70</text>
      <text x={W - PAD.right - 4} y={y90 - 4} className="threshold-label" textAnchor="end">P 90</text>

      {/* Y-as labels */}
      <text x={PAD.left - 8} y={PAD.top + 4} className="axis-label" textAnchor="end">100</text>
      <text x={PAD.left - 8} y={PAD.top + innerH + 4} className="axis-label" textAnchor="end">0</text>

      {/* Lijn */}
      <path d={path} className="spark-path" fill="none" />

      {/* Punten */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(p.percentile)}
          r={i === points.length - 1 ? 4 : 1.5}
          className={`spark-dot dot-${p.tier}`}
        >
          <title>{`${p.date}: P=${p.percentile}, tier=${p.tier}`}</title>
        </circle>
      ))}

      {/* X-as eerste/laatste */}
      <text x={PAD.left} y={H - 8} className="axis-label" textAnchor="start">{points[0].date}</text>
      <text x={W - PAD.right} y={H - 8} className="axis-label" textAnchor="end">{points[points.length - 1].date}</text>
    </svg>
  );
}
```

#### `app/web/src/components/TierIndicator.tsx`

```tsx
import type { Tier } from "../types";
import { TIER_HEADLINE, TIER_SUBLINE } from "../copy";

export function TierIndicator({ tier, daysInTier }: { tier: Tier; daysInTier: number }) {
  return (
    <div className={`tier-indicator tier-${tier}`}>
      <div className="tier-light">
        <div className={`tier-dot tier-dot-${tier}`} aria-label={`tier ${tier}`} />
      </div>
      <div className="tier-text">
        <div className="tier-label">
          {tier === "green" && "GROEN · BAND NORMAAL"}
          {tier === "amber" && "ORANJE · VENSTER OPEN"}
          {tier === "red" && "ROOD · CONDITIE-PIEK"}
        </div>
        <h1 className="tier-headline">{TIER_HEADLINE[tier]}</h1>
        <p className="tier-subline">{TIER_SUBLINE[tier]}</p>
        {tier !== "green" && (
          <div className="tier-meta">Dag {daysInTier} in deze tier.</div>
        )}
      </div>
    </div>
  );
}
```

#### `app/web/src/components/TopInfluences.tsx`

```tsx
import type { IndicatorBreakdown } from "../types";
import { stateColor, stateLabel } from "./indicator-utils";

/**
 * "Wat weegt vandaag het zwaarst" — top 3 indicatoren naar absolute bijdrage.
 * 15-jarig taalniveau.
 */
export function TopInfluences({ breakdown }: { breakdown: IndicatorBreakdown[] }) {
  const top = [...breakdown]
    .filter((b) => b.state !== "ontbreekt")
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3);

  if (top.length === 0) return null;

  return (
    <section className="panel top-influences">
      <h2>Wat speelt vandaag het meest mee?</h2>
      <p className="panel-lead">
        Van de 10 kern-indicatoren die we bekijken, zijn dit de drie die vandaag
        de meeste invloed hebben op het cijfer.
      </p>
      <ol className="top-list">
        {top.map((ind, i) => (
          <li key={ind.code} className="top-item">
            <div className="top-rank">{i + 1}</div>
            <div className="top-body">
              <div className="top-name">{ind.plain_name}</div>
              <div className="top-state" style={{ color: stateColor(ind.state) }}>
                {stateLabel(ind.state)}
              </div>
              <div className="top-why">{ind.why}</div>
            </div>
            <div className="top-direction">
              {ind.contribution > 0 ? "↑ duwt omhoog" : "↓ duwt omlaag"}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

#### `app/web/src/main.tsx`

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

#### `app/web/src/styles.css`

```css
/* ============================================================
   Hautes-Alpes · Barometer
   Visueel register: minimalistisch, rustig — in lijn met
   plus.hautes-alpes.net. Wit + zachte grijzen, één alpine-groen
   accent (#29441f). Typografie: Ubuntu. Pill-vormige knoppen.
   ============================================================ */

:root {
  /* plus.hautes-alpes.net — palet (variabelenamen behouden voor de
     bestaande regels; waarden herijkt naar het nieuwe, kalme register) */
  --lha-blue-deep:   #29441f;   /* alpine-groen — primair accent */
  --lha-blue-mid:    #1d3216;   /* donkerder groen — hover/header */
  --lha-blue-soft:   #3c5c2e;   /* mid-groen */
  --lha-sky:         #eaeee7;   /* zacht groen-getint licht */
  --lha-sky-pale:    #f7f8f9;   /* zachte sectie-achtergrond */
  --lha-snow:        #ffffff;   /* puur wit */
  --lha-sun:         #c98a3c;   /* gedempt amber — secundair accent */
  --lha-sun-soft:    #e0b375;   /* zacht amber */
  --lha-stone:       #22252a;   /* inkt, donkere tekst */
  --lha-stone-soft:  #52565b;   /* zachte tekst */
  --lha-mist:        #9ca3af;   /* gedempt grijs */
  --lha-fog:         #e5e7eb;   /* haarlijn-grijs */

  /* Status-kleuren — gedempt, kalm */
  --st-rust:   #4f7a5b;         /* rustig groen */
  --st-norm:   var(--lha-mist);
  --st-warn:   #c98a3c;         /* gedempt amber */
  --st-alert:  #a64242;         /* gedempt rood */

  /* Aliassen voor de bestaande code */
  --c-ink:        var(--lha-stone);
  --c-ink-soft:   var(--lha-stone-soft);
  --c-ink-mute:   var(--lha-mist);
  --c-paper:      var(--lha-snow);
  --c-paper-warm: var(--lha-sky-pale);
  --c-line:       var(--lha-fog);
  --c-line-soft:  #eef0f2;
  --c-deep:       var(--lha-blue-deep);
  --c-ice:        var(--lha-sky);
  --c-mist:       var(--lha-sky-pale);
  --c-sand:       var(--lha-snow);

  --c-green:      var(--st-rust);
  --c-green-bg:   #eaf1ec;
  --c-amber:      var(--st-warn);
  --c-amber-bg:   #f7efe1;
  --c-red:        var(--st-alert);
  --c-red-bg:     #f3e6e6;

  --c-shadow:     rgb(0 0 0 / 0.05);
  --c-shadow-lg:  rgb(0 0 0 / 0.09);

  --rad: 8px;
  --rad-lg: 12px;
  --rad-pill: 9999px;

  --max-w: 1040px;

  --f-display: "Ubuntu", system-ui, -apple-system, sans-serif;
  --f-sans: "Ubuntu", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
  --f-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--lha-snow);
  color: var(--c-ink);
  font-family: var(--f-sans);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

code, .mono { font-family: var(--f-mono); font-size: 0.9em; }
.muted { color: var(--c-ink-mute); }
.small { font-size: 0.85em; }

.app {
  max-width: 100%;
  margin: 0;
  padding: 0;
}

/* ============================================================
   SITE-HEADER — geblurde alpenfoto, gecentreerd logo, tekst erop
   ============================================================ */
.site-header {
  position: relative;
  overflow: hidden;
  background: var(--lha-blue-mid);
}
/* achtergrondfoto — apart laag zodat de blur de tekst niet raakt */
.hero-bg {
  position: absolute;
  inset: -28px;
  background-image:
    url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=80");
  background-size: cover;
  background-position: center 50%;
  filter: blur(6px) saturate(1.02);
  transform: scale(1.07);
}
/* groene tint over de foto — houdt de tekst leesbaar en rustig */
.hero-tint {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg,
    rgba(29, 50, 22, 0.60) 0%,
    rgba(29, 50, 22, 0.50) 52%,
    rgba(29, 50, 22, 0.80) 100%);
}
.hero-top {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  padding: 34px 32px 26px;
}
.site-logo { display: inline-flex; }
.site-logo img { display: block; height: 104px; width: auto; }
/* dunne scheidingslijn onder het logo, volle breedte */
.hero-rule {
  position: relative;
  z-index: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.32);
}
.hero-content {
  position: relative;
  z-index: 1;
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 32px 96px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #fff;
}

.site-back {
  position: absolute;
  top: 18px;
  right: 22px;
  z-index: 2;
  font-family: var(--f-sans);
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  letter-spacing: 0.02em;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: var(--rad-pill);
  padding: 7px 15px;
  white-space: nowrap;
  backdrop-filter: blur(3px);
  transition: background 0.15s ease;
}
.site-back:hover { background: rgba(255, 255, 255, 0.16); }

.intro-eyebrow {
  font-size: 0.74rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 500;
  margin-bottom: 14px;
}
.intro-title {
  font-family: var(--f-display);
  font-weight: 300;
  /* schaalt mee zodat de titel altijd op één regel past */
  font-size: clamp(1.35rem, 4.3vw, 2.5rem);
  line-height: 1.15;
  letter-spacing: -0.01em;
  color: #fff;
  margin: 0;
  white-space: nowrap;
}
.intro-lead {
  font-size: 1.05rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  margin: 18px auto 0;
  max-width: 48ch;
  text-wrap: balance;
}
.intro-meta {
  margin-top: 22px;
  font-size: 0.78rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

/* ============================================================
   MAIN CONTENT — sober
   ============================================================ */
main {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 0 32px 80px;
}

/* ============================================================
   CONDITIE-NIVEAU — overlapt deels met hero
   ============================================================ */
.cn-display {
  margin-top: -56px;
  margin-bottom: 36px;
  padding: 40px 40px 32px;
  border-radius: var(--rad-lg);
  background: var(--lha-snow);
  color: var(--c-ink);
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px var(--c-shadow);
  border: 1px solid var(--c-line);
  z-index: 2;
}
.cn-display.cn-level-3,
.cn-display.cn-level-4 {
  background: var(--lha-snow);
}
.cn-display.cn-level-5 {
  background: #f1efea;
}

.cn-label {
  font-size: 0.72rem;
  letter-spacing: 0.24em;
  color: var(--lha-blue-deep);
  margin-bottom: 18px;
  font-weight: 600;
  position: relative;
  z-index: 1;
}

.cn-main {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 36px;
  align-items: center;
  position: relative;
  z-index: 1;
}
@media (max-width: 640px) {
  .cn-main { grid-template-columns: auto 1fr; gap: 18px; }
  .cn-side { grid-column: 1 / -1; text-align: left; }
}
.cn-main .cn-scale { justify-content: center; }

.cn-number {
  font-family: var(--f-display);
  font-weight: 300;
  font-size: 7rem;
  line-height: 0.85;
  color: var(--lha-blue-deep);
  letter-spacing: -0.04em;
}
.cn-level-3 .cn-number { color: var(--lha-sun); }
.cn-level-4 .cn-number { color: var(--st-alert); }

.cn-scale {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 0 12px;
}
.cn-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--c-line);
  border: 1px solid var(--c-fog, #d8e1ec);
  transition: all 220ms;
  opacity: 0.4;
}

/* Vaste kleur per positie — gradiënt groen → rood. Toont visueel
   wat 'minder erg' (1) vs 'meest erg' (5) betekent, ook bij inactieve dots. */
.cn-dot-pos-1 { background: var(--st-rust); border-color: var(--st-rust); }
.cn-dot-pos-2 { background: var(--lha-blue-soft); border-color: var(--lha-blue-soft); }
.cn-dot-pos-3 { background: var(--lha-sun); border-color: var(--lha-sun); }
.cn-dot-pos-4 { background: var(--st-alert); border-color: var(--st-alert); }
.cn-dot-pos-5 { background: var(--lha-stone-soft); border-color: var(--lha-stone-soft); }

/* Actieve dots (tot en met huidig niveau) krijgen volle opaciteit */
.cn-dot.active { opacity: 1; }

/* Huidige dot krijgt zachte glow in dezelfde positie-kleur */
.cn-dot.current { transform: scale(1.45); }
.cn-dot-pos-1.current { box-shadow: 0 0 0 5px rgba(74, 124, 89, 0.22); }
.cn-dot-pos-2.current { box-shadow: 0 0 0 5px rgba(45, 109, 165, 0.22); }
.cn-dot-pos-3.current { box-shadow: 0 0 0 5px rgba(232, 168, 84, 0.26); }
.cn-dot-pos-4.current { box-shadow: 0 0 0 5px rgba(176, 58, 58, 0.24); }
.cn-dot-pos-5.current { box-shadow: 0 0 0 5px rgba(74, 90, 115, 0.22); }

.cn-side { text-align: right; }
.cn-kicker {
  font-family: var(--f-sans);
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  color: var(--lha-blue-deep);
  font-weight: 600;
  margin-bottom: 4px;
}
.cn-meta {
  font-family: var(--f-mono);
  font-size: 0.82rem;
  color: var(--lha-mist);
}

.cn-description {
  margin: 26px 0 0;
  font-family: var(--f-display);
  font-weight: 400;
  font-size: 1.25rem;
  line-height: 1.4;
  color: var(--c-ink);
  position: relative;
  z-index: 1;
  max-width: 700px;
}

.cn-secondary {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--c-line);
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--lha-stone-soft);
  flex-wrap: wrap;
  gap: 12px;
  position: relative;
  z-index: 1;
}
.cn-secondary strong {
  color: var(--lha-blue-deep);
  font-family: var(--f-mono);
  font-weight: 500;
}

/* ============================================================
   PLAIN EXPLAINER
   ============================================================ */
.plain-explainer {
  margin-bottom: 32px;
  padding: 32px 36px;
  border-radius: var(--rad-lg);
  background: var(--lha-sky-pale);
  border: 1px solid var(--c-line);
}
.plain-explainer h2 {
  font-family: var(--f-display);
  font-size: 1.75rem;
  font-weight: 500;
  margin: 0 0 14px;
  color: var(--lha-blue-deep);
  letter-spacing: -0.01em;
}
.plain-explainer p {
  color: var(--c-ink);
  font-size: 1.02rem;
  margin: 0 0 10px;
  line-height: 1.65;
}
.plain-explainer-context strong {
  color: var(--lha-blue-deep);
  font-weight: 600;
}

/* ============================================================
   CTA Les Hautes Alpes — vol merk
   ============================================================ */
.cta {
  position: relative;
  background: var(--lha-blue-deep);
  color: var(--lha-snow);
  border-radius: var(--rad-lg);
  padding: 48px 44px;
  margin-bottom: 32px;
  overflow: hidden;
}
.cta::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(0, 0, 0, 0.14) 100%);
  pointer-events: none;
}
.cta-inner { position: relative; z-index: 1; max-width: 580px; }
.cta-mark {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--f-sans);
  font-size: 0.78rem;
  letter-spacing: 0.22em;
  color: var(--lha-sun-soft);
  margin-bottom: 18px;
}
.cta-mark .lha-mark-mini {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}
.cta-headline {
  font-family: var(--f-display);
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 400;
  margin: 0 0 14px;
  line-height: 1.15;
  color: var(--lha-snow);
  letter-spacing: -0.01em;
}
.cta-body {
  color: rgba(255, 255, 255, 0.86);
  margin: 0 0 26px;
  font-size: 1.02rem;
  line-height: 1.55;
  max-width: 48ch;
}
.cta-action {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 13px 26px;
  background: var(--lha-snow);
  border: none;
  border-radius: var(--rad-pill);
  color: var(--lha-blue-deep);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: background 160ms ease, transform 160ms ease;
}
.cta-action:hover {
  background: var(--lha-sky);
  transform: translateY(-1px);
}

/* ============================================================
   PANELS — generic
   ============================================================ */
.panel {
  border: 1px solid var(--c-line);
  border-radius: var(--rad-lg);
  padding: 32px 36px;
  margin-bottom: 24px;
  background: var(--lha-snow);
}
.panel h2 {
  font-family: var(--f-sans);
  font-size: 0.78rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin: 0 0 14px;
  color: var(--lha-blue-deep);
  font-weight: 600;
}
.panel-lead {
  color: var(--c-ink-soft);
  font-size: 0.95rem;
  margin: 0 0 22px;
  line-height: 1.6;
}

/* ============================================================
   TOP INFLUENCES
   ============================================================ */
.top-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }
.top-item {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 18px;
  padding: 20px 22px;
  background: var(--lha-sky-pale);
  border-radius: var(--rad);
  align-items: start;
  border-left: 3px solid var(--lha-blue-deep);
  transition: transform 150ms;
}
.top-item:hover { transform: translateX(2px); }
.top-rank {
  font-family: var(--f-display);
  font-size: 2rem;
  color: var(--lha-blue-deep);
  font-weight: 300;
  line-height: 1;
  padding-top: 2px;
}
.top-name {
  font-family: var(--f-sans);
  font-size: 1.08rem;
  font-weight: 600;
  color: var(--c-ink);
  margin-bottom: 4px;
}
.top-state {
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  margin-bottom: 8px;
}
.top-why {
  font-size: 0.9rem;
  color: var(--c-ink-soft);
  line-height: 1.55;
}
.top-direction {
  font-family: var(--f-mono);
  font-size: 0.8rem;
  color: var(--lha-stone-soft);
  white-space: nowrap;
  padding-top: 6px;
}

/* ============================================================
   INDICATOR LIST — alle 20
   ============================================================ */
.indicator-list {
  margin-bottom: 28px;
  padding: 36px 36px 28px;
  border-radius: var(--rad-lg);
  background: var(--lha-snow);
  border: 1px solid var(--c-line);
}
.indicator-list-header { margin-bottom: 28px; }
.indicator-list-header h2 {
  font-family: var(--f-sans);
  font-size: 0.78rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin: 0 0 14px;
  color: var(--lha-blue-deep);
  font-weight: 600;
}

.domain-group {
  margin-bottom: 22px;
  border: 1px solid var(--c-line);
  border-radius: var(--rad-lg);
  overflow: hidden;
  background: var(--lha-snow);
}
.domain-group:last-of-type { margin-bottom: 8px; }

/* domein-kop = geblurde fotobanner, een eigen foto per domein */
.domain-group-header {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 14px;
  align-items: center;
  padding: 22px 24px;
}
.domain-group-header::before {
  content: "";
  position: absolute;
  inset: -16px;
  background-size: cover;
  background-position: center;
  filter: blur(4px);
  transform: scale(1.09);
}
.domain-group-header::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg,
    rgba(29, 50, 22, 0.9) 0%, rgba(29, 50, 22, 0.64) 100%);
}
.domain-group-header > * { position: relative; z-index: 1; }
.dh-D1::before { background-image: url("https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=70"); }
.dh-D2::before { background-image: url("https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=70"); }
.dh-D3::before { background-image: url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=70"); }
.dh-D4::before { background-image: url("https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=70"); }
.dh-D5::before { background-image: url("https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=70"); }
.dh-D6::before { background-image: url("https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=1200&q=70"); }
.domain-group-code {
  font-family: var(--f-mono);
  color: #fff;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 3px 9px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 4px;
}
.domain-group-name {
  font-family: var(--f-display);
  font-weight: 500;
  color: #fff;
  font-size: 1.18rem;
}
.domain-group-sub {
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.85rem;
  text-align: right;
  font-style: italic;
}
@media (max-width: 640px) { .domain-group-sub { display: none; } }

.ind-rows { display: flex; flex-direction: column; padding: 6px 12px 12px; }
.ind-row { border-bottom: 1px solid var(--c-line-soft); }
.ind-row:last-child { border-bottom: none; }
.ind-row-summary {
  display: grid;
  grid-template-columns: 36px 1fr auto 24px;
  gap: 14px;
  align-items: center;
  width: 100%;
  padding: 14px 8px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 120ms;
  border-radius: 6px;
}
.ind-row-summary:hover { background: var(--lha-sky-pale); }
.ind-icon { font-size: 1.15rem; text-align: center; line-height: 1; }
.ind-name { font-size: 0.98rem; color: var(--c-ink); font-weight: 500; }
.ind-state { font-size: 0.85rem; font-weight: 500; text-align: right; }
.ind-toggle { font-family: var(--f-mono); color: var(--lha-mist); font-size: 1.1rem; text-align: center; }

.ind-detail { padding: 0 8px 16px 50px; font-size: 0.92rem; }
.ind-why {
  margin: 0 0 14px;
  color: var(--c-ink-soft);
  line-height: 1.6;
  font-family: var(--f-display);
  font-style: italic;
  font-size: 1.05rem;
}
.ind-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  padding: 14px 16px;
  background: var(--lha-sky-pale);
  border-radius: var(--rad);
}
.ind-meta-label {
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  color: var(--lha-mist);
  margin-bottom: 4px;
  text-transform: uppercase;
  font-weight: 600;
}
.ind-meta-value { color: var(--c-ink); font-size: 0.9rem; }
.ind-meta-value strong { font-family: var(--f-mono); color: var(--lha-blue-deep); }
.ind-meta-source { font-size: 0.8rem; color: var(--lha-stone-soft); }
.ind-reach-rationale {
  margin: 10px 0 0;
  font-size: 0.82rem;
  color: var(--lha-stone-soft);
  font-style: italic;
  line-height: 1.5;
}
.ind-mock-tag {
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--lha-sun-soft);
  color: var(--lha-stone);
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.indicator-list-footer {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--c-line);
  font-size: 0.85rem;
  color: var(--c-ink-soft);
}

/* ============================================================
   SPARKLINE
   ============================================================ */
.sparkline { width: 100%; height: auto; }
.band-green { fill: var(--c-green-bg); opacity: 0.45; }
.band-amber { fill: var(--c-amber-bg); opacity: 0.55; }
.band-red   { fill: var(--c-red-bg);   opacity: 0.55; }
.threshold-line { stroke: var(--lha-stone-soft); stroke-width: 1; stroke-dasharray: 3 3; opacity: 0.5; }
.threshold-label, .axis-label { fill: var(--lha-stone-soft); font-family: var(--f-mono); font-size: 10px; }
.spark-path { stroke: var(--lha-blue-deep); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.spark-dot { fill: var(--lha-blue-deep); }
.dot-amber { fill: var(--lha-sun); }
.dot-red   { fill: var(--st-alert); }
.dot-green { fill: var(--st-rust); }

/* ============================================================
   METHODOLOGY
   ============================================================ */
.methodology p { color: var(--c-ink-soft); font-size: 0.95rem; margin: 0 0 12px; line-height: 1.6; }
.methodology-do-dont { list-style: none; padding: 0; margin: 18px 0; }
.methodology-do-dont li {
  padding: 12px 16px;
  margin-bottom: 8px;
  background: var(--lha-sky-pale);
  border-left: 3px solid var(--lha-blue-deep);
  border-radius: 4px;
  font-size: 0.92rem;
  line-height: 1.5;
}
.methodology details { margin-top: 18px; }
.methodology summary {
  cursor: pointer;
  color: var(--lha-blue-deep);
  font-weight: 500;
  font-size: 0.95rem;
  padding: 10px 0;
}
.methodology-steps { color: var(--c-ink-soft); font-size: 0.9rem; padding-left: 22px; line-height: 1.7; }
.methodology-steps li { margin-bottom: 8px; }

/* ============================================================
   DATA QUALITY
   ============================================================ */
.dq-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 28px; }
@media (max-width: 600px) { .dq-grid { grid-template-columns: 1fr; } }
.dq-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px dotted var(--c-line);
  font-size: 0.88rem;
  position: relative;
}
.dq-label { color: var(--c-ink-soft); }
.dq-value { font-family: var(--f-mono); color: var(--c-ink); font-weight: 500; }
.dq-row.warn .dq-value { color: var(--lha-sun); }
.dq-detail { grid-column: 1 / -1; margin-top: 6px; }
.dq-detail summary { cursor: pointer; color: var(--lha-blue-deep); font-size: 0.78rem; }
.dq-detail code {
  display: block;
  margin-top: 6px;
  padding: 10px 12px;
  background: var(--lha-sky-pale);
  border-radius: 4px;
  font-size: 0.78rem;
  color: var(--c-ink-soft);
  word-break: break-all;
}
.dq-disclaimer {
  margin-top: 18px;
  padding: 14px 18px;
  border-left: 3px solid var(--lha-sun);
  background: var(--lha-sun-soft);
  color: var(--lha-stone);
  font-size: 0.88rem;
  border-radius: 4px;
  line-height: 1.55;
}

/* ============================================================
   BRAND SAFETY BANNER
   ============================================================ */
.brand-safety {
  padding: 18px 22px;
  border-radius: var(--rad-lg);
  margin: 0 32px 24px;
  border: 1px solid var(--lha-sun);
  background: var(--lha-sun-soft);
  max-width: var(--max-w);
  margin-left: auto;
  margin-right: auto;
}
.brand-safety-block { border-color: var(--st-alert); background: var(--c-red-bg); }
.bs-label { font-size: 0.74rem; letter-spacing: 0.18em; color: var(--lha-stone); font-weight: 600; }
.bs-message { margin: 10px 0 4px; font-size: 0.95rem; color: var(--c-ink); line-height: 1.55; }
.bs-reason { margin: 0; font-size: 0.82rem; color: var(--lha-stone-soft); }

/* ============================================================
   TECHNICAL TOGGLE + FOOTER
   ============================================================ */
.technical-toggle {
  margin: 40px 0 20px;
  padding: 22px;
  text-align: center;
  border-top: 1px dashed var(--c-line);
}
.technical-toggle-btn {
  background: var(--lha-snow);
  border: 1px solid var(--lha-blue-deep);
  color: var(--lha-blue-deep);
  padding: 11px 24px;
  border-radius: var(--rad-pill);
  font-family: var(--f-sans);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 140ms ease, color 140ms ease;
  letter-spacing: 0.02em;
}
.technical-toggle-btn:hover { background: var(--lha-blue-deep); color: var(--lha-snow); }
.technical-toggle-hint { margin: 12px 0 0; font-size: 0.82rem; }

.footer {
  margin-top: 56px;
  padding: 36px 32px 32px;
  background: var(--lha-blue-deep);
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.85rem;
}
.footer-inner {
  max-width: var(--max-w);
  margin: 0 auto;
}
.footer-row { margin-bottom: 8px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.footer .muted { color: rgba(255, 255, 255, 0.55); }
.footer strong { color: var(--lha-sky); font-weight: 500; }
.footer-mark {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}
.footer-center { text-align: center; }
.footer-center .footer-mark { justify-content: center; }
.footer-center .footer-row { justify-content: center; }
.footer-mark-text { font-family: var(--f-display); font-style: italic; color: var(--lha-sky); }
.footer-mark .lha-mark-mini { color: var(--lha-snow); }

/* ============================================================
   TIER INDICATOR (technical section)
   ============================================================ */
.hero {
  display: grid;
  grid-template-columns: minmax(280px, 1.4fr) 1fr;
  gap: 32px;
  padding: 32px;
  border: 1px solid var(--c-line);
  border-radius: var(--rad-lg);
  background: var(--lha-snow);
  margin-bottom: 24px;
}
@media (max-width: 720px) { .hero { grid-template-columns: 1fr; padding: 24px; } }

.tier-indicator { display: flex; gap: 22px; align-items: flex-start; }
.tier-light { padding-top: 10px; }
.tier-dot {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 4px solid var(--lha-snow);
  box-shadow: 0 0 0 1px var(--c-line);
}
.tier-dot-green { background: var(--st-rust); }
.tier-dot-amber { background: var(--lha-sun); }
.tier-dot-red {
  background: var(--st-alert);
  animation: pulse 3.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 1px var(--c-line); }
  50%      { box-shadow: 0 0 0 6px rgba(176, 58, 58, 0.18), 0 0 0 1px var(--c-line); }
}
.tier-label { font-size: 0.7rem; letter-spacing: 0.15em; color: var(--lha-mist); margin-bottom: 8px; }
.tier-headline { font-size: 1.5rem; line-height: 1.2; margin: 0 0 8px; color: var(--c-ink); font-weight: 500; font-family: var(--f-display); }
.tier-subline { margin: 0 0 12px; color: var(--c-ink-soft); }
.tier-meta { font-size: 0.85rem; color: var(--lha-mist); font-family: var(--f-mono); }

.percentile-display { border-left: 1px solid var(--c-line); padding-left: 28px; }
@media (max-width: 720px) { .percentile-display { border-left: none; padding-left: 0; border-top: 1px solid var(--c-line); padding-top: 24px; } }
.percentile-label { font-size: 0.68rem; letter-spacing: 0.15em; color: var(--lha-mist); }
.percentile-value {
  font-family: var(--f-display);
  font-weight: 300;
  font-size: 3.5rem;
  line-height: 1;
  color: var(--lha-blue-deep);
  margin: 4px 0 8px;
  letter-spacing: -0.02em;
}
.percentile-context { font-size: 0.85rem; color: var(--c-ink-soft); margin-bottom: 18px; }
.percentile-meta { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.meta-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px dotted var(--c-line);
  font-size: 0.85rem;
}
.meta-key { color: var(--c-ink-soft); }
.meta-value { font-family: var(--f-mono); color: var(--c-ink); }
.percentile-disclaimer { font-size: 0.72rem; color: var(--lha-mist); font-style: italic; }

.domain-contributions { display: flex; flex-direction: column; gap: 14px; }
.domain-row { display: grid; grid-template-columns: 28px 1fr 2fr 64px; align-items: center; gap: 14px; }
.domain-rank { font-family: var(--f-mono); color: var(--lha-mist); font-size: 0.85rem; text-align: center; }
.domain-code { font-family: var(--f-mono); color: var(--lha-blue-deep); font-weight: 600; font-size: 0.85rem; }
.domain-name { font-size: 0.85rem; color: var(--c-ink-soft); }
.domain-bar-wrap { height: 8px; background: var(--c-line-soft); border-radius: 4px; overflow: hidden; }
.domain-bar { height: 100%; border-radius: 4px; transition: width 300ms; }
.domain-bar.positive { background: var(--lha-blue-deep); }
.domain-bar.negative { background: var(--lha-sky); }
.domain-value { font-family: var(--f-mono); text-align: right; font-size: 0.85rem; color: var(--c-ink); }

/* Media diagnostic */
.md-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media (max-width: 720px) { .md-grid { grid-template-columns: 1fr; } }
.md-cell { padding: 18px 20px; border: 1px solid var(--c-line); border-radius: var(--rad); background: var(--lha-sky-pale); }
.md-label { font-size: 0.75rem; color: var(--lha-mist); margin-bottom: 6px; }
.md-value { font-family: var(--f-mono); font-size: 1.5rem; color: var(--lha-blue-deep); }
.md-value.warn { color: var(--lha-sun); }
.md-warn { margin-top: 8px; font-size: 0.8rem; color: var(--lha-sun); }

/* ============================================================
   Sources — per indicator + all-sources panel
   ============================================================ */
.ind-sources {
  margin-top: 16px;
  padding: 14px 16px;
  background: var(--lha-sky-pale);
  border-radius: var(--rad);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ind-source-block { display: flex; flex-direction: column; gap: 4px; }
.ind-source-label {
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  color: var(--lha-mist);
  text-transform: uppercase;
  font-weight: 600;
}
.ind-source-link {
  color: var(--lha-blue-deep);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  border-bottom: 1px solid transparent;
  transition: border-color 120ms;
  display: inline-block;
  width: max-content;
}
.ind-source-link:hover { border-bottom-color: var(--lha-blue-deep); }
.ind-refs {
  list-style: none;
  padding: 0;
  margin: 4px 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ind-refs a {
  color: var(--lha-blue-mid);
  text-decoration: none;
  font-size: 0.85rem;
  line-height: 1.5;
  border-bottom: 1px solid transparent;
}
.ind-refs a:hover { border-bottom-color: var(--lha-blue-mid); }

.all-sources {
  background: var(--lha-sky-pale);
}
.sources-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-top: 8px;
}
@media (max-width: 720px) { .sources-grid { grid-template-columns: 1fr; gap: 28px; } }
.sources-column h3 {
  font-family: var(--f-sans);
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--lha-blue-deep);
  margin: 0 0 12px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--c-line);
}
.sources-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sources-list a {
  color: var(--lha-blue-mid);
  text-decoration: none;
  font-size: 0.88rem;
  line-height: 1.5;
  border-bottom: 1px solid transparent;
  transition: border-color 120ms;
}
.sources-list a:hover { border-bottom-color: var(--lha-blue-mid); color: var(--lha-blue-deep); }
.all-sources-note {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--c-line);
  font-style: italic;
}

/* ============================================================
   Expert-view: Z-thermometer per indicator
   Opvallende rode accent-rand om de expert-laag visueel te onderscheiden
   van de publieke barometer-laag.
   ============================================================ */
.zview-panel {
  padding: 0;
  overflow: hidden;
  border: 2px solid var(--st-alert);
  background: var(--lha-snow);
  box-shadow: 0 6px 24px rgba(176, 58, 58, 0.10), 0 1px 2px var(--c-shadow);
  position: relative;
}
.zview-panel::before {
  content: "EXPERT";
  position: absolute;
  top: -1px;
  right: 24px;
  background: var(--st-alert);
  color: var(--lha-snow);
  font-family: var(--f-sans);
  font-size: 0.68rem;
  letter-spacing: 0.18em;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 0 0 6px 6px;
  z-index: 2;
}
.zview-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 28px;
  background: #fdf6f6;
  border: none;
  cursor: pointer;
  text-align: center;
  font-family: inherit;
  transition: background 150ms;
  border-bottom: 1px solid var(--st-alert);
  border-left: 4px solid var(--st-alert);
}
.zview-toggle:hover { background: #f8e9e9; }
.zview-toggle[aria-expanded="false"] { border-bottom-color: transparent; }
.zview-toggle-icon {
  font-family: var(--f-mono);
  font-size: 1.6rem;
  color: var(--st-alert);
  width: 28px;
  text-align: center;
  font-weight: 600;
  flex-shrink: 0;
}
.zview-toggle-icon-right { visibility: hidden; }
.zview-toggle-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  text-align: center;
}
.zview-toggle-text strong {
  font-family: var(--f-sans);
  font-weight: 600;
  color: var(--st-alert);
  font-size: 1.05rem;
  letter-spacing: 0.02em;
}

.zview-body {
  padding: 24px 28px 28px;
  border-left: 4px solid var(--st-alert);
}
.zview-lead {
  font-size: 0.92rem;
  color: var(--c-ink-soft);
  line-height: 1.55;
  margin: 0 0 18px;
  max-width: 68ch;
}

.zview-sort {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 14px;
  font-size: 0.82rem;
  color: var(--lha-stone-soft);
}
.zview-sort button {
  background: var(--lha-snow);
  border: 1px solid var(--c-line);
  color: var(--lha-stone-soft);
  padding: 4px 10px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 120ms;
}
.zview-sort button:hover { border-color: var(--lha-blue-mid); }
.zview-sort button.active {
  background: var(--lha-blue-deep);
  color: var(--lha-snow);
  border-color: var(--lha-blue-deep);
}

.zview-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 0.78rem;
  color: var(--lha-stone-soft);
  margin-bottom: 22px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--c-line);
}
.zview-legend i {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 5px;
  vertical-align: middle;
}
.lg-cold { background: var(--st-rust); }
.lg-normal { background: var(--lha-mist); }
.lg-warn { background: var(--lha-sun); }
.lg-alert { background: var(--st-alert); }

.zview-list { display: flex; flex-direction: column; gap: 16px; }

.zth { padding: 6px 0; }
.zth-header {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 12px;
  align-items: baseline;
  margin-bottom: 6px;
}
.zth-code {
  font-family: var(--f-mono);
  font-size: 0.74rem;
  color: var(--lha-mist);
  font-weight: 600;
}
.zth-name {
  font-family: var(--f-sans);
  font-size: 0.92rem;
  color: var(--c-ink);
  font-weight: 500;
}
.zth-value {
  font-family: var(--f-mono);
  font-size: 0.85rem;
  color: var(--lha-blue-deep);
  text-align: right;
}
.zth-unit {
  color: var(--lha-stone-soft);
  font-size: 0.75rem;
  margin-left: 2px;
}
.zth-z-missing { font-size: 0.78rem; color: var(--lha-mist); font-style: italic; }

.zth-bar-wrap {
  position: relative;
  height: 22px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--c-line-soft);
  margin: 4px 0 18px;
}
.zth-zone {
  position: absolute;
  top: 0;
  height: 100%;
  opacity: 0.28;
}
.zth-zone-cold { background: var(--st-rust); }
.zth-zone-normal { background: var(--lha-mist); }
.zth-zone-warn { background: var(--lha-sun); opacity: 0.42; }
.zth-zone-alert { background: var(--st-alert); opacity: 0.42; }

.zth-marker {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
}
.zth-marker-threshold {
  background: var(--lha-blue-deep);
  opacity: 0.6;
}
.zth-marker-extreme {
  background: var(--st-alert);
  opacity: 0.65;
}

.zth-dot {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid var(--lha-snow);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.22);
  z-index: 2;
  transition: left 400ms ease;
}

.zth-axis {
  position: absolute;
  bottom: -16px;
  left: 0;
  right: 0;
  height: 14px;
  font-family: var(--f-mono);
  font-size: 0.68rem;
  color: var(--lha-mist);
}
.zth-axis span {
  position: absolute;
  transform: translateX(-50%);
  white-space: nowrap;
}

.zth-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  margin-top: 4px;
}
.zth-z {
  font-family: var(--f-mono);
  font-weight: 600;
}
.zth-dist {
  color: var(--lha-stone-soft);
  font-style: italic;
}

.zview-footer-note {
  margin-top: 26px;
  padding-top: 16px;
  border-top: 1px solid var(--c-line);
  font-size: 0.82rem;
  color: var(--lha-stone-soft);
  line-height: 1.55;
}
.zview-footer-note strong { color: var(--lha-blue-deep); }

/* ============================================================
   Secundaire signalen — apart, gelabeld, niet in composiet
   ============================================================ */
.secondary-panel {
  border: 1px dashed var(--lha-mist);
  background: #fbfaf7;
  position: relative;
}
.secondary-badge {
  display: inline-block;
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  font-weight: 600;
  color: var(--lha-stone-soft);
  background: var(--c-line-soft);
  padding: 4px 12px;
  border-radius: 12px;
  margin-bottom: 12px;
}
.secondary-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 18px;
}
.secondary-item {
  padding: 14px 16px;
  background: var(--lha-snow);
  border: 1px solid var(--c-line);
  border-radius: var(--rad);
}
.secondary-item-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}
.secondary-name {
  font-weight: 600;
  color: var(--c-ink);
  font-size: 0.98rem;
}
.secondary-value {
  font-family: var(--f-mono);
  font-size: 1.2rem;
  color: var(--lha-stone-soft);
}
.secondary-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 0.78rem;
  color: var(--lha-mist);
  margin-bottom: 6px;
}
.secondary-code {
  font-family: var(--f-mono);
  font-weight: 600;
  color: var(--lha-stone-soft);
}
.secondary-mock {
  padding: 1px 7px;
  border-radius: 10px;
  background: var(--lha-sun-soft);
  color: var(--lha-stone);
  font-size: 0.7rem;
}
.secondary-source {
  font-size: 0.8rem;
  color: var(--c-ink-soft);
  line-height: 1.5;
}
.secondary-disclaimer {
  font-size: 0.82rem;
  color: var(--lha-stone-soft);
  line-height: 1.55;
  font-style: italic;
  padding-top: 14px;
  border-top: 1px solid var(--c-line);
  margin: 0;
}

/* Loading / error */
.loading, .error-state { max-width: 640px; margin: 80px auto; padding: 32px; text-align: center; }
.error-state h1 { color: var(--lha-blue-deep); }
.error-state code { background: var(--lha-sky-pale); padding: 2px 6px; border-radius: 3px; }

/* Preview page */
.preview-page { max-width: 1200px; margin: 0 auto; padding: 32px 24px 80px; }
.preview-header { margin-bottom: 36px; padding-bottom: 18px; border-bottom: 1px solid var(--c-line); }
.preview-header h1 { font-family: var(--f-display); font-size: 1.75rem; margin: 8px 0 6px; color: var(--lha-blue-deep); }
.preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 18px; margin-bottom: 32px; }
.preview-card { border: 1px solid var(--c-line); border-radius: var(--rad-lg); padding: 18px; background: var(--lha-snow); }
.preview-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.preview-cn { font-family: var(--f-mono); font-size: 0.95rem; color: var(--lha-blue-deep); font-weight: 600; }
.preview-cn-name { margin-left: 8px; font-weight: 400; color: var(--lha-mist); font-family: var(--f-sans); }
.preview-status { font-size: 0.72rem; letter-spacing: 0.12em; padding: 3px 10px; border-radius: 12px; border: 1px solid var(--c-line); color: var(--lha-mist); }
.preview-status.on { background: var(--lha-sun-soft); color: var(--lha-stone); border-color: var(--lha-sun); }
.preview-status.off { background: var(--c-line-soft); }
.preview-banner-wrap { margin-bottom: 12px; }
.banner-render { padding: 18px 22px; border-radius: var(--rad); min-height: 100px; display: flex; flex-direction: column; justify-content: center; color: #fff; }
.banner-render-1, .banner-render-2 { background: var(--lha-blue-deep); }
.banner-render-3 { background: linear-gradient(135deg, var(--lha-blue-deep) 0%, var(--lha-sun) 140%); }
.banner-render-4 { background: linear-gradient(135deg, var(--lha-blue-deep) 0%, var(--st-alert) 140%); }
.banner-render-off { background: var(--lha-sky-pale); color: var(--c-ink-soft); border: 1px dashed var(--c-line); }
.banner-render-mark { font-size: 0.7rem; letter-spacing: 0.2em; color: var(--lha-sky); margin-bottom: 8px; }
.banner-render-headline { font-family: var(--f-display); font-size: 1.15rem; font-weight: 500; margin-bottom: 6px; line-height: 1.25; }
.banner-render-body { font-size: 0.88rem; line-height: 1.5; color: rgba(255, 255, 255, 0.86); }
.banner-render-off .banner-render-body { color: var(--c-ink-soft); }
.banner-render-action { margin-top: 12px; display: inline-block; font-size: 0.85rem; color: var(--lha-sun); text-decoration: none; padding: 6px 14px; border: 1px solid var(--lha-sun); border-radius: var(--rad); width: max-content; }
.preview-notes { font-size: 0.78rem; color: var(--lha-stone-soft); padding-top: 10px; border-top: 1px dotted var(--c-line); }
.preview-back { margin-top: 32px; }
.preview-back a { color: var(--lha-blue-deep); text-decoration: none; font-size: 0.9rem; }
.preview-back a:hover { text-decoration: underline; }
.code-block { background: var(--lha-stone); color: var(--lha-snow); padding: 16px 20px; border-radius: var(--rad); font-family: var(--f-mono); font-size: 0.78rem; overflow-x: auto; line-height: 1.6; }

/* ============================================================
   HERO — uurlijks bijgewerkt-noot
   ============================================================ */
.intro-note {
  margin-top: 10px;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.62);
  font-style: italic;
}

/* ============================================================
   BUTTON-PANELS — 5 in-page klap-knoppen (v0.4)
   ============================================================ */
.bp-section {
  margin: 32px 0 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bp-row {
  border: 1px solid var(--c-line);
  border-radius: var(--rad-lg);
  background: var(--lha-snow);
  overflow: hidden;
  transition: border-color 0.15s ease;
}
.bp-row.open { border-color: var(--lha-blue-deep); }

.bp-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  width: 100%;
  background: transparent;
  border: none;
  padding: 18px 24px;
  cursor: pointer;
  font-family: var(--f-sans);
  color: var(--c-ink);
  text-align: left;
  transition: background 0.15s ease;
}
.bp-button:hover { background: var(--lha-sky-pale); }
.bp-row.open .bp-button { background: var(--lha-sky); }

.bp-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.bp-label {
  font-size: 1.02rem;
  font-weight: 500;
  color: var(--lha-blue-deep);
  letter-spacing: 0;
}
.bp-sub {
  font-size: 0.82rem;
  color: var(--lha-stone-soft);
  font-weight: 400;
}
.bp-icon {
  font-size: 1.5rem;
  font-weight: 300;
  color: var(--lha-blue-deep);
  line-height: 1;
  flex-shrink: 0;
  width: 28px;
  text-align: center;
}

.bp-panel {
  padding: 14px 22px 22px;
  border-top: 1px solid var(--c-line);
  background: var(--lha-sky-pale);
}
/* In het paneel staan al bestaande componenten met hun eigen panel-stijl;
   we tonen ze niet als geneste witte kaartjes maar laten ze schoon doorlopen. */
.bp-panel > .panel,
.bp-panel > .indicator-list,
.bp-panel > .secondary-panel,
.bp-panel > .all-sources {
  background: var(--lha-snow);
  margin-bottom: 16px;
}
.bp-panel > :last-child { margin-bottom: 0; }

.technical-stack { display: flex; flex-direction: column; gap: 16px; }
.technical-stack > * { background: var(--lha-snow); border: 1px solid var(--c-line); border-radius: var(--rad); padding: 18px 22px; }

/* Wetenschappelijke referenties — compacte lijst */
.science-refs h3 {
  font-family: var(--f-display);
  font-weight: 500;
  font-size: 1rem;
  color: var(--lha-blue-deep);
  margin: 18px 0 8px;
}
.science-refs h3:first-child { margin-top: 4px; }
.ref-list { list-style: none; padding: 0; margin: 0; }
.ref-list li {
  padding: 8px 0;
  border-bottom: 1px dotted var(--c-line);
  font-size: 0.92rem;
  line-height: 1.5;
}
.ref-list li:last-child { border-bottom: none; }
.ref-list a { color: var(--lha-blue-deep); text-decoration: none; }
.ref-list a:hover { text-decoration: underline; }
.ref-tags { display: inline-flex; flex-wrap: wrap; gap: 4px; margin-left: 8px; }
.ref-tag {
  font-size: 0.72rem;
  background: var(--lha-sky-pale);
  color: var(--lha-stone-soft);
  padding: 1px 7px;
  border-radius: var(--rad-pill);
}
.ref-note { margin-top: 16px; }

@media (max-width: 640px) {
  .bp-button { padding: 14px 18px; }
  .bp-panel { padding: 12px 14px 18px; }
  .bp-sub { display: none; }
}
```

#### `app/web/index.html`

```html
<!doctype html>
<html lang="nl-BE">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Natuurlijk in het hart van de Alpen. Barometer voor het stress-cijfer van vandaag." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap" />
    <title>Hautes-Alpes · Barometer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### `app/web/package.json`

```json
{
  "name": "@sbi/web",
  "version": "0.2.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^25.9.1",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.0"
  }
}
```

#### `app/web/vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      // Sta toe dat de UI ../data leest tijdens dev
      allow: [resolve(__dirname, ".."), resolve(__dirname, "../..")],
    },
  },
  publicDir: "public",
});
```

### GitHub Actions

#### `.github/workflows/daily.yml`

```yaml
name: SBI Daily Update

on:
  schedule:
    # Voorlopig één totale check per dag om 08:00 BE-tijd (06:00 UTC zomer /
    # 07:00 UTC winter — dual cron + tijd-guard, zoals voorheen).
    - cron: "0 6 * * *"
    - cron: "0 7 * * *"
  workflow_dispatch: {}

permissions:
  contents: write

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: "true"

jobs:
  fetch-build-deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Time-guard (alleen door bij 08:00 BE-tijd of bij handmatige trigger)
        id: timecheck
        run: |
          BE_HOUR=$(TZ='Europe/Brussels' date +%H)
          echo "Belgian local hour: $BE_HOUR"
          if [ "${{ github.event_name }}" = "schedule" ] && [ "$BE_HOUR" != "08" ]; then
            echo "Skip — schedule firing maar BE-uur is $BE_HOUR, niet 08."
            echo "skip=true" >> "$GITHUB_OUTPUT"
          else
            echo "Proceed."
            echo "skip=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Checkout
        if: steps.timecheck.outputs.skip != 'true'
        uses: actions/checkout@v4

      - name: Set up Python 3.11
        if: steps.timecheck.outputs.skip != 'true'
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: "pip"
          cache-dependency-path: app/pipeline/requirements.txt

      - name: Set up Node 22 LTS
        if: steps.timecheck.outputs.skip != 'true'
        uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Install Python deps
        if: steps.timecheck.outputs.skip != 'true'
        working-directory: app/pipeline
        run: pip install -r requirements.txt

      - name: Fetch real data (Python pipeline)
        if: steps.timecheck.outputs.skip != 'true'
        working-directory: app/pipeline
        run: python -m pipeline.run
        continue-on-error: true

      - name: Install engine deps
        if: steps.timecheck.outputs.skip != 'true'
        working-directory: app/engine
        run: npm install

      - name: Generate daily output (hybrid real + synthetic)
        if: steps.timecheck.outputs.skip != 'true'
        working-directory: app/engine
        run: npm run generate-fixture

      - name: Install web deps
        if: steps.timecheck.outputs.skip != 'true'
        working-directory: app/web
        run: npm install

      - name: Build web production bundle
        if: steps.timecheck.outputs.skip != 'true'
        working-directory: app/web
        run: npm run build

      - name: Deploy to Surge.sh
        if: steps.timecheck.outputs.skip != 'true'
        working-directory: app/web
        env:
          SURGE_LOGIN: peter@hoogland.be
          SURGE_TOKEN: ${{ secrets.SURGE_TOKEN }}
        run: |
          npm install -g surge
          surge ./dist les-hautes-alpes-sbi.surge.sh

      - name: Persist cache + doorlopende historie
        if: steps.timecheck.outputs.skip != 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add -f app/data/sbi-cache.json app/pipeline/pending_events.json app/data/history 2>/dev/null || true
          if ! git diff --cached --quiet; then
            git commit -m "chore: persist daily fetch cache + historie [skip ci]"
            git pull --rebase origin main || true
            git push origin main || true
          else
            echo "No cache changes to commit"
          fi
```

### READMEs

#### `README.md`

```markdown
# Les Hautes Alpes · Stressor-Blootstellings-Index (SBI)

Publieke barometer die elke dag opnieuw meet hoe ongewoon de omstandigheden in
België zijn op 20 indicatoren — weer, economie, nieuws, kalender. Niet voor
individuele meting; voor het collectief.

🌐 **Live**: [les-hautes-alpes-sbi.surge.sh](https://les-hautes-alpes-sbi.surge.sh)

## Wat zit waar

```
.
├── 00_Pre-Registratie.md         ← methodologische keuzes, publiek vastgelegd
├── 01_Anker-Paper.md             ← laag 1+2: construct + domeinen
├── 02_Laag-3_Indicator-Selectie.md
├── 03_Laag-4_Operationalisering.md
├── 04_Laag-5_Normalisatie.md
├── 05_Laag-6_Weging.md
├── 06_Laag-7_Aggregatie-en-Drempel.md
├── 07_Laag-8_Validatie-en-Robuustheid.md
├── 08_Onderhoud-Protocol.md
├── 09_Brand-Message-Style-Guide.md
│
├── app/
│   ├── engine/       TypeScript: MAD-Z, STL, winsorize, weights, percentile, tier, CN 1-5
│   ├── pipeline/     Python: 13 data-fetchers (KMI, GDELT live; rest mocked of TODO)
│   ├── web/          React + Vite: publieke barometer, embed-snippet, signal-API
│   └── data/         daily output JSON (regenerated)
│
└── .github/workflows/daily.yml    ← cron 23:00 CET → fetch + build + deploy
```

## Lokaal draaien

```bash
# Engine + tests
cd app/engine && npm install && npm test     # 29 tests, doc 04 §7 reproductie

# Pipeline (Python 3.11+)
cd app/pipeline && pip install -r requirements.txt && python -m pipeline.run

# Combineer pipeline output met synthetische baseline → latest.json
cd app/engine && npm run generate-fixture

# Web-app
cd app/web && npm install && npm run dev
```

## Productie-deploy (handmatig)

```bash
cd app/web && npm run build && npx surge dist les-hautes-alpes-sbi.surge.sh
```

## Automatische dagelijkse update

GitHub Actions cron — zie `.github/workflows/daily.yml`. Vereist één secret:
- `SURGE_TOKEN` (gegenereerd via `npx surge token`)

## Welke indicatoren zijn echt vs mock?

| Tier | Indicatoren | Status |
|---|---|---|
| **A — deterministisch** | I-D1-001 (daglicht), I-D4-001/002 (kalender), I-D6-001/002/003/005 | Altijd echt — 7 stuks |
| **B — werkende real-fetch** | I-D1-002/003 (hitte/kou via open-meteo), I-D5-001 (GDELT), I-D5-002 (Google Trends) | Echt wanneer pipeline draait — 4 stuks |
| **C — scraper TODO** | I-D1-004, I-D2-001/004, I-D3-001/002/003/005/006 | Mock, eerlijk gevlagd — 8 stuks |
| **D — menselijke codering** | I-D5-003 | Leest `pipeline/events.json` — 1 stuk |

Eerlijk gerapporteerd in elke output onder `data_quality.indicators_simulated`.

## Methodologische discipline

- Pre-registratie van drempels, gewichten, formules (doc 00). Geen achteraf-tuning.
- Stijlgids (doc 09) hard-gecodeerd in `app/web/src/copy.ts`. Geen "u bent gestrest".
- 3-dagen-sustained tier-overgang geankerd in cortisol-cyclus-literatuur (doc 06 §3.5).
- Mediacyclus-decorrelatie protocol (doc 03 §4.4) ingebouwd in engine.
- Brand-safety override (doc 06 §7) automatisch in UI én banner-embed.

## Licentie

Methodologie: CC BY 4.0. Code: MIT.
```

#### `app/README.md`

```markdown
# Les Hautes Alpes Anti-Stress Activator

Een publieke barometer die het signaal van de **Stressor-Blootstellings-Index (SBI)**
visualiseert binnen de strikte methodologische en communicatieve grenzen die in de
9 bovenliggende documenten (`00_Pre-Registratie.md` t/m `09_Brand-Message-Style-Guide.md`)
zijn vastgelegd.

> **Implementation stage:** `minimum_viable_pipeline` (conform `03_Laag-4 §5.6`).
> Eerlijk gerapporteerd in elk daily-output-record als `data_quality.implementation_stage`.

## Wat dit is

De SBI is **geen** klinisch instrument, **geen** individuele meting, **geen** peer-reviewed
wetenschap, en **geen** gedragsvoorspeller (doc 01 §3). De barometer toont:

- Tier-stand (groen / oranje / rood) met 3-dagen-sustained-regel
- Percentiel-positie tegen 24-maands voortschrijdende baseline + 2010-2019 vaste referentie
- Top-3 bijdragende domeinen
- 60-daagse sparkline van het percentiel
- Mediacyclus-decorrelatie-diagnostiek (composiet zonder D5)
- Brand-safety-vlag (UI-override bij nationale rouw)
- Datakwaliteit: welke indicatoren gesimuleerd/imputed/missing zijn

## Architectuur

```
   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
   │  pipeline/   │    │   engine/    │    │     web/     │
   │  Python      │──▶ │  TypeScript  │──▶ │  React+Vite  │
   │  fetchers    │    │  methodology │    │  barometer   │
   └──────────────┘    └──────────────┘    └──────────────┘
       raw-values.json   latest.json         /data/latest.json
```

**engine/** is de eenduidige bron-van-waarheid voor de methodologie.
**pipeline/** doet alléén EXTRACT (doc 03 §5.3 stap 1).
**web/** consumeert alléén het daily-output-record en past de stijlgids toe.

## Aan de slag

### 1. Engine + tests

```bash
cd engine
npm install
npm test                  # 23 tests, reproduceert doc 04 §7 voorbeelden
```

### 2. Snelle demo (fixture-data)

```bash
cd engine
npm run generate-fixture  # produceert latest.json met realistische seizoens-mock
cd ../web
npm install && npm run dev
# Open http://localhost:5173
```

### 3. Echte pipeline-run

```bash
cd pipeline
pip install -r requirements.txt
python -m pipeline.run --history-days 730  # 24m historie + vandaag
cd ../engine
npm run compute-daily     # leest pipeline output, draait engine, schrijft latest.json
cd ../web
npm run dev
```

## Welke indicatoren zijn echt vs gemockt?

| Tier | Indicatoren | Bron-status |
|------|-------------|-------------|
| **A — deterministisch** | I-D1-001, I-D4-001/002, I-D6-001/002/003/005 (7 stuks) | NOAA Solar + Belgische kalender — altijd echt |
| **B — real-fetch werkt** | I-D1-002 hitte, I-D1-003 kou | open-meteo (KMI proxy), gratis |
| **B — real-fetch beschikbaar mits token** | I-D5-001 nieuwsneg., I-D5-002 Google Trends | GDELT v2 (no-key), pytrends |
| **C — mock (real-fetch TODO)** | I-D1-004, I-D2-001/004, I-D3-001/002/003/005/006 | scraping/registratie vereist |
| **D — menselijke codering** | I-D5-003 | leest `pipeline/events.json` |

Per indicator wordt eerlijk gerapporteerd of de waarde echt is of gesimuleerd —
zichtbaar in de UI onder "Datakwaliteit" en in elk JSON-record onder `data_quality`.

## Methodologie-discipline

Het project respecteert hard:

1. **Pre-registratie-onveranderlijkheid** (doc 00) — alle drempels, gewichten,
   formules zijn in code bevroren. Wijziging vereist het proces uit doc 08.
2. **Stijlgids** (doc 09) — geen "u bent gestrest", geen klinische taal,
   geen demografische uitsplitsing. Hard-coded in `web/src/copy.ts`.
3. **Mediacyclus-decorrelatie** (doc 03 §4.4) — composiet zonder D5 wordt
   altijd parallel berekend en gerapporteerd.
4. **Brand-safety-override** (doc 06 §7) — wanneer de vlag staat op
   `elevated` of `block`, schorten we de commerciële uitnodiging op
   terwijl de index blijft rapporteren.
5. **Eerlijke vlaggen** — `simulated`, `imputed`, `missing` per indicator
   in het output-record, en `implementation_stage` in elke build.

## Volgende stappen (target architecture)

1. Real-fetch IRCEL-CELINE via WFS-protocol (vereist GDAL)
2. Real-fetch Verkeerscentrum via TomTom Move API als fallback
3. STATBEL CTAS real-fetch met view-ID-discovery
4. ENTSO-E real-fetch (set `ENTSOE_TOKEN`)
5. Statsmodels STL-implementatie in pipeline i.p.v. naive DOY-mediaan
6. Schedule via cron/launchd voor dagelijkse 23:00 CET run
7. Sign + publiceer SHA-256 hash van pre-registratie op OSF (doc 00 §14)
```

#### `app/pipeline/README.md`

```markdown
# SBI Pipeline

Python-pipeline die de 13 non-deterministische indicatoren fetcht.
De 7 deterministische indicatoren (D4, D6, daglicht) berekent de TS engine zelf.

Doc-referentie: `03_Laag-4_Operationalisering.md §5.2 (bronnen) + §5.6 (MVP)`.

## Status per fetcher

| Code     | Indicator                              | Status                         |
|----------|----------------------------------------|--------------------------------|
| I-D1-002 | Hitte (Tmax > 30°C)                    | **REAL** via open-meteo        |
| I-D1-003 | Kou (Tmin < -5°C)                      | **REAL** via open-meteo        |
| I-D1-004 | Luchtkwaliteit                          | mock (IRCEL scraping TODO)     |
| I-D2-001 | Filezwaarte                             | mock (Verkeerscentrum TODO)    |
| I-D2-004 | Brandstofprijzen                        | mock (FOD Economie scrape TODO)|
| I-D3-001 | CPI inflatie                            | mock (STATBEL CTAS TODO)       |
| I-D3-002 | Energieprijzen                          | mock — needs `ENTSOE_TOKEN`    |
| I-D3-003 | Aangekondigde ontslagen                 | mock (FOD WASO scrape TODO)    |
| I-D3-005 | Werkloosheid                            | mock (STATBEL TODO)            |
| I-D3-006 | Hypotheekrente                          | mock (NBB Stat CSV TODO)       |
| I-D5-001 | Nieuwsnegativiteit                      | **REAL** via GDELT DOC v2      |
| I-D5-002 | Google Trends stress-termen             | **REAL** via pytrends (fragiel)|
| I-D5-003 | Collectieve gebeurtenissen              | leest `events.json` (mens-coded)|

Real-fetchers vallen automatisch terug op mock wanneer de bron faalt,
met `simulated: true` in de output — eerlijk per doc 09 §2.

## Run

```bash
pip install -r requirements.txt
python -m pipeline.run                    # fetcht vandaag
python -m pipeline.run --date 2026-05-15  # specifieke datum
python -m pipeline.run --history-days 30  # ook 30 dagen historie
```

Output:
- `app/data/raw-values.json` — vandaag, voor consumptie door de engine
- `app/data/raw-history.json` — wanneer `--history-days > 0`

## Events.json format

```json
[
  { "date": "2026-05-15", "magnitude": 3, "label": "Hypothetisch event" }
]
```

Magnitude conform doc 03 §2.5: 1 (regionaal), 3 (nationaal), 5 (terreur/oorlog/massa-evacuatie).
Codeer-protocol: twee codeurs, κ ≥ 0.75 op 50 historische test-cases vereist voor livegang.
```

---

## 6. Toegang & infrastructuur

- **Repo**: https://github.com/PeterHoogland/lhaa-sbi-barometer-
- **Live**: https://les-hautes-alpes-sbi.surge.sh
- **Hosting**: Surge.sh (statisch). Subdomain `les-hautes-alpes-sbi.surge.sh`. Account: peter@hoogland.be.
- **Cron**: GitHub Actions, dagelijks 08:00 BE-tijd (workflow: `.github/workflows/daily.yml`).
- **Secrets** (in GitHub Repo Settings → Secrets): `SURGE_TOKEN`.

### Collaborators

| Username | Rol |
| --- | --- |
| [PeterHoogland](https://github.com/PeterHoogland) | admin |
| [laurentjune20](https://github.com/laurentjune20) | admin |

### Externe data-endpoints (publiek, geen login)

- https://les-hautes-alpes-sbi.surge.sh/data/latest.json — volledige dagdata
- https://les-hautes-alpes-sbi.surge.sh/data/sparkline-30d.json — 60-dagen-sparkline
- https://les-hautes-alpes-sbi.surge.sh/api/v1/signal.json — compacte signal-API voor banner-embed

### Lokaal draaien

```bash
git clone https://github.com/PeterHoogland/lhaa-sbi-barometer-.git
cd lhaa-sbi-barometer-
cd app/pipeline && pip install -r requirements.txt && python -m pipeline.run
cd ../engine && npm install && npm test && npm run generate-fixture
cd ../web && npm install && npm run dev      # localhost:5173
```

---

*Einde handover-document.*