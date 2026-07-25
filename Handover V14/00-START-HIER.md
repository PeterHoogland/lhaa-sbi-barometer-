# START HIER — Les Hautes Alpes SBI-barometer

Dit is de overzichtsmap met **alle handover-versies** van het project, plus de laatste stand (V14). Eén plek, een map per versie, en de actuele instructies hieronder.

---

## Een nieuwe sessie starten (in 1 stap)

Lees **`HANDOVER-V14.md`** (in deze map). Dat is de volledige laatste stand:
- wat er recent gebouwd is, met commit-hashes;
- de complete bestands- en componenten-inventaris (niks mist);
- het operationele deel (deploy, git-dans, tests, secrets, geplande taken, kosten);
- de open punten en het kritieke pad.

Je hebt aan dat ene document genoeg om meteen te kunnen werken.

---

## De stand in één oogopslag (2026-06-04)

- **Live:** https://les-hautes-alpes-sbi.brainwolves.workers.dev (Cloudflare Workers).
- **Repo:** github.com/PeterHoogland/lhaa-sbi-barometer- (`main`, publiek). De LIVE code + data staan in de git-repo (de map `app/` in de projectmap) en deployen automatisch. **Deze handover-map is de leeswijzer/het archief, niet de broncode.**
- Het cijfer draait **volledig automatisch, computer-uit**: elk uur verversen van 06:00 t/m 20:00, een gemiste update herstelt binnen ~20 min vanzelf, mail bij een echt probleem.
- Weerketen Belgisch-eerst (KMI/RMI Ukkel) + twee echte fallbacks. AI-bewaking staat aan (~€0-2/maand; de rest is gratis).
- **Kritiek pad:** go-live van de campagne-kant (Zapier-hook + drempels bevriezen + mode:live), wacht op Peter. 🎯 Go-live 22 juni 2026.

---

## De versies (nieuw naar oud, elk een eigen map)

- **V14** (deze map, root) — Hitte-bug gefixt, autonome zelf-helende bewaking, Belgisch-eerste weerketen, AI-laag aan, venster 06-20u. Zie `HANDOVER-V14.md`.
- **`V13/`** — autonome uurlijkse bewaking (canary + verify_live + cron-Worker) + Belgische bronnen (IRCELINE, VMM+SPW, Sciensano). Bevat ook de diepere docs: CODE / TOEGANG / MASTERDOCUMENT / MEDIA-OVERZICHT.
- **`V12/`** — grote bron- en cijfer-uitbreiding (25 indicatoren, FR-lexicon, OV, NBB-consumentenvertrouwen, brand-safety rouw).
- **`V11/`** — seizoens-bewust percentiel + determinisme + carry-forward.
- **`V10/`** — correctie van de stale-file-misdiagnose.
- **`V6/`** — externe wetenschappelijke review, D-grades, emotie-laag.
- **`V0.5/`** — vroege versie (verhuizing naar Cloudflare-hosting).

Voor de diepere architectuur, methodologie en medialaag: de `V13/`-set is het meest complete naslagwerk en ketent terug naar V12.

---

## Klant-materiaal

- **`SBI-uitleg-voor-de-klant-V1.docx`** (+ `.md`) — uitleg in gewone taal (voor een 15-jarige): hoe het cijfer ontstaat, de bewaking, het agentic systeem, de methodologie kort. Klaar om te delen of aan te passen.

---

*Deze map bevat kopieën van de oudere versies (ter archief). De originele, git-getrackte docs (V12, V13) en de live code blijven in de projectmap/repo staan, zodat de automatische deploy onaangeroerd blijft.*
