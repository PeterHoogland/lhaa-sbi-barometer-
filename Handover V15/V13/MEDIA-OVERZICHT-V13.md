# MEDIA-OVERZICHT-V13 — Bronnenlandschap (deltas sinds V12)

Begeleidt `HANDOVER-V13.md`. MEDIA-OVERZICHT-V12 blijft geldig (GDELT/RSS/lexicons/OV); dit doc = de bron-wijzigingen van deze sessie (2026-06-04, "alle bronnen Belgisch").

## Bron-nationaliteit: status na deze sessie
| Indicator | Was (EU-model) | Nu | Belgisch? |
|---|---|---|---|
| **Luchtkwaliteit I-D1-004** | open-meteo CAMS | **IRCELINE** | ✅ gemeten |
| **Wateroverlast I-D1-009** | open-meteo GloFAS | **VMM + SPW** | ✅ gemeten (incl. Wallonië) |
| **Pollen I-D1-010** | open-meteo CAMS | CAMS in cijfer (eerlijk EU-label) + **Sciensano als secundair** | ⏳ Belgisch signaal stroomt; cijfer-promotie ~aug |

## 1. IRCELINE — luchtkwaliteit (I-D1-004), Belgisch
- SOS REST-API `https://geo.irceline.be/sos/api/v1/timeseries/{ts_id}/getData` (geen sleutel). `?last=true` (recent venster) of `?timespan=START/END` (historie, backfillbaar).
- Brusselse tijdreeksen: **NO2 6504** (Arts-Loi), **O3 6625** (Ukkel; 6517 Parlement ligt stil), **PM10 6626** (Ukkel). Composiet = max(NO2/25, O3/100, PM10/45) tov WHO 2021; ≥2 van 3. Baseline her-backfilled (774 dagen).

## 2. VMM + SPW — wateroverlast (I-D1-009), Belgisch + Wallonië
KISTERS KiWIS, geen sleutel, JSON. Som dag-debiet (m³/s, `getTimeseriesValues&ts_id=...&from=&to=`):
- **VMM** (`https://download.waterinfo.be/tsmdownload/KiWIS/KiWIS`): Dijle@Wilsele `0168407042`, Demer@Bilzen `0168901042` (dag-ts `DagGem`).
- **SPW** (`https://hydrometrie.wallonie.be/services/KiWIS/KiWIS`): Vesdre@Verviers `284632010`, Ourthe@Tabreux `297962010` = 2021-flood-rivieren (dag-ts `20-Debit.Jour.Moyen`). SPW eerst op haalbaarheid getest (no-key JSON, historie aanwezig).
- Alleen dagen met alle 4 (90/90 coverage); baseline backfilled (764 dagen, mediaan 23, max 264 = flood-spikes).
- Uitbreidbaar: meer SPW-stations (Chaudfontaine Pont 370173010/Pisc 298610010, Sauheid 297818010, Martinrive, Angleur) + meer VMM (Nete/Zenne/Mark/IJzer; getTimeseriesList parametertype Q ts_name DagGem).

## 3. Sciensano AirAllergy — pollen (I-D1-010-sci), Belgisch, SECUNDAIR
- Verborgen open ASP.NET JSON-API `https://airallergy-api.sciensano.be/api/stationmeasurement?stationId=<guid>&language=nl` (geen sleutel; één call geeft ALLE 5 stations). `language` is verplicht. Velden: `measurements[].allergen.allergenCategory` ("Pollen"/"Spore"), `allergen.allergenName`, `valueInNumber` (grains/m³, **−1 = geen meting**), `measurementDate`.
- Station-GUIDs: Brussel `0ff00a3c-c4b8-4061-9814-6568347ea42b`, Genk `b668468b-840c-4c1d-86e6-b79af5ac4ed7`, De Haan `30c5a5c1-d810-40b3-b453-807ef717d204`, Marche `ba84d601-43ba-4a88-bfb9-805357d975c2`, Baudour `083855b7-9734-41d0-aba0-b285de42a854`.
- **GEEN historie-API** (alleen vandaag) → niet backfillbaar; baseline bouwt VOORUIT op via append_to_history. Geen Ambrosia in het BE-net. Data lagt 1-3 dagen (key op `measurementDate`). Ongedocumenteerd → canary bewaakt het (kan veranderen). Promotie naar het cijfer: geplande beoordeling 8 aug (zie TOEGANG-V13 §5). Andere portalen (data.gov.be, ODWB, EAN/polleninfo) hebben GEEN Belgische pollen-API (getest).

## 4. Vondsten / open
- **CPI (I-D3-001)** vast op dec 2025 (ECB SDW + Eurostat publiceren niet verder) — geen code-fix; overweeg Statbel-direct.
- **GDELT (I-D5-001/003)** recurrent flaky → cache-terugval (nu zichtbaar "verouderd" + canary degraded).
- Eerlijke nuance: pollen via Sciensano is seizoensgebonden (applyStl:false) — bij promotie weegt 60 zomerdagen anders dan CAMS' jaarrond-baseline.


---

> # === Volledige MEDIA-OVERZICHT-V12-inhoud hieronder (ongewijzigde achtergrond, blijft geldig). De V13-updates hierboven hebben voorrang. ===

# MEDIA-OVERZICHT-V12 — Bronnenlandschap

Begeleidt `HANDOVER-V12.md`. De volledige inventaris van wat de barometer inleest na de V12-sessie, plus de research-bevindingen (3 agent-onderzoeken) over wat nog kan.

## Hoe media het cijfer voedt (niet-triviaal, vaak verkeerd onthouden)
- **Het GESCOORDE nieuws-cijfer (I-D5-001) = GDELT DOC v2 timelinetone** (`sourcecountry:BE`, NL+FR, duizenden bronnen via GDELT). De directe RSS-feeds voeden het cijfer NIET; ze voeden (a) de **poststratificatie-controle-lezing** (demografische segmentatie jong/midden/ouder), (b) de **emotie-/verdriet-signalen**, (c) de **reach-gewogen RSS-negativiteit** (`I-D5-001-rss`), (d) de **kandidaat-gebeurtenis-detectie** (`events.py` → `pending_events.json`).
- **I-D5-003 (gebeurtenissen) = GDELT-volume** van zware thema's; de RSS-keywords voeden enkel `pending_events.json` (menselijke review).
- **Reach-weging bestaat** in `media_profiles.poststratify` (per bron `reach` × leeftijdsprofiel) maar enkel in de controle-lezing, niet in het GDELT-cijfer.

## Bovenstroom — mainstream media (22 RSS-feeds + GDELT)

**Nederlandstalig (17), in `gdelt.RSS_FEEDS` met profiel-sleutel:**
VRT NWS, De Standaard, De Morgen, Het Laatste Nieuws (HLN), De Tijd, Het Belang van Limburg, Bruzz, Knack, Sporza, Trends, Business AM, Eos, Newsmonkey, Het Nieuwsblad, Gazet van Antwerpen, De Wereld Morgen, **TV Oost** (NIEUW V12, hyperlokaal Oost-Vlaanderen — ving het bus-ongeval-rouwsignaal).

**Franstalig (5, NIEUW V12, `lang=fr` → FR-lexicon):**
La Libre (`lalibre.be/arc/outboundfeeds/rss/?outputType=xml`), La DH (`dhnet.be/.../rss/`), L'Avenir (`lavenir.net/.../rss/`), BX1 (`bx1.be/feed/`, Brussel hyperlokaal), 7sur7 (`7sur7.be/home/rss.xml`).

**`events.py`** scant nu exact dezelfde 22 feeds (afgeleid van `gdelt.RSS_FEEDS`).

**GDELT** = het grote aggregaat dat ALLE Belgische media (NL+FR) dekt → levert het gescoorde I-D5-001 (toon) + I-D5-003 (gebeurtenis-volume).

## Onderstroom — sociaal/grassroots
- **Reddit** (`I-D5-006S`): GEFIXT V12. De `.json`-route geeft sinds eind 2024 HTTP 403 → draaide stil op mock. Nu de publieke `.rss` (Atom). Subs: belgium, Vlaanderen, **brussels, Antwerpen, BEFire** (financiële stress). ⚠ Datacenter-IP's kunnen alsnog 403'en → cache/mock-fallback met eerlijke vlag. Robuustere upgrade = OAuth (client-credentials).
- **Mastodon** (`I-D5-mastodon`, NIEUW V12): no-auth publieke timeline `mastodon.vlaanderen`. Dun volume, descriptief.

**Niet haalbaar (onderzocht, laat vallen):** X/Twitter (geen gratis API meer sinds feb 2026), TikTok/Instagram (datacenter-IP-blok), publieke Facebook-groepen (PPCA-review), Belgische fora (9lives dood, BelgiumDigital gesloten; enkel userbase.be leeft, maatwerk-scrape).

## Tussenstroom — de vergeten middenlaag
- **Google Trends** (`I-D5-trends`, NIEUW V12): zoek-/querygedrag op schaal = de stille meerderheid die niet post maar wel zoekt. Via de trending-RSS `trends.google.com/trending/rss?geo=BE` (werkt vanaf server-IP; pytrends werd geblokt, daarom was I-D5-002 al naar Wikipedia verschoven). Scoort het stress-aandeel van de trending searches tegen het lexicon.
- **YouTube-comments** (NOG TE BOUWEN): de schoonste extra bron volgens het onderzoek — gratis Data API v3, IP-onafhankelijk, NL+FR. Wacht op `YOUTUBE_API_KEY` van Peter (Google Cloud). Plan: comments onder de nieuwste video's van een vaste set BE-nieuwskanalen (VRT/VTM/HLN + RTBF/RTL) → lexicon-scoren.
- **Hyperlokaal** (Hoplr/Nextdoor/FB-groepen): gesloten/ToS-gevoelig, laat vallen. De hyperlokale incident-laag komt beter uit BX1 (Brussel) + TV Oost (Oost-Vl).

## Openbaar vervoer (NIEUW V12) — "treinen en bussen ook"
- **Trein:** iRail `api.irail.be/v1/disturbances` (no-auth; URL gefixt van de oude 303-redirect). `I-D2-009` (in het cijfer, telt ongeplande verstoringen).
- **Brussel:** STIB/MIVB `api-management-discovery-production.azure-api.net/.../stibmivb/rt/TravellersInformation` (no-auth JSON, CC BY 4.0). `I-D2-stib` (secundair).
- **Vlaanderen:** De Lijn **GTFS Realtime v3** `api.delijn.be/gtfs/v3/realtime?json=true` (real-time geannuleerde + vertraagde ritten ≥3min). `I-D2-delijn` (secundair). Key = secret `DELIJN_API_KEY`. ⚠ De "Open Data Free"-key dekt GTFS-RT NIET (alleen Kern Open Data); Peter subscribede apart op "GTFS Realtime v3".
- **Wallonië (TEC):** GEPARKEERD — protobuf + handmatige sleutel-aanvraag (`letec.be/View/Open_Data_of_TEC/4296`), lage opbrengst.

## Sociale partners / middenveld (onderzocht)
- **Vakbonden (ABVV/ACV/ACLVB) + werkgevers (VOKA/UNIZO/VBO/Agoria) = DUBBELTELLING.** Hun acties (staking, ontslag) zijn nieuws en zitten al in GDELT + `events.py`-keywords. Niet apart toevoegen. Geen RSS-feeds (enkel gedateerde HTML).
- **⭐ NBB consumentenvertrouwen = GEBOUWD V12** als gescoorde indicator I-D3-007 (zie HANDOVER §2.7). Voorlopend enquête-sentiment, geen dubbeltelling. Via Eurostat ei_bsco_m (NBB-eigen API faalt vanaf server-IP).
- **Test-Aankoop / Solidaris / Armoedebarometer** = jaarlijks → ijkbronnen voor criteriumvalidatie (`app/pipeline/validation/`), geen live-feed.
- **Sciensano Gezondheidsenquête** (HISIA) = sterkste BE-criterium-ijkbron voor "klopt de barometer met echte bevolkingsstress".

## Lexicons (toon + emotie)
- **NL toon:** `lexicon_pattern_nl.py` (Pattern.nl CLiPS, 2722) + `lexicon_nl.py` overlay (NEGATIVE 362 / POSITIVE 149) + negatie/versterker-laag. `tone_of_text`.
- **NL emotie:** `lexicon_emotion_nl.py` (woede/angst/verdriet/walging, 289 woorden).
- **FR toon (NIEUW V12):** `lexicon_pattern_fr.py` (Pattern.fr CLiPS, BSD, 3673) + `lexicon_fr.py` overlay (FR stress-zelfstandige-naamwoorden + FR negatie). `tone_of_text_fr`. Geroutineerd per bron-`lang`.
- **FR emotie (nog niet):** FEEL (`advanse.lirmm.fr/FEEL.csv`) heeft een licentie-grijszone (erft NRC: research gratis, commercieel = fee). Houden in trigger-laag of NRC-licentie kopen.
- **NL-upgrade (optioneel):** Speed & Brysbaert 2023 (CC-BY, 24k NL-woorden, 6 emoties, `osf.io/9htuv`).

## Reach-weging
`media_profiles.MEDIA_PROFILES`: per bron `reach` + leeftijdsprofiel + (V12) `lang`. `poststratify()` weegt bron-toon met bereik × publiek → nationaal poststratified cijfer (`I-D5-001-rss`, secundair). Promotie naar het cijfer = pre-reg-amendement (open beslissing).
