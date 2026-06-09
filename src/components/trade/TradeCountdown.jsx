import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/api/client';
import { formatCurrency } from '@/lib/cryptoData';
import { formatChartPrice } from '@/lib/chartUtils';
import { formatRemaining } from '@/lib/tradeDuration';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

export default function TradeCountdown({
  contract,
  coin,
  onComplete,
  onClose,
  refetchPrice,
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((contract.ends_at - Date.now()) / 1000))
  );
  const [settling, setSettling] = useState(false);
  const [result, setResult] = useState(null);
  const settledRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const currentPrice = coin?.price ?? contract.entry_price;
  const livePnl = contract.total_value * (currentPrice / contract.entry_price - 1);
  const isLiveProfit = livePnl >= 0;

  const settle = useCallback(async () => {
    if (settledRef.current) return;
    settledRef.current = true;
    setSettling(true);
    try {
      let exitPrice = coin?.price ?? contract.entry_price;
      if (refetchPrice) {
        const refreshed = await refetchPrice();
        const updated = refreshed?.data?.find?.((c) => c.id === contract.coin_id);
        if (updated?.price) exitPrice = updated.price;
      }
      const settlement = await api.trading.completeTimedBuy(contract, exitPrice);
      setResult(settlement);
      onCompleteRef.current?.(settlement);
    } catch (err) {
      settledRef.current = false;
      setResult({
        pnl: 0,
        exitPrice: contract.entry_price,
        isProfit: false,
        total_value: contract.total_value,
        entry_price: contract.entry_price,
        changePct: 0,
        error: err.message,
      });
    } finally {
      setSettling(false);
    }
  }, [coin, contract, refetchPrice]);

  useEffect(() => {
    if (result) return undefined;

    let interval;

    const tick = () => {
      const left = Math.max(0, Math.ceil((contract.ends_at - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        settle();
      }
    };

    tick();
    const intervalMs = contract.duration_sec > 3600 ? 1000 : 250;
    interval = setInterval(tick, intervalMs);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [contract.id, contract.ends_at, result, settle]);

  if (result) {
    return (
      <div className="text-center py-4">
        <div
          className={cn(
            'w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center',
            result.isProfit ? 'bg-accent/15' : 'bg-destructive/15'
          )}
        >
          {result.isProfit ? (
            <TrendingUp className="w-8 h-8 text-accent" />
          ) : (
            <TrendingDown className="w-8 h-8 text-destructive" />
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-1">
          {result.isProfit ? 'Profit' : 'Loss'}
        </p>
        <p
          className={cn(
            'text-3xl font-bold font-mono mb-4',
            result.isProfit ? 'text-accent' : 'text-destructive'
          )}
        >
          {result.isProfit ? '+' : '-'}
          {formatCurrency(Math.abs(result.pnl))}
        </p>

        <div className="bg-secondary/50 rounded-lg p-3 text-left space-y-2 mb-5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entry</span>
            <span className="font-mono">{formatChartPrice(result.entry_price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Exit</span>
            <span className="font-mono">{formatChartPrice(result.exitPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Change</span>
            <span className={cn('font-mono', result.isProfit ? 'text-accent' : 'text-destructive')}>
              {result.changePct >= 0 ? '+' : ''}{result.changePct.toFixed(4)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Stake</span>
            <span className="font-mono">{formatCurrency(result.total_value)}</span>
          </div>
        </div>

        {result.error && (
          <p className="text-xs text-destructive mb-3">{result.error}</p>
        )}

        <Button onClick={onClose} className="w-full primary-gradient text-primary-foreground">
          Done
        </Button>
      </div>
    );
  }

  const progress = 1 - remaining / contract.duration_sec;
  const isLongDuration = contract.duration_sec > 3600;

  return (
    <div className="text-center py-2">
      <p className="text-sm text-muted-foreground mb-1">Trade {contract.coin_symbol}</p>
      <p className="text-xs text-muted-foreground mb-4">
        Stake: {formatCurrency(contract.total_value)}
      </p>

      <div className="relative w-32 h-32 mx-auto mb-5">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress)}`}
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {settling ? (
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          ) : (
            <>
              <span
                className={cn(
                  'font-bold font-mono tabular-nums px-1 text-center leading-tight',
                  isLongDuration ? 'text-sm' : 'text-3xl'
                )}
              >
                {formatRemaining(remaining)}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1">remaining</span>
            </>
          )}
        </div>
      </div>

      <div className="bg-secondary/50 rounded-lg p-3 text-left space-y-2 text-sm mb-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Entry price</span>
          <span className="font-mono">{formatChartPrice(contract.entry_price)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Current price</span>
          <span className="font-mono">{formatChartPrice(currentPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Unrealized P&L</span>
          <span className={cn('font-mono font-medium', isLiveProfit ? 'text-accent' : 'text-destructive')}>
            {isLiveProfit ? '+' : '-'}
            {formatCurrency(Math.abs(livePnl))}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        Result settles when the countdown ends, or sell now at the current price
      </p>

      <Button
        type="button"
        variant="destructive"
        className="w-full h-10 font-semibold text-sm"
        disabled={settling}
        onClick={settle}
      >
        {settling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sell now'}
      </Button>
    </div>
  );
}
