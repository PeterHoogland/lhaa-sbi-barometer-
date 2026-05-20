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
