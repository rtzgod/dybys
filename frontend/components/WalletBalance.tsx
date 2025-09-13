'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { SolanaService } from '@/lib/solana';
import { Wallet, RefreshCw } from 'lucide-react';

export function WalletBalance() {
  const { connected, publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [solanaService] = useState(() => new SolanaService());

  const fetchBalance = async () => {
    if (!connected || !publicKey) {
      setBalance(null);
      return;
    }

    setLoading(true);
    try {
      const walletBalance = await solanaService.getBalance(publicKey);
      setBalance(walletBalance);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [connected, publicKey]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (connected && publicKey) {
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, publicKey]);

  if (!connected || !publicKey) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1.5 rounded-lg border">
      <Wallet className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center space-x-2">
        {loading ? (
          <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
        ) : (
          <span className="text-sm font-medium">
            {balance !== null ? `${balance.toFixed(2)} SOL` : '-.-- SOL'}
          </span>
        )}
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded hover:bg-muted"
          title="Refresh balance"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}