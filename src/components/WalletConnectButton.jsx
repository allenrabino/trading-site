import React, { useEffect, useState } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/api/client';
import { walletConnectAvailable } from '@/lib/wagmi';

function formatAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function WalletConnectButton({ onConnected }) {
  const { connect, connectors, isPending, error } = useConnect();
  const { address, isConnected } = useAccount();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    if (!isConnected || !address) return;

    let cancelled = false;
    setSyncing(true);
    setSyncError('');

    api.auth.connectWallet(address)
      .then((user) => {
        if (!cancelled) {
          onConnected?.(user);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSyncError(err.message || 'Failed to connect wallet');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSyncing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isConnected, address, onConnected]);

  const availableConnectors = connectors.filter((connector) => {
    if (connector.id === 'walletConnect') {
      return walletConnectAvailable;
    }
    return true;
  });

  const displayError = syncError || error?.message;

  if (syncing) {
    return (
      <Button className="w-full h-12 font-medium" disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Connecting {address ? formatAddress(address) : 'wallet'}...
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      {displayError && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {displayError}
        </div>
      )}

      {availableConnectors.map((connector) => (
        <Button
          key={connector.uid}
          variant={connector.id === 'injected' ? 'default' : 'outline'}
          className="w-full h-12 font-medium"
          disabled={isPending}
          onClick={() => connect({ connector })}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Wallet className="w-4 h-4 mr-2" />
          )}
          {connector.id === 'injected' ? 'Connect Browser Wallet' : 'WalletConnect'}
        </Button>
      ))}

      {!walletConnectAvailable && (
        <p className="text-xs text-muted-foreground text-center">
          Set <code className="text-foreground">VITE_WALLETCONNECT_PROJECT_ID</code> to enable WalletConnect.
        </p>
      )}
    </div>
  );
}
