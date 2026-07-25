# MEDIA-OVERZICHT — SBI-barometer (Vlaams/NL)

**Doel:** vastleggen welke media de SBI vandaag leest, hoe ze gewogen worden, en
welke uitbreiding we doen (onderstroom + kleinere Vlaamse media + emotie-analyse).
**Scope-beslissing (Peter, 2026-06-02):** **alleen Vlaamse/Nederlandstalige bronnen.**
Geen RTBF/Le Soir/La Libre. GDELT dekt FR wel mee in zijn landelijke aggregaat,
maar de RSS-/emotie-laag is bewust NL.
**Plaats in het model:** alle media-signalen leven in de **trigger-/signaallaag**,
**niet** in het publieke 1–5-cijfer (media-toon ≠ bevolkingsstress — review §3,
grade-D). Ze sturen de campagne-trigger en de expert-/onderstroom-weergave.

---

## 1. Wat er VANDAAG draait

### 1.1 Nieuwstoon — I-D5-001 (grade-D → uit het cijfer, blijft trigger/diagnostisch)
| Laag | Bron | Methode |
|---|---|---|
| **Schaal-aandrijver** | **GDELT DOC 2.0 timelinetone** (`sourcecountry:BE`, NL+FR) | `negativiteit = −AvgTone`, 3-daags venster, echte 24m-baseline (MAD-Z) |
| **Controle/descriptief** | **13 Vlaamse RSS-feeds** (zie 1.4) | Pattern.nl-valentielexicon per headline+lead → near-dup-dedup (Jaccard ≥0.8) → **bron-poststratificatie** naar leeftijdspubliek |

De RSS-laag levert ook de **top-10 negatiefste headlines** en een gesegmenteerde
lezing (negativiteit jong/midden/ouder). Dit is descriptief in de bronvermelding;
GDELT stuurt de eigenlijke schaal.

### 1.2 Collectieve gebeurtenissen — I-D5-003 (grade-B → telt mee in het cijfer)
| Laag | Bron | Methode |
|---|---|---|
| **Score** | **GDELT DOC 2.0 timelinevol** | volume-intensiteit van zware negatieve thema's: `WAR / ARMEDCONFLICT / TERROR / KILL / NATURAL_DISASTER / MANMADE_DISASTER / CRISISLEX` |
| **Transparantie** | **8 Vlaamse RSS-feeds** | magnitude-keywords (1/3/5) → kandidaten naar `pending_events.json` → **menselijke review** → `events.json` |

> ⚠️ Hier zit het **skeyes-gat**: een staking / sociale onrust valt buiten de
> GDELT-thema's (geen `PROTEST/STRIKE`) én buiten de magnitude-keywords
> (geen "staking/sociale onrust/betoging"). Wordt dus **niet** geregistreerd.

### 1.3 Onderstroom / secundair (níét in het cijfer)
| Indicator | Bron | Status |
|---|---|---|
| I-D5-002 | **Wikipedia-pageviews** (NL stress-thema's) | grade-D, publieke aandacht |
| I-D5-002 legacy | **Google Trends** (`geo=BE`) | fragiel (Lazer 2014), vaak cache-fallback |
| I-D5-006S | **Reddit r/belgium** | jong/stedelijk skew, expliciet secundair |
| I-D3-003S | **Ontslag-radar** | telt BE-nieuwsartikels over collectieve ontslagen |

### 1.4 De 13 Vlaamse RSS-bronnen + publieksprofiel
Bron-niveau poststratificatie (`media_profiles.py`): per medium een geraamd
leeftijdspubliek [jong 18-34 / midden 35-54 / ouder 55+] en relatief bereik
(CIM/Digimeter/mediakits — **ramingen**, geen panel).

| Sleutel | Bron | Bereik | jong / midden / ouder |
|---|---|---|---|
| hln | Het Laatste Nieuws | 10.0 | 0.30 / 0.34 / 0.36 |
| vrtnws | VRT NWS | 9.0 | 0.22 / 0.33 / 0.45 |
| sporza | Sporza | 6.0 | 0.34 / 0.36 / 0.30 |
| standaard | De Standaard | 4.0 | 0.20 / 0.38 / 0.42 |
| hbvl | Het Belang van Limburg | 4.0 | 0.20 / 0.32 / 0.48 |
| demorgen | De Morgen | 3.0 | 0.26 / 0.40 / 0.34 |
| tijd | De Tijd (ondernemen) | 3.0 | 0.22 / 0.44 / 0.34 |
| knack | Knack | 2.5 | 0.18 / 0.38 / 0.44 |
| trends | Trends | 2.0 | 0.22 / 0.44 / 0.34 |
| bruzz | Bruzz | 1.5 | 0.34 / 0.38 / 0.28 |
| businessam | Business AM | 1.5 | 0.30 / 0.42 / 0.28 |
| eos | Eos | 1.0 | 0.30 / 0.38 / 0.32 |
| newsmonkey | Newsmonkey | 1.0 | 0.62 / 0.26 / 0.12 |
| reddit | Reddit Belgium (secundair) | 1.0 | 0.68 / 0.26 / 0.06 |

---

## 2. UITBREIDING (te bouwen) — Vlaams/NL

### 2.1 Emotie-laag bovenop de valentie  ⭐ (jouw idee — "headlines bepalen veel in de stressvorming")
Vandaag = één as (**hoe negatief**). Nieuw = **welke emotie**. Per dag een score op
de stress-relevante emoties uit het nieuws:
- **woede / verontwaardiging**, **angst / onzekerheid**, **verdriet / machteloosheid**, **walging / afkeer**.

**Methode (start, pragmatisch):** NRC Emotion Lexicon — Nederlandse variant
(Mohammad & Turney 2013; de code noemt dit al als geplande stap) op headline+lead
van dezelfde Vlaamse RSS-corpus. Latere upgrade: RobBERT (NL-BERT) fine-tuned op
emotie voor zinscontext.
**Plaats:** trigger-/signaallaag. Een scherpe woede-/angst-piek → campagnesignaal
(`emotie.spike`), niet het 1–5-cijfer. Wetenschappelijke haak: Soroka/Fournier/Nir
2019 (negativity bias, psychofysiologische respons), Marin 2012 (reactiviteit).

### 2.2 Pad voor sociale onrust (skeyes-type)
- **GDELT-thema's** uitbreiden met `PROTEST` (en waar zinvol staking-/blokkade-codes).
- **Magnitude-keywords** in `events.py` uitbreiden: *staking, sociale onrust,
  betoging, blokkade, vakbondsactie, stilgelegd, lamgelegd*.
- Effect: een skeyes-staking wordt minstens een **pending-kandidaat** + telt mee in
  de gebeurtenis-intensiteit, i.p.v. onzichtbaar te blijven.

### 2.3 Méér Vlaamse media (mainstream + kleiner) + onderstroom
**Nieuws — toe te voegen (RSS, NL):**
| Sleutel | Bron | Type | Haalbaarheid |
|---|---|---|---|
| nieuwsblad | Het Nieuwsblad | mainstream, grote reach | RSS ✅ |
| gva | Gazet van Antwerpen | regionaal (Antwerpen) | RSS ✅ |
| kw | Krant van West-Vlaanderen | regionaal (West-Vl.) | RSS ✅ |
| nina/… | (regionale VRT/Radio 2) | regionaal | RSS ✅ |
| apache | Apache | onderzoek/onafhankelijk | RSS ✅ |
| doorbraak | Doorbraak | opinie (rechts-Vlaams) | RSS ✅ |
| dewereldmorgen | De Wereld Morgen | opinie (links/activistisch) | RSS ✅ |
| mo | MO* Magazine | mondiaal/sociaal | RSS ✅ |

> Opinie-bronnen (Doorbraak/De Wereld Morgen) bewust van **beide flanken** zodat de
> toon niet politiek scheeftrekt; ze krijgen een laag bereik-gewicht.

**Onderstroom — toe te voegen / uit te breiden (NL):**
| Bron | Wat | Haalbaarheid |
|---|---|---|
| Reddit r/belgium **+ r/Vlaanderen + r/belgium2 + r/brussels** | sentiment/volume-pieken | gratis OAuth ✅, demografische disclaimer blijft |
| Google Trends `geo=BE-VLG` | zoekpieken stress-termen | pytrends, rate-limited ⚠️ |
| Wikipedia NL (uitbreiden naar 15-20 stress-artikels) | leesaandacht | API ✅ |
| X/Twitter BE-trends | publieke onrust | API betaald/lastig ⚠️ (later) |
| TikTok/Instagram BE | jongeren-onderstroom | geen bruikbare gratis API ❌ (later) |

---

## 3. Bouwvolgorde — status 2026-06-02
1. ✅ **D-grade-rijen uit de expert-lijst** — live.
2. ✅ **Fase 2-rest §6 copy-deck** live; **§2.1 rename teruggedraaid** (naam blijft
   "Stressor-Blootstellings-Index"; "Stress-invloeden" geparkeerd).
3. ✅ **Emotie-laag gebouwd + gedeployed:**
   - **Emotie-scoring** (woede/angst/verdriet/walging) op de headlines — `lexicon_emotion_nl.py`.
   - **Onrust-pad** (skeyes-type) — `events.py` keywords; skeyes wordt nu kandidaat.
   - **A (confirmation)** — `I-D5-emotie` versterkt nieuws-spikes (live).
   - **B (vurende trigger)** — `emotie.spike`, gated op ≥20 dagen eigen historie (bouwt op vanaf nu).
   - **Media-uitbreiding** — Nieuwsblad, GvA, De Wereld Morgen (geverifieerde feeds; Doorbraak/MO*/Apache
     gaven geen bruikbare feed → weggelaten).

**Open / volgende:** GDELT `PROTEST/STRIKE`-thema's in de I-D5-003-**score** (pre-registratie-amendement →
vereist re-backfill van de I-D5-003-baseline, daarom bewust apart); extra subreddits (r/Vlaanderen, r/brussels).

*Bijgewerkt: 2026-06-02. Hoort bij HANDOVER-V6.*
