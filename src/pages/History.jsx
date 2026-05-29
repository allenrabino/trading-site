import React, { useState } from 'react';
import { api } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/cryptoData';
import { Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import TradeDetailModal from '@/components/history/TradeDetailModal';

export default function History() {
  const [selectedTrade, setSelectedTrade] = useState(null);

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: () => api.entities.Trade.list('-created_date', 100),
  });

  return (
    <>
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Trade History</h1>
        <p className="text-sm text-muted-foreground mt-1">All your past transactions</p>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : trades.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No trades yet</h3>
          <p className="text-sm text-muted-foreground">Your trade history will appear here</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">Coin</th>
                  <th className="text-right py-3 px-4 font-medium">Amount</th>
                  <th className="text-right py-3 px-4 font-medium">Price</th>
                  <th className="text-right py-3 px-4 font-medium">Total</th>
                  <th className="text-right py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.map(trade => (
                  <tr key={trade.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setSelectedTrade(trade)}>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {format(new Date(trade.created_date), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                        trade.type === 'buy' ? 'text-accent' : 'text-destructive'
                      }`}>
                        {trade.type === 'buy' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {trade.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-sm">{trade.coin_symbol}</p>
                        <p className="text-xs text-muted-foreground">{trade.coin_name}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm">{trade.amount?.toFixed(6)}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm">{formatCurrency(trade.price_per_coin)}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm font-medium">{formatCurrency(trade.total_value)}</td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 text-xs">
                        {trade.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>

      {selectedTrade && (
        <TradeDetailModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
      )}
    </>
  );
}