"""Standalone test voor de fetcher-cache-ladders (A4) + provenance-velden.
Run: python3 app/pipeline/tests/test_fetcher_ladders.py

Borgt het irail.py-patroon op de maandbron-fetchers: succes → cache_put + echte
waarde; transiente endpoint-failure → EERST cache (simulated=False, source-prefix
"cache" — exact de conventie die healthcheck.py als degraded markeert); pas bij
failure + lege cache → mock (simulated=True, source-prefix "mock"). Plus de
provenance-uitbreiding van FetchResult: fetched_at automatisch, source_url
stroomt mee via FetchBatch.to_dict() naar raw-values.json.

Netwerk wordt gemockt door safe_request in de fetcher-module te monkeypatchen;
de cache door cache_get/cache_put te monkeypatchen — geen echte calls of file-IO.
"""
import os
import sys
from datetime import date, datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline.fetchers import consumer_confidence, nbb, statbel  # noqa: E402
from pipeline.util import FetchBatch, FetchResult  # noqa: E402

TARGET = date(2026, 6, 11)


def _ecb_body(value: float, period: str = "2026-04") -> dict:
    """Minimale geldige ECB SDW JSON-data-respons (1 serie, 1 observatie)."""
    return {
        "dataSets": [{"series": {"0:0:0:0:0:0": {"observations": {"0": [value]}}}}],
        "structure": {"dimensions": {"observation": [{"values": [{"id": period}]}]}},
    }


def _eurostat_body(value: float, period: str = "2026-05") -> dict:
    """Minimale geldige Eurostat JSON-stat-respons (1 observatie)."""
    return {
        "value": {"0": value},
        "dimension": {"time": {"category": {"index": {period: 0}}}},
    }


class _PutSpy:
    def __init__(self):
        self.calls = []

    def __call__(self, code, value, source, target_date):
        self.calls.append((code, value, source, target_date))


def _patch(module, *, ok, body, cached, put=None):
    """Zet safe_request/cache_get/cache_put van een fetcher-module op fixtures."""
    module.safe_request = lambda *a, **k: (ok, body)
    module.cache_get = lambda code: cached
    module.cache_put = put if put is not None else _PutSpy()
    return module.cache_put


# --- (a) nbb: hypotheekrente I-D3-006 ----------------------------------------

def test_nbb_failure_met_cache_geeft_cache_niet_mock():
    _patch(nbb, ok=False, body="timeout", cached=(3.25, "ECB MIR (BE hypotheekrente, nieuwe contracten)"))
    r = nbb.fetch_mortgage_rate(TARGET)
    assert r.simulated is False, r
    assert r.source.startswith("cache"), r.source
    assert "laatst succesvol" in r.source, r.source
    assert r.value == 3.25, r.value


def test_nbb_failure_zonder_cache_geeft_mock():
    _patch(nbb, ok=False, body="timeout", cached=None)
    r = nbb.fetch_mortgage_rate(TARGET)
    assert r.simulated is True, r
    assert r.source.startswith("mock"), r.source


def test_nbb_succes_vult_cache_en_plausibele_range():
    put = _patch(nbb, ok=True, body=_ecb_body(3.1), cached=None)
    r = nbb.fetch_mortgage_rate(TARGET)
    assert r.simulated is False, r
    assert not r.source.startswith(("cache", "mock")), r.source
    assert 0.5 <= r.value <= 10, r.value          # plausibele hypotheekrente
    assert len(put.calls) == 1, put.calls
    assert put.calls[0][0] == "I-D3-006" and put.calls[0][1] == 3.1, put.calls
    assert r.source_url == nbb.ECB_MORTGAGE_URL, r.source_url
    assert r.observation_date == "2026-04", r.observation_date


# --- (b) consumer_confidence I-D3-007 + statbel fetch_cpi I-D3-001 ------------

def test_consumer_confidence_failure_met_cache_geeft_cache():
    _patch(consumer_confidence, ok=False, body="503", cached=(-8.7, "Eurostat ei_bsco_m"))
    r = consumer_confidence.fetch_consumer_confidence(TARGET)
    assert r.simulated is False, r
    assert r.source.startswith("cache"), r.source
    assert r.value == -8.7, r.value


def test_consumer_confidence_failure_zonder_cache_geeft_mock():
    _patch(consumer_confidence, ok=False, body="503", cached=None)
    r = consumer_confidence.fetch_consumer_confidence(TARGET)
    assert r.simulated is True, r
    assert r.source.startswith("mock"), r.source


def test_consumer_confidence_succes_vult_cache():
    put = _patch(consumer_confidence, ok=True, body=_eurostat_body(-9.2), cached=None)
    r = consumer_confidence.fetch_consumer_confidence(TARGET)
    assert r.simulated is False, r
    assert r.value == -9.2, r.value
    assert put.calls and put.calls[0][0] == "I-D3-007", put.calls
    assert r.source_url == consumer_confidence.EUROSTAT_CONS_URL, r.source_url


def test_statbel_cpi_failure_met_cache_geeft_cache():
    _patch(statbel, ok=False, body="timeout", cached=(2.8, "ECB SDW (BE HICP yoy %)"))
    r = statbel.fetch_cpi(TARGET)
    assert r.simulated is False, r
    assert r.source.startswith("cache"), r.source
    assert r.value == 2.8, r.value


def test_statbel_cpi_failure_zonder_cache_geeft_mock():
    _patch(statbel, ok=False, body="timeout", cached=None)
    r = statbel.fetch_cpi(TARGET)
    assert r.simulated is True, r
    assert r.source.startswith("mock"), r.source


def test_statbel_cpi_succes_vult_cache():
    put = _patch(statbel, ok=True, body=_ecb_body(2.6, "2026-05"), cached=None)
    r = statbel.fetch_cpi(TARGET)
    assert r.simulated is False, r
    assert r.value == 2.6, r.value
    assert put.calls and put.calls[0][0] == "I-D3-001", put.calls
    assert r.source_url == statbel.ECB_CPI_URL, r.source_url


# --- (c) provenance: fetched_at automatisch, source_url in to_dict() ----------

def test_fetchresult_krijgt_fetched_at_automatisch():
    r = FetchResult("X-1", 1.0, "2026-06-11")
    assert r.fetched_at, r.fetched_at
    datetime.fromisoformat(r.fetched_at)            # geldig ISO-tijdstip
    assert r.source_url == "", r.source_url         # default leeg


def test_source_url_en_fetched_at_stromen_mee_in_to_dict():
    batch = FetchBatch("2026-06-11")
    batch.add(FetchResult("X-1", 1.0, "2026-06-11", source_url="https://example.org/api"))
    d = batch.to_dict()
    row = d["results"][0]
    assert row["source_url"] == "https://example.org/api", row
    assert row["fetched_at"], row


def _run():
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    failed = 0
    for t in tests:
        try:
            t()
            print(f"  ✓ {t.__name__}")
        except AssertionError as e:
            failed += 1
            print(f"  ✗ {t.__name__}: {e}")
    print(f"\n{len(tests) - failed}/{len(tests)} geslaagd")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(_run())
