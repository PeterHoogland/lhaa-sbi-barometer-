# MASTERDOCUMENT v0.4 — methodologie-addendum & amendementen

Uitgevoerd 2026-06-01. De tien basis-documenten (`00_Pre-Registratie.md` … `09_Brand-Message-
Style-Guide.md`) en de v0.4/v0.5-programmeerrichtlijnen (in de oude `MASTERDOCUMENT.md` §2-3)
blijven geldig. Dit addendum legt vast wat in deze sessie methodologisch is veranderd of
toegevoegd, met de bijbehorende discipline-verantwoording. Bestemd voor verificatie.

---

## A. v0.4 meet- + trigger-laag (geïmplementeerd, parallel naast v0.2)

Conform de v0.4-programmeerrichtlijn (HANDOVER §2). Kernpunten van de implementatie:

- **Dubbele baseline per kern-indicator** (MAD-Z): `z_kort` (rollend ~18m, gevoelig → spikes)
  en `z_lang` (rollend langst-beschikbaar, cap 120m, betrouwbaar → niveaus). Lookahead-vrij.
- **Twee gewichtssets:** `w_meting` = bewijslast×reikwijdte; `w_trigger` = ×snelheidsfactor.
- **`composite_meting`** = Σ(w_meting·z_lang) over de 9 kern-codes; **achtergrond** = idem over
  de trage grondlast (energie/brandstof/inflatie); **load_factor** = clamp(1−0,15·achtergrond,
  0,6, 1,0) moduleert de trigger-drempels.
- **Trigger-engine** (test-modus, require_manual_approval): T1 spike, T2 rood, T3 composiet,
  met cooldown/confirmatie/brand-safety.

**Discipline:** dit is **additief** — de pre-geregistreerde v0.2-composieten (equal/evidence/
demographic, 24 indicatoren) blijven onveranderd berekend en gepubliceerd. Niets verwijderd →
geen wijziging aan de pre-registratie, dus geen 30-dagen-amendement vereist (zoals Schema 3
destijds parallel werd toegevoegd). Geratificeerd door de eigenaar.

---

## B. AMENDEMENT — I-D5-003 "Grote collectieve gebeurtenis" geherdefinieerd via GDELT

**Status: pre-registratie-amendement** (doc 00 §13, grond **A2** — indicator(her)definitie door
datatoegang). Expliciet door de eigenaar goedgekeurd ("gdelt ja, bouwen").

- **Oud:** mensen-gecodeerde gebeurtenissen (RSS-detectie + `events.json`, κ-vereiste). Géén
  historie, niet backfillbaar.
- **Nieuw:** GDELT-volume-intensiteit van zware-negatieve thema's (WAR/ARMEDCONFLICT/TERROR/
  KILL/NATURAL_DISASTER/MANMADE_DISASTER) in Belgisch nieuws, via GDELT DOC 2.0 `mode=timelinevol`
  — dezelfde bron-familie als de nieuwstoon (#1). Backfillbaar tot ~2017; nu 1960 dagen (2021→nu).
- **Eerlijke beperking:** dit is een **proxy** (gemeten media-intensiteit van zware
  gebeurtenissen, niet menselijk-geoordeelde significantie). GDELT-codering is enigszins ruizig.
  Voordeel: echt, lang, automatisch, schaal-consistent (dagfetch én baseline beide GDELT-volume).
- De RSS-scan blijft lopen voor `pending_events.json` (menselijke review/transparantie), maar
  bepaalt niet langer de score. Gedocumenteerd in de bron-string van de fetcher.

---

## C. Brandstof I-D2-004 — bron herzien (ECB i.p.v. be.STAT-historie)

Geen indicator-herdefinitie (blijft "pompprijs €/l"), wél een **bron-correctie** voor de baseline:
- be.STAT (Statbel/FOD Economie) geeft **alleen de prijs van vandaag** (bevestigd op CI: 1 rij),
  géén historie.
- Baseline nu = **ECB HICP-brandstofindex** (CP07.2.2, BE, 1996→nu), **verankerd op het actuele
  be.STAT-pompprijsniveau**: €/l(maand) = anker × index(maand)/index(laatste). Schaal-consistent
  met de dagelijkse be.STAT-waarde. De historische €/l zijn HICP-afgeleide schattingen
  (eerlijk gelabeld), reëel van vorm (de energiecrisis-2022-piek zit erin).
- **2022-piek blijft bewust in de baseline:** MAD-Z is robuust (piek verschuift de mediaan amper;
  effect op de z van vandaag ≈ +0,2 bij weghalen). z_kort (18m, bevat 2022 niet) vangt de
  recente stijging al. Weghalen zou cherry-picking zijn (doc 00 §13 verbiedt "wijziging omdat
  het signaal niet uitkomt zoals we willen"). Behouden = crisis-bewuste lange baseline (§2).

---

## D. PRESENTATIE-keuze — de v0.4-kern is de publieke hoofd-meting

Het grote publieke cijfer/kleur/tekst draaien nu op `composite_meting` i.p.v. de v0.2-24-meting.
- **Conditie-Niveau (CN 1-5) komt INSTANT uit het kern-percentiel** (`percentile.lang`, tegen
  ~2 jaar): ≥90→4, ≥60→3, ≥40→2, <40→1 (+ brand-safety→5). Bewust géén sustained-na-ijling in de
  kop (anders toont de kop "verhoogd" op een kalme dag). De sustained v0.4-tier (`computeV04Tier`)
  blijft als diagnostiek in het technische paneel.
- **Discipline:** dit is een **presentatie-keuze** (beide metingen blijven berekend + gepubliceerd),
  geen verwijdering van de pre-geregistreerde v0.2-meting. Geratificeerd ("kern wordt de kop").
- **Percentiel-venster ~2 jaar (730 dagen):** kritisch. Tegen 60 dagen kwam een neutraal composiet
  (0,05) op P98 → vals "uitzonderlijk", en de "afgelopen twee jaar"-tekst klopte niet. Nu eerlijk.

---

## E. KALIBRATIE — gevoeligheid (backtest-onderbouwd, nog te bevriezen)

Backtest over 742 dagen toonde: de oude (v0.2-stijl, 3-dagen-sustained) tier stond 97,7% groen;
de trigger-laag vuurde te vaak (555 triggers/2j, 392 reds). Kalibratie van de NOG-NIET-bevroren
v0.4-laag (spec §8 schrijft kalibratie-dan-bevriezen voor — dus géén pre-registratie-schending):
- **Zichtbare tier:** oranje 1 dag ≥P60, rood 2 dagen ≥P90 (eigen `computeV04Tier`, los van de
  pre-geregistreerde v0.2-tier). Op de vollere kern: ~27% oranje (zichtbare beweging, eerlijk in
  een stressvol tijdperk), ~4% rood (uitzonderlijk = geloofwaardig alarm).
- **Triggers getemd:** per-indicator-rood (T2) vanaf **P95** (was P90); cooldown 48/72u. Backtest
  na: 555→254 triggers, reds 392→98 (→ webhook-veilig).
- **Discipline-grens:** "agressiever" is gericht op ZICHTBARE gevoeligheid waar bewijs (backtest)
  toont dat het te conservatief stond. Niet "opkrikken om een hoger cijfer te tonen" — expliciet
  afgewezen waar het signaal eerlijk laag is (zie de fuel-piek-analyse, §C). Alle waarden moeten
  vóór livegang via de volledige backtest bevroren worden (§8).

---

## F. AMENDEMENT — I-D2-001 "Filezwaarte" geherdefinieerd (officiële jaarmaat) + grondlast/T2

**Status: pre-registratie-amendement** (doc 00 §13, grond **A2** — indicator(her)definitie door
datatoegang). Goedgekeurd door de eigenaar ("Pad A: echt maar traag").

- **Oud:** homepage-scrape van het momentane aantal km file × 60 — een toegegeven proxy op een
  andere schaal, zonder historische baseline (de oude history waren 3 ruis-punten: 110/0/2282).
- **Nieuw:** de OFFICIËLE filezwaarte (filelengte × fileduur, km·uur/werkdag) uit de jaarrapporten
  "Verkeersindicatoren Snelwegen Vlaanderen" van het Vlaams Verkeerscentrum — exact de
  tijds-geïntegreerde maat die doc 03 §2.1 voorschreef. Baseline = de echte jaarreeks 2013-2024
  (604→952, Jaarrapport 2024 Tabel 10), maandelijks piecewise-constant geprojecteerd (144 punten)
  zodat de engine ≥60 punten heeft en tegen een echte ~12-jaars-verdeling weegt.
- **Waarom geen dagdata:** er bestaat GÉÉN publiek machine-leesbare historische filezwaarte-reeks.
  De webtool (indicatoren.verkeerscentrum.be) is interactief (geen API/CSV/JSON), DATEX II is
  realtime-only, het Vlaams Dataportaal Verkeersgegevens vereist Itsme-auth — bevestigd via
  deep-research (juni 2026); de datacatalogus verwijst voor automatische toegang naar de uitgever.
  Een fragiele scrape van de interactieve tool is bewust vermeden (dezelfde discipline die de
  oude homepage-scrape afkeurde).
- **Reclassificatie:** verkeer schuift van ⚡ direct → 🐢 **traag + grondlast** (ACHTERGROND_CODES).
  De record-hoge filezwaarte (2024 = +57,6% t.o.v. 2013) is een structurele last die de achtergrond
  laadt, net als energie/brandstof/inflatie. `applyStl=false` (een jaarmaat heeft geen sub-jaar-
  seizoen). Tussen jaarrapporten houdt de indicator het laatste jaargemiddelde vast.
- **T2-uitsluiting (§3.3-consequentie):** grondlast-bronnen vuren niet langer hun eigen
  `indicator.red` (T2). Reden: verkeer staat op P~94 én verlaagt als grondlast de rood-drempel
  (95 → ~88 via load_factor) — dat zou verkeer dan zélf vangen = dubbeltelling. §3.3 zegt expliciet
  dat grondlast de drempel LAADT i.p.v. zelf te vuren; een grondlast-crisis komt nu via T3
  (composiet) naar buiten. Geldt ook voor brandstof/inflatie/energie. Empirisch: verkeer leest
  state "rood" (z_lang 4,4 / P94 — eerlijk: structureel record), laadt de achtergrond (0,46), maar
  vuurt 0 triggers; de kop blijft kalm (CN 1).
- **Methodebreuk 2024:** het Verkeerscentrum wijzigde de rekenmethode in 2024 — 952 is niet
  1-op-1 met 2013-2023. MAD-Z is robuust tegen dat ene punt (zie de fuel-piek-redenering, §C).
- **Eerlijk gelabeld** in de fetcher-bron-string + plain-language (unit "km·uur/werkdag"; reads
  verwijst naar het officiële jaargemiddelde). Backfill: `scripts/backfill_verkeer_baseline.py`
  (geen netwerk — de jaartabel staat in `verkeerscentrum.py`, één bron van waarheid).

---

## H. v0.5-sessie (2026-06-01 avond) — webhook, hosting, presentatie

Operationele + presentatie-wijzigingen; géén wijziging aan de pre-geregistreerde meting.

- **Campagne-webhook (trigger-uitgang).** `app/engine/src/webhook.ts` POST't `v04.triggers[]` naar
  `CAMPAIGN_WEBHOOK_URL` (schema `lhaa-sbi-webhook/v1`); leeg → dry-run. Nog géén endpoint gekoppeld.
  Triggers blijven `mode: test` (require_manual_approval reist mee). Breekt nooit de build.
- **Hosting Surge → Cloudflare** (Workers static assets, `app/web/wrangler.jsonc`). Reden: Surge's
  CDN-edge serveerde gecachte oude deploys (~27 min, negeerde `must-revalidate`) → bezoekers zagen de
  oude bundel. Cloudflare honoreert `must-revalidate` + propageert instant. Dagelijkse cron deployt nu
  auto naar CF (token = repo-secret `LESHAUTES`). Surge nog als tijdelijk vangnet.
- **Presentatie (discipline-conform — beide metingen blijven berekend):** paginabrede hero-foto
  (echte hautes-alpes.net-foto) op de zijkanten, nooit ín de witte info-blokken; kleuren in het
  cijfer-blok evolueren met het niveau (groen→amber→rood); mobiele versie; slanke header + tekst-
  opschoning; panel-volgorde/labels.
- **Trage structurele indicatoren uit de "WAT SPEELT VANDAAG"-top-3** (presentatie-keuze): verkeer
  (jaarmaat), brandstof + inflatie (maandmaat) tonen niet meer in de "wat speelt vandaag"-lijst —
  die toont dagbeweging, niet structurele jaar/maand-niveaus. Reden: verkeer's jaarrecord las als
  "er staat nú file" (verwarrend om 23:35). De indicatoren blijven in de kern-/technische weergave.
- **Kalibratie-review** (backtest 742d: ~2×/maand `composite.red`, 5,3% rode dagen) gedaan, maar
  drempels NIET bevroren en NIET op live — pas ná méér échte live-historie + een Zapier-endpoint
  (spec §8: kalibreren-dan-bevriezen; discipline-conform, geen voortijdige bevriezing op backfill).

---

## G. Vijf vergeten vragen voor de adversariële reviewer

1. Is een GDELT-volume-proxy voor "grote gebeurtenis" niet té gevoelig voor mediacyclus-ruis
   t.o.v. de oude menselijke codering? (Counter: de cluster-/cooldown-remmen + de lange baseline
   dempen ruis; en de oude indicator had geen historie om tegen te toetsen.)
2. De kern-percentiel-verdeling is laag-scheef (mediaan ~25) — vertekent dat de CN-bands?
   (Te monitoren: de bands zijn op die verdeling gekozen; herijken bij drift.)
3. Maakt het verankeren van de ECB-index op de be.STAT-dagprijs de historische €/l "echt genoeg"
   om als baseline te dienen, of is het een gladde schatting die crisis-volatiliteit onderschat?
4. De v0.4-drempels zijn op ~2 jaar echte kern-historie gekalibreerd (deels nog dun voor de
   snelle bronnen) — houden ze stand als de forward-historie volloopt? (Backtest opnieuw, dan bevriezen.)
5. Is een 12-punts JAARreeks (maandelijks geprojecteerd) een eerlijke baseline voor een dagelijkse
   barometer, of suggereert de maand-projectie precisie die er niet is? (Counter: de waarde is
   expliciet een jaarmaat, verkeer is nu traag/grondlast — geen dag-signaal — en wordt zo gelabeld.
   Verrijking naar echte maanddata vereist contact met de uitgever (wegen.verkeer@mow.vlaanderen.be);
   open punt. Het alternatief — een interactieve tool scrapen — schendt de "echte data"-discipline.)
