"""Standalone test voor lexicon_nl (valentie + negatie/versterkers).
Run: python3 app/pipeline/tests/test_lexicon_nl.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline.lexicon_nl import tone_of_text, NEGATIVE, POSITIVE  # noqa: E402


def _tone(text: str) -> float:
    r = tone_of_text(text)
    assert r is not None, f"te kort: {text!r}"
    return r[0]


def test_neutraal_is_ongeveer_nul():
    # Een feitelijke, niet-emotionele kop ligt dicht bij 0.
    assert abs(_tone("De gemeenteraad vergadert vanavond over het budget")) < 8.0


def test_stress_kop_is_sterk_negatief():
    assert _tone("Zware ramp eist vele slachtoffers na explosie") < -20.0


def test_positieve_kop_is_positief():
    assert _tone("Succesvolle redding en herstel na akkoord") > 10.0


def test_negatie_keert_negatief_om():
    # "niet slecht" hoort niet als negatief te scoren (linguïstische fix).
    assert _tone("Dit is niet slecht nieuws voor de buurt") > 0.0


def test_negatie_op_positief_dempt_of_keert():
    # "geen vooruitgang" mag niet positief scoren.
    assert _tone("Er is geen vooruitgang en geen oplossing") <= 0.0


def test_versterker_vergroot_magnitude():
    # Op een realistische headline-lengte weegt de versterker zwaarder dan de
    # extra term in de noemer. (Op piepkorte zinnen middelt sum/n het weg.)
    base = _tone("Ramp treft de regio en de getroffen bevolking blijft bezorgd achter")
    boosted = _tone("Zeer zware ramp treft de regio en de getroffen bevolking blijft bezorgd achter")
    assert boosted < base  # negatiever (sterker)


def test_uitgebreide_vocabulaire_herkend():
    # Nieuwe stress-/crisis-termen uit de uitbreiding moeten negatief tellen.
    for woord in ("burn-out", "energiearmoede", "faillissement", "uithuiszetting"):
        assert woord in NEGATIVE, f"ontbreekt in NEGATIVE: {woord}"
    for woord in ("opluchting", "verzoening", "heropleving"):
        assert woord in POSITIVE, f"ontbreekt in POSITIVE: {woord}"


def test_te_korte_tekst_overgeslagen():
    assert tone_of_text("twee woorden") is None


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
