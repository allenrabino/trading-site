import React, { useState, useMemo, useEffect } from 'react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ArrowDownUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { calculateHoldings, getHoldingAmount, roundValue } from '@/lib/portfolio';
import { formatCurrency, isSameCoinId } from '@/lib/cryptoData';
import {
  DEFAULT_TRADE_DURATION_SEC,
  durationPartsToSeconds,
  formatDuration,
  secondsToDurationParts,
  validateDurationSeconds,
} from '@/lib/tradeDuration';
import TradeCountdown from '@/components/trade/TradeCountdown';

const defaultDuration = secondsToDurationParts(DEFAULT_TRADE_DURATION_SEC);

export default function TradeForm({
  coin,
  defaultTradeType = 'buy',
  onSuccess,
  onPhaseChange,
  onTradeUpdate,
  refetchPrice,
}) {
  const [phase, setPhase] = useState('form');
  const [contract, setContract] = useState(null);
  const [tradeType, setTradeType] = useState(defaultTradeType);
  const [amount, setAmount] = useState('');
  const [durationDays, setDurationDays] = useState(String(defaultDuration.days));
  const [durationHours, setDurationHours] = useState(String(defaultDuration.hours));
  const [durationMinutes, setDurationMinutes] = useState(String(defaultDuration.minutes));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellingTradeId, setSellingTradeId] = useState(null);
  const queryClient = useQueryClient();
  const { user, checkUserAuth } = useAuth();
  const balance = user?.balance ?? 0;

  useEffect(() => {
    setTradeType(defaultTradeType);
    setAmount('');
    setDurationDays(String(defaultDuration.days));
    setDurationHours(String(defaultDuration.hours));
    setDurationMinutes(String(defaultDuration.minutes));
    setPhase('form');
    setContract(null);
  }, [defaultTradeType, coin?.id]);

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: () => api.entities.Trade.list('-created_date', 500),
  });

  const holdings = useMemo(() => calculateHoldings(trades), [trades]);
  const coinHolding = getHoldingAmount(holdings, coin.id);
  const pendingTrades = useMemo(
    () => trades.filter((trade) => trade.status === 'pending' && isSameCoinId(trade.coin_id, coin.id)),
    [trades, coin.id]
  );
  const parsedAmount = parseFloat(amount) || 0;
  const refreshTrades = async () => {
    await queryClient.refetchQueries({ queryKey: ['trades'] });
    onTradeUpdate?.();
  };
  const totalValue = roundValue(parsedAmount * coin.price);
  const durationSec = durationPartsToSeconds(durationDays, durationHours, durationMinutes);
  const durationError = validateDurationSeconds(durationSec);

  const handleTimedBuy = async () => {
    if (!parsedAmount || parsedAmount <= 0) return;

    if (durationError) {
      toast.error(durationError);
      return;
    }

    if (totalValue > balance + 0.01) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSubmitting(true);
    try {
      const activeContract = await api.trading.startTimedBuy({
        coin_id: coin.id,
        coin_symbol: coin.symbol,
        coin_name: coin.name,
        amount: parsedAmount,
        entry_price: coin.price,
        duration_sec: durationSec,
      });
      await checkUserAuth();
      await refreshTrades();
      toast.success(`Buy started · ${formatDuration(durationSec)} remaining`);
      setAmount('');
      if (durationSec <= 300) {
        setContract(activeContract);
        setPhase('countdown');
      } else {
        onSuccess?.();
      }
    } catch (err) {
      toast.error(err.message || 'Trade failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInstantSell = async () => {
    if (!parsedAmount || parsedAmount <= 0) return;

    if (parsedAmount > coinHolding + 0.00000001) {
      toast.error('Insufficient holdings');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.entities.Trade.create({
        coin_id: coin.id,
        coin_symbol: coin.symbol,
        coin_name: coin.name,
        type: 'sell',
        amount: parsedAmount,
        price_per_coin: coin.price,
      });
      await refreshTrades();
      await checkUserAuth();
      toast.success(`Sold ${parsedAmount} ${coin.symbol} for $${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
      setAmount('');
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || 'Trade failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEarlySellTrade = async (trade) => {
    setSellingTradeId(trade.id);
    try {
      const result = await api.trading.earlyExitTimedBuy(trade.id, coin.price);
      await refreshTrades();
      await checkUserAuth();
      toast.success(
        result.isProfit
          ? `Sold for +${formatCurrency(result.pnl)} profit`
          : `Sold for -${formatCurrency(Math.abs(result.pnl))} loss`
      );
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || 'Failed to sell');
    } finally {
      setSellingTradeId(null);
    }
  };

  const handleTrade = () => {
    if (tradeType === 'buy') {
      handleTimedBuy();
      return;
    }
    handleInstantSell();
  };

  const handleCountdownComplete = async () => {
    await refreshTrades();
    await checkUserAuth();
  };

  const handleCloseResult = async () => {
    await refreshTrades();
    setPhase('form');
    setContract(null);
    setAmount('');
    onSuccess?.();
  };

  const handleQuickAmount = (percentage) => {
    const pct = percentage / 100;
    if (tradeType === 'buy') {
      const usdAmount = balance * pct;
      setAmount((usdAmount / coin.price).toFixed(6));
      return;
    }
    setAmount((coinHolding * pct).toFixed(6));
  };

  const canSubmit = parsedAmount > 0 && !isSubmitting && (
    tradeType === 'buy'
      ? !durationError && totalValue <= balance + 0.01
      : parsedAmount <= coinHolding + 0.00000001
  );

  if (phase === 'countdown' && contract) {
    return (
      <TradeCountdown
        contract={contract}
        coin={coin}
        refetchPrice={refetchPrice}
        onComplete={handleCountdownComplete}
        onClose={handleCloseResult}
      />
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-1">Trade {coin.symbol}</h3>
      <p className="text-xs text-muted-foreground mb-4">
        {tradeType === 'buy'
          ? `Cash available: $${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : `Holdings: ${coinHolding.toFixed(6)} ${coin.symbol}`}
      </p>

      <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5 mb-5">
        <button
          type="button"
          onClick={() => { setTradeType('buy'); setAmount(''); }}
          className={cn(
            'flex-1 py-2 text-sm font-medium rounded-md transition-all',
            tradeType === 'buy' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          )}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => { setTradeType('sell'); setAmount(''); }}
          className={cn(
            'flex-1 py-2 text-sm font-medium rounded-md transition-all',
            tradeType === 'sell' ? 'bg-destructive text-destructive-foreground' : 'text-muted-foreground'
          )}
        >
          Sell
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Amount ({coin.symbol})</label>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="bg-secondary/50 border-border h-11 text-lg font-mono"
            min="0"
            step="any"
          />
        </div>

        <div className="flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Total (USD)</label>
          <div className="bg-secondary/50 border border-border rounded-lg h-11 flex items-center px-3">
            <span className="text-lg font-mono">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {tradeType === 'buy' && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground block">Countdown duration</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Days', value: durationDays, set: setDurationDays, max: 365 },
                { label: 'Hours', value: durationHours, set: setDurationHours, max: 23 },
                { label: 'Mins', value: durationMinutes, set: setDurationMinutes, max: 59 },
              ].map(({ label, value, set, max }) => (
                <div key={label}>
                  <span className="text-[10px] text-muted-foreground block mb-1">{label}</span>
                  <Input
                    type="number"
                    min="0"
                    max={max}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className="bg-secondary/50 border-border h-10 text-center font-mono"
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              {durationError
                ? durationError
                : `Trade settles in ${formatDuration(durationSec)} · P&L based on price change`}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          {[25, 50, 75, 100].map(pct => (
            <button
              key={pct}
              type="button"
              onClick={() => handleQuickAmount(pct)}
              className="flex-1 py-1.5 text-xs font-medium bg-secondary hover:bg-secondary/80 rounded-md transition-colors text-muted-foreground"
            >
              {pct}%
            </button>
          ))}
        </div>

        <Button
          onClick={handleTrade}
          disabled={!canSubmit}
          className={cn(
            'w-full h-11 font-semibold text-sm',
            tradeType === 'buy'
              ? 'primary-gradient hover:opacity-90 text-primary-foreground'
              : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
          )}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${coin.symbol}`
          )}
        </Button>

        {tradeType === 'sell' && pendingTrades.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Active trades — sell at current price</p>
            {pendingTrades.map((trade) => {
              const livePnl = trade.total_value * (coin.price / trade.price_per_coin - 1);
              const isProfit = livePnl >= 0;
              return (
                <div
                  key={trade.id}
                  className="flex items-center justify-between gap-2 bg-secondary/50 rounded-lg px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-mono truncate">
                      {trade.amount.toFixed(6)} · {formatCurrency(trade.total_value)}
                    </p>
                    <p className={cn('text-[10px] font-mono', isProfit ? 'text-accent' : 'text-destructive')}>
                      {isProfit ? '+' : '-'}{formatCurrency(Math.abs(livePnl))}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-8 px-3 text-xs shrink-0"
                    disabled={sellingTradeId === trade.id}
                    onClick={() => handleEarlySellTrade(trade)}
                  >
                    {sellingTradeId === trade.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      'Sell'
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
