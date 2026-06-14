"""
SBI — dagelijkse bron-gezondheidstest ("canary").

WAAROM (Peter, 2026-06-03)
--------------------------
Twee keer is de barometer stil gedegradeerd zonder dat iemand het merkte:
Reddit viel sinds eind 2024 terug op mock (`.json` gaf 403) en een stale
`latest.json` toonde ooit "3/100". Deze test draait elke dag mee in de CI en
controleert in één rapport + alarm of de barometer doet wat hij hoort te doen:

  1. CONNECTIE   — levert ELKE bron (de opgehaalde primaire indicatoren in het
                   cijfer + de secundaire signalen) verse, ECHTE data, en niet
                   stil een mock/cache-terugval?
  2. VERWERKING  — staat er een VERSE dagrun (raw-values van vandaag, geen
                   blijven hangen op gisteren)?
  3. VOEDING     — is de index effectief gevoed: composiet + percentiel berekend
                   en de volledige set indicatoren in de breakdown?

KERNREGEL: een WAARDE van 0 is NOOIT op zichzelf een alarm.
-----------------------------------------------------------
Google Trends staat 0 op een rustige sportdag; "Kou" staat 0 in de zomer (en
valt dan zelfs uit het cijfer wegens nul-variantie in de baseline). Dat zijn
GEZONDE nullen. Het alarm hangt aan de `simulated`-vlag, aan afwezigheid van een
bron, en aan veroudering — NOOIT aan de waarde zelf. De oude demo-fallback-stap
alarmeerde op `indicators_missing` (een engine-uitsluiting, niet een
bronstoring) en spamde daardoor dagelijks over de zomerse "Kou"-nul. Deze test
leest de connectie-waarheid uit `raw-values.json` (de `simulated`-vlaggen).

GEBRUIK
-------
  python -m pipeline.healthcheck            # leest app/data, schrijft health-report.json
Exit-code: 0 = ok of degraded, 2 = critical (de index zelf is stuk). De CI laat
de stap niet de build breken; een aparte stap markeert de run rood bij critical
(dan mailt GitHub Peter automatisch).
"""
from __future__ import annotations

import json
import math
import os
import sys
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from pathlib import Path

from .util import DATA_DIR, WEB_PUBLIC

# ---------------------------------------------------------------------------
# Verwachte inventaris — EXPLICIET gedeclareerd. Dat is het hele punt: leid je
# de set af uit de output, dan zou een WEGGEVALLEN fetcher stil "slagen". Door
# de codes hier vast te leggen valt een verdwenen bron meteen op als "afwezig".
#
# Per bron: (leesbare naam, max_leeftijd_dagen). De leeftijd is een ZACHTE
# controle (info, geen alarm) met ruime marges: maandcijfers (CPI, werkloosheid,
# hypotheek, consumentenvertrouwen) verwijzen normaal naar de vorige maand.
# ---------------------------------------------------------------------------

# De opgehaalde primaire indicatoren (D4/D6 zijn deterministisch in de engine
# en worden hier niet verwacht in raw-values.json). Zie run.py fetch_one_day.
PRIMARY_SOURCES: dict[str, tuple[str, int]] = {
    "I-D1-002": ("Hitte", 3),
    "I-D1-003": ("Kou", 3),
    "I-D1-004": ("Luchtkwaliteit", 3),
    "I-D1-009": ("Wateroverlast", 3),
    "I-D1-010": ("Pollen", 4),
    "I-D2-001": ("Filezwaarte (jaar)", 400),   # jaarcijfer, verandert zelden
    "I-D2-004": ("Brandstofprijzen", 10),
    "I-D2-009": ("Treinvertragingen (Infrabel-stiptheid)", 3),
    # Maandcijfers ijlen inherent na (publicatie ~1-3 maanden later). Ruime
    # tolerantie (100d) zodat normale naijling NIET ruist; een ECHTE bevriezing
    # van meerdere maanden (bv. CPI blijft op een oude maand hangen) toont dan
    # wél als zachte "stale"-notitie — info, geen alarm.
    "I-D3-001": ("Inflatie (CPI)", 100),        # maandcijfer
    "I-D3-002": ("Energieprijzen", 10),
    "I-D3-003": ("Collectieve ontslagen", 100), # maand/onregelmatig
    "I-D3-005": ("Werkloosheid", 100),          # maandcijfer
    "I-D3-006": ("Hypotheekrente", 100),        # maandcijfer, kan naijlen
    "I-D3-007": ("Consumentenvertrouwen", 100), # maandcijfer
    "I-D3-009": ("Stroomnet (Elia)", 3),
    "I-D5-001": ("Nieuwsnegativiteit (GDELT)", 3),
    "I-D5-002": ("Stress-zoekgedrag (Wikipedia)", 4),
    "I-D5-003": ("Collectieve gebeurtenissen", 3),
}

# De secundaire signalen (NIET in het cijfer, wel in de trigger-/controle-laag).
# Hier zat de Reddit-blinde-vlek: een secundaire bron die stil op mock viel.
SECONDARY_SOURCES: dict[str, tuple[str, int]] = {
    "I-D5-006S": ("Reddit-sentiment", 4),
    "I-D5-mastodon": ("Mastodon-sentiment", 4),
    "I-D3-003S": ("Ontslag-radar", 4),
    "I-D5-emotie": ("Emotionele lading nieuws", 3),
    "I-D5-verdriet": ("Verdriet-/rouwdeel (brand-safety)", 3),
    "I-D5-001-rss": ("Nieuwsnegativiteit RSS (reach-gewogen)", 3),
    "I-D5-trends": ("Stress-aandeel Google Trends", 4),
    "I-D2-001-rt": ("Filezwaarte real-time (DATEX)", 3),
    "I-D2-009S": ("Treinverstoringen iRail-teller (was primair tot Infrabel-amendement)", 3),
    "I-D2-stib": ("OV-verstoringen Brussel (STIB)", 3),
    "I-D2-delijn": ("OV-verstoringen Vlaanderen (De Lijn)", 4),
    "I-D1-010-sci": ("Pollen Sciensano (Belgisch meetnet, in opbouw)", 4),
}

# De volledige gemeten set die in de indicator_breakdown hoort te zitten (incl.
# de deterministische D1/D4, maar ZONDER de D6-kalendercontext: die staat sinds
# het A6-amendement als context_signals buiten het cijfer). 25 registry-codes
# - 4 context = 21.
EXPECTED_SCORED_INDICATORS = 21

# Verdict-drempels.
CRITICAL_PRIMARY_DOWN = 6       # >= zoveel primaire bronnen plat = systeemstoring
RAWVALUES_MAX_STALE_DAYS = 2    # dagrun ouder dan dit = de fetch draaide niet
THIN_COMPOSITE_MISSING = 7      # > zoveel "ontbreekt" in de breakdown = dun (warn)

DownStatus = ("absent", "mock", "nan", "cache")


@dataclass
class SourceCheck:
    code: str
    name: str
    layer: str               # "primary" | "secondary"
    status: str              # "ok" | "absent" | "mock" | "nan" | "stale"
    value: float | None
    simulated: bool
    observation_date: str | None
    age_days: int | None
    detail: str

    @property
    def is_down(self) -> bool:
        return self.status in DownStatus


@dataclass
class HealthReport:
    target_date: str
    generated_at: str
    verdict: str                       # "ok" | "degraded" | "critical"
    sources: list[SourceCheck] = field(default_factory=list)
    index: dict = field(default_factory=dict)
    messages: list[str] = field(default_factory=list)

    # --- afgeleide samenvattingen ---
    def _codes(self, layer: str, status: str) -> list[str]:
        return [s.code for s in self.sources if s.layer == layer and s.status == status]

    def to_dict(self) -> dict:
        down_primary = [s.code for s in self.sources if s.layer == "primary" and s.is_down]
        down_secondary = [s.code for s in self.sources if s.layer == "secondary" and s.is_down]
        stale = [s.code for s in self.sources if s.status == "stale"]
        return {
            "schema": "lhaa-sbi-healthcheck/v1",
            "generated_at": self.generated_at,
            "target_date": self.target_date,
            "verdict": self.verdict,
            "summary": {
                "primary_down": down_primary,
                "secondary_down": down_secondary,
                "stale": stale,
                "primary_ok": sum(1 for s in self.sources if s.layer == "primary" and s.status == "ok"),
                "primary_total": len(PRIMARY_SOURCES),
                "secondary_ok": sum(1 for s in self.sources if s.layer == "secondary" and s.status == "ok"),
                "secondary_total": len(SECONDARY_SOURCES),
            },
            "index": self.index,
            "messages": self.messages,
            "sources": [
                {
                    "code": s.code, "name": s.name, "layer": s.layer, "status": s.status,
                    "value": s.value, "simulated": s.simulated,
                    "observation_date": s.observation_date, "age_days": s.age_days,
                    "detail": s.detail,
                }
                for s in self.sources
            ],
        }


def _parse_obs(obs: str | None) -> date | None:
    """observation_date kan YYYY-MM-DD of YYYY-MM (maandcijfer) zijn."""
    if not obs or not isinstance(obs, str):
        return None
    obs = obs.strip()[:10]
    for fmt in ("%Y-%m-%d", "%Y-%m"):
        try:
            return datetime.strptime(obs, fmt).date()
        except ValueError:
            continue
    return None


def _check_layer(
    expected: dict[str, tuple[str, int]],
    by_code: dict[str, dict],
    layer: str,
    today: date,
) -> list[SourceCheck]:
    checks: list[SourceCheck] = []
    for code, (name, max_age) in expected.items():
        r = by_code.get(code)
        if r is None:
            checks.append(SourceCheck(
                code, name, layer, "absent", None, False, None, None,
                "bron ontbreekt volledig in de dagrun (fetcher verdwenen of niet uitgevoerd)",
            ))
            continue

        value = r.get("value")
        simulated = bool(r.get("simulated"))
        source = str(r.get("source") or "")
        obs = r.get("observation_date") or r.get("date")
        obs_date = _parse_obs(obs)
        age = (today - obs_date).days if obs_date else None

        if simulated:
            checks.append(SourceCheck(
                code, name, layer, "mock", value, True, obs, age,
                f"viel terug op mock: {source[:80]}",
            ))
        elif source.lower().startswith("cache"):
            # Cache-terugval: de verse fetch mislukte, de fetcher stuurt een oude
            # cache-waarde uit met simulated=False (en vaak de datum van vandaag,
            # dus de leeftijds-check vangt 'm niet). Hier WEL zichtbaar gedegradeerd
            # tonen — de harde go-live-eis: een onbereikbare bron mag niet stil als
            # verse meting doorgaan.
            checks.append(SourceCheck(
                code, name, layer, "cache", value if isinstance(value, (int, float)) else None,
                False, obs, age,
                f"verse fetch mislukt, terugval op cache: {source[:80]}",
            ))
        elif value is None or not isinstance(value, (int, float)) or not math.isfinite(value):
            checks.append(SourceCheck(
                code, name, layer, "nan", value if isinstance(value, (int, float)) else None,
                False, obs, age, "echte fetch maar geen bruikbare (eindige) waarde",
            ))
        elif age is not None and age > max_age:
            # ZACHT: een echte maar verouderde waarde (bron blijft op oude data hangen).
            checks.append(SourceCheck(
                code, name, layer, "stale", float(value), False, obs, age,
                f"echte waarde maar {age}d oud (tolerantie {max_age}d)",
            ))
        else:
            # value 0 met simulated=False = GEZONDE nul. Geen alarm.
            checks.append(SourceCheck(
                code, name, layer, "ok", float(value), False, obs, age, "ok",
            ))
    return checks


def _check_index(index: dict | None) -> tuple[dict, list[str], bool]:
    """Controleer of de index effectief gevoed is. Retour: (index-samenvatting,
    boodschappen, index_critical)."""
    msgs: list[str] = []
    if not index:
        return ({"fed": False, "reason": "latest.json ontbreekt of is onleesbaar"},
                ["KRITIEK: geen index-output (latest.json) gevonden"], True)

    composite = ((index.get("composite") or {}).get("equal"))
    pct = ((index.get("percentile") or {}).get("short_24m"))
    breakdown = index.get("indicator_breakdown") or []
    scored = len(breakdown)
    n_missing = sum(1 for e in breakdown if e.get("state") == "ontbreekt")
    ts = index.get("timestamp") or index.get("generatedAt")

    critical = False
    composite_ok = isinstance(composite, (int, float)) and math.isfinite(composite)
    pct_ok = isinstance(pct, (int, float)) and 0 <= pct <= 100
    if not composite_ok:
        msgs.append(f"KRITIEK: composiet ontbreekt of is geen getal ({composite!r})")
        critical = True
    if not pct_ok:
        msgs.append(f"KRITIEK: percentiel buiten [0,100] of ontbreekt ({pct!r})")
        critical = True
    if scored != EXPECTED_SCORED_INDICATORS:
        msgs.append(f"KRITIEK: {scored} indicatoren in de breakdown, verwacht {EXPECTED_SCORED_INDICATORS}")
        critical = True
    if n_missing > THIN_COMPOSITE_MISSING:
        msgs.append(f"let op: {n_missing} indicatoren uitgesloten (ontbreekt) — composiet is dun")

    # Automatische referentie-audit (Peter 14/6): de engine reproduceert elk
    # cijfer uit zijn eigen referentie en weegt af of die consistent/gezond is.
    # Hier escaleren we het verdict: "critical" (niet-reproduceerbaar of
    # degeneraat = methodologie-inconsistentie) breekt de run rood; "degraded"
    # (dun/cross-seizoen/overgevoelig) is een informatieve notitie.
    audit = index.get("reference_audit")
    audit_verdict = None
    if isinstance(audit, dict):
        audit_verdict = audit.get("verdict")
        note = (audit.get("notes") or ["(geen toelichting)"])[0]
        if audit_verdict == "critical":
            msgs.append(f"KRITIEK: referentie-audit faalt — {note}")
            critical = True
        elif audit_verdict == "degraded":
            msgs.append(f"let op (referentie-audit): {note}")

    summary = {
        "fed": composite_ok and pct_ok and scored == EXPECTED_SCORED_INDICATORS,
        "composite_equal": composite if composite_ok else None,
        "percentile_short_24m": pct if pct_ok else None,
        "scored_indicators": scored,
        "indicators_excluded": n_missing,
        "reference_audit_verdict": audit_verdict,
        "timestamp": ts,
    }
    return summary, msgs, critical


def analyze(raw_values: dict, index: dict | None, today: date) -> HealthReport:
    """Pure kern: gegeven de dagrun (raw-values) + de index-output (latest.json),
    bepaal de bron-gezondheid en het verdict. Geen I/O, geen netwerk — testbaar."""
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ") \
        if not os.environ.get("SBI_HEALTHCHECK_FIXED_NOW") \
        else os.environ["SBI_HEALTHCHECK_FIXED_NOW"]

    target_date = (raw_values or {}).get("target_date") or today.isoformat()
    results = (raw_values or {}).get("results") or []
    secondary = (raw_values or {}).get("secondary") or []
    by_primary = {r.get("code"): r for r in results if isinstance(r, dict)}
    by_secondary = {r.get("code"): r for r in secondary if isinstance(r, dict)}

    messages: list[str] = []
    critical = False

    # [2] VERWERKING — staat er een verse dagrun?
    if not raw_values:
        messages.append("KRITIEK: geen raw-values.json — de fetch-stap leverde niets")
        critical = True
    else:
        run_date = _parse_obs(target_date)
        if run_date is None:
            messages.append(f"KRITIEK: dagrun zonder geldige target_date ({target_date!r})")
            critical = True
        elif (today - run_date).days > RAWVALUES_MAX_STALE_DAYS:
            messages.append(
                f"KRITIEK: dagrun is {(today - run_date).days}d oud ({target_date}) — "
                "de fetch draaide vandaag niet"
            )
            critical = True

    # [1] CONNECTIE — primaire + secundaire bronnen
    sources = _check_layer(PRIMARY_SOURCES, by_primary, "primary", today)
    sources += _check_layer(SECONDARY_SOURCES, by_secondary, "secondary", today)

    # [3] VOEDING — is de index gevoed?
    index_summary, index_msgs, index_critical = _check_index(index)
    messages += index_msgs
    critical = critical or index_critical

    # Verdict
    primary_down = [s for s in sources if s.layer == "primary" and s.is_down]
    secondary_down = [s for s in sources if s.layer == "secondary" and s.is_down]

    if len(primary_down) >= CRITICAL_PRIMARY_DOWN:
        messages.append(
            f"KRITIEK: {len(primary_down)} primaire bronnen plat "
            f"({', '.join(s.code for s in primary_down)}) — systeemstoring"
        )
        critical = True

    # Een volledig donker nieuws-domein (D5-cijfer) is kritiek: het cijfer is dan blind.
    news_codes = [c for c in PRIMARY_SOURCES if c.startswith("I-D5-")]
    if news_codes and all(by_primary.get(c, {}).get("simulated", True) or c in
                          {s.code for s in primary_down} for c in news_codes):
        messages.append("KRITIEK: alle nieuws-bronnen (D5) plat — het nieuws-cijfer is blind")
        critical = True

    # De referentie-audit kan zelfstandig degraderen (overgevoelig/dun/cross-
    # seizoen) ook al staan alle bronnen vers — dan is het cijfer geldig maar
    # fragiel, en dat hoort zichtbaar in het verdict.
    audit_degraded = index_summary.get("reference_audit_verdict") == "degraded"

    if critical:
        verdict = "critical"
    elif primary_down or secondary_down:
        verdict = "degraded"
        down = primary_down + secondary_down
        messages.append(
            f"degraded: {len(down)} bron(nen) niet op verse echte data — "
            + ", ".join(f"{s.code} ({s.status})" for s in down)
        )
    elif audit_degraded:
        verdict = "degraded"
    else:
        verdict = "ok"
        stale = [s for s in sources if s.status == "stale"]
        if stale:
            messages.append(
                "ok, met verouderingsnotitie: " + ", ".join(f"{s.code} {s.age_days}d" for s in stale)
            )
        else:
            messages.append("ok: alle bronnen op verse echte data, index gevoed")

    report = HealthReport(target_date, generated_at, verdict, sources, index_summary, messages)
    return report


# ---------------------------------------------------------------------------
# I/O-laag (main)
# ---------------------------------------------------------------------------

def _load_json(path: Path) -> dict | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def _render_text(report: HealthReport) -> str:
    icon = {"ok": "🟢", "degraded": "🟡", "critical": "🔴"}[report.verdict]
    lines = [
        f"{icon} SBI bron-gezondheid: {report.verdict.upper()}  ({report.target_date})",
        "",
    ]
    d = report.to_dict()
    s = d["summary"]
    lines.append(f"  connectie: {s['primary_ok']}/{s['primary_total']} primair, "
                 f"{s['secondary_ok']}/{s['secondary_total']} secundair op verse echte data")
    idx = report.index
    lines.append(f"  index    : gevoed={idx.get('fed')}  composiet={idx.get('composite_equal')}  "
                 f"percentiel={idx.get('percentile_short_24m')}  "
                 f"indicatoren={idx.get('scored_indicators')}")
    lines.append("")
    for sc in report.sources:
        if sc.status == "ok":
            continue
        mark = {"absent": "✗", "mock": "⚠", "nan": "⚠", "cache": "⚠", "stale": "·"}.get(sc.status, "?")
        lines.append(f"  {mark} [{sc.layer[:4]}] {sc.code} {sc.name}: {sc.status} — {sc.detail}")
    lines.append("")
    for m in report.messages:
        lines.append(f"  • {m}")
    return "\n".join(lines)


def _render_markdown(report: HealthReport) -> str:
    icon = {"ok": "🟢", "degraded": "🟡", "critical": "🔴"}[report.verdict]
    d = report.to_dict()
    s = d["summary"]
    out = [f"## {icon} SBI bron-gezondheid — {report.verdict.upper()} ({report.target_date})", ""]
    out.append(f"- connectie: **{s['primary_ok']}/{s['primary_total']}** primair, "
               f"**{s['secondary_ok']}/{s['secondary_total']}** secundair op verse echte data")
    out.append(f"- index gevoed: **{report.index.get('fed')}** "
               f"(composiet {report.index.get('composite_equal')}, "
               f"percentiel {report.index.get('percentile_short_24m')}, "
               f"{report.index.get('scored_indicators')} indicatoren)")
    down = [sc for sc in report.sources if sc.is_down]
    if down:
        out.append("")
        out.append("| bron | laag | status | detail |")
        out.append("|---|---|---|---|")
        for sc in down:
            out.append(f"| {sc.code} {sc.name} | {sc.layer} | {sc.status} | {sc.detail} |")
    out.append("")
    for m in report.messages:
        out.append(f"- {m}")
    return "\n".join(out)


def _emit_github(report: HealthReport, markdown: str) -> None:
    """Schrijf naar de GitHub Actions step-summary + outputs (verdict + message)."""
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        try:
            with open(summary_path, "a", encoding="utf-8") as f:
                f.write(markdown + "\n")
        except OSError:
            pass
    out_path = os.environ.get("GITHUB_OUTPUT")
    if out_path:
        # Eénregelige boodschap voor het alarm (degraded/critical samengevat).
        msg = next((m for m in report.messages if m.startswith(("KRITIEK", "degraded"))),
                   report.messages[-1] if report.messages else report.verdict)
        try:
            with open(out_path, "a", encoding="utf-8") as f:
                f.write(f"verdict={report.verdict}\n")
                f.write(f"message={msg}\n")
        except OSError:
            pass


def main(argv: list[str] | None = None) -> int:
    today = date.today()
    raw_values = _load_json(DATA_DIR / "raw-values.json") or {}
    # latest-expert.json is rijker; val terug op het publieke latest.json.
    index = _load_json(DATA_DIR / "latest-expert.json") or _load_json(DATA_DIR / "latest.json")

    report = analyze(raw_values, index, today)

    # Het machine-leesbare rapport. Naar web/public/data zodat het MEE-deployt en
    # altijd-actueel leesbaar is op /data/health-report.json (de dagelijkse
    # check-in + de app lezen het daar). Ook naar app/data zodat de alarm-stap in
    # de CI-runner het kan lezen. Bewust NIET committen (geen stale-bestand-val,
    # net als latest.json; het rapport draagt zelf een generated_at).
    payload = json.dumps(report.to_dict(), indent=2, ensure_ascii=False)
    for d in (DATA_DIR, WEB_PUBLIC):
        try:
            d.mkdir(parents=True, exist_ok=True)
            (d / "health-report.json").write_text(payload, encoding="utf-8")
        except OSError:
            pass
    # Markdown-versie (als issue-body voor de alarm-stap).
    markdown = _render_markdown(report)
    try:
        (DATA_DIR / "health-report.md").write_text(markdown, encoding="utf-8")
    except OSError:
        pass

    text = _render_text(report)
    print(text)
    _emit_github(report, markdown)

    # Exit-code: 0 = ok/degraded (build mag door), 2 = critical (index stuk).
    return 2 if report.verdict == "critical" else 0


if __name__ == "__main__":
    sys.exit(main())
