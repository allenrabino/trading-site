export const COIN_IDS =
  'bitcoin,ethereum,binancecoin,solana,ripple,cardano,avalanche-2,dogecoin,polkadot,chainlink';

export function getCoinGeckoHeaders() {
  const headers = { Accept: 'application/json' };
  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey) {
    headers['x-cg-demo-api-key'] = apiKey;
  }
  return headers;
}
