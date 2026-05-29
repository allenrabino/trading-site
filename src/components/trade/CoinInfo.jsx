import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '@/lib/cryptoData';

export default function CoinInfo({ coin }) {
  const isPositive = coin.change24h >= 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
      <div className="flex items-center gap-3 mb-4">
        <img
          src={coin.image}
          alt={coin.name}
          className="w-10 h-10 rounded-full bg-secondary p-0.5"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div>
          <h2 className="text-xl font-bold">{coin.name}</h2>
          <p className="text-sm text-muted-foreground">{coin.symbol}</p>
        </div>
      </div>

      <div className="flex items-end gap-3 mb-6">
        <span className="text-3xl font-bold font-mono">{formatCurrency(coin.price)}</span>
        <span className={`flex items-center gap-0.5 text-sm font-medium pb-1 ${
          isPositive ? 'text-accent' : 'text-destructive'
        }`}>
          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {Math.abs(coin.change24h).toFixed(2)}%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Market Cap</p>
          <p className="text-sm font-semibold mt-0.5">{formatCurrency(coin.marketCap)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">24h Volume</p>
          <p className="text-sm font-semibold mt-0.5">{formatCurrency(coin.volume24h)}</p>
        </div>
      </div>
    </div>
  );
}