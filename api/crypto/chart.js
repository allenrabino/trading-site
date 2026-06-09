import { getCoinGeckoHeaders } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const coinId = req.query.coinId;
  const days = req.query.days || '7';

  if (!coinId || typeof coinId !== 'string') {
    return res.status(400).json({ error: 'coinId is required' });
  }

  const allowedDays = ['1', '7', '30', '90', '365'];
  if (!allowedDays.includes(String(days))) {
    return res.status(400).json({ error: 'Invalid days parameter' });
  }

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=usd&days=${days}`;
    const response = await fetch(url, { headers: getCoinGeckoHeaders() });
    const data = await response.json();

    if (!response.ok) {
      const message = data?.status?.error_message || data?.error || 'CoinGecko request failed';
      return res.status(response.status).json({ error: message });
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch chart data' });
  }
}
