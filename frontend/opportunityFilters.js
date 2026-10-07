/**
 * OpportunityFilters
 * Core domain logic for Market Opportunities filtering.
 * Modular, dependency-free, and cross-environment (Browser & Node.js test runner).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.OpportunityFilters = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const OPP_FILTER_OPTIONS = {
    risk: ["Low", "Moderate", "High"],
    confidence: ["High", "Medium", "Low"],
    rating: ["Buy", "Hold", "Sell", "Watch", "Trim"],
  };

  function normalizeRisk(val) {
    if (!val) return "";
    const s = String(val).trim().toUpperCase();
    if (s === "LOW") return "Low";
    if (s === "MODERATE" || s === "MED" || s === "MEDIUM") return "Moderate";
    if (s === "HIGH") return "High";
    return s;
  }

  function normalizeConfidence(val) {
    if (!val) return "";
    const s = String(val).trim().toUpperCase();
    if (s === "HIGH") return "High";
    if (s === "MEDIUM" || s === "MODERATE" || s === "MED") return "Medium";
    if (s === "LOW") return "Low";
    return s;
  }

  function normalizeRating(val) {
    if (!val) return "";
    const s = String(val).trim().toUpperCase();
    if (s === "BUY" || s === "STRONG BUY") return "Buy";
    if (s === "HOLD" || s === "NEUTRAL") return "Hold";
    if (s === "SELL" || s === "STRONG SELL") return "Sell";
    if (s === "WATCH") return "Watch";
    if (s === "TRIM") return "Trim";
    return s;
  }

  function createInitialFilterState() {
    return {
      risk: [],
      confidence: [],
      rating: [],
    };
  }

  function cloneFilterState(filters) {
    return {
      risk: Array.isArray(filters?.risk) ? [...filters.risk] : [],
      confidence: Array.isArray(filters?.confidence) ? [...filters.confidence] : [],
      rating: Array.isArray(filters?.rating) ? [...filters.rating] : [],
    };
  }

  function areFiltersEqual(a, b) {
    if (!a && !b) return true;
    if (!a || !b) return false;
    const groups = ["risk", "confidence", "rating"];
    for (const g of groups) {
      const arrA = Array.isArray(a[g]) ? [...a[g]].sort() : [];
      const arrB = Array.isArray(b[g]) ? [...b[g]].sort() : [];
      if (arrA.length !== arrB.length) return false;
      for (let i = 0; i < arrA.length; i++) {
        if (arrA[i] !== arrB[i]) return false;
      }
    }
    return true;
  }

  function countSelectedFilters(filters) {
    if (!filters) return 0;
    return (
      (filters.risk?.length || 0) +
      (filters.confidence?.length || 0) +
      (filters.rating?.length || 0)
    );
  }

  function matchesFilters(item, filters) {
    if (!item || typeof item !== "object") return false;

    // RISK check: if active selection exists, item must match one; otherwise it passes
    if (filters?.risk && filters.risk.length > 0) {
      const normRisk = normalizeRisk(item.risk_level);
      if (!normRisk || !filters.risk.includes(normRisk)) {
        return false;
      }
    }

    // CONFIDENCE check
    if (filters?.confidence && filters.confidence.length > 0) {
      const normConf = normalizeConfidence(item.confidence);
      if (!normConf || !filters.confidence.includes(normConf)) {
        return false;
      }
    }

    // RATING check
    if (filters?.rating && filters.rating.length > 0) {
      const normRating = normalizeRating(item.rating);
      if (!normRating || !filters.rating.includes(normRating)) {
        return false;
      }
    }

    return true;
  }

  function filterOpportunities(items, filters) {
    if (!Array.isArray(items)) return [];
    return items.filter((item) => matchesFilters(item, filters));
  }

  function toggleFilterOption(filters, group, option) {
    const next = cloneFilterState(filters);
    if (!next[group]) next[group] = [];
    const idx = next[group].indexOf(option);
    if (idx > -1) {
      next[group].splice(idx, 1);
    } else {
      next[group].push(option);
    }
    return next;
  }

  function removeFilterOption(filters, group, option) {
    const next = cloneFilterState(filters);
    if (!next[group]) return next;
    next[group] = next[group].filter((val) => val !== option);
    return next;
  }

  function parseFiltersFromQueryString(search) {
    const state = createInitialFilterState();
    if (!search) return state;

    try {
      const q = search.startsWith("?") ? search.slice(1) : search;
      const params = new URLSearchParams(q);

      const mapping = {
        opp_risk: "risk",
        opp_confidence: "confidence",
        opp_conf: "confidence",
        opp_rating: "rating",
      };

      for (const [key, group] of Object.entries(mapping)) {
        const val = params.get(key);
        if (!val) continue;

        const rawTokens = val.split(",").map((t) => t.trim()).filter(Boolean);
        const normalizer =
          group === "risk"
            ? normalizeRisk
            : group === "confidence"
            ? normalizeConfidence
            : normalizeRating;

        const validOptions = OPP_FILTER_OPTIONS[group];
        for (const token of rawTokens) {
          const norm = normalizer(token);
          if (validOptions.includes(norm) && !state[group].includes(norm)) {
            state[group].push(norm);
          }
        }
      }
    } catch (_) {}

    return state;
  }

  function serializeFiltersToQueryString(filters) {
    try {
      const params = new URLSearchParams();
      if (filters.risk && filters.risk.length > 0) {
        params.set("opp_risk", filters.risk.join(","));
      }
      if (filters.confidence && filters.confidence.length > 0) {
        params.set("opp_conf", filters.confidence.join(","));
      }
      if (filters.rating && filters.rating.length > 0) {
        params.set("opp_rating", filters.rating.join(","));
      }
      return params.toString();
    } catch (_) {
      return "";
    }
  }

  return {
    OPP_FILTER_OPTIONS,
    normalizeRisk,
    normalizeConfidence,
    normalizeRating,
    createInitialFilterState,
    cloneFilterState,
    areFiltersEqual,
    countSelectedFilters,
    matchesFilters,
    filterOpportunities,
    toggleFilterOption,
    removeFilterOption,
    parseFiltersFromQueryString,
    serializeFiltersToQueryString,
  };
});
