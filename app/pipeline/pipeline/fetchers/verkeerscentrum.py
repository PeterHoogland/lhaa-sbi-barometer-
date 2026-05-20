"""
Vlaams Verkeerscentrum — live filedruk via scraping van de filebarometer-widget.
Doc 03_Laag-4 §2.2: I-D2-001 Filezwaarte.

Implementation: het Verkeerscentrum publiceert geen open API maar toont op
hun publieke homepage een "filebarometer" met het huidige aantal km file.
We parsen dat getal uit de HTML.

Eerlijke beperking: filebarometer = momentane km file, niet "file-km × file-min"
zoals doc 03 §2.1 voorschrijft. Dit is een **proxy** voor F_total, want de
publieke widget rapporteert geen tijds-integraal. Update wanneer een betere
bron beschikbaar komt.
"""
from __future__ import annotations
import re
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise


HOMEPAGE_URL = "https://www.verkeerscentrum.be"
# Pattern matcht "filebarometer">5,40 km   (waarde varieert in scheidingsteken)
FILE_PATTERN = re.compile(r'filebarometer">(\d+(?:[,.]\d+)?)\s*km', re.IGNORECASE)


def fetch_traffic_load(target_date: date) -> FetchResult:
    ok, body = safe_request(
        HOMEPAGE_URL,
        timeout=20,
        headers={"User-Agent": "Mozilla/5.0 (SBI-pipeline)"},
    )
    if ok and isinstance(body, str):
        match = FILE_PATTERN.search(body)
        if match:
            km_str = match.group(1).replace(",", ".")
            try:
                km = float(km_str)
                # Schaal naar km·min equivalent: huidige km × typische 60min spitsduur
                # Dit is een grove benadering — zie doc-string disclaimer.
                value = km * 60
                return FetchResult(
                    "I-D2-001", value, target_date.isoformat(),
                    simulated=False, source="Vlaams Verkeerscentrum (filebarometer scrape)",
                )
            except ValueError:
                pass

    # Mock fallback met weekdag-correctie
    weekday = target_date.weekday()
    is_weekday = 0 <= weekday <= 4
    base = 7500 if is_weekday else 1500
    value = max(0.0, base + seasonal_noise(target_date, 0, 1500, 1200, -0.5))
    return FetchResult(
        "I-D2-001", value, target_date.isoformat(),
        simulated=True, source="mock (Verkeerscentrum scrape faalde)",
    )
