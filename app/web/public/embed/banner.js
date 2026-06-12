/**
 * SBI Banner Embed Script
 * Versie: 0.2.0-mvp
 *
 * Publieke banner-widget die het SBI-signaal automatisch vertaalt naar een
 * brand-veilige banner. Volgt de stijlgids uit doc 09 strikt — copy is hier
 * hard-gecodeerd; abonnees kunnen alleen merknaam en CTA-URL zetten.
 *
 * Gebruik:
 *   <div id="sbi-banner"></div>
 *   <script src="https://barometer.sbi/embed/banner.js" defer></script>
 *   <script>
 *     window.addEventListener('load', () => SBI.mount({
 *       target: '#sbi-banner',
 *       apiUrl: 'https://barometer.sbi/api/v1/signal',
 *       brand: 'Les Hautes Alpes',
 *       ctaUrl: 'https://www.hautes-alpes.net'
 *     }));
 *   </script>
 *
 * GEEN dependencies. GEEN tracking. GEEN cookies.
 */
(function (window) {
  "use strict";

  var COPY = {
    1: { active: false, text: null, action: null },
    2: { active: false, text: null, action: null },
    3: {
      active: true,
      headline: "Verhoogd-blootstellings-venster open.",
      body: "Wanneer de condities verhoogd zijn, weegt rust extra zwaar.",
      action: "Tijd voor rust",
    },
    4: {
      active: true,
      headline: "Blootstellings-conditie op piekniveau.",
      body: "Statistisch gezien is dit een goed moment voor herstel — preventief, terwijl het kan.",
      action: "Bekijk de bestemmingen",
    },
    5: {
      active: false, // override — geen commerciële banner
      text: null,
      action: null,
    },
  };

  var STYLES = ""
    + ".sbi-b{font-family:system-ui,-apple-system,Helvetica,Arial,sans-serif;"
    + "border-radius:8px;padding:18px 22px;color:#f1faee;line-height:1.45;"
    + "max-width:640px;box-sizing:border-box}"
    + ".sbi-b-3{background:linear-gradient(135deg,#1d3557 0%,#b08438 130%)}"
    + ".sbi-b-4{background:linear-gradient(135deg,#1d3557 0%,#9d2935 130%)}"
    + ".sbi-b-mark{font-size:11px;letter-spacing:0.2em;color:#a8dadc;margin-bottom:8px}"
    + ".sbi-b-headline{font-size:18px;font-weight:500;margin:0 0 6px}"
    + ".sbi-b-body{font-size:14px;color:rgba(255,255,255,0.86);margin:0 0 12px}"
    + ".sbi-b-action{display:inline-block;color:#f1faee;text-decoration:none;"
    + "padding:8px 16px;border:1px solid #a8dadc;border-radius:6px;font-size:14px;"
    + "transition:background 120ms}"
    + ".sbi-b-action:hover{background:rgba(168,218,220,0.16)}"
    + ".sbi-b-meta{margin-top:10px;font-size:11px;color:rgba(255,255,255,0.55);"
    + "letter-spacing:0.05em}"
    + ".sbi-b-meta a{color:rgba(255,255,255,0.55);text-decoration:underline}";

  function injectStyles() {
    if (document.getElementById("sbi-banner-styles")) return;
    var s = document.createElement("style");
    s.id = "sbi-banner-styles";
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderBanner(target, level, brand, ctaUrl, timestamp) {
    var copy = COPY[level];
    if (!copy || !copy.active) {
      target.innerHTML = ""; // geen commerciële banner bij CN 1, 2, 5
      target.setAttribute("data-sbi-cn", String(level));
      return;
    }

    var ctaHtml = ctaUrl && copy.action
      ? '<a class="sbi-b-action" href="' + escapeHtml(ctaUrl)
        + '" target="_blank" rel="noopener noreferrer">'
        + escapeHtml(copy.action) + " &rarr;</a>"
      : "";

    var dateStr = timestamp ? new Date(timestamp).toLocaleDateString("nl-BE") : "";

    target.innerHTML = ""
      + '<div class="sbi-b sbi-b-' + level + '">'
      + (brand ? '<div class="sbi-b-mark">' + escapeHtml(brand).toUpperCase() + "</div>" : "")
      + '<div class="sbi-b-headline">' + escapeHtml(copy.headline) + "</div>"
      + '<div class="sbi-b-body">' + escapeHtml(copy.body) + "</div>"
      + ctaHtml
      + '<div class="sbi-b-meta">De Nationale Stress Barometer &middot; niveau ' + level + "/5"
      + (dateStr ? " &middot; " + escapeHtml(dateStr) : "")
      + " &middot; <a href=\"https://barometer.sbi/methodologie\">methodologie</a>"
      + "</div>"
      + "</div>";
    target.setAttribute("data-sbi-cn", String(level));
  }

  function fetchSignal(apiUrl) {
    return fetch(apiUrl, { credentials: "omit", cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("SBI signal HTTP " + r.status);
        return r.json();
      });
  }

  function mount(options) {
    options = options || {};
    if (!options.target || !options.apiUrl) {
      console.error("[SBI] mount(): vereist target + apiUrl");
      return;
    }

    var target = typeof options.target === "string"
      ? document.querySelector(options.target)
      : options.target;
    if (!target) {
      console.error("[SBI] target niet gevonden:", options.target);
      return;
    }

    injectStyles();

    fetchSignal(options.apiUrl)
      .then(function (signal) {
        // A7: op een demo-dag (score_label "demo") draait de dagscore op
        // testdata en mag er geen commerciële banner op vertrouwen. Render niets.
        var scoreLabel = signal.score_label ||
          (signal.data_quality && signal.data_quality.score_label);
        if (scoreLabel === "demo") {
          target.innerHTML = "";
          target.setAttribute("data-sbi-demo", "1");
          return;
        }

        // Twee API-vormen: signal-API (minimal) of full daily-output
        var level = signal.condition_level
          ? (signal.condition_level.value || signal.condition_level)
          : (signal.level || 1);
        var timestamp = signal.timestamp || signal.generated_at;

        renderBanner(target, level, options.brand, options.ctaUrl, timestamp);
      })
      .catch(function (err) {
        console.warn("[SBI] kon signal niet laden:", err.message);
        target.innerHTML = ""; // fail-silent
      });
  }

  window.SBI = { mount: mount, version: "0.2.0-mvp" };
})(typeof window !== "undefined" ? window : this);
