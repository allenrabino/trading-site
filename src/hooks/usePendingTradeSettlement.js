import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { findCoinById } from '@/lib/cryptoData';
import { useCryptoList } from '@/hooks/useCryptoPrices';
import { useAuth } from '@/lib/AuthContext';
import { getTradeRemainingSeconds } from '@/lib/tradeDuration';

export function usePendingTradeSettlement() {
  const { coins } = useCryptoList();
  const queryClient = useQueryClient();
  const { checkUserAuth } = useAuth();

  useEffect(() => {
    let settling = false;

    const settleExpired = async () => {
      if (settling || !coins.length) return;
      settling = true;
      try {
        const trades = await api.entities.Trade.list('-created_date', 500);
        const expired = trades.filter(
          (trade) =>
            trade.status === 'pending'
            && trade.timed
            && getTradeRemainingSeconds(trade) === 0
        );

        if (!expired.length) return;

        for (const trade of expired) {
          const coin = findCoinById(coins, trade.coin_id);
          const exitPrice = coin?.price ?? trade.price_per_coin;
          try {
            await api.trading.earlyExitTimedBuy(trade.id, exitPrice);
          } catch {
            // Already settled or invalid
          }
        }

        await queryClient.refetchQueries({ queryKey: ['trades'] });
        await checkUserAuth();
      } finally {
        settling = false;
      }
    };

    settleExpired();
    const interval = setInterval(settleExpired, 30000);
    return () => clearInterval(interval);
  }, [coins, queryClient, checkUserAuth]);
}
