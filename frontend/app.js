const API_BASE = ""; // same-origin

// ---------------------------------------------------------------------------
// DOM Elements
// ---------------------------------------------------------------------------
const els = {
  // Inputs & Steppers
  ticker: document.getElementById("tickerInput"),
  years: document.getElementById("yearsInput"),
  months: document.getElementById("monthsInput"),
  fetchBtn: document.getElementById("fetchBtn"),
  
  // CSV controls
  csvToggleBtn: document.getElementById("csvToggleBtn"),
  csvUploadSection: document.getElementById("csvUploadSection"),
  csvInput: document.getElementById("csvInput"),
  csvDropzone: document.getElementById("csvDropzone"),
  csvFileChip: document.getElementById("csvFileChip"),
  csvPathDisplay: document.getElementById("csvPathDisplay"),
  clearCsvBtn: document.getElementById("clearCsvBtn"),
  submitCsvBtn: document.getElementById("submitCsvBtn"),

  // Feedback & Banners
  statusBanner: document.getElementById("statusBanner"),
  statusLine: document.getElementById("statusLine"),
  statusIcon: document.getElementById("statusIcon"),
  statusCloseBtn: document.getElementById("statusCloseBtn"),
  skeletonLoader: document.getElementById("skeletonLoader"),
  results: document.getElementById("results"),

  // Theme & History
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  historyToggleBtn: document.getElementById("historyToggleBtn"),
  historyPanel: document.getElementById("historyPanel"),
  historyList: document.getElementById("historyList"),
  historyCount: document.getElementById("historyCount"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn"),
  closeHistoryBtn: document.getElementById("closeHistoryBtn"),

  // Summary Metrics
  sumTicker: document.getElementById("sumTicker"),
  sumSource: document.getElementById("sumSource"),
  sumClose: document.getElementById("sumClose"),
  sumCloseDiff: document.getElementById("sumCloseDiff"),
  sumRange: document.getElementById("sumRange"),
  sumDays: document.getElementById("sumDays"),
  sumYearLow: document.getElementById("sumYearLow"),
  sumYearHigh: document.getElementById("sumYearHigh"),
  sumCloseHighDiff: document.getElementById("sumCloseHighDiff"),
  sumAllTimeLow: document.getElementById("sumAllTimeLow"),
  sumCloseAtLowDiff: document.getElementById("sumCloseAtLowDiff"),
  sumAllTimeHigh: document.getElementById("sumAllTimeHigh"),
  sumCloseAtHighDiff: document.getElementById("sumCloseAtHighDiff"),
  sumCompanyName: document.getElementById("sumCompanyName"),
  similarStocksWrap: document.getElementById("similarStocksWrap"),
  similarChips: document.getElementById("similarChips"),
  yahooOverviewLink: document.getElementById("yahooOverviewLink"),
  tickerDropdown: document.getElementById("tickerDropdown"),
  watchlistStarBtn: document.getElementById("watchlistStarBtn"),
  watchlistPanel: document.getElementById("watchlistPanel"),
  watchlistToggleBtn: document.getElementById("watchlistToggleBtn"),
  watchlistCount: document.getElementById("watchlistCount"),
  watchlistItems: document.getElementById("watchlistItems"),
  closeWatchlistBtn: document.getElementById("closeWatchlistBtn"),
  clearWatchlistBtn: document.getElementById("clearWatchlistBtn"),
  watchlistConfirm: document.getElementById("watchlistConfirm"),
  watchlistConfirmYes: document.getElementById("watchlistConfirmYes"),
  watchlistConfirmNo: document.getElementById("watchlistConfirmNo"),
  refreshAllWatchlistBtn: document.getElementById("refreshAllWatchlistBtn"),
  watchlistIoBtn: document.getElementById("watchlistIoBtn"),
  watchlistIoMenu: document.getElementById("watchlistIoMenu"),
  exportWlJsonTickersBtn: document.getElementById("exportWlJsonTickersBtn"),
  exportWlCsvTickersBtn: document.getElementById("exportWlCsvTickersBtn"),
  exportWlJsonFullBtn: document.getElementById("exportWlJsonFullBtn"),
  exportWlCsvFullBtn: document.getElementById("exportWlCsvFullBtn"),
  exportWlJsonBtn: document.getElementById("exportWlJsonBtn"),
  exportWlCsvBtn: document.getElementById("exportWlCsvBtn"),
  importWlBtn: document.getElementById("importWlBtn"),
  watchlistFileInput: document.getElementById("watchlistFileInput"),
  wlProgressWrap: document.getElementById("wlProgressWrap"),
  wlProgressTitle: document.getElementById("wlProgressTitle"),
  wlProgDoneCount: document.getElementById("wlProgDoneCount"),
  wlProgPendingCount: document.getElementById("wlProgPendingCount"),
  wlProgFailedCount: document.getElementById("wlProgFailedCount"),
  wlProgFailedPill: document.getElementById("wlProgFailedPill"),
  wlProgressFill: document.getElementById("wlProgressFill"),
  wlCancelRefreshBtn: document.getElementById("wlCancelRefreshBtn"),

  // Content Panels & Charts
  quoteDetailsPanel: document.getElementById("quoteDetailsPanel"),
  statsGrid: document.getElementById("statsGrid"),
  rangePresets: document.getElementById("rangePresets"),
  yearlyTableBody: document.querySelector("#yearlyTable tbody"),
  monthlyTableBody: document.querySelector("#monthlyTable tbody"),
  monthlyRangeNote: document.getElementById("monthlyRangeNote"),
  moveCards: document.getElementById("moveCards"),
  logToggle: document.getElementById("logScaleToggle"),
  exportXlsxBtn: document.getElementById("exportXlsxBtn"),
  exportPdfBtn: document.getElementById("exportPdfBtn"),

  // Technical Indicators & Overlays
  techToggles: document.getElementById("techToggles"),
  regimeBadge: document.getElementById("regimeBadge"),
  rsiChartContainer: document.getElementById("rsiChartContainer"),
  rsiCurrentValue: document.getElementById("rsiCurrentValue"),
  stockSignalBadge: document.getElementById("stockSignalBadge"),

  // Signal Review Modal Elements
  signalReviewModal: document.getElementById("signalReviewModal"),
  signalModalCloseBtn: document.getElementById("signalModalCloseBtn"),
  signalModalTicker: document.getElementById("signalModalTicker"),
  signalModalVerdictBadge: document.getElementById("signalModalVerdictBadge"),
  signalModalScore: document.getElementById("signalModalScore"),
  signalModalCompany: document.getElementById("signalModalCompany"),
  signalAnalystCount: document.getElementById("signalAnalystCount"),
  signalSummaryText: document.getElementById("signalSummaryText"),
  distStrongBuy: document.getElementById("distStrongBuy"),
  distBuy: document.getElementById("distBuy"),
  distHold: document.getElementById("distHold"),
  distSell: document.getElementById("distSell"),
  distStrongSell: document.getElementById("distStrongSell"),
  cntStrongBuy: document.getElementById("cntStrongBuy"),
  cntBuy: document.getElementById("cntBuy"),
  cntHold: document.getElementById("cntHold"),
  cntSell: document.getElementById("cntSell"),
  cntStrongSell: document.getElementById("cntStrongSell"),
  signalUpsideBadge: document.getElementById("signalUpsideBadge"),
  targetCurVal: document.getElementById("targetCurVal"),
  targetLowVal: document.getElementById("targetLowVal"),
  targetMeanVal: document.getElementById("targetMeanVal"),
  targetMedianVal: document.getElementById("targetMedianVal"),
  targetHighVal: document.getElementById("targetHighVal"),
  signalValStatus: document.getElementById("signalValStatus"),
  signalStarRating: document.getElementById("signalStarRating"),
  signalStarScore: document.getElementById("signalStarScore"),
  signalFairValueVal: document.getElementById("signalFairValueVal"),
  signalDiscountVal: document.getElementById("signalDiscountVal"),
  signalBrokerTbody: document.getElementById("signalBrokerTbody"),

  // Gemini AI Modal Elements
  signalGeminiSection: document.getElementById("signalGeminiSection"),
  geminiRefreshBtn: document.getElementById("geminiRefreshBtn"),
  geminiUnconfiguredMsg: document.getElementById("geminiUnconfiguredMsg"),
  geminiLoadingState: document.getElementById("geminiLoadingState"),
  geminiContentWrap: document.getElementById("geminiContentWrap"),
  geminiSignalBadge: document.getElementById("geminiSignalBadge"),
  geminiConfidenceText: document.getElementById("geminiConfidenceText"),
  geminiPostureVal: document.getElementById("geminiPostureVal"),
  geminiTimingText: document.getElementById("geminiTimingText"),
  geminiActionText: document.getElementById("geminiActionText"),
  geminiDriversList: document.getElementById("geminiDriversList"),
  geminiRisksList: document.getElementById("geminiRisksList"),
  geminiDisclaimerText: document.getElementById("geminiDisclaimerText"),

  // Gemini Watchlist Briefing Elements
  watchlistGeminiBtn: document.getElementById("watchlistGeminiBtn"),
  watchlistGeminiCard: document.getElementById("watchlistGeminiCard"),
  wlGeminiSentimentBadge: document.getElementById("wlGeminiSentimentBadge"),
  wlGeminiRefreshBtn: document.getElementById("wlGeminiRefreshBtn"),
  wlGeminiCloseBtn: document.getElementById("wlGeminiCloseBtn"),
  wlGeminiUnconfiguredMsg: document.getElementById("wlGeminiUnconfiguredMsg"),
  wlGeminiLoadingState: document.getElementById("wlGeminiLoadingState"),
  wlGeminiContentWrap: document.getElementById("wlGeminiContentWrap"),
  wlGeminiOverviewText: document.getElementById("wlGeminiOverviewText"),
  wlGeminiFocusGrid: document.getElementById("wlGeminiFocusGrid"),
  wlGeminiRisksList: document.getElementById("wlGeminiRisksList"),
  wlGeminiDisclaimer: document.getElementById("wlGeminiDisclaimer"),
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let yearlyChart = null;
let priceHistoryChart = null;
let rsiChart = null;
let currentAnalysis = null;
let priceHistoryData = [];
let activeRangeKey = "MAX";
let selectedCsvFile = null;
let currentTheme = "dark";
let isFetching = false; // Double-fetch guard

const activeOverlays = {
  ema20: false,
  sma50: false,
  sma200: false,
  volume: false,
  rsi: false,
};

const RANGE_MONTHS = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12, "2Y": 24, "5Y": 60, "MAX": null };
const STORAGE_THEME_KEY = "stock_ledger_theme";
const STORAGE_HISTORY_KEY = "stock_ledger_history";
const STORAGE_WATCHLIST_KEY = "stock_ledger_watchlist";

// ---------------------------------------------------------------------------
// Ticker Autocomplete
// ---------------------------------------------------------------------------
let acDebounceTimer = null;
let acActiveIndex = -1;
let acSuggestions = [];

function closeDropdown() {
  if (els.tickerDropdown) els.tickerDropdown.hidden = true;
  acActiveIndex = -1;
  acSuggestions = [];
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function safeFetchJson(url, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let onAbortExternal = null;
  if (options.signal) {
    if (options.signal.aborted) {
      clearTimeout(timer);
      throw new Error("Request cancelled");
    }
    onAbortExternal = () => controller.abort();
    options.signal.addEventListener("abort", onAbortExternal, { once: true });
  }

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    if (options.signal && onAbortExternal) {
      options.signal.removeEventListener("abort", onAbortExternal);
    }
    let data;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { detail: text || `HTTP ${res.status} ${res.statusText}` };
    }
    if (!res.ok) {
      throw new Error((data && data.detail) || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    clearTimeout(timer);
    if (options.signal && onAbortExternal) {
      options.signal.removeEventListener("abort", onAbortExternal);
    }
    if (options.signal?.aborted) {
      throw new Error("Request cancelled");
    }
    if (err.name === "AbortError") {
      throw new Error("Request timed out. The server or data provider took too long to respond.");
    }
    throw err;
  }
}

/**
 * Robust fetch with exponential backoff & jitter for transient errors (5xx, 429, network).
 */
async function safeFetchWithRetry(url, options = {}, { maxRetries = 2, backoffBaseMs = 600, timeoutMs = 25000, signal } = {}) {
  let attempt = 0;
  while (true) {
    if (signal?.aborted) throw new Error("Request cancelled");
    try {
      return await safeFetchJson(url, { ...options, signal }, timeoutMs);
    } catch (err) {
      if (signal?.aborted || err.message === "Request cancelled") {
        throw err;
      }
      attempt++;
      if (attempt > maxRetries) {
        throw err;
      }
      // Exponential backoff with random jitter
      const delay = Math.round(backoffBaseMs * Math.pow(2, attempt - 1) + Math.random() * 200);
      await new Promise((resolve, reject) => {
        const t = setTimeout(resolve, delay);
        if (signal) {
          signal.addEventListener("abort", () => {
            clearTimeout(t);
            reject(new Error("Request cancelled"));
          }, { once: true });
        }
      });
    }
  }
}

/**
 * Executes async tasks with strict concurrency pooling.
 * Immediate worker reuse as soon as any promise settles.
 */
async function runWithConcurrency(items, limit, workerFn, { signal } = {}) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      if (signal?.aborted) break;
      const currentIndex = nextIndex++;
      const item = items[currentIndex];
      try {
        const val = await workerFn(item, currentIndex);
        results[currentIndex] = { status: "fulfilled", value: val };
      } catch (err) {
        results[currentIndex] = { status: "rejected", reason: err };
      }
    }
  }

  const poolSize = Math.max(1, Math.min(limit, items.length));
  const workers = Array.from({ length: poolSize }, () => worker());
  await Promise.all(workers);
  return results;
}

function renderDropdown(suggestions) {
  if (!els.tickerDropdown) return;
  acSuggestions = suggestions;
  acActiveIndex = -1;

  if (!suggestions.length) {
    closeDropdown();
    return;
  }

  els.tickerDropdown.innerHTML = suggestions.map((s, i) => {
    const inWatchlist = isWatchlisted(s.symbol);
    return `
      <li class="ac-item" role="option" data-index="${i}" data-symbol="${escapeHtml(s.symbol)}">
        <span class="ac-symbol">${escapeHtml(s.symbol)}</span>
        <span class="ac-name">${escapeHtml(s.name || "")}</span>
        ${s.type ? `<span class="ac-type">${escapeHtml(s.type)}</span>` : ""}
        <button type="button" 
                class="ac-star-btn ${inWatchlist ? "is-watchlisted" : ""}" 
                data-symbol="${escapeHtml(s.symbol)}" 
                data-name="${escapeHtml(s.name || "")}" 
                title="${inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}" 
                aria-label="${inWatchlist ? "Remove " + escapeHtml(s.symbol) + " from Watchlist" : "Add " + escapeHtml(s.symbol) + " to Watchlist"}" 
                aria-pressed="${inWatchlist ? "true" : "false"}"
                tabindex="-1">
          <svg class="ac-star-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </button>
      </li>
    `;
  }).join("");

  els.tickerDropdown.hidden = false;

  // Row selection handler (clicks outside the star select the ticker)
  els.tickerDropdown.querySelectorAll(".ac-item").forEach((item) => {
    item.addEventListener("mousedown", (e) => {
      if (e.target.closest(".ac-star-btn")) return;
      e.preventDefault(); // prevent blur closing dropdown before click
      selectSuggestion(parseInt(item.dataset.index, 10));
    });
  });

  // Star button handler: instant local client-side watchlist toggle without interrupting search flow
  els.tickerDropdown.querySelectorAll(".ac-star-btn").forEach((starBtn) => {
    starBtn.addEventListener("mousedown", (e) => {
      e.preventDefault(); // Prevents input from losing focus
      e.stopPropagation();
    });

    starBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const symbol = starBtn.dataset.symbol;
      const name = starBtn.dataset.name || "";
      const currentlyIn = isWatchlisted(symbol);

      if (currentlyIn) {
        removeFromWatchlist(symbol);
        starBtn.classList.remove("is-watchlisted");
        starBtn.setAttribute("aria-pressed", "false");
        starBtn.title = "Add to Watchlist";
        starBtn.setAttribute("aria-label", `Add ${symbol} to Watchlist`);
        showNotification(`Removed ${symbol} from Watchlist`, "info");
      } else {
        addToWatchlist(symbol, name, null);
        starBtn.classList.add("is-watchlisted");
        starBtn.setAttribute("aria-pressed", "true");
        starBtn.title = "Remove from Watchlist";
        starBtn.setAttribute("aria-label", `Remove ${symbol} from Watchlist`);
        showNotification(`⭐ ${symbol} added to Watchlist`, "success");
      }

      // Pop micro-animation on toggle
      starBtn.classList.remove("pop");
      void starBtn.offsetWidth;
      starBtn.classList.add("pop");
      starBtn.addEventListener("animationend", () => starBtn.classList.remove("pop"), { once: true });

      // Synchronize primary summary card star button if currently viewing this ticker
      if (currentAnalysis && currentAnalysis.ticker === symbol && els.watchlistStarBtn) {
        const nextState = !currentlyIn;
        els.watchlistStarBtn.setAttribute("aria-pressed", String(nextState));
        els.watchlistStarBtn.title = nextState ? "Remove from Watchlist" : "Add to Watchlist";
      }

      // Keep search-bar input actively focused so typing or arrow navigation continues uninterrupted
      if (els.ticker) {
        els.ticker.focus();
      }
    });
  });
}

function highlightItem(idx) {
  if (!els.tickerDropdown) return;
  const items = els.tickerDropdown.querySelectorAll(".ac-item");
  items.forEach((el, i) => el.setAttribute("aria-selected", i === idx ? "true" : "false"));
  if (items[idx]) items[idx].scrollIntoView({ block: "nearest" });
}

function selectSuggestion(idx) {
  const s = acSuggestions[idx];
  if (!s) return;
  els.ticker.value = s.symbol;
  closeDropdown();
  handleFetch();
}

const acClientCache = new Map();

function initAutocomplete() {
  if (!els.ticker || !els.tickerDropdown) return;

  els.ticker.addEventListener("input", () => {
    const q = els.ticker.value.trim().toLowerCase();
    clearTimeout(acDebounceTimer);
    if (q.length < 1) { closeDropdown(); return; }

    // Instant response from client memory cache if available
    if (acClientCache.has(q)) {
      renderDropdown(acClientCache.get(q));
      return;
    }

    acDebounceTimer = setTimeout(async () => {
      try {
        const resp = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (!resp.ok) return;
        const data = await resp.json();
        const suggestions = data.suggestions || [];
        acClientCache.set(q, suggestions);
        renderDropdown(suggestions);
      } catch (_) { /* silent — network may be absent */ }
    }, 180);
  });

  els.ticker.addEventListener("keydown", (e) => {
    if (els.tickerDropdown.hidden) return;
    const count = acSuggestions.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      acActiveIndex = (acActiveIndex + 1) % count;
      highlightItem(acActiveIndex);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      acActiveIndex = (acActiveIndex - 1 + count) % count;
      highlightItem(acActiveIndex);
    } else if (e.key === "Enter") {
      if (acActiveIndex >= 0) {
        e.preventDefault();
        selectSuggestion(acActiveIndex);
      } else {
        closeDropdown();
      }
    } else if (e.key === "Escape") {
      closeDropdown();
    }
  });

  els.ticker.addEventListener("blur", () => {
    // Delay so mousedown on an item fires first
    setTimeout(closeDropdown, 150);
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#tickerAutocompleteWrap")) closeDropdown();
  });
}

// ---------------------------------------------------------------------------
// Watchlist Module
// ---------------------------------------------------------------------------
function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_WATCHLIST_KEY) || "[]");
  } catch { return []; }
}

function saveWatchlist(list) {
  localStorage.setItem(STORAGE_WATCHLIST_KEY, JSON.stringify(list));
}

function isWatchlisted(ticker) {
  return getWatchlist().some((w) => w.ticker === ticker);
}

function snapshotMetrics(analysis) {
  if (!analysis) return null;
  const sigInfo = computeStockSignal(analysis);
  return {
    latest_close:            analysis.latest_close ?? null,
    latest_low:              analysis.latest_low ?? null,
    latest_high:             analysis.latest_high ?? null,
    diff_from_latest_low_pct:  analysis.diff_from_latest_low_pct ?? null,
    diff_from_latest_high_pct: analysis.diff_from_latest_high_pct ?? null,
    latest_low_date:         analysis.latest_low_date ?? null,
    latest_high_date:        analysis.latest_high_date ?? null,
    all_time_low:            analysis.all_time_low ?? null,
    all_time_high:           analysis.all_time_high ?? null,
    diff_from_all_time_low_pct: analysis.diff_from_all_time_low_pct ?? null,
    diff_from_all_time_high_pct: analysis.diff_from_all_time_high_pct ?? null,
    best_move_year_pct:      analysis.best_move_current_year?.pct_diff ?? null,
    best_move_alltime_pct:   analysis.best_move_overall?.pct_diff ?? null,
    signal:                  sigInfo ? sigInfo.signal : null,
    signalReason:            sigInfo ? sigInfo.reason : null,
    signal_review:           analysis.signal_review || null,
    refreshedAt:             Date.now(),
  };
}

function addToWatchlist(ticker, companyName, metrics) {
  let list = getWatchlist();
  if (list.some((w) => w.ticker === ticker)) return;
  list.unshift({ ticker, companyName: companyName || "", addedAt: Date.now(), metrics: metrics || null });
  saveWatchlist(list);
  renderWatchlistUI();
  updateWatchlistBadge();
}

function removeFromWatchlist(ticker) {
  let list = getWatchlist().filter((w) => w.ticker !== ticker);
  saveWatchlist(list);
  renderWatchlistUI();
  updateWatchlistBadge();
}

function updateWatchlistMetrics(ticker, metrics, skipFullRender = false) {
  let list = getWatchlist();
  const entry = list.find((w) => w.ticker === ticker);
  if (entry) {
    entry.metrics = metrics;
    saveWatchlist(list);
    if (!skipFullRender) {
      renderWatchlistUI();
    }
  }
}

function toggleWatchlist(ticker, companyName) {
  const btn = els.watchlistStarBtn;
  const alreadyIn = isWatchlisted(ticker);

  if (alreadyIn) {
    removeFromWatchlist(ticker);
    showNotification(`Removed ${ticker} from Watchlist`, "info");
    if (btn) { btn.setAttribute("aria-pressed", "false"); btn.title = "Add to Watchlist"; }
  } else {
    const metrics = snapshotMetrics(currentAnalysis);
    addToWatchlist(ticker, companyName, metrics);
    showNotification(`\u2B50 ${ticker} added to Watchlist`, "success");
    if (btn) { btn.setAttribute("aria-pressed", "true"); btn.title = "Remove from Watchlist"; }
  }

  if (btn) {
    btn.classList.remove("pop");
    void btn.offsetWidth;
    btn.classList.add("pop");
    btn.addEventListener("animationend", () => btn.classList.remove("pop"), { once: true });
  }
}

function updateWatchlistBadge() {
  const count = getWatchlist().length;
  if (els.watchlistCount) els.watchlistCount.textContent = count;
}

function formatWatchlistDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function fmtClose(v) {
  if (v == null) return "—";
  if (v < 1)  return "$" + v.toFixed(4);
  if (v < 10) return "$" + v.toFixed(3);
  return "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(v, sign = true) {
  if (v == null) return "—";
  const s = sign && v > 0 ? "+" : "";
  if (Math.abs(v) >= 10000) {
    return s + (Math.abs(v) >= 1000000 ? (v / 1000000).toFixed(1) + "M%" : (v / 1000).toFixed(1) + "k%");
  }
  return s + v.toLocaleString(undefined, { maximumFractionDigits: 1 }) + "%";
}

function buildMetricsRow(m, ticker = "") {
  if (!m) {
    return `<div class="wl-metrics wl-metrics--empty">No live data yet — click Refresh (↻)</div>`;
  }
  const lowPct  = m.diff_from_latest_low_pct;
  const highPct = m.diff_from_latest_high_pct;
  const atlPct  = m.diff_from_all_time_low_pct;
  const athPct  = m.diff_from_all_time_high_pct;

  const lowCls  = lowPct  != null && lowPct  > 0 ? "wl-pill--pos" : "";
  const highCls = highPct != null && highPct < 0 ? "wl-pill--neg" : "wl-pill--pos";
  const atlCls  = atlPct  != null && atlPct  > 0 ? "wl-pill--pos" : "";
  const athCls  = athPct  != null && athPct  < 0 ? "wl-pill--neg" : "wl-pill--pos";

  let moveYr = m.best_move_year_pct ?? null;
  if (moveYr == null && m.latest_low && m.latest_high && m.latest_low > 0) {
    moveYr = ((m.latest_high - m.latest_low) / m.latest_low) * 100;
  }
  let moveAll = m.best_move_alltime_pct ?? null;

  if (currentAnalysis && ticker && currentAnalysis.ticker === ticker) {
    if (currentAnalysis.best_move_current_year?.pct_diff != null) {
      moveYr = currentAnalysis.best_move_current_year.pct_diff;
    }
    if (currentAnalysis.best_move_overall?.pct_diff != null) {
      moveAll = currentAnalysis.best_move_overall.pct_diff;
    }
  }

  const refreshed = m.refreshedAt ? `<span class="wl-refreshed">Updated ${formatWatchlistDate(m.refreshedAt)}</span>` : "";

  return `
    <div class="wl-metrics">
      <div class="wl-metric-cell">
        <span class="wl-metric-label">Close</span>
        <span class="wl-metric-val">${fmtClose(m.latest_close)}</span>
      </div>
      <div class="wl-metric-cell">
        <span class="wl-metric-label">Yr Low</span>
        <span class="wl-metric-val">${fmtClose(m.latest_low)}</span>
        ${lowPct != null ? `<span class="wl-pill ${lowCls}">${fmtPct(lowPct)}</span>` : ""}
      </div>
      <div class="wl-metric-cell">
        <span class="wl-metric-label">Yr High</span>
        <span class="wl-metric-val">${fmtClose(m.latest_high)}</span>
        ${highPct != null ? `<span class="wl-pill ${highCls}">${fmtPct(highPct)}</span>` : ""}
      </div>
      <div class="wl-metric-cell">
        <span class="wl-metric-label">AT Low</span>
        <span class="wl-metric-val">${fmtClose(m.all_time_low)}</span>
        ${atlPct != null ? `<span class="wl-pill ${atlCls}">${fmtPct(atlPct)}</span>` : ""}
      </div>
      <div class="wl-metric-cell">
        <span class="wl-metric-label">AT High</span>
        <span class="wl-metric-val">${fmtClose(m.all_time_high)}</span>
        ${athPct != null ? `<span class="wl-pill ${athCls}">${fmtPct(athPct)}</span>` : ""}
      </div>
      <div class="wl-metric-cell" title="Best Move · Year: sequential low-to-high move in current year">
        <span class="wl-metric-label">Move Yr</span>
        ${moveYr != null ? `<span class="wl-pill wl-pill--pos">+${formatPct(moveYr)}</span>` : `<span class="wl-metric-val">—</span>`}
      </div>
      <div class="wl-metric-cell" title="Best Move · All-Time: largest sequential low-to-high move">
        <span class="wl-metric-label">Move AT</span>
        ${moveAll != null ? `<span class="wl-pill wl-pill--pos">+${formatPct(moveAll)}</span>` : `<span class="wl-metric-val">—</span>`}
      </div>
      ${refreshed}
    </div>`;
}

/**
 * Progressively updates an individual watchlist card DOM element without re-rendering the whole list.
 * States: 'pending', 'updating', 'success', 'failed'
 */
function updateWatchlistCardDOM(ticker, metrics, status = "success", errorMsg = "") {
  const container = els.watchlistItems;
  if (!container) return;
  const card = container.querySelector(`.wl-item[data-ticker="${escapeHtml(ticker)}"]`);
  if (!card) return;

  card.classList.remove("wl-item--pending", "wl-item--updating");

  if (status === "updating") {
    card.classList.add("wl-item--updating");
    card.querySelector(".wl-item-error-tag")?.remove();
    return;
  }

  if (status === "pending") {
    card.classList.add("wl-item--pending");
    return;
  }

  if (status === "failed") {
    card.classList.add("wl-item--failed");
    if (!card.querySelector(".wl-item-error-tag")) {
      const tag = document.createElement("span");
      tag.className = "wl-item-error-tag";
      tag.title = errorMsg || "Failed to fetch latest data";
      tag.textContent = "⚠ Failed";
      card.querySelector(".wl-left")?.appendChild(tag);
    }
    return;
  }

  if (status === "success" && metrics) {
    card.classList.remove("wl-item--failed");
    card.querySelector(".wl-item-error-tag")?.remove();

    // Update signal tag
    const sig = metrics.signal_review?.verdict || metrics.signal || "HOLD";
    const sigTag = card.querySelector(".signal-tag");
    if (sigTag) {
      sigTag.className = `signal-tag signal-tag--sm signal-${sig.toLowerCase()}${metrics.signal_review ? " signal-tag--interactive" : ""}`;
      sigTag.title = metrics.signalReason || (metrics.signal_review ? "Click to view Signal Review" : "");
      sigTag.innerHTML = `<span class="signal-icon">${sig === "BUY" ? "▲" : sig === "SELL" ? "▼" : sig === "UNRATED" ? "—" : "●"}</span> ${sig}`;
    }

    // Update metrics row
    const oldRow = card.querySelector(".wl-metrics");
    const newRowHtml = buildMetricsRow(metrics, ticker);
    if (oldRow) {
      oldRow.outerHTML = newRowHtml;
    } else {
      card.insertAdjacentHTML("beforeend", newRowHtml);
    }

    // Trigger subtle success glow animation
    card.classList.remove("wl-item--success");
    void card.offsetWidth;
    card.classList.add("wl-item--success");
    setTimeout(() => card.classList.remove("wl-item--success"), 1500);
  }
}

let activeRefreshAllController = null;
let isRefreshingAll = false;

function cancelRefreshAll() {
  if (activeRefreshAllController) {
    activeRefreshAllController.abort();
    activeRefreshAllController = null;
  }
}

function updateRefreshProgressBar(completed, pending, failed, total) {
  if (!els.wlProgressWrap) return;
  if (els.wlProgDoneCount) els.wlProgDoneCount.textContent = completed;
  if (els.wlProgPendingCount) els.wlProgPendingCount.textContent = pending;
  if (els.wlProgFailedCount) els.wlProgFailedCount.textContent = failed;

  if (els.wlProgFailedPill) {
    els.wlProgFailedPill.style.display = failed > 0 ? "inline-flex" : "none";
  }

  const processed = completed + failed;
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;
  if (els.wlProgressFill) {
    els.wlProgressFill.style.width = `${pct}%`;
  }
  if (els.wlProgressTitle) {
    els.wlProgressTitle.textContent = `Refreshing Watchlist (${processed}/${total})...`;
  }
}

async function refreshWatchlistItem(ticker, btnEl) {
  if (btnEl) { btnEl.disabled = true; btnEl.textContent = "…"; }
  updateWatchlistCardDOM(ticker, null, "updating");
  try {
    const data = await safeFetchWithRetry(
      `/api/analyze?ticker=${encodeURIComponent(ticker)}&years=5&months=12&refresh=true`,
      {},
      { maxRetries: 2, backoffBaseMs: 600 }
    );
    const metrics = snapshotMetrics(data);
    updateWatchlistMetrics(ticker, metrics, true);
    updateWatchlistCardDOM(ticker, metrics, "success");
    if (currentAnalysis && currentAnalysis.ticker === ticker) {
      currentAnalysis = data;
      render(data);
    }
    showNotification(`✓ ${ticker} refreshed`, "success");
  } catch (err) {
    updateWatchlistCardDOM(ticker, null, "failed", err.message);
    showNotification(`Could not refresh ${ticker}: ${err.message}`, "error");
  } finally {
    if (btnEl) { btnEl.disabled = false; btnEl.textContent = "↻"; }
  }
}

async function refreshAllWatchlist(btnEl, options = {}) {
  if (isRefreshingAll) return;

  const list = getWatchlist();
  if (!list.length) {
    showNotification("Watchlist is empty.", "info");
    return;
  }

  isRefreshingAll = true;
  activeRefreshAllController = new AbortController();
  const signal = activeRefreshAllController.signal;

  const total = list.length;
  let completed = 0;
  let failed = 0;
  let pending = total;
  const startTime = performance.now();

  if (btnEl) {
    btnEl.disabled = true;
    btnEl.innerHTML = `<span class="wl-progress-spinner" style="vertical-align:middle; margin-right:4px;"></span> Refreshing…`;
  }

  if (els.wlProgressWrap) {
    els.wlProgressWrap.hidden = false;
    els.wlProgressWrap.style.opacity = "1";
    updateRefreshProgressBar(completed, pending, failed, total);
  }

  // Mark all cards as pending in the DOM
  list.forEach((w) => {
    updateWatchlistCardDOM(w.ticker, w.metrics, "pending");
  });

  const CONCURRENCY_LIMIT = 3;
  const CACHE_FRESH_WINDOW_MS = 45000; // 45s smart cache guard

  try {
    await runWithConcurrency(
      list,
      CONCURRENCY_LIMIT,
      async (w) => {
        if (signal.aborted) throw new Error("Request cancelled");

        updateWatchlistCardDOM(w.ticker, w.metrics, "updating");

        const isFresh = !options.force && w.metrics?.refreshedAt && (Date.now() - w.metrics.refreshedAt < CACHE_FRESH_WINDOW_MS);
        let data;

        if (isFresh) {
          completed++;
          pending--;
          updateRefreshProgressBar(completed, pending, failed, total);
          updateWatchlistCardDOM(w.ticker, w.metrics, "success");
          return;
        }

        try {
          data = await safeFetchWithRetry(
            `/api/analyze?ticker=${encodeURIComponent(w.ticker)}&years=5&months=12&refresh=true`,
            {},
            { maxRetries: 2, backoffBaseMs: 600, signal }
          );

          const metrics = snapshotMetrics(data);
          updateWatchlistMetrics(w.ticker, metrics, true);

          completed++;
          pending--;
          updateRefreshProgressBar(completed, pending, failed, total);
          updateWatchlistCardDOM(w.ticker, metrics, "success");

          if (currentAnalysis && currentAnalysis.ticker === w.ticker) {
            currentAnalysis = data;
            syncCurrentAnalysisToWatchlist(data);
          }
        } catch (err) {
          if (signal.aborted) throw err;
          failed++;
          pending--;
          updateRefreshProgressBar(completed, pending, failed, total);
          updateWatchlistCardDOM(w.ticker, w.metrics, "failed", err.message);
        }
      },
      { signal }
    );

    // Update filter badges with final signal counts
    const updatedList = getWatchlist();
    const counts = { all: updatedList.length, BUY: 0, HOLD: 0, SELL: 0 };
    updatedList.forEach((w) => {
      const sig = getWatchlistItemSignal(w);
      if (counts[sig] !== undefined) counts[sig]++;
      else counts.HOLD++;
    });
    updateFilterButtons(counts);

    const durationSec = ((performance.now() - startTime) / 1000).toFixed(1);
    if (els.wlProgressTitle) {
      els.wlProgressTitle.textContent = `Completed in ${durationSec}s`;
    }

    if (failed === 0) {
      showNotification(`✓ Watchlist refreshed: ${completed} stock${completed > 1 ? "s" : ""} in ${durationSec}s.`, "success");
    } else {
      showNotification(`Watchlist refresh finished: ${completed} updated, ${failed} failed in ${durationSec}s.`, "warning");
    }
  } catch (err) {
    if (err.message === "Request cancelled" || signal.aborted) {
      showNotification("Watchlist refresh cancelled.", "info");
      if (els.wlProgressTitle) {
        els.wlProgressTitle.textContent = "Refresh cancelled";
      }
    } else {
      showNotification(`Refresh error: ${err.message}`, "error");
    }
  } finally {
    isRefreshingAll = false;
    activeRefreshAllController = null;

    if (btnEl) {
      btnEl.disabled = false;
      btnEl.textContent = "↻ Refresh All";
    }

    list.forEach((w) => {
      const card = els.watchlistItems?.querySelector(`.wl-item[data-ticker="${escapeHtml(w.ticker)}"]`);
      if (card) {
        card.classList.remove("wl-item--pending", "wl-item--updating");
      }
    });

    if (els.wlProgressWrap) {
      setTimeout(() => {
        if (!isRefreshingAll && els.wlProgressWrap) {
          els.wlProgressWrap.style.opacity = "0";
          setTimeout(() => {
            if (!isRefreshingAll && els.wlProgressWrap) {
              els.wlProgressWrap.hidden = true;
              els.wlProgressWrap.style.opacity = "1";
            }
          }, 300);
        }
      }, 3000);
    }
  }
}

function getWatchlistItemSignal(w) {
  if (w.metrics && w.metrics.signal_review && w.metrics.signal_review.verdict) {
    return w.metrics.signal_review.verdict;
  }
  if (w.metrics && w.metrics.signal) return w.metrics.signal;
  if (w.metrics) {
    const computed = computeStockSignal(w.metrics);
    w.metrics.signal = computed.signal;
    w.metrics.signalReason = computed.reason;
    return computed.signal;
  }
  return "UNRATED";
}

function renderWatchlistUI() {
  const fullList = getSortedWatchlist();
  const container = els.watchlistItems;
  if (!container) return;

  // Calculate signal counts across the entire watchlist
  const counts = { all: fullList.length, BUY: 0, HOLD: 0, SELL: 0, UNRATED: 0 };
  fullList.forEach((w) => {
    const sig = getWatchlistItemSignal(w);
    if (counts[sig] !== undefined) counts[sig]++;
  });

  updateFilterButtons(counts);

  if (fullList.length === 0) {
    container.innerHTML = `
      <div class="wl-empty">
        <svg class="wl-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <p>Your watchlist is empty.<br>Click the ⭐ next to a ticker to add it.</p>
      </div>`;
    return;
  }

  // Filter by signal if active
  const filteredList = wlSignalFilter === "all"
    ? fullList
    : fullList.filter((w) => getWatchlistItemSignal(w) === wlSignalFilter);

  if (filteredList.length === 0) {
    container.innerHTML = `
      <div class="wl-empty">
        <svg class="wl-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <p>No stocks currently flagged with <strong>${escapeHtml(wlSignalFilter)}</strong> signal.<br>
          <button type="button" class="btn btn-ghost-sm" id="wlResetFilterBtn" style="margin-top:10px; cursor:pointer;">Show All (${counts.all})</button>
        </p>
      </div>`;
    const resetBtn = document.getElementById("wlResetFilterBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        wlSignalFilter = "all";
        saveWlFilter();
        renderWatchlistUI();
      });
    }
    return;
  }

  container.innerHTML = filteredList.map((w) => {
    const sig = getWatchlistItemSignal(w);
    const reason = w.metrics?.signalReason || "";
    const safeTicker = escapeHtml(w.ticker);
    const safeCompany = escapeHtml(w.companyName || "");
    const hasReview = Boolean(w.metrics?.signal_review);
    return `
    <div class="wl-item" data-ticker="${safeTicker}">
      <div class="wl-top-row">
        <div class="wl-left">
          <span class="wl-symbol">${safeTicker}</span>
          <span class="signal-tag signal-tag--sm signal-${sig.toLowerCase()}${hasReview ? " signal-tag--interactive" : ""}" title="${escapeHtml(reason || (hasReview ? "Click to view Signal Review" : ""))}">
            <span class="signal-icon">${sig === "BUY" ? "▲" : sig === "SELL" ? "▼" : sig === "UNRATED" ? "—" : "●"}</span> ${sig}
          </span>
          ${w.companyName ? `<span class="wl-name">${safeCompany}</span>` : ""}
        </div>
        <div class="wl-actions">
          <button class="wl-refresh-btn" data-ticker="${safeTicker}" title="Refresh ${safeTicker} data">↻</button>
          <button class="wl-analyze-btn" data-ticker="${safeTicker}" title="Analyze ${safeTicker}">Analyze</button>
          <button class="wl-remove-btn" data-ticker="${safeTicker}" title="Remove from watchlist">&times;</button>
        </div>
      </div>
      ${buildMetricsRow(w.metrics, w.ticker)}
    </div>`;
  }).join("");

  // Attach click listener on watchlist signal tags to open the review modal
  container.querySelectorAll(".wl-item").forEach((item) => {
    const sigTag = item.querySelector(".signal-tag");
    if (sigTag) {
      sigTag.addEventListener("click", (e) => {
        e.stopPropagation();
        const ticker = item.dataset.ticker;
        const entry = getWatchlist().find((w) => w.ticker === ticker);
        if (entry) {
          openSignalReviewModal(entry.metrics?.signal_review || null, entry.ticker, entry.companyName);
        }
      });
    }
  });

  container.querySelectorAll(".wl-refresh-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      refreshWatchlistItem(btn.dataset.ticker, btn);
    });
  });

  container.querySelectorAll(".wl-analyze-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      els.ticker.value = btn.dataset.ticker;
      toggleWatchlistPanel(false);
      handleFetch();
    });
  });

  container.querySelectorAll(".wl-remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFromWatchlist(btn.dataset.ticker);
      if (currentAnalysis && currentAnalysis.ticker === btn.dataset.ticker) syncStarBtn(btn.dataset.ticker);
      showNotification(`Removed ${btn.dataset.ticker} from Watchlist`, "info");
    });
  });
}

function syncStarBtn(ticker) {
  const btn = els.watchlistStarBtn;
  if (!btn) return;
  const watched = isWatchlisted(ticker);
  btn.setAttribute("aria-pressed", watched ? "true" : "false");
  btn.title = watched ? "Remove from Watchlist" : "Add to Watchlist";
}

function toggleWatchlistPanel(show) {
  const panel = els.watchlistPanel;
  if (!panel) return;
  const isVisible = !panel.hidden;
  const target = show !== undefined ? show : !isVisible;
  panel.hidden = !target;
  if (els.watchlistToggleBtn) els.watchlistToggleBtn.setAttribute("aria-expanded", String(target));
  if (target && els.watchlistConfirm) els.watchlistConfirm.hidden = true;
}

function sanitizeWatchlistLegacyMetrics() {
  try {
    let list = getWatchlist();
    let changed = false;
    list.forEach((w) => {
      if (w.metrics) {
        const m = w.metrics;
        if (m.all_time_low && m.all_time_high && m.all_time_low > 0 && m.best_move_alltime_pct != null) {
          const fakeAthPct = ((m.all_time_high - m.all_time_low) / m.all_time_low) * 100;
          if (fakeAthPct > 500 && Math.abs(m.best_move_alltime_pct - fakeAthPct) < 0.01) {
            delete m.best_move_alltime_pct;
            changed = true;
          }
        }
      }
    });
    if (changed) {
      saveWatchlist(list);
    }
  } catch {
    /* ignore */
  }
}

function initWatchlist() {
  sanitizeWatchlistLegacyMetrics();
  updateWatchlistBadge();
  renderWatchlistUI();

  if (els.watchlistToggleBtn) {
    els.watchlistToggleBtn.addEventListener("click", () => {
      toggleWatchlistPanel();
      if (els.historyPanel && !els.historyPanel.hidden) toggleHistoryPanel(false);
    });
  }

  if (els.closeWatchlistBtn) {
    els.closeWatchlistBtn.addEventListener("click", () => toggleWatchlistPanel(false));
  }

  if (els.clearWatchlistBtn) {
    els.clearWatchlistBtn.addEventListener("click", () => {
      if (els.watchlistConfirm) els.watchlistConfirm.hidden = false;
    });
  }

  if (els.watchlistConfirmYes) {
    els.watchlistConfirmYes.addEventListener("click", () => {
      saveWatchlist([]);
      renderWatchlistUI();
      updateWatchlistBadge();
      if (els.watchlistConfirm) els.watchlistConfirm.hidden = true;
      if (currentAnalysis) syncStarBtn(currentAnalysis.ticker);
      showNotification("Watchlist cleared.", "info");
    });
  }

  if (els.watchlistConfirmNo) {
    els.watchlistConfirmNo.addEventListener("click", () => {
      if (els.watchlistConfirm) els.watchlistConfirm.hidden = true;
    });
  }

  if (els.watchlistStarBtn) {
    els.watchlistStarBtn.addEventListener("click", () => {
      if (!currentAnalysis) return;
      const companyName = els.sumCompanyName ? els.sumCompanyName.textContent : "";
      toggleWatchlist(currentAnalysis.ticker, companyName);
    });
  }

  if (els.refreshAllWatchlistBtn) {
    els.refreshAllWatchlistBtn.addEventListener("click", (e) => {
      refreshAllWatchlist(e.currentTarget);
    });
  }

  if (els.wlCancelRefreshBtn) {
    els.wlCancelRefreshBtn.addEventListener("click", () => {
      cancelRefreshAll();
    });
  }

  initWatchlistFilter();
  initWatchlistSort();
  initWatchlistResize();
  initWatchlistIo();
}

// ---------------------------------------------------------------------------
// Watchlist Signal Filter
// ---------------------------------------------------------------------------
const STORAGE_WL_FILTER_KEY = "stock_ledger_wl_signal_filter";
let wlSignalFilter = "all"; // 'all' | 'BUY' | 'HOLD' | 'SELL'

(function restoreWlFilter() {
  try {
    const f = localStorage.getItem(STORAGE_WL_FILTER_KEY);
    if (f && ["all", "BUY", "HOLD", "SELL"].includes(f)) {
      wlSignalFilter = f;
    }
  } catch { /* ignore */ }
})();

function saveWlFilter() {
  try {
    localStorage.setItem(STORAGE_WL_FILTER_KEY, wlSignalFilter);
  } catch { /* ignore */ }
}

function updateFilterButtons(counts) {
  const filterKeys = ["all", "BUY", "HOLD", "SELL"];
  filterKeys.forEach((key) => {
    const id = "wlFilter" + (key === "all" ? "All" : key.charAt(0) + key.slice(1).toLowerCase());
    const btn = document.getElementById(id);
    if (!btn) return;
    const isActive = wlSignalFilter === key;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");

    const countId = "wlCount" + (key === "all" ? "All" : key.charAt(0) + key.slice(1).toLowerCase());
    const countEl = document.getElementById(countId);
    if (countEl && counts) {
      countEl.textContent = counts[key] ?? 0;
    }
  });
}

function initWatchlistFilter() {
  const filterKeys = [
    { key: "all", id: "wlFilterAll" },
    { key: "BUY", id: "wlFilterBuy" },
    { key: "HOLD", id: "wlFilterHold" },
    { key: "SELL", id: "wlFilterSell" },
  ];

  filterKeys.forEach(({ key, id }) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener("click", () => {
      wlSignalFilter = key;
      saveWlFilter();
      renderWatchlistUI();
    });
  });
}

// ---------------------------------------------------------------------------
// Watchlist Sort
// ---------------------------------------------------------------------------
const STORAGE_WL_SORT_KEY = "stock_ledger_wl_sort";
let wlSortKey = "alpha";   // 'alpha' | 'low' | 'high'
let wlSortDir = 1;          // 1 = asc, -1 = desc

(function restoreWlSort() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_WL_SORT_KEY));
    if (s) { wlSortKey = s.key || "alpha"; wlSortDir = s.dir || 1; }
  } catch { /* ignore */ }
})();

function saveWlSort() {
  localStorage.setItem(STORAGE_WL_SORT_KEY, JSON.stringify({ key: wlSortKey, dir: wlSortDir }));
}

function getBestMoveYearPct(w) {
  if (currentAnalysis && currentAnalysis.ticker === w.ticker && currentAnalysis.best_move_current_year?.pct_diff != null) {
    return currentAnalysis.best_move_current_year.pct_diff;
  }
  if (w.metrics?.best_move_year_pct != null) return w.metrics.best_move_year_pct;
  const m = w.metrics;
  if (m?.latest_low && m?.latest_high && m.latest_low > 0) {
    return ((m.latest_high - m.latest_low) / m.latest_low) * 100;
  }
  return null;
}

function getBestMoveAlltimePct(w) {
  if (currentAnalysis && currentAnalysis.ticker === w.ticker && currentAnalysis.best_move_overall?.pct_diff != null) {
    return currentAnalysis.best_move_overall.pct_diff;
  }
  if (w.metrics?.best_move_alltime_pct != null) return w.metrics.best_move_alltime_pct;
  return null;
}

function getSortedWatchlist() {
  const list = [...getWatchlist()];
  list.sort((a, b) => {
    if (wlSortKey === "alpha") {
      return wlSortDir * a.ticker.localeCompare(b.ticker);
    }
    if (wlSortKey === "low") {
      const av = a.metrics?.diff_from_latest_low_pct ?? null;
      const bv = b.metrics?.diff_from_latest_low_pct ?? null;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return wlSortDir * (av - bv);
    }
    if (wlSortKey === "high") {
      const av = a.metrics?.diff_from_latest_high_pct ?? null;
      const bv = b.metrics?.diff_from_latest_high_pct ?? null;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return wlSortDir * (av - bv);
    }
    if (wlSortKey === "atlow") {
      const av = a.metrics?.diff_from_all_time_low_pct ?? null;
      const bv = b.metrics?.diff_from_all_time_low_pct ?? null;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return wlSortDir * (av - bv);
    }
    if (wlSortKey === "athigh") {
      const av = a.metrics?.diff_from_all_time_high_pct ?? null;
      const bv = b.metrics?.diff_from_all_time_high_pct ?? null;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return wlSortDir * (av - bv);
    }
    if (wlSortKey === "moveyear") {
      const av = getBestMoveYearPct(a);
      const bv = getBestMoveYearPct(b);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return wlSortDir * (av - bv);
    }
    if (wlSortKey === "moveall") {
      const av = getBestMoveAlltimePct(a);
      const bv = getBestMoveAlltimePct(b);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return wlSortDir * (av - bv);
    }
    return 0;
  });
  return list;
}

const SORT_LABELS = {
  alpha: "A–Z",
  low: "Yr Low %",
  high: "Yr High %",
  atlow: "AT Low %",
  athigh: "AT High %",
  moveyear: "Best Move · Yr",
  moveall: "Best Move · AT %",
};
const SORT_KEYS = ["alpha", "low", "high", "atlow", "athigh", "moveyear", "moveall"];

function updateSortButtons() {
  const arrowUp = " ↑", arrowDown = " ↓";
  SORT_KEYS.forEach((key) => {
    const btn = document.getElementById("wlSort" + key.charAt(0).toUpperCase() + key.slice(1));
    if (!btn) return;
    btn.classList.toggle("active", key === wlSortKey);
    let label = SORT_LABELS[key] || key;
    if (key === "alpha") {
      label = wlSortDir === 1 ? "A–Z" : "Z–A";
    }
    btn.textContent = label + (key === wlSortKey ? (wlSortDir === 1 ? arrowUp : arrowDown) : "");
  });
}

function initWatchlistSort() {
  SORT_KEYS.forEach((key) => {
    const btn = document.getElementById("wlSort" + key.charAt(0).toUpperCase() + key.slice(1));
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (wlSortKey === key) {
        wlSortDir = wlSortDir === 1 ? -1 : 1;
      } else {
        wlSortKey = key;
        // Default to descending (largest gain first) for Best Move sorts
        wlSortDir = (key === "moveyear" || key === "moveall") ? -1 : 1;
      }
      saveWlSort();
      updateSortButtons();
      renderWatchlistUI();
    });
  });
  updateSortButtons();
}

// ---------------------------------------------------------------------------
// Watchlist Pane Resize (drag handle)
// ---------------------------------------------------------------------------
const STORAGE_WL_HEIGHT_KEY = "stock_ledger_wl_height";
const WL_HEIGHT_MIN = 120;
const WL_HEIGHT_MAX = 700;
const WL_HEIGHT_DEFAULT = 480;

function initWatchlistResize() {
  const handle = document.getElementById("watchlistResizeHandle");
  const list   = document.getElementById("watchlistItems");
  if (!handle || !list) return;

  // Restore saved height
  const saved = parseInt(localStorage.getItem(STORAGE_WL_HEIGHT_KEY), 10);
  if (saved >= 400 && saved <= WL_HEIGHT_MAX) {
    list.style.maxHeight = saved + "px";
  } else {
    list.style.maxHeight = WL_HEIGHT_DEFAULT + "px";
  }

  let startY = 0;
  let startH = 0;

  function onMouseMove(e) {
    const delta  = e.clientY - startY;
    const newH   = Math.min(WL_HEIGHT_MAX, Math.max(WL_HEIGHT_MIN, startH + delta));
    list.style.maxHeight = newH + "px";
  }

  function onMouseUp() {
    handle.classList.remove("is-dragging");
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    // Persist
    const h = parseInt(list.style.maxHeight, 10);
    if (!isNaN(h)) localStorage.setItem(STORAGE_WL_HEIGHT_KEY, h);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }

  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    startY = e.clientY;
    startH = list.offsetHeight || parseInt(list.style.maxHeight, 10) || WL_HEIGHT_DEFAULT;
    handle.classList.add("is-dragging");
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  // Touch support
  handle.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    startY = touch.clientY;
    startH = list.offsetHeight || parseInt(list.style.maxHeight, 10) || WL_HEIGHT_DEFAULT;
    handle.classList.add("is-dragging");
  }, { passive: true });

  handle.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    const delta = touch.clientY - startY;
    const newH  = Math.min(WL_HEIGHT_MAX, Math.max(WL_HEIGHT_MIN, startH + delta));
    list.style.maxHeight = newH + "px";
  }, { passive: true });

  handle.addEventListener("touchend", () => {
    handle.classList.remove("is-dragging");
    const h = parseInt(list.style.maxHeight, 10);
    if (!isNaN(h)) localStorage.setItem(STORAGE_WL_HEIGHT_KEY, h);
  });
}

// ---------------------------------------------------------------------------
// Watchlist Import & Export Module (Client-side JSON, CSV, TXT)
// ---------------------------------------------------------------------------
function getIsoDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function closeWatchlistIoMenu() {
  if (els.watchlistIoMenu) els.watchlistIoMenu.hidden = true;
  if (els.watchlistIoBtn) els.watchlistIoBtn.setAttribute("aria-expanded", "false");
}

function exportWatchlistTickersJson() {
  const list = getWatchlist();
  if (!list.length) {
    showNotification("Watchlist is empty — add tickers before exporting", "info");
    return;
  }

  const payload = {
    app: "SignalLedger",
    version: "2.0.0",
    exportType: "tickers_only",
    exportedAt: new Date().toISOString(),
    count: list.length,
    tickers: list.map((w) => w.ticker),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
  downloadBlob(blob, `signalledger-tickers-${getIsoDate()}.json`);
  showNotification(`Exported ${list.length} ticker symbol${list.length > 1 ? "s" : ""} (JSON)`, "success");
}

function exportWatchlistTickersCsv() {
  const list = getWatchlist();
  if (!list.length) {
    showNotification("Watchlist is empty — add tickers before exporting", "info");
    return;
  }

  const rows = list.map((w) => `"${String(w.ticker).replace(/"/g, '""')}"`);
  const csvContent = ["Ticker", ...rows].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `signalledger-tickers-${getIsoDate()}.csv`);
  showNotification(`Exported ${list.length} ticker symbol${list.length > 1 ? "s" : ""} (CSV)`, "success");
}

function exportWatchlistFullJson() {
  const list = getWatchlist();
  if (!list.length) {
    showNotification("Watchlist is empty — add tickers before exporting", "info");
    return;
  }

  const payload = {
    app: "SignalLedger",
    version: "2.0.0",
    exportType: "tickers_with_data",
    exportedAt: new Date().toISOString(),
    count: list.length,
    tickers: list.map((w) => w.ticker),
    watchlist: list.map((w) => ({
      ticker: w.ticker,
      companyName: w.companyName || "",
      addedAt: w.addedAt || null,
      metrics: w.metrics || null,
    })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
  downloadBlob(blob, `signalledger-watchlist-data-${getIsoDate()}.json`);
  showNotification(`Exported ${list.length} ticker${list.length > 1 ? "s" : ""} with full data (JSON)`, "success");
}

function exportWatchlistFullCsv() {
  const list = getWatchlist();
  if (!list.length) {
    showNotification("Watchlist is empty — add tickers before exporting", "info");
    return;
  }

  const headers = [
    "Ticker",
    "Company",
    "Signal",
    "Latest_Close",
    "52W_Low",
    "Diff_From_52W_Low_Pct",
    "52W_High",
    "Diff_From_52W_High_Pct",
    "All_Time_Low",
    "All_Time_High",
    "Best_Move_Year_Pct",
    "Best_Move_AllTime_Pct",
    "Signal_Reason",
    "Added_At",
    "Refreshed_At",
  ];

  const rows = list.map((w) => {
    const m = w.metrics || {};
    const sig = getWatchlistItemSignal(w);
    const moveYr = getBestMoveYearPct(w);
    const moveAll = getBestMoveAlltimePct(w);
    const cells = [
      w.ticker,
      w.companyName || "",
      sig,
      m.latest_close ?? "",
      m.latest_low ?? "",
      m.diff_from_latest_low_pct != null ? Number(m.diff_from_latest_low_pct).toFixed(2) : "",
      m.latest_high ?? "",
      m.diff_from_latest_high_pct != null ? Number(m.diff_from_latest_high_pct).toFixed(2) : "",
      m.all_time_low ?? "",
      m.all_time_high ?? "",
      moveYr != null ? Number(moveYr).toFixed(2) : "",
      moveAll != null ? Number(moveAll).toFixed(2) : "",
      m.signalReason || "",
      w.addedAt ? new Date(w.addedAt).toISOString() : "",
      m.refreshedAt ? new Date(m.refreshedAt).toISOString() : "",
    ];
    return cells.map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `signalledger-watchlist-data-${getIsoDate()}.csv`);
  showNotification(`Exported ${list.length} ticker${list.length > 1 ? "s" : ""} with full data (CSV)`, "success");
}

// Fallback aliases for any legacy calls
function exportWatchlistJson() {
  exportWatchlistTickersJson();
}

function exportWatchlistCsv() {
  exportWatchlistTickersCsv();
}

function parseCsvLine(text) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((c === "," || c === ";" || c === "\t") && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function sanitizeImportedMetrics(m) {
  if (!m || typeof m !== "object") return null;
  const num = (v) => (v != null && v !== "" && !isNaN(Number(v)) ? Number(v) : null);
  const str = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);

  const hasAnyData =
    m.latest_close != null ||
    m.close != null ||
    m.price != null ||
    m.latest_low != null ||
    m.latest_high != null ||
    m.signal != null ||
    m.signal_review != null;

  if (!hasAnyData) return null;

  return {
    latest_close: num(m.latest_close ?? m.close ?? m.price),
    latest_low: num(m.latest_low ?? m["52w_low"] ?? m.low),
    latest_high: num(m.latest_high ?? m["52w_high"] ?? m.high),
    diff_from_latest_low_pct: num(m.diff_from_latest_low_pct ?? m.diff_from_52w_low_pct),
    diff_from_latest_high_pct: num(m.diff_from_latest_high_pct ?? m.diff_from_52w_high_pct),
    latest_low_date: str(m.latest_low_date),
    latest_high_date: str(m.latest_high_date),
    all_time_low: num(m.all_time_low),
    all_time_high: num(m.all_time_high),
    diff_from_all_time_low_pct: num(m.diff_from_all_time_low_pct),
    diff_from_all_time_high_pct: num(m.diff_from_all_time_high_pct),
    best_move_year_pct: num(m.best_move_year_pct ?? m.best_move_year),
    best_move_alltime_pct: num(m.best_move_alltime_pct ?? m.best_move_alltime),
    signal: str(m.signal ?? m.signal_review?.verdict),
    signalReason: str(m.signalReason ?? m.signal_reason),
    signal_review: m.signal_review && typeof m.signal_review === "object" ? m.signal_review : null,
    refreshedAt: m.refreshedAt ? (typeof m.refreshedAt === "number" ? m.refreshedAt : Date.parse(m.refreshedAt) || Date.now()) : Date.now(),
  };
}

function processWatchlistText(content, filename = "") {
  if (!content || typeof content !== "string") {
    showNotification("Empty or unreadable file", "error");
    return;
  }

  const trimmed = content.trim();
  let candidates = []; // Array of { ticker, companyName, addedAt, metrics }
  let isFullData = false;

  // 1. Attempt JSON parsing
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);

      if (parsed && typeof parsed === "object") {
        if (parsed.exportType === "tickers_with_data" || parsed.exportType === "full") {
          isFullData = true;
        }

        let rawItems = [];
        if (Array.isArray(parsed.watchlist)) {
          rawItems = parsed.watchlist;
        } else if (Array.isArray(parsed)) {
          rawItems = parsed;
        } else if (Array.isArray(parsed.tickers)) {
          rawItems = parsed.tickers;
        } else if (Array.isArray(parsed.symbols)) {
          rawItems = parsed.symbols;
        } else {
          rawItems = Object.entries(parsed)
            .filter(([k]) => !["app", "version", "exportedAt", "count", "exportType"].includes(k))
            .map(([k, v]) => (typeof v === "object" && v !== null ? { ticker: k, ...v } : { ticker: k }));
        }

        // Auto-detect full data inside items if not explicitly set by exportType
        if (!isFullData) {
          isFullData = rawItems.some(
            (item) => item && typeof item === "object" && (item.metrics != null || item.latest_close != null || item.signal != null)
          );
        }

        rawItems.forEach((item) => {
          if (typeof item === "string") {
            candidates.push({ ticker: item, companyName: "", addedAt: Date.now(), metrics: null });
          } else if (item && typeof item === "object") {
            const sym = item.ticker || item.symbol || item.Ticker || item.Symbol;
            if (!sym || typeof sym !== "string") return;

            const company = item.companyName || item.company || item.name || "";
            const added = item.addedAt && Number(item.addedAt) ? Number(item.addedAt) : Date.now();
            const metrics = isFullData ? sanitizeImportedMetrics(item.metrics || item) : null;
            candidates.push({ ticker: sym, companyName: company, addedAt: added, metrics });
          }
        });
      }
    } catch {
      // Not JSON, fallback to line-by-line / CSV parsing below
    }
  }

  // 2. CSV / TSV / Plain text parsing if no JSON candidates extracted
  if (!candidates.length) {
    const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      const headerRaw = parseCsvLine(lines[0]);
      const headerTokens = headerRaw.map((t) => t.toLowerCase().replace(/[\s\-_]/g, ""));

      const findCol = (tokens) => headerTokens.findIndex((h) => tokens.includes(h));

      const tickerIdx = findCol(["ticker", "symbol"]);
      const companyIdx = findCol(["company", "companyname", "name"]);
      const signalIdx = findCol(["signal", "verdict", "signalverdict"]);
      const closeIdx = findCol(["latestclose", "close", "price", "regularmarketprice"]);
      const lowIdx = findCol(["52wlow", "latestlow", "low"]);
      const diffLowIdx = findCol(["difffrom52wlowpct", "difffromlatestlowpct", "difflowpct"]);
      const highIdx = findCol(["52whigh", "latesthigh", "high"]);
      const diffHighIdx = findCol(["difffrom52whighpct", "difffromlatesthighpct", "diffhighpct"]);
      const atlIdx = findCol(["alltimelow", "atl"]);
      const athIdx = findCol(["alltimehigh", "ath"]);
      const moveYrIdx = findCol(["bestmoveyearpct", "bestmoveyear", "moveyr"]);
      const moveAllIdx = findCol(["bestmovealltimepct", "bestmovealltime", "moveat"]);
      const reasonIdx = findCol(["signalreason", "reason"]);
      const addedAtIdx = findCol(["addedat", "added"]);
      const refreshedAtIdx = findCol(["refreshedat", "refreshed"]);

      const hasHeader = tickerIdx !== -1 || headerTokens.includes("ticker") || headerTokens.includes("symbol");
      isFullData = closeIdx !== -1 || lowIdx !== -1 || signalIdx !== -1 || companyIdx !== -1;

      const numVal = (row, idx) => (idx !== -1 && row[idx] !== "" && !isNaN(Number(row[idx])) ? Number(row[idx]) : null);
      const strVal = (row, idx) => (idx !== -1 && row[idx] ? String(row[idx]).trim() : "");

      const startLine = hasHeader ? 1 : 0;
      const actualTickerIdx = tickerIdx !== -1 ? tickerIdx : 0;

      for (let i = startLine; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(",") || line.includes("\t") || line.includes(";")) {
          const row = parseCsvLine(line);
          const rawTicker = row[actualTickerIdx];
          if (!rawTicker) continue;

          let metrics = null;
          if (isFullData) {
            metrics = {
              latest_close: numVal(row, closeIdx),
              latest_low: numVal(row, lowIdx),
              diff_from_latest_low_pct: numVal(row, diffLowIdx),
              latest_high: numVal(row, highIdx),
              diff_from_latest_high_pct: numVal(row, diffHighIdx),
              latest_low_date: null,
              latest_high_date: null,
              all_time_low: numVal(row, atlIdx),
              all_time_high: numVal(row, athIdx),
              diff_from_all_time_low_pct: null,
              diff_from_all_time_high_pct: null,
              best_move_year_pct: numVal(row, moveYrIdx),
              best_move_alltime_pct: numVal(row, moveAllIdx),
              signal: strVal(row, signalIdx) || null,
              signalReason: strVal(row, reasonIdx) || null,
              signal_review: null,
              refreshedAt: refreshedAtIdx !== -1 && row[refreshedAtIdx] ? Date.parse(row[refreshedAtIdx]) || Date.now() : Date.now(),
            };
          }

          const company = companyIdx !== -1 ? strVal(row, companyIdx) : "";
          const addedAt = addedAtIdx !== -1 && row[addedAtIdx] ? Date.parse(row[addedAtIdx]) || Date.now() : Date.now();

          candidates.push({
            ticker: rawTicker,
            companyName: company,
            addedAt,
            metrics,
          });
        } else {
          const matches = line.match(/[A-Za-z0-9.\-^=]{1,12}/g);
          if (matches) {
            matches.forEach((m) => candidates.push({ ticker: m, companyName: "", addedAt: Date.now(), metrics: null }));
          }
        }
      }
    }
  }

  const IGNORE_WORDS = new Set([
    "TICKER", "SYMBOL", "NAME", "COMPANY", "PRICE", "SIGNAL", "DATE",
    "CLOSE", "HIGH", "LOW", "VOLUME", "EXCHANGE", "TYPE", "ACTIONS",
    "TRUE", "FALSE", "NULL", "UNDEFINED", "APP", "VERSION", "EXPORTEDAT", "COUNT", "EXPORTTYPE",
  ]);

  const currentList = getWatchlist();
  const existingMap = new Map(currentList.map((w) => [w.ticker.toUpperCase(), w]));
  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const c of candidates) {
    if (!c || !c.ticker || typeof c.ticker !== "string") continue;
    const cleanTicker = c.ticker.trim().replace(/^["']|["']$/g, "").toUpperCase();
    if (!cleanTicker || cleanTicker.length > 12) continue;
    if (IGNORE_WORDS.has(cleanTicker)) continue;
    if (!/^[A-Z0-9.\-^=]{1,12}$/.test(cleanTicker)) continue;

    if (existingMap.has(cleanTicker)) {
      const existing = existingMap.get(cleanTicker);
      if (isFullData && c.metrics && (!existing.metrics || existing.metrics.latest_close == null)) {
        existing.metrics = c.metrics;
        if (c.companyName && !existing.companyName) existing.companyName = c.companyName;
        updatedCount++;
      } else {
        skippedCount++;
      }
      continue;
    }

    const newEntry = {
      ticker: cleanTicker,
      companyName: c.companyName || "",
      addedAt: c.addedAt || Date.now(),
      metrics: isFullData && c.metrics ? c.metrics : null,
    };
    currentList.unshift(newEntry);
    existingMap.set(cleanTicker, newEntry);
    addedCount++;
  }

  if (addedCount > 0 || updatedCount > 0) {
    saveWatchlist(currentList);
    renderWatchlistUI();
    updateWatchlistBadge();
    if (currentAnalysis && currentAnalysis.ticker) {
      syncStarBtn(currentAnalysis.ticker);
    }

    if (isFullData) {
      if (addedCount > 0 && updatedCount > 0) {
        showNotification(`\u2705 Imported ${addedCount} and updated ${updatedCount} tickers with full data`, "success");
      } else if (addedCount > 0) {
        showNotification(`\u2705 Imported ${addedCount} ticker${addedCount > 1 ? "s" : ""} with full data`, "success");
      } else {
        showNotification(`\u2705 Updated data for ${updatedCount} ticker${updatedCount > 1 ? "s" : ""}`, "success");
      }
    } else {
      showNotification(
        `\u2705 Imported ${addedCount} ticker symbol${addedCount > 1 ? "s" : ""} (Tickers Only). Click Refresh All to fetch live data.`,
        "success"
      );
    }
  } else if (skippedCount > 0) {
    showNotification(`All ${skippedCount} ticker${skippedCount > 1 ? "s are" : " is"} already in your Watchlist`, "info");
  } else {
    showNotification("No valid ticker symbols found in the selected file", "error");
  }
}

function importWatchlistFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    processWatchlistText(text, file.name);
  };
  reader.onerror = () => {
    showNotification("Error reading uploaded file", "error");
  };
  reader.readAsText(file);
}

function initWatchlistIo() {
  if (els.watchlistIoBtn && els.watchlistIoMenu) {
    els.watchlistIoBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = els.watchlistIoMenu.hidden;
      els.watchlistIoMenu.hidden = !isHidden;
      els.watchlistIoBtn.setAttribute("aria-expanded", String(isHidden));
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".wl-io-wrap")) {
        closeWatchlistIoMenu();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !els.watchlistIoMenu.hidden) {
        closeWatchlistIoMenu();
      }
    });
  }

  if (els.exportWlJsonTickersBtn) {
    els.exportWlJsonTickersBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeWatchlistIoMenu();
      exportWatchlistTickersJson();
    });
  }

  if (els.exportWlCsvTickersBtn) {
    els.exportWlCsvTickersBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeWatchlistIoMenu();
      exportWatchlistTickersCsv();
    });
  }

  if (els.exportWlJsonFullBtn) {
    els.exportWlJsonFullBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeWatchlistIoMenu();
      exportWatchlistFullJson();
    });
  }

  if (els.exportWlCsvFullBtn) {
    els.exportWlCsvFullBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeWatchlistIoMenu();
      exportWatchlistFullCsv();
    });
  }

  // Fallback aliases
  if (els.exportWlJsonBtn) {
    els.exportWlJsonBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeWatchlistIoMenu();
      exportWatchlistTickersJson();
    });
  }

  if (els.exportWlCsvBtn) {
    els.exportWlCsvBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeWatchlistIoMenu();
      exportWatchlistTickersCsv();
    });
  }

  if (els.importWlBtn && els.watchlistFileInput) {
    els.importWlBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeWatchlistIoMenu();
      els.watchlistFileInput.click();
    });

    els.watchlistFileInput.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        importWatchlistFile(files[0]);
      }
      els.watchlistFileInput.value = "";
    });
  }

  if (els.watchlistPanel) {
    const panel = els.watchlistPanel;
    ["dragenter", "dragover"].forEach((eventName) => {
      panel.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        panel.classList.add("wl-drag-active");
      });
    });

    ["dragleave", "dragend"].forEach((eventName) => {
      panel.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        panel.classList.remove("wl-drag-active");
      });
    });

    panel.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      panel.classList.remove("wl-drag-active");
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        importWatchlistFile(dt.files[0]);
      }
    });
  }
}


// ---------------------------------------------------------------------------
// Theme Management (Light / Dark with persistence)
// ---------------------------------------------------------------------------
function initTheme() {
  const saved = localStorage.getItem(STORAGE_THEME_KEY);
  if (saved === "light" || saved === "dark") {
    currentTheme = saved;
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
    currentTheme = "light";
  } else {
    currentTheme = "dark";
  }
  applyTheme(currentTheme);
}

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_THEME_KEY, theme);
  updateChartsTheme();
}

function toggleTheme() {
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
}

function getThemeColors() {
  const isDark = currentTheme === "dark";
  return {
    isDark,
    grid: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)",
    text: isDark ? "#94A3B8" : "#64748B",
    primary: "#3B82F6",
    teal: isDark ? "#10B981" : "#059669",
    amber: "#F59E0B",
    coral: "#EF4444",
    tooltipBg: isDark ? "#1A2845" : "#0F172A",
    tooltipText: "#FFFFFF",
  };
}

function updateChartsTheme() {
  if (priceHistoryChart) {
    renderPriceHistoryChart(activeRangeKey);
  }
  if (rsiChart && activeOverlays.rsi) {
    renderRSIChart(activeRangeKey);
  }
  if (yearlyChart && currentAnalysis) {
    renderYearlyChart(currentAnalysis.yearly);
  }
}

// ---------------------------------------------------------------------------
// Search & Upload History Management
// ---------------------------------------------------------------------------
function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(item) {
  try {
    let history = getHistory();
    // De-duplicate by query & type
    history = history.filter((h) => !(h.query === item.query && h.type === item.type));
    history.unshift(item);
    if (history.length > 15) history = history.slice(0, 15);
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
    renderHistoryUI();
  } catch (err) {
    console.error("Failed to save history:", err);
  }
}

function deleteHistoryItem(id, e) {
  if (e) e.stopPropagation();
  let history = getHistory();
  history = history.filter((h) => h.id !== id);
  localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
  renderHistoryUI();
}

function clearAllHistory() {
  localStorage.removeItem(STORAGE_HISTORY_KEY);
  renderHistoryUI();
  showNotification("Search history cleared.", "info");
}

function formatRelativeTime(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function renderHistoryUI() {
  const history = getHistory();
  if (els.historyCount) els.historyCount.textContent = history.length;

  if (!els.historyList) return;

  if (history.length === 0) {
    els.historyList.innerHTML = `<p class="history-empty">No recent activity yet. Searches and uploads will appear here.</p>`;
    return;
  }

  els.historyList.innerHTML = history.map((item) => {
    const safeId = escapeHtml(item.id);
    const safeType = escapeHtml(item.type);
    const safeQuery = escapeHtml(item.query);
    const safeYears = escapeHtml(item.years || 5);
    const safeMonths = escapeHtml(item.months || 12);
    return `
    <div class="history-item" data-id="${safeId}" data-type="${safeType}" data-query="${safeQuery}" data-years="${safeYears}" data-months="${safeMonths}">
      <span class="history-source-badge ${safeType}">${safeType}</span>
      <span class="history-query">${safeQuery}</span>
      <span class="history-meta">${safeYears}y · ${safeMonths}m · ${formatRelativeTime(item.timestamp)}</span>
      <button type="button" class="history-item-del" data-id="${safeId}" title="Remove from history">&times;</button>
    </div>
  `;
  }).join("");

  // Attach click events
  els.historyList.querySelectorAll(".history-item").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.classList.contains("history-item-del")) return;
      const type = el.dataset.type;
      const query = el.dataset.query;
      els.years.value = el.dataset.years;
      els.months.value = el.dataset.months;
      
      if (type === "yahoo") {
        els.ticker.value = query;
        handleFetch();
      } else {
        showNotification(`History item is a local CSV file "${query}". Please re-upload the file to analyze.`, "info");
      }
      toggleHistoryPanel(false);
    });
  });

  els.historyList.querySelectorAll(".history-item-del").forEach((delBtn) => {
    delBtn.addEventListener("click", (e) => {
      deleteHistoryItem(delBtn.dataset.id, e);
    });
  });
}

function toggleHistoryPanel(show) {
  const isVisible = !els.historyPanel.hidden;
  const target = show !== undefined ? show : !isVisible;
  els.historyPanel.hidden = !target;
  els.historyToggleBtn.setAttribute("aria-expanded", String(target));
  // Close watchlist if opening history
  if (target && els.watchlistPanel && !els.watchlistPanel.hidden) {
    toggleWatchlistPanel(false);
  }
}

// ---------------------------------------------------------------------------
// Feedback & Notification Banner System
// ---------------------------------------------------------------------------
let statusTimeout = null;

function showNotification(msg, type = "info") {
  if (statusTimeout) {
    clearTimeout(statusTimeout);
    statusTimeout = null;
  }
  if (!els.statusBanner || !els.statusLine) return;

  els.statusLine.textContent = msg;
  els.statusBanner.className = `status-banner is-${type}`;
  els.statusBanner.hidden = false;
  els.statusBanner.style.display = "flex";

  // Icon setup
  let iconSvg = "";
  if (type === "error") {
    iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  } else if (type === "success") {
    iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === "loading-state") {
    iconSvg = `<svg class="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19"></path></svg>`;
  } else {
    iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }
  els.statusIcon.innerHTML = iconSvg;

  // Auto-dismiss success and info notices after 6s
  if (type === "success" || type === "info") {
    statusTimeout = setTimeout(() => {
      dismissNotification();
    }, 6000);
  }
}

function dismissNotification() {
  if (statusTimeout) {
    clearTimeout(statusTimeout);
    statusTimeout = null;
  }
  if (els.statusBanner) {
    els.statusBanner.hidden = true;
    els.statusBanner.style.display = "none";
  }
}

function setLoadingState(isLoading, actionText = "") {
  if (isLoading) {
    els.skeletonLoader.hidden = false;
    showNotification(actionText, "loading-state");
  } else {
    els.skeletonLoader.hidden = true;
  }
}

// ---------------------------------------------------------------------------
// Formatting Helpers
// ---------------------------------------------------------------------------
function formatPrice(v) {
  if (v == null) return "—";
  if (v < 1) return "$" + v.toFixed(4);
  if (v < 10) return "$" + v.toFixed(3);
  return "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatPct(v) {
  if (v == null) return "—";
  return v.toLocaleString(undefined, { maximumFractionDigits: 1 }) + "%";
}

// ---------------------------------------------------------------------------
// Rendering Core
// ---------------------------------------------------------------------------
function renderSummary(data) {
  els.sumTicker.textContent = data.ticker;
  els.sumSource.textContent = data.source === "yahoo" ? "Live · Yahoo Finance" : "Uploaded CSV";
  els.sumClose.textContent = formatPrice(data.latest_close);
  els.sumRange.textContent = `${formatDate(data.range_start)} – ${formatDate(data.range_end)}`;
  els.sumDays.textContent = data.trading_days.toLocaleString();

  // Real-time Buy / Sell / Hold Signal Badge
  updateStockSignalBadge(data, priceHistoryData);

  // Company name subtitle
  if (els.sumCompanyName) {
    els.sumCompanyName.textContent = data.company_name || "";
  }

  // Show star button and sync its watchlist state (only for real tickers, not CSV uploads)
  if (els.watchlistStarBtn) {
    const isRealTicker = data.source === "yahoo" && data.ticker !== "UPLOAD" && data.ticker !== "CSV_IMPORT";
    els.watchlistStarBtn.hidden = !isRealTicker;
    if (isRealTicker) syncStarBtn(data.ticker);
  }

  // Year Low tile — price + diff badge
  const latestClose = data.latest_close;
  let yearLow = data.latest_low;
  let yearLowDate = data.latest_low_date;

  if (yearLow == null && data.yearly && data.yearly.length > 0) {
    const currentYear = data.yearly[data.yearly.length - 1];
    if (currentYear && currentYear.low) {
      yearLow = currentYear.low.price;
      yearLowDate = currentYear.low.date;
    }
  }

  if (els.sumYearLow) {
    els.sumYearLow.textContent = yearLow != null ? formatPrice(yearLow) : "—";
  }

  if (yearLow != null && els.sumCloseDiff) {
    const diff = latestClose - yearLow;
    const diffPct = yearLow > 0 ? (diff / yearLow) * 100 : 0;
    const sign = diff >= 0 ? "+" : "";
    const badgeClass = diff > 0 ? "positive" : (diff < 0 ? "negative" : "neutral");
    const dateFormatted = yearLowDate ? ` on ${formatDate(yearLowDate)}` : "";
    
    els.sumCloseDiff.innerHTML = `
      <span class="metric-diff-badge ${badgeClass}" title="Latest Close (${formatPrice(latestClose)}) vs Current Year Low (${formatPrice(yearLow)}${dateFormatted})">
        ${sign}${formatPct(diffPct)}
        <span class="metric-diff-tag">vs latest close</span>
      </span>
    `;
  } else if (els.sumCloseDiff) {
    els.sumCloseDiff.innerHTML = "";
  }

  // Year High metric tile + badge
  const yearHigh = data.latest_high ?? null;
  const yearHighDate = data.latest_high_date ?? null;

  if (yearHigh != null && els.sumYearHigh) {
    els.sumYearHigh.textContent = formatPrice(yearHigh);
  } else if (els.sumYearHigh) {
    els.sumYearHigh.textContent = "—";
  }

  if (yearHigh != null && els.sumCloseHighDiff) {
    const diff = latestClose - yearHigh;
    const diffPct = yearHigh > 0 ? (diff / yearHigh) * 100 : 0;
    const sign = diff >= 0 ? "+" : "";
    // close below high → negative/red; at/above high → positive
    const badgeClass = diff < 0 ? "negative" : (diff > 0 ? "positive" : "neutral");
    const dateFormatted = yearHighDate ? ` on ${formatDate(yearHighDate)}` : "";

    els.sumCloseHighDiff.innerHTML = `
      <span class="metric-diff-badge ${badgeClass}" title="Latest Close (${formatPrice(latestClose)}) vs Current Year High (${formatPrice(yearHigh)}${dateFormatted})">
        ${sign}${formatPct(diffPct)}
        <span class="metric-diff-tag">vs latest close</span>
      </span>
    `;
  } else if (els.sumCloseHighDiff) {
    els.sumCloseHighDiff.innerHTML = "";
  }

  // All-Time Low metric tile + badge
  const atLow = data.all_time_low ?? null;
  if (els.sumAllTimeLow) {
    els.sumAllTimeLow.textContent = atLow != null ? formatPrice(atLow) : "—";
  }
  if (atLow != null && els.sumCloseAtLowDiff) {
    const diff = latestClose - atLow;
    const diffPct = atLow > 0 ? (diff / atLow) * 100 : 0;
    const sign = diff >= 0 ? "+" : "";
    const badgeClass = diff > 0 ? "positive" : (diff < 0 ? "negative" : "neutral");
    els.sumCloseAtLowDiff.innerHTML = `
      <span class="metric-diff-badge ${badgeClass}" title="Latest Close (${formatPrice(latestClose)}) vs All-Time Low (${formatPrice(atLow)})">
        ${sign}${formatPct(diffPct)}
        <span class="metric-diff-tag">vs latest close</span>
      </span>
    `;
  } else if (els.sumCloseAtLowDiff) {
    els.sumCloseAtLowDiff.innerHTML = "";
  }

  // All-Time High metric tile + badge
  const atHigh = data.all_time_high ?? null;
  if (els.sumAllTimeHigh) {
    els.sumAllTimeHigh.textContent = atHigh != null ? formatPrice(atHigh) : "—";
  }
  if (atHigh != null && els.sumCloseAtHighDiff) {
    const diff = latestClose - atHigh;
    const diffPct = atHigh > 0 ? (diff / atHigh) * 100 : 0;
    const sign = diff >= 0 ? "+" : "";
    const badgeClass = diff < 0 ? "negative" : (diff > 0 ? "positive" : "neutral");
    els.sumCloseAtHighDiff.innerHTML = `
      <span class="metric-diff-badge ${badgeClass}" title="Latest Close (${formatPrice(latestClose)}) vs All-Time High (${formatPrice(atHigh)})">
        ${sign}${formatPct(diffPct)}
        <span class="metric-diff-tag">vs latest close</span>
      </span>
    `;
  } else if (els.sumCloseAtHighDiff) {
    els.sumCloseAtHighDiff.innerHTML = "";
  }

  // Yahoo Finance Full Overview link
  if (els.yahooOverviewLink) {
    if (data.ticker && data.ticker !== "UPLOAD" && data.ticker !== "CSV_IMPORT") {
      els.yahooOverviewLink.href = `https://finance.yahoo.com/quote/${encodeURIComponent(data.ticker)}/`;
      els.yahooOverviewLink.hidden = false;
    } else {
      els.yahooOverviewLink.hidden = true;
    }
  }
}

function renderSimilarStocks(symbols) {
  if (!els.similarStocksWrap || !els.similarChips) return;
  if (!symbols || symbols.length === 0) {
    els.similarStocksWrap.hidden = true;
    els.similarChips.innerHTML = "";
    return;
  }

  els.similarChips.innerHTML = symbols.map((sym) => {
    const safeSym = escapeHtml(sym);
    return `
    <button type="button" class="similar-chip" data-ticker="${safeSym}" title="Analyze ${safeSym}">
      <span>${safeSym}</span>
      <span class="similar-chip-arrow">↗</span>
    </button>
  `;
  }).join("");

  els.similarStocksWrap.hidden = false;

  els.similarChips.querySelectorAll(".similar-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sym = btn.dataset.ticker;
      if (sym) {
        els.ticker.value = sym;
        handleFetch();
      }
    });
  });
}

function renderYearlyTable(yearly) {
  els.yearlyTableBody.innerHTML = "";
  for (const y of yearly) {
    const tr = document.createElement("tr");
    if (!y.sequence_ok) tr.classList.add("flagged");

    const incompleteTag = y.is_complete ? "" : `<span class="incomplete-tag">partial</span>`;

    let pctCell;
    if (!y.sequence_ok) {
      const revisedText = y.revised_pct_diff != null
        ? `<span class="pct-revised">${formatPct(y.revised_pct_diff)}</span>`
        : `<span class="pct-revised" title="${y.revised_note ?? ''}">n/a</span>`;
      pctCell = `<span class="pct-original">${formatPct(y.pct_diff)}</span><br/>${revisedText}`;
    } else {
      pctCell = `<span class="pct-normal">${formatPct(y.pct_diff)}</span>`;
    }

    tr.innerHTML = `
      <td class="year-cell">${y.label}${incompleteTag}${!y.sequence_ok ? `<span class="flag-note">Low after high${y.revised_note ? ' — ' + y.revised_note : ''}</span>` : ""}</td>
      <td class="num">${formatPrice(y.high.price)}</td>
      <td class="date-cell">${formatDate(y.high.date)}</td>
      <td class="num">${formatPrice(y.low.price)}</td>
      <td class="date-cell">${formatDate(y.low.date)}</td>
      <td class="num pct-cell">${pctCell}</td>
    `;
    els.yearlyTableBody.appendChild(tr);
  }
}

function renderMonthlyTable(monthly) {
  els.monthlyTableBody.innerHTML = "";
  const maxPct = Math.max(...monthly.map((m) => m.pct_diff), 1);

  for (const m of monthly) {
    const tr = document.createElement("tr");
    const barPct = Math.min(100, (m.pct_diff / maxPct) * 100);
    const barClass = m.sequence_ok ? "" : "flagged";
    const partialTag = m.is_complete ? "" : `<span class="incomplete-tag">partial</span>`;

    tr.innerHTML = `
      <td class="year-cell">${m.label}${partialTag}</td>
      <td class="num">${formatPrice(m.high.price)}</td>
      <td class="date-cell">${formatDate(m.high.date)}</td>
      <td class="num">${formatPrice(m.low.price)}</td>
      <td class="date-cell">${formatDate(m.low.date)}</td>
      <td class="num pct-cell">${formatPct(m.pct_diff)}</td>
      <td class="bar-col">
        <div class="mini-bar-track">
          <div class="mini-bar-fill ${barClass}" style="width:${barPct}%"></div>
        </div>
      </td>
    `;
    els.monthlyTableBody.appendChild(tr);
  }
}

function renderMoveCards(data) {
  els.moveCards.innerHTML = "";
  const entries = [
    ["Best Move · Year", data.best_move_current_year],
    ["Best Move · All-Time", data.best_move_overall],
  ];

  for (const [label, move] of entries) {
    const card = document.createElement("div");
    card.className = "move-card";
    card.title = "Largest mathematically tradeable rally (buy at low, sell at a subsequent higher high)";
    if (!move) {
      card.innerHTML = `
        <span class="move-card-label">${label}</span>
        <span class="move-card-pct">—</span>
        <div class="move-card-detail">Not enough sequential sessions.</div>
      `;
      els.moveCards.appendChild(card);
      continue;
    }
    card.innerHTML = `
      <span class="move-card-label">${label}</span>
      <span class="move-card-pct">+${formatPct(move.pct_diff)}</span>
      <div class="move-card-detail">
        Buy: <b>${formatPrice(move.low.price)}</b> on ${formatDate(move.low.date)}<br/>
        Sell: <b>${formatPrice(move.high.price)}</b> on ${formatDate(move.high.date)}
      </div>
    `;
    els.moveCards.appendChild(card);
  }
}

function filterPriceHistory(rangeKey) {
  if (!priceHistoryData.length) return [];
  const months = RANGE_MONTHS[rangeKey];
  if (months == null) return priceHistoryData;
  const end = new Date(priceHistoryData[priceHistoryData.length - 1].date);
  const start = new Date(end);
  start.setMonth(start.getMonth() - months);
  return priceHistoryData.filter((p) => new Date(p.date) >= start);
}

// ---------------------------------------------------------------------------
// Technical Indicator Algorithms (Pure Client Calculation)
// ---------------------------------------------------------------------------
function computeSMA(series, period) {
  if (!series || series.length < period) return [];
  const result = [];
  let sum = 0;
  for (let i = 0; i < series.length; i++) {
    sum += series[i].close;
    if (i >= period) {
      sum -= series[i - period].close;
    }
    if (i >= period - 1) {
      result.push({ x: series[i].date, y: Number((sum / period).toFixed(2)) });
    }
  }
  return result;
}

function computeEMA(series, period) {
  if (!series || series.length < period) return [];
  const result = [];
  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += series[i].close;
  }
  let ema = sum / period;
  result.push({ x: series[period - 1].date, y: Number(ema.toFixed(2)) });
  for (let i = period; i < series.length; i++) {
    ema = series[i].close * k + ema * (1 - k);
    result.push({ x: series[i].date, y: Number(ema.toFixed(2)) });
  }
  return result;
}

function computeRSI(series, period = 14) {
  if (!series || series.length <= period) return [];
  const result = [];
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = series[i].close - series[i - 1].close;
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
  result.push({ x: series[period].date, y: Number(rsi.toFixed(1)) });

  for (let i = period + 1; i < series.length; i++) {
    const change = series[i].close - series[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
    result.push({ x: series[i].date, y: Number(rsi.toFixed(1)) });
  }
  return result;
}

function updateRegimeBadge() {
  const badge = els.regimeBadge;
  if (!badge) return;
  if (!priceHistoryData || priceHistoryData.length < 50) {
    badge.style.display = "none";
    return;
  }
  const period = priceHistoryData.length >= 200 ? 200 : 50;
  const smaSeries = computeSMA(priceHistoryData, period);
  if (!smaSeries.length) {
    badge.style.display = "none";
    return;
  }
  const latestSMA = smaSeries[smaSeries.length - 1].y;
  const latestPrice = priceHistoryData[priceHistoryData.length - 1].close;
  const diffPct = ((latestPrice - latestSMA) / latestSMA) * 100;
  const isBullish = diffPct >= 0;

  badge.style.display = "inline-flex";
  badge.className = `regime-badge ${isBullish ? "bullish" : "bearish"}`;
  badge.innerHTML = `<span class="regime-dot"></span> ${isBullish ? "Bullish" : "Bearish"} (${diffPct >= 0 ? "+" : ""}${diffPct.toFixed(1)}% vs ${period}-SMA)`;
  badge.title = `Current Close: ${formatPrice(latestPrice)} | ${period}-Day SMA: ${formatPrice(latestSMA)}`;
}

// ---------------------------------------------------------------------------
// Unified Signal Review Engine (LSEG Refinitiv, Morningstar & Wall St)
// ---------------------------------------------------------------------------
function computeStockSignal(data) {
  if (!data) {
    return { signal: "UNRATED", icon: "—", score: null, reason: "Insufficient data", review: null };
  }

  // 1. Primary: Use institutional Signal Review if present
  const review = data.signal_review;
  if (review && review.verdict) {
    const verdict = review.verdict;
    let icon = "●";
    if (verdict === "BUY") icon = "▲";
    else if (verdict === "SELL") icon = "▼";
    else if (verdict === "UNRATED") icon = "—";

    const parts = [];
    if (review.score != null) {
      parts.push(`LSEG: ${review.score.toFixed(2)} (${verdict})`);
    }
    const val = review.valuation || {};
    if (val.star_rating != null) {
      parts.push(`${val.star_rating}★ ${val.status || ""}`.trim());
    }
    const targets = review.price_targets || {};
    if (targets.implied_upside_pct != null) {
      const up = targets.implied_upside_pct;
      parts.push(`Target Upside: ${up >= 0 ? "+" : ""}${up.toFixed(1)}%`);
    }
    if (review.analyst_count) {
      parts.push(`${review.analyst_count} Analysts`);
    }

    return {
      signal: verdict,
      icon,
      score: review.score,
      reason: parts.join(" · ") || review.summary || "Institutional Consensus",
      review,
    };
  }

  // 2. Secondary: If precomputed/saved in watchlist metrics
  if (data.signal) {
    let icon = "●";
    if (data.signal === "BUY") icon = "▲";
    else if (data.signal === "SELL") icon = "▼";
    else if (data.signal === "UNRATED") icon = "—";
    return {
      signal: data.signal,
      icon,
      score: null,
      reason: data.signalReason || "",
      review: null,
    };
  }

  return { signal: "UNRATED", icon: "—", score: null, reason: "Unrated asset", review: null };
}

function updateStockSignalBadge(data) {
  const badge = els.stockSignalBadge;
  if (!badge) return;
  if (!data) {
    badge.style.display = "none";
    return;
  }

  const res = computeStockSignal(data);
  badge.style.display = "inline-flex";
  badge.className = `signal-tag signal-tag--interactive signal-${res.signal.toLowerCase()}`;
  badge.innerHTML = `<span class="signal-icon">${res.icon}</span> ${res.signal} <span class="signal-inspect-hint" aria-hidden="true">↗</span>`;
  badge.title = `Institutional Verdict: ${res.signal}${res.score ? ` (Score: ${res.score.toFixed(2)})` : ""} — ${res.reason}. Click to inspect full review breakdown.`;
}

function openSignalReviewModal(review, ticker, companyName) {
  const modal = els.signalReviewModal;
  if (!modal) return;

  const safeTicker = ticker || currentAnalysis?.ticker || "—";
  const safeCompany = companyName || currentAnalysis?.company_name || "";
  const r = review || currentAnalysis?.signal_review;

  if (els.signalModalTicker) els.signalModalTicker.textContent = safeTicker;
  if (els.signalModalCompany) els.signalModalCompany.textContent = safeCompany;

  if (!r || r.verdict === "UNRATED") {
    if (els.signalModalVerdictBadge) {
      els.signalModalVerdictBadge.className = "signal-modal-verdict-badge signal-unrated";
      els.signalModalVerdictBadge.textContent = "UNRATED";
    }
    if (els.signalModalScore) els.signalModalScore.textContent = "No Institutional Coverage";
    if (els.signalAnalystCount) els.signalAnalystCount.textContent = "0 Analysts";
    if (els.signalSummaryText) {
      els.signalSummaryText.textContent = r?.summary || "No institutional analyst coverage, Refinitiv consensus rating, or price targets are currently published for this asset.";
    }

    if (els.distStrongBuy) els.distStrongBuy.style.width = "0%";
    if (els.distBuy) els.distBuy.style.width = "0%";
    if (els.distHold) els.distHold.style.width = "0%";
    if (els.distSell) els.distSell.style.width = "0%";
    if (els.distStrongSell) els.distStrongSell.style.width = "0%";

    if (els.cntStrongBuy) els.cntStrongBuy.textContent = "0";
    if (els.cntBuy) els.cntBuy.textContent = "0";
    if (els.cntHold) els.cntHold.textContent = "0";
    if (els.cntSell) els.cntSell.textContent = "0";
    if (els.cntStrongSell) els.cntStrongSell.textContent = "0";

    if (els.signalUpsideBadge) {
      els.signalUpsideBadge.textContent = "—";
      els.signalUpsideBadge.className = "signal-upside-badge";
    }
    if (els.targetCurVal) els.targetCurVal.textContent = currentAnalysis?.latest_close ? formatPrice(currentAnalysis.latest_close) : "—";
    if (els.targetLowVal) els.targetLowVal.textContent = "—";
    if (els.targetMeanVal) els.targetMeanVal.textContent = "—";
    if (els.targetMedianVal) els.targetMedianVal.textContent = "—";
    if (els.targetHighVal) els.targetHighVal.textContent = "—";

    if (els.signalValStatus) {
      els.signalValStatus.textContent = "Unrated";
      els.signalValStatus.className = "signal-val-badge";
    }
    if (els.signalStarRating) els.signalStarRating.textContent = "☆☆☆☆☆";
    if (els.signalStarScore) els.signalStarScore.textContent = "N/A";
    if (els.signalFairValueVal) els.signalFairValueVal.textContent = "—";
    if (els.signalDiscountVal) els.signalDiscountVal.textContent = "—";

    if (els.signalBrokerTbody) {
      els.signalBrokerTbody.innerHTML = `<tr><td colspan="5" class="empty-broker-row">No broker actions available for this asset.</td></tr>`;
    }
  } else {
    const verdict = r.verdict;
    if (els.signalModalVerdictBadge) {
      els.signalModalVerdictBadge.className = `signal-modal-verdict-badge signal-${verdict.toLowerCase()}`;
      els.signalModalVerdictBadge.textContent = verdict;
    }
    if (els.signalModalScore) {
      els.signalModalScore.textContent = r.score != null ? `Score: ${r.score.toFixed(2)} / 5.0` : "Institutional Consensus";
    }
    if (els.signalAnalystCount) {
      els.signalAnalystCount.textContent = r.analyst_count ? `${r.analyst_count} Analysts` : "Covered";
    }
    if (els.signalSummaryText) {
      els.signalSummaryText.textContent = r.summary || "";
    }

    // Recommendations distribution
    const recs = r.distribution || r.sources?.recommendations || {};
    const strongBuy = recs.strong_buy ?? recs.strongBuy ?? 0;
    const buy = recs.buy ?? 0;
    const hold = recs.hold ?? 0;
    const sell = recs.sell ?? 0;
    const strongSell = recs.strong_sell ?? recs.strongSell ?? 0;
    const total = strongBuy + buy + hold + sell + strongSell || 1;

    if (els.distStrongBuy) els.distStrongBuy.style.width = `${((strongBuy / total) * 100).toFixed(1)}%`;
    if (els.distBuy) els.distBuy.style.width = `${((buy / total) * 100).toFixed(1)}%`;
    if (els.distHold) els.distHold.style.width = `${((hold / total) * 100).toFixed(1)}%`;
    if (els.distSell) els.distSell.style.width = `${((sell / total) * 100).toFixed(1)}%`;
    if (els.distStrongSell) els.distStrongSell.style.width = `${((strongSell / total) * 100).toFixed(1)}%`;

    if (els.cntStrongBuy) els.cntStrongBuy.textContent = strongBuy;
    if (els.cntBuy) els.cntBuy.textContent = buy;
    if (els.cntHold) els.cntHold.textContent = hold;
    if (els.cntSell) els.cntSell.textContent = sell;
    if (els.cntStrongSell) els.cntStrongSell.textContent = strongSell;

    // Price targets
    const targets = r.price_targets || r.sources?.analyst_targets || {};
    if (els.targetCurVal) els.targetCurVal.textContent = targets.current != null ? formatPrice(targets.current) : (currentAnalysis?.latest_close ? formatPrice(currentAnalysis.latest_close) : "—");
    if (els.targetLowVal) els.targetLowVal.textContent = targets.low != null ? formatPrice(targets.low) : "—";
    if (els.targetMeanVal) els.targetMeanVal.textContent = targets.mean != null ? formatPrice(targets.mean) : "—";
    if (els.targetMedianVal) els.targetMedianVal.textContent = targets.median != null ? formatPrice(targets.median) : "—";
    if (els.targetHighVal) els.targetHighVal.textContent = targets.high != null ? formatPrice(targets.high) : "—";

    if (els.signalUpsideBadge) {
      if (targets.implied_upside_pct != null) {
        const up = targets.implied_upside_pct;
        els.signalUpsideBadge.textContent = `${up >= 0 ? "+" : ""}${up.toFixed(1)}% Upside`;
        els.signalUpsideBadge.className = `signal-upside-badge ${up >= 0 ? "positive" : "negative"}`;
      } else {
        els.signalUpsideBadge.textContent = "—";
        els.signalUpsideBadge.className = "signal-upside-badge";
      }
    }

    // Morningstar Star Rating & Valuation
    const ms = r.valuation || r.sources?.morningstar_fair_value || {};
    const stars = ms.star_rating ?? 3;
    const filledStars = "★".repeat(Math.max(0, Math.min(5, stars)));
    const emptyStars = "☆".repeat(Math.max(0, 5 - stars));
    if (els.signalStarRating) els.signalStarRating.textContent = `${filledStars}${emptyStars}`;
    if (els.signalStarScore) els.signalStarScore.textContent = `${stars} / 5 Stars`;
    if (els.signalValStatus) {
      els.signalValStatus.textContent = ms.status || ms.valuation_status || "Fairly Valued";
      els.signalValStatus.className = `signal-val-badge ${stars >= 4 ? "undervalued" : stars <= 2 ? "overvalued" : "fair"}`;
    }
    if (els.signalFairValueVal) {
      const fairVal = ms.fair_value ?? ms.fair_value_estimate;
      els.signalFairValueVal.textContent = fairVal != null ? formatPrice(fairVal) : "—";
    }
    if (els.signalDiscountVal) {
      const disc = ms.discount_pct ?? ms.discount_to_fair_value_pct;
      if (disc != null) {
        els.signalDiscountVal.textContent = `${disc >= 0 ? "+" : ""}${disc.toFixed(1)}% (${disc >= 0 ? "Discount" : "Premium"})`;
      } else {
        els.signalDiscountVal.textContent = "—";
      }
    }

    // Broker activity table
    const brokerActions = r.recent_broker_actions || r.sources?.broker_actions || [];
    if (els.signalBrokerTbody) {
      if (brokerActions.length === 0) {
        els.signalBrokerTbody.innerHTML = `<tr><td colspan="5" class="empty-broker-row">No recent broker actions recorded.</td></tr>`;
      } else {
        els.signalBrokerTbody.innerHTML = brokerActions.map((action) => {
          const actLower = (action.action || "").toLowerCase();
          const actionClass = actLower.includes("up")
            ? "broker-up"
            : actLower.includes("down")
            ? "broker-down"
            : "";
          const target = action.price_target ?? action.target_price;
          return `
            <tr>
              <td>${escapeHtml(action.date || "—")}</td>
              <td><strong>${escapeHtml(action.firm || "—")}</strong></td>
              <td><span class="broker-action-tag ${actionClass}">${escapeHtml(action.action || "—")}</span></td>
              <td>${escapeHtml(action.to_grade || action.from_grade || "—")}</td>
              <td class="num">${target != null ? formatPrice(target) : "—"}</td>
            </tr>
          `;
        }).join("");
      }
    }
  }

  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  // Load Gemini AI Research Suggestion for this ticker
  loadGeminiModalSuggestion(safeTicker, safeCompany, r, false);
}

function closeSignalReviewModal() {
  const modal = els.signalReviewModal;
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

// ---------------------------------------------------------------------------
// Gemini AI Observational Signals & Watchlist Briefing Module
// ---------------------------------------------------------------------------
const geminiTickerCache = new Map();
let currentModalGeminiTicker = "";
let geminiWatchlistBriefingCache = null;
let geminiWatchlistBriefingCacheTime = 0;

async function loadGeminiModalSuggestion(ticker, companyName, review, forceRefresh = false) {
  currentModalGeminiTicker = ticker;
  if (!els.signalGeminiSection) return;

  const cacheKey = ticker.toUpperCase();
  if (!forceRefresh && geminiTickerCache.has(cacheKey)) {
    renderGeminiModalSuggestion(geminiTickerCache.get(cacheKey));
    return;
  }

  // Show loading state
  if (els.geminiLoadingState) els.geminiLoadingState.hidden = false;
  if (els.geminiUnconfiguredMsg) els.geminiUnconfiguredMsg.hidden = true;
  if (els.geminiContentWrap) els.geminiContentWrap.hidden = true;

  // Prepare payload from current analysis or watchlist item
  let payload = {
    ticker: ticker,
    company_name: companyName,
  };

  if (currentAnalysis && currentAnalysis.ticker === ticker) {
    payload.latest_close = currentAnalysis.latest_close;
    payload.latest_low = currentAnalysis.latest_low;
    payload.diff_from_latest_low_pct = currentAnalysis.diff_from_latest_low_pct;
    payload.latest_high = currentAnalysis.latest_high;
    payload.diff_from_latest_high_pct = currentAnalysis.diff_from_latest_high_pct;
    payload.all_time_low = currentAnalysis.all_time_low;
    payload.all_time_high = currentAnalysis.all_time_high;
    payload.best_move_year_pct = currentAnalysis.best_move_current_year?.pct_diff;
    payload.best_move_alltime_pct = currentAnalysis.best_move_overall?.pct_diff;
    payload.signal_review = review || currentAnalysis.signal_review;
  } else {
    const wlEntry = getWatchlist().find((w) => w.ticker === ticker);
    const m = wlEntry?.metrics || {};
    payload.latest_close = m.latest_close;
    payload.latest_low = m.latest_low;
    payload.diff_from_latest_low_pct = m.diff_from_latest_low_pct;
    payload.latest_high = m.latest_high;
    payload.diff_from_latest_high_pct = m.diff_from_latest_high_pct;
    payload.all_time_low = m.all_time_low;
    payload.all_time_high = m.all_time_high;
    payload.best_move_year_pct = m.best_move_year_pct;
    payload.best_move_alltime_pct = m.best_move_alltime_pct;
    payload.signal_review = review || m.signal_review;
  }

  try {
    const resp = await fetch(`/api/gemini/ticker-suggestion?refresh=${forceRefresh}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      throw new Error(`Server error (${resp.status})`);
    }

    const res = await resp.json();
    if (currentModalGeminiTicker !== ticker) return; // stale request check

    if (els.geminiLoadingState) els.geminiLoadingState.hidden = true;

    if (!res.configured) {
      if (els.geminiUnconfiguredMsg) els.geminiUnconfiguredMsg.hidden = false;
      if (els.geminiContentWrap) els.geminiContentWrap.hidden = true;
      return;
    }

    if (res.success && res.data) {
      geminiTickerCache.set(cacheKey, res.data);
      renderGeminiModalSuggestion(res.data);
    } else {
      if (els.geminiContentWrap) els.geminiContentWrap.hidden = false;
      if (els.geminiTimingText) els.geminiTimingText.textContent = res.error || "Unable to generate AI trade perspective at this time.";
    }
  } catch (err) {
    if (currentModalGeminiTicker !== ticker) return;
    if (els.geminiLoadingState) els.geminiLoadingState.hidden = true;
    if (els.geminiContentWrap) els.geminiContentWrap.hidden = false;
    if (els.geminiTimingText) els.geminiTimingText.textContent = `Error: ${err.message}`;
  }
}

function renderGeminiModalSuggestion(data) {
  if (!data) return;
  if (els.geminiLoadingState) els.geminiLoadingState.hidden = true;
  if (els.geminiUnconfiguredMsg) els.geminiUnconfiguredMsg.hidden = true;
  if (els.geminiContentWrap) els.geminiContentWrap.hidden = false;

  const sig = (data.signal || "HOLD").toUpperCase();
  if (els.geminiSignalBadge) {
    els.geminiSignalBadge.textContent = sig;
    els.geminiSignalBadge.className = `gemini-signal-badge signal-${sig.toLowerCase()}`;
  }

  if (els.geminiConfidenceText) {
    els.geminiConfidenceText.textContent = `${data.confidence || "Observational"} Confidence`;
  }

  if (els.geminiPostureVal) {
    els.geminiPostureVal.textContent = data.posture || "Patience / Observe";
  }

  if (els.geminiTimingText) {
    els.geminiTimingText.textContent = data.timing_rationale || "Timing dynamics evaluated from range support and institutional consensus.";
  }

  if (els.geminiActionText) {
    els.geminiActionText.textContent = data.action_perspective || "Qualitative sizing and staging observations only.";
  }

  if (els.geminiDriversList) {
    const drivers = Array.isArray(data.key_drivers) && data.key_drivers.length ? data.key_drivers : ["Technical support consolidation and analyst alignment."];
    els.geminiDriversList.innerHTML = drivers.map((d) => `<li>${escapeHtml(d)}</li>`).join("");
  }

  if (els.geminiRisksList) {
    const risks = Array.isArray(data.risk_catalysts) && data.risk_catalysts.length ? data.risk_catalysts : ["Downside break of key 52-week support."];
    els.geminiRisksList.innerHTML = risks.map((r) => `<li>${escapeHtml(r)}</li>`).join("");
  }

  if (els.geminiDisclaimerText && data.disclaimer) {
    els.geminiDisclaimerText.textContent = data.disclaimer;
  }
}

// Watchlist Briefing handlers
function toggleWatchlistBriefing() {
  const card = els.watchlistGeminiCard;
  if (!card) return;
  const isHidden = card.hidden;
  card.hidden = !isHidden;

  if (isHidden) {
    const now = Date.now();
    if (!geminiWatchlistBriefingCache || (now - geminiWatchlistBriefingCacheTime > 600000)) {
      fetchWatchlistBriefing(false);
    } else {
      renderWatchlistBriefing(geminiWatchlistBriefingCache);
    }
  }
}

async function fetchWatchlistBriefing(forceRefresh = false) {
  const list = getWatchlist();
  if (!list.length) {
    showNotification("Watchlist is empty — add tickers before generating a briefing", "info");
    if (els.watchlistGeminiCard) els.watchlistGeminiCard.hidden = true;
    return;
  }

  if (els.wlGeminiLoadingState) els.wlGeminiLoadingState.hidden = false;
  if (els.wlGeminiUnconfiguredMsg) els.wlGeminiUnconfiguredMsg.hidden = true;
  if (els.wlGeminiContentWrap) els.wlGeminiContentWrap.hidden = true;

  try {
    const resp = await fetch(`/api/gemini/watchlist-briefing?refresh=${forceRefresh}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ watchlist: list }),
    });

    if (!resp.ok) {
      throw new Error(`Server error (${resp.status})`);
    }

    const res = await resp.json();
    if (els.wlGeminiLoadingState) els.wlGeminiLoadingState.hidden = true;

    if (!res.configured) {
      if (els.wlGeminiUnconfiguredMsg) els.wlGeminiUnconfiguredMsg.hidden = false;
      if (els.wlGeminiContentWrap) els.wlGeminiContentWrap.hidden = true;
      return;
    }

    if (res.success && res.data) {
      geminiWatchlistBriefingCache = res.data;
      geminiWatchlistBriefingCacheTime = Date.now();
      renderWatchlistBriefing(res.data);
    } else {
      if (els.wlGeminiContentWrap) els.wlGeminiContentWrap.hidden = false;
      if (els.wlGeminiOverviewText) els.wlGeminiOverviewText.textContent = res.error || "Briefing could not be generated.";
    }
  } catch (err) {
    if (els.wlGeminiLoadingState) els.wlGeminiLoadingState.hidden = true;
    if (els.wlGeminiContentWrap) els.wlGeminiContentWrap.hidden = false;
    if (els.wlGeminiOverviewText) els.wlGeminiOverviewText.textContent = `Error: ${err.message}`;
  }
}

function renderWatchlistBriefing(data) {
  if (!data) return;
  if (els.wlGeminiLoadingState) els.wlGeminiLoadingState.hidden = true;
  if (els.wlGeminiUnconfiguredMsg) els.wlGeminiUnconfiguredMsg.hidden = true;
  if (els.wlGeminiContentWrap) els.wlGeminiContentWrap.hidden = false;

  const sentiment = (data.overall_sentiment || "NEUTRAL").toUpperCase();
  if (els.wlGeminiSentimentBadge) {
    els.wlGeminiSentimentBadge.textContent = `${sentiment} (${data.sentiment_score ? data.sentiment_score.toFixed(1) : "3.0"}/5)`;
    els.wlGeminiSentimentBadge.className = `wl-gemini-sentiment-badge sentiment-${sentiment.toLowerCase()}`;
  }

  if (els.wlGeminiOverviewText) {
    els.wlGeminiOverviewText.textContent = data.market_briefing || "";
  }

  if (els.wlGeminiFocusGrid) {
    const trades = Array.isArray(data.focus_trades) ? data.focus_trades : [];
    if (!trades.length) {
      els.wlGeminiFocusGrid.innerHTML = `<div class="empty-cell">No standout focus setups identified.</div>`;
    } else {
      els.wlGeminiFocusGrid.innerHTML = trades.map((t) => {
        const rating = (t.rating || "WATCH").toUpperCase();
        return `
          <div class="wl-gemini-focus-card">
            <div class="wl-gemini-focus-header">
              <span class="wl-gemini-focus-ticker">${escapeHtml(t.ticker || "—")}</span>
              <span class="wl-gemini-focus-rating rating-${rating.toLowerCase()}">${escapeHtml(rating)}</span>
            </div>
            <span class="wl-gemini-focus-setup">${escapeHtml(t.setup_type || "Setup Observation")}</span>
            <p class="wl-gemini-focus-rationale">${escapeHtml(t.rationale || "")}</p>
            <div class="wl-gemini-focus-footer">
              <span>⏱ ${escapeHtml(t.timing_note || "Observational")}</span>
              <span>Risk: <strong>${escapeHtml(t.risk_level || "MODERATE")}</strong></span>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  if (els.wlGeminiRisksList) {
    const risks = Array.isArray(data.macro_risks) && data.macro_risks.length ? data.macro_risks : ["Watchlist tracking macro rate and sector rotation."];
    els.wlGeminiRisksList.innerHTML = risks.map((r) => `<li>${escapeHtml(r)}</li>`).join("");
  }

  if (els.wlGeminiDisclaimer && data.disclaimer) {
    els.wlGeminiDisclaimer.textContent = data.disclaimer;
  }
}

// ---------------------------------------------------------------------------
// Chart Rendering (Responsive with theme support & technical overlays)
// ---------------------------------------------------------------------------
function renderPriceHistoryChart(rangeKey) {
  if (typeof Chart === "undefined") return;
  const canvas = document.getElementById("priceHistoryChart");
  if (!canvas) return;

  const filtered = filterPriceHistory(rangeKey);
  const points = filtered.map((p) => ({ x: p.date, y: p.close }));
  if (priceHistoryChart) priceHistoryChart.destroy();
  if (!points.length) return;

  const colors = getThemeColors();
  const ctx = canvas.getContext("2d");

  // Create subtle gradient fill under line
  let gradient = null;
  if (ctx) {
    gradient = ctx.createLinearGradient(0, 0, 0, 320);
    if (colors.isDark) {
      gradient.addColorStop(0, "rgba(16, 185, 129, 0.22)");
      gradient.addColorStop(1, "rgba(16, 185, 129, 0.0)");
    } else {
      gradient.addColorStop(0, "rgba(5, 150, 105, 0.18)");
      gradient.addColorStop(1, "rgba(5, 150, 105, 0.0)");
    }
  }

  const activeDateSet = new Set(filtered.map((p) => p.date));

  const datasets = [{
    type: "line",
    label: "Daily Close",
    data: points,
    borderColor: colors.teal,
    backgroundColor: gradient || "rgba(16, 185, 129, 0.1)",
    fill: true,
    pointRadius: 0,
    pointHoverRadius: 5,
    pointHoverBackgroundColor: colors.teal,
    pointHoverBorderColor: "#FFFFFF",
    pointHoverBorderWidth: 2,
    borderWidth: 2,
    tension: 0.1,
    order: 2,
  }];

  // Technical Overlays
  if (activeOverlays.volume) {
    const volData = filtered.map((p) => ({ x: p.date, y: p.volume || 0 }));
    const bgColors = filtered.map((p, idx) => {
      const prevClose = idx > 0 ? filtered[idx - 1].close : p.close;
      return p.close >= prevClose
        ? (colors.isDark ? "rgba(16, 185, 129, 0.35)" : "rgba(5, 150, 105, 0.35)")
        : (colors.isDark ? "rgba(239, 68, 68, 0.35)" : "rgba(220, 38, 38, 0.35)");
    });
    datasets.push({
      type: "bar",
      label: "Volume",
      data: volData,
      backgroundColor: bgColors,
      yAxisID: "yVolume",
      barPercentage: 0.8,
      order: 5,
    });
  }

  if (activeOverlays.ema20) {
    const ema20Full = computeEMA(priceHistoryData, 20);
    const ema20Filtered = ema20Full.filter((p) => activeDateSet.has(p.x));
    if (ema20Filtered.length) {
      datasets.push({
        type: "line",
        label: "20 EMA",
        data: ema20Filtered,
        borderColor: "#38BDF8",
        borderWidth: 1.6,
        borderDash: [3, 3],
        pointRadius: 0,
        tension: 0.12,
        order: 1,
      });
    }
  }

  if (activeOverlays.sma50) {
    const sma50Full = computeSMA(priceHistoryData, 50);
    const sma50Filtered = sma50Full.filter((p) => activeDateSet.has(p.x));
    if (sma50Filtered.length) {
      datasets.push({
        type: "line",
        label: "50 SMA",
        data: sma50Filtered,
        borderColor: "#F59E0B",
        borderWidth: 1.6,
        pointRadius: 0,
        tension: 0.12,
        order: 1,
      });
    }
  }

  if (activeOverlays.sma200) {
    const sma200Full = computeSMA(priceHistoryData, 200);
    const sma200Filtered = sma200Full.filter((p) => activeDateSet.has(p.x));
    if (sma200Filtered.length) {
      datasets.push({
        type: "line",
        label: "200 SMA",
        data: sma200Filtered,
        borderColor: "#A855F7",
        borderWidth: 1.8,
        pointRadius: 0,
        tension: 0.12,
        order: 1,
      });
    }
  }

  const scalesConfig = {
    x: {
      type: "time",
      time: { tooltipFormat: "MMM d, yyyy" },
      ticks: { color: colors.text, maxRotation: 0, autoSkip: true, maxTicksLimit: 9, font: { family: "JetBrains Mono", size: 11 } },
      grid: { color: colors.grid, drawBorder: false },
    },
    y: {
      ticks: { color: colors.text, callback: (v) => formatPrice(v), font: { family: "JetBrains Mono", size: 11 } },
      grid: { color: colors.grid, drawBorder: false },
    },
  };

  if (activeOverlays.volume) {
    const maxVol = Math.max(...filtered.map((p) => p.volume || 0), 1);
    scalesConfig.yVolume = {
      type: "linear",
      position: "right",
      min: 0,
      max: maxVol * 4.5, // Keeps volume bars in the lower 22% of the chart
      grid: { display: false, drawBorder: false },
      ticks: { display: false },
    };
  }

  priceHistoryChart = new Chart(canvas, {
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 350 },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: activeOverlays.ema20 || activeOverlays.sma50 || activeOverlays.sma200 || activeOverlays.volume,
          position: "top",
          align: "end",
          labels: {
            boxWidth: 12,
            color: colors.text,
            font: { family: "JetBrains Mono", size: 10 },
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          padding: 12,
          cornerRadius: 8,
          borderColor: colors.grid,
          borderWidth: 1,
          callbacks: {
            title: (items) => formatDate(items[0].parsed.x),
            label: (item) => {
              if (item.dataset.label === "Volume") {
                const vol = item.raw.y;
                let volStr = vol >= 1e9 ? `${(vol / 1e9).toFixed(2)}B` : vol >= 1e6 ? `${(vol / 1e6).toFixed(2)}M` : vol >= 1e3 ? `${(vol / 1e3).toFixed(1)}K` : `${vol}`;
                return `Volume: ${volStr}`;
              }
              return `${item.dataset.label}: ${formatPrice(item.parsed.y)}`;
            },
          },
        },
      },
      scales: scalesConfig,
    },
  });

  updateRegimeBadge();
}

function renderRSIChart(rangeKey) {
  if (typeof Chart === "undefined") return;
  const container = els.rsiChartContainer;
  const canvas = document.getElementById("rsiChart");
  if (!container || !canvas) return;

  if (!activeOverlays.rsi) {
    container.style.display = "none";
    if (rsiChart) {
      rsiChart.destroy();
      rsiChart = null;
    }
    return;
  }

  container.style.display = "block";
  const rsiPointsFull = computeRSI(priceHistoryData, 14);
  const filtered = filterPriceHistory(rangeKey);
  const activeDateSet = new Set(filtered.map((p) => p.date));
  const points = rsiPointsFull.filter((p) => activeDateSet.has(p.x));

  if (rsiChart) rsiChart.destroy();
  if (!points.length) return;

  const colors = getThemeColors();
  const latestRSI = points[points.length - 1].y;
  if (els.rsiCurrentValue) {
    els.rsiCurrentValue.textContent = `RSI: ${latestRSI.toFixed(1)}`;
    els.rsiCurrentValue.className = `rsi-current ${latestRSI >= 70 ? "overbought" : latestRSI <= 30 ? "oversold" : ""}`;
  }

  rsiChart = new Chart(canvas, {
    type: "line",
    data: {
      datasets: [
        {
          label: "RSI (14)",
          data: points,
          borderColor: "#EC4899",
          borderWidth: 1.8,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: "#EC4899",
          pointHoverBorderColor: "#FFFFFF",
          fill: false,
          tension: 0.1,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 350 },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          padding: 8,
          cornerRadius: 6,
          borderColor: colors.grid,
          borderWidth: 1,
          callbacks: {
            title: (items) => formatDate(items[0].parsed.x),
            label: (item) => `RSI: ${item.parsed.y.toFixed(1)}`,
          },
        },
      },
      scales: {
        x: {
          type: "time",
          time: { tooltipFormat: "MMM d, yyyy" },
          ticks: { display: false },
          grid: { color: colors.grid, drawBorder: false },
        },
        y: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 30,
            color: colors.text,
            font: { family: "JetBrains Mono", size: 9 },
            callback: (v) => (v === 30 || v === 70 ? `${v}` : ""),
          },
          grid: {
            color: (ctx) => {
              if (ctx.tick && (ctx.tick.value === 70 || ctx.tick.value === 30)) {
                return colors.isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.18)";
              }
              return "transparent";
            },
            drawBorder: false,
          },
        },
      },
    },
  });
}

function setActiveRangeButton(rangeKey) {
  activeRangeKey = rangeKey;
  els.rangePresets.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.range === rangeKey);
  });
}

els.rangePresets.addEventListener("click", (e) => {
  const btn = e.target.closest(".preset-btn");
  if (!btn) return;
  setActiveRangeButton(btn.dataset.range);
  renderPriceHistoryChart(activeRangeKey);
  if (activeOverlays.rsi) {
    renderRSIChart(activeRangeKey);
  }
});

function renderYearlyChart(yearly) {
  if (typeof Chart === "undefined") return;
  const canvas = document.getElementById("yearlyChart");
  if (!canvas) return;

  const labels = yearly.map((y) => y.label + (y.is_complete ? "" : "*"));
  const highs = yearly.map((y) => y.high.price);
  const lows = yearly.map((y) => y.low.price);

  if (yearlyChart) yearlyChart.destroy();

  const colors = getThemeColors();

  yearlyChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "High",
          data: highs,
          backgroundColor: colors.teal,
          borderRadius: 4,
        },
        {
          label: "Low",
          data: lows,
          backgroundColor: colors.amber,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: {
        legend: {
          labels: {
            color: colors.text,
            font: { family: "Plus Jakarta Sans", weight: "600", size: 12 },
            boxWidth: 12,
            boxHeight: 12,
            borderRadius: 3,
            useBorderRadius: true,
          },
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (item) => `${item.dataset.label}: ${formatPrice(item.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: colors.text, font: { family: "Plus Jakarta Sans", size: 11 } },
          grid: { color: colors.grid, drawBorder: false },
        },
        y: {
          type: els.logToggle.checked ? "logarithmic" : "linear",
          ticks: { color: colors.text, callback: (v) => formatPrice(v), font: { family: "JetBrains Mono", size: 11 } },
          grid: { color: colors.grid, drawBorder: false },
        },
      },
    },
  });
}

function renderQuoteDetails(details) {
  if (!els.quoteDetailsPanel || !els.statsGrid) return;
  if (!details || Object.keys(details).length === 0) {
    els.quoteDetailsPanel.hidden = true;
    els.statsGrid.innerHTML = "";
    return;
  }

  const entries = Object.entries(details);
  const mid = Math.ceil(entries.length / 2);
  const col1 = entries.slice(0, mid);
  const col2 = entries.slice(mid);

  function buildCol(items) {
    return `<div class="stats-col">` +
      items.map(([label, val]) => `
        <div class="stat-row">
          <span class="stat-label">${escapeHtml(label)}</span>
          <span class="stat-value">${escapeHtml(val ?? "—")}</span>
        </div>
      `).join("") +
      `</div>`;
  }

  els.statsGrid.innerHTML = buildCol(col1) + buildCol(col2);
  els.quoteDetailsPanel.hidden = false;
}

function syncCurrentAnalysisToWatchlist(data) {
  if (!data || !data.ticker) return;
  const list = getWatchlist();
  const entry = list.find((w) => w.ticker === data.ticker);
  if (entry) {
    entry.metrics = snapshotMetrics(data);
    if (data.company_name && !entry.companyName) {
      entry.companyName = data.company_name;
    }
    saveWatchlist(list);
    renderWatchlistUI();
  }
}

function render(data) {
  currentAnalysis = data;
  priceHistoryData = data.price_history || [];
  setActiveRangeButton("MAX");
  renderPriceHistoryChart(activeRangeKey);
  if (activeOverlays.rsi) {
    renderRSIChart(activeRangeKey);
  }

  renderSummary(data);
  renderSimilarStocks(data.similar_stocks);
  renderQuoteDetails(data.quote_details);
  renderYearlyTable(data.yearly);
  renderYearlyChart(data.yearly);
  renderMoveCards(data);
  renderMonthlyTable(data.monthly);

  const first = data.monthly[0], last = data.monthly[data.monthly.length - 1];
  els.monthlyRangeNote.textContent = first && last
    ? `${first.label} – ${last.label}, trailing performance ledger ending on the latest session.`
    : "";

  syncCurrentAnalysisToWatchlist(data);

  els.results.hidden = false;
}

// ---------------------------------------------------------------------------
// Actions & API Calls
// ---------------------------------------------------------------------------
async function handleFetch() {
  if (isFetching) return; // Prevent double-submit
  const rawTicker = els.ticker.value;
  const ticker = (rawTicker || "").trim().toUpperCase();
  const years = els.years.value;
  const months = els.months.value;

  // Validation: Check empty
  if (!ticker) {
    showNotification("Enter a ticker symbol to begin (e.g. AAPL, MSFT, NVDA).", "error");
    els.ticker.focus();
    return;
  }

  // Validation: Check format
  const tickerPattern = /^[A-Z0-9.\-=^]{1,10}$/;
  if (!tickerPattern.test(ticker)) {
    showNotification(`"${rawTicker}" doesn't look like a valid ticker. Use 1–10 characters (letters, numbers, dots, hyphens).`, "error");
    els.ticker.focus();
    return;
  }

  isFetching = true;
  els.fetchBtn.disabled = true;
  els.fetchBtn.classList.add("is-loading");
  setLoadingState(true, `Fetching ${ticker} from Yahoo Finance…`);

  try {
    const body = await safeFetchJson(`${API_BASE}/api/analyze?ticker=${encodeURIComponent(ticker)}&years=${years}&months=${months}`);
    
    render(body);
    showNotification(`${body.ticker} loaded — ${body.trading_days.toLocaleString()} trading sessions across ${years} year${years > 1 ? 's' : ''}.`, "success");

    // Save to search history
    saveHistory({
      id: "h_" + Date.now(),
      type: "yahoo",
      query: body.ticker,
      years: parseInt(years, 10),
      months: parseInt(months, 10),
      timestamp: Date.now(),
    });
  } catch (err) {
    showNotification(err.message, "error");
  } finally {
    isFetching = false;
    els.fetchBtn.disabled = false;
    els.fetchBtn.classList.remove("is-loading");
    setLoadingState(false);
  }
}

// ---------------------------------------------------------------------------
// CSV Upload & Drag & Drop Handling
// ---------------------------------------------------------------------------
function selectCsvFile(file) {
  if (!file) return;
  selectedCsvFile = file;
  if (els.csvPathDisplay) els.csvPathDisplay.textContent = file.name;
  if (els.csvFileChip) els.csvFileChip.hidden = false;
  if (els.submitCsvBtn) els.submitCsvBtn.disabled = false;
  showNotification(`Ready to analyze ${file.name}. Click "Submit CSV" to proceed.`, "info");
}

function clearCsvFile() {
  selectedCsvFile = null;
  els.csvInput.value = "";
  if (els.csvPathDisplay) els.csvPathDisplay.textContent = "";
  if (els.csvFileChip) els.csvFileChip.hidden = true;
  if (els.submitCsvBtn) els.submitCsvBtn.disabled = true;
}

els.csvInput.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (file) selectCsvFile(file);
  else clearCsvFile();
});

if (els.clearCsvBtn) {
  els.clearCsvBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    clearCsvFile();
  });
}

// Drag & Drop
if (els.csvDropzone) {
  ["dragenter", "dragover"].forEach((eventName) => {
    els.csvDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      els.csvDropzone.classList.add("is-dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    els.csvDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      els.csvDropzone.classList.remove("is-dragover");
    });
  });

  els.csvDropzone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const file = dt && dt.files && dt.files[0];
    if (file) {
      if (file.name.toLowerCase().endsWith(".csv")) {
        selectCsvFile(file);
      } else {
        showNotification("Please drop a valid .csv file.", "error");
      }
    }
  });
}

async function handleSubmitCsv() {
  if (!selectedCsvFile) {
    showNotification("Please select or drop a CSV file first.", "error");
    return;
  }

  if (!selectedCsvFile.name.toLowerCase().endsWith(".csv")) {
    showNotification("Invalid file format. Only .csv files are supported.", "error");
    return;
  }

  if (selectedCsvFile.size > 10 * 1024 * 1024) {
    showNotification("CSV file exceeds 10MB limit. Please upload a smaller file.", "error");
    return;
  }

  const rawTicker = els.ticker.value;
  const ticker = (rawTicker || "").trim().toUpperCase() || "CSV_IMPORT";
  const years = els.years.value;
  const months = els.months.value;

  els.submitCsvBtn.disabled = true;
  els.submitCsvBtn.classList.add("is-loading");
  setLoadingState(true, `Parsing and computing range ledger for ${selectedCsvFile.name}…`);

  const form = new FormData();
  form.append("file", selectedCsvFile);

  try {
    const body = await safeFetchJson(`${API_BASE}/api/analyze/upload?ticker=${encodeURIComponent(ticker)}&years=${years}&months=${months}`, {
      method: "POST",
      body: form,
    }, 45000);
    
    render(body);
    showNotification(`Analyzed ${body.ticker} from ${selectedCsvFile.name} (${body.trading_days.toLocaleString()} sessions).`, "success");

    // Save to search history
    saveHistory({
      id: "h_" + Date.now(),
      type: "csv",
      query: selectedCsvFile.name,
      years: parseInt(years, 10),
      months: parseInt(months, 10),
      timestamp: Date.now(),
    });
  } catch (err) {
    showNotification(err.message, "error");
  } finally {
    els.submitCsvBtn.disabled = false;
    els.submitCsvBtn.classList.remove("is-loading");
    setLoadingState(false);
  }
}

// ---------------------------------------------------------------------------
// Exporting (XLSX / PDF)
// ---------------------------------------------------------------------------
async function downloadExport(format, btn) {
  if (!currentAnalysis) {
    showNotification("Please load or analyze a stock first.", "error");
    return;
  }

  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.classList.add("is-loading");

  try {
    const res = await fetch(`${API_BASE}/api/export/${format}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentAnalysis),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Export failed (${res.status}).`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ext = format === "xlsx" ? "xlsx" : "pdf";
    a.href = url;
    a.download = `${currentAnalysis.ticker}_range_ledger.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showNotification(`Downloaded ${a.download}.`, "success");
  } catch (err) {
    showNotification(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.classList.remove("is-loading");
    btn.innerHTML = originalHtml;
  }
}

// ---------------------------------------------------------------------------
// Event Listeners & Wiring
// ---------------------------------------------------------------------------
// Stepper buttons
document.querySelectorAll(".stepper-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.target);
    const delta = parseInt(btn.dataset.delta, 10);
    const min = parseInt(target.min, 10);
    const max = parseInt(target.max, 10);
    const next = Math.min(max, Math.max(min, parseInt(target.value, 10) + delta));
    target.value = next;
  });
});

// Primary actions
els.fetchBtn.addEventListener("click", handleFetch);
els.ticker.addEventListener("keydown", (e) => { if (e.key === "Enter") handleFetch(); });
if (els.submitCsvBtn) els.submitCsvBtn.addEventListener("click", handleSubmitCsv);

// Export buttons
els.exportXlsxBtn.addEventListener("click", () => downloadExport("xlsx", els.exportXlsxBtn));
els.exportPdfBtn.addEventListener("click", () => downloadExport("pdf", els.exportPdfBtn));

// Log scale toggle
els.logToggle.addEventListener("change", () => {
  if (yearlyChart) {
    yearlyChart.options.scales.y.type = els.logToggle.checked ? "logarithmic" : "linear";
    yearlyChart.update();
  }
});

// Theme toggle
els.themeToggleBtn.addEventListener("click", toggleTheme);

// History drawer toggle
els.historyToggleBtn.addEventListener("click", () => toggleHistoryPanel());
if (els.closeHistoryBtn) els.closeHistoryBtn.addEventListener("click", () => toggleHistoryPanel(false));
if (els.clearHistoryBtn) els.clearHistoryBtn.addEventListener("click", clearAllHistory);

// Status dismiss
if (els.statusCloseBtn) {
  els.statusCloseBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dismissNotification();
  });
}

// CSV Disclosure Toggle
if (els.csvToggleBtn && els.csvUploadSection) {
  els.csvToggleBtn.addEventListener("click", () => {
    const isExpanded = els.csvToggleBtn.getAttribute("aria-expanded") === "true";
    const nextState = !isExpanded;
    els.csvToggleBtn.setAttribute("aria-expanded", String(nextState));
    els.csvToggleBtn.classList.toggle("is-active", nextState);
    els.csvUploadSection.hidden = !nextState;
    els.csvUploadSection.style.display = nextState ? "block" : "none";
  });
}

// Signal Review Modal
if (els.stockSignalBadge) {
  els.stockSignalBadge.addEventListener("click", () => {
    if (currentAnalysis) {
      openSignalReviewModal(currentAnalysis.signal_review, currentAnalysis.ticker, currentAnalysis.company_name);
    }
  });
  els.stockSignalBadge.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && currentAnalysis) {
      e.preventDefault();
      openSignalReviewModal(currentAnalysis.signal_review, currentAnalysis.ticker, currentAnalysis.company_name);
    }
  });
}
if (els.signalModalCloseBtn) {
  els.signalModalCloseBtn.addEventListener("click", closeSignalReviewModal);
}
if (els.signalReviewModal) {
  els.signalReviewModal.addEventListener("click", (e) => {
    if (e.target === els.signalReviewModal) {
      closeSignalReviewModal();
    }
  });
}

// Gemini AI Action Listeners
if (els.geminiRefreshBtn) {
  els.geminiRefreshBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentModalGeminiTicker) {
      loadGeminiModalSuggestion(currentModalGeminiTicker, "", null, true);
    }
  });
}

if (els.watchlistGeminiBtn) {
  els.watchlistGeminiBtn.addEventListener("click", (e) => {
    e.preventDefault();
    toggleWatchlistBriefing();
  });
}

if (els.wlGeminiRefreshBtn) {
  els.wlGeminiRefreshBtn.addEventListener("click", (e) => {
    e.preventDefault();
    fetchWatchlistBriefing(true);
  });
}

if (els.wlGeminiCloseBtn) {
  els.wlGeminiCloseBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (els.watchlistGeminiCard) {
      els.watchlistGeminiCard.hidden = true;
    }
  });
}

// Keyboard shortcuts (Escape closes open panels)
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (els.signalReviewModal && !els.signalReviewModal.hidden) {
      closeSignalReviewModal();
    } else if (els.watchlistPanel && !els.watchlistPanel.hidden) {
      toggleWatchlistPanel(false);
    } else if (!els.historyPanel.hidden) {
      toggleHistoryPanel(false);
    }
  }
});

// Technical Overlays Toggle Handler
if (els.techToggles) {
  els.techToggles.addEventListener("click", (e) => {
    const btn = e.target.closest(".tech-btn");
    if (!btn) return;
    const overlayKey = btn.dataset.overlay;
    if (!overlayKey || !(overlayKey in activeOverlays)) return;
    activeOverlays[overlayKey] = !activeOverlays[overlayKey];
    btn.classList.toggle("is-active", activeOverlays[overlayKey]);
    btn.setAttribute("aria-pressed", String(activeOverlays[overlayKey]));
    renderPriceHistoryChart(activeRangeKey);
    if (overlayKey === "rsi") {
      renderRSIChart(activeRangeKey);
    }
  });
}

// Auto-resize charts on window resize
let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (priceHistoryChart) priceHistoryChart.resize();
    if (rsiChart) rsiChart.resize();
    if (yearlyChart) yearlyChart.resize();
  }, 150);
});

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
initTheme();
renderHistoryUI();
initAutocomplete();
initWatchlist();

// Focus ticker input on page load for immediate interaction
if (els.ticker && !window.matchMedia('(max-width: 640px)').matches) {
  els.ticker.focus();
}

