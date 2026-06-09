import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { formatCurrency, isSameCoinId } from '@/lib/cryptoData';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import TradeDetailModal from '@/components/history/TradeDetailModal';

export default function CoinTradeHistory({ coinId, coinSymbol, refreshKey }) {
  const [selectedTrade, setSelectedTrade] = useState(null);

  const { data: trades = [], isLoading, refetch } = useQuery({
    queryKey: ['trades'],
    queryFn: () => api.entities.Trade.list('-created_date', 500),
    refetchInterval: (query) => {
      const hasPending = query.state.data?.some((t) => t.status === 'pending');
      return hasPending ? 2000 : false;
    },
  });

  useEffect(() => {
    refetch();
  }, [refreshKey, refetch]);

  const coinTrades = useMemo(
    () => trades.filter((trade) => isSameCoinId(trade.coin_id, coinId)),
    [trades, coinId]
  );

  return (
    <>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{coinSymbol} Trade History</h2>
          <span className="text-xs text-muted-foreground">{coinTrades.length} trades</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : coinTrades.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No {coinSymbol} trades yet</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
            {coinTrades.map((trade) => {
              const isBuy = trade.type === 'buy';
              const hasPnl = trade.pnl != null;
              const isProfit = hasPnl ? trade.pnl >= 0 : isBuy;

              return (
                <button
                  key={trade.id}
                  type="button"
                  onClick={() => setSelectedTrade(trade)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-0.5 text-xs font-semibold uppercase',
                          isBuy ? 'text-accent' : 'text-destructive'
                        )}
                      >
                        {isBuy ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {trade.type}
                      </span>
                      {trade.status === 'pending' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium animate-pulse">
                          Active
                        </span>
                      )}
                      {trade.timed && trade.status !== 'pending' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                          {trade.duration_sec}s
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(trade.created_date), 'MMM d, yyyy HH:mm')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      {trade.amount?.toFixed(6)} · {formatCurrency(trade.total_value)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    {trade.status === 'pending' ? (
                      <>
                        <p className="text-sm font-mono font-medium text-amber-400">In progress</p>
                        <p className="text-[10px] text-muted-foreground">Countdown</p>
                      </>
                    ) : hasPnl ? (
                      <>
                        <p
                          className={cn(
                            'text-sm font-bold font-mono',
                            isProfit ? 'text-accent' : 'text-destructive'
                          )}
                        >
                          {isProfit ? '+' : '-'}
                          {formatCurrency(Math.abs(trade.pnl))}
                        </p>
                        <p className="text-[10px] text-muted-foreground">P&L</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-mono font-medium">
                          {formatCurrency(trade.price_per_coin)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Price</p>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedTrade && (
        <TradeDetailModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
      )}
    </>
  );
}
