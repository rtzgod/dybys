'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import useAppStore from '@/lib/store';

export function WalletConnectionHandler() {
  const { connected, publicKey } = useWallet();
  const { currentUser, setCurrentUser, getUserProfile } = useAppStore();

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
    } else if (!connected && currentUser) {
      // Clear current user when wallet is disconnected
      setCurrentUser(null);
    }
  }, [connected, publicKey, currentUser, setCurrentUser, getUserProfile]);

  return null; // This component doesn't render anything
}