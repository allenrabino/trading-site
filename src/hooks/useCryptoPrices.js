import { useQuery } from '@tanstack/react-query';
import { fetchCoinMarkets, fetchCoinMarketChart } from '@/lib/coingecko';
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

export function useCoinChart(coinId, range) {
  const days = range === '1D' ? 1 : range === '1M' ? 30 : 7;

  return useQuery({
    queryKey: ['coin-chart', coinId, days],
    queryFn: () => fetchCoinMarketChart(coinId, days),
    enabled: Boolean(coinId),
    staleTime: 60_000,
  });
}
