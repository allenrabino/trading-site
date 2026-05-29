import React, { useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const timeRanges = ['1D', '1W', '1M'];

export default function PriceChart({ coin }) {
  const [range, setRange] = useState('1W');
  const isPositive = coin.change24h >= 0;

  const getData = () => {
    switch (range) {
      case '1D': return coin.priceHistory.slice(-24);
      case '1M': return coin.priceHistory;
      default: return coin.priceHistory;
    }
  };

  const data = getData();

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-muted-foreground">
          {format(new Date(payload[0].payload.time), 'MMM d, h:mm a')}
        </p>
        <p className="text-sm font-bold">${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Price Chart</h3>
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

      <div className="h-64 lg:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? 'hsl(152, 69%, 53%)' : 'hsl(0, 72%, 51%)'} stopOpacity={0.2} />
                <stop offset="100%" stopColor={isPositive ? 'hsl(152, 69%, 53%)' : 'hsl(0, 72%, 51%)'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tickFormatter={val => format(new Date(val), range === '1D' ? 'HH:mm' : 'MMM d')}
              tick={{ fontSize: 11, fill: 'hsl(215, 12%, 50%)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['dataMin', 'dataMax']}
              tickFormatter={val => `$${val.toLocaleString()}`}
              tick={{ fontSize: 11, fill: 'hsl(215, 12%, 50%)' }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? 'hsl(152, 69%, 53%)' : 'hsl(0, 72%, 51%)'}
              strokeWidth={2}
              fill="url(#chartGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
