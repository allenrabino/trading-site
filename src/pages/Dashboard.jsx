import React from 'react';
import { useCryptoList } from '@/hooks/useCryptoPrices';
import { formatCurrency } from '@/lib/cryptoData';
import LoadingState from '@/components/LoadingState';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, ChevronRight, Shield, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { coins, isLoading, isError, refetch } = useCryptoList();

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

  const totalVolume = coins.reduce((sum, c) => sum + c.volume24h, 0);

  const stats = [
    { label: '24H Trading Volume', value: formatCurrency(totalVolume) },
    { label: 'Crypto Launched', value: `${coins.length}+` },
    { label: 'Cooperative Units', value: '200+' },
    { label: 'Handling fee', value: '0.1%' },
  ];

  return (
    <div className="pb-4">
      <div className="hero-banner px-4 pt-4 pb-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-primary text-xs font-medium mb-1">Welcome to Roket Trading</p>
          <h1 className="text-lg font-bold leading-snug">
            A trusted platform for digital asset trading
          </h1>
        </motion.div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card/80 border border-border rounded-lg p-3"
            >
              <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
              <p className="text-sm font-bold mt-1 text-primary">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Market dynamics</h2>
            <Link to="/markets" className="text-xs text-primary flex items-center gap-0.5">
              More <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
            {coins.slice(0, 8).map(coin => {
              const isPositive = coin.change24h >= 0;
              return (
                <Link
                  key={coin.id}
                  to={`/trade?coin=${coin.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={coin.image}
                      alt={coin.name}
                      className="w-8 h-8 rounded-full bg-secondary shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {coin.symbol}
                        <span className="text-muted-foreground font-normal"> / {coin.name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">{formatCurrency(coin.price)}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-0.5 text-sm font-medium shrink-0 ${isPositive ? 'text-rise' : 'text-fall'}`}>
                    {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {Math.abs(coin.change24h).toFixed(2)}%
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-base font-semibold mb-2">Introduce us</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We are a proven effective investment tool portfolio and have always been a liquid and floating market.
            It can also be used to promote portfolio diversification.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">Start your digital money journey</h2>
          <div className="space-y-2">
            <div className="bg-card border border-border rounded-xl p-4 flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Reliable security guarantee</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Complex security measures protect your digital assets from all risks.
                </p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">24/7 customer support</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  We operate 24/7 and will answer your questions as soon as possible.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
