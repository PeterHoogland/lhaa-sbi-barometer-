"""
Consumentenvertrouwen (I-D3-007) — EC/Eurostat geharmoniseerd, België.
Peter GO 2026-06-03: het sterkste nieuwe GESCOORDE signaal.

WAAROM
------
Een maandelijks, enquête-gebaseerd, VOORLOPEND sentiment-cijfer (verwachtingen over
de financiële situatie, werkloosheid, sparen). Dat meet collectief economisch
onbehagen rechtstreeks — iets wat de nieuws-laag (GDELT) niet vangt, want het komt
uit een enquête, niet uit headlines. Geen dubbeltelling.

BRON
----
De NBB-eigen API (stat.nbb.be) antwoordt niet stabiel vanaf een server-IP. Het EC-
geharmoniseerde consumentenvertrouwen via **Eurostat ei_bsco_m** (indicator BS-CSMCI,
seizoens-gecorrigeerd, saldo) geeft hetzelfde cijfer wél schoon, met lange historie
(zie data/history/I-D3-007.json, 2010-heden), en dezelfde infrastructuur als de
werkloosheids-fetcher. Maandelijks → forward-fill tussen prints (doc 03 §3.2).

CODERING: hoog vertrouwen = LAGE stress, dus in de registry inverse-coded
(inverseCoded: true). Een saldo onder het normale (pessimisme) levert positieve stress.
Bron is al seizoens-gecorrigeerd → geen STL.
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from ..cache import get_with_date as cache_get_with_date, put as cache_put
from .statbel import _parse_eurostat_latest

EUROSTAT_CONS_URL = (
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/ei_bsco_m"
    "?geo=BE&indic=BS-CSMCI&s_adj=SA&unit=BAL&format=JSON&lastTimePeriod=1"
)


def fetch_consumer_confidence(target_date: date) -> FetchResult:
    """EC/Eurostat consumentenvertrouwen-saldo voor België (I-D3-007)."""
    ok, body = safe_request(EUROSTAT_CONS_URL, timeout=25, headers={"Accept": "application/json"})
    if ok and isinstance(body, dict):
        result = _parse_eurostat_latest(body)
        if result is not None:
            val, period = result
            source = "Eurostat ei_bsco_m (EC consumentenvertrouwen BE, saldo, seizoens-gecorrigeerd)"
            cache_put("I-D3-007", val, source, target_date.isoformat(), observation_date=period)
            return FetchResult(
                "I-D3-007", val, target_date.isoformat(),
                simulated=False,
                source=source,
                observation_date=period,
                source_url=EUROSTAT_CONS_URL,
            )

    # Cache-vangnet (≤14d) vóór de mock — zelfde ladder als irail.py/nbb.py.
    cached = cache_get_with_date("I-D3-007")
    if cached:
        value, prev_source, cached_obs = cached
        return FetchResult(
            "I-D3-007", value, target_date.isoformat(),
            simulated=False,
            source=f"cache (laatst succesvol: {prev_source})",
            observation_date=cached_obs,
            source_url=EUROSTAT_CONS_URL,
        )

    # Mock: rond het lange-termijn-gemiddelde (~ -10 saldo voor BE)
    value = -10.0 + seasonal_noise(target_date, 0, 0, 4.0, 0.0)
    return FetchResult(
        "I-D3-007", value, target_date.isoformat(),
        simulated=True, source="mock (Eurostat ei_bsco_m endpoint faalde, geen cache)",
    )
