import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Wallet, Star, Clock, TrendingUp, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/markets', label: 'Markets', icon: TrendingUp },
  { path: '/trade', label: 'Trade', icon: ArrowLeftRight },
  { path: '/portfolio', label: 'Portfolio', icon: Wallet },
  { path: '/watchlist', label: 'Watchlist', icon: Star },
  { path: '/history', label: 'History', icon: Clock },
  { path: '/profit', label: 'Profit', icon: PieChart },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-xl">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">CryptoX</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive && "text-primary")} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-border">
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Paper Trading Mode</p>
          <p className="text-sm font-medium text-accent mt-1">$100,000.00 USD</p>
        </div>
      </div>
    </aside>
  );
}