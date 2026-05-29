import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getCryptoList, formatCurrency } from '@/lib/cryptoData';
import { ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

export default function Markets() {
  const coins = getCryptoList();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('marketCap');

  const filtered = coins
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Markets</h1>
        <p className="text-sm text-muted-foreground mt-1">Live cryptocurrency prices</p>
      </motion.div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search coins..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-secondary/50"
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left py-3 px-4 font-medium">#</th>
                <th className="text-left py-3 px-4 font-medium">Name</th>
                <th className="text-right py-3 px-4 font-medium cursor-pointer hover:text-foreground" onClick={() => setSortBy('price')}>Price</th>
                <th className="text-right py-3 px-4 font-medium cursor-pointer hover:text-foreground" onClick={() => setSortBy('change24h')}>24h %</th>
                <th className="text-right py-3 px-4 font-medium hidden md:table-cell cursor-pointer hover:text-foreground" onClick={() => setSortBy('marketCap')}>Market Cap</th>
                <th className="text-right py-3 px-4 font-medium hidden lg:table-cell">7D Chart</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((coin, idx) => {
                const isPositive = coin.change24h >= 0;
                const miniData = coin.priceHistory.filter((_, i) => i % 8 === 0);
                return (
                  <tr key={coin.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 text-sm text-muted-foreground">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={coin.image} alt={coin.name} className="w-7 h-7 rounded-full bg-secondary p-0.5" onError={(e) => { e.target.style.display = 'none'; }} />
                        <div>
                          <p className="font-semibold text-sm">{coin.name}</p>
                          <p className="text-xs text-muted-foreground">{coin.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm font-medium">{formatCurrency(coin.price)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center gap-0.5 text-sm font-medium ${isPositive ? 'text-accent' : 'text-destructive'}`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(coin.change24h).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm hidden md:table-cell text-muted-foreground">{formatCurrency(coin.marketCap)}</td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="w-24 h-8 ml-auto">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={miniData}>
                            <Area type="monotone" dataKey="price" stroke={isPositive ? 'hsl(152,69%,53%)' : 'hsl(0,72%,51%)'} strokeWidth={1.5} fill="transparent" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/trade?coin=${coin.id}`}
                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        Trade
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}