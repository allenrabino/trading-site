// Simulated crypto market data with realistic values
const CRYPTO_DATA = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", price: 67432.18, change24h: 2.34, marketCap: 1324000000000, volume24h: 28500000000, image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", price: 3521.47, change24h: -1.12, marketCap: 423000000000, volume24h: 15200000000, image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
  { id: "binancecoin", symbol: "BNB", name: "BNB", price: 584.32, change24h: 0.87, marketCap: 87600000000, volume24h: 1800000000, image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png" },
  { id: "solana", symbol: "SOL", name: "Solana", price: 172.85, change24h: 5.21, marketCap: 76400000000, volume24h: 3200000000, image: "https://assets.coingecko.com/coins/images/4128/large/solana.png" },
  { id: "ripple", symbol: "XRP", name: "XRP", price: 0.5234, change24h: -0.45, marketCap: 28700000000, volume24h: 1200000000, image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png" },
  { id: "cardano", symbol: "ADA", name: "Cardano", price: 0.4521, change24h: 1.78, marketCap: 16000000000, volume24h: 450000000, image: "https://assets.coingecko.com/coins/images/975/large/cardano.png" },
  { id: "avalanche", symbol: "AVAX", name: "Avalanche", price: 35.67, change24h: 3.45, marketCap: 13200000000, volume24h: 620000000, image: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", price: 0.1234, change24h: -2.31, marketCap: 17600000000, volume24h: 890000000, image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot", price: 6.78, change24h: 0.56, marketCap: 9200000000, volume24h: 280000000, image: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink", price: 14.32, change24h: 4.12, marketCap: 8400000000, volume24h: 520000000, image: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png" },
];

// Generate price history (7 days)
function generatePriceHistory(basePrice, volatility = 0.03) {
  const points = [];
  let price = basePrice * (1 - volatility * 3);
  for (let i = 0; i < 168; i++) { // 168 hours = 7 days
    const change = (Math.random() - 0.48) * basePrice * volatility;
    price = Math.max(price + change, basePrice * 0.7);
    points.push({
      time: new Date(Date.now() - (168 - i) * 3600000).toISOString(),
      price: parseFloat(price.toFixed(2))
    });
  }
  // Ensure last point is close to current price
  points[points.length - 1].price = basePrice;
  return points;
}

// Add price history to each coin
const cryptoWithHistory = CRYPTO_DATA.map(coin => ({
  ...coin,
  priceHistory: generatePriceHistory(coin.price)
}));

export function getCryptoList() {
  return cryptoWithHistory;
}

export function getCryptoById(id) {
  return cryptoWithHistory.find(c => c.id === id);
}

export function formatCurrency(value) {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${value.toFixed(6)}`;
}

export function formatNumber(value) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}