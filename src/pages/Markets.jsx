import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/cryptoData';
import { useCryptoList } from '@/hooks/useCryptoPrices';
import LoadingState from '@/components/LoadingState';
import { ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

const categories = [
  { id: 'coin', label: 'Digital currency' },
  { id: 'stock', label: 'Stock' },
  { id: 'forex', label: 'Forex' },
  { id: 'commodity', label: 'Commodities' },
];

export default function Markets() {
  const { coins, isLoading, isError, refetch } = useCryptoList();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('coin');

  const filtered = coins
    .filter(c =>
      (c.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.symbol ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.marketCap - a.marketCap);

  if (isLoading && !coins.length) {
    return <LoadingState />;
  }

  if (isError) {
    return (
      <div className="p-4 text-center space-y-3">
        <p className="text-destructive">Failed to load live market prices.</p>
        <button onClick={() => refetch()} className="text-sm text-primary hover:underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs text-muted-foreground mb-3">{coins.length} coins available · updates every 30s</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50 h-10 rounded-lg"
          />
        </div>
      </motion.div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              category === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {category !== 'coin' ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {categories.find(c => c.id === category)?.label} markets coming soon
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-wide">
            <span>Product</span>
            <span className="text-right">Price</span>
            <span className="text-right w-16">24h</span>
          </div>
          {filtered.map(coin => {
            const isPositive = coin.change24h >= 0;
            return (
              <Link
                key={coin.id}
                to={`/trade?coin=${coin.id}`}
                className="grid grid-cols-[1fr_auto_auto] gap-2 items-center px-4 py-3 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={coin.image}
                    alt={coin.name}
                    className="w-7 h-7 rounded-full bg-secondary shrink-0"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{coin.symbol}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{coin.name}</p>
                  </div>
                </div>
                <span className="text-sm font-mono font-medium text-right">{formatCurrency(coin.price)}</span>
                <span className={`text-xs font-medium text-right w-16 flex items-center justify-end gap-0.5 ${isPositive ? 'text-rise' : 'text-fall'}`}>
                  {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(coin.change24h).toFixed(2)}%
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
