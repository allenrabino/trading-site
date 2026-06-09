import { COIN_IDS, getCoinGeckoHeaders } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const url =
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COIN_IDS}` +
      '&order=market_cap_desc&sparkline=true&price_change_percentage=24h';

    const response = await fetch(url, { headers: getCoinGeckoHeaders() });
    const data = await response.json();

    if (!response.ok) {
      const message = data?.status?.error_message || data?.error || 'CoinGecko request failed';
      return res.status(response.status).json({ error: message });
    }

    if (!Array.isArray(data)) {
      return res.status(502).json({ error: 'Unexpected CoinGecko response' });
    }

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch market prices' });
  }
}
