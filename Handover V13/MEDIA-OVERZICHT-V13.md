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
