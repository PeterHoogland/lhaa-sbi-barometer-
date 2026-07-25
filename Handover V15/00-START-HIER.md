# START HIER - De Nationale Stress Index (motor: SBI), Les Hautes Alpes

Dit is de overzichtsmap met **alle handover-versies** van het project, plus de laatste stand (V15). Eén plek, een map per versie, en de actuele instructies hieronder.

---

## Een nieuwe sessie starten (in 1 stap)

Lees **`HANDOVER-V15.md`** (in deze map). Dat is de volledige laatste stand:
- wat er sinds V14 veranderde (twee herdefinities van het hoofdcijfer plus de go-live);
- de methodologie 0.4.1 (apart in `METHODOLOGIE-V15.md`);
- de architectuur en hoe je het bouwt/draait/deployt (apart in `ARCHITECTUUR-EN-BOUWEN-V15.md`);
- het operationele deel en de open punten.

Voor de programmeur: lees naast `HANDOVER-V15.md` ook `ARCHITECTUUR-EN-BOUWEN-V15.md`. Samen heb je genoeg om meteen te bouwen en te begrijpen.

---

## De stand in één oogopslag (2026-06-21)

- **Live:** https://les-hautes-alpes-sbi.brainwolves.workers.dev (Cloudflare Workers).
- **Repo:** github.com/PeterHoogland/lhaa-sbi-barometer- (`main`, publiek). De LIVE code + data staan in de git-repo (de map `app/`) en deployen automatisch. **Deze handover-map is de leeswijzer/het archief, niet de broncode.**
- **Publieksnaam:** De Nationale Stress Index. **Afzender:** een initiatief van June20, in samenwerking met het toeristisch agentschap van Les Hautes-Alpes.
- **Hoofdcijfer:** de hybride dagkop `daily_pressure` (methodology 0.4.1), ademt met de dag, vandaag rond 85. 50 = normaal.
- **GO-LIVE: maandag 22 juni 2026, 07:00, automatisch.** Een datum-gate in `daily.yml` zet `SBI_STRICT_REAL=1` vanaf 22/6. Geen handmatige stap nodig.

---

## De versies (nieuw naar oud, elk een eigen map)

- **V15** (deze map, root) - hybride dagkop 0.4.1 (anker + dagelijkse beweging incl. verkeer en OV), afzender naar June20, frontend-consistentie-audit, automatische datum-gegrendelde go-live, persberichten + wetenschapsdocs naar 0.4.1. Zie `HANDOVER-V15.md`.
- **`V14/`** - Hitte-bug gefixt, autonome zelf-helende bewaking, Belgisch-eerste weerketen, AI-laag aan, venster 06-20u (stand 4 juni, v0.2). Zie `V14/HANDOVER-V14.md`.
- **`V13/`** - autonome uurlijkse bewaking (canary + verify_live + cron-Worker) + Belgische bronnen. Bevat ook de diepere docs: CODE / TOEGANG / MASTERDOCUMENT / MEDIA-OVERZICHT.
- **`V12/`** - grote bron- en cijfer-uitbreiding (25 indicatoren, FR-lexicon, OV, NBB-consumentenvertrouwen, brand-safety rouw).
- **`V11/`** - seizoens-bewust percentiel + determinisme + carry-forward.
- **`V10/`** - correctie van de stale-file-misdiagnose.
- **`V6/`** - externe wetenschappelijke review, D-grades, emotie-laag.
- **`V0.5/`** - vroege versie (verhuizing naar Cloudflare-hosting).

De boog van V14 (relatief percentiel als kop) naar V15 (hybride dagkop) wordt in `HANDOVER-V15.md` §1 samengevat; de dagelijkse stappen staan in `~/Desktop/De Nationale Stress Barometer/`.

---

## Klant- en wetenschapper-materiaal

- **`SBI-uitleg-voor-de-klant-V1.docx`** (+ `.md`) - uitleg in gewone taal. Let op: controleer of die nog de oude naam/framing draagt en actualiseer indien nodig (zie `HANDOVER-V15.md` open punt 5).
- **Wetenschapper-pakket (voor Jelle):** `~/Desktop/Voor Jelle - Nationale Stress Index/` (2 .docx, op 0.4.1).

---

*Deze map bevat kopieën van de oudere versies (ter archief). De originele, git-getrackte docs en de live code blijven in de projectmap/repo staan, zodat de automatische deploy onaangeroerd blijft.*
