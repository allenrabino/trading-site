import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

export default function CoinPicker({ coins, value, onChange, className }) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => coins.find(c => c.id === value), [coins, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'w-full flex items-center justify-between primary-gradient text-primary-foreground font-semibold text-sm rounded-lg px-4 py-2.5',
            className
          )}
        >
          <span className="truncate">{selected?.name ?? 'Select coin'}</span>
          <ChevronDown className="w-4 h-4 shrink-0 ml-2 opacity-80" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search coins..." />
          <CommandList className="max-h-64">
            <CommandEmpty>No coin found.</CommandEmpty>
            <CommandGroup>
              {coins.map(coin => (
                <CommandItem
                  key={coin.id}
                  value={`${coin.name} ${coin.symbol}`}
                  onSelect={() => {
                    onChange(coin.id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  {coin.image && (
                    <img
                      src={coin.image}
                      alt=""
                      className="w-5 h-5 rounded-full shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <span className="font-medium">{coin.symbol}</span>
                  <span className="text-muted-foreground truncate">{coin.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
