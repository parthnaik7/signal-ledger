const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const WatchlistFilters = require("../watchlistFilters.js");

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

// Simulates watchlist items as they appear in app.js:
// { ticker, metrics: { signal_review: { confidence, risk_level, verdict, score, analyst_count } } }
function makeItem(ticker, confidence, risk_level, verdict = "HOLD", score = null, analyst_count = null) {
  return {
    ticker,
    metrics: {
      signal_review: { verdict, confidence, risk_level, score, analyst_count },
    },
  };
}

const sampleItems = [
  makeItem("NVDA", "HIGH",   "LOW",      "BUY",  1.8, 32),
  makeItem("MSFT", "MEDIUM", "MODERATE", "HOLD", 2.7, 18),
  makeItem("AAPL", "LOW",    "HIGH",     "SELL", 4.1, 9),
  makeItem("GOOGL","HIGH",   "LOW",      "BUY",  1.5, 22),
  makeItem("TSLA", null,      null,       "HOLD", null, null), // missing confidence/risk
  { ticker: "AMZN", metrics: null },                            // no metrics at all
];

// ---------------------------------------------------------------------------
// normalizeConfidence
// ---------------------------------------------------------------------------

describe("WatchlistFilters.normalizeConfidence", () => {
  it("normalizes HIGH variants", () => {
    assert.equal(WatchlistFilters.normalizeConfidence("HIGH"), "High");
    assert.equal(WatchlistFilters.normalizeConfidence("high"), "High");
  });
  it("normalizes MEDIUM / MODERATE / MED", () => {
    assert.equal(WatchlistFilters.normalizeConfidence("MEDIUM"), "Medium");
    assert.equal(WatchlistFilters.normalizeConfidence("MODERATE"), "Medium");
    assert.equal(WatchlistFilters.normalizeConfidence("med"), "Medium");
  });
  it("normalizes LOW", () => {
    assert.equal(WatchlistFilters.normalizeConfidence("LOW"), "Low");
    assert.equal(WatchlistFilters.normalizeConfidence("low"), "Low");
  });
  it("returns empty string for NONE or unknown", () => {
    assert.equal(WatchlistFilters.normalizeConfidence("NONE"), "");
    assert.equal(WatchlistFilters.normalizeConfidence("EXTREME"), "");
    assert.equal(WatchlistFilters.normalizeConfidence(null), "");
    assert.equal(WatchlistFilters.normalizeConfidence(undefined), "");
    assert.equal(WatchlistFilters.normalizeConfidence(""), "");
  });
});

// ---------------------------------------------------------------------------
// normalizeRisk
// ---------------------------------------------------------------------------

describe("WatchlistFilters.normalizeRisk", () => {
  it("normalizes LOW", () => {
    assert.equal(WatchlistFilters.normalizeRisk("LOW"), "Low");
    assert.equal(WatchlistFilters.normalizeRisk("low"), "Low");
  });
  it("normalizes MODERATE / MED / MEDIUM", () => {
    assert.equal(WatchlistFilters.normalizeRisk("MODERATE"), "Moderate");
    assert.equal(WatchlistFilters.normalizeRisk("MED"), "Moderate");
    assert.equal(WatchlistFilters.normalizeRisk("MEDIUM"), "Moderate");
  });
  it("normalizes HIGH", () => {
    assert.equal(WatchlistFilters.normalizeRisk("HIGH"), "High");
    assert.equal(WatchlistFilters.normalizeRisk("high"), "High");
  });
  it("returns empty string for unknown values", () => {
    assert.equal(WatchlistFilters.normalizeRisk("EXTREME"), "");
    assert.equal(WatchlistFilters.normalizeRisk(null), "");
    assert.equal(WatchlistFilters.normalizeRisk(undefined), "");
  });
});

// ---------------------------------------------------------------------------
// matchesFilters — single group
// ---------------------------------------------------------------------------

describe("WatchlistFilters.matchesFilters — confidence filter alone", () => {
  it("passes when confidence matches selection", () => {
    assert.ok(WatchlistFilters.matchesFilters(sampleItems[0], { confidence: ["High"], risk: [] }));
    assert.ok(WatchlistFilters.matchesFilters(sampleItems[1], { confidence: ["Medium"], risk: [] }));
    assert.ok(WatchlistFilters.matchesFilters(sampleItems[2], { confidence: ["Low"], risk: [] }));
  });
  it("fails when confidence does not match", () => {
    assert.ok(!WatchlistFilters.matchesFilters(sampleItems[0], { confidence: ["Low"], risk: [] }));
  });
  it("passes all when confidence selection is empty", () => {
    const filters = WatchlistFilters.createInitialFilterState();
    sampleItems.forEach((item) => {
      if (item.metrics) assert.ok(WatchlistFilters.matchesFilters(item, filters));
    });
  });
  it("excludes items with missing confidence when filter is active", () => {
    const filters = { confidence: ["High"], risk: [] };
    assert.ok(!WatchlistFilters.matchesFilters(sampleItems[4], filters)); // null confidence
    assert.ok(!WatchlistFilters.matchesFilters(sampleItems[5], filters)); // no metrics
  });
  it("safely returns false for null/undefined item", () => {
    const filters = { confidence: ["High"], risk: [] };
    assert.ok(!WatchlistFilters.matchesFilters(null, filters));
    assert.ok(!WatchlistFilters.matchesFilters(undefined, filters));
  });
});

describe("WatchlistFilters.matchesFilters — risk filter alone", () => {
  it("passes when risk_level matches", () => {
    assert.ok(WatchlistFilters.matchesFilters(sampleItems[0], { confidence: [], risk: ["Low"] }));
    assert.ok(WatchlistFilters.matchesFilters(sampleItems[1], { confidence: [], risk: ["Moderate"] }));
    assert.ok(WatchlistFilters.matchesFilters(sampleItems[2], { confidence: [], risk: ["High"] }));
  });
  it("fails when risk does not match", () => {
    assert.ok(!WatchlistFilters.matchesFilters(sampleItems[0], { confidence: [], risk: ["High"] }));
  });
  it("excludes items with missing risk when filter is active", () => {
    const filters = { confidence: [], risk: ["Low"] };
    assert.ok(!WatchlistFilters.matchesFilters(sampleItems[4], filters)); // null risk_level
    assert.ok(!WatchlistFilters.matchesFilters(sampleItems[5], filters)); // no metrics
  });
});

// ---------------------------------------------------------------------------
// matchesFilters — AND logic across groups
// ---------------------------------------------------------------------------

describe("WatchlistFilters.matchesFilters — AND logic", () => {
  it("combines confidence AND risk with AND logic", () => {
    const filters = { confidence: ["High"], risk: ["Low"] };
    // NVDA: HIGH conf, LOW risk — passes
    assert.ok(WatchlistFilters.matchesFilters(sampleItems[0], filters));
    // MSFT: MEDIUM conf, MODERATE risk — fails both
    assert.ok(!WatchlistFilters.matchesFilters(sampleItems[1], filters));
    // GOOGL: HIGH conf, LOW risk — passes
    assert.ok(WatchlistFilters.matchesFilters(sampleItems[3], filters));
  });
  it("multi-select within a group uses OR within group", () => {
    const filters = { confidence: ["High", "Medium"], risk: [] };
    const results = WatchlistFilters.filterWatchlist(sampleItems, filters);
    // NVDA (High), MSFT (Medium), GOOGL (High) pass; AAPL (Low) and missing fail
    assert.ok(results.some((i) => i.ticker === "NVDA"));
    assert.ok(results.some((i) => i.ticker === "MSFT"));
    assert.ok(results.some((i) => i.ticker === "GOOGL"));
    assert.ok(!results.some((i) => i.ticker === "AAPL"));
  });
});

// ---------------------------------------------------------------------------
// filterWatchlist
// ---------------------------------------------------------------------------

describe("WatchlistFilters.filterWatchlist", () => {
  it("returns all items when filters are empty", () => {
    const result = WatchlistFilters.filterWatchlist(sampleItems, WatchlistFilters.createInitialFilterState());
    assert.equal(result.length, sampleItems.length);
  });
  it("filters correctly by risk alone", () => {
    const filters = { confidence: [], risk: ["Low"] };
    const result = WatchlistFilters.filterWatchlist(sampleItems, filters);
    const tickers = result.map((i) => i.ticker);
    assert.ok(tickers.includes("NVDA"));
    assert.ok(tickers.includes("GOOGL"));
    assert.ok(!tickers.includes("MSFT"));
    assert.ok(!tickers.includes("AAPL"));
  });
  it("returns empty array when no items match", () => {
    const impossible = { confidence: ["High"], risk: ["High"] };
    const result = WatchlistFilters.filterWatchlist(sampleItems, impossible);
    assert.deepEqual(result, []);
  });
  it("handles empty array input gracefully", () => {
    assert.deepEqual(WatchlistFilters.filterWatchlist([], { confidence: ["High"], risk: [] }), []);
  });
  it("handles non-array input gracefully", () => {
    assert.deepEqual(WatchlistFilters.filterWatchlist(null, { confidence: [], risk: [] }), []);
  });
});

// ---------------------------------------------------------------------------
// toggleFilterOption
// ---------------------------------------------------------------------------

describe("WatchlistFilters.toggleFilterOption", () => {
  it("adds an option when not present", () => {
    let state = WatchlistFilters.createInitialFilterState();
    state = WatchlistFilters.toggleFilterOption(state, "confidence", "High");
    assert.deepEqual(state.confidence, ["High"]);
  });
  it("removes an option when already present", () => {
    let state = { confidence: ["High", "Medium"], risk: [] };
    state = WatchlistFilters.toggleFilterOption(state, "confidence", "High");
    assert.deepEqual(state.confidence, ["Medium"]);
  });
  it("does not mutate the original state", () => {
    const original = { confidence: ["High"], risk: [] };
    const next = WatchlistFilters.toggleFilterOption(original, "confidence", "Low");
    assert.deepEqual(original.confidence, ["High"]); // unchanged
    assert.deepEqual(next.confidence, ["High", "Low"]);
  });
  it("handles toggling in the risk group", () => {
    let state = WatchlistFilters.createInitialFilterState();
    state = WatchlistFilters.toggleFilterOption(state, "risk", "Low");
    state = WatchlistFilters.toggleFilterOption(state, "risk", "Moderate");
    assert.deepEqual(state.risk, ["Low", "Moderate"]);
    state = WatchlistFilters.toggleFilterOption(state, "risk", "Low");
    assert.deepEqual(state.risk, ["Moderate"]);
  });
});

// ---------------------------------------------------------------------------
// countSelectedFilters / areFiltersEmpty
// ---------------------------------------------------------------------------

describe("WatchlistFilters.countSelectedFilters / areFiltersEmpty", () => {
  it("counts zero for initial state", () => {
    const s = WatchlistFilters.createInitialFilterState();
    assert.equal(WatchlistFilters.countSelectedFilters(s), 0);
    assert.ok(WatchlistFilters.areFiltersEmpty(s));
  });
  it("counts correctly when filters are set", () => {
    const s = { confidence: ["High", "Medium"], risk: ["Low"] };
    assert.equal(WatchlistFilters.countSelectedFilters(s), 3);
    assert.ok(!WatchlistFilters.areFiltersEmpty(s));
  });
  it("handles null/undefined safely", () => {
    assert.equal(WatchlistFilters.countSelectedFilters(null), 0);
    assert.ok(WatchlistFilters.areFiltersEmpty(null));
  });
});

// ---------------------------------------------------------------------------
// getConsensusSummary
// ---------------------------------------------------------------------------

describe("WatchlistFilters.getConsensusSummary", () => {
  it("returns null for an item with no signal_review", () => {
    const item = { ticker: "X", metrics: {} };
    assert.equal(WatchlistFilters.getConsensusSummary(item), null);
  });
  it("returns null for an item with no metrics", () => {
    assert.equal(WatchlistFilters.getConsensusSummary(sampleItems[5]), null);
  });
  it("returns null for UNRATED verdict", () => {
    const item = makeItem("X", "LOW", "LOW", "UNRATED", null, 0);
    assert.equal(WatchlistFilters.getConsensusSummary(item), null);
  });
  it("returns correct label, score, and analystCount for a covered item", () => {
    const summary = WatchlistFilters.getConsensusSummary(sampleItems[0]); // NVDA BUY 1.8 32
    assert.deepEqual(summary, { label: "BUY", score: "1.80", analystCount: 32 });
  });
  it("returns null score when score field is absent", () => {
    const item = makeItem("Y", "HIGH", "LOW", "BUY", null, 5);
    const summary = WatchlistFilters.getConsensusSummary(item);
    assert.equal(summary.score, null);
    assert.equal(summary.analystCount, 5);
  });
  it("returns null analystCount when analyst_count is 0 or absent", () => {
    const item = makeItem("Z", "HIGH", "LOW", "HOLD", 2.5, 0);
    const summary = WatchlistFilters.getConsensusSummary(item);
    assert.equal(summary.analystCount, null);
  });
});

// ---------------------------------------------------------------------------
// Reset behaviour (simulated)
// ---------------------------------------------------------------------------

describe("WatchlistFilters.getSignalSummaryText", () => {
  it("returns empty string when item or metrics is missing", () => {
    assert.equal(WatchlistFilters.getSignalSummaryText(null), "");
    assert.equal(WatchlistFilters.getSignalSummaryText({}), "");
    assert.equal(WatchlistFilters.getSignalSummaryText({ metrics: null }), "");
  });
  it("returns signal_review.summary when present", () => {
    const item = { metrics: { signal_review: { summary: "Institutional consensus indicates Moderate Buy." } } };
    assert.equal(WatchlistFilters.getSignalSummaryText(item), "Institutional consensus indicates Moderate Buy.");
  });
  it("falls back to metrics.signalReason when signal_review.summary is absent", () => {
    const item = { metrics: { signalReason: "Technical breakout above 52W low" } };
    assert.equal(WatchlistFilters.getSignalSummaryText(item), "Technical breakout above 52W low");
  });
});

describe("WatchlistFilters.getTargetMedianPct", () => {
  it("returns null when item or metrics is missing", () => {
    assert.equal(WatchlistFilters.getTargetMedianPct(null), null);
    assert.equal(WatchlistFilters.getTargetMedianPct({}), null);
    assert.equal(WatchlistFilters.getTargetMedianPct({ metrics: null }), null);
  });
  it("calculates upside percentage correctly from price_targets", () => {
    const item = {
      ticker: "ABC",
      metrics: {
        signal_review: {
          price_targets: { median: 120.0, current: 100.0 },
        },
      },
    };
    assert.equal(WatchlistFilters.getTargetMedianPct(item), 20.0);
  });
  it("calculates downside percentage correctly", () => {
    const item = {
      ticker: "XYZ",
      metrics: {
        signal_review: {
          price_targets: { median: 80.0, current: 100.0 },
        },
      },
    };
    assert.equal(WatchlistFilters.getTargetMedianPct(item), -20.0);
  });
  it("uses latest_close when price_targets.current is absent", () => {
    const item = {
      ticker: "DEF",
      metrics: {
        latest_close: 50.0,
        signal_review: {
          price_targets: { median: 60.0 },
        },
      },
    };
    assert.equal(WatchlistFilters.getTargetMedianPct(item), 20.0);
  });
  it("falls back to implied_upside_pct when median target is not explicit", () => {
    const item = {
      ticker: "GHI",
      metrics: {
        signal_review: {
          price_targets: { implied_upside_pct: 15.5 },
        },
      },
    };
    assert.equal(WatchlistFilters.getTargetMedianPct(item), 15.5);
  });
  it("returns null when current price is zero or negative", () => {
    const item = {
      ticker: "ZERO",
      metrics: {
        latest_close: 0,
        signal_review: {
          price_targets: { median: 100.0 },
        },
      },
    };
    assert.equal(WatchlistFilters.getTargetMedianPct(item), null);
  });
});

describe("Reset — WatchlistFilters state returns to initial after clear", () => {
  it("createInitialFilterState produces an empty state after clear", () => {
    let state = { confidence: ["High", "Low"], risk: ["Moderate"] };
    state = WatchlistFilters.createInitialFilterState();
    assert.equal(WatchlistFilters.countSelectedFilters(state), 0);
    assert.ok(WatchlistFilters.areFiltersEmpty(state));
  });
  it("filterWatchlist with reset state returns original list unchanged", () => {
    const state = WatchlistFilters.createInitialFilterState();
    const result = WatchlistFilters.filterWatchlist(sampleItems, state);
    assert.equal(result.length, sampleItems.length);
  });
});
