import React, { useState, useCallback } from 'react';
import { useCryptoById } from '@/hooks/useCryptoPrices';
import PriceChart from '@/components/trade/PriceChart';
import TradeForm from '@/components/trade/TradeForm';
import CoinTradeHistory from '@/components/trade/CoinTradeHistory';
import LoadingState from '@/components/LoadingState';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { motion } from 'framer-motion';

export default function Trade() {
  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeType, setTradeType] = useState('buy');
  const [tradePhase, setTradePhase] = useState('form');
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const urlParams = new URLSearchParams(window.location.search);
  const initialCoin = urlParams.get('coin') || 'bitcoin';
  const [selectedCoinId, setSelectedCoinId] = React.useState(initialCoin);
  const { coins, coin, isLoading, isError, refetch } = useCryptoById(selectedCoinId);

  const openTrade = (type = 'buy') => {
    setTradeType(type);
    setTradePhase('form');
    setTradeOpen(true);
  };

  const handlePhaseChange = useCallback((phase) => {
    setTradePhase(phase);
  }, []);

  const handleModalChange = (open) => {
    if (!open && tradePhase === 'countdown') return;
    setTradeOpen(open);
    if (!open) setTradePhase('form');
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
          onBuy={() => openTrade('buy')}
        />
      </motion.div>

      <Dialog open={tradeOpen} onOpenChange={handleModalChange}>
        <DialogContent
          className="max-w-[calc(100%-2rem)] rounded-xl p-4 gap-0 border-border bg-card"
          onPointerDownOutside={(e) => tradePhase === 'countdown' && e.preventDefault()}
          onEscapeKeyDown={(e) => tradePhase === 'countdown' && e.preventDefault()}
        >
          <TradeForm
            coin={coin}
            defaultTradeType={tradeType}
            onSuccess={() => setTradeOpen(false)}
            onPhaseChange={handlePhaseChange}
            onTradeUpdate={() => setHistoryRefreshKey((k) => k + 1)}
            refetchPrice={refetch}
          />
        </DialogContent>
      </Dialog>

      <CoinTradeHistory
        coinId={coin.id}
        coinSymbol={coin.symbol}
        refreshKey={historyRefreshKey}
      />
    </div>
  );
}

