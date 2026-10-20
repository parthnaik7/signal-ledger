/**
 * WatchlistFilters
 * Domain logic for the Watchlist Confidence Level and Risk Level filters.
 * Modular, dependency-free, and cross-environment (Browser & Node.js test runner).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.WatchlistFilters = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  const WL_FILTER_OPTIONS = {
    confidence: ["High", "Medium", "Low"],
    risk: ["Low", "Moderate", "High"],
  };

  // ---------------------------------------------------------------------------
  // Normalizers (case-insensitive, alias-aware)
  // ---------------------------------------------------------------------------

  function normalizeConfidence(val) {
    if (!val) return "";
    const s = String(val).trim().toUpperCase();
    if (s === "HIGH") return "High";
    if (s === "MEDIUM" || s === "MODERATE" || s === "MED") return "Medium";
    if (s === "LOW") return "Low";
    // "NONE" and unknown fall through — treated as missing
    return "";
  }

  function normalizeRisk(val) {
    if (!val) return "";
    const s = String(val).trim().toUpperCase();
    if (s === "LOW") return "Low";
    if (s === "MODERATE" || s === "MED" || s === "MEDIUM") return "Moderate";
    if (s === "HIGH") return "High";
    return "";
  }

  // ---------------------------------------------------------------------------
  // State helpers
  // ---------------------------------------------------------------------------

  function createInitialFilterState() {
    return { confidence: [], risk: [] };
  }

  function cloneFilterState(filters) {
    return {
      confidence: Array.isArray(filters?.confidence) ? [...filters.confidence] : [],
      risk: Array.isArray(filters?.risk) ? [...filters.risk] : [],
    };
  }

  function countSelectedFilters(filters) {
    if (!filters) return 0;
    return (filters.confidence?.length || 0) + (filters.risk?.length || 0);
  }

  function areFiltersEmpty(filters) {
    return countSelectedFilters(filters) === 0;
  }

  // ---------------------------------------------------------------------------
  // Toggle
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Matching
  // ---------------------------------------------------------------------------

  /**
   * Returns true if item passes all active watchlist (confidence/risk) filters.
   * Confidence/risk data lives at item.metrics.signal_review.{confidence,risk_level}.
   * If a filter group has no active selection the item always passes that group.
   * Items missing the field are excluded when any filter in that group is active.
   */
  function matchesFilters(item, filters) {
    if (!item || typeof item !== "object") return false;

    if (filters?.confidence && filters.confidence.length > 0) {
      const raw = item.metrics?.signal_review?.confidence ?? item.metrics?.confidence;
      const norm = normalizeConfidence(raw);
      if (!norm || !filters.confidence.includes(norm)) return false;
    }

    if (filters?.risk && filters.risk.length > 0) {
      const raw = item.metrics?.signal_review?.risk_level ?? item.metrics?.risk_level;
      const norm = normalizeRisk(raw);
      if (!norm || !filters.risk.includes(norm)) return false;
    }

    return true;
  }

  function filterWatchlist(items, filters) {
    if (!Array.isArray(items)) return [];
    if (areFiltersEmpty(filters)) return items;
    return items.filter((item) => matchesFilters(item, filters));
  }

  // ---------------------------------------------------------------------------
  // Persistence (localStorage)
  // ---------------------------------------------------------------------------

  const STORAGE_KEY = "stock_ledger_wl_conf_risk_filter";

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createInitialFilterState();
      const parsed = JSON.parse(raw);
      const state = createInitialFilterState();
      ["confidence", "risk"].forEach((group) => {
        if (Array.isArray(parsed[group])) {
          const valid = WL_FILTER_OPTIONS[group];
          state[group] = parsed[group].filter((v) => valid.includes(v));
        }
      });
      return state;
    } catch (_) {
      return createInitialFilterState();
    }
  }

  function saveToStorage(filters) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (_) { /* ignore */ }
  }

  // ---------------------------------------------------------------------------
  // Consensus summary helper
  // ---------------------------------------------------------------------------

  /**
   * Returns a compact consensus label for a watchlist item.
   * Returns null when no signal_review data is present or verdict is UNRATED.
   *
   * @param {{ metrics?: { signal_review?: object } }} item
   * @returns {{ label: string, score: string|null, analystCount: number|null } | null}
   */
  function getConsensusSummary(item) {
    const r = item?.metrics?.signal_review;
    if (!r || !r.verdict) return null;

    const verdict = r.verdict; // "BUY" | "HOLD" | "SELL" | "UNRATED"
    if (verdict === "UNRATED") return null;

    return {
      label: verdict,
      score: r.score != null ? r.score.toFixed(2) : null,
      analystCount: r.analyst_count || null,
    };
  }

  /**
   * Returns signalSummaryText information from item metrics.
   * Prioritizes signal_review.summary, with fallback to metrics.signalReason.
   *
   * @param {{ metrics?: { signal_review?: { summary?: string }, signalReason?: string } }} item
   * @returns {string}
   */
  function getSignalSummaryText(item) {
    if (!item || !item.metrics) return "";
    return item.metrics.signal_review?.summary || item.metrics.signalReason || "";
  }

  /**
   * Calculates the target median percentage (implied upside/downside to median analyst price target).
   * Formula: ((target_median - current_price) / current_price) * 100.
   *
   * @param {{ metrics?: { signal_review?: { price_targets?: { median?: number, current?: number }, target_median?: number }, latest_close?: number } }} item
   * @returns {number|null}
   */
  function getTargetMedianPct(item) {
    if (!item || !item.metrics) return null;
    const m = item.metrics;
    const sr = m.signal_review;
    const pt = sr?.price_targets;

    const median = pt?.median ?? sr?.target_median ?? null;
    const current = pt?.current ?? m.latest_close ?? null;

    if (median != null && current != null && current > 0) {
      return ((median - current) / current) * 100;
    }

    if (pt?.implied_upside_pct != null) {
      return pt.implied_upside_pct;
    }
    if (sr?.upside_pct != null) {
      return sr.upside_pct;
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  return {
    WL_FILTER_OPTIONS,
    normalizeConfidence,
    normalizeRisk,
    createInitialFilterState,
    cloneFilterState,
    countSelectedFilters,
    areFiltersEmpty,
    toggleFilterOption,
    matchesFilters,
    filterWatchlist,
    loadFromStorage,
    saveToStorage,
    getConsensusSummary,
    getSignalSummaryText,
    getTargetMedianPct,
  };
});
