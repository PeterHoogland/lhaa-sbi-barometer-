# MASTERDOCUMENT — Stressor-Blootstellings-Index (SBI)

**Project:** Les Hautes Alpes · Anti-Stress Activator (barometer)
**Versie:** SBI v0.2 (24 indicatoren, 6 domeinen)
**Live:** https://les-hautes-alpes-sbi.surge.sh
**Repo:** https://github.com/PeterHoogland/lhaa-sbi-barometer-
**Uitgevoerd:** 2026-05-31

Dit document bundelt de volledige methodologische verantwoording:
pre-registratie, anker-paper, de zes lagen (indicator-selectie tot
aggregatie en drempel), het onderhoudsprotocol en de stijlgids.
Bestemd voor wetenschappelijke verificatie.

Een apart `TOEGANG-EN-INFRASTRUCTUUR.md` document bevat alle praktische
informatie: links, accounts, secrets, externe bronnen, build-instructies.

---

## Inhoud

1. **00_Pre-Registratie**
2. **01_Anker-Paper**
3. **02_Laag-3_Indicator-Selectie**
4. **03_Laag-4_Operationalisering**
5. **04_Laag-5_Normalisatie**
6. **05_Laag-6_Weging**
7. **06_Laag-7_Aggregatie-en-Drempel**
8. **07_Laag-8_Validatie-en-Robuustheid**
9. **08_Onderhoud-Protocol**
10. **09_Brand-Message-Style-Guide**

---

# 00_Pre-Registratie

*Bronbestand: `00_Pre-Registratie.md`*

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

# 01_Anker-Paper

*Bronbestand: `01_Anker-Paper.md`*

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

# 02_Laag-3_Indicator-Selectie

*Bronbestand: `02_Laag-3_Indicator-Selectie.md`*

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

# 03_Laag-4_Operationalisering

*Bronbestand: `03_Laag-4_Operationalisering.md`*

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

# 04_Laag-5_Normalisatie

*Bronbestand: `04_Laag-5_Normalisatie.md`*

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

# 05_Laag-6_Weging

*Bronbestand: `05_Laag-6_Weging.md`*

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

# 06_Laag-7_Aggregatie-en-Drempel

*Bronbestand: `06_Laag-7_Aggregatie-en-Drempel.md`*

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

# 07_Laag-8_Validatie-en-Robuustheid

*Bronbestand: `07_Laag-8_Validatie-en-Robuustheid.md`*

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

# 08_Onderhoud-Protocol

*Bronbestand: `08_Onderhoud-Protocol.md`*

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

# 09_Brand-Message-Style-Guide

*Bronbestand: `09_Brand-Message-Style-Guide.md`*

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
