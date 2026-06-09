const API_BASE = '/api/crypto';
const MARKETS_CACHE_KEY = 'trading_markets_cache_v1';

function readMarketsCache() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MARKETS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data?.length ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeMarketsCache(data) {
  if (typeof window === 'undefined' || !data?.length) return;
  try {
    localStorage.setItem(
      MARKETS_CACHE_KEY,
      JSON.stringify({ data, fetchedAt: Date.now() })
    );
  } catch {
    // ignore quota errors
  }
}

function buildSparklineHistory(prices) {
  if (!prices?.length) return [];

  const now = Date.now();
  const intervalMs = prices.length > 1
    ? (7 * 24 * 3600000) / (prices.length - 1)
    : 3600000;

  return prices.map((price, index) => ({
    time: new Date(now - (prices.length - 1 - index) * intervalMs).toISOString(),
    price,
  }));
}

function transformMarketCoin(coin) {
  return {
    id: coin.id,
    symbol: (coin.symbol ?? '').toUpperCase(),
    name: coin.name ?? 'Unknown',
    price: coin.current_price ?? 0,
    change24h: coin.price_change_percentage_24h ?? 0,
    marketCap: coin.market_cap ?? 0,
    volume24h: coin.total_volume ?? 0,
    image: coin.image,
    priceHistory: buildSparklineHistory(coin.sparkline_in_7d?.price),
  };
}

async function parseApiResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || fallbackMessage);
  }

  return data;
}

export async function fetchCoinMarkets() {
  try {
    const response = await fetch(`${API_BASE}/markets`);
    const data = await parseApiResponse(response, 'Failed to fetch live market prices');

    if (!Array.isArray(data)) {
      throw new Error('Failed to fetch live market prices');
    }

    const transformed = data.map(transformMarketCoin);
    writeMarketsCache(transformed);
    return transformed;
  } catch (error) {
    const cached = readMarketsCache();
    if (cached?.length) {
      return cached;
    }
    throw error;
  }
}

export async function fetchCoinMarketChart(coinId, days) {
  const params = new URLSearchParams({
    coinId,
    days: String(days),
  });

  const response = await fetch(`${API_BASE}/chart?${params}`);
  const data = await parseApiResponse(response, 'Failed to fetch price history');

  return {
    prices: (data.prices ?? []).map(([timestamp, price]) => ({
      time: timestamp,
      price,
    })),
    volumes: (data.total_volumes ?? []).map(([timestamp, volume]) => ({
      time: timestamp,
      volume,
    })),
  };
}

export const CHART_DAYS = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
};
