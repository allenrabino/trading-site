export const MARKETS_PER_PAGE = 250;
export const MARKET_PAGES = 2;

export function getCoinGeckoHeaders() {
  const headers = { Accept: 'application/json' };
  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey) {
    headers['x-cg-demo-api-key'] = apiKey;
  }
  return headers;
}

export async function fetchTopMarkets(pages = MARKET_PAGES, perPage = MARKETS_PER_PAGE) {
  const headers = getCoinGeckoHeaders();
  const all = [];

  for (let page = 1; page <= pages; page += 1) {
    const url =
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd` +
      `&order=market_cap_desc&per_page=${perPage}&page=${page}` +
      '&sparkline=true&price_change_percentage=24h';

    const response = await fetch(url, { headers });
    const data = await response.json();

    if (!response.ok) {
      const message = data?.status?.error_message || data?.error || 'CoinGecko request failed';
      throw new Error(message);
    }

    if (!Array.isArray(data)) {
      throw new Error('Unexpected CoinGecko response');
    }

    if (!data.length) break;
    all.push(...data);
  }

  return all;
}
