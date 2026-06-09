import React from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/cryptoData';
import { useCryptoList } from '@/hooks/useCryptoPrices';
import { buildPortfolioSummary } from '@/lib/portfolio';
import { useAuth } from '@/lib/AuthContext';
import { ChevronRight, Clock, Star, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { id: 'holdings', label: 'Holdings' },
  { id: 'history', label: 'Bill', href: '/history' },
  { id: 'profit', label: 'Profit', href: '/profit' },
];

export default function Portfolio() {
  const { coins } = useCryptoList();
  const { user } = useAuth();
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: () => api.entities.Trade.list('-created_date', 500),
  });

  const { items: portfolioItems, totalValue, totalPnl, cashBalance, cryptoValue } =
    buildPortfolioSummary(trades, coins, user?.balance ?? 0);

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="hero-banner px-4 pt-4 pb-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs text-muted-foreground mb-1">Total Assets</p>
          <p className="text-3xl font-bold font-mono text-primary">{formatCurrency(totalValue)}</p>
          <div className="flex gap-4 mt-3 text-xs">
            <div>
              <span className="text-muted-foreground">Crypto </span>
              <span className="font-medium">{formatCurrency(cryptoValue)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cash </span>
              <span className="font-medium">{formatCurrency(cashBalance)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">P&L </span>
              <span className={`font-medium ${totalPnl >= 0 ? 'text-rise' : 'text-fall'}`}>
                {totalPnl >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalPnl))}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-4 space-y-4">
        <div className="flex gap-2">
          {tabs.map(tab => (
            tab.href ? (
              <Link
                key={tab.id}
                to={tab.href}
                className="flex-1 text-center py-2 rounded-lg text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                {tab.label}
              </Link>
            ) : (
              <button
                key={tab.id}
                type="button"
                className="flex-1 text-center py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground"
              >
                {tab.label}
              </button>
            )
          ))}
        </div>

        {portfolioItems.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <p className="text-sm text-muted-foreground mb-3">No crypto holdings yet</p>
            <Link to="/markets" className="text-sm text-primary font-medium">
              Go to Market
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
            {portfolioItems.map(item => (
              <Link
                key={item.coin_id}
                to={`/trade?coin=${item.coin_id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {item.coinData && (
                    <img
                      src={item.coinData.image}
                      alt={item.name}
                      className="w-8 h-8 rounded-full bg-secondary"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <div>
                    <p className="font-semibold text-sm">{item.symbol}</p>
                    <p className="text-[10px] text-muted-foreground">{item.amount.toFixed(6)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-medium">{formatCurrency(item.currentValue)}</p>
                  <p className={`text-[10px] ${item.pnl >= 0 ? 'text-rise' : 'text-fall'}`}>
                    {item.pnl >= 0 ? '+' : ''}{item.pnlPercent.toFixed(2)}%
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          <Link to="/history" className="flex items-center justify-between px-4 py-3.5 hover:bg-secondary/30">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm">Trade History</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
          <Link to="/watchlist" className="flex items-center justify-between px-4 py-3.5 hover:bg-secondary/30">
            <div className="flex items-center gap-3">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-sm">Watchlist</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
          <Link to="/profit" className="flex items-center justify-between px-4 py-3.5 hover:bg-secondary/30">
            <div className="flex items-center gap-3">
              <PieChart className="w-4 h-4 text-primary" />
              <span className="text-sm">Profit Analysis</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </div>
  );
}
