import React from 'react';
import { Bell, Search, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TopBar() {
  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6">
      {/* Mobile Logo */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-base font-bold">CryptoX</span>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search coins..."
            className="pl-9 bg-secondary/50 border-border h-9"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 mr-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-medium text-accent">Live</span>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
          <Bell className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}