import React from 'react';
import { X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '@/lib/cryptoData';
import { getCryptoById } from '@/lib/cryptoData';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function TradeDetailModal({ trade, onClose }) {
  if (!trade) return null;

  const coinData = getCryptoById(trade.coin_id);
  const currentPrice = coinData ? coinData.price : trade.price_per_coin;
  const isBuy = trade.type === 'buy';

  // P&L calculation
  const profit = isBuy
    ? (currentPrice - trade.price_per_coin) * trade.amount
    : (trade.price_per_coin - currentPrice) * trade.amount;
  const profitPct = ((profit / trade.total_value) * 100).toFixed(2);
  const isProfit = profit >= 0;

  // Simulated fee (0.1%)
  const fee = trade.total_value * 0.001;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-sm bg-[hsl(220,18%,10%)] border border-border rounded-2xl overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
            <h2 className="text-base font-semibold tracking-wide">
              {trade.coin_symbol} / USDT
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Profit Hero */}
          <div className="mx-5 mt-5 rounded-xl bg-black/40 border border-border/30 py-5 text-center">
            <p className={`text-3xl font-bold font-mono tracking-tight ${isProfit ? 'text-[hsl(180,100%,60%)]' : 'text-destructive'}`}>
              {isProfit ? '+' : '-'}{formatCurrency(Math.abs(profit))}
            </p>
            <p className={`text-sm mt-1 font-medium ${isProfit ? 'text-[hsl(180,100%,60%)]' : 'text-destructive'}`}>
              {isProfit ? '+' : ''}{profitPct}%
            </p>
          </div>

          {/* Details */}
          <div className="px-5 mt-5 space-y-3">
            {[
              {
                label: 'Direction',
                value: isBuy ? 'Bullish' : 'Bearish',
                valueClass: isBuy ? 'text-[hsl(180,100%,60%)]' : 'text-destructive',
                icon: isBuy ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />,
              },
              { label: 'Entry Price', value: formatCurrency(trade.price_per_coin) },
              { label: 'Current Price', value: formatCurrency(currentPrice) },
              { label: 'Amount', value: `${trade.amount.toFixed(6)} ${trade.coin_symbol}` },
              { label: 'Value', value: `${formatCurrency(trade.total_value)} USDT` },
              { label: 'Fee (0.1%)', value: `${formatCurrency(fee)} USDT` },
              {
                label: 'Profit',
                value: `${isProfit ? '+' : '-'}${formatCurrency(Math.abs(profit))} USDT`,
                valueClass: isProfit ? 'text-[hsl(180,100%,60%)]' : 'text-destructive',
              },
              { label: 'Date', value: format(new Date(trade.created_date), 'MMM d, yyyy HH:mm') },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className={`text-sm font-medium flex items-center gap-1 ${row.valueClass || ''}`}>
                  {row.icon}{row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Complete Button */}
          <div className="px-5 py-5 mt-3">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-sm font-semibold text-black transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(90deg, hsl(180,100%,60%), hsl(199,89%,55%))' }}
            >
              Complete
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}