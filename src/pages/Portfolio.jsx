import React from 'react';
import { api } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { findCoinById, formatCurrency } from '@/lib/cryptoData';
import { useCryptoList } from '@/hooks/useCryptoPrices';
import { Wallet, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['hsl(199,89%,48%)', 'hsl(152,69%,53%)', 'hsl(43,74%,66%)', 'hsl(270,60%,60%)', 'hsl(0,72%,51%)', 'hsl(180,60%,50%)', 'hsl(30,80%,55%)', 'hsl(300,50%,50%)'];

export default function Portfolio() {
  const { coins } = useCryptoList();
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: () => api.entities.Trade.list('-created_date', 500),
  });

  // Calculate portfolio holdings
  const holdings = {};
  trades.filter(t => t.status === 'completed').forEach(trade => {
    if (!holdings[trade.coin_id]) {
      holdings[trade.coin_id] = { coin_id: trade.coin_id, symbol: trade.coin_symbol, name: trade.coin_name, amount: 0, totalInvested: 0 };
    }
    if (trade.type === 'buy') {
      holdings[trade.coin_id].amount += trade.amount;
      holdings[trade.coin_id].totalInvested += trade.total_value;
    } else {
      holdings[trade.coin_id].amount -= trade.amount;
      holdings[trade.coin_id].totalInvested -= trade.total_value;
    }
  });

  const portfolioItems = Object.values(holdings)
    .filter(h => h.amount > 0)
    .map(h => {
      const coinData = findCoinById(coins, h.coin_id);
      const currentValue = coinData ? h.amount * coinData.price : 0;
      const pnl = currentValue - h.totalInvested;
      const pnlPercent = h.totalInvested > 0 ? (pnl / h.totalInvested) * 100 : 0;
      return { ...h, currentValue, pnl, pnlPercent, coinData };
    })
    .sort((a, b) => b.currentValue - a.currentValue);

  const totalValue = portfolioItems.reduce((sum, item) => sum + item.currentValue, 0);
  const totalPnl = portfolioItems.reduce((sum, item) => sum + item.pnl, 0);

  const pieData = portfolioItems.map(item => ({
    name: item.symbol,
    value: item.currentValue
  }));

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-sm text-muted-foreground mt-1">Your holdings & performance</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Value</span>
          </div>
          <p className="text-2xl font-bold font-mono">{formatCurrency(totalValue)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            {totalPnl >= 0 ? <TrendingUp className="w-4 h-4 text-accent" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
            <span className="text-xs text-muted-foreground">Total P&L</span>
          </div>
          <p className={`text-2xl font-bold font-mono ${totalPnl >= 0 ? 'text-accent' : 'text-destructive'}`}>
            {totalPnl >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalPnl))}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground">Assets</span>
          </div>
          <p className="text-2xl font-bold">{portfolioItems.length}</p>
        </div>
      </div>

      {portfolioItems.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Wallet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No holdings yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Start trading to build your portfolio</p>
          <Link to="/trade" className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:text-primary/80">
            Go to Trade <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pie Chart */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Allocation</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Holdings List */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left py-3 px-4 font-medium">Asset</th>
                    <th className="text-right py-3 px-4 font-medium">Holdings</th>
                    <th className="text-right py-3 px-4 font-medium">Value</th>
                    <th className="text-right py-3 px-4 font-medium">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioItems.map(item => (
                    <tr key={item.coin_id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {item.coinData && (
                            <img src={item.coinData.image} alt={item.name} className="w-7 h-7 rounded-full bg-secondary p-0.5" onError={(e) => { e.target.style.display = 'none'; }} />
                          )}
                          <div>
                            <p className="font-semibold text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm">{item.amount.toFixed(6)}</td>
                      <td className="py-3 px-4 text-right font-mono text-sm font-medium">{formatCurrency(item.currentValue)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className={`text-sm font-medium ${item.pnl >= 0 ? 'text-accent' : 'text-destructive'}`}>
                          {item.pnl >= 0 ? '+' : ''}{formatCurrency(Math.abs(item.pnl))}
                        </div>
                        <div className={`text-xs ${item.pnl >= 0 ? 'text-accent' : 'text-destructive'}`}>
                          {item.pnlPercent >= 0 ? '+' : ''}{item.pnlPercent.toFixed(2)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}