import React, { useRef } from 'react';
import { useCryptoById } from '@/hooks/useCryptoPrices';
import PriceChart from '@/components/trade/PriceChart';
import TradeForm from '@/components/trade/TradeForm';
import LoadingState from '@/components/LoadingState';
import { motion } from 'framer-motion';

export default function Trade() {
  const tradeFormRef = useRef(null);
  const urlParams = new URLSearchParams(window.location.search);
  const initialCoin = urlParams.get('coin') || 'bitcoin';
  const [selectedCoinId, setSelectedCoinId] = React.useState(initialCoin);
  const { coins, coin, isLoading, isError, refetch } = useCryptoById(selectedCoinId);

  const scrollToTrade = () => {
    tradeFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading && !coin) {
    return <LoadingState message="Loading live prices..." />;
  }

  if (isError || !coin) {
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
        <PriceChart
          coin={coin}
          coins={coins}
          onCoinChange={setSelectedCoinId}
          onBuy={scrollToTrade}
        />
      </motion.div>

      <div ref={tradeFormRef}>
        <TradeForm coin={coin} />
      </div>
    </div>
  );
}
