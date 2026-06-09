import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const pageTitles = {
  '/': 'Roket Trading',
  '/markets': 'Market',
  '/portfolio': 'Assets',
  '/profile': 'My',
  '/trade': 'Trade',
  '/watchlist': 'Watchlist',
  '/history': 'History',
  '/profit': 'Profit',
};

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const showBack = !isHome && !['/markets', '/trade', '/portfolio', '/profile'].includes(location.pathname);
  const title = pageTitles[location.pathname] || 'Roket Trading';

  return (
    <header className="sticky top-0 z-40 h-12 bg-card border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-2 min-w-[60px]">
        {showBack ? (
          <button type="button" onClick={() => navigate(-1)} className="flex items-center text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : isHome ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg primary-gradient flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">R</span>
            </div>
            <span className="text-base font-bold tracking-tight">Roket Trading</span>
          </div>
        ) : (
          <span className="text-base font-semibold">{title}</span>
        )}
      </div>

      {!isHome && !showBack && (
        <span className="absolute left-1/2 -translate-x-1/2 text-base font-semibold">{title}</span>
      )}

      <div className="flex items-center gap-1 min-w-[60px] justify-end">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Bell className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
