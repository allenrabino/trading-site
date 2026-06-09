export const MARKETS_PER_PAGE = 250;
export const MARKET_PAGES = 1;
const CACHE_TTL_MS = 120_000;
const PAGE_DELAY_MS = 1200;

let marketsCache = null;

export function getCoinGeckoHeaders() {
  const headers = { Accept: 'application/json' };
  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey) {
    headers['x-cg-demo-api-key'] = apiKey;
  }
  return headers;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchMarketsPage(page, perPage) {
  const headers = getCoinGeckoHeaders();
  const url =
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd` +
    `&order=market_cap_desc&per_page=${perPage}&page=${page}` +
    '&sparkline=true&price_change_percentage=24h';

  const response = await fetch(url, { headers });
  const data = await response.json();

  if (!response.ok) {
    const message = data?.status?.error_message || data?.error || 'CoinGecko request failed';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (!Array.isArray(data)) {
    throw new Error('Unexpected CoinGecko response');
  }

  return data;
}

async function fetchFromApi(pages = MARKET_PAGES, perPage = MARKETS_PER_PAGE) {
  const all = [];

  for (let page = 1; page <= pages; page += 1) {
    if (page > 1) {
      await sleep(PAGE_DELAY_MS);
    }
    const data = await fetchMarketsPage(page, perPage);
    if (!data.length) break;
    all.push(...data);
  }

  return all;
}

export async function fetchTopMarkets(pages = MARKET_PAGES, perPage = MARKETS_PER_PAGE) {
  const now = Date.now();

  if (marketsCache && now - marketsCache.fetchedAt < CACHE_TTL_MS) {
    return marketsCache.data;
  }

  try {
    const data = await fetchFromApi(pages, perPage);
    marketsCache = { data, fetchedAt: now };
    return data;
  } catch (error) {
    if (marketsCache?.data?.length) {
      return marketsCache.data;
    }

    try {
      const fallback = await fetchFromApi(1, 50);
      marketsCache = { data: fallback, fetchedAt: now };
      return fallback;
    } catch {
      if (marketsCache?.data?.length) {
        return marketsCache.data;
      }
      throw error;
    }
  }
}
