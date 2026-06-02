# Criteriumvalidatie — datadelingsaanvragen (verzendklaar)

Doel: de SBI-tijdreeks correleren met onafhankelijke, klinisch gevalideerde Belgische uitkomstmaten (verbeterplan §2.4 / §6-bis.4). Geen van deze bronnen heeft een publieke dag-API, dus de data moet aangevraagd worden. Hieronder per bron een verzendklare e-mail.

**De code is al klaar:** zet een ontvangen bestand als `app/pipeline/validation/data/<naam>.csv` (kolommen `date`,`value`), en `criterion_validity.py` rekent automatisch de kruiscorrelatie (lag 0-3 dagen) + schrijft het rapport. Bestandsnamen die de module verwacht: `tele_onthaal.csv`, `zelfmoordlijn_1813.csv`, `riziv_psychosociaal.csv`, `sciensano_belhealth.csv`, `google_trends_stress.csv`.

**Privacy-kader (vermeld in elke aanvraag):** we vragen uitsluitend **dag-aggregaten** (een totaaltelling per dag), volledig geanonimiseerd, zonder enige persoons- of gespreksinhoud. Doel is wetenschappelijke correlatie van een omgevingsdruk-index, niet individuele opvolging.

---

## 1. Tele-Onthaal (dagelijks, sterkste ijkbron)
**Naar:** info@tele-onthaal.be (vraag om door te sturen naar de cijfer-/onderzoekscel of de Federatie van Tele-Onthaaldiensten)
**Onderwerp:** Aanvraag geanonimiseerde dag-oproepcijfers voor wetenschappelijke validatie

> Geachte,
>
> Voor Les Hautes Alpes ontwikkelen we een publieke barometer (Stressor-Blootstellings-Index) die meet hoe ongewoon de maatschappelijke omstandigheden in België vandaag zijn. Om de wetenschappelijke validiteit aan te tonen willen we de index correleren met een onafhankelijke maat van ervaren druk.
>
> Concreet vragen we: het **aantal oproepen (en chats) per dag**, als geanonimiseerd dag-totaal, voor de **voorbije 24 maanden**, in een eenvoudig CSV-formaat (kolommen: datum, aantal). Geen enkele persoons- of gespreksinhoud, enkel dagtellingen.
>
> De data wordt enkel geaggregeerd verwerkt voor een correlatie-analyse en niet gepubliceerd op individueel niveau. We vermelden Tele-Onthaal graag als databron mits jullie akkoord.
>
> Mogen we hierover in gesprek gaan? Met dank,
> Peter Hoogland

---

## 2. Zelfmoordlijn 1813 / Centrum ter Preventie van Zelfdoding (dagelijks, sterkste ijkbron)
**Naar:** via de onderzoeks-/datacel van het CPZ (preventiezelfdoding.be) — vraag het juiste contact op via info@zelfmoord1813.be
**Onderwerp:** Aanvraag geanonimiseerde dag-contactcijfers voor wetenschappelijke validatie

> Geachte,
>
> (zelfde tekst als hierboven, met extra gevoeligheidskader:) we zijn ons bewust van de gevoeligheid van deze cijfers. We vragen uitsluitend een **geanonimiseerd dag-totaal van het aantal contacten** (telefoon + chat samen, of apart), voor de voorbije 24 maanden, als CSV (datum, aantal). Geen enkele inhoud, geen demografie, enkel dagtellingen, uitsluitend voor een geaggregeerde correlatie-analyse.
>
> Met dank, Peter Hoogland

---

## 3. RIZIV — psychosociale arbeidsongeschiktheid (maandelijks/jaarlijks)
**Naar:** via het contactformulier van de Dienst voor uitkeringen op riziv.fgov.be (statistieken)
**Onderwerp:** Aanvraag tijdreeks invaliditeit wegens burn-out/depressie

> Geachte,
>
> Voor een wetenschappelijke validatie van een omgevingsdruk-index zoeken we een tijdreeks van het **aantal personen in invaliditeit wegens psychische stoornissen (burn-out/depressie)**, zo fijn mogelijk in de tijd (maandelijks indien beschikbaar, anders per kwartaal/jaar), voor de voorbije jaren. CSV met datum + aantal volstaat.
>
> We weten dat administratieve aantallen mede beleid/aanbod weerspiegelen; we behandelen ze als één van meerdere ijkpunten, niet als directe stressmaat. Met dank, Peter Hoogland

---

## 4. Sciensano BELHEALTH (kwartaal)
**Naar:** belhealth@sciensano.be
**Onderwerp:** Aanvraag geaggregeerde GAD-7/PHQ-9-tijdreeks

> Geachte,
>
> We zoeken de **geaggregeerde tijdreeks van de mentale-gezondheidsindicatoren (GAD-7 angst, PHQ-9 depressie)** uit BELHEALTH, op het meest frequente niveau dat jullie publiek of op aanvraag delen, voor een correlatie met een omgevingsdruk-index. Geen microdata nodig, enkel de geaggregeerde scores per meetmoment (CSV: datum, waarde).
>
> Met dank, Peter Hoogland

---

## 5. Google Trends (bijkomend/zwak, secundair — niet in de hoofdscore)
Publiek, maar lastig vanaf server-IP's (pytrends 429). Op te halen via een desktop-export van trends.google.com (`geo=BE`, termen "stress", "burn-out", "slapen niet", met een controleterm tegen seizoens-/media-effecten), of via een betaalde API. Plaats het resultaat als `validation/data/google_trends_stress.csv`. Behandel het expliciet als zwak secundair signaal, conform §2.4.

---

## Statistische randvoorwaarde (belangrijk, eerlijk)
De SBI heeft nu ~2 jaar historie. De **dagelijkse** ijkbronnen (1 en 2) geven daarmee ~730 punten, genoeg voor een betekenisvolle kruiscorrelatie. De **periodieke** bronnen (3 en 4) geven over 2 jaar maar enkele punten, dus die leveren voorlopig hooguit een grove check, geen sterke validatie. Prioriteit voor een echte validatie ligt dus bij de twee hulplijnen.
