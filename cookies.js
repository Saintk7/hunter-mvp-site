(function () {
  var STORAGE_KEY = "hunter_cookie_preferences";
  var DEFAULTS = {
    necessary: true,
    analytics: false
  };

  function readPreferences() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return {
        necessary: true,
        analytics: !!parsed.analytics
      };
    } catch (err) {
      return null;
    }
  }

  function writePreferences(prefs) {
    var normalized = {
      necessary: true,
      analytics: !!prefs.analytics
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (err) {}
    return normalized;
  }

  function setToggleState(prefs) {
    var analyticsToggle = document.getElementById("cookieAnalytics");
    if (analyticsToggle) analyticsToggle.checked = !!prefs.analytics;
  }

  function applyConsent(prefs) {
    var root = document.documentElement;
    var banner = document.getElementById("cookieBanner");
    var saved = !!prefs;
    var effective = prefs || DEFAULTS;

    root.setAttribute("data-cookie-consent", saved ? "saved" : "unset");
    root.setAttribute("data-cookie-analytics", effective.analytics ? "granted" : "denied");
    window.hunterCookieConsent = effective;

    if (banner) {
      banner.style.display = saved ? "none" : "";
      banner.classList.remove("cookie-banner--expanded");
    }

    setToggleState(effective);
    applyAnalyticsConsent(effective.analytics);
  }

  function revealBanner(expanded) {
    var banner = document.getElementById("cookieBanner");
    if (!banner) return;
    banner.style.display = "";
    if (expanded) {
      banner.classList.add("cookie-banner--expanded");
    } else {
      banner.classList.remove("cookie-banner--expanded");
    }
    setToggleState(readPreferences() || DEFAULTS);
  }

  function applyAnalyticsConsent(enabled) {
    var gatedBlocks = document.querySelectorAll("[data-requires-consent='analytics']");
    gatedBlocks.forEach(function (node) {
      node.style.display = enabled ? "" : "none";
    });

    if (!enabled) return;

    var deferredScripts = document.querySelectorAll("script[data-consent-src='analytics']");
    deferredScripts.forEach(function (script) {
      if (script.dataset.loaded === "true") return;
      var realScript = document.createElement("script");
      realScript.src = script.getAttribute("data-src");
      if (script.hasAttribute("data-async")) realScript.async = true;
      if (script.hasAttribute("data-defer")) realScript.defer = true;
      script.dataset.loaded = "true";
      document.head.appendChild(realScript);
    });
  }

  window.hunterAcceptCookies = function () {
    applyConsent(writePreferences({ analytics: true }));
  };

  window.hunterRejectCookies = function () {
    applyConsent(writePreferences({ analytics: false }));
  };

  window.hunterSaveCookieSettings = function () {
    var analyticsToggle = document.getElementById("cookieAnalytics");
    applyConsent(writePreferences({ analytics: !!(analyticsToggle && analyticsToggle.checked) }));
  };

  window.hunterOpenCookieSettings = function () {
    revealBanner(true);
  };

  window.hunterCloseCookieSettings = function () {
    var prefs = readPreferences();
    if (prefs) {
      applyConsent(prefs);
    } else {
      revealBanner(false);
    }
  };

  window.hunterResetCookieConsent = function () {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {}
    applyConsent(null);
    revealBanner(true);
  };

  document.addEventListener("DOMContentLoaded", function () {
    applyConsent(readPreferences());
  });
})();
