# Criteriumvalidatie — verzamelde publieke ijkdata (met bron-links)

Opgezocht en geverifieerd 2026-06-03. Dit zijn de publiek gepubliceerde Belgische cijfers die als ijkpunt kunnen dienen. Harde cijfers zijn aan een directe bron-URL gekoppeld; afgeleide cijfers (uit gepubliceerde %-veranderingen) zijn als zodanig gemarkeerd. De bijbehorende data-bestanden staan in `validation/data/` (alleen harde cijfers; afgeleide blijven hier als context).

## 1. Zelfmoordlijn 1813 / CPZ — jaarlijks aantal contacten (HARD, + maandreeks bestaat)
| Jaar | Totaal | Telefoon | Chat | E-mail |
|---|---|---|---|---|
| 2019 | 18.452 | | | |
| 2020 | 23.614 | | | |
| 2021 | 22.870 | | | |
| 2022 | 23.073 | 17.043 | 3.843 | 2.184 |
| 2023 | 23.886 | 18.511 | 2.996 | 2.379 |
| 2024 | 23.148 | 17.288 | 3.318 | 2.542 |
| 2025 | 26.937 | | | |

Referentie 2013 = 10.833 (meer dan verdubbeld in 10 jaar).
**Belangrijk:** het jaarrapport bevat ook een **maand-tabel** (12 waarden per kanaal), bv. telefoon jan 2023 = 1.826, jun = 1.348, sep = 1.151. Dat is de enige bron met publieke **sub-jaarlijkse** resolutie. Dagcijfers vereisen wel een afspraak met CPZ.
**Links:**
- Cijferrapport 2023 (PDF, alle tabellen + maandreeks): https://www.preventiezelfdoding.be/wp-content/uploads/2024/03/Cijferverslag-2023-1.pdf
- Cijferbijlage 2022 (PDF): https://www.preventiezelfdoding.be/wp-content/uploads/2023/03/Cijferbijlage-Zelfmoordlijn-2022.pdf
- 2024-cijfers (23.148): https://www.zelfmoord1813.be/nieuws/zelfmoordlijn-1813-voert-23-148-gesprekken-in-2024
- Cijferpagina (2025 = 26.937): https://www.zelfmoord1813.be/feiten-en-cijfers/cijfers-over-suïcide-en-suïcidepogingen/cijfers-van-zelfmoordlijn-1813

## 2. Tele-Onthaal — jaarlijks aantal contacten (HARD t/m 2022)
| Jaar | Telefoon | Chat |
|---|---|---|
| 2021 | ~118.400 (afgeleid) | ~19.260 (afgeleid) |
| 2022 | 110.269 (hard) | 18.548 (hard) |

2023/2024 Vlaanderen-brede jaartotalen niet publiek gevonden (enkel piek-% rond Warmste Week + losse provinciale rapporten). Maand-/dagdata = aanvraag nodig.
**Links:**
- Jaarcijfers 2022 (persbericht): https://www.tele-onthaal.be/pers/jaarcijfers-2022
- Publicaties/jaarverslagen: https://www.tele-onthaal.be/over-tele-onthaal/publicaties

## 3. RIZIV — invaliditeit door depressie/burn-out (HARD jaarstand)
| Indicator (eind 2023) | Waarde |
|---|---|
| Invaliden door depressie of burn-out | **137.454** |
| Totaal invaliden | 526.507 |
| Aandeel psychische stoornissen | 37,57% |
| Stijging depressie/burn-out 2022→2023 | +9,37% |
| Stijging depressie/burn-out 2018→2023 | +44% |

Afgeleid uit de %-veranderingen: 2022 ≈ 125.700, 2018 ≈ 95.500. Jaarstand op 31 dec; geen fijnere publieke data.
**Links:**
- RIZIV-statistiek "Arbeidsongeschiktheid in 2023": https://www.riziv.fgov.be/nl/statistieken/statistieken-uitkeringen/statistieken-over-arbeidsongeschiktheid-door-burn-out-of-depressie/arbeidsongeschiktheid-in-2023-hoeveel-mensen-in-invaliditeit-door-depressie-of-burn-out-hoeveel-kost-dat-aan-uitkeringen
- RIZIV-statistiekoverzicht (jaarlijkse tabellen): https://www.riziv.fgov.be/nl/statistieken/statistieken-uitkeringen/

## 4. Sciensano — prevalentie angst (GAD-7) en depressie (PHQ-9), per golf
| Golf | Angst (GAD-7) | Depressie (PHQ-9) |
|---|---|---|
| Gezondheidsenquête 2018 | 11,2% | 9,4% |
| BELHEALTH okt 2022 | 16% | 13% |
| BELHEALTH feb 2023 | 18% | ~14,5% |
| BELHEALTH jun 2023 | 14% | |
| BELHEALTH mrt 2024 | 19% | 17% |

**Methodologische waarschuwing (uit de bron):** instrument wijzigde rond 2018, en de BELHEALTH-cohort is niet volledig representatief. De sprong 2018 (~10%) → BELHEALTH (~17-19%) is deels methode, niet puur reële stijging. BELHEALTH meet ~3x/jaar (golf-resolutie). Microdata = aanvraag (HISIA-portaal).
**Links:**
- Gezondbelgie "Angst en depressie" (tijdreeks + 2018): https://www.gezondbelgie.be/nl/gezondheidstoestand/geestelijke-en-sociale-gezondheid/angst-en-depressie
- BELHEALTH-bulletin n°5 (PDF, mrt 2024): https://www.sciensano.be/sites/default/files/bulletin_5_belhealth_nl_final.pdf
- BELHEALTH-bulletin n°2 (PDF, mei 2023): https://www.sciensano.be/sites/default/files/bulletin_2_belhealth_nl.pdf

## Conclusie (bruikbaarheid)
- **CPZ/1813** = beste publieke ijkpunt: enige met publieke **maand**-resolutie (jaarrapport-tabel). Dagcijfers via afspraak.
- **Tele-Onthaal** = rijk volumesignaal maar publiek enkel jaartotaal (hard t/m 2022). Maand/dag = aanvraag.
- **RIZIV** = harde, trage jaartrend (achtergrond-anker voor niveau, niet voor weekbeweging).
- **Sciensano** = golf-resolutie, methodologisch discontinu rond 2018 → niveaucheck, geen tijdreeks-validator.

Eerlijke beperking: dit zijn jaar-/golfcijfers; de SBI heeft ~2 jaar dagdata, dus een sterke dagelijkse kruiscorrelatie kan pas met de CPZ-maandreeks (uit de PDF te extraheren) of met aangevraagde dagcijfers van de hulplijnen. De jaarcijfers dienen voorlopig als niveau/trend-anker.
