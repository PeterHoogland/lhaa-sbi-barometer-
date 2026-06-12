/**
 * Gereconstrueerd JUNE20-woordmerk (bron: poster, Peter 13/6). Puur
 * typografisch nagebouwd — geen beeldmateriaal overgenomen: Inter Black in
 * het June20-signaalrood, met de karakteristieke 180 graden gedraaide J.
 * De rest van de poster (waveform) is bewust genegeerd.
 */
export function June20Mark() {
  return (
    <span className="j20-mark" aria-label="JUNE20">
      <span className="j20-mark-j" aria-hidden="true">J</span>
      <span aria-hidden="true">UNE20</span>
    </span>
  );
}
