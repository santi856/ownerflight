/* OwnerFlight live agency counter.
   Reads assets/agency-count.json (same-origin, updated by the data pipeline
   on every verified merge) and swaps the baked fallback number for the live
   count in visible text. Fails silently: if the fetch fails or the payload
   is malformed, the baked number stays exactly as published.

   FALLBACK TOKEN: "10,220" below is the baked site number. When the baked
   site number changes, update FALLBACK_AGENCY_COUNT here to match, and keep
   FALLBACK_STATE_COUNT in sync with the baked state count. */
(function () {
  "use strict";

  var FALLBACK_AGENCY_COUNT = "10,220";
  var FALLBACK_STATE_COUNT = "24";

  function format(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function apply(agencies, states) {
    var liveAgencies = format(agencies);
    var liveStates = String(states);

    // Direct hooks: hero stats and any explicitly marked element.
    var agencyEls = document.querySelectorAll(".js-agency-count");
    for (var i = 0; i < agencyEls.length; i++) {
      agencyEls[i].textContent = liveAgencies;
    }
    var stateEls = document.querySelectorAll(".js-state-count");
    for (var j = 0; j < stateEls.length; j++) {
      stateEls[j].textContent = liveStates;
    }

    if (liveAgencies === FALLBACK_AGENCY_COUNT) return;

    // Text-node replacement: swap just the number portion of the baked
    // token wherever it appears in visible text, including inside strings
    // like "9,102-record" or "9,102 agencies". Attributes, <script> and
    // <style> content are not touched.
    var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          if (!node.nodeValue || node.nodeValue.indexOf(FALLBACK_AGENCY_COUNT) === -1) {
            return NodeFilter.FILTER_REJECT;
          }
          var parent = node.parentNode;
          if (!parent) return NodeFilter.FILTER_REJECT;
          var tag = parent.nodeName;
          if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (var k = 0; k < nodes.length; k++) {
      nodes[k].nodeValue = nodes[k].nodeValue.split(FALLBACK_AGENCY_COUNT).join(liveAgencies);
    }
  }

  function load() {
    if (typeof window.fetch !== "function") return; // leave baked number
    fetch("assets/agency-count.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("count fetch failed");
        return res.json();
      })
      .then(function (data) {
        var agencies = parseInt(data && data.verified_agencies, 10);
        var states = parseInt(data && data.states, 10);
        if (!isFinite(agencies) || agencies <= 0) return; // leave baked number
        if (!isFinite(states) || states <= 0) states = parseInt(FALLBACK_STATE_COUNT, 10);
        apply(agencies, states);
      })
      .catch(function () {
        /* Silent by design: the baked fallback number stays visible. */
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
