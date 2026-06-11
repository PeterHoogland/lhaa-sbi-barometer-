# CHANGELOG — Stressor-Blootstellings-Index (SBI)

Audit-trail per 08_Onderhoud-Protocol.md §5.6: elke wijziging gelogd met datum, aanleiding en beslissing. Nieuwste entries bovenaan.

Eerlijke noot bij de start van dit logboek: dit bestand is aangemaakt op 2026-06-11. De entries vóór die datum zijn retroactief gereconstrueerd uit de git-historie en commit-berichten van de app. De wijzigingen zelf zijn op het moment van invoering in commits gedocumenteerd, maar het formele wijzigingsproces (30-dagen-aankondiging, adviesraad-consultatie per 08 §5.3-5.4) is voor geen van deze wijzigingen vooraf gevolgd; er is op dit moment ook nog geen adviesraad, dus dissenting opinions ontbreken. Zie 00_Pre-Registratie.md §4.1 voor de formele regularisatie.

---

## 2026-06-11 — BLOK A (SBI-verbeterplan) + documentatie-regularisatie

**Aanleiding:** interne review (SBI-verbeterplan BLOK A): scoringslekken, oneerlijke labels en niet-geregulariseerde pre-registratie-afwijkingen.

**Beslissingen:**

- **A1 — v0.4-schaarste eerlijk behandeld** (commit 51faa64): een ontbrekende v0.4-kernindicator telt als "ontbreekt", niet langer als z=0; het kern-composiet hernormaliseert over de aanwezige codes.
- **A3 — registry als single source of truth** (commit e9a4309): `app/engine/src/indicators/registry.ts` is de enige bron voor de indicatorset; synchronisatietest bewaakt web-copy en pipeline-constanten; publish-helper toegevoegd; lek in compute-daily gedicht.
- **A6 — kalenderdomein D6 naar contextlaag** (commit 0037ea9, methodologie 0.2.0 naar 0.3.0): de 4 D6-kalenderindicatoren (I-D6-001/002/003/005) tellen niet meer mee in composiet en condition_level; ze verschijnen als `context_signals` naast het cijfer. Equal-domeingewicht van 1/6 naar 1/5; Schema-2-tabel bevroren als historiek, actieve gewichten pro rata hernormaliseerd over D1-D5 (deling door 0.832); demografische TOTAL_REACH-noemer zonder contextcodes. Zichtbaar gevolg: composiet van 0.13 naar circa -0.11, amber-banner gedoofd (de examens-bijdrage met z=3 was de drijver). De bevroren v0.4-kern bevat geen D6 en is ongemoeid. Gemotiveerde scopekeuze: I-D1-001 (daglicht), I-D4-001 (deadlinepieken) en I-D4-002 (schoolvakantie) zijn ook deterministisch maar blijven voorlopig gescoord; heroverweging bij BLOK B / construct-herziening.
- **A7 — demo-aandeel eerlijk gelabeld** (commit 360fac3): `data_quality` krijgt `demo_fraction` en `score_label` ("demo" bij een gewogen demo-aandeel van 30% of meer); demo-banner in de UI.
- **A2 — documentatie-regularisatie** (deze wijziging): pre-registratie-amendementen retroactief en expliciet vastgelegd in 00_Pre-Registratie.md §4.1; inclusielijst 02_Laag-3 §10 gesynchroniseerd met de registry (25 geregistreerd: 20 gescoord, 4 kalendercontext, 1 diagnostisch); totaal-zinnen in 03, 05, 07 en README bijgewerkt; dit CHANGELOG aangemaakt. De 30-dagen-aankondigingstermijn (00 §13) is voor de eerdere wijzigingen niet vooraf gevolgd; dat staat nu expliciet in de documenten in plaats van verzwegen.

---

## 2026-06-03 — Amendement I-D3-007 Consumentenvertrouwen

**Aanleiding:** wijzigingsgrond A2 (datatoegang): maandelijks voorlopend enquête-sentiment beschikbaar via Eurostat.

**Beslissing** (Peter GO, commit 0cefc23): I-D3-007 Consumentenvertrouwen toegevoegd als gescoorde D3-indicator, grade B. Bron: Eurostat ei_bsco_m (BS-CSMCI). Inverse-coded: hoog vertrouwen betekent lage stress. Geen STL (bron is al seizoensgecorrigeerd). Zit niet in de nieuws-laag, dus geen dubbeltelling met D5. Backfill: 197 maandpunten 2010-2026.

---

## 2026-06-02 — Evidence-review §3: grade-overrides + twee scoringsfixes

**Aanleiding:** externe methodologische review (§3) van de evidence-grades en de percentielberekening.

**Beslissingen:**

- **Grades A/B/C/D ingevoerd, twee indicatoren uit het cijfer** (commit 62a0d10): I-D3-003 Aangekondigde collectieve ontslagen van A naar D (de feed is een werkloosheidsgraad-proxy, geen echte ontslag-aankondigingsdata) en blijft alleen diagnostisch zichtbaar; media-indicatoren initieel op D.
- **Peter overrulet review voor D5** (commit b81ade1): I-D5-001 Nieuwsnegativiteits-index en I-D5-002 Wikipedia-aandacht stress-thema's terug in het cijfer op grade C (gereduceerd gewicht in het evidence-schema). Bewuste, gedocumenteerde afwijking van de regel dat grade C naar de secundaire set gaat. I-D5-001 scoort tegen de bevroren GDELT-baseline.
- **Lookahead-lek gedicht** (commit 5ab84b8): `buildPercentileHistory` gebruikte toekomstige datapunten in de historische percentielen; gefixt.
- **Seizoens-bewust percentiel** (commit 7d78dfa): publiek cijfer op seizoens-bewust percentiel, deterministisch, met carry-forward zonder demping.

---

## 2026-05-21 — Laag-3-amendementen: vier nieuwe indicatoren + bronwissel I-D5-002

**Aanleiding:** wijzigingsgrond A2 (datatoegang): nieuwe machine-leesbare Belgische en Europese bronnen beschikbaar; Google Trends bleek geblokkeerd voor geautomatiseerde afname.

**Beslissingen:**

- **Vier indicatoren toegevoegd** (commit 8bb4378, telling 20 naar 24): I-D1-009 Wateroverlast (VMM Waterinfo.be + SPW Wallonië), I-D1-010 Pollen (Copernicus CAMS; vervangt secundaire I-D1-005S Pollenconcentratie), I-D2-009 Treinverstoringen (iRail API, NMBS/Infrabel), I-D3-009 Stroomnet-druk (Elia Open Data). Alle grade B.
- **Bronwissel I-D5-002** (commit a73023b): "Google Trends stress-termen" vervangen door "Wikipedia-aandacht stress-thema's" (Wikipedia-pageviews, Wikimedia REST API).

De 30-dagen-aankondiging is voor deze wijzigingen niet vooraf gevolgd; retroactief geregulariseerd op 2026-06-11 in 00_Pre-Registratie.md §4.1.
