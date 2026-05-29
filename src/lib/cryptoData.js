export const COIN_IDS = [
  'bitcoin',
  'ethereum',
  'binancecoin',
  'solana',
  'ripple',
  'cardano',
  'avalanche-2',
  'dogecoin',
  'polkadot',
  'chainlink',
];

export function formatCurrency(value) {
  if (value == null || Number.isNaN(value)) return '$0.00';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${value.toFixed(6)}`;
}

export function formatNumber(value) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function findCoinById(coins, id) {
  const aliases = { avalanche: 'avalanche-2' };
  const resolvedId = aliases[id] || id;
  return coins.find((coin) => coin.id === resolvedId || coin.id === id);
}
