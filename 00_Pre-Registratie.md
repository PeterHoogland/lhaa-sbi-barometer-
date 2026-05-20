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
