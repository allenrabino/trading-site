import React, { useState } from 'react';
import { api } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { getCryptoById, formatCurrency } from '@/lib/cryptoData';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { cn } from '@/lib/utils';

const timeRanges = ['1W', '1M', 'ALL'];

function buildProfitOverTime(trades) {
  if (!trades.length) return [];
  const sorted = [...trades].sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
  let cumulative = 0;
  return sorted.map(trade => {
    const coinData = getCryptoById(trade.coin_id);
    const currentPrice = coinData ? coinData.price : trade.price_per_coin;
    const tradePnl = trade.type === 'buy'
      ? (currentPrice - trade.price_per_coin) * trade.amount
      : (trade.price_per_coin - currentPrice) * trade.amount;
    cumulative += tradePnl;
    return { date: trade.created_date, pnl: parseFloat(cumulative.toFixed(2)) };
  });
}

function buildPerCoinPnl(trades) {
  const map = {};
  trades.filter(t => t.status === 'completed').forEach(trade => {
    if (!map[trade.coin_id]) {
      map[trade.coin_id] = {
        coin_id: trade.coin_id,
        symbol: trade.coin_symbol,
        name: trade.coin_name,
        totalBought: 0,
        totalSold: 0,
        amountHeld: 0,
        costBasis: 0,
      };
    }
    const entry = map[trade.coin_id];
    if (trade.type === 'buy') {
      entry.totalBought += trade.total_value;
      entry.amountHeld += trade.amount;
      entry.costBasis += trade.total_value;
    } else {
      entry.totalSold += trade.total_value;
      entry.amountHeld -= trade.amount;
      entry.costBasis -= trade.price_per_coin * trade.amount;
    }
  });

  return Object.values(map).map(entry => {
    const coinData = getCryptoById(entry.coin_id);
    const currentPrice = coinData ? coinData.price : 0;
    const unrealizedPnl = entry.amountHeld > 0 ? (currentPrice - (entry.costBasis / entry.amountHeld)) * entry.amountHeld : 0;
    const realizedPnl = entry.totalSold - (entry.totalBought - entry.costBasis);
    const totalPnl = unrealizedPnl + realizedPnl;
    const totalInvested = entry.totalBought;
    const pnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
    return { ...entry, unrealizedPnl, realizedPnl, totalPnl, pnlPercent, coinData };
  }).sort((a, b) => b.totalPnl - a.totalPnl);
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground">{format(new Date(payload[0].payload.date), 'MMM d, yyyy')}</p>
      <p className={`text-sm font-bold ${val >= 0 ? 'text-accent' : 'text-destructive'}`}>
        {val >= 0 ? '+' : ''}{formatCurrency(Math.abs(val))}
      </p>
    </div>
  );
};

export default function Profit() {
  const [range, setRange] = useState('ALL');

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: () => api.entities.Trade.list('-created_date', 500),
  });

  const chartData = buildProfitOverTime(trades);
  const perCoinPnl = buildPerCoinPnl(trades);

  const filteredChart = chartData.filter(d => {
    const date = new Date(d.date);
    const now = new Date();
    if (range === '1W') return date >= new Date(now.getTime() - 7 * 86400000);
    if (range === '1M') return date >= new Date(now.getTime() - 30 * 86400000);
    return true;
  });

  const totalPnl = perCoinPnl.reduce((sum, c) => sum + c.totalPnl, 0);
  const totalUnrealized = perCoinPnl.reduce((sum, c) => sum + c.unrealizedPnl, 0);
  const totalRealized = perCoinPnl.reduce((sum, c) => sum + c.realizedPnl, 0);
  const totalInvested = trades.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.total_value, 0);
  const overallPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const isPositive = totalPnl >= 0;

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
        <h1 className="text-2xl font-bold">Profit & Loss</h1>
        <p className="text-sm text-muted-foreground mt-1">Realized and unrealized gains across all trades</p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {[
          { label: 'Total P&L', value: totalPnl, pct: overallPct, icon: isPositive ? TrendingUp : TrendingDown, colored: true },
          { label: 'Unrealized', value: totalUnrealized, icon: BarChart3, colored: true },
          { label: 'Realized', value: totalRealized, icon: DollarSign, colored: true },
          { label: 'Total Invested', value: totalInvested, icon: DollarSign, colored: false },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.colored ? (stat.value >= 0 ? 'text-accent' : 'text-destructive') : 'text-primary'}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className={`text-lg font-bold font-mono ${stat.colored ? (stat.value >= 0 ? 'text-accent' : 'text-destructive') : ''}`}>
              {stat.value >= 0 ? '+' : ''}{formatCurrency(Math.abs(stat.value))}
            </p>
            {stat.pct !== undefined && (
              <p className={`text-xs mt-0.5 ${stat.value >= 0 ? 'text-accent' : 'text-destructive'}`}>
                {stat.pct >= 0 ? '+' : ''}{stat.pct.toFixed(2)}%
              </p>
            )}
          </div>
        ))}
      </motion.div>

      {/* Profit Over Time Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-4 lg:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Profit Over Time</h3>
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
            {timeRanges.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {filteredChart.length < 2 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            Not enough trade data to display chart
          </div>
        ) : (
          <div className="h-64 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredChart}>
                <defs>
                  <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? 'hsl(152,69%,53%)' : 'hsl(0,72%,51%)'} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={isPositive ? 'hsl(152,69%,53%)' : 'hsl(0,72%,51%)'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,14%)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={val => format(new Date(val), 'MMM d')}
                  tick={{ fontSize: 11, fill: 'hsl(215,12%,50%)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={val => `$${val >= 0 ? '' : '-'}${Math.abs(val).toLocaleString()}`}
                  tick={{ fontSize: 11, fill: 'hsl(215,12%,50%)' }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="pnl"
                  stroke={isPositive ? 'hsl(152,69%,53%)' : 'hsl(0,72%,51%)'}
                  strokeWidth={2}
                  fill="url(#pnlGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Per-Coin P&L Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="px-4 lg:px-6 py-4 border-b border-border">
          <h3 className="text-sm font-medium">P&L Breakdown by Coin</h3>
        </div>
        {perCoinPnl.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No trade data yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium">Asset</th>
                  <th className="text-right py-3 px-4 font-medium">Unrealized P&L</th>
                  <th className="text-right py-3 px-4 font-medium hidden sm:table-cell">Realized P&L</th>
                  <th className="text-right py-3 px-4 font-medium">Total P&L</th>
                  <th className="text-right py-3 px-4 font-medium hidden md:table-cell">Return %</th>
                </tr>
              </thead>
              <tbody>
                {perCoinPnl.map(item => (
                  <tr key={item.coin_id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {item.coinData && (
                          <img src={item.coinData.image} alt={item.name} className="w-7 h-7 rounded-full bg-secondary p-0.5" onError={(e) => { e.target.style.display = 'none'; }} />
                        )}
                        <div>
                          <p className="font-semibold text-sm">{item.symbol}</p>
                          <p className="text-xs text-muted-foreground">{item.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`py-3 px-4 text-right font-mono text-sm ${item.unrealizedPnl >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {item.unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(Math.abs(item.unrealizedPnl))}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono text-sm hidden sm:table-cell ${item.realizedPnl >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {item.realizedPnl >= 0 ? '+' : ''}{formatCurrency(Math.abs(item.realizedPnl))}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono text-sm font-medium ${item.totalPnl >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {item.totalPnl >= 0 ? '+' : ''}{formatCurrency(Math.abs(item.totalPnl))}
                    </td>
                    <td className={`py-3 px-4 text-right text-sm hidden md:table-cell ${item.pnlPercent >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {item.pnlPercent >= 0 ? '+' : ''}{item.pnlPercent.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}