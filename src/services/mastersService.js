import initSqlJs from 'sql.js';

const MASTERS_DATE_URL_PRIMARY = 'https://intellect-s3.s3.ap-south-1.amazonaws.com/MastersDate.json';
const MASTERS_DATE_URL_PROXY = '/s3-api/MastersDate.json';

const MASTERS_MF_URL_PRIMARY = 'https://intellect-s3.s3.ap-south-1.amazonaws.com/Masters.mf';
const MASTERS_MF_URL_PROXY = '/s3-api/Masters.mf';
const MASTERS_MF_URL_LOCAL = '/Masters.mf';
const MASTERS_FALLBACK_JSON = '/masters_ofis2.json';

const DB_NAME = 'ICICI_Masters_DB';
const DB_VERSION = 4; // Version 4: Options only (OFISType 2 & 4 from NSE & BSE derivatives). Equities removed.
const STORE_NAME = 'masters_data';
const KEY_SYMBOLS = 'masters_options_v4';
const KEY_DATE = 'masters_master_date';
const KEY_CREATION_DATE_SEC = 'masters_creation_date_sec';

// Epoch baseline for SQLite MasterDate.CreationDate (seconds since 1980-01-01 00:00:00 UTC)
const EPOCH_1980_MS = new Date('1980-01-01T00:00:00Z').getTime();

// In-memory singleton cache so symbols are read only once per application lifecycle
let inMemorySymbols = null;
let inMemoryLoadPromise = null;

/**
 * Open or create IndexedDB database
 */
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Get item from IndexedDB
 */
async function getFromIndexedDB(key) {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[Masters] IndexedDB read error:', err);
    return null;
  }
}

/**
 * Save item to IndexedDB
 */
async function saveToIndexedDB(key, value) {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[Masters] IndexedDB write error:', err);
    return false;
  }
}

/**
 * Helper to fetch with timeout and fallback
 */
async function fetchWithFallback(urls, options = {}, responseType = 'json') {
  for (const url of urls) {
    try {
      const res = await fetch(url, options);
      if (res.ok) {
        if (responseType === 'json') return await res.json();
        if (responseType === 'arrayBuffer') return await res.arrayBuffer();
        return await res.text();
      }
    } catch (err) {
      console.warn(`[Masters] Fetch failed for ${url}:`, err.message);
    }
  }
  throw new Error(`Failed to fetch from all candidate URLs: ${urls.join(', ')}`);
}

/**
 * Extract Options contracts from SQLite buffer:
 * 1. NseDerivMaster (OFISType 2 = Index Options, OFISType 4 = Stock Options)
 * 2. BseDerivMaster (OFISType 2 = Index Options, OFISType 4 = Stock Options)
 * Equity stocks and MCX commodities are excluded.
 */
async function parseMastersBuffer(arrayBuffer) {
  console.log('[Masters] Initializing sql.js wasm...');
  const SQL = await initSqlJs({
    locateFile: (file) => `/${file}`
  });

  console.log('[Masters] Loading SQLite database into memory...');
  const db = new SQL.Database(new Uint8Array(arrayBuffer));

  // 1. Read MasterDate from SQLite table
  let creationDateSec = null;
  try {
    const mdRes = db.exec('SELECT CreationDate FROM MasterDate LIMIT 1;');
    if (mdRes && mdRes[0] && mdRes[0].values && mdRes[0].values[0]) {
      creationDateSec = Number(mdRes[0].values[0][0]);
      const dateFrom1980 = new Date(EPOCH_1980_MS + creationDateSec * 1000);
      console.log(`[Masters] SQLite MasterDate.CreationDate = ${creationDateSec} (${dateFrom1980.toISOString()})`);
    }
  } catch (mdErr) {
    console.warn('[Masters] Failed reading MasterDate from SQLite:', mdErr.message);
  }

  const allSymbols = [];

  // 2. Query NSE Derivatives (Index Options OFISType=2, Stock Options OFISType=4)
  try {
    const query = `
      SELECT Exch, ScripCode, Name, Desc, MinimumLotQuantity, StrikePrice, TradingSymbol, CPType, ExpiryDate, OFISType
      FROM NseDerivMaster
      WHERE OFISType IN (2, 4);
    `;
    const res = db.exec(query);
    if (res && res[0]) {
      for (const val of res[0].values) {
        const cp = val[7] === 3 ? 'CALL' : (val[7] === 4 ? 'PUT' : '');
        const strike = val[5] ? Number(val[5]) : 0;
        const desc = val[3] || `${val[2]} ${strike} ${cp}`.trim();
        const isIndex = val[9] === 2;
        allSymbols.push({
          id: `N_${val[1]}`,
          scripCode: val[1],
          exch: 'N',
          name: desc,
          desc: desc,
          symbol: val[6] || desc,
          baseName: val[2],
          strike: strike,
          cpType: cp,
          lotSize: val[4] || (isIndex ? 50 : 250),
          type: 'Options',
          subtype: isIndex ? 'Index Options' : 'Stock Options',
          ofisType: val[9],
          ltp: strike ? Number((strike * 0.02 + 15).toFixed(2)) : 446.5
        });
      }
    }
  } catch (err) {
    console.warn('[Masters] NseDerivMaster query error:', err.message);
  }

  // 3. Query BSE Derivatives (Index Options OFISType=2, Stock Options OFISType=4)
  try {
    const query = `
      SELECT Exch, ScripCode, Name, Desc, MinimumLotQuantity, StrikePrice, TradingSymbol, CPType, ExpiryDate, OFISType
      FROM BseDerivMaster
      WHERE OFISType IN (2, 4);
    `;
    const res = db.exec(query);
    if (res && res[0]) {
      for (const val of res[0].values) {
        const cp = val[7] === 3 ? 'CALL' : (val[7] === 4 ? 'PUT' : '');
        const strike = val[5] ? Number(val[5]) : 0;
        const desc = val[3] || `${val[2]} ${strike} ${cp}`.trim();
        const isIndex = val[9] === 2;
        allSymbols.push({
          id: `B_${val[1]}`,
          scripCode: val[1],
          exch: 'B',
          name: desc,
          desc: desc,
          symbol: val[6] || desc,
          baseName: val[2],
          strike: strike,
          cpType: cp,
          lotSize: val[4] || (isIndex ? 50 : 250),
          type: 'Options',
          subtype: isIndex ? 'Index Options' : 'Stock Options',
          ofisType: val[9],
          ltp: strike ? Number((strike * 0.02 + 15).toFixed(2)) : 446.5
        });
      }
    }
  } catch (err) {
    console.warn('[Masters] BseDerivMaster query error:', err.message);
  }

  db.close();

  console.log(`[Masters] Total parsed Options contracts: ${allSymbols.length}`);

  return {
    symbols: allSymbols,
    creationDateSec
  };
}

/**
 * Converts a server MastersDate string (e.g. "2026-11-03 06:26:16.000000") to epoch ms.
 */
function parseServerDateMs(dateStr) {
  if (!dateStr) return 0;
  const isoStr = dateStr.trim().replace(' ', 'T') + (dateStr.includes('Z') ? '' : 'Z');
  const ms = new Date(isoStr).getTime();
  return isNaN(ms) ? new Date(dateStr).getTime() : ms;
}

/**
 * Converts SQLite CreationDate (epoch seconds since 1980-01-01) to epoch ms.
 */
function creationDateSecToMs(creationDateSec) {
  if (!creationDateSec) return 0;
  return EPOCH_1980_MS + Number(creationDateSec) * 1000;
}

/**
 * Main service method:
 * 1. Checks in-memory cache first (loads only once on startup and stores in memory).
 * 2. Checks local IndexedDB cache and master date (epoch from 1980).
 * 3. Fetches MastersDate.json from server ("2026-11-03 06:26:16.000000").
 * 4. If server date <= local master date (from 1980 epoch), does NOT download Masters.mf.
 * 5. If server date > local master date (or missing), downloads Masters.mf, parses, and updates cache.
 * 6. Keeps options contracts in memory for instant searching.
 */
export async function loadMastersScrips(onProgress) {
  // If already loaded in memory, return immediately
  if (inMemorySymbols && inMemorySymbols.length > 0) {
    if (onProgress) onProgress({ status: 'ready', count: inMemorySymbols.length });
    return inMemorySymbols;
  }

  // If another call is in flight, await it to prevent duplicate downloads/parsing
  if (inMemoryLoadPromise) {
    return inMemoryLoadPromise;
  }

  inMemoryLoadPromise = (async () => {
    try {
      // 1. Check IndexedDB cached symbols and creation date
      const cachedSymbols = await getFromIndexedDB(KEY_SYMBOLS);
      const cachedCreationDateSec = await getFromIndexedDB(KEY_CREATION_DATE_SEC) || localStorage.getItem(KEY_CREATION_DATE_SEC);
      const cachedLocalServerDate = localStorage.getItem(KEY_DATE);

      const cachedMasterMs = cachedCreationDateSec ? creationDateSecToMs(cachedCreationDateSec) : 0;

      if (cachedSymbols && cachedSymbols.length > 0) {
        console.log(`[Masters] Found ${cachedSymbols.length} cached symbols in IndexedDB (1980 Epoch Sec: ${cachedCreationDateSec}).`);
        if (onProgress) onProgress({ status: 'cached', count: cachedSymbols.length });
      }

      // 2. Fetch MastersDate.json from server
      let serverDateInfo = null;
      try {
        if (onProgress) onProgress({ status: 'checking_date' });
        serverDateInfo = await fetchWithFallback(
          [MASTERS_DATE_URL_PRIMARY, MASTERS_DATE_URL_PROXY],
          { cache: 'no-cache' },
          'json'
        );
        console.log('[Masters] Server MastersDate.json:', serverDateInfo);
      } catch (err) {
        console.warn('[Masters] Could not fetch MastersDate.json from server:', err.message);
      }

      const serverDateStr = serverDateInfo?.data || null;
      const serverDateMs = parseServerDateMs(serverDateStr);

      // 3. Compare server date with local master date (epoch from 1980)
      let isUpToDate = false;
      if (cachedSymbols && cachedSymbols.length > 0 && serverDateMs > 0) {
        if (cachedMasterMs > 0) {
          isUpToDate = serverDateMs <= cachedMasterMs;
          console.log(`[Masters] Date Comparison: Server (${serverDateStr} / ${serverDateMs}) vs Local 1980 Epoch (${cachedMasterMs}) -> isUpToDate = ${isUpToDate}`);
        } else if (cachedLocalServerDate) {
          const localServerMs = parseServerDateMs(cachedLocalServerDate);
          isUpToDate = serverDateMs <= localServerMs;
        }
      }

      // If local cache is valid and up-to-date, use it directly without downloading
      if (isUpToDate && cachedSymbols && cachedSymbols.length > 0) {
        console.log('[Masters] Local Masters is up-to-date. Using cached symbols in memory.');
        inMemorySymbols = cachedSymbols;
        if (onProgress) onProgress({ status: 'ready', count: inMemorySymbols.length });
        return inMemorySymbols;
      }

      // 4. Download Masters.mf (or fallback to public /Masters.mf)
      console.log(`[Masters] Downloading Masters.mf (server date: ${serverDateStr || 'unknown'})...`);
      if (onProgress) onProgress({ status: 'downloading', serverDate: serverDateStr });

      try {
        const arrayBuffer = await fetchWithFallback(
          [MASTERS_MF_URL_LOCAL, MASTERS_MF_URL_PROXY, MASTERS_MF_URL_PRIMARY],
          {},
          'arrayBuffer'
        );

        if (onProgress) onProgress({ status: 'parsing' });
        const { symbols, creationDateSec } = await parseMastersBuffer(arrayBuffer);

        if (symbols && symbols.length > 0) {
          inMemorySymbols = symbols;
          await saveToIndexedDB(KEY_SYMBOLS, symbols);

          if (creationDateSec) {
            await saveToIndexedDB(KEY_CREATION_DATE_SEC, creationDateSec);
            try { localStorage.setItem(KEY_CREATION_DATE_SEC, String(creationDateSec)); } catch (e) {}
          }
          if (serverDateStr) {
            try { localStorage.setItem(KEY_DATE, serverDateStr); } catch (e) {}
          }

          console.log(`[Masters] Successfully loaded & cached in memory: ${symbols.length} symbols.`);
          if (onProgress) onProgress({ status: 'ready', count: symbols.length });
          return symbols;
        }
      } catch (downloadErr) {
        console.warn('[Masters] Downloading/parsing Masters.mf failed:', downloadErr);

        if (cachedSymbols && cachedSymbols.length > 0) {
          inMemorySymbols = cachedSymbols;
          if (onProgress) onProgress({ status: 'ready', count: cachedSymbols.length });
          return cachedSymbols;
        }

        // Try pre-generated comprehensive fallback
        try {
          const fallbackRes = await fetch(MASTERS_FALLBACK_JSON);
          if (fallbackRes.ok) {
            const fallbackSymbols = await fallbackRes.json();
            inMemorySymbols = fallbackSymbols;
            await saveToIndexedDB(KEY_SYMBOLS, fallbackSymbols);
            if (onProgress) onProgress({ status: 'ready', count: fallbackSymbols.length });
            return fallbackSymbols;
          }
        } catch (fbErr) {
          console.error('[Masters] All fallbacks failed:', fbErr);
        }
      }

      inMemorySymbols = cachedSymbols || [];
      return inMemorySymbols;
    } finally {
      inMemoryLoadPromise = null;
    }
  })();

  return inMemoryLoadPromise;
}

/**
 * Intelligent high-performance search for Options contracts (Index & Stock Options):
 * - Priority:
 *   1. Explicit Option Intent:
 *      - If user searches "PUT" or "PE" (e.g. "RELIANCE PUT", "NIFTY PE", or "PUT"), PE/PUT options are returned on top.
 *      - If user searches "CALL" or "CE" (e.g. "RELIANCE CALL", "CE"), CE/CALL options are returned on top.
 *      - If generic (e.g. "RELIANCE"), CALL options appear before PUT options by default.
 *   2. Exchange: NSE contracts on top of BSE.
 *   3. Exact baseName / symbol match first.
 *   4. Prefix match first.
 *   5. Caps output results to limit (default 100) for silky-smooth 60fps scrolling.
 */
export function searchMastersSymbols(symbols, query, limit = 100) {
  if (!symbols || symbols.length === 0) return [];
  if (!query || !query.trim()) {
    // Default view: popular NSE index options
    return symbols
      .filter((s) => s.exch === 'N')
      .slice(0, limit);
  }

  const cleanQuery = query.trim().toUpperCase();
  const rawTokens = cleanQuery.split(/\s+/).filter(Boolean);

  // Detect explicit option intent from search tokens
  let wantsPut = false;
  let wantsCall = false;

  const contentTokens = [];
  for (const t of rawTokens) {
    if (t === 'PE' || t === 'PUT') {
      wantsPut = true;
    } else if (t === 'CE' || t === 'CALL') {
      wantsCall = true;
    } else {
      contentTokens.push(t);
    }
  }

  const scoredMatches = [];

  for (let i = 0; i < symbols.length; i++) {
    const s = symbols[i];
    const nameUpper = s.name.toUpperCase();
    const baseUpper = s.baseName ? s.baseName.toUpperCase() : '';
    const symbolUpper = s.symbol ? s.symbol.toUpperCase() : '';
    const cpUpper = s.cpType ? s.cpType.toUpperCase() : '';

    const isPut = cpUpper === 'PUT' || nameUpper.includes(' PE ') || symbolUpper.endsWith('PE');
    const isCall = cpUpper === 'CALL' || nameUpper.includes(' CE ') || symbolUpper.endsWith('CE');

    // If user explicitly searched "PE" or "PUT", only match PUT contracts
    if (wantsPut && !wantsCall) {
      if (!isPut) continue;
    } else if (wantsCall && !wantsPut) {
      if (!isCall) continue;
    }

    // Match all content tokens
    const tokensToMatch = contentTokens.length > 0 ? contentTokens : rawTokens;
    let allMatch = true;
    for (let t = 0; t < tokensToMatch.length; t++) {
      const tok = tokensToMatch[t];
      if (tok === 'PE' || tok === 'PUT' || tok === 'CE' || tok === 'CALL') {
        continue;
      }
      if (!nameUpper.includes(tok) && !symbolUpper.includes(tok) && !baseUpper.includes(tok)) {
        allMatch = false;
        break;
      }
    }
    if (!allMatch) continue;

    // Scoring calculation
    let score = 0;

    // 1. Exchange priority: NSE gets top preference
    if (s.exch === 'N') score += 200;

    // 2. Exact word / baseName match (highest priority)
    const baseTarget = contentTokens.length > 0 ? contentTokens[0] : cleanQuery;
    if (baseUpper === baseTarget) {
      score += 1500;
    } else if (symbolUpper === baseTarget) {
      score += 1400;
    } else if (baseUpper.startsWith(baseTarget)) {
      score += 800;
    } else if (symbolUpper.startsWith(baseTarget)) {
      score += 700;
    } else if (nameUpper.startsWith(baseTarget)) {
      score += 500;
    } else {
      score += 100;
    }

    // 3. Option type priority:
    if (wantsPut) {
      if (isPut) score += 100;
      else score += 10;
    } else if (wantsCall) {
      if (isCall) score += 100;
      else score += 10;
    } else {
      if (isCall) score += 50;
      else if (isPut) score += 20;
    }

    scoredMatches.push({ symbol: s, score });

    if (scoredMatches.length >= 600) break;
  }

  // Sort descending by score
  scoredMatches.sort((a, b) => b.score - a.score);

  return scoredMatches.slice(0, limit).map((m) => m.symbol);
}
