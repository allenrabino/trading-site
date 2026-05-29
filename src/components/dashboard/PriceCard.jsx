import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '@/lib/cryptoData';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

export default function PriceCard({ coin }) {
  const isPositive = coin.change24h >= 0;
  const miniData = coin.priceHistory.filter((_, i) => i % 6 === 0);

  return (
    <Link
      to={`/trade?coin=${coin.id}`}
      className="group block bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            src={coin.image}
            alt={coin.name}
            className="w-9 h-9 rounded-full bg-secondary p-0.5"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <h3 className="font-semibold text-sm">{coin.symbol}</h3>
            <p className="text-xs text-muted-foreground">{coin.name}</p>
          </div>
        </div>
        <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-medium ${
          isPositive ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'
        }`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(coin.change24h).toFixed(2)}%
        </div>
      </div>

      <div className="h-12 mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={miniData}>
            <defs>
              <linearGradient id={`gradient-${coin.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? 'hsl(152, 69%, 53%)' : 'hsl(0, 72%, 51%)'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isPositive ? 'hsl(152, 69%, 53%)' : 'hsl(0, 72%, 51%)'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? 'hsl(152, 69%, 53%)' : 'hsl(0, 72%, 51%)'}
              strokeWidth={1.5}
              fill={`url(#gradient-${coin.id})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-lg font-bold">{formatCurrency(coin.price)}</p>
    </Link>
  );
}