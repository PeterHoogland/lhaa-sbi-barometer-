"""
Nationale Bank België — hypotheekrente.
Doc 03_Laag-4 §2.3: I-D3-006.

We halen de hypotheekrente via de ECB MIR-dataset (Monetary financial Institutions
Interest Rates). ECB krijgt deze data van de nationale centrale banken inclusief
NBB. De ECB SDW JSON-API is open, geen token nodig.

Key voor BE woonkredieten:
  M = monthly, BE = Belgium, B = MFI sector,
  A2C = Lending to households for house purchase, A = total,
  R = annualised agreed rate, A = new business
"""
from __future__ import annotations
from datetime import date
from ..util import FetchResult, safe_request, seasonal_noise
from .statbel import _parse_ecb_latest


ECB_MORTGAGE_URL = (
    "https://data-api.ecb.europa.eu/service/data/MIR/M.BE.B.A2C.A.R.A.2250.EUR.N"
    "?format=jsondata&lastNObservations=1"
)


def fetch_mortgage_rate(target_date: date) -> FetchResult:
    ok, body = safe_request(ECB_MORTGAGE_URL, timeout=20, headers={"Accept": "application/json"})
    if ok and isinstance(body, dict):
        val = _parse_ecb_latest(body)
        if val is not None:
            return FetchResult(
                "I-D3-006", val, target_date.isoformat(),
                simulated=False, source="ECB MIR (BE hypotheekrente, nieuwe contracten)",
            )
    value = 3.4 + seasonal_noise(target_date, 0, 0, 0.15, 0.0)
    return FetchResult(
        "I-D3-006", value, target_date.isoformat(),
        simulated=True, source="mock (ECB MIR endpoint faalde)",
    )
