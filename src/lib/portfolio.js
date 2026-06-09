import { findCoinById } from '@/lib/cryptoData';

const AMOUNT_PRECISION = 8;
const VALUE_PRECISION = 2;

export function roundAmount(value) {
  return Number(parseFloat(value).toFixed(AMOUNT_PRECISION));
}

export function roundValue(value) {
  return Number(parseFloat(value).toFixed(VALUE_PRECISION));
}

export function calculateHoldings(trades) {
  const holdings = {};

  trades
    .filter((trade) => !trade.status || trade.status === 'completed')
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .forEach((trade) => {
      if (!holdings[trade.coin_id]) {
        holdings[trade.coin_id] = {
          coin_id: trade.coin_id,
          symbol: trade.coin_symbol,
          name: trade.coin_name,
          amount: 0,
          costBasis: 0,
        };
      }

      const holding = holdings[trade.coin_id];

      if (trade.type === 'buy') {
        holding.amount = roundAmount(holding.amount + trade.amount);
        holding.costBasis = roundValue(holding.costBasis + trade.total_value);
        return;
      }

      if (holding.amount <= 0) return;

      const sellAmount = Math.min(trade.amount, holding.amount);
      const averageCost = holding.costBasis / holding.amount;
      holding.amount = roundAmount(holding.amount - sellAmount);
      holding.costBasis = roundValue(holding.costBasis - averageCost * sellAmount);
    });

  return holdings;
}

export function getHoldingAmount(holdings, coinId) {
  return holdings[coinId]?.amount ?? 0;
}

export function buildPortfolioSummary(trades, coins, cashBalance = 0) {
  const holdings = calculateHoldings(trades);

  const items = Object.values(holdings)
    .filter((holding) => holding.amount > 0.00000001)
    .map((holding) => {
      const coinData = findCoinById(coins, holding.coin_id);

      const currentPrice = coinData?.price ?? 0;
      const currentValue = roundValue(holding.amount * currentPrice);
      const pnl = roundValue(currentValue - holding.costBasis);
      const pnlPercent = holding.costBasis > 0 ? (pnl / holding.costBasis) * 100 : 0;

      return {
        ...holding,
        currentValue,
        pnl,
        pnlPercent,
        coinData,
      };
    })
    .sort((a, b) => b.currentValue - a.currentValue);

  const cryptoValue = roundValue(items.reduce((sum, item) => sum + item.currentValue, 0));
  const totalPnl = roundValue(items.reduce((sum, item) => sum + item.pnl, 0));

  return {
    items,
    cryptoValue,
    cashBalance: roundValue(cashBalance),
    totalValue: roundValue(cryptoValue + cashBalance),
    totalPnl,
  };
}
