import React from 'react';
import { api } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCryptoList, getCryptoById, formatCurrency } from '@/lib/cryptoData';
import { Star, Plus, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Watchlist() {
  const queryClient = useQueryClient();
  const [addCoinId, setAddCoinId] = React.useState('');
  const allCoins = getCryptoList();

  const { data: watchlist = [], isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => api.entities.Watchlist.list(),
  });

  const handleAdd = async () => {
    if (!addCoinId) return;
    const coin = getCryptoById(addCoinId);
    if (!coin) return;
    if (watchlist.some(w => w.coin_id === addCoinId)) {
      toast.error('Already in watchlist');
      return;
    }
    await api.entities.Watchlist.create({ coin_id: coin.id, coin_symbol: coin.symbol, coin_name: coin.name });
    queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    setAddCoinId('');
    toast.success(`Added ${coin.symbol} to watchlist`);
  };

  const handleRemove = async (id) => {
    await api.entities.Watchlist.delete(id);
    queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    toast.success('Removed from watchlist');
  };

  const watchlistCoins = watchlist.map(w => {
    const coinData = getCryptoById(w.coin_id);
    return { ...w, coinData };
  }).filter(w => w.coinData);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Watchlist</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your favorite coins</p>
      </motion.div>

      {/* Add Coin */}
      <div className="flex items-center gap-2">
        <Select value={addCoinId} onValueChange={setAddCoinId}>
          <SelectTrigger className="w-48 bg-secondary/50">
            <SelectValue placeholder="Select coin..." />
          </SelectTrigger>
          <SelectContent>
            {allCoins.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.symbol} — {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleAdd} size="sm" className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : watchlistCoins.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No coins in watchlist</h3>
          <p className="text-sm text-muted-foreground">Add coins above to start tracking</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {watchlistCoins.map(item => {
            const coin = item.coinData;
            const isPositive = coin.change24h >= 0;
            return (
              <div key={item.id} className="bg-card border border-border rounded-xl p-4 group">
                <div className="flex items-start justify-between mb-3">
                  <Link to={`/trade?coin=${coin.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <img src={coin.image} alt={coin.name} className="w-9 h-9 rounded-full bg-secondary p-0.5" onError={(e) => { e.target.style.display = 'none'; }} />
                    <div>
                      <h3 className="font-semibold text-sm">{coin.symbol}</h3>
                      <p className="text-xs text-muted-foreground">{coin.name}</p>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => handleRemove(item.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-lg font-bold font-mono">{formatCurrency(coin.price)}</p>
                  <span className={`flex items-center gap-0.5 text-sm font-medium ${isPositive ? 'text-accent' : 'text-destructive'}`}>
                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(coin.change24h).toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}