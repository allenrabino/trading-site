import React from 'react';
import { getCryptoList } from '@/lib/cryptoData';
import PriceCard from '@/components/dashboard/PriceCard';
import MarketStats from '@/components/dashboard/MarketStats';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const coins = getCryptoList();
  const topGainers = [...coins].sort((a, b) => b.change24h - a.change24h).slice(0, 3);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Market overview & top performers</p>
      </motion.div>

      {/* Market Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <MarketStats />
      </motion.div>

      {/* Top Gainers */}
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

      {/* All Coins */}
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