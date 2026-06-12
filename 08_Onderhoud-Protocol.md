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
| Multicollineariteits-audit (B6, sinds 2026-06-12) | `python3 app/pipeline/analysis/multicollinearity.py`: Spearman-paren ≥ 0,70, PCA-eigenwaarden (Kaiser + participatieratio) en de D5-EWMA-monitor. Nieuwe paren boven de drempel of een dalende effectieve dimensionaliteit → agendapunt gewichten-review (amendement vereist; geen stille herweging). Rapport: `app/data/analysis/multicollinearity.json`. |
| Gevoeligheidsanalyse (B4, sinds 2026-06-12) | `python3 app/pipeline/analysis/sensitivity.py`: Monte-Carlo over methodekeuzes + Sobol'-indices. Stijgende spread of een dominante factor → bespreken vóór elke methodologie-release. |

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

## 1-bis. Zelfcontrole-, zelfherstel- en alarmeringsarchitectuur (live-systeem, stand 2026-06-12)

Het live-systeem controleert en herstelt zichzelf in lagen; alleen wat geen enkele laag kan herstellen, bereikt een mens. Volledig computer-onafhankelijk (GitHub-cloud + Cloudflare).

**Laag 0 — aansturing (uurlijks, 06-20u BE):** Cloudflare Cron-Worker `lhaa-sbi-cron` trapt `daily.yml` exact op tijd af; GitHub's eigen schedule blijft als dead-man's-switch. Elke run: bronnen ophalen → verwerken → verrekenen → publiceren → live verifiëren.

**Laag 1 — per bron, zelfherstel (fetcher-ladder):** live → cache (eerlijke `observation_date`, gemarkeerd "degraded") → mock (gemarkeerd `simulated`). Een haperende bron breekt de run nooit; de degradatie is altijd zichtbaar gelabeld, nooit stil.

**Laag 2 — per run, zelfcontrole (healthcheck-canary):** controleert per bron verse échte data + of de index effectief gevoed is (composiet, percentiel, 25 indicatoren). Verdict `ok`/`degraded`/`critical` in `health-report.json` (deployt mee). `critical` markeert de run bewust rood.

**Laag 3 — na publicatie (verify_live):** haalt de LIVE site op en controleert het eindresultaat: vers, 25 indicatoren, composiet = som van de contributies, niets stil gesimuleerd (HARDE EIS in live-modus), canary niet kritiek. Faalt → run rood.

**Laag 4 — bewaker-van-de-bewaker (monitor.yml, elke 20 min):** onafhankelijke cron; ziet hij stilstand of een gefaalde laatste run → **hertriggert hij daily.yml zelf** (zelfherstel van gemiste/gefaalde updates, hersteltijd ≤ ~20 min). Structurele problemen (inconsistent cijfer, kritieke canary, vangrail) = hard alarm, geen stille hertrigger-lus. Optionele agentische laag (Claude-gezondheidslezing) achter het secret `ANTHROPIC_API_KEY` — oordeel bóvenop de meting, nooit in plaats van.

**Laag 5 — alarmering naar een mens (sinds 2026-06-12, `pipeline/alert.py`):** vuurt uitsluitend op de "niet automatisch hersteld"-categorie: élke stapfaal in daily.yml en élk hard monitor-probleem. Kanaal-ladder:
1. directe **SMTP-mail naar peter@hoogland.be** — vereist secrets `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (optioneel `SMTP_PORT`, default 587 STARTTLS; bv. Gmail-app-wachtwoord);
2. `ALERT_WEBHOOK_URL` (Zapier/Make → e-mail), bestond al voor de canary;
3. vangnet zonder secrets: één **rollende GitHub-issue** (anti-spam-dedupe, sluit bij herstel) + de rode run zelf → GitHub-notificatiemail.

**Activatie van de directe mail** = drie secrets zetten: `gh secret set SMTP_HOST SMTP_USER SMTP_PASS`. Tot die gezet zijn, zegt de alarmstap dat expliciet in de log en dragen issue + rode run het alarm.

**Bewuste grens:** geen enkele laag wijzigt code of data om "zichzelf te fixen" — herstel beperkt zich tot hertriggeren en eerlijke degradatie-labels. Een echte bug fixt een mens; automatische zelfmodificatie zou de pre-registratie-discipline (§5) ondermijnen.

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
