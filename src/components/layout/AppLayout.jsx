import React from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import { usePendingTradeSettlement } from '@/hooks/usePendingTradeSettlement';

export default function AppLayout() {
  usePendingTradeSettlement();

  return (
    <div className="min-h-screen bg-black">
      <div className="app-shell flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-[58px]">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
