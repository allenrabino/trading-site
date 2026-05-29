import { COIN_IDS } from './cryptoData';

const BASE = '/coingecko/api/v3';

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
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    price: coin.current_price ?? 0,
    change24h: coin.price_change_percentage_24h ?? 0,
    marketCap: coin.market_cap ?? 0,
    volume24h: coin.total_volume ?? 0,
    image: coin.image,
    priceHistory: buildSparklineHistory(coin.sparkline_in_7d?.price),
  };
}

export async function fetchCoinMarkets() {
  const ids = COIN_IDS.join(',');
  const url = `${BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch live market prices');
  }

  const data = await response.json();
  return data.map(transformMarketCoin);
}

export async function fetchCoinMarketChart(coinId, days) {
  const url = `${BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch price history');
  }

  const data = await response.json();
  return (data.prices ?? []).map(([timestamp, price]) => ({
    time: new Date(timestamp).toISOString(),
    price,
  }));
}

export const CHART_DAYS = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
};
