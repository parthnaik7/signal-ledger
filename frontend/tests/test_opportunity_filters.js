const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const OpportunityFilters = require("../opportunityFilters.js");

const sampleItems = [
  { ticker: "NVDA", risk_level: "LOW", confidence: "HIGH", rating: "BUY" },
  { ticker: "MSFT", risk_level: "MODERATE", confidence: "MEDIUM", rating: "HOLD" },
  { ticker: "AAPL", risk_level: "HIGH", confidence: "LOW", rating: "SELL" },
  { ticker: "GOOGL", risk_level: "low", confidence: "high", rating: "watch" }, // watch normalizes to Hold
  { ticker: "AMZN", risk_level: null, confidence: undefined, rating: "" }, // missing values
];

describe("OpportunityFilters", () => {
  it("multi-select within a filter group works correctly", () => {
    const filters = {
      risk: ["Low", "Moderate"],
      confidence: [],
      rating: [],
    };
    const results = OpportunityFilters.filterOpportunities(sampleItems, filters);
    assert.deepEqual(results.map(i => i.ticker), ["NVDA", "MSFT", "GOOGL"]);
  });

  it("AND logic across filter groups works correctly", () => {
    const filters = {
      risk: ["Low"],
      confidence: ["High"],
      rating: ["Buy"],
    };
    const results = OpportunityFilters.filterOpportunities(sampleItems, filters);
    assert.deepEqual(results.map(i => i.ticker), ["NVDA"]);
  });

  it("nothing selected in a group means all items pass that group", () => {
    const filters = OpportunityFilters.createInitialFilterState();
    const results = OpportunityFilters.filterOpportunities(sampleItems, filters);
    assert.equal(results.length, sampleItems.length);
  });

  it("missing or unrecognized values are only excluded when that group has an active selection", () => {
    // When no filter active: missing value item AMZN passes
    const emptyFilters = OpportunityFilters.createInitialFilterState();
    assert.equal(OpportunityFilters.matchesFilters(sampleItems[4], emptyFilters), true);

    // When risk active: AMZN has null risk, so it is excluded without crashing
    const riskFilter = { risk: ["Low"], confidence: [], rating: [] };
    assert.equal(OpportunityFilters.matchesFilters(sampleItems[4], riskFilter), false);

    // Completely null or undefined item returns false safely
    assert.equal(OpportunityFilters.matchesFilters(null, riskFilter), false);
    assert.equal(OpportunityFilters.matchesFilters(undefined, emptyFilters), false);
  });

  it("Apply gating: detects when pending matches applied", () => {
    const applied = { risk: ["Low"], confidence: [], rating: ["Buy"] };
    const pendingSame = { risk: ["Low"], confidence: [], rating: ["Buy"] };
    const pendingDifferent = { risk: ["Low", "Moderate"], confidence: [], rating: ["Buy"] };

    assert.equal(OpportunityFilters.areFiltersEqual(pendingSame, applied), true);
    assert.equal(OpportunityFilters.areFiltersEqual(pendingDifferent, applied), false);
  });

  it("toggleFilterOption toggles options on and off", () => {
    let state = OpportunityFilters.createInitialFilterState();
    state = OpportunityFilters.toggleFilterOption(state, "risk", "Low");
    assert.deepEqual(state.risk, ["Low"]);
    state = OpportunityFilters.toggleFilterOption(state, "risk", "Moderate");
    assert.deepEqual(state.risk, ["Low", "Moderate"]);
    state = OpportunityFilters.toggleFilterOption(state, "risk", "Low");
    assert.deepEqual(state.risk, ["Moderate"]);
  });

  it("removeFilterOption removes specific applied chip option", () => {
    const state = { risk: ["Low", "Moderate"], confidence: ["High"], rating: [] };
    const next = OpportunityFilters.removeFilterOption(state, "risk", "Low");
    assert.deepEqual(next.risk, ["Moderate"]);
    assert.deepEqual(next.confidence, ["High"]);
  });

  it("URL query params serialization and restoration", () => {
    const original = { risk: ["Low", "High"], confidence: ["High"], rating: ["Buy"] };
    const query = OpportunityFilters.serializeFiltersToQueryString(original);
    assert.equal(query, "opp_risk=Low%2CHigh&opp_conf=High&opp_rating=Buy");

    const restored = OpportunityFilters.parseFiltersFromQueryString(query);
    assert.deepEqual(restored.risk, ["Low", "High"]);
    assert.deepEqual(restored.confidence, ["High"]);
    assert.deepEqual(restored.rating, ["Buy"]);
  });

  it("URL restoration ignores invalid or malformed tokens safely", () => {
    const badQuery = "?opp_risk=low,INVALID,moderate&opp_conf=extreme&opp_rating=buy,none";
    const restored = OpportunityFilters.parseFiltersFromQueryString(badQuery);
    assert.deepEqual(restored.risk, ["Low", "Moderate"]);
    assert.deepEqual(restored.confidence, []); // "extreme" invalid
    assert.deepEqual(restored.rating, ["Buy"]); // "none" invalid
  });

  it("Empty state returns empty list when no matches", () => {
    const impossible = { risk: ["High"], confidence: ["High"], rating: ["Sell"] };
    const results = OpportunityFilters.filterOpportunities(sampleItems, impossible);
    assert.deepEqual(results, []);
  });
});
