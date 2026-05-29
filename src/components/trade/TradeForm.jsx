import React, { useState } from 'react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ArrowDownUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function TradeForm({ coin }) {
  const [tradeType, setTradeType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const totalValue = amount ? parseFloat(amount) * coin.price : 0;

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setIsSubmitting(true);
    await api.entities.Trade.create({
      coin_id: coin.id,
      coin_symbol: coin.symbol,
      coin_name: coin.name,
      type: tradeType,
      amount: parseFloat(amount),
      price_per_coin: coin.price,
      total_value: totalValue,
      status: 'completed'
    });
    queryClient.invalidateQueries({ queryKey: ['trades'] });
    toast.success(`${tradeType === 'buy' ? 'Bought' : 'Sold'} ${amount} ${coin.symbol} for $${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    setAmount('');
    setIsSubmitting(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Trade {coin.symbol}</h3>

      {/* Buy/Sell Toggle */}
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5 mb-5">
        <button
          onClick={() => setTradeType('buy')}
          className={cn(
            "flex-1 py-2 text-sm font-medium rounded-md transition-all",
            tradeType === 'buy' ? "bg-accent text-accent-foreground" : "text-muted-foreground"
          )}
        >
          Buy
        </button>
        <button
          onClick={() => setTradeType('sell')}
          className={cn(
            "flex-1 py-2 text-sm font-medium rounded-md transition-all",
            tradeType === 'sell' ? "bg-destructive text-destructive-foreground" : "text-muted-foreground"
          )}
        >
          Sell
        </button>
      </div>

      {/* Amount Input */}
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Amount ({coin.symbol})</label>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="bg-secondary/50 border-border h-11 text-lg font-mono"
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

        {/* Quick amounts */}
        <div className="flex items-center gap-2">
          {['25%', '50%', '75%', '100%'].map(pct => (
            <button
              key={pct}
              onClick={() => {
                const maxBudget = 100000;
                const percentage = parseInt(pct) / 100;
                const usdAmount = maxBudget * percentage;
                setAmount((usdAmount / coin.price).toFixed(6));
              }}
              className="flex-1 py-1.5 text-xs font-medium bg-secondary hover:bg-secondary/80 rounded-md transition-colors text-muted-foreground"
            >
              {pct}
            </button>
          ))}
        </div>

        <Button
          onClick={handleTrade}
          disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
          className={cn(
            "w-full h-11 font-semibold text-sm",
            tradeType === 'buy'
              ? "bg-accent hover:bg-accent/90 text-accent-foreground"
              : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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