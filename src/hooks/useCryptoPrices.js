import { useQuery } from '@tanstack/react-query';
import { fetchCoinMarkets, fetchCoinMarketChart } from '@/lib/coingecko';
import { CHART_TIMEFRAMES } from '@/lib/chartUtils';
import { findCoinById } from '@/lib/cryptoData';

const REFETCH_INTERVAL = 30_000;

export function useCryptoPrices() {
  return useQuery({
    queryKey: ['crypto-prices'],
    queryFn: fetchCoinMarkets,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: 15_000,
  });
}

export function useCryptoList() {
  const query = useCryptoPrices();
  return {
    ...query,
    coins: query.data ?? [],
  };
}

export function useCryptoById(coinId) {
  const { coins, ...query } = useCryptoList();
  const coin = findCoinById(coins, coinId) ?? coins[0] ?? null;

  return {
    ...query,
    coins,
    coin,
  };
}

export function useCoinChart(coinId, timeframe = '5m') {
  const config = CHART_TIMEFRAMES[timeframe] ?? CHART_TIMEFRAMES['5m'];

  return useQuery({
    queryKey: ['coin-chart', coinId, config.days, timeframe],
    queryFn: () => fetchCoinMarketChart(coinId, config.days),
    enabled: Boolean(coinId),
    staleTime: 60_000,
  });
}
