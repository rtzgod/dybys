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
    displayName?: string;
    firstName?: string;
    lastName?: string;
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

export interface RoyaltyDistribution {
  id: string;
  trackId: string;
  artistId: string;
  totalAmount: number;
  perTokenAmount: number;
  description: string;
  distributionDate: string;
  totalTokensEligible: number;
  uniqueInvestors: number;
}

export interface User {
  walletAddress: string;
  email: string;
  role: 'ARTIST' | 'INVESTOR';
  // Profile information
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  website?: string;
  socialMedia?: {
    twitter?: string;
    instagram?: string;
    spotify?: string;
    soundcloud?: string;
  };
  // Artist-specific fields
  genres?: string[];
  yearsActive?: number;
  recordLabel?: string;
  // Investor-specific fields
  investmentExperience?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  riskTolerance?: 'LOW' | 'MEDIUM' | 'HIGH';
  // Settings
  profilePublic?: boolean;
  emailNotifications?: boolean;
  // Metadata
  profileCompleteness?: number;
  joinDate?: string;
  lastUpdated?: string;
}

interface AppState {
  // User state
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  updateUserProfile: (walletAddress: string, profileData: Partial<User>) => void;
  getUserProfile: (walletAddress: string) => User | null;

  // Tracks state
  tracks: Track[];
  addTrack: (track: Omit<Track, 'id' | 'createdAt'>) => string;
  updateTrack: (id: string, updates: Partial<Track>) => void;
  deleteTrack: (id: string) => void;
  getTracksByArtist: (walletAddress: string) => Track[];

  // Investments state
  investments: Investment[];
  addInvestment: (investment: Omit<Investment, 'id' | 'createdAt'>) => void;
  getInvestmentsByInvestor: (walletAddress: string) => Investment[];
  getInvestmentsByTrack: (trackId: string) => Investment[];

  // Royalty distributions state
  royaltyDistributions: RoyaltyDistribution[];
  addRoyaltyDistribution: (distribution: Omit<RoyaltyDistribution, 'id'>) => void;
  getRoyaltyDistributionsByTrack: (trackId: string) => RoyaltyDistribution[];
  getRoyaltyDistributionsByArtist: (artistId: string) => RoyaltyDistribution[];
}

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      tracks: [],
      investments: [],
      royaltyDistributions: [],

      // Actions
      setCurrentUser: (user) => set({ currentUser: user }),

      updateUserProfile: (walletAddress, profileData) => {
        set((state) => {
          if (state.currentUser?.walletAddress === walletAddress) {
            const updatedUser = {
              ...state.currentUser,
              ...profileData,
              lastUpdated: new Date().toISOString()
            };
            
            // Calculate profile completeness
            const requiredFields = ['firstName', 'lastName', 'email', 'bio'];
            const completedFields = requiredFields.filter(field => 
              updatedUser[field as keyof User] && (updatedUser[field as keyof User] as string).trim()
            ).length;
            updatedUser.profileCompleteness = Math.round((completedFields / requiredFields.length) * 100);
            
            return { currentUser: updatedUser };
          }
          return state;
        });
      },

      getUserProfile: (walletAddress) => {
        const state = get();
        return state.currentUser?.walletAddress === walletAddress ? state.currentUser : null;
      },

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

      deleteTrack: (id) => {
        set((state) => ({
          tracks: state.tracks.filter(track => track.id !== id),
          investments: state.investments.filter(inv => inv.trackId !== id),
          royaltyDistributions: state.royaltyDistributions.filter(dist => dist.trackId !== id)
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
      },

      addRoyaltyDistribution: (distributionData) => {
        const distribution: RoyaltyDistribution = {
          ...distributionData,
          id: `royalty-${Date.now()}`
        };

        set((state) => ({
          royaltyDistributions: [...state.royaltyDistributions, distribution]
        }));
      },

      getRoyaltyDistributionsByTrack: (trackId) => {
        return get().royaltyDistributions.filter(dist => dist.trackId === trackId);
      },

      getRoyaltyDistributionsByArtist: (artistId) => {
        return get().royaltyDistributions.filter(dist => dist.artistId === artistId);
      }
    }),
    {
      name: 'dybys-storage', // unique name for localStorage
      partialize: (state) => ({
        tracks: state.tracks,
        investments: state.investments,
        royaltyDistributions: state.royaltyDistributions,
        currentUser: state.currentUser
      })
    }
  )
);

export default useAppStore;