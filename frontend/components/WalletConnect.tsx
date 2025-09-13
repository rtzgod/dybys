'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from './ui/button';

export function WalletConnect() {
  const { connected, publicKey, disconnect } = useWallet();

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
        </span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={disconnect}
          className="text-xs"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !rounded-md !px-4 !py-2 !text-sm !font-medium !transition-colors" />
  );
}