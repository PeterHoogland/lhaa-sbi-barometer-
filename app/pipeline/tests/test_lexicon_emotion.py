"""Standalone test voor lexicon_emotion_nl (geen pytest-dependency).
Run: python3 app/pipeline/tests/test_lexicon_emotion.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline.lexicon_emotion_nl import (  # noqa: E402
    emotions_of_text,
    aggregate_emotions,
    EMOTION_CATEGORIES,
)


def test_dominant_per_emotion():
    cases = {
        "woede": "Woedende betogers eisen ontslag, razend protest en verzet",
        "angst": "Angst en paniek na terreurdreiging, mensen vrezen een aanslag",
        "verdriet": "Verdriet en rouw na tragisch overlijden, tranen en groot gemis",
        "walging": "Walgelijk schandaal: weerzinwekkende corruptie en misbruik",
    }
    for expected, text in cases.items():
        prof = aggregate_emotions([text])
        assert prof["dominant"] == expected, (
            f"{text!r} → dominant {prof['dominant']}, verwacht {expected} "
            f"(intensity={prof['intensity']})"
        )


def test_neutral_text_has_no_emotion():
    prof = aggregate_emotions(["De gemeenteraad vergadert maandag over het nieuwe fietspad"])
    assert prof["dominant"] is None, f"neutraal → {prof['dominant']}, verwacht None"
    assert all(v == 0.0 for v in prof["intensity"].values())


def test_short_text_is_skipped():
    assert emotions_of_text("te kort", min_words=3) is None


def test_intensity_is_per_100_words():
    # 1 emotie-woord ("angst") op een korte zin → intensity = 1/n_words*100 in 'angst'
    prof = aggregate_emotions(["De groeiende angst onder bewoners blijft"])
    assert prof["counts"]["angst"] == 1
    assert prof["intensity"]["angst"] > 0
    assert prof["n_words"] == 6  # de, groeiende, angst, onder, bewoners, blijft


def test_aggregate_combines_headlines():
    prof = aggregate_emotions([
        "Woede en protest in de straten",
        "Angst en paniek na de dreiging",
        "te kort",  # wordt overgeslagen
    ])
    assert prof["n_headlines"] == 2
    assert prof["counts"]["woede"] >= 1
    assert prof["counts"]["angst"] >= 1
    assert set(prof["intensity"].keys()) == set(EMOTION_CATEGORIES)


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
