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
import TradeCountdown from '@/components/trade/TradeCountdown';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { user, checkUserAuth } = useAuth();
  const balance = user?.balance ?? 0;

  useEffect(() => {
    setTradeType(defaultTradeType);
    setAmount('');
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
  const parsedAmount = parseFloat(amount) || 0;
  const refreshTrades = async () => {
    await queryClient.refetchQueries({ queryKey: ['trades'] });
    onTradeUpdate?.();
  };
  const totalValue = roundValue(parsedAmount * coin.price);

  const handleTimedBuy = async () => {
    if (!parsedAmount || parsedAmount <= 0) return;

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
      });
      await checkUserAuth();
      await refreshTrades();
      setContract(activeContract);
      setPhase('countdown');
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
      ? totalValue <= balance + 0.01
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
          <p className="text-[10px] text-muted-foreground text-center">
            60s countdown starts on buy · profit/loss based on price change
          </p>
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
      </div>
    </div>
  );
}
