import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { formatCurrency } from '@/lib/cryptoData';
import {
  ChevronRight,
  Shield,
  Wallet,
  HelpCircle,
  Clock,
  Star,
  PieChart,
  LogOut,
  User,
} from 'lucide-react';
import { motion } from 'framer-motion';

const menuSections = [
  {
    items: [
      { icon: Shield, label: 'Security Center', href: '#' },
      { icon: Wallet, label: 'Asset management', href: '/portfolio' },
      { icon: HelpCircle, label: 'Help Center', href: '#' },
    ],
  },
  {
    items: [
      { icon: Clock, label: 'Trade History', href: '/history' },
      { icon: Star, label: 'Watchlist', href: '/watchlist' },
      { icon: PieChart, label: 'Profit Analysis', href: '/profit' },
    ],
  },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const balance = user?.balance ?? 0;

  return (
    <div className="pb-4">
      <div className="hero-banner px-4 pt-4 pb-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full primary-gradient flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{user?.email?.split('@')[0] || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            <p className="text-sm font-bold text-primary mt-1">{formatCurrency(balance)} USD</p>
          </div>
        </motion.div>
      </div>

      <div className="px-4 space-y-3">
        {menuSections.map((section, si) => (
          <div key={si} className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
            {section.items.map(item => (
              <Link
                key={item.label}
                to={item.href}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        ))}

        <button
          type="button"
          onClick={() => logout()}
          className="w-full bg-card border border-border rounded-xl px-4 py-3.5 flex items-center gap-3 text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Sign out</span>
        </button>
      </div>
    </div>
  );
}
