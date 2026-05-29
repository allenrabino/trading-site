import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/cryptoData';
import { useCryptoList } from '@/hooks/useCryptoPrices';

export default function MarketStats() {
  const { coins } = useCryptoList();

  if (!coins.length) return null;

  const totalMarketCap = coins.reduce((sum, c) => sum + c.marketCap, 0);
  const totalVolume = coins.reduce((sum, c) => sum + c.volume24h, 0);
  const gainers = coins.filter(c => c.change24h > 0).length;
  const btc = coins.find(c => c.id === 'bitcoin');
  const btcDominance = btc && totalMarketCap
    ? ((btc.marketCap / totalMarketCap) * 100).toFixed(1)
    : '0.0';

  const stats = [
    { label: 'Market Cap', value: formatCurrency(totalMarketCap), icon: DollarSign, color: 'text-primary' },
    { label: '24h Volume', value: formatCurrency(totalVolume), icon: BarChart3, color: 'text-chart-4' },
    { label: 'Gainers', value: `${gainers}/${coins.length}`, icon: TrendingUp, color: 'text-accent' },
    { label: 'BTC Dom.', value: `${btcDominance}%`, icon: TrendingDown, color: 'text-chart-5' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(stat => (
        <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <p className="text-lg font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
