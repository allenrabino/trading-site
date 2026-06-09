import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, ArrowLeftRight, User, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/markets', label: 'Market', icon: TrendingUp },
  { path: '/trade', label: 'Trade', icon: ArrowLeftRight },
  { path: '/portfolio', label: 'Asset', icon: Wallet },
  { path: '/profile', label: 'My', icon: User },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around h-[58px] px-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5px]')} />
              <span className={cn('text-[9px] font-medium', isActive && 'font-semibold')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
