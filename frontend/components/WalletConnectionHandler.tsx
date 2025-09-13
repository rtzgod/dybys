'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'sonner';
import useAppStore from '@/lib/store';
import { SolanaService } from '@/lib/solana';

export function WalletConnectionHandler() {
  const { connected, publicKey } = useWallet();
  const { currentUser, setCurrentUser, getUserProfile } = useAppStore();
  const [solanaService] = useState(() => new SolanaService());
  const [processedWallets, setProcessedWallets] = useState(new Set<string>());

  useEffect(() => {
    if (connected && publicKey) {
      const walletAddress = publicKey.toString();
      
      // Check if current user is for the same wallet, if not switch to the correct user
      if (!currentUser || currentUser.walletAddress !== walletAddress) {
        // Try to get existing profile for this wallet
        const existingProfile = getUserProfile(walletAddress);
        
        if (existingProfile) {
          // Load existing profile
          setCurrentUser(existingProfile);
        } else {
          // Create new user profile for this wallet
          const newUser = {
            walletAddress,
            email: '',
            role: 'ARTIST' as 'ARTIST' | 'INVESTOR',
            joinDate: new Date().toISOString(),
            profileCompleteness: 0
          };
          setCurrentUser(newUser);
        }
      }

      // Auto-airdrop SOL for new connections (only once per wallet per session)
      if (!processedWallets.has(walletAddress)) {
        setProcessedWallets(prev => new Set([...prev, walletAddress]));
        handleAutoAirdrop(publicKey, walletAddress);
      }
    } else if (!connected && currentUser) {
      // Clear current user when wallet is disconnected
      setCurrentUser(null);
    }
  }, [connected, publicKey, currentUser, setCurrentUser, getUserProfile, processedWallets]);

  const handleAutoAirdrop = async (publicKey: PublicKey, walletAddress: string) => {
    try {
      // Check current balance first
      const currentBalance = await solanaService.getBalance(publicKey);
      
      // Only airdrop if balance is less than 50 SOL (to avoid spamming)
      if (currentBalance < 50) {
        toast.loading(`Airdropping 100 SOL to your wallet...`, { id: 'airdrop' });
        
        const signature = await solanaService.airdropSol(publicKey, 100);
        
        toast.success(
          `🎉 Welcome! Airdropped 100 SOL to your wallet!`,
          { 
            id: 'airdrop',
            duration: 5000
          }
        );
        
        console.log(`✅ Auto-airdrop successful for ${walletAddress}: ${signature}`);
      } else {
        console.log(`⏭️ Skipping airdrop for ${walletAddress} - balance is sufficient (${currentBalance.toFixed(2)} SOL)`);
      }
    } catch (error) {
      console.error('Auto-airdrop failed:', error);
      toast.error('Failed to airdrop SOL. You may need to manually fund your wallet.', { id: 'airdrop' });
    }
  };

  return null; // This component doesn't render anything
}