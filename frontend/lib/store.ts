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
  audioFile?: File; // Store the actual file object for persistent access
  isTokenized: boolean;
  totalSupply?: number;
  pricePerToken?: number;
  royaltyPercentage?: number;
  tokenMint?: string;
  metadataUri?: string;
  transactionSignature?: string;
  investments?: Investment[];
  createdAt: string;
}

export interface Investment {
  id: string;
  investorId: string;
  trackId: string;
  amount: number;
  totalPaid: number;
  transactionSignature?: string;
  createdAt: string;
}

export interface RoyaltyPayment {
  id: string;
  investorId: string;
  trackId: string;
  distributionId: string; // Links to RoyaltyDistribution
  amount: number; // SOL received
  tokens: number; // Number of tokens that earned this payment
  transactionSignature: string;
  receivedAt: string;
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
  users: Record<string, User>; // Store multiple user profiles by wallet address
  setCurrentUser: (user: User | null) => void;
  updateUserProfile: (walletAddress: string, profileData: Partial<User>) => void;
  getUserProfile: (walletAddress: string) => User | null;
  updateArtistInfoInTracks: (walletAddress: string, artistInfo: Partial<Track['artist']>) => void;

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

  // Royalty payments state
  royaltyPayments: RoyaltyPayment[];
  addRoyaltyPayment: (payment: Omit<RoyaltyPayment, 'id'>) => void;
  getRoyaltyPaymentsByInvestor: (investorId: string) => RoyaltyPayment[];
  getRoyaltyPaymentsByTrack: (trackId: string) => RoyaltyPayment[];
}

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      users: {},
      tracks: [],
      investments: [],
      royaltyDistributions: [],
      royaltyPayments: [],

      // Actions
      setCurrentUser: (user) => set((state) => {
        const newState: any = { currentUser: user };
        
        // Also store the user in the users record if provided
        if (user) {
          newState.users = {
            ...state.users,
            [user.walletAddress]: user
          };
        }
        
        return newState;
      }),

      updateUserProfile: (walletAddress, profileData) => {
        set((state) => {
          // Find existing user in users record or create new one
          const existingUser = state.users[walletAddress] || {
            walletAddress,
            email: '',
            role: 'ARTIST' as const,
            joinDate: new Date().toISOString()
          };

          const updatedUser = {
            ...existingUser,
            ...profileData,
            lastUpdated: new Date().toISOString()
          };
          
          // Calculate profile completeness
          const requiredFields = ['firstName', 'lastName', 'email', 'bio'];
          const completedFields = requiredFields.filter(field => 
            updatedUser[field as keyof User] && (updatedUser[field as keyof User] as string).trim()
          ).length;
          updatedUser.profileCompleteness = Math.round((completedFields / requiredFields.length) * 100);
          
          // Update artist info in all tracks by this user
          const updatedTracks = state.tracks.map(track => {
            if (track.artist.walletAddress === walletAddress) {
              return {
                ...track,
                artist: {
                  ...track.artist,
                  email: updatedUser.email || track.artist.email,
                  displayName: updatedUser.displayName,
                  firstName: updatedUser.firstName,
                  lastName: updatedUser.lastName
                }
              };
            }
            return track;
          });

          // Update users record
          const updatedUsers = {
            ...state.users,
            [walletAddress]: updatedUser
          };
          
          // Update currentUser if it's the same wallet address
          const newCurrentUser = state.currentUser?.walletAddress === walletAddress 
            ? updatedUser 
            : state.currentUser;
          
          return { 
            currentUser: newCurrentUser,
            users: updatedUsers,
            tracks: updatedTracks
          };
        });
      },

      getUserProfile: (walletAddress) => {
        const state = get();
        return state.users[walletAddress] || null;
      },

      updateArtistInfoInTracks: (walletAddress, artistInfo) => {
        set((state) => ({
          tracks: state.tracks.map(track => {
            if (track.artist.walletAddress === walletAddress) {
              return {
                ...track,
                artist: {
                  ...track.artist,
                  ...artistInfo
                }
              };
            }
            return track;
          })
        }));
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
      },

      addRoyaltyPayment: (paymentData) => {
        const payment: RoyaltyPayment = {
          ...paymentData,
          id: `payment-${Date.now()}`
        };

        set((state) => ({
          royaltyPayments: [...state.royaltyPayments, payment]
        }));
      },

      getRoyaltyPaymentsByInvestor: (investorId) => {
        return get().royaltyPayments.filter(payment => payment.investorId === investorId);
      },

      getRoyaltyPaymentsByTrack: (trackId) => {
        return get().royaltyPayments.filter(payment => payment.trackId === trackId);
      }
    }),
    {
      name: 'dybys-storage', // unique name for localStorage
      partialize: (state) => ({
        tracks: state.tracks.map(track => ({
          ...track,
          audioFile: undefined // Don't persist File objects as they can't be serialized
        })),
        investments: state.investments,
        royaltyDistributions: state.royaltyDistributions,
        royaltyPayments: state.royaltyPayments,
        currentUser: state.currentUser,
        users: state.users
      })
    }
  )
);

export default useAppStore;