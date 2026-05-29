import React from 'react';
import { getCryptoList, getCryptoById } from '@/lib/cryptoData';
import PriceChart from '@/components/trade/PriceChart';
import TradeForm from '@/components/trade/TradeForm';
import CoinInfo from '@/components/trade/CoinInfo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

export default function Trade() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialCoin = urlParams.get('coin') || 'bitcoin';
  const [selectedCoinId, setSelectedCoinId] = React.useState(initialCoin);

  const coins = getCryptoList();
  const coin = getCryptoById(selectedCoinId) || coins[0];

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-2xl font-bold">Trade</h1>
        <Select value={selectedCoinId} onValueChange={setSelectedCoinId}>
          <SelectTrigger className="w-48 bg-secondary/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {coins.map(c => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-2">
                  <span className="font-medium">{c.symbol}</span>
                  <span className="text-muted-foreground">{c.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <CoinInfo coin={coin} />
          <PriceChart coin={coin} />
        </div>
        <div>
          <TradeForm coin={coin} />
        </div>
      </div>
    </div>
  );
}