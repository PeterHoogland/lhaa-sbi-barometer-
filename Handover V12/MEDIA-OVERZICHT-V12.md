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
