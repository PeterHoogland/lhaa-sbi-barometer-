# OSF-publicatiepakket — De Nationale Stress Index (motor: SBI)

**Aangemaakt:** 12 juni 2026, na afronding van alle lopende amendementen (annex
00_Pre-Registratie §4.1.1 t/m §4.1.6) en de B7-naamkeuze. Vanaf de feitelijke
OSF-publicatie geldt het 30-dagen-wijzigingsprotocol (doc 08 §5) voor élke
methodologische wijziging.

## Wat dit pakket is

- `SHA256-MANIFEST.txt`: de SHA-256-hashes van de tien methodologiedocumenten
  (00 t/m 09) op het moment van bevriezing. Wie de documenten later opnieuw
  hasht en vergelijkt, ziet elke wijziging-achteraf.
- De `CHANGELOG.md` in de repo-root valt BEWUST buiten de hash: dat is het
  levende auditlog dat juist hoort te groeien.

## Publicatiestappen (één keer, handmatig — vereist Peters OSF-account)

1. Maak op https://osf.io een project aan: "De Nationale Stress Index /
   Stressor-Blootstellings-Index (SBI) — pre-registratie".
2. Upload de tien documenten 00 t/m 09 + dit pakket (README + manifest).
3. Zet het project op publiek en noteer de OSF-DOI/URL.
4. Vul in `00_Pre-Registratie.md` §14 de publicatiedatum + OSF-URL in en
   vervang "[TE BEPALEN]". LET OP: die invulling wijzigt de hash van doc 00;
   herbereken daarom direct het manifest (`shasum -a 256 0*.md` vanuit de
   repo-root) en upload het bijgewerkte manifest als laatste OSF-bestand.
   Vanaf dat moment is alles bevroren.
5. Werk de footer-copy bij (app/web/src/components/Sections.tsx): de regel
   "Publicatie van code en pre-registratie (OSF) is voorbereid maar nog niet
   live" wordt dan een link naar de OSF-pagina. (Pas dán; de claimaudit van
   C2 verbiedt een dode verwijzing.)
6. Optioneel daarna: de repo publiek zetten en de "code open source"-claim in
   ere herstellen.

## Waarom dit nog niet automatisch is gebeurd

OSF-publicatie vereist een persoonlijk OSF-account (of API-token) van de
eigenaar; dat is er in deze omgeving niet. Alles wat zonder credentials kan,
is gedaan: amendementen afgerond, manifest bevroren, stappen beschreven.
