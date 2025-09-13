'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Track {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  artist: {
    email: string;
    walletAddress: string;
  };
  fileUrl: string;
  isTokenized: boolean;
  totalSupply?: number;
  pricePerToken?: number;
  royaltyPercentage?: number;
  tokenMint?: string;
  investments?: Investment[];
  createdAt: string;
}

export interface Investment {
  id: string;
  investorId: string;
  trackId: string;
  amount: number;
  totalPaid: number;
  createdAt: string;
}

export interface User {
  walletAddress: string;
  email: string;
  role: 'ARTIST' | 'INVESTOR';
}

interface AppState {
  // User state
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Tracks state
  tracks: Track[];
  addTrack: (track: Omit<Track, 'id' | 'createdAt'>) => string;
  updateTrack: (id: string, updates: Partial<Track>) => void;
  getTracksByArtist: (walletAddress: string) => Track[];

  // Investments state
  investments: Investment[];
  addInvestment: (investment: Omit<Investment, 'id' | 'createdAt'>) => void;
  getInvestmentsByInvestor: (walletAddress: string) => Investment[];
  getInvestmentsByTrack: (trackId: string) => Investment[];
}

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      tracks: [
        // Some initial demo tracks
        {
          id: 'demo-1',
          title: 'Digital Dreams',
          description: 'An electronic journey through digital landscapes',
          genre: 'Electronic',
          artist: {
            email: 'demo-artist@example.com',
            walletAddress: 'DemoArtist1234567890123456789012345678901'
          },
          fileUrl: '/demo-track.mp3',
          isTokenized: true,
          totalSupply: 1000,
          pricePerToken: 0.1,
          royaltyPercentage: 1000,
          tokenMint: 'TokenMint123456789012345678901234567890',
          investments: [
            {
              id: 'demo-inv-1',
              investorId: 'DemoInvestor123456789012345678901234567',
              trackId: 'demo-1',
              amount: 100,
              totalPaid: 10,
              createdAt: '2024-01-15T00:00:00Z'
            }
          ],
          createdAt: '2024-01-10T00:00:00Z'
        }
      ],
      investments: [],

      // Actions
      setCurrentUser: (user) => set({ currentUser: user }),

      addTrack: (trackData) => {
        const id = `track-${Date.now()}`;
        const track: Track = {
          ...trackData,
          id,
          createdAt: new Date().toISOString(),
          investments: []
        };
        
        set((state) => ({
          tracks: [...state.tracks, track]
        }));
        
        return id;
      },

      updateTrack: (id, updates) => {
        set((state) => ({
          tracks: state.tracks.map((track) =>
            track.id === id ? { ...track, ...updates } : track
          )
        }));
      },

      getTracksByArtist: (walletAddress) => {
        return get().tracks.filter(track => track.artist.walletAddress === walletAddress);
      },

      addInvestment: (investmentData) => {
        const investment: Investment = {
          ...investmentData,
          id: `investment-${Date.now()}`,
          createdAt: new Date().toISOString()
        };

        set((state) => {
          // Add investment to investments array
          const newInvestments = [...state.investments, investment];
          
          // Update the track's investments array
          const updatedTracks = state.tracks.map(track => {
            if (track.id === investment.trackId) {
              return {
                ...track,
                investments: [...(track.investments || []), investment]
              };
            }
            return track;
          });

          return {
            investments: newInvestments,
            tracks: updatedTracks
          };
        });
      },

      getInvestmentsByInvestor: (walletAddress) => {
        return get().investments.filter(inv => inv.investorId === walletAddress);
      },

      getInvestmentsByTrack: (trackId) => {
        return get().investments.filter(inv => inv.trackId === trackId);
      }
    }),
    {
      name: 'dybys-storage', // unique name for localStorage
      partialize: (state) => ({
        tracks: state.tracks,
        investments: state.investments,
        currentUser: state.currentUser
      })
    }
  )
);

export default useAppStore;