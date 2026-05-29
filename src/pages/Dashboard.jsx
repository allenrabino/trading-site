import React from 'react';
import { useCryptoList } from '@/hooks/useCryptoPrices';
import PriceCard from '@/components/dashboard/PriceCard';
import MarketStats from '@/components/dashboard/MarketStats';
import LoadingState from '@/components/LoadingState';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { coins, isLoading, isError, refetch } = useCryptoList();
  const topGainers = [...coins].sort((a, b) => b.change24h - a.change24h).slice(0, 3);

  if (isLoading && !coins.length) {
    return <LoadingState />;
  }

  if (isError) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-destructive">Failed to load live market prices.</p>
        <button onClick={() => refetch()} className="text-sm text-primary hover:underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Market overview & top performers</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <MarketStats />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold mb-3">Top Gainers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {topGainers.map(coin => (
            <PriceCard key={coin.id} coin={coin} />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold mb-3">All Coins</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {coins.map(coin => (
            <PriceCard key={coin.id} coin={coin} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
